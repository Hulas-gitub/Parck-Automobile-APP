<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\MailDocumentVehicule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * DocumentExpirationController
 *
 * Vérifie les dates d'expiration des documents véhicules et envoie les
 * notifications (email + in_app) aux rôles concernés.
 *
 * Deux points d'entrée :
 *   1. checkExpiration()    → route API / scan global de tous les documents
 *   2. notifierDocument()   → appelé par VehiculesController à l'ajout ou à
 *                             la modification d'un document
 *
 * Seuils (jours restants entre AUJOURD'HUI et date_expiration) :
 *   ≤ 0        → niveau "expire"    (document expiré : le jour J compte comme expiré)
 *   1  à  5    → niveau "seuil_5"   (critique)
 *   6  à 15    → niveau "seuil_15"  (importante)
 *   16 à 30    → niveau "seuil_30"  (préventive)
 *   > 30       → ignoré
 *
 * Anti-doublon :
 *   Une seule notification globale par (document + niveau + date_expiration).
 *   Ensuite, chaque destinataire reçoit UNE ligne in_app et UN email par
 *   notification. Un email en échec est retenté au prochain passage.
 *   → On peut donc appeler ce code autant de fois qu'on veut sans doublon.
 *   → Si le document est renouvelé (nouvelle date_expiration), une nouvelle
 *     alerte repart normalement.
 */
class DocumentExpirationController extends Controller
{
    // Rôles qui reçoivent les notifications (valeurs de roles.code)
    private const ROLES_CIBLES = ['admin', 'chef_parc', 'chauffeur', 'chef_tf'];

    // =========================================================================
    // POINT D'ENTRÉE 1 — Route API
    // GET /api/admin/documents/check-expiration
    // =========================================================================

    public function checkExpiration(): JsonResponse
    {
        // L'envoi des emails est synchrone : on évite le timeout PHP (30 s par défaut)
        @set_time_limit(300);

        $result = $this->scan();

        return response()->json([
            'message' => $result['message'],
            'summary' => $result['summary'],
            'date'    => Carbon::today()->format('d/m/Y'),
        ]);
    }

    /**
     * Scan global. Public pour pouvoir aussi être lancé depuis un scheduler
     * ou une commande Artisan sans passer par HTTP :
     *   app(\App\Http\Controllers\Admin\DocumentExpirationController::class)->scan();
     *
     * @return array{message: string, summary: array<string,int>}
     */
    public function scan(): array
    {
        $today = Carbon::today();

        $summary = [
            'traites'        => 0,
            'expires'        => 0,
            'seuil_5j'       => 0,
            'seuil_15j'      => 0,
            'seuil_30j'      => 0,
            'ignores'        => 0,
            'deja_notifies'  => 0,
            'emails_envoyes' => 0,
            'notifs_in_app'  => 0,
            'erreurs'        => 0,
        ];

        // ── 1. Documents actifs avec une date_expiration, sur des véhicules non supprimés
        $documents = DB::table('documents_vehicules as d')
            ->join('vehicules as v', 'v.immatriculation', '=', 'd.vehicule_immatriculation')
            ->where('d.est_supprime', 0)
            ->where('v.est_supprime', 0)
            ->whereNotNull('d.date_expiration')
            ->orderBy('d.date_expiration', 'asc')
            ->select('d.*')
            ->get();

        if ($documents->isEmpty()) {
            Log::info('[DocumentExpiration] Aucun document avec date_expiration trouvé.');
            return ['message' => 'Aucun document à vérifier.', 'summary' => $summary];
        }

        // ── 2. Destinataires (récupérés une seule fois)
        $destinataires = $this->getDestinataires();

        if ($destinataires->isEmpty()) {
            Log::warning('[DocumentExpiration] Aucun destinataire pour les rôles : ' . implode(', ', self::ROLES_CIBLES));
            return ['message' => 'Aucun destinataire configuré.', 'summary' => $summary];
        }

        // ── 3. Traitement de chaque document
        foreach ($documents as $doc) {
            $summary['traites']++;

            $joursRestants = $this->calculerJoursRestants($doc->date_expiration, $today);
            $niveau        = $this->determinerNiveau($joursRestants);

            if ($niveau === null) {
                $summary['ignores']++;
                continue;
            }

            match ($niveau) {
                'expire'   => $summary['expires']++,
                'seuil_5'  => $summary['seuil_5j']++,
                'seuil_15' => $summary['seuil_15j']++,
                'seuil_30' => $summary['seuil_30j']++,
                default    => null,
            };

            $stats = $this->diffuser($doc, $niveau, $joursRestants, $destinataires);

            $summary['emails_envoyes'] += $stats['emails'];
            $summary['notifs_in_app']  += $stats['in_app'];
            $summary['deja_notifies']  += $stats['deja'];
            $summary['erreurs']        += $stats['erreurs'];
        }

        Log::info('[DocumentExpiration] Scan terminé.', $summary);

        return ['message' => 'Vérification des documents terminée.', 'summary' => $summary];
    }

    // =========================================================================
    // POINT D'ENTRÉE 2 — Un seul document
    // Appelé par VehiculesController (storeDocument / updateDocument)
    // =========================================================================

    public function notifierDocument(int $documentId): void
    {
        Log::info("[DocumentExpiration] notifierDocument appelé pour doc #{$documentId}");

        $doc = DB::table('documents_vehicules')
            ->where('id', $documentId)
            ->where('est_supprime', 0)
            ->whereNotNull('date_expiration')
            ->first();

        if (!$doc) {
            Log::warning("[DocumentExpiration] doc #{$documentId} introuvable, supprimé ou sans date_expiration.");
            return;
        }

        $joursRestants = $this->calculerJoursRestants($doc->date_expiration);
        $niveau        = $this->determinerNiveau($joursRestants);

        Log::info("[DocumentExpiration] doc #{$documentId} | jours={$joursRestants} | niveau=" . ($niveau ?? 'aucun (> 30 j)'));

        if ($niveau === null) return;

        $destinataires = $this->getDestinataires();

        Log::info('[DocumentExpiration] destinataires trouvés : ' . $destinataires->count());

        if ($destinataires->isEmpty()) {
            Log::warning('[DocumentExpiration] Aucun destinataire pour les rôles : ' . implode(', ', self::ROLES_CIBLES));
            return;
        }

        $stats = $this->diffuser($doc, $niveau, $joursRestants, $destinataires);

        Log::info("[DocumentExpiration] doc #{$documentId} terminé", $stats);
    }

    // =========================================================================
    // CŒUR : notification globale + envoi à chaque destinataire
    // =========================================================================

    /**
     * @return array{emails:int, in_app:int, deja:int, erreurs:int}
     */
    private function diffuser(object $doc, string $niveau, int $joursRestants, Collection $destinataires): array
    {
        $stats = ['emails' => 0, 'in_app' => 0, 'deja' => 0, 'erreurs' => 0];

        try {
            $statut   = $niveau === 'expire' ? 'expire' : 'expire_bientot';
            $vehicule = $this->getVehiculeInfos($doc->vehicule_immatriculation);

            // 1) La notification globale (créée une seule fois par document + niveau + date d'expiration)
            $notifId = $this->obtenirNotificationId($doc, $vehicule, $statut, $joursRestants, $niveau);

            if (!$notifId) {
                $stats['erreurs']++;
                return $stats;
            }

            // 2) Chaque destinataire : in_app puis email
            foreach ($destinataires as $dest) {

                // ── in_app ──
                if ($this->creerEnvoiInApp($notifId, $dest)) {
                    $stats['in_app']++;
                }

                // ── email ──
                $envoi = DB::table('envois_notifications')
                    ->where('notification_id', $notifId)
                    ->where('user_id', $dest->id)
                    ->where('canal', 'email')
                    ->orderByDesc('id')
                    ->first();

                if ($envoi && $envoi->statut_envoi === 'envoye') {
                    $stats['deja']++;          // déjà envoyé → on ne renvoie pas
                    continue;
                }

                $erreur = $this->envoyerEmail($doc, $vehicule, $dest, $statut, $joursRestants, $niveau);
                $this->enregistrerEnvoiEmail($notifId, $dest, $envoi, $erreur);

                if ($erreur === null) {
                    $stats['emails']++;
                } else {
                    $stats['erreurs']++;
                }
            }
        } catch (\Throwable $e) {
            $stats['erreurs']++;
            Log::error("[DocumentExpiration] ✗ doc#{$doc->id} | {$e->getMessage()}");
        }

        return $stats;
    }

    // =========================================================================
    // NOTIFICATION GLOBALE (table notifications)
    // =========================================================================

    /**
     * Retourne l'id de la notification du document pour ce niveau,
     * en la créant si elle n'existe pas encore.
     */
    private function obtenirNotificationId(
        object $doc,
        array  $vehicule,
        string $statut,
        int    $joursRestants,
        string $niveau
    ): ?int {
        $categorieId = $this->resolveCategorieId($this->getCodeCategorie($niveau), $niveau);
        if (!$categorieId) return null;

        $existante = $this->trouverNotificationId($doc, $categorieId);
        if ($existante) return $existante;

        [$titre, $message] = $this->buildTitreMessage($doc, $vehicule, $joursRestants, $niveau);

        try {
            return (int) DB::table('notifications')->insertGetId([
                'categorie_id'             => $categorieId,
                'titre'                    => $titre,
                'message'                  => $message,
                'vehicule_immatriculation' => $vehicule['immatriculation'],
                'donnees'                  => json_encode([
                    'document_id'     => $doc->id,
                    'type_document'   => $doc->type_document,
                    'nom_document'    => $doc->nom_document,
                    'date_emission'   => $doc->date_emission,
                    'date_expiration' => $doc->date_expiration,
                    'jours_restants'  => $joursRestants,
                    'statut'          => $statut,
                    'niveau'          => $niveau,
                ]),
                'lien_url'                 => '/admin/vehicules/' . $vehicule['immatriculation'],
                'date_creation'            => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error("[DocumentExpiration] ✗ création notification doc#{$doc->id} | {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Cherche la notification existante pour (document + catégorie + date_expiration).
     *
     * On utilise JSON_UNQUOTE(...) = 'texte' plutôt que JSON_EXTRACT(...) = nombre :
     * en MySQL 5.7, comparer un JSON à un paramètre PHP donne parfois FAUX
     * (int contre string), ce qui créerait des doublons.
     */
    private function trouverNotificationId(object $doc, int $categorieId): ?int
    {
        $id = DB::table('notifications')
            ->where('categorie_id', $categorieId)
            ->where('vehicule_immatriculation', $doc->vehicule_immatriculation)
            ->whereRaw('JSON_UNQUOTE(JSON_EXTRACT(donnees, \'$.document_id\')) = ?', [(string) $doc->id])
            ->whereRaw('JSON_UNQUOTE(JSON_EXTRACT(donnees, \'$.date_expiration\')) = ?', [(string) $doc->date_expiration])
            ->orderByDesc('id')
            ->value('id');

        return $id ? (int) $id : null;
    }

    // =========================================================================
    // ENVOIS (table envois_notifications)
    // =========================================================================

    /**
     * Crée la ligne in_app du destinataire si elle n'existe pas déjà.
     * @return bool true si une ligne a été créée
     */
    private function creerEnvoiInApp(int $notifId, object $dest): bool
    {
        try {
            $existe = DB::table('envois_notifications')
                ->where('notification_id', $notifId)
                ->where('user_id', $dest->id)
                ->where('canal', 'in_app')
                ->exists();

            if ($existe) return false;

            DB::table('envois_notifications')->insert([
                'notification_id'   => $notifId,
                'user_id'           => $dest->id,
                'canal'             => 'in_app',
                'statut_envoi'      => 'envoye',
                'date_envoi'        => now(),
                'est_lu'            => 0,
                'date_creation'     => now(),
                'date_modification' => now(),
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error("[DocumentExpiration] ✗ in_app user#{$dest->id} notif#{$notifId} | {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Enregistre le résultat de l'envoi email.
     * Si une ligne existe déjà (échec précédent), on la met à jour au lieu d'en créer une autre.
     */
    private function enregistrerEnvoiEmail(int $notifId, object $dest, ?object $existant, ?string $erreur): void
    {
        $ok   = ($erreur === null);
        $data = [
            'statut_envoi'      => $ok ? 'envoye' : 'echec',
            'date_envoi'        => $ok ? now() : null,
            'erreur'            => $ok ? null : mb_substr($erreur, 0, 2000),
            'date_modification' => now(),
        ];

        try {
            if ($existant) {
                DB::table('envois_notifications')->where('id', $existant->id)->update($data);
            } else {
                DB::table('envois_notifications')->insert($data + [
                    'notification_id' => $notifId,
                    'user_id'         => $dest->id,
                    'canal'           => 'email',
                    'est_lu'          => 0,
                    'date_creation'   => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error("[DocumentExpiration] enregistrerEnvoiEmail() | {$e->getMessage()}");
        }
    }

    /**
     * Envoie l'email via MailDocumentVehicule.
     * @return string|null  null = succès, sinon le message d'erreur
     */
    private function envoyerEmail(
        object $doc,
        array  $vehicule,
        object $dest,
        string $statut,
        int    $joursRestants,
        string $niveau
    ): ?string {
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
                niveau: $niveau,
            ));

            Log::info("[DocumentExpiration] ✉ {$dest->email} | {$doc->vehicule_immatriculation} | {$doc->type_document} | {$niveau}");
            return null;

        } catch (\Throwable $e) {
            Log::error("[DocumentExpiration] ✗ Email {$dest->email} | {$e->getMessage()}");
            return $e->getMessage();
        }
    }

    // =========================================================================
    // HELPERS — LOGIQUE MÉTIER
    // =========================================================================

    private function calculerJoursRestants(string $dateExpiration, ?Carbon $today = null): int
    {
        $today      = $today ?? Carbon::today();
        $expiration = Carbon::parse($dateExpiration)->startOfDay();

        // positif = jours avant expiration, négatif = jours de retard
        return (int) $today->diffInDays($expiration, false);
    }

    /**
     * @return string|null  'expire' | 'seuil_5' | 'seuil_15' | 'seuil_30' | null (> 30 jours)
     */
    private function determinerNiveau(int $joursRestants): ?string
    {
        if ($joursRestants <= 0)  return 'expire';   // 0 = expiré le jour même
        if ($joursRestants <= 5)  return 'seuil_5';
        if ($joursRestants <= 15) return 'seuil_15';
        if ($joursRestants <= 30) return 'seuil_30';

        return null;
    }

    /**
     * Utilisateurs actifs des rôles cibles avec leur email.
     */
    private function getDestinataires(): Collection
    {
        return DB::table('utilisateurs as u')
            ->join('roles as r', 'r.id', '=', 'u.role_id')
            ->where('u.est_actif', 1)
            ->where('u.est_supprime', 0)
            ->where('r.est_supprime', 0)
            ->whereNotNull('u.email')
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
     * Informations du véhicule lié au document (pour l'email et la notification).
     */
    private function getVehiculeInfos(string $immatriculation): array
    {
        $v = DB::table('vehicules as v')
            ->leftJoin('marques as ma', 'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo', 'mo.id', '=', 'v.modele_id')
            ->leftJoin('directions as d', 'd.id', '=', 'v.direction_id')
            ->leftJoin('categories_vehicules as ca', 'ca.id', '=', 'v.categorie_id')
            ->where('v.immatriculation', $immatriculation)
            ->where('v.est_supprime', 0)
            ->select(
                'v.immatriculation',
                'v.statut',
                'v.kilometrage',
                'ma.nom as marque',
                'mo.nom as modele',
                'd.nom as direction',
                'ca.nom as categorie'
            )
            ->first();

        if (!$v) {
            return [
                'immatriculation' => $immatriculation,
                'marque'          => null,
                'modele'          => null,
                'direction'       => null,
                'categorie'       => null,
                'statut'          => null,
                'kilometrage'     => null,
            ];
        }

        $statutLabel = match ($v->statut) {
            'disponible'     => 'Disponible',
            'en_mission'     => 'En Mission',
            'en_maintenance' => 'Maintenance',
            'immobilise'     => 'Immobilisé',
            default          => ucfirst((string) $v->statut),
        };

        return [
            'immatriculation' => $v->immatriculation,
            'marque'          => $v->marque,
            'modele'          => $v->modele,
            'direction'       => $v->direction,
            'categorie'       => $v->categorie,
            'statut'          => $statutLabel,
            'kilometrage'     => (int) $v->kilometrage,
        ];
    }

    // =========================================================================
    // HELPERS — CATÉGORIES DE NOTIFICATION
    // =========================================================================

    private function getCodeCategorie(string $niveau): string
    {
        return match ($niveau) {
            'expire'   => 'alerte_document_expire',
            'seuil_5'  => 'alerte_document_critique',
            'seuil_15' => 'alerte_document_importante',
            'seuil_30' => 'alerte_document_preventive',
            default    => 'alerte_document_expire_bientot',
        };
    }

    /**
     * Résout l'id de la catégorie. La crée à la volée si elle n'existe pas.
     * (la table categories_notifications a un index UNIQUE sur `code`)
     */
    private function resolveCategorieId(string $code, string $niveau): ?int
    {
        try {
            $cat = DB::table('categories_notifications')->where('code', $code)->first();

            if ($cat) {
                // Catégorie supprimée ou désactivée : on la réactive
                if ($cat->est_supprime || !$cat->est_actif) {
                    DB::table('categories_notifications')->where('id', $cat->id)->update([
                        'est_supprime'      => 0,
                        'est_actif'         => 1,
                        'date_suppression'  => null,
                        'date_modification' => now(),
                    ]);
                }
                return (int) $cat->id;
            }

            [$libelle, $priorite] = match ($niveau) {
                'expire'   => ['Document véhicule expiré — action immédiate',         'critique'],
                'seuil_5'  => ['Document véhicule — expiration dans 5 jours ou moins',  'critique'],
                'seuil_15' => ['Document véhicule — expiration dans 15 jours ou moins', 'important'],
                'seuil_30' => ['Document véhicule — expiration dans 30 jours ou moins', 'a_surveiller'],
                default    => ['Alerte document véhicule',                             'normal'],
            };

            return (int) DB::table('categories_notifications')->insertGetId([
                'code'              => $code,
                'libelle'           => $libelle,
                'niveau_priorite'   => $priorite,
                'canaux'            => json_encode(['email', 'in_app']),
                'roles_cibles'      => json_encode(self::ROLES_CIBLES),
                'description'       => 'Notification automatique — expiration documents véhicules',
                'est_actif'         => 1,
                'est_supprime'      => 0,
                'date_creation'     => now(),
                'date_modification' => now(),
            ]);

        } catch (\Throwable $e) {
            Log::error("[DocumentExpiration] ✗ catégorie {$code} | {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Titre (≤ 200 caractères) et message de la notification.
     */
    private function buildTitreMessage(object $doc, array $vehicule, int $joursRestants, string $niveau): array
    {
        $immat   = $vehicule['immatriculation'];
        $typeDoc = ucfirst(str_replace('_', ' ', $doc->type_document));
        $jAbs    = abs($joursRestants);
        $jWord   = $jAbs > 1 ? 'jours' : 'jour';

        $delai = "expire dans {$joursRestants} {$jWord}";

        // Document expiré : 0 jour = expiré aujourd'hui, sinon nombre de jours de retard
        $depuis = $jAbs === 0 ? "aujourd'hui" : "depuis {$jAbs} {$jWord}";

        $titre = match ($niveau) {
            'expire'   => "[EXPIRÉ] {$typeDoc} — {$immat}",
            'seuil_5'  => "[URGENT ≤ 5j] {$typeDoc} — {$immat}",
            'seuil_15' => "[ALERTE ≤ 15j] {$typeDoc} — {$immat}",
            'seuil_30' => "[INFO ≤ 30j] {$typeDoc} — {$immat}",
            default    => "Alerte document — {$immat}",
        };

        $message = match ($niveau) {
            'expire'   => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} a expiré {$depuis}. Action immédiate requise.",
            'seuil_5'  => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} {$delai}. Renouvellement urgent.",
            'seuil_15' => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} {$delai}. Planifiez le renouvellement.",
            'seuil_30' => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} {$delai}. Anticipez le renouvellement.",
            default    => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} nécessite votre attention.",
        };

        return [mb_substr($titre, 0, 200), $message];
    }
}