import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// ============================================================================
// HOOK — COMPTEUR ANIMÉ
// ============================================================================
const useCountUp = (target, duration = 1200, decimals = 0) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // easeOutExpo
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
// COMPOSANT TOOLTIP
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
          <div className={`absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 rotate-45
            ${darkMode ? 'bg-gray-700' : 'bg-gray-900'}`} />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DONNÉES DE RÉFÉRENCE
// ============================================================================
const NIVEAUX_DEGATS = [
  { code: 'leger',    libelle: 'Léger',    color: '#10b981', bg: 'bg-green-100 text-green-700',   icon: 'bi-shield-check' },
  { code: 'modere',   libelle: 'Modéré',   color: '#f59e0b', bg: 'bg-yellow-100 text-yellow-700', icon: 'bi-shield-exclamation' },
  { code: 'grave',    libelle: 'Grave',    color: '#f97316', bg: 'bg-orange-100 text-orange-700',  icon: 'bi-shield-fill-exclamation' },
  { code: 'critique', libelle: 'Critique', color: '#ef4444', bg: 'bg-red-100 text-red-700',        icon: 'bi-shield-fill-x' },
];

const TYPES_RESPONSABILITE = [
  { code: 'responsable',         libelle: 'Responsable',           color: '#ef4444', bg: 'bg-red-100 text-red-700' },
  { code: 'tiers_responsable',   libelle: 'Tiers Responsable',     color: '#6366f1', bg: 'bg-indigo-100 text-indigo-700' },
  { code: 'responsabilite_partagee', libelle: 'Responsabilité Partagée', color: '#f59e0b', bg: 'bg-yellow-100 text-yellow-700' },
  { code: 'indetermine',         libelle: 'Indéterminé',           color: '#94a3b8', bg: 'bg-gray-100 text-gray-600' },
  { code: 'force_majeure',       libelle: 'Force Majeure',         color: '#8b5cf6', bg: 'bg-purple-100 text-purple-700' },
];

const STATUTS = [
  { code: 'declare',      libelle: 'Déclaré',          color: '#6366f1', bg: 'bg-indigo-100 text-indigo-700', icon: 'bi-flag-fill' },
  { code: 'en_cours',     libelle: 'En cours',         color: '#f59e0b', bg: 'bg-yellow-100 text-yellow-700', icon: 'bi-clock-fill' },
  { code: 'en_reparation',libelle: 'En réparation',    color: '#06b6d4', bg: 'bg-cyan-100 text-cyan-700',     icon: 'bi-tools' },
  { code: 'assurance',    libelle: 'Dossier assurance',color: '#8b5cf6', bg: 'bg-purple-100 text-purple-700', icon: 'bi-file-earmark-medical-fill' },
  { code: 'cloture',      libelle: 'Clôturé',          color: '#10b981', bg: 'bg-green-100 text-green-700',   icon: 'bi-check-circle-fill' },
  { code: 'litige',       libelle: 'Litige',           color: '#ef4444', bg: 'bg-red-100 text-red-700',       icon: 'bi-exclamation-octagon-fill' },
];

const PERIODES = [
  { code: '7j',   libelle: '7 jours',     jours: 7 },
  { code: '30j',  libelle: 'Mensuel',     jours: 30 },
  { code: '90j',  libelle: 'Trimestriel', jours: 90 },
  { code: '180j', libelle: 'Semestriel',  jours: 180 },
  { code: '365j', libelle: 'Annuel',      jours: 365 },
];

// ============================================================================
// DONNÉES DE DÉMONSTRATION
// ============================================================================
const CHAUFFEURS = [
  { id: 1, nom: 'Pierre Nzong',     matricule: 'DRV-001', direction: 'Direction Technique',  avatar_color: '#8b5cf6', nb_accidents_total: 3 },
  { id: 2, nom: 'Luc Mba',          matricule: 'DRV-002', direction: 'Direction Technique',  avatar_color: '#06b6d4', nb_accidents_total: 1 },
  { id: 3, nom: 'Marc Essono',      matricule: 'DRV-003', direction: 'Direction Logistique', avatar_color: '#6366f1', nb_accidents_total: 5 },
  { id: 4, nom: 'Alain Nguema',     matricule: 'DRV-004', direction: 'Direction Logistique', avatar_color: '#10b981', nb_accidents_total: 2 },
  { id: 5, nom: 'Claire Bouanga',   matricule: 'DRV-005', direction: 'Transport de Fonds',   avatar_color: '#f59e0b', nb_accidents_total: 0 },
  { id: 6, nom: 'François Obame',   matricule: 'DRV-006', direction: 'Direction Technique',  avatar_color: '#ef4444', nb_accidents_total: 4 },
  { id: 7, nom: 'Sophie Ondo',      matricule: 'DRV-007', direction: 'Direction Générale',   avatar_color: '#f97316', nb_accidents_total: 2 },
  { id: 8, nom: 'Hulas Djyembi',    matricule: 'DRV-008', direction: 'Direction Générale',   avatar_color: '#ec4899', nb_accidents_total: 1 },
];

const VEHICULES = [
  { immat: 'GA-1234-AB', marque: 'Toyota', modele: 'Land Cruiser', type: 'SUV' },
  { immat: 'GA-5678-CD', marque: 'Ford',   modele: 'Ranger',       type: 'Pick-up' },
  { immat: 'GA-9012-EF', marque: 'Nissan', modele: 'Patrol',       type: 'SUV' },
  { immat: 'GA-3456-GH', marque: 'Toyota', modele: 'Hilux',        type: 'Pick-up' },
  { immat: 'GA-7890-IJ', marque: 'Mitsubishi', modele: 'L200',     type: 'Pick-up' },
  { immat: 'GA-2345-KL', marque: 'Mercedes', modele: 'Sprinter',   type: 'Fourgon' },
  { immat: 'GA-6789-MN', marque: 'Hyundai', modele: 'H350',        type: 'Fourgon' },
];

const LIEUX = [
  'Carrefour Mont-Bouët, Libreville', 'Avenue Omar Bongo, Libreville',
  'Boulevard Triomphal, Libreville', 'Route de Kango, PK12',
  'Carrefour IAI, Libreville', 'Route nationale 1, PK45',
  'Port d\'Owendo, Libreville', 'Quartier Akanda, Libreville',
  'Route Ntoum, PK25', 'Avenue Léon MBA, Libreville',
];

