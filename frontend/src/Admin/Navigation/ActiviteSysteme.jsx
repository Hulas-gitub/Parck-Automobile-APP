import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// ============================================================================
// DONNÉES DE RÉFÉRENCE - alignées sur la BDD fleetify_db
// ============================================================================
const ROLES = [
  { code: 'admin',          libelle: 'Super Administrateur', color: '#ef4444', bg: 'bg-red-500/20 text-red-400' },
  { code: 'chef_parc',      libelle: 'Gestionnaire du Parc', color: '#6366f1', bg: 'bg-indigo-500/20 text-indigo-400' },
  { code: 'chef_tf',        libelle: 'Chef Transport de Fonds', color: '#f59e0b', bg: 'bg-amber-500/20 text-amber-400' },
  { code: 'agent_pc_radio', libelle: 'Agent PC Radio',       color: '#06b6d4', bg: 'bg-cyan-500/20 text-cyan-400' },
  { code: 'mecanicien',     libelle: 'Mécanicien / Technicien', color: '#10b981', bg: 'bg-emerald-500/20 text-emerald-400' },
  { code: 'chauffeur',      libelle: 'Chauffeur',             color: '#8b5cf6', bg: 'bg-violet-500/20 text-violet-400' },
];

const ACTIONS = [
  { code: 'CREATE',   libelle: 'Création',    icon: 'bi-plus-circle-fill',  color: '#10b981', bg: 'bg-emerald-500/20 text-emerald-400' },
  { code: 'UPDATE',   libelle: 'Modification',icon: 'bi-pencil-fill',        color: '#3b82f6', bg: 'bg-blue-500/20 text-blue-400' },
  { code: 'DELETE',   libelle: 'Suppression', icon: 'bi-trash-fill',         color: '#ef4444', bg: 'bg-red-500/20 text-red-400' },
  { code: 'READ',     libelle: 'Consultation',icon: 'bi-eye-fill',            color: '#6366f1', bg: 'bg-indigo-500/20 text-indigo-400' },
  { code: 'BLOQUER',  libelle: 'Blocage',     icon: 'bi-lock-fill',           color: '#f59e0b', bg: 'bg-amber-500/20 text-amber-400' },
  { code: 'DEBLOQUER',libelle: 'Déblocage',   icon: 'bi-unlock-fill',         color: '#06b6d4', bg: 'bg-cyan-500/20 text-cyan-400' },
  { code: 'LOGIN',    libelle: 'Connexion',   icon: 'bi-box-arrow-in-right',  color: '#8b5cf6', bg: 'bg-violet-500/20 text-violet-400' },
  { code: 'LOGOUT',   libelle: 'Déconnexion', icon: 'bi-box-arrow-right',     color: '#94a3b8', bg: 'bg-slate-500/20 text-slate-400' },
];

const TABLES = [
  'vehicules', 'missions', 'utilisateurs', 'interventions', 'accidents',
  'carnets_carburant', 'documents_vehicules', 'inspections', 'planning_maintenance',
  'pieces_detachees', 'fournisseurs', 'intervenants', 'roles',
];

const PERIODES = [
  { code: '7j',        libelle: '7 derniers jours',  jours: 7 },
  { code: '30j',       libelle: '30 derniers jours', jours: 30 },
  { code: 'mensuel',   libelle: 'Mensuel',            jours: 30 },
  { code: 'trimestriel',libelle: 'Trimestriel',       jours: 90 },
  { code: 'semestriel',libelle: 'Semestriel',         jours: 180 },
  { code: 'annuel',    libelle: 'Annuel',             jours: 365 },
];

