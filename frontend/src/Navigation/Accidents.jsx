import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showConfirm } from '../utils/walConfig';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  getAccidents,
  getAccident,
  getAccidentFormData,
  getAccidentStatistiques,
  createAccident,
  updateAccident,
  updateAccidentStatut,
  deleteAccident,
} from '../api/Admin-Axios/Accident-axios';

// ============================================================================
// SWEETALERT2 — helpers centralisés (utils/walConfig.js), identiques à la page Interventions
// ============================================================================
const swalError   = (darkMode, theme, title, text) => showError(darkMode, theme, title || 'Une erreur est survenue', text);
const swalSuccess = (darkMode, theme, title, text) => showSuccess(darkMode, theme, title || 'Succès', text);
const swalConfirm = async (darkMode, theme, title, text, confirmText = 'Supprimer') => {
  const result = await showConfirm(darkMode, theme, { title, html: text, confirmText, isDanger: true });
  return result.isConfirmed;
};

// ============================================================================
// HOOK — COMPTEUR ANIMÉ
// ============================================================================
const useCountUp = (target, duration = 1200, decimals = 0) => {
  const [value, setValue] = useState(0);
  const rafRef  = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(parseFloat((ease * target).toFixed(decimals)));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, decimals]);

  return value;
};

// ============================================================================
// TOOLTIP
// ============================================================================
const Tooltip = ({ children, label, darkMode }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  const handleMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);
  return (
    <div ref={ref} className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMove}>
      {children}
      {visible && label && (
        <div className={`pointer-events-none absolute z-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xl whitespace-nowrap
          ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-900 text-white'}`}
          style={{ left: pos.x + 12, top: pos.y - 32, transform: 'translateY(-50%)' }}>
          {label}
          <div className={`absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 rotate-45 ${darkMode ? 'bg-gray-700' : 'bg-gray-900'}`} />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DONNÉES DE RÉFÉRENCE (labels + couleurs — constantes côté front)
// ============================================================================
const NIVEAUX_DEGATS = [
  { code: 'leger',    libelle: 'Léger',    color: '#10b981', bg: 'bg-green-100 text-green-700',   icon: 'bi-shield-check' },
  { code: 'modere',   libelle: 'Modéré',   color: '#f59e0b', bg: 'bg-yellow-100 text-yellow-700', icon: 'bi-shield-exclamation' },
  { code: 'grave',    libelle: 'Grave',    color: '#f97316', bg: 'bg-orange-100 text-orange-700',  icon: 'bi-shield-fill-exclamation' },
  { code: 'critique', libelle: 'Critique', color: '#ef4444', bg: 'bg-red-100 text-red-700',        icon: 'bi-shield-fill-x' },
];

const TYPES_RESPONSABILITE = [
  { code: 'responsable',              libelle: 'Responsable',           color: '#ef4444', bg: 'bg-red-100 text-red-700' },
  { code: 'tiers_responsable',        libelle: 'Tiers Responsable',     color: '#6366f1', bg: 'bg-indigo-100 text-indigo-700' },
  { code: 'responsabilite_partagee',  libelle: 'Responsabilité Partagée', color: '#f59e0b', bg: 'bg-yellow-100 text-yellow-700' },
  { code: 'indetermine',              libelle: 'Indéterminé',           color: '#94a3b8', bg: 'bg-gray-100 text-gray-600' },
  { code: 'force_majeure',            libelle: 'Force Majeure',         color: '#8b5cf6', bg: 'bg-purple-100 text-purple-700' },
];

const STATUTS = [
  { code: 'declare',       libelle: 'Déclaré',           color: '#6366f1', bg: 'bg-indigo-100 text-indigo-700', icon: 'bi-flag-fill' },
  { code: 'en_cours',      libelle: 'En cours',          color: '#f59e0b', bg: 'bg-yellow-100 text-yellow-700', icon: 'bi-clock-fill' },
  { code: 'en_reparation', libelle: 'En réparation',     color: '#06b6d4', bg: 'bg-cyan-100 text-cyan-700',     icon: 'bi-tools' },
  { code: 'assurance',     libelle: 'Dossier assurance', color: '#8b5cf6', bg: 'bg-purple-100 text-purple-700', icon: 'bi-file-earmark-medical-fill' },
  { code: 'cloture',       libelle: 'Clôturé',           color: '#10b981', bg: 'bg-green-100 text-green-700',   icon: 'bi-check-circle-fill' },
  { code: 'litige',        libelle: 'Litige',            color: '#ef4444', bg: 'bg-red-100 text-red-700',       icon: 'bi-exclamation-octagon-fill' },
];

const PERIODES = [
  { code: '7',   libelle: '7 jours',     jours: 7 },
  { code: '30',  libelle: 'Mensuel',     jours: 30 },
  { code: '90',  libelle: 'Trimestriel', jours: 90 },
  { code: '180', libelle: 'Semestriel',  jours: 180 },
  { code: '365', libelle: 'Annuel',      jours: 365 },
];

// ============================================================================
// UTILITAIRES
// ============================================================================
const getNiveauInfo      = (code) => NIVEAUX_DEGATS.find(n => n.code === code)      || { libelle: code, color: '#94a3b8', bg: 'bg-gray-100 text-gray-600', icon: 'bi-circle' };
const getStatutInfo      = (code) => STATUTS.find(s => s.code === code)             || { libelle: code, color: '#94a3b8', bg: 'bg-gray-100 text-gray-600', icon: 'bi-circle' };
const getResponsabiliteInfo = (code) => TYPES_RESPONSABILITE.find(r => r.code === code) || { libelle: code, bg: 'bg-gray-100 text-gray-600' };

const formatCFA = (val) => {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
};

const formatRelative = (isoDate) => {
  if (!isoDate) return '—';
  const diff = (new Date() - new Date(isoDate)) / 1000;
  if (diff < 3600)   return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)  return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return new Date(isoDate).toLocaleDateString('fr-FR');
};

// Extrait le message d'erreur lisible depuis une réponse axios
const extractErrorMessage = (error) => {
  const data = error?.response?.data;
  if (!data) return error?.message || 'Erreur réseau inconnue.';
  if (data.message) return data.message;
  if (data.errors) {
    const first = Object.values(data.errors)[0];
    return Array.isArray(first) ? first[0] : first;
  }
  return 'Une erreur inattendue est survenue.';
};

const exportToExcel = (data, filename, headers) => {
  let csv = '\uFEFF' + headers.join(';') + '\n';
  data.forEach(r => { csv += r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';') + '\n'; });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const exportToPDF = (title, headers, rows) => {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>@page{size:landscape;margin:15mm}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:20px}
  h1{font-size:20px;border-bottom:3px solid #1e3a5f;padding-bottom:8px;margin-bottom:12px}
  .meta{color:#64748b;font-size:11px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;font-size:10px}
  th{background:#1e3a5f;color:#fff;padding:8px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.5px}
  td{padding:7px 10px;border-bottom:1px solid #e2e8f0}
  tr:nth-child(odd) td{background:#fff5f5}tr:nth-child(even) td{background:#f8fafc}
  .footer{margin-top:20px;text-align:center;color:#94a3b8;font-size:10px;border-top:1px solid #e2e8f0;padding-top:8px}
  </style></head><body>
  <h1>🚨 ${title}</h1><div class="meta">Export le ${new Date().toLocaleDateString('fr-FR')} — ${rows.length} accident(s)</div>
  <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="footer">SGS Fleetify — Registre des Accidents — ${new Date().getFullYear()}</div>
  <script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
};

// ============================================================================
// TOAST — notification légère (non bloquant, pour les actions mineures)
// ============================================================================
const Toast = ({ message, type, onClose, theme }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const icon = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }[type];
  const bg     = type === 'error' ? '#ef4444' : type === 'warning' ? '#f97316' : theme?.primary || '#3b82f6';
  const bgDark = type === 'error' ? '#dc2626' : type === 'warning' ? '#ea580c' : theme?.primaryDark || '#2563eb';
  return (
    <div className="fixed top-4 right-4 z-[9999] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px]"
      style={{ background: `linear-gradient(135deg, ${bg}, ${bgDark})`, animation: 'fadeInDown .3s ease-out' }}>
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
        <i className={`bi ${icon} text-base`}></i>
      </div>
      <span className="font-semibold text-sm flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <i className="bi bi-x-lg text-sm"></i>
      </button>
    </div>
  );
};

// ============================================================================
// DONUT CHART SVG
// ============================================================================
const DonutChart = ({ data, size = 120, strokeWidth = 14, darkMode }) => {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const len = pct * circ;
    const seg = { ...d, i, pct, len, offset };
    offset += len;
    return seg;
  });
  return (
    <div className="relative inline-block" ref={svgRef}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={darkMode ? '#1f2937' : '#f1f5f9'} strokeWidth={strokeWidth} />
        {segments.map(seg => (
          <circle key={seg.i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={seg.color}
            strokeWidth={tooltip?.label === seg.label ? strokeWidth + 3 : strokeWidth}
            strokeDasharray={`${seg.len} ${circ - seg.len}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-width 0.15s ease', cursor: 'pointer' }}
            onMouseMove={(e) => {
              const rect = svgRef.current?.getBoundingClientRect();
              if (!rect) return;
              setTooltip({ label: seg.label, value: seg.value, pct: (seg.pct*100).toFixed(1), color: seg.color, x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
            onMouseLeave={() => setTooltip(null)} />
        ))}
      </svg>
      {tooltip && (
        <div className={`pointer-events-none absolute z-50 px-2.5 py-2 rounded-lg text-xs font-semibold shadow-xl whitespace-nowrap
          ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-900 text-white'}`}
          style={{ left: tooltip.x + 10, top: tooltip.y - 38 }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tooltip.color }}></span>
            <span>{tooltip.label}</span>
          </div>
          <div className="mt-0.5 text-[11px] opacity-80">{tooltip.value} accident{tooltip.value > 1 ? 's' : ''} · {tooltip.pct}%</div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// AREA CHART — tendance lissée (courbe) avec dégradé sous la courbe
// ============================================================================
const AreaTrendChart = ({ points, color = '#ef4444', darkMode, height = 220, formatValue }) => {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const W = 760, H = height;
  const padL = 36, padR = 16, padT = 18, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // ── Toujours afficher janvier → décembre de l'année en cours ──
  const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const annee = new Date().getFullYear();

const displayPoints = React.useMemo(() => {
    return MOIS.map((label, i) => {
        const found = points.find(p => {
            // Matcher sur full_label format "2026-06-01" envoyé par le backend
            if (p.full_label || p.fullLabel) {
                const d = new Date(p.full_label || p.fullLabel);
                if (!isNaN(d)) return d.getMonth() === i;
            }
            // Fallback : matcher sur le label court "Jun", "Fév"...
            return p.label?.toLowerCase().startsWith(label.toLowerCase());
        });
        return {
            label,
            fullLabel: `${label} ${annee}`,
            value: found?.value ?? 0,
        };
    });
}, [points]);

  const values = displayPoints.map(p => p.value);
  const maxV = Math.max(...values, 1);
  const minV = 0;
  const range = (maxV - minV) || 1;

  const stepX = innerW / (displayPoints.length - 1);
  const coords = displayPoints.map((p, i) => ({
    x: padL + i * stepX,
    y: padT + innerH - ((p.value - minV) / range) * innerH,
    ...p,
  }));

  // Courbe lissée Catmull-Rom
  const smoothPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const linePath = smoothPath(coords);
  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x},${padT + innerH} L ${coords[0].x},${padT + innerH} Z`
    : '';

  // Deuxième courbe décalée pour l'effet "multicouche" du screenshot
  const coords2 = coords.map(c => ({ ...c, y: Math.min(padT + innerH, c.y + (innerH * 0.18)) }));
  const linePath2 = smoothPath(coords2);
  const areaPath2 = coords2.length > 0
    ? `${linePath2} L ${coords2[coords2.length - 1].x},${padT + innerH} L ${coords2[0].x},${padT + innerH} Z`
    : '';

  const gridLines = 4;
  const gridYs = Array.from({ length: gridLines + 1 }, (_, i) => padT + (innerH / gridLines) * i);

  const gradId   = `areaGrad-main`;
  const gradId2  = `areaGrad-shadow`;
  const glowId   = `glowFilter`;

  const handleMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || coords.length === 0) return;
    const scaleX = W / rect.width;
    const relX = (e.clientX - rect.left) * scaleX;
    let nearest = 0, bestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - relX);
      if (dist < bestDist) { bestDist = dist; nearest = i; }
    });
    setHover(nearest);
  };

  // Couleur secondaire — version plus claire du color principal
  const color2 = color + '99';

  return (
    <div className="relative w-full" ref={svgRef} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
        onMouseMove={handleMove}
        style={{ display: 'block', cursor: 'crosshair' }}>
        <defs>
          {/* Dégradé principal — opaque en haut, transparent en bas */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color}  stopOpacity="0.55" />
            <stop offset="100%" stopColor={color}  stopOpacity="0.02" />
          </linearGradient>
          {/* Dégradé couche du dessous — plus clair */}
          <linearGradient id={gradId2} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color2} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color2} stopOpacity="0.01" />
          </linearGradient>
          {/* Glow sur la ligne */}
          <filter id={glowId} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Grille horizontale pointillée */}
        {gridYs.map((y, i) => (
          <line key={i} x1={padL} x2={W - padR} y1={y} y2={y}
            stroke={darkMode ? '#ffffff12' : '#00000010'}
            strokeWidth="1" strokeDasharray="4 6" />
        ))}

        {/* Labels Y */}
        {gridYs.map((y, i) => {
          const val = maxV - (range / gridLines) * i;
          return (
            <text key={i} x={padL - 8} y={y + 4} textAnchor="end"
              fontSize="9" fill={darkMode ? '#ffffff40' : '#00000040'} fontWeight="600">
              {formatValue ? formatValue(Math.round(val)) : Math.round(val)}
            </text>
          );
        })}

        {/* Aire couche du dessous (shadow) */}
        {areaPath2 && <path d={areaPath2} fill={`url(#${gradId2})`} />}
        {linePath2 && <path d={linePath2} fill="none" stroke={color2} strokeWidth="1.5"
          strokeLinecap="round" opacity="0.5" />}

        {/* Aire couche principale */}
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

        {/* Ligne principale avec glow */}
        {linePath && (
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            filter={`url(#${glowId})`} />
        )}

        {/* Ligne verticale + point au hover */}
        {hover !== null && coords[hover] && (
          <>
            <line x1={coords[hover].x} x2={coords[hover].x}
              y1={padT} y2={padT + innerH}
              stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            {/* Halo */}
            <circle cx={coords[hover].x} cy={coords[hover].y} r={8}
              fill={color} opacity="0.15" />
            <circle cx={coords[hover].x} cy={coords[hover].y} r={4.5}
              fill={darkMode ? '#0c1929' : '#ffffff'} stroke={color} strokeWidth="2.5" />
          </>
        )}

        {/* Points discrets sur chaque mois */}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={hover === i ? 0 : 2.5}
            fill={color} opacity={c.value > 0 ? 0.7 : 0.2} />
        ))}

        {/* Labels X — Jan à Déc */}
        {coords.map((c, i) => (
          <text key={i} x={c.x} y={H - 8} textAnchor="middle"
            fontSize="10" fontWeight="700"
            fill={hover === i ? color : (darkMode ? '#ffffff50' : '#00000050')}>
            {c.label}
          </text>
        ))}
      </svg>

      {/* Tooltip hover */}
      {hover !== null && coords[hover] && (
        <div className="pointer-events-none absolute z-50 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xl whitespace-nowrap border"
          style={{
            left: `${(coords[hover].x / W) * 100}%`,
            top:  `${Math.max(4, ((coords[hover].y - 10) / H) * 100)}%`,
            transform: 'translate(-50%, -100%)',
            background: darkMode ? '#1e3a5f' : '#1e293b',
            borderColor: color + '60',
            color: '#fff',
          }}>
          <div className="opacity-70 text-[10px] mb-0.5">{coords[hover].fullLabel}</div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }}></span>
            <span>{coords[hover].value} accident{coords[hover].value > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LIGHTBOX
// ============================================================================
const Lightbox = ({ photos, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % photos.length);
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + photos.length) % photos.length);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [photos.length, onClose]);
  const photo = photos[idx];
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <i className="bi bi-camera-fill text-white text-sm"></i>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{photo.nom}</p>
            <p className="text-gray-400 text-xs">{idx + 1} / {photos.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={photo.url} download={photo.nom}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            onClick={e => e.stopPropagation()}>
            <i className="bi bi-download"></i> Télécharger
          </a>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-16 min-h-0" onClick={e => e.stopPropagation()}>
        {photos.length > 1 && (
          <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all hover:scale-110">
            <i className="bi bi-chevron-left text-lg"></i>
          </button>
        )}
        <img src={photo.url} alt={photo.nom} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none" style={{ animation: 'fadeInUp .2s ease-out' }} />
        {photos.length > 1 && (
          <button onClick={() => setIdx(i => (i + 1) % photos.length)}
            className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all hover:scale-110">
            <i className="bi bi-chevron-right text-lg"></i>
          </button>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
          {photos.map((p, i) => (
            <button key={p.id} onClick={() => setIdx(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden transition-all border-2 ${i === idx ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`}>
              <img src={p.url} alt={p.nom} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
};

// ============================================================================
// MODAL DÉTAIL ACCIDENT
// ============================================================================
const AccidentModal = ({ accident: a, darkMode, theme, onClose, onEdit, onDelete, onChangeStatut }) => {
  const niveau  = getNiveauInfo(a.niveau_degats);
  const statut  = getStatutInfo(a.statut);
  const resp    = getResponsabiliteInfo(a.type_responsabilite);
  const [lightbox, setLightbox] = useState(null);
  const photos = a.photos || [];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-[96vw] h-[96vh] overflow-hidden flex flex-col shadow-2xl`}>

        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}
          style={{ background: `linear-gradient(135deg, ${theme.primary}18, transparent)` }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className="bi bi-car-front-fill"></i>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{a.ref}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${niveau.bg}`}>
                  <i className={`${niveau.icon} mr-1`}></i>{niveau.libelle}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statut.bg}`}>
                  <i className={`${statut.icon} mr-1`}></i>{statut.libelle}
                </span>
              </div>
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {a.date_accident ? new Date(a.date_accident).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                {a.date_accident ? ` à ${new Date(a.date_accident).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* Alerte chauffeur externe */}
          {a.chauffeur_externe && (
            <div className={`rounded-xl p-4 border border-yellow-300 mb-5 ${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} flex items-center gap-3`}>
              <i className="bi bi-person-exclamation text-yellow-500 text-2xl"></i>
              <div>
                <p className={`text-sm font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>Chauffeur externe non enregistré</p>
                <p className={`text-xs ${darkMode ? 'text-yellow-500' : 'text-yellow-500'}`}>Ce chauffeur n'est pas dans le système Fleetify</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-5">

            {/* COLONNE 1 */}
            <div className="space-y-4">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-blue-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-person-fill mr-1.5"></i>Chauffeur & Véhicule
                </p>
                <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#dbeafe'}` }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ background: theme.primary }}>{(a.chauffeur_nom || '?').charAt(0)}</div>
                  <div>
                    <p className={`font-bold text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{a.chauffeur_nom || '—'}</p>

                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.chauffeur_direction || '—'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ['Véhicule',        a.vehicule_immatriculation || '—',                     'bi-car-front-fill'],
                    ['Kilométrage',     a.km_au_moment_accident ? `${Number(a.km_au_moment_accident).toLocaleString('fr-FR')} km` : '—', 'bi-speedometer2'],
                    ['Mission liée',   a.mission_reference || 'Aucune',                        'bi-geo-fill'],
                    ['Statut véhicule', a.vehicule_statut || '—',                              'bi-circle-fill'],
                  ].map(([l, v, ic], i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <i className={`bi ${ic} text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{l}</span>
                      </div>
                      <span className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-orange-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-geo-alt-fill mr-1.5"></i>Détails de l'accident
                </p>
                <div className="space-y-3">
                  {[
                    ['Lieu',         a.lieu || '—',                                                     'bi-pin-map-fill'],
                    ['Position GPS', a.position_gps || '—',                                             'bi-crosshair'],
                    ['Rapport police', a.rapport_police ? 'Disponible ✓' : 'Non disponible',           'bi-file-earmark-text-fill'],
                  ].map(([l, v, ic], i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <i className={`bi ${ic} text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{l}</span>
                      </div>
                      <span className={`text-xs font-semibold text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{v}</span>
                    </div>
                  ))}
                  {/* Lien rapport police */}
                  {a.rapport_police_url && (
                    <a href={a.rapport_police_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-xs font-semibold mt-1 hover:underline"
                      style={{ color: theme.primary }}>
                      <i className="bi bi-download"></i> Télécharger le rapport
                    </a>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-person-badge-fill text-xs" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}></i>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Responsabilité</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${resp.bg}`}>{resp.libelle}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-slash-circle-fill text-xs" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}></i>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Véhicule immobilisé</span>
                    </div>
                    {a.vehicule_immobilise
                      ? <span className="text-red-500 font-semibold text-xs"><i className="bi bi-x-circle-fill mr-1"></i>Oui · {a.jours_immobilisation || '?'} j</span>
                      : <span className="text-green-500 font-semibold text-xs"><i className="bi bi-check-circle-fill mr-1"></i>Non</span>}
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-chat-left-text-fill mr-1.5"></i>Description
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>{a.description || '—'}</p>
                {a.notes && (
                  <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <i className="bi bi-sticky-fill mr-1.5"></i>{a.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* COLONNE 2 */}
            <div className="space-y-4">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-green-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-cash-stack mr-1.5"></i>Coûts & Assurance
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Coût estimé',           val: formatCFA(a.cout_estime),               icon: 'bi-calculator-fill',          color: '#f59e0b' },
                    { label: 'Coût final réparation', val: formatCFA(a.cout_reparation_final),     icon: 'bi-tools',                    color: '#06b6d4' },
                    { label: 'Réclamé assurance',     val: formatCFA(a.montant_reclame_assurance), icon: 'bi-file-earmark-medical-fill', color: '#8b5cf6' },
                    { label: 'Versé assurance',       val: formatCFA(a.montant_verse_assurance),   icon: 'bi-check2-circle',            color: '#10b981' },
                  ].map((k, i) => (
                    <div key={i} className={`${darkMode ? 'bg-gray-700/60' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${k.color}22` }}>
                          <i className={`${k.icon} text-sm`} style={{ color: k.color }}></i>
                        </div>
                        <span className={`text-[10px] font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</span>
                      </div>
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} break-words`}>{k.val}</p>
                    </div>
                  ))}
                </div>
                {/* Montant perte & taux couverture */}
                {(a.montant_perte !== undefined || a.taux_couverture_assurance !== undefined) && (
                  <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-green-200'} grid grid-cols-2 gap-3`}>
                    <div>
                      <p className={`text-[10px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Perte nette</p>
                      <p className={`text-sm font-bold text-red-500`}>{formatCFA(a.montant_perte)}</p>
                    </div>
                    {a.taux_couverture_assurance !== null && (
                      <div>
                        <p className={`text-[10px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Taux couverture</p>
                        <p className="text-sm font-bold text-green-500">{a.taux_couverture_assurance}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* COLONNE 3 */}
            <div className="space-y-4">
              {/* Photos */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-camera-fill mr-1.5"></i>Photos
                  {photos.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: `${theme.primary}22`, color: theme.primary }}>{photos.length}</span>
                  )}
                </p>
                {photos.length === 0 ? (
                  <div className={`text-center py-8 rounded-xl border-2 border-dashed ${darkMode ? 'border-gray-700 text-gray-600' : 'border-gray-200 text-gray-300'}`}>
                    <i className="bi bi-image text-4xl block mb-2"></i>
                    <p className="text-xs">Aucune photo disponible</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, i) => (
                      <button key={photo.id} onClick={() => setLightbox(i)}
                        className="relative group rounded-xl overflow-hidden aspect-square transition-all hover:scale-105 hover:shadow-lg">
                        <img src={photo.url} alt={photo.nom} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 rounded-full p-2">
                            <i className="bi bi-zoom-in text-white text-base"></i>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Changer le statut */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-indigo-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-arrow-repeat mr-1.5"></i>Changer le statut
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUTS.map(s => (
                    <button key={s.code} onClick={() => onChangeStatut(a.id, s.code)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        a.statut === s.code
                          ? `${s.bg} border-transparent shadow-sm`
                          : darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}>
                      <i className={s.icon}></i>{s.libelle}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(a)}
              className="px-4 py-2.5 rounded-lg text-white text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className="bi bi-pencil-fill"></i> Modifier
            </button>
            <button onClick={() => onDelete(a.id)}
              className="px-4 py-2.5 rounded-lg border border-red-300 text-red-500 text-sm font-semibold flex items-center gap-2 hover:bg-red-50 transition-colors">
              <i className="bi bi-trash3-fill"></i> Supprimer
            </button>
          </div>
          <button onClick={onClose}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}>
            Fermer
          </button>
        </div>
      </div>

      {lightbox !== null && photos.length > 0 && (
        <Lightbox photos={photos} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
};

// ============================================================================
// MODAL FORMULAIRE ACCIDENT
// ============================================================================
const AccidentFormModal = ({ accident, darkMode, theme, onClose, onSave, formData, saving }) => {
  const isEdit = !!accident;

  const [form, setForm] = useState({
    vehicule_immatriculation:  accident?.vehicule_immatriculation  || '',
    chauffeur_type:            accident?.chauffeur_externe ? 'autre' : 'registre',
    chauffeur_user_id:         accident?.chauffeur_id              || '',
    chauffeur_nom_libre:       accident?.chauffeur_externe ? (accident?.chauffeur_nom || '') : '',
    direction_nom_libre:       accident?.chauffeur_externe ? (accident?.chauffeur_direction || '') : '',
    mission_id:                accident?.mission_id                || '',
    date_accident:             accident?.date_accident ? new Date(accident.date_accident).toISOString().slice(0, 16) : '',
    lieu:                      accident?.lieu                      || '',
    position_gps:              accident?.position_gps              || '',
    description:               accident?.description               || '',
    type_responsabilite:       accident?.type_responsabilite       || 'indetermine',
    niveau_degats:             accident?.niveau_degats             || 'leger',
    rapport_police_fichier:    null,
    rapport_police_supprimer:  false,
    photos:                    [], // nouveaux fichiers File[]
    photos_existantes:         accident?.photos                    || [], // photos déjà en BDD
    photos_supprimer:          [],
    vehicule_immobilise:       accident?.vehicule_immobilise       || false,
    jours_immobilisation:      accident?.jours_immobilisation      || '',
    nouveau_statut_vehicule:   '',
    km_au_moment_accident:     accident?.km_au_moment_accident     || '',
    assure:                    accident?.assure                    ?? true,
    cout_estime:               accident?.cout_estime               || '',
    cout_reparation_final:     accident?.cout_reparation_final     || '',
    montant_reclame_assurance: accident?.montant_reclame_assurance || '',
    montant_verse_assurance:   accident?.montant_verse_assurance   || '',
    statut:                    accident?.statut                    || 'declare',
    notes:                     accident?.notes                     || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: typeof v === 'function' ? v(f[k]) : v }));

  const handleSubmit = () => {
    if (!form.vehicule_immatriculation || !form.date_accident) return;
    if (form.chauffeur_type === 'registre' && !form.chauffeur_user_id) return;
    if (form.chauffeur_type === 'autre'    && !form.chauffeur_nom_libre.trim()) return;

    // Construire le payload final
    const payload = {
      vehicule_immatriculation:  form.vehicule_immatriculation,
      chauffeur_type:            form.chauffeur_type,
      chauffeur_user_id:         form.chauffeur_type === 'registre' ? form.chauffeur_user_id : null,
      chauffeur_nom_libre:       form.chauffeur_type === 'autre'    ? form.chauffeur_nom_libre : null,
      direction_nom_libre:       form.chauffeur_type === 'autre'    ? form.direction_nom_libre : null,
      mission_id:                form.mission_id || null,
      date_accident:             form.date_accident,
      lieu:                      form.lieu,
      position_gps:              form.position_gps,
      description:               form.description,
      type_responsabilite:       form.type_responsabilite,
      niveau_degats:             form.niveau_degats,
      rapport_police_fichier:    form.rapport_police_fichier,
      rapport_police_supprimer:  form.rapport_police_supprimer,
      photos:                    form.photos,
      photos_supprimer:          form.photos_supprimer.length > 0 ? JSON.stringify(form.photos_supprimer) : null,
      vehicule_immobilise:       form.vehicule_immobilise,
      jours_immobilisation:      form.vehicule_immobilise ? form.jours_immobilisation : null,
      nouveau_statut_vehicule:   form.nouveau_statut_vehicule || null,
      km_au_moment_accident:     form.km_au_moment_accident,
      assure:                    form.assure,
      cout_estime:               form.cout_estime,
      cout_reparation_final:     form.cout_reparation_final,
      montant_reclame_assurance: form.montant_reclame_assurance,
      montant_verse_assurance:   form.montant_verse_assurance,
      statut:                    form.statut,
      notes:                     form.notes,
    };

    onSave(payload, accident?.id);
  };

  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;
  const labelCls = `block text-sm font-bold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`;

  // Statuts véhicule depuis formData backend
  const statutsVehicule = formData?.statuts_vehicule
    ? Object.entries(formData.statuts_vehicule).map(([code, libelle]) => ({ code, libelle }))
    : [];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-[96vw] h-[96vh] overflow-hidden flex flex-col shadow-2xl`}>

        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}
          style={{ background: `linear-gradient(135deg, ${theme.primary}18, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className={`bi ${isEdit ? 'bi-pencil-fill' : 'bi-plus-lg'} text-base`}></i>
            </div>
            <div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isEdit ? 'Modifier l\'accident' : 'Enregistrer'}
              </h2>
              {isEdit && <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{accident.ref}</p>}
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-2 gap-8">

            {/* ═══ COLONNE GAUCHE ═══ */}
            <div className="space-y-5">

              {/* Acteurs */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-people-fill mr-1.5"></i>Acteurs
                </p>

                {/* Type de chauffeur */}
                <div className="mb-3">
                  <label className={labelCls}>Type de chauffeur</label>
                  <div className="flex gap-2">
                    {[['registre', 'Chauffeur enregistré'], ['autre', 'Autre (externe)']].map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => set('chauffeur_type', val)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          form.chauffeur_type === val
                            ? 'text-white border-transparent'
                            : darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                        style={form.chauffeur_type === val ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {form.chauffeur_type === 'registre' ? (
                  <div>
                    <label className={labelCls}>Chauffeur *</label>
                    <select value={form.chauffeur_user_id} onChange={e => set('chauffeur_user_id', e.target.value)} className={inputCls}>
                      <option value="">Sélectionner un chauffeur</option>
                      {(formData?.chauffeurs || []).map(c => (
                        <option key={c.id} value={c.id}>{c.nom} {c.direction ? `— ${c.direction}` : ''}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Nom du chauffeur *</label>
                      <input type="text" value={form.chauffeur_nom_libre} onChange={e => set('chauffeur_nom_libre', e.target.value)}
                        placeholder="Nom complet du chauffeur" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Direction / Entité</label>
                      <input type="text" value={form.direction_nom_libre} onChange={e => set('direction_nom_libre', e.target.value)}
                        placeholder="Ex: Direction Logistique" className={inputCls} />
                    </div>
                  </div>
                )}

                {/* Véhicule */}
                <div className="mt-3">
                  <label className={labelCls}>Véhicule *</label>
                  <select value={form.vehicule_immatriculation} onChange={e => set('vehicule_immatriculation', e.target.value)} className={inputCls}>
                    <option value="">Sélectionner un véhicule</option>
                    {(formData?.vehicules || []).map(v => (
                      <option key={v.immatriculation} value={v.immatriculation}>
                        {v.immatriculation} — {v.marque} {v.modele}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mission (optionnel) */}
                <div className="mt-3">
                  <label className={labelCls}>Mission liée (optionnel)</label>
                  <select value={form.mission_id} onChange={e => set('mission_id', e.target.value)} className={inputCls}>
                    <option value="">Aucune mission</option>
                    {(formData?.missions || []).map(m => (
                      <option key={m.id} value={m.id}>{m.reference} {m.vehicule ? `— ${m.vehicule}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Localisation */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-calendar-event-fill mr-1.5"></i>Date & Localisation
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Date et heure *</label>
                      <input type="datetime-local" value={form.date_accident} onChange={e => set('date_accident', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Kilométrage</label>
                      <input type="number" value={form.km_au_moment_accident} onChange={e => set('km_au_moment_accident', e.target.value)} placeholder="Ex: 45000" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Lieu de l'accident</label>
                    <input type="text" value={form.lieu} onChange={e => set('lieu', e.target.value)} placeholder="Adresse ou lieu précis" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Position GPS</label>
                    <input type="text" value={form.position_gps} onChange={e => set('position_gps', e.target.value)} placeholder="Ex: 0.390000, 9.450000" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Caractéristiques */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-exclamation-triangle-fill mr-1.5"></i>Caractéristiques
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelCls}>Niveau des dégâts</label>
                    <select value={form.niveau_degats} onChange={e => set('niveau_degats', e.target.value)} className={inputCls}>
                      {NIVEAUX_DEGATS.map(n => <option key={n.code} value={n.code}>{n.libelle}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Responsabilité</label>
                    <select value={form.type_responsabilite} onChange={e => set('type_responsabilite', e.target.value)} className={inputCls}>
                      {TYPES_RESPONSABILITE.map(r => <option key={r.code} value={r.code}>{r.libelle}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Statut du dossier</label>
                    <select value={form.statut} onChange={e => set('statut', e.target.value)} className={inputCls}>
                      {STATUTS.map(s => <option key={s.code} value={s.code}>{s.libelle}</option>)}
                    </select>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: 'Véhicule immobilisé', key: 'vehicule_immobilise', icon: 'bi-car-front'        },
                    { label: 'Assuré',              key: 'assure',              icon: 'bi-shield-check'     },
                    { label: 'Rapport police',      key: 'rapport_police_bool', icon: 'bi-file-earmark-text' },
                  ].map(({ label, key, icon }) => {
                    const val = key === 'rapport_police_bool' ? !!form.rapport_police_fichier : form[key];
                    return (
                      <button key={key} type="button"
                        onClick={() => key !== 'rapport_police_bool' && set(key, !form[key])}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                          val ? 'text-white border-transparent' : darkMode ? 'border-gray-700 text-gray-500 hover:bg-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-100'
                        }`}
                        style={val ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                        <i className={`bi ${icon}`}></i>{label}
                      </button>
                    );
                  })}
                </div>

                {form.vehicule_immobilise && (
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>Jours d'immobilisation estimés</label>
                      <input type="number" value={form.jours_immobilisation} onChange={e => set('jours_immobilisation', e.target.value)}
                        placeholder="Nombre de jours" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Mettre à jour le statut du véhicule</label>
                      <select value={form.nouveau_statut_vehicule} onChange={e => set('nouveau_statut_vehicule', e.target.value)} className={inputCls}>
                        <option value="">Ne pas modifier le statut</option>
                        {statutsVehicule.map(s => (
                          <option key={s.code} value={s.code}>{s.libelle}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ COLONNE DROITE ═══ */}
            <div className="space-y-5">

              {/* Coûts */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-cash-stack mr-1.5"></i>Coûts (FCFA)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Coût estimé',                 key: 'cout_estime' },
                    { label: 'Coût réparation final',       key: 'cout_reparation_final' },
                    { label: 'Montant réclamé assurance',   key: 'montant_reclame_assurance' },
                    { label: 'Montant versé assurance',     key: 'montant_verse_assurance' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className={labelCls}>{label}</label>
                      <input type="number" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="0" className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Rapport de police */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-file-earmark-text-fill mr-1.5"></i>Rapport de police
                </p>

                {/* Rapport existant (mode édition) */}
                {isEdit && accident?.rapport_police && !form.rapport_police_supprimer && (
                  <div className={`flex items-center justify-between p-3 rounded-lg mb-3 ${darkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-file-earmark-pdf text-red-500 text-lg"></i>
                      <div>
                        <p className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Rapport existant</p>
                        {accident.rapport_police_url && (
                          <a href={accident.rapport_police_url} target="_blank" rel="noreferrer"
                            className="text-[10px] hover:underline" style={{ color: theme.primary }}>Voir le fichier</a>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => set('rapport_police_supprimer', true)}
                      className="text-red-400 hover:text-red-600 transition-colors">
                      <i className="bi bi-trash3-fill text-sm"></i>
                    </button>
                  </div>
                )}

                <label className={`cursor-pointer block border-2 border-dashed rounded-xl transition-colors ${
                  darkMode ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'}`}>
                  <input type="file" accept=".pdf,image/*" className="hidden"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) { set('rapport_police_fichier', file); set('rapport_police_supprimer', false); }
                      e.target.value = '';
                    }} />
                  <div className="p-4 text-center">
                    {form.rapport_police_fichier ? (
                      <div className="flex items-center justify-center gap-2">
                        <i className="bi bi-file-earmark-check text-green-500 text-2xl"></i>
                        <div className="text-left">
                          <p className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{form.rapport_police_fichier.name}</p>
                          <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{(form.rapport_police_fichier.size / 1024).toFixed(1)} Ko</p>
                        </div>
                        <button type="button" onClick={e => { e.preventDefault(); set('rapport_police_fichier', null); }}
                          className="ml-2 text-red-400 hover:text-red-600">
                          <i className="bi bi-x-lg text-sm"></i>
                        </button>
                      </div>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload-fill text-2xl mb-1" style={{ color: theme.primary }}></i>
                        <p className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>PDF ou image du rapport</p>
                        <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Max 10 Mo</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Photos */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-camera-fill mr-1.5"></i>Photos de l'accident
                </p>

                {/* Photos existantes (mode édition) */}
                {form.photos_existantes.length > 0 && (
                  <div className="mb-3">
                    <p className={`text-[10px] font-semibold mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Photos existantes</p>
                    <div className="grid grid-cols-4 gap-2">
                      {form.photos_existantes.map(photo => {
                        const isMarked = form.photos_supprimer.includes(photo.id);
                        return (
                          <div key={photo.id} className={`relative group rounded-lg overflow-hidden aspect-square transition-all ${isMarked ? 'opacity-40' : ''}`}>
                            <img src={photo.url} alt={photo.nom} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                              <button type="button"
                                onClick={() => set('photos_supprimer', prev =>
                                  isMarked ? prev.filter(id => id !== photo.id) : [...prev, photo.id]
                                )}
                                className={`opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center shadow text-white ${isMarked ? 'bg-green-500' : 'bg-red-500'}`}>
                                <i className={`bi ${isMarked ? 'bi-arrow-counterclockwise' : 'bi-trash3-fill'} text-xs`}></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {form.photos_supprimer.length > 0 && (
                      <p className="text-[10px] text-red-400 mt-1">{form.photos_supprimer.length} photo(s) marquée(s) pour suppression</p>
                    )}
                  </div>
                )}

                {/* Nouvelles photos */}
                <div className={`border-2 border-dashed rounded-xl transition-colors ${darkMode ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'}`}>
                  <label className="cursor-pointer block p-4">
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files);
                        set('photos', prev => [...prev, ...files]);
                        e.target.value = '';
                      }} />
                    {form.photos.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}22` }}>
                          <i className="bi bi-cloud-upload-fill text-2xl" style={{ color: theme.primary }}></i>
                        </div>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Ajouter des photos</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>JPG, PNG, WEBP — sélection multiple</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {form.photos.map((file, i) => (
                          <div key={i} className="relative group rounded-lg overflow-hidden aspect-square">
                            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                              <button type="button" onClick={e => { e.preventDefault(); set('photos', prev => prev.filter((_, j) => j !== i)); }}
                                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                                <i className="bi bi-trash3-fill text-xs"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        <label className={`cursor-pointer aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-colors
                          ${darkMode ? 'border-gray-600 hover:border-gray-400 text-gray-500' : 'border-gray-300 hover:border-gray-400 text-gray-300'}`}>
                          <input type="file" accept="image/*" multiple className="hidden"
                            onChange={e => { set('photos', prev => [...prev, ...Array.from(e.target.files)]); e.target.value = ''; }} />
                          <i className="bi bi-plus-lg text-xl"></i>
                        </label>
                      </div>
                    )}
                  </label>
                  {form.photos.length > 0 && (
                    <p className={`text-xs px-4 pb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {form.photos.length} nouvelle(s) photo(s) sélectionnée(s)
                    </p>
                  )}
                </div>
              </div>

              {/* Description & Notes */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-chat-left-text-fill mr-1.5"></i>Description & Notes
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Description de l'accident</label>
                    <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                      placeholder="Décrire les circonstances de l'accident..." className={inputCls + ' resize-none'} />
                  </div>
                  <div>
                    <label className={labelCls}>Notes internes</label>
                    <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
                      placeholder="Notes supplémentaires..." className={inputCls + ' resize-none'} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-end gap-3`}>
          <button onClick={onClose} disabled={saving}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
            {saving
              ? <><i className="bi bi-hourglass-split animate-spin"></i> Enregistrement...</>
              : <><i className={`bi ${isEdit ? 'bi-check-lg' : 'bi-plus-lg'}`}></i> { 'Enregistrer'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MENU 3 POINTS
// ============================================================================
const ActionMenu = ({ accident, darkMode, theme, onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const MENU_W = 180;
  const MENU_H = 150; // hauteur approximative (3 actions + séparateur)

  const toggle = (e) => {
    e.stopPropagation(); e.preventDefault();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // S'il n'y a pas assez de place en bas, le menu s'ouvre vers le haut
      const showAbove = spaceBelow < MENU_H + 12 && rect.top > MENU_H + 12;
      let left = rect.right - MENU_W;
      if (left < 8) left = 8;
      if (left + MENU_W > window.innerWidth - 8) left = window.innerWidth - MENU_W - 8;
      setMenuStyle({
        position: 'fixed',
        top: showAbove ? rect.top - MENU_H - 4 : rect.bottom + 4,
        left,
        width: MENU_W,
        zIndex: 99999,
      });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button ref={btnRef} onClick={toggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          open ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
        }`}
        style={open ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` } : {}}>
        <i className="bi bi-three-dots-vertical text-sm"></i>
      </button>

      {open && ReactDOM.createPortal(
        <div ref={menuRef} onClick={e => e.stopPropagation()}
          className={`rounded-xl shadow-2xl border py-1.5 overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={menuStyle}>
          <button onClick={e => { e.stopPropagation(); setOpen(false); onView(accident); }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <i className="bi bi-eye text-base" style={{ color: theme.primary }}></i> Voir les détails
          </button>
          <button onClick={e => { e.stopPropagation(); setOpen(false); onEdit(accident); }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <i className="bi bi-pencil-fill text-base" style={{ color: theme.primary }}></i> Modifier
          </button>
          <div className={`my-1 mx-3 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
          <button onClick={e => { e.stopPropagation(); setOpen(false); onDelete(accident.id); }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}>
            <i className="bi bi-trash3-fill text-base"></i> Supprimer
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

// ============================================================================
// MENU EXPORT — portal-based, positionné dynamiquement (corrige le bug d'affichage)
// ============================================================================
const ExportMenu = ({ darkMode, theme, total, onExportExcel, onExportPDF }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 240 });
  const btnRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      const width = 240;
      // Aligné à droite du bouton, mais on s'assure de rester dans la fenêtre
      let left = rect.right - width;
      if (left < 8) left = 8;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      setMenuPos({ top: rect.bottom + 8, left, width });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onScroll = () => setOpen(false);
    const t = setTimeout(() => { document.addEventListener('click', close, { once: true }); }, 0);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', close);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button ref={btnRef} onClick={toggle}
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
          open ? 'text-white' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        style={open ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
        <i className="bi bi-download"></i> Exporter
        <i className={`bi bi-chevron-down text-[10px] transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {open && ReactDOM.createPortal(
        <div onClick={e => e.stopPropagation()}
          className={`fixed z-[9999] rounded-xl shadow-2xl border py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width, animation: 'fadeInDown .15s ease-out' }}>
          <p className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{total} accident(s)</p>
          <button onClick={() => { onExportExcel(); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
            <i className="bi bi-file-earmark-spreadsheet text-green-500 text-base"></i>
            <div><p className="font-medium">Exporter en Excel</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Format CSV (UTF-8)</p></div>
          </button>
          <button onClick={() => { onExportPDF(); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
            <i className="bi bi-file-earmark-pdf text-red-500 text-base"></i>
            <div><p className="font-medium">Exporter en PDF</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Impression paysage</p></div>
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

// ============================================================================
// KPI CARDS
// ============================================================================
const KpiCard = ({ label, target, decimals = 0, suffix = '', prefix = '', icon, color, sub, delay, darkMode, animateCards }) => {
  const val = useCountUp(target, 1400, decimals);
  return (
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5`}
      style={{ animation: animateCards ? `fadeInUp .5s ease-out ${delay}s both` : 'none' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
          <i className={`${icon} text-lg`} style={{ color }}></i>
        </div>
      </div>
      <p className={`text-3xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val)}{suffix}
      </p>
      <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</p>
    </div>
  );
};

// ============================================================================
// SKELETON LOADER — imite toute la mise en page pendant le chargement
// ============================================================================
const Shimmer = ({ darkMode, className = '' }) => (
  <div className={`relative overflow-hidden rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const SkeletonPage = ({ darkMode }) => (
  <div>
    {/* En-tête */}
    <div className="flex items-center gap-3 mb-6">
      <Shimmer darkMode={darkMode} className="w-10 h-10 rounded-xl" />
      <div className="space-y-2">
        <Shimmer darkMode={darkMode} className="w-56 h-5" />
        <Shimmer darkMode={darkMode} className="w-40 h-3" />
      </div>
    </div>

    {/* KPI cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5`}>
          <Shimmer darkMode={darkMode} className="w-10 h-10 rounded-xl mb-4" />
          <Shimmer darkMode={darkMode} className="w-20 h-7 mb-2" />
          <Shimmer darkMode={darkMode} className="w-28 h-3 mb-1.5" />
          <Shimmer darkMode={darkMode} className="w-16 h-2.5" />
        </div>
      ))}
    </div>

    {/* Tendance + Graphiques */}
<div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6 mb-6`}>
  <div className="flex items-center gap-2 mb-5">
    <Shimmer darkMode={darkMode} className="w-1 h-5 rounded-full" />
    <Shimmer darkMode={darkMode} className="w-48 h-4" />
  </div>
  <Shimmer darkMode={darkMode} className="w-full h-52" />
</div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}>
          <div className="flex items-center gap-2 mb-5">
            <Shimmer darkMode={darkMode} className="w-1 h-5 rounded-full" />
            <Shimmer darkMode={darkMode} className="w-32 h-4" />
          </div>
          <div className="flex items-center justify-center py-2">
            <Shimmer darkMode={darkMode} className="w-32 h-32 rounded-full" />
          </div>
          <div className="space-y-2 mt-4">
            {Array.from({ length: 3 }).map((__, j) => (
              <Shimmer key={j} darkMode={darkMode} className="w-full h-2.5" />
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Top chauffeurs */}
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6 mb-6`}>
      <div className="flex items-center gap-2 mb-5">
        <Shimmer darkMode={darkMode} className="w-1 h-5 rounded-full" />
        <Shimmer darkMode={darkMode} className="w-56 h-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Shimmer darkMode={darkMode} className="w-7 h-7 rounded-full" />
            <Shimmer darkMode={darkMode} className="w-24 h-3" />
            <Shimmer darkMode={darkMode} className="flex-1 h-2.5" />
            <Shimmer darkMode={darkMode} className="w-6 h-3" />
          </div>
        ))}
      </div>
    </div>

    {/* Toolbar */}
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-6`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} darkMode={darkMode} className="w-32 h-9 rounded-lg" />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Shimmer darkMode={darkMode} className="w-52 h-9 rounded-lg" />
          <Shimmer darkMode={darkMode} className="w-40 h-9 rounded-xl" />
        </div>
      </div>
    </div>

    {/* Tableau */}
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
      <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Shimmer key={i} darkMode={darkMode} className="flex-1 h-3" />
          ))}
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`p-4 flex items-center gap-6 ${i % 2 === 0 ? (darkMode ? 'bg-gray-900' : 'bg-white') : (darkMode ? 'bg-gray-900/60' : 'bg-gray-50/60')}`}>
          <Shimmer darkMode={darkMode} className="w-16 h-3" />
          <div className="flex items-center gap-2 flex-1">
            <Shimmer darkMode={darkMode} className="w-7 h-7 rounded-full" />
            <Shimmer darkMode={darkMode} className="w-28 h-3" />
          </div>
          <Shimmer darkMode={darkMode} className="w-20 h-3" />
          <Shimmer darkMode={darkMode} className="w-24 h-3" />
          <Shimmer darkMode={darkMode} className="w-28 h-3" />
          <Shimmer darkMode={darkMode} className="w-20 h-6 rounded-full" />
          <Shimmer darkMode={darkMode} className="w-20 h-6 rounded-full" />
          <Shimmer darkMode={darkMode} className="w-8 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
const Accidents = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [animateCards, setAnimateCards]           = useState(false);
  const { theme } = useTheme();
  const navigate  = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => { const id2 = requestAnimationFrame(() => setAnimateCards(true)); return () => cancelAnimationFrame(id2); });
    return () => cancelAnimationFrame(id);
  }, []);

  // ── États données ──
  const [accidents, setAccidents]         = useState([]);
  const [stats, setStats]                 = useState(null);
  const [formData, setFormData]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // pilote le skeleton plein écran
  const [saving, setSaving]               = useState(false);
  const [pagination, setPagination]       = useState({ current_page: 1, last_page: 1, total: 0 });
  const [toast, setToast]                 = useState(null);

  // ── États filtres ──
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterNiveau, setFilterNiveau]     = useState('');
  const [filterStatut, setFilterStatut]     = useState('');
  const [filterResp, setFilterResp]         = useState('');
  const [filterChauffeur, setFilterChauffeur] = useState('');
  const [filterImmob, setFilterImmob]       = useState('');
  const [filterPeriode, setFilterPeriode]   = useState('365');
  const [sortBy, setSortBy]                 = useState('date_accident');
  const [sortDir, setSortDir]               = useState('desc');
  const [currentPage, setCurrentPage]       = useState(1);
  const [view, setView]                     = useState('table');

  // ── États modaux ──
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [showDetailModal, setShowDetailModal]   = useState(false);
  const [showFormModal, setShowFormModal]       = useState(false);
  const [editAccident, setEditAccident]         = useState(null);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  // ── Chargement initial : stats + formData ──
  useEffect(() => {
    Promise.all([
      getAccidentStatistiques({ jours: filterPeriode }),
      getAccidentFormData(),
    ]).then(([statsRes, fdRes]) => {
      if (statsRes.success) setStats(statsRes.data);
      if (fdRes.success)    setFormData(fdRes.data);
      if (fdRes.success)    setFormData(fdRes.data);
    }).catch(err => {
  showToast('Erreur de chargement des données', 'error'); // ✅ toast discret
});
  },
   []); // eslint-disable-line

  // ── Chargement liste accidents ──
  const fetchAccidents = useCallback(() => {
    setLoading(true);
    const params = {
      jours:                   filterPeriode,
      niveau_degats:           filterNiveau   || undefined,
      statut:                  filterStatut   || undefined,
      type_responsabilite:     filterResp     || undefined,
      chauffeur_user_id:       filterChauffeur || undefined,
      vehicule_immobilise:     filterImmob === 'oui' ? true : filterImmob === 'non' ? false : undefined,
      search:                  searchTerm     || undefined,
      sort_by:                 sortBy,
      sort_dir:                sortDir,
      per_page:                10,
      page:                    currentPage,
    };
    // Nettoyer les undefined
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    getAccidents(params)
      .then(res => {
        if (res.success) {
          setAccidents(res.data.data || []);
          setPagination({
            current_page: res.data.current_page,
            last_page:    res.data.last_page,
            total:        res.data.total,
          });
        }
      })
      .catch(err => {
        swalError(darkMode, theme, 'Erreur de chargement', extractErrorMessage(err));
      })
      .finally(() => { setLoading(false); setInitialLoading(false); });
  }, [filterPeriode, filterNiveau, filterStatut, filterResp, filterChauffeur, filterImmob, searchTerm, sortBy, sortDir, currentPage]); // eslint-disable-line

  useEffect(() => { fetchAccidents(); }, [fetchAccidents]);

  // Recharger les stats quand la période change
  useEffect(() => {
    getAccidentStatistiques({ jours: filterPeriode })
      .then(res => { if (res.success) setStats(res.data); })
      .catch(() => {});
  }, [filterPeriode]);

  // Rafraîchit liste + stats sans recharger la page (après création / modification / suppression / statut)
  const refreshData = useCallback(() => {
    fetchAccidents();
    getAccidentStatistiques({ jours: filterPeriode })
      .then(res => { if (res.success) setStats(res.data); })
      .catch(() => {});
  }, [fetchAccidents, filterPeriode]);

  // Reset page quand filtre change
  useEffect(() => { setCurrentPage(1); }, [filterNiveau, filterStatut, filterResp, filterChauffeur, filterImmob, filterPeriode, searchTerm, sortBy, sortDir]);

  const resetFilters = () => {
    setFilterNiveau(''); setFilterStatut(''); setFilterResp('');
    setFilterChauffeur(''); setFilterImmob(''); setSearchTerm('');
  };
  const hasFilters = filterNiveau || filterStatut || filterResp || filterChauffeur || filterImmob || searchTerm;

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  // ── CRUD ──

  const handleSave = async (data, id) => {
    setSaving(true);
    try {
      let res;
      if (id) {
        res = await updateAccident(id, data);
      } else {
        res = await createAccident(data);
      }

      if (res.success) {
        setShowFormModal(false);
        setEditAccident(null);
        refreshData();
        await swalSuccess(darkMode, theme,
          id ? 'Accident mis à jour !' : 'Accident déclaré !',
          id ? 'Les modifications ont été enregistrées.' : 'L\'accident a été déclaré avec succès.'
        );
      } else {
        await swalError(darkMode, theme, 'Erreur', res.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      await swalError(darkMode, theme, 'Erreur d\'enregistrement', extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await swalConfirm(
      darkMode, theme,
      'Supprimer cet accident ?',
      'Cette action est irréversible. L\'accident sera archivé.',
      'Supprimer'
    );
    if (!confirmed) return;

    try {
      const res = await deleteAccident(id);
      if (res.success) {
        setShowDetailModal(false);
        refreshData();
        await swalSuccess(darkMode, theme, 'Accident supprimé', 'L\'accident a été supprimé avec succès.');
      } else {
        await swalError(darkMode, theme, 'Erreur', res.message || 'La suppression a échoué.');
      }
    } catch (err) {
      await swalError(darkMode, theme, 'Erreur de suppression', extractErrorMessage(err));
    }
  };

  const handleChangeStatut = async (id, newStatut) => {
    try {
      const res = await updateAccidentStatut(id, newStatut);
      if (res.success) {
        // Mise à jour locale sans rechargement
        setAccidents(prev => prev.map(a => a.id === id ? { ...a, statut: newStatut } : a));
        if (selectedAccident?.id === id) setSelectedAccident(prev => ({ ...prev, statut: newStatut }));
        showToast(`Statut mis à jour : ${getStatutInfo(newStatut).libelle}`, 'info');
        refreshData();
      } else {
        await swalError(darkMode, theme, 'Erreur', res.message || 'Mise à jour du statut échouée.');
      }
    } catch (err) {
      await swalError(darkMode, theme, 'Erreur', extractErrorMessage(err));
    }
  };

  const handleEdit = (acc) => {
    setShowDetailModal(false);
    setEditAccident(acc);
    setShowFormModal(true);
  };

  const handleViewDetail = async (acc) => {
    // Re-fetch le détail complet depuis l'API pour avoir toutes les données à jour
    try {
      const res = await getAccident(acc.id);
      if (res.success) {
        setSelectedAccident(res.data);
      } else {
        setSelectedAccident(acc); // fallback sur les données de la liste
      }
    } catch {
      setSelectedAccident(acc);
    }
    setShowDetailModal(true);
  };

  // ── Stats pour affichage ──
  const periodeInfo = PERIODES.find(p => p.code === filterPeriode) || PERIODES[4];
  const total         = stats?.total          ?? 0;
  const nbImmobilises = stats?.nb_immobilises ?? 0;
  const nbCritiques   = stats?.nb_critiques   ?? 0;
  const coutTotal     = stats?.cout_total     ?? 0;

  const niveauDistrib = NIVEAUX_DEGATS.map(n => ({
    ...n, label: n.libelle, value: stats?.par_niveau?.[n.code] ?? 0,
  }));
  const statutDistrib = STATUTS.map(s => ({
    ...s, label: s.libelle, value: stats?.par_statut?.[s.code] ?? 0,
  }));
  const respDistrib = TYPES_RESPONSABILITE.map(r => ({
    ...r, label: r.libelle, value: stats?.par_responsabilite?.[r.code] ?? 0,
  }));
  const topChauffeurs    = stats?.top_chauffeurs ?? [];
  const maxCountCh       = Math.max(...topChauffeurs.map(c => c.nb_accidents), 1);

  // ── Données de tendance pour la courbe (évolution sur la période) ──
  const tendanceData = React.useMemo(() => {
    if (stats?.tendance && Array.isArray(stats.tendance) && stats.tendance.length > 0) {
      return stats.tendance.map(t => ({
        label: t.label || t.periode || '',
        fullLabel: t.full_label || t.date || t.label,
        value: t.value ?? t.nb_accidents ?? 0,
      }));
    }
    // Fallback : répartir le total connu sur la période en buckets simples si le backend ne fournit pas de série temporelle
    const nbBuckets = filterPeriode === '7' ? 7 : filterPeriode === '30' ? 6 : filterPeriode === '90' ? 6 : filterPeriode === '180' ? 6 : 12;
    const now = new Date();
    return Array.from({ length: nbBuckets }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (nbBuckets - 1 - i));
      return {
        label: d.toLocaleDateString('fr-FR', { month: 'short' }),
        fullLabel: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        value: 0,
      };
    });
  }, [stats, filterPeriode]);

  // ── Export helpers ──
  const expHeaders = ['Référence', 'Date', 'Chauffeur', 'Véhicule', 'Lieu', 'Niveau', 'Statut', 'Responsabilité', 'Coût final', 'Assurance réclamée', 'Assurance versée', 'Notes'];
  const toRow = (a) => [
    a.ref,
    a.date_accident ? new Date(a.date_accident).toLocaleString('fr-FR') : '—',
    a.chauffeur_nom || '—',
    a.vehicule_immatriculation || '—',
    a.lieu || '—',
    getNiveauInfo(a.niveau_degats).libelle,
    getStatutInfo(a.statut).libelle,
    getResponsabiliteInfo(a.type_responsabilite).libelle,
    a.cout_reparation_final || '—',
    a.montant_reclame_assurance || '—',
    a.montant_verse_assurance || '—',
    a.notes || '—',
  ];

  const SortIcon = ({ col }) => (
    <i className={`bi bi-arrow-${sortBy === col ? (sortDir === 'asc' ? 'up' : 'down') : 'down-up'} text-[10px] ml-1 opacity-60`}></i>
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex flex-col transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <style>{`
        @keyframes fadeInUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer    { 100% { transform: translateX(100%); } }
        .row-hover:hover { filter: brightness(1.07); }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        /* SweetAlert2 dark mode */
        .swal-dark-popup  { background: #111827 !important; color: #f9fafb !important; border: 1px solid #374151; }
        .swal-light-popup { background: #ffffff !important; color: #111827 !important; }
        .swal-confirm-btn { font-weight: 600 !important; border-radius: 10px !important; padding: 10px 24px !important; }
        .swal-cancel-btn  { font-weight: 600 !important; border-radius: 10px !important; padding: 10px 24px !important; color: #6b7280 !important; }
        .swal2-popup { border-radius: 16px !important; }
        .swal2-title { font-size: 1.15rem !important; font-weight: 700 !important; }
      `}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} theme={theme} />}
      {(showNotifications || showProfile) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfile(false); }} />
      )}

      <main className="flex-1 transition-all duration-300 pt-24 px-4 pb-10" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '16.25rem' }}>

        {initialLoading ? (
          <SkeletonPage darkMode={darkMode} />
        ) : (
        <>
        {/* ════ EN-TÊTE ════ */}
        <div className="flex items-center justify-between mb-6"
          style={{ animation: animateCards ? 'fadeInUp .4s ease-out both' : 'none' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className="bi bi-exclamation-octagon-fill text-white text-lg"></i>
            </div>
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Registre des Accidents
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Gestion et suivi des accidents
              </p>
            </div>
          </div>
        </div>

     {/* ════ KPI CARDS ════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <KpiCard label="Total accidents"       target={total}             icon="bi-car-front-fill"    color="#ef4444" sub={periodeInfo.libelle}  delay={0}    darkMode={darkMode} animateCards={animateCards} />
          <KpiCard label="Véhicules immobilisés" target={nbImmobilises}     icon="bi-slash-circle-fill" color="#f97316" sub="sur la période"       delay={0.07} darkMode={darkMode} animateCards={animateCards} />
          <KpiCard label="Accidents graves"      target={nbCritiques}       icon="bi-exclamation-octagon-fill" color="#8b5cf6" sub="grave + critique" delay={0.14} darkMode={darkMode} animateCards={animateCards} />
          <KpiCard label="Coût total estimé"     target={coutTotal/1000000} icon="bi-cash-stack"        color="#06b6d4" sub="FCFA (estimation)"    delay={0.21} darkMode={darkMode} animateCards={animateCards} decimals={1} suffix="M" />
        </div>

        {/* ════ GRAPHIQUES — DONUTS DE RÉPARTITION ════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          {[
            { title: 'Gravité des accidents', data: niveauDistrib, accent: theme.primary, badge: `${total} total` },
            { title: 'Statuts des dossiers',  data: statutDistrib, accent: theme.primary, badge: `${statutDistrib.filter(s => s.value > 0).length} statut(s)` },
            { title: 'Responsabilités',       data: respDistrib,   accent: '#8b5cf6',     badge: `${nbCritiques} grave(s)` },
          ].map(({ title, data, accent, badge }, gi) => {
            const distTotal = data.reduce((s, d) => s + d.value, 0);
            return (
              <div key={gi} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-lg border shadow-sm p-3`}
                style={{ animation: animateCards ? `fadeInUp .5s ease-out ${0.33 + gi * 0.07}s both` : 'none' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3.5 rounded-full" style={{ background: accent }}></div>
                  <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                  <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{badge}</span>
                </div>

                {distTotal === 0 ? (
                  <p className={`text-xs text-center py-6 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>Aucune donnée</p>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <DonutChart data={data} size={92} strokeWidth={12} darkMode={darkMode} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-base font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{distTotal}</span>
                        <span className={`text-[9px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>total</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      {data.filter(d => d.value > 0).map(d => {
                        const pct = Math.round((d.value / distTotal) * 100);
                        return (
                          <div key={d.code} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }}></span>
                            <span className={`text-[11px] font-medium truncate flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{d.libelle}</span>
                            <span className={`text-[11px] font-bold shrink-0 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{d.value}</span>
                            <span className={`text-[9px] shrink-0 w-8 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ════ TENDANCE — COURBE ════ */}
        <div className="mb-6">
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .26s both' : 'none' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tendance des accidents</h3>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                {periodeInfo.libelle}
              </span>
            </div>
            <AreaTrendChart points={tendanceData} color={theme.primary} darkMode={darkMode} height={220} />
          </div>
        </div>

       
        {/* Top Chauffeurs */}
        <div className="mb-6">
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .54s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chauffeurs les plus impliqués</h3>
            </div>
            {topChauffeurs.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                <i className="bi bi-emoji-smile text-3xl block mb-2"></i>
                <p className="text-sm">Aucun accident sur la période</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                {topChauffeurs.slice(0, 6).map((c, i) => (
                  <div key={c.chauffeur_id} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      style={i === 0 ? { color: theme.primary } : {}}># {i + 1}</span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: theme.primary }}>{(c.nom || '?').charAt(0)}</div>
                    <span className={`text-sm font-medium w-32 truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{c.nom}</span>
                    <Tooltip darkMode={darkMode} label={`${c.nom} — ${c.nb_accidents} accident${c.nb_accidents > 1 ? 's' : ''} · ${c.direction || '—'}`}>
                      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} cursor-pointer`} style={{ minWidth: '80px' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(c.nb_accidents / maxCountCh) * 100}%`, background: theme.primary, opacity: i === 0 ? 1 : Math.max(0.4, 1 - i * 0.15) }} />
                      </div>
                    </Tooltip>
                    <span className={`text-sm font-bold w-5 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      style={i === 0 ? { color: theme.primary } : {}}>{c.nb_accidents}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════ TOOLBAR ════ */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-6`}
          style={{ animation: animateCards ? 'fadeInUp .5s ease-out .6s both' : 'none' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Période */}
              <select value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                {PERIODES.map(p => <option key={p.code} value={p.code}>{p.libelle}</option>)}
              </select>
              {/* Niveau */}
              <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les niveaux</option>
                {NIVEAUX_DEGATS.map(n => <option key={n.code} value={n.code}>{n.libelle}</option>)}
              </select>
              {/* Statut */}
              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les statuts</option>
                {STATUTS.map(s => <option key={s.code} value={s.code}>{s.libelle}</option>)}
              </select>
              {/* Responsabilité */}
              <select value={filterResp} onChange={e => setFilterResp(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Toutes responsabilités</option>
                {TYPES_RESPONSABILITE.map(r => <option key={r.code} value={r.code}>{r.libelle}</option>)}
              </select>
              {/* Chauffeur */}
              <select value={filterChauffeur} onChange={e => setFilterChauffeur(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les chauffeurs</option>
                {(formData?.chauffeurs || []).map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              {/* Immobilisation */}
              <select value={filterImmob} onChange={e => setFilterImmob(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Immobilisation : tous</option>
                <option value="oui">Véhicule immobilisé</option>
                <option value="non">Non immobilisé</option>
              </select>
              {hasFilters && (
                <button onClick={resetFilters}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${darkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}>
                  <i className="bi bi-x-lg text-xs"></i> Effacer
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Vue */}
              <div className={`flex rounded-lg border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button onClick={() => setView('table')}
                  className={`p-2 text-sm transition-colors ${view === 'table' ? 'text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
                  style={view === 'table' ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                  <i className="bi bi-table"></i>
                </button>
              </div>

              {/* Recherche */}
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Réf, chauffeur, véhicule, lieu..."
                  className={`pl-9 pr-4 py-2 rounded-lg border text-sm w-52 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`} />
              </div>

              {/* Export */}
              <ExportMenu
                darkMode={darkMode}
                theme={theme}
                total={pagination.total}
                onExportExcel={() => { exportToExcel(accidents.map(toRow), 'Registre_Accidents', expHeaders); showToast('Export Excel effectué', 'success'); }}
                onExportPDF={() => { exportToPDF('Registre des Accidents', expHeaders, accidents.map(toRow)); showToast('Export PDF généré', 'success'); }}
              />

              <button onClick={() => { setEditAccident(null); setShowFormModal(true); }}
                className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-lg hover:opacity-90 transition-all"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <i className="bi bi-plus-circle-fill text-base"></i>
                Déclarer un accident
              </button>
            </div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {loading ? 'Chargement...' : `${pagination.total} accident(s) trouvé(s)`}
          </p>
        </div>

        {/* ════ ÉTAT CHARGEMENT (rafraîchissement de liste, hors chargement initial) ════ */}
        {loading && !initialLoading && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-16 text-center`}>
            <i className="bi bi-hourglass-split text-4xl mb-3 animate-spin" style={{ color: theme.primary }}></i>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Chargement des accidents...</p>
          </div>
        )}

        {/* ════ VUE TABLEAU ════ */}
        {!loading && view === 'table' && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .65s both' : 'none' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                    {[
                      ['Réf.',           'ref'],
                      ['Chauffeur',      'chauffeur_nom'],
                      ['Véhicule',       null],
                      ['Date',           'date_accident'],
                      ['Lieu',           null],
                      ['Niveau',         'niveau_degats'],
                      ['Statut',         'statut'],
                      ['Rapport police', null],
                      ['Actions',        null],
                    ].map(([h, col], i) => (
                      <th key={i} onClick={() => col && handleSort(col)}
                        className={`px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white ${col ? 'cursor-pointer hover:bg-white/10 select-none' : ''} ${i === 7 ? 'text-center' : ''} ${i === 8 ? 'text-center' : ''}`}>
                        {h}{col && <SortIcon col={col} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accidents.length === 0 ? (
                    <tr><td colSpan={9} className={`text-center py-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <i className="bi bi-car-front text-5xl block mb-3 opacity-40"></i>
                      <span className="text-sm">Aucun accident pour les filtres sélectionnés</span>
                    </td></tr>
                  ) : accidents.map((a, idx) => {
                    const niveau = getNiveauInfo(a.niveau_degats);
                    const statut = getStatutInfo(a.statut);
                    const hasRapport = !!(a.rapport_police || a.rapport_police_url);
                    return (
                      <tr key={a.id} className="row-hover transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: idx % 2 === 0 ? (darkMode ? '#0c1929' : '#fef2f2') : (darkMode ? '#162033' : '#fff5f5'),
                          animation: animateCards ? `fadeInUp .4s ease-out ${idx * .04}s both` : 'none',
                        }}
                        onClick={() => handleViewDetail(a)}>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-mono font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{a.ref}</span>
                          {a.chauffeur_externe && <span className="ml-2 text-yellow-500 text-xs" title="Chauffeur externe"><i className="bi bi-person-exclamation"></i></span>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: theme.primary }}>
                              {(a.chauffeur_nom || '?').charAt(0)}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{a.chauffeur_nom || '—'}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.chauffeur_direction || (a.chauffeur_externe ? 'Externe' : '—')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{a.vehicule_immatriculation}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{a.date_accident ? new Date(a.date_accident).toLocaleDateString('fr-FR') : '—'}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.date_accident ? new Date(a.date_accident).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-[140px] truncate`} title={a.lieu}>{a.lieu || '—'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${niveau.bg}`}>
                            <i className={`${niveau.icon} mr-1`}></i>{niveau.libelle}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statut.bg}`}>
                            <i className={`${statut.icon} mr-1`}></i>{statut.libelle}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          {hasRapport ? (
                            <Tooltip darkMode={darkMode} label="Voir le document">
                              <a href={a.rapport_police_url || '#'} target="_blank" rel="noreferrer"
                                className={`inline-flex w-8 h-8 rounded-lg items-center justify-center transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                style={{ color: theme.primary }}>
                                <i className="bi bi-eye-fill text-sm"></i>
                              </a>
                            </Tooltip>
                          ) : (
                            <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <ActionMenu
                            accident={a}
                            darkMode={darkMode}
                            theme={theme}
                            onView={handleViewDetail}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Page {pagination.current_page} / {pagination.last_page} — {pagination.total} accident(s)
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {Array.from({ length: Math.min(7, pagination.last_page) }, (_, i) => {
                    let page;
                    if (pagination.last_page <= 7) page = i + 1;
                    else if (currentPage <= 4) page = i + 1;
                    else if (currentPage >= pagination.last_page - 3) page = pagination.last_page - 6 + i;
                    else page = currentPage - 3 + i;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${currentPage === page ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                        style={currentPage === page ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                        {page}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(pagination.last_page, p + 1))} disabled={currentPage === pagination.last_page}
                    className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

 </>
        )}
      </main>
  <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />
      {/* ════ MODALS ════ */}
      {showDetailModal && selectedAccident && (
        <AccidentModal
          accident={selectedAccident}
          darkMode={darkMode}
          theme={theme}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onChangeStatut={handleChangeStatut}
        />
      )}

      {showFormModal && (
        <AccidentFormModal
          accident={editAccident}
          darkMode={darkMode}
          theme={theme}
          formData={formData}
          saving={saving}
          onClose={() => { setShowFormModal(false); setEditAccident(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Accidents;