const genAccidents = () => {
  const accidents = [];
  let id = 1;
  const now = new Date();

  CHAUFFEURS.forEach(ch => {
    const nb = ch.nb_accidents_total;
    for (let a = 0; a < nb; a++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);

      const niveau = NIVEAUX_DEGATS[Math.floor(Math.random() * NIVEAUX_DEGATS.length)];
      const statut = STATUTS[Math.floor(Math.random() * STATUTS.length)];
      const responsabilite = TYPES_RESPONSABILITE[Math.floor(Math.random() * TYPES_RESPONSABILITE.length)];
      const vehicule = VEHICULES[Math.floor(Math.random() * VEHICULES.length)];
      const lieu = LIEUX[Math.floor(Math.random() * LIEUX.length)];

      const coutEstime = Math.floor(Math.random() * 5000000) + 50000;
      const coutFinal = statut.code === 'cloture' ? Math.floor(coutEstime * (0.8 + Math.random() * 0.4)) : null;
      const montantAssurance = (Math.random() > 0.4 && coutFinal) ? Math.floor(coutFinal * 0.7) : null;
      const immobilise = niveau.code === 'grave' || niveau.code === 'critique' || Math.random() > 0.6;
      const joursImmob = immobilise ? Math.floor(Math.random() * 30) + 1 : null;

      accidents.push({
        id: id++,
        ref: `ACC-${String(id).padStart(5, '0')}`,
        vehicule_immatriculation: vehicule.immat,
        vehicule_marque: vehicule.marque,
        vehicule_modele: vehicule.modele,
        chauffeur_id: ch.id,
        chauffeur_nom: ch.nom,
        chauffeur_matricule: ch.matricule,
        chauffeur_direction: ch.direction,
        avatar_color: ch.avatar_color,
        mission_id: Math.random() > 0.3 ? `MIS-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}` : null,
        date_accident: date.toISOString(),
        lieu,
        position_gps: `${(0.39 + (Math.random() - 0.5) * 0.3).toFixed(6)}, ${(9.45 + (Math.random() - 0.5) * 0.3).toFixed(6)}`,
        description: [
          'Collision frontale avec un autre véhicule sur l\'intersection.',
          'Accrochage lors d\'une manœuvre de stationnement.',
          'Sortie de route en raison des conditions météo défavorables.',
          'Collision par l\'arrière lors d\'un arrêt au feu rouge.',
          'Renversement d\'un piéton lors d\'un demi-tour.',
          'Choc latéral avec une moto deux-roues.',
          'Glissade sur route mouillée, heurte le terre-plein central.',
        ][Math.floor(Math.random() * 7)],
        type_responsabilite: responsabilite.code,
        niveau_degats: niveau.code,
        vehicule_immobilise: immobilise,
        jours_immobilisation: joursImmob,
        km_au_moment_accident: Math.floor(Math.random() * 200000) + 10000,
        assure: Math.random() > 0.1,
        cout_estime: coutEstime,
        cout_reparation_final: coutFinal,
        montant_reclame_assurance: montantAssurance,
        montant_verse_assurance: (montantAssurance && statut.code === 'cloture') ? Math.floor(montantAssurance * 0.9) : null,
        statut: statut.code,
        notes: Math.random() > 0.6 ? 'Rapport de police en cours de traitement.' : null,
        rapport_police: Math.random() > 0.5,
        photos_count: Math.floor(Math.random() * 6),
        blessures: Math.random() > 0.7,
        nb_blesses: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
        date_creation: date.toISOString(),
      });
    }
  });

  return accidents.sort((a, b) => new Date(b.date_accident) - new Date(a.date_accident));
};

const ALL_ACCIDENTS = genAccidents();

// ============================================================================
// UTILITAIRES
// ============================================================================
const getNiveauInfo = (code) => NIVEAUX_DEGATS.find(n => n.code === code) || { libelle: code, color: '#94a3b8', bg: 'bg-gray-100 text-gray-600' };
const getStatutInfo = (code) => STATUTS.find(s => s.code === code) || { libelle: code, color: '#94a3b8', bg: 'bg-gray-100 text-gray-600', icon: 'bi-circle' };
const getResponsabiliteInfo = (code) => TYPES_RESPONSABILITE.find(r => r.code === code) || { libelle: code, bg: 'bg-gray-100 text-gray-600' };

const formatCFA = (val) => {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
};

