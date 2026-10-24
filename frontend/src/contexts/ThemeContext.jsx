import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getTheme, createTheme, appliquerTheme, deleteTheme } from '../api/Admin-Axios/Theme-axios';

// ============================================================================
// THÈMES PRÉDÉFINIS STATIQUES
// valeur = code hex principal | couleur = nom affiché
// ============================================================================
export const THEMES_PREDEFINIS = [
  { valeur: '#ffc400', couleur: 'Orange Classique',   primaryLight: '#ffe066', primaryDark: '#e6a800', predefini: true },
  { valeur: '#3b82f6', couleur: 'Bleu Professionnel', primaryLight: '#bfdbfe', primaryDark: '#1d4ed8', predefini: true },
  { valeur: '#10b981', couleur: 'Vert Nature',         primaryLight: '#a7f3d0', primaryDark: '#059669', predefini: true },
  { valeur: '#8b5cf6', couleur: 'Violet Moderne',      primaryLight: '#ddd6fe', primaryDark: '#6d28d9', predefini: true },
  { valeur: '#ec4899', couleur: 'Rose Élégant',        primaryLight: '#fbcfe8', primaryDark: '#be185d', predefini: true },
  { valeur: '#ef4444', couleur: 'Rouge Dynamique',     primaryLight: '#fecaca', primaryDark: '#dc2626', predefini: true },
  { valeur: '#6366f1', couleur: 'Indigo Créatif',      primaryLight: '#c7d2fe', primaryDark: '#4f46e5', predefini: true },
  { valeur: '#14b8a6', couleur: 'Turquoise Frais',     primaryLight: '#99f6e4', primaryDark: '#0d9488', predefini: true },
  { valeur: '#f59e0b', couleur: 'Ambre Chaleureux',    primaryLight: '#fde68a', primaryDark: '#d97706', predefini: true },
  { valeur: '#06b6d4', couleur: 'Cyan Technologique',  primaryLight: '#a5f3fc', primaryDark: '#0891b2', predefini: true },
  { valeur: '#64748b', couleur: 'Ardoise Sobre',       primaryLight: '#cbd5e1', primaryDark: '#475569', predefini: true },
  { valeur: '#059669', couleur: 'Émeraude Luxe',       primaryLight: '#a7f3d0', primaryDark: '#047857', predefini: true },
];

// Génère primaryLight et primaryDark depuis un hex principal
export const generateShades = (hex) => {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lR = Math.min(255, r + 60); const lG = Math.min(255, g + 60); const lB = Math.min(255, b + 60);
    const dR = Math.max(0,   r - 40); const dG = Math.max(0,   g - 40); const dB = Math.max(0,   b - 40);
    return {
      primaryLight: `#${lR.toString(16).padStart(2,'0')}${lG.toString(16).padStart(2,'0')}${lB.toString(16).padStart(2,'0')}`,
      primaryDark:  `#${dR.toString(16).padStart(2,'0')}${dG.toString(16).padStart(2,'0')}${dB.toString(16).padStart(2,'0')}`,
    };
  } catch {
    return { primaryLight: hex, primaryDark: hex };
  }
};

// Construit un objet thème complet depuis une ligne BDD ou un prédéfini
const buildTheme = (t) => {
  const predefini = THEMES_PREDEFINIS.find(p => p.valeur === t.valeur);
  const shades    = predefini ?? generateShades(t.valeur);
  return {
    id:           t.id   ?? null,
    valeur:       t.valeur,
    couleur:      t.couleur,
    primary:      t.valeur,
    primaryLight: t.primaryLight ?? shades.primaryLight,
    primaryDark:  t.primaryDark  ?? shades.primaryDark,
    name:         t.couleur,
    predefini:    t.predefini ?? !!predefini,   // ✅ un prédéfini enregistré en BDD reste "prédéfini"
    est_applique: !!(t.est_applique ?? false),
  };
};

// ============================================================================
// CACHE LOCAL DU THÈME ACTIF
// Lu de façon SYNCHRONE avant le 1er rendu → plus aucun flash de couleur.
// ============================================================================
const THEME_CACHE_KEY = 'fleetify_theme_actif';

const readCachedTheme = () => {
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    return t?.valeur ? t : null;
  } catch {
    return null;
  }
};

const writeCachedTheme = (t) => {
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({
      id: t.id, valeur: t.valeur, couleur: t.couleur,
      primaryLight: t.primaryLight, primaryDark: t.primaryDark,
    }));
  } catch { /* localStorage indisponible : on ignore */ }
};

const applyCssVars = (t) => {
  const s = document.documentElement.style;
  s.setProperty('--primary-color', t.primary);
  s.setProperty('--primary-light', t.primaryLight);
  s.setProperty('--primary-dark',  t.primaryDark);
};

