import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import api from '../api/Auth/axios-login'; // ✅ Instance axios configurée (Bearer token auto + intercepteurs)

const Header = ({ darkMode, setDarkMode, sidebarCollapsed, showNotifications, setShowNotifications, showProfile, setShowProfile }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // ── État utilisateur ──
  const [user, setUser] = React.useState(null);

  // ── Charger l'utilisateur depuis localStorage + rafraîchir via API ──
  React.useEffect(() => {
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
            // Mettre à jour le localStorage avec les données fraîches
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Token invalide/expiré → l'intercepteur axios redirige déjà vers /login si 401
        });
    }
  }, []);

  // ── Initiales de l'utilisateur (ex: "HD" pour "Hulas Djyembi") ──
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
          .catch(() => {}) // On continue même si l'appel échoue
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

  // ── Horloge temps réel ──
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
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

  const notifications = [
    { id: 1, type: 'warning', title: 'Maintenance requise', message: 'Véhicule AB-1234-GA nécessite une maintenance', time: 'Il y a 5 min', icon: 'bi-tools' },
    { id: 2, type: 'info',    title: 'Nouvelle mission',    message: 'Mission assignée à CD-5678-GA',               time: 'Il y a 15 min', icon: 'bi-geo-alt-fill' },
    { id: 3, type: 'error',   title: 'Alerte carburant',    message: 'Niveau de carburant bas pour EF-9012-GA',     time: 'Il y a 1h',     icon: 'bi-fuel-pump-fill' }
  ];

  return (
    <>
      <style>{`
        .swal-logout-popup   { border-radius: 16px !important; }
        .swal-logout-confirm { border-radius: 10px !important; font-weight: 600 !important; padding: 10px 24px !important; }
        .swal-logout-cancel  { border-radius: 10px !important; font-weight: 500 !important; padding: 10px 24px !important; }
        .swal2-timer-progress-bar { background: #22c55e !important; }
      `}</style>

      <header
        className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-6 py-4 flex items-center justify-between fixed top-0 right-0 z-30 transition-all duration-300`}
        style={{ left: sidebarCollapsed ? '5rem' : '18rem' }}
      >
        {/* ── Espace gauche (équilibre) ── */}
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
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-transform`}
            >
              <i className="bi bi-bell-fill text-xl"></i>
            </button>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              3
            </span>

            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50`}>
                <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b ${darkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'} cursor-pointer transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notif.type === 'error'   ? 'bg-red-100 text-red-600' :
                          notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                                     'bg-blue-100 text-blue-600'
                        }`}>
                          <i className={`${notif.icon} text-lg`}></i>
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{notif.title}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{notif.message}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`p-3 text-center border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button className={`text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                    Voir toutes les notifications
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

                {/* Infos utilisateur */}
                <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.primaryDark})` }}
                    >
                      {getInitials(user?.nom)}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user?.nom || '—'}
                      </p>
                      <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user?.email || '—'}
                      </p>
                      {/* Badge rôle */}
                      {user?.role && (
                        <span
                          className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: theme.primary }}
                        >
                          {user.role.libelle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direction si disponible */}
                {user?.direction && (
                  <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Direction</p>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {user.direction.nom}
                      {user.direction.code && (
                        <span className={`ml-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          ({user.direction.code})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Dernière connexion */}
                {user?.derniere_connexion && (
                  <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Dernière connexion
                    </p>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(user.derniere_connexion).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
 

              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
};

export default Header;