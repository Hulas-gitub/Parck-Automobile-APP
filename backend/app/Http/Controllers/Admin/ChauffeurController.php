<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\MailDocumentChauffeur;
use App\Models\Utilisateur;
use App\Models\DocumentChauffeur;
use App\Models\Role;
use App\Models\Direction;
use App\Models\Mission;
use App\Models\Accident;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ChauffeurController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // Résoudre dynamiquement l'id du rôle "chauffeur" via son code
    // → jamais hardcodé, si l'id change en DB ça reste correct
    // ─────────────────────────────────────────────────────────────────────────
    private function getChauffeurRoleId(): int
    {
        return Role::where('code', 'chauffeur')
            ->where('est_supprime', 0)
            ->value('id')
            ?? abort(500, 'Le rôle "chauffeur" est introuvable dans la table roles.');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHAUFFEURS — Lecture
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/chauffeurs
     * Liste des utilisateurs avec rôle chauffeur, actifs et non supprimés.
     */
    public function index(Request $request): JsonResponse
    {
        $roleId = $this->getChauffeurRoleId();

        $query = Utilisateur::with(['role:id,code,libelle', 'direction:id,nom,reference'])
            ->where('role_id', $roleId)
            ->where('est_actif', 1)
            ->where('est_supprime', 0);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($directionId = $request->input('direction_id')) {
            $query->where('direction_id', $directionId);
        }

        $chauffeurs = $query->orderBy('nom')->get();

        return response()->json([
            'success' => true,
            'data'    => $chauffeurs->map(fn($c) => $this->formatChauffeur($c)),
            'total'   => $chauffeurs->count(),
        ]);
    }

    /**
     * GET /api/chauffeurs/{id}
     * Détail d'un chauffeur avec ses informations complètes.
     */
    public function show(int $id): JsonResponse
    {
        $chauffeur = $this->findChauffeur($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatChauffeur($chauffeur),
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHAUFFEURS — Écriture
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * PUT /api/chauffeurs/{id}
     * Met à jour date_embauche et categories_permis d'un chauffeur.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $chauffeur = $this->findChauffeur($id);

        $validator = Validator::make($request->all(), [
            'date_embauche'     => 'nullable|date|before_or_equal:today',
            'categories_permis' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $chauffeur->update($request->only(['date_embauche', 'categories_permis']));

        return response()->json([
            'success' => true,
            'message' => 'Informations du chauffeur mises à jour.',
            'data'    => $this->formatChauffeur($chauffeur->fresh(['role', 'direction'])),
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DOCUMENTS DU CHAUFFEUR
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/documents/chauffeurs
     * Tous les documents de tous les chauffeurs.
     */
    public function indexDocuments(Request $request): JsonResponse
    {
        $query = DocumentChauffeur::with('chauffeur:id,nom')->actif();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_permis', 'like', "%{$search}%")
                  ->orWhere('nom_document', 'like', "%{$search}%")
                  ->orWhereHas('chauffeur', fn($r) => $r->where('nom', 'like', "%{$search}%"));
            });
        }

        if ($type = $request->input('type_document')) {
            $query->parType($type);
        }

        $documents = $query->orderBy('date_expiration')->get();

        if ($statut = $request->input('statut')) {
            $documents = $documents->filter(
                fn($d) => $this->resolveStatutDocument($d) === $statut
            )->values();
        }

        return response()->json([
            'success' => true,
            'data'    => $documents->map(fn($d) => $this->formatDocument($d)),
            'total'   => $documents->count(),
        ]);
    }

    /**
     * GET /api/chauffeurs/{id}/documents
     * Documents d'un chauffeur précis.
     */
    public function documents(int $id): JsonResponse
    {
        $this->findChauffeur($id);

        $documents = DocumentChauffeur::with('chauffeur:id,nom')
            ->where('chauffeur_user_id', $id)
            ->actif()
            ->orderBy('date_expiration')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $documents->map(fn($d) => $this->formatDocument($d)),
        ]);
    }

    /**
     * POST /api/chauffeurs/{id}/documents
     * Ajouter un document avec upload de fichier.
     * → Déclenche les alertes mail si date_expiration <= 30 jours.
     */
    public function storeDocument(Request $request, int $id): JsonResponse
    {
        $chauffeur = $this->findChauffeur($id);

        $validator = Validator::make($request->all(), [
            'type_document'     => 'required|string|in:permis_conduire,carte_identite,visite_medicale,passeport,autre',
            'nom_document'      => 'required|string|max:255',
            'fichier'           => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'numero_permis'     => 'nullable|string|max:100',
            'categories_permis' => 'nullable|string|max:100',
            'pays_delivrance'   => 'nullable|string|max:100',
            'date_delivrance'   => 'nullable|date',
            'date_expiration'   => 'nullable|date|after:date_delivrance',
            'notes'             => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $cheminFichier = $request->file('fichier')
            ->store("chauffeurs/{$id}", 'public');

        $document = DocumentChauffeur::create([
            'chauffeur_user_id'      => $id,
            'type_document'          => $request->type_document,
            'nom_document'           => $request->nom_document,
            'chemin_fichier'         => $cheminFichier,
            'numero_permis'          => $request->numero_permis,
            'categories_permis'      => $request->categories_permis,
            'pays_delivrance'        => $request->input('pays_delivrance', 'Gabon'),
            'date_delivrance'        => $request->date_delivrance,
            'date_expiration'        => $request->date_expiration,
            'telecharge_par_user_id' => auth()->id(),
            'notes'                  => $request->notes,
        ]);

        // ── Alertes mail si la date d'expiration est dans <= 30 jours ────────
        $this->dispatchAlertesMail($document->load('chauffeur'), $chauffeur);

        return response()->json([
            'success' => true,
            'message' => 'Document ajouté avec succès.',
            'data'    => $this->formatDocument($document->load('chauffeur')),
        ], 201);
    }

    /**
     * POST /api/documents/chauffeurs/{id}  (_method=PUT via FormData)
     * Modifier un document, fichier optionnel.
     * → Déclenche les alertes mail si date_expiration <= 30 jours.
     */
    public function updateDocument(Request $request, int $docId): JsonResponse
    {
        $document = DocumentChauffeur::actif()->findOrFail($docId);

        $validator = Validator::make($request->all(), [
            'type_document'     => 'sometimes|required|string|in:permis_conduire,carte_identite,visite_medicale,passeport,autre',
            'nom_document'      => 'sometimes|required|string|max:255',
            'fichier'           => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'numero_permis'     => 'nullable|string|max:100',
            'categories_permis' => 'nullable|string|max:100',
            'pays_delivrance'   => 'nullable|string|max:100',
            'date_delivrance'   => 'nullable|date',
            'date_expiration'   => 'nullable|date',
            'notes'             => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        if ($request->hasFile('fichier')) {
            if ($document->chemin_fichier) {
                Storage::disk('public')->delete($document->chemin_fichier);
            }
            $document->chemin_fichier = $request->file('fichier')
                ->store("chauffeurs/{$document->chauffeur_user_id}", 'public');
        }

        $document->fill($request->only([
            'type_document', 'nom_document', 'numero_permis',
            'categories_permis', 'pays_delivrance',
            'date_delivrance', 'date_expiration', 'notes',
        ]))->save();

        $document->load('chauffeur');
        $chauffeur = $this->findChauffeur($document->chauffeur_user_id);

        // ── Alertes mail si la date d'expiration est dans <= 30 jours ────────
        $this->dispatchAlertesMail($document, $chauffeur);

        return response()->json([
            'success' => true,
            'message' => 'Document mis à jour.',
            'data'    => $this->formatDocument($document->fresh('chauffeur')),
        ]);
    }

    /**
     * DELETE /api/documents/chauffeurs/{id}
     * Soft-delete d'un document.
     */
    public function destroyDocument(int $docId): JsonResponse
    {
        $document = DocumentChauffeur::actif()->findOrFail($docId);

        $document->update([
            'est_supprime'     => true,
            'date_suppression' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document supprimé.',
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ALERTES MAIL — Documents chauffeur
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Détermine si un mail doit partir (date_expiration <= 30 jours ou déjà expirée)
     * et l'envoie à tous les destinataires concernés :
     *   - le chauffeur lui-même
     *   - les admins (role code = 'admin')
     *   - les chefs de parc (role code = 'chef_parc')
     *   - les TF (role code = 'tf')
     *
     * Le niveau (expire / seuil_5 / seuil_15 / seuil_30) est dérivé
     * du nombre de jours restants exactement comme dans MailDocumentVehicule.
     */
    private function dispatchAlertesMail(DocumentChauffeur $document, Utilisateur $chauffeur): void
    {
        // Pas de date d'expiration → rien à faire
        if (empty($document->date_expiration)) {
            return;
        }

        $now            = Carbon::now()->startOfDay();
        $dateExpiration = Carbon::parse($document->date_expiration)->startOfDay();
        $joursRestants  = (int) $now->diffInDays($dateExpiration, false); // négatif si expiré

        // On n'envoie que si <= 30 jours (ou déjà expiré)
        if ($joursRestants > 30) {
            return;
        }

        // Calcul du niveau
        $niveau = match (true) {
            $joursRestants < 0  => 'expire',
            $joursRestants < 5  => 'seuil_5',
            $joursRestants < 15 => 'seuil_15',
            default             => 'seuil_30',
        };

        $statut = $joursRestants < 0 ? 'expire' : 'expire_bientot';

        // Payload document pour le Mailable
        $docPayload = [
            'type_document'  => $document->type_document,
            'nom_document'   => $document->nom_document,
            'numero_permis'  => $document->numero_permis,
            'categories_permis' => $document->categories_permis,
            'pays_delivrance'=> $document->pays_delivrance ?? 'Gabon',
            'date_delivrance'=> $document->date_delivrance,
            'date_expiration'=> $document->date_expiration,
            'notes'          => $document->notes,
        ];

        // Payload chauffeur pour le Mailable
        $chauffeurPayload = [
            'id'               => $chauffeur->id,
            'nom'              => $chauffeur->nom,
            'email'            => $chauffeur->email,
            'direction'        => $chauffeur->direction?->nom ?? '—',
            'categoriesPermis' => $chauffeur->categories_permis ?? '—',
            'dateEmbauche'     => $chauffeur->date_embauche,
        ];

        // ── Collecter les destinataires ───────────────────────────────────────
        $destinataires = collect();

        // 1. Le chauffeur lui-même
        $destinataires->push([
            'email'        => $chauffeur->email,
            'nom'          => $chauffeur->nom,
            'role_libelle' => 'Chauffeur',
        ]);

        // 2. Admins, Chefs de parc, TF
        $rolesCibles = ['admin', 'chef_parc', 'tf'];
        $roleIds     = Role::whereIn('code', $rolesCibles)
            ->where('est_supprime', 0)
            ->pluck('id');

        $gestionnaires = Utilisateur::whereIn('role_id', $roleIds)
            ->where('est_actif', 1)
            ->where('est_supprime', 0)
            ->with('role:id,code,libelle')
            ->get(['id', 'nom', 'email', 'role_id']);

        foreach ($gestionnaires as $g) {
            $destinataires->push([
                'email'        => $g->email,
                'nom'          => $g->nom,
                'role_libelle' => $g->role?->libelle ?? 'Gestionnaire',
            ]);
        }

        // ── Envoi — un mail personnalisé par destinataire ─────────────────────
        foreach ($destinataires->unique('email') as $dest) {
            if (empty($dest['email'])) {
                continue;
            }

            try {
                Mail::to($dest['email'])->send(
                    new MailDocumentChauffeur(
                        document:      $docPayload,
                        chauffeur:     $chauffeurPayload,
                        destinataire:  $dest,
                        statut:        $statut,
                        joursRestants: $joursRestants,
                        niveau:        $niveau,
                    )
                );
            } catch (\Throwable $e) {
                // On loggue sans bloquer la réponse HTTP
                \Log::error("MailDocumentChauffeur — Échec envoi à {$dest['email']} : " . $e->getMessage());
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // KPI — Bilan individuel
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/chauffeurs/{id}/kpi
     */
    public function kpi(int $id): JsonResponse
    {
        $this->findChauffeur($id);

        $now   = Carbon::now();
        $an1   = $now->copy()->subYear();
        $mois6 = $now->copy()->subMonths(6);
        $mois3 = $now->copy()->subMonths(3);
        $anneeCourante = $now->year;

        // ── Accidents ────────────────────────────────────────────────────────
        $accQ = fn() => Accident::where('chauffeur_user_id', $id)->where('est_supprime', 0);

        $accidents = [
            '3m'  => (clone $accQ())->where('date_accident', '>=', $mois3)->count(),
            '6m'  => (clone $accQ())->where('date_accident', '>=', $mois6)->count(),
            '1an' => (clone $accQ())->where('date_accident', '>=', $an1)->count(),
            'all' => (clone $accQ())->count(),
        ];

        $accTotal = (clone $accQ())->selectRaw("
            SUM(type_responsabilite = 'responsable') as responsable,
            SUM(type_responsabilite = 'non_responsable') as non_responsable
        ")->first();

        $accAn1 = (clone $accQ())->where('date_accident', '>=', $an1)->selectRaw("
            SUM(type_responsabilite = 'responsable') as responsable_1an,
            SUM(type_responsabilite = 'non_responsable') as non_responsable_1an
        ")->first();

        $accidentParType = [
            'responsable'         => (int) ($accTotal->responsable      ?? 0),
            'non_responsable'     => (int) ($accTotal->non_responsable   ?? 0),
            'responsable_1an'     => (int) ($accAn1->responsable_1an     ?? 0),
            'non_responsable_1an' => (int) ($accAn1->non_responsable_1an ?? 0),
        ];

        $accidentParMois = array_fill(0, 12, 0);
        (clone $accQ())
            ->whereYear('date_accident', $anneeCourante)
            ->selectRaw('MONTH(date_accident) as mois, COUNT(*) as total')
            ->groupBy('mois')
            ->get()
            ->each(function ($row) use (&$accidentParMois) {
                $accidentParMois[$row->mois - 1] = $row->total;
            });

        // ── Missions ─────────────────────────────────────────────────────────
        $missQ = fn() => Mission::where('chauffeur_user_id', $id)
            ->where('est_supprime', 0)
            ->where('statut', 'terminee');

        $missions = [
            '3m'  => (clone $missQ())->where('date_depart_reelle', '>=', $mois3)->count(),
            '6m'  => (clone $missQ())->where('date_depart_reelle', '>=', $mois6)->count(),
            '1an' => (clone $missQ())->where('date_depart_reelle', '>=', $an1)->count(),
            'all' => (clone $missQ())->count(),
        ];

        $missionsParMois = array_fill(0, 12, 0);
        (clone $missQ())
            ->whereYear('date_depart_reelle', $anneeCourante)
            ->selectRaw('MONTH(date_depart_reelle) as mois, COUNT(*) as total')
            ->groupBy('mois')
            ->get()
            ->each(function ($row) use (&$missionsParMois) {
                $missionsParMois[$row->mois - 1] = $row->total;
            });

        $typesBruts = (clone $missQ())
            ->where('date_depart_reelle', '>=', $an1)
            ->selectRaw('type_mission, COUNT(*) as total')
            ->groupBy('type_mission')
            ->pluck('total', 'type_mission')
            ->toArray();

        $typesMission    = ['transport_fonds', 'vip', 'administratif', 'logistique', 'urgence'];
        $missionsParType = [];
        foreach ($typesMission as $type) {
            $missionsParType[$type] = $typesBruts[$type] ?? 0;
        }

        $km = (clone $missQ())
            ->whereNotNull('km_depart')
            ->whereNotNull('km_retour')
            ->selectRaw('SUM(km_retour - km_depart) as total_km')
            ->value('total_km') ?? 0;

        $score = $this->calculerScore($accidentParType, $missions, $missionsParType);

        return response()->json([
            'success' => true,
            'data'    => [
                'score'           => $score,
                'accidents'       => $accidents,
                'missions'        => $missions,
                'km'              => (int) $km,
                'accidentParType' => $accidentParType,
                'accidentParMois' => $accidentParMois,
                'missionsParMois' => $missionsParMois,
                'missionsParType' => $missionsParType,
            ],
        ]);
    }

    /**
     * GET /api/chauffeurs/kpi/global
     */
    public function kpiGlobal(): JsonResponse
    {
        $roleId     = $this->getChauffeurRoleId();
        $now        = Carbon::now();
        $an1        = $now->copy()->subYear();
        $chauffeurs = Utilisateur::where('role_id', $roleId)
            ->where('est_actif', 1)
            ->where('est_supprime', 0)
            ->get(['id', 'nom', 'direction_id']);

        $kpiList = $chauffeurs->map(function ($c) use ($an1) {
            $acc1an = Accident::where('chauffeur_user_id', $c->id)
                ->where('est_supprime', 0)
                ->where('date_accident', '>=', $an1)
                ->count();

            $accResp = Accident::where('chauffeur_user_id', $c->id)
                ->where('est_supprime', 0)
                ->where('date_accident', '>=', $an1)
                ->where('type_responsabilite', 'responsable')
                ->count();

            $miss1an = Mission::where('chauffeur_user_id', $c->id)
                ->where('est_supprime', 0)
                ->where('statut', 'terminee')
                ->where('date_depart_reelle', '>=', $an1)
                ->count();

            $missParType = Mission::where('chauffeur_user_id', $c->id)
                ->where('est_supprime', 0)
                ->where('statut', 'terminee')
                ->where('date_depart_reelle', '>=', $an1)
                ->selectRaw('type_mission, COUNT(*) as total')
                ->groupBy('type_mission')
                ->pluck('total', 'type_mission')
                ->toArray();

            $accParType = [
                'responsable_1an'     => $accResp,
                'non_responsable_1an' => $acc1an - $accResp,
                'responsable'         => $accResp,
                'non_responsable'     => $acc1an - $accResp,
            ];

            $score = $this->calculerScore(
                $accParType,
                ['1an' => $miss1an],
                $missParType
            );

            return [
                'chauffeur_id' => $c->id,
                'score'        => $score,
                'acc_1an'      => $acc1an,
                'miss_1an'     => $miss1an,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'score_moyen'         => $kpiList->count() ? (int) round($kpiList->avg('score')) : 0,
                'total_accidents_1an' => $kpiList->sum('acc_1an'),
                'total_missions_1an'  => $kpiList->sum('miss_1an'),
                'nb_alertes'          => $kpiList->filter(fn($k) => $k['acc_1an'] >= 2)->count(),
                'chauffeurs_kpi'      => $kpiList,
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DIRECTIONS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/directions
     */
    public function directions(): JsonResponse
    {
        $directions = Direction::where('est_supprime', 0)
            ->orderBy('nom')
            ->get(['id', 'nom', 'reference']);

        return response()->json(['success' => true, 'data' => $directions]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPERS PRIVÉS
    // ══════════════════════════════════════════════════════════════════════════

    private function findChauffeur(int $id): Utilisateur
    {
        $roleId = $this->getChauffeurRoleId();

        return Utilisateur::with(['role:id,code,libelle', 'direction:id,nom,reference'])
            ->where('role_id', $roleId)
            ->where('est_actif', 1)
            ->where('est_supprime', 0)
            ->findOrFail($id);
    }

    private function formatChauffeur(Utilisateur $c): array
    {
        $mots      = preg_split('/\s+/', trim($c->nom));
        $initiales = strtoupper(
            implode('', array_map(fn($m) => mb_substr($m, 0, 1), array_slice($mots, 0, 2)))
        );

        $palette = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444',
                    '#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16'];
        $couleur = $palette[$c->id % count($palette)];

        return [
            'id'               => $c->id,
            'nom'              => $c->nom,
            'email'            => $c->email,
            'direction'        => $c->direction?->nom ?? '',
            'direction_id'     => $c->direction_id,
            'role'             => $c->role?->libelle ?? '',
            'statut'           => $c->est_actif ? 'actif' : 'inactif',
            'dateEmbauche'     => $c->date_embauche,
            'categoriesPermis' => $c->categories_permis ?? '',
            'initiales'        => $initiales,
            'couleur'          => $couleur,
        ];
    }

    private function formatDocument(DocumentChauffeur $d): array
    {
        return [
            'id'               => $d->id,
            'chauffeurId'      => $d->chauffeur_user_id,
            'chauffeurNom'     => $d->chauffeur?->nom ?? '',
            'typeDocument'     => $this->labelTypeDocument($d->type_document),
            'typeDocumentCode' => $d->type_document,
            'nomDocument'      => $d->nom_document,
            'numeroPermis'     => $d->numero_permis ?? '',
            'categoriesPermis' => $d->categories_permis ?? '',
            'paysDelivrance'   => $d->pays_delivrance ?? 'Gabon',
            'dateDelivrance'   => $d->date_delivrance,
            'dateExpiration'   => $d->date_expiration,
            'statut'           => $this->resolveStatutDocument($d),
            'urlFichier'       => $d->chemin_fichier
                ? asset('storage/' . $d->chemin_fichier)
                : null,
            'notes'            => $d->notes,
        ];
    }

    private function resolveStatutDocument(DocumentChauffeur $d): string
    {
        if ($d->isExpire())           return 'expire';
        if ($d->isExpirationProche()) return 'expire_bientot';
        return 'valide';
    }

    private function labelTypeDocument(string $code): string
    {
        return match ($code) {
            'permis_conduire' => 'Permis de conduire',
            'carte_identite'  => "Carte d'identité",
            'visite_medicale' => 'Certificat médical',
            'passeport'       => 'Passeport',
            default           => ucfirst(str_replace('_', ' ', $code)),
        };
    }

    private function calculerScore(
        array $accidentParType,
        array $missions,
        array $missionsParType
    ): int {
        $score = 100;

        $accRecentResp    = $accidentParType['responsable_1an']     ?? 0;
        $accRecentNonResp = $accidentParType['non_responsable_1an'] ?? 0;
        $accAncienResp    = max(0, ($accidentParType['responsable']    ?? 0) - $accRecentResp);
        $accAncienNonResp = max(0, ($accidentParType['non_responsable'] ?? 0) - $accRecentNonResp);

        $score -= $accRecentResp    * 20;
        $score -= $accRecentNonResp * 8;
        $score -= $accAncienResp    * 8;
        $score -= $accAncienNonResp * 3;

        $missionsAn = $missions['1an'] ?? 0;
        if ($missionsAn >= 80)     $score += 5;
        elseif ($missionsAn >= 60) $score += 3;
        elseif ($missionsAn >= 40) $score += 1;

        $typesActifs = count(array_filter($missionsParType, fn($v) => $v > 0));
        if ($typesActifs >= 4)     $score += 3;
        elseif ($typesActifs >= 3) $score += 2;
        elseif ($typesActifs >= 2) $score += 1;

        return max(0, min(100, $score));
    }
}