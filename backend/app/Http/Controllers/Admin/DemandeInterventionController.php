<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\MailDemandeInterventionExterne;
use App\Models\DemandeIntervention;
use App\Models\JournalAudit;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * DemandeInterventionController
 *
 * Page « Demandes d'intervention » : soumission + traitement (valider / rejeter).
 * La saisie des interventions réalisées se fait dans une autre page (table `interventions`).
 *
 * MATRICULE DE LA DEMANDE
 * ───────────────────────
 *  • `demandes_intervention.matricule_demande` (ex. DEM-00007) est STOCKÉ en base.
 *  • Il est généré par le serveur juste après l'insertion (il dépend de l'id) : la valeur
 *    éventuellement envoyée par le client n'est jamais utilisée pour la création.
 *  • À la modification, le client renvoie le matricule affiché : il sert de garde-fou
 *    (422 si ça ne correspond pas à la demande modifiée).
 *  • `interventions.matricule_demande` reprendra cette valeur (contrôleur Interventions à venir).
 *  • Filtres : ?matricule=DEM-00007 (exact) ou ?search=DEM-0000 (partiel).
 *
 * RÈGLES MÉTIER
 * ─────────────
 *  • Nature INTERNE → statut « en_cours » dès la soumission. Aucune validation, aucun rejet,
 *                     aucune notification. La demande reste modifiable à tout moment.
 *  • Nature EXTERNE → statut « en_attente » jusqu'à validation / rejet du DAAL (seul habilité).
 *                     Modifiable uniquement tant qu'elle est en attente.
 *  • Nature EXTERNE → email + notification in-app au(x) utilisateur(s) du rôle « daal ».
 *                     Seul le DAAL peut valider / rejeter (avec motif).
 *  • Le bouton « Terminer » n'existe plus sur cette page (la clôture se fait ailleurs).
 *  • À la soumission, le statut du véhicule (vehicules.statut) prend le statut choisi dans la
 *    demande, et le kilométrage du véhicule est mis à jour s'il est renseigné.
 *  • Rejet (ou suppression d'une demande en attente / interne) → le statut du véhicule est
 *    restauré si personne ne l'a modifié entre-temps.
 *  • Qui peut CRÉER : tout le monde pour l'instant (voir canCreate()) — à filtrer plus tard.
 *
 * GESTION DES ERREURS D'EMAIL (demande EXTERNE)
 * ─────────────────────────────────────────────
 *  • La demande est TOUJOURS enregistrée, même si l'email échoue.
 *  • Chaque échec est tracé dans `envois_notifications` (statut_envoi = 'echec' + erreur)
 *    et dans les logs Laravel.
 *  • La réponse de POST /demandes-intervention contient :
 *        notification.emails_echec, notification.echecs[], warning (message lisible ou null)
 *  • L'échec peut être rejoué via POST /{id}/renvoyer-notification (ne renvoie qu'aux
 *    destinataires dont l'email n'est pas encore parti, sans dupliquer la notification in-app).
 *
 * Audit : DB::table() ⇒ le trait Auditable (events Eloquent) ne se déclenche pas ;
 * on trace donc explicitement via JournalAudit::tracer(), comme VehiculesController.
 *
 * Routes (voir routes/demandes_intervention_routes.php) :
 *   GET    /admin/demandes-intervention/references
 *   GET    /admin/demandes-intervention
 *   GET    /admin/demandes-intervention/{id}
 *   POST   /admin/demandes-intervention
 *   PUT    /admin/demandes-intervention/{id}
 *   POST   /admin/demandes-intervention/{id}/valider
 *   POST   /admin/demandes-intervention/{id}/rejeter
 *   POST   /admin/demandes-intervention/{id}/renvoyer-notification
 *   DELETE /admin/demandes-intervention/{id}
 */
class DemandeInterventionController extends Controller
{
    // =========================================================================
    // CONSTANTES
    // =========================================================================

    private const NATURES          = ['interne', 'externe'];
    private const TYPES_MAINTENANCE = ['corrective', 'preventive'];
    private const PRIORITES        = ['faible', 'normale', 'haute', 'urgente'];
    private const TYPES_INTERVENTION = [
        'revision_generale', 'vidange', 'freinage', 'moteur', 'transmission', 'electricite',
        'carrosserie', 'pneumatiques', 'climatisation', 'suspension', 'batterie', 'echappement',
        'direction', 'refroidissement', 'courroie_distribution',
    ];

    /** code stocké dans vehicules.statut => libellé */
    public const STATUTS_VEHICULE = [
        'immobilisation longue' => 'Immobilisation longue',
        'immobilisation courte' => 'Immobilisation courte',
        'indisponible'          => 'Indisponible',
        'En reparation'         => 'En réparation',
        'En panne'              => 'En panne',
    ];

    private const CATEGORIE_NOTIF_CODE = 'alerte_demande_intervention_externe';
    private const FRONT_PAGE_PATH      = '/Admin/Navigation/DemandesIntervention';

    /** Rôles autorisés à créer une demande. null = tout le monde (filtrage ultérieur). */
    private const ROLES_CREATION = null; // ex : ['admin', 'chef_parc', 'chauffeur', 'daal']

    private ?string $roleCodeCache = null;

    // =========================================================================
    // HELPERS — utilisateur / droits
    // =========================================================================

    private function getAuthUserId(): ?int
    {
        $user = auth()->user();
        if (!$user) return null;
        foreach (['id', 'user_id', 'utilisateur_id'] as $prop) {
            if (isset($user->{$prop})) return (int) $user->{$prop};
        }
        return null;
    }

    private function currentRoleCode(): ?string
    {
        if ($this->roleCodeCache !== null) return $this->roleCodeCache;
        $user = auth()->user();
        if (!$user || !isset($user->role_id)) return null;
        return $this->roleCodeCache = DB::table('roles')->where('id', $user->role_id)->value('code');
    }

    private function canCreate(?string $role): bool
    {
        return self::ROLES_CREATION === null || in_array($role, self::ROLES_CREATION, true);
    }

    /**
     * Seules les demandes EXTERNES se traitent (valider / rejeter), et uniquement par le DAAL.
     * Les demandes INTERNES n'ont jamais besoin de validation.
     */
    private function canTreat(string $nature, ?string $role): bool
    {
        return $nature === 'externe' && DemandeIntervention::roleCanTreat($nature, $role);
    }

