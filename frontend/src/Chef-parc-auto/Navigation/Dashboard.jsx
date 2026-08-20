import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

import Sidebar        from '../../components/Sidebar';
import Header         from '../../components/Header';
import DashboardChart from '../../components/Dashboard-chart';

import { getDashboardData, getKpiVehicules, BADGE_COLORS } from '../../api/Admin-Axios/Dashboard-axios';

// ─────────────────────────────────────────────────────────────
// Helpers export
// ─────────────────────────────────────────────────────────────

/** Charge un script CDN une seule fois et résout quand il est prêt */
const loadScript = (src, globalKey) =>
  new Promise((resolve, reject) => {
    if (window[globalKey]) { resolve(window[globalKey]); return; }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { existing.addEventListener('load', () => resolve(window[globalKey])); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload  = () => resolve(window[globalKey]);
    s.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    document.head.appendChild(s);
  });

/** Récupère toutes les lignes KPI (per_page=999) avec authentification */
const fetchAllKpiRows = async (periode, search, immatriculation = '') => {
  const params = new URLSearchParams({ periode, search, page: 1, per_page: 999 });
  if (immatriculation) params.set('immatriculation', immatriculation);
  const token = localStorage.getItem('token');
  const base  = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const res   = await fetch(`${base}/admin/dashboard/kpi-vehicules?${params}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
};

/** En-têtes colonnes communes */
const HEADERS_EXCEL = [
  'Immatriculation','Marque','Modèle','Direction','Statut',
  'Dispo %','Missions','Km','Interventions','Durée interv (h)',
  'Coût missions','Coût interventions','Coût pièces','Coût total',
  'CFA/km','Anomalies','Accidents',
];
const HEADERS_PDF = [
  'Immat.','Marque / Modèle','Direction','Statut',
  'Dispo%','Missions','Km','Interv.','Coût total','CFA/km','Anom.','Acc.',
];

const rowToExcel = r => [
  r.immatriculation, r.marque, r.modele, r.direction, r.statut,
  r.taux_disponibilite, r.total_missions, r.total_km, r.total_interventions,
  r.total_duree_interventions_h, r.cout_missions, r.cout_interventions,
  r.cout_pieces, r.cout_total, r.cout_par_km ?? '', r.nb_anomalies, r.nb_accidents,
];

const rowToPdf = r => [
  r.immatriculation,
  `${r.marque} ${r.modele}`,
  r.direction,
  r.statut,
  `${r.taux_disponibilite}%`,
  r.total_missions,
  Number(r.total_km).toLocaleString('fr-FR'),
  r.total_interventions,
  `${Number(r.cout_total).toLocaleString('fr-FR')} CFA`,
  r.cout_par_km != null ? Number(r.cout_par_km).toLocaleString('fr-FR') : '—',
  r.nb_anomalies,
  r.nb_accidents,
];

/** Export Excel via SheetJS CDN */
const exportExcel = async (rows, periode, suffix = '') => {
  const XLSX = await loadScript(
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    'XLSX',
  );
  const wsData = [HEADERS_EXCEL, ...rows.map(rowToExcel)];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KPI Véhicules');
  XLSX.writeFile(wb, `kpi_vehicules_${periode}${suffix}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

const exportPdf = async (rows, periode, periodeLabel, suffix = '') => {

  await new Promise((resolve, reject) => {
    if (window.jspdf?.jsPDF) { resolve(); return; }
    document.querySelectorAll('script[src*="jspdf"]').forEach(s => s.remove());
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.async = false;
    s.onload = () => window.jspdf?.jsPDF ? resolve() : reject(new Error('jsPDF non disponible'));
    s.onerror = () => reject(new Error('Impossible de charger jsPDF'));
    document.head.appendChild(s);
  });

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const margin = 10;
  const availW = pageW - margin * 2;

  // ── En-tête du document ───────────────────────────────────
  const titre = suffix
    ? `KPI Véhicule — ${suffix} — ${periodeLabel}`
    : `KPI Véhicules — ${periodeLabel}`;

  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(titre, margin, 14);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    margin, 20
  );

  // ── Définition des colonnes ───────────────────────────────
  const cols = [
    { header: 'Immat.',     get: r => r.immatriculation,                                                                          w: 22 },
    { header: 'Marque',     get: r => r.marque,                                                                                   w: 20 },
    { header: 'Modèle',     get: r => r.modele,                                                                                   w: 20 },
    { header: 'Direction',  get: r => r.direction ?? '—',                                                                         w: 24 },
    { header: 'Statut',     get: r => r.statut,                                                                                   w: 22 },
    { header: 'Dispo%',     get: r => `${r.taux_disponibilite}%`,                                                                 w: 14 },
    { header: 'Missions',   get: r => String(r.total_missions),                                                                   w: 16 },
    { header: 'Km',         get: r => Number(r.total_km).toLocaleString('fr-FR'),                                                 w: 20 },
    { header: 'Interv.',    get: r => String(r.total_interventions),                                                              w: 14 },
    { header: 'Durée (h)',  get: r => `${r.total_duree_interventions_h}h`,                                                        w: 16 },
    { header: 'Coût total', get: r => `${Number(r.cout_total).toLocaleString('fr-FR')} F`,                                        w: 30 },
    { header: 'CFA/km',     get: r => r.cout_par_km != null ? Number(r.cout_par_km).toLocaleString('fr-FR') : '—',               w: 18 },
    { header: 'Anom.',      get: r => String(r.nb_anomalies),                                                                     w: 13 },
    { header: 'Acc.',       get: r => String(r.nb_accidents),                                                                     w: 13 },
  ];

  // ── Ajustement proportionnel sans arrondi cumulatif ───────
  const totalW = cols.reduce((s, c) => s + c.w, 0);
  const scale  = availW / totalW;
  let allocated = 0;
  cols.forEach((col, i) => {
    if (i < cols.length - 1) {
      col.width  = scale * col.w;
      allocated += col.width;
    } else {
      col.width = availW - allocated; // dernière colonne = reste exact
    }
  });

  // ── Constantes de mise en page ────────────────────────────
  const rowH     = 7;
  const headH    = 8;
  const fontSize = 6.5;
  const startX   = margin;
  let   y        = 26;

  const tableW = () => cols.reduce((s, c) => s + c.width, 0);

  // ── Dessin de l'en-tête de tableau ────────────────────────
  const drawHeader = () => {
    doc.setFillColor(59, 130, 246);
    doc.rect(startX, y, tableW(), headH, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');

    let x = startX;
    cols.forEach(col => {
      const maxChars = Math.floor(col.width / (fontSize * 0.33));
      const label    = col.header.length > maxChars
        ? col.header.slice(0, maxChars - 1) + '.'
        : col.header;
      doc.text(label, x + 1.5, y + headH - 2.5);
      x += col.width;
    });

    y += headH;
  };

  // ── Dessin d'une ligne de données ─────────────────────────
  const drawRow = (row, idx) => {
    // Fond alterné
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, y, tableW(), rowH, 'F');
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(startX, y, tableW(), rowH, 'F');
    }

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');

    let x = startX;
    cols.forEach(col => {
      const raw      = col.get(row) ?? '';
      const maxChars = Math.floor(col.width / (fontSize * 0.33));
      const cell     = String(raw).length > maxChars
        ? String(raw).slice(0, maxChars - 1) + '…'
        : String(raw);
      doc.text(cell, x + 1.5, y + rowH - 2);
      x += col.width;
    });

    // Séparateur horizontal léger
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(startX, y + rowH, startX + tableW(), y + rowH);

    y += rowH;
  };

  // ── Vérification saut de page ─────────────────────────────
  const checkNewPage = () => {
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin + 4;
      drawHeader();
    }
  };

  // ── Rendu du tableau ──────────────────────────────────────
  drawHeader();

  rows.forEach((row, idx) => {
    checkNewPage();
    drawRow(row, idx);
  });

  // Bordure extérieure du tableau
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.3);
  doc.rect(startX, 26, tableW(), y - 26);

  // ── Pied de page sur chaque page ──────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageW - margin,
      pageH - 4,
      { align: 'right' }
    );
    doc.text('© 2026 SGS — Tous droits réservés', margin, pageH - 4);
  }

  // ── Sauvegarde ────────────────────────────────────────────
  doc.save(
    `kpi_vehicules_${periode}${suffix ? '_' + suffix : ''}_${new Date().toISOString().slice(0, 10)}.pdf`
  );
};

