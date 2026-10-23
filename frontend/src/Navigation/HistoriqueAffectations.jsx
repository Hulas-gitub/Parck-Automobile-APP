// ============================================================================
// HistoriqueAffectations.jsx
// Composant ONGLET (sans Sidebar / Header) — appelé depuis Vehicules.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
//  RAFRAÎCHISSEMENT (identique à la page « Demandes d'intervention »)
//  Après chaque action (créer / modifier / clôturer / supprimer) :
//    1) l'interface est mise à jour IMMÉDIATEMENT (mise à jour locale)
//    2) un rechargement SILENCIEUX (sans skeleton, sans clignotement) est lancé en
//       arrière-plan EN MÊME TEMPS que l'affichage du SweetAlert
//       → liste, KPI, graphiques et références sont à jour derrière l'alerte,
//         sans que la page ne « recharge » visuellement.
//  • Skeletons : uniquement au chargement initial et lors d'un changement de
//    filtre / de page (jamais après une action).
//  • reqId : une réponse ancienne (plus lente) n'écrase jamais une plus récente.
// ============================================================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';
import { getTableStyles, getRowBackgroundColor, PageSkeleton } from '../utils/uniformStyles';

import {
  getHistoriqueAffectations,
  createHistoriqueAffectation,
  updateHistoriqueAffectation,
  cloturerHistoriqueAffectation,
  deleteHistoriqueAffectation,
  getReferencesHistorique,
  getStatsHistoriqueAffectations,
} from '../api/Admin-Axios/HistoriqueAffectation-axios';

// ============================================================================
// SWEETALERT2 — HELPERS THÉMÉS (identiques aux autres pages)
// ============================================================================
const createSwal = (darkMode, theme) =>
  Swal.mixin({
    customClass: {
      popup:         darkMode ? 'swal-dark-popup'  : 'swal-light-popup',
      title:         darkMode ? 'swal-dark-title'  : 'swal-light-title',
      htmlContainer: darkMode ? 'swal-dark-html'   : 'swal-light-html',
      confirmButton: 'swal-confirm-btn',
      cancelButton:  'swal-cancel-btn',
    },
    background:         darkMode ? '#111827' : '#ffffff',
    color:              darkMode ? '#f9fafb' : '#111827',
    confirmButtonColor: theme?.primary,
    cancelButtonColor:  darkMode ? '#374151' : '#e5e7eb',
    buttonsStyling: false,
  });

const buildSwalStyles = (theme) => `
  .swal-dark-popup  { background: #111827 !important; border: 1px solid #374151 !important; border-radius: 16px !important; box-shadow: 0 25px 50px rgba(0,0,0,0.6) !important; }
  .swal-light-popup { background: #ffffff !important; border: 1px solid #e5e7eb !important; border-radius: 16px !important; box-shadow: 0 25px 50px rgba(0,0,0,0.15) !important; }
  .swal-dark-title  { color: #f9fafb !important; font-weight: 800 !important; font-size: 18px !important; }
  .swal-light-title { color: #111827 !important; font-weight: 800 !important; font-size: 18px !important; }
  .swal-dark-html   { color: #9ca3af !important; font-size: 15px !important; }
  .swal-light-html  { color: #6b7280 !important; font-size: 15px !important; }
  .swal-dark-input  { background: #1f2937 !important; color: #f9fafb !important; border: 1px solid #374151 !important; border-radius: 12px !important; font-size: 14px !important; }
  .swal-light-input { background: #f9fafb !important; color: #111827 !important; border: 1px solid #e5e7eb !important; border-radius: 12px !important; font-size: 14px !important; }
  .swal2-validation-message { background: transparent !important; color: #ef4444 !important; font-weight: 700 !important; }
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
  .swal2-icon.swal2-warning  { border-color: #f59e0b !important; color: #f59e0b !important; }
  .swal2-icon.swal2-error    { border-color: #ef4444 !important; color: #ef4444 !important; }
  .swal2-icon.swal2-question { border-color: ${theme?.primary || '#6366f1'} !important; color: ${theme?.primary || '#6366f1'} !important; }
  .swal2-icon.swal2-success .swal2-success-ring { border-color: rgba(16,185,129,0.3) !important; }
  .swal2-icon.swal2-success [class^=swal2-success-line] { background: #10b981 !important; }
  .swal2-actions { gap: 10px !important; margin-top: 20px !important; }
`;

// Succès : petite alerte auto-fermante (l'état React est déjà à jour, la resynchronisation
// serveur se fait en silence en arrière-plan)
const showSuccess = (darkMode, theme, title, text, onDone) => {
  createSwal(darkMode, theme).fire({
    icon: 'success', title, text,
    showConfirmButton: false, showCancelButton: false,
    timer: 1400, timerProgressBar: false,
    allowOutsideClick: true, allowEscapeKey: true,
  }).then(() => { if (onDone) onDone(); });
};

const showError = (darkMode, theme, title, text, icon = 'error') => {
  createSwal(darkMode, theme).fire({
    icon, title, text,
    showConfirmButton: true, confirmButtonText: "D'ACCORD", showCancelButton: false,
  });
};

const showConfirm = (darkMode, theme, { title, html, confirmText = 'Confirmer', isDanger = false }) =>
  createSwal(darkMode, theme).fire({
    icon: isDanger ? 'warning' : 'question', title, html,
    showConfirmButton: true, confirmButtonText: confirmText,
    showCancelButton: true, cancelButtonText: 'Annuler',
    customClass: {
      popup:         darkMode ? 'swal-dark-popup' : 'swal-light-popup',
      title:         darkMode ? 'swal-dark-title' : 'swal-light-title',
      htmlContainer: darkMode ? 'swal-dark-html'  : 'swal-light-html',
      confirmButton: isDanger ? 'swal-confirm-btn swal-danger' : 'swal-confirm-btn',
      cancelButton:  'swal-cancel-btn',
    },
    buttonsStyling: false,
  });

// ============================================================================
// HELPERS UTILITAIRES
// ============================================================================
const LARAVEL_BASE_URL = import.meta.env.VITE_LARAVEL_URL;
const getStorageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/storage/')) return `${LARAVEL_BASE_URL}${path}`;
  return `${LARAVEL_BASE_URL}/storage/${path.startsWith('/') ? path.slice(1) : path}`;
};

const getStatutColor = (s) => ({
  en_cours: 'bg-blue-100 text-blue-700',
  termine:  'bg-green-100 text-green-700',
  annule:   'bg-red-100 text-red-700',
}[s] || 'bg-gray-100 text-gray-700');

const getStatutLabel = (s) => ({
  en_cours: 'En cours',
  termine:  'Terminé',
  annule:   'Annulé',
}[s] || s);

const getStatutIcon = (s) => ({
  en_cours: 'bi-hourglass-split',
  termine:  'bi-check-circle-fill',
  annule:   'bi-x-circle-fill',
}[s] || 'bi-circle');

