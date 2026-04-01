<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\MailDocumentVehicule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * DocumentExpirationController
 *
 * Vérifie les dates d'expiration de tous les documents véhicules présents
 * en base et envoie les notifications (email + in_app) aux rôles concernés.
 *
 * Logique :
 *   - On récupère TOUS les documents actifs ayant une date_expiration (quelle
 *     que soit l'année d'émission ou d'expiration).
 *   - On calcule les jours restants entre AUJOURD'HUI et date_expiration.
 *   - Si ce nombre tombe dans un des 3 seuils → on notifie.
 *
 * Seuils :
 *   ≤ 30 jours  → alerte préventive   (niveau seuil_30)
 *   ≤ 15 jours  → alerte importante   (niveau seuil_15)
 *   ≤  5 jours  → alerte critique     (niveau seuil_5)
 *   <  0 jours  → document expiré     (niveau expire)
 *   >  30 jours → ignoré (pas encore en zone d'alerte)
 *
 */
class DocumentExpirationController extends Controller
{
    // Rôles qui reçoivent les notifications
    private const ROLES_CIBLES = ['admin', 'chef_parc', 'chauffeur', 'chef_tf'];

    // =========================================================================
    // POINT D'ENTRÉE — Route API
    // =========================================================================

    /**
     * GET /api/admin/documents/check-expiration
     */
    public function checkExpiration(): JsonResponse
    {
        $today = Carbon::today();

        $summary = [
            'traites'        => 0,
            'expires'        => 0,
            'seuil_5j'       => 0,
            'seuil_15j'      => 0,
            'seuil_30j'      => 0,
            'ignores'        => 0,
            'emails_envoyes' => 0,
            'notifs_in_app'  => 0,
            'erreurs'        => 0,
        ];

        // ── 1. Tous les documents actifs avec une date_expiration ─────────────
        // Peu importe l'année d'émission ou d'expiration.
        // Seul critère : date_expiration NOT NULL et document non supprimé.
        $documents = DB::table('documents_vehicules')
            ->where('est_supprime', 0)
            ->whereNotNull('date_expiration')
            ->orderBy('date_expiration', 'asc')
            ->get();

        if ($documents->isEmpty()) {
            Log::info('[DocumentExpiration] Aucun document avec date_expiration trouvé.');
            return response()->json([
                'message' => 'Aucun document à vérifier.',
                'summary' => $summary,
                'date'    => $today->format('d/m/Y'),
            ]);
        }

        // ── 2. Destinataires (récupérés une seule fois) ───────────────────────
        $destinataires = $this->getDestinataires();

        if ($destinataires->isEmpty()) {
            Log::warning('[DocumentExpiration] Aucun destinataire trouvé pour les rôles : ' . implode(', ', self::ROLES_CIBLES));
            return response()->json([
                'message' => 'Aucun destinataire configuré.',
                'summary' => $summary,
            ]);
        }

        // ── 3. Traitement de chaque document ──────────────────────────────────
        foreach ($documents as $doc) {
            $summary['traites']++;

            // Calcul jours restants :
            //   positif  → jours avant expiration
            //   négatif  → jours de retard (déjà expiré)
            $expiration    = Carbon::parse($doc->date_expiration)->startOfDay();
            $joursRestants = (int) $today->diffInDays($expiration, false);

            // Détermine le niveau d'alerte
            $niveau = $this->determinerNiveau($joursRestants);

            // > 30 jours : pas encore en zone d'alerte → on ignore
            if ($niveau === null) {
                $summary['ignores']++;
                continue;
            }

            // Comptabilise par niveau
            match ($niveau) {
                'expire'   => $summary['expires']++,
                'seuil_5'  => $summary['seuil_5j']++,
                'seuil_15' => $summary['seuil_15j']++,
                'seuil_30' => $summary['seuil_30j']++,
                default    => null,
            };

            // Statut pour le template mail (2 états : expiré ou bientôt)
            $statut   = $niveau === 'expire' ? 'expire' : 'expire_bientot';
            $vehicule = $this->getVehiculeInfos($doc->vehicule_immatriculation);

            // ── Notifie chaque destinataire ──
            foreach ($destinataires as $dest) {
                $emailOk = $this->envoyerEmail($doc, $vehicule, $dest, $statut, $joursRestants, $niveau);
                $emailOk ? $summary['emails_envoyes']++ : $summary['erreurs']++;

                $notifOk = $this->creerNotifInApp($doc, $vehicule, $dest, $statut, $joursRestants, $niveau);
                if ($notifOk) $summary['notifs_in_app']++;
            }
        }

        Log::info('[DocumentExpiration] Scan terminé.', $summary);

        return response()->json([
            'message' => 'Vérification des documents terminée.',
            'summary' => $summary,
            'date'    => $today->format('d/m/Y'),
        ]);
    }

    // =========================================================================
    // NOTIFICATION D'UN DOCUMENT UNIQUE
    // Appelable depuis VehiculesController lors de l'upload d'un document
    // =========================================================================

    public function notifierDocument(int $documentId): void
    {
        $doc = DB::table('documents_vehicules')
            ->where('id', $documentId)
            ->where('est_supprime', 0)
            ->whereNotNull('date_expiration')
            ->first();

        if (!$doc) return;

        $today         = Carbon::today();
        $expiration    = Carbon::parse($doc->date_expiration)->startOfDay();
        $joursRestants = (int) $today->diffInDays($expiration, false);
        $niveau        = $this->determinerNiveau($joursRestants);

        // Pas en zone d'alerte → rien à faire
        if ($niveau === null) return;

        $statut        = $niveau === 'expire' ? 'expire' : 'expire_bientot';
        $vehicule      = $this->getVehiculeInfos($doc->vehicule_immatriculation);
        $destinataires = $this->getDestinataires();

        foreach ($destinataires as $dest) {
            $this->envoyerEmail($doc, $vehicule, $dest, $statut, $joursRestants, $niveau);
            $this->creerNotifInApp($doc, $vehicule, $dest, $statut, $joursRestants, $niveau);
        }
    }

    // =========================================================================
    // HELPERS — LOGIQUE MÉTIER
    // =========================================================================

    /**
     * Détermine le niveau d'alerte à partir des jours restants.
     *
     * @param int $joursRestants  Positif = jours avant expiration, négatif = retard
     * @return string|null        Niveau ou null si pas en zone d'alerte
     */
    private function determinerNiveau(int $joursRestants): ?string
    {
        if ($joursRestants < 0)   return 'expire';    // Déjà expiré
        if ($joursRestants <= 5)  return 'seuil_5';   // < 5 jours
        if ($joursRestants <= 15) return 'seuil_15';  // < 15 jours
        if ($joursRestants <= 30) return 'seuil_30';  // < 30 jours

        return null; // > 30 jours → pas encore d'alerte
    }

    /**
     * Récupère les utilisateurs actifs des rôles cibles avec leur email.
     * Table : utilisateurs JOIN roles
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
     * Récupère les informations du véhicule lié au document.
     *
     * Relation : documents_vehicules.vehicule_immatriculation
     *         → vehicules.immatriculation  (fk_docveh_vehicule)
     *         → marques, modeles, directions via les FK de vehicules
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

        // Mapping statut DB → label lisible (valeurs DB réelles de ta table)
        $statutLabel = match ($v->statut) {
            'disponible'     => 'Disponible',
            'en_mission'     => 'En Mission',
            'en_maintenance' => 'Maintenance',
            'immobilise'     => 'Immobilisé',
            default          => ucfirst($v->statut),
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
    // HELPERS — ENVOIS
    // =========================================================================

    /**
     * Envoie l'email via MailDocumentVehicule.
     */
    private function envoyerEmail(
        object $doc,
        array  $vehicule,
        object $dest,
        string $statut,
        int    $joursRestants,
        string $niveau
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
                niveau: $niveau,
            ));

            // Enregistre l'envoi email dans envois_notifications
            $this->enregistrerEnvoi($doc, $dest, $niveau, 'email', 'envoye');

            Log::info("[DocumentExpiration] ✉ {$dest->email} | {$doc->vehicule_immatriculation} | {$doc->type_document} | {$niveau}");
            return true;

        } catch (\Throwable $e) {
            $this->enregistrerEnvoi($doc, $dest, $niveau, 'email', 'echec', $e->getMessage());
            Log::error("[DocumentExpiration] ✗ Email {$dest->email} | {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Crée la notification in_app dans :
     *   - notifications         (une ligne par document, avec anti-doublon jour)
     *   - envois_notifications  (une ligne par destinataire)
     *
     * Champs respectés :
     *   notifications.categorie_id           NOT NULL → int(10) unsigned
     *   notifications.titre                  NOT NULL → varchar(200)
     *   notifications.message                NOT NULL → text
     *   notifications.vehicule_immatriculation        → varchar(30) nullable
     *   notifications.donnees                         → JSON nullable
     *   notifications.lien_url                        → varchar(255) nullable
     *   notifications.date_creation          NOT NULL → timestamp
     *
     *   envois_notifications.notification_id NOT NULL
     *   envois_notifications.user_id         NOT NULL
     *   envois_notifications.canal           NOT NULL
     *   envois_notifications.statut_envoi    NOT NULL
     *   envois_notifications.date_envoi               → timestamp nullable
     *   envois_notifications.est_lu                   → tinyint default 0
     *   envois_notifications.date_creation   NOT NULL
     *   envois_notifications.date_modification NOT NULL
     */
    private function creerNotifInApp(
        object $doc,
        array  $vehicule,
        object $dest,
        string $statut,
        int    $joursRestants,
        string $niveau
    ): bool {
        try {
            $codeCategorie = $this->getCodeCategorie($niveau);
            $categorieId   = $this->resolveCategorieId($codeCategorie, $niveau);

            if (!$categorieId) return false;

            [$titre, $message] = $this->buildTitreMessage($doc, $vehicule, $joursRestants, $niveau);

            // Anti-doublon : une seule notif par (document + catégorie + jour)
            $dejaExistante = DB::table('notifications')
                ->where('vehicule_immatriculation', $vehicule['immatriculation'])
                ->where('categorie_id', $categorieId)
                ->whereRaw("JSON_EXTRACT(donnees, '$.document_id') = ?", [$doc->id])
                ->whereDate('date_creation', Carbon::today())
                ->value('id');

            if ($dejaExistante) {
                // Notif déjà créée aujourd'hui pour ce doc → on ajoute juste l'envoi user
                DB::table('envois_notifications')->insert([
                    'notification_id'  => $dejaExistante,
                    'user_id'          => $dest->id,
                    'canal'            => 'in_app',
                    'statut_envoi'     => 'envoye',
                    'date_envoi'       => now(),
                    'est_lu'           => 0,
                    'date_creation'    => now(),
                    'date_modification'=> now(),
                ]);
                return true;
            }

            // Crée la notification globale
            $notifId = DB::table('notifications')->insertGetId([
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
                'lien_url'      => '/admin/vehicules/' . $vehicule['immatriculation'],
                'date_creation' => now(),
            ]);

            // Crée l'envoi pour ce destinataire
            DB::table('envois_notifications')->insert([
                'notification_id'  => $notifId,
                'user_id'          => $dest->id,
                'canal'            => 'in_app',
                'statut_envoi'     => 'envoye',
                'date_envoi'       => now(),
                'est_lu'           => 0,
                'date_creation'    => now(),
                'date_modification'=> now(),
            ]);

            return true;

        } catch (\Throwable $e) {
            Log::error("[DocumentExpiration] ✗ in_app user#{$dest->id} doc#{$doc->id} | {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Enregistre le résultat d'un envoi email dans envois_notifications.
     * Cherche la notification du jour pour ce document.
     */
    private function enregistrerEnvoi(
        object  $doc,
        object  $dest,
        string  $niveau,
        string  $canal,
        string  $statutEnvoi,
        ?string $erreur = null
    ): void {
        try {
            $categorieId = DB::table('categories_notifications')
                ->where('code', $this->getCodeCategorie($niveau))
                ->where('est_supprime', 0)
                ->value('id');

            if (!$categorieId) return;

            $notifId = DB::table('notifications')
                ->where('vehicule_immatriculation', $doc->vehicule_immatriculation)
                ->where('categorie_id', $categorieId)
                ->whereRaw("JSON_EXTRACT(donnees, '$.document_id') = ?", [$doc->id])
                ->whereDate('date_creation', Carbon::today())
                ->orderBy('date_creation', 'desc')
                ->value('id');

            if (!$notifId) return;

            DB::table('envois_notifications')->insert([
                'notification_id'  => $notifId,
                'user_id'          => $dest->id,
                'canal'            => $canal,
                'statut_envoi'     => $statutEnvoi,
                'date_envoi'       => $statutEnvoi === 'envoye' ? now() : null,
                'est_lu'           => 0,
                'erreur'           => $erreur,
                'date_creation'    => now(),
                'date_modification'=> now(),
            ]);

        } catch (\Throwable $e) {
            Log::error("[DocumentExpiration] enregistrerEnvoi() | {$e->getMessage()}");
        }
    }

    // =========================================================================
    // HELPERS — UTILITAIRES
    // =========================================================================

    /**
     * Code de catégorie de notification selon le niveau.
     * Ces codes seront créés dans categories_notifications si absents.
     */
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
     * Résout l'id de la catégorie de notification.
     * La crée à la volée si elle n'existe pas encore en DB.
     *
     * Champs respectés de categories_notifications :
     *   code, libelle, niveau_priorite, canaux (JSON NOT NULL),
     *   roles_cibles (JSON nullable), description, est_actif,
     *   est_supprime, date_creation, date_modification
     */
    private function resolveCategorieId(string $code, string $niveau): ?int
    {
        $id = DB::table('categories_notifications')
            ->where('code', $code)
            ->where('est_supprime', 0)
            ->value('id');

        if ($id) return $id;

        try {
            [$libelle, $priorite] = match ($niveau) {
                'expire'   => ['Document véhicule expiré — action immédiate',        'critique'],
                'seuil_5'  => ['Document véhicule — expiration dans moins de 5 j.',  'critique'],
                'seuil_15' => ['Document véhicule — expiration dans moins de 15 j.', 'important'],
                'seuil_30' => ['Document véhicule — expiration dans moins de 30 j.', 'a_surveiller'],
                default    => ['Alerte document véhicule',                            'normal'],
            };

            return DB::table('categories_notifications')->insertGetId([
                'code'             => $code,
                'libelle'          => $libelle,
                'niveau_priorite'  => $priorite,
                'canaux'           => json_encode(['email', 'in_app']),   // NOT NULL JSON
                'roles_cibles'     => json_encode(['admin', 'chef_parc']),
                'description'      => 'Notification automatique — expiration documents véhicules',
                'est_actif'        => 1,
                'est_supprime'     => 0,
                'date_creation'    => now(),
                'date_modification'=> now(),
            ]);

        } catch (\Throwable $e) {
            Log::error("[DocumentExpiration] Impossible de créer la catégorie {$code} | {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Construit le titre (≤ 200 chars) et le message de la notification.
     */
    private function buildTitreMessage(
        object $doc,
        array  $vehicule,
        int    $joursRestants,
        string $niveau
    ): array {
        $immat   = $vehicule['immatriculation'];
        $typeDoc = ucfirst(str_replace('_', ' ', $doc->type_document));
        $jAbs    = abs($joursRestants);
        $jWord   = $jAbs > 1 ? 'jours' : 'jour';

        $titre = match ($niveau) {
            'expire'   => "[EXPIRÉ] {$typeDoc} — {$immat}",
            'seuil_5'  => "[URGENT < 5j] {$typeDoc} — {$immat}",
            'seuil_15' => "[ALERTE < 15j] {$typeDoc} — {$immat}",
            'seuil_30' => "[INFO < 30j] {$typeDoc} — {$immat}",
            default    => "Alerte document — {$immat}",
        };

        $message = match ($niveau) {
            'expire'   => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} a expiré depuis {$jAbs} {$jWord}. Action immédiate requise.",
            'seuil_5'  => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} expire dans {$joursRestants} {$jWord}. Renouvellement urgent.",
            'seuil_15' => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} expire dans {$joursRestants} {$jWord}. Planifiez le renouvellement.",
            'seuil_30' => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} expire dans {$joursRestants} {$jWord}. Anticipez le renouvellement.",
            default    => "{$typeDoc} « {$doc->nom_document} » du véhicule {$immat} nécessite votre attention.",
        };

        // titre ≤ 200 chars (contrainte DB)
        $titre = mb_substr($titre, 0, 200);

        return [$titre, $message];
    }
}