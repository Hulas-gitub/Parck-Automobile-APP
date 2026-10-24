<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ParametresSystemeController extends Controller
{
    // =========================================================================
    // GET /api/parametres/theme
    // Retourne le thème actif + la liste des thèmes NON supprimés (supprime = 0)
    // =========================================================================
    public function getTheme(): JsonResponse
    {
        $actif = DB::table('parametres_systeme')
            ->where('supprime', 0)
            ->where('est_applique', 1)
            ->orderByDesc('date_modification')
            ->first();

        $tous = DB::table('parametres_systeme')
            ->where('supprime', 0)
            ->select(
                'id', 'valeur', 'couleur',
                'primaryLight', 'primaryDark',
                'est_applique', 'date_creation', 'date_modification'
            )
            ->orderBy('id')
            ->get();

        return response()->json([
            'valeur'       => $actif?->valeur       ?? '#ffc400',
            'couleur'      => $actif?->couleur      ?? 'Orange Classique',
            'primaryLight' => $actif?->primaryLight ?? '#ffe066',
            'primaryDark'  => $actif?->primaryDark  ?? '#e6a800',
            'id_actif'     => $actif?->id           ?? null,
            'est_applique' => true,
            'themes'       => $tous,
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    // =========================================================================
    // POST /api/admin/parametres/theme
    // Crée un nouveau thème (sans l'appliquer)
    // =========================================================================
    public function storeTheme(Request $request): JsonResponse
    {
        $request->validate([
            'valeur'       => 'required|string|max:20',
            'couleur'      => 'required|string|max:100',
            'primaryLight' => 'nullable|string|max:20',
            'primaryDark'  => 'nullable|string|max:20',
        ]);

        $userId = auth()->user()?->id ?? null;

        $id = DB::table('parametres_systeme')->insertGetId([
            'valeur'              => $request->valeur,
            'couleur'             => $request->couleur,
            'primaryLight'        => $request->primaryLight,
            'primaryDark'         => $request->primaryDark,
            'est_applique'        => 0,
            'supprime'            => 0,
            'modifie_par_user_id' => $userId,
            'date_creation'       => now(),
            'date_modification'   => now(),
        ]);

        return response()->json([
            'message'      => 'Thème créé avec succès.',
            'id'           => $id,
            'valeur'       => $request->valeur,
            'couleur'      => $request->couleur,
            'primaryLight' => $request->primaryLight,
            'primaryDark'  => $request->primaryDark,
            'est_applique' => false,
        ], 201);
    }

    // =========================================================================
    // PUT /api/admin/parametres/theme/{id}/appliquer
    // est_applique=1 sur le thème choisi, 0 sur l'ancien thème actif
    // =========================================================================
    public function appliquerTheme(int $id): JsonResponse
    {
        $theme = DB::table('parametres_systeme')
            ->where('id', $id)
            ->where('supprime', 0)
            ->first();

        if (!$theme) {
            return response()->json(['message' => 'Thème introuvable.'], 404);
        }

        $userId = auth()->user()?->id ?? null;

        DB::transaction(function () use ($id, $userId) {
            // Désactiver l'ancien thème actif (une seule ligne touchée)
            DB::table('parametres_systeme')
                ->where('est_applique', 1)
                ->update([
                    'est_applique'      => 0,
                    'date_modification' => now(),
                ]);

            // Activer uniquement celui choisi
            DB::table('parametres_systeme')->where('id', $id)->update([
                'est_applique'        => 1,
                'modifie_par_user_id' => $userId,
                'date_modification'   => now(),
            ]);
        });

        return response()->json([
            'message'      => 'Thème appliqué avec succès.',
            'id'           => $id,
            'valeur'       => $theme->valeur,
            'couleur'      => $theme->couleur,
            'primaryLight' => $theme->primaryLight,
            'primaryDark'  => $theme->primaryDark,
            'est_applique' => true,
        ]);
    }

    // =========================================================================
    // DELETE /api/admin/parametres/theme/{id}
    // Suppression LOGIQUE (supprime = 1) — interdit si c'est le thème actif
    // =========================================================================
    public function destroyTheme(int $id): JsonResponse
    {
        $theme = DB::table('parametres_systeme')
            ->where('id', $id)
            ->where('supprime', 0)
            ->first();

        if (!$theme) {
            return response()->json(['message' => 'Thème introuvable.'], 404);
        }

        if ($theme->est_applique) {
            return response()->json([
                'message' => 'Impossible de supprimer le thème actuellement appliqué.',
            ], 422);
        }

        DB::table('parametres_systeme')->where('id', $id)->update([
            'supprime'            => 1,
            'modifie_par_user_id' => auth()->user()?->id ?? null,
            'date_modification'   => now(),
        ]);

        return response()->json(['message' => 'Thème supprimé avec succès.']);
    }
}