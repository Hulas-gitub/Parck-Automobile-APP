import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Swal from 'sweetalert2';

// ============================================================================
// CONFIGURATION — URL DE BASE DU BACKEND LARAVEL
// ============================================================================
const LARAVEL_BASE_URL = import.meta.env.VITE_LARAVEL_URL;

const getStorageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/storage')) return `${LARAVEL_BASE_URL}${path}`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${LARAVEL_BASE_URL}/storage/${cleanPath}`;
};

// ── API ──
import {
  getVehicules,
  getVehicule,
  createVehicule,
  updateVehicule,
  deleteVehicule,
  updateStatutVehicule,
  getDocumentsVehicule,
  createDocumentVehicule,
  updateDocumentVehicule,
  deleteDocumentVehicule,
  openDocumentVehicule,
  getMaintenancesVehicule,
  createMaintenanceVehicule,
  getMissionsVehicule,
  getStatsVehicule,
  getReferences,
  createCategorie,
  deleteCategorie,
  createMarque,
  deleteMarque,
  createModele,
  deleteModele,
  createAnnee,
  deleteAnnee,
} from '../../api/Admin-Axios/Vehicules-axios';

// ============================================================================
// SWEETALERT2 — HELPERS THÉMÉS
// ============================================================================
const createSwal = (darkMode, theme) => {
  return Swal.mixin({
    customClass: {
      popup:         darkMode ? 'swal-dark-popup'    : 'swal-light-popup',
      title:         darkMode ? 'swal-dark-title'    : 'swal-light-title',
      htmlContainer: darkMode ? 'swal-dark-html'     : 'swal-light-html',
      confirmButton: 'swal-confirm-btn',
      cancelButton:  'swal-cancel-btn',
      denyButton:    'swal-deny-btn',
    },
    background:          darkMode ? '#111827' : '#ffffff',
    color:               darkMode ? '#f9fafb' : '#111827',
    confirmButtonColor:  theme.primary,
    cancelButtonColor:   darkMode ? '#374151' : '#e5e7eb',
    buttonsStyling: false,
  });
};

const buildSwalStyles = (theme) => `
  .swal-dark-popup  { background: #111827 !important; border: 1px solid #374151 !important; border-radius: 16px !important; box-shadow: 0 25px 50px rgba(0,0,0,0.6) !important; }
  .swal-light-popup { background: #ffffff !important; border: 1px solid #e5e7eb !important; border-radius: 16px !important; box-shadow: 0 25px 50px rgba(0,0,0,0.15) !important; }
  .swal-dark-title  { color: #f9fafb !important; font-weight: 800 !important; font-size: 18px !important; }
  .swal-light-title { color: #111827 !important; font-weight: 800 !important; font-size: 18px !important; }
  .swal-dark-html   { color: #9ca3af !important; font-size: 15px !important; }
  .swal-light-html  { color: #6b7280 !important; font-size: 15px !important; }
  .swal-confirm-btn {
    background: linear-gradient(to right, ${theme?.primary || '#6366f1'}, ${theme?.primaryDark || '#4f46e5'}) !important;
    color: #fff !important; border: none !important; border-radius: 10px !important;
    font-weight: 700 !important; padding: 10px 24px !important; font-size: 14px !important;
    cursor: pointer !important; transition: opacity 0.2s !important;
  }
  .swal-confirm-btn:hover { opacity: 0.9 !important; }
  .swal-confirm-btn.swal-danger { background: linear-gradient(to right, #ef4444, #dc2626) !important; }
  .swal-cancel-btn {
    background: transparent !important; color: #9ca3af !important;
    border: 1px solid #374151 !important; border-radius: 10px !important;
    font-weight: 700 !important; padding: 10px 24px !important; font-size: 14px !important;
    cursor: pointer !important; transition: background 0.2s !important;
  }
  .swal-cancel-btn:hover { background: rgba(156,163,175,0.1) !important; }
  .swal2-icon.swal2-warning { border-color: #f59e0b !important; color: #f59e0b !important; }
  .swal2-icon.swal2-error   { border-color: #ef4444 !important; color: #ef4444 !important; }
  .swal2-icon.swal2-success .swal2-success-ring { border-color: rgba(16,185,129,0.3) !important; }
  .swal2-icon.swal2-success [class^=swal2-success-line] { background: #10b981 !important; }
  .swal2-actions { gap: 10px !important; margin-top: 20px !important; }
`;

// ============================================================================
// HELPERS SWAL CENTRALISÉS
// ============================================================================
const showSuccess = (darkMode, theme, title, text) => {
  createSwal(darkMode, theme).fire({
    icon: 'success', title, text,
    showConfirmButton: false, showCancelButton: false,
    timer: 1200, timerProgressBar: false,
    allowOutsideClick: false, allowEscapeKey: false,
  }).then(() => { window.location.reload(); });
};

const showError = (darkMode, theme, title, text, icon = 'error') => {
  createSwal(darkMode, theme).fire({
    icon, title, text,
    showConfirmButton: true, confirmButtonText: "D'ACCORD", showCancelButton: false,
    customClass: {
      popup: darkMode ? 'swal-dark-popup' : 'swal-light-popup',
      title: darkMode ? 'swal-dark-title' : 'swal-light-title',
      htmlContainer: darkMode ? 'swal-dark-html' : 'swal-light-html',
      confirmButton: 'swal-confirm-btn',
    },
    buttonsStyling: false,
  });
};

const showConfirm = (darkMode, theme, { title, html, confirmText = 'Confirmer', isDanger = false }) => {
  return createSwal(darkMode, theme).fire({
    icon: 'warning', title, html,
    showConfirmButton: true, confirmButtonText: confirmText,
    showCancelButton: true, cancelButtonText: 'Annuler',
    customClass: {
      popup: darkMode ? 'swal-dark-popup' : 'swal-light-popup',
      title: darkMode ? 'swal-dark-title' : 'swal-light-title',
      htmlContainer: darkMode ? 'swal-dark-html' : 'swal-light-html',
      confirmButton: isDanger ? 'swal-confirm-btn swal-danger' : 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn',
    },
    buttonsStyling: false,
  });
};

// ============================================================================
// LIGHTBOX
// ============================================================================
const ImageLightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="relative max-w-5xl max-h-[90vh] w-full mx-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()} style={{ animation: 'lightboxIn 0.25s ease-out' }}>
        <img src={src} alt={alt} className="rounded-2xl shadow-2xl object-contain" style={{ maxHeight: '85vh', maxWidth: '100%', border: '2px solid rgba(255,255,255,0.12)' }} />
        <button onClick={onClose} className="absolute -top-4 -right-4 w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-2xl transition-all hover:scale-110" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} title="Fermer (Échap)"><i className="bi bi-x-lg"></i></button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm font-bold" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>{alt} · Cliquer en dehors pour fermer</div>
      </div>
      <style>{`@keyframes lightboxIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>,
    document.body
  );
};

// ============================================================================
// COMPOSANT IMAGE STABLE
// ============================================================================
const StableImage = ({ src, alt, className, style, darkMode, clickable = false }) => {
  const [imgLoaded, setImgLoaded]       = useState(false);
  const [imgError, setImgError]         = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const mountedRef                      = useRef(true);
  const previousSrcRef                  = useRef(src);

  const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='${darkMode ? '%23374151' : '%23e5e7eb'}' width='100' height='100'/%3E%3Cpath fill='${darkMode ? '%236b7280' : '%239ca3af'}' d='M30 65h40L55 45l-10 15-7.5-10z'/%3E%3Ccircle fill='${darkMode ? '%236b7280' : '%239ca3af'}' cx='35' cy='35' r='8'/%3E%3C/svg%3E`;

  useEffect(() => {
    if (previousSrcRef.current !== src) { previousSrcRef.current = src; setImgLoaded(false); setImgError(false); }
  }, [src]);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const fullSrc    = src ? getStorageUrl(src) : null;
  const displaySrc = imgError || !fullSrc ? placeholderSvg : fullSrc;
  const canExpand  = clickable && !imgError && fullSrc;

  return (
    <>
      <div className={className} style={{ ...style, position: 'relative', overflow: 'hidden', backgroundColor: darkMode ? '#374151' : '#e5e7eb', cursor: canExpand ? 'zoom-in' : 'default' }}
        onClick={canExpand ? () => setShowLightbox(true) : undefined} title={canExpand ? 'Cliquer pour agrandir' : undefined}>
        {!imgLoaded && <div className="absolute inset-0 flex items-center justify-center"><svg className="w-5 h-5 animate-pulse" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }} fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
        {canExpand && imgLoaded && <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100 z-10"><div className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-lg"><i className="bi bi-zoom-in text-gray-800 text-base"></i></div></div>}
        <img src={displaySrc} alt={alt} onLoad={() => { if (mountedRef.current) setImgLoaded(true); }} onError={() => { if (mountedRef.current) { setImgError(true); setImgLoaded(true); } }} className="w-full h-full object-cover" style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }} loading="lazy" />
      </div>
      {showLightbox && <ImageLightbox src={displaySrc} alt={alt || 'Véhicule'} onClose={() => setShowLightbox(false)} />}
    </>
  );
};

