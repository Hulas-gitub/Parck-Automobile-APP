import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import api from '../api/Auth/axios-login'; // ✅ Instance axios configurée (Bearer token auto + intercepteurs)

const Sidebar = ({ darkMode, sidebarCollapsed, setSidebarCollapsed }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // ── État utilisateur ──
  const [user, setUser] = useState(null);

  // ── Charger l'utilisateur depuis localStorage + rafraîchir via API ──
  useEffect(() => {
    // 1. Affichage immédiat depuis le localStorage (pas d'attente réseau)
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }

    // 2. Rafraîchissement depuis l'API pour avoir les données à jour
    //    Le token Bearer est injecté automatiquement par l'intercepteur de axios-login
    if (localStorage.getItem('token')) {
      api.get('/user')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Token invalide/expiré → l'intercepteur axios redirige déjà vers /login si 401
        });
    }
  }, []);

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

  // ── Déconnexion avec confirmation SweetAlert2 ──
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
      customClass: {
        popup: 'swal-logout-popup',
        confirmButton: 'swal-logout-confirm',
        cancelButton: 'swal-logout-cancel',
      },
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // Appel API logout — le token est ajouté automatiquement par l'intercepteur
        api.post('/logout')
          .catch(() => {})
          .finally(() => {
            // Nettoyage localStorage
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
              customClass: { popup: 'swal-logout-popup' },
            }).then(() => {
              navigate('/');
            });
          });
      }
    });
  };

  const [openMenus, setOpenMenus] = useState({
    configuration: false,
    audit: false,
    analyses: false
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const menuItems = [
    {
      items: [
        {
          icon: 'bi-speedometer2',
          label: 'Tableau de bord',
          onClick: () => navigate('/Admin/Navigation/Dashboard'),
          path: '/Admin/Navigation/Dashboard'
        },
        {
          icon: 'bi-car-front-fill',
          label: 'Gestion des véhicules',
          path: '/Admin/Navigation/Vehicules',
          onClick: () => navigate('/Admin/Navigation/Vehicules')
        },

        {
  icon: 'bi-fuel-pump-fill',
  label: 'Carnet de carburant',
  path: '/Admin/Navigation/CarnetCarburant',
  onClick: () => navigate('/Admin/Navigation/CarnetCarburant')
}
      ]
    },
    {
      items: [
        {
          icon: 'bi-people-fill',
          label: 'Gestion des utilisateurs',
          path: '/Admin/Navigation/Utilisateurs',
          onClick: () => navigate('/Admin/Navigation/Utilisateurs')
        }
      ]
    },
    {
      items: [
        {
          icon: 'bi-person-badge-fill',
          label: 'Gestion des chauffeurs',
          path: '/Admin/Navigation/Chauffeurs',
          onClick: () => navigate('/Admin/Navigation/Chauffeurs')
        }
      ]
    },
    {
      items: [
        {
          icon: 'bi-clipboard-check-fill',
          label: 'Interventions',
          path: '/Admin/Navigation/Interventions',
          onClick: () => navigate('/Admin/Navigation/Interventions')
        }
      ]
    },
    {
      items: [
        {
          icon: 'bi-wrench-adjustable-circle-fill',
          label: 'Inspection de véhicules',
          path: '/Admin/Navigation/InspectionVehicules',
          onClick: () => navigate('/Admin/Navigation/InspectionVehicules')
        }
      ]
    },
    {
      items: [
        {
          icon: 'bi-box-seam-fill',
          label: 'Fournisseurs & Outils',
          path: '/Admin/Navigation/FournisseursOutils',
          onClick: () => navigate('/Admin/Navigation/FournisseursOutils')
        }
      ]
    },
    {
      section: 'AUDIT & LOGS',
      items: [
        {
          icon: 'bi-shield-fill-check',
          label: 'Audit & Logs',
          hasSubmenu: true,
          key: 'audit',
          submenu: [
            {
              label: 'Historique de connexion',
              icon: 'bi-clock-fill',
              path: '/Admin/Navigation/HistoriqueConnexion',
              onClick: () => navigate('/Admin/Navigation/HistoriqueConnexion')
            },
          ]
        }
      ]
    },
    {
      section: 'RAPPORTS PREDEFINIS',
      items: [
        {
          icon: 'bi-book-fill',
          label: 'Rapports',
          hasSubmenu: true,
          key: 'analyses',
          submenu: [
            {
              label: 'Missions',
              icon: 'bi-briefcase-fill',
              path: '/Admin/Navigation/Missions',
              onClick: () => navigate('/Admin/Navigation/Missions')
            },
            {
              label: 'Accidents',
              icon: 'bi-cone-striped',
              path: '/Admin/Navigation/Accidents',
              onClick: () => navigate('/Admin/Navigation/Accidents')
            },
            {
              label: "Demande d'Intervention",
              icon: 'bi-file-earmark-bar-graph-fill',
              path: '/Admin/Navigation/DemandesInterventions',
              onClick: () => navigate('/Admin/Navigation/DemandesInterventions')
            },
            {
              label: 'Intervention de Vehicules',
              icon: 'bi-file-earmark-bar-graph-fill',
              path: '/Admin/Navigation/InterventionsVehicules',
              onClick: () => navigate('/Admin/Navigation/InterventionsVehicules')
            }
          ]
        }
      ]
    },
    {
      section: 'ANNALYS & STATISTIQUES',
      items: [
        {
          icon: 'bi-bar-chart-fill',
          label: 'Statistiques',
          hasSubmenu: true,
          submenu: [
            {
              label: 'Inventaire véhicules',
              icon: 'bi-briefcase-fill',
              path: '/Admin/Navigation/InventaireVehicules',
              onClick: () => navigate('/Admin/Navigation/InventaireVhehicules')
            },
            {
              label: "État stock d'outil",
              icon: 'bi-cone-striped',
              path: '/Admin/Navigation/Accidents',
              onClick: () => navigate('/Admin/Navigation/Accidents')
            },
            {
              label: 'Activité du système',
              icon: 'bi-file-earmark-bar-graph-fill',
              path: '/Admin/Navigation/ActiviteSysteme',
              onClick: () => navigate('/Admin/Navigation/ActiviteSysteme')
            }
          ]
        }
      ]
    },
    {
      section: 'CONFIGURATION',
      items: [
        {
          icon: 'bi-gear-fill',
          label: 'Configuration',
          hasSubmenu: true,
          key: 'configuration',
          submenu: [
            {
              label: 'Notifications',
              icon: 'bi-bell-fill',
              path: '/Admin/Configuration/Notifications',
              onClick: () => navigate('/Admin/Configuration/Notifications')
            },
            {
              label: 'Paramètres',
              icon: 'bi-gear-fill',
              path: '/Admin/Configuration/Parametres',
              onClick: () => navigate('/Admin/Configuration/Parametres')
            },
            {
              icon: 'bi-palette-fill',
              label: 'Thème',
              path: '/Admin/Navigation/Theme',
              onClick: () => navigate('/Admin/Navigation/Theme')
            }
          ]
        }
      ]
    },
    {
      items: [
        {
          icon: 'bi-person-fill',
          label: 'Mon Profil',
          path: '/Profils/MonProfil',
          onClick: () => navigate('/Profils/MonProfil')
        }
      ]
    },
  ];

  return (
    <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-40`}>

      <style>{`
        .swal-logout-popup   { border-radius: 16px !important; }
        .swal-logout-confirm { border-radius: 10px !important; font-weight: 600 !important; padding: 10px 24px !important; }
        .swal-logout-cancel  { border-radius: 10px !important; font-weight: 500 !important; padding: 10px 24px !important; color: ${darkMode ? '#d1d5db' : '#374151'} !important; }
        .swal2-timer-progress-bar { background: #22c55e !important; }
      `}</style>

      {/* ── Logo + Toggle ── */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SGS Fleet Logo" className="w-10 h-auto object-contain" />
            <div>
              <h1 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>FLeetify Management</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>GESTION DE PARC AUTO</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${sidebarCollapsed ? 'mx-auto' : ''} ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          {sidebarCollapsed ? <i className="bi bi-list text-xl"></i> : <i className="bi bi-x-lg text-xl"></i>}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>

        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!sidebarCollapsed && section.section && (
              <p className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} px-3 mb-2`}>
                {section.section}
              </p>
            )}
            {section.items.map((item, itemIdx) => {
              const itemIsActive = isActive(item.path);
              return (
                <div key={itemIdx}>
                  <button
                    onClick={() => {
                      if (item.hasSubmenu) {
                        toggleMenu(item.key);
                      } else if (item.onClick) {
                        item.onClick();
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                      itemIsActive
                        ? 'text-white shadow-md'
                        : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                    }`}
                    style={itemIsActive ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
                  >
                    <i className={`${item.icon} ${sidebarCollapsed ? 'mx-auto' : ''}`} style={{ fontSize: '1.25rem' }}></i>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                        {item.hasSubmenu && (
                          <i className={`bi bi-chevron-down text-sm transition-transform ${openMenus[item.key] ? 'rotate-180' : ''}`}></i>
                        )}
                      </>
                    )}
                  </button>

                  {!sidebarCollapsed && item.hasSubmenu && openMenus[item.key] && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu.map((subitem, subIdx) => {
                        const subitemIsActive = isActive(subitem.path);
                        return (
                          <button
                            key={subIdx}
                            onClick={() => { if (subitem.onClick) subitem.onClick(); }}
                            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-all ${
                              subitemIsActive
                                ? 'text-white shadow-sm font-medium'
                                : `${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                            }`}
                            style={subitemIsActive ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
                          >
                            {subitem.icon && <i className={`${subitem.icon}`} style={{ fontSize: '0.95rem' }}></i>}
                            {subitem.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bas de la sidebar : infos utilisateur + déconnexion ── */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className={`flex items-center gap-3 mb-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          {/* Avatar avec initiales dynamiques */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.primaryDark})` }}
          >
            {getInitials(user?.nom)}
          </div>

          {/* Nom + rôle — masqués en mode collapsed */}
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.nom || '—'}
              </p>
              <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.role?.libelle || '—'}
              </p>
            </div>
          )}
        </div>

        {/* Bouton déconnexion — version étendue */}
        {!sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: '1rem' }}></i>
            <span>Déconnexion</span>
          </button>
        )}

        {/* Bouton déconnexion — version collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 rounded-lg text-white transition-all hover:opacity-90 hover:shadow-md"
            title="Déconnexion"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: '1.25rem' }}></i>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;