const formatRelative = (isoDate) => {
  const diff = (new Date() - new Date(isoDate)) / 1000;
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return new Date(isoDate).toLocaleDateString('fr-FR');
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
// TOAST — couleur dépend du thème actif
// ============================================================================
const Toast = ({ message, type, onClose, theme }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const icon = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }[type];
  // success & info → couleur du thème | error → rouge | warning → orange
  const bg = type === 'error' ? '#ef4444' : type === 'warning' ? '#f97316' : theme?.primary || '#3b82f6';
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
// MINI DONUT CHART SVG — avec tooltip au survol des segments
// ============================================================================
const DonutChart = ({ data, size = 120, strokeWidth = 14, darkMode }) => {
  const [tooltip, setTooltip] = useState(null); // { label, pct, x, y }
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

  const handleSegmentHover = (e, seg) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      label: seg.label,
      value: seg.value,
      pct: (seg.pct * 100).toFixed(1),
      color: seg.color,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative inline-block" ref={svgRef}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={darkMode ? '#1f2937' : '#f1f5f9'} strokeWidth={strokeWidth} />
        {segments.map((seg) => (
          <circle key={seg.i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={seg.color}
            strokeWidth={tooltip?.label === seg.label ? strokeWidth + 3 : strokeWidth}
            strokeDasharray={`${seg.len} ${circ - seg.len}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-width 0.15s ease, stroke-dasharray 0.8s ease', cursor: 'pointer' }}
            onMouseMove={(e) => handleSegmentHover(e, seg)}
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
// LIGHTBOX — visionneuse plein écran
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
    <div className="fixed inset-0 z-[10000] bg-black/95 flex flex-col"
      onClick={onClose}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <i className="bi bi-camera-fill text-white text-sm"></i>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{photo.name}</p>
            <p className="text-gray-400 text-xs">{idx + 1} / {photos.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={photo.url} download={photo.name}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            onClick={e => e.stopPropagation()}>
            <i className="bi bi-download"></i> Télécharger
          </a>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>
      </div>

      {/* Image principale */}
      <div className="flex-1 flex items-center justify-center px-16 min-h-0" onClick={e => e.stopPropagation()}>
        {/* Flèche gauche */}
        {photos.length > 1 && (
          <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all hover:scale-110">
            <i className="bi bi-chevron-left text-lg"></i>
          </button>
        )}

        <img src={photo.url} alt={photo.name}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
          style={{ animation: 'fadeInUp .2s ease-out' }} />

        {/* Flèche droite */}
        {photos.length > 1 && (
          <button onClick={() => setIdx(i => (i + 1) % photos.length)}
            className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all hover:scale-110">
            <i className="bi bi-chevron-right text-lg"></i>
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
          {photos.map((p, i) => (
            <button key={p.id} onClick={() => setIdx(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden transition-all border-2 ${
                i === idx ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'
              }`}>
              <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
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
  const niveau = getNiveauInfo(a.niveau_degats);
  const statut = getStatutInfo(a.statut);
  const resp = getResponsabiliteInfo(a.type_responsabilite);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState(null); // index de la photo ouverte

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
              <i className="bi bi-car-front-fill text-white text-xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{a.ref}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${niveau.bg}`}>
                  <i className={`${niveau.icon} mr-1`}></i>{niveau.libelle}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statut.bg}`}>
                  <i className={`${statut.icon} mr-1`}></i>{statut.libelle}
                </span>
              </div>
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(a.date_accident).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' '}à{' '}
                {new Date(a.date_accident).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* Alerte blessures */}
          {a.blessures && (
            <div className={`rounded-xl p-4 border border-red-300 mb-5 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'} flex items-center gap-3`}>
              <i className="bi bi-person-fill-x text-red-500 text-2xl"></i>
              <div>
                <p className={`text-sm font-bold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                  Accident avec blessures — {a.nb_blesses} blessé(s) signalé(s)
                </p>
                <p className={`text-xs ${darkMode ? 'text-red-500' : 'text-red-400'}`}>Dossier médical et rapport d'incident requis</p>
              </div>
            </div>
          )}

          {/* Layout 3 colonnes */}
          <div className="grid grid-cols-3 gap-5">

            {/* ── COLONNE 1 ── Chauffeur & Détails */}
            <div className="space-y-4">

              {/* Chauffeur & Véhicule */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-blue-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-person-fill mr-1.5"></i>Chauffeur & Véhicule
                </p>
                <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#dbeafe'}` }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ background: a.avatar_color }}>{a.chauffeur_nom.charAt(0)}</div>
                  <div>
                    <p className={`font-bold text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{a.chauffeur_nom}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.chauffeur_matricule}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.chauffeur_direction}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ['Véhicule',       `${a.vehicule_marque} ${a.vehicule_modele}`, 'bi-car-front-fill'],
                    ['Immatriculation', a.vehicule_immatriculation,                  'bi-card-text'],
                    ['Kilométrage',    a.km_au_moment_accident ? `${a.km_au_moment_accident.toLocaleString('fr-FR')} km` : '—', 'bi-speedometer2'],
                    ['Mission liée',   a.mission_id || 'Aucune',                    'bi-geo-fill'],
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

              {/* Détails accident */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-orange-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-geo-alt-fill mr-1.5"></i>Détails de l'accident
                </p>
                <div className="space-y-3">
                  {[
                    ['Lieu',              a.lieu || '—',      'bi-pin-map-fill'],
                    ['Position GPS',      a.position_gps || '—', 'bi-crosshair'],
                    ['Rapport police',    a.rapport_police ? 'Disponible ✓' : 'Non disponible', 'bi-file-earmark-text-fill'],
                  ].map(([l, v, ic], i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <i className={`bi ${ic} text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{l}</span>
                      </div>
                      <span className={`text-xs font-semibold text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{v}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-person-badge-fill text-xs" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}></i>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Responsabilité</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${resp.bg}`}>{getResponsabiliteInfo(a.type_responsabilite).libelle}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-slash-circle-fill text-xs" style={{ color: darkMode ? '#6b7280' : '#9ca3af' }}></i>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Véhicule immobilisé</span>
                    </div>
                    {a.vehicule_immobilise
                      ? <span className="text-red-500 font-semibold text-xs"><i className="bi bi-x-circle-fill mr-1"></i>Oui · {a.jours_immobilisation} j</span>
                      : <span className="text-green-500 font-semibold text-xs"><i className="bi bi-check-circle-fill mr-1"></i>Non</span>}
                  </div>
                </div>
              </div>

              {/* Description */}
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

            {/* ── COLONNE 2 ── Coûts & Photos */}
            <div className="space-y-4">

              {/* Coûts & Assurance */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-green-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-cash-stack mr-1.5"></i>Coûts & Assurance
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Coût estimé',          val: formatCFA(a.cout_estime),               icon: 'bi-calculator-fill',           color: '#f59e0b' },
                    { label: 'Coût final réparation', val: formatCFA(a.cout_reparation_final),     icon: 'bi-tools',                     color: '#06b6d4' },
                    { label: 'Réclamé assurance',     val: formatCFA(a.montant_reclame_assurance), icon: 'bi-file-earmark-medical-fill',  color: '#8b5cf6' },
                    { label: 'Versé assurance',       val: formatCFA(a.montant_verse_assurance),   icon: 'bi-check2-circle',             color: '#10b981' },
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
              </div>

            </div>

            {/* ── COLONNE 3 ── Photos & Statut */}
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
                        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 rounded-full p-2">
                            <i className="bi bi-zoom-in text-white text-base"></i>
                          </div>
                        </div>
                        {i === 0 && photos.length > 1 && (
                          <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/50 text-white">
                            1/{photos.length}
                          </span>
                        )}
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
                      <i className={`${s.icon}`}></i>{s.libelle}
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
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="px-4 py-2.5 rounded-lg border border-red-300 text-red-500 text-sm font-semibold flex items-center gap-2 hover:bg-red-50 transition-colors">
                <i className="bi bi-trash3-fill"></i> Supprimer
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Confirmer ?</span>
                <button onClick={() => { onDelete(a.id); onClose(); }}
                  className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors">Oui</button>
                <button onClick={() => setConfirmDelete(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} transition-colors`}>Non</button>
              </div>
            )}
          </div>
          <button onClick={onClose}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}>
            Fermer
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos.length > 0 && (
        <Lightbox photos={photos} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
};

// ============================================================================
// MODAL FORMULAIRE ACCIDENT (Créer / Modifier)
// ============================================================================
const AccidentFormModal = ({ accident, darkMode, theme, onClose, onSave }) => {
  const isEdit = !!accident;
  const [form, setForm] = useState({
    vehicule_immatriculation: accident?.vehicule_immatriculation || '',
    chauffeur_id: accident?.chauffeur_id || '',
    date_accident: accident ? new Date(accident.date_accident).toISOString().slice(0, 16) : '',
    lieu: accident?.lieu || '',
    description: accident?.description || '',
    type_responsabilite: accident?.type_responsabilite || 'indetermine',
    niveau_degats: accident?.niveau_degats || 'leger',
    vehicule_immobilise: accident?.vehicule_immobilise || false,
    jours_immobilisation: accident?.jours_immobilisation || '',
    km_au_moment_accident: accident?.km_au_moment_accident || '',
    assure: accident?.assure ?? true,
    cout_estime: accident?.cout_estime || '',
    cout_reparation_final: accident?.cout_reparation_final || '',
    montant_reclame_assurance: accident?.montant_reclame_assurance || '',
    montant_verse_assurance: accident?.montant_verse_assurance || '',
    statut: accident?.statut || 'declare',
    blessures: accident?.blessures || false,
    nb_blesses: accident?.nb_blesses || 0,
    rapport_police: accident?.rapport_police || false,
    notes: accident?.notes || '',
    photos: accident?.photos || [],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: typeof v === 'function' ? v(f[k]) : v }));

  const handleSubmit = () => {
    if (!form.vehicule_immatriculation || !form.chauffeur_id || !form.date_accident) return;
    onSave({ ...form, id: accident?.id });
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;
  const labelCls = `block text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-[96vw] h-[96vh] overflow-hidden flex flex-col shadow-2xl`}>

        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}
          style={{ background: `linear-gradient(135deg, ${theme.primary}18, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow`}
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className={`bi ${isEdit ? 'bi-pencil-fill' : 'bi-plus-lg'} text-base`}></i>
            </div>
            <div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isEdit ? 'Modifier l\'accident' : 'Déclarer un accident'}
              </h2>
              {isEdit && <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{accident.ref}</p>}
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-2 gap-8 h-full">

            {/* ══ COLONNE GAUCHE ══ */}
            <div className="space-y-5">

              {/* Section 1 — Acteurs */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-people-fill mr-1.5"></i>Acteurs
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Chauffeur *</label>
                    <select value={form.chauffeur_id} onChange={e => set('chauffeur_id', e.target.value)} className={inputCls}>
                      <option value="">Sélectionner un chauffeur</option>
                      {CHAUFFEURS.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.matricule})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Véhicule *</label>
                    <select value={form.vehicule_immatriculation} onChange={e => set('vehicule_immatriculation', e.target.value)} className={inputCls}>
                      <option value="">Sélectionner un véhicule</option>
                      {VEHICULES.map(v => <option key={v.immat} value={v.immat}>{v.immat} — {v.marque} {v.modele}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2 — Date & Localisation */}
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
                </div>
              </div>

              {/* Section 3 — Caractéristiques */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-exclamation-triangle-fill mr-1.5"></i>Caractéristiques
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelCls}>Niveau des dégâts *</label>
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
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Véhicule immobilisé', key: 'vehicule_immobilise', icon: 'bi-car-front',          color: 'red'    },
                    { label: 'Assuré',              key: 'assure',              icon: 'bi-shield-check',       color: 'green'  },
                    { label: 'Avec blessures',      key: 'blessures',           icon: 'bi-person-fill-x',      color: 'orange' },
                    { label: 'Rapport police',      key: 'rapport_police',      icon: 'bi-file-earmark-text',  color: 'blue'   },
                  ].map(({ label, key, icon, color }) => (
                    <button key={key} type="button" onClick={() => set(key, !form[key])}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        form[key]
                          ? `bg-${color}-100 text-${color}-700 border-${color}-300`
                          : darkMode ? 'border-gray-700 text-gray-500 hover:bg-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-100'
                      }`}>
                      <i className={`bi ${icon}`}></i>{label}
                    </button>
                  ))}
                </div>
                {form.vehicule_immobilise && (
                  <div className="mt-3">
                    <label className={labelCls}>Jours d'immobilisation estimés</label>
                    <input type="number" value={form.jours_immobilisation} onChange={e => set('jours_immobilisation', e.target.value)} placeholder="Nombre de jours" className={inputCls} />
                  </div>
                )}
                {form.blessures && (
                  <div className="mt-3">
                    <label className={labelCls}>Nombre de blessés</label>
                    <input type="number" min="1" value={form.nb_blesses} onChange={e => set('nb_blesses', e.target.value)} placeholder="Nombre" className={inputCls} />
                  </div>
                )}
              </div>
            </div>

            {/* ══ COLONNE DROITE ══ */}
            <div className="space-y-5">

              {/* Section 4 — Coûts */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-cash-stack mr-1.5"></i>Coûts (FCFA)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Coût estimé',                   key: 'cout_estime' },
                    { label: 'Coût réparation final',         key: 'cout_reparation_final' },
                    { label: 'Montant réclamé assurance',     key: 'montant_reclame_assurance' },
                    { label: 'Montant versé assurance',       key: 'montant_verse_assurance' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className={labelCls}>{label}</label>
                      <input type="number" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="0" className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5 — Photos */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-camera-fill mr-1.5"></i>Photos de l'accident
                </p>
                <div className={`border-2 border-dashed rounded-xl transition-colors ${darkMode ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'}`}>
                  <label className="cursor-pointer block p-4">
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => {
                        Array.from(e.target.files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (ev) => set('photos', prev => [...(Array.isArray(prev) ? prev : []), {
                            id: Date.now() + Math.random(), name: file.name, url: ev.target.result, size: file.size,
                          }]);
                          reader.readAsDataURL(file);
                        });
                        e.target.value = '';
                      }} />
                    <div className={`flex flex-col items-center gap-2 py-2 ${form.photos?.length > 0 ? 'hidden' : ''}`}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}22` }}>
                        <i className="bi bi-cloud-upload-fill text-2xl" style={{ color: theme.primary }}></i>
                      </div>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cliquer pour ajouter des photos</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>JPG, PNG, WEBP — sélection multiple</p>
                    </div>
                  </label>
                  {form.photos?.length > 0 && (
                    <div className="px-4 pb-4 space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        {form.photos.map((photo) => (
                          <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square">
                            <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                              <button type="button" onClick={() => set('photos', prev => prev.filter(p => p.id !== photo.id))}
                                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                                <i className="bi bi-trash3-fill text-xs"></i>
                              </button>
                            </div>
                            <div className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[9px] truncate ${darkMode ? 'bg-gray-900/80 text-gray-300' : 'bg-white/80 text-gray-600'}`}>
                              {photo.name}
                            </div>
                          </div>
                        ))}
                        <label className={`cursor-pointer aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-colors
                          ${darkMode ? 'border-gray-600 hover:border-gray-400 text-gray-500 hover:text-gray-300' : 'border-gray-300 hover:border-gray-400 text-gray-300 hover:text-gray-500'}`}>
                          <input type="file" accept="image/*" multiple className="hidden"
                            onChange={(e) => {
                              Array.from(e.target.files).forEach(file => {
                                const reader = new FileReader();
                                reader.onload = (ev) => set('photos', prev => [...(Array.isArray(prev) ? prev : []), {
                                  id: Date.now() + Math.random(), name: file.name, url: ev.target.result, size: file.size,
                                }]);
                                reader.readAsDataURL(file);
                              });
                              e.target.value = '';
                            }} />
                          <i className="bi bi-plus-lg text-xl"></i>
                        </label>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {form.photos.length} photo{form.photos.length > 1 ? 's' : ''} ajoutée{form.photos.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6 — Description & Notes */}
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
          <button onClick={onClose}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}>
            Annuler
          </button>
          <button onClick={handleSubmit}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
            <i className={`bi ${isEdit ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
            {isEdit ? 'Enregistrer les modifications' : 'Déclarer l\'accident'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MENU 3 POINTS — dropdown via portal
// ============================================================================
const ActionMenu = ({ accident, darkMode, theme, onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.right - 176,
      });
    }
    setOpen(o => !o);
  };

  // Fermer au clic n'importe où sauf sur le bouton lui-même
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    // Délai pour ne pas fermer au même clic qui a ouvert
    const t = setTimeout(() => {
      document.addEventListener('click', close, { once: true });
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
          ${open
            ? 'text-white shadow-sm'
            : darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
          }`}
        style={open ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` } : {}}>
        <i className="bi bi-three-dots-vertical text-sm"></i>
      </button>

      {open && ReactDOM.createPortal(
        <div
          onClick={e => e.stopPropagation()}
          className={`fixed z-[9999] rounded-xl shadow-2xl border py-1.5 w-44
            ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{ top: menuPos.top, left: menuPos.left, animation: 'fadeInDown .15s ease-out' }}>

          <button onClick={(e) => { e.stopPropagation(); onView(accident); setOpen(false); }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors
              ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <i className="bi bi-eye text-base" style={{ color: theme.primary }}></i>
            Voir les détails
          </button>

          <button onClick={(e) => { e.stopPropagation(); onEdit(accident); setOpen(false); }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors
              ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <i className="bi bi-pencil-fill text-base" style={{ color: theme.primary }}></i>
            Modifier
          </button>

          <div className={`my-1 mx-3 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />

          <button onClick={(e) => { e.stopPropagation(); onDelete(accident.id); setOpen(false); }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors
              ${darkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'}`}>
            <i className="bi bi-trash3-fill text-base"></i>
            Supprimer
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

// ============================================================================
// KPI CARDS — chiffres animés
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

const KpiCards = ({ total, nbImmobilises, nbBlessures, coutTotal, periodeInfo, darkMode, animateCards }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <KpiCard label="Total accidents"       target={total}               icon="bi-car-front-fill"    color="#ef4444" sub={periodeInfo.libelle}   delay={0}    darkMode={darkMode} animateCards={animateCards} />
    <KpiCard label="Véhicules immobilisés" target={nbImmobilises}       icon="bi-slash-circle-fill" color="#f97316" sub="sur la période"        delay={0.07} darkMode={darkMode} animateCards={animateCards} />
    <KpiCard label="Avec blessures"        target={nbBlessures}         icon="bi-person-fill-x"     color="#8b5cf6" sub="accidents corporels"   delay={0.14} darkMode={darkMode} animateCards={animateCards} />
    <KpiCard label="Coût total estimé"     target={coutTotal / 1000000} icon="bi-cash-stack"        color="#06b6d4" sub="FCFA (estimation)"     delay={0.21} darkMode={darkMode} animateCards={animateCards} decimals={1} suffix="M" />
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Dashboard = () => {
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

  // ── États ──
  const [accidents, setAccidents]             = useState(ALL_ACCIDENTS);
  const [searchTerm, setSearchTerm]           = useState('');
  const [filterNiveau, setFilterNiveau]       = useState('');
  const [filterStatut, setFilterStatut]       = useState('');
  const [filterResp, setFilterResp]           = useState('');
  const [filterChauffeur, setFilterChauffeur] = useState('');
  const [filterImmob, setFilterImmob]         = useState('');
  const [filterPeriode, setFilterPeriode]     = useState('365j');
  const [sortBy, setSortBy]                   = useState('date_accident');
  const [sortDir, setSortDir]                 = useState('desc');
  const [currentPage, setCurrentPage]         = useState(1);
  const [view, setView]                       = useState('table');
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal]     = useState(false);
  const [editAccident, setEditAccident]       = useState(null);
  const [toast, setToast]                     = useState(null);
  const [exportOpen, setExportOpen]           = useState(false);
  const exportRef = useRef(null);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  useEffect(() => {
    const h = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const ITEMS_PER_PAGE = 10;

  // ── Filtrage ──
  const periodeInfo = PERIODES.find(p => p.code === filterPeriode) || PERIODES[4];
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - periodeInfo.jours);

  const filtered = accidents.filter(a => {
    if (new Date(a.date_accident) < cutoff)             return false;
    if (filterNiveau   && a.niveau_degats  !== filterNiveau)   return false;
    if (filterStatut   && a.statut         !== filterStatut)   return false;
    if (filterResp     && a.type_responsabilite !== filterResp) return false;
    if (filterChauffeur && String(a.chauffeur_id) !== filterChauffeur) return false;
    if (filterImmob === 'oui' && !a.vehicule_immobilise)  return false;
    if (filterImmob === 'non' && a.vehicule_immobilise)   return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return a.chauffeur_nom.toLowerCase().includes(q) ||
             a.vehicule_immatriculation.toLowerCase().includes(q) ||
             a.ref.toLowerCase().includes(q) ||
             (a.lieu || '').toLowerCase().includes(q);
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortBy], vb = b[sortBy];
    if (sortBy === 'date_accident') { va = new Date(va); vb = new Date(vb); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated  = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => setCurrentPage(1), [filterNiveau, filterStatut, filterResp, filterChauffeur, filterImmob, filterPeriode, searchTerm, sortBy, sortDir]);

  const resetFilters = () => { setFilterNiveau(''); setFilterStatut(''); setFilterResp(''); setFilterChauffeur(''); setFilterImmob(''); setSearchTerm(''); };
  const hasFilters = filterNiveau || filterStatut || filterResp || filterChauffeur || filterImmob || searchTerm;

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  // ── CRUD ──
  const handleSave = (data) => {
    if (data.id) {
      setAccidents(prev => prev.map(a => a.id === data.id
        ? {
          ...a, ...data,
          chauffeur_nom: CHAUFFEURS.find(c => String(c.id) === String(data.chauffeur_id))?.nom || a.chauffeur_nom,
          avatar_color: CHAUFFEURS.find(c => String(c.id) === String(data.chauffeur_id))?.avatar_color || a.avatar_color,
          vehicule_marque: VEHICULES.find(v => v.immat === data.vehicule_immatriculation)?.marque || a.vehicule_marque,
          vehicule_modele: VEHICULES.find(v => v.immat === data.vehicule_immatriculation)?.modele || a.vehicule_modele,
        }
        : a
      ));
      showToast('Accident mis à jour avec succès', 'success');
    } else {
      const ch = CHAUFFEURS.find(c => String(c.id) === String(data.chauffeur_id));
      const veh = VEHICULES.find(v => v.immat === data.vehicule_immatriculation);
      const newAcc = {
        ...data,
        id: Date.now(),
        ref: `ACC-${String(accidents.length + 2).padStart(5, '0')}`,
        chauffeur_nom: ch?.nom || '',
        chauffeur_matricule: ch?.matricule || '',
        chauffeur_direction: ch?.direction || '',
        avatar_color: ch?.avatar_color || '#94a3b8',
        vehicule_marque: veh?.marque || '',
        vehicule_modele: veh?.modele || '',
        photos: data.photos || [],
        photos_count: (data.photos || []).length,
        mission_id: null,
        date_creation: new Date().toISOString(),
        position_gps: null,
        notes: data.notes || null,
      };
      setAccidents(prev => [newAcc, ...prev]);
      showToast('Accident déclaré avec succès', 'success');
    }
    setShowFormModal(false);
    setEditAccident(null);
  };

  const handleDelete = (id) => {
    setAccidents(prev => prev.filter(a => a.id !== id));
    showToast('Accident supprimé', 'warning');
  };

  const handleChangeStatut = (id, newStatut) => {
    setAccidents(prev => prev.map(a => a.id === id ? { ...a, statut: newStatut } : a));
    if (selectedAccident?.id === id) setSelectedAccident(prev => ({ ...prev, statut: newStatut }));
    showToast(`Statut mis à jour : ${getStatutInfo(newStatut).libelle}`, 'info');
  };

  const handleEdit = (acc) => {
    setShowDetailModal(false);
    setEditAccident(acc);
    setShowFormModal(true);
  };

  // ── Statistiques ──
  const total          = filtered.length;
  const nbImmobilises  = filtered.filter(a => a.vehicule_immobilise).length;
  const nbBlessures    = filtered.filter(a => a.blessures).length;
  const coutTotal      = filtered.reduce((s, a) => s + (Number(a.cout_estime) || 0), 0);
  const nbCritiques    = filtered.filter(a => a.niveau_degats === 'critique' || a.niveau_degats === 'grave').length;

  // Distribution par niveau
  const niveauDistrib = NIVEAUX_DEGATS.map(n => ({
    ...n, value: filtered.filter(a => a.niveau_degats === n.code).length,
  }));
  // Distribution par statut
  const statutDistrib = STATUTS.map(s => ({
    ...s, value: filtered.filter(a => a.statut === s.code).length,
  }));
  // Distribution par responsabilité
  const respDistrib = TYPES_RESPONSABILITE.map(r => ({
    ...r, value: filtered.filter(a => a.type_responsabilite === r.code).length,
  }));
  // Top chauffeurs accidentés
  const topChauffeurs = CHAUFFEURS
    .map(c => ({ ...c, count: filtered.filter(a => a.chauffeur_id === c.id).length }))
    .sort((a, b) => b.count - a.count)
    .filter(c => c.count > 0);
  const maxCountCh = Math.max(...topChauffeurs.map(c => c.count), 1);




  // ── Export ──
  const expHeaders = ['Référence', 'Date', 'Chauffeur', 'Véhicule', 'Lieu', 'Niveau', 'Statut', 'Responsabilité', 'Immobilisé', 'Jours immob.', 'Coût estimé', 'Coût final', 'Assurance réclamée', 'Assurance versée', 'Blessures', 'Notes'];
  const toRow = (a) => [
    a.ref,
    new Date(a.date_accident).toLocaleString('fr-FR'),
    a.chauffeur_nom,
    `${a.vehicule_immatriculation} (${a.vehicule_marque} ${a.vehicule_modele})`,
    a.lieu || '—',
    getNiveauInfo(a.niveau_degats).libelle,
    getStatutInfo(a.statut).libelle,
    getResponsabiliteInfo(a.type_responsabilite).libelle,
    a.vehicule_immobilise ? 'Oui' : 'Non',
    a.jours_immobilisation || '—',
    a.cout_estime || 0,
    a.cout_reparation_final || '—',
    a.montant_reclame_assurance || '—',
    a.montant_verse_assurance || '—',
    a.blessures ? `Oui (${a.nb_blesses})` : 'Non',
    a.notes || '—',
  ];

  const SortIcon = ({ col }) => (
    <i className={`bi bi-arrow-${sortBy === col ? (sortDir === 'asc' ? 'up' : 'down') : 'down-up'} text-[10px] ml-1 opacity-60`}></i>
  );

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        .row-hover:hover { filter: brightness(1.07); }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
      `}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} theme={theme} />}
      {(showNotifications || showProfile) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfile(false); }} />
      )}

      <main className="transition-all duration-300 pt-24 px-6 pb-10" style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}>

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
                Gestion et suivi des accidents de la flotte SGS
              </p>
            </div>
          </div>

          <button onClick={() => { setEditAccident(null); setShowFormModal(true); }}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-lg hover:opacity-90 transition-all"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
            <i className="bi bi-plus-circle-fill text-base"></i>
            Déclarer un accident
          </button>
        </div>

        {/* ════ KPI CARDS ════ */}
        <KpiCards total={total} nbImmobilises={nbImmobilises} nbBlessures={nbBlessures}
          coutTotal={coutTotal} periodeInfo={periodeInfo} darkMode={darkMode} animateCards={animateCards} />

    {/* ════ GRAPHIQUES LIGNE 1 : Barres horizontales ════ */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

  {/* Barres — Gravité des accidents */}
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
    style={{ animation: animateCards ? 'fadeInUp .5s ease-out .28s both' : 'none' }}>
    <div className="flex items-center gap-2 mb-5">
      <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
      <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gravité des accidents</h3>
      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
        {total} total
      </span>
    </div>
    <div className="space-y-3">
      {niveauDistrib.map(n => {
        const pct = total > 0 ? Math.round((n.value / total) * 100) : 0;
        return (
          <div key={n.code} className="group relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: n.color }}></div>
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{n.libelle}</span>
              </div>
              <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{n.value}</span>
            </div>
            <div className={`relative h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: n.color }}></div>
            </div>
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-lg
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
              style={{ background: n.color }}>
              {n.value} accident{n.value > 1 ? 's' : ''} · {pct}%
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                style={{ borderTopColor: n.color }}></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* Barres — Statuts des dossiers */}
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
    style={{ animation: animateCards ? 'fadeInUp .5s ease-out .35s both' : 'none' }}>
    <div className="flex items-center gap-2 mb-5">
      <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
      <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Statuts des dossiers</h3>
      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
        {statutDistrib.filter(s => s.value > 0).length} statut{statutDistrib.filter(s => s.value > 0).length > 1 ? 's' : ''}
      </span>
    </div>
    <div className="space-y-3">
      {statutDistrib.filter(s => s.value > 0).map(s => {
        const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
        return (
          <div key={s.code} className="group relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }}></div>
                <span className={`text-xs font-medium truncate max-w-[110px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{s.libelle}</span>
              </div>
              <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.value}</span>
            </div>
            <div className={`relative h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: s.color }}></div>
            </div>
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-lg
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
              style={{ background: s.color }}>
              {s.value} dossier{s.value > 1 ? 's' : ''} · {pct}%
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                style={{ borderTopColor: s.color }}></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* Barres — Responsabilités */}
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
    style={{ animation: animateCards ? 'fadeInUp .5s ease-out .42s both' : 'none' }}>
    <div className="flex items-center gap-2 mb-5">
      <div className="w-1 h-5 rounded-full bg-purple-500"></div>
      <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Responsabilités</h3>
      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
        {nbCritiques} grave{nbCritiques > 1 ? 's' : ''}
      </span>
    </div>
    <div className="space-y-3">
      {respDistrib.filter(r => r.value > 0).map(r => {
        const pct = total > 0 ? Math.round((r.value / total) * 100) : 0;
        return (
          <div key={r.code} className="group relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }}></div>
                <span className={`text-xs font-medium truncate max-w-[110px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{r.libelle}</span>
              </div>
              <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{r.value}</span>
            </div>
            <div className={`relative h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: r.color }}></div>
            </div>
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold text-white shadow-lg
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
              style={{ background: r.color }}>
              {r.value} accident{r.value > 1 ? 's' : ''} · {pct}%
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                style={{ borderTopColor: r.color }}></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>

</div>

        {/* ════ GRAPHIQUES LIGNE 2 : Top Chauffeurs pleine largeur ════ */}
        <div className="mb-6">

          {/* Top chauffeurs accidentés */}
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .49s both' : 'none' }}>
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
                  <div key={c.id} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      style={i === 0 ? { color: theme.primary } : {}}># {i + 1}</span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: c.avatar_color }}>{c.nom.charAt(0)}</div>
                    <span className={`text-sm font-medium w-32 truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{c.nom}</span>
                    <Tooltip darkMode={darkMode}
                      label={`${c.nom} — ${c.count} accident${c.count > 1 ? 's' : ''} · ${c.direction}`}>
                      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} cursor-pointer`}
                        style={{ minWidth: '80px' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(c.count / maxCountCh) * 100}%`, background: theme.primary, opacity: i === 0 ? 1 : Math.max(0.4, 1 - i * 0.15) }} />
                      </div>
                    </Tooltip>
                    <span className={`text-sm font-bold w-5 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      style={i === 0 ? { color: theme.primary } : {}}>{c.count}</span>
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
                {CHAUFFEURS.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
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
                {[['table', 'bi-table'], ['cards', 'bi-grid-3x3-gap-fill']].map(([v, ic]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`p-2 text-sm transition-colors ${view === v ? 'text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
                    style={view === v ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                    <i className={`bi ${ic}`}></i>
                  </button>
                ))}
              </div>

              {/* Recherche */}
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Réf, chauffeur, véhicule, lieu..."
                  className={`pl-9 pr-4 py-2 rounded-lg border text-sm w-52 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`} />
              </div>

              {/* Export */}
              <div className="relative" ref={exportRef}>
                <button onClick={() => setExportOpen(!exportOpen)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <i className="bi bi-download"></i> Exporter
                </button>
                {exportOpen && (
                  <div className={`absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl border py-2 min-w-[210px] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <p className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sorted.length} accident(s)</p>
                    <button onClick={() => { exportToExcel(sorted.map(toRow), 'Registre_Accidents', expHeaders); showToast('Export Excel effectué', 'success'); setExportOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                      <i className="bi bi-file-earmark-spreadsheet text-green-500 text-base"></i>
                      <div><p className="font-medium">Exporter en Excel</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Format CSV (UTF-8)</p></div>
                    </button>
                    <button onClick={() => { exportToPDF('Registre des Accidents', expHeaders, sorted.map(toRow)); showToast('Export PDF généré', 'success'); setExportOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                      <i className="bi bi-file-earmark-pdf text-red-500 text-base"></i>
                      <div><p className="font-medium">Exporter en PDF</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Impression paysage</p></div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sorted.length} accident(s) trouvé(s)</p>
        </div>

        {/* ════ VUE TABLEAU ════ */}
        {view === 'table' && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .65s both' : 'none' }}>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                    {[
                      ['Réf.', 'ref'],
                      ['Chauffeur', 'chauffeur_nom'],
                      ['Véhicule', null],
                      ['Date', 'date_accident'],
                      ['Lieu', null],
                      ['Niveau', 'niveau_degats'],
                      ['Statut', 'statut'],
                      ['Coût estimé', 'cout_estime'],
                      ['Immob.', null],
                      ['Actions', null],
                    ].map(([h, col], i) => (
                      <th key={i} onClick={() => col && handleSort(col)}
                        className={`px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white ${col ? 'cursor-pointer hover:bg-white/10 select-none' : ''} ${i === 9 ? 'text-center' : ''}`}>
                        {h}{col && <SortIcon col={col} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={10} className={`text-center py-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <i className="bi bi-car-front text-5xl block mb-3 opacity-40"></i>
                      <span className="text-sm">Aucun accident pour les filtres sélectionnés</span>
                    </td></tr>
                  ) : paginated.map((a, idx) => {
                    const niveau = getNiveauInfo(a.niveau_degats);
                    const statut = getStatutInfo(a.statut);
                    return (
                      <tr key={a.id} className="row-hover transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: idx % 2 === 0 ? (darkMode ? '#0c1929' : '#fef2f2') : (darkMode ? '#162033' : '#fff5f5'),
                          animation: animateCards ? `fadeInUp .4s ease-out ${idx * .04}s both` : 'none',
                        }}
                        onClick={() => { setSelectedAccident(a); setShowDetailModal(true); }}>

                        {/* Réf */}
                        <td className="px-4 py-4">
                          <span className={`text-xs font-mono font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{a.ref}</span>
                          {a.blessures && <span className="ml-2 text-red-500 text-xs" title="Blessures"><i className="bi bi-person-fill-x"></i></span>}
                        </td>

                        {/* Chauffeur */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: a.avatar_color }}>
                              {a.chauffeur_nom.charAt(0)}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{a.chauffeur_nom}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.chauffeur_matricule}</p>
                            </div>
                          </div>
                        </td>

                        {/* Véhicule */}
                        <td className="px-4 py-4">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{a.vehicule_immatriculation}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.vehicule_marque} {a.vehicule_modele}</p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{new Date(a.date_accident).toLocaleDateString('fr-FR')}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(a.date_accident).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>

                        {/* Lieu */}
                        <td className="px-4 py-4">
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-[140px] truncate`} title={a.lieu}>{a.lieu || '—'}</p>
                        </td>

                        {/* Niveau */}
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${niveau.bg}`}>
                            <i className={`${niveau.icon} mr-1`}></i>{niveau.libelle}
                          </span>
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statut.bg}`}>
                            <i className={`${statut.icon} mr-1`}></i>{statut.libelle}
                          </span>
                        </td>

                        {/* Coût */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {a.cout_estime ? `${(a.cout_estime / 1000).toFixed(0)}k` : '—'} FCFA
                          </p>
                        </td>

                        {/* Immobilisé */}
                        <td className="px-4 py-4 text-center">
                          {a.vehicule_immobilise
                            ? <span className="text-red-500"><i className="bi bi-x-circle-fill"></i></span>
                            : <span className="text-green-500"><i className="bi bi-check-circle-fill"></i></span>}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <ActionMenu
                            accident={a}
                            darkMode={darkMode}
                            theme={theme}
                            onView={(acc) => { setSelectedAccident(acc); setShowDetailModal(true); }}
                            onEdit={handleEdit}
                            onDelete={(id) => { if (window.confirm('Supprimer cet accident ?')) handleDelete(id); }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)} sur {sorted.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}>
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
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${currentPage === page ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                        style={currentPage === page ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                        {page}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ VUE CARDS ════ */}
        {view === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .65s both' : 'none' }}>
            {paginated.map((a, idx) => {
              const niveau = getNiveauInfo(a.niveau_degats);
              const statut = getStatutInfo(a.statut);
              return (
                <div key={a.id} onClick={() => { setSelectedAccident(a); setShowDetailModal(true); }}
                  className={`${darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-300'} rounded-xl border shadow-sm p-5 cursor-pointer transition-all card-hover`}
                  style={{ animation: animateCards ? `fadeInUp .4s ease-out ${idx * .04}s both` : 'none' }}>

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.ref}</span>
                      {a.blessures && <span className="text-red-500 text-xs" title="Blessures"><i className="bi bi-person-fill-x"></i></span>}
                      {a.rapport_police && <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} title="Rapport police"><i className="bi bi-file-earmark-text"></i></span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${niveau.bg}`}>{niveau.libelle}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statut.bg}`}>{statut.libelle}</span>
                    </div>
                  </div>

                  {/* Chauffeur */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: a.avatar_color }}>
                      {a.chauffeur_nom.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{a.chauffeur_nom}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.chauffeur_matricule}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{a.vehicule_immatriculation}</p>
                      <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.vehicule_marque} {a.vehicule_modele}</p>
                    </div>
                  </div>

                  {/* Infos */}
                  <div className={`rounded-lg p-3 space-y-1.5 mb-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-calendar2-event text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                      <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {new Date(a.date_accident).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-geo-alt text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{a.lieu || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-cash text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                      <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {a.cout_estime ? `${(a.cout_estime / 1000).toFixed(0)}k FCFA` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {a.vehicule_immobilise && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'}`}>
                          <i className="bi bi-slash-circle mr-0.5"></i>Immob. {a.jours_immobilisation}j
                        </span>
                      )}
                      {a.assure && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                          <i className="bi bi-shield-check mr-0.5"></i>Assuré
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{formatRelative(a.date_accident)}</span>
                      <div onClick={e => e.stopPropagation()}>
                        <ActionMenu
                          accident={a}
                          darkMode={darkMode}
                          theme={theme}
                          onView={(acc) => { setSelectedAccident(acc); setShowDetailModal(true); }}
                          onEdit={handleEdit}
                          onDelete={(id) => { if (window.confirm('Supprimer cet accident ?')) handleDelete(id); }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination cards */}
            {totalPages > 1 && (
              <div className="col-span-full flex items-center justify-between px-2 py-3">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)} sur {sorted.length}</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold ${currentPage === page ? 'text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                      style={currentPage === page ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-center`}>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            {"© 2026 SGS — Registre des Accidents — Fleetify"}
          </p>
        </div>
      </main>

      {/* ════ MODALS ════ */}
      {showDetailModal && selectedAccident && (
        <AccidentModal
          accident={selectedAccident}
          darkMode={darkMode}
          theme={theme}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEdit}
          onDelete={(id) => { handleDelete(id); setShowDetailModal(false); }}
          onChangeStatut={handleChangeStatut}
        />
      )}

      {showFormModal && (
        <AccidentFormModal
          accident={editAccident}
          darkMode={darkMode}
          theme={theme}
          onClose={() => { setShowFormModal(false); setEditAccident(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Dashboard;