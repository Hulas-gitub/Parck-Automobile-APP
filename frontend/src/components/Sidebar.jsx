import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import api from '../api/Auth/axios-login';
import logoUrl from '../assets/logo.png';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes des rôles
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = {
  ADMIN:      'admin',
  CHEF_PARC:  'chef_parc',
  CHEF_TF:    'chef_tf',
  MECANICIEN: 'mecanicien',
  AGENT_PC:   'agent_pc_radio',
  CHAUFFEUR:  'chauffeur',
};

const ALL_ROLES = Object.values(ROLES);

// ─────────────────────────────────────────────────────────────────────────────
// Menu
// ─────────────────────────────────────────────────────────────────────────────
const buildMenuItems = (navigate) => [

  {
    items: [
      {
        icon: 'bi-speedometer2',
        label: 'Tableau de bord',
        path: '/Admin/Navigation/Dashboard',
        onClick: () => navigate('/Admin/Navigation/Dashboard'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
     
      },
    ],
  },

  {
    items: [
      {
        icon: 'bi-car-front-fill',
        label: 'Gestion des véhicules',
        path: '/Admin/Navigation/Vehicules',
        onClick: () => navigate('/Admin/Navigation/Vehicules'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
      },
    ],
  },

  {
    items: [
      {
        icon: 'bi-truck-front-fill',
        label: 'Documents de véhicules',
        path: '/Admin/Navigation/HistoriqueVehicule',
        onClick: () => navigate('/Admin/Navigation/HistoriqueVehicule'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
      },
    ],
  },

  {
    items: [
      {
        icon: 'bi-fuel-pump-fill',
        label: 'Carnet de carburant',
        path: '/Admin/Navigation/CarnetCarburant',
        onClick: () => navigate('/Admin/Navigation/CarnetCarburant'),
        roles: [ROLES.ADMIN],
      },
    ],
  },




  {
    items: [
      {
        icon: 'bi-people-fill',
        label: 'Gestion des utilisateurs',
        path: '/Admin/Navigation/Utilisateurs',
        onClick: () => navigate('/Admin/Navigation/Utilisateurs'),
        roles: [ROLES.ADMIN],
      },
    ],
  },


  {
    items: [
      {
        icon: 'bi-person-badge-fill',
        label: 'Gestion des chauffeurs',
        path: '/Admin/Navigation/Chauffeurs',
        onClick: () => navigate('/Admin/Navigation/Chauffeurs'),
        roles: [ROLES.ADMIN],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-clipboard-check-fill',
        label: 'Interventions',
        path: '/Admin/Navigation/Interventions',
        onClick: () => navigate('/Admin/Navigation/Interventions'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-wrench-adjustable-circle-fill',
        label: 'Inspection de véhicules',
        path: '/Admin/Navigation/InspectionVehicules',
        onClick: () => navigate('/Admin/Navigation/InspectionVehicules'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-box-seam-fill',
        label: 'Fournisseurs & Outils',
        path: '/Admin/Navigation/FournisseursOutils',
        onClick: () => navigate('/Admin/Navigation/FournisseursOutils'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
      },
    ],
  },
  {
    section: 'AUDIT & LOGS',
    items: [
      {
        icon: 'bi-shield-fill-check',
        label: 'Audit & Logs',
        hasSubmenu: true,
        key: 'audit',
        roles: [ROLES.ADMIN],
        submenu: [
          {
            label: 'Historique de connexion',
            icon: 'bi-clock-fill',
            path: '/Admin/Navigation/HistoriqueConnexion',
            onClick: () => navigate('/Admin/Navigation/HistoriqueConnexion'),
          },

          {
            label: 'Activité du système',
            icon: 'bi-file-earmark-bar-graph-fill',
            path: '/Admin/Navigation/ActiviteSysteme',
            onClick: () => navigate('/Admin/Navigation/ActiviteSysteme'),
            roles: [ROLES.ADMIN],
          },

        ],
      },
    ],
  },
  {
    section: 'GESTION DES OPÉRATIONS',
    items: [
      {
        icon: 'bi-clipboard2-check-fill',
        label: 'Opérations',
        hasSubmenu: true,
        key: 'analyses',
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
        submenu: [
          {
            label: 'Missions',
            icon: 'bi-briefcase-fill',
            path: '/Admin/Navigation/Missions',
            onClick: () => navigate('/Admin/Navigation/Missions'),
            roles: [ROLES.ADMIN],
          },
          {
            label: 'Accidents',
            icon: 'bi-cone-striped',
            path: '/Admin/Navigation/Accidents',
            onClick: () => navigate('/Admin/Navigation/Accidents'),
            roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
          },
          {
            label: "Demande d'Intervention",
            icon: 'bi-file-earmark-bar-graph-fill',
            path: '/Admin/Navigation/DemandesInterventions',
            onClick: () => navigate('/Admin/Navigation/DemandesInterventions'),
            roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
          },
          {
            label: 'Intervention de Vehicules',
            icon: 'bi-file-earmark-bar-graph-fill',
            path: '/Admin/Navigation/InterventionsVehicules',
            onClick: () => navigate('/Admin/Navigation/InterventionsVehicules'),
            roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
          },
        ],
      },
    ],
  },
  {
    section: 'ANALYSES & STATISTIQUES',
    items: [
      {
        icon: 'bi-bar-chart-fill',
        label: 'Statistiques',
        hasSubmenu: true,
        key: 'statistiques',
        roles: [ROLES.ADMIN],
        submenu: [
          {
            label: 'Inventaire véhicules',
            icon: 'bi-briefcase-fill',
            path: '/Admin/Navigation/InventaireVehicules',
            onClick: () => navigate('/Admin/Navigation/InventaireVehicules'),
            roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
          },
          {
            label: "État stock d'outil",
            icon: 'bi-cone-striped',
            path: '/Admin/Navigation/EtatStock',
            onClick: () => navigate('/Admin/Navigation/EtatStock'),
            roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
          },
        ],
      },
    ],
  },


{
    items: [
      {
        icon: 'bi-bell-fill',
        label: 'Notifications',
        path: '/Admin/Configuration/Notifications',
        onClick: () => navigate('/Admin/Configuration/Notifications'),
        roles: [ROLES.ADMIN],
      },
    ],
  },
  


  
{
    items: [
      {
        icon: 'bi-palette-fill',
        label: 'Thème',
        path: '/Admin/Navigation/Theme',
        onClick: () => navigate('/Admin/Navigation/Theme'),
        roles: [ROLES.ADMIN],
      },
    ],
  },
  

  {
    items: [
      {
        icon: 'bi-person-fill',
        label: 'Mon Profil',
        path: '/Profils/MonProfil',
        onClick: () => navigate('/Profils/MonProfil'),
        roles: ALL_ROLES,
      },
    ],
  },



];

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonItem = ({ darkMode, delay }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', marginBottom: '3px' }}>
    <div style={{
      width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0,
      background: darkMode
        ? 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)'
        : 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: `skeletonShimmer 1.6s ease-in-out infinite`,
      animationDelay: `${delay}ms`,
    }} />
    <div style={{
      height: '11px', borderRadius: '4px', flex: 1, maxWidth: `${50 + (delay % 35)}%`,
      background: darkMode
        ? 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)'
        : 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: `skeletonShimmer 1.6s ease-in-out infinite`,
      animationDelay: `${delay + 120}ms`,
    }} />
  </div>
);

const SidebarSkeleton = ({ darkMode }) => (
  <div style={{ padding: '4px 0' }}>
    {[0,1,2,3,4,5,6,7,8].map((i) => (
      <SkeletonItem key={i} darkMode={darkMode} delay={i * 90} />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Composant Sidebar
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({ darkMode, sidebarCollapsed, setSidebarCollapsed }) => {
  const { theme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [user,      setUser]      = useState(null);
  const [userRole,  setUserRole]  = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuReady, setMenuReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setUserRole(parsed?.role?.code ?? null);
      } catch {
        setUser(null);
        setUserRole(null);
      }
    }

    const finish = () => {
      setTimeout(() => {
        setIsLoading(false);
        requestAnimationFrame(() => setMenuReady(true));
      }, 550);
    };

    if (localStorage.getItem('token')) {
      api.get('/user')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.user);
            setUserRole(res.data.user?.role?.code ?? null);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {})
        .finally(finish);
    } else {
      finish();
    }
  }, []);

  const isVisible    = (item) => {
    if (!item.roles) return true;
    if (!userRole)   return false;
    return item.roles.includes(userRole);
  };
  const filterSubmenu = (submenu) => submenu ? submenu.filter(isVisible) : [];
  const getInitials   = (nom) => {
    if (!nom) return '?';
    return nom.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

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
      customClass: { popup: 'swal-logout-popup', confirmButton: 'swal-logout-confirm', cancelButton: 'swal-logout-cancel' },
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        api.post('/logout').catch(() => {}).finally(() => {
          ['token','user','remember_me','expires_at'].forEach(k => localStorage.removeItem(k));
          Swal.fire({
            background: darkMode ? '#111827' : '#ffffff',
            color: darkMode ? '#f1f5f9' : '#111827',
            icon: 'success', iconColor: '#22c55e',
            title: 'À bientôt !', text: 'Vous avez été déconnecté avec succès.',
            timer: 1500, timerProgressBar: true, showConfirmButton: false,
            customClass: { popup: 'swal-logout-popup' },
          }).then(() => navigate('/'));
        });
      }
    });
  };

  const [openMenus, setOpenMenus] = useState({ configuration: false, audit: false, analyses: false, statistiques: false });
  const toggleMenu = (key) => setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  const isActive   = (path) => path && location.pathname === path;
  const menuItems  = buildMenuItems(navigate);

  // Index global pour décaler les animations item par item
  let gi = 0;

  // Styles partagés
  const cardBase = (active) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: sidebarCollapsed ? '10px' : '9px 12px',
    borderRadius: '10px',
    marginBottom: '3px',
    cursor: 'pointer',
    border: 'none',
    position: 'relative',
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
    transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
    ...(active ? {
      background: `linear-gradient(135deg, ${theme.primary}f0, ${theme.primaryDark}e0)`,
      color: '#ffffff',
      boxShadow: `0 4px 16px ${theme.primary}45`,
    } : {
      background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
      color: darkMode ? '#94a3b8' : '#64748b',
      boxShadow: darkMode
        ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.25)'
        : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.07)',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)'}`,
    }),
  });

  return (
    <aside
      style={{
        width: sidebarCollapsed ? '80px' : '288px',
        transition: 'width 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        background: darkMode
          ? 'linear-gradient(175deg, #0f172a 0%, #111827 55%, #0d1520 100%)'
          : 'linear-gradient(175deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)',
        borderRight: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
      }}
    >

      {/* ══ Styles globaux ══ */}
      <style>{`
        @keyframes skeletonShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes submenuOpen {
          from { opacity: 0; transform: translateY(-6px) scaleY(0.94); }
          to   { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.93) translateX(-6px); }
          65%  { transform: scale(1.015) translateX(1px); }
          100% { opacity: 1; transform: scale(1) translateX(0); }
        }
        .sb-item-enter { animation: slideInLeft 0.32s cubic-bezier(0.22,1,0.36,1) both; }
        .sb-item-active { animation: popIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
        .sb-submenu     { animation: submenuOpen 0.22s cubic-bezier(0.22,1,0.36,1) both; transform-origin: top; }
        .sb-section     { animation: fadeInDown 0.35s ease both; }
        .sb-logo-area   { animation: fadeInDown 0.4s ease both; }
        .sb-nav-btn:hover { transform: translateX(3px) !important; }
        .sb-nav-btn:active { transform: translateX(3px) scale(0.97) !important; }
        .sb-sub-btn:hover  { transform: translateX(4px) !important; }
        .sb-sub-btn:active { transform: translateX(4px) scale(0.97) !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .swal-logout-popup   { border-radius: 16px !important; }
        .swal-logout-confirm { border-radius: 10px !important; font-weight: 600 !important; padding: 10px 24px !important; }
        .swal-logout-cancel  { border-radius: 10px !important; font-weight: 500 !important; padding: 10px 24px !important; color: ${darkMode ? '#d1d5db' : '#374151'} !important; }
        .swal2-timer-progress-bar { background: #22c55e !important; }
      `}</style>

      {/* ══ HEADER logo + toggle ══ */}
      <div style={{
        padding: '14px 12px',
        borderBottom: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        flexShrink: 0,
        gap: '8px',
      }}>
        <div className="sb-logo-area" style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {/* Contenant logo */}
          <div style={{
            padding: '7px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)'}`,
            flexShrink: 0,
          }}>
            <img src={logoUrl} alt="Fleetify" style={{ width: '24px', height: 'auto', display: 'block' }} />
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#0f172a', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
                Fleetify Management
              </div>
              <div style={{ fontSize: '9.5px', color: darkMode ? '#475569' : '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '1px' }}>
                Gestion de parc auto
              </div>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            padding: '6px 7px',
            borderRadius: '8px',
            border: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
            background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
            color: darkMode ? '#475569' : '#94a3b8',
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s ease',
            marginLeft: sidebarCollapsed ? 'auto' : '0',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)'; e.currentTarget.style.color = darkMode ? '#94a3b8' : '#475569'; }}
          onMouseLeave={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)'; e.currentTarget.style.color = darkMode ? '#475569' : '#94a3b8'; }}
        >
          <i className={sidebarCollapsed ? 'bi bi-list' : 'bi bi-x-lg'} style={{ fontSize: sidebarCollapsed ? '16px' : '13px' }} />
        </button>
      </div>

      {/* ══ NAVIGATION ══ */}
      <nav
        className="scrollbar-hide"
        style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoading ? (
          <SidebarSkeleton darkMode={darkMode} />
        ) : (
          menuItems.map((section, sIdx) => {
            const visibleItems = section.items.filter(isVisible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} style={{ marginBottom: '16px' }}>

                {/* Label section */}
                {!sidebarCollapsed && section.section && (
                  <div
                    className="sb-section"
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: darkMode ? '#2d3f55' : '#c8d5e3',
                      padding: '0 10px',
                      marginBottom: '5px',
                      animationDelay: `${sIdx * 35}ms`,
                    }}
                  >
                    {section.section}
                  </div>
                )}

                {visibleItems.map((item, iIdx) => {
                  const delay       = menuReady ? gi++ * 42 : 0;
                  const itemActive  = isActive(item.path);
                  const visibleSub  = filterSubmenu(item.submenu);

                  return (
                    <div
                      key={iIdx}
                      className="sb-item-enter"
                      style={{ animationDelay: `${delay}ms` }}
                    >
                      {/* ── Bouton principal ── */}
                      <button
                        className={`sb-nav-btn ${itemActive ? 'sb-item-active' : ''}`}
                        onClick={() => item.hasSubmenu ? toggleMenu(item.key) : item.onClick?.()}
                        style={cardBase(itemActive)}
                        onMouseEnter={e => {
                          if (!itemActive) {
                            Object.assign(e.currentTarget.style, {
                              background: darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.07)',
                              color: darkMode ? '#e2e8f0' : '#1e293b',
                              borderColor: darkMode ? 'rgba(255,255,255,0.11)' : 'rgba(15,23,42,0.11)',
                              boxShadow: darkMode
                                ? 'inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 10px rgba(0,0,0,0.35)'
                                : 'inset 0 1px 0 rgba(255,255,255,1), 0 2px 10px rgba(0,0,0,0.1)',
                            });
                          }
                        }}
                        onMouseLeave={e => {
                          if (!itemActive) {
                            Object.assign(e.currentTarget.style, {
                              background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                              color: darkMode ? '#94a3b8' : '#64748b',
                              borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)',
                              boxShadow: darkMode
                                ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.25)'
                                : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.07)',
                            });
                          }
                        }}
                      >
                        {/* Barre indicateur active */}
                        {itemActive && (
                          <span style={{
                            position: 'absolute', left: 0, top: '50%',
                            transform: 'translateY(-50%)',
                            width: '3px', height: '55%',
                            background: 'rgba(255,255,255,0.55)',
                            borderRadius: '0 3px 3px 0',
                          }} />
                        )}

                        <i
                          className={item.icon}
                          style={{ fontSize: '1.1rem', flexShrink: 0, opacity: itemActive ? 1 : 0.75, transition: 'opacity 0.2s' }}
                        />

                        {!sidebarCollapsed && (
                          <>
                            <span style={{
                              flex: 1, textAlign: 'left', fontSize: '13px',
                              fontWeight: itemActive ? 600 : 500,
                              letterSpacing: '0.01em',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {item.label}
                            </span>
                            {item.hasSubmenu && (
                              <i
                                className="bi bi-chevron-down"
                                style={{
                                  fontSize: '10px', flexShrink: 0, opacity: 0.5,
                                  transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
                                  transform: openMenus[item.key] ? 'rotate(-180deg)' : 'rotate(0deg)',
                                }}
                              />
                            )}
                          </>
                        )}
                      </button>

                      {/* ── Sous-menu ── */}
                      {!sidebarCollapsed && item.hasSubmenu && openMenus[item.key] && visibleSub.length > 0 && (
                        <div
                          className="sb-submenu"
                          style={{
                            marginLeft: '16px',
                            marginTop: '2px',
                            marginBottom: '4px',
                            paddingLeft: '12px',
                            borderLeft: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)'}`,
                          }}
                        >
                          {visibleSub.map((sub, subIdx) => {
                            const subActive = isActive(sub.path);
                            return (
                              <button
                                key={subIdx}
                                className="sb-sub-btn"
                                onClick={() => sub.onClick?.()}
                                style={{
                                  width: '100%',
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  marginBottom: '2px',
                                  cursor: 'pointer',
                                  border: 'none',
                                  fontSize: '12.5px',
                                  fontWeight: subActive ? 600 : 400,
                                  letterSpacing: '0.01em',
                                  transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                                  animation: `slideInLeft 0.25s cubic-bezier(0.22,1,0.36,1) ${subIdx * 35}ms both`,
                                  ...(subActive ? {
                                    background: `linear-gradient(135deg, ${theme.primary}cc, ${theme.primaryDark}bb)`,
                                    color: '#ffffff',
                                    boxShadow: `0 2px 10px ${theme.primary}35`,
                                  } : {
                                    background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.025)',
                                    color: darkMode ? '#64748b' : '#94a3b8',
                                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.05)'}`,
                                  }),
                                }}
                                onMouseEnter={e => {
                                  if (!subActive) {
                                    Object.assign(e.currentTarget.style, {
                                      background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                                      color: darkMode ? '#cbd5e1' : '#334155',
                                      borderColor: darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.1)',
                                    });
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!subActive) {
                                    Object.assign(e.currentTarget.style, {
                                      background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.025)',
                                      color: darkMode ? '#64748b' : '#94a3b8',
                                      borderColor: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.05)',
                                    });
                                  }
                                }}
                              >
                                {/* Dot */}
                                <span style={{
                                  width: '5px', height: '5px',
                                  borderRadius: '50%', flexShrink: 0,
                                  transition: 'transform 0.2s ease, background 0.2s ease',
                                  background: subActive ? 'rgba(255,255,255,0.8)' : (darkMode ? '#2d3f55' : '#cbd5e1'),
                                }} />
                                {sub.icon && <i className={sub.icon} style={{ fontSize: '0.85rem', opacity: 0.8 }} />}
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </nav>

      {/* ══ FOOTER utilisateur ══ */}
      <div style={{
        padding: '10px',
        borderTop: `1px solid ${darkMode ? '#1e293b' : '#e2e8f0'}`,
        flexShrink: 0,
      }}>
        {/* Carte utilisateur */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '10px', padding: '9px 10px',
          borderRadius: '10px', marginBottom: '8px',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)'}`,
        }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontWeight: 700, fontSize: '12px',
            flexShrink: 0,
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
            boxShadow: `0 2px 8px ${theme.primary}45`,
          }}>
            {getInitials(user?.nom)}
          </div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: darkMode ? '#e2e8f0' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nom || '—'}
              </div>
              <div style={{ fontSize: '10.5px', color: darkMode ? '#475569' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                {user?.role?.libelle || '—'}
              </div>
            </div>
          )}
        </div>

        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Déconnexion' : ''}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px',
            padding: sidebarCollapsed ? '9px' : '9px 14px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
            color: '#ffffff',    
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
            boxShadow: `0 2px 12px ${theme.primary}45`,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '0.87';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = `0 5px 18px ${theme.primary}55`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 2px 12px ${theme.primary}45`;
          }}
        >
          <i className="bi bi-box-arrow-right" style={{ fontSize: '1rem' }} />
          {!sidebarCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;