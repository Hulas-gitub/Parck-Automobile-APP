import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, generateShades } from '../contexts/ThemeContext';
import {
  Palette, Check, Sparkles, Eye,
  Monitor, Save, X, Wand2, Sliders, Copy, Trash2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header  from '../components/Header';
import Footer  from '../components/Footer';
import { showSuccess, showError, showConfirm } from '../utils/walConfig';

// ============================================================================
// STYLES SWEETALERT (injectés dans <head>, suivent le thème actif)
// ============================================================================
const buildSwalStyles = (theme, darkMode) => `
  .swal2-popup {
    border-radius: 16px !important;
    font-family: inherit !important;
  }
  .swal2-title {
    font-weight: 800 !important;
  }
  .swal2-confirm {
    border-radius: 10px !important;
    font-weight: 600 !important;
    padding: 10px 24px !important;
    background: linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark}) !important;
    box-shadow: 0 2px 10px ${theme.primary}55 !important;
  }
  .swal2-cancel {
    border-radius: 10px !important;
    font-weight: 500 !important;
    padding: 10px 24px !important;
    color: ${darkMode ? '#d1d5db' : '#374151'} !important;
  }
  .swal2-timer-progress-bar {
    background: ${theme.primary} !important;
  }
  .swal2-icon.swal2-question {
    border-color: ${theme.primary} !important;
    color: ${theme.primary} !important;
  }
`;

// ============================================================================
// SKELETON LOADER
// ============================================================================
const Sk = ({ darkMode, className = '', style }) => (
  <div className={`animate-pulse rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} ${className}`} style={style} />
);

const ThemeSkeleton = ({ darkMode }) => {
  const card = `${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border`;

  return (
    <div className="space-y-6">
      {/* Header page */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Sk darkMode={darkMode} className="w-8 h-8 rounded-lg" />
          <Sk darkMode={darkMode} className="w-64 h-7" />
        </div>
        <Sk darkMode={darkMode} className="w-96 max-w-full h-4" />
      </div>

      {/* Thème actif */}
      <div className={`${card} p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <Sk darkMode={darkMode} className="w-6 h-6 rounded-full" />
          <Sk darkMode={darkMode} className="w-32 h-5" />
        </div>
        <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-4">
            <Sk darkMode={darkMode} className="w-16 h-16 rounded-xl" />
            <div className="space-y-2.5">
              <Sk darkMode={darkMode} className="w-40 h-5" />
              <Sk darkMode={darkMode} className="w-24 h-3.5" />
              <div className="flex items-center gap-2 pt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Sk key={i} darkMode={darkMode} className="w-8 h-8 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bloc personnalisation */}
      <div className={`${card} p-6`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Sk darkMode={darkMode} className="w-14 h-14 rounded-xl" />
            <div className="space-y-2.5">
              <Sk darkMode={darkMode} className="w-56 h-5" />
              <Sk darkMode={darkMode} className="w-80 max-w-full h-3.5" />
            </div>
          </div>
          <Sk darkMode={darkMode} className="w-40 h-10 rounded-lg" />
        </div>
      </div>

      {/* Liste des thèmes */}
      <div className={`${card} p-6`}>
        <div className="flex items-center gap-2 mb-6">
          <Sk darkMode={darkMode} className="w-6 h-6 rounded" />
          <Sk darkMode={darkMode} className="w-44 h-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`rounded-xl overflow-hidden border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <Sk darkMode={darkMode} className="h-28 rounded-none" />
              <div className={`p-4 space-y-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <Sk darkMode={darkMode} className="w-2/3 h-4" />
                <Sk darkMode={darkMode} className="w-1/3 h-3" />
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Sk key={j} darkMode={darkMode} className="w-5 h-5 rounded" />
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Sk darkMode={darkMode} className="flex-1 h-8 rounded-lg" />
                  <Sk darkMode={darkMode} className="flex-1 h-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// THEME PAGE
// ============================================================================
const Theme = () => {
  // ✅ loadingTheme : on attend la réponse de la BDD avant d'afficher la liste
  const { theme, themes, loadingTheme, appliquer, creerEtAppliquer, supprimerTheme } = useTheme();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; }
    catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  // Styles SweetAlert : réinjectés quand le mode sombre ou le thème change
  useEffect(() => {
    const styleId = 'swal-theme-styles';
    document.getElementById(styleId)?.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = buildSwalStyles(theme, darkMode);
    document.head.appendChild(style);

    return () => style.remove();
  }, [darkMode, theme]);

  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [previewId, setPreviewId]                 = useState(null);
  const [showPreview, setShowPreview]             = useState(false);
  const [customMode, setCustomMode]               = useState(false);
  const [applying, setApplying]                   = useState(false);

  // ── Skeleton : affiché tant que les thèmes de la BDD ne sont pas chargés ──
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loadingTheme) return;
    const t = setTimeout(() => setPageLoading(false), 300);
    return () => clearTimeout(t);
  }, [loadingTheme]);

  // Thème en cours de prévisualisation (objet complet, toujours présent en BDD)
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

  // ── Appliquer un thème existant (tous les thèmes listés ont un id en BDD) ─
  const handleApplyTheme = async (t) => {
    if (!t?.id) return;

    const result = await showConfirm(darkMode, theme, {
      title: 'Appliquer ce thème ?',
      html: `Le thème <strong>${t.couleur}</strong> sera appliqué à toute l'application.`,
      confirmText: 'Appliquer',
    });

    if (!result) return;

    setApplying(true);
    try {
      await appliquer(t.id);

      showSuccess(darkMode, t, 'Thème appliqué !', `"${t.couleur}" est maintenant le thème actif.`);

      // Ne pas recharger - le thème est appliqué et mémorisé automatiquement par le context

    } catch (err) {
      const msg = err.response?.data?.message ?? 'Impossible d\'appliquer le thème. Veuillez réessayer.';
      showError(darkMode, theme, 'Erreur', msg);
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
    const result = await showConfirm(darkMode, theme, {
      title: 'Enregistrer ce thème ?',
      html: `<strong>${customColors.couleur}</strong> sera ajouté à la liste et appliqué.`,
      confirmText: 'Enregistrer',
    });

    if (!result) return;

    setApplying(true);
    try {
      await creerEtAppliquer(customColors);

      showSuccess(darkMode, { primary: customColors.valeur, primaryDark: customColors.primaryDark }, 'Thème enregistré et appliqué !', 'Il apparaît maintenant dans la liste des thèmes.');

      // Retour à la liste des thèmes
      setCustomMode(false);

    } catch {
      showError(darkMode, theme, 'Erreur', 'Impossible d\'enregistrer le thème. Veuillez réessayer.');
    } finally {
      setApplying(false);
    }
  };

  // ── Supprimer un thème (suppression logique côté BDD : supprime = 1) ──────
  const handleDelete = async (t) => {
    const result = await showConfirm(darkMode, theme, {
      title: 'Supprimer ce thème ?',
      html: `<strong>${t.couleur}</strong> sera retiré de la liste des thèmes.`,
      confirmText: 'Supprimer',
      isDanger: true,
    });

    if (!result) return;

    try {
      await supprimerTheme(t.id);

      // Si on était en train de prévisualiser ce thème, on ferme l'aperçu
      if (previewId === t.id) {
        setShowPreview(false);
        setPreviewId(null);
      }

      showSuccess(darkMode, theme, 'Thème supprimé', `"${t.couleur}" a été supprimé.`);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Impossible de supprimer ce thème.';
      showError(darkMode, theme, 'Erreur', msg);
    }
  };

  const handleCopyColor = (color) => navigator.clipboard.writeText(color);

  // ── Styles partagés ───────────────────────────────────────────────────────
  const card     = `${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border`;
  const labelCls = `block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;
  const inputCls = `w-full px-3 py-2 border rounded-lg font-mono text-sm ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`;

  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex flex-col transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header  darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme}
               showNotifications={showNotifications} setShowNotifications={setShowNotifications}
               showProfile={showProfile} setShowProfile={setShowProfile} />

      {(showNotifications || showProfile) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfile(false); }} />
      )}

      <main className="flex-1 transition-all duration-300 pt-24 px-4 pb-6" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '16.25rem' }}>

        {pageLoading ? (
          <ThemeSkeleton darkMode={darkMode} />
        ) : (
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

          {/* ── Liste de tous les thèmes (uniquement ceux présents en BDD, supprime = 0) ── */}
          {!customMode && (
            <div className={`${card} p-6`}>
              <h2 className={`text-xl font-extrabold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Palette className="w-6 h-6" style={{ color: theme.primary }} /> Tous les Thèmes
              </h2>

              {themes.length === 0 && (
                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Aucun thème disponible. Créez-en un avec « Personnaliser ».
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {themes.map((t) => {
                  const isActif      = t.est_applique;
                  const isPreviewing = t.id === previewId;

                  return (
                    <div key={t.id}
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
                          <button onClick={() => handlePreview(t.id)}
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

                          {/* Supprimer — tout thème non actif présent en BDD */}
                          {!isActif && (
                            <button onClick={() => handleDelete(t)}
                              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
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

        </div>
        )}
      </main>

      <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />
    </div>
  );
};

export default Theme;