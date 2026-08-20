<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ProfileController extends Controller
{
    // ──────────────────────────────────────────────────────────────────
    // Durée d'expiration du mot de passe : 6 mois
    // ──────────────────────────────────────────────────────────────────
    private const PASSWORD_EXPIRY_MONTHS = 6;

    // ──────────────────────────────────────────────────────────────────
    // GET /profile
    // ──────────────────────────────────────────────────────────────────
    public function show(Request $request)
    {
        try {
            /** @var Utilisateur $user */
            $user = $request->user()->load(['role', 'direction']);

            if (!$user->est_actif || $user->est_supprime) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre compte est désactivé ou supprimé.',
                ], 403);
            }

            $passwordStatus = $this->getPasswordStatus($user);
            $initiales      = $this->computeInitiales($user->nom);

            return response()->json([
                'success' => true,
                'user'    => $this->formatUser($user, $initiales, $passwordStatus),
            ], 200);

        } catch (\Exception $e) {
            \Log::error('ProfileController@show', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du profil.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // PUT /profile
    // ──────────────────────────────────────────────────────────────────
    public function update(Request $request)
    {
        try {
            /** @var Utilisateur $user */
            $user = $request->user()->load(['role', 'direction']);

            $request->validate([
                'nom'   => 'required|string|min:2|max:100',
                'email' => [
                    'required',
                    'email',
                    'max:100',
                    \Illuminate\Validation\Rule::unique('utilisateurs', 'email')
                        ->ignore($user->id)
                        ->where('est_supprime', 0),
                ],
            ], [
                'nom.required'   => 'Le nom complet est requis.',
                'nom.min'        => 'Le nom doit contenir au moins 2 caractères.',
                'email.required' => 'L\'adresse email est requise.',
                'email.email'    => 'L\'adresse email n\'est pas valide.',
                'email.unique'   => 'Cette adresse email est déjà utilisée.',
            ]);

            $user->nom   = trim($request->nom);
            $user->email = strtolower(trim($request->email));
            $user->save();

            $user->load(['role', 'direction']);
            $initiales      = $this->computeInitiales($user->nom);
            $passwordStatus = $this->getPasswordStatus($user);

            \Log::info('Profil mis à jour', [
                'user_id' => $user->id,
                'nom'     => $user->nom,
                'email'   => $user->email,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour avec succès.',
                'user'    => $this->formatUser($user, $initiales, $passwordStatus),
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first(),
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            \Log::error('ProfileController@update', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // POST /profile/change-password
    // ──────────────────────────────────────────────────────────────────
    public function changePassword(Request $request)
    {
        try {
            /** @var Utilisateur $user */
            // On recharge l'utilisateur directement depuis la BDD avec un fresh()
            // pour être certain d'avoir tous les attributs bruts, y compris mot_de_passe
            // que Sanctum ne charge pas toujours complètement via le token.
            $user = Utilisateur::findOrFail($request->user()->id);

            $request->validate([
                'current_password'          => 'required|string',
                'new_password'              => 'required|string|min:8',
                'new_password_confirmation' => 'required|string',
            ], [
                'current_password.required'          => 'Le mot de passe actuel est requis.',
                'new_password.required'              => 'Le nouveau mot de passe est requis.',
                'new_password.min'                   => 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
                'new_password_confirmation.required' => 'La confirmation du nouveau mot de passe est requise.',
            ]);

            // Récupère le hash brut stocké en base, sans passer par les mutateurs ni le $hidden
            $hashActuel = $user->getRawOriginal('mot_de_passe');

            // 1. Vérifier l'ancien mot de passe
            if (!Hash::check($request->current_password, $hashActuel)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le mot de passe actuel est incorrect.',
                ], 422);
            }

            // 2. Confirmation
            if ($request->new_password !== $request->new_password_confirmation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les nouveaux mots de passe ne correspondent pas.',
                ], 422);
            }

            // 3. Nouveau ≠ ancien
            if (Hash::check($request->new_password, $hashActuel)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le nouveau mot de passe doit être différent de l\'actuel.',
                ], 422);
            }

            // 4. Règles de complexité
            $complexityError = $this->validatePasswordComplexity(
                $request->new_password,
                $user->nom
            );
            if ($complexityError) {
                return response()->json([
                    'success' => false,
                    'message' => $complexityError,
                ], 422);
            }

            // 5. Sauvegarder le nouveau mot de passe
            //    On passe par DB::table() pour bypasser totalement le mutateur
            //    setMotDePasseAttribute et éviter le double-hachage.
            $nouveauHash = Hash::make($request->new_password);
            $maintenant  = now();

            \DB::table('utilisateurs')->where('id', $user->id)->update([
                'mot_de_passe'        => $nouveauHash,
                'date_changement_mdp' => $maintenant,
            ]);

            \Log::info('Mot de passe modifié', [
                'user_id' => $user->id,
                'email'   => $user->email,
            ]);

            // 6. Révocation de TOUS les tokens → déconnexion automatique
            $user->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe modifié avec succès. Vous allez être déconnecté.',
                'logout'  => true,
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first(),
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            \Log::error('ProfileController@changePassword', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de mot de passe.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // MÉTHODES PRIVÉES
    // ══════════════════════════════════════════════════════════════════

    private function formatUser(Utilisateur $user, string $initiales, array $passwordStatus): array
    {
        return [
            'id'                 => $user->id,
            'nom'                => $user->nom,
            'email'              => $user->email,
            'est_actif'          => (bool) $user->est_actif,
            'derniere_connexion' => $user->derniere_connexion
                ? Carbon::parse($user->derniere_connexion)->format('Y-m-d H:i:s')
                : null,
            'date_creation'      => Carbon::parse($user->date_creation)->format('Y-m-d H:i:s'),
            'initiales'          => $initiales,

            'role' => $user->role ? [
                'id'          => $user->role->id,
                'code'        => $user->role->code,
                'libelle'     => $user->role->libelle,
                'description' => $user->role->description,
            ] : null,

            'direction' => $user->direction ? [
                'id'   => $user->direction->id,
                'nom'  => $user->direction->nom,
                'code' => $user->direction->code,
            ] : null,

            'password_status' => $passwordStatus,
        ];
    }

    /**
     * Calcule les initiales depuis le nom complet.
     * "Hulas Djyembi"  → "HD"
     * "Jean-Marc Koua" → "JK"
     * "Admin"          → "AD"
     */
    private function computeInitiales(string $nom): string
    {
        $parts = preg_split('/[\s\-]+/', trim($nom));
        $parts = array_filter($parts);

        if (count($parts) >= 2) {
            return strtoupper(mb_substr($parts[0], 0, 1) . mb_substr($parts[1], 0, 1));
        }

        return strtoupper(mb_substr($nom, 0, 2));
    }

    /**
     * Retourne le statut d'expiration du mot de passe.
     */
    private function getPasswordStatus(Utilisateur $user): array
    {
        $reference     = $user->date_changement_mdp ?? $user->date_creation;
        $expiresAt     = Carbon::parse($reference)->addMonths(self::PASSWORD_EXPIRY_MONTHS);
        $now           = now();
        $isExpired     = $now->greaterThan($expiresAt);
        $daysRemaining = $isExpired ? 0 : (int) $now->diffInDays($expiresAt);
        $isNearExpiry  = !$isExpired && $daysRemaining <= 15;

        return [
            'expires_at'     => $expiresAt->format('Y-m-d H:i:s'),
            'is_expired'     => $isExpired,
            'is_near_expiry' => $isNearExpiry,
            'days_remaining' => $daysRemaining,
            'changed_at'     => $user->date_changement_mdp
                ? Carbon::parse($user->date_changement_mdp)->format('Y-m-d H:i:s')
                : null,
        ];
    }

    /**
     * Valide la complexité du nouveau mot de passe.
     *
     * Règles :
     *  1. 8 caractères minimum
     *  2. Au moins 1 lettre majuscule
     *  3. Au moins 1 chiffre
     *  4. Au moins 1 caractère spécial
     *  5. Ne doit pas contenir le nom ou le prénom comme sous-chaîne
     *     (insensible à la casse et aux accents, parties ≥ 3 caractères)
     */
    private function validatePasswordComplexity(string $password, string $nom): ?string
    {
        if (mb_strlen($password) < 8) {
            return 'Le mot de passe doit contenir au moins 8 caractères.';
        }

        if (!preg_match('/[A-Z]/', $password)) {
            return 'Le mot de passe doit contenir au moins une lettre majuscule.';
        }

        if (!preg_match('/[0-9]/', $password)) {
            return 'Le mot de passe doit contenir au moins un chiffre.';
        }

        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...).';
        }

        $pwdNormalized = mb_strtolower($this->removeAccents($password));
        $parts         = preg_split('/[\s\-]+/', trim($nom));

        foreach ($parts as $part) {
            $partNormalized = mb_strtolower($this->removeAccents($part));

            if (mb_strlen($partNormalized) < 3) {
                continue;
            }

            if (str_contains($pwdNormalized, $partNormalized)) {
                return 'Le mot de passe ne doit pas contenir votre nom ou prénom.';
            }
        }

        return null;
    }

    /**
     * Supprime les accents d'une chaîne pour la comparaison.
     */
    private function removeAccents(string $str): string
    {
        $search  = ['à','â','ä','é','è','ê','ë','î','ï','ô','ö','ù','û','ü','ç',
                    'À','Â','Ä','É','È','Ê','Ë','Î','Ï','Ô','Ö','Ù','Û','Ü','Ç'];
        $replace = ['a','a','a','e','e','e','e','i','i','o','o','u','u','u','c',
                    'A','A','A','E','E','E','E','I','I','O','O','U','U','U','C'];
        return str_replace($search, $replace, $str);
    }
}