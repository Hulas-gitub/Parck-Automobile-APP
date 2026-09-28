<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\MailPasswordUtilisateurs;
use App\Models\Direction;
use App\Models\JournalAudit;
use App\Models\Role;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Audit : ce controller mélange Eloquent (Role::create, Direction::create)
 * et Query Builder (DB::table(...)->update(), Role::where(...)->update()).
 * Seul un `save()`/`update()` appelé sur une INSTANCE de modèle déclenche
 * les events Eloquent — un update via ->where(...)->update() ne les
 * déclenche jamais, même en Eloquent. Donc chaque action d'écriture
 * appelle JournalAudit::tracer() explicitement, sans exception.
 */
class UtilisateursController extends Controller
{
    /** Domaine email autorisé */
    private const DOMAINE_EMAIL = 'sgs-gabon.com';

    // =========================================================================
    // HELPERS AUDIT
    // =========================================================================

    /**
     * Instantané d'un utilisateur pour l'audit, avec role_id/direction_id
     * déjà résolus en libellés lisibles (pas les ids bruts).
     */
    private function snapshotAuditUtilisateur(int $id): array
    {
        $u = DB::table('utilisateurs as u')
            ->leftJoin('roles as r', 'r.id', '=', 'u.role_id')
            ->leftJoin('directions as d', 'd.id', '=', 'u.direction_id')
            ->where('u.id', $id)
            ->select(
                'u.nom', 'u.email', 'u.role_id', 'r.libelle as role_nom',
                'u.direction_id', 'd.nom as direction_nom', 'u.est_actif'
            )->first();

        if (!$u) return [];

        return [
            'nom'       => $u->nom,
            'email'     => $u->email,
            'role'      => $u->role_nom,
            'direction' => $u->direction_nom,
            'est_actif' => (bool) $u->est_actif,
        ];
    }

    /** Libellé d'audit intelligent selon ce qui a changé lors d'une modification d'utilisateur. */
    private function libelleAuditUtilisateur(array $avant, array $champs, array $anciennes): string
    {
        $nom = $avant['nom'] ?? '?';

        if (array_key_exists('role', $champs)) {
            return "Changement de rôle de {$nom} : " . ($anciennes['role'] ?? '—') . " → " . ($champs['role'] ?? '—');
        }
        if (array_key_exists('direction', $champs)) {
            return "Changement de direction de {$nom} : " . ($anciennes['direction'] ?? '—') . " → " . ($champs['direction'] ?? '—');
        }
        if (array_key_exists('email', $champs)) {
            return "Modification de l'email de {$nom}";
        }
        return "Modification de l'utilisateur {$nom}";
    }

    // =========================================================================
    // UTILISATEURS
    // =========================================================================