// ============================================================================
// GÉNÉRATEUR DE DONNÉES DE DÉMO (simulant journaux_audit)
// ============================================================================
const generateAuditData = () => {
  const users = [
    { id: 1, nom: 'Hulas Djyembi',     role_code: 'admin',          direction: 'Direction Générale',   email: 'hulassanders@sgs.ga' },
    { id: 2, nom: 'Pierre Nzong',      role_code: 'chauffeur',      direction: 'Direction Technique',  email: 'p.nzong@sgs.ga' },
    { id: 3, nom: 'Marc Essono',       role_code: 'chef_parc',      direction: 'Direction RH',         email: 'm.essono@sgs.ga' },
    { id: 4, nom: 'Luc Mba',           role_code: 'chauffeur',      direction: 'Direction Technique',  email: 'l.mba@sgs.ga' },
    { id: 5, nom: 'Sophie Ondo',       role_code: 'agent_pc_radio', direction: 'Direction Générale',   email: 's.ondo@sgs.ga' },
    { id: 6, nom: 'François Obame',    role_code: 'mecanicien',     direction: 'Direction Technique',  email: 'f.obame@sgs.ga' },
    { id: 7, nom: 'Claire Bouanga',    role_code: 'chef_tf',        direction: 'Transport de Fonds',   email: 'c.bouanga@sgs.ga' },
    { id: 8, nom: 'Alain Nguema',      role_code: 'chef_parc',      direction: 'Direction Logistique', email: 'a.nguema@sgs.ga' },
  ];

  const actionsByRole = {
    admin:          ['CREATE', 'UPDATE', 'DELETE', 'READ', 'BLOQUER', 'DEBLOQUER', 'LOGIN', 'LOGOUT'],
    chef_parc:      ['CREATE', 'UPDATE', 'READ', 'LOGIN', 'LOGOUT'],
    chef_tf:        ['CREATE', 'UPDATE', 'READ', 'LOGIN', 'LOGOUT'],
    agent_pc_radio: ['READ', 'UPDATE', 'LOGIN', 'LOGOUT'],
    mecanicien:     ['CREATE', 'UPDATE', 'READ', 'LOGIN', 'LOGOUT'],
    chauffeur:      ['READ', 'LOGIN', 'LOGOUT'],
  };

  const tablesByRole = {
    admin:          TABLES,
    chef_parc:      ['vehicules', 'missions', 'interventions', 'carnets_carburant', 'documents_vehicules', 'planning_maintenance'],
    chef_tf:        ['missions', 'vehicules', 'accidents', 'carnets_carburant'],
    agent_pc_radio: ['vehicules', 'missions'],
    mecanicien:     ['interventions', 'inspections', 'pieces_detachees', 'planning_maintenance'],
    chauffeur:      ['missions', 'accidents'],
  };

  const sampleValues = {
    vehicules:    { immatriculation: 'AB-1234-GA', statut: 'disponible', kilometrage: 45000 },
    missions:     { destination: 'Franceville', statut: 'planifiee', type_mission: 'mission_brousse' },
    utilisateurs: { nom: 'Nouveau User', email: 'user@sgs.ga', role_id: 6 },
    interventions:{ type_intervention: 'Vidange', statut: 'terminee', cout_main_oeuvre: 85000 },
    carnets_carburant: { litres: 80, montant: 72000, station: 'Total Libreville' },
  };

  const ips = ['192.168.1.10', '192.168.1.22', '10.0.0.5', '10.0.0.15', '172.16.0.3'];

  const now = new Date();
  const logs = [];
  let id = 1;

  for (let dayOffset = 365; dayOffset >= 0; dayOffset--) {
    const day = new Date(now);
    day.setDate(day.getDate() - dayOffset);

    const nbLogs = Math.floor(Math.random() * 18) + 3;
    for (let j = 0; j < nbLogs; j++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const actions = actionsByRole[user.role_code];
      const tables = tablesByRole[user.role_code];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const table = tables[Math.floor(Math.random() * tables.length)];

      const logDate = new Date(day);
      logDate.setHours(Math.floor(Math.random() * 14) + 7);
      logDate.setMinutes(Math.floor(Math.random() * 60));
      logDate.setSeconds(Math.floor(Math.random() * 60));

      const baseVals = sampleValues[table] || { id: Math.floor(Math.random() * 100) + 1 };
      let anciennesValeurs = null;
      let nouvellesValeurs = null;

      if (action === 'CREATE') {
        nouvellesValeurs = { ...baseVals, id: id };
      } else if (action === 'UPDATE') {
        anciennesValeurs = { ...baseVals };
        nouvellesValeurs = { ...baseVals, statut: 'modifie', date_modification: logDate.toISOString() };
      } else if (action === 'DELETE') {
        anciennesValeurs = { ...baseVals, id: Math.floor(Math.random() * 100) + 1 };
      }

      logs.push({
        id: id++,
        user_id: user.id,
        user_nom: user.nom,
        user_email: user.email,
        user_role_code: user.role_code,
        user_direction: user.direction,
        action,
        nom_table: action === 'LOGIN' || action === 'LOGOUT' ? 'sessions' : table,
        id_enregistrement: String(Math.floor(Math.random() * 200) + 1),
        anciennes_valeurs: anciennesValeurs ? JSON.stringify(anciennesValeurs) : null,
        nouvelles_valeurs: nouvellesValeurs ? JSON.stringify(nouvellesValeurs) : null,
        adresse_ip: ips[Math.floor(Math.random() * ips.length)],
        user_agent: 'Mozilla/5.0 Chrome/121.0',
        date_creation: logDate.toISOString(),
      });
    }
  }

  return logs.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
};

