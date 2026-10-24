import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import api from '../api/Auth/axios-login';
import logoUrl from '../assets/logo.png';

// Rayons des courbes concaves de l'onglet actif
const TAB_RADIUS = 12; // items principaux
const SUB_RADIUS = 10; // items de sous-menu

// Clé de sauvegarde de la position de scroll du menu
const SCROLL_KEY = 'sidebar_scroll';

// ─────────────────────────────────────────────────────────────────────────────
// Cache au niveau du module : survit aux remontages du composant.
// Il ne repasse à false qu'au rechargement de la page (le module est
// réinitialisé) ou à la déconnexion → le skeleton, l'appel API et l'animation
// d'entrée ne se jouent donc qu'une seule fois par session.
// ─────────────────────────────────────────────────────────────────────────────
let sidebarBootstrapped = false;

const readCachedUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

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
  DALL:       'daal',
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
        path: '/Navigation/Dashboard',
        onClick: () => navigate('/Navigation/Dashboard'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC, ROLES.DALL],
      },
    ],
  },

  {
    items: [
      {
        icon: 'bi-car-front-fill',
        label: 'Gestion des véhicules',
        path: '/Navigation/Vehicules',
        onClick: () => navigate('/Navigation/Vehicules'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC, ROLES.DALL],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-truck-front-fill',
        label: 'Documents de véhicules',
        path: '/Navigation/HistoriqueVehicule',
        onClick: () => navigate('/Navigation/HistoriqueVehicule'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC, ROLES.DALL],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-fuel-pump-fill',
        label: 'Carnet de carburant',
        path: '/Navigation/CarnetCarburant',
        onClick: () => navigate('/Navigation/CarnetCarburant'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-people-fill',
        label: 'Gestion des utilisateurs',
        path: '/Navigation/Utilisateurs',
        onClick: () => navigate('/Navigation/Utilisateurs'),
        roles: [ROLES.ADMIN],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-person-badge-fill',
        label: 'Gestion des chauffeurs',
        path: '/Navigation/Chauffeurs',
        onClick: () => navigate('/Navigation/Chauffeurs'),
        roles: [ROLES.ADMIN],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-clipboard-check-fill',
        label: 'Interventions',
        path: '/Navigation/Interventions',
        onClick: () => navigate('/Navigation/Interventions'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC, ROLES.DALL],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-wrench-adjustable-circle-fill',
        label: 'Inspection de véhicules',
        path: '/Navigation/InspectionVehicules',
        onClick: () => navigate('/Navigation/InspectionVehicules'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-box-seam-fill',
        label: 'Fournisseurs & Outils',
        path: '/Navigation/FournisseursOutils',
        onClick: () => navigate('/Navigation/FournisseursOutils'),
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
            path: '/Navigation/HistoriqueConnexion',
            onClick: () => navigate('/Navigation/HistoriqueConnexion'),
          },
          {
            label: 'Activité du système',
            icon: 'bi-file-earmark-bar-graph-fill',
            path: '/Navigation/ActiviteSysteme',
            onClick: () => navigate('/Navigation/ActiviteSysteme'),
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
            label: 'Missions brousses',
            icon: 'bi-briefcase-fill',
            path: '/Navigation/Missions',
            onClick: () => navigate('/Navigation/Missions'),
            roles: [ROLES.ADMIN],
          },
          {
            label: 'Transports de Fonds',
            icon: 'bi-con-striped',
            path: '/Navigation/TransportsFonds',
            onClick: () => navigate('/Navigation/TransportsFonds'),
            roles: [ROLES.ADMIN, ROLES.CHEF_TF],
          },
        ]
      },
    ],
  },

  {
    items: [
      {
        label: ' Accidents',
        icon: 'bi-cone-striped',
        path: '/Navigation/Accidents',
        onClick: () => navigate('/Navigation/Accidents'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
      }
    ]
  },

  {
    items: [
      {
        label: 'Damandes d\'interventions',
        icon: 'bi-file-earmark-bar-graph-fill',
        path: '/Navigation/DemandesInterventions',
        onClick: () => navigate('/Navigation/DemandesInterventions'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC, ROLES.DALL],
      }
    ]
  },

  {
    items: [
      {
        label: 'Interventions enrégistrées',
        icon: 'bi-fuel-pump-fill',
        path: '/Navigation/InterventionsVehicules',
        onClick: () => navigate('/Navigation/InterventionsVehicules'),
        roles: [ROLES.ADMIN, ROLES.CHEF_PARC, ROLES.DALL],
      }
    ]
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
            path: '/Navigation/InventaireVehicules',
            onClick: () => navigate('/Navigation/InventaireVehicules'),
            roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
          },
          {
            label: "État stock d'outil",
            icon: 'bi-cone-striped',
            path: '/Navigation/EtatStock',
            onClick: () => navigate('/Navigation/EtatStock'),
            roles: [ROLES.ADMIN, ROLES.CHEF_PARC],
          },
        ],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-file-earmark-bar-graph-fill',
        label: "Rapport d'activités",
        path: '/Navigation/RapportActivites',
        onClick: () => navigate('/Navigation/RapportActivites'),
        roles: [ROLES.ADMIN, ROLES.DALL],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-bell-fill',
        label: 'Notifications',
        path: '/Navigation/Notifications',
        onClick: () => navigate('/Navigation/Notifications'),
        roles: [ROLES.ADMIN],
      },
    ],
  },
  {
    items: [
      {
        icon: 'bi-palette-fill',
        label: 'Thème',
        path: '/Navigation/Theme',
        onClick: () => navigate('/Navigation/Theme'),
        roles: [ROLES.ADMIN],
      },
    ],
  },

  /*{
    items:[
      {
        icon:'bi-gearbox-fill',
        label:'Configuration',
        path:'Navigation/Configuration',
        onClick:() => navigate('Navigation/Configuration'),
        roles:[ROLES.ADMIN],
      }
    ]
  },
  */
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
// Courbes concaves de l'onglet actif (haut + bas, collées au bord droit)
// ─────────────────────────────────────────────────────────────────────────────
const TabCorners = ({ radius, color }) => (
  <>
    <span
      aria-hidden="true"
      style={{
        position: 'absolute', right: 0, top: `-${radius}px`,
        width: radius, height: radius,
        borderBottomRightRadius: radius,
        boxShadow: `${radius / 2}px ${radius / 2}px 0 ${radius / 2}px ${color}`,
        pointerEvents: 'none',
      }}
    />
    <span
      aria-hidden="true"
      style={{
        position: 'absolute', right: 0, bottom: `-${radius}px`,
        width: radius, height: radius,
        borderTopRightRadius: radius,
        boxShadow: `${radius / 2}px -${radius / 2}px 0 ${radius / 2}px ${color}`,
        pointerEvents: 'none',
      }}
    />
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonItem = ({ darkMode, delay }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', marginBottom: '3px' }}>
    <div style={{
      width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0,
      background: darkMode
        ? 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)'
        : 'linear-gradient(90deg, #dfe2e7 25%, #eef0f3 50%, #dfe2e7 75%)',
      backgroundSize: '200% 100%',
      animation: `skeletonShimmer 1.6s ease-in-out infinite`,
      animationDelay: `${delay}ms`,
    }} />
    <div style={{
      height: '11px', borderRadius: '4px', flex: 1, maxWidth: `${50 + (delay % 35)}%`,
      background: darkMode
        ? 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)'
        : 'linear-gradient(90deg, #dfe2e7 25%, #eef0f3 50%, #dfe2e7 75%)',
      backgroundSize: '200% 100%',
      animation: `skeletonShimmer 1.6s ease-in-out infinite`,
      animationDelay: `${delay + 120}ms`,
    }} />
  </div>
);