    /** Matricule calculé à partir d'un id (DEM-00007). */
    private static function ref($id): string
    {
        return DemandeIntervention::genererMatricule($id);
    }

    /** Matricule d'une ligne : valeur stockée, sinon repli sur le calcul (lignes anciennes). */
    private static function matriculeDe(object $row): string
    {
        return !empty($row->matricule_demande) ? $row->matricule_demande : self::ref($row->id);
    }

    private static function iso($value): ?string
    {
        return $value ? Carbon::parse($value)->toIso8601String() : null;
    }

    private function forbidden(string $nature): JsonResponse
    {
        $qui = $nature === 'externe'
            ? "Une demande d'intervention EXTERNE ne peut être traitée que par le DAAL."
            : "Une demande d'intervention INTERNE ne nécessite aucune validation.";
        return response()->json(['message' => $qui], 403);
    }

    // =========================================================================
    // REQUÊTE DE BASE + FORMATAGE
    // =========================================================================

    private function baseQuery()
    {
        return DB::table('demandes_intervention as d')
            ->leftJoin('vehicules as v',       'v.immatriculation', '=', 'd.vehicule_immatriculation')
            ->leftJoin('marques as ma',        'ma.id',  '=', 'v.marque_id')
            ->leftJoin('modeles as mo',        'mo.id',  '=', 'v.modele_id')
            ->leftJoin('utilisateurs as dem',  'dem.id', '=', 'd.demandeur_user_id')
            ->leftJoin('roles as rdem',        'rdem.id', '=', 'dem.role_id')
            ->leftJoin('directions as ddem',   'ddem.id', '=', 'dem.direction_id')
            ->leftJoin('utilisateurs as val',  'val.id', '=', 'd.validee_par_user_id')
            ->leftJoin('roles as rval',        'rval.id', '=', 'val.role_id')
            ->leftJoin('anomalies as an',      'an.id',  '=', 'd.anomalie_id')
            ->leftJoin('directions as di',     'di.id',  '=', 'd.direction_id')
            ->leftJoin('affectations as af',   'af.id',  '=', 'd.affectation_id')
            ->where('d.est_supprime', 0)
            ->select(
                'd.*',   // inclut d.matricule_demande
                'ma.nom as vehicule_marque',
                'mo.nom as vehicule_modele',
                'v.kilometrage as vehicule_kilometrage',
                'v.statut as vehicule_statut',
                'dem.nom as demandeur_nom',
                'rdem.code as demandeur_role_code',
                'rdem.libelle as demandeur_role_libelle',
                'ddem.nom as demandeur_direction',
                'val.nom as valideur_nom',
                'rval.code as valideur_role_code',
                'rval.libelle as valideur_role_libelle',
                'an.description as anomalie_description',
                'an.severite as anomalie_severite',
                'di.nom as direction_nom',
                'af.nom as affectation_nom'
            );
    }

    private function format(object $d, ?string $role): array
    {
        $nature    = $d->nature_intervention ?? 'interne';
        $canTreat  = $this->canTreat($nature, $role);
        $matricule = self::matriculeDe($d);

        return [
            'id'                       => (int) $d->id,
            'reference'                => $matricule,
            'matricule_demande'        => $matricule,
            'anomalie_id'              => $d->anomalie_id ? (int) $d->anomalie_id : null,
            'anomalie_description'     => $d->anomalie_description,
            'anomalie_severite'        => $d->anomalie_severite,
            'vehicule_immatriculation' => $d->vehicule_immatriculation,
            'vehicule_marque'          => $d->vehicule_marque,
            'vehicule_modele'          => $d->vehicule_modele,
            'vehicule_kilometrage'     => $d->vehicule_kilometrage !== null ? (int) $d->vehicule_kilometrage : null,
            'vehicule_statut'          => $d->vehicule_statut,
            'demandeur_user_id'        => $d->demandeur_user_id ? (int) $d->demandeur_user_id : null,
            'demandeur_autre'          => $d->demandeur_autre,
            'demandeur_nom'            => $d->demandeur_nom ?: $d->demandeur_autre,
            'demandeur_role_code'      => $d->demandeur_role_code,
            'demandeur_role_libelle'   => $d->demandeur_role_libelle,
            'demandeur_direction'      => $d->demandeur_direction,
            'date_demande'             => self::iso($d->date_demande),
            'type_maintenance'         => $d->type_maintenance,
            'nature_intervention'      => $nature,
            'type_intervention'        => $d->type_intervention,
            'anomalie_constatee'       => $d->anomalie_constatee,
            'priorite'                 => $d->priorite,
            'direction_id'             => $d->direction_id ? (int) $d->direction_id : null,
            'affectation_id'           => $d->affectation_id ? (int) $d->affectation_id : null,
            'direction_service_autre'  => $d->direction_service_autre,
            'direction_service'        => $d->direction_nom ?: ($d->affectation_nom ?: $d->direction_service_autre),
            'statut'                   => $d->statut,
            'commentaire'              => $d->commentaire,
            'recommandation'           => $d->recommandation,
            'kilometrage'              => $d->kilometrage !== null ? (int) $d->kilometrage : null,
            'statut_vehicule'          => $d->statut_vehicule,
            'motif_rejet'              => $d->motif_rejet,
            'validee_par_user_id'      => $d->validee_par_user_id ? (int) $d->validee_par_user_id : null,
            'valideur_nom'             => $d->valideur_nom,
            'valideur_role_code'       => $d->valideur_role_code,
            'valideur_role_libelle'    => $d->valideur_role_libelle,
            'date_validation'          => self::iso($d->date_validation),
            'date_creation'            => self::iso($d->date_creation),
            'date_modification'        => self::iso($d->date_modification),
            // ── droits calculés pour l'utilisateur connecté ──
            // interne : toujours modifiable · externe : modifiable seulement en attente
            'can_edit'                 => $nature === 'interne' || $d->statut === 'en_attente',
            'can_treat'                => $canTreat && $d->statut === 'en_attente',
            'can_terminer'             => false, // « Terminer » n'existe plus sur cette page
        ];
    }

