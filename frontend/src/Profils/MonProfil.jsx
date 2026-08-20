import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import profileApi from '../api/profile-axios'; // ✅ Instance axios dédiée au profil


const PasswordInput = React.memo(({
  id, label, value, onChange, show, onToggle, placeholder, disabled, darkMode,
}) => (
  <div>
    <label
      htmlFor={id}
      className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
    >
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <i className={`bi bi-lock-fill text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
      </div>
      <input
        type={show ? 'text' : 'password'}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="new-password"
        className={`w-full pl-10 pr-12 py-3 rounded-xl border-2 focus:outline-none focus:ring-0 transition-all duration-200 ${
          darkMode
            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-500'
            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-yellow-400'
        }`}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex items-center pr-4 transition-colors ${
          darkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'
        }`}
      >
        <i className={`bi ${show ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-sm`} />
      </button>
    </div>
  </div>
));
PasswordInput.displayName = 'PasswordInput';

// ══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════
const MonProfile = () => {

  // ── Dark mode ──────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('fleetify_darkMode');
      return saved !== null ? saved === 'true' : true;
    } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {}
  }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed]     = useState(false);
  const [showNotifications, setShowNotifications]   = useState(false);
  const [showProfile, setShowProfile]               = useState(false);
  const [activeTab, setActiveTab]                   = useState('profil');
  const [isEditing, setIsEditing]                   = useState(false);
  const [loadingProfile, setLoadingProfile]         = useState(false);
  const [loadingPassword, setLoadingPassword]       = useState(false);
  const { theme }   = useTheme();
  const navigate    = useNavigate();

  // ── Référence stable à l'utilisateur localStorage ──────────
  const storedUserRef = useRef(null);
  if (!storedUserRef.current) {
    try { storedUserRef.current = JSON.parse(localStorage.getItem('user')) || {}; }
    catch { storedUserRef.current = {}; }
  }
  const storedUser = storedUserRef.current;

  // ── État du profil ──────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    nom:                storedUser.nom                 || '',
    email:              storedUser.email               || '',
    role:               storedUser.role?.libelle       || '',
    direction:          storedUser.direction?.nom      || '',
    derniere_connexion: storedUser.derniere_connexion  || '',
    est_actif:          storedUser.est_actif           ?? true,
    initiales:          storedUser.initiales           || '',
    password_status:    storedUser.password_status     || null,
  });

  const [editData, setEditData] = useState({
    nom:   profileData.nom,
    email: profileData.email,
  });

  // ── Rafraîchissement depuis l'API (une seule fois au montage) ─
  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    profileApi.get('/profile')
      .then(res => {
        if (res.data.success) {
          const u = res.data.user;
          localStorage.setItem('user', JSON.stringify(u));
          storedUserRef.current = u;

          const fresh = {
            nom:                u.nom                   || '',
            email:              u.email                 || '',
            role:               u.role?.libelle         || '',
            direction:          u.direction?.nom        || '',
            derniere_connexion: u.derniere_connexion    || '',
            est_actif:          u.est_actif             ?? true,
            initiales:          u.initiales             || '',
            password_status:    u.password_status       || null,
          };
          setProfileData(fresh);
          // Ne pas écraser editData si l'utilisateur édite déjà
          setEditData(prev => isEditing ? prev : { nom: fresh.nom, email: fresh.email });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mot de passe ────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password:     '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new:     false,
    confirm: false,
  });

  // ── Handlers stables (useCallback) pour éviter les re-renders ─
  // Ces handlers sont stables → PasswordInput ne se remonte pas
  const handleCurrentPasswordChange = useCallback(
    (e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value })),
    []
  );
  const handleNewPasswordChange = useCallback(
    (e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value })),
    []
  );
  const handleConfirmPasswordChange = useCallback(
    (e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value })),
    []
  );
  const toggleCurrentPassword = useCallback(
    () => setShowPasswords(prev => ({ ...prev, current: !prev.current })),
    []
  );
  const toggleNewPassword = useCallback(
    () => setShowPasswords(prev => ({ ...prev, new: !prev.new })),
    []
  );
  const toggleConfirmPassword = useCallback(
    () => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm })),
    []
  );

  const isAdmin = storedUser.role?.code === 'admin' || storedUser.role?.code === 'dmin';

  // ── Initiales (fallback si API ne répond pas encore) ────────
  const getInitiales = () => {
    if (profileData.initiales) return profileData.initiales;
    const parts = (profileData.nom || '').split(/[\s-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (profileData.nom || '?').slice(0, 2).toUpperCase();
  };

  // ── SweetAlert config ───────────────────────────────────────
  const getSwalConfig = () => ({
    background: darkMode ? '#111827' : '#ffffff',
    color:      darkMode ? '#f1f5f9' : '#111827',
    confirmButtonColor: theme.primary,
    customClass: { popup: 'swal-profile-popup', confirmButton: 'swal-confirm-btn' },
  });

  // ✅ Succès : fermeture automatique après 2.5s, PAS de bouton
  const showSuccess = (msg) => Swal.fire({
    ...getSwalConfig(),
    icon:              'success',
    title:             'Succès',
    text:              msg,
    timer:             2500,
    timerProgressBar:  true,
    showConfirmButton: false,
    allowOutsideClick: false,
    iconColor:         '#22c55e',
  });

  // ✅ Erreur : bouton "D'accord" obligatoire pour fermer
  const showError = (msg) => Swal.fire({
    ...getSwalConfig(),
    icon:              'error',
    title:             'Erreur',
    text:              msg,
    showConfirmButton: true,
    confirmButtonText: "D'accord",
    iconColor:         '#ef4444',
  });

  // ── Alerte expiration mot de passe ──────────────────────────
  const renderPasswordExpiryBanner = () => {
    const ps = profileData.password_status;
    if (!ps) return null;

    if (ps.is_expired) {
      return (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <i className="bi bi-exclamation-triangle-fill text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">
            Votre mot de passe a <strong>expiré</strong>. Veuillez le modifier pour continuer à accéder à l'application.
          </p>
        </div>
      );
    }

    if (ps.is_near_expiry) {
      return (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <i className="bi bi-clock-history text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
            Votre mot de passe expire dans <strong>{ps.days_remaining} jour{ps.days_remaining > 1 ? 's' : ''}</strong>. Pensez à le changer.
          </p>
        </div>
      );
    }

    return null;
  };

  // ── Sauvegarde profil ───────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editData.nom.trim()) { showError('Le nom est requis.'); return; }
    if (!editData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      showError("L'adresse email n'est pas valide."); return;
    }

    setLoadingProfile(true);
    try {
      const res = await profileApi.put('/profile', {
        nom:   editData.nom,
        email: editData.email,
      });

      if (res.data.success) {
        const u = res.data.user;
        const updated = { ...storedUserRef.current, nom: u.nom, email: u.email, initiales: u.initiales };
        localStorage.setItem('user', JSON.stringify(updated));

        // Afficher le succès puis rafraîchir la page pour refléter les changements
        await Swal.fire({
          ...getSwalConfig(),
          icon:              'success',
          title:             'Succès',
          text:              'Profil mis à jour avec succès !',
          timer:             2000,
          timerProgressBar:  true,
          showConfirmButton: false,
          allowOutsideClick: false,
          iconColor:         '#22c55e',
        });

        // Rechargement de la page après fermeture du SweetAlert
        window.location.reload();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({ nom: profileData.nom, email: profileData.email });
    setIsEditing(false);
  };

  // ── Changement mot de passe ─────────────────────────────────
  const handleChangePassword = async () => {
    const { current_password, new_password, confirm_password } = passwordData;
    if (!current_password || !new_password || !confirm_password) {
      showError('Veuillez remplir tous les champs.'); return;
    }
    if (new_password.length < 8) {
      showError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return;
    }
    if (new_password !== confirm_password) {
      showError('Les nouveaux mots de passe ne correspondent pas.'); return;
    }
    if (current_password === new_password) {
      showError("Le nouveau mot de passe doit être différent de l'actuel."); return;
    }

    setLoadingPassword(true);
    try {
      const res = await profileApi.post('/profile/change-password', {
        current_password,
        new_password,
        new_password_confirmation: confirm_password,
      });

      if (res.data.success) {
        // 1. Vider la session immédiatement
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // 2. SweetAlert timer 3s sans bouton, on attend la fermeture complète
        await Swal.fire({
          ...getSwalConfig(),
          icon:              'success',
          title:             'Mot de passe modifié',
          text:              'Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.',
          timer:             3000,
          timerProgressBar:  true,
          showConfirmButton: false,
          allowOutsideClick: false,
          iconColor:         '#22c55e',
        });

        // 3. Redirection vers login après fermeture — session déjà vidée
        navigate('/login');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setLoadingPassword(false);
    }
  };

  // ── Force du mot de passe ───────────────────────────────────
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)           score++;
    if (pwd.length >= 12)          score++;
    if (/[A-Z]/.test(pwd))         score++;
    if (/[0-9]/.test(pwd))         score++;
    if (/[^A-Za-z0-9]/.test(pwd))  score++;
    if (score <= 1) return { score, label: 'Très faible', color: '#ef4444' };
    if (score === 2) return { score, label: 'Faible',     color: '#f97316' };
    if (score === 3) return { score, label: 'Moyen',      color: '#eab308' };
    if (score === 4) return { score, label: 'Fort',       color: '#22c55e' };
    return              { score, label: 'Très fort',   color: '#10b981' };
  };

  const pwdStrength = getPasswordStrength(passwordData.new_password);

  // ── Style input commun ──────────────────────────────────────
  const inputClass = (editable) =>
    `w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
      editable
        ? darkMode
          ? 'bg-gray-800 border-gray-700 text-white focus:border-yellow-500'
          : 'bg-white border-gray-200 text-gray-900 focus:border-yellow-400'
        : darkMode
          ? 'bg-gray-800/50 border-gray-800 text-gray-400 cursor-not-allowed'
          : 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed'
    }`;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <style>{`
        .swal-profile-popup  { border-radius: 16px !important; }
        .swal-confirm-btn    { border-radius: 10px !important; font-weight: 600 !important; padding: 10px 28px !important; }
        .swal2-timer-progress-bar { background: #f59e0b !important; }
      `}</style>

      <Sidebar
        darkMode={darkMode}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <Header
        darkMode={darkMode} setDarkMode={setDarkMode}
        sidebarCollapsed={sidebarCollapsed}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile}             setShowProfile={setShowProfile}
      />

      <main
        className="transition-all duration-300 pt-24 px-6 pb-6"
        style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}
      >
        {/* ── Onglets ── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm mb-6 p-2`}>
          <div className="flex gap-2">
            {[
              { key: 'profil',   icon: 'bi-person-fill',      label: 'Mon Profil' },
              { key: 'securite', icon: 'bi-shield-lock-fill', label: 'Sécurité'   },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.key
                    ? 'text-white shadow-md'
                    : `${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`
                }`}
                style={activeTab === tab.key
                  ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }
                  : {}}
              >
                <i className={`bi ${tab.icon} text-xl`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════ ONGLET PROFIL ═══════════════ */}
        {activeTab === 'profil' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Carte identité gauche */}
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-8 flex flex-col items-center text-center`}>
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-xl mb-5"
                style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
              >
                {getInitiales()}
              </div>

              <h2 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {profileData.nom}
              </h2>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {profileData.email}
              </p>

              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white mb-6"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
              >
                <i className="bi bi-shield-fill text-xs" />
                {profileData.role}
              </span>

              <div className={`w-full rounded-xl p-4 mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Statut</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${profileData.est_actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profileData.est_actif ? 'bg-green-500' : 'bg-red-500'}`} />
                    {profileData.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Direction</span>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{profileData.direction || '—'}</span>
                </div>
              </div>

              <div className={`w-full rounded-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold uppercase mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Dernière connexion</p>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <i className="bi bi-clock mr-1 text-yellow-500" />
                  {profileData.derniere_connexion
                    ? new Date(profileData.derniere_connexion).toLocaleString('fr-FR')
                    : '—'}
                </p>
              </div>
            </div>

            {/* Formulaire profil droite */}
            <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
              <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Informations personnelles</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Modifiez vos informations de contact</p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => { setEditData({ nom: profileData.nom, email: profileData.email }); setIsEditing(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 shadow-md"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                  >
                    <i className="bi bi-pencil-fill" />
                    <span>Modifier</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={loadingProfile}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                    >
                      {loadingProfile ? (
                        <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><span>Sauvegarde...</span></>
                      ) : (
                        <><i className="bi bi-check-lg" /><span>Sauvegarder</span></>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Nom complet */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <i className={`bi bi-person text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <input
                        type="text"
                        value={isEditing ? editData.nom : profileData.nom}
                        onChange={(e) => setEditData(prev => ({ ...prev, nom: e.target.value }))}
                        disabled={!isEditing}
                        autoComplete="off"
                        className={inputClass(isEditing)}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <i className={`bi bi-envelope text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <input
                        type="email"
                        value={isEditing ? editData.email : profileData.email}
                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                        autoComplete="off"
                        className={inputClass(isEditing)}
                      />
                    </div>
                  </div>

                  {/* Rôle — lecture seule */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Rôle
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>Non modifiable</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <i className={`bi bi-shield-fill text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <input type="text" value={profileData.role} disabled className={inputClass(false)} />
                    </div>
                  </div>

                  {/* Direction — lecture seule */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Direction
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>Non modifiable</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <i className={`bi bi-building text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <input type="text" value={profileData.direction} disabled className={inputClass(false)} />
                    </div>
                  </div>

                </div>

                <div className={`mt-6 flex items-start gap-3 p-4 rounded-xl ${darkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-yellow-50 border border-yellow-100'}`}>
                  <i className="bi bi-info-circle-fill text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Le <strong>rôle</strong> et la <strong>direction</strong> sont gérés par l'administrateur et ne peuvent pas être modifiés ici.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ ONGLET SÉCURITÉ ═══════════════ */}
        {activeTab === 'securite' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Carte info sécurité gauche */}
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-8 flex flex-col items-center text-center`}>
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-xl"
                style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
              >
                <i className="bi bi-shield-lock-fill text-4xl text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sécurité du compte</h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gérez la sécurité de votre accès</p>

              <div className={`w-full rounded-xl p-5 text-left ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-xs font-bold uppercase mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Règles du mot de passe</p>
                {[
                  '8 caractères minimum',
                  'Une lettre majuscule',
                  'Un chiffre',
                  'Un caractère spécial',
                  'Aucune lettre de votre nom',
                  'Expire tous les 6 mois',
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-3 mb-3">
                    <i className="bi bi-check2-circle text-sm" style={{ color: theme.primary }} />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{rule}</span>
                  </div>
                ))}
              </div>

              <div className={`w-full rounded-xl p-4 mt-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Dernière connexion</p>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <i className="bi bi-clock mr-1 text-yellow-500" />
                  {profileData.derniere_connexion
                    ? new Date(profileData.derniere_connexion).toLocaleString('fr-FR')
                    : '—'}
                </p>
              </div>

              {/* Statut expiration mdp */}
              {profileData.password_status && (
                <div className={`w-full rounded-xl p-4 mt-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Expiration mot de passe</p>
                  <p className={`text-sm font-medium ${
                    profileData.password_status.is_expired     ? 'text-red-500'    :
                    profileData.password_status.is_near_expiry ? 'text-yellow-500' : (darkMode ? 'text-green-400' : 'text-green-600')
                  }`}>
                    <i className={`bi ${
                      profileData.password_status.is_expired     ? 'bi-x-circle-fill'        :
                      profileData.password_status.is_near_expiry ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill'
                    } mr-1`} />
                    {profileData.password_status.is_expired
                      ? 'Mot de passe expiré !'
                      : `${profileData.password_status.days_remaining} jour(s) restants`}
                  </p>
                </div>
              )}
            </div>

            {/* Formulaire mot de passe droite */}
            <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
              <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Changer le mot de passe</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Choisissez un mot de passe fort pour sécuriser votre compte. Vous serez déconnecté après la modification.
                </p>
              </div>

              <div className="p-6 space-y-5">

                {/* Bannière expiration */}
                {renderPasswordExpiryBanner()}

                {/*
                  ✅ FIX FOCUS :
                  - PasswordInput est défini hors du composant (React.memo en haut du fichier)
                  - Les handlers onChange et onToggle sont des useCallback stables
                  - Ces deux points garantissent que React NE démonte PAS les inputs
                    entre deux frappes, ce qui résout le bug de perte de focus.
                */}
                <PasswordInput
                  id="current_password"
                  label="Mot de passe actuel"
                  value={passwordData.current_password}
                  onChange={handleCurrentPasswordChange}
                  show={showPasswords.current}
                  onToggle={toggleCurrentPassword}
                  placeholder="••••••••"
                  disabled={loadingPassword}
                  darkMode={darkMode}
                />

                <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`} />

                <PasswordInput
                  id="new_password"
                  label="Nouveau mot de passe"
                  value={passwordData.new_password}
                  onChange={handleNewPasswordChange}
                  show={showPasswords.new}
                  onToggle={toggleNewPassword}
                  placeholder="Minimum 8 caractères"
                  disabled={loadingPassword}
                  darkMode={darkMode}
                />

                {/* Jauge de force */}
                {passwordData.new_password && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Force du mot de passe</span>
                      <span className="text-xs font-bold" style={{ color: pwdStrength.color }}>{pwdStrength.label}</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(pwdStrength.score / 5) * 100}%`, backgroundColor: pwdStrength.color }}
                      />
                    </div>
                  </div>
                )}

                <PasswordInput
                  id="confirm_password"
                  label="Confirmer le nouveau mot de passe"
                  value={passwordData.confirm_password}
                  onChange={handleConfirmPasswordChange}
                  show={showPasswords.confirm}
                  onToggle={toggleConfirmPassword}
                  placeholder="Répétez le nouveau mot de passe"
                  disabled={loadingPassword}
                  darkMode={darkMode}
                />

                {/* Correspondance */}
                {passwordData.confirm_password && passwordData.new_password && (
                  <div className={`flex items-center gap-2 text-xs font-medium ${
                    passwordData.new_password === passwordData.confirm_password ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <i className={`bi ${passwordData.new_password === passwordData.confirm_password ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
                    {passwordData.new_password === passwordData.confirm_password
                      ? 'Les mots de passe correspondent'
                      : 'Les mots de passe ne correspondent pas'}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={loadingPassword}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                  >
                    {loadingPassword ? (
                      <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg><span>Modification...</span></>
                    ) : (
                      <><i className="bi bi-shield-lock-fill" /><span>Modifier le mot de passe</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-sm text-center ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            © 2026 SGS Tous droits réservés — Version 1.0
          </p>
        </div>
      </main>
    </div>
  );
};

export default MonProfile;