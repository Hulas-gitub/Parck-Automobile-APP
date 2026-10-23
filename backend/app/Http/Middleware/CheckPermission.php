<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        $user = $request->user()->load('role');

        // Récupérer les permissions du rôle
        $permissions = $this->getPermissionsByRole($user->role->code);

        // Vérifier si la permission existe
        if (!in_array($permission, $permissions)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission nécessaire',
                'required_permission' => $permission,
                'your_permissions' => $permissions
            ], 403);
        }

        return $next($request);
    }

    /**
     * Get permissions by role code
     */
    private function getPermissionsByRole(string $roleCode): array
    {
        $permissions = [
            'admin' => ['*'], // Admin a toutes les permissions
            
            'chef_parc' => [
                'dashboard.view',
                'vehicules.view', 'vehicules.create', 'vehicules.edit',
                'missions.view', 'missions.create', 'missions.edit',
                'interventions.view', 'interventions.create', 'interventions.edit',
                'anomalies.view', 'anomalies.edit',
                'stock.view', 'stock.create', 'stock.edit',
                'documents.view', 'documents.create',
                'rapports.view',
            ],
            
            'chef_tf' => [
                'dashboard.view',
                'missions.view', 'missions.create', 'missions.edit',
                'vehicules.view',
                'chauffeurs.view',
                'rapports.view',
            ],
            
            'mecanicien' => [
                'dashboard.view',
                'interventions.view', 'interventions.edit',
                'anomalies.view',
                'vehicules.view',
                'stock.view',
            ],
            
            'agent_pc_radio' => [
                'dashboard.view',
                'pc_radio.view', 'pc_radio.create', 'pc_radio.edit',
                'vehicules.view',
            ],
            
            'chauffeur' => [
                'dashboard.view',
                'missions.view',
                'anomalies.create',
            ],
        ];

        $rolePermissions = $permissions[$roleCode] ?? [];
        
        // Si admin, retourner toutes les permissions
        if (in_array('*', $rolePermissions)) {
            return ['*'];
        }

        return $rolePermissions;
    }
}