<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationsController extends Controller
{
    /**
     * 🔔 Récupère TOUTES les notifications de la table notifications
     * Avec l'état de lecture pour l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $perPage = $request->get('per_page', 10);

        // Récupérer TOUTES les notifications avec l'état de lecture pour cet utilisateur
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
                'cn.nom as categorie_nom',
                'cn.couleur as categorie_couleur',
                // CORRECTION: Si pas d'entrée OU est_lu = 0, alors non lu (1 = non lu pour l'affichage)
                DB::raw('CASE 
                    WHEN en.id IS NULL THEN 0 
                    WHEN en.est_lu = 0 THEN 0 
                    ELSE 1 
                END as est_lu'),
                'en.id as envoi_id',
                'en.date_lecture'
            )
            ->paginate($perPage);

        // Ajout du temps relatif et détermination du type/icône
        $notifications->getCollection()->transform(function ($notif) {
            $notif->time_ago = Carbon::parse($notif->date_creation)->diffForHumans();
            
            // Déterminer le type et l'icône en fonction de la catégorie ou du titre
            $categorie = strtolower($notif->categorie_nom ?? '');
            $titre = strtolower($notif->titre ?? '');
            
            if (str_contains($categorie, 'alerte') || str_contains($titre, 'alerte')) {
                $notif->type = 'error';
                $notif->icone = 'bi-exclamation-triangle-fill';
            } elseif (str_contains($categorie, 'warning') || str_contains($titre, 'warning')) {
                $notif->type = 'warning';
                $notif->icone = 'bi-exclamation-triangle-fill';
            } elseif (str_contains($categorie, 'info') || str_contains($titre, 'info')) {
                $notif->type = 'info';
                $notif->icone = 'bi-info-circle-fill';
            } else {
                $notif->type = 'info';
                $notif->icone = 'bi-bell-fill';
            }
            
            return $notif;
        });

        // CORRECTION: Compter les notifications non lues (pas d'entrée OU est_lu = 0)
        $countUnread = DB::table('notifications as n')
            ->leftJoin('envois_notifications as en', function ($join) use ($userId) {
                $join->on('n.id', '=', 'en.notification_id')
                     ->where('en.user_id', '=', $userId)
                     ->where('en.canal', '=', 'in_app');
            })
            ->where(function ($query) {
                $query->whereNull('en.id')           // Pas d'entrée = non lu
                      ->orWhere('en.est_lu', 0);     // Ou explicitement non lu
            })
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications->items(),
                'unread_count' => $countUnread,
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ]
        ]);
    }

    /**
     * ✅ Marquer UNE notification comme lue pour l'utilisateur connecté
     * (Crée l'entrée dans envois_notifications si elle n'existe pas)
     */
    public function markAsRead($notificationId, Request $request)
    {
        $userId = $request->user()->id;

        // Vérifier si l'envoi existe déjà
        $existing = DB::table('envois_notifications')
            ->where('notification_id', $notificationId)
            ->where('user_id', $userId)
            ->where('canal', 'in_app')
            ->first();

        if ($existing) {
            // Mettre à jour l'existant
            DB::table('envois_notifications')
                ->where('id', $existing->id)
                ->update([
                    'est_lu' => 1,
                    'date_lecture' => now(),
                    'date_modification' => now()
                ]);
        } else {
            // Créer une nouvelle entrée
            DB::table('envois_notifications')->insert([
                'notification_id' => $notificationId,
                'user_id' => $userId,
                'canal' => 'in_app',
                'statut_envoi' => 'envoye',
                'date_envoi' => now(),
                'est_lu' => 1,
                'date_lecture' => now(),
                'date_creation' => now(),
                'date_modification' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue'
        ]);
    }

    /**
     * ✅ Tout marquer comme lu pour l'utilisateur connecté
     * (Crée les entrées manquantes dans envois_notifications)
     */
    public function markAllAsRead(Request $request)
    {
        $userId = $request->user()->id;

        // Récupérer toutes les notifications
        $notifications = DB::table('notifications')->get();
        
        $updatedCount = 0;
        $createdCount = 0;

        foreach ($notifications as $notif) {
            $existing = DB::table('envois_notifications')
                ->where('notification_id', $notif->id)
                ->where('user_id', $userId)
                ->where('canal', 'in_app')
                ->first();

            if ($existing) {
                if ($existing->est_lu == 0) {
                    DB::table('envois_notifications')
                        ->where('id', $existing->id)
                        ->update([
                            'est_lu' => 1,
                            'date_lecture' => now(),
                            'date_modification' => now()
                        ]);
                    $updatedCount++;
                }
            } else {
                DB::table('envois_notifications')->insert([
                    'notification_id' => $notif->id,
                    'user_id' => $userId,
                    'canal' => 'in_app',
                    'statut_envoi' => 'envoye',
                    'date_envoi' => now(),
                    'est_lu' => 1,
                    'date_lecture' => now(),
                    'date_creation' => now(),
                    'date_modification' => now(),
                ]);
                $createdCount++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues',
            'updated_count' => $updatedCount,
            'created_count' => $createdCount
        ]);
    }

    /**
     * 📊 Obtenir le nombre de notifications non lues pour l'utilisateur connecté
     */
    public function getUnreadCount(Request $request)
    {
        $userId = $request->user()->id;

        // Compter les notifications non lues (pas d'entrée OU est_lu = 0)
        $countUnread = DB::table('notifications as n')
            ->leftJoin('envois_notifications as en', function ($join) use ($userId) {
                $join->on('n.id', '=', 'en.notification_id')
                     ->where('en.user_id', '=', $userId)
                     ->where('en.canal', '=', 'in_app');
            })
            ->where(function ($query) {
                $query->whereNull('en.id')      // Pas d'entrée = non lu
                      ->orWhere('en.est_lu', 0); // Ou explicitement non lu
            })
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $countUnread
        ]);
    }

    /**
     * 🔄 Forcer la synchronisation (créer les entrées manquantes dans envois_notifications)
     * Utile pour initialiser le suivi de lecture pour un utilisateur
     */
    public function syncNotifications(Request $request)
    {
        $userId = $request->user()->id;

        // Récupérer toutes les notifications
        $allNotifications = DB::table('notifications')->get();
        
        // Récupérer les IDs déjà présents
        $existingIds = DB::table('envois_notifications')
            ->where('user_id', $userId)
            ->where('canal', 'in_app')
            ->pluck('notification_id')
            ->toArray();

        $createdCount = 0;

        foreach ($allNotifications as $notif) {
            if (!in_array($notif->id, $existingIds)) {
                DB::table('envois_notifications')->insert([
                    'notification_id' => $notif->id,
                    'user_id' => $userId,
                    'canal' => 'in_app',
                    'statut_envoi' => 'envoye',
                    'date_envoi' => now(),
                    'est_lu' => 0,
                    'date_creation' => now(),
                    'date_modification' => now(),
                ]);
                $createdCount++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "{$createdCount} notification(s) synchronisée(s)",
            'synced_count' => $createdCount
        ]);
    }
}