    /** Instantané lisible pour le journal d'audit (FK résolues en libellés). */
    private function snapshotAudit(int $id): array
    {
        $d = $this->baseQuery()->where('d.id', $id)->first();
        if (!$d) return [];

        return [
            'reference'           => self::matriculeDe($d),
            'matricule_demande'   => self::matriculeDe($d),
            'vehicule'            => $d->vehicule_immatriculation,
            'demandeur'           => $d->demandeur_nom ?: $d->demandeur_autre,
            'nature_intervention' => $d->nature_intervention,
            'type_maintenance'    => $d->type_maintenance,
            'type_intervention'   => $d->type_intervention,
            'priorite'            => $d->priorite,
            'anomalie'            => $d->anomalie_description,
            'anomalie_constatee'  => $d->anomalie_constatee,
            'direction_service'   => $d->direction_nom ?: ($d->affectation_nom ?: $d->direction_service_autre),
            'recommandation'      => $d->recommandation,
            'kilometrage'         => $d->kilometrage,
            'statut_vehicule'     => $d->statut_vehicule,
            'commentaire'         => $d->commentaire,
            'statut'              => $d->statut,
            'motif_rejet'         => $d->motif_rejet,
            'validee_par'         => $d->valideur_nom,
            'date_validation'     => $d->date_validation,
        ];
    }

    // =========================================================================
    // 1. LISTE
    // =========================================================================

    public function index(Request $request): JsonResponse
    {
        $role  = $this->currentRoleCode();
        $query = $this->baseQuery();

        if ($jours = (int) $request->get('jours')) {
            $query->where('d.date_demande', '>=', now()->subDays($jours));
        }
        if ($v = $request->get('vehicule'))  $query->where('d.vehicule_immatriculation', $v);
        if ($v = $request->get('statut'))    $query->where('d.statut', $v);
        if ($v = $request->get('priorite'))  $query->where('d.priorite', $v);
        if ($v = $request->get('nature'))    $query->where('d.nature_intervention', $v);
        if ($v = $request->get('role'))      $query->where('rdem.code', $v);
        if ($v = trim((string) $request->get('matricule'))) {
            $query->where('d.matricule_demande', $v);
        }
        if ($s = trim((string) $request->get('search'))) {
            $query->where(function ($q) use ($s) {
                $q->where('d.vehicule_immatriculation', 'LIKE', "%{$s}%")
                  ->orWhere('d.matricule_demande', 'LIKE', "%{$s}%")
                  ->orWhere('dem.nom', 'LIKE', "%{$s}%")
                  ->orWhere('d.demandeur_autre', 'LIKE', "%{$s}%")
                  ->orWhere('d.type_intervention', 'LIKE', "%{$s}%")
                  ->orWhereRaw("CONCAT('DEM-', LPAD(d.id, 5, '0')) LIKE ?", ["%{$s}%"]);
            });
        }

        $rows = $query->orderByDesc('d.date_demande')->orderByDesc('d.id')->get();

        return response()->json([
            'data'  => $rows->map(fn ($d) => $this->format($d, $role))->values(),
            'total' => $rows->count(),
            'me'    => $this->mePayload($role),
        ]);
    }

    // =========================================================================
    // 2. DÉTAIL
    // =========================================================================

    public function show(int $id): JsonResponse
    {
        $d = $this->baseQuery()->where('d.id', $id)->first();
        if (!$d) return response()->json(['message' => 'Demande introuvable.'], 404);
        return response()->json($this->format($d, $this->currentRoleCode()));
    }

    // =========================================================================
    // 3. RÉFÉRENTIELS DU FORMULAIRE
    // =========================================================================

    private function mePayload(?string $role): array
    {
        $user = auth()->user();
        return [
            'id'                  => $this->getAuthUserId(),
            'nom'                 => $user->nom ?? null,
            'role_code'           => $role,
            'can_create'          => $this->canCreate($role),
            'can_treat_interne'   => $this->canTreat('interne', $role), // toujours false
            'can_treat_externe'   => $this->canTreat('externe', $role),
            // une demande INTERNE passe directement « en cours » (sans validation), quel que soit le profil
            'auto_validation'     => true,
        ];
    }

    public function references(): JsonResponse
    {
        $role = $this->currentRoleCode();

        $vehicules = DB::table('vehicules as v')
            ->leftJoin('marques as ma', 'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo', 'mo.id', '=', 'v.modele_id')
            ->where('v.est_supprime', 0)
            ->orderBy('v.immatriculation')
            ->select(
                'v.immatriculation', 'ma.nom as marque', 'mo.nom as modele',
                'v.kilometrage', 'v.statut', 'v.direction_id', 'v.affectation_id'
            )->get()
            ->map(fn ($v) => [
                'immatriculation' => $v->immatriculation,
                'marque'          => $v->marque,
                'modele'          => $v->modele,
                'kilometrage'     => (int) $v->kilometrage,
                'statut'          => $v->statut,
                'direction_id'    => $v->direction_id ? (int) $v->direction_id : null,
                'affectation_id'  => $v->affectation_id ? (int) $v->affectation_id : null,
            ]);

        $utilisateurs = DB::table('utilisateurs as u')
            ->leftJoin('roles as r', 'r.id', '=', 'u.role_id')
            ->leftJoin('directions as d', 'd.id', '=', 'u.direction_id')
            ->where('u.est_actif', 1)->where('u.est_supprime', 0)
            ->orderBy('u.nom')
            ->select('u.id', 'u.nom', 'r.code as role_code', 'r.libelle as role_libelle', 'd.nom as direction')
            ->get();

        $directions = DB::table('directions')
            ->where('est_supprime', 0)->orderBy('nom')->select('id', 'nom', 'reference')->get();

        $affectations = DB::table('affectations')
            ->where('est_actif', 1)->whereNull('deleted_at')->orderBy('nom')->select('id', 'nom', 'code')->get();

        $anomalies = DB::table('anomalies')
            ->whereIn('statut', ['ouverte', 'en_cours'])->where('est_supprime', 0)
            ->orderByDesc('date_signalement')
            ->select('id', 'vehicule_immatriculation', 'description', 'severite', 'statut')->get();

        $statutsVehicule = collect(self::STATUTS_VEHICULE)
            ->map(fn ($libelle, $code) => ['code' => $code, 'libelle' => $libelle])->values();

        return response()->json([
            'vehicules'        => $vehicules,
            'utilisateurs'     => $utilisateurs,
            'directions'       => $directions,
            'affectations'     => $affectations,
            'anomalies'        => $anomalies,
            'statuts_vehicule' => $statutsVehicule,
            'me'               => $this->mePayload($role),
        ]);
    }

