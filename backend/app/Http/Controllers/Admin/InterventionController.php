<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JournalAudit;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

/**
 * InterventionController
 *
 * Gestion des interventions réalisées (interne / externe) ET de la caisse
 * (approvisionnements, sorties, contre-passations, périodes, export).
 *
 * Utilise DB::table() comme tous les autres contrôleurs du projet.
 * Audit explicite via JournalAudit::tracer().
 *
 * Droits :
 *   - Écriture interventions : admin, chef_parc, mecanicien, daal
 *   - Modification d'une intervention TERMINÉE : admin, daal
 *   - Gestion de la caisse (approvisionner, sortie, annuler, clôturer) : daal (+ admin)
 *
 * Saisie de plusieurs demandes d'un même véhicule : le front envoie UN POST /admin/interventions
 * par demande (demandes_ids = [id]) ; chaque appel est une transaction indépendante.
 *
 * Routes interventions (api.php) :
 *   GET    /admin/interventions/references                      → references
 *   GET    /admin/interventions/statistiques                    → statistiques   (à déclarer AVANT /{id})
 *   GET    /admin/interventions/{immat}/demandes-ouvertes       → demandesOuvertes
 *   GET    /admin/interventions                                 → index
 *   POST   /admin/interventions                                 → store          (multipart/form-data : facture)
 *   GET    /admin/interventions/{id}                            → show
 *   PUT    /admin/interventions/{id}                            → update         (multipart : POST + _method=PUT)
 *   DELETE /admin/interventions/{id}                            → destroy
 *   PATCH  /admin/interventions/{id}/statut                     → updateStatut
 *
 * Routes caisse (api.php) :
 *   GET    /admin/caisse/solde                                  → caisseSolde
 *   GET    /admin/caisse/mouvements                             → caisseMouvements
 *   POST   /admin/caisse/approvisionnement                      → caisseApprovisionnement
 *   POST   /admin/caisse/sortie                                 → caisseSortie
 *   POST   /admin/caisse/mouvements/{id}/annuler                → caisseAnnuler
 *   GET    /admin/caisse/periodes                               → caissePeriodes
 *   POST   /admin/caisse/periodes/{id}/cloturer                 → caisseCloturerPeriode
 *   GET    /admin/caisse/export                                 → caisseExport
 *
 * Migration requise (traçabilité des intervenants saisis) :
 *   ALTER TABLE interventions ADD COLUMN intervenants_noms TEXT NULL AFTER intervenant_id;
 */
class InterventionController extends Controller
{
    // =========================================================================
    // CONSTANTES
    // =========================================================================

    private const STATUTS = ['planifiee', 'en_cours', 'terminee', 'annulee'];

    /** Valeur technique conservée en base (colonne NOT NULL éventuelle) : le champ n'est plus saisi. */
    private const SEVERITE_DEFAUT = 'normale';

    private const RESULTATS = [
        'en_attente', 'en_cours', 'resolu', 'partiel', 'echec',
    ];

    private const STATUTS_PAIEMENT = ['en_attente', 'paye', 'partiel'];

    /** Rôles pouvant créer / modifier des interventions */
    private const ROLES_ECRITURE = ['admin', 'chef_parc', 'mecanicien', 'daal'];

    /** Rôles pouvant modifier une intervention déjà TERMINÉE */
    private const ROLES_EDIT_TERMINEE = ['admin', 'daal'];

    /** Rôles pouvant gérer la caisse (approvisionner, sortie, annuler, clôturer) : le DAAL (+ admin) */
    private const ROLES_GESTION_CAISSE = ['admin', 'daal'];

    /**
     * Statuts véhicule proposés dans le formulaire d'intervention.
     * clé = valeur stockée dans vehicules.statut, valeur = libellé affiché.
     */
    private const STATUTS_VEHICULE_MAP = [
        'disponible'            => 'Disponible',
        'En reparation'         => 'En réparation',
        'En panne'              => 'En panne',
        'immobilisation courte' => 'Immobilisation courte',
        'immobilisation longue' => 'Immobilisation longue',
        'indisponible'          => 'Hors service',
        'en_mission'            => 'En mission',
    ];

    private ?string $roleCodeCache = null;

    // =========================================================================
    // HELPERS PRIVÉS
    // =========================================================================

    private function ok($data, string $msg = 'OK', int $status = 200): JsonResponse
    {
        return response()->json(['success' => true, 'message' => $msg, 'data' => $data], $status);
    }

    private function fail(string $msg, int $status = 400, array $errors = []): JsonResponse
    {
        $payload = ['success' => false, 'message' => $msg];
        if ($errors) $payload['errors'] = $errors;
        return response()->json($payload, $status);
    }

    private function getAuthUserId(): ?int
    {
        $user = auth()->user();
        if (!$user) return null;
        foreach (['id', 'user_id', 'utilisateur_id'] as $prop) {
            if (isset($user->{$prop})) return (int) $user->{$prop};
        }
        return null;
    }

    private function roleCode(): ?string
    {
        if ($this->roleCodeCache !== null) return $this->roleCodeCache;
        $user = auth()->user();
        if (!$user || !isset($user->role_id)) return null;
        return $this->roleCodeCache = DB::table('roles')->where('id', $user->role_id)->value('code');
    }

    private function canWrite(): bool
    {
        return in_array($this->roleCode(), self::ROLES_ECRITURE, true);
    }

    /** Peut modifier une intervention terminée (admin, daal). */
    private function canEditTerminee(): bool
    {
        return in_array($this->roleCode(), self::ROLES_EDIT_TERMINEE, true);
    }

    private function canManageCaisse(): bool
    {
        return in_array($this->roleCode(), self::ROLES_GESTION_CAISSE, true);
    }

    private static function iso($v): ?string
    {
        return $v ? Carbon::parse($v)->toIso8601String() : null;
    }

