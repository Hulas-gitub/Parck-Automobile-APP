<?php

namespace App\Services;

use App\Mail\MailDocumentVehicule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

/**
 * DocumentExpirationService
 *
 * Scanne les documents véhicules et envoie des notifications (email + in_app)
 * aux utilisateurs ayant le rôle admin ou chef_parc.
 *
 * Logique d'alerte :
 *   - Expiré         : date_expiration < aujourd'hui
 *   - Expire bientôt : date_expiration entre aujourd'hui et aujourd'hui + 30 jours
 *
 * Usage depuis la commande Artisan ou un scheduler :
 *   app(DocumentExpirationService::class)->run();
 */
class DocumentExpirationService
{
    // Seuil en jours pour l'alerte "expire bientôt"
    private const SEUIL_JOURS = 30;

    // Rôles qui reçoivent les notifications
    private const ROLES_CIBLES = ['admin', 'chef_parc','chauffeur','Chef_TF'];

    // =========================================================================
    // POINT D'ENTRÉE PRINCIPAL
    // =========================================================================

    /**
     * Lance le scan complet et envoie toutes les notifications.
     * Retourne un résumé des actions effectuées.
     */
    public function run(): array
    {
        $summary = [
            'expires'        => 0,
            'expire_bientot' => 0,
            'emails_envoyes' => 0,
            'notifs_in_app'  => 0,
            'erreurs'        => 0,
        ];

        $documents = $this->getDocumentsAlertes();

        if ($documents->isEmpty()) {
            Log::info('[DocumentExpiration] Aucun document à alerter.');
            return $summary;
        }

        // Récupère les destinataires une seule fois (admin + chef_parc actifs)
        $destinataires = $this->getDestinataires();

        if ($destinataires->isEmpty()) {
            Log::warning('[DocumentExpiration] Aucun destinataire trouvé (admin / chef_parc).');
            return $summary;
        }

        foreach ($documents as $doc) {
            $statut        = $this->calculerStatut($doc->date_expiration);
            $joursRestants = $this->calculerJoursRestants($doc->date_expiration);

            if ($statut === 'expire') {
                $summary['expires']++;
            } else {
                $summary['expire_bientot']++;
            }

            // Véhicule
            $vehicule = $this->getVehiculeInfos($doc->vehicule_immatriculation);

            foreach ($destinataires as $dest) {
                // ── Email ──
                $emailOk = $this->envoyerEmail($doc, $vehicule, $dest, $statut, $joursRestants);
                if ($emailOk) {
                    $summary['emails_envoyes']++;
                } else {
                    $summary['erreurs']++;
                }

                // ── Notification in_app ──
                $notifOk = $this->creerNotifInApp($doc, $vehicule, $dest, $statut, $joursRestants);
                if ($notifOk) {
                    $summary['notifs_in_app']++;
                }
            }
        }

        Log::info('[DocumentExpiration] Scan terminé.', $summary);

        return $summary;
    }

    // =========================================================================
    // NOTIFICATIONS POUR UN DOCUMENT SPÉCIFIQUE (appelable depuis VehiculesController)
    // =========================================================================

    /**
     * Envoie les notifications pour UN document précis.
     * Utile lors de l'upload : si le doc est déjà expiré ou expire dans <= 30j.
     */
    public function notifierDocument(int $documentId): void
    {
        $doc = DB::table('documents_vehicules')
            ->where('id', $documentId)
            ->where('est_supprime', 0)
            ->first();

        if (!$doc || !$doc->date_expiration) {
            return;
        }

        $statut = $this->calculerStatut($doc->date_expiration);

        // N'envoie que si le document est déjà en alerte
        if (!in_array($statut, ['expire', 'expire_bientot'])) {
            return;
        }

        $joursRestants = $this->calculerJoursRestants($doc->date_expiration);
        $vehicule      = $this->getVehiculeInfos($doc->vehicule_immatriculation);
        $destinataires = $this->getDestinataires();

        foreach ($destinataires as $dest) {
            $this->envoyerEmail($doc, $vehicule, $dest, $statut, $joursRestants);
            $this->creerNotifInApp($doc, $vehicule, $dest, $statut, $joursRestants);
        }
    }

    // =========================================================================
    // HELPERS PRIVÉS — REQUÊTES
    // =========================================================================

    /**
     * Récupère tous les documents expirés ou expirant dans <= SEUIL_JOURS jours.
     */
    private function getDocumentsAlertes()
    {
        $today  = Carbon::today()->toDateString();
        $limite = Carbon::today()->addDays(self::SEUIL_JOURS)->toDateString();

        return DB::table('documents_vehicules')
            ->where('est_supprime', 0)
            ->whereNotNull('date_expiration')
            ->where('date_expiration', '<=', $limite)   // expiré OU expire bientôt
            ->orderBy('date_expiration')
            ->get();
    }

