import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, createTheme, appliquerTheme, deleteTheme } from '../api/Admin-Axios/Theme-axios';

// ============================================================================
// THÈMES PRÉDÉFINIS STATIQUES
// valeur = code hex principal | couleur = nom affiché
// Ces thèmes sont toujours présents dans la liste.
// Les thèmes custom créés par l'admin s'ajoutent depuis la BDD.
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
    valeur:       t.valeur,                   // ex: '#ffc400'  — code hex
    couleur:      t.couleur,                  // ex: 'Orange'   — nom
    primary:      t.valeur,                   // alias pratique pour le CSS
    primaryLight: t.primaryLight ?? shades.primaryLight,
    primaryDark:  t.primaryDark  ?? shades.primaryDark,
    name:         t.couleur,                  // alias pour l'affichage
    predefini:    t.predefini ?? false,
    est_applique: t.est_applique ?? false,
  };
};

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
  // Liste complète : prédéfinis + custom BDD
  const [themes, setThemes]           = useState(THEMES_PREDEFINIS.map(t => buildTheme({ ...t, id: null, est_applique: false })));
  // Thème actif (objet complet)
  const [themeActif, setThemeActif]   = useState(() => buildTheme(THEMES_PREDEFINIS[0]));
  const [loadingTheme, setLoadingTheme] = useState(true);

  // ── Charger depuis le backend au montage ─────────────────────────────────
  useEffect(() => {
    const fetchTheme = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setLoadingTheme(false); return; }

      try {
        const data = await getTheme();
        // data.themes = toutes les lignes de parametres_systeme
        // data.valeur / data.couleur = thème actif (est_applique=1)

        if (Array.isArray(data.themes) && data.themes.length > 0) {
          // Construire la liste complète :
          // 1. Les prédéfinis (toujours présents, avec leur id BDD si ils existent)
          // 2. Les custom (non-prédéfinis) ajoutés par l'admin
          const predefinisValeurs = THEMES_PREDEFINIS.map(p => p.valeur);

          const lignesBDD = data.themes.map(t => buildTheme(t));

          const customsUniquement = lignesBDD.filter(t => !predefinisValeurs.includes(t.valeur));

          // Enrichir les prédéfinis avec leur id BDD s'ils y sont
          const predefinisEnrichis = THEMES_PREDEFINIS.map(p => {
            const ligneBDD = data.themes.find(t => t.valeur === p.valeur);
            return buildTheme({
              ...p,
              id:           ligneBDD?.id           ?? null,
              est_applique: ligneBDD?.est_applique  ?? false,
            });
          });

          setThemes([...predefinisEnrichis, ...customsUniquement]);
        }

        // Thème actif
        if (data.valeur) {
          const shades = THEMES_PREDEFINIS.find(p => p.valeur === data.valeur) ?? generateShades(data.valeur);
          const actif  = buildTheme({
            valeur:       data.valeur,
            couleur:      data.couleur,
            id:           data.id_actif,
            est_applique: true,
            primaryLight: shades.primaryLight,
            primaryDark:  shades.primaryDark,
          });
          setThemeActif(actif);
        }
      } catch (err) {
        console.warn('Fallback thème par défaut :', err.message);
      } finally {
        setLoadingTheme(false);
      }
    };

    fetchTheme();
  }, []);

  // ── Appliquer les CSS variables dès que le thème actif change ────────────
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', themeActif.primary);
    document.documentElement.style.setProperty('--primary-light', themeActif.primaryLight);
    document.documentElement.style.setProperty('--primary-dark',  themeActif.primaryDark);
  }, [themeActif]);

  // ── Appliquer un thème existant (il a déjà un id en BDD) ─────────────────
  const appliquer = async (themeId) => {
    await appliquerTheme(themeId); // PUT /admin/parametres/theme/{id}/appliquer

    // Mettre à jour l'état local : est_applique=1 sur lui, 0 sur les autres
    setThemes(prev => {
      const nouvelleListe = prev.map(t => ({ ...t, est_applique: t.id === themeId }));
      const nouvelActif = nouvelleListe.find(t => t.id === themeId);
      if (nouvelActif) setThemeActif({ ...nouvelActif, est_applique: true });
      return nouvelleListe;
    });
  };

  // ── Créer un thème custom + l'ajouter à la liste ─────────────────────────
  const creerTheme = async (customColors) => {
    // customColors = { valeur: '#a855f7', couleur: 'Violet Custom', primaryLight, primaryDark }
    const data = await createTheme(
      customColors.valeur,
      customColors.couleur,
      customColors.primaryLight,
      customColors.primaryDark,
    );
    // data.id = nouvel id BDD
    const nouveau = buildTheme({
      id:           data.id,
      valeur:       customColors.valeur,
      couleur:      customColors.couleur,
      primaryLight: customColors.primaryLight,
      primaryDark:  customColors.primaryDark,
      est_applique: false,
    });
    setThemes(prev => [...prev, nouveau]);
    return data.id;
  };

  // ── Créer ET appliquer immédiatement ─────────────────────────────────────
  const creerEtAppliquer = async (customColors) => {
    const id = await creerTheme(customColors);
    await appliquer(id);
    return id;
  };

  // ── Supprimer un thème custom ─────────────────────────────────────────────
  const supprimerTheme = async (themeId) => {
    await deleteTheme(themeId);
    setThemes(prev => prev.filter(t => t.id !== themeId));
  };

  return (
    <ThemeContext.Provider value={{
      // État
      theme:        themeActif,       // objet thème actif (primary, primaryLight, primaryDark, name…)
      themes,                         // liste complète pour la grille
      loadingTheme,
      // Actions
      appliquer,           // appliquer un thème existant par son id
      creerTheme,          // créer un thème sans l'appliquer
      creerEtAppliquer,    // créer + appliquer en une fois
      supprimerTheme,      // supprimer un thème custom
    }}>
      {children}
    </ThemeContext.Provider>
  );
};