    // =========================================================================
    // VALIDATION / PAYLOAD
    // =========================================================================

    private function rules(): array
    {
        return [
            // Renvoyé par le front à la modification (garde-fou) ; ignoré à la création.
            'matricule_demande'        => ['nullable', 'string', 'max:20', 'regex:/^DEM-\d{5,}$/'],
            'vehicule_immatriculation' => ['required', 'string', 'max:30',
                Rule::exists('vehicules', 'immatriculation')->where('est_supprime', 0)],
            'demandeur_user_id'        => ['nullable', 'integer',
                Rule::exists('utilisateurs', 'id')->where('est_supprime', 0)],
            'demandeur_autre'          => ['nullable', 'string', 'max:150'],
            'nature_intervention'      => ['required', Rule::in(self::NATURES)],
            'type_maintenance'         => ['required', Rule::in(self::TYPES_MAINTENANCE)],
            'type_intervention'        => ['required', Rule::in(self::TYPES_INTERVENTION)],
            'priorite'                 => ['required', Rule::in(self::PRIORITES)],
            'anomalie_id'              => ['nullable', 'integer', 'exists:anomalies,id'],
            'anomalie_constatee'       => ['required', 'string', 'max:2000'],
            'direction_id'             => ['nullable', 'integer',
                Rule::exists('directions', 'id')->where('est_supprime', 0)],
            'affectation_id'           => ['nullable', 'integer', 'exists:affectations,id'],
            'direction_service_autre'  => ['nullable', 'string', 'max:150'],
            'recommandation'           => ['nullable', 'string', 'max:2000'],
            'kilometrage'              => ['nullable', 'integer', 'min:0'],
            'statut_vehicule'          => ['nullable', Rule::in(array_keys(self::STATUTS_VEHICULE))],
            'commentaire'              => ['nullable', 'string', 'max:5000'],
        ];
    }

    private function messages(): array
    {
        return [
            'matricule_demande.regex'           => 'Matricule de demande invalide.',
            'vehicule_immatriculation.required' => 'Le véhicule est obligatoire.',
            'vehicule_immatriculation.exists'   => 'Véhicule introuvable.',
            'nature_intervention.required'      => "Précisez si l'intervention est interne ou externe.",
            'type_intervention.required'        => "Le type d'intervention est obligatoire.",
            'anomalie_constatee.required'       => "Décrivez l'anomalie constatée (objet de l'intervention).",
            'statut_vehicule.in'                => 'Statut du véhicule invalide.',
        ];
    }

    private function validateRequest(Request $request)
    {
        $validator = Validator::make($request->all(), $this->rules(), $this->messages());
        $validator->after(function ($v) use ($request) {
            if (!$request->filled('demandeur_user_id') && trim((string) $request->demandeur_autre) === '') {
                $v->errors()->add('demandeur_user_id', 'Sélectionnez un demandeur ou saisissez un autre nom.');
            }
        });
        return $validator;
    }

    /**
     * Données écrites en base. `matricule_demande` n'en fait volontairement PAS partie :
     * il est généré par le serveur (création) ou conservé tel quel (modification).
     */
    private function payload(Request $request): array
    {
        $autre        = trim((string) $request->demandeur_autre);
        $serviceAutre = trim((string) $request->direction_service_autre);

        return [
            'vehicule_immatriculation' => $request->vehicule_immatriculation,
            'anomalie_id'              => $request->filled('anomalie_id') ? (int) $request->anomalie_id : null,
            'demandeur_user_id'        => $autre !== '' ? null
                                            : ($request->filled('demandeur_user_id') ? (int) $request->demandeur_user_id : null),
            'demandeur_autre'          => $autre !== '' ? $autre : null,
            'type_maintenance'         => $request->type_maintenance,
            'nature_intervention'      => $request->nature_intervention,
            'type_intervention'        => $request->type_intervention,
            'anomalie_constatee'       => trim((string) $request->anomalie_constatee),
            'priorite'                 => $request->priorite,
            'direction_id'             => $serviceAutre !== '' ? null : ($request->filled('direction_id') ? (int) $request->direction_id : null),
            'affectation_id'           => $serviceAutre !== '' ? null : ($request->filled('affectation_id') ? (int) $request->affectation_id : null),
            'direction_service_autre'  => $serviceAutre !== '' ? $serviceAutre : null,
            'commentaire'              => $request->commentaire ?: null,
            'recommandation'           => $request->recommandation ?: null,
            'kilometrage'              => $request->filled('kilometrage') ? (int) $request->kilometrage : null,
            'statut_vehicule'          => $request->filled('statut_vehicule') ? $request->statut_vehicule : null,
        ];
    }

    // =========================================================================
    // VÉHICULE : statut / kilométrage
    // =========================================================================

    /**
     * Applique à la table vehicules le statut + le kilométrage de la demande.
     * Retourne le statut du véhicule AVANT modification (ou null si inchangé).
     */
    private function appliquerSurVehicule(string $immat, ?string $statutVehicule, ?int $km, int $demandeId): ?string
    {
        $veh = DB::table('vehicules')->where('immatriculation', $immat)->where('est_supprime', 0)->first();
        if (!$veh) return null;

        $update      = [];
        $statutAvant = null;
        $uid         = $this->getAuthUserId();
        $ref         = self::ref($demandeId);

        if ($statutVehicule && $statutVehicule !== $veh->statut) {
            $update['statut'] = $statutVehicule;
            $statutAvant      = $veh->statut;
        }

        if ($km !== null && $km > (int) $veh->kilometrage) {
            $update['kilometrage'] = $km;
            $update['date_maj_km'] = now()->toDateString();
        }

        if (empty($update)) return null;

        $update['date_modification'] = now();
        DB::table('vehicules')->where('immatriculation', $immat)->update($update);

        if (isset($update['kilometrage'])) {
            DB::table('historique_kilometrage')->insert([
                'vehicule_immatriculation' => $immat,
                'kilometrage'              => $km,
                'date_relevee'             => now()->toDateString(),
                'source'                   => 'demande_intervention',
                'source_id'                => $demandeId,
                'enregistre_par_user_id'   => $uid,
                'notes'                    => "Relevé saisi dans la demande {$ref}",
                'date_creation'            => now(),
            ]);
            JournalAudit::tracer(
                $uid, 'UPDATE', 'vehicules', $immat,
                ['kilometrage' => $veh->kilometrage], ['kilometrage' => $km],
                "Mise à jour du kilométrage du véhicule {$immat} : {$veh->kilometrage} km → {$km} km (demande {$ref})"
            );
        }

        if ($statutAvant !== null) {
            JournalAudit::tracer(
                $uid, 'UPDATE', 'vehicules', $immat,
                ['statut' => $statutAvant], ['statut' => $statutVehicule],
                "Changement de statut du véhicule {$immat} : {$statutAvant} → {$statutVehicule} (demande {$ref})"
            );
        }

        return $statutAvant;
    }