    /**
     * Récupère les utilisateurs admin et chef_parc actifs avec leur email.
     */
    private function getDestinataires()
    {
        return DB::table('utilisateurs as u')
            ->join('roles as r', 'r.id', '=', 'u.role_id')
            ->where('u.est_actif', 1)
            ->where('u.est_supprime', 0)
            ->whereIn('r.code', self::ROLES_CIBLES)
            ->select(
                'u.id',
                'u.nom',
                'u.email',
                'r.code as role_code',
                'r.libelle as role_libelle'
            )
            ->get();
    }

    /**
     * Récupère les infos formatées du véhicule pour l'email.
     */
    private function getVehiculeInfos(string $immatriculation): array
    {
        $v = DB::table('vehicules as v')
            ->leftJoin('marques as ma', 'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo', 'mo.id', '=', 'v.modele_id')
            ->leftJoin('directions as d', 'd.id', '=', 'v.direction_id')
            ->where('v.immatriculation', $immatriculation)
            ->select(
                'v.immatriculation',
                'v.statut',
                'ma.nom as marque',
                'mo.nom as modele',
                'd.nom as direction'
            )
            ->first();

        if (!$v) {
            return ['immatriculation' => $immatriculation, 'marque' => null, 'modele' => null, 'direction' => null, 'statut' => null];
        }

        $statutLabel = [
            'disponible'     => 'Disponible',
            'en_mission'     => 'En Mission',
            'en_maintenance' => 'Maintenance',
            'immobilise'     => 'Immobilisé',
        ][$v->statut] ?? $v->statut;

        return [
            'immatriculation' => $v->immatriculation,
            'marque'          => $v->marque,
            'modele'          => $v->modele,
            'direction'       => $v->direction,
            'statut'          => $statutLabel,
        ];
    }

    // =========================================================================
    // HELPERS PRIVÉS — CALCULS
    // =========================================================================

    private function calculerStatut(string $dateExpiration): string
    {
        $expiration = Carbon::parse($dateExpiration)->startOfDay();
        $today      = Carbon::today();

        return $expiration->lt($today) ? 'expire' : 'expire_bientot';
    }

    private function calculerJoursRestants(string $dateExpiration): int
    {
        $expiration = Carbon::parse($dateExpiration)->startOfDay();
        $today      = Carbon::today();

        // Positif = jours restants, négatif = jours de retard
        return (int)$today->diffInDays($expiration, false);
    }

    // =========================================================================
    // HELPERS PRIVÉS — ENVOIS
    // =========================================================================

