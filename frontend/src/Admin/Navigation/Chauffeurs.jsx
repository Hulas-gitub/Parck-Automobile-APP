import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// ─── Constantes ───────────────────────────────────────────────────────────────

const COLORS = {
  blue: '#3b82f6', green: '#10b981', red: '#ef4444',
  yellow: '#f59e0b', purple: '#8b5cf6', cyan: '#06b6d4',
  orange: '#f97316', pink: '#ec4899', gray: '#6b7280',
};

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

// Types de missions avec couleur et icône
const MISSION_TYPES = {
  transport_fonds:  { label: 'Transport de fonds',  color: '#ef4444', icon: 'bi-safe-fill',          weight: 3 },
  vip:              { label: 'VIP / Protocole',      color: '#8b5cf6', icon: 'bi-star-fill',           weight: 2 },
  administratif:    { label: 'Administratif',        color: '#3b82f6', icon: 'bi-briefcase-fill',      weight: 1 },
  logistique:       { label: 'Logistique',           color: '#f97316', icon: 'bi-box-seam-fill',       weight: 1.5 },
  urgence:          { label: 'Urgence / Prioritaire',color: '#dc2626', icon: 'bi-lightning-fill',      weight: 2.5 },
};

// ─── Formule de calcul du score KPI ──────────────────────────────────────────
// Score = 100
//   - 20 pts par accident responsable (sur total historique pondéré)
//   - 8  pts par accident non responsable
//   + bonus missions : volume + diversité types
// Plancher 0 / Plafond 100
function calculerScore(kpi) {
  let score = 100;

  // Pénalités accidents (on utilise le total historique pondéré par ancienneté)
  // Accidents récents (1an) comptent 100%, anciens (all - 1an) comptent 40%
  const accRecentResp    = kpi.accidentParType.responsable_1an    || 0;
  const accRecentNonResp = kpi.accidentParType.non_responsable_1an || 0;
  const accAncienResp    = (kpi.accidentParType.responsable    || 0) - accRecentResp;
  const accAncienNonResp = (kpi.accidentParType.non_responsable || 0) - accRecentNonResp;

  score -= accRecentResp    * 20;
  score -= accRecentNonResp * 8;
  score -= accAncienResp    * 8;   // anciens = poids réduit
  score -= accAncienNonResp * 3;

  // Bonus missions : volume annuel
  const missionsAn = kpi.missions['1an'] || 0;
  if (missionsAn >= 80) score += 5;
  else if (missionsAn >= 60) score += 3;
  else if (missionsAn >= 40) score += 1;

  // Bonus diversité types de missions
  const typesEffectues = Object.values(kpi.missionsParType || {}).filter(v => v > 0).length;
  if (typesEffectues >= 4) score += 3;
  else if (typesEffectues >= 3) score += 2;
  else if (typesEffectues >= 2) score += 1;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockChauffeurs = [
  { id: 1, nom: 'Jean Mbourou',      email: 'jean.mbourou@sgs-gabon.com',     telephone: '+241 06 12 34 56', direction: 'Dir. Générale',   statut: 'actif',   dateEmbauche: '2020-03-15', permis: 'B, C, E', initiales: 'JM', couleur: '#f59e0b' },
  { id: 2, nom: 'Paul Nzong',        email: 'paul.nzong@sgs-gabon.com',       telephone: '+241 06 23 45 67', direction: 'Dir. Technique',  statut: 'actif',   dateEmbauche: '2019-07-22', permis: 'B, C',   initiales: 'PN', couleur: '#3b82f6' },
  { id: 3, nom: 'Marie Essono',      email: 'marie.essono@sgs-gabon.com',     telephone: '+241 06 34 56 78', direction: 'Transport Fonds', statut: 'actif',   dateEmbauche: '2021-01-10', permis: 'B, C, E', initiales: 'ME', couleur: '#10b981' },
  { id: 4, nom: 'Albert Bongo',      email: 'albert.bongo@sgs-gabon.com',     telephone: '+241 06 45 67 89', direction: 'Dir. Commerciale',statut: 'actif',   dateEmbauche: '2018-11-05', permis: 'B',       initiales: 'AB', couleur: '#8b5cf6' },
  { id: 5, nom: 'Sophie Mba',        email: 'sophie.mba@sgs-gabon.com',       telephone: '+241 06 56 78 90', direction: 'Dir. Générale',   statut: 'inactif', dateEmbauche: '2022-04-18', permis: 'B, C',   initiales: 'SM', couleur: '#ef4444' },
  { id: 6, nom: 'David Okome',       email: 'david.okome@sgs-gabon.com',      telephone: '+241 06 67 89 01', direction: 'Dir. Technique',  statut: 'actif',   dateEmbauche: '2020-09-12', permis: 'B, C, E', initiales: 'DO', couleur: '#ec4899' },
  { id: 7, nom: 'Claire Moussavou',  email: 'claire.moussavou@sgs-gabon.com', telephone: '+241 06 78 90 12', direction: 'Transport Fonds', statut: 'actif',   dateEmbauche: '2019-05-20', permis: 'B, C',   initiales: 'CM', couleur: '#14b8a6' },
  { id: 8, nom: 'Michel Obame',      email: 'michel.obame@sgs-gabon.com',     telephone: '+241 06 89 01 23', direction: 'Dir. Générale',   statut: 'actif',   dateEmbauche: '2021-08-30', permis: 'B, C, E', initiales: 'MO', couleur: '#f97316' },
  { id: 9, nom: 'Sandrine Nguema',   email: 'sandrine.nguema@sgs-gabon.com',  telephone: '+241 06 90 12 34', direction: 'Dir. Commerciale',statut: 'actif',   dateEmbauche: '2020-02-14', permis: 'B',       initiales: 'SN', couleur: '#06b6d4' },
  { id:10, nom: 'François Ondimba',  email: 'francois.ondimba@sgs-gabon.com', telephone: '+241 06 01 23 45', direction: 'Dir. Technique',  statut: 'actif',   dateEmbauche: '2018-12-03', permis: 'B, C',   initiales: 'FO', couleur: '#84cc16' },
  { id:11, nom: 'Juliette Boungou',  email: 'juliette.boungou@sgs-gabon.com', telephone: '+241 06 12 34 57', direction: 'Transport Fonds', statut: 'actif',   dateEmbauche: '2021-06-25', permis: 'B, C, E', initiales: 'JB', couleur: '#a855f7' },
  { id:12, nom: 'Patrick Mabika',    email: 'patrick.mabika@sgs-gabon.com',   telephone: '+241 06 23 45 68', direction: 'Dir. Générale',   statut: 'inactif', dateEmbauche: '2019-10-08', permis: 'B, C',   initiales: 'PM', couleur: '#6b7280' },
  { id:13, nom: 'Nathalie Mengue',   email: 'nathalie.mengue@sgs-gabon.com',  telephone: '+241 06 34 56 79', direction: 'Dir. Commerciale',statut: 'actif',   dateEmbauche: '2020-11-19', permis: 'B',       initiales: 'NM', couleur: '#eab308' },
];

const mockDocuments = [
  { id:1,  chauffeurId:1,  chauffeurNom:'Jean Mbourou',    typeDocument:'Permis de conduire', numeroPermis:'PC123456', categoriesPermis:'B, C, E', dateDelivrance:'2018-05-10', dateExpiration:'2028-05-10', statut:'valide'         },
  { id:2,  chauffeurId:2,  chauffeurNom:'Paul Nzong',      typeDocument:'Permis de conduire', numeroPermis:'PC234567', categoriesPermis:'B, C',   dateDelivrance:'2017-03-15', dateExpiration:'2027-03-15', statut:'valide'         },
  { id:3,  chauffeurId:3,  chauffeurNom:'Marie Essono',    typeDocument:'Permis de conduire', numeroPermis:'PC345678', categoriesPermis:'B, C, E', dateDelivrance:'2019-01-20', dateExpiration:'2029-01-20', statut:'valide'         },
  { id:4,  chauffeurId:4,  chauffeurNom:'Albert Bongo',    typeDocument:'Permis de conduire', numeroPermis:'PC456789', categoriesPermis:'B',      dateDelivrance:'2016-11-08', dateExpiration:'2026-11-08', statut:'expire_bientot' },
  { id:5,  chauffeurId:5,  chauffeurNom:'Sophie Mba',      typeDocument:'Permis de conduire', numeroPermis:'PC567890', categoriesPermis:'B, C',   dateDelivrance:'2020-02-25', dateExpiration:'2030-02-25', statut:'valide'         },
  { id:6,  chauffeurId:1,  chauffeurNom:'Jean Mbourou',    typeDocument:'Certificat médical', numeroPermis:'CM001',    categoriesPermis:'-',      dateDelivrance:'2025-01-15', dateExpiration:'2026-01-15', statut:'valide'         },
  { id:7,  chauffeurId:6,  chauffeurNom:'David Okome',     typeDocument:'Permis de conduire', numeroPermis:'PC678901', categoriesPermis:'B, C, E', dateDelivrance:'2018-09-12', dateExpiration:'2028-09-12', statut:'valide'         },
  { id:8,  chauffeurId:7,  chauffeurNom:'Claire Moussavou',typeDocument:'Permis de conduire', numeroPermis:'PC789012', categoriesPermis:'B, C',   dateDelivrance:'2017-05-20', dateExpiration:'2027-05-20', statut:'valide'         },
  { id:9,  chauffeurId:8,  chauffeurNom:'Michel Obame',    typeDocument:'Permis de conduire', numeroPermis:'PC890123', categoriesPermis:'B, C, E', dateDelivrance:'2019-08-30', dateExpiration:'2029-08-30', statut:'valide'         },
  { id:10, chauffeurId:9,  chauffeurNom:'Sandrine Nguema', typeDocument:'Permis de conduire', numeroPermis:'PC901234', categoriesPermis:'B',      dateDelivrance:'2018-02-14', dateExpiration:'2028-02-14', statut:'valide'         },
  { id:11, chauffeurId:2,  chauffeurNom:'Paul Nzong',      typeDocument:'Certificat médical', numeroPermis:'CM002',    categoriesPermis:'-',      dateDelivrance:'2024-12-10', dateExpiration:'2025-12-10', statut:'valide'         },
  { id:12, chauffeurId:10, chauffeurNom:'François Ondimba',typeDocument:'Permis de conduire', numeroPermis:'PC012345', categoriesPermis:'B, C',   dateDelivrance:'2016-12-03', dateExpiration:'2026-12-03', statut:'expire_bientot' },
  { id:13, chauffeurId:11, chauffeurNom:'Juliette Boungou',typeDocument:'Permis de conduire', numeroPermis:'PC123457', categoriesPermis:'B, C, E', dateDelivrance:'2019-06-25', dateExpiration:'2029-06-25', statut:'valide'         },
];

// mockKPIData — score est CALCULÉ dynamiquement via calculerScore(), pas hardcodé
const mockKPIDataRaw = {
  1:  {
    accidents:{ '3m':0,'6m':1,'1an':1,'all':2 },
    missions: { '3m':18,'6m':34,'1an':72,'all':145 },
    km: 28400,
    accidentParType:{ responsable:1, non_responsable:1, responsable_1an:1, non_responsable_1an:0 },
    accidentParMois: [0,0,0,0,0,0,0,1,0,0,0,0],
    missionsParMois: [14,16,12,18,20,15,16,18,17,15,14,16],
    missionsParType: { transport_fonds:18, vip:12, administratif:22, logistique:14, urgence:6 },
  },
  2:  {
    accidents:{ '3m':1,'6m':1,'1an':2,'all':3 },
    missions: { '3m':12,'6m':24,'1an':55,'all':120 },
    km: 21000,
    accidentParType:{ responsable:2, non_responsable:1, responsable_1an:2, non_responsable_1an:0 },
    accidentParMois: [0,1,0,0,0,0,0,0,1,0,0,0],
    missionsParMois: [10,12,8,14,16,12,14,16,12,10,8,10],
    missionsParType: { transport_fonds:10, vip:8,  administratif:20, logistique:12, urgence:5 },
  },
  3:  {
    accidents:{ '3m':0,'6m':0,'1an':0,'all':1 },
    missions: { '3m':22,'6m':43,'1an':88,'all':170 },
    km: 33200,
    accidentParType:{ responsable:0, non_responsable:1, responsable_1an:0, non_responsable_1an:0 },
    accidentParMois: [0,0,0,0,0,0,0,0,0,0,0,0],
    missionsParMois: [18,20,16,22,24,20,22,24,20,18,16,18],
    missionsParType: { transport_fonds:30, vip:15, administratif:20, logistique:18, urgence:5 },
  },
  4:  {
    accidents:{ '3m':2,'6m':3,'1an':4,'all':7 },
    missions: { '3m':8,'6m':15,'1an':38,'all':80 },
    km: 14500,
    accidentParType:{ responsable:4, non_responsable:3, responsable_1an:3, non_responsable_1an:1 },
    accidentParMois: [1,0,0,0,1,0,0,1,0,1,0,0],
    missionsParMois: [6,8,6,10,12,8,10,12,8,6,6,8],
    missionsParType: { transport_fonds:5,  vip:3,  administratif:18, logistique:10, urgence:2 },
  },
  5:  {
    accidents:{ '3m':0,'6m':0,'1an':1,'all':1 },
    missions: { '3m':5,'6m':10,'1an':20,'all':42 },
    km: 7800,
    accidentParType:{ responsable:0, non_responsable:1, responsable_1an:0, non_responsable_1an:1 },
    accidentParMois: [0,0,0,0,0,0,0,0,0,0,0,1],
    missionsParMois: [4,4,6,6,8,6,6,8,6,4,4,4],
    missionsParType: { transport_fonds:0,  vip:2,  administratif:12, logistique:5,  urgence:1 },
  },
  6:  {
    accidents:{ '3m':1,'6m':1,'1an':1,'all':2 },
    missions: { '3m':16,'6m':31,'1an':65,'all':130 },
    km: 25100,
    accidentParType:{ responsable:1, non_responsable:1, responsable_1an:1, non_responsable_1an:0 },
    accidentParMois: [0,0,0,0,0,1,0,0,0,0,0,0],
    missionsParMois: [12,14,10,16,18,14,16,18,14,12,10,12],
    missionsParType: { transport_fonds:12, vip:10, administratif:22, logistique:15, urgence:6 },
  },
  7:  {
    accidents:{ '3m':0,'6m':0,'1an':0,'all':0 },
    missions: { '3m':20,'6m':40,'1an':82,'all':160 },
    km: 31500,
    accidentParType:{ responsable:0, non_responsable:0, responsable_1an:0, non_responsable_1an:0 },
    accidentParMois: [0,0,0,0,0,0,0,0,0,0,0,0],
    missionsParMois: [16,18,14,20,22,18,20,22,18,16,14,16],
    missionsParType: { transport_fonds:28, vip:18, administratif:18, logistique:12, urgence:6 },
  },
  8:  {
    accidents:{ '3m':0,'6m':1,'1an':2,'all':3 },
    missions: { '3m':14,'6m':28,'1an':60,'all':115 },
    km: 22800,
    accidentParType:{ responsable:1, non_responsable:2, responsable_1an:1, non_responsable_1an:1 },
    accidentParMois: [0,0,0,0,0,0,0,1,0,0,0,1],
    missionsParMois: [10,12,8,14,16,12,14,16,12,10,8,10],
    missionsParType: { transport_fonds:15, vip:8,  administratif:20, logistique:12, urgence:5 },
  },
  9:  {
    accidents:{ '3m':0,'6m':0,'1an':0,'all':1 },
    missions: { '3m':18,'6m':36,'1an':74,'all':140 },
    km: 27300,
    accidentParType:{ responsable:0, non_responsable:1, responsable_1an:0, non_responsable_1an:0 },
    accidentParMois: [0,0,0,0,0,0,0,0,0,0,0,0],
    missionsParMois: [14,16,12,18,20,15,16,18,17,15,14,16],
    missionsParType: { transport_fonds:20, vip:14, administratif:22, logistique:13, urgence:5 },
  },
  10: {
    accidents:{ '3m':1,'6m':2,'1an':3,'all':5 },
    missions: { '3m':10,'6m':20,'1an':44,'all':90 },
    km: 16800,
    accidentParType:{ responsable:2, non_responsable:3, responsable_1an:2, non_responsable_1an:1 },
    accidentParMois: [0,0,1,0,0,1,0,0,0,1,0,0],
    missionsParMois: [8,10,6,12,14,10,12,14,10,8,6,8],
    missionsParType: { transport_fonds:8,  vip:4,  administratif:18, logistique:10, urgence:4 },
  },
  11: {
    accidents:{ '3m':0,'6m':0,'1an':0,'all':0 },
    missions: { '3m':21,'6m':41,'1an':85,'all':162 },
    km: 32100,
    accidentParType:{ responsable:0, non_responsable:0, responsable_1an:0, non_responsable_1an:0 },
    accidentParMois: [0,0,0,0,0,0,0,0,0,0,0,0],
    missionsParMois: [18,20,16,22,24,20,22,24,20,18,16,18],
    missionsParType: { transport_fonds:32, vip:20, administratif:15, logistique:12, urgence:6 },
  },
  12: {
    accidents:{ '3m':0,'6m':1,'1an':2,'all':4 },
    missions: { '3m':4,'6m':8,'1an':18,'all':35 },
    km: 6200,
    accidentParType:{ responsable:1, non_responsable:3, responsable_1an:1, non_responsable_1an:1 },
    accidentParMois: [0,0,0,0,0,0,0,0,0,1,0,1],
    missionsParMois: [3,4,2,4,6,4,4,6,4,3,2,3],
    missionsParType: { transport_fonds:3,  vip:1,  administratif:8,  logistique:5,  urgence:1 },
  },
  13: {
    accidents:{ '3m':0,'6m':0,'1an':1,'all':1 },
    missions: { '3m':17,'6m':33,'1an':68,'all':132 },
    km: 25800,
    accidentParType:{ responsable:0, non_responsable:1, responsable_1an:0, non_responsable_1an:1 },
    accidentParMois: [0,0,0,0,0,0,0,0,0,0,0,1],
    missionsParMois: [13,15,11,17,19,14,16,18,16,14,12,14],
    missionsParType: { transport_fonds:18, vip:12, administratif:20, logistique:12, urgence:6 },
  },
};

// Injection des scores calculés dynamiquement
const mockKPIData = Object.fromEntries(
  Object.entries(mockKPIDataRaw).map(([id, kpi]) => [id, { ...kpi, score: calculerScore(kpi) }])
);

// ─── Helpers score ─────────────────────────────────────────────────────────────

function getScoreColor(score) {
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#3b82f6';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}
function getScoreLabel(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Bon';
  if (score >= 60) return 'Moyen';
  return 'À surveiller';
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

const ChartCard = ({ children, className = '', darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden ${className}`}>
    <div className="p-4 flex flex-col h-full">{children}</div>
  </div>
);

const ChartTitle = ({ children, icon, darkMode }) => (
  <h3 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
    {icon && <i className={`${icon} text-blue-500`}></i>}
    {children}
  </h3>
);

const LegendRow = ({ items, darkMode }) => (
  <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
    {items.map((item, idx) => (
      <div key={idx} className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></div>
        <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
      </div>
    ))}
  </div>
);

// Jauge score
const ScoreGauge = ({ score, animateCharts }) => {
  const color = getScoreColor(score);
  const r = 56;
  const circ = 2 * Math.PI * r;
  const arc = (score / 100) * circ * 0.75;
  return (
    <svg width="148" height="110" viewBox="0 0 148 110">
      <circle cx="74" cy="84" r={r} fill="none" stroke="#374151" strokeWidth="13"
        strokeDasharray={`${circ * 0.75} ${circ}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" transform="rotate(-225 74 84)" />
      <circle cx="74" cy="84" r={r} fill="none" stroke={color} strokeWidth="13"
        strokeDasharray={`${animateCharts ? arc : 0} ${circ}`}
        strokeDashoffset={animateCharts ? circ * 0.25 : circ}
        strokeLinecap="round" transform="rotate(-225 74 84)"
        style={{ transition: 'stroke-dasharray 1.2s ease-out' }} />
      <text x="74" y="80" textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>{score}</text>
      <text x="74" y="97" textAnchor="middle" fontSize="9.5" fill="#9ca3af">{getScoreLabel(score)}</text>
    </svg>
  );
};

// Barres missions
const MiniBarChart = ({ data, color, animateCharts, darkMode }) => {
  const max = Math.max(...data, 1);
  const W = 270, H = 85, left = 26, bottom = 66;
  const slotW = (W - left) / data.length;
  const chartH = bottom - 10;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {[0, Math.round(max/2), max].map((v, i) => (
        <text key={i} x={left-4} y={bottom-(v/max)*chartH} textAnchor="end" fontSize="7.5" fill={darkMode ? '#6b7280' : '#9ca3af'}>{v}</text>
      ))}
      {[0,1,2].map(i => (
        <line key={i} x1={left} y1={bottom-([0,Math.round(max/2),max][i]/max)*chartH} x2={W-4} y2={bottom-([0,Math.round(max/2),max][i]/max)*chartH} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="0.5" />
      ))}
      {data.map((v, idx) => {
        const cx = left + slotW * idx + slotW / 2;
        const bw = Math.min(slotW * 0.6, 13);
        const h = animateCharts ? (v / max) * chartH : 0;
        return (
          <g key={idx}>
            <rect x={cx-bw/2} y={bottom-h} width={bw} height={h||0} fill={color} rx="2"
              style={{ transition: `height 0.7s ease-out ${idx*0.04}s, y 0.7s ease-out ${idx*0.04}s` }} />
            <text x={cx} y={H-1} textAnchor="middle" fontSize="7" fill={darkMode ? '#6b7280' : '#9ca3af'}>{MOIS[idx]}</text>
          </g>
        );
      })}
    </svg>
  );
};

// Ligne accidents
const AccidentLineChart = ({ data, animateCharts, darkMode }) => {
  const W = 270, H = 85, left = 26, bottom = 66;
  const chartH = bottom - 10;
  const max = Math.max(...data, 1);
  const slotW = (W - left - 4) / (data.length - 1);
  const px = (i) => left + i * slotW;
  const py = (v) => bottom - (v / max) * chartH;
  const pathD = data.map((v, i) => `${i===0?'M':'L'} ${px(i)},${py(v)}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {[0,1,2].map(i => (
        <line key={i} x1={left} y1={py([0,Math.round(max/2),max][i])} x2={W-4} y2={py([0,Math.round(max/2),max][i])} stroke={darkMode?'#374151':'#e5e7eb'} strokeWidth="0.5"/>
      ))}
      {[0,Math.round(max/2),max].map((v,i) => (
        <text key={i} x={left-4} y={py(v)} textAnchor="end" fontSize="7.5" fill={darkMode?'#6b7280':'#9ca3af'}>{v}</text>
      ))}
      <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"
        style={{ strokeDasharray: animateCharts?'0':'1000', strokeDashoffset: animateCharts?'0':'1000', transition:'stroke-dashoffset 1.2s ease-out' }}/>
      {data.map((v,i) => (
        <g key={i}>
          <circle cx={px(i)} cy={py(v)} r="3" fill={v>0?'#ef4444':'#10b981'}
            style={{ opacity: animateCharts?1:0, transition:`opacity 0.3s ${i*0.08+1}s` }}/>
          <text x={px(i)} y={H-1} textAnchor="middle" fontSize="7" fill={darkMode?'#6b7280':'#9ca3af'}>{MOIS[i]}</text>
        </g>
      ))}
    </svg>
  );
};

// Donut responsabilité
const MiniDonut = ({ responsable, non_responsable, animateCharts }) => {
  const total = responsable + non_responsable || 1;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pctNR = non_responsable / total;
  const pctR  = responsable / total;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#374151" strokeWidth="16"/>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#10b981" strokeWidth="16"
        strokeDasharray={`${animateCharts?pctNR*circ:0} ${circ}`}
        style={{ transition:'stroke-dasharray 1s ease-out', transform:'rotate(-90deg)', transformOrigin:'55px 55px' }}/>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#ef4444" strokeWidth="16"
        strokeDasharray={`${animateCharts?pctR*circ:0} ${circ}`}
        strokeDashoffset={`${-pctNR*circ}`}
        style={{ transition:'stroke-dasharray 1s ease-out 0.3s', transform:'rotate(-90deg)', transformOrigin:'55px 55px' }}/>
      <text x="55" y="51" textAnchor="middle" fontSize="17" fontWeight="bold" fill="#ef4444">{responsable}</text>
      <text x="55" y="65" textAnchor="middle" fontSize="8" fill="#9ca3af">resp.</text>
    </svg>
  );
};

// Barres horizontales types de missions
const MissionsTypeChart = ({ missionsParType, animateCharts, darkMode }) => {
  const total = Object.values(missionsParType).reduce((a,b)=>a+b,0) || 1;
  return (
    <div className="space-y-2">
      {Object.entries(MISSION_TYPES).map(([key, mt]) => {
        const val = missionsParType[key] || 0;
        const pct = (val/total)*100;
        return (
          <div key={key} className="flex items-center gap-2">
            <i className={`${mt.icon} text-xs flex-shrink-0`} style={{ color: mt.color }}></i>
            <span className={`text-[10px] w-28 truncate flex-shrink-0 ${darkMode?'text-gray-400':'text-gray-500'}`}>{mt.label}</span>
            <div className={`flex-1 h-2.5 rounded-full ${darkMode?'bg-gray-800':'bg-gray-100'}`}>
              <div className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: animateCharts?`${pct}%`:'0%', backgroundColor: mt.color }}/>
            </div>
            <span className="text-[11px] font-bold w-6 text-right" style={{ color: mt.color }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Exports ──────────────────────────────────────────────────────────────────

function exportCSV(data, filename) {
  const headers = ['Nom','Email','Téléphone','Direction','Statut','Date Embauche','Permis','Score','Missions (1an)','Accidents (1an)','Acc. Responsable','Acc. Non-Resp.','KM Total'];
  const rows = data.map(c => {
    const kpi = mockKPIData[c.id] || {};
    return [
      c.nom, c.email, c.telephone, c.direction, c.statut, c.dateEmbauche, c.permis,
      kpi.score||'-', kpi.missions?.['1an']||0,
      kpi.accidents?.['1an']||0, kpi.accidentParType?.responsable_1an||0,
      kpi.accidentParType?.non_responsable_1an||0, kpi.km||0,
    ];
  });
  const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function exportAlertesExcel(chauffeurs) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  script.onload = () => {
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();

    const alertChauffeurs = chauffeurs.filter(c =>
      (mockKPIData[c.id]?.accidents?.['1an']||0) >= 2 || (mockKPIData[c.id]?.score||100) < 70
    );

    // Feuille 1 : Alertes
    const aData = [
      ['RAPPORT ALERTES & SUIVIS – FLEETIFY SGS GABON','','','','','','','','','',''],
      [`Généré le : ${new Date().toLocaleDateString('fr-FR')} — ${alertChauffeurs.length} chauffeur(s) en alerte`,'','','','','','','','','',''],
      ['','','','','','','','','','',''],
      ['#','Chauffeur','Direction','Statut','Score /100','Niveau alerte','Acc. (3m)','Acc. (6m)','Acc. (1an)','Acc. Responsable','Acc. Non-Resp.','Missions (1an)','KM'],
    ];
    alertChauffeurs.forEach((c,i) => {
      const kpi = mockKPIData[c.id]||{};
      const isDanger = (kpi.accidents?.['1an']||0) >= 3;
      aData.push([
        i+1, c.nom, c.direction,
        c.statut==='actif'?'Actif':'Inactif',
        kpi.score||0,
        isDanger?'URGENT':'À surveiller',
        kpi.accidents?.['3m']||0, kpi.accidents?.['6m']||0, kpi.accidents?.['1an']||0,
        kpi.accidentParType?.responsable_1an||0, kpi.accidentParType?.non_responsable_1an||0,
        kpi.missions?.['1an']||0, kpi.km||0,
      ]);
    });
    const ds = 5, de = ds + alertChauffeurs.length - 1;
    aData.push(['','TOTAUX','','',
      `=AVERAGE(E${ds}:E${de})`,'',
      `=SUM(G${ds}:G${de})`,`=SUM(H${ds}:H${de})`,`=SUM(I${ds}:I${de})`,
      `=SUM(J${ds}:J${de})`,`=SUM(K${ds}:K${de})`,
      `=SUM(L${ds}:L${de})`,`=SUM(M${ds}:M${de})`,
    ]);
    const ws1 = XLSX.utils.aoa_to_sheet(aData);
    ws1['!cols'] = [{wch:4},{wch:25},{wch:20},{wch:10},{wch:10},{wch:15},{wch:10},{wch:10},{wch:10},{wch:14},{wch:12},{wch:14},{wch:12}];
    ws1['!merges'] = [{s:{r:0,c:0},e:{r:0,c:12}},{s:{r:1,c:0},e:{r:1,c:12}}];
    // styles titre & headers
    ['A1'].forEach(cell => { if(ws1[cell]) ws1[cell].s = { font:{bold:true,sz:15,color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'1E3A5F'}}, alignment:{horizontal:'center'} }; });
    'ABCDEFGHIJKLM'.split('').forEach(col => {
      const cell=`${col}4`;
      if(ws1[cell]) ws1[cell].s = { font:{bold:true,sz:10,color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'1E3A5F'}}, alignment:{horizontal:'center',wrapText:true} };
    });
    // styles data
    alertChauffeurs.forEach((_,i) => {
      const row = ds+i;
      const kpi = mockKPIData[alertChauffeurs[i].id]||{};
      const isDanger = (kpi.accidents?.['1an']||0) >= 3;
      const bg = i%2===0?'EEF2FF':'F9FAFB';
      'ABCDEFGHIJKLM'.split('').forEach((col,ci) => {
        const cell=`${col}${row}`;
        if(!ws1[cell]) return;
        const score = kpi.score||0;
        const scoreFg = score>=90?'059669':score>=75?'2563EB':score>=60?'D97706':'DC2626';
        ws1[cell].s = {
          font:{sz:10, bold:ci===4||ci===5, color:{rgb:ci===4?scoreFg:ci===5?(isDanger?'C53030':'B45309'):'1F2937'}},
          fill:{fgColor:{rgb:ci===5?(isDanger?'FEE2E2':'FEF3C7'):bg}},
          alignment:{horizontal:ci===1?'left':'center',vertical:'center'},
          border:{bottom:{style:'thin',color:{rgb:'E5E7EB'}},right:{style:'thin',color:{rgb:'E5E7EB'}}},
        };
      });
    });
    // totaux
    'ABCDEFGHIJKLM'.split('').forEach(col => {
      const cell=`${col}${de+1}`;
      if(ws1[cell]) ws1[cell].s = { font:{bold:true,sz:10,color:{rgb:'1E3A5F'}}, fill:{fgColor:{rgb:'DBEAFE'}}, alignment:{horizontal:'center'}, border:{top:{style:'medium',color:{rgb:'1E3A5F'}}} };
    });
    XLSX.utils.book_append_sheet(wb, ws1, 'Alertes & Suivis');

    // Feuille 2 : Tous les chauffeurs
    const rData = [
      ['RÉSUMÉ PERFORMANCE – TOUS LES CHAUFFEURS','','','','','','','',''],
      [`${new Date().toLocaleDateString('fr-FR')} • ${chauffeurs.length} chauffeurs`,'','','','','','','',''],
      ['','','','','','','','',''],
      ['#','Chauffeur','Direction','Statut','Score /100','Niveau','Acc. (1an)','Missions (1an)','KM total'],
    ];
    chauffeurs.map(c=>({...c,score:mockKPIData[c.id]?.score||0})).sort((a,b)=>b.score-a.score).forEach((c,i) => {
      const kpi = mockKPIData[c.id]||{};
      rData.push([i+1,c.nom,c.direction,c.statut==='actif'?'Actif':'Inactif',kpi.score||0,getScoreLabel(kpi.score||0),kpi.accidents?.['1an']||0,kpi.missions?.['1an']||0,kpi.km||0]);
    });
    const rs=5,re=rs+chauffeurs.length-1;
    rData.push(['','TOTAUX','','',`=AVERAGE(E${rs}:E${re})`,'',`=SUM(G${rs}:G${re})`,`=SUM(H${rs}:H${re})`,`=SUM(I${rs}:I${re})`]);
    const ws2 = XLSX.utils.aoa_to_sheet(rData);
    ws2['!cols'] = [{wch:4},{wch:25},{wch:20},{wch:10},{wch:10},{wch:14},{wch:12},{wch:14},{wch:12}];
    ws2['!merges'] = [{s:{r:0,c:0},e:{r:0,c:8}},{s:{r:1,c:0},e:{r:1,c:8}}];
    if(ws2['A1']) ws2['A1'].s = { font:{bold:true,sz:15,color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'1E3A5F'}}, alignment:{horizontal:'center'} };
    'ABCDEFGHI'.split('').forEach(col => {
      const cell=`${col}4`;
      if(ws2[cell]) ws2[cell].s = { font:{bold:true,sz:10,color:{rgb:'FFFFFF'}}, fill:{fgColor:{rgb:'1E3A5F'}}, alignment:{horizontal:'center',wrapText:true} };
    });
    chauffeurs.forEach((_,i) => {
      const row=rs+i;
      const sortedC = chauffeurs.map(c=>({...c,score:mockKPIData[c.id]?.score||0})).sort((a,b)=>b.score-a.score)[i];
      const kpi = mockKPIData[sortedC?.id]||{};
      const score=kpi.score||0;
      const scoreFg=score>=90?'059669':score>=75?'2563EB':score>=60?'D97706':'DC2626';
      const bg=i%2===0?'EEF2FF':'F9FAFB';
      'ABCDEFGHI'.split('').forEach((col,ci) => {
        const cell=`${col}${row}`;
        if(!ws2[cell]) return;
        ws2[cell].s = { font:{sz:10,bold:ci===4,color:{rgb:ci===4?scoreFg:'1F2937'}}, fill:{fgColor:{rgb:bg}}, alignment:{horizontal:ci===1?'left':'center'}, border:{bottom:{style:'thin',color:{rgb:'E5E7EB'}}} };
      });
    });
    'ABCDEFGHI'.split('').forEach(col => {
      const cell=`${col}${re+1}`;
      if(ws2[cell]) ws2[cell].s = { font:{bold:true,sz:10,color:{rgb:'1E3A5F'}}, fill:{fgColor:{rgb:'DBEAFE'}}, alignment:{horizontal:'center'}, border:{top:{style:'medium',color:{rgb:'1E3A5F'}}} };
    });
    XLSX.utils.book_append_sheet(wb, ws2, 'Tous les chauffeurs');

    XLSX.writeFile(wb, `alertes_fleetify_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  document.head.appendChild(script);
}

function exportPDF(chauffeurs) {
  const win = window.open('','_blank');
  const now = new Date().toLocaleDateString('fr-FR');
  const rows = chauffeurs.map((c,i) => {
    const kpi = mockKPIData[c.id]||{};
    const score = kpi.score||0;
    const sFg = score>=90?'#059669':score>=75?'#2563eb':score>=60?'#d97706':'#dc2626';
    const sBg = score>=90?'#d1fae5':score>=75?'#dbeafe':score>=60?'#fef3c7':'#fee2e2';
    const stBg = c.statut==='actif'?'#d1fae5':'#fee2e2';
    const stFg = c.statut==='actif'?'#065f46':'#991b1b';
    const bg = i%2===0?'#f0f4ff':'#ffffff';
    const acc1an = kpi.accidents?.['1an']||0;
    return `<tr style="background:${bg}${acc1an>=2?';border-left:3px solid #ef4444':''}">
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb"><strong>${c.nom}</strong><br><small style="color:#6b7280">${c.direction}</small></td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center"><span style="background:${stBg};color:${stFg};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600">${c.statut==='actif'?'Actif':'Inactif'}</span></td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${c.permis}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#2563eb;font-weight:bold">${kpi.missions?.['1an']||0}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:${acc1an>=3?'#dc2626':acc1an>=1?'#d97706':'#059669'};font-weight:bold">${acc1an}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626">${kpi.accidentParType?.responsable_1an||0}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${(kpi.km||0).toLocaleString('fr-FR')} km</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center"><span style="background:${sBg};color:${sFg};padding:3px 10px;border-radius:20px;font-weight:bold;font-size:11px">${score}/100</span></td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:10px;color:${sFg}">${getScoreLabel(score)}</td>
    </tr>`;
  }).join('');
  const totalAcc  = chauffeurs.reduce((a,c)=>a+(mockKPIData[c.id]?.accidents?.['1an']||0),0);
  const totalMiss = chauffeurs.reduce((a,c)=>a+(mockKPIData[c.id]?.missions?.['1an']||0),0);
  const totalKm   = chauffeurs.reduce((a,c)=>a+(mockKPIData[c.id]?.km||0),0);
  const avgScore  = Math.round(chauffeurs.reduce((a,c)=>a+(mockKPIData[c.id]?.score||0),0)/chauffeurs.length);
  const nbAlerts  = chauffeurs.filter(c=>(mockKPIData[c.id]?.accidents?.['1an']||0)>=2).length;
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Chauffeurs – ${now}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;padding:28px}
  .header{background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;padding:20px 24px;border-radius:10px;margin-bottom:20px}
  .header h1{font-size:20px;margin-bottom:4px}.header p{opacity:.8;font-size:11px}
  .kpi-row{display:flex;gap:10px;margin-bottom:18px}
  .kpi-box{flex:1;padding:12px;border-radius:8px;border:1px solid #e5e7eb;text-align:center}
  .kpi-box .val{font-size:22px;font-weight:bold}.kpi-box .lbl{font-size:10px;color:#6b7280;margin-top:2px}
  .formula-box{background:#f0f4ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-bottom:18px;font-size:11px}
  .formula-box h3{font-size:12px;font-weight:bold;color:#1e3a5f;margin-bottom:8px}
  .formula-box code{background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:4px;font-family:monospace}
  table{width:100%;border-collapse:collapse}
  thead tr{background:linear-gradient(to right,#1e3a5f,#2563eb)}
  th{padding:9px 10px;text-align:left;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.05em}
  th.c{text-align:center}
  tfoot tr{background:#dbeafe}
  tfoot td{padding:8px 10px;font-weight:bold;font-size:11px;color:#1e3a5f;border-top:2px solid #1e3a5f}
  @media print{body{padding:14px}}</style></head><body>
  <div class="header"><h1>🚗 Rapport des Chauffeurs – Fleetify SGS Gabon</h1><p>Généré le ${now} &nbsp;•&nbsp; ${chauffeurs.length} chauffeurs &nbsp;•&nbsp; Période : 1 an</p></div>
  <div class="kpi-row">
    <div class="kpi-box" style="border-color:#dbeafe"><div class="val" style="color:#2563eb">${chauffeurs.length}</div><div class="lbl">Chauffeurs</div></div>
    <div class="kpi-box" style="border-color:#d1fae5"><div class="val" style="color:#059669">${avgScore}/100</div><div class="lbl">Score moyen</div></div>
    <div class="kpi-box" style="border-color:#fee2e2"><div class="val" style="color:#dc2626">${totalAcc}</div><div class="lbl">Accidents (1an)</div></div>
    <div class="kpi-box" style="border-color:#d1fae5"><div class="val" style="color:#059669">${totalMiss}</div><div class="lbl">Missions (1an)</div></div>
    <div class="kpi-box" style="border-color:#e5e7eb"><div class="val" style="color:#6b7280">${totalKm.toLocaleString('fr-FR')}</div><div class="lbl">KM parcourus</div></div>
    <div class="kpi-box" style="border-color:#fee2e2;background:#fff5f5"><div class="val" style="color:#dc2626">${nbAlerts}</div><div class="lbl">En alerte</div></div>
  </div>

  <table>
    <thead><tr><th>Chauffeur</th><th class="c">Statut</th><th class="c">Permis</th><th class="c">Missions</th><th class="c">Accidents</th><th class="c">Acc. Resp.</th><th class="c">Kilométrage</th><th class="c">Score</th><th class="c">Niveau</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3"><strong>TOTAUX / MOYENNES</strong></td><td style="text-align:center">${totalMiss}</td><td style="text-align:center;color:#dc2626">${totalAcc}</td><td></td><td style="text-align:center">${totalKm.toLocaleString('fr-FR')} km</td><td style="text-align:center">${avgScore}/100</td><td></td></tr></tfoot>
  </table>
  <br><p style="color:#9ca3af;font-size:10px;text-align:center">© 2026 SGS Gabon – Fleetify v1.0 | Document confidentiel</p>
  </body></html>`);
  win.document.close(); win.focus(); setTimeout(()=>win.print(),400);
}

function exportDriverPDF(chauffeur) {
  const kpi = mockKPIData[chauffeur.id]||{};
  const win = window.open('','_blank');
  const now = new Date().toLocaleDateString('fr-FR');
  const score = kpi.score||0;
  const sFg = score>=90?'#059669':score>=75?'#2563eb':score>=60?'#d97706':'#dc2626';
  const sBg = score>=90?'#d1fae5':score>=75?'#dbeafe':score>=60?'#fef3c7':'#fee2e2';

  const periodRows = [
    {key:'3m',label:'3 mois'},{key:'6m',label:'6 mois'},{key:'1an',label:'1 an'},{key:'all',label:'Total'}
  ].map((p,i) => {
    const acc  = kpi.accidents?.[p.key]||0;
    const miss = kpi.missions?.[p.key]||0;
    const bg   = i%2===0?'#f0f4ff':'#fff';
    const accC = acc>=3?'#dc2626':acc>=1?'#d97706':'#059669';
    return `<tr style="background:${bg}"><td style="padding:7px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${p.label}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${accC};font-weight:bold">${acc}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#2563eb;font-weight:bold">${miss}</td></tr>`;
  }).join('');

  const moisRows = MOIS.map((m,i) => {
    const acc  = kpi.accidentParMois?.[i]||0;
    const miss = kpi.missionsParMois?.[i]||0;
    const bg = i%2===0?'#f0f4ff':'#fff';
    return `<tr style="background:${bg}"><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${m}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${acc>0?'#dc2626':'#059669'};font-weight:${acc>0?'bold':'normal'}">${acc}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#2563eb">${miss}</td></tr>`;
  }).join('');

  const typeRows = Object.entries(MISSION_TYPES).map(([key, mt],i) => {
    const val = kpi.missionsParType?.[key]||0;
    const bg = i%2===0?'#f0f4ff':'#fff';
    return `<tr style="background:${bg}"><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:${mt.color};font-weight:600">${mt.label}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:bold;color:${mt.color}">${val}</td></tr>`;
  }).join('');

  // Détail calcul score
  const accRecentResp    = kpi.accidentParType?.responsable_1an||0;
  const accRecentNonResp = kpi.accidentParType?.non_responsable_1an||0;
  const accAncienResp    = (kpi.accidentParType?.responsable||0) - accRecentResp;
  const accAncienNonResp = (kpi.accidentParType?.non_responsable||0) - accRecentNonResp;
  const pen1 = accRecentResp*20; const pen2 = accRecentNonResp*8;
  const pen3 = accAncienResp*8;  const pen4 = accAncienNonResp*3;
  const missAn = kpi.missions?.['1an']||0;
  const bonusMiss = missAn>=80?5:missAn>=60?3:missAn>=40?1:0;
  const typesEff = Object.values(kpi.missionsParType||{}).filter(v=>v>0).length;
  const bonusType = typesEff>=4?3:typesEff>=3?2:typesEff>=2?1:0;

  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Bilan – ${chauffeur.nom}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;padding:26px}
  .header{background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;padding:18px 22px;border-radius:10px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}
  .header h1{font-size:18px;margin-bottom:3px}.header p{opacity:.8;font-size:11px}
  .score-badge{padding:8px 20px;border-radius:8px;font-size:24px;font-weight:bold;border:2px solid ${sFg};color:${sFg};background:${sBg};white-space:nowrap}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
  .info-item{background:#f9fafb;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb}
  .info-item .lbl{font-size:10px;color:#6b7280;margin-bottom:2px}.info-item .val{font-size:12px;font-weight:600}
  .section-title{font-size:13px;font-weight:bold;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:5px;margin-bottom:10px;margin-top:16px}
  .formula-box{background:#f0f4ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin-bottom:16px;font-size:11px}
  .formula-box h3{font-size:11px;font-weight:bold;color:#1e3a5f;margin-bottom:6px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:linear-gradient(to right,#1e3a5f,#2563eb)}
  th{padding:8px 12px;text-align:left;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase}
  th.c{text-align:center}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  @media print{body{padding:12px}}</style></head><body>
  <div class="header">
    <div><h1>📋 Bilan – ${chauffeur.nom}</h1><p>${chauffeur.direction} &nbsp;•&nbsp; Généré le ${now}</p></div>
    <div class="score-badge">${score}/100 – ${getScoreLabel(score)}</div>
  </div>
  <div class="section-title">👤 Informations personnelles</div>
  <div class="info-grid">
    <div class="info-item"><div class="lbl">Email</div><div class="val">${chauffeur.email}</div></div>
    <div class="info-item"><div class="lbl">Téléphone</div><div class="val">${chauffeur.telephone}</div></div>
    <div class="info-item"><div class="lbl">Date d'embauche</div><div class="val">${new Date(chauffeur.dateEmbauche).toLocaleDateString('fr-FR')}</div></div>
    <div class="info-item"><div class="lbl">Permis</div><div class="val">${chauffeur.permis}</div></div>
    <div class="info-item"><div class="lbl">Statut</div><div class="val" style="color:${chauffeur.statut==='actif'?'#059669':'#dc2626'}">${chauffeur.statut==='actif'?'✅ Actif':'❌ Inactif'}</div></div>
    <div class="info-item"><div class="lbl">Kilométrage total</div><div class="val" style="color:#2563eb">${(kpi.km||0).toLocaleString('fr-FR')} km</div></div>
  </div>
  <div class="formula-box"><h3>📐 Détail du calcul de score</h3>
    100 pts de base<br>
    ${pen1>0?`– Acc. responsables (1an) : ${accRecentResp} × 20 = <strong style="color:#dc2626">–${pen1} pts</strong><br>`:''}
    ${pen2>0?`– Acc. non-resp. (1an) : ${accRecentNonResp} × 8 = <strong style="color:#dc2626">–${pen2} pts</strong><br>`:''}
    ${pen3>0?`– Anc. acc. responsables : ${accAncienResp} × 8 = <strong style="color:#dc2626">–${pen3} pts</strong><br>`:''}
    ${pen4>0?`– Anc. acc. non-resp. : ${accAncienNonResp} × 3 = <strong style="color:#dc2626">–${pen4} pts</strong><br>`:''}
    ${bonusMiss>0?`+ Bonus volume missions (${missAn}/an) = <strong style="color:#059669">+${bonusMiss} pts</strong><br>`:''}
    ${bonusType>0?`+ Bonus diversité types (${typesEff} types) = <strong style="color:#059669">+${bonusType} pts</strong><br>`:''}
    <strong>= Score final : ${score}/100</strong>
  </div>
  <div class="two-col">
    <div>
      <div class="section-title">📊 Performance par période</div>
      <table><thead><tr><th>Période</th><th class="c">Accidents</th><th class="c">Missions</th></tr></thead><tbody>${periodRows}</tbody></table>
      <div class="section-title" style="margin-top:14px">🗓️ Détail mensuel</div>
      <table><thead><tr><th>Mois</th><th class="c">Accidents</th><th class="c">Missions</th></tr></thead><tbody>${moisRows}</tbody></table>
    </div>
    <div>
      <div class="section-title">🏷️ Types de missions</div>
      <table><thead><tr><th>Type</th><th class="c">Nb</th></tr></thead><tbody>${typeRows}</tbody></table>
      <div class="section-title" style="margin-top:14px">🛡️ Responsabilité accidents</div>
      <table><thead><tr><th>Catégorie</th><th class="c">Total</th><th class="c">Sur 1 an</th></tr></thead>
      <tbody>
        <tr style="background:#f0f4ff"><td style="padding:7px 12px;border-bottom:1px solid #e5e7eb">Responsable</td><td style="padding:7px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:bold">${kpi.accidentParType?.responsable||0}</td><td style="padding:7px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:bold">${kpi.accidentParType?.responsable_1an||0}</td></tr>
        <tr style="background:#fff"><td style="padding:7px 12px">Non responsable</td><td style="padding:7px 12px;text-align:center;color:#059669;font-weight:bold">${kpi.accidentParType?.non_responsable||0}</td><td style="padding:7px 12px;text-align:center;color:#059669;font-weight:bold">${kpi.accidentParType?.non_responsable_1an||0}</td></tr>
      </tbody></table>
      ${(kpi.accidents?.['1an']||0)>=3?`<div style="margin-top:10px;padding:10px;background:#fee2e2;border-left:4px solid #dc2626;border-radius:6px"><p style="color:#991b1b;font-weight:bold;font-size:11px">⚠️ SUIVI URGENT REQUIS</p><p style="color:#b91c1c;font-size:10px;margin-top:3px">≥ 3 accidents/an. Convocation recommandée.</p></div>`:''}
    </div>
  </div>
  <br><p style="color:#9ca3af;font-size:10px;text-align:center">© 2026 SGS Gabon – Fleetify v1.0 | Document confidentiel</p>
  </body></html>`);
  win.document.close(); win.focus(); setTimeout(()=>win.print(),400);
}

// ─── KPI Panel – fenêtre grande mais légèrement contenue ──────────────────────
const KPIPanel = ({ chauffeur, darkMode, theme, animateCharts, onClose }) => {
  const kpi = mockKPIData[chauffeur.id]||{};
  const [period, setPeriod] = useState('1an');
  const pLabels = { '3m':'3 mois','6m':'6 mois','1an':'1 an','all':'Tout' };
  const score = kpi.score||0;

  // Détail du calcul pour affichage
  const accRecentResp    = kpi.accidentParType?.responsable_1an||0;
  const accRecentNonResp = kpi.accidentParType?.non_responsable_1an||0;
  const missAn = kpi.missions?.['1an']||0;
  const bonusMiss = missAn>=80?5:missAn>=60?3:missAn>=40?1:0;
  const typesEff = Object.values(kpi.missionsParType||{}).filter(v=>v>0).length;
  const bonusType = typesEff>=4?3:typesEff>=3?2:typesEff>=2?1:0;

  const accidents1an = kpi.accidents?.['1an']||0;
  const alertLevel = accidents1an>=3?'danger':accidents1an>=2?'warning':'ok';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      {/* Fenêtre grande mais avec marges visibles */}
      <div className={`${darkMode?'bg-gray-950':'bg-gray-50'} rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden`}
        style={{ maxWidth:'1400px', maxHeight:'calc(100vh - 2rem)' }}>

        {/* Header sticky */}
        <div className="flex-shrink-0 rounded-t-2xl" style={{ background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})` }}>
          <div className="flex items-center justify-between px-7 py-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white/30"
                style={{ backgroundColor: chauffeur.couleur }}>{chauffeur.initiales}</div>
              <div>
                <h2 className="text-xl font-bold text-white">{chauffeur.nom}</h2>
                <p className="text-white/70 text-sm mt-0.5">{chauffeur.direction} &nbsp;•&nbsp; Embauché le {new Date(chauffeur.dateEmbauche).toLocaleDateString('fr-FR')} &nbsp;•&nbsp; Permis {chauffeur.permis}</p>
              </div>
              {alertLevel==='danger' && <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 shadow"><i className="bi bi-exclamation-triangle-fill"></i>SUIVI URGENT</span>}
              {alertLevel==='warning' && <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold flex items-center gap-1.5 shadow"><i className="bi bi-eye-fill"></i>À SURVEILLER</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>exportDriverPDF(chauffeur)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-semibold border border-white/30 transition-all">
                <i className="bi bi-file-pdf-fill text-red-300"></i> Bilan PDF
              </button>
              <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/25 text-white border border-white/20 transition-all" title="Fermer">
                <i className="bi bi-x-lg text-lg"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-7 py-5">

          {/* Sélecteur période */}
          <div className="flex items-center gap-2 mb-5">
            <span className={`text-sm font-semibold ${darkMode?'text-gray-400':'text-gray-600'}`}>Période :</span>
            {Object.entries(pLabels).map(([key,label]) => (
              <button key={key} onClick={()=>setPeriod(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${period===key?'text-white shadow':'${darkMode?\'bg-gray-800 text-gray-400 hover:bg-gray-700\':\'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200\'}'}`}
                style={period===key?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>
                {label}
              </button>
            ))}
          </div>

          {/* Cards KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label:'Accidents',  value:kpi.accidents?.[period]||0,  icon:'bi-exclamation-octagon-fill', color:'#ef4444', bg:darkMode?'#450a0a':'#fee2e2' },
              { label:'Missions',   value:kpi.missions?.[period]||0,   icon:'bi-flag-fill',                color:'#3b82f6', bg:darkMode?'#1e3a5f':'#dbeafe' },
              { label:'Acc. Resp.', value:accRecentResp,               icon:'bi-shield-x-fill',            color:'#dc2626', bg:darkMode?'#450a0a':'#ffe4e6' },
              { label:'Kilométrage',value:`${(kpi.km||0).toLocaleString('fr-FR')} km`, icon:'bi-speedometer2', color:'#10b981', bg:darkMode?'#052e16':'#d1fae5' },
            ].map((card,i) => (
              <div key={i} className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl border p-4 flex items-center gap-3 shadow-sm`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor:card.bg }}>
                  <i className={card.icon} style={{ color:card.color, fontSize:'1.4rem' }}></i>
                </div>
                <div>
                  <p className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{card.label}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color:card.color }}>{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ligne 1 : Score + Accidents + Types missions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

            {/* Accidents par mois */}
            <ChartCard darkMode={darkMode}>
              <ChartTitle icon="bi-exclamation-octagon-fill" darkMode={darkMode}>Accidents par mois</ChartTitle>
              <div className="flex-1 flex flex-col justify-center">
                <AccidentLineChart data={kpi.accidentParMois||Array(12).fill(0)} animateCharts={animateCharts} darkMode={darkMode}/>
              </div>
              <div className={`mt-2 p-2 rounded-lg text-center ${darkMode?'bg-gray-800':'bg-gray-50'}`}>
                <span className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>Responsable : </span>
                <span className="text-xs font-bold text-red-500">{kpi.accidentParType?.responsable_1an||0}</span>
                <span className={`text-xs mx-2 ${darkMode?'text-gray-600':'text-gray-300'}`}>|</span>
                <span className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>Non-resp. : </span>
                <span className="text-xs font-bold text-green-500">{kpi.accidentParType?.non_responsable_1an||0}</span>
              </div>
            </ChartCard>

            {/* Types de missions */}
            <ChartCard darkMode={darkMode}>
              <ChartTitle icon="bi-pie-chart-fill" darkMode={darkMode}>Types de missions (1 an)</ChartTitle>
              <div className="flex-1 flex flex-col justify-center">
                <MissionsTypeChart missionsParType={kpi.missionsParType||{}} animateCharts={animateCharts} darkMode={darkMode}/>
              </div>
              <div className={`mt-3 flex items-center justify-between px-2 ${darkMode?'text-gray-400':'text-gray-500'}`}>
                <span className="text-[10px]">Total : <strong className={darkMode?'text-white':'text-gray-800'}>{kpi.missions?.['1an']||0} missions</strong></span>
                <span className="text-[10px]">{typesEff} type(s) effectué(s)</span>
              </div>
            </ChartCard>
          </div>

          {/* Ligne 2 : Missions par mois + Donut + Comparaison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

            {/* Missions bar chart */}
            <ChartCard darkMode={darkMode}>
              <ChartTitle icon="bi-flag-fill" darkMode={darkMode}>Missions réalisées (mensuel)</ChartTitle>
              <div className="flex-1 flex flex-col justify-center">
                <MiniBarChart data={kpi.missionsParMois||Array(12).fill(0)} color="#3b82f6" animateCharts={animateCharts} darkMode={darkMode}/>
              </div>
              <LegendRow items={[{label:'Missions',color:'#3b82f6'}]} darkMode={darkMode}/>
            </ChartCard>

         
            {/* Comparaison périodes */}
            <ChartCard darkMode={darkMode}>
              <ChartTitle icon="bi-bar-chart-steps" darkMode={darkMode}>Comparaison par période</ChartTitle>
              <div className="flex-1 flex flex-col justify-center gap-2">
                {[
                  { label:'3 mois', acc:kpi.accidents?.['3m']||0,  miss:kpi.missions?.['3m']||0  },
                  { label:'6 mois', acc:kpi.accidents?.['6m']||0,  miss:kpi.missions?.['6m']||0  },
                  { label:'1 an',   acc:kpi.accidents?.['1an']||0, miss:kpi.missions?.['1an']||0 },
                  { label:'Total',  acc:kpi.accidents?.['all']||0, miss:kpi.missions?.['all']||0 },
                ].map((row,i) => (
                  <div key={i} className={`${darkMode?'bg-gray-800':'bg-gray-50'} rounded-lg px-4 py-2 flex items-center gap-4`}>
                    <span className={`text-xs font-bold w-12 ${darkMode?'text-gray-300':'text-gray-700'}`}>{row.label}</span>
                    <div className="flex-1 flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className={`text-[10px] ${darkMode?'text-gray-400':'text-gray-500'}`}>Acc :</span>
                        <span className="text-xs font-bold text-red-500">{row.acc}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className={`text-[10px] ${darkMode?'text-gray-400':'text-gray-500'}`}>Miss :</span>
                        <span className="text-xs font-bold text-blue-500">{row.miss}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Tableau mensuel */}
          <div className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden mb-4`}>
            <div className={`px-5 py-3 border-b ${darkMode?'border-gray-800':'border-gray-100'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode?'text-white':'text-gray-900'}`}>
                <i className="bi bi-calendar3 text-blue-500"></i> Détail mensuel
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})` }}>
                  <tr>
                    {['Indicateur','Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc','Total'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-center text-xs font-semibold text-white">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label:'Accidents', data:kpi.accidentParMois||Array(12).fill(0), color:'#ef4444', bg:darkMode?'#450a0a15':'#fef2f2' },
                    { label:'Missions',  data:kpi.missionsParMois||Array(12).fill(0), color:'#3b82f6', bg:darkMode?'#1e3a5f15':'#eff6ff' },
                  ].map((row,i) => (
                    <tr key={i} style={{ backgroundColor:row.bg }}>
                      <td className="px-3 py-2.5 text-xs font-bold" style={{ color:row.color }}>{row.label}</td>
                      {row.data.map((v,j) => (
                        <td key={j} className="px-3 py-2.5 text-center text-xs font-semibold"
                          style={{ color:v>0?row.color:darkMode?'#4b5563':'#9ca3af' }}>{v}</td>
                      ))}
                      <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color:row.color }}>
                        {row.data.reduce((a,b)=>a+b,0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>{/* fin scrollable */}
      </div>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

const Chauffeurs = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try { const s=localStorage.getItem('fleetify_darkMode'); return s!==null?s==='true':true; } catch { return true; }
  });
  useEffect(()=>{ try { localStorage.setItem('fleetify_darkMode',String(darkMode)); } catch {} },[darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('chauffeurs');
  const [animateCharts, setAnimateCharts] = useState(false);

  const [chauffeurs, setChauffeurs] = useState(mockChauffeurs);
  const [filteredChauffeurs, setFilteredChauffeurs] = useState(mockChauffeurs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [documents, setDocuments] = useState(mockDocuments);
  const [filteredDocuments, setFilteredDocuments] = useState(mockDocuments);
  const [searchDocTerm, setSearchDocTerm] = useState('');
  const [filterTypeDoc, setFilterTypeDoc] = useState('all');
  const [filterStatutDoc, setFilterStatutDoc] = useState('all');
  const [currentDocPage, setCurrentDocPage] = useState(1);
  const [showDocFilterMenu, setShowDocFilterMenu] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalMode, setDocModalMode] = useState('add');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('chauffeur');
  const [kpiChauffeur, setKpiChauffeur] = useState(null);

  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(()=>{ const id2=requestAnimationFrame(()=>setAnimateCharts(true)); return ()=>cancelAnimationFrame(id2); });
    return ()=>cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let f = chauffeurs;
    if (searchTerm) f = f.filter(c=>c.nom.toLowerCase().includes(searchTerm.toLowerCase())||c.email.toLowerCase().includes(searchTerm.toLowerCase())||c.telephone.includes(searchTerm));
    if (filterDirection!=='all') f = f.filter(c=>c.direction===filterDirection);
    if (filterStatus!=='all') f = f.filter(c=>c.statut===filterStatus);
    setFilteredChauffeurs(f); setCurrentPage(1);
  }, [searchTerm,filterDirection,filterStatus,chauffeurs]);

  useEffect(() => {
    let f = documents;
    if (searchDocTerm) f = f.filter(d=>d.chauffeurNom.toLowerCase().includes(searchDocTerm.toLowerCase())||d.numeroPermis.toLowerCase().includes(searchDocTerm.toLowerCase()));
    if (filterTypeDoc!=='all') f = f.filter(d=>d.typeDocument===filterTypeDoc);
    if (filterStatutDoc!=='all') f = f.filter(d=>d.statut===filterStatutDoc);
    setFilteredDocuments(f); setCurrentDocPage(1);
  }, [searchDocTerm,filterTypeDoc,filterStatutDoc,documents]);

  const currentChauffeurs = filteredChauffeurs.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
  const currentDocuments  = filteredDocuments.slice((currentDocPage-1)*itemsPerPage, currentDocPage*itemsPerPage);

  const handleAddChauffeur = () => { setModalMode('add'); setSelectedChauffeur({nom:'',email:'',telephone:'',direction:'Dir. Générale',statut:'actif',dateEmbauche:'',permis:''}); setShowModal(true); };
  const handleEditChauffeur = (c) => { setModalMode('edit'); setSelectedChauffeur({...c}); setShowModal(true); setShowActionMenu(null); };
  const handleViewChauffeur = (c) => { setModalMode('view'); setSelectedChauffeur(c); setShowModal(true); setShowActionMenu(null); };
  const handleSaveChauffeur = () => {
    if (modalMode==='add') { const n={...selectedChauffeur,id:chauffeurs.length+1,initiales:selectedChauffeur.nom.split(' ').map(x=>x[0]).join('').toUpperCase(),couleur:'#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}; setChauffeurs([...chauffeurs,n]); }
    else if (modalMode==='edit') setChauffeurs(chauffeurs.map(c=>c.id===selectedChauffeur.id?selectedChauffeur:c));
    setShowModal(false); setSelectedChauffeur(null);
  };
  const handleDeleteChauffeur = (c) => { setItemToDelete(c); setDeleteType('chauffeur'); setShowDeleteModal(true); setShowActionMenu(null); };
  const confirmDelete = () => {
    if (deleteType==='chauffeur') setChauffeurs(chauffeurs.filter(c=>c.id!==itemToDelete.id));
    else setDocuments(documents.filter(d=>d.id!==itemToDelete.id));
    setShowDeleteModal(false); setItemToDelete(null);
  };
  const handleAddDocument    = () => { setDocModalMode('add'); setSelectedDocument({chauffeurId:'',chauffeurNom:'',typeDocument:'Permis de conduire',numeroPermis:'',categoriesPermis:'',dateDelivrance:'',dateExpiration:'',statut:'valide'}); setShowDocModal(true); };
  const handleEditDocument   = (d) => { setDocModalMode('edit'); setSelectedDocument({...d}); setShowDocModal(true); setShowActionMenu(null); };
  const handleViewDocument   = (d) => { setDocModalMode('view'); setSelectedDocument(d); setShowDocModal(true); setShowActionMenu(null); };
  const handleSaveDocument   = () => {
    if (docModalMode==='add') setDocuments([...documents,{...selectedDocument,id:documents.length+1}]);
    else if (docModalMode==='edit') setDocuments(documents.map(d=>d.id===selectedDocument.id?selectedDocument:d));
    setShowDocModal(false); setSelectedDocument(null);
  };
  const handleDeleteDocument = (d) => { setItemToDelete(d); setDeleteType('document'); setShowDeleteModal(true); setShowActionMenu(null); };

  const getStats = () => activeTab==='chauffeurs'
    ? [
        {title:'Total Chauffeurs',value:chauffeurs.length,subtitle:'enregistrés',icon:'bi-people-fill',iconBg:'bg-blue-100',textColor:'text-blue-600'},
        {title:'Actifs',value:chauffeurs.filter(c=>c.statut==='actif').length,subtitle:'chauffeurs actifs',icon:'bi-check-circle-fill',iconBg:'bg-green-100',textColor:'text-green-600'},
        {title:'Inactifs',value:chauffeurs.filter(c=>c.statut==='inactif').length,subtitle:'chauffeurs inactifs',icon:'bi-x-circle-fill',iconBg:'bg-red-100',textColor:'text-red-600'},
        {title:'À surveiller',value:Object.values(mockKPIData).filter(k=>k.accidents?.['1an']>=2).length,subtitle:'≥ 2 accidents/an',icon:'bi-exclamation-triangle-fill',iconBg:'bg-yellow-100',textColor:'text-yellow-600'},
      ]
    : [
        {title:'Total Documents',value:documents.length,subtitle:'enregistrés',icon:'bi-file-earmark-text-fill',iconBg:'bg-blue-100',textColor:'text-blue-600'},
        {title:'Valides',value:documents.filter(d=>d.statut==='valide').length,subtitle:'documents valides',icon:'bi-check-circle-fill',iconBg:'bg-green-100',textColor:'text-green-600'},
        {title:'Expire bientôt',value:documents.filter(d=>d.statut==='expire_bientot').length,subtitle:'à renouveler',icon:'bi-exclamation-triangle-fill',iconBg:'bg-yellow-100',textColor:'text-yellow-600'},
        {title:'Permis',value:documents.filter(d=>d.typeDocument==='Permis de conduire').length,subtitle:'permis enregistrés',icon:'bi-credit-card-fill',iconBg:'bg-purple-100',textColor:'text-purple-600'},
      ];

  const rowBg = (i) => i%2===0 ? (darkMode?'#1a2535':'#eef2ff') : (darkMode?'#1c1f2b':'#f3f4f6');

  return (
    <div className={`${darkMode?'bg-gray-950':'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate}/>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} showNotifications={showNotifications} setShowNotifications={setShowNotifications} showProfile={showProfile} setShowProfile={setShowProfile}/>

      <main className="transition-all duration-300 pt-24 px-6 pb-6" style={{ marginLeft:sidebarCollapsed?'5rem':'18rem' }}>

        {/* Tabs */}
        <div className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl border shadow-sm mb-6 p-2`}>
          <div className="flex gap-2">
            {[
              {key:'chauffeurs',label:'Chauffeurs',icon:'bi-people-fill',count:chauffeurs.length},
              {key:'documents', label:'Documents', icon:'bi-file-earmark-text-fill',count:documents.length},
              {key:'kpi',       label:'KPI & Performance',icon:'bi-graph-up-arrow',count:null},
            ].map(tab => (
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab===tab.key?'text-white shadow-md':darkMode?'text-gray-400 hover:bg-gray-800':'text-gray-600 hover:bg-gray-50'}`}
                style={activeTab===tab.key?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>
                <i className={`${tab.icon} text-xl`}></i>
                <span>{tab.label}</span>
                {tab.count!==null && <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab===tab.key?'bg-white/20':darkMode?'bg-gray-800':'bg-gray-100'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Stats cards */}
        {activeTab!=='kpi' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {getStats().map((card,idx) => (
              <div key={idx} className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode?'text-gray-400':'text-gray-600'} mb-1`}>{card.title}</p>
                    <h3 className={`text-3xl font-bold ${darkMode?'text-white':'text-gray-900'} mb-1`}>{card.value}</h3>
                    <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-500'}`}>{card.subtitle}</p>
                  </div>
                  <div className={`${card.iconBg} ${card.textColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                    <i className={card.icon} style={{fontSize:'1.5rem'}}></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Onglet KPI ── */}
        {activeTab==='kpi' && (
          <div>
            {/* Métriques globales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[
                {label:'Score moyen',         value:Math.round(Object.values(mockKPIData).reduce((a,k)=>a+k.score,0)/Object.values(mockKPIData).length), unit:'/100', color:'#3b82f6', icon:'bi-award-fill'},
                {label:'Total accidents (1an)',value:Object.values(mockKPIData).reduce((a,k)=>a+(k.accidents?.['1an']||0),0),                           unit:'',     color:'#ef4444', icon:'bi-exclamation-octagon-fill'},
                {label:'Total missions (1an)', value:Object.values(mockKPIData).reduce((a,k)=>a+(k.missions?.['1an']||0),0),                            unit:'',     color:'#10b981', icon:'bi-flag-fill'},
                {label:'Acc. responsables (1an)',value:Object.values(mockKPIData).reduce((a,k)=>a+(k.accidentParType?.responsable_1an||0),0),            unit:'',     color:'#dc2626', icon:'bi-shield-x-fill'},
              ].map((card,i) => (
                <div key={i} className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-500'}`}>{card.label}</p>
                      <p className="text-3xl font-bold mt-1" style={{color:card.color}}>{card.value}<span className="text-base font-normal">{card.unit}</span></p>
                    </div>
                    <i className={`${card.icon} text-3xl`} style={{color:card.color,opacity:.3}}></i>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Classement */}
              <div className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}>
                <h3 className={`text-base font-bold mb-4 ${darkMode?'text-white':'text-gray-900'} flex items-center gap-2`}>
                  <i className="bi bi-trophy-fill text-yellow-500"></i> Classement Performance
                </h3>
                <div className="space-y-2">
                  {mockChauffeurs.map(c=>({...c,score:mockKPIData[c.id]?.score||0})).sort((a,b)=>b.score-a.score).map((c,i) => {
                    const color = getScoreColor(c.score);
                    return (
                      <div key={c.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${darkMode?'hover:bg-gray-800':'hover:bg-gray-50'}`} onClick={()=>setKpiChauffeur(c)}>
                        <span className={`w-6 text-center text-sm font-bold ${i<3?'text-yellow-500':darkMode?'text-gray-500':'text-gray-400'}`}>{i+1}</span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:c.couleur}}>{c.initiales}</div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${darkMode?'text-white':'text-gray-800'}`}>{c.nom}</p>
                          <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>{c.direction}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-2 rounded-full transition-all duration-700" style={{width:`${animateCharts?c.score:0}%`,backgroundColor:color}}></div>
                          </div>
                          <span className="text-sm font-bold w-8 text-right" style={{color}}>{c.score}</span>
                        </div>
                        <button onClick={e=>{e.stopPropagation();setKpiChauffeur(c);}}
                          className={`px-2 py-1 rounded text-xs ${darkMode?'bg-gray-700 text-gray-300 hover:bg-gray-600':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          <i className="bi bi-graph-up"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alertes */}
              <div className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}>
                <h3 className={`text-base font-bold mb-4 ${darkMode?'text-white':'text-gray-900'} flex items-center gap-2`}>
                  <i className="bi bi-exclamation-triangle-fill text-red-500"></i> Alertes & Suivis
                </h3>
                <div className="space-y-3 mb-4">
                  {mockChauffeurs.filter(c=>(mockKPIData[c.id]?.accidents?.['1an']||0)>=2||(mockKPIData[c.id]?.score||100)<70).map(c => {
                    const kpi = mockKPIData[c.id]||{};
                    const isDanger = (kpi.accidents?.['1an']||0)>=3;
                    return (
                      <div key={c.id} className={`p-3 rounded-lg border-l-4 cursor-pointer ${isDanger?'border-red-500 bg-red-50 dark:bg-red-900/20':'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'}`} onClick={()=>setKpiChauffeur(c)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor:c.couleur}}>{c.initiales}</div>
                            <div>
                              <p className={`text-sm font-semibold ${darkMode?'text-white':'text-gray-800'}`}>{c.nom}</p>
                              <p className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{kpi.accidents?.['1an']} accident(s) • Score {kpi.score}/100</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDanger?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{isDanger?'URGENT':'Attention'}</span>
                        </div>
                      </div>
                    );
                  })}
                  {mockChauffeurs.filter(c=>(mockKPIData[c.id]?.accidents?.['1an']||0)>=2||(mockKPIData[c.id]?.score||100)<70).length===0 && (
                    <div className="flex items-center gap-3 text-green-500 py-6 justify-center">
                      <i className="bi bi-check-circle-fill text-2xl"></i>
                      <span className="font-medium">Aucune alerte active</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex gap-2">
                  <button onClick={()=>exportPDF(chauffeurs)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 transition-colors">
                    <i className="bi bi-file-pdf-fill"></i> Rapport PDF
                  </button>
                  <button onClick={()=>exportAlertesExcel(chauffeurs)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-100 transition-colors">
                    <i className="bi bi-file-earmark-excel-fill"></i> Export Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Charts globaux */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <ChartCard darkMode={darkMode}>
                <ChartTitle icon="bi-exclamation-octagon-fill" darkMode={darkMode}>Accidents / chauffeur (1 an)</ChartTitle>
                <div className="flex-1 flex flex-col justify-center gap-1.5 py-2">
                  {mockChauffeurs.slice(0,8).map(c => {
                    const acc = mockKPIData[c.id]?.accidents?.['1an']||0;
                    return (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className={`text-[10px] w-20 truncate ${darkMode?'text-gray-400':'text-gray-500'}`}>{c.nom.split(' ')[0]}</span>
                        <div className={`flex-1 h-3 rounded-full ${darkMode?'bg-gray-800':'bg-gray-100'}`}>
                          <div className="h-3 rounded-full transition-all duration-700" style={{width:`${animateCharts?(acc/4)*100:0}%`,backgroundColor:acc>2?'#ef4444':acc>0?'#f59e0b':'#10b981'}}></div>
                        </div>
                        <span className="text-[11px] font-bold w-4 text-right" style={{color:acc>2?'#ef4444':acc>0?'#f59e0b':'#10b981'}}>{acc}</span>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>

              <ChartCard darkMode={darkMode}>
                <ChartTitle icon="bi-flag-fill" darkMode={darkMode}>Missions / chauffeur (1 an)</ChartTitle>
                <div className="flex-1 flex flex-col justify-center gap-1.5 py-2">
                  {mockChauffeurs.slice(0,8).map(c => {
                    const m = mockKPIData[c.id]?.missions?.['1an']||0;
                    return (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className={`text-[10px] w-20 truncate ${darkMode?'text-gray-400':'text-gray-500'}`}>{c.nom.split(' ')[0]}</span>
                        <div className={`flex-1 h-3 rounded-full ${darkMode?'bg-gray-800':'bg-gray-100'}`}>
                          <div className="h-3 rounded-full transition-all duration-700" style={{width:`${animateCharts?(m/90)*100:0}%`,backgroundColor:'#3b82f6'}}></div>
                        </div>
                        <span className={`text-[11px] font-bold w-6 text-right ${darkMode?'text-blue-400':'text-blue-600'}`}>{m}</span>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>

              <ChartCard darkMode={darkMode}>
                <ChartTitle icon="bi-award-fill" darkMode={darkMode}>Score performance global</ChartTitle>
                <div className="flex-1 flex flex-col justify-center gap-1.5 py-2">
                  {mockChauffeurs.map(c => {
                    const s = mockKPIData[c.id]?.score||0;
                    return (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className={`text-[10px] w-20 truncate ${darkMode?'text-gray-400':'text-gray-500'}`}>{c.nom.split(' ')[0]}</span>
                        <div className={`flex-1 h-3 rounded-full ${darkMode?'bg-gray-800':'bg-gray-100'}`}>
                          <div className="h-3 rounded-full transition-all duration-700" style={{width:`${animateCharts?s:0}%`,backgroundColor:getScoreColor(s)}}></div>
                        </div>
                        <span className="text-[11px] font-bold w-8 text-right" style={{color:getScoreColor(s)}}>{s}</span>
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </div>
          </div>
        )}

        {/* ── Tableau Chauffeurs ── */}
        {activeTab==='chauffeurs' && (
          <div className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
            <div className={`p-6 border-b ${darkMode?'border-gray-800':'border-gray-100'}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className={`text-lg font-bold ${darkMode?'text-white':'text-gray-900'}`}>Liste des Chauffeurs</h3>
                  <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{filteredChauffeurs.length} chauffeur(s)</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                      className={`pl-10 pr-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-white placeholder-gray-400':'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none w-56`}/>
                  </div>
                  <div className="relative">
                    <button onClick={()=>setShowFilterMenu(!showFilterMenu)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-gray-300':'bg-white border-gray-200 text-gray-700'}`}>
                      <i className="bi bi-funnel"></i><span className="text-sm font-medium">Filtres</span>
                    </button>
                    {showFilterMenu && (
                      <div className={`absolute right-0 mt-2 w-60 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 p-4`}>
                        <div className="mb-3">
                          <label className={`text-xs font-semibold ${darkMode?'text-gray-400':'text-gray-600'} mb-1.5 block`}>Direction</label>
                          <select value={filterDirection} onChange={e=>setFilterDirection(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-900'} text-sm`}>
                            <option value="all">Toutes</option>
                            {['Dir. Générale','Dir. Technique','Transport Fonds','Dir. Commerciale'].map(d=><option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs font-semibold ${darkMode?'text-gray-400':'text-gray-600'} mb-1.5 block`}>Statut</label>
                          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-900'} text-sm`}>
                            <option value="all">Tous</option>
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={()=>exportPDF(filteredChauffeurs)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-gray-300':'bg-white border-gray-200 text-gray-700'}`}>
                    <i className="bi bi-file-pdf-fill text-red-500"></i><span className="text-sm font-medium">PDF</span>
                  </button>
                  <button onClick={()=>exportCSV(filteredChauffeurs,'chauffeurs.csv')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-gray-300':'bg-white border-gray-200 text-gray-700'}`}>
                    <i className="bi bi-file-spreadsheet-fill text-green-500"></i><span className="text-sm font-medium">CSV</span>
                  </button>
                  <button onClick={handleAddChauffeur} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-md hover:opacity-90"
                    style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
                    <i className="bi bi-plus-lg"></i><span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
                  <tr>{['Chauffeur','Contact','Direction','Permis','Score','Statut','Actions'].map(h=><th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {currentChauffeurs.map((chauffeur,index) => {
                    const kpi = mockKPIData[chauffeur.id]||{};
                    const score = kpi.score||0;
                    const scoreColor = getScoreColor(score);
                    const hasAlert = (kpi.accidents?.['1an']||0)>=2;
                    return (
                      <tr key={chauffeur.id}
                        style={{backgroundColor:rowBg(index),borderBottom:darkMode?'1px solid #1e293b':'1px solid #e5e7eb',transition:'background-color 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.backgroundColor=darkMode?`${theme.primary}30`:`${theme.primary}18`}
                        onMouseLeave={e=>e.currentTarget.style.backgroundColor=rowBg(index)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor:chauffeur.couleur}}>{chauffeur.initiales}</div>
                              {hasAlert && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></div>}
                            </div>
                            <div>
                              <p className={`font-semibold ${darkMode?'text-white':'text-gray-900'}`}>{chauffeur.nom}</p>
                              <p className={`text-xs ${darkMode?'text-gray-400':'text-gray-600'}`}>Embauché le {new Date(chauffeur.dateEmbauche).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className={`text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{chauffeur.email}</p>
                          <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-600'}`}>{chauffeur.telephone}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{chauffeur.direction}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${darkMode?'bg-blue-900/30 text-blue-400':'bg-blue-100 text-blue-800'}`}>{chauffeur.permis}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-16 h-1.5 rounded-full ${darkMode?'bg-gray-700':'bg-gray-200'}`}>
                              <div className="h-1.5 rounded-full" style={{width:`${score}%`,backgroundColor:scoreColor}}></div>
                            </div>
                            <span className="text-xs font-bold" style={{color:scoreColor}}>{score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${chauffeur.statut==='actif'?'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400':'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {chauffeur.statut==='actif'?'Actif':'Inactif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative flex items-center gap-1">
                            <button onClick={()=>setKpiChauffeur(chauffeur)} className={`p-2 rounded-lg ${darkMode?'hover:bg-gray-700':'hover:bg-gray-100'} transition-colors`} title="Voir KPI">
                              <i className={`bi bi-graph-up ${darkMode?'text-blue-400':'text-blue-600'}`}></i>
                            </button>
                            <button onClick={()=>setShowActionMenu(showActionMenu===chauffeur.id?null:chauffeur.id)} className={`p-2 rounded-lg ${darkMode?'hover:bg-gray-700':'hover:bg-gray-100'} transition-colors`}>
                              <i className={`bi bi-three-dots-vertical ${darkMode?'text-gray-400':'text-gray-600'}`}></i>
                            </button>
                            {showActionMenu===chauffeur.id && (
                              <div className={`absolute right-0 mt-2 w-52 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 top-full`}>
                                <button onClick={()=>handleViewChauffeur(chauffeur)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-eye-fill text-blue-500"></i>Voir détails</button>
                                <button onClick={()=>handleEditChauffeur(chauffeur)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-pencil-fill text-yellow-500"></i>Modifier</button>
                                <button onClick={()=>{setKpiChauffeur(chauffeur);setShowActionMenu(null);}} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-graph-up text-blue-400"></i>Voir KPI</button>
                                <button onClick={()=>exportDriverPDF(chauffeur)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-file-pdf-fill text-red-500"></i>Bilan PDF</button>
                                <button onClick={()=>handleDeleteChauffeur(chauffeur)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-red-400 hover:bg-gray-700':'text-red-600 hover:bg-gray-50'}`}><i className="bi bi-trash-fill"></i>Supprimer</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className={`px-6 py-4 border-t ${darkMode?'border-gray-800':'border-gray-100'}`}>
              <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>Affichage de {currentChauffeurs.length} / {filteredChauffeurs.length} chauffeurs</p>
            </div>
          </div>
        )}

        {/* ── Tableau Documents ── */}
        {activeTab==='documents' && (
          <div className={`${darkMode?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
            <div className={`p-6 border-b ${darkMode?'border-gray-800':'border-gray-100'}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className={`text-lg font-bold ${darkMode?'text-white':'text-gray-900'}`}>Liste des Documents</h3>
                  <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{filteredDocuments.length} document(s)</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" placeholder="Rechercher..." value={searchDocTerm} onChange={e=>setSearchDocTerm(e.target.value)}
                      className={`pl-10 pr-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-white placeholder-gray-400':'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none w-56`}/>
                  </div>
                  <div className="relative">
                    <button onClick={()=>setShowDocFilterMenu(!showDocFilterMenu)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-gray-300':'bg-white border-gray-200 text-gray-700'}`}>
                      <i className="bi bi-funnel"></i><span className="text-sm font-medium">Filtres</span>
                    </button>
                    {showDocFilterMenu && (
                      <div className={`absolute right-0 mt-2 w-60 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 p-4`}>
                        <div className="mb-3">
                          <label className={`text-xs font-semibold ${darkMode?'text-gray-400':'text-gray-600'} mb-1.5 block`}>Type</label>
                          <select value={filterTypeDoc} onChange={e=>setFilterTypeDoc(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-900'} text-sm`}>
                            <option value="all">Tous</option>
                            <option value="Permis de conduire">Permis de conduire</option>
                            <option value="Certificat médical">Certificat médical</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs font-semibold ${darkMode?'text-gray-400':'text-gray-600'} mb-1.5 block`}>Statut</label>
                          <select value={filterStatutDoc} onChange={e=>setFilterStatutDoc(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${darkMode?'bg-gray-900 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-900'} text-sm`}>
                            <option value="all">Tous</option>
                            <option value="valide">Valide</option>
                            <option value="expire_bientot">Expire bientôt</option>
                            <option value="expire">Expiré</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={handleAddDocument} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-md hover:opacity-90"
                    style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
                    <i className="bi bi-plus-lg"></i><span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
                  <tr>{['Chauffeur','Type','N° Document','Catégories','Expiration','Statut','Actions'].map(h=><th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {currentDocuments.map((doc,index) => (
                    <tr key={doc.id}
                      style={{backgroundColor:rowBg(index),borderBottom:darkMode?'1px solid #1e293b':'1px solid #e5e7eb',transition:'background-color 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.backgroundColor=darkMode?`${theme.primary}30`:`${theme.primary}18`}
                      onMouseLeave={e=>e.currentTarget.style.backgroundColor=rowBg(index)}>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`font-semibold ${darkMode?'text-white':'text-gray-900'}`}>{doc.chauffeurNom}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <i className={`bi ${doc.typeDocument==='Permis de conduire'?'bi-credit-card text-blue-500':'bi-file-medical text-green-500'}`}></i>
                          <span className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{doc.typeDocument}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{doc.numeroPermis}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{doc.categoriesPermis}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>{new Date(doc.dateExpiration).toLocaleDateString('fr-FR')}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${doc.statut==='valide'?'bg-green-100 text-green-800':doc.statut==='expire_bientot'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`}>
                          {doc.statut==='valide'?'Valide':doc.statut==='expire_bientot'?'Expire bientôt':'Expiré'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button onClick={()=>setShowActionMenu(showActionMenu===`doc-${doc.id}`?null:`doc-${doc.id}`)} className={`p-2 rounded-lg ${darkMode?'hover:bg-gray-700':'hover:bg-gray-100'} transition-colors`}>
                            <i className={`bi bi-three-dots-vertical ${darkMode?'text-gray-400':'text-gray-600'}`}></i>
                          </button>
                          {showActionMenu===`doc-${doc.id}` && (
                            <div className={`absolute right-0 mt-2 w-48 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} border rounded-lg shadow-xl z-50`}>
                              <button onClick={()=>handleViewDocument(doc)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-eye-fill text-blue-500"></i>Voir détails</button>
                              <button onClick={()=>handleEditDocument(doc)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-pencil-fill text-yellow-500"></i>Modifier</button>
                              <button className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-download text-green-500"></i>Télécharger</button>
                              <button onClick={()=>handleDeleteDocument(doc)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-red-400 hover:bg-gray-700':'text-red-600 hover:bg-gray-50'}`}><i className="bi bi-trash-fill"></i>Supprimer</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={`px-6 py-4 border-t ${darkMode?'border-gray-800':'border-gray-100'}`}>
              <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>Affichage de {currentDocuments.length} / {filteredDocuments.length} documents</p>
            </div>
          </div>
        )}

        {/* ── Modal Chauffeur ── */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode?'bg-gray-900':'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className={`p-6 border-b ${darkMode?'border-gray-800':'border-gray-200'} flex items-center justify-between`}>
                <h3 className={`text-xl font-bold ${darkMode?'text-white':'text-gray-900'}`}>{modalMode==='add'?'Ajouter un chauffeur':modalMode==='edit'?'Modifier':'Détails'}</h3>
                <button onClick={()=>setShowModal(false)} className={`p-2 rounded-lg ${darkMode?'hover:bg-gray-800':'hover:bg-gray-100'}`}><i className={`bi bi-x-lg ${darkMode?'text-gray-400':'text-gray-600'}`}></i></button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {label:'Nom complet',key:'nom',type:'text',ph:'Jean Dupont'},
                  {label:'Email',key:'email',type:'email',ph:'jean@sgs-gabon.com'},
                  {label:'Téléphone',key:'telephone',type:'tel',ph:'+241 06 12 34 56'},
                  {label:"Date d'embauche",key:'dateEmbauche',type:'date',ph:''},
                  {label:'Catégories permis',key:'permis',type:'text',ph:'B, C, E'},
                ].map(f => (
                  <div key={f.key}>
                    <label className={`block text-sm font-medium ${darkMode?'text-gray-300':'text-gray-700'} mb-2`}>{f.label} <span className="text-red-500">*</span></label>
                    <input type={f.type} value={selectedChauffeur?.[f.key]||''} placeholder={f.ph} disabled={modalMode==='view'}
                      onChange={e=>setSelectedChauffeur({...selectedChauffeur,[f.key]:e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-300 text-gray-900'} focus:outline-none disabled:opacity-50`}/>
                  </div>
                ))}
                <div>
                  <label className={`block text-sm font-medium ${darkMode?'text-gray-300':'text-gray-700'} mb-2`}>Direction <span className="text-red-500">*</span></label>
                  <select value={selectedChauffeur?.direction||''} disabled={modalMode==='view'} onChange={e=>setSelectedChauffeur({...selectedChauffeur,direction:e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-300 text-gray-900'} focus:outline-none disabled:opacity-50`}>
                    <option value="">Sélectionner</option>
                    {['Dir. Générale','Dir. Technique','Transport Fonds','Dir. Commerciale'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${darkMode?'text-gray-300':'text-gray-700'} mb-2`}>Statut</label>
                  <select value={selectedChauffeur?.statut||''} disabled={modalMode==='view'} onChange={e=>setSelectedChauffeur({...selectedChauffeur,statut:e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-300 text-gray-900'} focus:outline-none disabled:opacity-50`}>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
              <div className={`p-6 border-t ${darkMode?'border-gray-800':'border-gray-200'} flex justify-end gap-3`}>
                <button onClick={()=>setShowModal(false)} className={`px-6 py-2 rounded-lg border ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{modalMode==='view'?'Fermer':'Annuler'}</button>
                {modalMode!=='view' && <button onClick={handleSaveChauffeur} className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90" style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>{modalMode==='add'?'Ajouter':'Modifier'}</button>}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Document ── */}
        {showDocModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode?'bg-gray-900':'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className={`p-6 border-b ${darkMode?'border-gray-800':'border-gray-200'} flex items-center justify-between`}>
                <h3 className={`text-xl font-bold ${darkMode?'text-white':'text-gray-900'}`}>{docModalMode==='add'?'Ajouter':docModalMode==='edit'?'Modifier':'Détails'}</h3>
                <button onClick={()=>setShowDocModal(false)} className={`p-2 rounded-lg ${darkMode?'hover:bg-gray-800':'hover:bg-gray-100'}`}><i className={`bi bi-x-lg ${darkMode?'text-gray-400':'text-gray-600'}`}></i></button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${darkMode?'text-gray-300':'text-gray-700'} mb-2`}>Chauffeur <span className="text-red-500">*</span></label>
                  <select value={selectedDocument?.chauffeurId||''} disabled={docModalMode==='view'}
                    onChange={e=>{const c=chauffeurs.find(x=>x.id===parseInt(e.target.value));setSelectedDocument({...selectedDocument,chauffeurId:parseInt(e.target.value),chauffeurNom:c?.nom||''});}}
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-300 text-gray-900'} focus:outline-none disabled:opacity-50`}>
                    <option value="">Sélectionner</option>
                    {chauffeurs.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                {[
                  {label:'N° document',key:'numeroPermis',type:'text',ph:'PC123456'},
                  {label:'Catégories',key:'categoriesPermis',type:'text',ph:'B, C'},
                  {label:'Date délivrance',key:'dateDelivrance',type:'date',ph:''},
                  {label:'Date expiration',key:'dateExpiration',type:'date',ph:''},
                ].map(f=>(
                  <div key={f.key}>
                    <label className={`block text-sm font-medium ${darkMode?'text-gray-300':'text-gray-700'} mb-2`}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} value={selectedDocument?.[f.key]||''} disabled={docModalMode==='view'} onChange={e=>setSelectedDocument({...selectedDocument,[f.key]:e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-300 text-gray-900'} focus:outline-none disabled:opacity-50`}/>
                  </div>
                ))}
                <div>
                  <label className={`block text-sm font-medium ${darkMode?'text-gray-300':'text-gray-700'} mb-2`}>Type</label>
                  <select value={selectedDocument?.typeDocument||''} disabled={docModalMode==='view'} onChange={e=>setSelectedDocument({...selectedDocument,typeDocument:e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-300 text-gray-900'} focus:outline-none disabled:opacity-50`}>
                    <option value="Permis de conduire">Permis de conduire</option>
                    <option value="Certificat médical">Certificat médical</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${darkMode?'text-gray-300':'text-gray-700'} mb-2`}>Fichier</label>
                  <input type="file" disabled={docModalMode==='view'} className={`w-full px-4 py-2 rounded-lg border ${darkMode?'bg-gray-800 border-gray-700 text-white':'bg-white border-gray-300 text-gray-900'} focus:outline-none disabled:opacity-50`}/>
                </div>
              </div>
              <div className={`p-6 border-t ${darkMode?'border-gray-800':'border-gray-200'} flex justify-end gap-3`}>
                <button onClick={()=>setShowDocModal(false)} className={`px-6 py-2 rounded-lg border ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{docModalMode==='view'?'Fermer':'Annuler'}</button>
                {docModalMode!=='view' && <button onClick={handleSaveDocument} className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90" style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>{docModalMode==='add'?'Ajouter':'Modifier'}</button>}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Suppression ── */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode?'bg-gray-900':'bg-white'} rounded-xl shadow-2xl max-w-md w-full`}>
              <div className={`p-6 border-b ${darkMode?'border-gray-800':'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><i className="bi bi-exclamation-triangle-fill text-2xl text-red-600"></i></div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode?'text-white':'text-gray-900'}`}>Confirmer la suppression</h3>
                    <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'} mt-1`}>Cette action est irréversible</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className={darkMode?'text-gray-300':'text-gray-700'}>Supprimer {deleteType==='chauffeur'?'ce chauffeur':'ce document'} ?
                  {deleteType==='chauffeur'&&itemToDelete&&<span className="block mt-2 font-semibold">{itemToDelete.nom}</span>}
                </p>
              </div>
              <div className={`p-6 border-t ${darkMode?'border-gray-800':'border-gray-200'} flex justify-end gap-3`}>
                <button onClick={()=>setShowDeleteModal(false)} className={`px-6 py-2 rounded-lg border ${darkMode?'border-gray-700 text-gray-300 hover:bg-gray-800':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Annuler</button>
                <button onClick={confirmDelete} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">Supprimer</button>
              </div>
            </div>
          </div>
        )}

        {/* ── KPI Panel plein écran ── */}
        {kpiChauffeur && (
          <KPIPanel chauffeur={kpiChauffeur} darkMode={darkMode} theme={theme} animateCharts={animateCharts} onClose={()=>setKpiChauffeur(null)}/>
        )}

        {/* Footer */}
        <div className={`mt-8 py-6 border-t ${darkMode?'border-gray-800':'border-gray-200'}`}>
          <p className={`text-sm text-center ${darkMode?'text-gray-500':'text-gray-600'}`}>© 2026 SGS Tous droits réservés – Version 1.0</p>
        </div>
      </main>
    </div>
  );
};

export default Chauffeurs;