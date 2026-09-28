import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../api/Auth/axios-login';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Thème sombre par défaut

  // Charger la préférence du mode sombre depuis localStorage au montage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    // Si jamais défini, on reste sur dark (true par défaut)
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    }
  }, []);

  // Sauvegarder la préférence dans localStorage quand elle change
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Configuration SweetAlert2 adaptée au thème actif
  const getSwalConfig = () => ({
    background: darkMode ? '#1e293b' : '#ffffff',
    color: darkMode ? '#f1f5f9' : '#111827',
    confirmButtonColor: '#f59e0b',
    customClass: {
      popup: darkMode ? 'swal-dark-popup' : 'swal-light-popup',
      confirmButton: 'swal-confirm-btn',
    }
  });

  const showError = (message) => {
    Swal.fire({
      ...getSwalConfig(),
      icon: 'error',
      title: 'Erreur',
      text: message,
      confirmButtonText: 'Fermer',
      iconColor: '#ef4444',
      timer: 4000,
      timerProgressBar: true,
    });
  };

  const showSuccess = (userName, callback) => {
    Swal.fire({
      ...getSwalConfig(),
      icon: 'success',
      title: 'Connexion réussie !',
      text: `Bienvenue ${userName} ! Redirection en cours...`,
      confirmButtonText: 'Continuer',
      iconColor: '#22c55e',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    }).then(() => {
      callback();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/login', {
        email,
        password,
        remember_me: rememberMe
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
          localStorage.setItem('expires_at', response.data.expires_at);
        }

        setLoading(false);

        showSuccess(response.data.user.nom, () => {
          const roleCode = response.data.user.role.code;

          switch (roleCode) {
            case 'admin':
              window.location.href = '/admin/navigation/dashboard';
              break;
            case 'chef_parc':
              window.location.href = '/admin/navigation/dashboard';
              break;
            case 'chef_tf':
              window.location.href = '/dashboard-chef-tf';
              break;
            case 'mecanicien':
              window.location.href = '/dashboard-mecanicien';
              break;
            case 'agent_pc_radio':
              window.location.href = '/dashboard-pc-radio';
              break;
            case 'chauffeur':
              window.location.href = '/dashboard-chauffeur';
              break;
            default:
              window.location.href = '/dashboard';
          }
        });
      }
    } catch (error) {
      setLoading(false);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 422) {
          if (data.errors) {
            const firstErrorKey = Object.keys(data.errors)[0];
            showError(data.errors[firstErrorKey][0]);
          } else {
            showError(data.message || 'Erreur de validation');
          }
        } else if (status === 401 || status === 404) {
          showError(data.message || 'Email ou mot de passe incorrect');
        } else if (status === 403) {
          showError(data.message || 'Accès refusé');
        } else if (status === 500) {
          showError('Erreur serveur. Veuillez réessayer plus tard.');
        } else {
          showError(data.message || 'Une erreur est survenue');
        }
      } else {
        showError('Impossible de contacter le serveur');
      }
    }
  };

  // ────────────────────────────────────────────────────────────────
  // 🔑 MOT DE PASSE OUBLIÉ
  // ────────────────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    const { value: forgotEmail } = await Swal.fire({
      ...getSwalConfig(),
      title: 'Mot de passe oublié',
      html: `<p style="font-size:14px; margin-bottom:12px; color:${darkMode ? '#cbd5e1' : '#4b5563'};">
               Saisissez votre adresse email.
             </p>`,
      input: 'email',
      inputPlaceholder: 'Votre adresse email',
      inputValue: email, // pré-remplir si déjà saisi dans le formulaire
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      cancelButtonText: 'Annuler',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off',
      },
      inputValidator: (value) => {
        if (!value) {
          return 'L\'adresse email est requise';
        }
        // Validation simple du format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'L\'adresse email n\'est pas valide';
        }
      },
    });

    if (!forgotEmail) return; // annulé

    setForgotLoading(true);

    try {
      const response = await api.post('/forgot-password', { email: forgotEmail });

      setForgotLoading(false);

      if (response.data.success) {
        Swal.fire({
          ...getSwalConfig(),
          icon: 'success',
          title: 'Email envoyé !',
          text: response.data.message || 'Un nouveau mot de passe a été envoyé à votre adresse email',
          confirmButtonText: 'Fermer',
          iconColor: '#22c55e',
        });
      }
    } catch (error) {
      setForgotLoading(false);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 404) {
          showError(data.message || 'Aucun compte trouvé avec cet email');
        } else if (status === 403) {
          showError(data.message || 'Accès refusé');
        } else if (status === 422) {
          if (data.errors) {
            const firstErrorKey = Object.keys(data.errors)[0];
            showError(data.errors[firstErrorKey][0]);
          } else {
            showError(data.message || 'Erreur de validation');
          }
        } else if (status === 500) {
          showError('Erreur serveur. Veuillez réessayer plus tard.');
        } else {
          showError(data.message || 'Une erreur est survenue');
        }
      } else {
        showError('Impossible de contacter le serveur');
      }
    }
  };

  return (
    <>
      {/* Styles SweetAlert2 injectés pour le thème */}
      <style>{`
        .swal-dark-popup {
          border: 1px solid #334155 !important;
          border-radius: 16px !important;
        }
        .swal-light-popup {
          border-radius: 16px !important;
          box-shadow: 0 25px 50px rgba(0,0,0,0.15) !important;
        }
        .swal-confirm-btn {
          border-radius: 10px !important;
          font-weight: 600 !important;
          padding: 10px 28px !important;
        }
        .swal2-timer-progress-bar {
          background: #f59e0b !important;
        }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
        style={{
          background: darkMode
            ? 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)'
            : 'linear-gradient(to bottom right, #fcd34d, #fbbf24, #f59e0b)'
        }}
      >
        {/* Carte de Connexion */}
        <div
          className="w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300"
          style={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff' }}
        >
          <div className="flex flex-col md:flex-row">

            {/* Section gauche - Logo */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 -left-20 w-[600px] h-[400px] bg-white/15 rounded-full blur-3xl transform rotate-12"></div>
                <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-white/8 rounded-full blur-2xl"></div>
                <div className="absolute top-20 left-10 w-40 h-40 bg-white/12 rounded-full blur-xl"></div>
                <div className="absolute bottom-40 right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                  <path d="M -50,200 Q 100,150 200,200 T 400,220 T 600,200" stroke="white" strokeWidth="40" fill="none" opacity="0.08" strokeLinecap="round" />
                  <path d="M -50,300 Q 150,250 250,280 T 500,300 T 700,280" stroke="white" strokeWidth="50" fill="none" opacity="0.06" strokeLinecap="round" />
                  <path d="M 100,100 Q 200,80 300,120 T 500,100" stroke="white" strokeWidth="30" fill="none" opacity="0.1" strokeLinecap="round" />
                  <circle cx="80" cy="120" r="3" fill="white" opacity="0.2" />
                  <circle cx="420" cy="160" r="4" fill="white" opacity="0.15" />
                  <circle cx="150" cy="380" r="3" fill="white" opacity="0.2" />
                  <circle cx="380" cy="340" r="3" fill="white" opacity="0.18" />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
                <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-3xl flex items-center justify-center shadow-2xl p-6 transform hover:scale-105 transition-transform duration-300">
                  <img src="/sgslogo.png" alt="Logo SGS" className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">SGS</h2>
                  <p className="text-base md:text-lg text-white font-medium drop-shadow">Société Gabonaise de Services</p>
                </div>
              </div>
            </div>

            {/* Section droite - Formulaire */}
            <div
              className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center transition-colors duration-300"
              style={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff' }}
            >
              {/* Header avec toggle dark mode */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1
                    className="text-3xl md:text-4xl font-bold mb-2 transition-colors duration-300"
                    style={{ color: darkMode ? '#f1f5f9' : '#111827' }}
                  >
                    Bienvenue
                  </h1>
                  <p
                    className="text-sm md:text-base transition-colors duration-300"
                    style={{ color: darkMode ? '#cbd5e1' : '#4b5563' }}
                  >
                    Connectez-vous à votre espace
                  </p>
                </div>

              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold mb-2 transition-colors duration-300"
                    style={{ color: darkMode ? '#f1f5f9' : '#1f2937' }}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all duration-200"
                      style={{
                        backgroundColor: darkMode ? '#0f172a' : '#f9fafb',
                        borderColor: darkMode ? '#334155' : '#e5e7eb',
                        color: darkMode ? '#f1f5f9' : '#111827'
                      }}
                      placeholder="Votre adresse email"
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold transition-colors duration-300"
                      style={{ color: darkMode ? '#f1f5f9' : '#1f2937' }}
                    >
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading}
                      className="text-xs font-semibold text-yellow-500 hover:text-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? 'Envoi en cours...' : 'Mot de passe oublié ?'}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all duration-200"
                      style={{
                        backgroundColor: darkMode ? '#0f172a' : '#f9fafb',
                        borderColor: darkMode ? '#334155' : '#e5e7eb',
                        color: darkMode ? '#f1f5f9' : '#111827'
                      }}
                      placeholder="Votre mot de passe"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-yellow-500 hover:text-yellow-600 transition-colors"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Se souvenir de moi */}
                <div className="flex items-center pt-2">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400 cursor-pointer"
                      disabled={loading}
                    />
                    <span
                      className="ml-2 text-sm transition-colors duration-300"
                      style={{ color: darkMode ? '#cbd5e1' : '#374151' }}
                    >
                      Se souvenir de moi
                    </span>
                  </label>
                </div>

                {/* Bouton de connexion */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-gray-900 transition-all duration-300 transform shadow-lg mt-6 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed opacity-70'
                      : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connexion en cours...
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>

              {/* Pied de page */}
              <div
                className="mt-8 text-center text-xs transition-colors duration-300"
                style={{ color: darkMode ? '#64748b' : '#6b7280' }}
              >
                <p>© 2026 SGS - Tous droits réservés</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;