const ALL_AUDIT_LOGS = generateAuditData();

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
// MAIN COMPONENT
// ============================================================================
const Activitesysteme= () => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [toast, setToast] = useState(null);
  const [animateCards, setAnimateCards] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportRef = useRef(null);

  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    const raf = requestAnimationFrame(() => { const raf2 = requestAnimationFrame(() => setAnimateCards(true)); return () => cancelAnimationFrame(raf2); });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const h = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportDropdownOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  // ── Filtrage par période ──
  const periodeInfo = PERIODES.find(p => p.code === periode) || PERIODES[0];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodeInfo.jours);

  const filteredLogs = ALL_AUDIT_LOGS.filter(log => {
    const logDate = new Date(log.date_creation);
    if (logDate < cutoffDate) return false;
    if (filterRole && log.user_role_code !== filterRole) return false;
    if (filterAction && log.action !== filterAction) return false;
    if (filterTable && log.nom_table !== filterTable) return false;
    if (filterUser && log.user_id !== parseInt(filterUser)) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!log.user_nom.toLowerCase().includes(s) &&
          !log.nom_table.toLowerCase().includes(s) &&
          !log.action.toLowerCase().includes(s) &&
          !log.adresse_ip.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => setCurrentPage(1), [periode, filterRole, filterAction, filterTable, filterUser, searchTerm]);

  // ── Statistiques ──
  const stats = {
    total: filteredLogs.length,
    parAction: Object.fromEntries(ACTIONS.map(a => [a.code, filteredLogs.filter(l => l.action === a.code).length])),
    parRole: Object.fromEntries(ROLES.map(r => [r.code, filteredLogs.filter(l => l.user_role_code === r.code).length])),
    utilisateursActifs: [...new Set(filteredLogs.map(l => l.user_id))].length,
    tablesModifiees: [...new Set(filteredLogs.filter(l => ['CREATE','UPDATE','DELETE'].includes(l.action)).map(l => l.nom_table))].length,
  };

  // Sparkline: activité des 7 derniers jours
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    return filteredLogs.filter(l => l.date_creation.slice(0, 10) === ds).length;
  });

  // Utilisateurs uniques pour le filtre
  const uniqueUsers = [...new Map(ALL_AUDIT_LOGS.map(l => [l.user_id, { id: l.user_id, nom: l.user_nom, role: l.user_role_code }])).values()];

  // ── Export ──
  const getExportHeaders = () => ['ID', 'Date & Heure', 'Utilisateur', 'Rôle', 'Direction', 'Action', 'Table', 'Enregistrement', 'Adresse IP', 'Ancienne Valeur', 'Nouvelle Valeur'];
  const getExportRow = (log) => [
    log.id,
    new Date(log.date_creation).toLocaleString('fr-FR'),
    log.user_nom,
    getRoleInfo(log.user_role_code).libelle,
    log.user_direction,
    getActionInfo(log.action).libelle,
    log.nom_table,
    log.id_enregistrement,
    log.adresse_ip,
    log.anciennes_valeurs || '—',
    log.nouvelles_valeurs || '—',
  ];

  const handleExport = (format) => {
    const title = `Journal_Audit_${periodeInfo.libelle.replace(/ /g, '_')}_${new Date().toISOString().slice(0,10)}`;
    const rows = filteredLogs.map(getExportRow);
    if (format === 'csv') { exportToCSV(rows, title, getExportHeaders()); showToast('Export Excel (CSV) effectué', 'success'); }
    else { exportToPDF(`Journal d'Audit — ${periodeInfo.libelle}`, getExportHeaders(), rows); showToast('Export PDF généré', 'success'); }
    setExportDropdownOpen(false);
  };

  const resetFilters = () => { setFilterRole(''); setFilterAction(''); setFilterTable(''); setFilterUser(''); setSearchTerm(''); };
  const hasFilters = filterRole || filterAction || filterTable || filterUser || searchTerm;

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
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

      <main className="transition-all duration-300 pt-24 px-6 pb-10" style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}>

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
          {/* Live indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2s infinite' }}></span>
            <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Surveillance active</span>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total activités', value: stats.total.toLocaleString(), icon: 'bi-activity', color: theme.primary, spark: last7, sub: `sur ${periodeInfo.libelle}` },
            { label: 'Utilisateurs actifs', value: stats.utilisateursActifs, icon: 'bi-people-fill', color: '#10b981', sub: 'ayant agi sur la période' },
            { label: 'Opérations CRUD', value: (stats.parAction['CREATE'] + stats.parAction['UPDATE'] + stats.parAction['DELETE']).toLocaleString(), icon: 'bi-database-fill-gear', color: '#f59e0b', sub: 'créations, modifs, suppressions' },
            { label: 'Tables concernées', value: stats.tablesModifiees, icon: 'bi-table', color: '#8b5cf6', sub: 'tables modifiées' },
          ].map((kpi, i) => (
            <div key={i}
              className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5 flex flex-col gap-3`}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Par action */}
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

          {/* Par rôle */}
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

          {/* Ligne 1: Période + Search + Export */}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            {/* Période buttons */}
            <div className={`flex rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {PERIODES.map(p => (
                <button key={p.code} onClick={() => setPeriode(p.code)}
                  className={`px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap ${periode === p.code ? 'text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`}
                  style={periode === p.code ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                  {p.libelle}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher utilisateur, table, IP..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2`}
                style={{ '--tw-ring-color': theme.primary }} />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><i className="bi bi-x"></i></button>}
            </div>

            {/* Export dropdown */}
            <div className="relative" ref={exportRef}>
              <button onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <i className="bi bi-download"></i> Exporter
                <i className={`bi bi-chevron-${exportDropdownOpen ? 'up' : 'down'} text-xs`}></i>
              </button>
              {exportDropdownOpen && (
                <div className={`absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} py-2 min-w-[200px]`}>
                  <p className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{filteredLogs.length} entrée(s) filtrée(s)</p>
                  <button onClick={() => handleExport('csv')} className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                    <i className="bi bi-file-earmark-spreadsheet text-emerald-500 text-base"></i>
                    <div><p className="font-medium">Exporter en Excel</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Format CSV (UTF-8)</p></div>
                  </button>
                  <button onClick={() => handleExport('pdf')} className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                    <i className="bi bi-file-earmark-pdf text-red-500 text-base"></i>
                    <div><p className="font-medium">Exporter en PDF</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Impression paysage</p></div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ligne 2: Filtres avancés */}
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
              <option value="sessions">sessions</option>
            </select>

            {hasFilters && (
              <button onClick={resetFilters}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 font-medium ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}>
                <i className="bi bi-x-lg text-xs"></i> Réinitialiser
              </button>
            )}

            <span className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {filteredLogs.length.toLocaleString()} résultat{filteredLogs.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── TABLE JOURNAL D'AUDIT ── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm overflow-hidden`}
          style={{ animation: animateCards ? 'fadeInUp 0.5s ease-out 0.6s both' : 'none' }}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                  {['Date & Heure', 'Utilisateur', 'Rôle', 'Action', 'Table / Entité', 'Valeurs', 'IP', ''].map((h, i) => (
                    <th key={i} className={`px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white ${i === 7 ? 'text-center w-12' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16">
                    <i className={`bi bi-inbox text-5xl ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}></i>
                    <p className={`mt-3 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun journal pour les filtres sélectionnés</p>
                  </td></tr>
                ) : paginatedLogs.map((log, rowIdx) => {
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
                      onClick={() => { setSelectedLog(log); setShowDetailModal(true); }}>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className={`text-xs font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{logDate.toLocaleDateString('fr-FR')}</p>
                        <p className={`text-[11px] font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{logDate.toLocaleTimeString('fr-FR')}</p>
                      </td>

                      {/* Utilisateur */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: roleInfo.color }}>
                            {log.user_nom.charAt(0)}
                          </div>
                          <div>
                            <p className={`text-xs font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} whitespace-nowrap`}>{log.user_nom}</p>
                            <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} whitespace-nowrap`}>{log.user_direction}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rôle */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge text={roleInfo.libelle} bg={roleInfo.bg} small />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${actionInfo.bg}`}>
                          <i className={`${actionInfo.icon} text-[10px]`}></i>
                          {actionInfo.libelle}
                        </span>
                      </td>

                      {/* Table */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className={`text-xs font-mono font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{log.nom_table}</p>
                          <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>#{log.id_enregistrement}</p>
                        </div>
                      </td>

                      {/* Valeurs changed indicator */}
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

                      {/* IP */}
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.adresse_ip}</span>
                      </td>

                      {/* Detail */}
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setSelectedLog(log); setShowDetailModal(true); }}
                          className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-500 hover:text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-800'}`}
                          title="Voir les détails">
                          <i className="bi bi-eye text-sm"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-5 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} sur {filteredLogs.length.toLocaleString()}
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

        {/* ── FOOTER ── */}
        <div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-center`}>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>© 2026 SGS — Journal d'Audit — Toutes les activités sont enregistrées</p>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL DÉTAIL D'UN LOG                                        */}
      {/* ============================================================ */}
      {showDetailModal && selectedLog && (() => {
        const log = selectedLog;
        const roleInfo = getRoleInfo(log.user_role_code);
        const actionInfo = getActionInfo(log.action);
        const logDate = new Date(log.date_creation);
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>

              {/* Header */}
              <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-start justify-between`}
                style={{ background: `linear-gradient(135deg, ${theme.primary}22, transparent)` }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: actionInfo.color }}>
                    <i className={`${actionInfo.icon} text-white text-xl`}></i>
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Détail de l'activité #{log.id}</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {logDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à {logDate.toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">

                {/* Info carte */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Utilisateur */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Utilisateur</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: roleInfo.color }}>
                        {log.user_nom.charAt(0)}
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

                  {/* Opération */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Opération</p>
                    <div className="space-y-2.5">
                      {[
                        ['Action', <Badge text={`${actionInfo.libelle}`} bg={actionInfo.bg} />],
                        ['Table', <span className={`text-sm font-mono font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{log.nom_table}</span>],
                        ['Enregistrement', <span className={`text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>#{log.id_enregistrement}</span>],
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

                {/* Diff valeurs */}
                {(log.anciennes_valeurs || log.nouvelles_valeurs) && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <i className="bi bi-arrow-left-right mr-1.5"></i>Comparaison des valeurs
                    </p>
                    {/* Header grid */}
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

              {/* Footer */}
              <div className={`p-5 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    const headers = getExportHeaders();
                    exportToCSV([getExportRow(log)], `Audit_${log.id}`, headers);
                    showToast('Entrée exportée', 'success');
                  }}
                    className={`px-4 py-2 rounded-lg border text-sm flex items-center gap-2 ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} transition-colors`}>
                    <i className="bi bi-file-earmark-spreadsheet text-emerald-500"></i>Exporter cette entrée
                  </button>
                </div>
                <button onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
                  style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
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