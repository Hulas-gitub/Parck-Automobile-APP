import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import api from '../api/Auth/axios-login';
import { 
  getNotifications, 
  readNotification, 
  readAllNotifications,
  getUnreadCount,
  syncNotifications
} from '../api/Admin-Axios/Notifications-axios';

const Header = ({ darkMode, setDarkMode, sidebarCollapsed, showNotifications, setShowNotifications, showProfile, setShowProfile }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // ── État utilisateur ──
  const [user, setUser] = useState(null);

  // ── État notifications ──
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const notificationsContainerRef = useRef(null);

  // ── Charger l'utilisateur depuis localStorage + rafraîchir via API ──
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    if (localStorage.getItem('token')) {
      api.get('/user')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  // ── Charger le compteur non lu au montage ──
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        // CORRECTION: la réponse est directement l'objet avec unread_count
        const count = response.data?.unread_count || 0;
        setUnreadCount(count);
      } catch (error) {
        console.error('Erreur chargement compteur non lu:', error);
      }
    };
    loadUnreadCount();
  }, []);

  // ── Charger les notifications (TOUTES avec état de lecture) ──
  const loadNotifications = useCallback(async (page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setNotificationsLoading(true);
    }
    
    try {
      const response = await getNotifications(page, 10);
      // CORRECTION: la structure de réponse est response.data
      const newNotifications = response.data?.notifications || [];
      const newUnreadCount = response.data?.unread_count || 0;
      
      if (append) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }
      
      setUnreadCount(newUnreadCount);
      setHasMoreNotifications(newNotifications.length === 10);
      setNotificationPage(page);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setNotificationsLoading(false);
      }
    }
  }, []);

  // ── Recharger quand le panneau s'ouvre ──
  useEffect(() => {
    if (showNotifications) {
      loadNotifications(1, false);
    }
  }, [showNotifications, loadNotifications]);

  // ── Scroll infini pour pagination ──
  const handleScroll = useCallback(() => {
    if (!notificationsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = notificationsContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50 && !loadingMore && hasMoreNotifications) {
      loadNotifications(notificationPage + 1, true);
    }
  }, [loadingMore, hasMoreNotifications, notificationPage, loadNotifications]);

  // ── Marquer une notification comme lue ──
  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await readNotification(notificationId);
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, est_lu: 1 } 
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquage lecture:', error);
    }
  };

  // ── Tout marquer comme lu ──
  const handleMarkAllAsRead = async () => {
    try {
      await readAllNotifications();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, est_lu: 1 }))
      );
      
      // Recharger le compteur
      try {
        const countResponse = await getUnreadCount();
        setUnreadCount(countResponse.data?.unread_count || 0);
      } catch (err) {
        setUnreadCount(0);
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Toutes les notifications ont été marquées comme lues',
        timer: 1500,
        showConfirmButton: false,
        background: darkMode ? '#111827' : '#ffffff',
        color: darkMode ? '#f1f5f9' : '#111827',
      });
    } catch (error) {
      console.error('Erreur marquage tout lu:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de marquer toutes les notifications comme lues',
        confirmButtonText: 'D\'accord',
        background: darkMode ? '#111827' : '#ffffff',
        color: darkMode ? '#f1f5f9' : '#111827',
        confirmButtonColor: theme.primary,
      });
    }
  };

  // ── Synchroniser les notifications (créer les entrées manquantes) ──
  const handleSyncNotifications = async () => {
    try {
      const response = await syncNotifications();
      Swal.fire({
        icon: 'success',
        title: 'Synchronisation',
        text: response.data?.message || 'Notifications synchronisées',
        timer: 1500,
        showConfirmButton: false,
        background: darkMode ? '#111827' : '#ffffff',
        color: darkMode ? '#f1f5f9' : '#111827',
      });
      // Recharger les notifications
      loadNotifications(1, false);
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de synchroniser les notifications',
        confirmButtonText: 'D\'accord',
        background: darkMode ? '#111827' : '#ffffff',
        color: darkMode ? '#f1f5f9' : '#111827',
      });
    }
  };

  // ── Naviguer vers la page des notifications ──
  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    navigate('/admin/configuration/notifications');
  };

  // ── Obtenir l'icône et la couleur selon le type ──
  const getNotificationStyle = (notification) => {
    const type = notification.type || 'info';
    if (type === 'error') {
      return { icon: 'bi-exclamation-triangle-fill', bg: 'bg-red-100', text: 'text-red-600', darkBg: 'bg-red-900/30', darkText: 'text-red-400' };
    }
    if (type === 'warning') {
      return { icon: 'bi-exclamation-triangle-fill', bg: 'bg-yellow-100', text: 'text-yellow-600', darkBg: 'bg-yellow-900/30', darkText: 'text-yellow-400' };
    }
    if (type === 'success') {
      return { icon: 'bi-check-circle-fill', bg: 'bg-green-100', text: 'text-green-600', darkBg: 'bg-green-900/30', darkText: 'text-green-400' };
    }
    return { icon: 'bi-info-circle-fill', bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400' };
  };

  // ── Initiales de l'utilisateur ──
  const getInitials = (nom) => {
    if (!nom) return '?';
    return nom
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ── Déconnexion ──
  const handleLogout = () => {
    Swal.fire({
      background: darkMode ? '#111827' : '#ffffff',
      color: darkMode ? '#f1f5f9' : '#111827',
      icon: 'question',
      iconColor: theme.primary,
      title: 'Déconnexion',
      text: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      showCancelButton: true,
      confirmButtonText: 'Oui, me déconnecter',
      cancelButtonText: 'Annuler',
      confirmButtonColor: theme.primary,
      cancelButtonColor: darkMode ? '#374151' : '#9ca3af',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        api.post('/logout')
          .catch(() => {})
          .finally(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('remember_me');
            localStorage.removeItem('expires_at');
            
            Swal.fire({
              background: darkMode ? '#111827' : '#ffffff',
              color: darkMode ? '#f1f5f9' : '#111827',
              icon: 'success',
              iconColor: '#22c55e',
              title: 'À bientôt !',
              text: 'Vous avez été déconnecté avec succès.',
              timer: 1500,
              timerProgressBar: true,
              showConfirmButton: false,
            }).then(() => {
              navigate('/');
            });
          });
      }
    });
  };

  // ── Horloge temps réel ──
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <>
      <style>{`
        .swal-logout-popup   { border-radius: 16px !important; }
        .swal-logout-confirm { border-radius: 10px !important; font-weight: 600 !important; padding: 10px 24px !important; }
        .swal-logout-cancel  { border-radius: 10px !important; font-weight: 500 !important; padding: 10px 24px !important; }
        .swal2-timer-progress-bar { background: #22c55e !important; }
        .notification-unread { background-color: ${darkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff'}; }
      `}</style>

      <header
        className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-6 py-4 flex items-center justify-between fixed top-0 right-0 z-30 transition-all duration-300`}
        style={{ left: sidebarCollapsed ? '5rem' : '18rem' }}
      >
        {/* ── Espace gauche ── */}
        <div className="flex-1"></div>

        {/* ── Titre + Date/Heure ── */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Interface d'administration
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Gestion du parc automobile
            </p>
          </div>

          <div className={`h-10 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>

          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <i className="bi bi-calendar3 text-sm" style={{ color: theme.primary }}></i>
              <span className={`text-sm font-medium capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formattedDate}
              </span>
            </div>
            <span className={`${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
            <div className="flex items-center gap-2">
              <i className="bi bi-clock-fill text-sm" style={{ color: theme.primary }}></i>
              <span className={`text-sm font-bold tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* ── Actions droite ── */}
        <div className="flex items-center gap-4 flex-1 justify-end">

          {/* Toggle dark/light */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-transform`}
          >
            {darkMode
              ? <i className="bi bi-sun-fill text-xl"></i>
              : <i className="bi bi-moon-fill text-xl"></i>
            }
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-transform relative`}
            >
              <i className="bi bi-bell-fill text-xl"></i>
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}

            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-96 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 overflow-hidden`}>
                <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                  <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Notifications
                    {unreadCount > 0 && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                        {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className={`text-xs font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                      >
                        Tout lire
                      </button>
                    )}
                    <button
                      onClick={handleSyncNotifications}
                      className={`text-xs font-medium ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                      title="Synchroniser les notifications"
                    >
                      <i className="bi bi-arrow-repeat"></i>
                    </button>
                  </div>
                </div>

                <div
                  ref={notificationsContainerRef}
                  onScroll={handleScroll}
                  className="max-h-96 overflow-y-auto"
                >
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="inline-block w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${theme.primary} transparent transparent transparent` }}></div>
                      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chargement...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <i className={`bi bi-bell-slash text-4xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune notification</p>
                    </div>
                  ) : (
                    <>
                      {notifications.map((notif) => {
                        const style = getNotificationStyle(notif);
                        const isUnread = notif.est_lu === 0;
                        return (
                          <div
                            key={notif.id}
                            className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors ${isUnread ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : (darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50')}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${darkMode ? style.darkBg : style.bg}`}>
                                <i className={`${style.icon} text-lg ${darkMode ? style.darkText : style.text}`}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {notif.titre}
                                  </p>
                                  {isUnread && (
                                    <button
                                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                                      className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
                                    >
                                      Marquer lue
                                    </button>
                                  )}
                                </div>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                  {notif.message}
                                </p>
                                {notif.vehicule_immatriculation && (
                                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                                    <i className="bi bi-car-front me-1"></i>
                                    {notif.vehicule_immatriculation}
                                  </p>
                                )}
                                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-2 flex items-center gap-1`}>
                                  <i className="bi bi-clock-history text-xs"></i>
                                  {notif.time_ago || new Date(notif.date_creation).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {loadingMore && (
                        <div className="p-4 text-center">
                          <div className="inline-block w-6 h-6 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${theme.primary} transparent transparent transparent` }}></div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className={`p-3 text-center border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={handleViewAllNotifications}
                    className={`text-sm font-bold ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                  >
                    Voir toutes les notifications
                    <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Profil utilisateur ── */}
          <div className="relative">
            <div
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:scale-110 transition-transform shadow-lg"
              style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.primaryDark})` }}
            >
              {getInitials(user?.nom)}
            </div>

            {showProfile && (
              <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50`}>
                <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.primaryDark})` }}
                    >
                      {getInitials(user?.nom)}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user?.nom || '—'}
                      </p>
                      <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user?.email || '—'}
                      </p>
                      {user?.role && (
                        <span
                          className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {user.role.libelle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {user?.direction && (
                  <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Direction</p>
                    <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {user.direction.nom}
                      {user.direction.code && (
                        <span className={`ml-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          ({user.direction.code})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {user?.derniere_connexion && (
                  <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dernière connexion</p>
                    <p className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(user.derniere_connexion).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}

                <div className="p-3">
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
};

export default Header;