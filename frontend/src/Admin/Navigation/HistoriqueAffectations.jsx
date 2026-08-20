// ============================================================================
// HistoriqueAffectations.jsx
// Composant ONGLET (sans Sidebar / Header) — appelé depuis Vehicules.jsx
// ============================================================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';

import {
  getHistoriqueAffectations,
  createHistoriqueAffectation,
  updateHistoriqueAffectation,
  cloturerHistoriqueAffectation,
  deleteHistoriqueAffectation,
  getReferencesHistorique,
  getStatsHistoriqueAffectations,
} from '../../api/Admin-Axios/HistoriqueAffectation-axios';

// ============================================================================
// SWEETALERT2 — HELPERS THÉMÉS
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

const showSuccess = (darkMode, theme, title, text, onDone) => {
  createSwal(darkMode, theme).fire({
    icon: 'success', title, text,
    showConfirmButton: false, timer: 1400,
    allowOutsideClick: false, allowEscapeKey: false,
  }).then(() => { if (onDone) onDone(); });
};

const showError = (darkMode, theme, title, text, icon = 'error') => {
  createSwal(darkMode, theme).fire({
    icon, title, text,
    showConfirmButton: true, confirmButtonText: "D'ACCORD", showCancelButton: false,
    buttonsStyling: false,
  });
};