// ============================================================================
// UTILITAIRES D'EXPORT
// ============================================================================
const exportToExcel = (data, filename, headers) => {
  let csv = '\uFEFF';
  csv += headers.join(';') + '\n';
  data.forEach(row => { csv += row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';') + '\n'; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const exportToPDF = (title, headers, data, orientation = 'landscape') => {
  const win = window.open('', '_blank');
  if (!win) return;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    @page { size: ${orientation}; margin: 20mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 20px; }
    h1 { color: #1a1a2e; font-size: 22px; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; font-weight: 800; }
    .meta { color: #64748b; font-size: 12px; margin-bottom: 16px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #1e3a5f; color: #fff; padding: 10px 12px; text-align: left; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
    tr:nth-child(odd) td { background: #f0f4ff; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 600; }
  </style></head><body>
  <h1>${title}</h1>
  <div class="meta">Export le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
  <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${data.map(row => `<tr>${row.map(cell => `<td>${cell ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="footer">SGS - Système de Gestion des Véhicules - ${new Date().getFullYear()}</div>
  <script>window.onload=function(){window.print();}<\/script></body></html>`;
  win.document.write(html);
  win.document.close();
};

// ============================================================================
// HORIZONTAL BAR CHART
// ============================================================================
const HorizontalBarChart = ({ data, colors, darkMode, title }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [hovered, setHovered] = useState(null);

  const exportCSV = () => {
    let csv = '\uFEFF' + 'Element;Valeur\n';
    data.forEach(d => { csv += `"${d.name}";"${d.value}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportPDF = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = data.map(d => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;">${d.name}</td><td style="padding:8px 12px;text-align:right;font-weight:700;">${d.value}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;}h1{font-size:20px;border-bottom:3px solid #6366f1;padding-bottom:10px;font-weight:800;}table{width:100%;border-collapse:collapse;margin-top:20px;}th{background:#1e3a5f;color:#fff;padding:10px 12px;text-align:left;font-weight:800;}</style></head>
    <body><h1>${title}</h1><table><thead><tr><th>Element</th><th style="text-align:right;">Valeur</th></tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload=function(){window.print();}<\/script></body></html>`);
    win.document.close();
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-3">
        <button onClick={exportCSV} className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} title="Exporter en Excel (CSV)"><i className="bi bi-file-earmark-spreadsheet text-emerald-500"></i></button>
        <button onClick={exportPDF} className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} title="Exporter en PDF"><i className="bi bi-file-earmark-pdf text-red-500"></i></button>
      </div>
      <div className="space-y-2.5">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          const color = colors[i % colors.length];
          const isHov = hovered === i;
          return (
            <div key={i} className="flex items-center gap-3 cursor-default" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ minWidth: '110px', background: `${color}22`, color, border: `1px solid ${color}44`, opacity: isHov ? 1 : 0.85, transition: 'opacity 0.2s' }}>{d.name && d.name.length > 13 ? d.name.slice(0, 13) + '..' : (d.name || '—')}</div>
              <div className={`flex-1 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, filter: isHov ? 'brightness(1.2)' : 'none', transition: 'width 0.7s ease-out, filter 0.2s' }} /></div>
              <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: darkMode ? '#d1d5db' : '#374151' }}>{d.value}</span>
              <span className={`text-xs font-semibold w-10 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// VEHICLE EXPORT DROPDOWN
// ============================================================================
const VehicleExportDropdown = ({ fetchAllVehicles, darkMode, theme }) => {
  const [open, setOpen]           = useState(false);
  const [exporting, setExporting] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ← ville ajouté dans les headers et dans vToRow
  const vHeaders = ['Immatriculation','N° Chassis','Marque','Modele','Categorie','Annee','Ville','Kilometrage','Statut','Direction','Carburant','Nb Places','Conso Moy (L/100)','Km Proch. Vidange','Km Proch. Révision','Date Achat','Coût Acquisition (CFA)','Valeur Résiduelle (CFA)'];
  const vToRow   = (v) => [v.immatriculation, v.numero_chassis||'-', v.marque, v.modele, v.categorie, v.annee, v.ville||'-', v.kilometrage, v.statut, v.direction, v.carburant, v.nb_places||'-', v.consommation_moyenne||'-', v.km_prochaine_vidange||'-', v.km_prochaine_revision||'-', v.dateAchat||'-', v.cout_acquisition ? v.cout_acquisition.toLocaleString() : '-', v.valeur_residuelle ? v.valeur_residuelle.toLocaleString() : '-'];

  const exportAll = async (format) => {
    setExporting(true);
    try {
      const allVehicles = await fetchAllVehicles();
      const rows = allVehicles.map(vToRow);
      if (format === 'excel') exportToExcel(rows, 'Vehicules_Tous', vHeaders);
      else exportToPDF('Liste Complète des Véhicules', vHeaders, rows);
    } catch (err) { console.error('Erreur export:', err); }
    finally { setExporting(false); setOpen(false); }
  };

  const exportByGroup = async (groupKey, format) => {
    setExporting(true);
    try {
      const allVehicles = await fetchAllVehicles();
      const groups = {};
      allVehicles.forEach(v => { const key = v[groupKey] || 'Inconnu'; if (!groups[key]) groups[key] = []; groups[key].push(v); });
      const label = { marque: 'Marque', categorie: 'Categorie', modele: 'Modele', statut: 'Statut', ville: 'Ville' }[groupKey]; // ← ville ajouté
      Object.entries(groups).forEach(([name, list]) => {
        const rows = list.map(vToRow);
        if (format === 'excel') exportToExcel(rows, `Vehicules_${label}_${name}`, vHeaders);
        else exportToPDF(`Véhicules - ${label}: ${name}`, vHeaders, rows);
      });
    } catch (err) { console.error('Erreur export:', err); }
    finally { setExporting(false); setOpen(false); }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} disabled={exporting} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {exporting ? <i className="bi bi-hourglass-split animate-spin"></i> : <i className="bi bi-download"></i>} {exporting ? 'Export...' : 'Exporter'}
      </button>
      {open && (
        <div className={`absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} py-2 min-w-[380px]`}>
          <p className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tous les véhicules (toutes pages)</p>
          <button onClick={() => exportAll('excel')} disabled={exporting} className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}><i className="bi bi-file-earmark-spreadsheet text-green-500"></i> Exporter tout en Excel (CSV)</button>
          <button onClick={() => exportAll('pdf')} disabled={exporting} className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}><i className="bi bi-file-earmark-pdf text-red-500"></i> Exporter tout en PDF</button>
          {/* ← ville ajouté comme groupe d'export */}
          {[{ key: 'marque', label: 'Par Marque' }, { key: 'categorie', label: 'Par Catégorie' }, { key: 'modele', label: 'Par Modèle' }, { key: 'statut', label: 'Par Statut' }, { key: 'ville', label: 'Par Ville' }].map(({ key, label }) => (
            <React.Fragment key={key}>
              <div className={`my-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
              <p className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label} (tous)</p>
              <button onClick={() => exportByGroup(key, 'excel')} disabled={exporting} className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}><i className="bi bi-file-earmark-spreadsheet text-green-500"></i> {label} - Excel</button>
              <button onClick={() => exportByGroup(key, 'pdf')} disabled={exporting} className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}><i className="bi bi-file-earmark-pdf text-red-500"></i> {label} - PDF</button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TABLE EXPORT BUTTON
// ============================================================================
const TableExportButton = ({ fetchAllVehicles, darkMode }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const allVehicles = await fetchAllVehicles();
      // ← ville ajouté dans l'export tableau
      const headers = ['Immatriculation','N° Chassis','Marque','Modele','Categorie','Annee','Ville','Kilometrage','Statut','Direction'];
      const rows = allVehicles.map(v => [v.immatriculation, v.numero_chassis||'-', v.marque, v.modele, v.categorie, v.annee, v.ville||'-', v.kilometrage, v.statut, v.direction]);
      exportToExcel(rows, 'Tableau_Vehicules_Tous', headers);
    } catch (err) { console.error('Erreur export:', err); }
    finally { setExporting(false); }
  };

  return (
    <button onClick={handleExport} disabled={exporting} className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-700 hover:bg-green-100'} ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`} title="Exporter tous les véhicules en Excel">
      {exporting ? <i className="bi bi-hourglass-split animate-spin"></i> : <i className="bi bi-file-earmark-spreadsheet"></i>} {exporting ? 'Export...' : 'Excel (tout)'}
    </button>
  );
};

