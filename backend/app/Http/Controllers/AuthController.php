<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\HistoriqueConnexion;
use App\Mail\MailPasswordUtilisateurs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    /**
     * Durée de session fixe : 2 heures (une seule valeur pour tout le fichier)
     */
    private const SESSION_DURATION_HOURS = 2;
    private const SESSION_DURATION_SECONDS = self::SESSION_DURATION_HOURS * 60 * 60; // 7200

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
            // 0. Fermer les sessions dont le token a expiré (logout_at = expires_at)
            HistoriqueConnexion::closeExpired();

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

            // 7. Session fixe
            $rememberMe = $request->boolean('remember_me', false);
            $loginAt = now();
            $tokenExpiration = $loginAt->copy()->addHours(self::SESSION_DURATION_HOURS);

            // 8. Créer le token Sanctum avec expiration
            $tokenResult = $user->createToken('auth_token', ['*'], $tokenExpiration);
            $token = $tokenResult->plainTextToken;

            // 8bis. Enregistrer la connexion dans l'historique (avec l'heure d'expiration)
            HistoriqueConnexion::create([
                'user_id'                  => $user->id,
                'personal_access_token_id' => $tokenResult->accessToken->id,
                'adresse_ip'               => $request->ip(),
                'user_agent'               => $request->userAgent(),
                'login_at'                 => $loginAt,
                'expires_at'               => $tokenExpiration,
            ]);

            // 9. Mettre à jour la dernière connexion
            $user->derniere_connexion = $loginAt;
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

            // Sécurité supplémentaire : token expiré non encore purgé
            $currentToken = $request->user()->currentAccessToken();
            if ($currentToken && $currentToken->expires_at && now()->greaterThan($currentToken->expires_at)) {
                HistoriqueConnexion::where('personal_access_token_id', $currentToken->id)
                    ->whereNull('logout_at')
                    ->update(['logout_at' => $currentToken->expires_at]);

                $currentToken->delete();

                return response()->json([
                    'success' => false,
                    'session_expired' => true,
                    'message' => $this->sessionExpiredMessage()
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

            // Clôturer toutes les sessions ouvertes de cet utilisateur
            HistoriqueConnexion::where('user_id', $user->id)
                ->whereNull('logout_at')
                ->update(['logout_at' => now()]);

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
     * Rafraîchir le token (repart sur une nouvelle session)
     */
    public function refresh(Request $request)
    {
        try {
            $user = $request->user()->load(['role', 'direction']);

            $oldTokenId = $request->user()->currentAccessToken()->id;
            $request->user()->currentAccessToken()->delete();

            $tokenExpiration = now()->addHours(self::SESSION_DURATION_HOURS);
            $tokenResult = $user->createToken('auth_token', ['*'], $tokenExpiration);
            $token = $tokenResult->plainTextToken;

            // La session continue : on rattache l'historique ouvert au nouveau token
            // et on repousse la date d'expiration
            HistoriqueConnexion::where('personal_access_token_id', $oldTokenId)
                ->whereNull('logout_at')
                ->update([
                    'personal_access_token_id' => $tokenResult->accessToken->id,
                    'expires_at'               => $tokenExpiration,
                ]);

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
     * Vérifier si la session est toujours valide
     */
    public function checkSession(Request $request)
    {
        try {
            $currentToken = $request->user()->currentAccessToken();

            if (!$currentToken || !$currentToken->expires_at) {
                return response()->json([
                    'success' => false,
                    'session_expired' => true,
                    'message' => $this->sessionExpiredMessage()
                ], 401);
            }

            $expiresAt = $currentToken->expires_at;
            $now = now();

            if ($now->greaterThan($expiresAt)) {
                HistoriqueConnexion::where('personal_access_token_id', $currentToken->id)
                    ->whereNull('logout_at')
                    ->update(['logout_at' => $expiresAt]);

                $currentToken->delete();

                return response()->json([
                    'success' => false,
                    'session_expired' => true,
                    'message' => $this->sessionExpiredMessage()
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
     * Mot de passe oublié
     * Génère un nouveau mot de passe temporaire et l'envoie par email
     * si le compte existe et est actif.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'L\'adresse email est requise',
            'email.email'    => 'L\'adresse email n\'est pas valide',
        ]);

        try {
            $user = Utilisateur::with(['role', 'direction'])
                ->where('email', $request->email)
                ->first();

            // 1. Compte inexistant
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun compte trouvé avec cet email'
                ], 404);
            }

            // 2. Compte supprimé
            if ($user->est_supprime) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce compte n\'existe plus. Contactez l\'administrateur.'
                ], 403);
            }

            // 3. Compte désactivé
            if (!$user->est_actif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre compte est désactivé. Contactez l\'administrateur.'
                ], 403);
            }

            // 4. Générer un nouveau mot de passe temporaire
            $newPassword = $this->generateSecurePassword();

            $user->mot_de_passe = Hash::make($newPassword);
            $user->save();

            // 5. Invalider les sessions actives (sécurité)
            HistoriqueConnexion::where('user_id', $user->id)
                ->whereNull('logout_at')
                ->update(['logout_at' => now()]);

            $user->tokens()->delete();

            // 6. Envoi de l'email (synchrone) — isReset=true, isSelfService=true
            Mail::to($user->email)->send(
                new MailPasswordUtilisateurs($user, $newPassword, true, true)
            );

            // 7. Log
            \Log::info('Mot de passe oublié - nouveau mot de passe envoyé', [
                'user_id' => $user->id,
                'email'   => $user->email,
                'ip'      => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Un nouveau mot de passe a été envoyé à votre adresse email'
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Erreur lors de la demande de mot de passe oublié', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'envoi du nouveau mot de passe',
                'error'   => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Message d'expiration cohérent avec la durée configurée
     */
    private function sessionExpiredMessage(): string
    {
        return 'Votre session de ' . self::SESSION_DURATION_HOURS . ' heures est écoulée. Veuillez vous reconnecter.';
    }

    /**
     * Obtenir les permissions selon le rôle
     * ⏳ À compléter progressivement rôle par rôle au fur et à mesure du développement des pages
     */
    private function getPermissionsByRole(string $roleCode): array
    {
        $permissions = [
            'admin' => ['*'],
            'chef_parc' => [
                'dashboard.view',
                'vehicules.view',
                'vehicules.manage',
                'carburant.manage',
                'interventions.manage',
                'inspections.view',
                'missions.manage',
                'accidents.manage',
                'stock.manage',
                'documents.view',
            ],
            'chef_tf' => [
                'dashboard.view',
                'missions.tf',
                'chauffeurs.tf',
                'accidents.manage',
            ],
            'mecanicien' => [
                'interventions.execute',
                'inspections.manage',
                'stock.view',
                'outils.manage',
                'demandes.view',
            ],
            'agent_pc_radio' => [
                'cles.manage',
                'vehicules.view',
                'inspections.view',
            ],
            'chauffeur' => [
                'missions.view',
                'anomalies.create',
                'inspections.create',
                'carburant.create',
                'demandes.create',
            ],
            'daal' => [
                'dashboard.view',
                'vehicules.view',
                'demandes.valider',
                'demandes.view',
                'documents.view',
            ],
        ];

        return $permissions[$roleCode] ?? [];
    }

    /**
     * Génère un mot de passe temporaire sécurisé.
     * Règles : min 8 caractères, au moins 1 majuscule, 1 chiffre, 1 caractère spécial.
     */
    private function generateSecurePassword(int $length = 10): string
    {
        // I, O, l, 1, 0 exclus pour éviter les confusions à la lecture/saisie
        $upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $lower   = 'abcdefghijkmnpqrstuvwxyz';
        $digits  = '23456789';
        $special = '!@#$%&*?';

        $length = max($length, 8);

        // On garantit au moins un caractère de chaque catégorie obligatoire
        $password = [
            $upper[random_int(0, strlen($upper) - 1)],
            $lower[random_int(0, strlen($lower) - 1)],
            $digits[random_int(0, strlen($digits) - 1)],
            $special[random_int(0, strlen($special) - 1)],
        ];

        $all = $upper . $lower . $digits . $special;
        for ($i = count($password); $i < $length; $i++) {
            $password[] = $all[random_int(0, strlen($all) - 1)];
        }

        shuffle($password);

        return implode('', $password);
    }
}