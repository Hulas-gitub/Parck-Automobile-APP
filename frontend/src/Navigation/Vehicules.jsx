import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VehicleDetailModal from '../components/VehicleDetailModal';
import Swal from 'sweetalert2';
import HistoriqueAffectationsTab from './HistoriqueAffectations';
import XLSX from 'xlsx-js-style';
import { getFormStyles, getTableStyles, getCardStyles, getRowBackgroundColor, PageSkeleton } from '../utils/uniformStyles';

// ============================================================================
// VÉHICULES — branché sur le backend Laravel (axios)
// ─────────────────────────────────────────────────────────────────────────────
//  RAFRAÎCHISSEMENT (même principe que la page Demandes d'intervention) :
//  • Après chaque action (créer / modifier / supprimer / changer statut /
//    document ajouté-modifié-supprimé) :
//      1) l'interface est mise à jour IMMÉDIATEMENT (mise à jour locale)
//      2) un rechargement SILENCIEUX (sans skeleton, sans clignotement) est lancé
//         en arrière-plan EN MÊME TEMPS que l'affichage du SweetAlert
//      3) AUCUN window.location.reload()
//  • Le modal de détail d'un véhicule reste ouvert après une action (document,
//    modification…) et affiche les nouvelles données une fois le SweetAlert fermé.
//  • Le chargement avec skeleton n'a lieu qu'au 1er affichage ou quand on change
//    de filtre / de page.
// ============================================================================

// ============================================================================
// CONFIGURATION — URL DE BASE DU BACKEND LARAVEL
// ============================================================================
const LARAVEL_BASE_URL = import.meta.env.VITE_LARAVEL_URL;

const getStorageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/storage/')) return `${LARAVEL_BASE_URL}${path}`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${LARAVEL_BASE_URL}/storage/${cleanPath}`;
};

// ============================================================================
// RÔLES — le rôle DAAL est en LECTURE SEULE (voir + exporter uniquement)
// ============================================================================
const ROLE_DAAL = 'daal';

const getCurrentRoleCode = () => {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    return JSON.parse(stored)?.role?.code ?? null;
  } catch {
    return null;
  }
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
} from '../api/Admin-Axios/Vehicules-axios';

import { createSwal, showSuccess, showError, showConfirm, getSwalConfig, injectSwalStyles } from '../utils/walConfig';


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
// Champs exportés (Excel + PDF)
const VEHICLE_EXPORT_HEADERS = ['Immatriculation','N° Chassis','Marque','Modele','Categorie','Annee','Ville','Affectation','Responsable','Kilometrage','Statut','Direction','Carburant','Nb Places'];
const vehicleToExportRow = (v) => [
  v.immatriculation, v.numero_chassis || '-', v.marque, v.modele, v.categorie, v.annee,
  v.ville || '-', v.affectation || '-', v.responsable_du_vehicule || '-', v.kilometrage,
  v.statut, v.direction, v.carburant, v.nb_places || '-',
];

// Convertit une couleur du thème (#hex, #abc, rgb()) en RRGGBB pour Excel
const toExcelRgb = (color, fallback = '4F46E5') => {
  if (typeof color !== 'string') return fallback;
  let c = color.trim();
  const m = c.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) return [m[1], m[2], m[3]].map(n => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase();
  c = c.replace('#', '');
  if (/^[0-9a-f]{3}$/i.test(c)) c = c.split('').map(x => x + x).join('');
  return /^[0-9a-f]{6}$/i.test(c) ? c.toUpperCase() : fallback;
};

const exportToExcel = (data, filename, headers, headerColor, sheetName = 'Véhicules') => {
  const color  = toExcelRgb(headerColor);
  const line   = { style: 'thin', color: { rgb: 'D1D5DB' } };
  const border = { top: line, bottom: line, left: line, right: line };

  const headerRow = headers.map(h => ({
    v: h, t: 's',
    s: {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: color } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border,
    },
  }));

  const bodyRows = data.map((row, ri) => row.map(c => {
    const style = { border, alignment: { vertical: 'center' } };
    if (ri % 2 === 1) style.fill = { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } };
    return { v: c ?? '', t: typeof c === 'number' ? 'n' : 's', s: style };
  }));

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);

  // Largeur des colonnes adaptée au contenu
  ws['!cols'] = headers.map((h, i) => ({
    wch: Math.min(40, Math.max(String(h).length, ...data.map(r => String(r[i] ?? '').length)) + 3),
  }));
  ws['!rows'] = [{ hpt: 26 }];
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length, c: headers.length - 1 } }) };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, String(sheetName).replace(/[\\/:*?\[\]]/g, '_').slice(0, 31));
  XLSX.writeFile(wb, `${String(filename).replace(/[\\/:*?"<>|]/g, '_')}.xlsx`);
};