const formatDate     = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ============================================================================
// CALCUL DURÉE AUTOMATIQUE (getter JS)
// ============================================================================
const calculerDuree = (dateDebut, dateFinReelle, dateFinPrevue) => {
  if (!dateDebut) return null;
  const debut = new Date(dateDebut);
  const fin   = dateFinReelle
    ? new Date(dateFinReelle)
    : dateFinPrevue
      ? new Date(dateFinPrevue)
      : new Date();

  const diffMs   = fin - debut;
  if (diffMs < 0) return null;
  const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHeures = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffJours === 0) return `${diffHeures}h`;
  if (diffJours < 30)  return `${diffJours}j ${diffHeures}h`;
  const mois  = Math.floor(diffJours / 30);
  const jours = diffJours % 30;
  return jours > 0 ? `${mois} mois ${jours}j` : `${mois} mois`;
};

// Getter enrichi pour un record (ajoute duree_lisible si absente ou vide)
const enrichRecord = (rec) => ({
  ...rec,
  duree_lisible: rec.duree_lisible || calculerDuree(rec.date_debut, rec.date_fin_reelle, rec.date_fin_prevue) || '—',
});

// Extrait l'enregistrement renvoyé par l'API (res.data ou res directement), sinon null
const extractRecord = (res) => {
  const cand = res && typeof res === 'object' && res.data && typeof res.data === 'object' && !Array.isArray(res.data)
    ? res.data
    : res;
  return cand && typeof cand === 'object' && cand.id != null ? cand : null;
};

// ============================================================================
// SKELETONS (même principe que la page Demandes d'intervention)
// ============================================================================
const Sk = ({ dark, className = '', style }) => (
  <div className={`animate-pulse rounded ${dark ? 'bg-gray-700' : 'bg-gray-200'} ${className}`} style={style}></div>
);

const SkeletonKpi = ({ dark }) => (
  <div className={`${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm px-5 py-4 flex items-center gap-4`}>
    <Sk dark={dark} className="w-12 h-12 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Sk dark={dark} className="h-7 w-16" />
      <Sk dark={dark} className="h-4 w-28" />
    </div>
  </div>
);

const SkeletonChart = ({ dark }) => (
  <div className={`${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}>
    <div className="flex items-center justify-between mb-5">
      <Sk dark={dark} className="h-5 w-48" />
      <Sk dark={dark} className="h-6 w-6 rounded-full" />
    </div>
    <div className="space-y-3">
      {[85, 65, 50, 35].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <Sk dark={dark} className="h-4 w-16" />
          <Sk dark={dark} className="h-6 rounded-lg" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  </div>
);

const SkeletonRow = ({ darkMode }) => (
  <tr>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="px-4 py-5">
        <div className={`h-5 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </td>
    ))}
  </tr>
);

// ============================================================================
// COMPTEUR ANIMÉ + KPI CARD (identiques à la page Demandes d'intervention)
// ============================================================================
const useCountUp = (target, dur = 1200) => {
  const [v, setV] = useState(0);
  const raf = useRef(null), t0 = useRef(null);
  useEffect(() => {
    if (!target) { setV(0); return; }
    t0.current = null;
    const s = ts => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / dur, 1);
      setV(Math.round((1 - Math.pow(2, -10 * p)) * target));
      if (p < 1) raf.current = requestAnimationFrame(s);
    };
    raf.current = requestAnimationFrame(s);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur]);
  return v;
};

const KpiCard = ({ label, target, total, icon, color, delay, dark, animate }) => {
  const v   = useCountUp(target);
  const pct = total ? Math.round((target / total) * 100) : 0;
  return (
    <div
      className={`${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm px-5 py-4 flex items-center gap-4`}
      style={{ animation: animate ? `kpiBounce .5s cubic-bezier(0.22,1,0.36,1) ${delay}s both` : 'none' }}>
      <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
        <i className={`bi ${icon} text-xl`} style={{ color }}></i>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className={`text-3xl font-black leading-none ${dark ? 'text-white' : 'text-gray-900'}`}>{v}</p>
          <span className={`text-xs font-semibold ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{pct}%</span>
        </div>
        <p className={`text-sm font-semibold mt-1.5 truncate ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</p>
        <div className={`w-full h-1.5 rounded-full mt-2 ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }}></div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// LIGHTBOX IMAGE
// ============================================================================
const ImageLightbox = ({ src, alt, onClose }) => (
  createPortal(
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[99999] p-4 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
        <img src={src} alt={alt} className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>
    </div>,
    document.body
  )
);

// ============================================================================
// ROW ACTIONS MENU
// ============================================================================
const RowActionsMenu = ({ record, darkMode, theme, onView, onEdit, onCloturer, onDelete }) => {
  const [open, setOpen]   = useState(false);
  const [style, setStyle] = useState({});
  const btnRef  = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const close  = (e) => { if (btnRef.current && !btnRef.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const scroll = () => setOpen(false);
    if (open) { document.addEventListener('mousedown', close); document.addEventListener('scroll', scroll, true); }
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('scroll', scroll, true); };
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const w = 230, spaceBelow = window.innerHeight - rect.bottom;
      setStyle({ position: 'fixed', top: spaceBelow < 220 && rect.top > 220 ? rect.top - 200 : rect.bottom + 4, left: Math.max(8, rect.right - w), zIndex: 99999, width: w });
    }
  }, [open]);

  const itemCls = (tone) => `w-full text-left px-4 py-3 text-base font-semibold flex items-center gap-3 ${
    darkMode ? `text-${tone}-400 hover:bg-gray-700` : `text-${tone}-600 hover:bg-${tone}-50`
  }`;

  return (
    <div className="relative">
      <button ref={btnRef} type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`w-10 h-10 rounded-lg text-base font-bold transition-colors flex items-center justify-center ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
        <i className="bi bi-three-dots-vertical" />
      </button>
      {open && createPortal(
        <div ref={menuRef} className={`rounded-xl shadow-2xl border py-1 overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} style={style}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onView(record); }}
            className={`w-full text-left px-4 py-3 text-base font-semibold flex items-center gap-3 ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'}`}>
            <i className="bi bi-eye text-blue-500 text-lg" /> Voir détails
          </button>
          {record.statut === 'en_cours' && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(record); }}
                className={`w-full text-left px-4 py-3 text-base font-semibold flex items-center gap-3 ${darkMode ? 'text-amber-400 hover:bg-gray-700' : 'text-amber-600 hover:bg-amber-50'}`}>
                <i className="bi bi-pencil text-amber-500 text-lg" /> Modifier
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onCloturer(record); }}
                className={`w-full text-left px-4 py-3 text-base font-semibold flex items-center gap-3 ${darkMode ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-green-50'}`}>
                <i className="bi bi-check2-circle text-green-500 text-lg" /> Clôturer
              </button>
            </>
          )}
          <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(record); }}
            className={`w-full text-left px-4 py-3 text-base font-semibold flex items-center gap-3 ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}>
            <i className="bi bi-trash text-red-500 text-lg" /> Supprimer
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

// ============================================================================
// ANIMATED LINE CHART (SVG — courbe animée au PREMIER affichage uniquement)
// Les mises à jour de données (rafraîchissement silencieux) ne rejouent pas
// l'animation : la courbe se met simplement à jour, sans clignotement.
// ============================================================================
const AnimatedLineChart = ({ data, colors, darkMode, height = 200 }) => {
  const [ready, setReady] = useState(false);
  const ids = useRef({
    path: `line-${Math.random().toString(36).slice(2)}`,
    grad: `grad-${Math.random().toString(36).slice(2)}`,
  });

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!data || data.length === 0) {
    return <p className={`text-base font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune donnée</p>;
  }

  const W = 480, H = height;
  const pad = { top: 26, right: 24, bottom: 34, left: 40 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const xStep  = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const pts = data.map((d, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + innerH - (d.value / maxVal) * innerH,
    ...d,
  }));

  const buildPath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx  = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const buildArea = (points) => {
    if (points.length === 0) return '';
    const bottom = pad.top + innerH;
    return `${buildPath(points)} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  };

  const linePath = buildPath(pts);
  const areaPath = buildArea(pts);
  const pathId   = ids.current.path;
  const gradId   = ids.current.grad;
  const mainColor = colors[0] || '#6366f1';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={mainColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={mainColor} stopOpacity="0.02" />
        </linearGradient>
        <clipPath id={`clip-${pathId}`}>
          <rect
            x={pad.left - 12} y={0}
            width={ready ? innerW + 30 : 0} height={H}
            style={{ transition: ready ? 'width 1.2s cubic-bezier(0.22,1,0.36,1)' : 'none' }}
          />
        </clipPath>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((frac, gi) => {
        const yg = pad.top + innerH * (1 - frac);
        return (
          <g key={gi}>
            <line x1={pad.left} y1={yg} x2={pad.left + innerW} y2={yg}
              stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="1" strokeDasharray="4 3" />
            <text x={pad.left - 8} y={yg + 4} textAnchor="end" fontSize="12" fill={darkMode ? '#9ca3af' : '#6b7280'}>
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill={`url(#${gradId})`} clipPath={`url(#clip-${pathId})`} />

      <path d={linePath} fill="none" stroke={mainColor} strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round"
        clipPath={`url(#clip-${pathId})`}
      />

      {pts.map((p, i) => (
        <g key={i} clipPath={`url(#clip-${pathId})`}>
          <circle cx={p.x} cy={p.y} r="5" fill={colors[i % colors.length] || mainColor}
            stroke={darkMode ? '#111827' : '#fff'} strokeWidth="2" />
          <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="14" fontWeight="700"
            fill={darkMode ? '#e5e7eb' : '#374151'}>
            {p.value}
          </text>
          <text x={p.x} y={H - 8} textAnchor="middle" fontSize="12" fontWeight="600"
            fill={darkMode ? '#9ca3af' : '#6b7280'}>
            {(p.name || '').length > 10 ? (p.name).slice(0, 10) + '..' : (p.name || '')}
          </text>
        </g>
      ))}
    </svg>
  );
};

