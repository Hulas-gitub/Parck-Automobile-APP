<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationsController extends Controller
{
    /**
     * 🔔 Liste paginée de TOUTES les notifications, avec l'état de lecture
     * de l'utilisateur connecté (suivi via envois_notifications, canal in_app).
     *
     * Paramètres :
     *  - etat      : all | unread | read
     *  - categorie : all | critique | important | a_surveiller | normal
     *  (le paramètre `canal` envoyé par le front est ignoré)
     */
    public function index(Request $request)
    {
        $userId    = $request->user()->id;
        $perPage   = max(1, min((int) $request->get('per_page', 10), 100));
        $etat      = $request->get('etat', 'all');
        $categorie = $request->get('categorie', 'all');

        $query = DB::table('notifications as n')
            ->leftJoin('categories_notifications as cn', 'n.categorie_id', '=', 'cn.id')
            ->leftJoin('envois_notifications as en', function ($join) use ($userId) {
                $join->on('n.id', '=', 'en.notification_id')
                     ->where('en.user_id', '=', $userId)
                     ->where('en.canal', '=', 'in_app');
            })
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
                DB::raw('CASE WHEN en.id IS NULL OR en.est_lu = 0 THEN 0 ELSE 1 END as est_lu'),
                'en.id as envoi_id',
                'en.date_lecture'
            )
            ->orderByDesc('n.date_creation')
            ->orderByDesc('n.id');

        if ($etat === 'unread') {
            $query->where(function ($q) {
                $q->whereNull('en.id')->orWhere('en.est_lu', 0);
            });
        } elseif ($etat === 'read') {
            $query->where('en.est_lu', 1);
        }

        if ($categorie !== 'all') {
            $query->where('cn.niveau_priorite', $categorie);
        }

        $notifications = $query->paginate($perPage);

        $notifications->getCollection()->transform(function ($notif) {
            $notif->time_ago = Carbon::parse($notif->date_creation)->diffForHumans();
            $notif->est_lu   = (int) $notif->est_lu;

            // Ne jamais exposer certaines clés du champ `donnees` (ex : demande_id)
            $notif->donnees = $this->sanitizeDonnees($notif->donnees);

            // Type et icône selon le niveau de priorité de la catégorie
            $niveau = strtolower($notif->categorie_couleur ?? 'normal');

            if (in_array($niveau, ['critique', 'important'], true)) {
                $notif->type  = 'error';
                $notif->icone = 'bi-exclamation-triangle-fill';
            } elseif ($niveau === 'a_surveiller') {
                $notif->type  = 'warning';
                $notif->icone = 'bi-exclamation-circle-fill';
            } else {
                $notif->type  = 'info';
                $notif->icone = 'bi-bell-fill';
            }

            return $notif;
        });

        // ── Statistiques (KPI), indépendantes des filtres ──
        $row = DB::table('notifications as n')
            ->leftJoin('categories_notifications as cn', 'n.categorie_id', '=', 'cn.id')
            ->leftJoin('envois_notifications as en', function ($join) use ($userId) {
                $join->on('n.id', '=', 'en.notification_id')
                     ->where('en.user_id', '=', $userId)
                     ->where('en.canal', '=', 'in_app');
            })
            ->selectRaw("
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN en.id IS NULL OR en.est_lu = 0 THEN 1 ELSE 0 END), 0) as unread,
                COALESCE(SUM(CASE WHEN cn.niveau_priorite IN ('critique', 'important') THEN 1 ELSE 0 END), 0) as prioritaires
            ")
            ->first();

        $total  = (int) ($row->total ?? 0);
        $unread = (int) ($row->unread ?? 0);

        return response()->json([
            'success' => true,
            'data'    => [
                'notifications' => $notifications->items(),
                'unread_count'  => $unread,
                'stats'         => [
                    'total'        => $total,
                    'unread'       => $unread,
                    'read'         => max(0, $total - $unread),
                    'prioritaires' => (int) ($row->prioritaires ?? 0),
                ],
                'current_page'  => $notifications->currentPage(),
                'last_page'     => $notifications->lastPage(),
                'per_page'      => $notifications->perPage(),
                'total'         => $notifications->total(),
            ],
        ]);
    }

    /**
     * Retire du champ `donnees` les clés qui ne doivent jamais être envoyées au front.
     * Accepte du JSON (string) ou un tableau ; renvoie le même format.
     */
    private function sanitizeDonnees($donnees)
    {
        $hidden = ['demande_id'];

        if (empty($donnees)) {
            return $donnees;
        }

        $isString = is_string($donnees);
        $data     = $isString ? json_decode($donnees, true) : (array) $donnees;

        if (!is_array($data)) {
            return $donnees; // contenu non JSON : on ne touche pas
        }

        $data = array_diff_key($data, array_flip($hidden));

        return $isString ? json_encode($data, JSON_UNESCAPED_UNICODE) : $data;
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
     * ✅ Tout marquer comme lu (sans boucle N+1)
     */
    public function markAllAsRead(Request $request)
    {
        $userId = $request->user()->id;
        $now    = now();

        // Mettre à jour les entrées existantes non lues
        $updatedCount = DB::table('envois_notifications')
            ->where('user_id', $userId)
            ->where('canal', 'in_app')
            ->where('est_lu', 0)
            ->update([
                'est_lu'            => 1,
                'date_lecture'      => $now,
                'date_modification' => $now,
            ]);

        // Insérer les entrées manquantes (notifications sans entrée d'envoi)
        $existingIds = DB::table('envois_notifications')
            ->where('user_id', $userId)
            ->where('canal', 'in_app')
            ->pluck('notification_id')
            ->toArray();

        $missingIds = DB::table('notifications')
            ->whereNotIn('id', $existingIds)
            ->pluck('id');

        $inserts = [];
        foreach ($missingIds as $id) {
            $inserts[] = [
                'notification_id'   => $id,
                'user_id'           => $userId,
                'canal'             => 'in_app',
                'statut_envoi'      => 'envoye',
                'date_envoi'        => $now,
                'est_lu'            => 1,
                'date_lecture'      => $now,
                'date_creation'     => $now,
                'date_modification' => $now,
            ];
        }

        foreach (array_chunk($inserts, 500) as $chunk) {
            DB::table('envois_notifications')->insert($chunk);
        }

        return response()->json([
            'success'       => true,
            'message'       => 'Toutes les notifications ont été marquées comme lues',
            'updated_count' => $updatedCount,
            'created_count' => count($inserts),
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
     * 🔄 Synchroniser : crée les entrées de suivi de lecture manquantes
     * (une seule requête de lecture, insertions groupées).
     */
    public function syncNotifications(Request $request)
    {
        $userId = $request->user()->id;
        $now    = now();

        $allIds = DB::table('notifications')->pluck('id');

        $existing = DB::table('envois_notifications')
            ->where('user_id', $userId)
            ->where('canal', 'in_app')
            ->pluck('notification_id')
            ->flip();

        $inserts = [];
        foreach ($allIds as $id) {
            if (!$existing->has($id)) {
                $inserts[] = [
                    'notification_id'   => $id,
                    'user_id'           => $userId,
                    'canal'             => 'in_app',
                    'statut_envoi'      => 'envoye',
                    'date_envoi'        => $now,
                    'est_lu'            => 0,
                    'date_creation'     => $now,
                    'date_modification' => $now,
                ];
            }
        }

        foreach (array_chunk($inserts, 500) as $chunk) {
            DB::table('envois_notifications')->insert($chunk);
        }

        $syncedCount = count($inserts);

        return response()->json([
            'success'      => true,
            'message'      => "{$syncedCount} entrée(s) synchronisée(s)",
            'synced_count' => $syncedCount,
        ]);
    }
}