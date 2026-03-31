import React, { createContext, useContext, useState, useEffect } from 'react';

// Définition des thèmes disponibles avec leurs couleurs
export const availableThemes = {
  orange: {
    name: 'Orange Classique',
    primary: '#ffc400',
    primaryLight: '#ecb500',
    primaryDark: '#ffc400',
    gradient: 'from-yellow-400 to-orange-500',
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    bgDark: 'bg-orange-100',
    text: 'text-orange-600',
    hover: 'hover:bg-orange-600',
    ring: 'ring-orange-400'
  },
  blue: {
    name: 'Bleu Professionnel',
    primary: '#3b82f6',
    primaryLight: '#bfdbfe',
    primaryDark: '#1d4ed8',
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-100',
    text: 'text-blue-600',
    hover: 'hover:bg-blue-600',
    ring: 'ring-blue-400'
  },
  green: {
    name: 'Vert Nature',
    primary: '#10b981',
    primaryLight: '#a7f3d0',
    primaryDark: '#059669',
    gradient: 'from-green-400 to-emerald-600',
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    bgDark: 'bg-green-100',
    text: 'text-green-600',
    hover: 'hover:bg-green-600',
    ring: 'ring-green-400'
  },
  purple: {
    name: 'Violet Moderne',
    primary: '#8b5cf6',
    primaryLight: '#ddd6fe',
    primaryDark: '#6d28d9',
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-50',
    bgDark: 'bg-purple-100',
    text: 'text-purple-600',
    hover: 'hover:bg-purple-600',
    ring: 'ring-purple-400'
  },
  pink: {
    name: 'Rose Élégant',
    primary: '#ec4899',
    primaryLight: '#fbcfe8',
    primaryDark: '#be185d',
    gradient: 'from-pink-400 to-pink-600',
    bg: 'bg-pink-500',
    bgLight: 'bg-pink-50',
    bgDark: 'bg-pink-100',
    text: 'text-pink-600',
    hover: 'hover:bg-pink-600',
    ring: 'ring-pink-400'
  },
  red: {
    name: 'Rouge Dynamique',
    primary: '#ef4444',
    primaryLight: '#fecaca',
    primaryDark: '#dc2626',
    gradient: 'from-red-400 to-red-600',
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    bgDark: 'bg-red-100',
    text: 'text-red-600',
    hover: 'hover:bg-red-600',
    ring: 'ring-red-400'
  },
  indigo: {
    name: 'Indigo Créatif',
    primary: '#6366f1',
    primaryLight: '#c7d2fe',
    primaryDark: '#4f46e5',
    gradient: 'from-indigo-400 to-indigo-600',
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-50',
    bgDark: 'bg-indigo-100',
    text: 'text-indigo-600',
    hover: 'hover:bg-indigo-600',
    ring: 'ring-indigo-400'
  },
  teal: {
    name: 'Turquoise Frais',
    primary: '#14b8a6',
    primaryLight: '#99f6e4',
    primaryDark: '#0d9488',
    gradient: 'from-teal-400 to-teal-600',
    bg: 'bg-teal-500',
    bgLight: 'bg-teal-50',
    bgDark: 'bg-teal-100',
    text: 'text-teal-600',
    hover: 'hover:bg-teal-600',
    ring: 'ring-teal-400'
  },
  amber: {
    name: 'Ambre Chaleureux',
    primary: '#f59e0b',
    primaryLight: '#fde68a',
    primaryDark: '#d97706',
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    bgDark: 'bg-amber-100',
    text: 'text-amber-600',
    hover: 'hover:bg-amber-600',
    ring: 'ring-amber-400'
  },
  cyan: {
    name: 'Cyan Technologique',
    primary: '#06b6d4',
    primaryLight: '#a5f3fc',
    primaryDark: '#0891b2',
    gradient: 'from-cyan-400 to-cyan-600',
    bg: 'bg-cyan-500',
    bgLight: 'bg-cyan-50',
    bgDark: 'bg-cyan-100',
    text: 'text-cyan-600',
    hover: 'hover:bg-cyan-600',
    ring: 'ring-cyan-400'
  },
  slate: {
    name: 'Ardoise Sobre',
    primary: '#64748b',
    primaryLight: '#cbd5e1',
    primaryDark: '#475569',
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-500',
    bgLight: 'bg-slate-50',
    bgDark: 'bg-slate-100',
    text: 'text-slate-600',
    hover: 'hover:bg-slate-600',
    ring: 'ring-slate-400'
  },
  emerald: {
    name: 'Émeraude Luxe',
    primary: '#059669',
    primaryLight: '#a7f3d0',
    primaryDark: '#047857',
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    bgDark: 'bg-emerald-100',
    text: 'text-emerald-600',
    hover: 'hover:bg-emerald-600',
    ring: 'ring-emerald-400'
  }
};

// Création du contexte
const ThemeContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};

// Provider du contexte
export const ThemeProvider = ({ children }) => {
  // Récupération du thème depuis le localStorage ou orange par défaut
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme || 'orange';
  });

  // Mise à jour du thème
  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
    localStorage.setItem('appTheme', themeName);
    
    // Dans un vrai projet, tu enverrais une requête API ici pour sauvegarder en BDD
    // await api.updateSystemTheme(themeName);
  };

  // Récupération de la configuration du thème actuel
  const theme = availableThemes[currentTheme];

  useEffect(() => {
    // Appliquer les couleurs CSS custom properties pour utilisation dynamique
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--primary-light', theme.primaryLight);
    document.documentElement.style.setProperty('--primary-dark', theme.primaryDark);
  }, [currentTheme, theme]);

  const value = {
    currentTheme,
    theme,
    changeTheme,
    availableThemes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};