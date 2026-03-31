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
          <div className={`absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 rotate-45 ${darkMode ? 'bg-gray-700' : 'bg-gray-900'}`} />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DONNÉES DE RÉFÉRENCE
// ============================================================================
const TYPES_MISSION = [
  { code: 'mission_brousse', libelle: 'Mission Brousse',      color: '#10b981', bg: 'bg-emerald-100 text-emerald-700', icon: 'bi-tree-fill',          tab: 'brousse' },
  { code: 'transport_fonds', libelle: 'Transport de Fonds',   color: '#6366f1', bg: 'bg-indigo-100 text-indigo-700',   icon: 'bi-shield-lock-fill',   tab: 'tf' },
];

const STATUTS_MISSION = [
  { code: 'planifiee',   libelle: 'Planifiée',    color: '#6366f1', bg: 'bg-indigo-100 text-indigo-700', icon: 'bi-calendar-check-fill' },
  { code: 'en_cours',    libelle: 'En cours',     color: '#f59e0b', bg: 'bg-yellow-100 text-yellow-700', icon: 'bi-play-circle-fill' },
  { code: 'terminee',    libelle: 'Terminée',     color: '#10b981', bg: 'bg-green-100 text-green-700',   icon: 'bi-check-circle-fill' },
  { code: 'annulee',     libelle: 'Annulée',      color: '#ef4444', bg: 'bg-red-100 text-red-700',       icon: 'bi-x-circle-fill' },
];

const PERIODES = [
  { code: '7j',   libelle: '7 jours',     jours: 7 },
  { code: '30j',  libelle: 'Mensuel',     jours: 30 },
  { code: '90j',  libelle: 'Trimestriel', jours: 90 },
  { code: '180j', libelle: 'Semestriel',  jours: 180 },
  { code: '365j', libelle: 'Annuel',      jours: 365 },
];

const DIRECTIONS = [
  { id: 1, nom: 'Direction Générale',            code: 'DG' },
  { id: 2, nom: 'Direction Technique',           code: 'DT' },
  { id: 3, nom: 'Direction Logistique',          code: 'DL' },
  { id: 4, nom: 'Transport de Fonds',            code: 'TF' },
  { id: 5, nom: 'Direction des Systèmes d\'Info', code: 'DSI' },
  { id: 6, nom: 'Direction Administrative',      code: 'DA' },
];

// Chauffeurs : certains sont TF, d'autres brousse
const CHAUFFEURS = [
  { id: 1,  nom: 'Pierre Nzong',    matricule: 'DRV-001', direction_id: 2, role: 'chauffeur',  avatar_color: '#8b5cf6', type_mission: 'mission_brousse' },
  { id: 2,  nom: 'Luc Mba',         matricule: 'DRV-002', direction_id: 2, role: 'chauffeur',  avatar_color: '#06b6d4', type_mission: 'mission_brousse' },
  { id: 3,  nom: 'Marc Essono',     matricule: 'DRV-003', direction_id: 3, role: 'chauffeur',  avatar_color: '#6366f1', type_mission: 'mission_brousse' },
  { id: 4,  nom: 'Alain Nguema',    matricule: 'DRV-004', direction_id: 3, role: 'chauffeur',  avatar_color: '#10b981', type_mission: 'mission_brousse' },
  { id: 5,  nom: 'Claire Bouanga',  matricule: 'TF-001',  direction_id: 4, role: 'chauffeur',  avatar_color: '#f59e0b', type_mission: 'transport_fonds' },
  { id: 6,  nom: 'François Obame',  matricule: 'TF-002',  direction_id: 4, role: 'chauffeur',  avatar_color: '#ef4444', type_mission: 'transport_fonds' },
  { id: 7,  nom: 'Sophie Ondo',     matricule: 'DRV-007', direction_id: 1, role: 'chauffeur',  avatar_color: '#f97316', type_mission: 'mission_brousse' },
  { id: 8,  nom: 'Hulas Djyembi',   matricule: 'ADM-001', direction_id: 1, role: 'chef_tf',    avatar_color: '#ec4899', type_mission: 'transport_fonds' },
  { id: 9,  nom: 'Gilles Moussavou',matricule: 'TF-003',  direction_id: 4, role: 'chauffeur',  avatar_color: '#14b8a6', type_mission: 'transport_fonds' },
  { id: 10, nom: 'Serge Bekale',    matricule: 'DRV-010', direction_id: 2, role: 'chauffeur',  avatar_color: '#a78bfa', type_mission: 'mission_brousse' },
];

const VEHICULES = [
  { immat: 'GA-1234-AB', marque: 'Toyota',      modele: 'Land Cruiser', type: 'SUV',     type_mission: 'mission_brousse' },
  { immat: 'GA-5678-CD', marque: 'Ford',        modele: 'Ranger',       type: 'Pick-up', type_mission: 'mission_brousse' },
  { immat: 'GA-9012-EF', marque: 'Nissan',      modele: 'Patrol',       type: 'SUV',     type_mission: 'mission_brousse' },
  { immat: 'GA-3456-GH', marque: 'Toyota',      modele: 'Hilux',        type: 'Pick-up', type_mission: 'mission_brousse' },
  { immat: 'GA-7890-IJ', marque: 'Mitsubishi',  modele: 'L200',         type: 'Pick-up', type_mission: 'mission_brousse' },
  { immat: 'GA-2345-KL', marque: 'Mercedes',    modele: 'Sprinter',     type: 'Fourgon', type_mission: 'transport_fonds' },
  { immat: 'GA-6789-MN', marque: 'Hyundai',     modele: 'H350',         type: 'Fourgon', type_mission: 'transport_fonds' },
  { immat: 'GA-1122-TF', marque: 'Toyota',      modele: 'HiAce',        type: 'Minibus', type_mission: 'transport_fonds' },
];

const DESTINATIONS_BROUSSE = [
  'Oyem, Woleu-Ntem', 'Franceville, Haut-Ogooué', 'Mouila, Ngounié',
  'Lambaréné, Moyen-Ogooué', 'Port-Gentil, Ogooué-Maritime', 'Makokou, Ogooué-Ivindo',
  'Tchibanga, Nyanga', 'Koulamoutou, Ogooué-Lolo', 'Bitam, Woleu-Ntem',
  'Lastoursville, Ogooué-Lolo', 'Mitzic, Woleu-Ntem', 'Ndendé, Ngounié',
];

const DESTINATIONS_TF = [
  'Agence BGFI – Libreville Centre', 'Agence UBA – Batterie IV',
  'Agence Ecobank – Louis',          'Trésor Public – Libreville',
  'Agence BICI – Owendo',            'Direction Générale SGS',
  'Agence Orabank – PK9',            'Banque Centrale – Libreville',
  'Site minier – Moanda',            'Agence BGFI – Franceville',
];

