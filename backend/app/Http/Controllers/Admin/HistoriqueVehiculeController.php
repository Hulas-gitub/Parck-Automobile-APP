<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

/**
 * HistoriqueVehiculeController
 *
 * Liste TOUS les véhicules (base = table `vehicules`) avec le statut de
 * conformité de leurs documents (assurance, visite technique, carte grise, ...).
 *
 * IMPORTANT : LEFT JOIN vers documents_vehicules (pas INNER JOIN) afin que :
 *   - la recherche par matricule retrouve TOUJOURS le véhicule, même s'il
 *     n'a aucun document enregistré (statut "sans_document") ;
 *   - la recherche par période ne filtre que sur les documents qui ont
 *     une date_expiration renseignée.
 *
 * DOCUMENTS PERMANENTS (ex. Carte grise) :
 *   Certains types de documents (typiquement la Carte grise) n'expirent
 *   jamais. Dans ce cas, l'utilisateur ne renseigne volontairement AUCUNE
 *   date_expiration lors de la saisie : l'absence de date est le signal
 *   métier que ce document n'a pas de validité limitée dans le temps — ce
 *   n'est PAS une donnée manquante.
 *
 *   On ne doit donc JAMAIS exclure ces documents de la jointure (sinon le
 *   véhicule apparaît à tort comme "sans_document"), et on ne doit pas non
 *   plus essayer de calculer des jours_restants dessus. On les identifie
 *   avec un statut dédié : 'permanent'.
 */
class HistoriqueVehiculeController extends Controller
{
    private const SEUIL_URGENT    = 5;   // jours
    private const SEUIL_PROCHE    = 15;  // jours
    private const SEUIL_ATTENTION = 30;  // jours

