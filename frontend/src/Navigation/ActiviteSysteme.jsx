import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getTableStyles, PageSkeleton } from '../utils/uniformStyles';

// ⚠️ Vérifie que le nom de fichier réel correspond EXACTEMENT à cet import
// (respect de la casse obligatoire en prod / sur Linux, même si ça passe en dev).
import {
  getActivitesSysteme,
  getActivitesStats,
  getActivitesUtilisateurs,
  exportActivitesSysteme,
  ROLES,
  ACTIONS,
  PERIODES,
  TABLES,
} from '../api/Admin-Axios/Activitessysteme-axios.js';

// ============================================================================
// HELPERS
// ============================================================================
const ITEMS_PER_PAGE = 15;

/** Retire les paramètres vides avant de les envoyer à l'API (équivalent de l'ancien buildQuery) */
const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));

/** Extrait un message d'erreur lisible depuis une erreur axios (res.response.data.message) */
const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

// ============================================================================
// UTILITAIRES EXPORT
// ============================================================================
const exportToCSV = (data, filename, headers) => {
  let csv = '\uFEFF';
  csv += headers.join(';') + '\n';
  data.forEach(row => {
    csv += row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const exportToPDF = (title, headers, data) => {
  const win = window.open('', '_blank');
  if (!win) return;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    @page { size: landscape; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 20px; }
    h1 { color: #1e3a5f; font-size: 20px; border-bottom: 3px solid #6366f1; padding-bottom: 10px; margin-bottom: 6px; }
    .meta { color: #64748b; font-size: 11px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #1e3a5f; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
    td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(odd) td { background: #f0f4ff; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 20px; text-align: center; color: #94a3b8; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  </style></head><body>
  <h1>📋 ${title}</h1>
  <div class="meta">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} — ${data.length} entrée(s)</div>
  <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${data.map(row => `<tr>${row.map(cell => `<td>${String(cell ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="footer">SGS Fleetify — Journal d'Audit — ${new Date().getFullYear()}</div>
  <script>window.onload=function(){window.print();}</script></body></html>`;
  win.document.write(html);
  win.document.close();
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500' }[type] || 'bg-blue-500';
  const icon = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' }[type];
  return (
    <div className={`fixed top-4 right-4 z-[9999] ${bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3`}
      style={{ animation: 'fadeInDown 0.3s ease-out' }}>
      <style>{`@keyframes fadeInDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <i className={`${icon} text-xl`}></i>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-80"><i className="bi bi-x-lg"></i></button>
    </div>
  );
};

const Badge = ({ text, bg, small = false }) => (
  <span className={`inline-flex items-center gap-1 rounded-full font-medium ${bg} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>{text}</span>
);

const getRoleInfo = (code) => ROLES.find(r => r.code === code) || { libelle: code, bg: 'bg-gray-500/20 text-gray-400', color: '#94a3b8' };
const getActionInfo = (code) => ACTIONS.find(a => a.code === code) || { libelle: code, icon: 'bi-question', bg: 'bg-gray-500/20 text-gray-400', color: '#94a3b8' };

// ============================================================================
// MENU TROIS POINTS — actions d'une ligne du journal (même principe que Véhicules)
// ============================================================================
const RowActionsMenu = ({ log, darkMode, theme, onView }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const menuWidth = 210;
  const menuHeight = 56;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8;
      setMenuStyle({
        position: 'fixed',
        top: showAbove ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left: Math.max(8, rect.right - menuWidth),
        zIndex: 99999,
        width: menuWidth,
      });
    }
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        title="Actions"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${open
          ? 'text-white'
          : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        style={open ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` } : {}}
      >
        <i className="bi bi-three-dots-vertical text-sm"></i>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className={`rounded-xl shadow-2xl border py-1.5 overflow-hidden text-left ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={menuStyle}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onView(log); }}
            className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            <i className="bi bi-eye-fill text-base" style={{ color: theme.primary }}></i>Voir les détails
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

// ============================================================================
// MINI SVG SPARKLINE
// ============================================================================
const Sparkline = ({ data, color, height = 40 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ============================================================================
// DIFF VIEWER (anciennes / nouvelles valeurs)
// ============================================================================
const DiffViewer = ({ anciennes, nouvelles, darkMode }) => {
  const old = anciennes ? JSON.parse(anciennes) : {};
  const nw  = nouvelles  ? JSON.parse(nouvelles)  : {};
  const keys = [...new Set([...Object.keys(old), ...Object.keys(nw)])];

  if (keys.length === 0) return <p className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune donnée</p>;

  return (
    <div className="space-y-1.5">
      {keys.map(k => {
        const changed = JSON.stringify(old[k]) !== JSON.stringify(nw[k]);
        return (
          <div key={k} className={`grid grid-cols-3 gap-2 text-xs rounded-lg px-3 py-2 ${changed ? (darkMode ? 'bg-amber-900/20 border border-amber-800/40' : 'bg-amber-50 border border-amber-200') : (darkMode ? 'bg-gray-800' : 'bg-gray-50')}`}>
            <span className={`font-mono font-semibold truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{k}</span>
            <span className={`truncate ${changed ? 'line-through opacity-60 text-red-400' : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}>
              {old[k] !== undefined ? String(old[k]) : '—'}
            </span>
            <span className={`truncate font-medium ${changed ? 'text-emerald-400' : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}>
              {nw[k] !== undefined ? String(nw[k]) : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// SKELETON COMPONENTS (couvrent toute la page pendant le chargement initial)
// ============================================================================
const shimmer = 'animate-pulse';

const SkeletonBlock = ({ className = '', darkMode }) => (
  <div className={`${shimmer} rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} ${className}`} />
);

const SkeletonKPICard = ({ darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5 flex flex-col gap-3`}>
    <div className="flex items-center justify-between">
      <SkeletonBlock darkMode={darkMode} className="w-10 h-10 rounded-xl" />
      <SkeletonBlock darkMode={darkMode} className="w-28 h-10" />
    </div>
    <div className="space-y-2">
      <SkeletonBlock darkMode={darkMode} className="w-16 h-7" />
      <SkeletonBlock darkMode={darkMode} className="w-24 h-4" />
      <SkeletonBlock darkMode={darkMode} className="w-32 h-3" />
    </div>
  </div>
);

const SkeletonBarRow = ({ darkMode, labelWidth = 'w-28' }) => (
  <div className="flex items-center gap-3">
    <SkeletonBlock darkMode={darkMode} className={`${labelWidth} h-6 rounded-full`} />
    <SkeletonBlock darkMode={darkMode} className="flex-1 h-2 rounded-full" />
    <SkeletonBlock darkMode={darkMode} className="w-10 h-3" />
    <SkeletonBlock darkMode={darkMode} className="w-10 h-3" />
  </div>
);

const SkeletonTableRow = ({ darkMode, idx }) => (
  <tr style={{ backgroundColor: idx % 2 === 0 ? (darkMode ? '#0c1929' : '#e8eef6') : (darkMode ? '#162033' : '#f1f4f9') }}>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <SkeletonBlock darkMode={darkMode} className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

/** Skeleton de la barre d'outils (périodes / recherche / export / filtres) */
const SkeletonToolbar = ({ darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 mb-4`}>
    <div className="flex items-center gap-3 flex-wrap mb-3">
      <SkeletonBlock darkMode={darkMode} className="w-72 h-10 rounded-xl" />
      <SkeletonBlock darkMode={darkMode} className="flex-1 min-w-48 h-10 rounded-xl" />
      <SkeletonBlock darkMode={darkMode} className="w-32 h-10 rounded-xl" />
    </div>
    <div className="flex items-center gap-3 flex-wrap">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonBlock key={i} darkMode={darkMode} className="w-36 h-9 rounded-lg" />
      ))}
    </div>
  </div>
);

/** Skeleton pleine page : KPI + graphes de répartition + toolbar + tableau */
const SkeletonPage = ({ darkMode }) => (
  <>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} darkMode={darkMode} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {[8, 6].map((n, gi) => (
        <div key={gi} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5`}>
          <SkeletonBlock darkMode={darkMode} className="w-40 h-4 mb-4" />
          <div className="space-y-2.5">
            {Array.from({ length: n }).map((_, i) => <SkeletonBarRow key={i} darkMode={darkMode} />)}
          </div>
        </div>
      ))}
    </div>
    <SkeletonToolbar darkMode={darkMode} />
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm overflow-hidden`}>
      <table className="w-full">
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} darkMode={darkMode} idx={i} />)}
        </tbody>
      </table>
    </div>
  </>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Activitesysteme = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('fleetify_darkMode') !== 'false'; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  // ── Filtres ──
  const [periode, setPeriode] = useState('7j');
  const [filterRole, setFilterRole] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [toast, setToast] = useState(null);
  const [animateCards, setAnimateCards] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportRef = useRef(null);

  // ── Données serveur ──
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: ITEMS_PER_PAGE, total: 0 });
  const [serverStats, setServerStats] = useState({
    total: 0, par_action: {}, par_role: {}, utilisateurs_actifs: 0, tables_modifiees: 0, sparkline_7j: [0,0,0,0,0,0,0],
  });
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [loading, setLoading] = useState(true);       // skeleton plein écran (1er chargement)
  const [refreshing, setRefreshing] = useState(false); // rafraîchissement léger (changement de filtre)
  const [exporting, setExporting] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const openLog = (log) => { setSelectedLog(log); setShowDetailModal(true); };

  useEffect(() => {
    const raf = requestAnimationFrame(() => { const raf2 = requestAnimationFrame(() => setAnimateCards(true)); return () => cancelAnimationFrame(raf2); });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const h = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportDropdownOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Debounce de la recherche (évite 1 requête par frappe)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset page à 1 dès qu'un filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [periode, filterRole, filterAction, filterTable, filterUser, debouncedSearch]);

  // Liste des utilisateurs pour le filtre (chargée une seule fois, via le fichier axios)
  useEffect(() => {
    getActivitesUtilisateurs()
      .then(res => setUniqueUsers(res.data || []))
      .catch(() => {}); // non bloquant
  }, []);

  const filtresActuels = {
    periode,
    role: filterRole,
    action: filterAction,
    table: filterTable,
    user_id: filterUser,
    q: debouncedSearch,
  };

  // Chargement des logs + stats à chaque changement de filtre / page (via le fichier axios)
  useEffect(() => {
    let annule = false;
    const premierChargement = loading;
    if (!premierChargement) setRefreshing(true);

    const filtresPropres = cleanParams(filtresActuels);

    Promise.all([
      getActivitesSysteme({ ...filtresPropres, page: currentPage, per_page: ITEMS_PER_PAGE }),
      getActivitesStats(filtresPropres),
    ])
      .then(([logsRes, statsRes]) => {
        if (annule) return;
        setLogs(logsRes.data || []);
        setMeta(logsRes.meta || { current_page: 1, last_page: 1, per_page: ITEMS_PER_PAGE, total: 0 });
        setServerStats(statsRes.data || {});
      })
      .catch((err) => {
        if (annule) return;
        showToast(getErrorMessage(err, 'Erreur de chargement du journal'), 'error');
      })
      .finally(() => {
        if (annule) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => { annule = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periode, filterRole, filterAction, filterTable, filterUser, debouncedSearch, currentPage]);

  const periodeInfo = PERIODES.find(p => p.code === periode) || PERIODES[0];

  // ── Statistiques (fournies par le backend) ──
  const stats = {
    total: serverStats.total || 0,
    parAction: { ...Object.fromEntries(ACTIONS.map(a => [a.code, 0])), ...(serverStats.par_action || {}) },
    parRole: { ...Object.fromEntries(ROLES.map(r => [r.code, 0])), ...(serverStats.par_role || {}) },
    utilisateursActifs: serverStats.utilisateurs_actifs || 0,
    tablesModifiees: serverStats.tables_modifiees || 0,
  };
  const last7 = serverStats.sparkline_7j || [0,0,0,0,0,0,0];

  // ── Export ──
  const getExportHeaders = () => ['ID', 'Date & Heure', 'Utilisateur', 'Rôle', 'Direction', 'Action', 'Description', 'Table', 'Enregistrement', 'Adresse IP', 'Ancienne Valeur', 'Nouvelle Valeur'];
  const getExportRow = (log) => [
    log.id,
    new Date(log.date_creation).toLocaleString('fr-FR'),
    log.user_nom,
    getRoleInfo(log.user_role_code).libelle,
    log.user_direction,
    getActionInfo(log.action).libelle,
    log.libelle || '—',
    log.nom_table,
    log.id_enregistrement,
    log.adresse_ip,
    log.anciennes_valeurs || '—',
    log.nouvelles_valeurs || '—',
  ];

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const filtresPropres = cleanParams(filtresActuels);
      const res = await exportActivitesSysteme(filtresPropres);
      const rows = (res.data || []).map(getExportRow);
      const title = `Journal_Audit_${periodeInfo.libelle.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}`;
      if (format === 'csv') { exportToCSV(rows, title, getExportHeaders()); showToast('Export Excel (CSV) effectué', 'success'); }
      else { exportToPDF(`Journal d'Audit — ${periodeInfo.libelle}`, getExportHeaders(), rows); showToast('Export PDF généré', 'success'); }
    } catch (err) {
      showToast(getErrorMessage(err, "Échec de l'export"), 'error');
    } finally {
      setExporting(false);
      setExportDropdownOpen(false);
    }
  };

  const resetFilters = () => { setFilterRole(''); setFilterAction(''); setFilterTable(''); setFilterUser(''); setSearchTerm(''); };
  const hasFilters = filterRole || filterAction || filterTable || filterUser || searchTerm;
  const totalPages = meta.last_page || 1;

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex flex-col transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        .audit-row:hover { filter: brightness(1.08); }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; border-radius: 9999px; }
      `}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {(showNotifications || showProfile) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfile(false); }} />
      )}

      <main className="flex-1 transition-all duration-300 pt-24 px-4 pb-10" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '16.25rem' }}>

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between mb-6" style={{ animation: animateCards ? 'fadeInUp 0.4s ease-out both' : 'none' }}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                <i className="bi bi-shield-lock-fill text-white text-lg"></i>
              </div>
              <div>
                <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Journal d'Audit</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Traçabilité complète de toutes les activités utilisateurs</p>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
            <span className={`w-2 h-2 rounded-full ${refreshing ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ animation: 'pulse-dot 2s infinite' }}></span>
            <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{refreshing ? 'Actualisation…' : 'Surveillance active'}</span>
          </div>
        </div>

        {loading ? (
          <SkeletonPage darkMode={darkMode} />
        ) : (
        <>
        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total activités', value: stats.total.toLocaleString(), icon: 'bi-activity', color: theme.primary, spark: last7, sub: `sur ${periodeInfo.libelle}` },
            { label: 'Utilisateurs actifs', value: stats.utilisateursActifs, icon: 'bi-people-fill', color: '#10b981', sub: 'ayant agi sur la période' },
            { label: 'Opérations CRUD', value: (stats.parAction['CREATE'] + stats.parAction['UPDATE'] + stats.parAction['DELETE']).toLocaleString(), icon: 'bi-database-fill-gear', color: '#f59e0b', sub: 'créations, modifs, suppressions' },
            { label: 'Tables concernées', value: stats.tablesModifiees, icon: 'bi-table', color: '#8b5cf6', sub: 'tables modifiées' },
          ].map((kpi, i) => (
            <div key={i}
              className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition-opacity ${refreshing ? 'opacity-60' : 'opacity-100'}`}
              style={{ animation: animateCards ? `fadeInUp 0.5s ease-out ${i * 0.07}s both` : 'none' }}>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}22` }}>
                  <i className={`${kpi.icon} text-lg`} style={{ color: kpi.color }}></i>
                </div>
                {kpi.spark && <Sparkline data={kpi.spark} color={kpi.color} />}
              </div>
              <div>
                <p className={`text-3xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
                <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{kpi.label}</p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── STATS PAR ACTION & RÔLE ── */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 transition-opacity ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5`}
            style={{ animation: animateCards ? 'fadeInUp 0.5s ease-out 0.3s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Répartition par Action</h3>
            </div>
            <div className="space-y-2.5">
              {ACTIONS.map(action => {
                const count = stats.parAction[action.code] || 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={action.code} className="flex items-center gap-3">
                    <div className={`w-28 flex items-center gap-1.5 text-xs ${action.bg} px-2 py-1 rounded-full font-medium`}>
                      <i className={action.icon}></i>{action.libelle}
                    </div>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: action.color }} />
                    </div>
                    <span className={`text-xs font-bold tabular-nums w-10 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{count}</span>
                    <span className={`text-xs w-10 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5`}
            style={{ animation: animateCards ? 'fadeInUp 0.5s ease-out 0.4s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Activité par Rôle</h3>
            </div>
            <div className="space-y-2.5">
              {ROLES.map(role => {
                const count = stats.parRole[role.code] || 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={role.code} className="flex items-center gap-3">
                    <div className={`w-40 text-xs ${role.bg} px-2 py-1 rounded-full font-medium truncate`}>{role.libelle}</div>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: role.color }} />
                    </div>
                    <span className={`text-xs font-bold tabular-nums w-10 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{count}</span>
                    <span className={`text-xs w-10 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 mb-4`}
          style={{ animation: animateCards ? 'fadeInUp 0.5s ease-out 0.5s both' : 'none' }}>

          <div className="flex items-center gap-3 flex-wrap mb-3">
            <div className={`flex rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {PERIODES.map(p => (
                <button key={p.code} onClick={() => setPeriode(p.code)}
                  className={`px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap ${periode === p.code ? 'text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`}
                  style={periode === p.code ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                  {p.libelle}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-48">
              <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher utilisateur, table, IP..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2`}
                style={{ '--tw-ring-color': theme.primary }} />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><i className="bi bi-x"></i></button>}
            </div>
         
         
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <i className={`bi bi-funnel text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>

            <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
              <option value="">Tous les utilisateurs</option>
              {uniqueUsers.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
            </select>

            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
              <option value="">Tous les rôles</option>
              {ROLES.map(r => <option key={r.code} value={r.code}>{r.libelle}</option>)}
            </select>

            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
              <option value="">Toutes les actions</option>
              {ACTIONS.map(a => <option key={a.code} value={a.code}>{a.libelle}</option>)}
            </select>

            <select value={filterTable} onChange={e => setFilterTable(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
              <option value="">Toutes les tables</option>
              {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {hasFilters && (
              <button onClick={resetFilters}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 font-medium ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}>
                <i className="bi bi-x-lg text-xs"></i> Réinitialiser
              </button>
            )}

            <span className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {meta.total.toLocaleString()} résultat{meta.total > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── TABLE JOURNAL D'AUDIT ── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm overflow-hidden`}
          style={{ animation: animateCards ? 'fadeInUp 0.5s ease-out 0.6s both' : 'none' }}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              {/* En-tête aux couleurs du thème (ThemeContext) ; « Actions » = DERNIÈRE colonne */}
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                  {['Date & Heure', 'Utilisateur', 'Rôle', 'Opération', 'Table / Entité', 'Valeurs', 'IP', 'Actions'].map((h, i) => (
                    <th key={i} className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap ${i === 7 ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {refreshing ? (
                  Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonTableRow key={i} darkMode={darkMode} idx={i} />)
                ) : logs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16">
                    <i className={`bi bi-inbox text-5xl ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}></i>
                    <p className={`mt-3 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun journal pour les filtres sélectionnés</p>
                  </td></tr>
                ) : logs.map((log, rowIdx) => {
                  const roleInfo = getRoleInfo(log.user_role_code);
                  const actionInfo = getActionInfo(log.action);
                  const logDate = new Date(log.date_creation);
                  const hasChanges = log.anciennes_valeurs || log.nouvelles_valeurs;
                  return (
                    <tr key={log.id} className="audit-row transition-all duration-150 cursor-pointer"
                      style={{
                        backgroundColor: rowIdx % 2 === 0
                          ? (darkMode ? '#0c1929' : '#e8eef6')
                          : (darkMode ? '#162033' : '#f1f4f9'),
                        animation: animateCards ? `fadeInUp 0.35s ease-out ${rowIdx * 0.03}s both` : 'none'
                      }}
                      onClick={() => openLog(log)}>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className={`text-xs font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{logDate.toLocaleDateString('fr-FR')}</p>
                        <p className={`text-[11px] font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{logDate.toLocaleTimeString('fr-FR')}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: roleInfo.color }}>
                            {(log.user_nom || '?').charAt(0)}
                          </div>
                          <div>
                            <p className={`text-xs font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} whitespace-nowrap`}>{log.user_nom}</p>
                            <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} whitespace-nowrap`}>{log.user_direction}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge text={roleInfo.libelle} bg={roleInfo.bg} small />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${actionInfo.bg}`}>
                          <i className={`${actionInfo.icon} text-[10px]`}></i>
                          {actionInfo.libelle}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <p className={`text-xs font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {log.libelle || `${actionInfo.libelle} — ${log.nom_table}`}
                          </p>
                          <p className={`text-[10px] font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {log.nom_table} #{log.id_enregistrement}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {hasChanges ? (
                          <div className="flex items-center gap-1.5">
                            {log.anciennes_valeurs && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-mono">ancien</span>
                            )}
                            {log.nouvelles_valeurs && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">nouveau</span>
                            )}
                          </div>
                        ) : (
                          <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.adresse_ip}</span>
                      </td>

                      {/* Actions : dernière colonne, boutons regroupés dans le menu trois points */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <RowActionsMenu log={log} darkMode={darkMode} theme={theme} onView={openLog} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={`px-5 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Affichage {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} sur {meta.total.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                  className={`p-2 rounded-lg text-sm ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-30' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
                  <i className="bi bi-chevron-double-left"></i>
                </button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className={`p-2 rounded-lg text-sm ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-30' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 7) page = i + 1;
                  else if (currentPage <= 4) page = i + 1;
                  else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                  else page = currentPage - 3 + i;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${currentPage === page ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                      style={currentPage === page ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg text-sm ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-30' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
                  <i className="bi bi-chevron-right"></i>
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg text-sm ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-30' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
                  <i className="bi bi-chevron-double-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
        </>
        )}

      </main>

      {/* ── FOOTER ── */}
      <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />

      {showDetailModal && selectedLog && (() => {
        const log = selectedLog;
        const roleInfo = getRoleInfo(log.user_role_code);
        const actionInfo = getActionInfo(log.action);
        const logDate = new Date(log.date_creation);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>

              <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-start justify-between`}
                style={{ background: `linear-gradient(135deg, ${theme.primary}22, transparent)` }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: actionInfo.color }}>
                    <i className={`${actionInfo.icon} text-white text-xl`}></i>
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Détail de l'activité</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {logDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à {logDate.toLocaleTimeString('fr-FR')}
                    </p>
                    {log.libelle && (
                      <p className={`text-sm font-semibold mt-1.5 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{log.libelle}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">

                <div className="grid grid-cols-2 gap-4">
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Utilisateur</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: roleInfo.color }}>
                        {(log.user_nom || '?').charAt(0)}
                      </div>
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.user_nom}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.user_email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge text={roleInfo.libelle} bg={roleInfo.bg} />
                    </div>
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-building mr-1"></i>{log.user_direction}</p>
                  </div>

                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Opération</p>
                    <div className="space-y-2.5">
                      {[
                        ['Action', <Badge text={`${actionInfo.libelle}`} bg={actionInfo.bg} />],
                        ['Table', <span className={`text-sm font-mono font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{log.nom_table}</span>],
                    
                        ['Adresse IP', <span className={`text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{log.adresse_ip}</span>],
                        ['Navigateur', <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.user_agent}</span>],
                      ].map(([label, val], i) => (
                        <div key={i} className="flex items-center justify-between gap-3">
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} shrink-0`}>{label}</span>
                          <div className="text-right">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {(log.anciennes_valeurs || log.nouvelles_valeurs) && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <i className="bi bi-arrow-left-right mr-1.5"></i>Comparaison des valeurs
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-2 px-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Champ</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider text-red-400`}><i className="bi bi-dash-circle mr-1"></i>Ancienne valeur</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider text-emerald-400`}><i className="bi bi-plus-circle mr-1"></i>Nouvelle valeur</span>
                    </div>
                    <DiffViewer anciennes={log.anciennes_valeurs} nouvelles={log.nouvelles_valeurs} darkMode={darkMode} />
                  </div>
                )}

                {!log.anciennes_valeurs && !log.nouvelles_valeurs && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4 text-center`}>
                    <i className={`bi bi-info-circle text-3xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune donnée enregistrée pour cette action</p>
                  </div>
                )}
              </div>

              <div className={`p-5 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>


                <button onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
                  style={{ background: `linear-gradient(to left, ${theme.primary}, ${theme.primaryDark})` }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Activitesysteme;