// ============================================================================
// DONNÉES DE DÉMONSTRATION
// ============================================================================
const genMissions = () => {
  const missions = [];
  let id = 1;
  const now = new Date();

  const genBrousse = () => {
    const nb = Math.floor(Math.random() * 15) + 8;
    for (let i = 0; i < nb; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      const statut = STATUTS_MISSION[Math.floor(Math.random() * STATUTS_MISSION.length)];
      const chauffeurs_brousse = CHAUFFEURS.filter(c => c.type_mission === 'mission_brousse');
      const chauffeur = chauffeurs_brousse[Math.floor(Math.random() * chauffeurs_brousse.length)];
      const vehicules_brousse = VEHICULES.filter(v => v.type_mission === 'mission_brousse');
      const vehicule = vehicules_brousse[Math.floor(Math.random() * vehicules_brousse.length)];
      const dest = DESTINATIONS_BROUSSE[Math.floor(Math.random() * DESTINATIONS_BROUSSE.length)];
      const km_depart = Math.floor(Math.random() * 150000) + 20000;
      const km_retour = statut.code === 'terminee' ? km_depart + Math.floor(Math.random() * 1500) + 100 : null;
      const km_parcourus = km_retour ? km_retour - km_depart : null;
      const dateRetour = statut.code === 'terminee' ? new Date(date.getTime() + (Math.random() * 5 + 1) * 86400000) : null;
      const nb_passagers = Math.floor(Math.random() * 5) + 1;
      const carburant = km_parcourus ? parseFloat((km_parcourus * 0.12).toFixed(2)) : null;
      const cout_carburant = carburant ? parseFloat((carburant * 820).toFixed(2)) : null;
      const incident = Math.random() > 0.85;
      const direction = DIRECTIONS.find(d => d.id === chauffeur.direction_id);

      missions.push({
        id: id,
        reference_mission: `MIS-B-${String(id).padStart(4, '0')}`,
        type_mission: 'mission_brousse',
        vehicule_immatriculation: vehicule.immat,
        vehicule_marque: vehicule.marque,
        vehicule_modele: vehicule.modele,
        chauffeur_user_id: chauffeur.id,
        chauffeur_nom: chauffeur.nom,
        chauffeur_matricule: chauffeur.matricule,
        chauffeur_direction: direction?.nom || '—',
        avatar_color: chauffeur.avatar_color,
        direction_id: chauffeur.direction_id,
        direction_nom: direction?.nom || '—',
        direction_code: direction?.code || '—',
        destination: dest,
        nb_passagers,
        date_depart_prevue: date.toISOString(),
        date_depart_reelle: statut.code !== 'planifiee' && statut.code !== 'annulee'
          ? new Date(date.getTime() + Math.random() * 3600000).toISOString() : null,
        date_retour_reelle: dateRetour?.toISOString() || null,
        km_depart,
        km_retour,
        km_parcourus,
        carburant_consomme: carburant,
        cout_carburant,
        statut: statut.code,
        incident_signale: incident,
        description_incident: incident ? [
          'Panne de pneu sur la route nationale 1.',
          'Problème moteur signalé à mi-chemin.',
          'Accident bénin — rapport joint.',
          'Retard dû aux intempéries.',
        ][Math.floor(Math.random() * 4)] : null,
        observations: Math.random() > 0.7 ? 'Route dégradée au niveau PK45. Nécessite signalement.' : null,
        cree_par_role: 'chef_parc',
        cree_par_nom: 'Chef du Parc',
        photos: [],
        date_creation: date.toISOString(),
        date_modification: date.toISOString(),
        // Brousse specific
        zone_intervention: dest.split(',')[1]?.trim() || 'Province',
        objet_mission: ['Audit de terrain', 'Livraison matériel', 'Inspection site', 'Réunion régionale', 'Support technique'][Math.floor(Math.random() * 5)],
      });
      id++;
    }
  };

  const genTF = () => {
    const nb = Math.floor(Math.random() * 12) + 6;
    for (let i = 0; i < nb; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      const statut = STATUTS_MISSION[Math.floor(Math.random() * STATUTS_MISSION.length)];
      const chauffeurs_tf = CHAUFFEURS.filter(c => c.type_mission === 'transport_fonds');
      const chauffeur = chauffeurs_tf[Math.floor(Math.random() * chauffeurs_tf.length)];
      const vehicules_tf = VEHICULES.filter(v => v.type_mission === 'transport_fonds');
      const vehicule = vehicules_tf[Math.floor(Math.random() * vehicules_tf.length)];
      const dest = DESTINATIONS_TF[Math.floor(Math.random() * DESTINATIONS_TF.length)];
      const km_depart = Math.floor(Math.random() * 80000) + 10000;
      const km_retour = statut.code === 'terminee' ? km_depart + Math.floor(Math.random() * 200) + 10 : null;
      const km_parcourus = km_retour ? km_retour - km_depart : null;
      const dateRetour = statut.code === 'terminee' ? new Date(date.getTime() + Math.random() * 8 * 3600000) : null;
      const montant = Math.floor(Math.random() * 500000000) + 5000000;
      const incident = Math.random() > 0.92;
      const escorte = Math.random() > 0.4;
      const nb_escorteurs = escorte ? Math.floor(Math.random() * 3) + 1 : 0;

      missions.push({
        id: id,
        reference_mission: `MIS-TF-${String(id).padStart(4, '0')}`,
        type_mission: 'transport_fonds',
        vehicule_immatriculation: vehicule.immat,
        vehicule_marque: vehicule.marque,
        vehicule_modele: vehicule.modele,
        chauffeur_user_id: chauffeur.id,
        chauffeur_nom: chauffeur.nom,
        chauffeur_matricule: chauffeur.matricule,
        chauffeur_direction: 'Transport de Fonds',
        avatar_color: chauffeur.avatar_color,
        direction_id: 4,
        direction_nom: 'Transport de Fonds',
        direction_code: 'TF',
        destination: dest,
        nb_passagers: nb_escorteurs + 1,
        date_depart_prevue: date.toISOString(),
        date_depart_reelle: statut.code !== 'planifiee' && statut.code !== 'annulee'
          ? new Date(date.getTime() + Math.random() * 1800000).toISOString() : null,
        date_retour_reelle: dateRetour?.toISOString() || null,
        km_depart,
        km_retour,
        km_parcourus,
        carburant_consomme: km_parcourus ? parseFloat((km_parcourus * 0.14).toFixed(2)) : null,
        cout_carburant: km_parcourus ? parseFloat((km_parcourus * 0.14 * 820).toFixed(2)) : null,
        statut: statut.code,
        incident_signale: incident,
        description_incident: incident ? 'Tentative d\'approche suspecte signalée. Sécurité renforcée.' : null,
        observations: Math.random() > 0.7 ? 'Transfert effectué avec succès. Reçu signé en attente d\'archivage.' : null,
        cree_par_role: 'chef_tf',
        cree_par_nom: 'Chef Transport de Fonds',
        photos: [],
        date_creation: date.toISOString(),
        date_modification: date.toISOString(),
        // TF specific
        montant_transporte: montant,
        devise: 'FCFA',
        client_destinataire: dest,
        escorte_armee: escorte,
        nb_escorteurs,
        numero_bon_transfert: `BON-TF-${String(id).padStart(6, '0')}`,
        banque_destinataire: dest.includes('BGFI') ? 'BGFI Bank' : dest.includes('UBA') ? 'UBA' : dest.includes('Ecobank') ? 'Ecobank' : dest.includes('Orabank') ? 'Orabank' : 'BICI',
        niveau_securite: ['standard', 'renforce', 'maximum'][Math.floor(Math.random() * 3)],
        code_validation: `CV-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`,
      });
      id++;
    }
  };

  genBrousse();
  genTF();

  return missions.sort((a, b) => new Date(b.date_depart_prevue) - new Date(a.date_depart_prevue));
};

const ALL_MISSIONS = genMissions();

// ============================================================================
// UTILITAIRES
// ============================================================================
const getTypeMissionInfo = (code) => TYPES_MISSION.find(t => t.code === code) || { libelle: code, color: '#94a3b8', bg: 'bg-gray-100 text-gray-600', icon: 'bi-circle' };
const getStatutInfo = (code) => STATUTS_MISSION.find(s => s.code === code) || { libelle: code, color: '#94a3b8', bg: 'bg-gray-100 text-gray-600', icon: 'bi-circle' };

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