    /**
     * GET /admin/historique-vehicules
     *
     * Paramètres :
     *  - immatriculation : recherche par matricule (partielle, tolère espaces/tirets)
     *  - date_debut, date_fin : période de recherche sur la date d'expiration
     *  - type_document : filtre optionnel
     *  - statut : une ou plusieurs valeurs séparées par virgule parmi
     *             valide | expire_bientot | expire | sans_document | permanent
     *             Ex : "valide,permanent" → documents en règle (valides +
     *             documents permanents genre carte grise) affichés ensemble.
     *  - page, per_page
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date_debut'      => 'nullable|date',
            'date_fin'        => 'nullable|date|after_or_equal:date_debut',
            'immatriculation' => 'nullable|string|max:30',
            'type_document'   => 'nullable|string|max:100',
            'statut'          => 'nullable|string|max:255',
            'page'            => 'nullable|integer|min:1',
            'per_page'        => 'nullable|integer|min:1|max:200',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // ── Validation manuelle du statut (liste CSV) ───────────────────────────
        // On ne peut pas utiliser la règle "in:" de Laravel ici car le champ
        // peut contenir plusieurs valeurs séparées par des virgules
        // (ex: "valide,permanent"). On valide donc chaque valeur à la main.
        $statutsAutorises = ['valide', 'expire_bientot', 'expire', 'sans_document', 'permanent'];
        $statutFilter = null;
        if ($statutRaw = $request->get('statut')) {
            $statutFilter = array_values(array_filter(array_map('trim', explode(',', $statutRaw))));
            $invalides    = array_diff($statutFilter, $statutsAutorises);
            if (count($invalides) > 0) {
                return response()->json([
                    'errors' => ['statut' => ['Valeur(s) de statut invalide(s) : ' . implode(', ', $invalides)]],
                ], 422);
            }
        }

        $perPage = min(max((int) $request->get('per_page', 15), 1), 200);
        $page    = max((int) $request->get('page', 1), 1);

        // ── Base = VEHICULES, LEFT JOIN documents ───────────────────────────────
        // NB : on NE filtre PLUS sur whereNotNull('d.date_expiration') ici.
        // Un document sans date_expiration (ex. Carte grise) doit quand même
        // rejoindre la ligne : c'est un document "permanent", pas une absence
        // de document. Le filtre sur la période (date_debut/date_fin) continue
        // de s'appliquer plus bas, lui, uniquement sur les documents datés.
        $query = DB::table('vehicules as v')
            ->leftJoin('documents_vehicules as d', function ($join) {
                $join->on('d.vehicule_immatriculation', '=', 'v.immatriculation')
                     ->where('d.est_supprime', 0);
            })
            ->leftJoin('marques as ma',      'ma.id', '=', 'v.marque_id')
            ->leftJoin('modeles as mo',      'mo.id', '=', 'v.modele_id')
            ->leftJoin('directions as di',   'di.id', '=', 'v.direction_id')
            ->leftJoin('affectations as af', 'af.id', '=', 'v.affectation_id')
            ->where('v.est_supprime', 0);

        // ── Recherche par matricule : tolère espaces/tirets différents ─────────
        if ($immat = $request->get('immatriculation')) {
            $normalise = strtoupper(preg_replace('/[\s\-]+/', '', trim($immat)));
            $query->whereRaw(
                "REPLACE(REPLACE(UPPER(v.immatriculation), ' ', ''), '-', '') LIKE ?",
                ['%' . $normalise . '%']
            );
        }

        // ── Filtre type de document (ne s'applique qu'aux lignes avec document) ──
        if ($type = $request->get('type_document')) {
            $query->where('d.type_document', $type);
        }

        // ── Filtre période sur la date d'expiration ─────────────────────────────
        // Volontairement, ce filtre ne concerne que les documents datés : un
        // document permanent (sans date) n'a pas vocation à apparaître dans une
        // recherche par période d'expiration.
        if ($dateDebut = $request->get('date_debut')) {
            $query->whereDate('d.date_expiration', '>=', $dateDebut);
        }
        if ($dateFin = $request->get('date_fin')) {
            $query->whereDate('d.date_expiration', '<=', $dateFin);
        }

        $rows = $query->select(
            'v.immatriculation',
            'v.statut as vehicule_statut',
            'v.ville',
            'v.responsable_du_vehicule',
            'af.nom as affectation',
            'ma.nom as marque',
            'mo.nom as modele',
            'di.nom as direction',
            'd.id as document_id',
            'd.type_document',
            'd.nom_document',
            'd.date_emission',
            'd.date_expiration',
            'd.chemin_fichier'
        )
        ->orderBy('v.immatriculation')
        ->orderBy('d.date_expiration', 'asc')
        ->get();

        $today = Carbon::now()->startOfDay();

        // ── Calcul du statut de conformité pour chaque ligne ────────────────────
        $data = $rows->map(function ($row) use ($today) {
            $base = [
                'document_id'             => $row->document_id,
                'immatriculation'         => $row->immatriculation,
                'marque'                  => $row->marque,
                'modele'                  => $row->modele,
                'direction'               => $row->direction,
                'ville'                   => $row->ville,
                'affectation'             => $row->affectation,
                'responsable_du_vehicule' => $row->responsable_du_vehicule,
                'vehicule_statut'         => $row->vehicule_statut,
                'type_document'           => $row->type_document,
                'nom_document'            => $row->nom_document,
                'date_emission'           => $row->date_emission,
            ];

            // Cas 1 : aucun document du tout pour ce véhicule (jointure vide)
            if (!$row->document_id) {
                return array_merge($base, [
                    'date_expiration' => null,
                    'jours_restants'  => null,
                    'statut'          => 'sans_document',
                    'niveau_urgence'  => null,
                    'url_fichier'     => null,
                ]);
            }

            // Cas 2 : document existant mais SANS date_expiration
            // → document permanent (ex. Carte grise) : n'expire pas, point final.
            if (!$row->date_expiration) {
                return array_merge($base, [
                    'date_expiration' => null,
                    'jours_restants'  => null,
                    'statut'          => 'permanent',
                    'niveau_urgence'  => null,
                    'url_fichier'     => $this->buildFileUrl($row->chemin_fichier),
                ]);
            }

            // Cas 3 : document avec date_expiration → calcul normal
            $expiration    = Carbon::parse($row->date_expiration)->startOfDay();
            $joursRestants = $today->diffInDays($expiration, false);

            if ($joursRestants < 0) {
                $statut = 'expire';       $niveau = 'expire';
            } elseif ($joursRestants <= self::SEUIL_URGENT) {
                $statut = 'expire_bientot'; $niveau = 'critique';
            } elseif ($joursRestants <= self::SEUIL_PROCHE) {
                $statut = 'expire_bientot'; $niveau = 'urgent';
            } elseif ($joursRestants <= self::SEUIL_ATTENTION) {
                $statut = 'expire_bientot'; $niveau = 'attention';
            } else {
                $statut = 'valide'; $niveau = null;
            }

            return array_merge($base, [
                'date_expiration' => $row->date_expiration,
                'jours_restants'  => (int) $joursRestants,
                'statut'          => $statut,
                'niveau_urgence'  => $niveau,
                'url_fichier'     => $this->buildFileUrl($row->chemin_fichier),
            ]);
        });

        $compteurs = [
            'expire'         => $data->where('statut', 'expire')->count(),
            'expire_bientot' => $data->where('statut', 'expire_bientot')->count(),
            'valide'         => $data->where('statut', 'valide')->count(),
            'sans_document'  => $data->where('statut', 'sans_document')->count(),
            'permanent'      => $data->where('statut', 'permanent')->count(),
        ];

        // ── Filtre par statut calculé (post-calcul, car statut est dérivé en PHP) ──
        // Accepte une liste de statuts séparés par virgule (ex: "valide,permanent").
        if ($statutFilter) {
            $data = $data->filter(fn ($d) => in_array($d['statut'], $statutFilter, true))->values();
        }

        $total     = $data->count();
        $lastPage  = max((int) ceil($total / $perPage), 1);
        $paginated = $data->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'data'         => $paginated,
            'total'        => $total,
            'current_page' => $page,
            'last_page'    => $lastPage,
            'per_page'     => $perPage,
            'compteurs'    => $compteurs,
        ]);
    }

    /** GET /admin/historique-vehicules/types-documents */
    public function typesDocuments(): JsonResponse
    {
        $types = DB::table('documents_vehicules')
            ->where('est_supprime', 0)
            ->whereNotNull('type_document')
            ->distinct()
            ->orderBy('type_document')
            ->pluck('type_document');

        return response()->json($types);
    }

    private function buildFileUrl(?string $chemin): ?string
    {
        if (!$chemin) return null;
        if (filter_var($chemin, FILTER_VALIDATE_URL)) return $chemin;
        return config('app.url') . '/storage/' . ltrim($chemin, '/');
    }
}