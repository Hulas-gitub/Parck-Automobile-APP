// ============================================================================
// STYLES UNIFORMES - Application Fleetify
// ============================================================================
// Ce fichier centralise tous les styles uniformes pour garantir la cohérence
// visuelle à travers toute l'application (modals, tableaux, formulaires, etc.)
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// STYLES DE MODAL (DÉTAIL)
// ─────────────────────────────────────────────────────────────────────────────
export const getModalStyles = (darkMode, theme) => {
  const accent = theme?.primary || '#3b82f6';
  const gradient = { background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` };

  return {
    muted: darkMode ? 'text-gray-400' : 'text-gray-500',
    cardClass: `p-4 rounded-xl border ${darkMode ? 'bg-gray-800/40 border-gray-700/70' : 'bg-gray-50 border-gray-200'}`,
    innerRow: darkMode ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200',
    divider: darkMode ? 'border-gray-700' : 'border-gray-200',
    smallLabel: `text-sm font-bold block mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`,
    accent,
    gradient,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES DE FORMULAIRE (INPUTS & LABELS)
// ─────────────────────────────────────────────────────────────────────────────
export const getFormStyles = (darkMode) => ({
  inputClass: `w-full px-3 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  }`,
  labelClass: `block text-sm font-bold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`,
  selectClass: `w-full px-3 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`,
  textareaClass: `w-full px-3 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none resize-none ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  }`,
});

// ─────────────────────────────────────────────────────────────────────────────
// STYLES DE TABLEAU
// ─────────────────────────────────────────────────────────────────────────────
export const getTableStyles = (darkMode) => ({
  container: `rounded-2xl border shadow-sm overflow-hidden ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200'}`,
  header: `px-5 py-3.5 border-b text-sm font-bold uppercase tracking-wider ${darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`,
  row: `px-5 py-4 border-b transition-colors ${darkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`,
  cell: `text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`,
  cellBold: `text-sm font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`,
});

// Fonction pour le style de ligne alternée (zebra striping) comme dans Vehicules.jsx
export const getRowBackgroundColor = (rowIdx, darkMode) => {
  return rowIdx % 2 === 0
    ? (darkMode ? '#0c1929' : '#e8eef6')  // Lignes paires
    : (darkMode ? '#162033' : '#f1f4f9');  // Lignes impaires
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES DE CARTE (KPI)
// ─────────────────────────────────────────────────────────────────────────────
export const getCardStyles = (darkMode) => ({
  base: `p-4 rounded-2xl border transition-all ${darkMode ? 'bg-gray-900/80 border-gray-800/80' : 'bg-white border-gray-200'} shadow-sm`,
  label: `text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`,
  value: `text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`,
  subtext: `text-[11px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`,
});

// ─────────────────────────────────────────────────────────────────────────────
// STYLES DE BOUTON
// ─────────────────────────────────────────────────────────────────────────────
export const getButtonStyles = (darkMode, theme) => {
  const accent = theme?.primary || '#3b82f6';
  const gradient = { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` };

  return {
    primary: `px-4 py-2.5 rounded-lg text-sm font-bold text-white shadow flex items-center gap-2 hover:opacity-90 transition-all`,
    secondary: `px-4 py-2.5 rounded-lg text-sm font-bold border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}`,
    danger: `px-4 py-2.5 rounded-lg text-sm font-bold border transition-colors ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`,
    success: `px-4 py-2.5 rounded-lg text-sm font-bold border transition-colors ${darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-600 hover:bg-green-100'}`,
    accent,
    gradient,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADER
// ─────────────────────────────────────────────────────────────────────────────
export const getSkeletonStyles = (darkMode) => ({
  bar: darkMode ? 'bg-gray-800' : 'bg-gray-200',
  barSoft: darkMode ? 'bg-gray-800/60' : 'bg-gray-100',
  card: darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200',
  pulse: 'animate-pulse',
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SKELETON COMPLET
// ─────────────────────────────────────────────────────────────────────────────
export const PageSkeleton = ({ darkMode }) => {
  const { bar, barSoft, card } = getSkeletonStyles(darkMode);

  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Chargement en cours">
      {/* En-tête + onglets */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl ${bar}`} />
          <div className="space-y-2">
            <div className={`h-6 w-56 rounded ${bar}`} />
            <div className={`h-3 w-80 max-w-full rounded ${barSoft}`} />
          </div>
        </div>
        <div className={`h-12 w-72 rounded-2xl ${bar}`} />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${card}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`h-3 w-28 rounded ${bar}`} />
              <div className={`w-8 h-8 rounded-xl ${bar}`} />
            </div>
            <div className={`h-7 w-24 rounded mb-2 ${bar}`} />
            <div className={`h-3 w-36 rounded ${barSoft}`} />
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-3 ${card}`}>
        <div className={`h-9 flex-1 min-w-[220px] rounded-xl ${bar}`} />
        <div className={`h-9 w-40 rounded-xl ${bar}`} />
        <div className={`h-9 w-36 rounded-xl ${bar}`} />
        <div className={`h-9 w-48 rounded-xl ${bar}`} />
      </div>

      {/* Tableau */}
      <div className={`rounded-2xl border overflow-hidden ${card}`}>
        <div className={`h-11 ${bar}`} />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-4 py-4 flex items-center gap-6">
            <div className="space-y-1.5">
              <div className={`h-4 w-24 rounded ${bar}`} />
              <div className={`h-3 w-32 rounded ${barSoft}`} />
            </div>
            <div className={`h-4 w-28 rounded ${bar}`} />
            <div className={`h-4 w-48 rounded ${bar}`} />
            <div className={`h-5 w-20 rounded-full ${bar}`} />
            <div className={`h-4 w-24 rounded ${bar}`} />
            <div className={`h-4 w-20 rounded ml-auto ${bar}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  getModalStyles,
  getFormStyles,
  getTableStyles,
  getRowBackgroundColor,
  getCardStyles,
  getButtonStyles,
  getSkeletonStyles,
  PageSkeleton,
};