const formatDuree = (depart, retour) => {
  if (!depart || !retour) return '—';
  const diff = (new Date(retour) - new Date(depart)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h${String(Math.floor((diff % 3600) / 60)).padStart(2, '0')}`;
  return `${Math.floor(diff / 86400)} j ${Math.floor((diff % 86400) / 3600)}h`;
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
  tr:nth-child(odd) td{background:#f0f4ff}tr:nth-child(even) td{background:#f8fafc}
  .footer{margin-top:20px;text-align:center;color:#94a3b8;font-size:10px;border-top:1px solid #e2e8f0;padding-top:8px}
  </style></head><body>
  <h1>🚀 ${title}</h1><div class="meta">Export le ${new Date().toLocaleDateString('fr-FR')} — ${rows.length} mission(s)</div>
  <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="footer">SGS Fleetify — Registre des Missions — ${new Date().getFullYear()}</div>
  <script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
};

// ============================================================================
// TOAST
// ============================================================================
const Toast = ({ message, type, onClose, theme }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const icon = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }[type];
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
// MINI DONUT CHART
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={darkMode ? '#1f2937' : '#f1f5f9'} strokeWidth={strokeWidth} />
        {segments.map((seg) => (
          <circle key={seg.i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={seg.color}
            strokeWidth={tooltip?.label === seg.label ? strokeWidth + 3 : strokeWidth}
            strokeDasharray={`${seg.len} ${circ - seg.len}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-width 0.15s ease', cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ label: seg.label, value: seg.value, pct: (seg.pct * 100).toFixed(1), color: seg.color })}
            onMouseLeave={() => setTooltip(null)} />
        ))}
      </svg>
      {tooltip && (
        <div className={`pointer-events-none absolute z-50 px-2.5 py-2 rounded-lg text-xs font-semibold shadow-xl whitespace-nowrap
          ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-900 text-white'}`}
          style={{ left: '110%', top: '30%' }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tooltip.color }}></span>
            <span>{tooltip.label}</span>
          </div>
          <div className="mt-0.5 text-[11px] opacity-80">{tooltip.value} mission{tooltip.value > 1 ? 's' : ''} · {tooltip.pct}%</div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MENU 3 POINTS
// ============================================================================
const ActionMenu = ({ mission, darkMode, theme, onView, onEdit, onDelete, onChangeStatut }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 200 });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const t = setTimeout(() => { document.addEventListener('click', close, { once: true }); }, 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [open]);

  return (
    <>
      <button ref={btnRef} onClick={toggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
          ${open ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
        style={open ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` } : {}}>
        <i className="bi bi-three-dots-vertical text-sm"></i>
      </button>

      {open && ReactDOM.createPortal(
        <div onClick={e => e.stopPropagation()}
          className={`fixed z-[9999] rounded-xl shadow-2xl border py-1.5 w-52
            ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{ top: menuPos.top, left: menuPos.left, animation: 'fadeInDown .15s ease-out' }}>
          <button onClick={(e) => { e.stopPropagation(); onView(mission); setOpen(false); }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <i className="bi bi-eye text-base" style={{ color: theme.primary }}></i> Voir les détails
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(mission); setOpen(false); }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <i className="bi bi-pencil-fill text-base" style={{ color: theme.primary }}></i> Modifier
          </button>
          <div className={`my-1 mx-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
          {STATUTS_MISSION.map(s => (
            <button key={s.code} onClick={(e) => { e.stopPropagation(); onChangeStatut(mission.id, s.code); setOpen(false); }}
              className={`w-full text-left px-4 py-1.5 text-xs flex items-center gap-2 transition-colors
                ${mission.statut === s.code ? 'font-bold' : ''} ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-50'}`}>
              <i className={`bi ${s.icon}`} style={{ color: s.color }}></i> {s.libelle}
              {mission.statut === s.code && <i className="bi bi-check2 ml-auto" style={{ color: theme.primary }}></i>}
            </button>
          ))}
          <div className={`my-1 mx-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
          <button onClick={(e) => { e.stopPropagation(); onDelete(mission.id); setOpen(false); }}
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
// KPI CARD
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
// BADGE SECURITE TF
// ============================================================================
const SecurityBadge = ({ niveau, darkMode, theme }) => {
  const map = {
    standard:  { label: 'Standard',  icon: 'bi-shield-check' },
    renforce:  { label: 'Renforcé',  icon: 'bi-shield-fill-exclamation' },
    maximum:   { label: 'Maximum',   icon: 'bi-shield-fill-x' },
  };
  const info = map[niveau] || map.standard;
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
      style={{ background: theme?.primary || '#6366f1' }}>
      <i className={`bi ${info.icon} mr-1`}></i>{info.label}
    </span>
  );
};

// ============================================================================
// MODAL DÉTAIL MISSION
// ============================================================================
const MissionModal = ({ mission: m, darkMode, theme, onClose, onEdit, onDelete, onChangeStatut }) => {
  const typInfo = getTypeMissionInfo(m.type_mission);
  const statut = getStatutInfo(m.statut);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isTF = m.type_mission === 'transport_fonds';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-[96vw] h-[96vh] overflow-hidden flex flex-col shadow-2xl`}>

        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}
          style={{ background: `linear-gradient(135deg, ${theme.primary}18, transparent)` }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className={`bi ${typInfo.icon} text-white text-xl`}></i>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{m.reference_mission}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typInfo.bg}`}>
                  <i className={`bi ${typInfo.icon} mr-1`}></i>{typInfo.libelle}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statut.bg}`}>
                  <i className={`${statut.icon} mr-1`}></i>{statut.libelle}
                </span>
                {isTF && m.niveau_securite && <SecurityBadge niveau={m.niveau_securite} darkMode={darkMode} theme={theme} />}
              </div>
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Créée par <strong>{m.cree_par_nom}</strong> · {new Date(m.date_creation).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* Alerte incident */}
          {m.incident_signale && (
            <div className={`rounded-xl p-4 border border-orange-300 mb-5 ${darkMode ? 'bg-orange-900/20' : 'bg-orange-50'} flex items-center gap-3`}>
              <i className="bi bi-exclamation-triangle-fill text-orange-500 text-2xl"></i>
              <div>
                <p className={`text-sm font-bold ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>Incident signalé durant cette mission</p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-orange-500' : 'text-orange-500'}`}>{m.description_incident}</p>
              </div>
            </div>
          )}

          {/* TF — Alerte bon de transfert */}
          {isTF && m.numero_bon_transfert && (
            <div className={`rounded-xl p-4 mb-5 flex items-center gap-3`}
              style={{ border: `1px solid ${theme.primary}55`, background: `${theme.primary}12` }}>
              <i className="bi bi-shield-lock-fill text-2xl" style={{ color: theme.primary }}></i>
              <div>
                <p className={`text-sm font-bold`} style={{ color: theme.primary }}>
                  Mission Transport de Fonds sécurisée
                </p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Bon n° {m.numero_bon_transfert} · Code validation : {m.code_validation}
                  {m.escorte_armee && ` · Escorte armée (${m.nb_escorteurs} agent${m.nb_escorteurs > 1 ? 's' : ''})`}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-5">

            {/* COLONNE 1 — Chauffeur & Véhicule */}
            <div className="space-y-4">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-blue-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-person-fill mr-1.5"></i>Chauffeur & Véhicule
                </p>
                <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: `1px solid ${darkMode ? '#374151' : '#dbeafe'}` }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ background: m.avatar_color }}>{m.chauffeur_nom.charAt(0)}</div>
                  <div>
                    <p className={`font-bold text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{m.chauffeur_nom}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{m.chauffeur_matricule}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{m.direction_nom}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ['Véhicule',        `${m.vehicule_marque} ${m.vehicule_modele}`, 'bi-car-front-fill'],
                    ['Immatriculation', m.vehicule_immatriculation,                  'bi-card-text'],
                    ['Passagers',       `${m.nb_passagers} personne${m.nb_passagers > 1 ? 's' : ''}`, 'bi-people-fill'],
                    ['Créé par',        `${m.cree_par_nom} (${m.cree_par_role})`,    'bi-person-badge-fill'],
                  ].map(([l, v, ic], i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <i className={`bi ${ic} text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{l}</span>
                      </div>
                      <span className={`text-xs font-semibold text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates & Kilométrage */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-orange-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-calendar-event-fill mr-1.5"></i>Dates & Kilométrage
                </p>
                <div className="space-y-3">
                  {[
                    ['Départ prévu',  m.date_depart_prevue  ? new Date(m.date_depart_prevue).toLocaleString('fr-FR', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—', 'bi-calendar2-check'],
                    ['Départ réel',   m.date_depart_reelle  ? new Date(m.date_depart_reelle).toLocaleString('fr-FR', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—', 'bi-play-circle-fill'],
                    ['Retour réel',   m.date_retour_reelle  ? new Date(m.date_retour_reelle).toLocaleString('fr-FR', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—', 'bi-stop-circle-fill'],
                    ['Durée',         formatDuree(m.date_depart_reelle, m.date_retour_reelle), 'bi-clock-fill'],
                    ['Km départ',     m.km_depart ? `${m.km_depart.toLocaleString('fr-FR')} km` : '—', 'bi-speedometer'],
                    ['Km retour',     m.km_retour ? `${m.km_retour.toLocaleString('fr-FR')} km` : '—', 'bi-speedometer2'],
                    ['Km parcourus',  m.km_parcourus ? `${m.km_parcourus.toLocaleString('fr-FR')} km` : '—', 'bi-arrows-expand'],
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
            </div>

            {/* COLONNE 2 — Destination & Spécificités */}
            <div className="space-y-4">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-green-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-geo-alt-fill mr-1.5"></i>Destination & Détails
                </p>
                <div className="space-y-3">
                  {[
                    ['Destination',     m.destination || '—',    'bi-pin-map-fill'],
                    ...(isTF ? [
                      ['Banque destinataire', m.banque_destinataire || '—', 'bi-bank'],
                      ['Bon de transfert',    m.numero_bon_transfert || '—', 'bi-file-earmark-check-fill'],
                      ['Code validation',     m.code_validation || '—',     'bi-key-fill'],
                    ] : [
                      ['Objet mission',   m.objet_mission || '—',   'bi-clipboard-fill'],
                      ['Zone',            m.zone_intervention || '—', 'bi-map-fill'],
                    ]),
                  ].map(([l, v, ic], i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <i className={`bi ${ic} text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{l}</span>
                      </div>
                      <span className={`text-xs font-semibold text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carburant */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-yellow-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-fuel-pump-fill mr-1.5"></i>Carburant & Coûts
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Carburant consommé', val: m.carburant_consomme ? `${m.carburant_consomme} L` : '—', icon: 'bi-droplet-fill',   color: '#f59e0b' },
                    { label: 'Coût carburant',     val: formatCFA(m.cout_carburant),                               icon: 'bi-cash-stack',     color: '#06b6d4' },
                    ...(isTF ? [
                      { label: 'Escorte armée',      val: m.escorte_armee ? `Oui (${m.nb_escorteurs})` : 'Non',   icon: 'bi-shield-shaded', color: theme.primary },
                    ] : []),
                  ].map((k, i) => (
                    <div key={i} className={`${darkMode ? 'bg-gray-700/60' : 'bg-white'} rounded-xl p-4 shadow-sm`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${k.color}22` }}>
                          <i className={`bi ${k.icon} text-sm`} style={{ color: k.color }}></i>
                        </div>
                        <span className={`text-[10px] font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{k.label}</span>
                      </div>
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} break-words`}>{k.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLONNE 3 — Statut & Actions */}
            <div className="space-y-4">

              {/* Changer le statut */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-indigo-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-arrow-repeat mr-1.5"></i>Changer le statut
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUTS_MISSION.map(s => (
                    <button key={s.code} onClick={() => onChangeStatut(m.id, s.code)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        m.statut === s.code
                          ? `${s.bg} border-transparent shadow-sm`
                          : darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}>
                      <i className={`bi ${s.icon}`}></i>{s.libelle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observations */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-chat-left-text-fill mr-1.5"></i>Observations
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>{m.observations || 'Aucune observation.'}</p>
              </div>

              {/* Traçabilité */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-clock-history mr-1.5"></i>Traçabilité
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Créée le',    val: new Date(m.date_creation).toLocaleString('fr-FR'), icon: 'bi-plus-circle-fill',  color: '#10b981' },
                    { label: 'Modifiée le', val: new Date(m.date_modification).toLocaleString('fr-FR'), icon: 'bi-pencil-fill',  color: '#f59e0b' },
                    { label: 'Rôle créateur', val: m.cree_par_role,                                   icon: 'bi-person-badge-fill', color: '#6366f1' },
                    { label: 'Créateur',    val: m.cree_par_nom,                                       icon: 'bi-person-fill',     color: theme.primary },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <i className={`bi ${t.icon} text-xs`} style={{ color: t.color }}></i>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t.label}</span>
                      </div>
                      <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(m)}
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
                <button onClick={() => { onDelete(m.id); onClose(); }}
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
    </div>
  );
};

// ============================================================================
// MODAL FORMULAIRE MISSION
// ============================================================================
const MissionFormModal = ({ mission, darkMode, theme, onClose, onSave, defaultType }) => {
  const isEdit = !!mission;
  const [form, setForm] = useState({
    type_mission: mission?.type_mission || defaultType || 'mission_brousse',
    vehicule_immatriculation: mission?.vehicule_immatriculation || '',
    chauffeur_user_id: mission?.chauffeur_user_id || '',
    destination: mission?.destination || '',
    nb_passagers: mission?.nb_passagers || 1,
    date_depart_prevue: mission ? new Date(mission.date_depart_prevue).toISOString().slice(0, 16) : '',
    date_depart_reelle: mission?.date_depart_reelle ? new Date(mission.date_depart_reelle).toISOString().slice(0, 16) : '',
    date_retour_reelle: mission?.date_retour_reelle ? new Date(mission.date_retour_reelle).toISOString().slice(0, 16) : '',
    km_depart: mission?.km_depart || '',
    km_retour: mission?.km_retour || '',
    carburant_consomme: mission?.carburant_consomme || '',
    cout_carburant: mission?.cout_carburant || '',
    statut: mission?.statut || 'planifiee',
    observations: mission?.observations || '',
    incident_signale: mission?.incident_signale || false,
    description_incident: mission?.description_incident || '',
    objet_mission: mission?.objet_mission || '',
    zone_intervention: mission?.zone_intervention || '',
    montant_transporte: mission?.montant_transporte || '',
    devise: mission?.devise || 'FCFA',
    escorte_armee: mission?.escorte_armee || false,
    nb_escorteurs: mission?.nb_escorteurs || 0,
    numero_bon_transfert: mission?.numero_bon_transfert || '',
    banque_destinataire: mission?.banque_destinataire || '',
    niveau_securite: mission?.niveau_securite || 'standard',
    code_validation: mission?.code_validation || '',
    direction_id: mission?.direction_id || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: typeof v === 'function' ? v(f[k]) : v }));
  const isTF = form.type_mission === 'transport_fonds';

  const chauffeursFiltres = CHAUFFEURS.filter(c => c.type_mission === form.type_mission);
  const vehiculesFiltres = VEHICULES.filter(v => v.type_mission === form.type_mission);

  const handleSubmit = () => {
    if (!form.vehicule_immatriculation || !form.chauffeur_user_id || !form.date_depart_prevue) return;
    onSave({ ...form, id: mission?.id });
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
                {isEdit ? 'Modifier la mission' : 'Créer une mission'}
              </h2>
              {isEdit && <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{mission.reference_mission}</p>}
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-2 gap-8">

            {/* COLONNE GAUCHE */}
            <div className="space-y-5">

              {/* Type de mission */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-tags-fill mr-1.5"></i>Type de mission
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {TYPES_MISSION.map(t => (
                    <button key={t.code} type="button" onClick={() => set('type_mission', t.code)}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        form.type_mission === t.code
                          ? 'border-transparent text-white shadow-lg'
                          : darkMode ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                      style={form.type_mission === t.code ? { background: `linear-gradient(135deg, ${t.color}, ${t.color}bb)` } : {}}>
                      <i className={`bi ${t.icon} text-2xl`}></i>
                      <span className="text-xs font-bold">{t.libelle}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Acteurs */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-people-fill mr-1.5"></i>Acteurs
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Chauffeur *</label>
                    <select value={form.chauffeur_user_id} onChange={e => set('chauffeur_user_id', e.target.value)} className={inputCls}>
                      <option value="">Sélectionner un chauffeur</option>
                      {chauffeursFiltres.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.matricule})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Véhicule *</label>
                    <select value={form.vehicule_immatriculation} onChange={e => set('vehicule_immatriculation', e.target.value)} className={inputCls}>
                      <option value="">Sélectionner un véhicule</option>
                      {vehiculesFiltres.map(v => <option key={v.immat} value={v.immat}>{v.immat} — {v.marque} {v.modele}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nombre de passagers</label>
                      <input type="number" min="1" value={form.nb_passagers} onChange={e => set('nb_passagers', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Direction</label>
                      <select value={form.direction_id} onChange={e => set('direction_id', e.target.value)} className={inputCls}>
                        <option value="">Toutes directions</option>
                        {DIRECTIONS.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates & Kilométrage */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-calendar-event-fill mr-1.5"></i>Dates & Kilométrage
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Date de départ prévue *</label>
                    <input type="datetime-local" value={form.date_depart_prevue} onChange={e => set('date_depart_prevue', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Départ réel</label>
                    <input type="datetime-local" value={form.date_depart_reelle} onChange={e => set('date_depart_reelle', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Retour réel</label>
                    <input type="datetime-local" value={form.date_retour_reelle} onChange={e => set('date_retour_reelle', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Km départ</label>
                    <input type="number" value={form.km_depart} onChange={e => set('km_depart', e.target.value)} placeholder="Ex: 45000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Km retour</label>
                    <input type="number" value={form.km_retour} onChange={e => set('km_retour', e.target.value)} placeholder="Ex: 46200" className={inputCls} />
                  </div>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE */}
            <div className="space-y-5">

              {/* Destination */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-geo-alt-fill mr-1.5"></i>Destination & Objet
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Destination *</label>
                    <input type="text" value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Lieu de destination" className={inputCls} />
                  </div>
                  {!isTF && (
                    <>
                      <div>
                        <label className={labelCls}>Objet de la mission</label>
                        <input type="text" value={form.objet_mission} onChange={e => set('objet_mission', e.target.value)} placeholder="Ex: Audit de terrain, Livraison..." className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Zone d'intervention</label>
                        <input type="text" value={form.zone_intervention} onChange={e => set('zone_intervention', e.target.value)} placeholder="Ex: Province du Woleu-Ntem" className={inputCls} />
                      </div>
                    </>
                  )}
                  {isTF && (
                    <>
                      <div>
                        <label className={labelCls}>Banque destinataire</label>
                        <input type="text" value={form.banque_destinataire} onChange={e => set('banque_destinataire', e.target.value)} placeholder="Nom de la banque" className={inputCls} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>N° Bon de transfert</label>
                          <input type="text" value={form.numero_bon_transfert} onChange={e => set('numero_bon_transfert', e.target.value)} placeholder="BON-TF-000001" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Code de validation</label>
                          <input type="text" value={form.code_validation} onChange={e => set('code_validation', e.target.value)} placeholder="CV-00000" className={inputCls} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Carburant + TF Spécifique */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-fuel-pump-fill mr-1.5"></i>{isTF ? 'Carburant & Sécurité' : 'Carburant & Coûts'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Carburant consommé (L)</label>
                    <input type="number" step="0.01" value={form.carburant_consomme} onChange={e => set('carburant_consomme', e.target.value)} placeholder="0.00" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Coût carburant (FCFA)</label>
                    <input type="number" value={form.cout_carburant} onChange={e => set('cout_carburant', e.target.value)} placeholder="0" className={inputCls} />
                  </div>
                  {isTF && (
                    <>
                      <div className="col-span-2">
                        <label className={labelCls}>Montant transporté (FCFA)</label>
                        <input type="number" value={form.montant_transporte} onChange={e => set('montant_transporte', e.target.value)} placeholder="0" className={inputCls} />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Niveau de sécurité</label>
                        <select value={form.niveau_securite} onChange={e => set('niveau_securite', e.target.value)} className={inputCls}>
                          <option value="standard">Standard</option>
                          <option value="renforce">Renforcé</option>
                          <option value="maximum">Maximum</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Escorte armée</label>
                        <button type="button" onClick={() => set('escorte_armee', !form.escorte_armee)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                            form.escorte_armee
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : darkMode ? 'border-gray-700 text-gray-500 hover:bg-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-100'
                          }`}>
                          <i className="bi bi-shield-shaded"></i>
                          {form.escorte_armee ? 'Oui — Escorte active' : 'Non — Sans escorte'}
                        </button>
                      </div>
                      {form.escorte_armee && (
                        <div>
                          <label className={labelCls}>Nombre d'escorteurs</label>
                          <input type="number" min="1" value={form.nb_escorteurs} onChange={e => set('nb_escorteurs', e.target.value)} className={inputCls} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Statut + Toggles */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-5`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <i className="bi bi-flag-fill mr-1.5"></i>Statut & Incident
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Statut de la mission</label>
                    <select value={form.statut} onChange={e => set('statut', e.target.value)} className={inputCls}>
                      {STATUTS_MISSION.map(s => <option key={s.code} value={s.code}>{s.libelle}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => set('incident_signale', !form.incident_signale)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      form.incident_signale
                        ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : darkMode ? 'border-gray-700 text-gray-500 hover:bg-gray-700' : 'border-gray-200 text-gray-400 hover:bg-gray-100'
                    }`}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    {form.incident_signale ? 'Incident signalé' : 'Aucun incident'}
                  </button>
                  {form.incident_signale && (
                    <textarea rows={3} value={form.description_incident} onChange={e => set('description_incident', e.target.value)}
                      placeholder="Décrire l'incident..." className={inputCls + ' resize-none'} />
                  )}
                  <div>
                    <label className={labelCls}>Observations</label>
                    <textarea rows={3} value={form.observations} onChange={e => set('observations', e.target.value)}
                      placeholder="Observations supplémentaires..." className={inputCls + ' resize-none'} />
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
            {isEdit ? 'Enregistrer les modifications' : 'Créer la mission'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// KPI CARDS ROW
// ============================================================================
const KpiCards = ({ total, nbEnCours, nbTerminees, kmTotal, periodeInfo, darkMode, animateCards, isTF, montantTotal, theme }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <KpiCard label="Total missions"     target={total}            icon="bi-send-fill"         color={theme.primary}  sub={periodeInfo.libelle}   delay={0}    darkMode={darkMode} animateCards={animateCards} />
    <KpiCard label="En cours"           target={nbEnCours}        icon="bi-play-circle-fill"  color="#f59e0b" sub="missions actives"      delay={0.07} darkMode={darkMode} animateCards={animateCards} />
    <KpiCard label="Terminées"          target={nbTerminees}      icon="bi-check-circle-fill" color="#10b981" sub="sur la période"        delay={0.14} darkMode={darkMode} animateCards={animateCards} />
   
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Missions = () => {
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

  // ── Onglets ──
  const [activeTab, setActiveTab] = useState('brousse'); // 'brousse' | 'tf'

  // ── États ──
  const [missions, setMissions]               = useState(ALL_MISSIONS);
  const [searchTerm, setSearchTerm]           = useState('');
  const [filterStatut, setFilterStatut]       = useState('');
  const [filterChauffeur, setFilterChauffeur] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterIncident, setFilterIncident]   = useState('');
  const [filterPeriode, setFilterPeriode]     = useState('365j');
  const [sortBy, setSortBy]                   = useState('date_depart_prevue');
  const [sortDir, setSortDir]                 = useState('desc');
  const [currentPage, setCurrentPage]         = useState(1);
  const [view, setView]                       = useState('table');
  const [selectedMission, setSelectedMission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal]     = useState(false);
  const [editMission, setEditMission]         = useState(null);
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
  const currentType = activeTab === 'brousse' ? 'mission_brousse' : 'transport_fonds';

  // ── Filtrage ──
  const periodeInfo = PERIODES.find(p => p.code === filterPeriode) || PERIODES[4];
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - periodeInfo.jours);

  const filtered = missions.filter(a => {
    if (a.type_mission !== currentType)                         return false;
    if (new Date(a.date_depart_prevue) < cutoff)               return false;
    if (filterStatut    && a.statut !== filterStatut)          return false;
    if (filterChauffeur && String(a.chauffeur_user_id) !== filterChauffeur) return false;
    if (filterDirection && String(a.direction_id) !== filterDirection) return false;
    if (filterIncident === 'oui' && !a.incident_signale)       return false;
    if (filterIncident === 'non' && a.incident_signale)        return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return a.chauffeur_nom.toLowerCase().includes(q) ||
             a.vehicule_immatriculation.toLowerCase().includes(q) ||
             a.reference_mission.toLowerCase().includes(q) ||
             (a.destination || '').toLowerCase().includes(q);
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortBy], vb = b[sortBy];
    if (['date_depart_prevue','date_depart_reelle','date_retour_reelle','date_creation'].includes(sortBy)) { va = new Date(va || 0); vb = new Date(vb || 0); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated  = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => setCurrentPage(1), [activeTab, filterStatut, filterChauffeur, filterDirection, filterIncident, filterPeriode, searchTerm, sortBy, sortDir]);

  const resetFilters = () => { setFilterStatut(''); setFilterChauffeur(''); setFilterDirection(''); setFilterIncident(''); setSearchTerm(''); };
  const hasFilters = filterStatut || filterChauffeur || filterDirection || filterIncident || searchTerm;

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  // ── CRUD ──
  const handleSave = (data) => {
    if (data.id) {
      setMissions(prev => prev.map(m => m.id === data.id ? {
        ...m, ...data,
        chauffeur_nom: CHAUFFEURS.find(c => String(c.id) === String(data.chauffeur_user_id))?.nom || m.chauffeur_nom,
        avatar_color: CHAUFFEURS.find(c => String(c.id) === String(data.chauffeur_user_id))?.avatar_color || m.avatar_color,
        vehicule_marque: VEHICULES.find(v => v.immat === data.vehicule_immatriculation)?.marque || m.vehicule_marque,
        vehicule_modele: VEHICULES.find(v => v.immat === data.vehicule_immatriculation)?.modele || m.vehicule_modele,
        km_parcourus: (data.km_retour && data.km_depart) ? data.km_retour - data.km_depart : m.km_parcourus,
        date_modification: new Date().toISOString(),
      } : m));
      showToast('Mission mise à jour avec succès', 'success');
    } else {
      const ch = CHAUFFEURS.find(c => String(c.id) === String(data.chauffeur_user_id));
      const veh = VEHICULES.find(v => v.immat === data.vehicule_immatriculation);
      const dir = DIRECTIONS.find(d => String(d.id) === String(data.direction_id || ch?.direction_id));
      const prefix = data.type_mission === 'transport_fonds' ? 'MIS-TF' : 'MIS-B';
      const newM = {
        ...data,
        id: Date.now(),
        reference_mission: `${prefix}-${String(missions.length + 2).padStart(4, '0')}`,
        chauffeur_nom: ch?.nom || '',
        chauffeur_matricule: ch?.matricule || '',
        chauffeur_direction: dir?.nom || '',
        avatar_color: ch?.avatar_color || '#94a3b8',
        vehicule_marque: veh?.marque || '',
        vehicule_modele: veh?.modele || '',
        direction_id: data.direction_id || ch?.direction_id,
        direction_nom: dir?.nom || '—',
        direction_code: dir?.code || '—',
        km_parcourus: (data.km_retour && data.km_depart) ? data.km_retour - data.km_depart : null,
        cree_par_role: 'admin',
        cree_par_nom: 'Administrateur',
        photos: [],
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
      };
      setMissions(prev => [newM, ...prev]);
      showToast('Mission créée avec succès', 'success');
    }
    setShowFormModal(false);
    setEditMission(null);
  };

  const handleDelete = (id) => {
    setMissions(prev => prev.filter(m => m.id !== id));
    showToast('Mission supprimée', 'warning');
  };

  const handleChangeStatut = (id, newStatut) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, statut: newStatut, date_modification: new Date().toISOString() } : m));
    if (selectedMission?.id === id) setSelectedMission(prev => ({ ...prev, statut: newStatut }));
    showToast(`Statut mis à jour : ${getStatutInfo(newStatut).libelle}`, 'info');
  };

  const handleEdit = (m) => {
    setShowDetailModal(false);
    setEditMission(m);
    setShowFormModal(true);
  };

  // ── Statistiques ──
  const isTFTab = activeTab === 'tf';
  const total           = filtered.length;
  const nbEnCours       = filtered.filter(m => m.statut === 'en_cours').length;
  const nbTerminees     = filtered.filter(m => m.statut === 'terminee').length;
  const kmTotal         = filtered.reduce((s, m) => s + (Number(m.km_parcourus) || 0), 0);
  const montantTotal    = filtered.reduce((s, m) => s + (Number(m.montant_transporte) || 0), 0);
  const nbIncidents     = filtered.filter(m => m.incident_signale).length;

  const statutDistrib = STATUTS_MISSION.map(s => ({
    ...s, value: filtered.filter(m => m.statut === s.code).length,
  }));

  const chauffeursFiltresOnglet = CHAUFFEURS.filter(c => c.type_mission === currentType);
  const topChauffeurs = chauffeursFiltresOnglet
    .map(c => ({ ...c, count: filtered.filter(m => m.chauffeur_user_id === c.id).length }))
    .sort((a, b) => b.count - a.count)
    .filter(c => c.count > 0);
  const maxCountCh = Math.max(...topChauffeurs.map(c => c.count), 1);

  // Destinations top 5
  const destMap = {};
  filtered.forEach(m => { if (m.destination) destMap[m.destination] = (destMap[m.destination] || 0) + 1; });
  const topDests = Object.entries(destMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxDest = topDests[0]?.[1] || 1;

  // ── Export ──
  const expHeadersBrousse = ['Référence','Date départ prévu','Chauffeur','Matricule','Véhicule','Destination','Zone','Objet','Statut','Km parcourus','Carburant (L)','Coût carburant','Passagers','Incident','Observations'];
  const expHeadersTF = ['Référence','Date départ prévu','Chauffeur','Matricule','Véhicule','Destination','Banque','Montant transporté','N° Bon','Code validation','Niveau sécurité','Escorte','Statut','Km parcourus','Incident'];

  const toRowBrousse = (m) => [
    m.reference_mission,
    new Date(m.date_depart_prevue).toLocaleString('fr-FR'),
    m.chauffeur_nom,
    m.chauffeur_matricule,
    `${m.vehicule_immatriculation} (${m.vehicule_marque} ${m.vehicule_modele})`,
    m.destination || '—',
    m.zone_intervention || '—',
    m.objet_mission || '—',
    getStatutInfo(m.statut).libelle,
    m.km_parcourus || '—',
    m.carburant_consomme || '—',
    m.cout_carburant || '—',
    m.nb_passagers,
    m.incident_signale ? 'Oui' : 'Non',
    m.observations || '—',
  ];

  const toRowTF = (m) => [
    m.reference_mission,
    new Date(m.date_depart_prevue).toLocaleString('fr-FR'),
    m.chauffeur_nom,
    m.chauffeur_matricule,
    `${m.vehicule_immatriculation} (${m.vehicule_marque} ${m.vehicule_modele})`,
    m.destination || '—',
    m.banque_destinataire || '—',
    m.montant_transporte ? `${m.montant_transporte} FCFA` : '—',
    m.numero_bon_transfert || '—',
    m.code_validation || '—',
    m.niveau_securite || '—',
    m.escorte_armee ? `Oui (${m.nb_escorteurs})` : 'Non',
    getStatutInfo(m.statut).libelle,
    m.km_parcourus || '—',
    m.incident_signale ? 'Oui' : 'Non',
  ];

  const SortIcon = ({ col }) => (
    <i className={`bi bi-arrow-${sortBy === col ? (sortDir === 'asc' ? 'up' : 'down') : 'down-up'} text-[10px] ml-1 opacity-60`}></i>
  );

  // ── Tab colors — toujours le thème actif ──
  const tabColor = theme.primary;
  const tabColorDark = theme.primaryDark;

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


        {/* ════ KPI CARDS ════ */}
        <KpiCards total={total} nbEnCours={nbEnCours} nbTerminees={nbTerminees}
          kmTotal={kmTotal} montantTotal={montantTotal} periodeInfo={periodeInfo}
          darkMode={darkMode} animateCards={animateCards} isTF={isTFTab} theme={theme} />

        {/* ════ GRAPHIQUES LIGNE 1 ════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Donut — Statuts */}
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .28s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: tabColor }}></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Statuts des missions</h3>
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="relative">
                <DonutChart data={statutDistrib.map(s => ({ value: s.value, color: s.color, label: s.libelle }))} darkMode={darkMode} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{total}</span>
                  <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>total</span>
                </div>
              </div>
              <div className="space-y-2">
                {statutDistrib.filter(s => s.value > 0).map(s => (
                  <Tooltip key={s.code} darkMode={darkMode}
                    label={`${s.libelle} : ${s.value} mission${s.value > 1 ? 's' : ''} (${total > 0 ? ((s.value / total) * 100).toFixed(1) : 0}%)`}>
                    <div className="flex items-center gap-2 cursor-default rounded px-1 py-0.5 hover:bg-black/5 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }}></div>
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.libelle}</span>
                      <span className={`text-xs font-bold ml-auto pl-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{s.value}</span>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          {/* Top Destinations */}
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .35s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: tabColor }}></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top destinations</h3>
            </div>
            {topDests.length === 0 ? (
              <div className={`text-center py-6 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                <i className="bi bi-geo text-3xl block mb-2"></i><p className="text-xs">Aucune donnée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topDests.map(([dest, count], i) => (
                  <div key={dest} className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      style={i === 0 ? { color: tabColor } : {}}>{i + 1}</span>
                    <span className={`text-xs font-medium flex-1 truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{dest}</span>
                    <Tooltip darkMode={darkMode} label={`${dest} — ${count} mission${count > 1 ? 's' : ''}`}>
                      <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ width: '60px' }}>
                        <div className="h-full rounded-full" style={{ width: `${(count / maxDest) * 100}%`, background: tabColor, opacity: i === 0 ? 1 : Math.max(0.3, 1 - i * 0.18) }} />
                      </div>
                    </Tooltip>
                    <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alertes / Incidents */}
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .42s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-red-500"></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Alertes & Incidents</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Incidents signalés',    val: nbIncidents,                                 icon: 'bi-exclamation-triangle-fill', color: '#f97316' },
                
           
                ...(isTFTab ? [
                  { label: 'Escortes armées',     val: filtered.filter(m => m.escorte_armee).length,        icon: 'bi-shield-shaded',       color: theme.primary },
                  { label: 'Sécurité max/renforcée', val: filtered.filter(m => m.niveau_securite === 'maximum' || m.niveau_securite === 'renforce').length, icon: 'bi-shield-fill-x', color: '#ef4444' },
                ] : [
                  { label: 'Km totaux parcourus', val: `${Math.round(kmTotal).toLocaleString('fr-FR')} km`,  icon: 'bi-speedometer2',        color: '#06b6d4', isStr: true },
                  { label: 'Carburant total (L)', val: `${filtered.reduce((s,m) => s + (Number(m.carburant_consomme)||0), 0).toFixed(0)} L`, icon: 'bi-fuel-pump-fill', color: '#10b981', isStr: true },
                ]),
              ].map((k, i) => (
                <div key={i} className={`flex items-center justify-between gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${k.color}22` }}>
                      <i className={`bi ${k.icon} text-sm`} style={{ color: k.color }}></i>
                    </div>
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{k.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{k.isStr ? k.val : k.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ TOP CHAUFFEURS ════ */}
        <div className="mb-6">
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .49s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: tabColor }}></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isTFTab ? 'Agents TF les plus actifs' : 'Chauffeurs les plus actifs'}
              </h3>
              <span className={`ml-auto text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{periodeInfo.libelle}</span>
            </div>
            {topChauffeurs.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                <i className="bi bi-emoji-smile text-3xl block mb-2"></i>
                <p className="text-sm">Aucune mission sur la période</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                {topChauffeurs.slice(0, 6).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      style={i === 0 ? { color: tabColor } : {}}># {i + 1}</span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: c.avatar_color }}>{c.nom.charAt(0)}</div>
                    <span className={`text-sm font-medium w-36 truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{c.nom}</span>
                    <Tooltip darkMode={darkMode} label={`${c.nom} — ${c.count} mission${c.count > 1 ? 's' : ''} · ${c.matricule}`}>
                      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} cursor-pointer`} style={{ minWidth: '80px' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(c.count / maxCountCh) * 100}%`, background: tabColor, opacity: i === 0 ? 1 : Math.max(0.4, 1 - i * 0.15) }} />
                      </div>
                    </Tooltip>
                    <span className={`text-sm font-bold w-5 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      style={i === 0 ? { color: tabColor } : {}}>{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════ EN-TÊTE ════ */}
        <div className="flex items-center justify-between mb-6"
          style={{ animation: animateCards ? 'fadeInUp .4s ease-out both' : 'none' }}>
          <div className="flex items-center gap-3">
       
          </div>
          <button onClick={() => { setEditMission(null); setShowFormModal(true); }}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-lg hover:opacity-90 transition-all"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
            <i className="bi bi-plus-circle-fill text-base"></i>
            Créer une mission
          </button>
        </div>

        {/* ════ ONGLETS ════ */}
        <div className={`flex items-center gap-1 mb-6 p-1 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} w-fit shadow-sm`}
          style={{ animation: animateCards ? 'fadeInUp .4s ease-out .05s both' : 'none' }}>
          {[
            { key: 'brousse', label: 'Mission Brousse',    icon: 'bi-tree-fill',        count: missions.filter(m => m.type_mission === 'mission_brousse').length },
            { key: 'tf',      label: 'Transport de Fonds', icon: 'bi-shield-lock-fill', count: missions.filter(m => m.type_mission === 'transport_fonds').length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'text-white shadow-md'
                  : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={activeTab === tab.key ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` } : {}}>
              <i className={`bi ${tab.icon} text-base`}></i>
              {tab.label}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/25 text-white' : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
            </button>
          ))}
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

              {/* Statut */}
              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les statuts</option>
                {STATUTS_MISSION.map(s => <option key={s.code} value={s.code}>{s.libelle}</option>)}
              </select>

              {/* Chauffeur */}
              <select value={filterChauffeur} onChange={e => setFilterChauffeur(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les {isTFTab ? 'agents' : 'chauffeurs'}</option>
                {chauffeursFiltresOnglet.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>

              {/* Direction (seulement brousse) */}
              {!isTFTab && (
                <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                  <option value="">Toutes les directions</option>
                  {DIRECTIONS.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
              )}

              {/* Incident */}
              <select value={filterIncident} onChange={e => setFilterIncident(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Incidents : tous</option>
                <option value="oui">Avec incident</option>
                <option value="non">Sans incident</option>
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
                  placeholder="Réf, chauffeur, véhicule, destination..."
                  className={`pl-9 pr-4 py-2 rounded-lg border text-sm w-60 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`} />
              </div>

              {/* Export */}
              <div className="relative" ref={exportRef}>
                <button onClick={() => setExportOpen(!exportOpen)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <i className="bi bi-download"></i> Exporter
                </button>
                {exportOpen && (
                  <div className={`absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl border py-2 min-w-[210px] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <p className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sorted.length} mission(s)</p>
                    <button onClick={() => {
                      exportToExcel(sorted.map(isTFTab ? toRowTF : toRowBrousse), `Missions_${activeTab.toUpperCase()}`, isTFTab ? expHeadersTF : expHeadersBrousse);
                      showToast('Export Excel effectué', 'success'); setExportOpen(false);
                    }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                      <i className="bi bi-file-earmark-spreadsheet text-green-500 text-base"></i>
                      <div><p className="font-medium">Exporter en Excel</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Format CSV (UTF-8)</p></div>
                    </button>
                    <button onClick={() => {
                      exportToPDF(`Registre des Missions — ${activeTab === 'tf' ? 'Transport de Fonds' : 'Mission Brousse'}`, isTFTab ? expHeadersTF : expHeadersBrousse, sorted.map(isTFTab ? toRowTF : toRowBrousse));
                      showToast('Export PDF généré', 'success'); setExportOpen(false);
                    }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                      <i className="bi bi-file-earmark-pdf text-red-500 text-base"></i>
                      <div><p className="font-medium">Exporter en PDF</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Impression paysage</p></div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sorted.length} mission(s) trouvée(s)</p>
        </div>

        {/* ════ VUE TABLEAU ════ */}
        {view === 'table' && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .65s both' : 'none' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: `linear-gradient(135deg, ${tabColor}, ${tabColorDark})` }}>
                    {[
                      ['Réf.', 'reference_mission'],
                      [isTFTab ? 'Agent TF' : 'Chauffeur', 'chauffeur_nom'],
                      ['Véhicule', null],
                      ['Date départ', 'date_depart_prevue'],
                      ['Destination', null],
                      ...(isTFTab
                        ? [['Montant', 'montant_transporte'], ['Sécurité', null]]
                        : [['Km parcourus', 'km_parcourus'], ['Objet', null]]
                      ),
                      ['Statut', 'statut'],
                      ['Incident', null],
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
                      <i className="bi bi-send text-5xl block mb-3 opacity-40"></i>
                      <span className="text-sm">Aucune mission pour les filtres sélectionnés</span>
                    </td></tr>
                  ) : paginated.map((m, idx) => {
                    const statut = getStatutInfo(m.statut);
                    return (
                      <tr key={m.id} className="row-hover transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: idx % 2 === 0 ? (darkMode ? '#0c1929' : '#fef2f2') : (darkMode ? '#162033' : '#fff5f5'),
                          animation: animateCards ? `fadeInUp .4s ease-out ${idx * .04}s both` : 'none',
                        }}
                        onClick={() => { setSelectedMission(m); setShowDetailModal(true); }}>

                        {/* Réf */}
                        <td className="px-4 py-4">
                          <span className={`text-xs font-mono font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{m.reference_mission}</span>
                          {m.incident_signale && <span className="ml-2 text-orange-500 text-xs" title="Incident"><i className="bi bi-exclamation-triangle-fill"></i></span>}
                        </td>

                        {/* Chauffeur */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: m.avatar_color }}>
                              {m.chauffeur_nom.charAt(0)}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{m.chauffeur_nom}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{m.chauffeur_matricule}</p>
                            </div>
                          </div>
                        </td>

                        {/* Véhicule */}
                        <td className="px-4 py-4">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{m.vehicule_immatriculation}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{m.vehicule_marque} {m.vehicule_modele}</p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{new Date(m.date_depart_prevue).toLocaleDateString('fr-FR')}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(m.date_depart_prevue).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>

                        {/* Destination */}
                        <td className="px-4 py-4">
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-[150px] truncate`} title={m.destination}>{m.destination || '—'}</p>
                        </td>

                        {/* Col dynamique */}
                        {isTFTab ? (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                {m.montant_transporte ? `${(m.montant_transporte / 1000000).toFixed(1)}M` : '—'}
                              </p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>FCFA</p>
                            </td>
                            <td className="px-4 py-4">
                              {m.niveau_securite && <SecurityBadge niveau={m.niveau_securite} darkMode={darkMode} theme={theme} />}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {m.km_parcourus ? `${m.km_parcourus.toLocaleString('fr-FR')} km` : '—'}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} max-w-[120px] truncate`}>{m.objet_mission || '—'}</p>
                            </td>
                          </>
                        )}

                        {/* Statut */}
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statut.bg}`}>
                            <i className={`${statut.icon} mr-1`}></i>{statut.libelle}
                          </span>
                        </td>

                        {/* Incident */}
                        <td className="px-4 py-4 text-center">
                          {m.incident_signale
                            ? <span className="text-orange-500"><i className="bi bi-exclamation-triangle-fill"></i></span>
                            : <span className="text-green-500"><i className="bi bi-check-circle-fill"></i></span>}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <ActionMenu
                            mission={m}
                            darkMode={darkMode}
                            theme={theme}
                            onView={(mis) => { setSelectedMission(mis); setShowDetailModal(true); }}
                            onEdit={handleEdit}
                            onDelete={(id) => { if (window.confirm('Supprimer cette mission ?')) handleDelete(id); }}
                            onChangeStatut={handleChangeStatut}
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
                        style={currentPage === page ? { background: `linear-gradient(to right, ${tabColor}, ${tabColorDark})` } : {}}>
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
            {paginated.map((m, idx) => {
              const statut = getStatutInfo(m.statut);
              return (
                <div key={m.id} onClick={() => { setSelectedMission(m); setShowDetailModal(true); }}
                  className={`${darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-300'} rounded-xl border shadow-sm p-5 cursor-pointer transition-all card-hover`}
                  style={{ animation: animateCards ? `fadeInUp .4s ease-out ${idx * .04}s both` : 'none' }}>

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.reference_mission}</span>
                      {m.incident_signale && <span className="text-orange-500 text-xs" title="Incident"><i className="bi bi-exclamation-triangle-fill"></i></span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statut.bg}`}>{statut.libelle}</span>
                      {isTFTab && m.niveau_securite && <SecurityBadge niveau={m.niveau_securite} darkMode={darkMode} theme={theme} />}
                    </div>
                  </div>

                  {/* Chauffeur */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: m.avatar_color }}>
                      {m.chauffeur_nom.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{m.chauffeur_nom}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{m.chauffeur_matricule}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{m.vehicule_immatriculation}</p>
                      <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{m.vehicule_marque} {m.vehicule_modele}</p>
                    </div>
                  </div>

                  {/* Infos */}
                  <div className={`rounded-lg p-3 space-y-1.5 mb-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-calendar2-event text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                      <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {new Date(m.date_depart_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-geo-alt text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{m.destination || '—'}</span>
                    </div>
                    {isTFTab ? (
                      <div className="flex items-center gap-2">
                        <i className={`bi bi-safe-fill text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {m.montant_transporte ? `${(m.montant_transporte / 1000000).toFixed(1)}M FCFA` : '—'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <i className={`bi bi-speedometer2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {m.km_parcourus ? `${m.km_parcourus.toLocaleString('fr-FR')} km parcourus` : m.objet_mission || '—'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isTFTab && m.escorte_armee && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                          style={{ background: `${theme.primary}99` }}>
                          <i className="bi bi-shield-shaded mr-0.5"></i>Escorte
                        </span>
                      )}
                      {!isTFTab && m.direction_nom && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'} max-w-[120px] truncate`}>
                          {m.direction_code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{formatRelative(m.date_depart_prevue)}</span>
                      <div onClick={e => e.stopPropagation()}>
                        <ActionMenu
                          mission={m}
                          darkMode={darkMode}
                          theme={theme}
                          onView={(mis) => { setSelectedMission(mis); setShowDetailModal(true); }}
                          onEdit={handleEdit}
                          onDelete={(id) => { if (window.confirm('Supprimer cette mission ?')) handleDelete(id); }}
                          onChangeStatut={handleChangeStatut}
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
                      style={currentPage === page ? { background: `linear-gradient(to right, ${tabColor}, ${tabColorDark})` } : {}}>
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
            {"© 2026 SGS — Registre des Missions — Fleetify"}
          </p>
        </div>
      </main>

      {/* ════ MODALS ════ */}
      {showDetailModal && selectedMission && (
        <MissionModal
          mission={selectedMission}
          darkMode={darkMode}
          theme={theme}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEdit}
          onDelete={(id) => { handleDelete(id); setShowDetailModal(false); }}
          onChangeStatut={handleChangeStatut}
        />
      )}

      {showFormModal && (
        <MissionFormModal
          mission={editMission}
          darkMode={darkMode}
          theme={theme}
          defaultType={currentType}
          onClose={() => { setShowFormModal(false); setEditMission(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Missions;