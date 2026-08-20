import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, generateShades } from '../../contexts/ThemeContext';
import Swal from 'sweetalert2';
import {
  Palette, Check, Sparkles, Eye,
  Monitor, Save, X, Wand2, Sliders, Copy, Trash2,
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Header  from '../../components/Header';

// ============================================================================
// SWEETALERT2 HELPERS
// ============================================================================
const createSwal = (darkMode, theme) =>
  Swal.mixin({
    customClass: {
      popup:         darkMode ? 'swal-dark-popup'  : 'swal-light-popup',
      title:         darkMode ? 'swal-dark-title'  : 'swal-light-title',
      htmlContainer: darkMode ? 'swal-dark-html'   : 'swal-light-html',
      confirmButton: 'swal-confirm-btn',
      cancelButton:  'swal-cancel-btn',
    },
    background:         darkMode ? '#111827' : '#ffffff',
    color:              darkMode ? '#f9fafb' : '#111827',
    confirmButtonColor: theme?.primary ?? '#ffc400',
    cancelButtonColor:  darkMode ? '#374151' : '#e5e7eb',
    buttonsStyling: false,
  });

const buildSwalStyles = (theme) => `
  .swal-dark-popup  { background:#111827!important;border:1px solid #374151!important;border-radius:16px!important;box-shadow:0 25px 50px rgba(0,0,0,.6)!important; }
  .swal-light-popup { background:#ffffff!important;border:1px solid #e5e7eb!important;border-radius:16px!important;box-shadow:0 25px 50px rgba(0,0,0,.15)!important; }
  .swal-dark-title  { color:#f9fafb!important;font-weight:800!important;font-size:18px!important; }
  .swal-light-title { color:#111827!important;font-weight:800!important;font-size:18px!important; }
  .swal-dark-html   { color:#9ca3af!important;font-size:15px!important; }
  .swal-light-html  { color:#6b7280!important;font-size:15px!important; }
  .swal-confirm-btn { background:linear-gradient(to right,${theme?.primary||'#ffc400'},${theme?.primaryDark||'#e6a800'})!important;color:#fff!important;border:none!important;border-radius:10px!important;font-weight:700!important;padding:10px 24px!important;font-size:14px!important;cursor:pointer!important; }
  .swal-confirm-btn:hover { opacity:.9!important; }
  .swal-cancel-btn  { background:transparent!important;color:#9ca3af!important;border:1px solid #374151!important;border-radius:10px!important;font-weight:700!important;padding:10px 24px!important;font-size:14px!important;cursor:pointer!important; }
  .swal-cancel-btn:hover { background:rgba(156,163,175,.1)!important; }
  .swal2-icon.swal2-question { border-color:${theme?.primary||'#ffc400'}!important;color:${theme?.primary||'#ffc400'}!important; }
  .swal2-icon.swal2-success .swal2-success-ring { border-color:rgba(16,185,129,.3)!important; }
  .swal2-icon.swal2-success [class^=swal2-success-line] { background:#10b981!important; }
  .swal2-icon.swal2-error { border-color:#ef4444!important;color:#ef4444!important; }
  .swal2-actions { gap:10px!important;margin-top:20px!important; }
`;

// ============================================================================
// THEME PAGE
// ============================================================================
const Theme = () => {
  const { theme, themes, appliquer, creerEtAppliquer, supprimerTheme } = useTheme();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; }
    catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  useEffect(() => {
    const styleId = 'swal-theme-styles';
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = buildSwalStyles(theme);
    document.head.appendChild(style);
  }, [theme]);

  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [previewId, setPreviewId]                 = useState(null);
  const [showPreview, setShowPreview]             = useState(false);
  const [customMode, setCustomMode]               = useState(false);
  const [applying, setApplying]                   = useState(false);

  // Thème en cours de prévisualisation (objet complet)
  const previewTheme = previewId !== null ? themes.find(t => t.id === previewId) : null;

  // ── État de l'éditeur custom ───────────────────────────────────────────────
  const [customColors, setCustomColors] = useState({
    valeur:       theme.primary,       // hex
    couleur:      'Thème Personnalisé', // nom
    primaryLight: theme.primaryLight,
    primaryDark:  theme.primaryDark,
  });

  // ── Aperçu ────────────────────────────────────────────────────────────────
  const handlePreview = (id) => {
    setPreviewId(id);
    setShowPreview(true);
    setCustomMode(false);
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewId(null);
    setCustomMode(false);
  };

  // ── Appliquer un thème existant ───────────────────────────────────────────
  const handleApplyTheme = async (t) => {
    // Si le thème n'a pas encore d'id BDD (prédéfini jamais enregistré),
    // on le crée d'abord puis on l'applique
    const result = await createSwal(darkMode, theme).fire({
      icon:              'question',
      title:             'Appliquer ce thème ?',
      html:              `Le thème <strong>${t.couleur}</strong> sera appliqué à toute l'application.`,
      confirmButtonText: 'Appliquer',
      cancelButtonText:  'Annuler',
      showCancelButton:  true,
      buttonsStyling:    false,
    });

    if (!result.isConfirmed) return;

    setApplying(true);
    try {
      if (t.id) {
        await appliquer(t.id);
      } else {
        // Prédéfini pas encore en BDD → créer + appliquer
        await creerEtAppliquer({
          valeur:       t.valeur,
          couleur:      t.couleur,
          primaryLight: t.primaryLight,
          primaryDark:  t.primaryDark,
        });
      }

      await createSwal(darkMode, t).fire({
        icon:              'success',
        title:             'Thème appliqué !',
        text:              `"${t.couleur}" est maintenant le thème actif.`,
        confirmButtonText: "D'ACCORD",
        showCancelButton:  false,
        buttonsStyling:    false,
        timer:             1500,
      });

      window.location.reload();

    } catch {
      await createSwal(darkMode, theme).fire({
        icon:              'error',
        title:             'Erreur',
        text:              'Impossible d\'appliquer le thème. Veuillez réessayer.',
        confirmButtonText: "D'ACCORD",
        showCancelButton:  false,
        buttonsStyling:    false,
      });
    } finally {
      setApplying(false);
      setShowPreview(false);
      setPreviewId(null);
    }
  };

  // ── Éditeur custom ────────────────────────────────────────────────────────
  const handleCustomMode = () => {
    setCustomMode(true);
    setShowPreview(false);
    setPreviewId(null);
    setCustomColors({
      valeur:       theme.primary,
      couleur:      'Thème Personnalisé',
      primaryLight: theme.primaryLight,
      primaryDark:  theme.primaryDark,
    });
  };

  const handleColorChange = (key, value) => setCustomColors(prev => ({ ...prev, [key]: value }));

  const handleGenerateShades = () => {
    const shades = generateShades(customColors.valeur);
    setCustomColors(prev => ({ ...prev, ...shades }));
  };

  // ── Enregistrer le thème custom (créer en BDD + appliquer) ───────────────
  const handleSaveCustom = async () => {
    const result = await createSwal(darkMode, theme).fire({
      icon:              'question',
      title:             'Enregistrer ce thème ?',
      html:              `<strong>${customColors.couleur}</strong> sera ajouté à la liste et appliqué.`,
      confirmButtonText: 'Enregistrer',
      cancelButtonText:  'Annuler',
      showCancelButton:  true,
      buttonsStyling:    false,
    });

    if (!result.isConfirmed) return;

    setApplying(true);
    try {
      await creerEtAppliquer(customColors);

      await createSwal(darkMode, { primary: customColors.valeur, primaryDark: customColors.primaryDark }).fire({
        icon:              'success',
        title:             'Thème enregistré et appliqué !',
        text:              'Il apparaît maintenant dans la liste des thèmes.',
        confirmButtonText: "D'ACCORD",
        showCancelButton:  false,
        buttonsStyling:    false,
        timer:             1500,
      });

      window.location.reload();

    } catch {
      await createSwal(darkMode, theme).fire({
        icon:              'error',
        title:             'Erreur',
        text:              'Impossible d\'enregistrer le thème. Veuillez réessayer.',
        confirmButtonText: "D'ACCORD",
        showCancelButton:  false,
        buttonsStyling:    false,
      });
    } finally {
      setApplying(false);
    }
  };

  // ── Supprimer un thème custom ─────────────────────────────────────────────
  const handleDelete = async (t) => {
    const result = await createSwal(darkMode, theme).fire({
      icon:              'warning',
      title:             'Supprimer ce thème ?',
      html:              `<strong>${t.couleur}</strong> sera supprimé définitivement.`,
      confirmButtonText: 'Supprimer',
      cancelButtonText:  'Annuler',
      showCancelButton:  true,
      buttonsStyling:    false,
    });

    if (!result.isConfirmed) return;

    try {
      await supprimerTheme(t.id);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Impossible de supprimer ce thème.';
      await createSwal(darkMode, theme).fire({
        icon: 'error', title: 'Erreur', text: msg,
        confirmButtonText: "D'ACCORD", showCancelButton: false, buttonsStyling: false,
      });
    }
  };

  const handleCopyColor = (color) => navigator.clipboard.writeText(color);

  // ── Styles partagés ───────────────────────────────────────────────────────
  const card     = `${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border`;
  const labelCls = `block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const inputCls = `w-full px-3 py-2 border rounded-lg font-mono text-sm ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`;

  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header  darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme}
               showNotifications={showNotifications} setShowNotifications={setShowNotifications}
               showProfile={showProfile} setShowProfile={setShowProfile} />

      {(showNotifications || showProfile) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfile(false); }} />
      )}

      <main className="transition-all duration-300 pt-24 px-6 pb-6" style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}>
        <div className="space-y-6">

          {/* ── Header page ── */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                <Palette className="w-8 h-8" style={{ color: theme.primary }} />
                Gestion des Thèmes
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2 font-semibold`}>
                Personnalisez l'apparence de votre système de gestion de flotte
              </p>
            </div>

            {(showPreview || customMode) && (
              <div className="flex items-center gap-3">
                <button onClick={handleCancelPreview}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm border ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'}`}>
                  <X className="w-4 h-4" /> Annuler
                </button>

                {customMode && (
                  <button onClick={handleSaveCustom} disabled={applying}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-bold text-sm shadow-sm disabled:opacity-60"
                    style={{ background: `linear-gradient(to right, ${customColors.valeur}, ${customColors.primaryDark})` }}>
                    <Save className="w-4 h-4" /> Enregistrer le thème
                  </button>
                )}

                {showPreview && previewTheme && !customMode && (
                  <button onClick={() => handleApplyTheme(previewTheme)} disabled={applying}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-bold text-sm shadow-sm disabled:opacity-60"
                    style={{ background: `linear-gradient(to right, ${previewTheme.primary}, ${previewTheme.primaryDark})` }}>
                    <Save className="w-4 h-4" /> Appliquer ce thème
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Thème actif ── */}
          <div className={`${card} p-6 border-2`} style={{ borderColor: `${theme.primary}44` }}>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Thème Actif</h2>
            </div>
            <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl shadow-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                  <Check className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{theme.couleur}</h3>
                  <p className={`text-sm font-semibold mt-1 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{theme.valeur}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {[theme.primary, theme.primaryLight, theme.primaryDark].map((c, i) => (
                      <div key={i} className="w-8 h-8 rounded-lg border-2 border-white shadow" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bouton personnalisation ── */}
          {!customMode && !showPreview && (
            <div className={`${card} p-6 border-2 ${darkMode ? 'border-purple-700' : 'border-purple-200'}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Wand2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Créer un Thème Personnalisé</h3>
                    <p className={`font-semibold text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Définissez vos couleurs — sauvegardé en BDD et visible dans la liste
                    </p>
                  </div>
                </div>
                <button onClick={handleCustomMode}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-bold text-sm shadow-sm">
                  <Sliders className="w-5 h-5" /> Personnaliser
                </button>
              </div>
            </div>
          )}

          {/* ── Éditeur custom ── */}
          {customMode && (
            <div className={`${card} p-6`}>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Sliders className="w-6 h-6" /> Personnalisation des Couleurs
                </h2>
                <button onClick={handleGenerateShades}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold ${darkMode ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                  <Wand2 className="w-4 h-4" /> Générer nuances auto
                </button>
              </div>

              {/* Nom du thème */}
              <div className="mb-6">
                <label className={labelCls}>Nom du Thème</label>
                <input type="text" value={customColors.couleur}
                  onChange={e => handleColorChange('couleur', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg text-base font-semibold ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                  placeholder="Mon Thème Personnalisé" />
              </div>

              {/* Pickers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {[
                  { key: 'valeur',       label: 'Couleur Principale (hex)' },
                  { key: 'primaryLight', label: 'Couleur Claire' },
                  { key: 'primaryDark',  label: 'Couleur Foncée' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-3">
                    <label className={labelCls}>{label}</label>
                    <div className="relative">
                      <input type="color" value={customColors[key]}
                        onChange={e => handleColorChange(key, e.target.value)}
                        className={`w-full h-28 rounded-lg cursor-pointer border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />
                      <div className={`absolute bottom-2 left-2 right-2 backdrop-blur-sm rounded px-3 py-1.5 flex items-center justify-between ${darkMode ? 'bg-gray-800/90' : 'bg-white/90'}`}>
                        <span className={`text-sm font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{customColors[key]}</span>
                        <button onClick={() => handleCopyColor(customColors[key])} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                          <Copy className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                      </div>
                    </div>
                    <input type="text" value={customColors[key]}
                      onChange={e => handleColorChange(key, e.target.value)}
                      className={inputCls} placeholder="#000000" />
                  </div>
                ))}
              </div>

              {/* Aperçu live */}
              <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h3 className={`text-base font-extrabold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Eye className="w-5 h-5" /> Aperçu en Direct
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Bouton</p>
                    <button className="w-full px-4 py-2.5 rounded-lg text-white text-sm font-bold shadow"
                      style={{ background: `linear-gradient(to right, ${customColors.valeur}, ${customColors.primaryDark})` }}>
                      Ajouter
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Badge</p>
                    <div className="flex items-center justify-center h-10">
                      <span className="px-3 py-1.5 rounded-full text-white text-xs font-bold shadow" style={{ backgroundColor: customColors.valeur }}>En cours</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Menu actif</p>
                    <div className="px-3 py-2.5 rounded-lg text-white text-sm font-bold flex items-center gap-2 shadow"
                      style={{ background: `linear-gradient(to right, ${customColors.valeur}, ${customColors.primaryDark})` }}>
                      <Monitor className="w-4 h-4" /> Dashboard
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dégradé</p>
                    <div className="h-10 rounded-lg shadow"
                      style={{ background: `linear-gradient(135deg, ${customColors.primaryLight}, ${customColors.valeur}, ${customColors.primaryDark})` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Liste de tous les thèmes ── */}
          {!customMode && (
            <div className={`${card} p-6`}>
              <h2 className={`text-xl font-extrabold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Palette className="w-6 h-6" style={{ color: theme.primary }} /> Tous les Thèmes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {themes.map((t, index) => {
                  const isActif      = t.est_applique;
                  const isPreviewing = t.id === previewId;

                  return (
                    <div key={t.id ?? `predef-${index}`}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${isActif ? 'shadow-xl scale-105' : isPreviewing ? 'shadow-lg' : 'hover:shadow-lg'}`}
                      style={{ borderColor: isActif ? '#10b981' : isPreviewing ? t.primary : darkMode ? '#374151' : '#e5e7eb' }}>

                      {/* Header coloré */}
                      <div className="h-28 flex items-center justify-center relative"
                        style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDark})` }}>

                        {isActif && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        {isPreviewing && (
                          <div className="absolute top-2 right-2 bg-white/30 text-white rounded-full p-1.5 shadow-lg animate-pulse">
                            <Eye className="w-4 h-4" />
                          </div>
                        )}
                        {!t.predefini && (
                          <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            Custom
                          </div>
                        )}

                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Sparkles className="w-7 h-7 text-white" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        {/* Nom */}
                        <h3 className={`font-extrabold text-sm mb-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.couleur}</h3>
                        {/* Code hex */}
                        <p className={`text-xs font-mono mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.valeur}</p>

                        <div className="flex items-center gap-1.5 mb-4">
                          {[t.primary, t.primaryLight, t.primaryDark].map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded border-2 border-white shadow-sm" style={{ backgroundColor: c }} title={c} />
                          ))}
                        </div>

                        {/* Boutons */}
                        <div className="flex gap-2">
                          {/* Aperçu — seulement si le thème a un id (déjà en BDD) ou est prédéfini */}
                          <button onClick={() => handlePreview(t.id ?? `predef-${index}`)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            <Eye className="w-3.5 h-3.5" /> Aperçu
                          </button>

                          {!isActif && (
                            <button onClick={() => handleApplyTheme(t)} disabled={applying}
                              className="flex-1 px-3 py-2 text-white rounded-lg text-xs font-bold hover:opacity-90 shadow-sm disabled:opacity-60"
                              style={{ background: `linear-gradient(to right, ${t.primary}, ${t.primaryDark})` }}>
                              Appliquer
                            </button>
                          )}

                          {isActif && (
                            <div className="flex-1 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 bg-green-100 text-green-700">
                              <Check className="w-3.5 h-3.5" /> Actif
                            </div>
                          )}

                          {/* Supprimer — seulement custom + non actif */}
                          {!t.predefini && !isActif && t.id && (
                            <button onClick={() => handleDelete(t)}
                              className={`p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors`}
                              title="Supprimer ce thème">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Aperçu thème ── */}
          {showPreview && previewTheme && !customMode && (
            <div className={`${card} p-6`}>
              <h2 className={`text-xl font-extrabold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Eye className="w-6 h-6" style={{ color: previewTheme.primary }} />
                Aperçu : {previewTheme.couleur}
                <span className={`text-sm font-mono font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{previewTheme.valeur}</span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {[
                  {
                    label:   'Menu Actif',
                    content: <div className="p-4 rounded-lg text-white shadow-lg flex items-center gap-3 font-bold"
                               style={{ background: `linear-gradient(to right, ${previewTheme.primary}, ${previewTheme.primaryDark})` }}>
                               <Monitor className="w-5 h-5" /> Tableau de Bord
                             </div>,
                  },
                  {
                    label:   'Bouton Principal',
                    content: <button className="w-full p-4 rounded-lg text-white shadow-lg font-bold hover:opacity-90"
                               style={{ background: `linear-gradient(to right, ${previewTheme.primary}, ${previewTheme.primaryDark})` }}>
                               Ajouter un Véhicule
                             </button>,
                  },
                  {
                    label:   'Badge / Accent',
                    content: <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                               <span className="px-4 py-2 rounded-full text-white font-bold text-sm shadow"
                                 style={{ backgroundColor: previewTheme.primary }}>En cours</span>
                             </div>,
                  },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</p>
                    {item.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className={`py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <p className={`text-center text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              © 2026 SGS Tous droits réservés - Version 1.0
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Theme;