    public function index(Request $request): JsonResponse
    {
        $query = Utilisateur::with(['role', 'direction'])
            ->where('est_supprime', 0);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($roleId = $request->query('role_id')) {
            $query->where('role_id', $roleId);
        }

        if ($request->has('statut') && $request->query('statut') !== '') {
            $query->where('est_actif', (int) $request->query('statut'));
        }

        $utilisateurs = $query->orderBy('date_creation', 'desc')->get();

        return response()->json([
            'success' => true,
            'data'    => $utilisateurs->map(fn ($u) => $this->formatUtilisateur($u)),
            'stats'   => $this->statsUtilisateurs(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'          => 'required|string|max:100',
            'email'        => [
                'required',
                'email',
                'max:100',
                'unique:utilisateurs,email',
                function ($attribute, $value, $fail) {
                    $this->validateDomainEmail($value, $fail);
                },
            ],
            'role_id'      => 'required|exists:roles,id',
            'direction_id' => 'nullable|exists:directions,id',
            'mot_de_passe' => [
                'required',
                'string',
                'min:8',
                function ($attribute, $value, $fail) use ($request) {
                    $this->validatePasswordStrength($value, $request->input('nom', ''), $fail);
                },
            ],
        ], $this->messages());

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        // ✅ Conserver le mot de passe en CLAIR pour l'email
        //    AVANT tout contact avec Eloquent (qui hashera via le mutateur)
        $plainPassword = $request->input('mot_de_passe');

        // ✅ Insertion via DB::table pour bypasser le mutateur setMotDePasseAttribute
        //    On hashe MANUELLEMENT ici → $plainPassword reste intact pour le mail
        $id = DB::table('utilisateurs')->insertGetId([
            'nom'                    => trim($request->nom),
            'email'                  => strtolower(trim($request->email)),
            'mot_de_passe'           => Hash::make($plainPassword),
            'role_id'                => $request->role_id,
            'direction_id'           => $request->direction_id ?? null,
            'est_actif'              => 1,
            'est_supprime'           => 0,
            'mot_de_passe_expire_le' => now()->addHours(24)->toDateString(),
            'date_creation'          => now(),
            'date_modification'      => now(),
        ]);

        // Charger le modèle complet avec les relations pour le mail et la réponse
        $utilisateur = $this->findOrFail($id);

        $mailEnvoye = true;
        try {
            Mail::to($utilisateur->email)
                ->send(new MailPasswordUtilisateurs(
                    utilisateur:   $utilisateur,
                    plainPassword: $plainPassword,  // ← mot de passe en clair ✅
                    isReset:       false,
                ));
        } catch (\Throwable $e) {
            $mailEnvoye = false;
            \Log::warning("Mail création non envoyé pour {$utilisateur->email} : " . $e->getMessage());
        }

        // ── AUDIT : ajout d'un utilisateur (jamais le mot de passe, même haché) ──
        JournalAudit::tracer(
            auth()->id(),
            'CREATE',
            'utilisateurs',
            (string) $utilisateur->id,
            null,
            $this->snapshotAuditUtilisateur($utilisateur->id),
            "Ajout de l'utilisateur {$utilisateur->nom} ({$utilisateur->email}) — rôle {$utilisateur->role?->libelle}"
        );
        // ─────────────────────────────────────────────────────────────────────

        $message = $mailEnvoye
            ? 'Utilisateur créé avec succès. Le mot de passe a été envoyé par email.'
            : "Utilisateur créé avec succès. (Attention : le mail de bienvenue n'a pas pu être envoyé.)";

        return response()->json([
            'success'     => true,
            'message'     => $message,
            'mail_envoye' => $mailEnvoye,
            'data'        => $this->formatUtilisateur($utilisateur),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $utilisateur = $this->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatUtilisateur($utilisateur),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $utilisateur = $this->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom'          => 'sometimes|required|string|max:100',
            'email'        => [
                'sometimes',
                'required',
                'email',
                'max:100',
                "unique:utilisateurs,email,{$id}",
                function ($attribute, $value, $fail) {
                    $this->validateDomainEmail($value, $fail);
                },
            ],
            'role_id'      => 'sometimes|required|exists:roles,id',
            'direction_id' => 'nullable|exists:directions,id',
        ], $this->messages());

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        // ── AUDIT : snapshot avant modification ─────────────────────────────
        $avantSnapshot = $this->snapshotAuditUtilisateur($id);
        // ─────────────────────────────────────────────────────────────────────

        $data = [];
        if ($request->has('nom'))          $data['nom']          = trim($request->nom);
        if ($request->has('email'))        $data['email']        = strtolower(trim($request->email));
        if ($request->has('role_id'))      $data['role_id']      = $request->role_id;
        if ($request->has('direction_id')) $data['direction_id'] = $request->direction_id;

        // ✅ Pas de mot_de_passe ici → le mutateur n'est pas déclenché
        if (!empty($data)) {
            DB::table('utilisateurs')
                ->where('id', $id)
                ->update(array_merge($data, ['date_modification' => now()]));
        }

        $utilisateur->refresh()->load(['role', 'direction']);

        // ── AUDIT : modification (noms résolus, pas les ids FK) ─────────────
        if (!empty($data)) {
            $apresSnapshot = $this->snapshotAuditUtilisateur($id);
            $mapFk         = ['role_id' => 'role', 'direction_id' => 'direction'];

            $champsAudit      = [];
            $anciennesValeurs = [];
            foreach (array_keys($data) as $champ) {
                $cle = $mapFk[$champ] ?? $champ;
                $champsAudit[$cle]      = $apresSnapshot[$cle]  ?? null;
                $anciennesValeurs[$cle] = $avantSnapshot[$cle] ?? null;
            }

            JournalAudit::tracer(
                auth()->id(),
                'UPDATE',
                'utilisateurs',
                (string) $id,
                $anciennesValeurs,
                $champsAudit,
                $this->libelleAuditUtilisateur($avantSnapshot, $champsAudit, $anciennesValeurs)
            );
        }
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur modifié avec succès.',
            'data'    => $this->formatUtilisateur($utilisateur),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $utilisateur = $this->findOrFail($id);

        // ── AUDIT : snapshot avant suppression ──────────────────────────────
        $avantSnapshot = $this->snapshotAuditUtilisateur($id);
        // ─────────────────────────────────────────────────────────────────────

        DB::table('utilisateurs')->where('id', $id)->update([
            'est_supprime'     => 1,
            'date_suppression' => now(),
            'date_modification' => now(),
        ]);

        // ── AUDIT : suppression d'un utilisateur ────────────────────────────
        JournalAudit::tracer(
            auth()->id(),
            'DELETE',
            'utilisateurs',
            (string) $id,
            $avantSnapshot,
            null,
            "Suppression de l'utilisateur {$utilisateur->nom} ({$utilisateur->email})"
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès.',
        ]);
    }

