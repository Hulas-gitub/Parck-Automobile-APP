<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\MailPasswordUtilisateurs;
use App\Models\Direction;
use App\Models\Role;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * UtilisateursController
 *
 * CORRECTIONS APPLIQUÉES :
 *
 *  [1] store() / resetPassword() — PAS de Hash::make() dans le contrôleur.
 *      Le model Utilisateur possède un mutateur setMotDePasseAttribute() qui
 *      appelle Hash::make() automatiquement. Double-hasher ici rendrait la
 *      connexion impossible (hash d'un hash ne matche jamais le plaintext).
 *
 *  [2] resetPassword() — utilise $utilisateur->update() (instance Eloquent)
 *      et non Utilisateur::where()->update() (QueryBuilder).
 *      Le QueryBuilder bypass les mutateurs → le mot de passe ne serait pas hashé.
 *
 *  [3] resetPassword() — tokens Sanctum révoqués via $utilisateur->tokens()->delete()
 *      → l'utilisateur est déconnecté automatiquement s'il était connecté.
 *
 *  [4] MailPasswordUtilisateurs — le 500/CORS venait du conflit envelope()+build().
 *      Corrigé dans le Mailable (build() seul, sujet via ->subject()).
 *
 *  [5] Gestion mail robuste — try/catch dans store() et resetPassword() :
 *      une exception mail ne remonte plus jamais en 500 (ce qui bloquait CORS).
 *
 *  [6] Direction : champ BDD = 'reference' (pas 'code') — corrigé partout.
 *  [7] formatUtilisateur() sans telephone (champ absent de la table BDD).
 *
 *  [8] destroyDirection() — bloque aussi si des véhicules sont rattachés à la direction.
 *  [9] toggleRoleStatut() — bloque la désactivation si des utilisateurs sont assignés au rôle.
 * [10] toggleDirectionStatut() — bloque la désactivation si des utilisateurs ou véhicules
 *      sont rattachés à la direction.
 */
class UtilisateursController extends Controller
{
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
            'email'        => 'required|email|max:100|unique:utilisateurs,email',
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

        $plainPassword = $request->input('mot_de_passe');

        // ✅ [1] On passe le mot de passe en clair — le mutateur setMotDePasseAttribute()
        //        du model se charge du Hash::make(). Ne jamais appeler Hash::make() ici.
        $utilisateur = Utilisateur::create([
            'nom'          => trim($request->nom),
            'email'        => strtolower(trim($request->email)),
            'mot_de_passe' => $plainPassword,
            'role_id'      => $request->role_id,
            'direction_id' => $request->direction_id,
            'est_actif'    => 1,
            'est_supprime' => 0,
        ]);

        $utilisateur->load(['role', 'direction']);

        // ✅ [5] Envoi mail protégé — jamais de 500 qui casse les headers CORS
        $mailEnvoye = true;
        try {
            Mail::to($utilisateur->email)
                ->send(new MailPasswordUtilisateurs(
                    utilisateur:   $utilisateur,
                    plainPassword: $plainPassword,
                    isReset:       false,
                ));
        } catch (\Throwable $e) {
            $mailEnvoye = false;
            \Log::warning("Mail création non envoyé pour {$utilisateur->email} : " . $e->getMessage());
        }

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
            'email'        => "sometimes|required|email|max:100|unique:utilisateurs,email,{$id}",
            'role_id'      => 'sometimes|required|exists:roles,id',
            'direction_id' => 'nullable|exists:directions,id',
        ], $this->messages());

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = [];
        if ($request->has('nom'))          $data['nom']          = trim($request->nom);
        if ($request->has('email'))        $data['email']        = strtolower(trim($request->email));
        if ($request->has('role_id'))      $data['role_id']      = $request->role_id;
        if ($request->has('direction_id')) $data['direction_id'] = $request->direction_id;

        Utilisateur::where('id', $id)->update($data);
        $utilisateur->refresh()->load(['role', 'direction']);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur modifié avec succès.',
            'data'    => $this->formatUtilisateur($utilisateur),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->findOrFail($id);

        Utilisateur::where('id', $id)->update([
            'est_supprime'     => 1,
            'date_suppression' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès.',
        ]);
    }

    public function toggleStatut(int $id): JsonResponse
    {
        $utilisateur = $this->findOrFail($id);

        $newStatut = $utilisateur->est_actif ? 0 : 1;
        Utilisateur::where('id', $id)->update(['est_actif' => $newStatut]);

        // Si l'utilisateur est bloqué, on révoque ses tokens → déconnexion immédiate
        if (!$newStatut) {
            $utilisateur->tokens()->delete();
        }

        $label = $newStatut ? 'débloqué' : 'bloqué';

        return response()->json([
            'success' => true,
            'message' => "Utilisateur {$label} avec succès.",
            'data'    => ['est_actif' => (bool) $newStatut],
        ]);
    }

    public function resetPassword(int $id): JsonResponse
    {
        $utilisateur = $this->findOrFail($id);

        $plainPassword = self::generateSecurePassword($utilisateur->nom);

        // ✅ [1][2] On utilise $utilisateur->update() (instance Eloquent, pas le QueryBuilder)
        //           pour que le mutateur setMotDePasseAttribute() soit déclenché.
        //           On passe le mot de passe en clair — le mutateur hash automatiquement.
        $utilisateur->update([
            'mot_de_passe' => $plainPassword,
        ]);

        // ✅ [3] Invalider tous les tokens Sanctum → déconnexion automatique
        try {
            $utilisateur->tokens()->delete();
        } catch (\Throwable $e) {
            \Log::warning("Impossible de révoquer les tokens de l'utilisateur #{$id} : " . $e->getMessage());
        }

        // ✅ [5] Envoi mail protégé — jamais de 500 qui casse les headers CORS
        $mailEnvoye = true;
        try {
            Mail::to($utilisateur->email)
                ->send(new MailPasswordUtilisateurs(
                    utilisateur:   $utilisateur,
                    plainPassword: $plainPassword,
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
            'libelle'     => 'sometimes|required|string|max:100',
            'description' => 'nullable|string',
        ], $this->messages());

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = [];
        if ($request->has('libelle'))     $data['libelle']     = $request->libelle;
        if ($request->has('description')) $data['description'] = $request->description;

        if (!empty($data)) {
            Role::where('id', $id)->update($data);
        }

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

        return response()->json(['success' => true, 'message' => 'Rôle supprimé avec succès.']);
    }

    /**
     * ✅ [9] Bloque la désactivation d'un rôle si des utilisateurs y sont assignés.
     */
    public function toggleRoleStatut(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // On ne peut désactiver un rôle que s'il n'a plus d'utilisateurs actifs
        if ($role->est_supprime === 0) {
            $nbUsers = Utilisateur::where('role_id', $id)->where('est_supprime', 0)->count();
            if ($nbUsers > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de désactiver ce rôle : {$nbUsers} utilisateur(s) y sont assignés. Réassignez-les d'abord.",
                ], 409);
            }
        }

        $newSupprime = $role->est_supprime ? 0 : 1;
        Role::where('id', $id)->update(['est_supprime' => $newSupprime]);

        $label = $newSupprime ? 'désactivé' : 'activé';

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

        $data = [];
        if ($request->has('nom'))       $data['nom']       = trim($request->nom);
        if ($request->has('reference')) $data['reference'] = $request->reference ? strtoupper(trim($request->reference)) : null;

        if (!empty($data)) {
            Direction::where('id', $id)->update($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Direction modifiée avec succès.',
            'data'    => $this->formatDirection($direction->fresh()),
        ]);
    }

    /**
     * ✅ [8] Bloque la suppression si des utilisateurs OU des véhicules sont rattachés.
     */
    public function destroyDirection(int $id): JsonResponse
    {
        Direction::where('est_supprime', 0)->findOrFail($id);

        $nbUsers = Utilisateur::where('direction_id', $id)->where('est_supprime', 0)->count();
        if ($nbUsers > 0) {
            return response()->json([
                'success' => false,
                'message' => "Impossible de supprimer cette direction : {$nbUsers} utilisateur(s) y sont rattachés.",
            ], 409);
        }

        $nbVehicules = \DB::table('vehicules')
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

        return response()->json(['success' => true, 'message' => 'Direction supprimée avec succès.']);
    }

    /**
     * ✅ [10] Bloque la désactivation d'une direction si des utilisateurs ou véhicules y sont rattachés.
     */
    public function toggleDirectionStatut(int $id): JsonResponse
    {
        $direction = Direction::findOrFail($id);

        // On ne peut désactiver une direction que si elle est vide
        if ($direction->est_supprime === 0) {
            $nbUsers = Utilisateur::where('direction_id', $id)->where('est_supprime', 0)->count();
            if ($nbUsers > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de désactiver cette direction : {$nbUsers} utilisateur(s) y sont rattachés. Réassignez-les d'abord.",
                ], 409);
            }

            $nbVehicules = \DB::table('vehicules')
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

        $newSupprime = $direction->est_supprime ? 0 : 1;
        Direction::where('id', $id)->update(['est_supprime' => $newSupprime]);

        $label = $newSupprime ? 'désactivée' : 'activée';

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
            $diff = now()->diffInMinutes($u->derniere_connexion);
            if ($diff < 60) {
                $derniereConnexion = "Il y a {$diff} min";
            } elseif ($diff < 1440) {
                $derniereConnexion = "Aujourd'hui, " . \Carbon\Carbon::parse($u->derniere_connexion)->format('H:i');
            } elseif ($diff < 2880) {
                $derniereConnexion = 'Hier, ' . \Carbon\Carbon::parse($u->derniere_connexion)->format('H:i');
            } else {
                $jours = now()->diffInDays($u->derniere_connexion);
                $derniereConnexion = "Il y a {$jours} jours";
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

        $nbVehicules = \DB::table('vehicules')
            ->where('direction_id', $d->id)
            ->where('est_supprime', 0)
            ->count();

        return [
            'id'             => $d->id,
            'code'           => $d->reference ?? '',
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
            'email'    => "L'adresse email n'est pas valide.",
            'unique'   => 'Cette valeur est déjà utilisée.',
            'exists'   => 'La valeur sélectionnée est invalide.',
            'min'      => 'Le champ :attribute doit contenir au moins :min caractères.',
            'max'      => 'Le champ :attribute ne peut pas dépasser :max caractères.',
        ];
    }
}