    /**
     * Restaure le statut d'origine du véhicule (rejet / suppression / modification),
     * uniquement si le véhicule a toujours le statut posé par cette demande.
     */
    private function restaurerVehicule(object $demande): void
    {
        if (!$demande->statut_vehicule || !$demande->statut_vehicule_avant) return;

        $courant = DB::table('vehicules')
            ->where('immatriculation', $demande->vehicule_immatriculation)->where('est_supprime', 0)
            ->value('statut');

        if ($courant !== $demande->statut_vehicule) return;

        DB::table('vehicules')->where('immatriculation', $demande->vehicule_immatriculation)
            ->update(['statut' => $demande->statut_vehicule_avant, 'date_modification' => now()]);

        JournalAudit::tracer(
            $this->getAuthUserId(), 'UPDATE', 'vehicules', $demande->vehicule_immatriculation,
            ['statut' => $courant], ['statut' => $demande->statut_vehicule_avant],
            "Restauration du statut du véhicule {$demande->vehicule_immatriculation} : {$courant} → {$demande->statut_vehicule_avant} (demande " . self::matriculeDe($demande) . ')'
        );
    }

    private function verifierKm(?int $km, string $immat): ?string
    {
        if ($km === null) return null;
        $actuel = (int) DB::table('vehicules')->where('immatriculation', $immat)->value('kilometrage');
        return $km < $actuel
            ? "Le kilométrage ne peut pas être inférieur au kilométrage actuel du véhicule (" . number_format($actuel, 0, ',', ' ') . " km)."
            : null;
    }

    // =========================================================================
    // 4. CRÉER
    // =========================================================================

    public function store(Request $request): JsonResponse
    {
        $role = $this->currentRoleCode();
        if (!$this->canCreate($role)) {
            return response()->json(['message' => "Vous n'êtes pas autorisé à créer une demande d'intervention."], 403);
        }

        $validator = $this->validateRequest($request);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $data = $this->payload($request);

        if ($msg = $this->verifierKm($data['kilometrage'], $data['vehicule_immatriculation'])) {
            return response()->json(['errors' => ['kilometrage' => [$msg]]], 422);
        }

        // Interne ⇒ directement « en_cours », sans validation (quel que soit le rôle du demandeur)
        $autoValide = $data['nature_intervention'] === 'interne';

        $uid = $this->getAuthUserId();

        $id = DB::transaction(function () use ($data, $autoValide, $uid) {
            $id = DB::table('demandes_intervention')->insertGetId($data + [
                'date_demande'        => now(),
                'statut'              => $autoValide ? 'en_cours' : 'en_attente',
                // aucune validation n'intervient pour une demande interne : pas de valideur
                'validee_par_user_id' => null,
                'date_validation'     => null,
                'est_supprime'        => 0,
                'date_creation'       => now(),
                'date_modification'   => now(),
            ]);

            // Matricule stocké : généré par le serveur (dépend de l'id), jamais pris du client.
            DB::table('demandes_intervention')
                ->where('id', $id)
                ->update(['matricule_demande' => self::ref($id)]);

            $avant = $this->appliquerSurVehicule(
                $data['vehicule_immatriculation'], $data['statut_vehicule'], $data['kilometrage'], $id
            );
            if ($avant !== null) {
                DB::table('demandes_intervention')->where('id', $id)->update(['statut_vehicule_avant' => $avant]);
            }
            return $id;
        });

        $ref = self::ref($id);
        JournalAudit::tracer(
            $uid, 'CREATE', 'demandes_intervention', (string) $id, null, $this->snapshotAudit($id),
            "Création de la demande d'intervention {$ref} ({$data['nature_intervention']}) pour le véhicule {$data['vehicule_immatriculation']}"
            . ($autoValide ? ' — en cours de traitement directement (aucune validation requise)' : '')
        );

        // Externe ⇒ notification + email au DAAL (la demande est déjà enregistrée : une erreur
        // d'envoi ne l'annule jamais, elle est simplement signalée dans la réponse).
        $notif   = null;
        $warning = null;
        if ($data['nature_intervention'] === 'externe') {
            $notif   = $this->notifierDaal($id);
            $warning = $this->messageAvertissementNotification($notif);
        }

        $d = $this->baseQuery()->where('d.id', $id)->first();

        $message = $autoValide
            ? "Demande {$ref} créée — intervention en cours de traitement."
            : ($warning
                ? "Demande {$ref} soumise, mais le DAAL n'a pas pu être prévenu par email."
                : "Demande {$ref} soumise — le DAAL a été notifié.");

        return response()->json([
            'message'      => $message,
            'warning'      => $warning,
            'notification' => $notif,
            'data'         => $this->format($d, $role),
        ], 201);
    }

    // =========================================================================
    // 5. MODIFIER
    //    • interne : modifiable à tout moment
    //    • externe : modifiable uniquement tant qu'elle est en attente
    // =========================================================================

