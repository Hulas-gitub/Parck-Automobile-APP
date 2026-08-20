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
  const navigate  = useNavigate();

  // ── État utilisateur ──
  const [user,        setUser]        = useState(null);
  const [userReady,   setUserReady]   = useState(false);

  // ── État notifications ──
  const [notifications,        setNotifications]        = useState([]);
  const [unreadCount,          setUnreadCount]          = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationPage,     setNotificationPage]     = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [loadingMore,          setLoadingMore]          = useState(false);
  const notificationsContainerRef = useRef(null);

  // ── Charger l'utilisateur ──
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    }
    if (localStorage.getItem('token')) {
      api.get('/user')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => setUserReady(true), 450);
        });
    } else {
      setTimeout(() => setUserReady(true), 300);
    }
  }, []);

  // ── Compteur non lu ──
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        setUnreadCount(response.data?.unread_count ?? 0);
      } catch {
        setUnreadCount(0);
      }
    };
    loadUnreadCount();
  }, []);

  // ── Charger les notifications ──
  const loadNotifications = useCallback(async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else        setNotificationsLoading(true);
    try {
      const response         = await getNotifications(page, 15);
      const payload          = response.data?.data || {};
      const newNotifications = payload.notifications || [];
      const newUnreadCount   = payload.unread_count  ?? 0;
      const lastPage         = payload.last_page      ?? 1;
      if (append) setNotifications(prev => [...prev, ...newNotifications]);
      else        setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
      setHasMoreNotifications(page < lastPage);
      setNotificationPage(page);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      if (append) setLoadingMore(false);
      else        setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showNotifications) loadNotifications(1, false);
  }, [showNotifications, loadNotifications]);

  // ── Scroll infini ──
  const handleScroll = useCallback(() => {
    if (!notificationsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = notificationsContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 80 && !loadingMore && hasMoreNotifications) {
      loadNotifications(notificationPage + 1, true);
    }
  }, [loadingMore, hasMoreNotifications, notificationPage, loadNotifications]);

  // ── Marquer une notification comme lue ──
  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await readNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquage lecture:', error);
    }
  };

  // ── Tout marquer comme lu ──
  const handleMarkAllAsRead = async () => {
    try {
      await readAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      Swal.fire({
        icon: 'success', title: 'Succès',
        text: 'Toutes les notifications ont été marquées comme lues',
        timer: 1500, showConfirmButton: false,
        background: darkMode ? '#111827' : '#ffffff',
        color: darkMode ? '#f1f5f9' : '#111827',
      });
    } catch (error) {
      console.error('Erreur marquage tout lu:', error);
      Swal.fire({
        icon: 'error', title: 'Erreur',
        text: 'Impossible de marquer toutes les notifications comme lues',
        confirmButtonText: "D'accord",
        background: darkMode ? '#111827' : '#ffffff',
        color: darkMode ? '#f1f5f9' : '#111827',
        confirmButtonColor: theme.primary,
      });
    }
  };

  // ── Synchroniser ──
  const handleSyncNotifications = async () => {
    try {
      const response = await syncNotifications();
      Swal.fire({
        icon: 'success', title: 'Synchronisation',
        text: response.data?.message || 'Notifications synchronisées',
        timer: 1500, showConfirmButton: false,
        background: darkMode ? '#111827' : '#ffffff',
        color: darkMode ? '#f1f5f9' : '#111827',
      });
      loadNotifications(1, false);
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      Swal.fire({
        icon: 'error', title: 'Erreur',
        text: 'Impossible de synchroniser les notifications',
        confirmButtonText: "D'accord",
        background: darkMode ? '#111827' : '#ffffff',
        color: darkMode ? '#f1f5f9' : '#111827',
      });
    }
  };

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    navigate('/admin/configuration/notifications');
  };

  const getNotificationStyle = (notification) => {
    const type = notification.type || 'info';
    if (type === 'error')   return { icon: 'bi-exclamation-triangle-fill', bg: 'bg-red-100',    text: 'text-red-600',    darkBg: 'bg-red-900/30',    darkText: 'text-red-400'    };
    if (type === 'warning') return { icon: 'bi-exclamation-triangle-fill', bg: 'bg-yellow-100', text: 'text-yellow-600', darkBg: 'bg-yellow-900/30', darkText: 'text-yellow-400' };
    if (type === 'success') return { icon: 'bi-check-circle-fill',         bg: 'bg-green-100',  text: 'text-green-600',  darkBg: 'bg-green-900/30',  darkText: 'text-green-400'  };
    return                         { icon: 'bi-info-circle-fill',           bg: 'bg-blue-100',   text: 'text-blue-600',   darkBg: 'bg-blue-900/30',   darkText: 'text-blue-400'   };
  };

  const getInitials = (nom) => {
    if (!nom) return '?';
    return nom.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  // ── Horloge ──
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // ─────────────────────────────────────────────────────────────────────────
  // Skeleton blocks helper
  // ─────────────────────────────────────────────────────────────────────────
  const skeletonBase = (w, h, radius = '8px', delay = 0) => ({
    width: w,
    height: h,
    borderRadius: radius,
    background: darkMode
      ? 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)'
      : 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
    backgroundSize: '200% 100%',
    animation: `hdrShimmer 1.6s ease-in-out infinite`,
    animationDelay: `${delay}ms`,
    display: 'inline-block',
    flexShrink: 0,
  });

  return (
    <>
      <style>{`
        /* ── Shimmer skeleton ── */
        @keyframes hdrShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Entrée header ── */
        @keyframes hdrSlideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Entrée éléments décalée ── */
        @keyframes hdrFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Badge pulsation ── */
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50%       { transform: scale(1.08); box-shadow: 0 0 0 5px rgba(239,68,68,0); }
        }

        /* ── Panneau notifications ── */
        @keyframes panelDrop {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Item notif ── */
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* ── Profil card ── */
        @keyframes profileDrop {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Tick horloge ── */
        @keyframes tickFade {
          0%   { opacity: 1; }
          45%  { opacity: 1; }
          50%  { opacity: 0.35; }
          55%  { opacity: 1; }
          100% { opacity: 1; }
        }

        .hdr-root      { animation: hdrSlideDown 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .hdr-title     { animation: hdrFadeIn 0.45s ease 0.1s both; }
        .hdr-clock     { animation: hdrFadeIn 0.45s ease 0.18s both; }
        .hdr-actions   { animation: hdrFadeIn 0.45s ease 0.26s both; }
        .hdr-badge     { animation: badgePulse 2.2s ease-in-out infinite; }
        .notif-panel   { animation: panelDrop 0.22s cubic-bezier(0.22,1,0.36,1) both; transform-origin: top right; }
        .profile-panel { animation: profileDrop 0.22s cubic-bezier(0.22,1,0.36,1) both; transform-origin: top right; }
        .notif-item-enter { animation: notifSlideIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .clock-sep     { animation: tickFade 1s ease-in-out infinite; }

        .hdr-icon-btn {
          transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), background 0.15s ease, box-shadow 0.15s ease;
        }
        .hdr-icon-btn:hover {
          transform: scale(1.12) translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .hdr-icon-btn:active {
          transform: scale(0.96);
        }
        .hdr-avatar {
          transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease;
          cursor: pointer;
        }
        .hdr-avatar:hover {
          transform: scale(1.1) translateY(-1px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.2) !important;
        }

        .notification-panel { width: 560px; max-width: 95vw; }
        .notification-list  { max-height: 520px; }
        .notif-item         { transition: background 0.15s ease; }
      `}</style>

      <header
        className={`hdr-root ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-6 py-4 flex items-center justify-between fixed top-0 right-0 z-30 transition-all duration-300`}
        style={{ left: sidebarCollapsed ? '5rem' : '18rem' }}
      >

        {/* ── Espace gauche ── */}
        <div className="flex-1" />

        {/* ── Titre + Date/Heure ── */}
        <div className="flex items-center gap-6">

          {/* Titre — skeleton ou texte */}
          <div className="hdr-title text-center">
            {!userReady ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={skeletonBase('200px', '22px', '6px', 0)} />
              </div>
            ) : (
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Gestion de Parc automobile
              </h2>
            )}
          </div>

          <div className={`h-10 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

          {/* Date / Heure — skeleton ou horloge */}
          <div className="hdr-clock">
            {!userReady ? (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 16px', borderRadius: '12px',
                  background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                  border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
                }}
              >
                <div style={skeletonBase('16px', '16px', '50%', 0)} />
                <div style={skeletonBase('160px', '13px', '5px', 80)} />
                <div style={skeletonBase('6px', '6px', '50%', 120)} />
                <div style={skeletonBase('16px', '16px', '50%', 160)} />
                <div style={skeletonBase('72px', '14px', '5px', 200)} />
              </div>
            ) : (
              <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <i className="bi bi-calendar3 text-sm" style={{ color: theme.primary }} />
                  <span className={`text-sm font-medium capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formattedDate}
                  </span>
                </div>
                <span className={`clock-sep ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                <div className="flex items-center gap-2">
                  <i className="bi bi-clock-fill text-sm" style={{ color: theme.primary }} />
                  <span className={`text-sm font-bold tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formattedTime}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Actions droite ── */}
        <div className="hdr-actions flex items-center gap-4 flex-1 justify-end">

          {/* Toggle dark/light — skeleton ou bouton */}
          {!userReady ? (
            <div style={skeletonBase('36px', '36px', '10px', 0)} />
          ) : (
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`hdr-icon-btn p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}
            >
              {darkMode
                ? <i className="bi bi-sun-fill text-xl" />
                : <i className="bi bi-moon-fill text-xl" />
              }
            </button>
          )}

          {/* ── Notifications ── */}
          <div className="relative">
            {!userReady ? (
              <div style={skeletonBase('36px', '36px', '10px', 60)} />
            ) : (
              <>
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                  className={`hdr-icon-btn p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} relative`}
                >
                  <i className="bi bi-bell-fill text-xl" />
                </button>

                {unreadCount > 0 && (
                  <span
                    className="hdr-badge absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </>
            )}

            {/* ── Panneau notifications ── */}
            {showNotifications && (
              <div
                className={`notif-panel notification-panel absolute right-0 mt-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-2xl z-50 overflow-hidden`}
              >
                {/* En-tête */}
                <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <i className="bi bi-bell-fill text-lg" style={{ color: theme.primary }} />
                    <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                    {unreadCount > 0 && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                        {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        <i className="bi bi-check-all me-1" />Tout lire
                      </button>
                    )}
                    <button
                      onClick={handleSyncNotifications}
                      className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                      title="Synchroniser"
                    >
                      <i className="bi bi-arrow-repeat text-base" />
                    </button>
                  </div>
                </div>

                {/* Liste */}
                <div
                  ref={notificationsContainerRef}
                  onScroll={handleScroll}
                  className="notification-list overflow-y-auto"
                >
                  {notificationsLoading && notifications.length === 0 ? (
                    /* Skeleton notifications */
                    <div style={{ padding: '12px' }}>
                      {[0,1,2,3].map(i => (
                        <div key={i} style={{
                          display: 'flex', gap: '14px', padding: '14px 10px',
                          borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                          animationDelay: `${i * 80}ms`,
                        }}>
                          <div style={skeletonBase('40px', '40px', '10px', i * 80)} />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={skeletonBase('65%', '12px', '5px', i * 80 + 60)} />
                            <div style={skeletonBase('90%', '11px', '5px', i * 80 + 100)} />
                            <div style={skeletonBase('40%', '10px', '5px', i * 80 + 140)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <i className={`bi bi-bell-slash text-3xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <p className={`text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Aucune notification</p>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Vous êtes à jour !</p>
                    </div>
                  ) : (
                    <>
                      {notifications.map((notif, idx) => {
                        const style   = getNotificationStyle(notif);
                        const isUnread = notif.est_lu === 0;
                        return (
                          <div
                            key={notif.id}
                            className={`notif-item notif-item-enter px-5 py-4 border-b ${darkMode ? 'border-gray-700/60' : 'border-gray-100'} ${
                              isUnread
                                ? (darkMode ? 'bg-blue-900/15' : 'bg-blue-50/70')
                                : (darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50')
                            }`}
                            style={{ animationDelay: `${idx * 35}ms` }}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-2.5 rounded-xl flex-shrink-0 ${darkMode ? style.darkBg : style.bg}`}>
                                <i className={`${style.icon} text-xl ${darkMode ? style.darkText : style.text}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <p className={`font-bold text-sm leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {notif.titre}
                                  </p>
                                  {isUnread && (
                                    <button
                                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                                      className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                        darkMode
                                          ? 'bg-gray-700 text-gray-300 hover:bg-blue-900/40 hover:text-blue-300'
                                          : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                                      }`}
                                    >
                                      <i className="bi bi-check2 me-1" />Marquer lue
                                    </button>
                                  )}
                                </div>
                                <p className={`text-sm mt-1.5 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {notif.message}
                                </p>
                                {notif.vehicule_immatriculation && (
                                  <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-semibold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                    <i className="bi bi-car-front" />{notif.vehicule_immatriculation}
                                  </div>
                                )}
                                <p className={`text-xs mt-2 flex items-center gap-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <i className="bi bi-clock-history" />
                                  {notif.time_ago || new Date(notif.date_creation).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {loadingMore && (
                        <div className="p-4 text-center">
                          <div
                            className="inline-block w-6 h-6 rounded-full border-4 border-t-transparent animate-spin"
                            style={{ borderColor: `${theme.primary} transparent transparent transparent` }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Pied */}
                <div className={`px-5 py-3.5 border-t ${darkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50'} text-center`}>
                  <button
                    onClick={handleViewAllNotifications}
                    className={`text-sm font-bold transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    Voir toutes les notifications <i className="bi bi-arrow-right ms-2" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Avatar profil ── */}
          <div className="relative">
            {!userReady ? (
              <div style={skeletonBase('40px', '40px', '50%', 120)} />
            ) : (
              <>
                <div
                  className="hdr-avatar w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                  style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.primaryDark})` }}
                  onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                >
                  {getInitials(user?.nom)}
                </div>

                {showProfile && (
                  <div
                    className={`profile-panel absolute right-0 mt-2 w-72 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-2xl z-50 overflow-hidden`}
                  >
                    {/* Avatar + infos */}
                    <div className={`p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
                          style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.primaryDark})` }}
                        >
                          {getInitials(user?.nom)}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-base truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user?.nom || '—'}
                          </p>
                          <p className={`text-xs truncate mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user?.email || '—'}
                          </p>
                          {user?.role && (
                            <span
                              className="inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: theme.primary }}
                            >
                              {user.role.libelle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Direction */}
                    {user?.direction && (
                      <div className={`px-5 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-xs uppercase tracking-wide font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Direction</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {user.direction.nom}
                          {user.direction.code && (
                            <span className={`ml-1.5 text-xs font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              ({user.direction.code})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Dernière connexion */}
                    {user?.derniere_connexion && (
                      <div className="px-5 py-3">
                        <p className={`text-xs uppercase tracking-wide font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Dernière connexion</p>
                        <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {new Date(user.derniere_connexion).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </header>
    </>
  );
};

export default Header;