    /**
     * Envoie l'email via le Mailable MailDocumentVehicule.
     */
    private function envoyerEmail(
        object $doc,
        array  $vehicule,
        object $dest,
        string $statut,
        int    $joursRestants
    ): bool {
        try {
            Mail::to($dest->email)->send(new MailDocumentVehicule(
                document: [
                    'id'                  => $doc->id,
                    'nom_document'        => $doc->nom_document,
                    'type_document'       => $doc->type_document,
                    'compagnie_assurance' => $doc->compagnie_assurance ?? null,
                    'numero_contrat'      => $doc->numero_contrat ?? null,
                    'type_couverture'     => $doc->type_couverture ?? null,
                    'montant_prime'       => $doc->montant_prime ?? null,
                    'date_emission'       => $doc->date_emission ?? null,
                    'date_expiration'     => $doc->date_expiration,
                ],
                vehicule: $vehicule,
                destinataire: [
                    'id'           => $dest->id,
                    'nom'          => $dest->nom,
                    'email'        => $dest->email,
                    'role_code'    => $dest->role_code,
                    'role_libelle' => $dest->role_libelle,
                ],
                statut: $statut,
                joursRestants: $joursRestants,
            ));

            // Enregistre l'envoi dans envois_notifications
            $this->enregistrerEnvoi($doc, $dest, $statut, 'email', 'envoye');

            Log::info("[DocumentExpiration] Email envoyé à {$dest->email} — doc #{$doc->id} ({$statut})");
            return true;

        } catch (\Exception $e) {
            $this->enregistrerEnvoi($doc, $dest, $statut, 'email', 'echec');
            Log::error("[DocumentExpiration] Erreur email pour {$dest->email} — {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Crée une notification in_app dans la table notifications + envois_notifications.
     */
    private function creerNotifInApp(
        object $doc,
        array  $vehicule,
        object $dest,
        string $statut,
        int    $joursRestants
    ): bool {
        try {
            // Récupère la catégorie de notification correspondante
            $codeCategorie = $statut === 'expire'
                ? 'alerte_document_expire'
                : 'alerte_document_expire_bientot';

            $categorieId = DB::table('categories_notifications')
                ->where('code', $codeCategorie)
                ->where('est_supprime', 0)
                ->value('id');

            // Si la catégorie n'existe pas, on la crée à la volée
            if (!$categorieId) {
                $categorieId = $this->creerCategorieNotificationSiAbsente($codeCategorie, $statut);
            }

            if (!$categorieId) {
                return false;
            }

            // Titre et message
            if ($statut === 'expire') {
                $titre   = "Document expiré — {$vehicule['immatriculation']}";
                $message = "Le document « {$doc->nom_document} » du véhicule {$vehicule['immatriculation']} a expiré depuis " . abs($joursRestants) . " jour(s).";
            } else {
                $titre   = "Document expire bientôt — {$vehicule['immatriculation']}";
                $message = "Le document « {$doc->nom_document} » du véhicule {$vehicule['immatriculation']} expire dans {$joursRestants} jour(s).";
            }

            // Insère dans notifications (table globale)
            $notifId = DB::table('notifications')->insertGetId([
                'categorie_id'            => $categorieId,
                'titre'                   => $titre,
                'message'                 => $message,
                'vehicule_immatriculation'=> $vehicule['immatriculation'],
                'donnees'                 => json_encode([
                    'document_id'     => $doc->id,
                    'type_document'   => $doc->type_document,
                    'date_expiration' => $doc->date_expiration,
                    'jours_restants'  => $joursRestants,
                    'statut'          => $statut,
                ]),
                'lien_url'                => "/admin/vehicules/{$vehicule['immatriculation']}",
                'date_creation'           => now(),
            ]);

            // Insère dans envois_notifications pour cet utilisateur
            DB::table('envois_notifications')->insert([
                'notification_id' => $notifId,
                'user_id'         => $dest->id,
                'canal'           => 'in_app',
                'statut_envoi'    => 'envoye',
                'date_envoi'      => now(),
                'est_lu'          => 0,
                'date_creation'   => now(),
                'date_modification'=> now(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error("[DocumentExpiration] Erreur in_app pour user #{$dest->id} — {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Enregistre le résultat d'envoi dans envois_notifications.
     */
    private function enregistrerEnvoi(
        object $doc,
        object $dest,
        string $statut,
        string $canal,
        string $statutEnvoi
    ): void {
        try {
            $codeCategorie = $statut === 'expire'
                ? 'alerte_document_expire'
                : 'alerte_document_expire_bientot';

            $categorieId = DB::table('categories_notifications')
                ->where('code', $codeCategorie)
                ->where('est_supprime', 0)
                ->value('id');

            if (!$categorieId) {
                return;
            }

            // Cherche une notification existante pour ce doc + ce canal + ce user (évite les doublons)
            $notifExistante = DB::table('notifications')
                ->where('vehicule_immatriculation', $doc->vehicule_immatriculation)
                ->where('categorie_id', $categorieId)
                ->whereRaw("JSON_EXTRACT(donnees, '$.document_id') = ?", [$doc->id])
                ->orderBy('date_creation', 'desc')
                ->value('id');

            if (!$notifExistante) {
                return;
            }

            DB::table('envois_notifications')->insert([
                'notification_id'  => $notifExistante,
                'user_id'          => $dest->id,
                'canal'            => $canal,
                'statut_envoi'     => $statutEnvoi,
                'date_envoi'       => $statutEnvoi === 'envoye' ? now() : null,
                'date_creation'    => now(),
                'date_modification'=> now(),
            ]);

        } catch (\Exception $e) {
            Log::error("[DocumentExpiration] enregistrerEnvoi() — {$e->getMessage()}");
        }
    }

    /**
     * Crée la catégorie de notification si elle n'existe pas encore en DB.
     */
    private function creerCategorieNotificationSiAbsente(string $code, string $statut): ?int
    {
        try {
            return DB::table('categories_notifications')->insertGetId([
                'code'            => $code,
                'libelle'         => $statut === 'expire'
                    ? 'Alerte document véhicule expiré'
                    : 'Alerte document véhicule expire bientôt',
                'niveau_priorite' => $statut === 'expire' ? 'critique' : 'important',
                'canaux'          => json_encode(['email', 'in_app']),
                'roles_cibles'    => json_encode(['admin', 'chef_parc']),
                'description'     => 'Notification automatique expiration documents véhicules',
                'est_actif'       => 1,
                'est_supprime'    => 0,
                'date_creation'   => now(),
                'date_modification'=> now(),
            ]);
        } catch (\Exception $e) {
            Log::error("[DocumentExpiration] Impossible de créer la catégorie {$code} — {$e->getMessage()}");
            return null;
        }
    }
}