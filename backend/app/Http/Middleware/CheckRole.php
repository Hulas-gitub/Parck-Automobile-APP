<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Vérifier si l'utilisateur est authentifié
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        $user = $request->user()->load('role');

        // Vérifier si l'utilisateur est actif
        if (!$user->est_actif || $user->est_supprime) {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est désactivé ou supprimé'
            ], 403);
        }

        // Vérifier si l'utilisateur a un rôle
        if (!$user->role) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun rôle assigné à votre compte'
            ], 403);
        }

        // L'administrateur système a toujours accès à tout
        if ($user->role->code === 'admin') {
            return $next($request);
        }

        // Nettoyer les rôles attendus (suppression des espaces)
        $cleanRoles = array_map('trim', $roles);

        // Vérifier si le rôle de l'utilisateur est dans la liste autorisée
        if (!in_array($user->role->code, $cleanRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission d\'accéder à cette ressource',
                'required_roles' => $cleanRoles,
                'your_role' => $user->role->code
            ], 403);
        }

        return $next($request);
    }
}