    public function update(Request $request, int $id): JsonResponse
    {
        $role  = $this->currentRoleCode();
        $avant = DB::table('demandes_intervention')->where('id', $id)->where('est_supprime', 0)->first();
        if (!$avant) return response()->json(['message' => 'Demande introuvable.'], 404);

        $natureAvant = $avant->nature_intervention ?? 'interne';
        if ($natureAvant === 'externe' && $avant->statut !== 'en_attente') {
            return response()->json(['message' => "Une demande externe ne peut être modifiée que tant qu'elle est en attente."], 409);
        }

        $validator = $this->validateRequest($request);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        // Garde-fou : le matricule renvoyé par le front doit être celui de la demande modifiée.
        $matriculeStocke = self::matriculeDe($avant);
        if ($request->filled('matricule_demande') && $request->matricule_demande !== $matriculeStocke) {
            return response()->json(['errors' => ['matricule_demande' => [
                "Le matricule envoyé ({$request->matricule_demande}) ne correspond pas à la demande {$matriculeStocke}."]]], 422);
        }

        $data = $this->payload($request);

        // La nature ne doit pas changer après soumission : l'email au DAAL est déjà parti (ou non).
        if ($data['nature_intervention'] !== $natureAvant) {
            return response()->json(['errors' => ['nature_intervention' => [
                "La nature de l'intervention ne peut pas être modifiée après la soumission."]]], 422);
        }

        if ($msg = $this->verifierKm($data['kilometrage'], $data['vehicule_immatriculation'])) {
            return response()->json(['errors' => ['kilometrage' => [$msg]]], 422);
        }

        $snapAvant = $this->snapshotAudit($id);

        // On restaure l'ancien véhicule avant de réappliquer les nouveaux paramètres
        $this->restaurerVehicule($avant);

        DB::transaction(function () use ($id, $data, $matriculeStocke) {
            $statutAvant = $this->appliquerSurVehicule(
                $data['vehicule_immatriculation'], $data['statut_vehicule'], $data['kilometrage'], $id
            );
            DB::table('demandes_intervention')->where('id', $id)->update($data + [
                // le matricule ne change jamais ; ceci complète seulement une éventuelle ligne ancienne
                'matricule_demande'     => $matriculeStocke,
                'statut_vehicule_avant' => $statutAvant,
                'date_modification'     => now(),
            ]);
        });

        JournalAudit::tracer(
            $this->getAuthUserId(), 'UPDATE', 'demandes_intervention', (string) $id,
            $snapAvant, $this->snapshotAudit($id),
            'Modification de la demande d\'intervention ' . $matriculeStocke
        );

        $d = $this->baseQuery()->where('d.id', $id)->first();
        return response()->json(['message' => 'Demande mise à jour.', 'data' => $this->format($d, $role)]);
    }

    // =========================================================================
    // 6. VALIDER  (en_attente → en_cours) — demandes EXTERNES, DAAL uniquement
    // =========================================================================

    public function valider(int $id): JsonResponse
    {
        $role = $this->currentRoleCode();
        $dem  = DB::table('demandes_intervention')->where('id', $id)->where('est_supprime', 0)->first();
        if (!$dem) return response()->json(['message' => 'Demande introuvable.'], 404);

        if (!$this->canTreat($dem->nature_intervention ?? 'interne', $role)) {
            return $this->forbidden($dem->nature_intervention ?? 'interne');
        }
        if ($dem->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 409);
        }

        $avant = $this->snapshotAudit($id);

        DB::table('demandes_intervention')->where('id', $id)->update([
            'statut'              => 'en_cours',
            'validee_par_user_id' => $this->getAuthUserId(),
            'date_validation'     => now(),
            'motif_rejet'         => null,
            'date_modification'   => now(),
        ]);

        JournalAudit::tracer(
            $this->getAuthUserId(), 'UPDATE', 'demandes_intervention', (string) $id,
            $avant, $this->snapshotAudit($id),
            'Validation de la demande ' . self::matriculeDe($dem) . " ({$dem->nature_intervention}) — en cours de traitement"
        );