// ============================================================================
// SKELETON LOADER
// ============================================================================
const SkeletonRow = ({ darkMode }) => (
  <tr>{Array.from({ length: 7 }).map((_, i) => (<td key={i} className="px-5 py-4"><div className={`h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div></td>))}</tr>
);

// ============================================================================
// MODAL — AJOUTER UN DOCUMENT
// ============================================================================
const ModalAddDocument = ({ darkMode, theme, immatriculation, onClose, onSuccess }) => {
  const [formDoc, setFormDoc] = useState({ type_document: '', nom_document: '', compagnie_assurance: '', numero_contrat: '', type_couverture: '', montant_prime: '', date_emission: '', date_expiration: '', notes: '', fichier: null });
  const [loading, setLoading]   = useState(false);
  const [fileName, setFileName] = useState('');
  const typesDocument = ['Carte grise', 'Assurance', 'Visite technique', 'Instecteur','Autre'];

  const handleFile = (e) => { const file = e.target.files[0]; if (file) { setFormDoc(prev => ({ ...prev, fichier: file })); setFileName(file.name); } };

  const handleSubmit = async () => {
    if (!formDoc.type_document || !formDoc.fichier) { showError(darkMode, theme, 'Champs requis', 'Veuillez sélectionner un type de document et un fichier.', 'warning'); return; }
    setLoading(true);
    try { await createDocumentVehicule(immatriculation, formDoc); onClose(); onSuccess(); }
    catch (err) { showError(darkMode, theme, 'Erreur', err.response?.data?.message || "Erreur lors de l'ajout du document."); }
    finally { setLoading(false); }
  };

  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`;
  const labelCls = `block text-sm font-bold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden`}>
        <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}><i className="bi bi-file-earmark-plus mr-2 text-blue-400"></i>Ajouter un document</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div><label className={labelCls}>Type de document *</label><select value={formDoc.type_document} onChange={e => setFormDoc(prev => ({ ...prev, type_document: e.target.value }))} className={inputCls}><option value="">Sélectionner un type</option>{typesDocument.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className={labelCls}>Nom du document</label><input type="text" value={formDoc.nom_document} onChange={e => setFormDoc(prev => ({ ...prev, nom_document: e.target.value }))} placeholder="Ex : Assurance 2025 - Véhicule AB-1234" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Date d'émission</label><input type="date" value={formDoc.date_emission} onChange={e => setFormDoc(prev => ({ ...prev, date_emission: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Date d'expiration</label><input type="date" value={formDoc.date_expiration} onChange={e => setFormDoc(prev => ({ ...prev, date_expiration: e.target.value }))} className={inputCls} /></div>
          </div>
          {formDoc.type_document === 'Assurance' && (<><div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Compagnie assurance</label><input type="text" value={formDoc.compagnie_assurance} onChange={e => setFormDoc(prev => ({ ...prev, compagnie_assurance: e.target.value }))} className={inputCls} /></div><div><label className={labelCls}>N° contrat</label><input type="text" value={formDoc.numero_contrat} onChange={e => setFormDoc(prev => ({ ...prev, numero_contrat: e.target.value }))} className={inputCls} /></div></div><div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Type de couverture</label><input type="text" value={formDoc.type_couverture} onChange={e => setFormDoc(prev => ({ ...prev, type_couverture: e.target.value }))} className={inputCls} /></div><div><label className={labelCls}>Montant prime (CFA)</label><input type="number" value={formDoc.montant_prime} onChange={e => setFormDoc(prev => ({ ...prev, montant_prime: e.target.value }))} className={inputCls} /></div></div></>)}
          <div><label className={labelCls}>Fichier *</label><label className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${darkMode ? 'border-gray-600 hover:border-blue-500 bg-gray-800' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}><i className={`bi bi-cloud-upload text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i><div><p className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fileName || 'Cliquer pour sélectionner un fichier'}</p><p className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>PDF, Word, Excel, Images — max 10 Mo</p></div><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" onChange={handleFile} className="hidden" /></label></div>
        </div>
        <div className="p-5 border-t flex items-center justify-end gap-3" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <button onClick={onClose} className={`px-5 py-2.5 rounded-lg border text-sm font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} transition-colors`}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
            {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Envoi...</> : <><i className="bi bi-cloud-upload"></i>Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL — MODIFIER UN DOCUMENT
// ============================================================================
const ModalEditDocument = ({ darkMode, theme, immatriculation, document: doc, onClose, onSuccess }) => {
  const [formDoc, setFormDoc] = useState({ type_document: doc.type_document||'', nom_document: doc.nom_document||'', compagnie_assurance: doc.compagnie_assurance||'', numero_contrat: doc.numero_contrat||'', type_couverture: doc.type_couverture||'', montant_prime: doc.montant_prime||'', date_emission: doc.date_emission ? doc.date_emission.slice(0,10) : '', date_expiration: doc.date_expiration ? doc.date_expiration.slice(0,10) : '', notes: doc.notes||'', fichier: null });
  const [loading, setLoading]   = useState(false);
  const [fileName, setFileName] = useState('');
  const typesDocument = ['Carte grise', 'Assurance', 'Visite technique', 'Instecteur','Autre'];

  const handleFile = (e) => { const file = e.target.files[0]; if (file) { setFormDoc(prev => ({ ...prev, fichier: file })); setFileName(file.name); } };

  const handleSubmit = async () => {
    if (!formDoc.type_document) { showError(darkMode, theme, 'Champ requis', 'Veuillez sélectionner un type de document.', 'warning'); return; }
    setLoading(true);
    try { await updateDocumentVehicule(immatriculation, doc.id, formDoc); onClose(); onSuccess(); }
    catch (err) { showError(darkMode, theme, 'Erreur', err.response?.data?.message || 'Erreur lors de la modification du document.'); }
    finally { setLoading(false); }
  };

  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`;
  const labelCls = `block text-sm font-bold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden`}>
        <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}><i className="bi bi-pencil-square mr-2 text-amber-400"></i>Modifier le document</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div><label className={labelCls}>Type de document *</label><select value={formDoc.type_document} onChange={e => setFormDoc(prev => ({ ...prev, type_document: e.target.value }))} className={inputCls}><option value="">Sélectionner un type</option>{typesDocument.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className={labelCls}>Nom du document</label><input type="text" value={formDoc.nom_document} onChange={e => setFormDoc(prev => ({ ...prev, nom_document: e.target.value }))} placeholder="Ex : Assurance 2025 - Véhicule AB-1234" className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Date d'émission</label><input type="date" value={formDoc.date_emission} onChange={e => setFormDoc(prev => ({ ...prev, date_emission: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Date d'expiration</label><input type="date" value={formDoc.date_expiration} onChange={e => setFormDoc(prev => ({ ...prev, date_expiration: e.target.value }))} className={inputCls} /></div>
          </div>
          {formDoc.type_document === 'Assurance' && (<><div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Compagnie assurance</label><input type="text" value={formDoc.compagnie_assurance} onChange={e => setFormDoc(prev => ({ ...prev, compagnie_assurance: e.target.value }))} className={inputCls} /></div><div><label className={labelCls}>N° contrat</label><input type="text" value={formDoc.numero_contrat} onChange={e => setFormDoc(prev => ({ ...prev, numero_contrat: e.target.value }))} className={inputCls} /></div></div><div className="grid grid-cols-2 gap-4"><div><label className={labelCls}>Type de couverture</label><input type="text" value={formDoc.type_couverture} onChange={e => setFormDoc(prev => ({ ...prev, type_couverture: e.target.value }))} className={inputCls} /></div><div><label className={labelCls}>Montant prime (CFA)</label><input type="number" value={formDoc.montant_prime} onChange={e => setFormDoc(prev => ({ ...prev, montant_prime: e.target.value }))} className={inputCls} /></div></div></>)}
          <div><label className={labelCls}>Notes</label><textarea value={formDoc.notes} rows={2} onChange={e => setFormDoc(prev => ({ ...prev, notes: e.target.value }))} className={`${inputCls} resize-none`} /></div>
          <div>
            <label className={labelCls}>Remplacer le fichier <span className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optionnel)</span></label>
            <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${darkMode ? 'border-gray-600 hover:border-amber-500 bg-gray-800' : 'border-gray-300 hover:border-amber-400 bg-gray-50'}`}><i className={`bi bi-arrow-repeat text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i><div><p className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fileName || 'Cliquer pour changer le fichier'}</p><p className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>PDF, Word, Excel, Images — max 10 Mo</p></div><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" onChange={handleFile} className="hidden" /></label>
            {!fileName && <p className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}><i className="bi bi-info-circle"></i> Laisser vide pour conserver le fichier actuel</p>}
          </div>
        </div>

        <div className="p-5 border-t flex items-center justify-end gap-3" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <button onClick={onClose} className={`px-5 py-2.5 rounded-lg border text-sm font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} transition-colors`}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
            {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Enregistrement...</> : <><i className="bi bi-check-lg"></i>Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STATUS DROPDOWN
// ============================================================================
const StatusDropdown = ({ vehicle, statuts, darkMode, theme, onChangeStatut }) => {
  const [open, setOpen]                   = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef   = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (buttonRef.current && !buttonRef.current.contains(e.target) && dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false); };
    const handleScroll = () => setOpen(false);
    if (open) { document.addEventListener('mousedown', handleClickOutside); document.addEventListener('scroll', handleScroll, true); }
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('scroll', handleScroll, true); };
  }, [open]);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setDropdownStyle({ position: 'fixed', top: showAbove ? rect.top - dropdownHeight : rect.bottom + 4, left: Math.max(8, rect.right - 160), zIndex: 99999, boxShadow: showAbove ? '0 -10px 40px rgba(0,0,0,0.15)' : '0 10px 40px rgba(0,0,0,0.15)' });
    }
  }, [open]);

  const available = statuts.filter(s => s !== vehicle.statut);
  const handleStatusClick = (e, newStatut) => { e.stopPropagation(); setOpen(false); onChangeStatut(vehicle, newStatut); };

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className={`p-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors ${darkMode ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`} title="Changer le statut" type="button"><i className="bi bi-arrow-repeat"></i></button>
      {open && createPortal(
        <div ref={dropdownRef} className={`rounded-xl shadow-2xl border min-w-[160px] py-1 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} style={dropdownStyle}>
          <p className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Changer statut</p>
          {available.map(s => (<button key={s} onClick={(e) => handleStatusClick(e, s)} className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`} type="button">{s}</button>))}
        </div>,
        document.body
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Vehicules = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const styleId = 'swal-custom-styles';
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = buildSwalStyles(theme);
    document.head.appendChild(style);
  }, [theme]);

  const [darkMode, setDarkMode] = useState(() => {
    try { const saved = localStorage.getItem('fleetify_darkMode'); return saved !== null ? saved === 'true' : true; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [animateCards, setAnimateCards]           = useState(false);
  const navigate = useNavigate();

  // ── États données backend ──
  const [vehicles, setVehicles]           = useState([]);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [loading, setLoading]             = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [fetchKey, setFetchKey]           = useState(0);

  const [customCategories, setCustomCategories]     = useState([]);
  const [customMarques, setCustomMarques]           = useState([]);
  const [customModeles, setCustomModeles]           = useState({});
  const [customAnnees, setCustomAnnees]             = useState([]);
  const [directions, setDirections]                 = useState([]);
  const [referencesIds, setReferencesIds]           = useState({ categories: {}, marques: {}, modeles: {}, annees: {} });
  const [rawModeles, setRawModeles]                 = useState([]);

  const [vehicleDocuments, setVehicleDocuments]       = useState([]);
  const [vehicleMaintenances, setVehicleMaintenances] = useState([]);
  const [vehicleMissions, setVehicleMissions]         = useState([]);
  const [vehicleStats, setVehicleStats]               = useState(null);

  // ── États UI ──
  const [searchTerm, setSearchTerm]           = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterMarque, setFilterMarque]       = useState('');
  const [filterModele, setFilterModele]       = useState('');
  const [filterStatut, setFilterStatut]       = useState('');
  const [filterVille, setFilterVille]         = useState(''); // ← NOUVEAU
  const [currentPage, setCurrentPage]         = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [viewMode, setViewMode]               = useState('table');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTab, setDetailTab]             = useState('general');
  const [showFilterManagement, setShowFilterManagement]           = useState(false);
  const [filterManagementTab, setFilterManagementTab]             = useState('categories');
  const [newCategory, setNewCategory]                             = useState('');
  const [newMarque, setNewMarque]                                 = useState('');
  const [selectedMarqueForModel, setSelectedMarqueForModel]       = useState('');
  const [selectedCategorieForModel, setSelectedCategorieForModel] = useState('');
  const [newModele, setNewModele]                                 = useState('');
  const [newAnnee, setNewAnnee]                                   = useState('');
  const [submitting, setSubmitting]                               = useState(false);

  const [showAddDocumentModal, setShowAddDocumentModal]   = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument]             = useState(null);

  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const itemsPerPage = 9;
  const statuts = ['Disponible', 'En Mission', 'Maintenance', 'Immobilisation longue','Immobilisation courte', 'Hors Service', 'Vendu'];

  // ← ville ajouté dans formData
  const [formData, setFormData] = useState({
    immatriculation: '', marque: '', modele: '', categorie: '', annee: new Date().getFullYear(),
    numero_chassis: '', kilometrage: 0, nb_places: 5, statut: 'Disponible',
    direction: '', ville: '', carburant: 'Diesel', couleur: '', dateAchat: '',
    cout_acquisition: 0, valeur_residuelle: '', consommation_moyenne: '',
    km_prochaine_vidange: '', km_prochaine_revision: '', assuranceExpire: '', visiteExpire: '',
  });

  const refreshVehicules = useCallback(() => setFetchKey(k => k + 1), []);

  // ── Chargement références ──
  useEffect(() => {
    let cancelled = false;
    const fetchReferences = async () => {
      try {
        const data = await getReferences();
        if (cancelled) return;
        setCustomCategories(data.categories.map(c => c.nom));
        setCustomMarques(data.marques.map(m => m.nom));
        const modelesMap = {};
        data.modeles.forEach(mo => { if (!modelesMap[mo.marque_nom]) modelesMap[mo.marque_nom] = []; modelesMap[mo.marque_nom].push(mo.nom); });
        setCustomModeles(modelesMap);
        setRawModeles(data.modeles);
        setDirections(data.directions.map(d => d.nom));
        setCustomAnnees(data.annees.map(a => a.annee));
        const catIds = {}; data.categories.forEach(c => { catIds[c.nom] = c.id; });
        const mrqIds = {}; data.marques.forEach(m => { mrqIds[m.nom] = m.id; });
        const modIds = {}; data.modeles.forEach(mo => { modIds[mo.nom] = mo.id; });
        const annIds = {}; data.annees.forEach(a => { annIds[a.annee] = a.id; });
        setReferencesIds({ categories: catIds, marques: mrqIds, modeles: modIds, annees: annIds });
      } catch (err) { if (!cancelled) console.error('Erreur chargement références :', err); }
    };
    fetchReferences();
    return () => { cancelled = true; };
  }, []);

  // ── Chargement véhicules (ville ajouté dans les params) ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetchVehicules = async () => {
      try {
        const data = await getVehicules({
          search:    searchTerm      || undefined,
          categorie: filterCategorie || undefined,
          marque:    filterMarque    || undefined,
          modele:    filterModele    || undefined,
          statut:    filterStatut    || undefined,
          ville:     filterVille     || undefined, // ← NOUVEAU
          page:      currentPage,
          per_page:  itemsPerPage,
        });
        if (cancelled) return;
        setVehicles(data.data ?? data);
        setTotalVehicles(data.total ?? (data.data ?? data).length);
        setTotalPages(data.last_page ?? Math.ceil((data.total ?? (data.data ?? data).length) / itemsPerPage));
      } catch (err) { if (!cancelled && err.response?.status === 401) navigate('/login'); }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchVehicules();
    return () => { cancelled = true; };
  }, [searchTerm, filterCategorie, filterMarque, filterModele, filterStatut, filterVille, currentPage, navigate, fetchKey]); // ← filterVille dans les deps

  useEffect(() => {
    if (loading) return;
    setAnimateCards(false);
    const id = requestAnimationFrame(() => { const id2 = requestAnimationFrame(() => setAnimateCards(true)); return () => cancelAnimationFrame(id2); });
    return () => cancelAnimationFrame(id);
  }, [loading]);

  // ── Villes disponibles (liste dynamique depuis les véhicules chargés) ──
  // On déduplique les villes connues pour alimenter le select de filtre
  const [availableVilles, setAvailableVilles] = useState([]);
  useEffect(() => {
    const fetchAllVillesForFilter = async () => {
      try {
        const data = await getVehicules({ per_page: 10000 });
        const allVehicles = data.data ?? data;
        const villes = [...new Set(allVehicles.map(v => v.ville).filter(Boolean))].sort();
        setAvailableVilles(villes);
      } catch {}
    };
    fetchAllVillesForFilter();
  }, [fetchKey]);

  // ── Récupérer TOUS les véhicules pour l'export ──
  const fetchAllVehicles = useCallback(async () => {
    try {
      const data = await getVehicules({ search: searchTerm || undefined, categorie: filterCategorie || undefined, marque: filterMarque || undefined, modele: filterModele || undefined, statut: filterStatut || undefined, ville: filterVille || undefined, page: 1, per_page: 10000 }); // ← ville dans params export
      return data.data ?? data;
    } catch (err) { console.error('Erreur export:', err); return []; }
  }, [searchTerm, filterCategorie, filterMarque, filterModele, filterStatut, filterVille]);

  // ── Chargement données détail ──
  const loadDetailData = useCallback(async (immatriculation) => {
    setLoadingDetail(true);
    try {
      const [docs, maints, missions, stats] = await Promise.all([getDocumentsVehicule(immatriculation), getMaintenancesVehicule(immatriculation), getMissionsVehicule(immatriculation), getStatsVehicule(immatriculation)]);
      setVehicleDocuments(docs ?? []);
      setVehicleMaintenances(maints ?? []);
      setVehicleMissions(missions ?? []);
      setVehicleStats(stats ?? null);
    } catch (err) { console.error('Erreur chargement détail véhicule :', err); }
    finally { setLoadingDetail(false); }
  }, []);

  // ── Gestion image ──
  const handleImageChange = (e) => { const file = e.target.files[0]; if (!file) return; setImageFile(file); const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result); reader.readAsDataURL(file); };
  const resetImageState = () => { setImageFile(null); setImagePreview(''); };

  // ── CRUD Véhicules ──
  const handleAddVehicle = async () => {
    if (!formData.immatriculation || !formData.marque || !formData.modele || !formData.categorie || !formData.direction) {
      showError(darkMode, theme, 'Champs requis', 'Veuillez remplir tous les champs obligatoires.', 'warning'); return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (imageFile) payload.image = imageFile;
      await createVehicule(payload);
      setShowAddModal(false);
      resetForm();
      showSuccess(darkMode, theme, 'Véhicule ajouté', 'Le véhicule a été ajouté avec succès.');
    } catch (err) {
      const errors = err.response?.data?.errors;
      showError(darkMode, theme, 'Erreur', errors ? Object.values(errors).flat().join('\n') : (err.response?.data?.message || "Erreur lors de l'ajout du véhicule."));
    } finally { setSubmitting(false); }
  };

  const handleEditVehicle = async () => {
    if (!selectedVehicle) return;
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (imageFile) payload.image = imageFile;
      await updateVehicule(selectedVehicle.immatriculation, payload);
      setShowEditModal(false);
      setSelectedVehicle(null);
      resetForm();
      showSuccess(darkMode, theme, 'Véhicule modifié', 'Les modifications ont été enregistrées.');
    } catch (err) {
      const errors = err.response?.data?.errors;
      showError(darkMode, theme, 'Erreur', errors ? Object.values(errors).flat().join('\n') : (err.response?.data?.message || 'Erreur lors de la modification.'));
    } finally { setSubmitting(false); }
  };

  const handleDeleteVehicle = async (vehicle) => {
    const result = await showConfirm(darkMode, theme, { title: 'Confirmer la suppression', html: `Êtes-vous sûr de vouloir supprimer le véhicule <strong>${vehicle.immatriculation}</strong> (${vehicle.marque} ${vehicle.modele}) ?<br/><small style="color:#9ca3af">Cette action est irréversible.</small>`, confirmText: '<i class="bi bi-trash" style="margin-right:6px"></i>Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteVehicule(vehicle.immatriculation); showSuccess(darkMode, theme, 'Supprimé', `Le véhicule ${vehicle.immatriculation} a été supprimé.`); }
    catch (err) { showError(darkMode, theme, 'Erreur', err.response?.data?.message || 'Erreur lors de la suppression.'); }
  };

  const handleChangeStatut = async (vehicle, newStatut) => {
    const result = await showConfirm(darkMode, theme, { title: 'Changer le statut', html: `Passer <strong>${vehicle.immatriculation}</strong> en <strong style="color:${theme.primary}">${newStatut}</strong> ?`, confirmText: 'Confirmer', isDanger: false });
    if (!result.isConfirmed) return;
    try { await updateStatutVehicule(vehicle.immatriculation, newStatut); showSuccess(darkMode, theme, 'Statut mis à jour', `Le véhicule est maintenant "${newStatut}".`); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors du changement de statut.'); }
  };

  // ── CRUD Références ──
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (customCategories.includes(newCategory.trim())) { showError(darkMode, theme, 'Doublon', 'Cette catégorie existe déjà.', 'warning'); return; }
    try { const res = await createCategorie(newCategory.trim()); setCustomCategories(prev => [...prev, newCategory.trim()]); setReferencesIds(prev => ({ ...prev, categories: { ...prev.categories, [newCategory.trim()]: res.id } })); setNewCategory(''); showSuccess(darkMode, theme, 'Catégorie ajoutée', `La catégorie "${newCategory.trim()}" a été créée.`); }
    catch { showError(darkMode, theme, 'Erreur', "Erreur lors de l'ajout de la catégorie."); }
  };

  const handleDeleteCategory = async (category) => {
    const id = referencesIds.categories[category]; if (!id) return;
    const result = await showConfirm(darkMode, theme, { title: 'Supprimer la catégorie ?', html: `La catégorie "${category}" sera supprimée.`, confirmText: 'Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteCategorie(id); setCustomCategories(prev => prev.filter(c => c !== category)); showSuccess(darkMode, theme, 'Supprimée', `La catégorie "${category}" a été supprimée.`); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors de la suppression.'); }
  };

  const handleAddMarque = async () => {
    if (!newMarque.trim()) return;
    if (customMarques.includes(newMarque.trim())) { showError(darkMode, theme, 'Doublon', 'Cette marque existe déjà.', 'warning'); return; }
    try { const res = await createMarque(newMarque.trim()); setCustomMarques(prev => [...prev, newMarque.trim()]); setCustomModeles(prev => ({ ...prev, [newMarque.trim()]: [] })); setReferencesIds(prev => ({ ...prev, marques: { ...prev.marques, [newMarque.trim()]: res.id } })); setNewMarque(''); showSuccess(darkMode, theme, 'Marque ajoutée', `La marque "${newMarque.trim()}" a été créée.`); }
    catch { showError(darkMode, theme, 'Erreur', "Erreur lors de l'ajout de la marque."); }
  };

  const handleDeleteMarque = async (marque) => {
    const id = referencesIds.marques[marque]; if (!id) return;
    const result = await showConfirm(darkMode, theme, { title: 'Supprimer la marque ?', html: `La marque "${marque}" et ses modèles associés seront supprimés.`, confirmText: 'Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteMarque(id); setCustomMarques(prev => prev.filter(m => m !== marque)); setCustomModeles(prev => { const n = { ...prev }; delete n[marque]; return n; }); showSuccess(darkMode, theme, 'Supprimée', `La marque "${marque}" a été supprimée.`); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors de la suppression.'); }
  };

  const handleAddModele = async () => {
    if (!selectedMarqueForModel || !newModele.trim() || !selectedCategorieForModel) { showError(darkMode, theme, 'Champs requis', 'Veuillez sélectionner une marque, une catégorie et saisir un nom de modèle.', 'warning'); return; }
    if (customModeles[selectedMarqueForModel]?.includes(newModele.trim())) { showError(darkMode, theme, 'Doublon', 'Ce modèle existe déjà pour cette marque.', 'warning'); return; }
    const marqueId = referencesIds.marques[selectedMarqueForModel];
    const categorieId = referencesIds.categories[selectedCategorieForModel];
    if (!marqueId || !categorieId) return;
    try { const res = await createModele({ marque_id: marqueId, categorie_id: categorieId, nom: newModele.trim() }); setCustomModeles(prev => ({ ...prev, [selectedMarqueForModel]: [...(prev[selectedMarqueForModel] || []), newModele.trim()] })); setReferencesIds(prev => ({ ...prev, modeles: { ...prev.modeles, [newModele.trim()]: res.id } })); setRawModeles(prev => [...prev, { id: res.id, nom: newModele.trim(), marque_id: marqueId, marque_nom: selectedMarqueForModel, categorie_id: categorieId }]); setNewModele(''); showSuccess(darkMode, theme, 'Modèle ajouté', `Le modèle "${newModele.trim()}" a été créé.`); }
    catch (err) { const msg = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join('\n') : "Erreur lors de l'ajout du modèle."; showError(darkMode, theme, 'Erreur', msg); }
  };

  const handleDeleteModele = async (marque, modele) => {
    const id = referencesIds.modeles[modele]; if (!id) return;
    const result = await showConfirm(darkMode, theme, { title: 'Supprimer le modèle ?', html: `Le modèle "${modele}" sera supprimé.`, confirmText: 'Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteModele(id); setCustomModeles(prev => ({ ...prev, [marque]: prev[marque].filter(m => m !== modele) })); setRawModeles(prev => prev.filter(m => m.id !== id)); showSuccess(darkMode, theme, 'Supprimé', `Le modèle "${modele}" a été supprimé.`); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors de la suppression.'); }
  };

  const handleAddAnnee = async () => {
    const anneeNum = parseInt(newAnnee);
    if (!anneeNum || anneeNum < 1900 || anneeNum > 2100) { showError(darkMode, theme, 'Valeur invalide', 'Veuillez saisir une année valide (1900–2100).', 'warning'); return; }
    if (customAnnees.includes(anneeNum)) { showError(darkMode, theme, 'Doublon', 'Cette année existe déjà.', 'warning'); return; }
    try { const res = await createAnnee(anneeNum); setCustomAnnees(prev => [anneeNum, ...prev].sort((a, b) => b - a)); setReferencesIds(prev => ({ ...prev, annees: { ...prev.annees, [anneeNum]: res.id } })); setNewAnnee(''); showSuccess(darkMode, theme, 'Année ajoutée', `L'année ${anneeNum} a été ajoutée.`); }
    catch { showError(darkMode, theme, 'Erreur', "Erreur lors de l'ajout de l'année."); }
  };

  const handleDeleteAnnee = async (annee) => {
    const id = referencesIds.annees[annee]; if (!id) return;
    const result = await showConfirm(darkMode, theme, { title: "Désactiver l'année ?", html: `L'année ${annee} sera désactivée.`, confirmText: 'Désactiver', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteAnnee(id); setCustomAnnees(prev => prev.filter(a => a !== annee)); showSuccess(darkMode, theme, 'Désactivée', `L'année ${annee} a été désactivée.`); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors de la désactivation.'); }
  };

  // ── Handlers Documents ──
  const handleOpenDocument = async (doc) => {
    try { if (doc.url_fichier) { window.open(getStorageUrl(doc.url_fichier), '_blank'); } else { const res = await openDocumentVehicule(selectedVehicle.immatriculation, doc.id); window.open(getStorageUrl(res.url), '_blank'); } }
    catch { showError(darkMode, theme, 'Erreur', "Impossible d'ouvrir le document."); }
  };

  const handleOpenEditDocument = (doc) => { setEditingDocument(doc); setShowEditDocumentModal(true); };

  const handleDeleteDocument = async (doc) => {
    const result = await showConfirm(darkMode, theme, { title: 'Supprimer le document ?', html: `"${doc.nom_document}" sera définitivement supprimé.`, confirmText: 'Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteDocumentVehicule(selectedVehicle.immatriculation, doc.id); setVehicleDocuments(prev => prev.filter(d => d.id !== doc.id)); showSuccess(darkMode, theme, 'Supprimé', 'Le document a été supprimé.'); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors de la suppression du document.'); }
  };

  const onDocumentAdded = useCallback(async () => {
    if (selectedVehicle) { try { const docs = await getDocumentsVehicule(selectedVehicle.immatriculation); setVehicleDocuments(docs ?? []); } catch {} }
    showSuccess(darkMode, theme, 'Document ajouté', 'Le document a été enregistré avec succès.');
  }, [selectedVehicle, darkMode, theme]);

  const onDocumentEdited = useCallback(async () => {
    if (selectedVehicle) { try { const docs = await getDocumentsVehicule(selectedVehicle.immatriculation); setVehicleDocuments(docs ?? []); } catch {} }
    setEditingDocument(null);
    showSuccess(darkMode, theme, 'Document modifié', 'Les modifications ont été enregistrées.');
  }, [selectedVehicle, darkMode, theme]);

  // ── Helpers modals ──
  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    // ← ville ajouté dans le pré-remplissage
    setFormData({
      immatriculation: vehicle.immatriculation, marque: vehicle.marque, modele: vehicle.modele,
      categorie: vehicle.categorie, annee: vehicle.annee, numero_chassis: vehicle.numero_chassis || '',
      kilometrage: vehicle.kilometrage, nb_places: vehicle.nb_places || 5, statut: vehicle.statut,
      direction: vehicle.direction, ville: vehicle.ville || '', carburant: vehicle.carburant,
      couleur: vehicle.couleur || '', dateAchat: vehicle.dateAchat || '',
      cout_acquisition: vehicle.cout_acquisition || 0, valeur_residuelle: vehicle.valeur_residuelle || '',
      consommation_moyenne: vehicle.consommation_moyenne || '', km_prochaine_vidange: vehicle.km_prochaine_vidange || '',
      km_prochaine_revision: vehicle.km_prochaine_revision || '', assuranceExpire: vehicle.assuranceExpire || '',
      visiteExpire: vehicle.visiteExpire || '',
    });
    resetImageState();
    setImagePreview(vehicle.image ? getStorageUrl(vehicle.image) : '');
    setShowEditModal(true);
  };

  const openDetailModal = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailTab('general');
    setShowDetailModal(true);
    await loadDetailData(vehicle.immatriculation);
  };

  const resetForm = () => {
    setFormData({
      immatriculation: '', marque: '', modele: '', categorie: '', annee: new Date().getFullYear(),
      numero_chassis: '', kilometrage: 0, nb_places: 5, statut: 'Disponible',
      direction: '', ville: '', carburant: 'Diesel', couleur: '', dateAchat: '', // ← ville
      cout_acquisition: 0, valeur_residuelle: '', consommation_moyenne: '',
      km_prochaine_vidange: '', km_prochaine_revision: '', assuranceExpire: '', visiteExpire: '',
    });
    resetImageState();
  };

  // ← filterVille réinitialisé dans resetFilters
  const resetFilters = () => { setFilterCategorie(''); setFilterMarque(''); setFilterModele(''); setFilterStatut(''); setFilterVille(''); setSearchTerm(''); setCurrentPage(1); };

  const getStatutColor = (statut) => ({ 'Disponible': 'bg-green-100 text-green-700', 'En Mission': 'bg-blue-100 text-blue-700', 'Maintenance': 'bg-orange-100 text-orange-700', 'Immobilisation longue': 'bg-red-100 text-red-700', 'Immobilisation courte': 'bg-red-100 text-red-700' }[statut] || 'bg-gray-100 text-gray-700');

  const availableModeles     = filterMarque ? customModeles[filterMarque] || [] : [];
  const formAvailableModeles = formData.marque ? customModeles[formData.marque] || [] : [];

  const statutData    = statuts.map(s => ({ name: s, value: vehicles.filter(v => v.statut === s).length }));
  const directionData = [...new Set(vehicles.map(v => v.direction).filter(Boolean))].map(d => ({ name: d, value: vehicles.filter(v => v.direction === d).length })).sort((a, b) => b.value - a.value);
  // ← graphique par ville
  const villeData     = [...new Set(vehicles.map(v => v.ville).filter(Boolean))].map(vi => ({ name: vi, value: vehicles.filter(v => v.ville === vi).length })).sort((a, b) => b.value - a.value);

  const inputCls = (dark) => `w-full px-3 py-2.5 rounded-lg border text-sm font-semibold ${dark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`;
  const labelCls = (dark) => `block text-sm font-bold mb-1.5 ${dark ? 'text-gray-200' : 'text-gray-700'}`;

  const ImageUploadField = ({ label, preview, onClear }) => (
    <div className="col-span-2">
      <label className={labelCls(darkMode)}>{label}</label>
      <div className="flex items-start gap-4">
        {preview && (<div className="relative flex-shrink-0"><img src={preview} alt="Aperçu" className="w-20 h-20 rounded-lg object-cover border" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }} /><button type="button" onClick={onClear} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"><i className="bi bi-x"></i></button></div>)}
        <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${darkMode ? 'border-gray-600 hover:border-blue-500 bg-gray-800' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}><i className={`bi bi-image text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i><div><p className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{imageFile ? imageFile.name : 'Cliquer pour choisir une image'}</p><p className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>JPG, PNG, WEBP — max 10 Mo</p></div><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className="hidden" /></label>
      </div>
    </div>
  );

  // ← Champ ville ajouté dans le formulaire véhicule
  const renderVehicleFormFields = (isEdit = false) => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className={labelCls(darkMode)}>Immatriculation *</label>
        <input type="text" value={formData.immatriculation} readOnly={isEdit} placeholder="AB-1234-GA" onChange={e => !isEdit && setFormData({ ...formData, immatriculation: e.target.value })} className={`${inputCls(darkMode)} ${isEdit ? 'opacity-60' : ''}`} />
      </div>
      <div>
        <label className={labelCls(darkMode)}>N° Châssis</label>
        <input type="text" value={formData.numero_chassis} placeholder="VIN / N° châssis" onChange={e => setFormData({ ...formData, numero_chassis: e.target.value })} className={inputCls(darkMode)} />
      </div>
      <div>
        <label className={labelCls(darkMode)}>Marque *</label>
        <select value={formData.marque} onChange={e => setFormData({ ...formData, marque: e.target.value, modele: '' })} className={inputCls(darkMode)}>
          <option value="">Sélectionner</option>
          {customMarques.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls(darkMode)}>Modèle *</label>
        <select value={formData.modele} onChange={e => setFormData({ ...formData, modele: e.target.value })} disabled={!formData.marque} className={`${inputCls(darkMode)} disabled:opacity-50`}>
          <option value="">Sélectionner</option>
          {formAvailableModeles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls(darkMode)}>Catégorie *</label>
        <select value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })} className={inputCls(darkMode)}>
          <option value="">Sélectionner</option>
          {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls(darkMode)}>Direction *</label>
        <select value={formData.direction} onChange={e => setFormData({ ...formData, direction: e.target.value })} className={inputCls(darkMode)}>
          <option value="">Sélectionner</option>
          {directions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {/* ← Champ Ville dans le formulaire */}
      <div>
        <label className={labelCls(darkMode)}>Ville</label>
        <input type="text" value={formData.ville} placeholder="Ex: Libreville"
          onChange={e => setFormData({ ...formData, ville: e.target.value })}
          className={inputCls(darkMode)} />
      </div>
      <div>
        <label className={labelCls(darkMode)}>Année</label>
        <select value={formData.annee} onChange={e => setFormData({ ...formData, annee: parseInt(e.target.value) || '' })} className={inputCls(darkMode)}>
          <option value="">Sélectionner</option>
          {customAnnees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls(darkMode)}>Statut</label>
        <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value })} className={inputCls(darkMode)}>
          {statuts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls(darkMode)}>Carburant</label>
        <select value={formData.carburant} onChange={e => setFormData({ ...formData, carburant: e.target.value })} className={inputCls(darkMode)}>
          {['Diesel', 'Essence', 'Hybride', 'Électrique'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls(darkMode)}>Nombre de places</label>
        <input type="number" min="1" max="100" value={formData.nb_places} onChange={e => setFormData({ ...formData, nb_places: parseInt(e.target.value) || 5 })} className={inputCls(darkMode)} />
      </div>
      <div>
        <label className={labelCls(darkMode)}>Kilométrage</label>
        <input type="number" min="0" value={formData.kilometrage} onChange={e => setFormData({ ...formData, kilometrage: parseInt(e.target.value) || 0 })} className={inputCls(darkMode)} />
      </div>
      <div>
        <label className={labelCls(darkMode)}>Couleur</label>
        <input type="text" value={formData.couleur} placeholder="Ex: Blanc" onChange={e => setFormData({ ...formData, couleur: e.target.value })} className={inputCls(darkMode)} />
      </div>
      <div>
        <label className={labelCls(darkMode)}>Consomation (L)</label>
        <input type="number" step="0.1" min="0" value={formData.consommation_moyenne} placeholder="Ex: 8.5" onChange={e => setFormData({ ...formData, consommation_moyenne: e.target.value })} className={inputCls(darkMode)} />
      </div>
      <div>
        <label className={labelCls(darkMode)}>Km proch. vidange</label>
        <input type="number" min="0" value={formData.km_prochaine_vidange} placeholder="Ex: 130000" onChange={e => setFormData({ ...formData, km_prochaine_vidange: e.target.value })} className={inputCls(darkMode)} />
      </div>
     
      <div>
        <label className={labelCls(darkMode)}>Date d'achat</label>
        <input type="date" value={formData.dateAchat} onChange={e => setFormData({ ...formData, dateAchat: e.target.value })} className={inputCls(darkMode)} />
      </div>
      <div>
        <label className={labelCls(darkMode)}>Coût d'acquisition (CFA)</label>
        <input type="number" min="0" value={formData.cout_acquisition} onChange={e => setFormData({ ...formData, cout_acquisition: parseFloat(e.target.value) || 0 })} className={inputCls(darkMode)} />
      </div>
     
      <ImageUploadField label={isEdit ? 'Changer la photo du véhicule' : 'Photo du véhicule'} preview={imagePreview} onClear={resetImageState} />
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        * { font-weight: inherit; }
        body, p, span, td, th, label, input, select, textarea, button { font-weight: 600; }
        h1, h2, h3, h4 { font-weight: 800; }
      `}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} showNotifications={showNotifications} setShowNotifications={setShowNotifications} showProfile={showProfile} setShowProfile={setShowProfile} />

      {(showNotifications || showProfile) && <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfile(false); }} />}

      <main className="transition-all duration-300 pt-24 px-6 pb-6" style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}>

        {/* ── GRAPHIQUES (3 cartes : statut, direction, ville) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {[
            { title: 'Véhicules par Statut',    data: statutData,    colors: ['#10b981','#3b82f6','#f59e0b','#ef4444'],                                   delay: '0s' },
            { title: 'Véhicules par Direction', data: directionData, colors: ['#8b5cf6','#06b6d4','#f59e0b','#ef4444','#10b981','#3b82f6','#ec4899'],    delay: '0.15s' },
            { title: 'Véhicules par Ville',     data: villeData,     colors: ['#f97316','#84cc16','#14b8a6','#a855f7','#fb7185','#38bdf8','#fbbf24'],    delay: '0.3s' }, // ← NOUVEAU graphique
          ].map((chart, ci) => (
            <div key={ci} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5`} style={{ animation: animateCards ? `fadeInUp 0.5s ease-out ${chart.delay} both` : 'none' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
                <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{chart.title}</h3>
              </div>
              {loading ? <div className={`h-32 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div> : <HorizontalBarChart data={chart.data} colors={chart.colors} darkMode={darkMode} title={chart.title.replace(/ /g, '_')} />}
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-6`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Recherche */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <i className={`bi bi-search text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Rechercher..." className={`bg-transparent text-sm font-semibold outline-none w-36 ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
              </div>
              {/* Filtres */}
              {[
                { value: filterCategorie, setter: (v) => { setFilterCategorie(v); setCurrentPage(1); }, options: customCategories, placeholder: 'Catégorie' },
                { value: filterMarque,    setter: (v) => { setFilterMarque(v); setFilterModele(''); setCurrentPage(1); }, options: customMarques, placeholder: 'Marque' },
                { value: filterModele,    setter: (v) => { setFilterModele(v); setCurrentPage(1); }, options: availableModeles, placeholder: 'Modèle', disabled: !filterMarque },
                { value: filterStatut,    setter: (v) => { setFilterStatut(v); setCurrentPage(1); }, options: statuts, placeholder: 'Statut' },
              ].map((f, i) => (
                <select key={i} value={f.value} onChange={(e) => f.setter(e.target.value)} disabled={f.disabled} className={`px-3 py-2 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none disabled:opacity-50`}>
                  <option value="">{f.placeholder}</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              {/* ← Filtre Ville */}
              <select
                value={filterVille}
                onChange={(e) => { setFilterVille(e.target.value); setCurrentPage(1); }}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}
              >
                <option value="">Ville</option>
                {availableVilles.map(v => <option key={v} value={v}>{v}</option>)}
              </select>

              {(filterCategorie || filterMarque || filterModele || filterStatut || filterVille || searchTerm) && (
                <button onClick={resetFilters} className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}>
                  <i className="bi bi-x-lg"></i> Effacer
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <VehicleExportDropdown fetchAllVehicles={fetchAllVehicles} darkMode={darkMode} theme={theme} />
              <button onClick={() => setShowFilterManagement(true)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}><i className="bi bi-funnel"></i> Gestion filtres</button>
              <div className={`flex rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                {['table', 'grid'].map((mode) => (
                  <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-2 transition-colors ${viewMode === mode ? 'text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`} style={viewMode === mode ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                    <i className={mode === 'table' ? 'bi bi-list-ul' : 'bi bi-grid-3x3-gap-fill'}></i>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddModal(true)} className="px-5 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 shadow-sm hover:opacity-90 hover:shadow-md transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <i className="bi bi-plus-lg"></i> Ajouter un véhicule
              </button>
            </div>
          </div>
        </div>

        {/* ── TABLE VIEW ── */}
        {viewMode === 'table' && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
            <div className={`px-5 py-3 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <p className={`text-sm font-extrabold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}><i className="bi bi-list-ul mr-2"></i>{totalVehicles} véhicule(s)</p>
              <TableExportButton fetchAllVehicles={fetchAllVehicles} darkMode={darkMode} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                    {/* ← Ville ajoutée dans les colonnes de la table */}
                    {['Véhicule', 'Catégorie', 'Direction', 'Ville', 'Statut', 'Kilométrage', 'Actions'].map((h, i) => (
                      <th key={i} className={`px-5 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-white ${i === 6 ? 'text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonRow key={i} darkMode={darkMode} />)
                    : vehicles.length === 0
                      ? (<tr><td colSpan={7} className={`text-center py-16 font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}><i className="bi bi-car-front text-4xl block mb-2"></i>Aucun véhicule trouvé</td></tr>)
                      : vehicles.map((vehicle, rowIdx) => (
                          <tr key={vehicle.immatriculation} className="transition-all duration-200 hover:brightness-110"
                            style={{ backgroundColor: rowIdx % 2 === 0 ? (darkMode ? '#0c1929' : '#e8eef6') : (darkMode ? '#162033' : '#f1f4f9'), animation: animateCards ? `fadeInUp 0.4s ease-out ${rowIdx * 0.06}s both` : 'none' }}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <StableImage src={vehicle.image} alt={`${vehicle.marque} ${vehicle.modele}`} className="w-11 h-11 rounded-lg shadow-sm" darkMode={darkMode} clickable={true} />
                                <div>
                                  <p className={`font-extrabold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{vehicle.immatriculation}</p>
                                  <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{vehicle.marque} {vehicle.modele} · {vehicle.annee}</p>
                                </div>
                              </div>
                            </td>
                            <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{vehicle.categorie}</td>
                            <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{vehicle.direction}</td>
                            {/* ← Colonne ville dans la table */}
                            <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {vehicle.ville
                                ? <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-50 text-teal-700'}`}><i className="bi bi-geo-alt-fill text-[10px]"></i>{vehicle.ville}</span>
                                : <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>—</span>}
                            </td>
                            <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatutColor(vehicle.statut)}`}>{vehicle.statut}</span></td>
                            <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{(vehicle.kilometrage || 0).toLocaleString()} km</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                                <button onClick={() => openDetailModal(vehicle)} className={`p-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors ${darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`} title="Voir les détails"><i className="bi bi-eye"></i></button>
                                <button onClick={() => openEditModal(vehicle)} className={`p-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors ${darkMode ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`} title="Modifier"><i className="bi bi-pencil"></i></button>
                                <StatusDropdown vehicle={vehicle} statuts={statuts} darkMode={darkMode} theme={theme} onChangeStatut={handleChangeStatut} />
                                <button onClick={() => handleDeleteVehicle(vehicle)} className={`p-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title="Supprimer"><i className="bi bi-trash"></i></button>
                              </div>
                            </td>
                          </tr>
                        ))
                  }
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className={`px-5 py-3.5 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
                <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalVehicles)} sur {totalVehicles} véhicules</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}><i className="bi bi-chevron-left"></i></button>
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === page ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`} style={currentPage === page ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}><i className="bi bi-chevron-right"></i></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {viewMode === 'grid' && (
          <>
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-4 flex items-center justify-between`}>
              <p className={`text-sm font-extrabold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}><i className="bi bi-grid-3x3-gap-fill mr-2"></i>{totalVehicles} véhicule(s) — Vue Grille</p>
              <TableExportButton fetchAllVehicles={fetchAllVehicles} darkMode={darkMode} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading
                ? Array.from({ length: itemsPerPage }).map((_, idx) => (<div key={idx} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden animate-pulse`}><div className={`h-40 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div><div className="p-5 space-y-2"><div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} w-2/3`}></div><div className={`h-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} w-1/2`}></div></div></div>))
                : vehicles.length === 0
                  ? (<div className="col-span-3 text-center py-16"><i className={`bi bi-car-front text-4xl block mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i><p className={`font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun véhicule trouvé</p></div>)
                  : vehicles.map((vehicle, idx) => (
                      <div key={vehicle.immatriculation} className="rounded-xl border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group"
                        style={{ backgroundColor: idx % 2 === 0 ? (darkMode ? '#0c1929' : '#e8eef6') : (darkMode ? '#162033' : '#f1f4f9'), borderColor: darkMode ? '#374151' : '#e5e7eb', animation: animateCards ? `fadeInUp 0.5s ease-out ${idx * 0.1}s both` : 'none' }}>
                        <div className="relative h-40 overflow-hidden">
                          <StableImage src={vehicle.image} alt={`${vehicle.marque} ${vehicle.modele}`} className="w-full h-full" darkMode={darkMode} clickable={true} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${getStatutColor(vehicle.statut)}`}>{vehicle.statut}</span>
                          {/* ← Badge ville sur la carte */}
                          {vehicle.ville && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm bg-teal-600/80 text-white flex items-center gap-1">
                              <i className="bi bi-geo-alt-fill text-[10px]"></i>{vehicle.ville}
                            </span>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-1.5">
                            <h3 className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{vehicle.immatriculation}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{vehicle.categorie}</span>
                          </div>
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>{vehicle.marque} {vehicle.modele} · {vehicle.annee}</p>
                          <div className={`flex items-center justify-between text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`}>
                            <span><i className="bi bi-speedometer2 mr-1"></i>{(vehicle.kilometrage || 0).toLocaleString()} km</span>
                            <span><i className="bi bi-building mr-1"></i>{vehicle.direction}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openDetailModal(vehicle)} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}><i className="bi bi-eye"></i> Détails</button>
                            <button onClick={() => openEditModal(vehicle)} className="py-2 px-3 rounded-lg text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-pencil"></i></button>
                            <button onClick={() => handleDeleteVehicle(vehicle)} className={`py-2 px-3 rounded-lg text-sm font-bold ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}><i className="bi bi-trash"></i></button>
                          </div>
                        </div>
                      </div>
                    ))
              }
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-4 py-2 rounded-lg border text-sm font-bold ${darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}>Précédent</button>
                <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Page {currentPage} sur {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`px-4 py-2 rounded-lg border text-sm font-bold ${darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}>Suivant</button>
              </div>
            )}
          </>
        )}

        {/* ── FOOTER ── */}
        <div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-center">
            <p className={`text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>© 2026 SGS Tous droits réservés - Version 1.0</p>
          </div>
        </div>
      </main>

      {/* ── MODAL GESTION FILTRES ── */}
      {showFilterManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
              <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gestion des filtres</h2>
              <button onClick={() => setShowFilterManagement(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}><i className="bi bi-x-lg text-lg"></i></button>
            </div>
            <div className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} px-6 flex gap-1`}>
              {[{ key: 'categories', label: 'Catégories', icon: 'bi-tag' }, { key: 'marques', label: 'Marques', icon: 'bi-building' }, { key: 'modeles', label: 'Modèles', icon: 'bi-car-front' }, { key: 'annees', label: 'Années', icon: 'bi-calendar3' }].map(tab => (
                <button key={tab.key} onClick={() => setFilterManagementTab(tab.key)} className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${filterManagementTab === tab.key ? 'border-transparent text-white' : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}`} style={filterManagementTab === tab.key ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`, borderRadius: '8px 8px 0 0' } : {}}>
                  <i className={tab.icon}></i>{tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {filterManagementTab === 'categories' && (<div><div className="flex items-center gap-3 mb-6"><input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nouvelle catégorie" className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} /><button onClick={handleAddCategory} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-plus-lg mr-2"></i>Ajouter</button></div><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{customCategories.map(cat => (<div key={cat} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 flex items-center justify-between`}><span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cat}</span><button onClick={() => handleDeleteCategory(cat)} className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'} transition-colors`}><i className="bi bi-trash text-sm"></i></button></div>))}</div></div>)}
              {filterManagementTab === 'marques' && (<div><div className="flex items-center gap-3 mb-6"><input type="text" value={newMarque} onChange={e => setNewMarque(e.target.value)} placeholder="Nouvelle marque" className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`} onKeyDown={e => e.key === 'Enter' && handleAddMarque()} /><button onClick={handleAddMarque} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-plus-lg mr-2"></i>Ajouter</button></div><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{customMarques.map(marque => (<div key={marque} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 flex items-center justify-between`}><span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{marque}</span><button onClick={() => handleDeleteMarque(marque)} className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'} transition-colors`}><i className="bi bi-trash text-sm"></i></button></div>))}</div></div>)}
              {filterManagementTab === 'modeles' && (<div><div className="flex items-center gap-3 mb-6 flex-wrap"><select value={selectedMarqueForModel} onChange={e => setSelectedMarqueForModel(e.target.value)} className={`px-4 py-2.5 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}><option value="">Sélect. une marque</option>{customMarques.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={selectedCategorieForModel} onChange={e => setSelectedCategorieForModel(e.target.value)} className={`px-4 py-2.5 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}><option value="">Sélect. une catégorie</option>{customCategories.map(c => <option key={c} value={c}>{c}</option>)}</select><input type="text" value={newModele} onChange={e => setNewModele(e.target.value)} placeholder="Nom du modèle" disabled={!selectedMarqueForModel || !selectedCategorieForModel} className={`flex-1 min-w-32 px-4 py-2.5 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none disabled:opacity-50`} onKeyDown={e => e.key === 'Enter' && handleAddModele()} /><button onClick={handleAddModele} disabled={!selectedMarqueForModel || !selectedCategorieForModel} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-plus-lg mr-2"></i>Ajouter</button></div>{selectedMarqueForModel ? (<div><h3 className={`text-sm font-extrabold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Modèles de {selectedMarqueForModel}</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{(customModeles[selectedMarqueForModel] || []).map(modele => (<div key={modele} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 flex items-center justify-between`}><span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modele}</span><button onClick={() => handleDeleteModele(selectedMarqueForModel, modele)} className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'} transition-colors`}><i className="bi bi-trash text-sm"></i></button></div>))}{(customModeles[selectedMarqueForModel] || []).length === 0 && (<p className={`text-sm font-semibold col-span-3 text-center py-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun modèle pour cette marque</p>)}</div></div>) : (<div className="text-center py-12"><i className={`bi bi-car-front text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i><p className={`mt-3 font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sélectionnez une marque pour voir ses modèles</p></div>)}</div>)}
              {filterManagementTab === 'annees' && (<div><div className="flex items-center gap-3 mb-6"><input type="number" value={newAnnee} onChange={e => setNewAnnee(e.target.value)} placeholder="Ex : 2020" min="1900" max="2100" className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`} onKeyDown={e => e.key === 'Enter' && handleAddAnnee()} /><button onClick={handleAddAnnee} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-plus-lg mr-2"></i>Ajouter</button></div><div className="grid grid-cols-3 md:grid-cols-5 gap-3">{customAnnees.map(annee => (<div key={annee} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 flex items-center justify-between`}><span className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{annee}</span><button onClick={() => handleDeleteAnnee(annee)} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'} transition-colors`}><i className="bi bi-x text-sm"></i></button></div>))}</div></div>)}
            </div>
            <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-end`}>
              <button onClick={() => setShowFilterManagement(false)} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL AJOUTER VÉHICULE ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between sticky top-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} z-10`}>
              <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}><i className="bi bi-plus-circle mr-2 text-blue-400"></i>Ajouter un véhicule</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}><i className="bi bi-x-lg text-lg"></i></button>
            </div>
            <div className="p-6">{renderVehicleFormFields(false)}</div>
            <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-end gap-3 sticky bottom-0 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className={`px-5 py-2.5 rounded-lg border text-sm font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} transition-colors`}>Annuler</button>
              <button onClick={handleAddVehicle} disabled={submitting || !formData.immatriculation || !formData.marque || !formData.modele || !formData.categorie || !formData.direction} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Ajout...</> : <><i className="bi bi-plus-lg"></i>Ajouter le véhicule</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL MODIFIER VÉHICULE ── */}
      {showEditModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between sticky top-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} z-10`}>
              <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}><i className="bi bi-pencil-square mr-2 text-blue-400"></i>Modifier — {selectedVehicle.immatriculation}</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedVehicle(null); resetForm(); }} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}><i className="bi bi-x-lg text-lg"></i></button>
            </div>
            <div className="p-6">{renderVehicleFormFields(true)}</div>
            <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-end gap-3 sticky bottom-0 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <button onClick={() => { setShowEditModal(false); setSelectedVehicle(null); resetForm(); }} className={`px-5 py-2.5 rounded-lg border text-sm font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} transition-colors`}>Annuler</button>
              <button onClick={handleEditVehicle} disabled={submitting} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Enregistrement...</> : <><i className="bi bi-check-lg"></i>Enregistrer les modifications</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DÉTAIL VÉHICULE ── */}
      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-[95vw] overflow-hidden flex flex-col shadow-2xl`} style={{ height: '92vh' }}>
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedVehicle.immatriculation}</h2>
                <span className="text-white/70 text-sm">·</span>
                <span className="text-white/90 text-sm font-bold">{selectedVehicle.marque} {selectedVehicle.modele} · {selectedVehicle.annee}</span>
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-extrabold ${getStatutColor(selectedVehicle.statut)}`}>{selectedVehicle.statut}</span>
                {/* ← Badge ville dans le header du détail */}
                {selectedVehicle.ville && <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1"><i className="bi bi-geo-alt-fill text-[10px]"></i>{selectedVehicle.ville}</span>}
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"><i className="bi bi-x-lg text-lg"></i></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Panneau gauche */}
              <div className={`flex flex-col border-r overflow-y-auto ${darkMode ? 'border-gray-800' : 'border-gray-200'}`} style={{ width: '50%' }}>
                <div className="flex-shrink-0 p-5" style={{ background: darkMode ? 'linear-gradient(135deg, #0c1929, #162033)' : 'linear-gradient(135deg, #1e293b, #334155)' }}>
                  <div className="relative overflow-hidden" style={{ height: '300px', borderRadius: '16px', border: `3px solid ${theme.primary}55`, boxShadow: `0 0 30px ${theme.primary}33, 0 8px 32px rgba(0,0,0,0.4)` }}>
                    <StableImage src={selectedVehicle.image} alt={`${selectedVehicle.marque} ${selectedVehicle.modele}`} className="w-full h-full" darkMode={darkMode} clickable={true} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4">
                      <p className="text-white text-base font-extrabold drop-shadow">{selectedVehicle.marque} {selectedVehicle.modele}</p>
                      <p className="text-gray-300 text-sm font-semibold">{selectedVehicle.categorie} · {selectedVehicle.couleur}</p>
                    </div>
                  </div>
                </div>
                <div className={`p-5 space-y-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  {[
                    { icon: 'bi-upc-scan',     label: 'N° Châssis',         value: selectedVehicle.numero_chassis || '—' },
                    { icon: 'bi-speedometer2', label: 'Kilométrage',         value: `${(selectedVehicle.kilometrage || 0).toLocaleString()} km` },
                    { icon: 'bi-people',       label: 'Nb. places',          value: selectedVehicle.nb_places || '—' },
                    { icon: 'bi-building',     label: 'Direction',           value: selectedVehicle.direction },
                    { icon: 'bi-geo-alt-fill', label: 'Ville',               value: selectedVehicle.ville || '—' }, // ← NOUVEAU dans le détail
                    { icon: 'bi-fuel-pump',    label: 'Carburant',           value: selectedVehicle.carburant || '—' },
                    { icon: 'bi-graph-up',     label: 'Conso. moy.',         value: selectedVehicle.consommation_moyenne ? `${selectedVehicle.consommation_moyenne} L/100` : '—' },
                    { icon: 'bi-wrench',       label: 'Km proch. vidange',   value: selectedVehicle.km_prochaine_vidange ? `${parseInt(selectedVehicle.km_prochaine_vidange).toLocaleString()} km` : '—' },
                    { icon: 'bi-calendar3',    label: "Date d'achat",        value: selectedVehicle.dateAchat ? new Date(selectedVehicle.dateAchat).toLocaleDateString('fr-FR') : '—' },
                    { icon: 'bi-cash-stack',   label: "Coût acquisition",    value: selectedVehicle.cout_acquisition ? `${selectedVehicle.cout_acquisition.toLocaleString()} CFA` : '—' },
                    { icon: 'bi-bank',         label: 'Valeur résiduelle',   value: selectedVehicle.valeur_residuelle ? `${selectedVehicle.valeur_residuelle.toLocaleString()} CFA` : '—' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <i className={`${item.icon} text-base w-5 text-center`} style={{ color: theme.primary }}></i>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</span>
                        <span className={`text-sm font-extrabold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-calendar-event text-orange-400"></i>Échéances importantes</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Assurance',        value: selectedVehicle.assuranceExpire ? new Date(selectedVehicle.assuranceExpire).toLocaleDateString('fr-FR') : '—', icon: 'bi-shield-check',    color: 'text-emerald-400' },
                      { label: 'Visite technique', value: selectedVehicle.visiteExpire    ? new Date(selectedVehicle.visiteExpire).toLocaleDateString('fr-FR')    : '—', icon: 'bi-clipboard-check', color: 'text-blue-400' },
                      { label: 'Instecteur', value: selectedVehicle.assuranceExpire    ? new Date(selectedVehicle.visiteExpire).toLocaleDateString('fr-FR')    : '—', icon: 'bi-clipboard-check', color: 'text-blue-400' },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-orange-50'}`}>
                        <div className="flex items-center gap-2"><i className={`${item.icon} text-lg ${item.color}`}></i><span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span></div>
                        <span className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Panneau droit */}
              <div className="flex flex-col overflow-hidden" style={{ width: '50%' }}>
                <div className={`flex gap-1 px-5 border-b flex-shrink-0 ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex-wrap`}>
                  {[{ key: 'general', label: 'Général', icon: 'bi-info-circle' }, { key: 'documents', label: 'Documents', icon: 'bi-file-earmark-text' }, { key: 'maintenance', label: 'Maintenance', icon: 'bi-tools' }, { key: 'missions', label: 'Missions', icon: 'bi-geo-alt' }, { key: 'statistiques', label: 'Stats', icon: 'bi-bar-chart' }].map(tab => (
                    <button key={tab.key} onClick={() => setDetailTab(tab.key)} className={`px-3 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${detailTab === tab.key ? 'border-transparent text-white' : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}`} style={detailTab === tab.key ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`, borderRadius: '8px 8px 0 0' } : {}}>
                      <i className={tab.icon}></i>{tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center h-full"><div className="text-center space-y-3"><div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div><p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chargement...</p></div></div>
                  ) : (
                    <>
                      {detailTab === 'general' && (
                        <div className="space-y-4">
                          {[
                            {
                              title: 'Informations véhicule', icon: 'bi-car-front', iconColor: 'text-blue-500', bg: darkMode ? 'bg-gray-800' : 'bg-blue-50',
                              fields: [
                                ['Immatriculation', selectedVehicle.immatriculation],
                                ['N° Châssis', selectedVehicle.numero_chassis || '—'],
                                ['Marque', selectedVehicle.marque],
                                ['Modèle', selectedVehicle.modele],
                                ['Catégorie', selectedVehicle.categorie],
                                ['Année', selectedVehicle.annee],
                                ['Couleur', selectedVehicle.couleur || '—'],
                                ['Carburant', selectedVehicle.carburant || '—'],
                                ['Nombre de places', selectedVehicle.nb_places || '—'],
                                ['Kilométrage', `${(selectedVehicle.kilometrage || 0).toLocaleString()} km`],
                                ['Conso. moy.', selectedVehicle.consommation_moyenne ? `${selectedVehicle.consommation_moyenne} L/100` : '—'],
                                ['Km proch. vidange', selectedVehicle.km_prochaine_vidange ? `${parseInt(selectedVehicle.km_prochaine_vidange).toLocaleString()} km` : '—'],

                              ],
                            },
                            {
                              title: 'Affectation', icon: 'bi-people', iconColor: 'text-purple-500', bg: darkMode ? 'bg-gray-800' : 'bg-purple-50',
                              fields: [
                                ['Direction', selectedVehicle.direction],
                                ['Ville', selectedVehicle.ville || '—'], // ← NOUVEAU dans l'onglet général
                                ['Statut', selectedVehicle.statut],
                              ],
                            },
                            {
                              title: 'Informations financières', icon: 'bi-currency-dollar', iconColor: 'text-green-500', bg: darkMode ? 'bg-gray-800' : 'bg-green-50',
                              fields: [
                                ["Date d'achat", selectedVehicle.dateAchat ? new Date(selectedVehicle.dateAchat).toLocaleDateString('fr-FR') : '—'],
                                ["Coût d'acquisition", selectedVehicle.cout_acquisition ? `${selectedVehicle.cout_acquisition.toLocaleString()} CFA` : '—'],
                                ['Valeur résiduelle', selectedVehicle.valeur_residuelle ? `${selectedVehicle.valeur_residuelle.toLocaleString()} CFA` : '—'],
                              ],
                            },
                          ].map((card, ci) => (
                            <div key={ci} className={`${card.bg} rounded-xl p-4`}>
                              <h3 className={`font-extrabold mb-3 flex items-center gap-2 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}><i className={`${card.icon} ${card.iconColor}`}></i>{card.title}</h3>
                              <div className="space-y-2">
                                {card.fields.map(([label, value], fi) => (
                                  <div key={fi} className="flex justify-between">
                                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
                                    <span className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {detailTab === 'documents' && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Documents du véhicule{vehicleDocuments.length > 0 && <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{vehicleDocuments.length}</span>}</h3>
                            <button onClick={() => setShowAddDocumentModal(true)} className="px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-plus-lg"></i>Ajouter</button>
                          </div>
                          <div className="space-y-3">
                            {vehicleDocuments.length === 0 ? (<div className="text-center py-12"><i className={`bi bi-file-earmark-x text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i><p className={`mt-3 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun document enregistré</p><button onClick={() => setShowAddDocumentModal(true)} className="mt-3 px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all inline-flex items-center gap-2" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-plus-lg"></i>Ajouter le premier document</button></div>)
                              : vehicleDocuments.map(doc => (
                                <div key={doc.id} className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4 flex items-center justify-between border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                  <div className="flex items-center gap-3 flex-1 min-w-0"><div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}><i className="bi bi-file-earmark-text text-lg text-blue-500"></i></div><div className="min-w-0"><p className={`font-extrabold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{doc.nom_document}</p><p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{doc.type_document} · Expire : {doc.date_expiration ? new Date(doc.date_expiration).toLocaleDateString('fr-FR') : '—'}</p></div></div>
                                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${doc.statut === 'valide' ? 'bg-green-100 text-green-700' : doc.statut === 'expire_bientot' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{doc.statut}</span>
                                    <button onClick={() => handleOpenDocument(doc)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'} transition-colors`} title="Ouvrir"><i className="bi bi-eye text-sm"></i></button>
                                    <button onClick={() => handleOpenEditDocument(doc)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-amber-900/40 text-amber-400 hover:text-amber-300' : 'hover:bg-amber-50 text-amber-500 hover:text-amber-700'} transition-colors`} title="Modifier"><i className="bi bi-pencil-square text-sm"></i></button>
                                    <button onClick={() => handleDeleteDocument(doc)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-500'} transition-colors`} title="Supprimer"><i className="bi bi-trash text-sm"></i></button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {detailTab === 'maintenance' && (
                        <div>
                          <h3 className={`font-extrabold text-sm mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Historique de maintenance</h3>
                          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} rounded-xl border overflow-hidden`}>
                            {vehicleMaintenances.length === 0 ? (<div className="text-center py-12"><i className={`bi bi-tools text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i><p className={`mt-3 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune maintenance enregistrée</p></div>)
                              : (<div className="overflow-x-auto"><table className="w-full"><thead><tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>{['Type', 'Date', 'Km', 'Coût', 'Statut'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wider text-white">{h}</th>))}</tr></thead><tbody>{vehicleMaintenances.map((m, idx) => (<tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? (darkMode ? '#0c1929' : '#e8eef6') : (darkMode ? '#162033' : '#f1f4f9') }}><td className={`px-4 py-3 text-sm font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{m.type_intervention}</td><td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{m.date_debut ? new Date(m.date_debut).toLocaleDateString('fr-FR') : '—'}</td><td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{m.km_au_moment_intervention?.toLocaleString() ?? '—'} km</td><td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{((m.cout_main_oeuvre || 0) + (m.cout_pieces || 0)).toLocaleString()} CFA</td><td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.statut === 'terminee' ? 'bg-green-100 text-green-700' : m.statut === 'planifiee' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{m.statut}</span></td></tr>))}</tbody></table></div>)}
                          </div>
                        </div>
                      )}

                      {detailTab === 'missions' && (
                        <div>
                          <h3 className={`font-extrabold text-sm mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Historique des missions</h3>
                          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} rounded-xl border overflow-hidden`}>
                            {vehicleMissions.length === 0 ? (<div className="text-center py-12"><i className={`bi bi-geo-alt text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i><p className={`mt-3 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune mission enregistrée</p></div>)
                              : (<div className="overflow-x-auto"><table className="w-full"><thead><tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>{['Destination', 'Départ', 'Retour', 'Statut'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wider text-white">{h}</th>))}</tr></thead><tbody>{vehicleMissions.map((m, idx) => (<tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? (darkMode ? '#0c1929' : '#e8eef6') : (darkMode ? '#162033' : '#f1f4f9') }}><td className={`px-4 py-3 text-sm font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{m.destination}</td><td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{m.date_depart_prevue ? new Date(m.date_depart_prevue).toLocaleDateString('fr-FR') : '—'}</td><td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{m.date_retour_reelle ? new Date(m.date_retour_reelle).toLocaleDateString('fr-FR') : '—'}</td><td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${m.statut === 'terminee' ? 'bg-green-100 text-green-700' : m.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{m.statut}</span></td></tr>))}</tbody></table></div>)}
                          </div>
                        </div>
                      )}

                      {detailTab === 'statistiques' && (
                        <div>
                          <h3 className={`font-extrabold mb-4 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Statistiques du véhicule</h3>
                          {vehicleStats ? (
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { label: 'Total missions',   value: vehicleStats.total_missions,                                    icon: 'bi-geo-alt-fill',   iconColor: 'text-blue-500',   iconBg: 'bg-blue-500/20',   bg: darkMode ? 'bg-gray-800' : 'bg-blue-50' },
                                { label: 'KM parcourus',     value: (vehicleStats.total_km || 0).toLocaleString(),                  icon: 'bi-speedometer2',   iconColor: 'text-green-500',  iconBg: 'bg-green-500/20',  bg: darkMode ? 'bg-gray-800' : 'bg-green-50' },
                                { label: 'Carburant total',  value: `${vehicleStats.total_litres || 0} L`,                          icon: 'bi-fuel-pump-fill', iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/20', bg: darkMode ? 'bg-gray-800' : 'bg-yellow-50' },
                                { label: 'Conso. moy.',      value: `${vehicleStats.consommation_moyenne || 0} L/100`,              icon: 'bi-graph-up',       iconColor: 'text-purple-500', iconBg: 'bg-purple-500/20', bg: darkMode ? 'bg-gray-800' : 'bg-purple-50' },
                                { label: 'Coût maintenance', value: `${(vehicleStats.cout_maintenance || 0).toLocaleString()} CFA`, icon: 'bi-tools',          iconColor: 'text-orange-500', iconBg: 'bg-orange-500/20', bg: darkMode ? 'bg-gray-800' : 'bg-orange-50' },
                                { label: 'Coût total',       value: `${(vehicleStats.cout_total || 0).toLocaleString()} CFA`,       icon: 'bi-cash-stack',     iconColor: 'text-red-500',    iconBg: 'bg-red-500/20',    bg: darkMode ? 'bg-gray-800' : 'bg-red-50' },
                              ].map((card, i) => (
                                <div key={i} className={`${card.bg} rounded-xl p-4`}>
                                  <div className="flex items-center justify-between">
                                    <div><p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p><p className={`text-xl font-extrabold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.value}</p></div>
                                    <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}><i className={`${card.icon} ${card.iconColor} text-lg`}></i></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (<div className="text-center py-12"><i className={`bi bi-bar-chart text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i><p className={`mt-3 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune statistique disponible</p></div>)}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className={`px-5 py-4 border-t flex-shrink-0 flex items-center justify-end gap-3 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <button onClick={() => { setShowDetailModal(false); openEditModal(selectedVehicle); }} className={`px-5 py-2.5 rounded-lg border text-sm font-bold flex items-center gap-2 ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} transition-colors`}><i className="bi bi-pencil"></i>Modifier</button>
                  <button onClick={() => setShowDetailModal(false)} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>Fermer</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL AJOUTER DOCUMENT ── */}
      {showAddDocumentModal && selectedVehicle && (
        <ModalAddDocument darkMode={darkMode} theme={theme} immatriculation={selectedVehicle.immatriculation} onClose={() => setShowAddDocumentModal(false)} onSuccess={onDocumentAdded} />
      )}

      {/* ── MODAL MODIFIER DOCUMENT ── */}
      {showEditDocumentModal && selectedVehicle && editingDocument && (
        <ModalEditDocument darkMode={darkMode} theme={theme} immatriculation={selectedVehicle.immatriculation} document={editingDocument} onClose={() => { setShowEditDocumentModal(false); setEditingDocument(null); }} onSuccess={onDocumentEdited} />
      )}
    </div>
  );
};

export default Vehicules;