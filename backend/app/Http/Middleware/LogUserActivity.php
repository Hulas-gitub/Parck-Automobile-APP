<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    /**
     * Enregistre l'activité de l'utilisateur dans le journal d'audit
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Enregistrer l'activité seulement pour les requêtes authentifiées
        if ($request->user() && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            try {
                DB::table('journaux_audit')->insert([
                    'user_id' => $request->user()->id,
                    'action' => $request->method() . ' ' . $request->path(),
                    'nom_table' => $this->extractTableName($request->path()),
                    'id_enregistrement' => $request->route('id') ?? null,
                    'anciennes_valeurs' => null,
                    'nouvelles_valeurs' => json_encode($request->except(['password', 'mot_de_passe', 'token'])),
                    'adresse_ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'date_creation' => now(),
                ]);
            } catch (\Exception $e) {
                // Log silencieux pour ne pas bloquer l'application
                \Log::error('Erreur lors de l\'enregistrement de l\'audit: ' . $e->getMessage());
            }
        }

        return $response;
    }

    /**
     * Extrait le nom de la table depuis le chemin de la requête
     */
    private function extractTableName(string $path): ?string
    {
        $segments = explode('/', $path);
        return $segments[1] ?? null;
    }
}