// ============================================================================
// LIGNE D'INFORMATION (modal détail)
// ============================================================================
const InfoRow = ({ darkMode, label, value }) => (
  <div className="flex justify-between items-start gap-3 py-2.5">
    <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
    <span className={`text-base font-extrabold text-right max-w-[220px] ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
  </div>
);

// ============================================================================
// MODAL CLÔTURER
// ============================================================================
const ModalCloturer = ({ darkMode, theme, record, onClose, onSuccess }) => {
  const [form, setForm]       = useState({ km_retour: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const inputCls = `w-full px-4 py-3 rounded-lg border text-base font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`;
  const labelCls = `block text-base font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`;

  const dureeCalc = useMemo(() =>
    calculerDuree(record.date_debut, null, null), [record.date_debut]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await cloturerHistoriqueAffectation(record.id, {
        km_retour: form.km_retour || undefined,
        notes:     form.notes     || undefined,
      });
      onClose();
      onSuccess(res, form);
    } catch (err) {
      showError(darkMode, theme, 'Erreur', err.response?.data?.message || 'Erreur lors de la clôture.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden`}
        style={{ animation: 'modalSlideIn 0.25s cubic-bezier(0.22,1,0.36,1)' }}>
        <div className="p-6 flex items-center justify-between border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <h3 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <i className="bi bi-check2-circle mr-2 text-green-400" />Clôturer l'emprunt
          </h3>
          <button type="button" onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg text-lg" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className={`p-5 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
            <p className={`text-base font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <i className="bi bi-car-front mr-2 text-green-500" />
              {record.vehicule_immatriculation} — {record.vehicule_marque} {record.vehicule_modele}
            </p>
            <p className={`text-sm font-semibold mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Emprunt depuis le {formatDate(record.date_debut)} · Direction : {record.direction_emprunt_nom}
            </p>
            {dureeCalc && (
              <p className={`text-sm font-bold mt-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                <i className="bi bi-clock mr-1" />Durée en cours : <strong>{dureeCalc}</strong>
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Kilométrage au retour</label>
            <input type="number" min="0" value={form.km_retour}
              onChange={e => setForm({ ...form, km_retour: e.target.value })}
              placeholder="Ex : 145000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notes <span className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optionnel)</span></label>
            <textarea value={form.notes} rows={3}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Observations, état du véhicule..."
              className={`${inputCls} resize-none`} />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <button type="button" onClick={onClose}
            className={`px-6 py-3 rounded-lg border text-base font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="px-6 py-3 rounded-lg text-white text-base font-bold hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            style={{ background: `linear-gradient(to right,${theme?.primary},${theme?.primaryDark})` }}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Clôture...</>
              : <><i className="bi bi-check2-circle" />Confirmer la clôture</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL DÉTAIL — agrandi, polices lisibles
// ============================================================================
const ModalDetail = ({ darkMode, theme, record, onClose, onEdit, onCloturer }) => {
  const dureeCalc = useMemo(() =>
    record.duree_lisible || calculerDuree(record.date_debut, record.date_fin_reelle, record.date_fin_prevue) || '—',
    [record]);

  const secTitle = (color) => `font-extrabold mb-4 flex items-center gap-2 text-base uppercase tracking-wider ${darkMode ? `text-${color}-300` : `text-${color}-700`}`;
  const divide   = `divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200/70'}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl`}
        style={{ maxWidth: 'min(1200px, calc(100vw - 24px))', animation: 'modalSlideIn 0.25s cubic-bezier(0.22,1,0.36,1)' }}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${theme?.primary},${theme?.primaryDark})` }}>
          <div className="flex items-center gap-4">
            {record.vehicule_photo && (
              <img src={getStorageUrl(record.vehicule_photo)} alt=""
                className="w-16 h-16 rounded-xl object-cover border-2 border-white/30" />
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl font-extrabold text-white">{record.vehicule_immatriculation}</h2>
                <span className={`px-3.5 py-1.5 rounded-full text-sm font-extrabold ${getStatutColor(record.statut)}`}>
                  <i className={`bi ${getStatutIcon(record.statut)} mr-1.5`} />{getStatutLabel(record.statut)}
                </span>
              </div>
              <p className="text-white/85 text-base font-semibold mt-1">
                {record.vehicule_marque} {record.vehicule_modele}
                {record.vehicule_couleur && <span className="ml-2 opacity-70">· {record.vehicule_couleur}</span>}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
            <i className="bi bi-x-lg text-xl" />
          </button>
        </div>

        {/* Corps en 3 colonnes */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-blue-50'} rounded-2xl p-6`}>
            <h3 className={secTitle('blue')}><i className="bi bi-car-front" />Véhicule</h3>
            <div className={divide}>
              <InfoRow darkMode={darkMode} label="Immatriculation" value={record.vehicule_immatriculation} />
              <InfoRow darkMode={darkMode} label="Marque"          value={record.vehicule_marque || '—'} />
              <InfoRow darkMode={darkMode} label="Modèle"          value={record.vehicule_modele || '—'} />
              <InfoRow darkMode={darkMode} label="Couleur"         value={record.vehicule_couleur || '—'} />
              <InfoRow darkMode={darkMode} label="Km actuel"       value={record.vehicule_km_actuel ? `${Number(record.vehicule_km_actuel).toLocaleString('fr-FR')} km` : '—'} />
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-indigo-50'} rounded-2xl p-6`}>
            <h3 className={secTitle('indigo')}><i className="bi bi-arrow-left-right" />Affectation</h3>
            <div className={divide}>
              <InfoRow darkMode={darkMode} label="Direction origine"   value={record.direction_origine_nom   || '—'} />
              <InfoRow darkMode={darkMode} label="Direction emprunt"   value={record.direction_emprunt_nom   || '—'} />
              <InfoRow darkMode={darkMode} label="Affectation origine" value={record.affectation_origine_nom || '—'} />
              <InfoRow darkMode={darkMode} label="Affectation emprunt" value={record.affectation_emprunt_nom || '—'} />
              <InfoRow darkMode={darkMode} label="Demandé par"         value={record.demande_par_nom         || '—'} />
              <InfoRow darkMode={darkMode} label="Validé par"          value={record.valide_par_nom          || '—'} />
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-emerald-50'} rounded-2xl p-6`}>
            <h3 className={secTitle('emerald')}><i className="bi bi-calendar3" />Période & Km</h3>
            <div className={divide}>
              <InfoRow darkMode={darkMode} label="Date début"      value={formatDateTime(record.date_debut)} />
              <InfoRow darkMode={darkMode} label="Date fin prévue" value={formatDate(record.date_fin_prevue)} />
              <InfoRow darkMode={darkMode} label="Date fin réelle" value={formatDateTime(record.date_fin_reelle)} />
              <InfoRow darkMode={darkMode} label="Durée"           value={dureeCalc} />
              <InfoRow darkMode={darkMode} label="Km départ"       value={record.km_depart ? `${Number(record.km_depart).toLocaleString('fr-FR')} km` : '—'} />
              <InfoRow darkMode={darkMode} label="Km retour"       value={record.km_retour ? `${Number(record.km_retour).toLocaleString('fr-FR')} km` : '—'} />
            </div>
          </div>

          {(record.motif || record.notes) && (
            <div className={`lg:col-span-3 ${darkMode ? 'bg-gray-800' : 'bg-amber-50'} rounded-2xl p-6`}>
              <h3 className={secTitle('amber')}><i className="bi bi-chat-left-text" />Motif & Notes</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {record.motif && (
                  <div>
                    <p className={`text-sm font-bold mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Motif</p>
                    <p className={`text-base font-semibold leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{record.motif}</p>
                  </div>
                )}
                {record.notes && (
                  <div>
                    <p className={`text-sm font-bold mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notes</p>
                    <p className={`text-base font-semibold leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-5 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          {record.statut === 'en_cours' && (
            <>
              <button type="button" onClick={() => { onClose(); onEdit(record); }}
                className={`px-6 py-3 rounded-lg border text-base font-bold flex items-center gap-2 transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                <i className="bi bi-pencil" />Modifier
              </button>
              <button type="button" onClick={() => { onClose(); onCloturer(record); }}
                className="px-6 py-3 rounded-lg text-white text-base font-bold flex items-center gap-2 hover:opacity-90"
                style={{ background: 'linear-gradient(to right,#10b981,#059669)' }}>
                <i className="bi bi-check2-circle" />Clôturer
              </button>
            </>
          )}
          <button type="button" onClick={onClose}
            className="px-6 py-3 rounded-lg text-white text-base font-bold hover:opacity-90"
            style={{ background: `linear-gradient(to right,${theme?.primary},${theme?.primaryDark})` }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FORMULAIRE MODAL (Ajouter / Modifier) — sans "Demandé par" / "Validé par"
// + Durée calculée live
// ============================================================================
const ModalForm = ({ darkMode, theme, isEdit, record, vehicules, directions, affectations, onClose, onSuccess }) => {
  const emptyForm = {
    vehicule_immatriculation: '',
    direction_emprunt_id:     '',
    affectation_emprunt_id:   '',
    date_debut:               '',
    date_fin_prevue:          '',
    motif:                    '',
    notes:                    '',
    km_depart:                '',
  };

  const [form, setForm] = useState(() => isEdit && record ? {
    vehicule_immatriculation: record.vehicule_immatriculation || '',
    direction_emprunt_id:     record.direction_emprunt_id     ? String(record.direction_emprunt_id)   : '',
    affectation_emprunt_id:   record.affectation_emprunt_id   ? String(record.affectation_emprunt_id) : '',
    date_debut:               record.date_debut               ? record.date_debut.slice(0, 10)         : '',
    date_fin_prevue:          record.date_fin_prevue           ? record.date_fin_prevue.slice(0, 10)    : '',
    motif:                    record.motif                    || '',
    notes:                    record.notes                    || '',
    km_depart:                record.km_depart                || '',
  } : emptyForm);

  const [submitting, setSubmitting] = useState(false);

  const dureeCalc = useMemo(() =>
    calculerDuree(form.date_debut || null, null, form.date_fin_prevue || null),
    [form.date_debut, form.date_fin_prevue]);

  const inputCls = `w-full px-4 py-3 rounded-lg border text-base font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`;
  const labelCls = `block text-base font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`;
  const optCls   = `text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`;

  const handleSubmit = async () => {
    if (!form.vehicule_immatriculation || !form.direction_emprunt_id || !form.date_debut) {
      showError(darkMode, theme, 'Champs requis', "Véhicule, direction d'emprunt et date de début sont obligatoires.", 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.affectation_emprunt_id) delete payload.affectation_emprunt_id;
      if (!payload.date_fin_prevue)        delete payload.date_fin_prevue;
      if (!payload.km_depart)              delete payload.km_depart;

      const res = isEdit
        ? await updateHistoriqueAffectation(record.id, payload)
        : await createHistoriqueAffectation(payload);
      onClose();
      onSuccess(res);
    } catch (err) {
      const errors = err.response?.data?.errors;
      showError(darkMode, theme, 'Erreur', errors ? Object.values(errors).flat().join('\n') : (err.response?.data?.message || 'Erreur lors de l\'opération.'));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl`}
        style={{ animation: 'modalSlideIn 0.25s cubic-bezier(0.22,1,0.36,1)' }}>
        <div className={`p-6 border-b flex items-center justify-between sticky top-0 z-10 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <i className={`${isEdit ? 'bi bi-pencil-square text-amber-400' : 'bi bi-plus-circle text-blue-400'} mr-2`} />
            {isEdit ? `Modifier — ${record?.vehicule_immatriculation}` : 'Nouvel emprunt'}
          </h2>
          <button type="button" onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg text-xl" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className={labelCls}>Véhicule *</label>
            <select value={form.vehicule_immatriculation}
              onChange={e => setForm({ ...form, vehicule_immatriculation: e.target.value })}
              disabled={isEdit} className={`${inputCls} ${isEdit ? 'opacity-60' : ''}`}>
              <option value="">— Sélectionner un véhicule —</option>
              {vehicules.map(v => (
                <option key={v.immatriculation} value={v.immatriculation}>
                  {v.immatriculation} — {v.marque} {v.modele}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Direction d'emprunt *</label>
            <select value={form.direction_emprunt_id}
              onChange={e => setForm({ ...form, direction_emprunt_id: e.target.value, affectation_emprunt_id: '' })}
              className={inputCls}>
              <option value="">— Sélectionner —</option>
              {directions.map(d => <option key={d.id} value={String(d.id)}>{d.nom}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Affectation <span className={optCls}>(optionnel)</span></label>
            <select value={form.affectation_emprunt_id}
              onChange={e => setForm({ ...form, affectation_emprunt_id: e.target.value })}
              className={inputCls}>
              <option value="">— Aucune —</option>
              {affectations.map(a => <option key={a.id} value={String(a.id)}>{a.code ? `${a.code} — ${a.nom}` : a.nom}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Date de début *</label>
            <input type="date" value={form.date_debut}
              onChange={e => setForm({ ...form, date_debut: e.target.value })} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Date de fin prévue <span className={optCls}>(optionnel)</span></label>
            <input type="date" value={form.date_fin_prevue}
              onChange={e => setForm({ ...form, date_fin_prevue: e.target.value })} className={inputCls} />
          </div>

          {(form.date_debut) && (
            <div className={`col-span-2 flex items-center gap-2 px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-blue-50 border border-blue-100'}`}>
              <i className="bi bi-clock text-lg" style={{ color: theme?.primary }} />
              <span className={`text-base font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Durée calculée :</span>
              <span className="text-base font-extrabold" style={{ color: theme?.primary }}>
                {dureeCalc || '—'}
              </span>
              {!form.date_fin_prevue && (
                <span className={optCls}>(jusqu'à aujourd'hui)</span>
              )}
            </div>
          )}

          <div>
            <label className={labelCls}>Km au départ</label>
            <input type="number" min="0" value={form.km_depart}
              onChange={e => setForm({ ...form, km_depart: e.target.value })}
              placeholder="Ex : 140000" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Motif</label>
            <input type="text" value={form.motif}
              onChange={e => setForm({ ...form, motif: e.target.value })}
              placeholder="Raison de l'emprunt..." maxLength={255} className={inputCls} />
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes} rows={3}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className={`p-6 border-t flex justify-end gap-3 sticky bottom-0 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <button type="button" onClick={onClose}
            className={`px-6 py-3 rounded-lg border text-base font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="px-6 py-3 rounded-lg text-white text-base font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            style={{ background: `linear-gradient(to right,${theme?.primary},${theme?.primaryDark})` }}>
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{isEdit ? 'Enregistrement...' : 'Création...'}</>
              : <><i className={isEdit ? 'bi bi-check-lg' : 'bi bi-plus-lg'} />{isEdit ? 'Enregistrer' : "Créer l'emprunt"}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL — HistoriqueAffectationsTab
// ============================================================================
const HistoriqueAffectationsTab = ({ darkMode, theme, onBack }) => {
  // ── Données ──────────────────────────────────────────────────────────────
  const [records, setRecords]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);   // skeletons : chargement initial / changement de filtre
  const [stats, setStats]       = useState(null);

  // ── Références ────────────────────────────────────────────────────────────
  const [vehicules,    setVehicules]    = useState([]);
  const [directions,   setDirections]   = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [refsLoaded,   setRefsLoaded]   = useState(false);
  const [refsError,    setRefsError]    = useState(null);

  // ── Filtres / Pagination ──────────────────────────────────────────────────
  const [searchInput,            setSearchInput]            = useState('');
  const [searchTerm,             setSearchTerm]             = useState('');
  const [filterStatut,           setFilterStatut]           = useState('');
  const [filterDirectionEmprunt, setFilterDirectionEmprunt] = useState('');
  const [currentPage,            setCurrentPage]            = useState(1);
  const [totalPages,             setTotalPages]             = useState(1);
  const itemsPerPage = 10;

  // ── UI ────────────────────────────────────────────────────────────────────
  const [pageReady,         setPageReady]         = useState(false);
  const [animateCards,      setAnimateCards]      = useState(false);
  const [showAddModal,      setShowAddModal]      = useState(false);
  const [showEditModal,     setShowEditModal]     = useState(false);
  const [showDetailModal,   setShowDetailModal]   = useState(false);
  const [showCloturerModal, setShowCloturerModal] = useState(false);
  const [selectedRecord,    setSelectedRecord]    = useState(null);
  const [cloturerTarget,    setCloturerTarget]    = useState(null);
  const [lightboxSrc,       setLightboxSrc]       = useState(null);

  // Animation d'apparition globale au premier montage
  useEffect(() => {
    const t = setTimeout(() => setPageReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  // ── Styles SweetAlert2 (thème dynamique — identique aux autres pages) ─────
  useEffect(() => {
    const styleId = 'swal-custom-styles';
    document.getElementById(styleId)?.remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = buildSwalStyles(theme);
    document.head.appendChild(style);
  }, [theme]);

  // Recherche avec léger délai (évite un appel serveur à chaque frappe)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(prev => {
        if (prev !== searchInput) setCurrentPage(1);
        return searchInput;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Références ────────────────────────────────────────────────────────────
  //  • fetchRefs()      → chargement initial
  //  • fetchRefs(true)  → rechargement silencieux (véhicules, directions…)
  const fetchRefs = useCallback(async (silent = false) => {
    if (!silent) { setRefsLoaded(false); setRefsError(null); }
    try {
      const data = await getReferencesHistorique();
      setVehicules(data.vehicules       ?? []);
      setDirections(data.directions     ?? []);
      setAffectations(data.affectations ?? []);
      setRefsError(null);
    } catch (err) {
      console.error(err);
      if (!silent) setRefsError('Impossible de charger les données de référence.');
    } finally {
      if (!silent) setRefsLoaded(true);
    }
  }, []);
  useEffect(() => { fetchRefs(); }, [fetchRefs]);

  // ── Stats (KPI + graphiques) — jamais de skeleton après le 1er chargement ─
  const statsReqRef = useRef(0);
  const fetchStats = useCallback(async () => {
    const myId = ++statsReqRef.current;
    try {
      const data = await getStatsHistoriqueAffectations();
      if (myId === statsReqRef.current) setStats(data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  }, []);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Liste ─────────────────────────────────────────────────────────────────
  //  • fetchList()      → affiche les skeletons (chargement initial, filtre, page)
  //  • fetchList(true)  → rechargement SILENCIEUX : aucun skeleton, aucun clignotement
  // listReqRef évite qu'une réponse ancienne (plus lente) écrase une réponse plus récente.
  const listReqRef = useRef(0);
  const fetchList = useCallback(async (silent = false) => {
    const myId = ++listReqRef.current;
    if (!silent) setLoading(true);
    try {
      const data = await getHistoriqueAffectations({
        search:               searchTerm             || undefined,
        statut:               filterStatut           || undefined,
        direction_emprunt_id: filterDirectionEmprunt || undefined,
        page:                 currentPage,
        per_page:             itemsPerPage,
      });
      if (myId !== listReqRef.current) return;   // une requête plus récente est déjà passée
      const rows = data.data ?? data;
      const arr  = Array.isArray(rows) ? rows : [];
      const tot  = data.total ?? arr.length;
      setRecords(arr.map(enrichRecord));
      setTotal(tot);
      setTotalPages((data.last_page ?? Math.ceil(tot / itemsPerPage)) || 1);
    } catch (err) {
      if (myId === listReqRef.current) console.error('Erreur liste:', err);
      // en mode silencieux : on garde simplement l'affichage actuel
    } finally {
      if (myId === listReqRef.current) setLoading(false);
    }
  }, [searchTerm, filterStatut, filterDirectionEmprunt, currentPage]);

  // Garde toujours la dernière version de fetchList (filtres à jour) pour le rechargement silencieux
  const fetchListRef = useRef(fetchList);
  fetchListRef.current = fetchList;

  useEffect(() => { fetchList(false); }, [fetchList]);

  // Rechargement silencieux en arrière-plan (liste + stats + références).
  // Volontairement NON attendu : il tourne pendant que le SweetAlert est affiché.
  const refreshSilent = useCallback(() => {
    fetchListRef.current(true);
    fetchStats();
    fetchRefs(true);
  }, [fetchStats, fetchRefs]);

  // Si, après une suppression / un rechargement, la page courante n'existe plus → dernière page valide
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  // Animation d'apparition des lignes : uniquement quand la liste (re)charge avec skeletons
  useEffect(() => {
    if (loading) return;
    setAnimateCards(false);
    const id = requestAnimationFrame(() => setAnimateCards(true));
    return () => cancelAnimationFrame(id);
  }, [loading]);

  // ── Mises à jour LOCALES immédiates ───────────────────────────────────────
  const upsertLocal = (rec) => {
    if (!rec || rec.id == null) return;
    let isNew = false;
    setRecords(prev => {
      if (prev.some(x => x.id === rec.id)) {
        return prev.map(x => {
          if (x.id !== rec.id) return x;
          const merged = { ...x, ...rec };
          if (!rec.duree_lisible) merged.duree_lisible = undefined;   // recalculée
          return enrichRecord(merged);
        });
      }
      isNew = true;
      return [enrichRecord(rec), ...prev].slice(0, itemsPerPage);
    });
    // setRecords est asynchrone : on déduit « nouveau » depuis l'état courant
    if (!records.some(x => x.id === rec.id)) setTotal(t => t + 1);
  };

  const patchLocal = (id, patch) => {
    setRecords(prev => prev.map(x => {
      if (x.id !== id) return x;
      return enrichRecord({ ...x, ...patch, duree_lisible: undefined });
    }));
  };

  // ── Callbacks de succès des modales ───────────────────────────────────────
  // Ordre : 1) modale fermée + affichage immédiat · 2) resynchronisation silencieuse · 3) alerte
  const handleCreated = (res) => {
    setShowAddModal(false);
    const rec = extractRecord(res);
    if (rec) upsertLocal(rec);
    refreshSilent();
    showSuccess(darkMode, theme, 'Emprunt créé', res?.message || "L'emprunt a été enregistré.");
  };

  const handleUpdated = (res) => {
    const id  = selectedRecord?.id;
    setShowEditModal(false); setSelectedRecord(null);
    const rec = extractRecord(res);
    if (rec) upsertLocal(rec);
    else if (id != null) patchLocal(id, {});
    refreshSilent();
    showSuccess(darkMode, theme, 'Modifié', res?.message || "L'emprunt a été mis à jour.");
  };

  const handleCloturedSuccess = (res, form) => {
    const target = cloturerTarget;
    setShowCloturerModal(false); setCloturerTarget(null);
    const rec = extractRecord(res);
    if (rec) upsertLocal(rec);
    else if (target) {
      patchLocal(target.id, {
        statut: 'termine',
        date_fin_reelle: new Date().toISOString(),
        ...(form?.km_retour ? { km_retour: Number(form.km_retour) } : {}),
        ...(form?.notes ? { notes: form.notes } : {}),
      });
    }
    refreshSilent();
    showSuccess(darkMode, theme, 'Clôturé', res?.message || "L'emprunt a été clôturé.");
  };

  // ── Supprimer ─────────────────────────────────────────────────────────────
  const handleDelete = async (record) => {
    const result = await showConfirm(darkMode, theme, {
      title: 'Supprimer cet emprunt ?',
      html: `L'emprunt du véhicule <strong>${record.vehicule_immatriculation}</strong> vers <strong>${record.direction_emprunt_nom}</strong> sera supprimé.<br/><small style="color:#9ca3af">Action irréversible.</small>`,
      confirmText: '<i class="bi bi-trash" style="margin-right:6px"></i>Supprimer',
      isDanger: true,
    });
    if (!result.isConfirmed) return;
    try {
      const res = await deleteHistoriqueAffectation(record.id);
      setRecords(prev => prev.filter(r => r.id !== record.id));   // 1) disparition immédiate de la ligne
      setTotal(t => Math.max(0, t - 1));
      setShowDetailModal(false); setSelectedRecord(null);
      refreshSilent();                                             // 2) resynchronisation silencieuse
      showSuccess(darkMode, theme, 'Supprimé', res?.message || "L'emprunt a été supprimé.");   // 3) alerte
    } catch (err) {
      refreshSilent();
      showError(darkMode, theme, 'Erreur', err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const resetFilters = () => {
    setSearchInput(''); setSearchTerm('');
    setFilterStatut(''); setFilterDirectionEmprunt('');
    setCurrentPage(1);
  };

  // ── Données graphiques ────────────────────────────────────────────────────
  const statutData    = stats ? [
    { name: 'En cours', value: stats.en_cours  ?? 0 },
    { name: 'Terminés', value: stats.termines  ?? 0 },
    { name: 'Annulés',  value: stats.annules   ?? 0 },
  ] : [];
  const directionData = stats?.par_direction?.slice(0, 6).map(d => ({ name: d.direction, value: d.total })) ?? [];

  const inputCls = `px-4 py-2.5 rounded-lg border text-base font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`;

  // La modale détail agit sur la version « vivante » de l'enregistrement
  const liveDetail = selectedRecord
    ? (records.find(r => r.id === selectedRecord.id) || selectedRecord)
    : null;

  // ============================================================================
  // STYLES GLOBAUX (injectés une seule fois)
  // ============================================================================
  useEffect(() => {
    const styleId = 'ha-global-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeInPage {
        from { opacity: 0; transform: translateY(10px) scale(0.99); }
        to   { opacity: 1; transform: translateY(0)   scale(1);    }
      }
      @keyframes modalSlideIn {
        from { opacity: 0; transform: scale(0.96) translateY(16px); }
        to   { opacity: 1; transform: scale(1)    translateY(0); }
      }
      @keyframes kpiBounce {
        0%   { transform: scale(0.85); opacity: 0; }
        60%  { transform: scale(1.04); opacity: 1; }
        100% { transform: scale(1);    opacity: 1; }
      }
      .ha-row:hover { filter: brightness(1.06); cursor: pointer; }
    `;
    document.head.appendChild(style);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  const hasFilters = searchInput || filterStatut || filterDirectionEmprunt;
  const statsLoading = stats === null;

  return (
    <div style={{ opacity: pageReady ? 1 : 0, transform: pageReady ? 'none' : 'translateY(12px)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}>
      {/* Lightbox */}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Véhicule" onClose={() => setLightboxSrc(null)} />}

      {/* Banner erreur */}
      {refsError && (
        <div className="mb-4 p-4 rounded-xl bg-red-100 border border-red-300 text-red-700 text-base font-bold flex items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" /> {refsError}
        </div>
      )}

      {/* En-tête */}
      <div className="mb-6" style={{ animation: pageReady ? 'fadeInUp 0.4s ease-out both' : 'none' }}>
        {onBack && (
          <button type="button" onClick={onBack}
            className={`mb-4 flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-bold transition-colors ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}>
            <i className="bi bi-arrow-left" /> Retour aux véhicules
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg,${theme?.primary},${theme?.primaryDark})` }}>
            <i className="bi bi-arrow-left-right text-white text-xl" />
          </div>
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Historique des affectations
            </h1>
            <p className={`text-base font-semibold mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Gérez les emprunts et transferts de véhicules entre directions
            </p>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} dark={darkMode} />)
        ) : (
          <>
            <KpiCard label="Total"    target={stats?.total    ?? 0} total={stats?.total ?? 0} icon="bi-list-ul"         color="#6366f1" delay={0}    dark={darkMode} animate={pageReady} />
            <KpiCard label="En cours" target={stats?.en_cours ?? 0} total={stats?.total ?? 0} icon="bi-hourglass-split" color="#3b82f6" delay={0.09} dark={darkMode} animate={pageReady} />
            <KpiCard label="Terminés" target={stats?.termines ?? 0} total={stats?.total ?? 0} icon="bi-check2-circle"   color="#10b981" delay={0.18} dark={darkMode} animate={pageReady} />
            <KpiCard label="Annulés"  target={stats?.annules  ?? 0} total={stats?.total ?? 0} icon="bi-x-circle"        color="#ef4444" delay={0.27} dark={darkMode} animate={pageReady} />
          </>
        )}
      </div>

      {/* GRAPHIQUES EN COURBES ANIMÉES */}
      {statsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SkeletonChart dark={darkMode} />
          <SkeletonChart dark={darkMode} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          style={{ animation: pageReady ? 'fadeInUp 0.5s ease-out 0.35s both' : 'none' }}>
          {[
            {
              title:  'Répartition par statut',
              data:   statutData,
              colors: ['#3b82f6', '#10b981', '#ef4444'],
            },
            {
              title:  'Emprunts par direction',
              data:   directionData,
              colors: ['#8b5cf6', '#f59e0b', '#06b6d4', '#f97316', '#84cc16', '#ec4899'],
            },
          ].map((chart, ci) => (
            <div key={ci}
              className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 rounded-full" style={{ background: theme?.primary }} />
                <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{chart.title}</h3>
                <i className="bi bi-activity ml-auto text-base" style={{ color: theme?.primary }} />
              </div>
              <AnimatedLineChart
                data={chart.data}
                colors={chart.colors}
                darkMode={darkMode}
                height={200}
              />
            </div>
          ))}
        </div>
      )}

      {/* TOOLBAR
          position:relative + zIndex : passe AU-DESSUS du tableau (dont l'animation crée une couche) */}
      <div
        className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-6`}
        style={{ position: 'relative', zIndex: 30, animation: pageReady ? 'fadeInUp 0.45s ease-out 0.42s both' : 'none' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <i className={`bi bi-search text-base ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input type="text" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Véhicule, direction, motif..."
                className={`bg-transparent text-base font-semibold outline-none w-56 ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
            </div>
            <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setCurrentPage(1); }} className={inputCls}>
              <option value="">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
            <select value={filterDirectionEmprunt} onChange={e => { setFilterDirectionEmprunt(e.target.value); setCurrentPage(1); }} className={inputCls}>
              <option value="">Toutes les directions</option>
              {directions.map(d => <option key={d.id} value={String(d.id)}>{d.nom}</option>)}
            </select>
            {hasFilters && (
              <button type="button" onClick={resetFilters}
                className={`px-4 py-2.5 rounded-lg text-base font-bold flex items-center gap-1.5 ${darkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                <i className="bi bi-x-lg" /> Effacer
              </button>
            )}
          </div>
          <button type="button" onClick={() => setShowAddModal(true)} disabled={!refsLoaded}
            className="px-6 py-2.5 rounded-lg text-white text-base font-bold flex items-center gap-2 shadow-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: `linear-gradient(to right,${theme?.primary},${theme?.primaryDark})` }}>
            <i className="bi bi-plus-lg" /> Nouvel emprunt
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div
        className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}
        style={{ animation: pageReady ? 'fadeInUp 0.5s ease-out 0.5s both' : 'none' }}>
        <div className={`px-6 py-4 flex items-center border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`text-base font-extrabold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <i className="bi bi-list-ul mr-2" />
            {loading ? <span className="inline-block align-middle"><Sk dark={darkMode} className="h-4 w-28" /></span> : `${total} emprunt(s)`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: `linear-gradient(135deg,${theme?.primary},${theme?.primaryDark})` }}>
                {['Véhicule', 'Dir. origine', 'Dir. emprunt', 'Date début', 'Date fin prévue', 'Durée', 'Statut', 'Actions'].map((h, i) => (
                  <th key={i} className={`px-4 py-4 text-left text-sm font-extrabold uppercase tracking-wider text-white whitespace-nowrap ${i === 7 ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonRow key={i} darkMode={darkMode} />)
                : records.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className={`text-center py-16 font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <i className="bi bi-arrow-left-right text-5xl block mb-3 opacity-40" />
                        <p className="text-lg">Aucun emprunt trouvé</p>
                      </td>
                    </tr>
                  )
                  : records.map((rec, rowIdx) => {
                    const photoUrl = rec.vehicule_photo ? getStorageUrl(rec.vehicule_photo) : null;
                    return (
                      <tr key={rec.id}
                        className="ha-row transition-all duration-200"
                        onClick={() => { setSelectedRecord(rec); setShowDetailModal(true); }}
                        style={{
                          backgroundColor: getRowBackgroundColor(rowIdx, darkMode),
                          animation: animateCards ? `fadeInUp 0.4s ease-out ${rowIdx * 0.04}s both` : 'none',
                        }}>
                        {/* Véhicule + photo avec loupe */}
                        <td className="px-4 py-5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <div className="relative group flex-shrink-0">
                              {photoUrl
                                ? (
                                  <>
                                    <img src={photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover cursor-pointer transition-transform group-hover:scale-105"
                                      onClick={() => setLightboxSrc(photoUrl)}
                                      onError={e => { e.target.style.display = 'none'; }} />
                                    <div
                                      className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      onClick={() => setLightboxSrc(photoUrl)}
                                    >
                                      <i className="bi bi-zoom-in text-white text-base" />
                                    </div>
                                  </>
                                )
                                : (
                                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                    <i className="bi bi-car-front text-lg" style={{ color: theme?.primary }} />
                                  </div>
                                )}
                            </div>
                            <div className="cursor-pointer" onClick={() => { setSelectedRecord(rec); setShowDetailModal(true); }}>
                              <p className={`font-extrabold text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{rec.vehicule_immatriculation}</p>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{rec.vehicule_marque} {rec.vehicule_modele}</p>
                            </div>
                          </div>
                        </td>
                        {/* Direction origine */}
                        <td className="px-4 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            <i className="bi bi-building text-xs" />{rec.direction_origine_nom || '—'}
                          </span>
                        </td>
                        {/* Direction emprunt */}
                        <td className="px-4 py-5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                            style={{ background: `${theme?.primary}22`, color: theme?.primary, border: `1px solid ${theme?.primary}44` }}>
                            <i className="bi bi-arrow-right text-xs" />{rec.direction_emprunt_nom || '—'}
                          </span>
                        </td>
                        <td className={`px-4 py-5 text-base font-semibold whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{formatDate(rec.date_debut)}</td>
                        <td className={`px-4 py-5 text-base font-semibold whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{formatDate(rec.date_fin_prevue)}</td>
                        {/* Durée — calculée automatiquement */}
                        <td className={`px-4 py-5 text-base font-bold whitespace-nowrap ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                          <span className="flex items-center gap-1.5">
                            <i className="bi bi-clock text-sm opacity-70" />
                            {rec.duree_lisible}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <span className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${getStatutColor(rec.statut)}`}>
                            <i className={`bi ${getStatutIcon(rec.statut)} mr-1.5`} />{getStatutLabel(rec.statut)}
                          </span>
                        </td>
                        <td className="px-4 py-5" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-center">
                            <RowActionsMenu
                              record={rec}
                              darkMode={darkMode}
                              theme={theme}
                              onView={r => { setSelectedRecord(r); setShowDetailModal(true); }}
                              onEdit={r => { setSelectedRecord(r); setShowEditModal(true); }}
                              onCloturer={r => { setCloturerTarget(r); setShowCloturerModal(true); }}
                              onDelete={handleDelete}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination — 10 par page */}
        {!loading && totalPages > 1 && (
          <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <p className={`text-base font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, total)} sur {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                className={`p-2.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                <i className="bi bi-chevron-double-left" />
              </button>
              <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className={`p-2.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                <i className="bi bi-chevron-left" />
              </button>
              {/* Fenêtre glissante de 5 pages */}
              {(() => {
                const windowSize = 5;
                let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
                let end   = Math.min(totalPages, start + windowSize - 1);
                if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                  <button key={page} type="button" onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-base font-bold transition-colors ${currentPage === page ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                    style={currentPage === page ? { background: `linear-gradient(to right,${theme?.primary},${theme?.primaryDark})` } : {}}>
                    {page}
                  </button>
                ));
              })()}
              <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className={`p-2.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                <i className="bi bi-chevron-right" />
              </button>
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                className={`p-2.5 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                <i className="bi bi-chevron-double-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddModal && (
        <ModalForm
          darkMode={darkMode} theme={theme} isEdit={false} record={null}
          vehicules={vehicules} directions={directions} affectations={affectations}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCreated}
        />
      )}

      {showEditModal && selectedRecord && (
        <ModalForm
          darkMode={darkMode} theme={theme} isEdit={true} record={selectedRecord}
          vehicules={vehicules} directions={directions} affectations={affectations}
          onClose={() => { setShowEditModal(false); }}
          onSuccess={handleUpdated}
        />
      )}

      {showDetailModal && liveDetail && (
        <ModalDetail
          darkMode={darkMode} theme={theme} record={liveDetail}
          onClose={() => { setShowDetailModal(false); }}
          onEdit={r => { setSelectedRecord(r); setShowEditModal(true); }}
          onCloturer={r => { setCloturerTarget(r); setShowCloturerModal(true); }}
        />
      )}

      {showCloturerModal && cloturerTarget && (
        <ModalCloturer
          darkMode={darkMode} theme={theme} record={cloturerTarget}
          onClose={() => { setShowCloturerModal(false); }}
          onSuccess={handleCloturedSuccess}
        />
      )}
    </div>
  );
};

export default HistoriqueAffectationsTab;