        $d = $this->baseQuery()->where('d.id', $id)->first();
        return response()->json([
            'message' => 'Demande validée — intervention en cours de traitement.',
            'data'    => $this->format($d, $role),
        ]);
    }

    // =========================================================================
    // 7. REJETER  (en_attente → rejetee, motif obligatoire) — EXTERNES, DAAL uniquement
    // =========================================================================

    public function rejeter(Request $request, int $id): JsonResponse
    {
        $role = $this->currentRoleCode();
        $dem  = DB::table('demandes_intervention')->where('id', $id)->where('est_supprime', 0)->first();
        if (!$dem) return response()->json(['message' => 'Demande introuvable.'], 404);

        if (!$this->canTreat($dem->nature_intervention ?? 'interne', $role)) {
            return $this->forbidden($dem->nature_intervention ?? 'interne');
        }

        $validator = Validator::make($request->all(), [
            'motif_rejet' => ['required', 'string', 'min:3', 'max:2000'],
        ], ['motif_rejet.required' => 'Le motif du rejet est obligatoire.']);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        if ($dem->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 409);
        }

        $avant = $this->snapshotAudit($id);

        DB::table('demandes_intervention')->where('id', $id)->update([
            'statut'              => 'rejetee',
            'motif_rejet'         => trim($request->motif_rejet),
            'validee_par_user_id' => $this->getAuthUserId(),
            'date_validation'     => now(),
            'date_modification'   => now(),
        ]);

        $this->restaurerVehicule($dem);

        JournalAudit::tracer(
            $this->getAuthUserId(), 'UPDATE', 'demandes_intervention', (string) $id,
            $avant, $this->snapshotAudit($id),
            'Rejet de la demande ' . self::matriculeDe($dem) . ' — motif : ' . trim($request->motif_rejet)
        );

        $d = $this->baseQuery()->where('d.id', $id)->first();
        return response()->json(['message' => 'Demande rejetée.', 'data' => $this->format($d, $role)]);
    }

    // =========================================================================
    // 8. SUPPRIMER (soft delete)
    // =========================================================================

    public function destroy(int $id): JsonResponse
    {
        $dem = DB::table('demandes_intervention')->where('id', $id)->where('est_supprime', 0)->first();
        if (!$dem) return response()->json(['message' => 'Demande introuvable.'], 404);

        $avant = $this->snapshotAudit($id);

        DB::table('demandes_intervention')->where('id', $id)->update([
            'est_supprime'      => 1,
            'date_suppression'  => now(),
            'date_modification' => now(),
        ]);

        // En attente (externe) ou interne (en cours) : on restaure le statut du véhicule
        if ($dem->statut === 'en_attente' || ($dem->nature_intervention ?? 'interne') === 'interne') {
            $this->restaurerVehicule($dem);
        }

        JournalAudit::tracer(
            $this->getAuthUserId(), 'DELETE', 'demandes_intervention', (string) $id,
            $avant, null,
            'Suppression de la demande d\'intervention ' . self::matriculeDe($dem)
        );

        return response()->json(['message' => 'Demande supprimée.']);
    }

    // =========================================================================
    // 9. RENVOYER LA NOTIFICATION AU DAAL (reprise après échec d'email)
    // =========================================================================

    /**
     * Rejoue l'envoi de l'email aux destinataires DAAL dont l'email n'est pas parti.
     * - Uniquement pour une demande EXTERNE encore « en_attente ».
     * - Ne duplique pas la notification in-app (réutilise celle déjà créée).
     * - Si aucune notification n'existe encore (ex. aucun DAAL à l'époque), elle est créée.
     */
    public function renvoyerNotification(int $id): JsonResponse
    {
        $role = $this->currentRoleCode();
        $dem  = DB::table('demandes_intervention')->where('id', $id)->where('est_supprime', 0)->first();
        if (!$dem) return response()->json(['message' => 'Demande introuvable.'], 404);

        if (!$this->canCreate($role)) {
            return response()->json(['message' => "Vous n'êtes pas autorisé à effectuer cette action."], 403);
        }
        if (($dem->nature_intervention ?? 'interne') !== 'externe') {
            return response()->json(['message' => "Seules les demandes EXTERNES sont notifiées au DAAL."], 422);
        }
        if ($dem->statut !== 'en_attente') {
            return response()->json(['message' => "Cette demande a déjà été traitée : il n'y a plus de notification à renvoyer."], 409);
        }

        $notif   = $this->notifierDaal($id, true);
        $warning = $this->messageAvertissementNotification($notif);

        JournalAudit::tracer(
            $this->getAuthUserId(), 'UPDATE', 'demandes_intervention', (string) $id, null, null,
            'Renvoi de la notification au DAAL pour la demande ' . self::matriculeDe($dem)
            . " — {$notif['emails_envoyes']} email(s) envoyé(s), {$notif['emails_echec']} échec(s)"
        );

        return response()->json([
            'success'      => $warning === null,
            'message'      => $warning === null
                ? 'Le DAAL a été notifié par email.'
                : 'Le renvoi a échoué pour certains destinataires.',
            'warning'      => $warning,
            'notification' => $notif,
        ]);
    }

    // =========================================================================
    // NOTIFICATION DU DAAL (demande EXTERNE uniquement)
    // =========================================================================

    /**
     * Crée la notification (in-app) + envoie l'email à chaque utilisateur actif du rôle « daal ».
     *
     * N'échoue jamais : toute erreur est journalisée (logs Laravel + envois_notifications)
     * et renvoyée dans le résultat, sans bloquer la soumission de la demande.
     * Envoi synchrone (même choix que MailDocumentChauffeur).
     *
     * @param bool $renvoi true ⇒ reprise : réutilise la notification existante et ne renvoie
     *                     l'email qu'aux destinataires dont l'envoi n'a pas abouti.
     *
     * @return array{
     *   destinataires:int, emails_envoyes:int, emails_echec:int,
     *   echecs:array<int,array{nom:?string,email:?string,raison:string}>,
     *   aucun_destinataire:bool, erreur_globale:?string
     * }
     */
    private function notifierDaal(int $demandeId, bool $renvoi = false): array
    {
        $resultat = [
            'destinataires'      => 0,
            'emails_envoyes'     => 0,
            'emails_echec'       => 0,
            'echecs'             => [],
            'aucun_destinataire' => false,
            'erreur_globale'     => null,
        ];

        try {
            $d = $this->baseQuery()->where('d.id', $demandeId)->first();
            if (!$d) {
                $resultat['erreur_globale'] = 'Demande introuvable pour la notification.';
                return $resultat;
            }

            $destinataires = DB::table('utilisateurs as u')
                ->join('roles as r', 'r.id', '=', 'u.role_id')
                ->where('r.code', DemandeIntervention::ROLE_DAAL)->where('r.est_supprime', 0)
                ->where('u.est_actif', 1)->where('u.est_supprime', 0)
                ->select('u.id', 'u.nom', 'u.email', 'r.libelle as role_libelle')
                ->get();

            if ($destinataires->isEmpty()) {
                Log::warning("[DemandeIntervention] Aucun utilisateur actif avec le rôle « daal » — demande {$demandeId} sans notification.");
                $resultat['aucun_destinataire'] = true;
                return $resultat;
            }

            // ── Notification in-app : créée une seule fois, réutilisée en cas de renvoi ──
            $notifId = $renvoi ? $this->trouverNotificationDemande($demandeId) : null;

            if (!$notifId) {
                $categorieId = DB::table('categories_notifications')->where('code', self::CATEGORIE_NOTIF_CODE)->value('id');
                if (!$categorieId) {
                    $categorieId = DB::table('categories_notifications')->insertGetId([
                        'code'            => self::CATEGORIE_NOTIF_CODE,
                        'libelle'         => "Demande d'intervention externe",
                        'niveau_priorite' => 'important',
                        'canaux'          => json_encode(['email', 'in_app']),
                        'roles_cibles'    => json_encode(['daal']),
                        'est_actif'       => 1,
                        'est_supprime'    => 0,
                    ]);
                }

                $ref   = self::matriculeDe($d);
                $titre = "Nouvelle demande d'intervention externe — {$ref}";
                $notifId = DB::table('notifications')->insertGetId([
                    'categorie_id'             => $categorieId,
                    'titre'                    => $titre,
                    'message'                  => "Véhicule {$d->vehicule_immatriculation} · "
                                                  . ucfirst(str_replace('_', ' ', (string) $d->type_intervention))
                                                  . " · priorité {$d->priorite}. Validation ou rejet attendu du DAAL.",
                    'vehicule_immatriculation' => $d->vehicule_immatriculation,
                    'donnees'                  => json_encode(['demande_id' => (int) $d->id, 'reference' => $ref, 'matricule_demande' => $ref, 'nature' => 'externe']),
                    'lien_url'                 => self::FRONT_PAGE_PATH,
                    'date_creation'            => now(),
                ]);
            }

            $demande = $this->format($d, null);

            foreach ($destinataires as $dest) {
                // Reprise : on saute ceux dont l'email est déjà parti
                if ($renvoi && $this->emailDejaEnvoye($notifId, (int) $dest->id)) {
                    continue;
                }

                $resultat['destinataires']++;

                // In-app (créé s'il n'existe pas encore pour ce destinataire)
                $inAppExiste = DB::table('envois_notifications')
                    ->where('notification_id', $notifId)->where('user_id', $dest->id)->where('canal', 'in_app')
                    ->exists();
                if (!$inAppExiste) {
                    DB::table('envois_notifications')->insert([
                        'notification_id' => $notifId,
                        'user_id'         => $dest->id,
                        'canal'           => 'in_app',
                        'statut_envoi'    => 'envoye',
                        'date_envoi'      => now(),
                        'est_lu'          => 0,
                        'date_creation'   => now(),
                    ]);
                }

                // Email (échec géré et tracé, jamais propagé)
                $envoi = $this->envoyerEmailDaal($dest, $demande, $notifId, $demandeId);

                if ($envoi['ok']) {
                    $resultat['emails_envoyes']++;
                } else {
                    $resultat['emails_echec']++;
                    $resultat['echecs'][] = [
                        'nom'    => $dest->nom,
                        'email'  => $dest->email,
                        'raison' => $envoi['raison'],
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::error("[DemandeIntervention] notifierDaal (demande {$demandeId}) : " . $e->getMessage());
            $resultat['erreur_globale'] = 'Erreur technique lors de la notification du DAAL.';
        }

        return $resultat;
    }

    /**
     * Envoie l'email à un destinataire DAAL et trace le résultat dans envois_notifications
     * (mise à jour de la ligne « email » existante en cas de renvoi, sinon insertion).
     *
     * @return array{ok:bool, raison:string}
     */
    private function envoyerEmailDaal(object $dest, array $demande, int $notifId, int $demandeId): array
    {
        $statut = 'envoye';
        $erreur = null;
        $raison = '';

        try {
            if (empty($dest->email)) {
                throw new \RuntimeException('Adresse email manquante.');
            }

            Mail::to($dest->email)->send(new MailDemandeInterventionExterne(
                $demande,
                ['nom' => $dest->nom, 'role_libelle' => $dest->role_libelle]
            ));
        } catch (\Throwable $e) {
            $statut = 'echec';
            $erreur = Str::limit($e->getMessage(), 500, '…');
            $raison = $this->raisonEchecMail($e, $dest);

            // Détail technique complet réservé aux logs (ne jamais l'exposer au client)
            Log::error(
                "[DemandeIntervention] Email DAAL échoué — demande {$demandeId}, destinataire {$dest->email} : "
                . get_class($e) . ' — ' . $e->getMessage()
            );
        }

        try {
            $ligne = [
                'statut_envoi' => $statut,
                'date_envoi'   => $statut === 'envoye' ? now() : null,
                'erreur'       => $erreur,
            ];

            $existe = DB::table('envois_notifications')
                ->where('notification_id', $notifId)->where('user_id', $dest->id)->where('canal', 'email')
                ->exists();

            if ($existe) {
                DB::table('envois_notifications')
                    ->where('notification_id', $notifId)->where('user_id', $dest->id)->where('canal', 'email')
                    ->update($ligne);
            } else {
                DB::table('envois_notifications')->insert($ligne + [
                    'notification_id' => $notifId,
                    'user_id'         => $dest->id,
                    'canal'           => 'email',
                    'est_lu'          => 0,
                    'date_creation'   => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error("[DemandeIntervention] Traçage de l'envoi email impossible (demande {$demandeId}) : " . $e->getMessage());
        }

        return ['ok' => $statut === 'envoye', 'raison' => $raison];
    }

    /** Retrouve la notification in-app déjà créée pour une demande (via donnees.demande_id). */
    private function trouverNotificationDemande(int $demandeId): ?int
    {
        try {
            $id = DB::table('notifications as n')
                ->join('categories_notifications as c', 'c.id', '=', 'n.categorie_id')
                ->where('c.code', self::CATEGORIE_NOTIF_CODE)
                ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(n.donnees, '$.demande_id')) = ?", [(string) $demandeId])
                ->orderByDesc('n.id')
                ->value('n.id');

            return $id ? (int) $id : null;
        } catch (\Throwable $e) {
            Log::warning("[DemandeIntervention] Recherche de la notification impossible (demande {$demandeId}) : " . $e->getMessage());
            return null;
        }
    }

    private function emailDejaEnvoye(int $notifId, int $userId): bool
    {
        return DB::table('envois_notifications')
            ->where('notification_id', $notifId)->where('user_id', $userId)
            ->where('canal', 'email')->where('statut_envoi', 'envoye')
            ->exists();
    }

    /** Message court et lisible (sans détail technique sensible) pour l'utilisateur. */
    private function raisonEchecMail(\Throwable $e, object $dest): string
    {
        if (empty($dest->email)) {
            return 'Adresse email manquante.';
        }

        $msg = strtolower($e->getMessage());

        if (str_contains($msg, 'connection') || str_contains($msg, 'timed out') || str_contains($msg, 'could not be established')) {
            return 'Serveur de messagerie injoignable.';
        }
        if (str_contains($msg, 'authenticat') || str_contains($msg, 'credentials') || str_contains($msg, 'username')) {
            return "Échec d'authentification sur le serveur de messagerie.";
        }
        if (str_contains($msg, 'address') || str_contains($msg, 'recipient') || str_contains($msg, 'mailbox')) {
            return 'Adresse email invalide ou refusée.';
        }

        return "Erreur lors de l'envoi de l'email.";
    }

    /**
     * Transforme le résultat de notifierDaal() en message d'avertissement lisible.
     * Retourne null quand tout s'est bien passé.
     */
    private function messageAvertissementNotification(array $notif): ?string
    {
        if (!empty($notif['erreur_globale'])) {
            return "La notification du DAAL a rencontré une erreur technique. "
                 . "Utilisez « Renvoyer la notification » ou contactez l'administrateur.";
        }

        if (!empty($notif['aucun_destinataire'])) {
            return "Aucun utilisateur DAAL actif n'a été trouvé : personne n'a été notifié. "
                 . "Contactez l'administrateur.";
        }

        if (($notif['emails_echec'] ?? 0) > 0) {
            $noms = collect($notif['echecs'])
                ->map(fn ($e) => $e['nom'] ?: ($e['email'] ?: 'destinataire inconnu'))
                ->implode(', ');

            return "La demande est bien enregistrée et visible dans l'application, mais l'email n'a pas pu être envoyé à : "
                 . "{$noms}. Vous pouvez renvoyer la notification.";
        }

        return null;
    }
}