const SidebarSkeleton = ({ darkMode }) => (
  <div style={{ padding: '4px 0' }}>
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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

  const [user,      setUser]      = useState(() => (sidebarBootstrapped ? readCachedUser() : null));
  const [userRole,  setUserRole]  = useState(() => (sidebarBootstrapped ? readCachedUser()?.role?.code ?? null : null));
  const [isLoading, setIsLoading] = useState(!sidebarBootstrapped);
  const [menuReady, setMenuReady] = useState(sidebarBootstrapped);

  // Les animations d'entrée ne se jouent que au tout premier affichage
  const playEntrance = useRef(!sidebarBootstrapped).current;
  const [openMenus, setOpenMenus] = useState({ configuration: false, audit: false, analyses: false, statistiques: false });

  // Référence vers la <nav> scrollable
  const navRef = useRef(null);

  // Mémorise le scroll en continu (survit aux remontages du composant)
  const handleNavScroll = (e) => {
    try {
      sessionStorage.setItem(SCROLL_KEY, String(e.currentTarget.scrollTop));
    } catch {
      /* sessionStorage indisponible : on ignore */
    }
  };

  useEffect(() => {
    // Déjà chargé pendant cette session : rien à refaire en naviguant
    if (sidebarBootstrapped) return undefined;

    let cancelled = false;
    const MAX_SKELETON_MS = 1200; // durée max d'affichage du skeleton (< 3s)

    let hasCachedUser = false;
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setUserRole(parsed?.role?.code ?? null);
        hasCachedUser = !!parsed?.role?.code;
      } catch {
        setUser(null);
        setUserRole(null);
      }
    }

    const showMenu = () => {
      if (cancelled) return;
      setIsLoading(false);
      requestAnimationFrame(() => {
        if (cancelled) return;
        sidebarBootstrapped = true;
        setMenuReady(true);
      });
    };

    // Utilisateur déjà en cache : on affiche le menu immédiatement, sans skeleton
    if (hasCachedUser) showMenu();

    // Sinon : skeleton, avec une limite de temps stricte
    const capTimer = hasCachedUser ? null : setTimeout(showMenu, MAX_SKELETON_MS);

    if (localStorage.getItem('token')) {
      // Rafraîchissement en arrière-plan (n'attend plus 550ms supplémentaires)
      api.get('/user', { timeout: 5000 })
        .then(res => {
          if (cancelled) return;
          if (res.data.success) {
            setUser(res.data.user);
            setUserRole(res.data.user?.role?.code ?? null);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!hasCachedUser) showMenu();
        });
    } else if (!hasCachedUser) {
      showMenu();
    }

    return () => {
      cancelled = true;
      if (capTimer) clearTimeout(capTimer);
    };
  }, []);

  // Ouvre automatiquement le sous-menu qui contient la page courante
  useEffect(() => {
    const toOpen = {};
    buildMenuItems(() => {})
      .flatMap(s => s.items)
      .forEach(it => {
        if (it.submenu?.some(s => s.path === location.pathname)) toOpen[it.key] = true;
      });
    if (Object.keys(toOpen).length) setOpenMenus(prev => ({ ...prev, ...toOpen }));
  }, [location.pathname]);

  // Restaure le scroll + amène l'élément actif dans la vue
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || isLoading) return;

    // 1) Restaure la dernière position connue
    let saved = 0;
    try {
      saved = parseInt(sessionStorage.getItem(SCROLL_KEY) || '0', 10) || 0;
    } catch {
      saved = 0;
    }
    if (saved) nav.scrollTop = saved;

    // 2) Si l'élément actif n'est pas visible, on scrolle jusqu'à lui
    const active = nav.querySelector('[data-active="true"]');
    if (active) {
      const navRect    = nav.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const hidden =
        activeRect.top < navRect.top || activeRect.bottom > navRect.bottom;
      if (hidden) {
        active.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [location.pathname, isLoading, openMenus]);

  const isVisible = (item) => {
    if (!item.roles) return true;
    if (!userRole)   return false;
    return item.roles.includes(userRole);
  };
  const filterSubmenu = (submenu) => (submenu ? submenu.filter(isVisible) : []);
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
          ['token', 'user', 'remember_me', 'expires_at'].forEach(k => localStorage.removeItem(k));
          try { sessionStorage.removeItem(SCROLL_KEY); } catch { /* ignore */ }
          sidebarBootstrapped = false;
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

  const toggleMenu = (key) => setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  const menuItems  = buildMenuItems(navigate);

  // Page sélectionnée par défaut quand l'URL ne correspond à aucun élément du menu
  const DEFAULT_PATH = '/Navigation/Dashboard';
  const currentPath  = location.pathname.replace(/\/+$/, '') || '/';
  const allPaths     = menuItems
    .flatMap(sec => sec.items)
    .flatMap(it => [it.path, ...(it.submenu || []).map(sub => sub.path)])
    .filter(Boolean);
  const hasMatch     = allPaths.includes(currentPath);
  const isActive     = (path) =>
    !!path && (currentPath === path || (!hasMatch && path === DEFAULT_PATH));

  const lineColor = darkMode ? '#1e293b' : '#f1f5f9';
  // Couleur du bord droit de l'onglet : les courbes s'y raccordent
  const tabColor  = theme.primaryDark;

  // Index global pour décaler les animations item par item
  let gi = 0;

  // ── Style bouton principal ──
  const cardBase = (active) => {
    const padV = sidebarCollapsed ? 10 : 9;
    const padH = sidebarCollapsed ? 10 : 12;
    return {
      width: active ? '100%' : `calc(100% - ${TAB_RADIUS}px)`,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      // le padding droit compense l'extension de l'onglet : le contenu ne bouge pas
      padding: `${padV}px ${padH + (active ? TAB_RADIUS : 0)}px ${padV}px ${padH}px`,
      marginBottom: '3px',
      cursor: 'pointer',
      border: 'none',
      position: 'relative',
      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
      transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
      ...(active ? {
        background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryDark})`,
        color: '#ffffff',
        borderRadius: `${TAB_RADIUS}px 0 0 ${TAB_RADIUS}px`,
        boxShadow: 'none',
      } : {
        borderRadius: '10px',
        background: darkMode ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: darkMode ? '#94a3b8' : '#4b5563',
        boxShadow: darkMode
          ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.25)'
          : 'none',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#d1d5db'}`,
      }),
    };
  };

  return (
    <aside
      style={{
        width: sidebarCollapsed ? '72px' : '260px',
        transition: 'width 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        background: darkMode
          ? 'linear-gradient(175deg, #0f172a 0%, #111827 55%, #0d1520 100%)'
          : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
        boxShadow: darkMode ? 'none' : '2px 0 12px rgba(15,23,42,0.06)',
      }}
    >
      {/* Bordure droite (passe derrière l'onglet actif) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '1px',
          background: darkMode ? '#1e293b' : '#e5e7eb',
          zIndex: 0, pointerEvents: 'none',
        }}
      />

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
        @keyframes tabIn {
          from { opacity: 0.6; }
          to   { opacity: 1; }
        }
        .sb-item-enter  { animation: slideInLeft 0.32s cubic-bezier(0.22,1,0.36,1) both; }
        .sb-item-active { animation: tabIn 0.25s ease both; }
        .sb-submenu     { animation: submenuOpen 0.22s cubic-bezier(0.22,1,0.36,1) both; transform-origin: top; }
        .sb-section     { animation: fadeInDown 0.35s ease both; }
        .sb-logo-area   { animation: fadeInDown 0.4s ease both; }
        .sb-nav-btn:hover  { transform: translateX(3px) !important; }
        .sb-nav-btn:active { transform: translateX(3px) scale(0.97) !important; }
        .sb-sub-btn:hover  { transform: translateX(4px) !important; }
        .sb-sub-btn:active { transform: translateX(4px) scale(0.97) !important; }
        /* L'onglet actif ne bouge pas : il reste collé au bord */
        .sb-nav-btn.sb-item-active:hover,
        .sb-nav-btn.sb-item-active:active,
        .sb-sub-btn.sb-sub-active:hover,
        .sb-sub-btn.sb-sub-active:active { transform: none !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .swal-logout-popup   { border-radius: 16px !important; }
        .swal-logout-confirm { border-radius: 10px !important; font-weight: 600 !important; padding: 10px 24px !important; }
        .swal-logout-cancel  { border-radius: 10px !important; font-weight: 500 !important; padding: 10px 24px !important; color: ${darkMode ? '#d1d5db' : '#374151'} !important; }
        .swal2-timer-progress-bar { background: #22c55e !important; }
      `}</style>

      {/* ══ HEADER logo + toggle ══
          Menu ouvert  : logo + titre à gauche, croix à droite (1 ligne)
          Menu réduit  : logo en haut, bouton ☰ en dessous (empilés, centrés) */}
      <div style={{
        padding: sidebarCollapsed ? '14px 0' : '14px 12px',
        borderBottom: `1px solid ${lineColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        flexShrink: 0,
      }}>
        <div className={playEntrance ? 'sb-logo-area' : undefined} style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{
            padding: sidebarCollapsed ? '5px' : '7px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)'}`,
            flexShrink: 0,
          }}>
            <img src={logoUrl} alt="Fleetify" style={{ width: '50px', height: 'auto', display: 'block' }} />
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#0f172a', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
                Fleetify Management
              </div>
              <div style={{ fontSize: '10.5px', color: darkMode ? '#475569' : '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '1px' }}>
                Gestion de parc auto
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Afficher le menu' : 'Réduire le menu'}
          style={{
            position: 'absolute',
            top: '18px',
            right: '-12px',
            width: '24px',
            height: '24px',
            padding: 0,
            borderRadius: '50%',
            border: `1px solid ${darkMode ? '#334155' : '#d1d5db'}`,
            background: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#94a3b8' : '#6b7280',
            boxShadow: darkMode ? '0 2px 6px rgba(0,0,0,0.4)' : '0 2px 6px rgba(15,23,42,0.15)',
            cursor: 'pointer',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = theme.primary; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = theme.primary; }}
          onMouseLeave={e => { e.currentTarget.style.background = darkMode ? '#1e293b' : '#ffffff'; e.currentTarget.style.color = darkMode ? '#94a3b8' : '#6b7280'; e.currentTarget.style.borderColor = darkMode ? '#334155' : '#d1d5db'; }}
        >
          <i className={sidebarCollapsed ? 'bi bi-layout-sidebar-inset' : 'bi bi-layout-sidebar'} style={{ fontSize: '12px' }} />
        </button>
      </div>

      {/* ══ NAVIGATION ══ */}
      <nav
        ref={navRef}
        onScroll={handleNavScroll}
        className="scrollbar-hide"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${TAB_RADIUS + 2}px 0 ${TAB_RADIUS + 2}px 8px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {isLoading ? (
          <div style={{ paddingRight: '8px' }}>
            <SidebarSkeleton darkMode={darkMode} />
          </div>
        ) : (
          menuItems.map((section, sIdx) => {
            const visibleItems = section.items.filter(isVisible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} style={{ marginBottom: '16px' }}>

                {/* Label section */}
                {!sidebarCollapsed && section.section && (
                  <div
                    className={playEntrance ? 'sb-section' : undefined}
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: darkMode ? '#2d3f55' : '#8b929e',
                      padding: '0 10px',
                      marginBottom: '5px',
                      animationDelay: `${sIdx * 35}ms`,
                    }}
                  >
                    {section.section}
                  </div>
                )}

                {visibleItems.map((item, iIdx) => {
                  const delay      = menuReady ? gi++ * 42 : 0;
                  const itemActive = isActive(item.path);
                  const visibleSub = filterSubmenu(item.submenu);
                  const isOpen     = !!openMenus[item.key];

                  return (
                    <div
                      key={iIdx}
                      className={playEntrance ? 'sb-item-enter' : undefined}
                      style={{
                        animationDelay: `${delay}ms`,
                        position: 'relative',
                        zIndex: itemActive ? 2 : 1,
                      }}
                    >
                      {/* ── Bouton principal ── */}
                      <button
                        className={`sb-nav-btn ${itemActive ? 'sb-item-active' : ''}`}
                        data-active={itemActive ? 'true' : undefined}
                        onClick={() => (item.hasSubmenu ? toggleMenu(item.key) : item.onClick?.())}
                        style={cardBase(itemActive)}
                        onMouseEnter={e => {
                          if (!itemActive) {
                            Object.assign(e.currentTarget.style, {
                              background: darkMode ? 'rgba(255,255,255,0.09)' : '#f8fafc',
                              color: darkMode ? '#e2e8f0' : '#111827',
                              borderColor: darkMode ? 'rgba(255,255,255,0.11)' : '#9ca3af',
                              boxShadow: 'none',
                            });
                          }
                        }}
                        onMouseLeave={e => {
                          if (!itemActive) {
                            Object.assign(e.currentTarget.style, {
                              background: darkMode ? 'rgba(255,255,255,0.04)' : 'transparent',
                              color: darkMode ? '#94a3b8' : '#4b5563',
                              borderColor: darkMode ? 'rgba(255,255,255,0.06)' : '#d1d5db',
                              boxShadow: 'none',
                            });
                          }
                        }}
                      >
                        {/* Courbes concaves de l'onglet actif */}
                        {itemActive && <TabCorners radius={TAB_RADIUS} color={tabColor} />}

                        <i
                          className={item.icon}
                          style={{ fontSize: '1.25rem', flexShrink: 0, opacity: itemActive ? 1 : 0.75, transition: 'opacity 0.2s' }}
                        />

                        {!sidebarCollapsed && (
                          <>
                            <span style={{
                              flex: 1, textAlign: 'left', fontSize: '14.5px',
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
                                  fontSize: '12px', flexShrink: 0, opacity: 0.5,
                                  transition: 'transform 0.25s cubic-bezier(0.22,1,0.36,1)',
                                  transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)',
                                }}
                              />
                            )}
                          </>
                        )}
                      </button>

                      {/* ── Sous-menu ── */}
                      {!sidebarCollapsed && item.hasSubmenu && isOpen && visibleSub.length > 0 && (
                        <div
                          className="sb-submenu"
                          style={{
                            marginLeft: '16px',
                            marginTop: '2px',
                            marginBottom: '4px',
                            paddingLeft: '12px',
                            paddingRight: 0,
                            borderLeft: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)'}`,
                          }}
                        >
                          {visibleSub.map((sub, subIdx) => {
                            const sActive = isActive(sub.path);
                            return (
                              <button
                                key={subIdx}
                                className={`sb-sub-btn ${sActive ? 'sb-sub-active' : ''}`}
                                data-active={sActive ? 'true' : undefined}
                                onClick={() => sub.onClick?.()}
                                style={{
                                  width: sActive ? '100%' : `calc(100% - ${SUB_RADIUS}px)`,
                                  boxSizing: 'border-box',
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  padding: `7px ${10 + (sActive ? SUB_RADIUS : 0)}px 7px 10px`,
                                  marginBottom: '2px',
                                  cursor: 'pointer',
                                  border: 'none',
                                  position: 'relative',
                                  fontSize: '14px',
                                  fontWeight: sActive ? 600 : 400,
                                  letterSpacing: '0.01em',
                                  transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                                  animation: playEntrance ? `slideInLeft 0.25s cubic-bezier(0.22,1,0.36,1) ${subIdx * 35}ms both` : 'none',
                                  zIndex: sActive ? 2 : 1,
                                  ...(sActive ? {
                                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryDark})`,
                                    color: '#ffffff',
                                    borderRadius: `${SUB_RADIUS}px 0 0 ${SUB_RADIUS}px`,
                                    boxShadow: 'none',
                                  } : {
                                    borderRadius: '8px',
                                    background: darkMode ? 'rgba(255,255,255,0.03)' : 'transparent',
                                    color: darkMode ? '#64748b' : '#6b7280',
                                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : '#d1d5db'}`,
                                  }),
                                }}
                                onMouseEnter={e => {
                                  if (!sActive) {
                                    Object.assign(e.currentTarget.style, {
                                      background: darkMode ? 'rgba(255,255,255,0.08)' : '#f8fafc',
                                      color: darkMode ? '#cbd5e1' : '#111827',
                                      borderColor: darkMode ? 'rgba(255,255,255,0.09)' : '#9ca3af',
                                    });
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!sActive) {
                                    Object.assign(e.currentTarget.style, {
                                      background: darkMode ? 'rgba(255,255,255,0.03)' : 'transparent',
                                      color: darkMode ? '#64748b' : '#6b7280',
                                      borderColor: darkMode ? 'rgba(255,255,255,0.04)' : '#d1d5db',
                                    });
                                  }
                                }}
                              >
                                {/* Courbes concaves du sous-onglet actif */}
                                {sActive && <TabCorners radius={SUB_RADIUS} color={tabColor} />}

                                {/* Dot */}
                                <span style={{
                                  width: '5px', height: '5px',
                                  borderRadius: '50%', flexShrink: 0,
                                  transition: 'transform 0.2s ease, background 0.2s ease',
                                  background: sActive ? 'rgba(255,255,255,0.8)' : (darkMode ? '#2d3f55' : '#b6bcc6'),
                                }} />
                                {sub.icon && <i className={sub.icon} style={{ fontSize: '1rem', opacity: 0.8 }} />}
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
        borderTop: `1px solid ${lineColor}`,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '10px', padding: '9px 10px',
          borderRadius: '10px', marginBottom: '8px',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`,
        }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontWeight: 700, fontSize: '13.5px',
            flexShrink: 0,
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
            boxShadow: `0 2px 8px ${theme.primary}45`,
          }}>
            {getInitials(user?.nom)}
          </div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: darkMode ? '#e2e8f0' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nom || '—'}
              </div>
              <div style={{ fontSize: '12px', color: darkMode ? '#475569' : '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                {user?.role?.libelle || '—'}
              </div>
            </div>
          )}
        </div>

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
            fontSize: '14.5px', fontWeight: 600,
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
          <i className="bi bi-box-arrow-right" style={{ fontSize: '1.1rem' }} />
          {!sidebarCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;