const showConfirm = (darkMode, theme, { title, html, confirmText = 'Confirmer', isDanger = false }) =>
  createSwal(darkMode, theme).fire({
    icon: 'warning', title, html,
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

// Getter enrichi pour un record (ajoute duree_calculee si absente ou vide)
const enrichRecord = (rec) => ({
  ...rec,
  duree_lisible: rec.duree_lisible || calculerDuree(rec.date_debut, rec.date_fin_reelle, rec.date_fin_prevue) || '—',
});

// ============================================================================
// SKELETON
// ============================================================================
const SkeletonRow = ({ darkMode }) => (
  <tr>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="px-5 py-4">
        <div className={`h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </td>
    ))}
  </tr>
);

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
          className="absolute top-3 right-3 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
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
      const w = 200, spaceBelow = window.innerHeight - rect.bottom;
      setStyle({ position: 'fixed', top: spaceBelow < 160 && rect.top > 160 ? rect.top - 145 : rect.bottom + 4, left: Math.max(8, rect.right - w), zIndex: 99999, width: w });
    }
  }, [open]);

  return (
    <div className="relative">
      <button ref={btnRef} type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`p-2 rounded-lg text-sm font-bold transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
        <i className="bi bi-three-dots-vertical" />
      </button>
      {open && createPortal(
        <div ref={menuRef} className={`rounded-xl shadow-2xl border py-1 overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} style={style}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onView(record); }}
            className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'}`}>
            <i className="bi bi-eye text-blue-500" /> Voir détails
          </button>
          {record.statut === 'en_cours' && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(record); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-amber-400 hover:bg-gray-700' : 'text-amber-600 hover:bg-amber-50'}`}>
                <i className="bi bi-pencil text-amber-500" /> Modifier
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onCloturer(record); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-green-50'}`}>
                <i className="bi bi-check2-circle text-green-500" /> Clôturer
              </button>
            </>
          )}
          <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(record); }}
            className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}>
            <i className="bi bi-trash text-red-500" /> Supprimer
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

// ============================================================================
// ANIMATED LINE CHART (SVG — courbe animée au chargement)
// ============================================================================
const AnimatedLineChart = ({ data, colors, darkMode, height = 140 }) => {
  const svgRef  = useRef(null);
  const [ready, setReady] = useState(false);

  // Déclenche l'animation à chaque nouveau rendu de data
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, [data]);

  if (!data || data.length === 0) {
    return <p className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune donnée</p>;
  }

  const W = 320, H = height;
  const pad = { top: 20, right: 20, bottom: 28, left: 36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const xStep  = data.length > 1 ? innerW / (data.length - 1) : innerW;

  // Calcul points
  const pts = data.map((d, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + innerH - (d.value / maxVal) * innerH,
    ...d,
  }));

  // Path de la courbe (cubique smooth)
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

  // Area path (rempli sous la courbe)
  const buildArea = (points) => {
    if (points.length === 0) return '';
    const bottom = pad.top + innerH;
    return `${buildPath(points)} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  };

  const linePath = buildPath(pts);
  const areaPath = buildArea(pts);
  const pathId   = `line-${Math.random().toString(36).slice(2)}`;
  const gradId   = `grad-${Math.random().toString(36).slice(2)}`;

  // Génère une couleur principale (premier color ou fallback)
  const mainColor = colors[0] || '#6366f1';
  const altColor  = colors[1] || '#8b5cf6';

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={mainColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={mainColor} stopOpacity="0.02" />
        </linearGradient>
        {/* mask pour animation de remplissage gauche → droite */}
        <clipPath id={`clip-${pathId}`}>
          <rect
            x={pad.left - 2} y={0}
            width={ready ? innerW + 4 : 0} height={H}
            style={{ transition: ready ? 'width 1.2s cubic-bezier(0.22,1,0.36,1)' : 'none' }}
          />
        </clipPath>
      </defs>

      {/* Grille horizontale */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, gi) => {
        const yg = pad.top + innerH * (1 - frac);
        return (
          <g key={gi}>
            <line x1={pad.left} y1={yg} x2={pad.left + innerW} y2={yg}
              stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="1" strokeDasharray="4 3" />
            <text x={pad.left - 6} y={yg + 4} textAnchor="end" fontSize="9" fill={darkMode ? '#6b7280' : '#9ca3af'}>
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}

      {/* Zone remplie sous la courbe */}
      <path d={areaPath} fill={`url(#${gradId})`} clipPath={`url(#clip-${pathId})`} />

      {/* Courbe principale */}
      <path d={linePath} fill="none" stroke={mainColor} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        clipPath={`url(#clip-${pathId})`}
      />

      {/* Points + labels */}
      {pts.map((p, i) => (
        <g key={i} clipPath={`url(#clip-${pathId})`}>
          <circle cx={p.x} cy={p.y} r="4" fill={colors[i % colors.length] || mainColor}
            stroke={darkMode ? '#111827' : '#fff'} strokeWidth="2" />
          {/* Label valeur */}
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9.5" fontWeight="700"
            fill={darkMode ? '#e5e7eb' : '#374151'}>
            {p.value}
          </text>
          {/* Label nom (axe X) */}
          <text x={p.x} y={H - 6} textAnchor="middle" fontSize="8.5" fontWeight="600"
            fill={darkMode ? '#6b7280' : '#9ca3af'}>
            {(p.name || '').length > 9 ? (p.name).slice(0, 9) + '..' : (p.name || '')}
          </text>
        </g>
      ))}
    </svg>
  );
};

// ============================================================================
// MODAL CLÔTURER
// ============================================================================
const ModalCloturer = ({ darkMode, theme, record, onClose, onSuccess }) => {
  const [form, setForm]       = useState({ km_retour: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`;
  const labelCls = `block text-sm font-bold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`;

  // Durée calculée live dans la modal de clôture
  const dureeCalc = useMemo(() =>
    calculerDuree(record.date_debut, null, null), [record.date_debut]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await cloturerHistoriqueAffectation(record.id, {
        km_retour: form.km_retour || undefined,
        notes:     form.notes     || undefined,
      });
      onClose();
      onSuccess();
    } catch (err) {
      showError(darkMode, theme, 'Erreur', err.response?.data?.message || 'Erreur lors de la clôture.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-md shadow-2xl overflow-hidden`}>
        <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <i className="bi bi-check2-circle mr-2 text-green-400" />Clôturer l'emprunt
          </h3>
          <button type="button" onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
            <p className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <i className="bi bi-car-front mr-2 text-green-500" />
              {record.vehicule_immatriculation} — {record.vehicule_marque} {record.vehicule_modele}
            </p>
            <p className={`text-xs font-semibold mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Emprunt depuis le {formatDate(record.date_debut)} · Direction : {record.direction_emprunt_nom}
            </p>
            {dureeCalc && (
              <p className={`text-xs font-bold mt-1.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
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
            <label className={labelCls}>Notes <span className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optionnel)</span></label>
            <textarea value={form.notes} rows={3}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Observations, état du véhicule..."
              className={`${inputCls} resize-none`} />
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <button type="button" onClick={onClose}
            className={`px-5 py-2.5 rounded-lg border text-sm font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
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
// MODAL DÉTAIL — AGRANDI et mieux structuré
// ============================================================================
const ModalDetail = ({ darkMode, theme, record, onClose, onEdit, onCloturer }) => {
  const dureeCalc = useMemo(() =>
    record.duree_lisible || calculerDuree(record.date_debut, record.date_fin_reelle, record.date_fin_prevue) || '—',
    [record]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl`}
        style={{ animation: 'modalSlideIn 0.25s cubic-bezier(0.22,1,0.36,1)' }}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${theme?.primary},${theme?.primaryDark})` }}>
          <div className="flex items-center gap-4">
            {record.vehicule_photo && (
              <img src={getStorageUrl(record.vehicule_photo)} alt=""
                className="w-14 h-14 rounded-xl object-cover border-2 border-white/30" />
            )}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-white">{record.vehicule_immatriculation}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${getStatutColor(record.statut)}`}>
                  {getStatutLabel(record.statut)}
                </span>
              </div>
              <p className="text-white/80 text-sm font-semibold mt-0.5">
                {record.vehicule_marque} {record.vehicule_modele}
                {record.vehicule_couleur && <span className="ml-2 opacity-70">· {record.vehicule_couleur}</span>}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
            <i className="bi bi-x-lg text-lg" />
          </button>
        </div>

        {/* Corps en 3 colonnes */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* — Véhicule — */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-blue-50'} rounded-2xl p-5`}>
            <h3 className={`font-extrabold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              <i className="bi bi-car-front" />Véhicule
            </h3>
            <div className="space-y-3">
              {[
                ['Immatriculation', record.vehicule_immatriculation],
                ['Marque', record.vehicule_marque],
                ['Modèle', record.vehicule_modele],
                ['Couleur', record.vehicule_couleur || '—'],
                ['Km actuel', record.vehicule_km_actuel ? `${record.vehicule_km_actuel.toLocaleString()} km` : '—'],
              ].map(([lbl, val], i) => (
                <div key={i} className="flex justify-between items-start gap-2">
                  <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{lbl}</span>
                  <span className={`text-sm font-extrabold text-right max-w-[160px] ${darkMode ? 'text-white' : 'text-gray-900'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* — Affectation — */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-indigo-50'} rounded-2xl p-5`}>
            <h3 className={`font-extrabold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
              <i className="bi bi-arrow-left-right" />Affectation
            </h3>
            <div className="space-y-3">
              {[
                ['Direction origine',     record.direction_origine_nom     || '—'],
                ['Direction emprunt',     record.direction_emprunt_nom     || '—'],
                ['Affectation origine',   record.affectation_origine_nom   || '—'],
                ['Affectation emprunt',   record.affectation_emprunt_nom   || '—'],
                ['Demandé par',           record.demande_par_nom           || '—'],
                ['Validé par',            record.valide_par_nom            || '—'],
              ].map(([lbl, val], i) => (
                <div key={i} className="flex justify-between items-start gap-2">
                  <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{lbl}</span>
                  <span className={`text-sm font-extrabold text-right max-w-[160px] ${darkMode ? 'text-white' : 'text-gray-900'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* — Période & Km — */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-emerald-50'} rounded-2xl p-5`}>
            <h3 className={`font-extrabold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <i className="bi bi-calendar3" />Période & Km
            </h3>
            <div className="space-y-3">
              {[
                ['Date début',        formatDateTime(record.date_debut)],
                ['Date fin prévue',   formatDate(record.date_fin_prevue)],
                ['Date fin réelle',   formatDateTime(record.date_fin_reelle)],
                ['Durée',             dureeCalc],
                ['Km départ',         record.km_depart ? `${record.km_depart.toLocaleString()} km` : '—'],
                ['Km retour',         record.km_retour ? `${record.km_retour.toLocaleString()} km` : '—'],
              ].map(([lbl, val], i) => (
                <div key={i} className="flex justify-between items-start gap-2">
                  <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{lbl}</span>
                  <span className={`text-sm font-extrabold text-right max-w-[160px] ${darkMode ? 'text-white' : 'text-gray-900'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* — Motif & Notes (plein largeur) — */}
          {(record.motif || record.notes) && (
            <div className={`lg:col-span-3 ${darkMode ? 'bg-gray-800' : 'bg-amber-50'} rounded-2xl p-5`}>
              <h3 className={`font-extrabold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                <i className="bi bi-chat-left-text" />Motif & Notes
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {record.motif && (
                  <div>
                    <p className={`text-xs font-bold mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Motif</p>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{record.motif}</p>
                  </div>
                )}
                {record.notes && (
                  <div>
                    <p className={`text-xs font-bold mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notes</p>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          {record.statut === 'en_cours' && (
            <>
              <button type="button" onClick={() => { onClose(); onEdit(record); }}
                className={`px-5 py-2.5 rounded-lg border text-sm font-bold flex items-center gap-2 transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                <i className="bi bi-pencil" />Modifier
              </button>
              <button type="button" onClick={() => { onClose(); onCloturer(record); }}
                className="px-5 py-2.5 rounded-lg text-white text-sm font-bold flex items-center gap-2 hover:opacity-90"
                style={{ background: 'linear-gradient(to right,#10b981,#059669)' }}>
                <i className="bi bi-check2-circle" />Clôturer
              </button>
            </>
          )}
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90"
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

  // Durée calculée live à partir des champs du formulaire
  const dureeCalc = useMemo(() =>
    calculerDuree(form.date_debut || null, null, form.date_fin_prevue || null),
    [form.date_debut, form.date_fin_prevue]);

  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`;
  const labelCls = `block text-sm font-bold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`;

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

      if (isEdit) {
        await updateHistoriqueAffectation(record.id, payload);
      } else {
        await createHistoriqueAffectation(payload);
      }
      onClose();
      onSuccess();
    } catch (err) {
      const errors = err.response?.data?.errors;
      showError(darkMode, theme, 'Erreur', errors ? Object.values(errors).flat().join('\n') : (err.response?.data?.message || 'Erreur lors de l\'opération.'));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}
        style={{ animation: 'modalSlideIn 0.25s cubic-bezier(0.22,1,0.36,1)' }}>
        <div className={`p-6 border-b flex items-center justify-between sticky top-0 z-10 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <i className={`${isEdit ? 'bi bi-pencil-square text-amber-400' : 'bi bi-plus-circle text-blue-400'} mr-2`} />
            {isEdit ? `Modifier — ${record?.vehicule_immatriculation}` : 'Nouvel emprunt'}
          </h2>
          <button type="button" onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg text-lg" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          {/* Véhicule */}
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

          {/* Direction emprunt */}
          <div>
            <label className={labelCls}>Direction d'emprunt *</label>
            <select value={form.direction_emprunt_id}
              onChange={e => setForm({ ...form, direction_emprunt_id: e.target.value, affectation_emprunt_id: '' })}
              className={inputCls}>
              <option value="">— Sélectionner —</option>
              {directions.map(d => <option key={d.id} value={String(d.id)}>{d.nom}</option>)}
            </select>
          </div>

          {/* Affectation emprunt */}
          <div>
            <label className={labelCls}>Affectation <span className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optionnel)</span></label>
            <select value={form.affectation_emprunt_id}
              onChange={e => setForm({ ...form, affectation_emprunt_id: e.target.value })}
              className={inputCls}>
              <option value="">— Aucune —</option>
              {affectations.map(a => <option key={a.id} value={String(a.id)}>{a.code ? `${a.code} — ${a.nom}` : a.nom}</option>)}
            </select>
          </div>

          {/* Date début */}
          <div>
            <label className={labelCls}>Date de début *</label>
            <input type="date" value={form.date_debut}
              onChange={e => setForm({ ...form, date_debut: e.target.value })} className={inputCls} />
          </div>

          {/* Date fin prévue */}
          <div>
            <label className={labelCls}>Date de fin prévue <span className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optionnel)</span></label>
            <input type="date" value={form.date_fin_prevue}
              onChange={e => setForm({ ...form, date_fin_prevue: e.target.value })} className={inputCls} />
          </div>

          {/* Durée calculée automatiquement */}
          {(form.date_debut) && (
            <div className={`col-span-2 flex items-center gap-2 px-4 py-2.5 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-blue-50 border border-blue-100'}`}>
              <i className="bi bi-clock" style={{ color: theme?.primary }} />
              <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Durée calculée :</span>
              <span className="text-sm font-extrabold" style={{ color: theme?.primary }}>
                {dureeCalc || '—'}
              </span>
              {!form.date_fin_prevue && (
                <span className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  (jusqu'à aujourd'hui)
                </span>
              )}
            </div>
          )}

          {/* Km départ */}
          <div>
            <label className={labelCls}>Km au départ</label>
            <input type="number" min="0" value={form.km_depart}
              onChange={e => setForm({ ...form, km_depart: e.target.value })}
              placeholder="Ex : 140000" className={inputCls} />
          </div>

          {/* Motif */}
          <div>
            <label className={labelCls}>Motif</label>
            <input type="text" value={form.motif}
              onChange={e => setForm({ ...form, motif: e.target.value })}
              placeholder="Raison de l'emprunt..." maxLength={255} className={inputCls} />
          </div>

          {/* Notes */}
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
            className={`px-5 py-2.5 rounded-lg border text-sm font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
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
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState(null);
  const [fetchKey, setFetchKey] = useState(0);

  // ── Références ────────────────────────────────────────────────────────────
  const [vehicules,    setVehicules]    = useState([]);
  const [directions,   setDirections]   = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [refsLoaded,   setRefsLoaded]   = useState(false);
  const [refsError,    setRefsError]    = useState(null);

  // ── Filtres / Pagination ──────────────────────────────────────────────────
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

  const refreshRecords = useCallback(() => setFetchKey(k => k + 1), []);

  // ── Références ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setRefsLoaded(false); setRefsError(null);
    getReferencesHistorique()
      .then(data => {
        if (cancelled) return;
        setVehicules(data.vehicules      ?? []);
        setDirections(data.directions    ?? []);
        setAffectations(data.affectations ?? []);
        setRefsLoaded(true);
      })
      .catch(err => {
        if (!cancelled) { console.error(err); setRefsError('Impossible de charger les données de référence.'); setRefsLoaded(true); }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    getStatsHistoriqueAffectations()
      .then(data => { if (!cancelled) setStats(data); })
      .catch(err => { if (!cancelled) console.error('Erreur stats:', err); });
    return () => { cancelled = true; };
  }, [fetchKey]);

  // ── Liste ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHistoriqueAffectations({
      search:               searchTerm             || undefined,
      statut:               filterStatut           || undefined,
      direction_emprunt_id: filterDirectionEmprunt || undefined,
      page:                 currentPage,
      per_page:             itemsPerPage,
    })
      .then(data => {
        if (cancelled) return;
        const rows = data.data ?? data;
        // Enrich chaque record avec la durée calculée automatiquement
        setRecords(Array.isArray(rows) ? rows.map(enrichRecord) : []);
        setTotal(data.total ?? (Array.isArray(rows) ? rows.length : 0));
        setTotalPages((data.last_page ?? Math.ceil((data.total ?? (Array.isArray(rows) ? rows.length : 0)) / itemsPerPage)) || 1);
      })
      .catch(err => { if (!cancelled) console.error('Erreur liste:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [searchTerm, filterStatut, filterDirectionEmprunt, currentPage, fetchKey]);

  useEffect(() => {
    if (loading) return;
    setAnimateCards(false);
    const id = requestAnimationFrame(() => { const id2 = requestAnimationFrame(() => setAnimateCards(true)); return () => cancelAnimationFrame(id2); });
    return () => cancelAnimationFrame(id);
  }, [loading]);

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
      await deleteHistoriqueAffectation(record.id);
      showSuccess(darkMode, theme, 'Supprimé', "L'emprunt a été supprimé.", refreshRecords);
    } catch (err) {
      showError(darkMode, theme, 'Erreur', err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const resetFilters = () => { setSearchTerm(''); setFilterStatut(''); setFilterDirectionEmprunt(''); setCurrentPage(1); };

  // ── Données graphiques ────────────────────────────────────────────────────
  const statutData    = stats ? [
    { name: 'En cours', value: stats.en_cours  ?? 0 },
    { name: 'Terminés', value: stats.termines  ?? 0 },
    { name: 'Annulés',  value: stats.annules   ?? 0 },
  ] : [];
  const directionData = stats?.par_direction?.slice(0, 6).map(d => ({ name: d.direction, value: d.total })) ?? [];

  const inputCls = `px-3 py-2 rounded-lg border text-sm font-semibold focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`;

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
    `;
    document.head.appendChild(style);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div style={{ opacity: pageReady ? 1 : 0, transform: pageReady ? 'none' : 'translateY(12px)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}>
      {/* Lightbox */}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Véhicule" onClose={() => setLightboxSrc(null)} />}

      {/* Banner erreur */}
      {refsError && (
        <div className="mb-4 p-4 rounded-xl bg-red-100 border border-red-300 text-red-700 text-sm font-bold flex items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" /> {refsError}
        </div>
      )}

      {/* En-tête */}
      <div className="mb-6" style={{ animation: pageReady ? 'fadeInUp 0.4s ease-out both' : 'none' }}>
        {onBack && (
          <button type="button" onClick={onBack}
            className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}>
            <i className="bi bi-arrow-left" /> Retour aux véhicules
          </button>
        )}
        <h1 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <i className="bi bi-arrow-left-right mr-2" style={{ color: theme?.primary }} />
          Historique des affectations
        </h1>
        <p className={`text-sm font-semibold mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Gérez les emprunts et transferts de véhicules entre directions
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',    value: stats?.total    ?? '—', icon: 'bi-list-ul',         color: '#6366f1', bg: darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50' },
          { label: 'En cours', value: stats?.en_cours ?? '—', icon: 'bi-hourglass-split', color: '#3b82f6', bg: darkMode ? 'bg-blue-900/20'   : 'bg-blue-50'   },
          { label: 'Terminés', value: stats?.termines ?? '—', icon: 'bi-check2-circle',   color: '#10b981', bg: darkMode ? 'bg-emerald-900/20': 'bg-emerald-50' },
          { label: 'Annulés',  value: stats?.annules  ?? '—', icon: 'bi-x-circle',        color: '#ef4444', bg: darkMode ? 'bg-red-900/20'    : 'bg-red-50'    },
        ].map((card, i) => (
          <div key={i}
            className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5 flex items-center gap-4`}
            style={{ animation: pageReady ? `kpiBounce 0.5s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.09}s both` : 'none' }}>
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <i className={`${card.icon} text-xl`} style={{ color: card.color }} />
            </div>
            <div>
              <p className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
              <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* GRAPHIQUES EN COURBES ANIMÉES */}
      {stats && (
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
              className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ background: theme?.primary }} />
                <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{chart.title}</h3>
                <i className="bi bi-activity ml-auto text-xs" style={{ color: theme?.primary }} />
              </div>
              <AnimatedLineChart
                key={`${ci}-${fetchKey}`}
                data={chart.data}
                colors={chart.colors}
                darkMode={darkMode}
                height={150}
              />
            </div>
          ))}
        </div>
      )}

      {/* TOOLBAR */}
      <div
        className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-6`}
        style={{ animation: pageReady ? 'fadeInUp 0.45s ease-out 0.42s both' : 'none' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <i className={`bi bi-search text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input type="text" value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Véhicule, direction, motif..."
                className={`bg-transparent text-sm font-semibold outline-none w-44 ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
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
            {(searchTerm || filterStatut || filterDirectionEmprunt) && (
              <button type="button" onClick={resetFilters}
                className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                <i className="bi bi-x-lg" /> Effacer
              </button>
            )}
          </div>
          <button type="button" onClick={() => setShowAddModal(true)} disabled={!refsLoaded}
            className="px-5 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 shadow-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: `linear-gradient(to right,${theme?.primary},${theme?.primaryDark})` }}>
            <i className="bi bi-plus-lg" /> Nouvel emprunt
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div
        className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}
        style={{ animation: pageReady ? 'fadeInUp 0.5s ease-out 0.5s both' : 'none' }}>
        <div className={`px-5 py-3 flex items-center border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`text-sm font-extrabold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <i className="bi bi-list-ul mr-2" />{total} emprunt(s)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: `linear-gradient(135deg,${theme?.primary},${theme?.primaryDark})` }}>
                {['Véhicule', 'Dir. origine', 'Dir. emprunt', 'Date début', 'Date fin prévue', 'Durée', 'Statut', 'Actions'].map((h, i) => (
                  <th key={i} className={`px-5 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-white ${i === 7 ? 'text-center' : ''}`}>{h}</th>
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
                        <i className="bi bi-arrow-left-right text-4xl block mb-2" />Aucun emprunt trouvé
                      </td>
                    </tr>
                  )
                  : records.map((rec, rowIdx) => {
                    const photoUrl = rec.vehicule_photo ? getStorageUrl(rec.vehicule_photo) : null;
                    return (
                      <tr key={rec.id}
                        className="transition-all duration-200 hover:brightness-110"
                        style={{
                          backgroundColor: rowIdx % 2 === 0 ? (darkMode ? '#0c1929' : '#e8eef6') : (darkMode ? '#162033' : '#f1f4f9'),
                          animation: animateCards ? `fadeInUp 0.4s ease-out ${rowIdx * 0.04}s both` : 'none',
                        }}>
                        {/* Véhicule + photo avec loupe */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative group flex-shrink-0">
                              {photoUrl
                                ? (
                                  <>
                                    <img src={photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover cursor-pointer transition-transform group-hover:scale-105"
                                      onClick={() => setLightboxSrc(photoUrl)}
                                      onError={e => { e.target.style.display = 'none'; }} />
                                    {/* Loupe overlay */}
                                    <div
                                      className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      onClick={() => setLightboxSrc(photoUrl)}
                                    >
                                      <i className="bi bi-zoom-in text-white text-sm" />
                                    </div>
                                  </>
                                )
                                : (
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                    <i className="bi bi-car-front" style={{ color: theme?.primary }} />
                                  </div>
                                )}
                            </div>
                            <div>
                              <p className={`font-extrabold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{rec.vehicule_immatriculation}</p>
                              <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{rec.vehicule_marque} {rec.vehicule_modele}</p>
                            </div>
                          </div>
                        </td>
                        {/* Direction origine */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            <i className="bi bi-building text-[10px]" />{rec.direction_origine_nom || '—'}
                          </span>
                        </td>
                        {/* Direction emprunt */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ background: `${theme?.primary}22`, color: theme?.primary, border: `1px solid ${theme?.primary}44` }}>
                            <i className="bi bi-arrow-right text-[10px]" />{rec.direction_emprunt_nom || '—'}
                          </span>
                        </td>
                        <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{formatDate(rec.date_debut)}</td>
                        <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{formatDate(rec.date_fin_prevue)}</td>
                        {/* Durée — calculée automatiquement */}
                        <td className={`px-5 py-4 text-sm font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                          <span className="flex items-center gap-1">
                            <i className="bi bi-clock text-xs opacity-70" />
                            {rec.duree_lisible}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatutColor(rec.statut)}`}>{getStatutLabel(rec.statut)}</span>
                        </td>
                        <td className="px-5 py-4">
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
        {totalPages > 1 && (
          <div className={`px-5 py-3.5 border-t flex items-center justify-between ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, total)} sur {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                <i className="bi bi-chevron-double-left" />
              </button>
              <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                <i className="bi bi-chevron-left" />
              </button>
              {/* Pages visibles : max 10, fenêtre glissante */}
              {(() => {
                const window = 5;
                let start = Math.max(1, currentPage - Math.floor(window / 2));
                let end   = Math.min(totalPages, start + window - 1);
                if (end - start + 1 < window) start = Math.max(1, end - window + 1);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                  <button key={page} type="button" onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${currentPage === page ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                    style={currentPage === page ? { background: `linear-gradient(to right,${theme?.primary},${theme?.primaryDark})` } : {}}>
                    {page}
                  </button>
                ));
              })()}
              <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                <i className="bi bi-chevron-right" />
              </button>
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
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
          onSuccess={() => { setShowAddModal(false); showSuccess(darkMode, theme, 'Emprunt créé', "L'emprunt a été enregistré.", refreshRecords); }}
        />
      )}

      {showEditModal && selectedRecord && (
        <ModalForm
          darkMode={darkMode} theme={theme} isEdit={true} record={selectedRecord}
          vehicules={vehicules} directions={directions} affectations={affectations}
          onClose={() => { setShowEditModal(false); setSelectedRecord(null); }}
          onSuccess={() => { setShowEditModal(false); setSelectedRecord(null); showSuccess(darkMode, theme, 'Modifié', "L'emprunt a été mis à jour.", refreshRecords); }}
        />
      )}

      {showDetailModal && selectedRecord && (
        <ModalDetail
          darkMode={darkMode} theme={theme} record={selectedRecord}
          onClose={() => { setShowDetailModal(false); setSelectedRecord(null); }}
          onEdit={r => { setSelectedRecord(r); setShowEditModal(true); }}
          onCloturer={r => { setCloturerTarget(r); setShowCloturerModal(true); }}
        />
      )}

      {showCloturerModal && cloturerTarget && (
        <ModalCloturer
          darkMode={darkMode} theme={theme} record={cloturerTarget}
          onClose={() => { setShowCloturerModal(false); setCloturerTarget(null); }}
          onSuccess={() => { setShowCloturerModal(false); setCloturerTarget(null); showSuccess(darkMode, theme, 'Clôturé', "L'emprunt a été clôturé.", refreshRecords); }}
        />
      )}
    </div>
  );
};

export default HistoriqueAffectationsTab;