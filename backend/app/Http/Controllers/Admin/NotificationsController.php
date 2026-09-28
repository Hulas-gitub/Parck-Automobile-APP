<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationsController extends Controller
{
    /**
     * 🔔 Récupère TOUTES les notifications avec l'état de lecture pour l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $userId  = $request->user()->id;
        $perPage = $request->get('per_page', 10);

        $notifications = DB::table('notifications as n')
            ->leftJoin('categories_notifications as cn', 'n.categorie_id', '=', 'cn.id')
            ->leftJoin('envois_notifications as en', function ($join) use ($userId) {
                $join->on('n.id', '=', 'en.notification_id')
                     ->where('en.user_id', '=', $userId)
                     ->where('en.canal', '=', 'in_app');
            })
            ->orderByDesc('n.date_creation')
            ->select(
                'n.id',
                'n.titre',
                'n.message',
                'n.date_creation',
                'n.vehicule_immatriculation',
                'n.lien_url',
                'n.donnees',
                'cn.libelle as categorie_nom',
                'cn.niveau_priorite as categorie_couleur',
                DB::raw('CASE
                    WHEN en.id IS NULL THEN 0
                    WHEN en.est_lu = 0 THEN 0
                    ELSE 1
                END as est_lu'),
                'en.id as envoi_id',
                'en.date_lecture'
            )
            ->paginate($perPage);

        $notifications->getCollection()->transform(function ($notif) {
            $notif->time_ago = Carbon::parse($notif->date_creation)->diffForHumans();

            // Type et icône selon le niveau de priorité de la catégorie
            //   critique / important → rouge   (expiré, < 5 j, < 15 j)
            //   a_surveiller         → orange  (< 30 j)
            //   autre                → bleu
            $niveau = strtolower($notif->categorie_couleur ?? 'normal');

            if (in_array($niveau, ['critique', 'important'], true)) {
                $notif->type  = 'error';
                $notif->icone = 'bi-exclamation-triangle-fill';
            } elseif ($niveau === 'a_surveiller') {
                $notif->type  = 'warning';
                $notif->icone = 'bi-exclamation-triangle-fill';
            } else {
                $notif->type  = 'info';
                $notif->icone = 'bi-bell-fill';
            }

            return $notif;
        });

        // ✅ Comptage optimisé en une seule requête
        $countUnread = DB::table('notifications as n')
            ->leftJoin('envois_notifications as en', function ($join) use ($userId) {
                $join->on('n.id', '=', 'en.notification_id')
                     ->where('en.user_id', '=', $userId)
                     ->where('en.canal', '=', 'in_app');
            })
            ->where(function ($query) {
                $query->whereNull('en.id')
                      ->orWhere('en.est_lu', 0);
            })
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'notifications' => $notifications->items(),
                'unread_count'  => $countUnread,
                'current_page'  => $notifications->currentPage(),
                'last_page'     => $notifications->lastPage(),
                'per_page'      => $notifications->perPage(),
                'total'         => $notifications->total(),
            ]
        ]);
    }

    /**
     * ✅ Marquer UNE notification comme lue
     */
    public function markAsRead($notificationId, Request $request)
    {
        $userId = $request->user()->id;

        $existing = DB::table('envois_notifications')
            ->where('notification_id', $notificationId)
            ->where('user_id', $userId)
            ->where('canal', 'in_app')
            ->first();

        if ($existing) {
            DB::table('envois_notifications')
                ->where('id', $existing->id)
                ->update([
                    'est_lu'            => 1,
                    'date_lecture'      => now(),
                    'date_modification' => now(),
                ]);
        } else {
            DB::table('envois_notifications')->insert([
                'notification_id'   => $notificationId,
                'user_id'           => $userId,
                'canal'             => 'in_app',
                'statut_envoi'      => 'envoye',
                'date_envoi'        => now(),
                'est_lu'            => 1,
                'date_lecture'      => now(),
                'date_creation'     => now(),
                'date_modification' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue',
        ]);
    }

    /**
     * ✅ Tout marquer comme lu — version optimisée (pas de boucle N+1)
     */
    public function markAllAsRead(Request $request)
    {
        $userId = $request->user()->id;

        // Mettre à jour les entrées existantes non lues
        $updatedCount = DB::table('envois_notifications')
            ->where('user_id', $userId)
            ->where('canal', 'in_app')
            ->where('est_lu', 0)
            ->update([
                'est_lu'            => 1,
                'date_lecture'      => now(),
                'date_modification' => now(),
            ]);

        // Insérer les entrées manquantes (notifications sans entrée envois)
        $existingIds = DB::table('envois_notifications')
            ->where('user_id', $userId)
            ->where('canal', 'in_app')
            ->pluck('notification_id')
            ->toArray();

        $missing = DB::table('notifications')
            ->whereNotIn('id', $existingIds)
            ->get();

        $createdCount = 0;
        $inserts = [];
        foreach ($missing as $notif) {
            $inserts[] = [
                'notification_id'   => $notif->id,
                'user_id'           => $userId,
                'canal'             => 'in_app',
                'statut_envoi'      => 'envoye',
                'date_envoi'        => now(),
                'est_lu'            => 1,
                'date_lecture'      => now(),
                'date_creation'     => now(),
                'date_modification' => now(),
            ];
            $createdCount++;
        }

        if (!empty($inserts)) {
            DB::table('envois_notifications')->insert($inserts);
        }

        return response()->json([
            'success'       => true,
            'message'       => 'Toutes les notifications ont été marquées comme lues',
            'updated_count' => $updatedCount,
            'created_count' => $createdCount,
        ]);
    }

    /**
     * 📊 Nombre de notifications non lues
     */
    public function getUnreadCount(Request $request)
    {
        $userId = $request->user()->id;

        $countUnread = DB::table('notifications as n')
            ->leftJoin('envois_notifications as en', function ($join) use ($userId) {
                $join->on('n.id', '=', 'en.notification_id')
                     ->where('en.user_id', '=', $userId)
                     ->where('en.canal', '=', 'in_app');
            })
            ->where(function ($query) {
                $query->whereNull('en.id')
                      ->orWhere('en.est_lu', 0);
            })
            ->count();

        return response()->json([
            'success'      => true,
            'unread_count' => $countUnread,
        ]);
    }

    /**
     * 🔄 Synchroniser les notifications (créer les entrées manquantes)
     */
    public function syncNotifications(Request $request)
    {
        $userId = $request->user()->id;

        $existingIds = DB::table('envois_notifications')
            ->where('user_id', $userId)
            ->where('canal', 'in_app')
            ->pluck('notification_id')
            ->toArray();

        $missing = DB::table('notifications')
            ->whereNotIn('id', $existingIds)
            ->get();

        $inserts = [];
        foreach ($missing as $notif) {
            $inserts[] = [
                'notification_id'   => $notif->id,
                'user_id'           => $userId,
                'canal'             => 'in_app',
                'statut_envoi'      => 'envoye',
                'date_envoi'        => now(),
                'est_lu'            => 0,
                'date_creation'     => now(),
                'date_modification' => now(),
            ];
        }

        if (!empty($inserts)) {
            DB::table('envois_notifications')->insert($inserts);
        }

        $createdCount = count($inserts);

        return response()->json([
            'success'      => true,
            'message'      => "{$createdCount} notification(s) synchronisée(s)",
            'synced_count' => $createdCount,
        ]);
    }
}