    /**
     * Date SANS heure (Y-m-d). Évite tout décalage de fuseau côté front.
     * Accepte 'Y-m-d', 'Y-m-d H:i:s' (valeur DB) ou ISO 8601 (navigateur).
     */
    private static function jour($v): ?string
    {
        if (!$v) return null;
        try {
            if (is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}/', $v)
                && !preg_match('/T|Z|[+-]\d{2}:?\d{2}$/', substr($v, 10))) {
                return substr($v, 0, 10);
            }
            return Carbon::parse($v)->setTimezone(config('app.timezone'))->toDateString();
        } catch (\Throwable $e) {
            return (string) $v; // la règle "date" renverra l'erreur de validation
        }
    }

    /** Durée en minutes entre deux dates (jours entiers : pas d'heures dans le formulaire). */
    private static function dureeMinutes($debut, $fin): ?int
    {
        if (!$debut || !$fin) return null;
        $d = Carbon::parse(self::jour($debut))->startOfDay();
        $f = Carbon::parse(self::jour($fin))->startOfDay();
        if ($f->lt($d)) return 0;
        return (int) floor($d->diffInDays($f, true)) * 1440;
    }

    /**
     * Durée lisible : "1 an 2 mois 1 semaine 3 jours" au lieu d'un nombre d'heures.
     * Si pas de date de fin → calculée jusqu'à aujourd'hui (intervention en cours).
     */
    private static function dureeHumaine($debut, $fin): array
    {
        if (!$debut) return ['texte' => null, 'jours' => null, 'en_cours' => false];

        $enCours = !$fin;
        $d = Carbon::parse(self::jour($debut))->startOfDay();
        $f = $fin ? Carbon::parse(self::jour($fin))->startOfDay() : now()->startOfDay();
        if ($f->lt($d)) $f = $d->copy();

        $jours = (int) floor($d->diffInDays($f, true));
        $diff  = $d->diff($f);

        $y = (int) $diff->y;
        $m = (int) $diff->m;
        $semaines = intdiv((int) $diff->d, 7);
        $j = (int) $diff->d % 7;

        $parts = [];
        if ($y)        $parts[] = $y . ($y > 1 ? ' ans' : ' an');
        if ($m)        $parts[] = $m . ' mois';
        if ($semaines) $parts[] = $semaines . ($semaines > 1 ? ' semaines' : ' semaine');
        if ($j)        $parts[] = $j . ($j > 1 ? ' jours' : ' jour');

        $texte = $parts ? implode(' ', $parts) : "Moins d'un jour";
        if ($enCours) $texte .= ' (en cours)';

        return ['texte' => $texte, 'jours' => $jours, 'en_cours' => $enCours];
    }

    private static function colonneExiste(string $table, string $colonne): bool
    {
        static $cache = [];
        $k = $table . '.' . $colonne;
        return $cache[$k] ??= Schema::hasColumn($table, $colonne);
    }

    /**
     * Normalise la requête entrante :
     *  - travaux_effectues → diagnostic (la colonne reste "diagnostic")
     *  - date_debut / date_fin (anciens noms) → date_entree_garage / date_sortie_garage
     *  - toutes les dates sont ramenées à Y-m-d (sans heure)
     */
    private function normaliserRequete(Request $request): void
    {
        $m = [];

        if (!$request->filled('diagnostic') && $request->filled('travaux_effectues')) {
            $m['diagnostic'] = $request->input('travaux_effectues');
        }

        $entree = $request->input('date_entree_garage') ?: $request->input('date_debut');
        if ($entree) $m['date_entree_garage'] = self::jour($entree);

        $sortie = $request->input('date_sortie_garage') ?: $request->input('date_fin');
        if ($sortie) $m['date_sortie_garage'] = self::jour($sortie);

        if ($m) $request->merge($m);
    }

    /**
     * Liste des intervenants SAISIS dans le formulaire.
     * Accepte : intervenants = ["Paul", "Jean"] | [{nom, telephone, specialisation}] | "Paul, Jean" | JSON
     *           ou nom_intervenant / nom_prestataire_externe (un seul).
     * Retour : [['nom'=>..., 'telephone'=>..., 'specialisation'=>...], ...] (dédoublonné)
     */
    private function normaliserIntervenants(Request $request): array
    {
        $liste = [];
        $brut  = $request->input('intervenants');

        if (is_string($brut)) {
            $decoded = json_decode($brut, true);
            $brut = is_array($decoded)
                ? $decoded
                : array_filter(array_map('trim', explode(',', $brut)));
        }

        if (is_array($brut)) {
            foreach ($brut as $item) {
                if (is_array($item)) {
                    $nom = trim((string) ($item['nom'] ?? $item['nom_externe'] ?? ''));
                    $tel = trim((string) ($item['telephone'] ?? ''));
                    $spe = trim((string) ($item['specialisation'] ?? ''));
                } else {
                    $nom = trim((string) $item);
                    $tel = '';
                    $spe = '';
                }
                if ($nom !== '') $liste[] = ['nom' => $nom, 'telephone' => $tel, 'specialisation' => $spe];
            }
        }

        if (!$liste) {
            $nom = trim((string) $request->input('nom_intervenant', $request->input('nom_prestataire_externe', '')));
            if ($nom !== '') {
                $liste[] = [
                    'nom'            => $nom,
                    'telephone'      => trim((string) $request->input('telephone_intervenant', '')),
                    'specialisation' => trim((string) $request->input(
                        'specialisation_intervenant',
                        $request->input('fonction_prestataire_externe', '')
                    )),
                ];
            }
        }

        // Dédoublonnage insensible à la casse
        $vus = [];
        return array_values(array_filter($liste, function ($it) use (&$vus) {
            $k = mb_strtolower($it['nom']);
            if (isset($vus[$k])) return false;
            return $vus[$k] = true;
        }));
    }

    /**
     * Retrouve ou crée l'intervenant saisi dans la table `intervenants` → retourne son id.
     */
    private function resolveIntervenant(array $it, bool $isExt, $now): int
    {
        $existing = DB::table('intervenants')
            ->where('nom_externe', $it['nom'])
            ->where('est_externe', $isExt ? 1 : 0)
            ->where('est_supprime', 0)
            ->first();

        if ($existing) {
            $upd = [];
            if ($it['telephone'])      $upd['telephone'] = $it['telephone'];
            if ($it['specialisation']) $upd['specialisation'] = $it['specialisation'];
            if ($upd) {
                $upd['date_modification'] = $now;
                DB::table('intervenants')->where('id', $existing->id)->update($upd);
            }
            return (int) $existing->id;
        }

        $codes  = $isExt ? ['prestataire_externe', 'Prestataire'] : ['mecanicien_interne', 'Mécanicien'];
        $typeId = DB::table('types_intervenant')->whereIn('code', $codes)->value('id') ?? ($isExt ? 2 : 1);

        return (int) DB::table('intervenants')->insertGetId([
            'type_intervenant_id' => $typeId,
            'nom_externe'         => $it['nom'],
            'telephone'           => $it['telephone'] ?: null,
            'specialisation'      => $it['specialisation'] ?: ($isExt ? 'Garage externe' : 'Mécanicien atelier'),
            'est_externe'         => $isExt ? 1 : 0,
            'est_actif'           => 1,
            'est_supprime'        => 0,
            'date_creation'       => $now,
            'date_modification'   => $now,
        ]);
    }

    /** Intervenant de repli (externe sans nom saisi) : id fourni, sinon premier existant, sinon création. */
    private function intervenantParDefaut(?int $idFourni, bool $isExt, $now): int
    {
        if ($idFourni) return $idFourni;

        $premier = DB::table('intervenants')->where('est_externe', $isExt ? 1 : 0)->where('est_supprime', 0)->first();
        if ($premier) return (int) $premier->id;

        return (int) DB::table('intervenants')->insertGetId([
            'type_intervenant_id' => $isExt ? 2 : 1,
            'nom_externe'         => $isExt ? 'Prestataire externe' : 'Mécanicien atelier',
            'specialisation'      => $isExt ? 'Garage externe' : 'Mécanique générale',
            'est_externe'         => $isExt ? 1 : 0,
            'est_actif'           => 1,
            'est_supprime'        => 0,
            'date_creation'       => $now,
            'date_modification'   => $now,
        ]);
    }

    /** Liste [{value,label}] des statuts véhicule pour le formulaire. */
    private function statutsVehiculeListe(): array
    {
        $out = [];
        foreach (self::STATUTS_VEHICULE_MAP as $value => $label) {
            $out[] = ['value' => $value, 'label' => $label];
        }
        return $out;
    }

    /** Applique le statut véhicule choisi manuellement (prioritaire sur la règle automatique). */
    private function appliquerStatutVehiculeChoisi(string $immat, string $statut, $now): void
    {
        DB::table('vehicules')->where('immatriculation', $immat)
            ->update(['statut' => $statut, 'date_modification' => $now]);
    }

    // =========================================================================
    // REQUÊTE DE BASE
    // =========================================================================

    private function baseQuery()
    {
        return DB::table('interventions as i')
            ->leftJoin('vehicules as v',       'v.immatriculation', '=', 'i.vehicule_immatriculation')
            ->leftJoin('marques as ma',        'ma.id',             '=', 'v.marque_id')
            ->leftJoin('modeles as mo',        'mo.id',             '=', 'v.modele_id')
            ->leftJoin('intervenants as it',   'it.id',             '=', 'i.intervenant_id')
            ->leftJoin('types_intervenant as ti', 'ti.id',          '=', 'it.type_intervenant_id')
            ->leftJoin('demandes_intervention as d', 'd.id',        '=', 'i.demande_id')
            ->where('i.est_supprime', 0)
            ->select(
                'i.*',
                'v.statut as vehicule_statut',
                'v.kilometrage as vehicule_kilometrage',
                'ma.nom as vehicule_marque',
                'mo.nom as vehicule_modele',
                'it.nom_externe as intervenant_nom',
                'it.telephone as intervenant_telephone',
                'it.tarif_horaire as intervenant_tarif_horaire',
                'ti.code as type_intervenant_code',
                'ti.libelle as type_intervenant_libelle',
                'd.matricule_demande as demande_matricule_principale'
            );
    }

    // =========================================================================
    // FORMATAGE D'UNE INTERVENTION
    // =========================================================================

    private function format(object $row, ?string $role = null): array
    {
        $isTerminee = ($row->statut ?? '') === 'terminee';

        // Demandes liées (pivot) — infos complètes pour la fiche
        $demandes = DB::table('intervention_demandes as id')
            ->join('demandes_intervention as d', 'd.id', '=', 'id.demande_id')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'd.demandeur_user_id')
            ->where('id.intervention_id', $row->id)
            ->select(
                'd.id', 'd.matricule_demande', 'd.type_intervention', 'd.type_maintenance',
                'd.anomalie_constatee', 'd.priorite', 'd.date_demande',
                DB::raw('COALESCE(u.nom, d.demandeur_autre) as demandeur_nom'),
                'id.est_principale'
            )
            ->get()
            ->map(fn ($r) => (array) $r)
            ->toArray();

        // Pièces prélevées
        $prelevements = DB::table('mouvements_stock as ms')
            ->join('pieces_detachees as p', 'p.id', '=', 'ms.piece_id')
            ->where('ms.type_reference', 'intervention')
            ->where('ms.reference_id', $row->id)
            ->where('ms.type_mouvement', 'sortie')
            ->select('ms.id', 'ms.piece_id', 'p.nom as piece_nom', 'p.unite',
                     'ms.quantite', 'ms.prix_unitaire', 'ms.notes', 'ms.date_creation')
            ->get()
            ->map(fn ($r) => (array) $r)
            ->toArray();

        // Achats caisse
        $achatsCaisse = DB::table('mouvements_caisse as mc')
            ->leftJoin('fournisseurs as f', 'f.id', '=', 'mc.fournisseur_id')
            ->leftJoin('pieces_detachees as p', 'p.id', '=', 'mc.piece_id')
            ->where('mc.intervention_id', $row->id)
            ->where('mc.type_mouvement', 'sortie')
            ->where('mc.est_annule', 0)
            ->select('mc.id', 'mc.montant', 'mc.libelle', 'mc.article',
                     'f.nom as fournisseur_nom', 'p.nom as piece_nom',
                     'mc.chemin_justificatif', 'mc.date_mouvement')
            ->get()
            ->map(fn ($r) => (array) $r)
            ->toArray();

        // Outils
        $outils = DB::table('outils_intervention as oi')
            ->join('outils as o', 'o.id', '=', 'oi.outil_id')
            ->where('oi.intervention_id', $row->id)
            ->select('oi.id', 'oi.outil_id', 'o.nom as outil_nom', 'o.etat as outil_etat',
                     'oi.quantite', 'oi.notes', 'oi.date_creation')
            ->get()
            ->map(fn ($r) => (array) $r)
            ->toArray();

        // En cours : tous les rôles d'écriture ; terminée : admin et DAAL seulement
        $canEdit = !$isTerminee ? $this->canWrite() : $this->canEditTerminee();

        // Dates (sans heure) + durée lisible
        $entree = self::jour($row->date_entree_garage ?? null) ?: self::jour($row->date_debut);
        $sortie = self::jour($row->date_sortie_garage ?? null) ?: self::jour($row->date_fin);
        $duree  = self::dureeHumaine($entree, $sortie);

        // Documents / facture
        $documents = $row->documents ? (json_decode($row->documents, true) ?: []) : [];
        $facture   = null;
        foreach ($documents as $doc) {
            if (($doc['type'] ?? null) === 'facture') { $facture = $doc; break; }
        }

        // Intervenants saisis (traçabilité)
        $nomsSaisis = $row->intervenants_noms ?? null;
        $intervenantsListe = $nomsSaisis
            ? array_values(array_filter(array_map('trim', explode(',', $nomsSaisis))))
            : ($row->intervenant_nom ? [$row->intervenant_nom] : []);

        return [
            'id'                                => (int) $row->id,
            'reference_intervention'            => 'INT-' . str_pad((string) $row->id, 5, '0', STR_PAD_LEFT),
            'demande_id'                        => $row->demande_id ? (int) $row->demande_id : null,
            'matricule_demande'                 => $row->matricule_demande,
            'demande_matricule_principale'      => $row->demande_matricule_principale,
            'vehicule_immatriculation'          => $row->vehicule_immatriculation,
            'vehicule_marque'                   => $row->vehicule_marque,
            'vehicule_modele'                   => $row->vehicule_modele,
            'vehicule_statut'                   => $row->vehicule_statut,
            'vehicule_kilometrage'              => $row->vehicule_kilometrage !== null ? (int) $row->vehicule_kilometrage : null,
            'intervenant_id'                    => $row->intervenant_id ? (int) $row->intervenant_id : null,
            'intervenant_nom'                   => $row->intervenant_nom,
            'intervenant_telephone'             => $row->intervenant_telephone,
            'intervenant_tarif_horaire'         => $row->intervenant_tarif_horaire !== null ? (float) $row->intervenant_tarif_horaire : null,
            'intervenants'                      => $intervenantsListe,
            'intervenants_noms'                 => $nomsSaisis,
            'type_intervenant_code'             => $row->type_intervenant_code,
            'type_intervenant_libelle'          => $row->type_intervenant_libelle,
            'nature_intervention'               => $row->nature_intervention ?? 'interne',
            'type_intervention'                 => $row->type_intervention,
            'statut'                            => $row->statut,
            'resultat'                          => $row->resultat,
            // Dates d'entrée / sortie garage-atelier (Y-m-d) — date_debut/date_fin gardés pour compatibilité
            'date_entree_garage'                => $entree,
            'date_sortie_garage'                => $sortie,
            'date_debut'                        => $entree,
            'date_fin'                          => $sortie,
            // Durée lisible (jours / semaines / mois / années)
            'duree_texte'                       => $duree['texte'],
            'duree_jours'                       => $duree['jours'],
            'duree_en_cours'                    => $duree['en_cours'],
            'duree_minutes'                     => $row->duree_minutes !== null ? (int) $row->duree_minutes : null,
            'duree_estimee_heures'              => $row->duree_estimee_heures !== null ? (int) $row->duree_estimee_heures : null,
            'km_au_moment_intervention'         => $row->km_au_moment_intervention !== null ? (int) $row->km_au_moment_intervention : null,
            // "Travaux effectués" = colonne diagnostic
            'travaux_effectues'                 => $row->diagnostic,
            'diagnostic'                        => $row->diagnostic,
            'notes'                             => $row->notes,
            'cout_main_oeuvre'                  => (float) ($row->cout_main_oeuvre ?? 0),
            'cout_pieces'                       => (float) ($row->cout_pieces ?? 0),
            'cout_total'                        => (float) ($row->cout_main_oeuvre ?? 0) + (float) ($row->cout_pieces ?? 0),
            'montant_main_oeuvre_prestataire'   => $row->montant_main_oeuvre_prestataire !== null ? (float) $row->montant_main_oeuvre_prestataire : null,
            'montant_pieces_prestataire'        => $row->montant_pieces_prestataire !== null ? (float) $row->montant_pieces_prestataire : null,
            'numero_devis_facture'              => $row->numero_devis_facture ?? null,
            'garantie_jours'                    => $row->garantie_jours !== null ? (int) $row->garantie_jours : null,
            'statut_paiement'                   => $row->statut_paiement ?? null,
            'facture'                           => $facture,
            'facture_url'                       => $facture['chemin'] ?? null,
            'documents'                         => $documents,
            'demandes'                          => $demandes,
            'prelevements'                      => $prelevements,
            'achats_caisse'                     => $achatsCaisse,
            'outils'                            => $outils,
            'date_creation'                     => self::iso($row->date_creation),
            'date_modification'                 => self::iso($row->date_modification),
            'can_edit'                          => $canEdit,
            'can_terminer'                      => $this->canWrite() && in_array($row->statut, ['planifiee', 'en_cours'], true),
            'can_annuler'                       => $this->canWrite() && $row->statut !== 'annulee',
        ];
    }

    // =========================================================================
    // RÉFÉRENCES (données de formulaire)
    // =========================================================================

    /**
     * GET /admin/interventions/references
     */
    public function references(Request $request): JsonResponse
    {
        $nature = $request->input('nature', null); // 'interne' | 'externe'

        // Intervenants (suggestions pour l'autocomplétion ; la saisie reste libre)
        $intervenantsQ = DB::table('intervenants as i')
            ->leftJoin('types_intervenant as ti', 'ti.id', '=', 'i.type_intervenant_id')
            ->where('i.est_supprime', 0)
            ->where('i.est_actif', 1);

        if ($nature === 'interne') {
            $intervenantsQ->where(function ($q) {
                $q->where('ti.code', 'mecanicien_interne')
                  ->orWhereRaw("LOWER(COALESCE(ti.libelle, '')) LIKE '%interne%'")
                  ->orWhere('i.est_externe', false);
            });
        } elseif ($nature === 'externe') {
            $intervenantsQ->where(function ($q) {
                $q->where('ti.code', 'prestataire_externe')
                  ->orWhereRaw("LOWER(COALESCE(ti.libelle, '')) LIKE '%externe%'")
                  ->orWhere('i.est_externe', true);
            });
        }

        $intervenants = $intervenantsQ
            ->select('i.id', 'i.nom_externe', 'i.telephone', 'i.email',
                     'i.tarif_horaire', 'i.est_externe', 'i.specialisation',
                     'ti.code as type_code', 'ti.libelle as type_libelle')
            ->orderBy('i.nom_externe')
            ->get();

        // Outils actifs
        $outils = DB::table('outils')
            ->where('est_supprime', 0)
            ->select('id', 'nom', 'type', 'categorie', 'etat', 'emplacement', 'quantite_stock', 'notes')
            ->orderBy('nom')
            ->get();

        // Pièces en stock
        $pieces = DB::table('pieces_detachees as p')
            ->leftJoin('fournisseurs as f', 'f.id', '=', 'p.fournisseur_id')
            ->where('p.est_supprime', 0)
            ->where('p.est_actif', 1)
            ->select(
                'p.id', 'p.nom', 'p.sku', 'p.type_piece', 'p.quantite_stock',
                'p.seuil_alerte', 'p.unite', 'p.prix_unitaire',
                'f.nom as fournisseur_nom'
            )
            ->orderBy('p.nom')
            ->get();

        // Véhicules actifs
        $vehicules = DB::table('vehicules as v')
            ->leftJoin('marques as ma', 'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo', 'mo.id', '=', 'v.modele_id')
            ->where('v.est_supprime', 0)
            ->select('v.immatriculation', 'v.statut', 'v.kilometrage',
                     'ma.nom as marque', 'mo.nom as modele')
            ->orderBy('v.immatriculation')
            ->get();

        // Demandes ouvertes / en cours / approuvées
        $demandes = DB::table('demandes_intervention as d')
            ->leftJoin('vehicules as v', 'v.immatriculation', '=', 'd.vehicule_immatriculation')
            ->leftJoin('marques as ma', 'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo', 'mo.id', '=', 'v.modele_id')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'd.demandeur_user_id')
            ->where('d.est_supprime', 0)
            ->whereIn('d.statut', ['en_attente', 'en_cours', 'validee', 'approuvee'])
            ->select(
                'd.id',
                'd.matricule_demande',
                'd.vehicule_immatriculation',
                'd.nature_intervention',
                'd.type_intervention',
                'd.type_maintenance',
                'd.priorite',
                'd.anomalie_constatee',
                'd.statut',
                'd.date_demande',
                'd.kilometrage as demande_kilometrage',
                'd.commentaire',
                'd.recommandation',
                'v.kilometrage as vehicule_kilometrage',
                'v.statut as vehicule_statut',
                'ma.nom as vehicule_marque',
                'mo.nom as vehicule_modele',
                DB::raw('COALESCE(u.nom, d.demandeur_autre) as demandeur_nom')
            )
            ->orderBy('d.date_demande', 'desc')
            ->get();

        $soldeCaisse = $this->getSoldeCaisseActuel();

        $typesIntervenant = DB::table('types_intervenant')
            ->where('est_actif', 1)
            ->select('id', 'code', 'libelle')
            ->get();

        return $this->ok([
            'demandes'         => $demandes,
            'intervenants'     => $intervenants,
            'intervenants_internes' => $intervenants->filter(fn($i) => !$i->est_externe || $i->type_code === 'mecanicien_interne')->values(),
            'intervenants_externes' => $intervenants->filter(fn($i) => $i->est_externe || $i->type_code === 'prestataire_externe')->values(),
            'outils'           => $outils,
            'pieces'           => $pieces,
            'vehicules'        => $vehicules,
            'solde_caisse'     => $soldeCaisse,
            'types_intervenant'=> $typesIntervenant,
            'statuts'          => self::STATUTS,
            'statuts_vehicule' => $this->statutsVehiculeListe(),
        ]);
    }

    /**
     * GET /admin/interventions/{immat}/demandes-ouvertes
     */
    public function demandesOuvertes(Request $request, string $immat): JsonResponse
    {
        $demandes = DB::table('demandes_intervention as d')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'd.demandeur_user_id')
            ->where('d.vehicule_immatriculation', $immat)
            ->where('d.est_supprime', 0)
            ->whereIn('d.statut', ['en_attente', 'en_cours', 'validee', 'approuvee'])
            ->select(
                'd.id', 'd.matricule_demande', 'd.nature_intervention',
                'd.type_intervention', 'd.type_maintenance', 'd.priorite',
                'd.anomalie_constatee', 'd.statut', 'd.date_demande',
                'd.kilometrage', 'd.commentaire', 'd.recommandation',
                DB::raw('COALESCE(u.nom, d.demandeur_autre) as demandeur_nom')
            )
            ->orderBy('d.nature_intervention')
            ->orderBy('d.priorite', 'desc')
            ->orderBy('d.date_demande')
            ->get();

        $grouped = [
            'interne' => [],
            'externe' => [],
        ];

        foreach ($demandes as $d) {
            $nature = $d->nature_intervention ?? 'interne';
            $item   = (array) $d;

            $item['cochable']        = true;
            $item['raison_bloquee']  = null;

            $grouped[$nature][] = $item;
        }

        return $this->ok($grouped);
    }

    // =========================================================================
    // STATISTIQUES GLOBALES  (panneau « Coût global réparations »)
    // =========================================================================

    /**
     * GET /admin/interventions/statistiques
     *
     * Totaux calculés en SQL sur TOUTES les interventions (hors supprimées et annulées),
     * et non sur la page courante de la liste paginée.
     * Filtres optionnels : vehicule, nature, date_from, date_to.
     */
    public function statistiques(Request $request): JsonResponse
    {
        $base = DB::table('interventions as i')
            ->where('i.est_supprime', 0)
            ->where('i.statut', '!=', 'annulee');

        if ($v = $request->input('vehicule'))   $base->where('i.vehicule_immatriculation', $v);
        if ($n = $request->input('nature'))     $base->where('i.nature_intervention', $n);
        if ($df = $request->input('date_from')) $base->whereDate('i.date_debut', '>=', $df);
        if ($dt = $request->input('date_to'))   $base->whereDate('i.date_debut', '<=', $dt);

        $global = (clone $base)->selectRaw("
            COUNT(*)                                              as nb_interventions,
            COALESCE(SUM(i.cout_main_oeuvre), 0)                  as cout_main_oeuvre,
            COALESCE(SUM(i.cout_pieces), 0)                       as cout_pieces,
            COALESCE(SUM(i.cout_main_oeuvre + i.cout_pieces), 0)  as cout_total,
            COALESCE(SUM(CASE WHEN i.statut = 'en_cours'  THEN 1 ELSE 0 END), 0) as en_cours,
            COALESCE(SUM(CASE WHEN i.statut = 'terminee'  THEN 1 ELSE 0 END), 0) as terminees,
            COUNT(DISTINCT i.vehicule_immatriculation)            as nb_vehicules
        ")->first();

        $parNature = (clone $base)
            ->selectRaw("
                i.nature_intervention as nature,
                COUNT(*) as nb,
                COALESCE(SUM(i.cout_main_oeuvre + i.cout_pieces), 0) as cout_total
            ")
            ->groupBy('i.nature_intervention')
            ->get()
            ->map(fn ($r) => [
                'nature'     => $r->nature ?? 'interne',
                'nb'         => (int) $r->nb,
                'cout_total' => (float) $r->cout_total,
            ])->values();

        $topVehicules = (clone $base)
            ->leftJoin('vehicules as v', 'v.immatriculation', '=', 'i.vehicule_immatriculation')
            ->leftJoin('marques as ma', 'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo', 'mo.id', '=', 'v.modele_id')
            ->selectRaw("
                i.vehicule_immatriculation as immatriculation,
                ma.nom as marque,
                mo.nom as modele,
                COUNT(*) as nb,
                COALESCE(SUM(i.cout_main_oeuvre + i.cout_pieces), 0) as cout_total
            ")
            ->groupBy('i.vehicule_immatriculation', 'ma.nom', 'mo.nom')
            ->orderByDesc('cout_total')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'immatriculation' => $r->immatriculation,
                'marque'          => $r->marque,
                'modele'          => $r->modele,
                'nb'              => (int) $r->nb,
                'cout_total'      => (float) $r->cout_total,
            ])->values();

        return $this->ok([
            'nb_interventions'  => (int) ($global->nb_interventions ?? 0),
            'nb_vehicules'      => (int) ($global->nb_vehicules ?? 0),
            'en_cours'          => (int) ($global->en_cours ?? 0),
            'terminees'         => (int) ($global->terminees ?? 0),
            'cout_main_oeuvre'  => (float) ($global->cout_main_oeuvre ?? 0),
            'cout_pieces'       => (float) ($global->cout_pieces ?? 0),
            'cout_total'        => (float) ($global->cout_total ?? 0),
            'par_nature'        => $parNature,
            'top_vehicules'     => $topVehicules,
        ]);
    }

    // =========================================================================
    // CRUD — INDEX
    // =========================================================================

    public function index(Request $request): JsonResponse
    {
        $q = $this->baseQuery();

        if ($s = $request->input('search')) {
            $q->where(function ($qb) use ($s) {
                $qb->where('i.vehicule_immatriculation', 'like', "%{$s}%")
                   ->orWhere('i.matricule_demande',      'like', "%{$s}%")
                   ->orWhere('it.nom_externe',            'like', "%{$s}%");
                if (self::colonneExiste('interventions', 'intervenants_noms')) {
                    $qb->orWhere('i.intervenants_noms', 'like', "%{$s}%");
                }
                // Recherche par référence : INT-00012 / INT12 / 12
                if (preg_match('/^INT-?0*(\d+)$/i', trim($s), $m)) {
                    $qb->orWhere('i.id', (int) $m[1]);
                }
            });
        }
        if ($v = $request->input('vehicule'))   $q->where('i.vehicule_immatriculation', $v);
        if ($st = $request->input('statut'))    $q->where('i.statut', $st);
        if ($nat = $request->input('nature'))   $q->where('i.nature_intervention', $nat);
        if ($df = $request->input('date_from')) $q->whereDate('i.date_debut', '>=', $df);
        if ($dt = $request->input('date_to'))   $q->whereDate('i.date_debut', '<=', $dt);

        $q->orderBy('i.date_creation', 'desc');

        $perPage = (int) $request->input('per_page', 25);
        $page    = $request->input('paginate', true);

        if ($page) {
            $paginated = $q->paginate($perPage);
            $role = $this->roleCode();
            return $this->ok([
                'items'        => collect($paginated->items())->map(fn ($r) => $this->format($r, $role))->values(),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ]);
        }

        $role = $this->roleCode();
        return $this->ok(
            $q->get()->map(fn ($r) => $this->format($r, $role))->values()
        );
    }

    // =========================================================================
    // CRUD — SHOW
    // =========================================================================

    public function show(int $id): JsonResponse
    {
        $row = $this->baseQuery()->where('i.id', $id)->first();
        if (!$row) return $this->fail('Intervention introuvable.', 404);
        return $this->ok($this->format($row, $this->roleCode()));
    }

    // =========================================================================
    // CRUD — STORE
    // =========================================================================

    public function store(Request $request): JsonResponse
    {
        if (!$this->canWrite()) {
            return $this->fail('Permissions insuffisantes.', 403);
        }

        $this->normaliserRequete($request);

        $nature = $request->input('nature_intervention', 'interne');

        $rules = [
            'vehicule_immatriculation'     => 'required|string|exists:vehicules,immatriculation',
            'intervenant_id'               => 'nullable|integer',
            'nature_intervention'          => 'required|in:interne,externe',
            'type_intervention'            => 'nullable|string|max:100',
            'resultat'                     => 'nullable|in:' . implode(',', self::RESULTATS),
            'diagnostic'                   => 'nullable|string',   // = « Travaux effectués »
            'notes'                        => 'nullable|string',
            'km_au_moment_intervention'    => 'nullable|integer|min:0',
            'statut_vehicule'              => 'nullable|string|in:' . implode(',', array_keys(self::STATUTS_VEHICULE_MAP)),
            'demandes_ids'                 => 'required|array|min:1',
            'demandes_ids.*'               => 'integer|exists:demandes_intervention,id',
            'pieces_achetees'              => 'nullable|array',
            'pieces_achetees.*.nom'        => 'nullable|string|max:255',
            'pieces_achetees.*.article'    => 'nullable|string|max:255',
            'pieces_achetees.*.quantite'   => 'nullable|numeric|min:0',
            'pieces_achetees.*.prix_unitaire' => 'nullable|numeric|min:0',
            'pieces_achetees.*.montant'    => 'nullable|numeric|min:0',
            'outils_ids'                   => 'nullable|array',

            // Dates d'entrée / sortie garage-atelier (sans heure) : valables pour interne ET externe
            'date_entree_garage'           => 'required|date',
            'date_sortie_garage'           => 'nullable|date|after_or_equal:date_entree_garage',
        ];

        if ($nature === 'interne') {
            // Plus de coût de main d'œuvre interne
            $rules['duree_estimee_heures'] = 'nullable|integer|min:0';
            $rules['prelevements']         = 'nullable|array';
            $rules['achats_caisse']        = 'nullable|array';
        }

        if ($nature === 'externe') {
            $rules['montant_main_oeuvre_prestataire'] = 'nullable|numeric|min:0';
            $rules['montant_pieces_prestataire']      = 'nullable|numeric|min:0';
            $rules['numero_devis_facture']            = 'nullable|string|max:100';
            $rules['garantie_jours']                  = 'nullable|integer|min:0';
            $rules['statut_paiement']                 = 'nullable|in:' . implode(',', self::STATUTS_PAIEMENT);
            $rules['facture']                         = 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120';
        }

        $v = Validator::make($request->all(), $rules, $this->messages());
        if ($v->fails()) {
            return $this->fail('Données invalides.', 422, $v->errors()->toArray());
        }

        $data        = $v->validated();
        $immat       = $data['vehicule_immatriculation'];
        $demandesIds = $data['demandes_ids'];
        $userId      = $this->getAuthUserId();

        // ── Intervenants saisis (obligatoires : mécanicien interne OU prestataire externe)
        $listeIntervenants = $this->normaliserIntervenants($request);
        if ($nature === 'interne' && empty($listeIntervenants)) {
            return $this->fail('Données invalides.', 422, [
                'nom_intervenant' => ['Saisissez au moins un mécanicien / intervenant interne.'],
            ]);
        }
        if ($nature === 'externe' && empty($listeIntervenants)) {
            return $this->fail('Données invalides.', 422, [
                'nom_intervenant' => ['Renseignez le nom du prestataire / garage externe.'],
            ]);
        }

        // ── Facture (externe uniquement)
        $documents     = [];
        $cheminFichier = null;
        if ($nature === 'externe' && $request->hasFile('facture')) {
            $file          = $request->file('facture');
            $cheminFichier = $file->store('interventions_factures', 'public');
            $documents[]   = [
                'type'   => 'facture',
                'nom'    => $file->getClientOriginalName(),
                'chemin' => Storage::url($cheminFichier),
                'date'   => now()->toDateString(),
            ];
        }

        try {
            $interventionId = DB::transaction(function () use ($data, $nature, $immat, $demandesIds, $userId, $listeIntervenants, $documents) {

                $now = now();

                // ── 0. Intervenants → table `intervenants` (+ traçabilité dans `interventions`)
                $idsIntervenants = [];
                $nomsIntervenants = [];
                foreach ($listeIntervenants as $it) {
                    $idsIntervenants[]  = $this->resolveIntervenant($it, $nature === 'externe', $now);
                    $nomsIntervenants[] = $it['nom'];
                }
                $intervenantPrincipal = $idsIntervenants[0]
                    ?? $this->intervenantParDefaut($data['intervenant_id'] ?? null, $nature === 'externe', $now);

                // ── 1. Vérification des demandes (verrouillées pour éviter une double saisie simultanée)
                $demandes = DB::table('demandes_intervention')
                    ->whereIn('id', $demandesIds)
                    ->where('est_supprime', 0)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                foreach ($demandesIds as $did) {
                    $dem = $demandes->get($did);
                    if (!$dem) {
                        throw new \Exception("Demande #{$did} introuvable.");
                    }
                    if ($dem->vehicule_immatriculation !== $immat) {
                        throw new \Exception("Demande #{$did} n'appartient pas au véhicule {$immat}.");
                    }
                    if (($dem->nature_intervention ?? 'interne') !== $nature) {
                        throw new \Exception("La demande {$dem->matricule_demande} est de nature {$dem->nature_intervention} : elle ne peut pas être saisie en {$nature}.");
                    }
                    if (!in_array($dem->statut, ['en_cours', 'en_attente', 'validee', 'approuvee'], true)) {
                        throw new \Exception("La demande {$dem->matricule_demande} a déjà été clôturée ou rejetée ({$dem->statut}).");
                    }
                }

                // ── 2. Km et dates (entrée / sortie garage-atelier, sans heure)
                $kmVehicule     = DB::table('vehicules')->where('immatriculation', $immat)->value('kilometrage');
                $kmIntervention = $data['km_au_moment_intervention'] ?? $kmVehicule;

                $dateEntree = $data['date_entree_garage'] ?? null;
                $dateSortie = $data['date_sortie_garage'] ?? null;
                $dateDebut  = $dateEntree;
                $dateFin    = $dateSortie;
                $dureeMinutes = self::dureeMinutes($dateEntree, $dateSortie);

                // ── 3. Coûts pièces stock et caisse
                $coutPiecesStock = 0;
                $coutCaisse      = 0;
                $prelevements    = $data['prelevements'] ?? [];
                $achatsCaisse    = $data['achats_caisse'] ?? [];

                if (!empty($data['pieces_achetees'])) {
                    foreach ($data['pieces_achetees'] as $pAch) {
                        $art = $pAch['nom'] ?? $pAch['article'] ?? '';
                        if (!$art) continue;
                        $qte = (float) ($pAch['quantite'] ?? 1);
                        $pu  = (float) ($pAch['prix_unitaire'] ?? 0);
                        $mt  = (float) ($pAch['montant'] ?? ($qte * $pu));
                        $achatsCaisse[] = [
                            'article'        => $art,
                            'quantite'       => $qte,
                            'prix_unitaire'  => $pu,
                            'montant'        => $mt,
                            'libelle'        => "Achat pièce: {$art} (" . ($qte > 1 ? "{$qte} x " : '') . number_format($pu, 0, '', ' ') . " XAF)",
                            'fournisseur_id' => $pAch['fournisseur_id'] ?? null,
                        ];
                    }
                }

                foreach ($prelevements as $prel) {
                    if (empty($prel['piece_id'])) continue;
                    $piece = DB::table('pieces_detachees')
                        ->where('id', $prel['piece_id'])
                        ->lockForUpdate()
                        ->first();

                    if (!$piece) continue;

                    $qtePrel = (float) ($prel['quantite'] ?? 1);
                    if ($qtePrel > (float) $piece->quantite_stock) {
                        throw new \Exception("Stock insuffisant pour « {$piece->nom} » : disponible {$piece->quantite_stock}, demandé {$qtePrel}.");
                    }

                    $pu = $prel['prix_unitaire'] ?? $piece->prix_unitaire;
                    $coutPiecesStock += $qtePrel * $pu;
                }

                foreach ($achatsCaisse as $achat) {
                    $coutCaisse += (float) ($achat['montant'] ?? 0);
                }

                // Vérification du solde de caisse (plus de dotation automatique)
                if ($coutCaisse > 0) {
                    $solde = $this->getSoldeCaisseActuel();
                    if ($coutCaisse > $solde) {
                        throw new \Exception(
                            'Solde de caisse insuffisant : disponible ' . number_format($solde, 0, ',', ' ')
                            . ' XAF, achats à enregistrer ' . number_format($coutCaisse, 0, ',', ' ')
                            . ' XAF. Approvisionnez la caisse d\'abord.'
                        );
                    }
                }

                $coutPiecesPrestataire = $nature === 'externe'
                    ? (float) ($data['montant_pieces_prestataire'] ?? 0)
                    : 0;

                $totalCoutPieces = $coutPiecesStock + $coutCaisse + $coutPiecesPrestataire;

                // Coût MO : interne = non applicable (0) ; externe = montant prestataire
                $coutMO = $nature === 'externe'
                    ? (float) ($data['montant_main_oeuvre_prestataire'] ?? 0)
                    : 0;

                // ── 4. Statut intervention
                $statut   = 'en_cours';
                $resultat = $data['resultat'] ?? 'en_cours';
                if ($dateFin) {
                    $statut   = 'terminee';
                    $resultat = $data['resultat'] ?? 'resolu';
                }

                $demandePrincipale = $demandes->first();

                // ── 5. Insertion de l'intervention
                $estExterne = ($nature === 'externe');

                $insert = [
                    'demande_id'                => $demandePrincipale->id,
                    'matricule_demande'         => $demandePrincipale->matricule_demande,
                    'vehicule_immatriculation'  => $immat,
                    'intervenant_id'            => $intervenantPrincipal,
                    'nature_intervention'       => $nature,
                    'type_intervention'         => $data['type_intervention'] ?? $demandePrincipale->type_intervention,
                    'severite'                  => self::SEVERITE_DEFAUT, // champ retiré du formulaire
                    'date_debut'                => $dateDebut,
                    'date_fin'                  => $dateFin,
                    'duree_minutes'             => $dureeMinutes,
                    'duree_estimee_heures'      => $data['duree_estimee_heures'] ?? null,
                    'km_au_moment_intervention' => $kmIntervention,
                    'diagnostic'                => $data['diagnostic'] ?? null,
                    'notes'                     => $data['notes'] ?? null,
                    'resultat'                  => $resultat,
                    'statut'                    => $statut,
                    'cout_main_oeuvre'          => $coutMO,
                    'cout_pieces'               => $totalCoutPieces,
                    'montant_main_oeuvre_prestataire' => $estExterne
                        ? (float) ($data['montant_main_oeuvre_prestataire'] ?? 0)
                        : 0,
                    'montant_pieces_prestataire'      => $estExterne ? $coutPiecesPrestataire : 0,
                    'est_supprime'              => false,
                    'date_creation'             => $now,
                    'date_modification'         => $now,
                ];

                $facultatives = [
                    'date_entree_garage'   => $dateEntree,
                    'date_sortie_garage'   => $dateSortie,
                    'numero_devis_facture' => $data['numero_devis_facture'] ?? null,
                    'garantie_jours'       => $data['garantie_jours'] ?? null,
                    'statut_paiement'      => $data['statut_paiement'] ?? null,
                    'documents'            => $documents ? json_encode($documents) : null,
                ];
                if (self::colonneExiste('interventions', 'intervenants_noms')) {
                    $facultatives['intervenants_noms'] = $nomsIntervenants ? implode(', ', $nomsIntervenants) : null;
                }
                foreach ($facultatives as $col => $val) {
                    if ($val !== null && $val !== '') {
                        $insert[$col] = $val;
                    }
                }

                $iId = DB::table('interventions')->insertGetId($insert);

                // ── 6. Pivot intervention_demandes
                foreach ($demandesIds as $idx => $did) {
                    DB::table('intervention_demandes')->insert([
                        'intervention_id'   => $iId,
                        'demande_id'        => $did,
                        'matricule_demande' => $demandes->get($did)->matricule_demande,
                        'est_principale'    => ($idx === 0),
                        'date_creation'     => $now,
                    ]);
                }

                // ── 7. Prélèvements stock
                foreach ($prelevements as $prel) {
                    if (empty($prel['piece_id'])) continue;

                    $piece = DB::table('pieces_detachees')
                        ->where('id', $prel['piece_id'])
                        ->lockForUpdate()
                        ->first();
                    if (!$piece) continue;

                    $pu = $prel['prix_unitaire'] ?? $piece->prix_unitaire;

                    DB::table('mouvements_stock')->insert([
                        'piece_id'             => $prel['piece_id'],
                        'type_mouvement'       => 'sortie',
                        'quantite'             => $prel['quantite'],
                        'prix_unitaire'        => $pu,
                        'type_reference'       => 'intervention',
                        'reference_id'         => $iId,
                        'effectue_par_user_id' => $userId,
                        'notes'                => $prel['notes'] ?? null,
                        'date_creation'        => $now,
                    ]);

                    $newQty = $piece->quantite_stock - $prel['quantite'];
                    DB::table('pieces_detachees')
                        ->where('id', $prel['piece_id'])
                        ->update([
                            'quantite_stock'    => $newQty,
                            'date_modification' => $now,
                        ]);
                }

                // ── 8. Sorties caisse (les dépenses de l'intervention sont tracées ici)
                if (!empty($achatsCaisse)) {
                    $periodeId = $this->getOuCrerPeriodeCaisse();

                    foreach ($achatsCaisse as $achat) {
                        $solde = DB::table('mouvements_caisse')
                            ->orderBy('id', 'desc')
                            ->lockForUpdate()
                            ->value('solde_apres') ?? 0;

                        $soldeApres = $solde - $achat['montant'];

                        DB::table('mouvements_caisse')->insert([
                            'periode_caisse_id'        => $periodeId,
                            'type_mouvement'           => 'sortie',
                            'montant'                  => $achat['montant'],
                            'solde_apres'              => $soldeApres,
                            'libelle'                  => $achat['libelle'] ?? $achat['article'],
                            'article'                  => $achat['article'] ?? null,
                            'fournisseur_id'           => $achat['fournisseur_id'] ?? null,
                            'vehicule_immatriculation' => $immat,
                            'intervention_id'          => $iId,
                            'piece_id'                 => $achat['piece_id'] ?? null,
                            'chemin_justificatif'      => $achat['chemin_justificatif'] ?? null,
                            'est_annule'               => false,
                            'cree_par_user_id'         => $userId,
                            'date_mouvement'           => $now,
                            'date_creation'            => $now,
                        ]);
                    }
                }

                // ── 9. Outils utilisés
                $outilsData = $data['outils_ids'] ?? [];
                foreach ($outilsData as $outilItem) {
                    if (is_array($outilItem)) {
                        $outilId  = (int) ($outilItem['outil_id'] ?? $outilItem['id'] ?? 0);
                        $qte      = max(1, (int) ($outilItem['quantite'] ?? 1));
                        $notesOut = $outilItem['notes'] ?? null;
                    } else {
                        $outilId  = (int) $outilItem;
                        $qte      = 1;
                        $notesOut = null;
                    }
                    if (!$outilId) continue;

                    DB::table('outils_intervention')->insertOrIgnore([
                        'intervention_id' => $iId,
                        'outil_id'        => $outilId,
                        'quantite'        => $qte,
                        'notes'           => $notesOut,
                        'date_creation'   => $now,
                    ]);

                    DB::table('outils')
                        ->where('id', $outilId)
                        ->update(['quantite_stock' => DB::raw("GREATEST(0, quantite_stock - {$qte})")]);
                }

                // ── 10. Demandes → « traitee »
                DB::table('demandes_intervention')
                    ->whereIn('id', $demandesIds)
                    ->update(['statut' => 'traitee', 'date_modification' => $now]);

                // ── 11. Statut véhicule (choix manuel prioritaire) et km
                if (!empty($data['statut_vehicule'])) {
                    $this->appliquerStatutVehiculeChoisi($immat, $data['statut_vehicule'], $now);
                } else {
                    $this->updateStatutVehicule($immat, $statut, $iId, $now);
                }

                if ($kmIntervention && $kmIntervention > ($kmVehicule ?? 0)) {
                    DB::table('vehicules')
                        ->where('immatriculation', $immat)
                        ->update(['kilometrage' => $kmIntervention, 'date_maj_km' => now()->toDateString()]);

                    DB::table('historique_kilometrage')->insert([
                        'vehicule_immatriculation' => $immat,
                        'kilometrage'              => $kmIntervention,
                        'date_relevee'             => now()->toDateString(),
                        'source'                   => 'intervention',
                        'source_id'                => $iId,
                        'enregistre_par_user_id'   => $userId,
                    ]);
                }

                // ── 12. KPI
                if ($statut === 'terminee' && $dateFin) {
                    $this->recalculerKpi($immat, $dateFin);
                }

                // ── 13. Journal audit
                JournalAudit::tracer(
                    $userId, 'CREATE', 'interventions', (string) $iId,
                    null,
                    [
                        'nature'          => $nature,
                        'immat'           => $immat,
                        'demandes'        => $demandesIds,
                        'statut'          => $statut,
                        'statut_vehicule' => $data['statut_vehicule'] ?? null,
                        'intervenants'    => $nomsIntervenants,
                        'facture'         => !empty($documents),
                    ],
                    "Création intervention #{$iId} ({$nature}) pour {$immat}"
                );

                return $iId;
            });

            $row = $this->baseQuery()->where('i.id', $interventionId)->first();
            return $this->ok($this->format($row, $this->roleCode()), 'Intervention créée avec succès.', 201);

        } catch (\Exception $e) {
            // Nettoyage du fichier uploadé si la transaction a échoué
            if ($cheminFichier) Storage::disk('public')->delete($cheminFichier);
            Log::error('[InterventionController::store] ' . $e->getMessage());
            return $this->fail($e->getMessage(), 422);
        }
    }

    // =========================================================================
    // CRUD — UPDATE
    // =========================================================================

    public function update(Request $request, int $id): JsonResponse
    {
        $row = DB::table('interventions')->where('id', $id)->where('est_supprime', 0)->first();
        if (!$row) return $this->fail('Intervention introuvable.', 404);

        $isTerminee = ($row->statut === 'terminee');
        if ($isTerminee && !$this->canEditTerminee()) {
            return $this->fail("Seuls l'administrateur et le DAAL peuvent modifier une intervention terminée.", 403);
        }
        if (!$this->canWrite()) {
            return $this->fail('Permissions insuffisantes.', 403);
        }

        $this->normaliserRequete($request);

        $nature = $row->nature_intervention ?? 'interne';

        $rules = [
            'intervenant_id'            => 'sometimes|integer|exists:intervenants,id',
            'type_intervention'         => 'nullable|string|max:100',
            'resultat'                  => 'nullable|in:' . implode(',', self::RESULTATS),
            'diagnostic'                => 'nullable|string',   // = « Travaux effectués »
            'notes'                     => 'nullable|string',
            'statut'                    => 'sometimes|in:' . implode(',', self::STATUTS),
            'statut_vehicule'           => 'nullable|string|in:' . implode(',', array_keys(self::STATUTS_VEHICULE_MAP)),
            'km_au_moment_intervention' => 'nullable|integer|min:0',
            'date_entree_garage'        => 'sometimes|date',
            'date_sortie_garage'        => 'nullable|date',
        ];

        if ($nature === 'interne') {
            $rules['duree_estimee_heures'] = 'nullable|integer|min:0';
        } else {
            $rules['montant_main_oeuvre_prestataire'] = 'nullable|numeric|min:0';
            $rules['montant_pieces_prestataire']      = 'nullable|numeric|min:0';
            $rules['numero_devis_facture']            = 'nullable|string|max:100';
            $rules['garantie_jours']                  = 'nullable|integer|min:0';
            $rules['statut_paiement']                 = 'nullable|in:' . implode(',', self::STATUTS_PAIEMENT);
            $rules['facture']                         = 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120';
        }

        $v = Validator::make($request->all(), $rules, $this->messages());
        if ($v->fails()) return $this->fail('Données invalides.', 422, $v->errors()->toArray());

        $data  = $v->validated();
        $now   = now();
        $immat = $row->vehicule_immatriculation;

        // Une date de sortie saisie sur une réparation en cours la termine
        if (!isset($data['statut']) && $row->statut === 'en_cours' && !empty($data['date_sortie_garage'])) {
            $data['statut'] = 'terminee';
        }
        if (($data['statut'] ?? null) === 'terminee'
            && empty($data['resultat'])
            && in_array($row->resultat, [null, 'en_attente', 'en_cours'], true)) {
            $data['resultat'] = 'resolu';
        }

        // Cohérence des dates (entrée ≤ sortie) en tenant compte des valeurs existantes
        $entreeFinale = $data['date_entree_garage'] ?? self::jour($row->date_entree_garage ?? $row->date_debut);
        $sortieFinale = array_key_exists('date_sortie_garage', $data)
            ? $data['date_sortie_garage']
            : self::jour($row->date_sortie_garage ?? $row->date_fin);
        if ($entreeFinale && $sortieFinale && $sortieFinale < $entreeFinale) {
            return $this->fail('Données invalides.', 422, [
                'date_sortie_garage' => ["La date de sortie doit être postérieure ou égale à la date d'entrée."],
            ]);
        }

        // Intervenants saisis (si renvoyés)
        $listeIntervenants = $this->normaliserIntervenants($request);

        // Facture (externe)
        $nouvelleFacture = null;
        $cheminFichier   = null;
        if ($nature === 'externe' && $request->hasFile('facture')) {
            $file            = $request->file('facture');
            $cheminFichier   = $file->store('interventions_factures', 'public');
            $nouvelleFacture = [
                'type'   => 'facture',
                'nom'    => $file->getClientOriginalName(),
                'chemin' => Storage::url($cheminFichier),
                'date'   => now()->toDateString(),
            ];
        }

        try {
            DB::transaction(function () use ($id, $data, $row, $nature, $immat, $now, $request, $listeIntervenants, $nouvelleFacture) {
                $updates = array_intersect_key($data, array_flip([
                    'type_intervention', 'resultat', 'diagnostic', 'notes', 'statut',
                    'km_au_moment_intervention', 'duree_estimee_heures',
                    'date_entree_garage', 'date_sortie_garage',
                    'montant_main_oeuvre_prestataire', 'montant_pieces_prestataire',
                    'numero_devis_facture', 'garantie_jours', 'statut_paiement',
                ]));

                // date_debut / date_fin suivent date_entree / date_sortie
                if (array_key_exists('date_entree_garage', $data)) $updates['date_debut'] = $data['date_entree_garage'];
                if (array_key_exists('date_sortie_garage', $data)) $updates['date_fin']   = $data['date_sortie_garage'];

                // Intervenants saisis → table intervenants + traçabilité
                if (!empty($listeIntervenants)) {
                    $ids = []; $noms = [];
                    foreach ($listeIntervenants as $it) {
                        $ids[]  = $this->resolveIntervenant($it, $nature === 'externe', $now);
                        $noms[] = $it['nom'];
                    }
                    $updates['intervenant_id'] = $ids[0];
                    if (self::colonneExiste('interventions', 'intervenants_noms')) {
                        $updates['intervenants_noms'] = implode(', ', $noms);
                    }
                } elseif (isset($data['intervenant_id'])) {
                    $updates['intervenant_id'] = $data['intervenant_id'];
                }

                // Facture
                if ($nouvelleFacture) {
                    $docs = $row->documents ? (json_decode($row->documents, true) ?: []) : [];
                    $docs = array_values(array_filter($docs, fn ($d) => ($d['type'] ?? null) !== 'facture'));
                    $docs[] = $nouvelleFacture;
                    $updates['documents'] = json_encode($docs);
                }

                // Recalcul durée (dates seules)
                $debut = $updates['date_debut'] ?? $row->date_debut;
                $fin   = array_key_exists('date_fin', $updates) ? $updates['date_fin'] : $row->date_fin;
                $duree = self::dureeMinutes($debut, $fin);
                if ($duree !== null) $updates['duree_minutes'] = $duree;

                $updates['date_modification'] = $now;
                DB::table('interventions')->where('id', $id)->update($updates);

                // Coûts cohérents (pièces stock + caisse + prestataire, MO prestataire)
                $this->recalculerCouts($id);

                // Statut véhicule : choix manuel prioritaire, sinon règle automatique
                $newStatut = $data['statut'] ?? $row->statut;
                if (!empty($data['statut_vehicule'])) {
                    $this->appliquerStatutVehiculeChoisi($immat, $data['statut_vehicule'], $now);
                } elseif ($newStatut !== $row->statut) {
                    $this->updateStatutVehicule($immat, $newStatut, $id, $now);
                }

                // Kilométrage du véhicule (comme à la création : seulement s'il augmente)
                $kmSaisi = (int) ($data['km_au_moment_intervention'] ?? 0);
                if ($kmSaisi > 0) {
                    $kmVehicule = (int) DB::table('vehicules')->where('immatriculation', $immat)->value('kilometrage');
                    if ($kmSaisi > $kmVehicule) {
                        DB::table('vehicules')->where('immatriculation', $immat)
                            ->update(['kilometrage' => $kmSaisi, 'date_maj_km' => now()->toDateString()]);
                        DB::table('historique_kilometrage')->insert([
                            'vehicule_immatriculation' => $immat,
                            'kilometrage'              => $kmSaisi,
                            'date_relevee'             => now()->toDateString(),
                            'source'                   => 'intervention',
                            'source_id'                => $id,
                            'enregistre_par_user_id'   => $this->getAuthUserId(),
                        ]);
                    }
                }

                // KPI : recalculé dès que l'intervention est terminée (y compris après correction par admin / DAAL)
                if ($newStatut === 'terminee') {
                    $dateFin = $data['date_sortie_garage'] ?? $row->date_fin;
                    if ($dateFin) $this->recalculerKpi($immat, $dateFin);
                }

                // Outils (« outils_vide » : un envoi multipart ne transporte pas un tableau vide)
                if ($request->has('outils_ids') || $request->boolean('outils_vide')) {
                    $anciensOutils = DB::table('outils_intervention')->where('intervention_id', $id)->get();
                    foreach ($anciensOutils as $ao) {
                        DB::table('outils')
                            ->where('id', $ao->outil_id)
                            ->increment('quantite_stock', (int) ($ao->quantite ?? 1));
                    }
                    DB::table('outils_intervention')->where('intervention_id', $id)->delete();

                    $nouveauxOutils = $request->input('outils_ids', []);
                    if (!is_array($nouveauxOutils)) $nouveauxOutils = [];
                    foreach ($nouveauxOutils as $outilItem) {
                        if (is_array($outilItem)) {
                            $outilId  = (int) ($outilItem['outil_id'] ?? $outilItem['id'] ?? 0);
                            $qte      = max(1, (int) ($outilItem['quantite'] ?? 1));
                            $notesOut = $outilItem['notes'] ?? null;
                        } else {
                            $outilId  = (int) $outilItem;
                            $qte      = 1;
                            $notesOut = null;
                        }
                        if (!$outilId) continue;

                        DB::table('outils_intervention')->insert([
                            'intervention_id' => $id,
                            'outil_id'        => $outilId,
                            'quantite'        => $qte,
                            'notes'           => $notesOut,
                            'date_creation'   => $now,
                        ]);
                        DB::table('outils')
                            ->where('id', $outilId)
                            ->update(['quantite_stock' => DB::raw("GREATEST(0, quantite_stock - {$qte})")]);
                    }
                }

                JournalAudit::tracer(
                    $this->getAuthUserId(), 'UPDATE', 'interventions', (string) $id,
                    (array) $row, $updates,
                    "Modification intervention #{$id} ({$nature}) {$immat}"
                );
            });

            $updated = $this->baseQuery()->where('i.id', $id)->first();
            return $this->ok($this->format($updated, $this->roleCode()), 'Intervention mise à jour.');

        } catch (\Exception $e) {
            if ($cheminFichier) Storage::disk('public')->delete($cheminFichier);
            Log::error('[InterventionController::update] ' . $e->getMessage());
            return $this->fail($e->getMessage(), 422);
        }
    }

    // =========================================================================
    // CRUD — DESTROY (soft delete + contre-passation)
    // =========================================================================

    public function destroy(int $id): JsonResponse
    {
        $row = DB::table('interventions')->where('id', $id)->where('est_supprime', 0)->first();
        if (!$row) return $this->fail('Intervention introuvable.', 404);
        if (!$this->canWrite()) return $this->fail('Permissions insuffisantes.', 403);

        $immat  = $row->vehicule_immatriculation;
        $nature = $row->nature_intervention ?? 'interne';
        $now    = now();

        try {
            DB::transaction(function () use ($id, $row, $immat, $nature, $now) {

                // 1. Retour des pièces en stock
                $sorties = DB::table('mouvements_stock')
                    ->where('type_reference', 'intervention')
                    ->where('reference_id', $id)
                    ->where('type_mouvement', 'sortie')
                    ->get();

                foreach ($sorties as $s) {
                    DB::table('mouvements_stock')->insert([
                        'piece_id'       => $s->piece_id,
                        'type_mouvement' => 'retour',
                        'quantite'       => $s->quantite,
                        'prix_unitaire'  => $s->prix_unitaire,
                        'type_reference' => 'intervention_annulation',
                        'reference_id'   => $id,
                        'notes'          => "Retour suite annulation intervention #{$id}",
                        'date_creation'  => $now,
                    ]);
                    DB::table('pieces_detachees')
                        ->where('id', $s->piece_id)
                        ->increment('quantite_stock', $s->quantite);
                }

                // 2. Contre-passation des sorties caisse
                $sortiesCaisse = DB::table('mouvements_caisse')
                    ->where('intervention_id', $id)
                    ->where('type_mouvement', 'sortie')
                    ->where('est_annule', 0)
                    ->get();

                $periodeIdCaisse = $sortiesCaisse->isNotEmpty() ? $this->getOuCrerPeriodeCaisse() : null;

                foreach ($sortiesCaisse as $mc) {
                    $solde = DB::table('mouvements_caisse')->orderBy('id', 'desc')->lockForUpdate()->value('solde_apres') ?? 0;
                    $contreId = DB::table('mouvements_caisse')->insertGetId([
                        'periode_caisse_id'        => $periodeIdCaisse,
                        'type_mouvement'           => 'contre_passation',
                        'montant'                  => $mc->montant,
                        'solde_apres'              => $solde + $mc->montant,
                        'libelle'                  => "Contre-passation annulation intervention #{$id}",
                        'vehicule_immatriculation' => $immat,
                        'intervention_id'          => $id,
                        'est_annule'               => false,
                        'cree_par_user_id'         => $this->getAuthUserId(),
                        'date_mouvement'           => $now,
                        'date_creation'            => $now,
                    ]);
                    DB::table('mouvements_caisse')->where('id', $mc->id)->update([
                        'est_annule'              => true,
                        'annule_par_mouvement_id' => $contreId,
                    ]);
                }

                // 3. Restauration des outils
                $outilsUtilises = DB::table('outils_intervention')
                    ->where('intervention_id', $id)
                    ->get();
                foreach ($outilsUtilises as $ou) {
                    DB::table('outils')
                        ->where('id', $ou->outil_id)
                        ->increment('quantite_stock', (int) ($ou->quantite ?? 1));
                }

                // 4. Demandes → en_attente
                $demandesIds = DB::table('intervention_demandes')
                    ->where('intervention_id', $id)
                    ->pluck('demande_id');
                DB::table('demandes_intervention')
                    ->whereIn('id', $demandesIds)
                    ->update(['statut' => 'en_attente', 'date_modification' => $now]);

                // 5. Soft delete
                DB::table('interventions')->where('id', $id)->update([
                    'est_supprime'     => true,
                    'date_suppression' => $now,
                    'date_modification'=> $now,
                ]);

                // 6. Statut véhicule + KPI
                $this->updateStatutVehicule($immat, 'annulee', $id, $now);
                if ($row->date_fin) $this->recalculerKpi($immat, $row->date_fin);

                JournalAudit::tracer(
                    $this->getAuthUserId(), 'DELETE', 'interventions', (string) $id,
                    (array) $row, null,
                    "Suppression (soft) intervention #{$id} ({$nature}) {$immat}"
                );
            });

            return $this->ok(null, 'Intervention supprimée avec succès (stock et caisse contre-passés).');

        } catch (\Exception $e) {
            Log::error('[InterventionController::destroy] ' . $e->getMessage());
            return $this->fail($e->getMessage(), 422);
        }
    }

    // =========================================================================
    // PATCH STATUT
    // =========================================================================

    public function updateStatut(Request $request, int $id): JsonResponse
    {
        if (!$this->canWrite()) return $this->fail('Permissions insuffisantes.', 403);

        $row = DB::table('interventions')->where('id', $id)->where('est_supprime', 0)->first();
        if (!$row) return $this->fail('Intervention introuvable.', 404);

        $v = Validator::make($request->all(), [
            'statut'             => 'required|in:' . implode(',', self::STATUTS),
            'resultat'           => 'nullable|in:' . implode(',', self::RESULTATS),
            'notes'              => 'nullable|string',
            'date_fin'           => 'nullable|date',
            'date_sortie_garage' => 'nullable|date',
            'statut_vehicule'    => 'nullable|string|in:' . implode(',', array_keys(self::STATUTS_VEHICULE_MAP)),
        ]);
        if ($v->fails()) return $this->fail('Statut invalide.', 422, $v->errors()->toArray());

        $newStatut = $request->input('statut');
        $now       = now();
        $immat     = $row->vehicule_immatriculation;

        $updates = ['statut' => $newStatut, 'date_modification' => $now];
        $dateFin = $row->date_fin;

        if ($request->filled('resultat')) {
            $updates['resultat'] = $request->input('resultat');
        }

        if ($request->filled('notes')) {
            $noteCloture = trim((string) $request->input('notes'));
            $updates['notes'] = $row->notes ? $row->notes . "\n\nClôture : " . $noteCloture : $noteCloture;
        }

        if ($newStatut === 'terminee') {
            // Date de sortie du garage / atelier (sans heure), identique pour interne et externe
            $sortie = $request->filled('date_sortie_garage')
                ? self::jour($request->input('date_sortie_garage'))
                : ($request->filled('date_fin')
                    ? self::jour($request->input('date_fin'))
                    : (self::jour($row->date_sortie_garage ?? null) ?: (self::jour($row->date_fin) ?: $now->toDateString())));

            $debut = self::jour($row->date_entree_garage ?? null) ?: self::jour($row->date_debut);
            if ($debut && $sortie < $debut) $sortie = $debut;

            $updates['date_sortie_garage'] = $sortie;
            $updates['date_fin']           = $sortie;
            $dateFin = $sortie;

            $duree = self::dureeMinutes($debut, $sortie);
            if ($duree !== null) $updates['duree_minutes'] = $duree;

            if (!isset($updates['resultat']) && in_array($row->resultat, [null, 'en_attente', 'en_cours'], true)) {
                $updates['resultat'] = 'resolu';
            }
        }

        DB::table('interventions')->where('id', $id)->update($updates);

        if ($request->filled('statut_vehicule')) {
            $this->appliquerStatutVehiculeChoisi($immat, $request->input('statut_vehicule'), $now);
        } else {
            $this->updateStatutVehicule($immat, $newStatut, $id, $now);
        }

        if ($newStatut === 'terminee' && $dateFin) {
            $this->recalculerKpi($immat, $dateFin);
        }

        JournalAudit::tracer(
            $this->getAuthUserId(), 'UPDATE', 'interventions', (string) $id,
            ['statut' => $row->statut, 'resultat' => $row->resultat, 'date_fin' => $row->date_fin],
            array_intersect_key($updates, array_flip(['statut', 'resultat', 'date_fin', 'date_sortie_garage'])),
            "Changement statut intervention #{$id} → {$newStatut}"
        );

        $updated = $this->baseQuery()->where('i.id', $id)->first();
        return $this->ok($this->format($updated, $this->roleCode()), 'Statut mis à jour.');
    }

    // =========================================================================
    // CAISSE — SOLDE ET STATS COURANTES
    // =========================================================================

    /**
     * GET /admin/caisse/solde
     */
    public function caisseSolde(): JsonResponse
    {
        $solde = $this->getSoldeCaisseActuel();
        $now   = now();

        $statsMois = DB::table('mouvements_caisse')
            ->whereYear('date_mouvement', $now->year)
            ->whereMonth('date_mouvement', $now->month)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type_mouvement = 'approvisionnement' THEN montant ELSE 0 END), 0) as total_entrees,
                COALESCE(SUM(CASE WHEN type_mouvement = 'sortie' THEN montant ELSE 0 END), 0) as total_sorties,
                COUNT(*) as nb_mouvements
            ")
            ->first();

        $periode = DB::table('periodes_caisse')
            ->where('annee', $now->year)
            ->where('mois', $now->month)
            ->first();

        return $this->ok([
            'solde_actuel'       => $solde,
            'entrees_mois'       => (float) ($statsMois->total_entrees ?? 0),
            'sorties_mois'       => (float) ($statsMois->total_sorties ?? 0),
            'nb_mouvements_mois' => (int) ($statsMois->nb_mouvements ?? 0),
            'periode'            => [
                'annee'           => $now->year,
                'mois'            => $now->month,
                'solde_ouverture' => (float) ($periode->solde_ouverture ?? 0),
                'est_cloture'     => (bool) ($periode->est_cloture ?? false),
            ],
        ]);
    }

    // =========================================================================
    // CAISSE — LISTE DES MOUVEMENTS
    // =========================================================================

    /**
     * GET /admin/caisse/mouvements
     */
    public function caisseMouvements(Request $request): JsonResponse
    {
        $query = DB::table('mouvements_caisse as mc')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'mc.cree_par_user_id')
            ->leftJoin('fournisseurs as f', 'f.id', '=', 'mc.fournisseur_id')
            ->leftJoin('interventions as i', 'i.id', '=', 'mc.intervention_id')
            ->select(
                'mc.id',
                'mc.periode_caisse_id',
                'mc.type_mouvement',
                'mc.montant',
                'mc.solde_apres',
                'mc.libelle',
                'mc.article',
                'mc.fournisseur_id',
                'f.nom as fournisseur_nom',
                'mc.vehicule_immatriculation',
                'mc.intervention_id',
                'i.nature_intervention',
                'mc.piece_id',
                'mc.chemin_justificatif',
                'mc.est_annule',
                'mc.annule_par_mouvement_id',
                'mc.cree_par_user_id',
                'u.nom as auteur_nom',
                'mc.date_mouvement',
                'mc.date_creation'
            );

        if ($type = $request->input('type_mouvement')) {
            $query->where('mc.type_mouvement', $type);
        }

        if ($immat = $request->input('vehicule_immatriculation')) {
            $query->where('mc.vehicule_immatriculation', 'like', "%{$immat}%");
        }

        if ($intervId = $request->input('intervention_id')) {
            $query->where('mc.intervention_id', (int) $intervId);
        }

        if ($annee = $request->input('annee')) {
            $query->whereYear('mc.date_mouvement', (int) $annee);
        }

        if ($mois = $request->input('mois')) {
            $query->whereMonth('mc.date_mouvement', (int) $mois);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('mc.libelle', 'like', "%{$search}%")
                  ->orWhere('mc.article', 'like', "%{$search}%")
                  ->orWhere('mc.vehicule_immatriculation', 'like', "%{$search}%");
            });
        }

        $query->orderBy('mc.id', 'desc');

        $perPage   = max(1, min(100, (int) $request->input('per_page', 25)));
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'solde_caisse' => $this->getSoldeCaisseActuel(),
            ],
        ]);
    }

    // =========================================================================
    // CAISSE — APPROVISIONNEMENT
    // =========================================================================

    /**
     * POST /admin/caisse/approvisionnement
     */
    public function caisseApprovisionnement(Request $request): JsonResponse
    {
        if (!$this->canManageCaisse()) {
            return $this->fail('Permissions insuffisantes pour approvisionner la caisse.', 403);
        }

        $validator = Validator::make($request->all(), [
            'montant'      => 'required|numeric|min:1',
            'libelle'      => 'required|string|max:255',
            'article'      => 'nullable|string|max:1000',
            'justificatif' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ], [
            'montant.required' => 'Le montant est obligatoire.',
            'montant.numeric'  => 'Le montant doit être un nombre.',
            'montant.min'      => 'Le montant doit être supérieur à zéro.',
            'libelle.required' => 'Le libellé est obligatoire.',
        ]);

        if ($validator->fails()) {
            return $this->fail('Données invalides', 422, $validator->errors()->toArray());
        }

        $userId  = $this->getAuthUserId();
        $montant = (float) $request->input('montant');
        $libelle = trim($request->input('libelle'));
        $article = $request->input('article');

        $cheminDoc = null;
        if ($request->hasFile('justificatif')) {
            $path      = $request->file('justificatif')->store('caisse_justificatifs', 'public');
            $cheminDoc = Storage::url($path);
        }

        try {
            $resultat = DB::transaction(function () use ($montant, $libelle, $article, $cheminDoc, $userId) {
                $periodeId = $this->getOuCrerPeriodeCaisse();

                $soldeActuel = DB::table('mouvements_caisse')
                    ->where('est_annule', 0)
                    ->orderBy('id', 'desc')
                    ->lockForUpdate()
                    ->value('solde_apres') ?? 0;

                $nouveauSolde = $soldeActuel + $montant;

                $id = DB::table('mouvements_caisse')->insertGetId([
                    'periode_caisse_id'   => $periodeId,
                    'type_mouvement'      => 'approvisionnement',
                    'montant'             => $montant,
                    'solde_apres'         => $nouveauSolde,
                    'libelle'             => $libelle,
                    'article'             => $article,
                    'chemin_justificatif' => $cheminDoc,
                    'est_annule'          => false,
                    'cree_par_user_id'    => $userId,
                    'date_mouvement'      => now(),
                    'date_creation'       => now(),
                ]);

                return ['id' => $id, 'solde_avant' => (float) $soldeActuel, 'solde_apres' => (float) $nouveauSolde];
            });

            JournalAudit::tracer(
                $userId, 'CREATE', 'mouvements_caisse', (string) $resultat['id'],
                null,
                ['type_mouvement' => 'approvisionnement', 'montant' => $montant, 'libelle' => $libelle, 'solde_apres' => $resultat['solde_apres']],
                "Approvisionnement de la caisse : +" . number_format($montant, 0, ',', ' ') . " XAF ({$libelle})"
            );

            return $this->ok([
                'id'           => $resultat['id'],
                'solde_caisse' => $this->getSoldeCaisseActuel(),
            ], 'Caisse approvisionnée avec succès.', 201);
        } catch (\Exception $e) {
            Log::error('[InterventionController::caisseApprovisionnement] ' . $e->getMessage());
            return $this->fail('Erreur lors de l\'approvisionnement : ' . $e->getMessage(), 500);
        }
    }

    // =========================================================================
    // CAISSE — SORTIE MANUELLE
    // (conservée côté API ; l'onglet « Nouvelle dépense » est retiré côté front,
    //  les dépenses passent par l'ajout d'une intervention)
    // =========================================================================

    /**
     * POST /admin/caisse/sortie
     */
    public function caisseSortie(Request $request): JsonResponse
    {
        if (!$this->canManageCaisse()) {
            return $this->fail('Permissions insuffisantes pour enregistrer une sortie.', 403);
        }

        $validator = Validator::make($request->all(), [
            'montant'                  => 'required|numeric|min:1',
            'libelle'                  => 'required|string|max:255',
            'article'                  => 'nullable|string|max:1000',
            'vehicule_immatriculation' => 'nullable|string|max:30|exists:vehicules,immatriculation',
            'fournisseur_id'           => 'nullable|integer|exists:fournisseurs,id',
            'piece_id'                 => 'nullable|integer|exists:pieces_detachees,id',
            'justificatif'             => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ], [
            'montant.required' => 'Le montant est obligatoire.',
            'montant.min'      => 'Le montant doit être supérieur à zéro.',
            'libelle.required' => 'Le libellé est obligatoire.',
        ]);

        if ($validator->fails()) {
            return $this->fail('Données invalides', 422, $validator->errors()->toArray());
        }

        $montant = (float) $request->input('montant');
        $solde   = $this->getSoldeCaisseActuel();
        if ($solde < $montant) {
            return $this->fail("Solde insuffisant : disponible {$solde} XAF, demandé {$montant} XAF.", 422);
        }

        $userId    = $this->getAuthUserId();
        $cheminDoc = null;
        if ($request->hasFile('justificatif')) {
            $path      = $request->file('justificatif')->store('caisse_justificatifs', 'public');
            $cheminDoc = Storage::url($path);
        }

        try {
            $resultat = DB::transaction(function () use ($montant, $request, $cheminDoc, $userId) {
                $periodeId = $this->getOuCrerPeriodeCaisse();

                $soldeActuel = DB::table('mouvements_caisse')
                    ->where('est_annule', 0)
                    ->orderBy('id', 'desc')
                    ->lockForUpdate()
                    ->value('solde_apres') ?? 0;

                if ($soldeActuel < $montant) {
                    throw new \Exception("Solde insuffisant ({$soldeActuel} XAF).");
                }

                $nouveauSolde = $soldeActuel - $montant;

                $id = DB::table('mouvements_caisse')->insertGetId([
                    'periode_caisse_id'        => $periodeId,
                    'type_mouvement'           => 'sortie',
                    'montant'                  => $montant,
                    'solde_apres'              => $nouveauSolde,
                    'libelle'                  => trim($request->input('libelle')),
                    'article'                  => $request->input('article'),
                    'fournisseur_id'           => $request->input('fournisseur_id'),
                    'vehicule_immatriculation' => $request->input('vehicule_immatriculation'),
                    'piece_id'                 => $request->input('piece_id'),
                    'chemin_justificatif'      => $cheminDoc,
                    'est_annule'               => false,
                    'cree_par_user_id'         => $userId,
                    'date_mouvement'           => now(),
                    'date_creation'            => now(),
                ]);

                return ['id' => $id, 'solde_apres' => (float) $nouveauSolde];
            });

            JournalAudit::tracer(
                $userId, 'CREATE', 'mouvements_caisse', (string) $resultat['id'],
                null,
                [
                    'type_mouvement'           => 'sortie',
                    'montant'                  => $montant,
                    'libelle'                  => trim($request->input('libelle')),
                    'vehicule_immatriculation' => $request->input('vehicule_immatriculation'),
                    'solde_apres'              => $resultat['solde_apres'],
                ],
                "Sortie de caisse : -" . number_format($montant, 0, ',', ' ') . " XAF (" . trim($request->input('libelle')) . ")"
            );

            return $this->ok([
                'id'           => $resultat['id'],
                'solde_caisse' => $this->getSoldeCaisseActuel(),
            ], 'Sortie de caisse enregistrée avec succès.', 201);
        } catch (\Exception $e) {
            Log::error('[InterventionController::caisseSortie] ' . $e->getMessage());
            return $this->fail('Erreur lors de la sortie : ' . $e->getMessage(), 500);
        }
    }

    // =========================================================================
    // CAISSE — ANNULATION PAR CONTRE-PASSATION
    // =========================================================================

    /**
     * POST /admin/caisse/mouvements/{id}/annuler
     */
    public function caisseAnnuler(Request $request, int $id): JsonResponse
    {
        if (!$this->canManageCaisse()) {
            return $this->fail('Permissions insuffisantes pour annuler une écriture.', 403);
        }

        $mouvement = DB::table('mouvements_caisse')->where('id', $id)->first();
        if (!$mouvement) {
            return $this->fail('Mouvement introuvable.', 404);
        }

        if ($mouvement->est_annule) {
            return $this->fail('Ce mouvement a déjà été annulé.', 422);
        }

        if ($mouvement->type_mouvement === 'contre_passation') {
            return $this->fail('Une écriture de contre-passation ne peut pas être annulée.', 422);
        }

        $userId = $this->getAuthUserId();

        try {
            $contreId = DB::transaction(function () use ($mouvement, $userId) {
                $periodeId = $this->getOuCrerPeriodeCaisse();

                $soldeActuel = DB::table('mouvements_caisse')
                    ->orderBy('id', 'desc')
                    ->lockForUpdate()
                    ->value('solde_apres') ?? 0;

                $nouveauSolde = $soldeActuel;
                $montant      = (float) $mouvement->montant;

                if ($mouvement->type_mouvement === 'sortie') {
                    $nouveauSolde = $soldeActuel + $montant;
                } elseif ($mouvement->type_mouvement === 'approvisionnement') {
                    if ($soldeActuel < $montant) {
                        throw new \Exception("Impossible d'annuler cet approvisionnement : le solde actuel ({$soldeActuel} XAF) est inférieur au montant ({$montant} XAF).");
                    }
                    $nouveauSolde = $soldeActuel - $montant;
                }

                $contreId = DB::table('mouvements_caisse')->insertGetId([
                    'periode_caisse_id'        => $periodeId,
                    'type_mouvement'           => 'contre_passation',
                    'montant'                  => $montant,
                    'solde_apres'              => $nouveauSolde,
                    'libelle'                  => "Contre-passation du mouvement #{$mouvement->id} : {$mouvement->libelle}",
                    'article'                  => "Annulation de l'écriture #{$mouvement->id}",
                    'vehicule_immatriculation' => $mouvement->vehicule_immatriculation,
                    'intervention_id'          => $mouvement->intervention_id,
                    'est_annule'               => false,
                    'cree_par_user_id'         => $userId,
                    'date_mouvement'           => now(),
                    'date_creation'            => now(),
                ]);

                DB::table('mouvements_caisse')->where('id', $mouvement->id)->update([
                    'est_annule'              => true,
                    'annule_par_mouvement_id' => $contreId,
                ]);

                return $contreId;
            });

            JournalAudit::tracer(
                $userId, 'UPDATE', 'mouvements_caisse', (string) $mouvement->id,
                ['est_annule' => false],
                ['est_annule' => true, 'annule_par_mouvement_id' => $contreId],
                "Annulation par contre-passation du mouvement #{$mouvement->id} ({$mouvement->type_mouvement}, "
                    . number_format((float) $mouvement->montant, 0, ',', ' ') . " XAF)"
            );

            return $this->ok([
                'solde_caisse' => $this->getSoldeCaisseActuel(),
            ], 'Mouvement annulé avec succès par contre-passation.');
        } catch (\Exception $e) {
            Log::error('[InterventionController::caisseAnnuler] ' . $e->getMessage());
            return $this->fail('Erreur lors de l\'annulation : ' . $e->getMessage(), 500);
        }
    }

    // =========================================================================
    // CAISSE — PÉRIODES
    // =========================================================================

    /**
     * GET /admin/caisse/periodes
     */
    public function caissePeriodes(): JsonResponse
    {
        $periodes = DB::table('periodes_caisse')
            ->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->get();

        return $this->ok($periodes);
    }

    /**
     * POST /admin/caisse/periodes/{id}/cloturer
     */
    public function caisseCloturerPeriode(int $id): JsonResponse
    {
        if (!$this->canManageCaisse()) {
            return $this->fail('Permissions insuffisantes.', 403);
        }

        $periode = DB::table('periodes_caisse')->where('id', $id)->first();
        if (!$periode) {
            return $this->fail('Période introuvable.', 404);
        }

        if ($periode->est_cloture) {
            return $this->fail('Cette période est déjà clôturée.', 422);
        }

        $soldeCourant = $this->getSoldeCaisseActuel();

        DB::table('periodes_caisse')->where('id', $id)->update([
            'est_cloture'       => true,
            'solde_cloture'     => $soldeCourant,
            'date_modification' => now(),
        ]);

        JournalAudit::tracer(
            $this->getAuthUserId(), 'UPDATE', 'periodes_caisse', (string) $id,
            ['est_cloture' => false, 'solde_cloture' => $periode->solde_cloture],
            ['est_cloture' => true,  'solde_cloture' => $soldeCourant],
            "Clôture de la période de caisse {$periode->mois}/{$periode->annee} — solde : "
                . number_format($soldeCourant, 0, ',', ' ') . " XAF"
        );

        return $this->ok(null, 'Période clôturée avec succès.');
    }

    // =========================================================================
    // CAISSE — EXPORT
    // =========================================================================

    /**
     * GET /admin/caisse/export
     */
    public function caisseExport(Request $request): JsonResponse
    {
        $query = DB::table('mouvements_caisse as mc')
            ->leftJoin('utilisateurs as u', 'u.id', '=', 'mc.cree_par_user_id')
            ->leftJoin('fournisseurs as f', 'f.id', '=', 'mc.fournisseur_id')
            ->select(
                'mc.id',
                'mc.date_mouvement',
                'mc.type_mouvement',
                'mc.montant',
                'mc.solde_apres',
                'mc.libelle',
                'mc.article',
                'mc.vehicule_immatriculation',
                'f.nom as fournisseur',
                'u.nom as utilisateur',
                'mc.est_annule'
            )
            ->orderBy('mc.id', 'asc');

        if ($annee = $request->input('annee')) {
            $query->whereYear('mc.date_mouvement', (int) $annee);
        }
        if ($mois = $request->input('mois')) {
            $query->whereMonth('mc.date_mouvement', (int) $mois);
        }

        return $this->ok($query->get());
    }

    // =========================================================================
    // MÉTHODES PRIVÉES UTILITAIRES
    // =========================================================================

    /**
     * Met à jour le statut du véhicule selon la règle automatique :
     *  - en_cours  → 'En reparation' (sauf si déjà immobilisé)
     *  - terminee / annulee → 'disponible' (sauf autre intervention ouverte ou demande en_cours)
     */
    private function updateStatutVehicule(string $immat, string $statutIntervention, int $iId, $now): void
    {
        $vehicule = DB::table('vehicules')->where('immatriculation', $immat)->first();
        if (!$vehicule) return;

        $statutActuel = $vehicule->statut ?? 'disponible';

        if ($statutIntervention === 'en_cours') {
            if (in_array($statutActuel, ['disponible', 'En panne'], true)) {
                DB::table('vehicules')->where('immatriculation', $immat)
                    ->update(['statut' => 'En reparation', 'date_modification' => $now]);
            }
        } elseif (in_array($statutIntervention, ['terminee', 'annulee'], true)) {
            $autresIntervOuvertes = DB::table('interventions')
                ->where('vehicule_immatriculation', $immat)
                ->where('est_supprime', 0)
                ->where('id', '!=', $iId)
                ->whereIn('statut', ['planifiee', 'en_cours'])
                ->exists();

            $autresDemandesEnCours = DB::table('demandes_intervention')
                ->where('vehicule_immatriculation', $immat)
                ->where('est_supprime', 0)
                ->where('statut', 'en_cours')
                ->exists();

            if (!$autresIntervOuvertes && !$autresDemandesEnCours) {
                DB::table('vehicules')->where('immatriculation', $immat)
                    ->update(['statut' => 'disponible', 'date_modification' => $now]);
            }
        }
    }

    /**
     * Recalcule cout_pieces (stock + caisse + prestataire) et, pour une intervention
     * externe, cout_main_oeuvre (= montant prestataire). Évite les totaux obsolètes
     * après modification.
     */
    private function recalculerCouts(int $id): void
    {
        $row = DB::table('interventions')->where('id', $id)->first();
        if (!$row) return;

        $estExterne = ($row->nature_intervention ?? 'interne') === 'externe';

        $stock = (float) DB::table('mouvements_stock')
            ->where('type_reference', 'intervention')
            ->where('reference_id', $id)
            ->where('type_mouvement', 'sortie')
            ->selectRaw('COALESCE(SUM(quantite * prix_unitaire), 0) as t')
            ->value('t');

        $caisse = (float) DB::table('mouvements_caisse')
            ->where('intervention_id', $id)
            ->where('type_mouvement', 'sortie')
            ->where('est_annule', 0)
            ->sum('montant');

        $prestataire = $estExterne ? (float) ($row->montant_pieces_prestataire ?? 0) : 0;

        $upd = ['cout_pieces' => $stock + $caisse + $prestataire];
        if ($estExterne) {
            $upd['cout_main_oeuvre'] = (float) ($row->montant_main_oeuvre_prestataire ?? 0);
        }

        DB::table('interventions')->where('id', $id)->update($upd);
    }

    /**
     * Recalcule kpi_vehicules pour le mois de date_fin.
     */
    private function recalculerKpi(string $immat, $dateFin): void
    {
        try {
            $d    = Carbon::parse($dateFin);
            $year = $d->year;
            $mois = $d->month;

            $agg = DB::table('interventions')
                ->where('vehicule_immatriculation', $immat)
                ->where('est_supprime', 0)
                ->where('statut', 'terminee')
                ->whereYear('date_fin', $year)
                ->whereMonth('date_fin', $mois)
                ->selectRaw("
                    COUNT(*) as total_interventions,
                    COALESCE(SUM(duree_minutes), 0) / 60.0 as total_duree_heures,
                    COALESCE(SUM(cout_main_oeuvre), 0) as cout_interventions,
                    COALESCE(SUM(cout_pieces), 0) as cout_pieces,
                    COALESCE(SUM(DATEDIFF(COALESCE(date_fin, NOW()), date_debut)), 0) as jours_maintenance
                ")
                ->first();

            DB::table('kpi_vehicules')
                ->upsert([
                    'vehicule_immatriculation'         => $immat,
                    'annee_periode'                    => $year,
                    'mois_periode'                     => $mois,
                    'total_interventions'              => $agg->total_interventions ?? 0,
                    'total_duree_interventions_heures' => round($agg->total_duree_heures ?? 0, 2),
                    'cout_interventions'               => round($agg->cout_interventions ?? 0, 2),
                    'cout_pieces'                      => round($agg->cout_pieces ?? 0, 2),
                    'jours_maintenance'                => $agg->jours_maintenance ?? 0,
                    'date_creation'                    => now(),
                ], ['vehicule_immatriculation', 'annee_periode', 'mois_periode'], [
                    'total_interventions', 'total_duree_interventions_heures',
                    'cout_interventions', 'cout_pieces', 'jours_maintenance',
                ]);
        } catch (\Exception $e) {
            Log::warning('[InterventionController::recalculerKpi] ' . $e->getMessage());
        }
    }

    /**
     * Solde actuel de la caisse (dernier mouvement enregistré).
     */
    private function getSoldeCaisseActuel(): float
    {
        return (float) (DB::table('mouvements_caisse')
            ->where('est_annule', 0)
            ->orderBy('id', 'desc')
            ->value('solde_apres') ?? 0);
    }

    /**
     * Retourne l'id de la période caisse du mois courant, en la créant si besoin.
     */
    private function getOuCrerPeriodeCaisse(): int
    {
        $now  = now();
        $year = $now->year;
        $mois = $now->month;

        $existing = DB::table('periodes_caisse')
            ->where('annee', $year)->where('mois', $mois)
            ->value('id');

        if ($existing) return $existing;

        $prev = DB::table('periodes_caisse')
            ->orderBy('annee', 'desc')->orderBy('mois', 'desc')
            ->first();
        $ouverture = $prev ? (float) ($prev->solde_cloture ?? $prev->solde_ouverture) : 0;

        return DB::table('periodes_caisse')->insertGetId([
            'annee'             => $year,
            'mois'              => $mois,
            'solde_ouverture'   => $ouverture,
            'est_cloture'       => false,
            'date_creation'     => $now,
            'date_modification' => $now,
        ]);
    }

    /**
     * Messages de validation en français.
     */
    private function messages(): array
    {
        return [
            'vehicule_immatriculation.required' => 'Le véhicule est obligatoire.',
            'vehicule_immatriculation.exists'   => 'Véhicule introuvable.',
            'intervenant_id.exists'             => 'Intervenant introuvable.',
            'nature_intervention.required'      => 'La nature de l\'intervention est obligatoire.',
            'nature_intervention.in'            => 'Nature invalide (interne ou externe).',
            'date_entree_garage.required'       => 'La date d\'entrée au garage / atelier est obligatoire.',
            'date_entree_garage.date'           => 'La date d\'entrée est invalide.',
            'date_sortie_garage.date'           => 'La date de sortie est invalide.',
            'date_sortie_garage.after_or_equal' => 'La date de sortie doit être postérieure ou égale à la date d\'entrée.',
            'statut_vehicule.in'                => 'Statut du véhicule invalide.',
            'facture.mimes'                     => 'La facture doit être au format PDF, JPG ou PNG.',
            'facture.max'                       => 'La facture ne doit pas dépasser 5 Mo.',
            'demandes_ids.required'             => 'Sélectionnez au moins une demande à traiter.',
            'demandes_ids.min'                  => 'Sélectionnez au moins une demande.',
        ];
    }
}