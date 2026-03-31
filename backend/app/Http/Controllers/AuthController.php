<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Durée de session fixe : 2 heures
     */
    private const SESSION_DURATION_HOURS = 2;
    private const SESSION_DURATION_SECONDS = 2 * 60 * 60; // 7200 secondes

    /**
     * Connexion utilisateur avec vérification complète
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:6',
            'remember_me' => 'boolean',
        ], [
            'email.required' => 'L\'adresse email est requise',
            'email.email' => 'L\'adresse email n\'est pas valide',
            'password.required' => 'Le mot de passe est requis',
            'password.min' => 'Le mot de passe doit contenir au moins 6 caractères',
        ]);

        try {
            // 1. Rechercher l'utilisateur avec ses relations
            $user = Utilisateur::with(['role', 'direction'])
                ->where('email', $request->email)
                ->first();

            // 2. Vérifier si l'utilisateur existe
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun compte trouvé avec cet email'
                ], 404);
            }

            // 3. Vérifier le mot de passe
            if (!Hash::check($request->password, $user->mot_de_passe)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect'
                ], 401);
            }

            // 4. Vérifier que l'utilisateur est actif
            if (!$user->est_actif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre compte est désactivé. Contactez l\'administrateur.'
                ], 403);
            }

            // 5. Vérifier que l'utilisateur n'est pas supprimé
            if ($user->est_supprime) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce compte n\'existe plus. Contactez l\'administrateur.'
                ], 403);
            }

            // 6. Vérifier que le rôle existe et est actif
            if (!$user->role || $user->role->est_supprime) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de configuration du compte. Contactez l\'administrateur.'
                ], 500);
            }

            // 7. Session fixe de 2 heures
            $rememberMe = $request->boolean('remember_me', false);
            $tokenExpiration = now()->addHours(self::SESSION_DURATION_HOURS);

            // 8. Créer le token Sanctum avec expiration de 2 heures
            $token = $user->createToken('auth_token', ['*'], $tokenExpiration)->plainTextToken;

            // 9. Mettre à jour la dernière connexion
            $user->derniere_connexion = now();
            $user->save();

            // 10. Préparer les données utilisateur complètes
            $userData = [
                'id' => $user->id,
                'nom' => $user->nom,
                'email' => $user->email,
                'est_actif' => $user->est_actif,
                'derniere_connexion' => $user->derniere_connexion?->format('Y-m-d H:i:s'),

                'role' => [
                    'id' => $user->role->id,
                    'code' => $user->role->code,
                    'libelle' => $user->role->libelle,
                    'description' => $user->role->description,
                ],

                'direction' => $user->direction ? [
                    'id' => $user->direction->id,
                    'nom' => $user->direction->nom,
                    'code' => $user->direction->code,
                ] : null,

                // ⏳ Permissions à remplir rôle par rôle au fur et à mesure du développement
                'permissions' => $this->getPermissionsByRole($user->role->code),
            ];

            // 11. Log de connexion
            \Log::info('Connexion réussie', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role->code,
                'remember_me' => $rememberMe,
                'token_expires_at' => $tokenExpiration->format('Y-m-d H:i:s'),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // 12. Retourner la réponse
            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'token' => $token,
                'user' => $userData,
                'token_type' => 'Bearer',
                'expires_in' => self::SESSION_DURATION_SECONDS,
                'remember_me' => $rememberMe,
                'expires_at' => $tokenExpiration->format('Y-m-d H:i:s'),
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la connexion', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la connexion',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Obtenir l'utilisateur connecté avec toutes ses informations
     */
    public function user(Request $request)
    {
        try {
            $user = $request->user()->load(['role', 'direction']);

            // Vérifier que l'utilisateur est toujours actif
            if (!$user->est_actif || $user->est_supprime) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre session a expiré ou votre compte a été désactivé'
                ], 401);
            }

            // Vérifier si le token a expiré (session de 2 heures dépassée)
            $currentToken = $request->user()->currentAccessToken();
            if ($currentToken && $currentToken->expires_at && now()->greaterThan($currentToken->expires_at)) {
                $currentToken->delete();

                return response()->json([
                    'success' => false,
                    'session_expired' => true,
                    'message' => 'Votre session de 2 heures est écoulée. Veuillez vous reconnecter.'
                ], 401);
            }

            $userData = [
                'id' => $user->id,
                'nom' => $user->nom,
                'email' => $user->email,
                'est_actif' => $user->est_actif,
                'derniere_connexion' => $user->derniere_connexion?->format('Y-m-d H:i:s'),

                'role' => [
                    'id' => $user->role->id,
                    'code' => $user->role->code,
                    'libelle' => $user->role->libelle,
                    'description' => $user->role->description,
                ],

                'direction' => $user->direction ? [
                    'id' => $user->direction->id,
                    'nom' => $user->direction->nom,
                    'code' => $user->direction->code,
                ] : null,

                'permissions' => $this->getPermissionsByRole($user->role->code),
            ];

            return response()->json([
                'success' => true,
                'user' => $userData
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données utilisateur',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Déconnexion utilisateur
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            \Log::info('Déconnexion', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            $user->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Rafraîchir le token (repart sur une nouvelle session de 2 heures)
     */
    public function refresh(Request $request)
    {
        try {
            $user = $request->user()->load(['role', 'direction']);

            $request->user()->currentAccessToken()->delete();

            $tokenExpiration = now()->addHours(self::SESSION_DURATION_HOURS);
            $token = $user->createToken('auth_token', ['*'], $tokenExpiration)->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Token rafraîchi avec succès',
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => self::SESSION_DURATION_SECONDS,
                'expires_at' => $tokenExpiration->format('Y-m-d H:i:s'),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rafraîchissement du token',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Vérifier les permissions d'un utilisateur
     */
    public function checkPermission(Request $request)
    {
        $request->validate([
            'permission' => 'required|string'
        ]);

        try {
            $user = $request->user()->load('role');
            $permissions = $this->getPermissionsByRole($user->role->code);

            $hasPermission = in_array($request->permission, $permissions);

            return response()->json([
                'success' => true,
                'has_permission' => $hasPermission,
                'permission' => $request->permission
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification des permissions',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Vérifier si la session de 2 heures est toujours valide
     */
    public function checkSession(Request $request)
    {
        try {
            $currentToken = $request->user()->currentAccessToken();

            if (!$currentToken || !$currentToken->expires_at) {
                return response()->json([
                    'success' => false,
                    'session_expired' => true,
                    'message' => 'Votre session de 2 heures est écoulée. Veuillez vous reconnecter.'
                ], 401);
            }

            $expiresAt = $currentToken->expires_at;
            $now = now();

            if ($now->greaterThan($expiresAt)) {
                $currentToken->delete();

                return response()->json([
                    'success' => false,
                    'session_expired' => true,
                    'message' => 'Votre session de 2 heures est écoulée. Veuillez vous reconnecter.'
                ], 401);
            }

            $remainingSeconds = $now->diffInSeconds($expiresAt);

            return response()->json([
                'success' => true,
                'session_expired' => false,
                'message' => 'Session active',
                'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
                'remaining_seconds' => $remainingSeconds,
                'remaining_minutes' => (int) ceil($remainingSeconds / 60),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification de la session',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Obtenir les permissions selon le rôle
     * ⏳ À compléter progressivement rôle par rôle au fur et à mesure du développement des pages
     */
    private function getPermissionsByRole(string $roleCode): array
    {
        $permissions = [
            // ✅ En cours de développement — à remplir une fois toutes les pages admin terminées
            'admin' => [],

            // 🔜 À faire après admin
            'chef_parc' => [],
            'chef_tf' => [],
            'mecanicien' => [],
            'agent_pc_radio' => [],
            'chauffeur' => [],
        ];

        return $permissions[$roleCode] ?? [];
    }
}