// Thème de départ = celui du cache (sinon Orange par défaut)
const THEME_INITIAL = (() => {
  const cache = readCachedTheme();
  return buildTheme({ ...(cache ?? THEMES_PREDEFINIS[0]), est_applique: true });
})();

// Variables CSS appliquées dès le chargement du module, avant même le 1er rendu React
if (typeof document !== 'undefined') applyCssVars(THEME_INITIAL);

// ============================================================================
// CONTEXT
// ============================================================================
const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  return ctx;
};

// ============================================================================
// PROVIDER
// ============================================================================
export const ThemeProvider = ({ children }) => {
  // ✅ Liste = UNIQUEMENT les thèmes présents en BDD (supprime = 0). Vide tant que l'API n'a pas répondu.
  const [themes, setThemes] = useState([]);
  // ✅ Thème actif : initialisé depuis le cache, plus jamais depuis un défaut en dur
  const [themeActif, setThemeActif]     = useState(THEME_INITIAL);
  const [loadingTheme, setLoadingTheme] = useState(true);

  // Référence toujours à jour de la liste (évite les valeurs périmées dans les closures)
  const themesRef = useRef(themes);
  themesRef.current = themes;

  // ── Synchroniser avec le backend ─────────────────────────────────────────
  const rafraichirTheme = useCallback(async () => {
    try {
      const data = await getTheme();

      // ✅ La BDD est la seule source de vérité : on remplace la liste, même si elle est vide.
      //    Un thème supprimé (supprime = 1) ou absent de la BDD disparaît donc du front.
      if (Array.isArray(data.themes)) {
        setThemes(data.themes.map(buildTheme));
      }

      if (data.valeur) {
        const actif = buildTheme({
          valeur:       data.valeur,
          couleur:      data.couleur,
          id:           data.id_actif,
          est_applique: true,
          // ✅ on respecte les nuances enregistrées en BDD (sinon fallback automatique)
          primaryLight: data.primaryLight ?? undefined,
          primaryDark:  data.primaryDark  ?? undefined,
        });
        setThemeActif(actif);
        writeCachedTheme(actif);
      }
    } catch (err) {
      // ✅ En cas d'erreur on GARDE le thème en cache, on ne retombe pas sur le défaut
      console.warn('Synchronisation du thème impossible, thème en cache conservé :', err.message);
    } finally {
      setLoadingTheme(false);
    }
  }, []);

  // ✅ Plus de condition sur le token : la route du thème doit être publique (voir routes/api.php)
  useEffect(() => { rafraichirTheme(); }, [rafraichirTheme]);

  // ── Appliquer les CSS variables dès que le thème actif change ────────────
  useEffect(() => { applyCssVars(themeActif); }, [themeActif]);

  // ── Marquer un thème comme actif (état + cache) après succès de l'API ────
  const activer = async (cible) => {
    await appliquerTheme(cible.id);               // PUT /admin/parametres/theme/{id}/appliquer
    const actif = { ...cible, est_applique: true };
    setThemes(prev => prev.map(t => ({ ...t, est_applique: t.id === cible.id })));
    setThemeActif(actif);
    writeCachedTheme(actif);                      // ✅ mémorisé immédiatement
  };

  // ── Appliquer un thème existant (il a déjà un id en BDD) ─────────────────
  const appliquer = async (themeId) => {
    const cible = themesRef.current.find(t => t.id === themeId);
    if (!cible) throw new Error('Thème introuvable');
    await activer(cible);
  };

  // ── Créer un thème en BDD (retourne l'objet thème complet) ───────────────
  const creerThemeInterne = async (customColors) => {
    const data = await createTheme(
      customColors.valeur,
      customColors.couleur,
      customColors.primaryLight,
      customColors.primaryDark,
    );

    const nouveau = buildTheme({
      id:           data.id,
      valeur:       customColors.valeur,
      couleur:      customColors.couleur,
      primaryLight: customColors.primaryLight,
      primaryDark:  customColors.primaryDark,
      est_applique: false,
    });

    setThemes(prev => [...prev, nouveau]);

    return nouveau;
  };

  const creerTheme = async (customColors) => (await creerThemeInterne(customColors)).id;

  // ── Créer ET appliquer immédiatement ─────────────────────────────────────
  const creerEtAppliquer = async (customColors) => {
    const nouveau = await creerThemeInterne(customColors);
    await activer(nouveau);
    return nouveau.id;
  };

  // ── Supprimer un thème custom ─────────────────────────────────────────────
  const supprimerTheme = async (themeId) => {
    await deleteTheme(themeId);
    setThemes(prev => prev.filter(t => t.id !== themeId));
  };

  return (
    <ThemeContext.Provider value={{
      theme: themeActif,
      themes,
      loadingTheme,
      appliquer,
      creerTheme,
      creerEtAppliquer,
      supprimerTheme,
      rafraichirTheme,   // à appeler après un login si besoin
    }}>
      {children}
    </ThemeContext.Provider>
  );
};