// ═════════════════════════════════════════════════════════════
// Composant principal
// ═════════════════════════════════════════════════════════════
const Dashboard = () => {

  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; }
    catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  // ── États données backend ──
  const [loading,                   setLoading]                   = useState(true);
  const [error,                     setError]                     = useState(null);
  const [statsCards,                setStatsCards]                = useState([]);
  const [donutData,                 setDonutData]                 = useState([]);
  const [barChartData,              setBarChartData]              = useState([]);
  const [lineChartData,             setLineChartData]             = useState([]);
  const [interventionsData,         setInterventionsData]         = useState([]);
  const [interventionsJourData,     setInterventionsJourData]     = useState([]);
  const [usersRoleData,             setUsersRoleData]             = useState([]);
  const [vehiculesMarqueData,       setVehiculesMarqueData]       = useState([]);
  const [vehiculesCategorieData,    setVehiculesCategorieData]    = useState([]);
  const [documentsVehiculesData,    setDocumentsVehiculesData]    = useState([]);
  const [documentsChauffeursData,   setDocumentsChauffeursData]   = useState([]);
  const [missions,                  setMissions]                  = useState([]);
  const [alerts,                    setAlerts]                    = useState([]);
  const [performancesData,          setPerformancesData]          = useState(null);

  // ── États UI ──
  const [sidebarCollapsed,          setSidebarCollapsed]          = useState(false);
  const [hoveredBar,                setHoveredBar]                = useState(null);
  const [hoveredMonth,              setHoveredMonth]              = useState(null);
  const [hoveredInterventionBar,    setHoveredInterventionBar]    = useState(null);
  const [hoveredDayBar,             setHoveredDayBar]             = useState(null);
  const [hoveredRoleBar,            setHoveredRoleBar]            = useState(null);
  const [hoveredMarqueBar,          setHoveredMarqueBar]          = useState(null);
  const [hoveredCategorieBar,       setHoveredCategorieBar]       = useState(null);
  const [hoveredDocVehSegment,      setHoveredDocVehSegment]      = useState(null);
  const [hoveredDocChaufSegment,    setHoveredDocChaufSegment]    = useState(null);
  const [showNotifications,         setShowNotifications]         = useState(false);
  const [showProfile,               setShowProfile]               = useState(false);
  const [animateCharts,             setAnimateCharts]             = useState(false);

  // ── États modal KPI ──
  const [showKpiModal,   setShowKpiModal]   = useState(false);
  const [kpiData,        setKpiData]        = useState([]);
  const [kpiTotaux,      setKpiTotaux]      = useState(null);
  const [kpiPagination,  setKpiPagination]  = useState(null);
  const [kpiLoading,     setKpiLoading]     = useState(false);
  const [kpiPeriode,     setKpiPeriode]     = useState('1m');
  const [kpiSearch,      setKpiSearch]      = useState('');
  const [kpiPage,        setKpiPage]        = useState(1);
  const [kpiSelected,    setKpiSelected]    = useState(null);
  const [exportLoading,  setExportLoading]  = useState(false);

  const { theme } = useTheme();
  const navigate  = useNavigate();

  const periodeLabel = { '1m': 'Ce mois', '3m': '3 mois', '6m': '6 mois', '1an': '1 an' };

  // ── fetchKpiVehicules ─────────────────────────────────────
  const fetchKpiVehicules = useCallback(async (periode = '1m', search = '', page = 1) => {
    setKpiLoading(true);
    try {
      const res = await getKpiVehicules({ periode, search, page, per_page: 15 });
      setKpiData(res.data            ?? []);
      setKpiTotaux(res.totaux        ?? null);
      setKpiPagination(res.pagination ?? null);
    } catch (err) {
      console.error('Erreur KPI véhicules :', err);
      if (err.response?.status === 401) navigate('/login');
      setKpiData([]); setKpiTotaux(null); setKpiPagination(null);
    } finally {
      setKpiLoading(false);
    }
  }, [navigate]);

  // ── Export Excel (tous ou un seul) ────────────────────────
  const handleExportExcel = async (immat = null) => {
    setExportLoading(true);
    try {
      const rows = await fetchAllKpiRows(kpiPeriode, kpiSearch, immat ?? '');
      await exportExcel(rows, kpiPeriode, immat ?? '');
    } catch (e) { console.error('Export Excel :', e); alert("Erreur lors de l'export Excel."); }
    finally { setExportLoading(false); }
  };

  // ── Export PDF (tous ou un seul) ──────────────────────────
  const handleExportPdf = async (immat = null) => {
    setExportLoading(true);
    try {
      const rows = await fetchAllKpiRows(kpiPeriode, kpiSearch, immat ?? '');
      await exportPdf(rows, kpiPeriode, periodeLabel[kpiPeriode] ?? kpiPeriode, immat ?? '');
    } catch (e) { console.error('Export PDF :', e); alert("Erreur lors de l'export PDF."); }
    finally { setExportLoading(false); }
  };

  // ── Chargement dashboard principal ───────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true); setError(null);
        const data = await getDashboardData();
        if (cancelled) return;
        setStatsCards(data.stats_cards                          ?? []);
        setDonutData(data.donut_data                            ?? []);
        setBarChartData(data.bar_chart_data                     ?? []);
        setLineChartData(data.line_chart_data                   ?? []);
        setInterventionsData(data.interventions_data            ?? []);
        setInterventionsJourData(data.interventions_jour_data   ?? []);
        setUsersRoleData(data.users_role_data                   ?? []);
        setVehiculesMarqueData(data.vehicules_marque_data       ?? []);
        setVehiculesCategorieData(data.vehicules_categorie_data ?? []);
        setDocumentsVehiculesData(data.documents_vehicules_data ?? []);
        setDocumentsChauffeursData(data.documents_chauffeurs_data ?? []);
        setMissions(data.missions                               ?? []);
        setAlerts(data.alerts                                   ?? []);
        setPerformancesData(data.performances_chauffeurs_data   ?? null);
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 401) navigate('/login');
          else setError('Impossible de charger les données du tableau de bord.');
        }
      } finally { if (!cancelled) setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    setAnimateCharts(false);
    const id = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setAnimateCharts(true));
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id);
  }, [loading]);

  // ── Composants UI ────────────────────────────────────────
  const ChartCard = ({ children, className = '' }) => (
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden ${className}`} style={{ minHeight: '280px' }}>
      <div className="p-5 flex flex-col h-full">{children}</div>
    </div>
  );
  const ChartTitle = ({ children, icon }) => (
    <h3 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
      {icon && <i className={`${icon} text-blue-500`}></i>}{children}
    </h3>
  );
  const LegendRow = ({ items }) => (
    <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></div>
          <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
        </div>
      ))}
    </div>
  );
  const SkeletonCard = () => (
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-4 border shadow-sm animate-pulse`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 space-y-2">
          <div className={`h-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} w-2/3`}></div>
          <div className={`h-6 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} w-1/3`}></div>
          <div className={`h-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} w-1/2`}></div>
        </div>
        <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
      </div>
    </div>
  );
  const SkeletonChart = () => (
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm animate-pulse`} style={{ minHeight: '280px' }}>
      <div className="p-5 space-y-3">
        <div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} w-1/3`}></div>
        <div className={`h-44 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} w-full`}></div>
        <div className={`h-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} w-1/2 mx-auto`}></div>
      </div>
    </div>
  );

  if (error) return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex items-center justify-center`}>
      <div className="text-center space-y-4">
        <i className="bi bi-exclamation-triangle-fill text-red-500 text-5xl"></i>
        <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Réessayer</button>
      </div>
    </div>
  );

  // ── Bouton export générique ───────────────────────────────
  const ExportBtn = ({ type, immat, label }) => {
    const isExcel = type === 'excel';
    return (
      <button
        disabled={exportLoading}
        onClick={() => isExcel ? handleExportExcel(immat) : handleExportPdf(immat)}
        title={label}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 ${
          isExcel
            ? darkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-50 text-green-700 hover:bg-green-100'
            : darkMode ? 'bg-red-900 text-red-300 hover:bg-red-800'       : 'bg-red-50 text-red-700 hover:bg-red-100'
        }`}
      >
        <i className={`bi ${isExcel ? 'bi-file-earmark-excel' : 'bi-file-earmark-pdf'} text-xs`}></i>
        {label}
      </button>
    );
  };

  // ── Helper classes pour les alertes selon le type ─────────
  const alertStyles = (type) => {
    if (type === 'error') return {
      border:    'border-red-500',
      bg:        darkMode ? 'bg-red-950'    : 'bg-red-50',
      iconColor: 'text-red-500',
      badge:     darkMode ? 'bg-red-900 text-red-300'    : 'bg-red-100 text-red-700',
      title:     darkMode ? 'text-red-100'  : 'text-red-800',
      vehicle:   darkMode ? 'text-red-300'  : 'text-red-600',
      date:      darkMode ? 'text-red-400'  : 'text-red-500',
    };
    if (type === 'warning') return {
      border:    'border-yellow-500',
      bg:        darkMode ? 'bg-yellow-950' : 'bg-yellow-50',
      iconColor: 'text-yellow-500',
      badge:     darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
      title:     darkMode ? 'text-yellow-100' : 'text-yellow-800',
      vehicle:   darkMode ? 'text-yellow-300'  : 'text-yellow-700',
      date:      darkMode ? 'text-yellow-400'  : 'text-yellow-600',
    };
    // info
    return {
      border:    'border-blue-500',
      bg:        darkMode ? 'bg-blue-950'   : 'bg-blue-50',
      iconColor: 'text-blue-500',
      badge:     darkMode ? 'bg-blue-900 text-blue-300'   : 'bg-blue-100 text-blue-700',
      title:     darkMode ? 'text-blue-100' : 'text-blue-800',
      vehicle:   darkMode ? 'text-blue-300' : 'text-blue-600',
      date:      darkMode ? 'text-blue-400' : 'text-blue-500',
    };
  };

  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      <Header  darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed}
               showNotifications={showNotifications} setShowNotifications={setShowNotifications}
               showProfile={showProfile} setShowProfile={setShowProfile} />

      <main className="transition-all duration-300 pt-24 px-6 pb-6" style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}>

        {/* ─── STATS GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : statsCards.map((card, idx) => (
            <div key={idx}
              className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-4 border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
              style={{ animation: animateCharts ? `fadeInUp 0.5s ease-out ${idx * 0.1}s both` : 'none' }}>
              <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-0.5`}>{card.title}</p>
                  <h3 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>{card.value}</h3>
                  <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{card.subtitle}</p>
                </div>
                <div className={`${card.iconBg} ${card.textColor} p-2.5 rounded-lg group-hover:scale-110 transition-transform`}>
                  <i className={card.icon} style={{ fontSize: '1.25rem' }}></i>
                </div>
              </div>
              {card.trend && (
                <div className={`flex items-center gap-1 text-xs font-bold ${card.trend.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                  <i className={card.trend.includes('-') ? 'bi bi-graph-down-arrow' : 'bi bi-graph-up-arrow'}></i>
                  <span>{card.trend}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ─── ROW 1 ─── */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 1fr 1.4fr' }}>
          {loading ? <><SkeletonChart /><SkeletonChart /><SkeletonChart /></> : (
            <>
              <DashboardChart darkMode={darkMode} data={donutData} animateCharts={animateCharts} />

              {/* Stacked Bar — Véhicules inspectés */}
              <ChartCard>
                <ChartTitle icon="bi-clipboard2-check-fill">Véhicules inspectés — {new Date().getFullYear()}</ChartTitle>
                <div className="flex-1 flex flex-col justify-center">
                  <svg width="100%" viewBox="0 0 260 175" className="overflow-visible">
                    {[45,30,15,0].map((val,i)=>(
                      <text key={`y-${i}`} x="30" y={22+i*38} textAnchor="end" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{val===0?'0':val}</text>
                    ))}
                    {[0,1,2,3].map(i=>(
                      <line key={`grid-${i}`} x1="36" y1={22+i*38} x2="256" y2={22+i*38} stroke={darkMode?'#374151':'#e5e7eb'} strokeWidth="0.7"/>
                    ))}
                    {barChartData.map((data,idx)=>{
                      const maxVal=45,chartH=114,barW=14,slotW=220/barChartData.length;
                      const centerX=36+slotW*idx+slotW/2,x=centerX-barW/2,baseY=136;
                      const hD=animateCharts?((data.danger||0)/maxVal)*chartH:0;
                      const hN=animateCharts?((data.nonConforme||0)/maxVal)*chartH:0;
                      const hC=animateCharts?((data.conforme||0)/maxVal)*chartH:0;
                      return (
                        <g key={idx} onMouseEnter={()=>setHoveredBar(idx)} onMouseLeave={()=>setHoveredBar(null)} className="cursor-pointer">
                          <rect x={x} y={baseY-hD} width={barW} height={hD} fill="#ef4444" rx="2" style={{transition:`height 0.8s ease-out ${idx*0.07}s,y 0.8s ease-out ${idx*0.07}s`}}/>
                          <rect x={x} y={baseY-hD-hN} width={barW} height={hN} fill="#f97316" style={{transition:`height 0.8s ease-out ${idx*0.07+0.15}s,y 0.8s ease-out ${idx*0.07+0.15}s`}}/>
                          <rect x={x} y={baseY-hD-hN-hC} width={barW} height={hC} fill="#10b981" rx="2" style={{transition:`height 0.8s ease-out ${idx*0.07+0.3}s,y 0.8s ease-out ${idx*0.07+0.3}s`}}/>
                          <text x={centerX} y="158" textAnchor="middle" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{data.month}</text>
                          {hoveredBar===idx&&(
                            <g>
                              <rect x={centerX-42} y={baseY-hD-hN-hC-68} width="84" height="62" rx="6" fill="#1f2937"/>
                              <text x={centerX} y={baseY-hD-hN-hC-56} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="600">{data.month} — {data.total} véh.</text>
                              <circle cx={centerX-32} cy={baseY-hD-hN-hC-44} r="3" fill="#10b981"/><text x={centerX-26} y={baseY-hD-hN-hC-41} fontSize="8" fill="#d1d5db">Conforme: {data.conforme||0}</text>
                              <circle cx={centerX-32} cy={baseY-hD-hN-hC-30} r="3" fill="#f97316"/><text x={centerX-26} y={baseY-hD-hN-hC-27} fontSize="8" fill="#d1d5db">Non conf.: {data.nonConforme||0}</text>
                              <circle cx={centerX-32} cy={baseY-hD-hN-hC-16} r="3" fill="#ef4444"/><text x={centerX-26} y={baseY-hD-hN-hC-13} fontSize="8" fill="#d1d5db">Danger: {data.danger||0}</text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <LegendRow items={[{label:'Conforme',color:'#10b981'},{label:'Non conforme',color:'#f97316'},{label:'Danger',color:'#ef4444'}]}/>
              </ChartCard>

              {/* Line — Interventions */}
              <ChartCard>
                <ChartTitle icon="bi-graph-up">Interventions Créées vs Résolues</ChartTitle>
                <div className="flex-1 flex flex-col justify-center">
                  <svg width="100%" viewBox="0 0 345 165" className="overflow-visible">
                    {[60,45,30,15,0].map((val,i)=>(<text key={`y-${i}`} x="26" y={18+i*30} textAnchor="end" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{val}</text>))}
                    {[0,1,2,3,4].map(i=>(<line key={`g-${i}`} x1="30" y1={18+i*30} x2="340" y2={18+i*30} stroke={darkMode?'#374151':'#e5e7eb'} strokeWidth="0.7"/>))}
                    {(()=>{
                      if(!interventionsData.length) return null;
                      const cl=32,cw=308,sw=cw/(interventionsData.length-1),bY=138,cH=120,mV=60;
                      const gX=i=>cl+i*sw, gY=v=>bY-(v/mV)*cH;
                      const pC=interventionsData.map((d,i)=>(i===0?'M':'L')+` ${gX(i)},${gY(d.creees)}`).join(' ');
                      const pR=interventionsData.map((d,i)=>(i===0?'M':'L')+` ${gX(i)},${gY(d.resolues)}`).join(' ');
                      return(<>
                        <path d={pC+` L ${gX(interventionsData.length-1)},${bY} L ${gX(0)},${bY} Z`} fill="#06b6d4" fillOpacity="0.08"/>
                        <path d={pR+` L ${gX(interventionsData.length-1)},${bY} L ${gX(0)},${bY} Z`} fill="#8b5cf6" fillOpacity="0.08"/>
                        <path d={pC} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:animateCharts?'0':'1000',strokeDashoffset:animateCharts?'0':'1000',transition:'stroke-dashoffset 1.5s ease-out'}}/>
                        <path d={pR} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:animateCharts?'0':'1000',strokeDashoffset:animateCharts?'0':'1000',transition:'stroke-dashoffset 1.5s ease-out 0.3s'}}/>
                        {interventionsData.map((d,i)=>(
                          <g key={i} onMouseEnter={()=>setHoveredInterventionBar(i)} onMouseLeave={()=>setHoveredInterventionBar(null)} className="cursor-pointer">
                            <circle cx={gX(i)} cy={gY(d.creees)} r="3.5" fill="#06b6d4" style={{opacity:animateCharts?1:0,transition:`opacity 0.3s ease-out ${i*0.08+1}s`}}/>
                            <circle cx={gX(i)} cy={gY(d.resolues)} r="3.5" fill="#8b5cf6" style={{opacity:animateCharts?1:0,transition:`opacity 0.3s ease-out ${i*0.08+1.2}s`}}/>
                            <text x={gX(i)} y="155" textAnchor="middle" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{d.month}</text>
                          </g>
                        ))}
                        {hoveredInterventionBar!==null&&(()=>{
                          const i=hoveredInterventionBar,d=interventionsData[i],tx=gX(i),ty=Math.min(gY(d.creees),gY(d.resolues))-50;
                          return(<g><rect x={tx-38} y={ty} width="76" height="42" rx="6" fill="#1f2937"/>
                            <text x={tx} y={ty+14} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="600">{d.month}</text>
                            <circle cx={tx-28} cy={ty+26} r="3" fill="#06b6d4"/><text x={tx-22} y={ty+29} fontSize="8" fill="#d1d5db">C: {d.creees}</text>
                            <circle cx={tx+6} cy={ty+26} r="3" fill="#8b5cf6"/><text x={tx+12} y={ty+29} fontSize="8" fill="#d1d5db">R: {d.resolues}</text>
                          </g>);
                        })()}
                      </>);
                    })()}
                  </svg>
                </div>
                <LegendRow items={[{label:'Créées',color:'#06b6d4'},{label:'Résolues',color:'#8b5cf6'}]}/>
              </ChartCard>
            </>
          )}
        </div>

        {/* ─── ROW 2 ─── */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 1fr 1.4fr' }}>
          {loading ? <><SkeletonChart /><SkeletonChart /><SkeletonChart /></> : (
            <>
              {/* Interventions / Jour */}
              <ChartCard>
                <ChartTitle icon="bi-calendar-week">Interventions / Jour</ChartTitle>
                <div className="flex-1 flex flex-col justify-center">
                  <svg width="100%" viewBox="0 0 200 155" className="overflow-visible">
                    {[20,15,10,5,0].map((val,i)=>(<text key={`y-${i}`} x="22" y={16+i*28} textAnchor="end" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{val}</text>))}
                    {[0,1,2,3,4].map(i=>(<line key={`g-${i}`} x1="26" y1={16+i*28} x2="196" y2={16+i*28} stroke={darkMode?'#374151':'#e5e7eb'} strokeWidth="0.7"/>))}
                    {(()=>{
                      const cl=28,cw=168,sw=cw/interventionsJourData.length,bY=128,cH=112,mV=22;
                      return interventionsJourData.map((d,idx)=>{
                        const cx2=cl+sw*idx+sw/2,bw=10,x=cx2-bw/2,h=animateCharts?(d.count/mV)*cH:0;
                        return(<g key={idx} onMouseEnter={()=>setHoveredDayBar(idx)} onMouseLeave={()=>setHoveredDayBar(null)} className="cursor-pointer">
                          <defs><linearGradient id={`dayGrad-${idx}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#06b6d4"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient></defs>
                          <rect x={x} y={bY-h} width={bw} height={h} fill={`url(#dayGrad-${idx})`} rx="3" style={{transition:`height 0.8s ease-out ${idx*0.1}s,y 0.8s ease-out ${idx*0.1}s`}}/>
                          <text x={cx2} y="147" textAnchor="middle" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{d.day}</text>
                          {hoveredDayBar===idx&&(<g><rect x={cx2-28} y={bY-h-34} width="56" height="26" rx="5" fill="#1f2937"/>
                            <text x={cx2} y={bY-h-20} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="600">{d.day}</text>
                            <text x={cx2} y={bY-h-9} textAnchor="middle" fontSize="8" fill="#d1d5db">{d.count} interv.</text>
                          </g>)}
                        </g>);
                      });
                    })()}
                  </svg>
                </div>
                <LegendRow items={[{label:'Interventions',color:'#06b6d4'}]}/>
              </ChartCard>

              {/* Utilisateurs par Rôle */}
              <ChartCard>
                <ChartTitle icon="bi-people-fill">Utilisateurs par Rôle</ChartTitle>
                <div className="flex-1 flex flex-col justify-center">
                  <svg width="100%" viewBox="0 0 220 155" className="overflow-visible">
                    {[30,22,15,8,0].map((val,i)=>(<text key={`y-${i}`} x="22" y={16+i*28} textAnchor="end" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{val}</text>))}
                    {[0,1,2,3,4].map(i=>(<line key={`g-${i}`} x1="26" y1={16+i*28} x2="216" y2={16+i*28} stroke={darkMode?'#374151':'#e5e7eb'} strokeWidth="0.7"/>))}
                    {(()=>{
                      const cl=28,cw=188,sw=cw/usersRoleData.length,bY=128,cH=112,mV=30;
                      return usersRoleData.map((d,idx)=>{
                        const cx2=cl+sw*idx+sw/2,bw=12,x=cx2-bw/2,h=animateCharts?(d.count/mV)*cH:0;
                        return(<g key={idx} onMouseEnter={()=>setHoveredRoleBar(idx)} onMouseLeave={()=>setHoveredRoleBar(null)} className="cursor-pointer">
                          <rect x={x} y={bY-h} width={bw} height={h} fill={d.color} rx="3" style={{transition:`height 0.8s ease-out ${idx*0.1}s,y 0.8s ease-out ${idx*0.1}s`}}/>
                          <text x={cx2} y="147" textAnchor="middle" fontSize="7.5" fill={darkMode?'#6b7280':'#9ca3af'}>{d.role.length>8?d.role.slice(0,7)+'…':d.role}</text>
                          {hoveredRoleBar===idx&&(<g><rect x={cx2-36} y={bY-h-34} width="72" height="26" rx="5" fill="#1f2937"/>
                            <text x={cx2} y={bY-h-20} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="600">{d.role}</text>
                            <text x={cx2} y={bY-h-9} textAnchor="middle" fontSize="8" fill="#d1d5db">{d.count} utilisateurs</text>
                          </g>)}
                        </g>);
                      });
                    })()}
                  </svg>
                </div>
                <div className="flex flex-col gap-1.5 mt-3">
                  <div className="flex items-center justify-center gap-3">{usersRoleData.slice(0,3).map((d,i)=>(<div key={i} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:d.color}}></div><span className={`text-[10px] font-medium ${darkMode?'text-gray-400':'text-gray-600'}`}>{d.role}</span></div>))}</div>
                  <div className="flex items-center justify-center gap-3">{usersRoleData.slice(3).map((d,i)=>(<div key={i} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:d.color}}></div><span className={`text-[10px] font-medium ${darkMode?'text-gray-400':'text-gray-600'}`}>{d.role}</span></div>))}</div>
                </div>
              </ChartCard>

              {/* Consommation & Économies */}
              <ChartCard>
                <ChartTitle icon="bi-fuel-pump">Consommation & Économies</ChartTitle>
                <div className="flex-1 flex flex-col justify-center">
                  <svg width="100%" viewBox="0 0 350 165" className="overflow-visible">
                    {[8000,6000,4000,2000,0].map((val,i)=>(<text key={`ly-${i}`} x="30" y={18+i*30} textAnchor="end" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{val}</text>))}
                    {['400k','300k','200k','100k','0'].map((val,i)=>(<text key={`ry-${i}`} x="342" y={18+i*30} textAnchor="start" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{val}</text>))}
                    {[0,1,2,3,4].map(i=>(<line key={`g-${i}`} x1="34" y1={18+i*30} x2="308" y2={18+i*30} stroke={darkMode?'#374151':'#e5e7eb'} strokeWidth="0.7"/>))}
                    {(()=>{
                      if(!lineChartData.length) return null;
                      const cl=36,cw=272,sw=cw/lineChartData.length,bY=138,cH=120;
                      const gLX=i=>cl+sw*i+sw/2,gBX=i=>gLX(i)-5;
                      const gBY=v=>bY-(v/8000)*cH,gLY=v=>bY-(v/400000)*cH;
                      const ep=lineChartData.map((d,i)=>(i===0?'M':'L')+` ${gLX(i)},${gLY(d.economies)}`).join(' ');
                      return(<>
                        {lineChartData.map((d,i)=>{const h=animateCharts?(d.consommation/8000)*cH:0;return(
                          <rect key={`bar-${i}`} x={gBX(i)} y={bY-h} width={10} height={h} fill="#10b981" rx="2"
                            onMouseEnter={()=>setHoveredMonth(i)} onMouseLeave={()=>setHoveredMonth(null)} className="cursor-pointer"
                            style={{transition:`height 0.8s ease-out ${i*0.08}s,y 0.8s ease-out ${i*0.08}s`}}/>
                        );})}
                        <path d={ep} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:animateCharts?'0':'1000',strokeDashoffset:animateCharts?'0':'1000',transition:'stroke-dashoffset 1.5s ease-out 0.5s'}}/>
                        {lineChartData.map((d,i)=>(<g key={`dot-${i}`} onMouseEnter={()=>setHoveredMonth(i)} onMouseLeave={()=>setHoveredMonth(null)} className="cursor-pointer">
                          <circle cx={gLX(i)} cy={gLY(d.economies)} r="3.5" fill="#f59e0b" style={{opacity:animateCharts?1:0,transition:`opacity 0.3s ease-out ${i*0.08+1.5}s`}}/>
                          <text x={gLX(i)} y="155" textAnchor="middle" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{d.month}</text>
                        </g>))}
                        {hoveredMonth!==null&&(()=>{const i=hoveredMonth,d=lineChartData[i],tx=gLX(i),ty=gBY(d.consommation)-48;return(
                          <g><rect x={tx-44} y={ty} width="88" height="42" rx="6" fill="#1f2937"/>
                            <text x={tx} y={ty+14} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="600">{d.month}</text>
                            <circle cx={tx-36} cy={ty+28} r="3" fill="#10b981"/><text x={tx-30} y={ty+31} fontSize="8" fill="#d1d5db">{d.consommation} L</text>
                            <circle cx={tx+4} cy={ty+28} r="3" fill="#f59e0b"/><text x={tx+10} y={ty+31} fontSize="8" fill="#d1d5db">{(d.economies/1000).toFixed(0)}k</text>
                          </g>);
                        })()}
                      </>);
                    })()}
                  </svg>
                </div>
                <LegendRow items={[{label:'Consommation (L)',color:'#10b981'},{label:'Économies (CFA)',color:'#f59e0b'}]}/>
              </ChartCard>
            </>
          )}
        </div>

        {/* ─── ROW 3 ─── */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {loading ? <><SkeletonChart /><SkeletonChart /><SkeletonChart /></> : (
            <>
              {/* Véhicules par Marque */}
              <ChartCard>
                <ChartTitle icon="bi-bookmark-star-fill">Véhicules par Marque</ChartTitle>
                <div className="flex-1 flex flex-col justify-center">
                  <svg width="100%" viewBox="0 0 200 155" className="overflow-visible">
                    {[20,15,10,5,0].map((val,i)=>(<text key={`y-${i}`} x="22" y={16+i*28} textAnchor="end" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{val}</text>))}
                    {[0,1,2,3,4].map(i=>(<line key={`g-${i}`} x1="26" y1={16+i*28} x2="196" y2={16+i*28} stroke={darkMode?'#374151':'#e5e7eb'} strokeWidth="0.7"/>))}
                    {(()=>{const cl=28,cw=168,sw=cw/vehiculesMarqueData.length,bY=128,cH=112,mV=20;
                      return vehiculesMarqueData.map((d,idx)=>{const cx2=cl+sw*idx+sw/2,bw=14,x=cx2-bw/2,h=animateCharts?(d.count/mV)*cH:0;
                        return(<g key={idx} onMouseEnter={()=>setHoveredMarqueBar(idx)} onMouseLeave={()=>setHoveredMarqueBar(null)} className="cursor-pointer">
                          <rect x={x} y={bY-h} width={bw} height={h} fill={d.color} rx="3" style={{transition:`height 0.8s ease-out ${idx*0.1}s,y 0.8s ease-out ${idx*0.1}s`}}/>
                          <text x={cx2} y="147" textAnchor="middle" fontSize="8" fill={darkMode?'#6b7280':'#9ca3af'}>{d.marque.length>6?d.marque.slice(0,5)+'.':d.marque}</text>
                          {hoveredMarqueBar===idx&&(<g><rect x={cx2-30} y={bY-h-34} width="60" height="26" rx="5" fill="#1f2937"/>
                            <text x={cx2} y={bY-h-20} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="600">{d.marque}</text>
                            <text x={cx2} y={bY-h-9} textAnchor="middle" fontSize="8" fill="#d1d5db">{d.count} véhicules</text>
                          </g>)}
                        </g>);});})()}
                  </svg>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  {vehiculesMarqueData.map((d,i)=>(<div key={i} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:d.color}}></div><span className={`text-[10px] font-medium ${darkMode?'text-gray-400':'text-gray-600'}`}>{d.marque}</span></div>))}
                </div>
              </ChartCard>

              {/* Véhicules par Catégorie */}
              <ChartCard>
                <ChartTitle icon="bi-grid-3x3-gap-fill">Véhicules par Catégorie</ChartTitle>
                <div className="flex-1 flex flex-col justify-center">
                  <svg width="100%" viewBox="0 0 200 155" className="overflow-visible">
                    {[20,15,10,5,0].map((val,i)=>(<text key={`y-${i}`} x="22" y={16+i*28} textAnchor="end" fontSize="9" fill={darkMode?'#6b7280':'#9ca3af'}>{val}</text>))}
                    {[0,1,2,3,4].map(i=>(<line key={`g-${i}`} x1="26" y1={16+i*28} x2="196" y2={16+i*28} stroke={darkMode?'#374151':'#e5e7eb'} strokeWidth="0.7"/>))}
                    {(()=>{const cl=28,cw=168,sw=cw/vehiculesCategorieData.length,bY=128,cH=112,mV=22;
                      return vehiculesCategorieData.map((d,idx)=>{const cx2=cl+sw*idx+sw/2,bw=14,x=cx2-bw/2,h=animateCharts?(d.count/mV)*cH:0;
                        return(<g key={idx} onMouseEnter={()=>setHoveredCategorieBar(idx)} onMouseLeave={()=>setHoveredCategorieBar(null)} className="cursor-pointer">
                          <rect x={x} y={bY-h} width={bw} height={h} fill={d.color} rx="3" style={{transition:`height 0.8s ease-out ${idx*0.1}s,y 0.8s ease-out ${idx*0.1}s`}}/>
                          <text x={cx2} y="147" textAnchor="middle" fontSize="8" fill={darkMode?'#6b7280':'#9ca3af'}>{d.categorie.length>7?d.categorie.slice(0,6)+'.':d.categorie}</text>
                          {hoveredCategorieBar===idx&&(<g><rect x={cx2-32} y={bY-h-34} width="64" height="26" rx="5" fill="#1f2937"/>
                            <text x={cx2} y={bY-h-20} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="600">{d.categorie}</text>
                            <text x={cx2} y={bY-h-9} textAnchor="middle" fontSize="8" fill="#d1d5db">{d.count} véhicules</text>
                          </g>)}
                        </g>);});})()}
                  </svg>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  {vehiculesCategorieData.map((d,i)=>(<div key={i} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor:d.color}}></div><span className={`text-[10px] font-medium ${darkMode?'text-gray-400':'text-gray-600'}`}>{d.categorie}</span></div>))}
                </div>
              </ChartCard>

              {/* Documents Véhicules */}
              <ChartCard>
                <ChartTitle icon="bi-file-earmark-text-fill">Documents Véhicules</ChartTitle>
                <div className="flex-1 flex items-center justify-center relative">
                  <svg width="140" height="140" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#10b981" strokeWidth="32" strokeDasharray="343.27 439.82" strokeDashoffset={animateCharts?0:439.82} onMouseEnter={()=>setHoveredDocVehSegment('valide')} onMouseLeave={()=>setHoveredDocVehSegment(null)} className="cursor-pointer" style={{transition:'stroke-dashoffset 1s ease-out'}}/>
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#f59e0b" strokeWidth="32" strokeDasharray="65.97 439.82" strokeDashoffset={animateCharts?-343.27:-439.82} onMouseEnter={()=>setHoveredDocVehSegment('expire_bientot')} onMouseLeave={()=>setHoveredDocVehSegment(null)} className="cursor-pointer" style={{transition:'stroke-dashoffset 1s ease-out 0.2s'}}/>
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#ef4444" strokeWidth="32" strokeDasharray="30.79 439.82" strokeDashoffset={animateCharts?-409.24:-439.82} onMouseEnter={()=>setHoveredDocVehSegment('expire')} onMouseLeave={()=>setHoveredDocVehSegment(null)} className="cursor-pointer" style={{transition:'stroke-dashoffset 1s ease-out 0.4s'}}/>
                  </svg>
                  {hoveredDocVehSegment&&(<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-bold pointer-events-none z-10">
                    {documentsVehiculesData.find(d=>(hoveredDocVehSegment==='valide'&&d.label==='Assurance Valide')||(hoveredDocVehSegment==='expire_bientot'&&d.label==='Expire < 30j')||(hoveredDocVehSegment==='expire'&&d.label==='Expirés'))?.percentage??0}%
                  </div>)}
                </div>
                <div className="space-y-1">
                  {documentsVehiculesData.map((item,idx)=>(<div key={idx} className="flex items-center justify-between px-2 py-1 rounded transition-colors">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:item.color}}></div><span className={`text-xs ${darkMode?'text-gray-300':'text-gray-700'}`}>{item.label}</span></div>
                    <span className={`text-xs font-semibold ${darkMode?'text-gray-400':'text-gray-600'}`}>{item.percentage}%</span>
                  </div>))}
                </div>
              </ChartCard>
            </>
          )}
        </div>

        {/* ─── ROW 4 ─── */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {loading ? <><SkeletonChart /><SkeletonChart /><SkeletonChart /></> : (
            <>
              {/* Documents Chauffeurs */}
              <ChartCard>
                <ChartTitle icon="bi-person-badge-fill">Documents Chauffeurs</ChartTitle>
                <div className="flex-1 flex items-center justify-center relative">
                  <svg width="140" height="140" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#10b981" strokeWidth="32" strokeDasharray="378.24 439.82" strokeDashoffset={animateCharts?0:439.82} onMouseEnter={()=>setHoveredDocChaufSegment('valide')} onMouseLeave={()=>setHoveredDocChaufSegment(null)} className="cursor-pointer" style={{transition:'stroke-dashoffset 1s ease-out'}}/>
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#f59e0b" strokeWidth="32" strokeDasharray="48.38 439.82" strokeDashoffset={animateCharts?-378.24:-439.82} onMouseEnter={()=>setHoveredDocChaufSegment('expire_bientot')} onMouseLeave={()=>setHoveredDocChaufSegment(null)} className="cursor-pointer" style={{transition:'stroke-dashoffset 1s ease-out 0.2s'}}/>
                    <circle cx="100" cy="100" r="70" fill="none" stroke="#ef4444" strokeWidth="32" strokeDasharray="13.19 439.82" strokeDashoffset={animateCharts?-426.62:-439.82} onMouseEnter={()=>setHoveredDocChaufSegment('expire')} onMouseLeave={()=>setHoveredDocChaufSegment(null)} className="cursor-pointer" style={{transition:'stroke-dashoffset 1s ease-out 0.4s'}}/>
                  </svg>
                  {hoveredDocChaufSegment&&(<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-sm font-bold pointer-events-none z-10">
                    {documentsChauffeursData.find(d=>(hoveredDocChaufSegment==='valide'&&d.label==='Permis Valide')||(hoveredDocChaufSegment==='expire_bientot'&&d.label==='Expire < 30j')||(hoveredDocChaufSegment==='expire'&&d.label==='Expirés'))?.percentage??0}%
                  </div>)}
                </div>
                <div className="space-y-1">
                  {documentsChauffeursData.map((item,idx)=>(<div key={idx} className="flex items-center justify-between px-2 py-1 rounded transition-colors">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:item.color}}></div><span className={`text-xs ${darkMode?'text-gray-300':'text-gray-700'}`}>{item.label}</span></div>
                    <span className={`text-xs font-semibold ${darkMode?'text-gray-400':'text-gray-600'}`}>{item.percentage}%</span>
                  </div>))}
                </div>
              </ChartCard>

              {/* KPI Véhicules — résumé */}
              <ChartCard>
                <ChartTitle icon="bi-graph-up-arrow">KPI Véhicules</ChartTitle>
                {performancesData ? (
                  <div className="flex-1 flex flex-col justify-center gap-3">
                    {[
                      {label:'Missions terminées ce mois',value:performancesData.summary.total_missions,          icon:'bi-flag-fill',                color:'text-blue-500'},
                      {label:'Km parcourus',              value:`${(performancesData.summary.total_km/1000).toFixed(1)}k`,icon:'bi-speedometer2',    color:'text-purple-500'},
                      {label:'Accidents',                 value:performancesData.summary.total_accidents,          icon:'bi-shield-exclamation',      color:'text-red-500'},
                      {label:'Anomalies signalées',       value:performancesData.summary.total_anomalies,          icon:'bi-exclamation-triangle-fill',color:'text-yellow-500'},
                      {label:'Score moyen',               value:`${performancesData.summary.score_moyen}/100`,     icon:'bi-star-fill',               color:'text-green-500'},
                    ].map((kpi,i)=>(
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${darkMode?'bg-gray-800':'bg-gray-50'}`}>
                        <div className="flex items-center gap-2"><i className={`${kpi.icon} ${kpi.color}`}></i><span className={`text-xs ${darkMode?'text-gray-300':'text-gray-700'}`}>{kpi.label}</span></div>
                        <span className={`text-sm font-bold ${darkMode?'text-white':'text-gray-900'}`}>{kpi.value}</span>
                      </div>
                    ))}
                    <button
                      onClick={()=>{ setShowKpiModal(true); setKpiPeriode('1m'); setKpiSearch(''); setKpiPage(1); setKpiSelected(null); fetchKpiVehicules('1m','',1); }}
                      className="mt-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{background:`linear-gradient(to right,${theme.primary}22,${theme.primaryDark}22)`,color:theme.primary}}
                    >
                      <i className="bi bi-arrows-fullscreen text-xs"></i>
                      Voir le détail par véhicule
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className={`text-center ${darkMode?'text-gray-500':'text-gray-400'}`}>
                      <i className="bi bi-bar-chart text-4xl mb-2"></i><p className="text-sm">Aucune donnée disponible</p>
                    </div>
                  </div>
                )}
              </ChartCard>

              {/* Performance Chauffeurs */}
              <ChartCard>
                <ChartTitle icon="bi-speedometer">Performance Chauffeurs</ChartTitle>
                {performancesData?.classement?.length > 0 ? (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{maxHeight:'220px'}}>
                    {performancesData.classement.map((c,i)=>(
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${darkMode?'bg-gray-800':'bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold w-5 text-center ${i===0?'text-yellow-400':i===1?'text-gray-400':i===2?'text-orange-400':darkMode?'text-gray-500':'text-gray-400'}`}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${c.rang}`}</span>
                          <span className={`text-xs font-medium truncate max-w-[90px] ${darkMode?'text-gray-300':'text-gray-700'}`}>{c.chauffeur}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${darkMode?'text-white':'text-gray-900'}`}>{c.score??'—'}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${BADGE_COLORS[c.badge]??'bg-gray-100 text-gray-700'}`}>{c.badge}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className={`text-center ${darkMode?'text-gray-500':'text-gray-400'}`}><i className="bi bi-trophy text-4xl mb-2"></i><p className="text-sm">Aucune donnée disponible</p></div>
                  </div>
                )}
              </ChartCard>
            </>
          )}
        </div>

        {/* ─── BOTTOM ROW ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {loading ? <><SkeletonChart className="lg:col-span-2"/><SkeletonChart/></> : (
            <>
              {/* ── Missions du Jour ── */}
              <div className={`lg:col-span-2 ${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-bold ${darkMode?'text-white':'text-gray-900'} flex items-center gap-2`}>
                    <i className="bi bi-pin-map-fill text-blue-500"></i>Missions du Jour
                  </h3>
                  <span className={`text-sm px-3 py-1 rounded-full ${darkMode?'bg-gray-800 text-gray-400':'bg-gray-100 text-gray-600'}`}>{missions.length} missions</span>
                </div>
                <div className="space-y-3">
                  {missions.length===0 ? (
                    <p className={`text-sm text-center py-8 ${darkMode?'text-gray-500':'text-gray-400'}`}>Aucune mission planifiée aujourd'hui</p>
                  ) : (
                    missions.map((mission,idx)=>(
                      <div key={idx} className={`flex items-center justify-between p-4 rounded-lg ${darkMode?'bg-gray-800':'bg-gray-50'} transition-all cursor-pointer`}>
                        <div className="flex items-center gap-4">
                          <div className={`text-3xl ${darkMode?'text-gray-300':'text-gray-700'}`}><i className={mission.icon} style={{fontSize:'2rem'}}></i></div>
                          <div>
                            <p className={`font-semibold ${darkMode?'text-white':'text-gray-900'}`}>{mission.id}</p>
                            <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{mission.route}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <i className={`bi bi-clock ${darkMode?'text-gray-500':'text-gray-400'}`}></i>
                            <span className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{mission.time}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${mission.status==='En cours'?'bg-yellow-100 text-yellow-700':'bg-gray-200 text-gray-700'}`}>{mission.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── Alertes — mode clair/sombre corrigé ── */}
              <div className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm flex flex-col`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode?'text-white':'text-gray-900'}`}>
                    <i className="bi bi-exclamation-triangle-fill text-red-500"></i>Alertes
                  </h3>
                  <span className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {alerts.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto" style={{maxHeight:'360px'}}>
                  {alerts.length === 0 ? (
                    <p className={`text-sm text-center py-8 ${darkMode?'text-gray-500':'text-gray-400'}`}>Aucune alerte active</p>
                  ) : (
                    alerts.map((alert, idx) => {
                      const st = alertStyles(alert.type);
                      return (
                        <div key={idx} className={`p-3 rounded-xl border-l-4 ${st.border} ${st.bg} cursor-pointer transition-all hover:opacity-90`}>
                          <div className="flex items-start gap-3">
                            {/* Icône */}
                            <div className="flex-shrink-0 mt-0.5">
                              <i className={`${alert.icon} ${st.iconColor}`} style={{fontSize:'1.25rem'}}></i>
                            </div>

                            {/* Contenu */}
                            <div className="flex-1 min-w-0">
                              {/* Titre */}
                              <p className={`font-semibold text-sm leading-snug mb-0.5 ${st.title}`}>
                                {alert.title}
                              </p>
                              {/* Véhicule / Chauffeur */}
                              <p className={`text-xs font-medium truncate mb-1.5 ${st.vehicle}`}>
                                {alert.vehicle}
                              </p>
                              {/* Badge + date */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.badge}`}>
                                  {alert.days} {alert.status}
                                </span>
                                <span className={`text-xs ${st.date}`}>
                                  {alert.date}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* ── Bouton → page Notifications ── */}
                <button
                  onClick={() => navigate('/Admin/Configuration/Notifications')}
                  className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80 active:scale-95 ${
                    darkMode
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <i className="bi bi-bell-fill text-xs"></i>
                  Voir toutes les alertes
                  <i className="bi bi-chevron-right text-xs"></i>
                </button>
              </div>
            </>
          )}
        </div>

        <div className={`mt-8 py-6 border-t ${darkMode?'border-gray-800':'border-gray-200'}`}>
          <div className="flex items-center justify-center">
            <p className={`text-sm ${darkMode?'text-gray-500':'text-gray-600'}`}>© 2026 SGS Tous droits reservés - Version 1.0</p>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
          MODAL KPI VÉHICULES
      ════════════════════════════════════════════════════════ */}
      {showKpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{backgroundColor:'rgba(0,0,0,0.65)'}}
          onClick={(e)=>e.target===e.currentTarget&&setShowKpiModal(false)}>
          <div className={`relative flex flex-col w-full h-full max-w-[98vw] max-h-[96vh] rounded-2xl shadow-2xl overflow-hidden ${darkMode?'bg-gray-900':'bg-white'}`}>

            {/* ── En-tête ── */}
            <div className={`flex-none flex items-center justify-between px-6 py-4 border-b ${darkMode?'border-gray-700':'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
                  <i className="bi bi-graph-up-arrow text-white text-lg"></i>
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode?'text-white':'text-gray-900'}`}>KPI Véhicules</h2>
                  <p className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>
                    {kpiSelected ? `Véhicule sélectionné : ${kpiSelected}` : 'Performances détaillées — tous les véhicules'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {exportLoading && (
                  <span className={`text-xs flex items-center gap-1.5 ${darkMode?'text-gray-400':'text-gray-500'}`}>
                    <span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor:`${theme.primary} transparent transparent transparent`}}></span>
                    Export en cours…
                  </span>
                )}
                <ExportBtn type="excel" immat={null} label="Excel (tous)" />
                <ExportBtn type="pdf"   immat={null} label="PDF (tous)" />
                {kpiSelected && (<>
                  <ExportBtn type="excel" immat={kpiSelected} label={`Excel (${kpiSelected})`} />
                  <ExportBtn type="pdf"   immat={kpiSelected} label={`PDF (${kpiSelected})`}   />
                  <button onClick={()=>setKpiSelected(null)}
                    className={`text-xs px-2 py-1.5 rounded-lg border ${darkMode?'border-gray-600 text-gray-400 hover:bg-gray-700':'border-gray-300 text-gray-500 hover:bg-gray-100'}`}>
                    ✕ Désélectionner
                  </button>
                </>)}
                <button onClick={()=>setShowKpiModal(false)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${darkMode?'hover:bg-gray-700 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>
            </div>

            {/* ── Filtres ── */}
            <div className={`flex-none flex flex-wrap items-center gap-3 px-6 py-3 border-b ${darkMode?'border-gray-700 bg-gray-900':'border-gray-100 bg-gray-50'}`}>
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode?'text-gray-500':'text-gray-400'}`}></i>
                <input type="text" placeholder="Immatriculation, marque, direction…" value={kpiSearch}
                  onChange={(e)=>{ setKpiSearch(e.target.value); setKpiPage(1); clearTimeout(window._kpiSearchTimer); window._kpiSearchTimer=setTimeout(()=>fetchKpiVehicules(kpiPeriode,e.target.value,1),350); }}
                  className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 ${darkMode?'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500':'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-400'}`}/>
                {kpiSearch&&(<button onClick={()=>{setKpiSearch('');setKpiPage(1);fetchKpiVehicules(kpiPeriode,'',1);}} className="absolute right-3 top-1/2 -translate-y-1/2"><i className={`bi bi-x text-sm ${darkMode?'text-gray-400':'text-gray-500'}`}></i></button>)}
              </div>

              <div className={`flex rounded-lg overflow-hidden border ${darkMode?'border-gray-700':'border-gray-200'}`}>
                {[['1m','Ce mois'],['3m','3 mois'],['6m','6 mois'],['1an','1 an']].map(([key,label])=>(
                  <button key={key} onClick={()=>{setKpiPeriode(key);setKpiPage(1);fetchKpiVehicules(key,kpiSearch,1);}}
                    className={`px-4 py-2 text-sm font-medium transition-all ${kpiPeriode===key?'text-white':darkMode?'bg-gray-800 text-gray-400 hover:bg-gray-700':'bg-white text-gray-600 hover:bg-gray-50'}`}
                    style={kpiPeriode===key?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>
                    {label}
                  </button>
                ))}
              </div>

              {kpiPagination&&(<span className={`text-xs ml-auto ${darkMode?'text-gray-500':'text-gray-400'}`}>{kpiPagination.total} véhicule{kpiPagination.total>1?'s':''}</span>)}
            </div>

            {/* ── Totaux globaux ── */}
            {kpiTotaux&&(
              <div className={`flex-none grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 px-6 py-3 border-b ${darkMode?'border-gray-700':'border-gray-100'}`}>
                {[
                  {icon:'bi-flag-fill',        label:'Total missions',value:Number(kpiTotaux.total_missions).toLocaleString('fr-FR'),color:'text-blue-500',  bg:darkMode?'bg-blue-900':'bg-blue-50'},
                  {icon:'bi-speedometer2',      label:'Km parcourus',  value:Number(kpiTotaux.total_km).toLocaleString('fr-FR')+' km',color:'text-purple-500',bg:darkMode?'bg-purple-900':'bg-purple-50'},
                  {icon:'bi-tools',             label:'Interventions', value:Number(kpiTotaux.total_interventions).toLocaleString('fr-FR'),color:'text-orange-500',bg:darkMode?'bg-orange-900':'bg-orange-50'},
                  {icon:'bi-currency-dollar',   label:'Coût total',    value:Number(kpiTotaux.cout_total)>=1_000_000?(Number(kpiTotaux.cout_total)/1_000_000).toFixed(1)+'M CFA':Number(kpiTotaux.cout_total).toLocaleString('fr-FR')+' CFA',color:'text-green-500',bg:darkMode?'bg-green-900':'bg-green-50'},
                  {icon:'bi-shield-exclamation',label:'Accidents',     value:Number(kpiTotaux.nb_accidents).toLocaleString('fr-FR'),color:'text-red-500',    bg:darkMode?'bg-red-900':'bg-red-50'},
                ].map((t,i)=>(
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${t.bg}`}>
                    <i className={`${t.icon} text-lg ${t.color}`}></i>
                    <div><p className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{t.label}</p><p className={`text-sm font-bold ${darkMode?'text-white':'text-gray-900'}`}>{t.value}</p></div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Légende sélection ── */}
            {!kpiLoading && kpiData.length > 0 && (
              <div className={`flex-none px-6 py-2 text-xs ${darkMode?'text-gray-500':'text-gray-400'} border-b ${darkMode?'border-gray-800':'border-gray-100'}`}>
                <i className="bi bi-hand-index-thumb mr-1"></i>
                Cliquez sur une ligne pour la sélectionner et l'exporter individuellement.
                {kpiSelected && <span className="ml-2 font-semibold" style={{color:theme.primary}}>{kpiSelected} sélectionné</span>}
              </div>
            )}

            {/* ── Tableau scrollable ── */}
            <div className="flex-1 overflow-auto">
              {kpiLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{borderColor:`${theme.primary} transparent transparent transparent`}}></div>
                    <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-500'}`}>Chargement…</p>
                  </div>
                </div>
              ) : kpiData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <i className={`bi bi-inbox text-4xl ${darkMode?'text-gray-600':'text-gray-300'}`}></i>
                  <p className={`text-sm ${darkMode?'text-gray-500':'text-gray-400'}`}>Aucun résultat pour cette période</p>
                </div>
              ) : (
                <table className="w-full text-sm min-w-[900px]">
                  <thead className={`sticky top-0 z-10 ${darkMode?'bg-gray-800':'bg-gray-50'}`}>
                    <tr>
                      {[
                        {label:'',              align:'center'},
                        {label:'Immatriculation',align:'left'},
                        {label:'Marque / Modèle',align:'left'},
                        {label:'Direction',      align:'left'},
                        {label:'Statut',         align:'center'},
                        {label:'Dispo %',        align:'center'},
                        {label:'Missions',       align:'right'},
                        {label:'Km',             align:'right'},
                        {label:'Interv.',        align:'right'},
                        {label:'Durée interv.',  align:'right'},
                        {label:'Coût total',     align:'right'},
                        {label:'CFA/km',         align:'right'},
                        {label:'Anomalies',      align:'right'},
                        {label:'Accidents',      align:'right'},
                        {label:'Export',         align:'center'},
                      ].map((col,ci)=>(
                        <th key={ci} className={`px-3 py-3 text-${col.align} text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${darkMode?'text-gray-400 border-b border-gray-700':'text-gray-500 border-b border-gray-200'}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kpiData.map((row)=>{
                      const statutMap={
                        disponible:    {label:'Disponible', cls:darkMode?'bg-green-900 text-green-300' :'bg-green-100 text-green-700'},
                        en_mission:    {label:'En mission', cls:darkMode?'bg-blue-900 text-blue-300'   :'bg-blue-100 text-blue-700'},
                        en_maintenance:{label:'Maintenance',cls:darkMode?'bg-orange-900 text-orange-300':'bg-orange-100 text-orange-700'},
                        immobilise:    {label:'Immobilisé', cls:darkMode?'bg-red-900 text-red-300'     :'bg-red-100 text-red-700'},
                      };
                      const s=statutMap[row.statut]??{label:row.statut,cls:'bg-gray-100 text-gray-600'};
                      const tc=row.taux_disponibilite>=80?'text-green-500':row.taux_disponibilite>=50?'text-yellow-500':'text-red-500';
                      const isSelected=kpiSelected===row.immatriculation;
                      return(
                        <tr key={row.immatriculation}
                          onClick={()=>setKpiSelected(isSelected?null:row.immatriculation)}
                          className={`border-b cursor-pointer transition-colors ${
                            isSelected
                              ? darkMode?'bg-blue-950 border-blue-800':'bg-blue-50 border-blue-200'
                              : darkMode?'border-gray-700 hover:bg-gray-800':'border-gray-100 hover:bg-gray-50'
                          }`}>
                          <td className="px-3 py-2.5 text-center">
                            <div className={`w-4 h-4 rounded border-2 mx-auto flex items-center justify-center transition-all ${isSelected?'border-blue-500 bg-blue-500':'border-gray-400'}`}>
                              {isSelected&&<i className="bi bi-check text-white" style={{fontSize:'10px'}}></i>}
                            </div>
                          </td>
                          <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${darkMode?'text-white':'text-gray-900'}`}>{row.immatriculation}</td>
                          <td className={`px-3 py-2.5 text-xs ${darkMode?'text-gray-300':'text-gray-700'}`}>
                            <div className="font-medium">{row.marque}</div>
                            <div className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>{row.modele}</div>
                          </td>
                          <td className={`px-3 py-2.5 text-xs ${darkMode?'text-gray-400':'text-gray-600'}`}>{row.direction}</td>
                          <td className="px-3 py-2.5 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span></td>
                          <td className={`px-3 py-2.5 text-center text-sm font-bold ${tc}`}>{row.taux_disponibilite}%</td>
                          <td className={`px-3 py-2.5 text-right text-xs font-medium ${darkMode?'text-blue-400':'text-blue-600'}`}>{Number(row.total_missions).toLocaleString('fr-FR')}</td>
                          <td className={`px-3 py-2.5 text-right text-xs ${darkMode?'text-gray-300':'text-gray-700'}`}>{Number(row.total_km).toLocaleString('fr-FR')}</td>
                          <td className={`px-3 py-2.5 text-right text-xs ${darkMode?'text-orange-400':'text-orange-600'}`}>{Number(row.total_interventions).toLocaleString('fr-FR')}</td>
                          <td className={`px-3 py-2.5 text-right text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{row.total_duree_interventions_h}h</td>
                          <td className={`px-3 py-2.5 text-right text-xs font-medium ${darkMode?'text-purple-400':'text-purple-600'}`}>
                            {Number(row.cout_total)>=1_000_000?(Number(row.cout_total)/1_000_000).toFixed(1)+'M':Number(row.cout_total).toLocaleString('fr-FR')} CFA
                          </td>
                          <td className={`px-3 py-2.5 text-right text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{row.cout_par_km!=null?Number(row.cout_par_km).toLocaleString('fr-FR'):'—'}</td>
                          <td className={`px-3 py-2.5 text-right text-xs font-medium ${row.nb_anomalies>0?'text-yellow-500':darkMode?'text-gray-500':'text-gray-400'}`}>{row.nb_anomalies}</td>
                          <td className={`px-3 py-2.5 text-right text-xs font-bold ${row.nb_accidents>0?'text-red-500':darkMode?'text-gray-500':'text-gray-400'}`}>{row.nb_accidents}</td>
                          <td className="px-2 py-2.5 text-center" onClick={e=>e.stopPropagation()}>
                            <div className="flex items-center gap-1 justify-center">
                              <button disabled={exportLoading} onClick={()=>handleExportExcel(row.immatriculation)}
                                title={`Excel — ${row.immatriculation}`}
                                className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all disabled:opacity-40 ${darkMode?'bg-green-900 text-green-300 hover:bg-green-800':'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                                <i className="bi bi-file-earmark-excel"></i>
                              </button>
                              <button disabled={exportLoading} onClick={()=>handleExportPdf(row.immatriculation)}
                                title={`PDF — ${row.immatriculation}`}
                                className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all disabled:opacity-40 ${darkMode?'bg-red-900 text-red-300 hover:bg-red-800':'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                                <i className="bi bi-file-earmark-pdf"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Pagination ── */}
            {kpiPagination&&kpiPagination.last_page>1&&(
              <div className={`flex-none flex items-center justify-between px-6 py-3 border-t ${darkMode?'border-gray-700':'border-gray-200'}`}>
                <span className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>Page {kpiPagination.current_page} / {kpiPagination.last_page}</span>
                <div className="flex items-center gap-1">
                  <button onClick={()=>{const p=Math.max(1,kpiPage-1);setKpiPage(p);fetchKpiVehicules(kpiPeriode,kpiSearch,p);}} disabled={kpiPage<=1}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30 ${darkMode?'hover:bg-gray-700 text-gray-300':'hover:bg-gray-100 text-gray-600'}`}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {Array.from({length:Math.min(7,kpiPagination.last_page)},(_,i)=>{
                    const start=Math.max(1,Math.min(kpiPage-3,kpiPagination.last_page-6)),p=start+i;
                    return(<button key={p} onClick={()=>{setKpiPage(p);fetchKpiVehicules(kpiPeriode,kpiSearch,p);}}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${p===kpiPage?'text-white':darkMode?'text-gray-400 hover:bg-gray-700':'text-gray-600 hover:bg-gray-100'}`}
                      style={p===kpiPage?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>{p}</button>);
                  })}
                  <button onClick={()=>{const p=Math.min(kpiPagination.last_page,kpiPage+1);setKpiPage(p);fetchKpiVehicules(kpiPeriode,kpiSearch,p);}} disabled={kpiPage>=kpiPagination.last_page}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm disabled:opacity-30 ${darkMode?'hover:bg-gray-700 text-gray-300':'hover:bg-gray-100 text-gray-600'}`}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;