    public function toggleStatut(int $id): JsonResponse
    {
        $utilisateur = $this->findOrFail($id);

        $ancienStatut = (bool) $utilisateur->est_actif;
        $newStatut    = $utilisateur->est_actif ? 0 : 1;

        DB::table('utilisateurs')->where('id', $id)->update([
            'est_actif'         => $newStatut,
            'date_modification' => now(),
        ]);

        if (!$newStatut) {
            try {
                $utilisateur->tokens()->delete();
            } catch (\Throwable) {}
        }

        $label = $newStatut ? 'débloqué' : 'bloqué';

        // ── AUDIT : blocage / déblocage (action dédiée, pas un UPDATE générique) ──
        JournalAudit::tracer(
            auth()->id(),
            $newStatut ? 'DEBLOQUER' : 'BLOQUER',
            'utilisateurs',
            (string) $id,
            ['est_actif' => $ancienStatut],
            ['est_actif' => (bool) $newStatut],
            ($newStatut ? 'Déblocage' : 'Blocage') . " de l'utilisateur {$utilisateur->nom} ({$utilisateur->email})"
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'success' => true,
            'message' => "Utilisateur {$label} avec succès.",
            'data'    => ['est_actif' => (bool) $newStatut],
        ]);
    }

    public function resetPassword(int $id): JsonResponse
    {
        $utilisateur = $this->findOrFail($id);

        // ✅ ÉTAPE 1 — Générer le mot de passe en CLAIR
        //    Cette variable ne sera JAMAIS passée à Eloquent ni à l'audit
        $plainPassword = self::generateSecurePassword($utilisateur->nom);

        // ✅ ÉTAPE 2 — Sauvegarder via DB::table (bypass mutateur Eloquent)
        //    Hash::make() ici manuellement → $plainPassword reste intact
        DB::table('utilisateurs')->where('id', $id)->update([
            'mot_de_passe'           => Hash::make($plainPassword),
            'est_actif'              => 1,
            'mot_de_passe_expire_le' => now()->addHours(24)->toDateString(),
            'date_modification'      => now(),
        ]);

        // ✅ ÉTAPE 3 — Révoquer les tokens (déconnexion forcée)
        try {
            $utilisateur->tokens()->delete();
        } catch (\Throwable $e) {
            \Log::warning("Impossible de révoquer les tokens #{$id} : " . $e->getMessage());
        }

        // ── AUDIT : réinitialisation du mot de passe — JAMAIS le mot de passe,
        //    même haché, dans anciennes_valeurs / nouvelles_valeurs (null, null) ──
        JournalAudit::tracer(
            auth()->id(),
            'UPDATE',
            'utilisateurs',
            (string) $id,
            null,
            null,
            "Réinitialisation du mot de passe de l'utilisateur {$utilisateur->nom} ({$utilisateur->email}) par un administrateur"
        );
        // ─────────────────────────────────────────────────────────────────────

        // ✅ ÉTAPE 4 — Recharger le modèle avec les relations (role, direction)
        //    pour que le mail affiche correctement le rôle et la direction
        $utilisateur->refresh()->load(['role', 'direction']);

        // ✅ ÉTAPE 5 — Envoyer le mail avec le mot de passe EN CLAIR
        //    (jamais le hash — $plainPassword n'a pas été touché par Eloquent)
        $mailEnvoye = true;
        try {
            Mail::to($utilisateur->email)
                ->send(new MailPasswordUtilisateurs(
                    utilisateur:   $utilisateur,
                    plainPassword: $plainPassword,  // ← toujours en clair ✅
                    isReset:       true,
                ));
        } catch (\Throwable $e) {
            $mailEnvoye = false;
            \Log::warning("Mail reset non envoyé pour {$utilisateur->email} : " . $e->getMessage());
        }

        if (!$mailEnvoye) {
            return response()->json([
                'success' => false,
                'message' => "Mot de passe réinitialisé et sessions révoquées, mais le mail n'a pas pu être envoyé.",
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé, utilisateur déconnecté et email envoyé avec succès.',
        ]);
    }

    public function generatePassword(Request $request): JsonResponse
    {
        $nom      = $request->input('nom', '');
        $password = self::generateSecurePassword($nom);

        return response()->json([
            'success'  => true,
            'password' => $password,
        ]);
    }

    /**
     * Désactivation automatique des mots de passe temporaires expirés (24h).
     * Exécuté par le scheduler, pas par un utilisateur → volontairement
     * non tracé dans journaux_audit (même logique que la clôture automatique
     * des sessions expirées : pas d'action humaine à attribuer).
     */
    public function expirePasswordsExpires(): void
    {
        $expires = Utilisateur::where('est_supprime', 0)
            ->where('est_actif', 1)
            ->whereNotNull('mot_de_passe_expire_le')
            ->where('mot_de_passe_expire_le', '<=', now()->toDateString())
            ->get();

        foreach ($expires as $u) {
            // ✅ DB::table ici aussi pour ne pas déclencher le mutateur avec ''
            DB::table('utilisateurs')->where('id', $u->id)->update([
                'est_actif'         => 0,
                'mot_de_passe'      => '',
                'date_modification' => now(),
            ]);

            try {
                $u->tokens()->delete();
            } catch (\Throwable) {}

            \Log::info("Compte #{$u->id} ({$u->email}) désactivé : mot de passe temporaire expiré après 24 h.");
        }
    }

    // =========================================================================
    // RÔLES
    // =========================================================================

    public function indexRoles(Request $request): JsonResponse
    {
        $query = Role::where('est_supprime', 0);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('libelle', 'like', "%{$search}%")
                  ->orWhere('code',   'like', "%{$search}%");
            });
        }

        $roles = $query->orderBy('date_creation')->get();

        return response()->json([
            'success' => true,
            'data'    => $roles->map(fn ($r) => $this->formatRole($r)),
            'stats'   => $this->statsRoles($roles),
        ]);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code'        => 'required|string|max:50|unique:roles,code',
            'libelle'     => 'required|string|max:100',
            'description' => 'nullable|string',
        ], $this->messages());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $role = Role::create([
            'code'         => Str::slug($request->code, '_'),
            'libelle'      => $request->libelle,
            'description'  => $request->description,
            'est_supprime' => 0,
        ]);

        // ── AUDIT : ajout d'un rôle ──────────────────────────────────────────
        JournalAudit::tracer(
            auth()->id(),
            'CREATE',
            'roles',
            (string) $role->id,
            null,
            ['code' => $role->code, 'libelle' => $role->libelle, 'description' => $role->description],
            "Ajout du rôle \"{$role->libelle}\""
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'success' => true,
            'message' => 'Rôle créé avec succès.',
            'data'    => $this->formatRole($role),
        ], 201);
    }

    public function updateRole(Request $request, int $id): JsonResponse
    {
        $role = Role::where('est_supprime', 0)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'code'        => "sometimes|required|string|max:50|unique:roles,code,{$id}",
            'libelle'     => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
        ], $this->messages());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $avant = ['code' => $role->code, 'libelle' => $role->libelle, 'description' => $role->description];

        $data = [];
        if ($request->has('code') && $request->code !== null) {
            $data['code'] = Str::slug($request->code, '_');
        }
        if ($request->has('libelle'))     $data['libelle']     = $request->libelle;
        if ($request->has('description')) $data['description'] = $request->description;

        if (!empty($data)) {
            Role::where('id', $id)->update($data);
        }

        // ── AUDIT : modification d'un rôle ──────────────────────────────────
        if (!empty($data)) {
            JournalAudit::tracer(
                auth()->id(),
                'UPDATE',
                'roles',
                (string) $id,
                $avant,
                $data,
                "Modification du rôle \"{$avant['libelle']}\""
                    . (isset($data['libelle']) && $data['libelle'] !== $avant['libelle'] ? " → \"{$data['libelle']}\"" : '')
            );
        }
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'success' => true,
            'message' => 'Rôle modifié avec succès.',
            'data'    => $this->formatRole($role->fresh()),
        ]);
    }

    public function destroyRole(int $id): JsonResponse
    {
        $role = Role::where('est_supprime', 0)->findOrFail($id);

        $nbUsers = Utilisateur::where('role_id', $id)->where('est_supprime', 0)->count();
        if ($nbUsers > 0) {
            return response()->json([
                'success' => false,
                'message' => "Impossible de supprimer ce rôle : {$nbUsers} utilisateur(s) y sont assignés.",
            ], 409);
        }

        Role::where('id', $id)->update([
            'est_supprime'     => 1,
            'date_suppression' => now(),
        ]);

        // ── AUDIT : suppression d'un rôle ───────────────────────────────────
        JournalAudit::tracer(
            auth()->id(),
            'DELETE',
            'roles',
            (string) $id,
            ['code' => $role->code, 'libelle' => $role->libelle, 'description' => $role->description],
            null,
            "Suppression du rôle \"{$role->libelle}\""
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json(['success' => true, 'message' => 'Rôle supprimé avec succès.']);
    }

    public function toggleRoleStatut(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->est_supprime === 0) {
            $nbUsers = Utilisateur::where('role_id', $id)->where('est_supprime', 0)->count();
            if ($nbUsers > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de désactiver ce rôle : {$nbUsers} utilisateur(s) y sont assignés. Réassignez-les d'abord.",
                ], 409);
            }
        }

        $ancienSupprime = (bool) $role->est_supprime;
        $newSupprime    = $role->est_supprime ? 0 : 1;
        Role::where('id', $id)->update(['est_supprime' => $newSupprime]);

        $label = $newSupprime ? 'désactivé' : 'activé';

        // ── AUDIT : activation / désactivation d'un rôle ────────────────────
        JournalAudit::tracer(
            auth()->id(),
            $newSupprime ? 'BLOQUER' : 'DEBLOQUER',
            'roles',
            (string) $id,
            ['est_supprime' => $ancienSupprime],
            ['est_supprime' => (bool) $newSupprime],
            ($newSupprime ? 'Désactivation' : 'Activation') . " du rôle \"{$role->libelle}\""
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'success' => true,
            'message' => "Rôle {$label} avec succès.",
            'data'    => ['estActif' => (bool)($newSupprime === 0)],
        ]);
    }

    // =========================================================================
    // DIRECTIONS
    // =========================================================================

    public function indexDirections(Request $request): JsonResponse
    {
        $query = Direction::where('est_supprime', 0);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nom',         'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        $directions = $query->orderBy('date_creation')->get();

        return response()->json([
            'success' => true,
            'data'    => $directions->map(fn ($d) => $this->formatDirection($d)),
            'stats'   => $this->statsDirections($directions),
        ]);
    }

    public function storeDirection(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'       => 'required|string|max:150',
            'reference' => 'nullable|string|max:50|unique:directions,reference',
        ], $this->messages());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $direction = Direction::create([
            'nom'          => trim($request->nom),
            'reference'    => $request->reference ? strtoupper(trim($request->reference)) : null,
            'est_supprime' => 0,
        ]);

        // ── AUDIT : ajout d'une direction ────────────────────────────────────
        JournalAudit::tracer(
            auth()->id(),
            'CREATE',
            'directions',
            (string) $direction->id,
            null,
            ['nom' => $direction->nom, 'reference' => $direction->reference],
            "Ajout de la direction \"{$direction->nom}\""
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'success' => true,
            'message' => 'Direction créée avec succès.',
            'data'    => $this->formatDirection($direction),
        ], 201);
    }

    public function updateDirection(Request $request, int $id): JsonResponse
    {
        $direction = Direction::where('est_supprime', 0)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom'       => 'sometimes|required|string|max:150',
            'reference' => "nullable|string|max:50|unique:directions,reference,{$id}",
        ], $this->messages());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $avant = ['nom' => $direction->nom, 'reference' => $direction->reference];

        $data = [];
        if ($request->has('nom')) {
            $data['nom'] = trim($request->nom);
        }
        if ($request->has('reference')) {
            $data['reference'] = $request->reference
                ? strtoupper(trim($request->reference))
                : null;
        }

        if (!empty($data)) {
            Direction::where('id', $id)->update($data);
        }

        // ── AUDIT : modification d'une direction ─────────────────────────────
        if (!empty($data)) {
            JournalAudit::tracer(
                auth()->id(),
                'UPDATE',
                'directions',
                (string) $id,
                $avant,
                $data,
                "Modification de la direction \"{$avant['nom']}\""
                    . (isset($data['nom']) && $data['nom'] !== $avant['nom'] ? " → \"{$data['nom']}\"" : '')
            );
        }
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'success' => true,
            'message' => 'Direction modifiée avec succès.',
            'data'    => $this->formatDirection($direction->fresh()),
        ]);
    }

    public function destroyDirection(int $id): JsonResponse
    {
        $direction = Direction::where('est_supprime', 0)->findOrFail($id);

        $nbUsers = Utilisateur::where('direction_id', $id)->where('est_supprime', 0)->count();
        if ($nbUsers > 0) {
            return response()->json([
                'success' => false,
                'message' => "Impossible de supprimer cette direction : {$nbUsers} utilisateur(s) y sont rattachés.",
            ], 409);
        }

        $nbVehicules = DB::table('vehicules')
            ->where('direction_id', $id)
            ->where('est_supprime', 0)
            ->count();
        if ($nbVehicules > 0) {
            return response()->json([
                'success' => false,
                'message' => "Impossible de supprimer cette direction : {$nbVehicules} véhicule(s) y sont rattachés.",
            ], 409);
        }

        Direction::where('id', $id)->update([
            'est_supprime'     => 1,
            'date_suppression' => now(),
        ]);

        // ── AUDIT : suppression d'une direction ──────────────────────────────
        JournalAudit::tracer(
            auth()->id(),
            'DELETE',
            'directions',
            (string) $id,
            ['nom' => $direction->nom, 'reference' => $direction->reference],
            null,
            "Suppression de la direction \"{$direction->nom}\""
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json(['success' => true, 'message' => 'Direction supprimée avec succès.']);
    }

    public function toggleDirectionStatut(int $id): JsonResponse
    {
        $direction = Direction::findOrFail($id);

        if ($direction->est_supprime === 0) {
            $nbUsers = Utilisateur::where('direction_id', $id)->where('est_supprime', 0)->count();
            if ($nbUsers > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de désactiver cette direction : {$nbUsers} utilisateur(s) y sont rattachés. Réassignez-les d'abord.",
                ], 409);
            }

            $nbVehicules = DB::table('vehicules')
                ->where('direction_id', $id)
                ->where('est_supprime', 0)
                ->count();
            if ($nbVehicules > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de désactiver cette direction : {$nbVehicules} véhicule(s) y sont rattachés. Réaffectez-les d'abord.",
                ], 409);
            }
        }

        $ancienSupprime = (bool) $direction->est_supprime;
        $newSupprime    = $direction->est_supprime ? 0 : 1;
        Direction::where('id', $id)->update(['est_supprime' => $newSupprime]);

        $label = $newSupprime ? 'désactivée' : 'activée';

        // ── AUDIT : activation / désactivation d'une direction ──────────────
        JournalAudit::tracer(
            auth()->id(),
            $newSupprime ? 'BLOQUER' : 'DEBLOQUER',
            'directions',
            (string) $id,
            ['est_supprime' => $ancienSupprime],
            ['est_supprime' => (bool) $newSupprime],
            ($newSupprime ? 'Désactivation' : 'Activation') . " de la direction \"{$direction->nom}\""
        );
        // ─────────────────────────────────────────────────────────────────────

        return response()->json([
            'success' => true,
            'message' => "Direction {$label} avec succès.",
            'data'    => ['estActif' => (bool)($newSupprime === 0)],
        ]);
    }

    // =========================================================================
    // FORMATAGE
    // =========================================================================

    private function formatUtilisateur(Utilisateur $u): array
    {
        $parts    = explode(' ', trim($u->nom));
        $initials = '';
        foreach (array_slice($parts, 0, 2) as $part) {
            $initials .= mb_strtoupper(mb_substr($part, 0, 1));
        }

        $colors  = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];
        $couleur = $colors[$u->id % count($colors)];

        if ($u->derniere_connexion) {
            $connexion = \Carbon\Carbon::parse($u->derniere_connexion);
            $abs       = abs((int) now()->diffInSeconds($connexion, false));

            if ($abs < 60) {
                $derniereConnexion = $abs <= 1 ? "Il y a 1 seconde" : "Il y a {$abs} secondes";
            } elseif ($abs < 3600) {
                $minutes           = (int) floor($abs / 60);
                $derniereConnexion = $minutes === 1 ? "Il y a 1 minute" : "Il y a {$minutes} minutes";
            } elseif ($abs < 86400) {
                $heures            = (int) floor($abs / 3600);
                $derniereConnexion = $heures === 1 ? "Il y a 1 heure" : "Il y a {$heures} heures";
            } elseif ($abs < 172800) {
                $derniereConnexion = "Hier à " . $connexion->format('H:i');
            } else {
                $jours             = (int) floor($abs / 86400);
                $derniereConnexion = $jours === 1 ? "Il y a 1 jour" : "Il y a {$jours} jours";
            }
        } else {
            $derniereConnexion = 'Jamais';
        }

        return [
            'id'                   => $u->id,
            'nom'                  => $u->nom,
            'email'                => $u->email,
            'roleId'               => $u->role_id,
            'roleName'             => $u->role?->libelle ?? '—',
            'directionId'          => $u->direction_id,
            'directionName'        => $u->direction?->nom ?? '—',
            'directionCode'        => $u->direction?->reference ?? '—',
            'statut'               => $u->est_actif ? 'Actif' : 'Bloqué',
            'est_actif'            => (bool) $u->est_actif,
            'dernierConnexion'     => $derniereConnexion,
            'initiales'            => $initials ?: 'U',
            'couleur'              => $couleur,
            'dateCreation'         => $u->date_creation,
            'derniereModification' => $u->date_modification,
        ];
    }

    private function formatRole(Role $r): array
    {
        $nbUtilisateurs = Utilisateur::where('role_id', $r->id)
            ->where('est_supprime', 0)
            ->count();

        $niveauAcces = match ($r->code) {
            'admin'          => 'Élevé',
            'chef_parc'      => 'Moyen',
            'chef_tf'        => 'Moyen',
            'agent_pc_radio' => 'Limité',
            'mecanicien'     => 'Limité',
            'chauffeur'      => 'Limité',
            default          => 'Limité',
        };

        return [
            'id'             => $r->id,
            'code'           => $r->code,
            'nom'            => $r->libelle,
            'description'    => $r->description ?? '',
            'permissions'    => [],
            'niveauAcces'    => $niveauAcces,
            'nbUtilisateurs' => $nbUtilisateurs,
            'estActif'       => !$r->est_supprime,
            'dateCreation'   => $r->date_creation,
        ];
    }

    private function formatDirection(Direction $d): array
    {
        $nbUtilisateurs = Utilisateur::where('direction_id', $d->id)
            ->where('est_supprime', 0)
            ->count();

        $nbVehicules = DB::table('vehicules')
            ->where('direction_id', $d->id)
            ->where('est_supprime', 0)
            ->count();

        return [
            'id'             => $d->id,
            'reference'      => $d->reference ?? '',
            'nom'            => $d->nom,
            'description'    => '',
            'responsable'    => '',
            'nbVehicules'    => $nbVehicules,
            'nbUtilisateurs' => $nbUtilisateurs,
            'estActif'       => !$d->est_supprime,
            'dateCreation'   => $d->date_creation,
        ];
    }

    // =========================================================================
    // STATS
    // =========================================================================

    private function statsUtilisateurs(): array
    {
        return [
            'total'   => Utilisateur::where('est_supprime', 0)->count(),
            'actifs'  => Utilisateur::where('est_supprime', 0)->where('est_actif', 1)->count(),
            'bloques' => Utilisateur::where('est_supprime', 0)->where('est_actif', 0)->count(),
            'admins'  => Utilisateur::where('est_supprime', 0)
                            ->whereHas('role', fn ($q) => $q->where('code', 'admin'))
                            ->count(),
        ];
    }

    private function statsRoles($roles): array
    {
        return [
            'total'                => $roles->count(),
            'actifs'               => $roles->where('est_supprime', false)->count(),
            'utilisateursAssignes' => Utilisateur::where('est_supprime', 0)->count(),
        ];
    }

    private function statsDirections($directions): array
    {
        return [
            'total'  => $directions->count(),
            'actifs' => $directions->where('est_supprime', false)->count(),
        ];
    }

    // =========================================================================
    // MOT DE PASSE
    // =========================================================================

    public static function generateSecurePassword(string $nom = ''): string
    {
        $nomLower = strtolower(preg_replace('/\s+/', '', $nom));

        do {
            $upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
            $lower   = 'abcdefghjkmnpqrstuvwxyz';
            $digits  = '23456789';
            $special = '@#$!%*?&';

            $password  = '';
            $password .= $upper[random_int(0, strlen($upper) - 1)];
            $password .= $digits[random_int(0, strlen($digits) - 1)];
            $password .= $special[random_int(0, strlen($special) - 1)];

            $all = $upper . $lower . $digits . $special;
            for ($i = 0; $i < 7; $i++) {
                $password .= $all[random_int(0, strlen($all) - 1)];
            }

            $password = str_split($password);
            shuffle($password);
            $password = implode('', $password);

        } while (strlen($nomLower) > 2 && stripos($password, $nomLower) !== false);

        return $password;
    }

    private function validatePasswordStrength(string $password, string $nom, callable $fail): void
    {
        if (!preg_match('/[A-Z]/', $password)) {
            $fail('Le mot de passe doit contenir au moins une lettre majuscule.');
            return;
        }
        if (!preg_match('/[0-9]/', $password)) {
            $fail('Le mot de passe doit contenir au moins un chiffre.');
            return;
        }
        if (!preg_match('/[@#$!%*?&]/', $password)) {
            $fail('Le mot de passe doit contenir au moins un caractère spécial (@#$!%*?&).');
            return;
        }

        $parts = array_filter(explode(' ', strtolower($nom)), fn ($p) => strlen($p) > 2);
        foreach ($parts as $part) {
            if (stripos($password, $part) !== false) {
                $fail('Le mot de passe ne doit pas contenir votre nom ou prénom.');
                return;
            }
        }
    }

    private function validateDomainEmail(string $email, callable $fail): void
    {
        $domaine = self::DOMAINE_EMAIL;

        $parts = explode('@', $email);
        if (count($parts) !== 2 || strtolower(trim($parts[1])) !== $domaine) {
            $fail("L'adresse email doit être du domaine @{$domaine} (ex : prenom.nom@{$domaine}).");
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private function findOrFail(int $id): Utilisateur
    {
        return Utilisateur::with(['role', 'direction'])
            ->where('est_supprime', 0)
            ->findOrFail($id);
    }

    private function messages(): array
    {
        return [
            'required' => 'Le champ :attribute est obligatoire.',
            'email'    => "L'adresse email n'est pas valide. Veuillez saisir une adresse du type exemple@sgs-gabon.com.",
            'unique'   => 'Cette valeur est déjà utilisée.',
            'exists'   => 'La valeur sélectionnée est invalide.',
            'min'      => 'Le champ :attribute doit contenir au moins :min caractères.',
            'max'      => 'Le champ :attribute ne peut pas dépasser :max caractères.',
        ];
    }
}