// ============================================================================
// EXPORT PDF
// ============================================================================
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
const HorizontalBarChart = ({ data, colors, darkMode, title, theme }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [hovered, setHovered] = useState(null);

  const exportCSV = () => {
    exportToExcel(data.map(d => [d.name, d.value]), title, ['Element', 'Valeur'], theme?.primary, 'Données');
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
        <button onClick={exportCSV} className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} title="Exporter en Excel"><i className="bi bi-file-earmark-spreadsheet text-emerald-500"></i></button>
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

  const vHeaders = VEHICLE_EXPORT_HEADERS;
  const vToRow   = vehicleToExportRow;

  const exportAll = async (format) => {
    setExporting(true);
    try {
      const allVehicles = await fetchAllVehicles();
      const rows = allVehicles.map(vToRow);
      if (format === 'excel') exportToExcel(rows, 'Vehicules_Tous', vHeaders, theme?.primary);
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
      const label = { marque: 'Marque', categorie: 'Categorie', modele: 'Modele', statut: 'Statut', ville: 'Ville' }[groupKey];
      Object.entries(groups).forEach(([name, list]) => {
        const rows = list.map(vToRow);
        if (format === 'excel') exportToExcel(rows, `Vehicules_${label}_${name}`, vHeaders, theme?.primary, name);
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
          <button onClick={() => exportAll('excel')} disabled={exporting} className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}><i className="bi bi-file-earmark-spreadsheet text-green-500"></i> Exporter tout en Excel</button>
          <button onClick={() => exportAll('pdf')} disabled={exporting} className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}><i className="bi bi-file-earmark-pdf text-red-500"></i> Exporter tout en PDF</button>
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
const TableExportButton = ({ fetchAllVehicles, darkMode, theme }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const allVehicles = await fetchAllVehicles();
      const rows = allVehicles.map(vehicleToExportRow);
      exportToExcel(rows, 'Tableau_Vehicules_Tous', VEHICLE_EXPORT_HEADERS, theme?.primary);
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
  <tr>{Array.from({ length: 8 }).map((_, i) => (<td key={i} className="px-5 py-4"><div className={`h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div></td>))}</tr>
);

// ============================================================================
// ROW ACTIONS — MENU TROIS POINTS
// canWrite = false (rôle DAAL) → seul "Voir détails" est disponible
// ============================================================================
const RowActionsMenu = ({ vehicle, darkMode, theme, onView, onEdit, onDelete, canWrite = true }) => {
  const [open, setOpen]         = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const buttonRef = useRef(null);
  const menuRef   = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
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
      const menuWidth = 180;
      const menuHeight = canWrite ? 140 : 60;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove  = spaceBelow < menuHeight && rect.top > menuHeight;
      setMenuStyle({
        position: 'fixed',
        top:  showAbove ? rect.top - (canWrite ? 120 : 50) : rect.bottom + 4,
        left: Math.max(8, rect.right - menuWidth),
        zIndex: 99999,
        width: menuWidth,
      });
    }
  }, [open, canWrite]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`p-2 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        title="Actions"
        type="button"
      >
        <i className="bi bi-three-dots-vertical"></i>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className={`rounded-xl shadow-2xl border py-1 overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={menuStyle}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onView(vehicle); }}
            className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 transition-colors ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'}`}
            type="button"
          >
            <i className="bi bi-eye text-blue-500"></i> Voir détails
          </button>
          {canWrite && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(vehicle); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 transition-colors ${darkMode ? 'text-amber-400 hover:bg-gray-700' : 'text-amber-600 hover:bg-amber-50'}`}
                type="button"
              >
                <i className="bi bi-pencil text-amber-500"></i> Modifier
              </button>
              <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(vehicle); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 transition-colors ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}
                type="button"
              >
                <i className="bi bi-trash text-red-500"></i> Supprimer
              </button>
            </>
          )}
        </div>,
        document.body
      )}
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
// MODAL — AJOUTER UN DOCUMENT
// (onSuccess est appelé APRÈS la fermeture de ce modal ; le modal de détail
//  du véhicule reste ouvert derrière et se met à jour)
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

  const { inputClass: inputCls, labelClass } = getFormStyles(darkMode);

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

  const { inputClass: inputCls, labelClass } = getFormStyles(darkMode);

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
// MAIN COMPONENT
// ============================================================================
const Vehicules = () => {
  const { theme } = useTheme();

  // ── RÔLE UTILISATEUR ─────────────────────────────────────────────────────
  // DAAL = lecture seule : il peut voir et exporter, rien d'autre.
  // Tant que le rôle n'est pas connu (null), on masque aussi les boutons d'écriture.
  const [userRole, setUserRole] = useState(getCurrentRoleCode);
  useEffect(() => {
    const sync = () => {
      const code = getCurrentRoleCode();
      setUserRole(prev => (prev === code ? prev : code));
    };
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, []);
  const isDaal   = userRole === ROLE_DAAL;
  const canWrite = userRole !== null && !isDaal;

  useEffect(() => {
    injectSwalStyles(theme);
  }, [theme]);

  const [darkMode, setDarkMode] = useState(() => {
    try { const saved = localStorage.getItem('fleetify_darkMode'); return saved !== null ? saved === 'true' : true; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);
  const [activeTab, setActiveTab] = useState('vehicules');
  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [animateCards, setAnimateCards]           = useState(false);
  const navigate = useNavigate();

  // Sécurité : si un DAAL se retrouve sur l'onglet affectations, on le ramène aux véhicules
  useEffect(() => {
    if (!canWrite && activeTab === 'affectations') setActiveTab('vehicules');
  }, [canWrite, activeTab]);

  // ── États données backend ──
  const [vehicles, setVehicles]           = useState([]);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [loading, setLoading]             = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [customCategories, setCustomCategories]     = useState([]);
  const [customMarques, setCustomMarques]           = useState([]);
  const [customModeles, setCustomModeles]           = useState({});
  const [customAnnees, setCustomAnnees]             = useState([]);
  const [directions, setDirections]                 = useState([]);
  // ── liste des affectations depuis la table affectations ──
  const [affectations, setAffectations]             = useState([]);  // [{ id, nom, code, description }]
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
  const [filterVille, setFilterVille]         = useState('');
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
  const statuts = ['Disponible', 'En Mission', 'Maintenance', 'Immobilisation longue','Immobilisation courte', 'En réparation','Hors Service', 'Vendu'];

  // ── formData : affectation_id (FK) + responsable_du_vehicule ──
  const [formData, setFormData] = useState({
    immatriculation: '', marque: '', modele: '', categorie: '', annee: new Date().getFullYear(),
    numero_chassis: '', kilometrage: 0, nb_places: 5, statut: 'Disponible',
    direction: '', ville: '', carburant: 'Diesel', couleur: '', dateAchat: '',
    cout_acquisition: 0, valeur_residuelle: '', consommation_moyenne: '',
    km_prochaine_vidange: '', km_prochaine_revision: '', assuranceExpire: '', visiteExpire: '',
    affectation_id: '',            // ← FK vers la table affectations
    responsable_du_vehicule: '',
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CHARGEMENTS (avec mode SILENCIEUX)
  //  • load(false) → chargement avec skeleton (1er affichage, changement de filtre/page)
  //  • load(true)  → rechargement SILENCIEUX : aucun skeleton, aucun clignotement ;
  //                  les nouvelles données remplacent simplement les anciennes.
  // reqIdRef évite qu'une réponse ancienne (plus lente) écrase une réponse plus récente.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Références (catégories, marques, modèles, directions, années, affectations) ──
  const loadReferences = useCallback(async () => {
    try {
      const data = await getReferences();
      setCustomCategories(data.categories.map(c => c.nom));
      setCustomMarques(data.marques.map(m => m.nom));
      const modelesMap = {};
      data.modeles.forEach(mo => { if (!modelesMap[mo.marque_nom]) modelesMap[mo.marque_nom] = []; modelesMap[mo.marque_nom].push(mo.nom); });
      setCustomModeles(modelesMap);
      setRawModeles(data.modeles);
      setDirections(data.directions.map(d => d.nom));
      setCustomAnnees(data.annees.map(a => a.annee));
      // ── Affectations depuis la table ──────────────────────────────────────
      setAffectations(data.affectations ?? []);
      // ─────────────────────────────────────────────────────────────────────
      const catIds = {}; data.categories.forEach(c => { catIds[c.nom] = c.id; });
      const mrqIds = {}; data.marques.forEach(m => { mrqIds[m.nom] = m.id; });
      const modIds = {}; data.modeles.forEach(mo => { modIds[mo.nom] = mo.id; });
      const annIds = {}; data.annees.forEach(a => { annIds[a.annee] = a.id; });
      setReferencesIds({ categories: catIds, marques: mrqIds, modeles: modIds, annees: annIds });
    } catch (err) { console.error('Erreur chargement références :', err); }
  }, []);
  useEffect(() => { loadReferences(); }, [loadReferences]);

  // ── Véhicules (liste paginée) ──
  const reqIdRef = useRef(0);
  const fetchVehicules = useCallback(async (silent = false) => {
    const myId = ++reqIdRef.current;
    if (!silent) setLoading(true);
    try {
      const data = await getVehicules({
        search:    searchTerm      || undefined,
        categorie: filterCategorie || undefined,
        marque:    filterMarque    || undefined,
        modele:    filterModele    || undefined,
        statut:    filterStatut    || undefined,
        ville:     filterVille     || undefined,
        page:      currentPage,
        per_page:  itemsPerPage,
      });
      if (myId !== reqIdRef.current) return;      // une requête plus récente est déjà passée
      const list = data.data ?? data;
      setVehicles(list);
      setTotalVehicles(data.total ?? list.length);
      setTotalPages(data.last_page ?? Math.ceil((data.total ?? list.length) / itemsPerPage));
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      // en mode silencieux : on garde simplement l'affichage actuel, sans message d'erreur
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }, [searchTerm, filterCategorie, filterMarque, filterModele, filterStatut, filterVille, currentPage, navigate]);

  // Chargement avec skeleton : 1er affichage + changement de filtre / page
  useEffect(() => { fetchVehicules(); }, [fetchVehicules]);

  useEffect(() => {
    if (loading) return;
    setAnimateCards(false);
    const id = requestAnimationFrame(() => { const id2 = requestAnimationFrame(() => setAnimateCards(true)); return () => cancelAnimationFrame(id2); });
    return () => cancelAnimationFrame(id);
  }, [loading]);

  // ── Villes disponibles ──
  const [availableVilles, setAvailableVilles] = useState([]);
  const loadVilles = useCallback(async () => {
    try {
      const data = await getVehicules({ per_page: 10000 });
      const allVehicles = data.data ?? data;
      const villes = [...new Set(allVehicles.map(v => v.ville).filter(Boolean))].sort();
      setAvailableVilles(villes);
    } catch {}
  }, []);
  useEffect(() => { loadVilles(); }, [loadVilles]);

  // Toujours la dernière version de fetchVehicules (évite une fermeture périmée dans les handlers)
  const fetchRef = useRef(fetchVehicules);
  fetchRef.current = fetchVehicules;

  // Rechargement silencieux en arrière-plan (véhicules + villes + références).
  // Volontairement NON attendu : il tourne pendant que le SweetAlert est affiché.
  const refreshSilent = useCallback(() => {
    fetchRef.current(true);
    loadVilles();
    loadReferences();
  }, [loadVilles, loadReferences]);

  // Si, après un rechargement/suppression, la page courante n'existe plus → dernière page valide
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // Le véhicule affiché dans le modal de détail / d'édition reste synchronisé
  // avec la liste rechargée (nouvelles données visibles sans fermer le modal).
  useEffect(() => {
    setSelectedVehicle(sv => {
      if (!sv) return sv;
      const fresh = vehicles.find(v => v.immatriculation === sv.immatriculation);
      return fresh && fresh !== sv ? fresh : sv;
    });
  }, [vehicles]);

  // ── Récupérer TOUS les véhicules pour l'export ──
  const fetchAllVehicles = useCallback(async () => {
    try {
      const data = await getVehicules({ search: searchTerm || undefined, categorie: filterCategorie || undefined, marque: filterMarque || undefined, modele: filterModele || undefined, statut: filterStatut || undefined, ville: filterVille || undefined, page: 1, per_page: 10000 });
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

  // Rechargement SILENCIEUX des documents du véhicule ouvert (aucun spinner dans le modal)
  const reloadDocumentsSilent = useCallback(async (immatriculation) => {
    if (!immatriculation) return;
    try {
      const docs = await getDocumentsVehicule(immatriculation);
      setVehicleDocuments(docs ?? []);
    } catch {}
  }, []);

  // ── Gestion image ──
  const handleImageChange = (e) => { const file = e.target.files[0]; if (!file) return; setImageFile(file); const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result); reader.readAsDataURL(file); };
  const resetImageState = () => { setImageFile(null); setImagePreview(''); };

  // ── CRUD Véhicules ──
  // Ordre pour chaque action réussie :
  //   1) mise à jour locale immédiate
  //   2) rechargement silencieux lancé en arrière-plan (refreshSilent)
  //   3) SweetAlert affiché dans la foulée → les deux se produisent EN MÊME TEMPS
  const handleAddVehicle = async () => {
    if (!canWrite) return;
    if (!formData.immatriculation || !formData.marque || !formData.modele || !formData.categorie || !formData.direction) {
      showError(darkMode, theme, 'Champs requis', 'Veuillez remplir tous les champs obligatoires.', 'warning'); return;
    }
    setSubmitting(true);
    try {
      // On envoie affectation_id (la FK), pas le libellé texte
      const payload = { ...formData };
      if (!payload.affectation_id) delete payload.affectation_id;
      if (imageFile) payload.image = imageFile;
      await createVehicule(payload);
      setShowAddModal(false);
      resetForm();
      refreshSilent();
      showSuccess(darkMode, theme, 'Véhicule ajouté', 'Le véhicule a été ajouté avec succès.');
    } catch (err) {
      const errors = err.response?.data?.errors;
      showError(darkMode, theme, 'Erreur', errors ? Object.values(errors).flat().join('\n') : (err.response?.data?.message || "Erreur lors de l'ajout du véhicule."));
    } finally { setSubmitting(false); }
  };

  const handleEditVehicle = async () => {
    if (!canWrite) return;
    if (!selectedVehicle) return;
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (imageFile) payload.image = imageFile;
      await updateVehicule(selectedVehicle.immatriculation, payload);
      setShowEditModal(false);
      // Si le modal de détail est ouvert derrière, il reste affiché (et se met à jour)
      if (!showDetailModal) setSelectedVehicle(null);
      resetForm();
      refreshSilent();
      showSuccess(darkMode, theme, 'Véhicule modifié', 'Les modifications ont été enregistrées.');
    } catch (err) {
      const errors = err.response?.data?.errors;
      showError(darkMode, theme, 'Erreur', errors ? Object.values(errors).flat().join('\n') : (err.response?.data?.message || 'Erreur lors de la modification.'));
    } finally { setSubmitting(false); }
  };

  const handleDeleteVehicle = async (vehicle) => {
    if (!canWrite) return;
    const result = await showConfirm(darkMode, theme, { title: 'Confirmer la suppression', html: `Êtes-vous sûr de vouloir supprimer le véhicule <strong>${vehicle.immatriculation}</strong> (${vehicle.marque} ${vehicle.modele}) ?<br/><small style="color:#9ca3af">Cette action est irréversible.</small>`, confirmText: '<i class="bi bi-trash" style="margin-right:6px"></i>Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try {
      await deleteVehicule(vehicle.immatriculation);
      setVehicles(prev => prev.filter(v => v.immatriculation !== vehicle.immatriculation));   // 1) disparition immédiate
      setTotalVehicles(t => Math.max(0, t - 1));
      refreshSilent();                                                                         // 2) resynchronisation silencieuse
      showSuccess(darkMode, theme, 'Supprimé', `Le véhicule ${vehicle.immatriculation} a été supprimé.`); // 3) alerte
    }
    catch (err) {
      refreshSilent();
      showError(darkMode, theme, 'Erreur', err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleChangeStatut = async (vehicle, newStatut) => {
    if (!canWrite) return;
    const result = await showConfirm(darkMode, theme, { title: 'Changer le statut', html: `Passer <strong>${vehicle.immatriculation}</strong> en <strong style="color:${theme.primary}">${newStatut}</strong> ?`, confirmText: 'Confirmer', isDanger: false });
    if (!result.isConfirmed) return;
    try {
      await updateStatutVehicule(vehicle.immatriculation, newStatut);
      // 1) affichage immédiat du nouveau statut
      setVehicles(prev => prev.map(v => v.immatriculation === vehicle.immatriculation ? { ...v, statut: newStatut } : v));
      setSelectedVehicle(sv => (sv && sv.immatriculation === vehicle.immatriculation ? { ...sv, statut: newStatut } : sv));
      refreshSilent();                                                                         // 2) resynchronisation silencieuse
      showSuccess(darkMode, theme, 'Statut mis à jour', `Le véhicule est maintenant "${newStatut}".`); // 3) alerte
    }
    catch {
      refreshSilent();
      showError(darkMode, theme, 'Erreur', 'Erreur lors du changement de statut.');
    }
  };

  // ── CRUD Références ──
  const handleAddCategory = async () => {
    if (!canWrite) return;
    if (!newCategory.trim()) return;
    if (customCategories.includes(newCategory.trim())) { showError(darkMode, theme, 'Doublon', 'Cette catégorie existe déjà.', 'warning'); return; }
    try { const res = await createCategorie(newCategory.trim()); setCustomCategories(prev => [...prev, newCategory.trim()]); setReferencesIds(prev => ({ ...prev, categories: { ...prev.categories, [newCategory.trim()]: res.id } })); setNewCategory(''); refreshSilent(); showSuccess(darkMode, theme, 'Catégorie ajoutée', `La catégorie "${newCategory.trim()}" a été créée.`); }
    catch { showError(darkMode, theme, 'Erreur', "Erreur lors de l'ajout de la catégorie."); }
  };

  const handleDeleteCategory = async (category) => {
    if (!canWrite) return;
    const id = referencesIds.categories[category]; if (!id) return;
    const result = await showConfirm(darkMode, theme, { title: 'Supprimer la catégorie ?', html: `La catégorie "${category}" sera supprimée.`, confirmText: 'Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteCategorie(id); setCustomCategories(prev => prev.filter(c => c !== category)); refreshSilent(); showSuccess(darkMode, theme, 'Supprimée', `La catégorie "${category}" a été supprimée.`); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors de la suppression.'); }
  };

  const handleAddMarque = async () => {
    if (!canWrite) return;
    if (!newMarque.trim()) return;
    if (customMarques.includes(newMarque.trim())) { showError(darkMode, theme, 'Doublon', 'Cette marque existe déjà.', 'warning'); return; }
    try { const res = await createMarque(newMarque.trim()); setCustomMarques(prev => [...prev, newMarque.trim()]); setCustomModeles(prev => ({ ...prev, [newMarque.trim()]: [] })); setReferencesIds(prev => ({ ...prev, marques: { ...prev.marques, [newMarque.trim()]: res.id } })); setNewMarque(''); refreshSilent(); showSuccess(darkMode, theme, 'Marque ajoutée', `La marque "${newMarque.trim()}" a été créée.`); }
    catch { showError(darkMode, theme, 'Erreur', "Erreur lors de l'ajout de la marque."); }
  };

  const handleDeleteMarque = async (marque) => {
    if (!canWrite) return;
    const id = referencesIds.marques[marque]; if (!id) return;
    const result = await showConfirm(darkMode, theme, { title: 'Supprimer la marque ?', html: `La marque "${marque}" et ses modèles associés seront supprimés.`, confirmText: 'Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteMarque(id); setCustomMarques(prev => prev.filter(m => m !== marque)); setCustomModeles(prev => { const n = { ...prev }; delete n[marque]; return n; }); refreshSilent(); showSuccess(darkMode, theme, 'Supprimée', `La marque "${marque}" a été supprimée.`); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors de la suppression.'); }
  };

  const handleAddModele = async () => {
    if (!canWrite) return;
    if (!selectedMarqueForModel || !newModele.trim() || !selectedCategorieForModel) { showError(darkMode, theme, 'Champs requis', 'Veuillez sélectionner une marque, une catégorie et saisir un nom de modèle.', 'warning'); return; }
    if (customModeles[selectedMarqueForModel]?.includes(newModele.trim())) { showError(darkMode, theme, 'Doublon', 'Ce modèle existe déjà pour cette marque.', 'warning'); return; }
    const marqueId = referencesIds.marques[selectedMarqueForModel];
    const categorieId = referencesIds.categories[selectedCategorieForModel];
    if (!marqueId || !categorieId) return;
    try { const res = await createModele({ marque_id: marqueId, categorie_id: categorieId, nom: newModele.trim() }); setCustomModeles(prev => ({ ...prev, [selectedMarqueForModel]: [...(prev[selectedMarqueForModel] || []), newModele.trim()] })); setReferencesIds(prev => ({ ...prev, modeles: { ...prev.modeles, [newModele.trim()]: res.id } })); setRawModeles(prev => [...prev, { id: res.id, nom: newModele.trim(), marque_id: marqueId, marque_nom: selectedMarqueForModel, categorie_id: categorieId }]); setNewModele(''); refreshSilent(); showSuccess(darkMode, theme, 'Modèle ajouté', `Le modèle "${newModele.trim()}" a été créé.`); }
    catch (err) { const msg = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join('\n') : "Erreur lors de l'ajout du modèle."; showError(darkMode, theme, 'Erreur', msg); }
  };

  const handleDeleteModele = async (marque, modele) => {
    if (!canWrite) return;
    const id = referencesIds.modeles[modele]; if (!id) return;
    const result = await showConfirm(darkMode, theme, { title: 'Supprimer le modèle ?', html: `Le modèle "${modele}" sera supprimé.`, confirmText: 'Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteModele(id); setCustomModeles(prev => ({ ...prev, [marque]: prev[marque].filter(m => m !== modele) })); setRawModeles(prev => prev.filter(m => m.id !== id)); refreshSilent(); showSuccess(darkMode, theme, 'Supprimé', `Le modèle "${modele}" a été supprimé.`); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors de la suppression.'); }
  };

  const handleAddAnnee = async () => {
    if (!canWrite) return;
    const anneeNum = parseInt(newAnnee);
    if (!anneeNum || anneeNum < 1900 || anneeNum > 2100) { showError(darkMode, theme, 'Valeur invalide', 'Veuillez saisir une année valide (1900–2100).', 'warning'); return; }
    if (customAnnees.includes(anneeNum)) { showError(darkMode, theme, 'Doublon', 'Cette année existe déjà.', 'warning'); return; }
    try { const res = await createAnnee(anneeNum); setCustomAnnees(prev => [anneeNum, ...prev].sort((a, b) => b - a)); setReferencesIds(prev => ({ ...prev, annees: { ...prev.annees, [anneeNum]: res.id } })); setNewAnnee(''); refreshSilent(); showSuccess(darkMode, theme, 'Année ajoutée', `L'année ${anneeNum} a été ajoutée.`); }
    catch { showError(darkMode, theme, 'Erreur', "Erreur lors de l'ajout de l'année."); }
  };

  const handleDeleteAnnee = async (annee) => {
    if (!canWrite) return;
    const id = referencesIds.annees[annee]; if (!id) return;
    const result = await showConfirm(darkMode, theme, { title: "Désactiver l'année ?", html: `L'année ${annee} sera désactivée.`, confirmText: 'Désactiver', isDanger: true });
    if (!result.isConfirmed) return;
    try { await deleteAnnee(id); setCustomAnnees(prev => prev.filter(a => a !== annee)); refreshSilent(); showSuccess(darkMode, theme, 'Désactivée', `L'année ${annee} a été désactivée.`); }
    catch { showError(darkMode, theme, 'Erreur', 'Erreur lors de la désactivation.'); }
  };

  // ── Handlers Documents ──
  // Le modal de détail du véhicule RESTE OUVERT : seuls la liste des documents et les
  // données du véhicule (échéances) sont rafraîchies en silence derrière le SweetAlert.
  // (ouvrir = lecture, autorisé pour tous les rôles)
  const handleOpenDocument = async (doc) => {
    try { if (doc.url_fichier) { window.open(getStorageUrl(doc.url_fichier), '_blank'); } else { const res = await openDocumentVehicule(selectedVehicle.immatriculation, doc.id); window.open(getStorageUrl(res.url), '_blank'); } }
    catch { showError(darkMode, theme, 'Erreur', "Impossible d'ouvrir le document."); }
  };

  const handleOpenEditDocument = (doc) => { if (!canWrite) return; setEditingDocument(doc); setShowEditDocumentModal(true); };

  const handleDeleteDocument = async (doc) => {
    if (!canWrite) return;
    const result = await showConfirm(darkMode, theme, { title: 'Supprimer le document ?', html: `"${doc.nom_document}" sera définitivement supprimé.`, confirmText: 'Supprimer', isDanger: true });
    if (!result.isConfirmed) return;
    try {
      await deleteDocumentVehicule(selectedVehicle.immatriculation, doc.id);
      setVehicleDocuments(prev => prev.filter(d => d.id !== doc.id));      // 1) disparition immédiate de la ligne
      reloadDocumentsSilent(selectedVehicle.immatriculation);               // 2) resynchronisation silencieuse (documents)
      refreshSilent();                                                      //    + véhicules (échéances assurance / visite…)
      showSuccess(darkMode, theme, 'Supprimé', 'Le document a été supprimé.'); // 3) alerte (le modal de détail reste affiché)
    }
    catch {
      reloadDocumentsSilent(selectedVehicle?.immatriculation);
      showError(darkMode, theme, 'Erreur', 'Erreur lors de la suppression du document.');
    }
  };

  const onDocumentAdded = useCallback(() => {
    reloadDocumentsSilent(selectedVehicle?.immatriculation);   // documents du modal de détail
    refreshSilent();                                           // véhicules (échéances…)
    showSuccess(darkMode, theme, 'Document ajouté', 'Le document a été enregistré avec succès.');
  }, [selectedVehicle, darkMode, theme, reloadDocumentsSilent, refreshSilent]);

  const onDocumentEdited = useCallback(() => {
    reloadDocumentsSilent(selectedVehicle?.immatriculation);
    refreshSilent();
    setEditingDocument(null);
    showSuccess(darkMode, theme, 'Document modifié', 'Les modifications ont été enregistrées.');
  }, [selectedVehicle, darkMode, theme, reloadDocumentsSilent, refreshSilent]);

  // ── Helpers modals ──
  const openEditModal = (vehicle) => {
    if (!canWrite) return;
    setSelectedVehicle(vehicle);
    setFormData({
      immatriculation:         vehicle.immatriculation,
      marque:                  vehicle.marque,
      modele:                  vehicle.modele,
      categorie:               vehicle.categorie,
      annee:                   vehicle.annee,
      numero_chassis:          vehicle.numero_chassis          || '',
      kilometrage:             vehicle.kilometrage,
      nb_places:               vehicle.nb_places               || 5,
      statut:                  vehicle.statut,
      direction:               vehicle.direction,
      ville:                   vehicle.ville                   || '',
      carburant:               vehicle.carburant,
      couleur:                 vehicle.couleur                 || '',
      dateAchat:               vehicle.dateAchat               || '',
      cout_acquisition:        vehicle.cout_acquisition        || 0,
      valeur_residuelle:       vehicle.valeur_residuelle       || '',
      consommation_moyenne:    vehicle.consommation_moyenne    || '',
      km_prochaine_vidange:    vehicle.km_prochaine_vidange    || '',
      km_prochaine_revision:   vehicle.km_prochaine_revision   || '',
      assuranceExpire:         vehicle.assuranceExpire         || '',
      visiteExpire:            vehicle.visiteExpire            || '',
      // On recharge l'id de l'affectation depuis la réponse API (affectation_id)
      affectation_id:          vehicle.affectation_id          ? String(vehicle.affectation_id) : '',
      responsable_du_vehicule: vehicle.responsable_du_vehicule || '',
    });
    resetImageState();
    setImagePreview(vehicle.image ? getStorageUrl(vehicle.image) : '');
    setShowEditModal(true);
  };

  // Fermeture du formulaire de modification : si le modal de détail est ouvert, il reste affiché
  const closeEditModal = () => {
    setShowEditModal(false);
    if (!showDetailModal) setSelectedVehicle(null);
    resetForm();
  };

  const openDetailModal = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailTab('general');
    setShowDetailModal(true);
    await loadDetailData(vehicle.immatriculation);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    if (!showEditModal) setSelectedVehicle(null);
  };

  const resetForm = () => {
    setFormData({
      immatriculation: '', marque: '', modele: '', categorie: '', annee: new Date().getFullYear(),
      numero_chassis: '', kilometrage: 0, nb_places: 5, statut: 'Disponible',
      direction: '', ville: '', carburant: 'Diesel', couleur: '', dateAchat: '',
      cout_acquisition: 0, valeur_residuelle: '', consommation_moyenne: '',
      km_prochaine_vidange: '', km_prochaine_revision: '', assuranceExpire: '', visiteExpire: '',
      affectation_id: '',
      responsable_du_vehicule: '',
    });
    resetImageState();
  };

  const resetFilters = () => { setFilterCategorie(''); setFilterMarque(''); setFilterModele(''); setFilterStatut(''); setFilterVille(''); setSearchTerm(''); setCurrentPage(1); };

  const getStatutColor = (statut) => ({ 'Disponible': 'bg-green-100 text-green-700', 'En Mission': 'bg-blue-100 text-blue-700', 'Maintenance': 'bg-orange-100 text-orange-700', 'Immobilisation longue': 'bg-red-100 text-red-700', 'Immobilisation courte': 'bg-red-100 text-red-700' }[statut] || 'bg-gray-100 text-gray-700');

  const availableModeles     = filterMarque ? customModeles[filterMarque] || [] : [];
  const formAvailableModeles = formData.marque ? customModeles[formData.marque] || [] : [];

  const statutData    = statuts.map(s => ({ name: s, value: vehicles.filter(v => v.statut === s).length }));
  const directionData = [...new Set(vehicles.map(v => v.direction).filter(Boolean))].map(d => ({ name: d, value: vehicles.filter(v => v.direction === d).length })).sort((a, b) => b.value - a.value);
  const villeData     = [...new Set(vehicles.map(v => v.ville).filter(Boolean))].map(vi => ({ name: vi, value: vehicles.filter(v => v.ville === vi).length })).sort((a, b) => b.value - a.value);

  const { inputClass: inputCls, labelClass } = getFormStyles(darkMode);

  const ImageUploadField = ({ label, preview, onClear }) => (
    <div className="col-span-2">
      <label className={labelClass}>{label}</label>
      <div className="flex items-start gap-4">
        {preview && (<div className="relative flex-shrink-0"><img src={preview} alt="Aperçu" className="w-20 h-20 rounded-lg object-cover border" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }} /><button type="button" onClick={onClear} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"><i className="bi bi-x"></i></button></div>)}
        <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${darkMode ? 'border-gray-600 hover:border-blue-500 bg-gray-800' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}><i className={`bi bi-image text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i><div><p className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{imageFile ? imageFile.name : 'Cliquer pour choisir une image'}</p><p className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>JPG, PNG, WEBP — max 10 Mo</p></div><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className="hidden" /></label>
      </div>
    </div>
  );

  // ── Formulaire véhicule — affectation en SELECT (menu déroulant depuis la table) ──
  const renderVehicleFormFields = (isEdit = false) => (
    <div className="grid grid-cols-2 gap-4">
      {/* Immatriculation */}
      <div>
        <label className={labelClass}>Immatriculation *</label>
        <input type="text" value={formData.immatriculation} readOnly={isEdit} placeholder="AB-1234-GA" onChange={e => !isEdit && setFormData({ ...formData, immatriculation: e.target.value })} className={`${inputCls} ${isEdit ? 'opacity-60' : ''}`} />
      </div>
      {/* N° Châssis */}
      <div>
        <label className={labelClass}>N° Châssis</label>
        <input type="text" value={formData.numero_chassis} placeholder="VIN / N° châssis" onChange={e => setFormData({ ...formData, numero_chassis: e.target.value })} className={inputCls} />
      </div>
      {/* Marque */}
      <div>
        <label className={labelClass}>Marque *</label>
        <select value={formData.marque} onChange={e => setFormData({ ...formData, marque: e.target.value, modele: '' })} className={inputCls}>
          <option value="">Sélectionner</option>
          {customMarques.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      {/* Modèle */}
      <div>
        <label className={labelClass}>Modèle *</label>
        <select value={formData.modele} onChange={e => setFormData({ ...formData, modele: e.target.value })} disabled={!formData.marque} className={`${inputCls} disabled:opacity-50`}>
          <option value="">Sélectionner</option>
          {formAvailableModeles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      {/* Catégorie */}
      <div>
        <label className={labelClass}>Catégorie *</label>
        <select value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })} className={inputCls}>
          <option value="">Sélectionner</option>
          {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {/* Direction */}
      <div>
        <label className={labelClass}>Direction *</label>
        <select value={formData.direction} onChange={e => setFormData({ ...formData, direction: e.target.value })} className={inputCls}>
          <option value="">Sélectionner</option>
          {directions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {/* Ville */}
      <div>
        <label className={labelClass}>Ville</label>
        <select
          value={formData.ville}
          onChange={e => setFormData({ ...formData, ville: e.target.value })}
          className={inputCls}
        >
          <option value="">-- SÉLECTIONNER UNE VILLE --</option>
          {/* Estuaire */}
          <option value="LIBREVILLE">LIBREVILLE</option>
          <option value="OWENDO">OWENDO</option>
          <option value="NTOUM">NTOUM</option>
          <option value="COCOBEACH">COCOBEACH</option>
          <option value="KANGO">KANGO</option>
          {/* Haut-Ogooué */}
          <option value="FRANCEVILLE">FRANCEVILLE</option>
          <option value="MOANDA">MOANDA</option>
          <option value="MOUYONDZI">MOUYONDZI</option>
          <option value="OKONDJA">OKONDJA</option>
          <option value="LEKONI">LEKONI</option>
          <option value="BONGOVILLE">BONGOVILLE</option>
          <option value="BAKOUMBA">BAKOUMBA</option>
          {/* Moyen-Ogooué */}
          <option value="LAMBARÉNÉ">LAMBARÉNÉ</option>
          <option value="NDJOLÉ">NDJOLÉ</option>
          {/* Ngounié */}
          <option value="MOUILA">MOUILA</option>
          <option value="FOUGAMOU">FOUGAMOU</option>
          <option value="NDENDÉ">NDENDÉ</option>
          <option value="LEBAMBA">LEBAMBA</option>
          <option value="MBIGOU">MBIGOU</option>
          <option value="MIMONGO">MIMONGO</option>
          <option value="MALINGA">MALINGA</option>
          {/* Nyanga */}
          <option value="TCHIBANGA">TCHIBANGA</option>
          <option value="MOABI">MOABI</option>
          <option value="MAYUMBA">MAYUMBA</option>
          <option value="GAMBA">GAMBA</option>
          {/* Ogooué-Ivindo */}
          <option value="MAKOKOU">MAKOKOU</option>
          <option value="BOOUÉ">BOOUÉ</option>
          <option value="MÉKAMBO">MÉKAMBO</option>
          <option value="MINVOUL">MINVOUL</option>
          {/* Ogooué-Lolo */}
          <option value="KOULAMOUTOU">KOULAMOUTOU</option>
          <option value="LASTOURSVILLE">LASTOURSVILLE</option>
          <option value="PANA">PANA</option>
          {/* Ogooué-Maritime */}
          <option value="PORT-GENTIL">PORT-GENTIL</option>
          <option value="OMBOUÉ">OMBOUÉ</option>
          <option value="MANDJI">MANDJI</option>
          {/* Woleu-Ntem */}
          <option value="OYEM">OYEM</option>
          <option value="BITAM">BITAM</option>
          <option value="MITZIC">MITZIC</option>
          <option value="MÉDOUNEU">MÉDOUNEU</option>
          <option value="EBOLOWA">EBOLOWA</option>
        </select>
      </div>
      {/* Année */}
      <div>
        <label className={labelClass}>Année</label>
        <select value={formData.annee} onChange={e => setFormData({ ...formData, annee: parseInt(e.target.value) || '' })} className={inputCls}>
          <option value="">Sélectionner</option>
          {customAnnees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* ── AFFECTATION — menu déroulant depuis la table affectations ── */}
      <div>
        <label className={labelClass}>Affectation</label>
        <select
          value={formData.affectation_id}
          onChange={e => setFormData({ ...formData, affectation_id: e.target.value })}
          className={inputCls}
        >
          <option value="">— Aucune affectation —</option>
          {affectations.map(aff => (
            <option key={aff.id} value={String(aff.id)}>
              {aff.code ? `${aff.code} — ${aff.nom}` : aff.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Responsable du véhicule */}
      <div>
        <label className={labelClass}>Responsable du véhicule</label>
        <input
          type="text"
          value={formData.responsable_du_vehicule}
          placeholder="Nom du responsable"
          maxLength={200}
          onChange={e => setFormData({ ...formData, responsable_du_vehicule: e.target.value })}
          className={inputCls}
        />
      </div>

      {/* Statut */}
      <div>
        <label className={labelClass}>Statut</label>
        <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value })} className={inputCls}>
          {statuts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {/* Carburant */}
      <div>
        <label className={labelClass}>Carburant</label>
        <select value={formData.carburant} onChange={e => setFormData({ ...formData, carburant: e.target.value })} className={inputCls}>
          {['Diesel', 'Essence', 'Hybride', 'Électrique'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {/* Nombre de places */}
      <div>
        <label className={labelClass}>Nombre de places</label>
        <input type="number" min="1" max="100" value={formData.nb_places} onChange={e => setFormData({ ...formData, nb_places: parseInt(e.target.value) || 5 })} className={inputCls} />
      </div>
      {/* Kilométrage */}
      <div>
        <label className={labelClass}>Kilométrage</label>
        <input type="number" min="0" value={formData.kilometrage} onChange={e => setFormData({ ...formData, kilometrage: parseInt(e.target.value) || 0 })} className={inputCls} />
      </div>
      {/* Couleur */}
      <div>
        <label className={labelClass}>Couleur</label>
        <input type="text" value={formData.couleur} placeholder="Ex: Blanc" onChange={e => setFormData({ ...formData, couleur: e.target.value })} className={inputCls} />
      </div>
      {/* Consommation */}
      <div>
        <label className={labelClass}>Consomation (L)</label>
        <input type="number" step="0.1" min="0" value={formData.consommation_moyenne} placeholder="Ex: 8.5" onChange={e => setFormData({ ...formData, consommation_moyenne: e.target.value })} className={inputCls} />
      </div>
      {/* Km prochaine vidange */}
      <div>
        <label className={labelClass}>Km proch. vidange</label>
        <input type="number" min="0" value={formData.km_prochaine_vidange} placeholder="Ex: 130000" onChange={e => setFormData({ ...formData, km_prochaine_vidange: e.target.value })} className={inputCls} />
      </div>
      {/* Date d'achat */}
      <div>
        <label className={labelClass}>Date d'achat</label>
        <input type="date" value={formData.dateAchat} onChange={e => setFormData({ ...formData, dateAchat: e.target.value })} className={inputCls} />
      </div>
      {/* Coût acquisition */}
      <div>
        <label className={labelClass}>Coût d'acquisition (CFA)</label>
        <input type="number" min="0" value={formData.cout_acquisition} onChange={e => setFormData({ ...formData, cout_acquisition: parseFloat(e.target.value) || 0 })} className={inputCls} />
      </div>
      {/* Photo */}
      <ImageUploadField label={isEdit ? 'Changer la photo du véhicule' : 'Photo du véhicule'} preview={imagePreview} onClear={resetImageState} />
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex flex-col transition-colors duration-300`}>
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
      <main className="flex-1 transition-all duration-300 pt-24 px-4 pb-6" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '16.25rem' }}>

        {activeTab === 'vehicules' && (
          <>
            {/* ── GRAPHIQUES ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {[
                { title: 'Véhicules par Statut',    data: statutData,    colors: ['#10b981','#3b82f6','#f59e0b','#ef4444'],                                delay: '0s' },
                { title: 'Véhicules par Direction', data: directionData, colors: ['#8b5cf6','#06b6d4','#f59e0b','#ef4444','#10b981','#3b82f6','#ec4899'], delay: '0.15s' },
                { title: 'Véhicules par Ville',     data: villeData,     colors: ['#f97316','#84cc16','#14b8a6','#a855f7','#fb7185','#38bdf8','#fbbf24'], delay: '0.3s' },
              ].map((chart, ci) => (
                <div key={ci} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5`} style={{ animation: animateCards ? `fadeInUp 0.5s ease-out ${chart.delay} both` : 'none' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
                    <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{chart.title}</h3>
                  </div>
                  {loading ? <div className={`h-32 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div> : <HorizontalBarChart theme={theme} data={chart.data} colors={chart.colors} darkMode={darkMode} title={chart.title.replace(/ /g, '_')} />}
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
                  {/* Filtre Ville */}
                  <select value={filterVille} onChange={(e) => { setFilterVille(e.target.value); setCurrentPage(1); }} className={`px-3 py-2 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
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
                  {/* Export : disponible pour tous les rôles (y compris DAAL) */}
                  <VehicleExportDropdown fetchAllVehicles={fetchAllVehicles} darkMode={darkMode} theme={theme} />

                  {/* Gestion filtres : masqué pour DAAL */}
                  {canWrite && (
                    <button onClick={() => setShowFilterManagement(true)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}><i className="bi bi-funnel"></i> Gestion filtres</button>
                  )}

                  <div className={`flex rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                    {['table', 'grid'].map((mode) => (
                      <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-2 transition-colors ${viewMode === mode ? 'text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`} style={viewMode === mode ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                        <i className={mode === 'table' ? 'bi bi-list-ul' : 'bi bi-grid-3x3-gap-fill'}></i>
                      </button>
                    ))}
                  </div>

                  {/* Ajouter un véhicule : masqué pour DAAL */}
                  {canWrite && (
                    <button onClick={() => setShowAddModal(true)} className="px-5 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 shadow-sm hover:opacity-90 hover:shadow-md transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                      <i className="bi bi-plus-lg"></i> Ajouter un véhicule
                    </button>
                  )}
                </div>

                {/* ── ONGLETS (onglet "Nouvelle Affectation" = ajout → masqué pour DAAL) ── */}
                {canWrite && (
                  <div className={`flex items-center gap-1 mb-6 p-1 rounded-xl border w-fit ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('vehicules')}
                      className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                        activeTab === 'vehicules'
                          ? 'text-white shadow-sm'
                          : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      style={activeTab === 'vehicules' ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
                    >
                      <i className="bi bi-car-front" /> Véhicules
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('affectations')}
                      className={`px-5 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                        activeTab === 'affectations'
                          ? 'text-white shadow-sm'
                          : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      style={activeTab === 'affectations' ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
                    >
                      <i className="bi bi-arrow-left-right" /> Nouvelle Affectation
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── TABLE VIEW ── */}
            {viewMode === 'table' && (
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
                <div className={`px-5 py-3 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <p className={`text-sm font-extrabold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}><i className="bi bi-list-ul mr-2"></i>{totalVehicles} véhicule(s)</p>
                  <TableExportButton fetchAllVehicles={fetchAllVehicles} darkMode={darkMode} theme={theme} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                        {['Véhicule', 'Catégorie', 'Direction', 'Ville', 'Affectation', 'Responsable', 'Statut', 'Kilométrage', 'Actions'].map((h, i) => (
                          <th key={i} className={`px-5 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-white ${i === 8 ? 'text-center' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonRow key={i} darkMode={darkMode} />)
                        : vehicles.length === 0
                          ? (<tr><td colSpan={9} className={`text-center py-16 font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}><i className="bi bi-car-front text-4xl block mb-2"></i>Aucun véhicule trouvé</td></tr>)
                          : vehicles.map((vehicle, rowIdx) => (
                              <tr key={vehicle.immatriculation} className="transition-all duration-200 hover:brightness-110"
                                style={{ backgroundColor: rowIdx % 2 === 0 ? (darkMode ? '#0c1929' : '#e8eef6') : (darkMode ? '#162033' : '#f1f4f9'), animation: animateCards ? `fadeInUp 0.4s ease-out ${rowIdx * 0.06}s both` : 'none' }}>
                                {/* Véhicule */}
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <StableImage src={vehicle.image} alt={`${vehicle.marque} ${vehicle.modele}`} className="w-11 h-11 rounded-lg shadow-sm" darkMode={darkMode} clickable={true} />
                                    <div>
                                      <p className={`font-extrabold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{vehicle.immatriculation}</p>
                                      <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{vehicle.marque} {vehicle.modele} · {vehicle.annee}</p>
                                    </div>
                                  </div>
                                </td>
                                {/* Catégorie */}
                                <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{vehicle.categorie}</td>
                                {/* Direction */}
                                <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{vehicle.direction}</td>
                                {/* Ville */}
                                <td className="px-5 py-4">
                                  {vehicle.ville
                                    ? <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-50 text-teal-700'}`}><i className="bi bi-geo-alt-fill text-[10px]"></i>{vehicle.ville}</span>
                                    : <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>—</span>}
                                </td>
                                {/* Affectation */}
                                <td className="px-5 py-4">
                                  {vehicle.affectation
                                    ? <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>{vehicle.affectation}</span>
                                    : <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>—</span>}
                                </td>
                                {/* Responsable */}
                                <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} max-w-[140px]`}>
                                  <span className="truncate block" title={vehicle.responsable_du_vehicule || ''}>
                                    {vehicle.responsable_du_vehicule || <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>—</span>}
                                  </span>
                                </td>
                                {/* Statut */}
                                <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatutColor(vehicle.statut)}`}>{vehicle.statut}</span></td>
                                {/* Kilométrage */}
                                <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{(vehicle.kilometrage || 0).toLocaleString()} km</td>
                                {/* Actions */}
                                <td className="px-5 py-4">
                                  <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                                    {/* Changer le statut : masqué pour DAAL */}
                                    {canWrite && (
                                      <StatusDropdown vehicle={vehicle} statuts={statuts} darkMode={darkMode} theme={theme} onChangeStatut={handleChangeStatut} />
                                    )}
                                    <RowActionsMenu vehicle={vehicle} darkMode={darkMode} theme={theme} onView={openDetailModal} onEdit={openEditModal} onDelete={handleDeleteVehicle} canWrite={canWrite} />
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
                  <TableExportButton fetchAllVehicles={fetchAllVehicles} darkMode={darkMode} theme={theme} />
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
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{vehicle.marque} {vehicle.modele} · {vehicle.annee}</p>
                              {(vehicle.affectation || vehicle.responsable_du_vehicule) && (
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {vehicle.affectation && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                                      <i className="bi bi-tag-fill mr-1 text-[9px]"></i>{vehicle.affectation}
                                    </span>
                                  )}
                                  {vehicle.responsable_du_vehicule && (
                                    <span className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      <i className="bi bi-person-fill mr-1"></i>{vehicle.responsable_du_vehicule}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className={`flex items-center justify-between text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`}>
                                <span><i className="bi bi-speedometer2 mr-1"></i>{(vehicle.kilometrage || 0).toLocaleString()} km</span>
                                <span><i className="bi bi-building mr-1"></i>{vehicle.direction}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => openDetailModal(vehicle)} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}><i className="bi bi-eye"></i> Détails</button>
                                {/* Modifier / Supprimer : masqués pour DAAL */}
                                {canWrite && (
                                  <>
                                    <button onClick={() => openEditModal(vehicle)} className="py-2 px-3 rounded-lg text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-pencil"></i></button>
                                    <button onClick={() => handleDeleteVehicle(vehicle)} className={`py-2 px-3 rounded-lg text-sm font-bold ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}><i className="bi bi-trash"></i></button>
                                  </>
                                )}
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
          </>
        )}

        {/* ── CONTENU ONGLET AFFECTATIONS (masqué pour DAAL) ── */}
        {canWrite && activeTab === 'affectations' && (
          <HistoriqueAffectationsTab
            darkMode={darkMode}
            theme={theme}
            onBack={() => setActiveTab('vehicules')}
          />
        )}

      </main>

      {/* ── FOOTER ── */}
      <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />

      {/* ── MODAL GESTION FILTRES (masqué pour DAAL) ── */}
      {canWrite && showFilterManagement && (
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

      {/* ── MODAL AJOUTER VÉHICULE (masqué pour DAAL) ── */}
      {canWrite && showAddModal && (
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

      {/* ── MODAL MODIFIER VÉHICULE (masqué pour DAAL) ──
          z-[55] : s'affiche AU-DESSUS du modal de détail (qui reste ouvert derrière) */}
      {canWrite && showEditModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[55] p-4">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between sticky top-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} z-10`}>
              <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}><i className="bi bi-pencil-square mr-2 text-blue-400"></i>Modifier — {selectedVehicle.immatriculation}</h2>
              <button onClick={closeEditModal} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}><i className="bi bi-x-lg text-lg"></i></button>
            </div>
            <div className="p-6">{renderVehicleFormFields(true)}</div>
            <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-end gap-3 sticky bottom-0 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <button onClick={closeEditModal} className={`px-5 py-2.5 rounded-lg border text-sm font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} transition-colors`}>Annuler</button>
              <button onClick={handleEditVehicle} disabled={submitting} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Enregistrement...</> : <><i className="bi bi-check-lg"></i>Enregistrer les modifications</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DÉTAIL VÉHICULE (Composant extrait) ── */}
      <VehicleDetailModal
        show={showDetailModal}
        vehicle={selectedVehicle}
        darkMode={darkMode}
        theme={theme}
        canWrite={canWrite}
        detailTab={detailTab}
        setDetailTab={setDetailTab}
        loadingDetail={loadingDetail}
        vehicleDocuments={vehicleDocuments}
        vehicleMaintenances={vehicleMaintenances}
        vehicleMissions={vehicleMissions}
        vehicleStats={vehicleStats}
        getStatutColor={getStatutColor}
        onClose={closeDetailModal}
        onOpenEdit={openEditModal}
        onAddDocument={() => setShowAddDocumentModal(true)}
        onOpenDocument={handleOpenDocument}
        onEditDocument={handleOpenEditDocument}
        onDeleteDocument={handleDeleteDocument}
        StableImage={StableImage}
      />

      {/* ── MODAL AJOUTER DOCUMENT (masqué pour DAAL) ── */}
      {canWrite && showAddDocumentModal && selectedVehicle && (
        <ModalAddDocument darkMode={darkMode} theme={theme} immatriculation={selectedVehicle.immatriculation} onClose={() => setShowAddDocumentModal(false)} onSuccess={onDocumentAdded} />
      )}

      {/* ── MODAL MODIFIER DOCUMENT (masqué pour DAAL) ── */}
      {canWrite && showEditDocumentModal && selectedVehicle && editingDocument && (
        <ModalEditDocument darkMode={darkMode} theme={theme} immatriculation={selectedVehicle.immatriculation} document={editingDocument} onClose={() => { setShowEditDocumentModal(false); setEditingDocument(null); }} onSuccess={onDocumentEdited} />
      )}
    </div>
  );
};

export default Vehicules;