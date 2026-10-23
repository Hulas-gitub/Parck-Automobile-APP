import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import XLSX from 'xlsx-js-style';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

// ── API (axios) ──
import {
  getReferences,
  getDemandes,
  createDemande,
  updateDemande,
  deleteDemande,
  validerDemande,
  rejeterDemande,
  getApiError,
} from '../api/Admin-Axios/DemandesIntervention-axios';

// ============================================================================
// DEMANDES D'INTERVENTION — branché sur le backend Laravel (axios)
// ─────────────────────────────────────────────────────────────────────────────
//  RÈGLES (appliquées côté serveur, le front ne fait que refléter les droits
//  renvoyés par l'API : item.can_treat / item.can_edit)
//
//  • Intervention INTERNE → « En cours de traitement » dès la soumission.
//      Aucune validation, aucun rejet, aucune notification. Modifiable à tout moment.
//  • Intervention EXTERNE → « En attente » + email/notification au DAAL ;
//      seul le DAAL valide / rejette. Modifiable uniquement tant qu'elle est en attente.
//  • À la soumission, le statut du véhicule prend le statut choisi dans la demande
//  • Le bouton « Marquer Terminé » n'existe plus sur cette page
//
//  CYCLE DE VIE :
//      interne : en_cours
//      externe : en_attente → en_cours   |   en_attente → rejetee
//
//  RÔLE DAAL (identique à la page Véhicules : pas de CRUD)
//  • LECTURE : voir la liste, les graphiques et le détail des demandes
//  • EXPORT  : Excel / PDF (tout, ou par statut / priorité / nature / maintenance)
//  • SEULE ACTION D'ÉCRITURE : valider (approuver) ou rejeter une demande externe en attente
//  • INTERDIT : créer, modifier, supprimer
//
//  RAFRAÎCHISSEMENT :
//  • Après chaque action (créer / modifier / supprimer / approuver / rejeter) :
//      1) l'interface est mise à jour IMMÉDIATEMENT (mise à jour locale)
//      2) un rechargement SILENCIEUX (sans skeleton, sans clignotement) est lancé en
//         arrière-plan EN MÊME TEMPS que l'affichage du SweetAlert
//      → les données du serveur (statuts, KPI, graphiques, véhicules…) sont à jour
//        derrière l'alerte, sans que la page ne « recharge » visuellement.
// ============================================================================

// ============================================================================
// RÔLES — le rôle DAAL ne peut que consulter, exporter, valider ou rejeter
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

// ── Enums (alignés sur la BDD / le contrôleur) ───────────────────────────────
const TYPES_MAINTENANCE = [
  { code:'corrective', libelle:'Corrective', color:'#ef4444', bg:'bg-red-100 text-red-700',     icon:'bi-wrench'            },
  { code:'preventive', libelle:'Préventive', color:'#10b981', bg:'bg-green-100 text-green-700', icon:'bi-shield-check-fill' },
];
const NATURES = [
  { code:'interne', libelle:'Interne', bg:'bg-slate-100 text-slate-700',     icon:'bi-building'              },
  { code:'externe', libelle:'Externe', bg:'bg-fuchsia-100 text-fuchsia-700', icon:'bi-box-arrow-up-right'    },
];
const TYPES_INTERVENTION = [
  { code:'revision_generale',     libelle:'Révision générale'       },
  { code:'vidange',               libelle:'Vidange'                  },
  { code:'freinage',              libelle:'Freinage'                 },
  { code:'moteur',                libelle:'Moteur'                   },
  { code:'transmission',          libelle:'Transmission'             },
  { code:'electricite',           libelle:'Électricité'              },
  { code:'carrosserie',           libelle:'Carrosserie'              },
  { code:'pneumatiques',          libelle:'Pneumatiques'             },
  { code:'climatisation',         libelle:'Climatisation'            },
  { code:'suspension',            libelle:'Suspension'               },
  { code:'batterie',              libelle:'Batterie'                 },
  { code:'echappement',           libelle:'Échappement'              },
  { code:'direction',             libelle:'Direction'                },
  { code:'refroidissement',       libelle:'Refroidissement'          },
  { code:'courroie_distribution', libelle:'Courroie de distribution' },
];
const PRIORITES = [
  { code:'faible',  libelle:'Faible',  color:'#10b981', bg:'bg-green-100 text-green-700',   icon:'bi-arrow-down-circle-fill'  },
  { code:'normale', libelle:'Normale', color:'#6366f1', bg:'bg-indigo-100 text-indigo-700', icon:'bi-dash-circle-fill'         },
  { code:'haute',   libelle:'Haute',   color:'#f59e0b', bg:'bg-yellow-100 text-yellow-700', icon:'bi-arrow-up-circle-fill'    },
  { code:'urgente', libelle:'Urgente', color:'#ef4444', bg:'bg-red-100 text-red-700',       icon:'bi-lightning-charge-fill'   },
];
const STATUTS = [
  { code:'en_attente', libelle:'En attente',             color:'#f59e0b', bg:'bg-yellow-100 text-yellow-700', icon:'bi-hourglass-split'   },
  { code:'en_cours',   libelle:'En cours de traitement', color:'#3b82f6', bg:'bg-blue-100 text-blue-700',     icon:'bi-gear-fill'         },
  { code:'termine',    libelle:'Terminé',                color:'#10b981', bg:'bg-green-100 text-green-700',   icon:'bi-check-circle-fill' },
  { code:'rejetee',    libelle:'Rejetée',                color:'#ef4444', bg:'bg-red-100 text-red-700',       icon:'bi-x-circle-fill'     },
];
// Statuts véhicule proposés dans le formulaire (la liste officielle vient de l'API ; ceci est un repli)
const STATUTS_VEHICULE_DEFAULT = [
  { code:'immobilisation longue', libelle:'Immobilisation longue' },
  { code:'immobilisation courte', libelle:'Immobilisation courte' },
  { code:'indisponible',          libelle:'Indisponible'          },
  { code:'En reparation',         libelle:'En réparation'         },
  { code:'En panne',              libelle:'En panne'              },
];
const PERIODES = [
  { code:'7j',   libelle:'7 jours',     jours:7   },
  { code:'30j',  libelle:'Mensuel',     jours:30  },
  { code:'90j',  libelle:'Trimestriel', jours:90  },
  { code:'180j', libelle:'Semestriel',  jours:180 },
  { code:'365j', libelle:'Annuel',      jours:365 },
];

// ── Couleur par rôle
const roleStyle = code => {
  if(code==='admin')     return { bg:'bg-purple-100 text-purple-700', dot:'#8b5cf6', label:'Admin' };
  if(code==='chef_parc') return { bg:'bg-blue-100 text-blue-700',     dot:'#3b82f6', label:'Chef de parc' };
  if(code==='chauffeur') return { bg:'bg-teal-100 text-teal-700',     dot:'#14b8a6', label:'Chauffeur' };
  if(code==='mecanicien')return { bg:'bg-orange-100 text-orange-700', dot:'#f97316', label:'Mécanicien' };
  if(code==='daal')      return { bg:'bg-fuchsia-100 text-fuchsia-700', dot:'#d946ef', label:'DAAL' };
  return { bg:'bg-gray-100 text-gray-600', dot:'#94a3b8', label:code };
};

// ============================================================================
// UTILITAIRES
// ============================================================================
const getStatutInfo    = c => STATUTS.find(s=>s.code===c)           || { libelle:c, color:'#94a3b8', bg:'bg-gray-100 text-gray-600', icon:'bi-circle' };
const getPrioriteInfo  = c => PRIORITES.find(p=>p.code===c)         || { libelle:c, color:'#94a3b8', bg:'bg-gray-100 text-gray-600', icon:'bi-circle' };
const getTypeMaintInfo = c => TYPES_MAINTENANCE.find(t=>t.code===c) || { libelle:c, color:'#94a3b8', bg:'bg-gray-100 text-gray-600' };
const getNatureInfo    = c => NATURES.find(n=>n.code===c)           || NATURES[0];
const getTypeIntLib    = c => TYPES_INTERVENTION.find(t=>t.code===c)?.libelle || c || '—';
const refDem           = id => `DEM-${String(id).padStart(5,'0')}`;
const libStatutVeh     = c => (c ? (STATUTS_VEHICULE_DEFAULT.find(s=>s.code===c)?.libelle || String(c).replace(/_/g,' ')) : '—');
const esc              = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

const fmtDate = iso => !iso ? '—' : new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
const fmtDT   = iso => !iso ? '—' : new Date(iso).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const fmtRel  = iso => {
  if(!iso) return '—';
  const s=(new Date()-new Date(iso))/1000;
  if(s<3600)  return `Il y a ${Math.max(0,Math.floor(s/60))} min`;
  if(s<86400) return `Il y a ${Math.floor(s/3600)}h`;
  if(s<604800)return `Il y a ${Math.floor(s/86400)} j`;
  return fmtDate(iso);
};

// ============================================================================
// EXPORTS (même principe que la page Véhicules : Excel stylé + PDF imprimable)
// ============================================================================

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

const buildSheet = (headers, data, color) => {
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
    const style = { border, alignment: { vertical: 'center', wrapText: true } };
    if (ri % 2 === 1) style.fill = { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } };
    return { v: c ?? '', t: typeof c === 'number' ? 'n' : 's', s: style };
  }));

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...bodyRows]);
  ws['!cols'] = headers.map((h, i) => ({
    wch: Math.min(60, Math.max(String(h).length, ...data.map(r => String(r[i] ?? '').length)) + 3),
  }));
  ws['!rows'] = [{ hpt: 26 }];
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(data.length, 1), c: headers.length - 1 } }) };
  return ws;
};

// sheets : [{ name, rows }]  → un classeur Excel, une feuille par entrée
const exportToExcel = (sheets, filename, headers, headerColor) => {
  const color = toExcelRgb(headerColor);
  const wb    = XLSX.utils.book_new();
  const used  = new Set();
  sheets.forEach(({ name, rows }, i) => {
    let n = String(name || `Feuille ${i + 1}`).replace(/[\\/:*?\[\]]/g, '_').slice(0, 31) || `Feuille ${i + 1}`;
    let k = 2;
    while (used.has(n.toLowerCase())) n = `${n.slice(0, 28)} ${k++}`;
    used.add(n.toLowerCase());
    XLSX.utils.book_append_sheet(wb, buildSheet(headers, rows, color), n);
  });
  XLSX.writeFile(wb, `${String(filename).replace(/[\\/:*?"<>|]/g, '_')}.xlsx`);
};

// sections : [{ title|null, rows }]  → un seul document imprimable
const exportToPDF = (title, headers, sections) => {
  const w = window.open('', '_blank'); if (!w) return;
  const total = sections.reduce((n, s) => n + s.rows.length, 0);
  const tables = sections.map(s => `
    ${s.title ? `<h2>${esc(s.title)} <span class="cnt">(${s.rows.length})</span></h2>` : ''}
    <table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${s.rows.map(r => `<tr>${r.map(c => `<td>${esc(c ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>@page{size:landscape;margin:12mm}body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;padding:16px}
  h1{font-size:16px;border-bottom:2px solid #1e3a5f;padding-bottom:6px}
  h2{font-size:13px;color:#1e3a5f;margin:18px 0 6px}
  .cnt{color:#64748b;font-weight:400}
  .sub{color:#64748b;font-size:10px;margin-bottom:10px}
  table{width:100%;border-collapse:collapse;font-size:9px;margin-bottom:8px}
  th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:left;font-size:8px;text-transform:uppercase}
  td{padding:5px 8px;border-bottom:1px solid #e2e8f0}
  tr:nth-child(even) td{background:#f8fafc}
  .foot{margin-top:10px;text-align:center;color:#94a3b8;font-size:9px;border-top:1px solid #e2e8f0;padding-top:6px}
  </style></head><body>
  <h1>📋 ${esc(title)}</h1><div class="sub">Export le ${new Date().toLocaleDateString('fr-FR')} · ${total} entrée(s)</div>
  ${tables}
  <div class="foot">SGS Fleetify · ${esc(title)} · ${new Date().getFullYear()}</div>
  <script>window.onload=()=>window.print()<\/script></body></html>`);
  w.document.close();
};

// ============================================================================
// SWEETALERT2 — HELPERS THÉMÉS (identiques à la page Véhicules)
// ============================================================================
const createSwal = (darkMode, theme) => Swal.mixin({
  customClass: {
    popup:         darkMode ? 'swal-dark-popup'    : 'swal-light-popup',
    title:         darkMode ? 'swal-dark-title'    : 'swal-light-title',
    htmlContainer: darkMode ? 'swal-dark-html'     : 'swal-light-html',
    confirmButton: 'swal-confirm-btn',
    cancelButton:  'swal-cancel-btn',
    denyButton:    'swal-deny-btn',
  },
  background:         darkMode ? '#111827' : '#ffffff',
  color:              darkMode ? '#f9fafb' : '#111827',
  confirmButtonColor: theme.primary,
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

// Succès : petite alerte auto-fermante (pas de rechargement visible : l'état React est mis à jour
// immédiatement, puis resynchronisé en silence avec le serveur en arrière-plan)
const showSuccess = (darkMode, theme, title, text) =>
  createSwal(darkMode, theme).fire({
    icon: 'success', title, text,
    showConfirmButton: false, showCancelButton: false,
    timer: 1400, timerProgressBar: false,
    allowOutsideClick: true, allowEscapeKey: true,
  });

const showError = (darkMode, theme, title, text, icon = 'error') =>
  createSwal(darkMode, theme).fire({
    icon, title, text,
    showConfirmButton: true, confirmButtonText: "D'ACCORD", showCancelButton: false,
  });

const showConfirm = (darkMode, theme, { title, html, confirmText = 'Confirmer', isDanger = false, icon }) =>
  createSwal(darkMode, theme).fire({
    icon: icon || (isDanger ? 'warning' : 'question'), title, html,
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
// SKELETONS (même principe que la page Véhicules)
// ============================================================================
const Sk = ({ dark, className = '', style }) => (
  <div className={`animate-pulse rounded ${dark ? 'bg-gray-700' : 'bg-gray-200'} ${className}`} style={style}></div>
);

// KPI compact
const SkeletonKpi = ({ dark }) => (
  <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl border shadow-sm px-4 py-3 flex items-center gap-3`}>
    <Sk dark={dark} className="w-10 h-10 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Sk dark={dark} className="h-6 w-14" />
      <Sk dark={dark} className="h-3 w-28" />
    </div>
  </div>
);

const SkeletonChart = ({ dark }) => (
  <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-6`}>
    <div className="flex items-start justify-between mb-5">
      <div className="space-y-2">
        <Sk dark={dark} className="h-5 w-44" />
        <Sk dark={dark} className="h-3 w-32" />
      </div>
      <Sk dark={dark} className="h-6 w-6 rounded-full" />
    </div>
    <div className="space-y-3">
      {[85, 65, 50, 35, 25].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <Sk dark={dark} className="h-4 w-16" />
          <Sk dark={dark} className="h-6 rounded-lg" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  </div>
);

const SkeletonRow = ({ dark }) => (
  <tr>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="px-4 py-4"><Sk dark={dark} className="h-4 w-full" /></td>
    ))}
  </tr>
);

const SkeletonCard = ({ dark }) => (
  <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5`}>
    <div className="flex items-start justify-between mb-3">
      <div className="space-y-2"><Sk dark={dark} className="h-3 w-20" /><Sk dark={dark} className="h-4 w-36" /></div>
      <Sk dark={dark} className="h-8 w-8 rounded-lg" />
    </div>
    <div className="flex gap-1.5 mb-3">
      <Sk dark={dark} className="h-5 w-20 rounded-full" /><Sk dark={dark} className="h-5 w-14 rounded-full" /><Sk dark={dark} className="h-5 w-16 rounded-full" />
    </div>
    <Sk dark={dark} className="h-16 w-full rounded-xl mb-3" />
    <Sk dark={dark} className="h-3 w-3/4 mb-2" />
    <Sk dark={dark} className="h-3 w-20" />
  </div>
);

// ============================================================================
// COMPTEUR ANIMÉ
// ============================================================================
const useCountUp = (target, dur=1200) => {
  const [v,setV]=useState(0); const raf=useRef(null),t0=useRef(null);
  useEffect(()=>{
    if(!target){setV(0);return;} t0.current=null;
    const s=ts=>{if(!t0.current)t0.current=ts;const p=Math.min((ts-t0.current)/dur,1);setV(Math.round((1-Math.pow(2,-10*p))*target));if(p<1)raf.current=requestAnimationFrame(s);};
    raf.current=requestAnimationFrame(s); return()=>cancelAnimationFrame(raf.current);
  },[target,dur]);
  return v;
};

// ============================================================================
// KPI CARD — version COMPACTE (icône à gauche, nombre + libellé, fine barre)
// ============================================================================
const KpiCard = ({ label, target, total, icon, color, sub, delay, dark, animate }) => {
  const v   = useCountUp(target);
  const pct = total ? Math.round((target / total) * 100) : 0;
  return (
    <div title={sub}
      className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-xl border shadow-sm px-4 py-3 flex items-center gap-3`}
      style={{animation:animate?`fadeInUp .5s ease-out ${delay}s both`:'none'}}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{background:`${color}22`}}>
        <i className={`${icon} text-lg`} style={{color}}></i>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className={`text-2xl font-black leading-none ${dark?'text-white':'text-gray-900'}`}>{v}</p>
          <span className={`text-[10px] font-semibold ${dark?'text-gray-500':'text-gray-400'}`}>{pct}%</span>
        </div>
        <p className={`text-xs font-semibold mt-1 truncate ${dark?'text-gray-300':'text-gray-700'}`}>{label}</p>
        <div className={`w-full h-1 rounded-full mt-1.5 ${dark?'bg-gray-800':'bg-gray-100'}`}>
          <div className="h-1 rounded-full transition-all duration-1000" style={{width:`${pct}%`,background:color}}></div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TOOLTIP CHART
// ============================================================================
const ChartTooltip = ({ tip }) => {
  if (!tip) return null;
  return createPortal(
    <div style={{position:'fixed',left:tip.x+14,top:tip.y-10,zIndex:99999,pointerEvents:'none',animation:'fadeInDown .12s ease-out'}}>
      <div style={{background:tip.dark?'#1e293b':'#fff',border:`1px solid ${tip.dark?'#334155':'#e2e8f0'}`,borderRadius:12,padding:'10px 14px',minWidth:140,boxShadow:'0 8px 32px rgba(0,0,0,.22)'}}>
        <p style={{fontSize:13,fontWeight:700,marginBottom:6,color:tip.dark?'#f1f5f9':'#1e293b'}}>{tip.label}</p>
        {tip.rows.map((r,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:i<tip.rows.length-1?4:0}}>
            <div style={{width:10,height:10,borderRadius:3,background:r.color,flexShrink:0}}></div>
            <span style={{fontSize:12,color:tip.dark?'#94a3b8':'#64748b',flex:1}}>{r.name}</span>
            <span style={{fontSize:13,fontWeight:700,color:tip.dark?'#f1f5f9':'#1e293b'}}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// GRAPHIQUE BARRES HORIZONTALES
// ============================================================================
const BarChart = ({ data, dark, color, color2, stacked }) => {
  const [tip, setTip] = useState(null);
  if (!data || data.length === 0) return null;

  const barH=26, barGap=6;
  const rowH = color2 && !stacked ? barH*2+barGap+14 : barH+14;
  const padL=76, padR=28, padT=8, padB=20;
  const W=560, H=padT+data.length*rowH+padB, cW=W-padL-padR;

  const maxVal = stacked
    ? Math.max(...data.map(d=>(d.v1||0)+(d.v2||0)),1)
    : Math.max(...data.map(d=>Math.max(d.value||0,d.v1||0,d.v2||0)),1);

  const bw = v => (v/maxVal)*cW;
  const gy = i => padT+i*rowH;
  const gridVals = Array.from({length:5},(_,i)=>Math.round((maxVal/4)*i));

  return (
    <div className="relative w-full">
      <ChartTooltip tip={tip}/>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {gridVals.map((val,i)=>(
          <g key={i}>
            <line x1={padL+bw(val)} x2={padL+bw(val)} y1={padT} y2={H-padB} stroke={dark?'#1f2937':'#f0f0f0'} strokeWidth={1} strokeDasharray={i===0?'0':'3,3'}/>
            <text x={padL+bw(val)} y={H-4} textAnchor="middle" fontSize={9} fill={dark?'#4b5563':'#9ca3af'}>{val}</text>
          </g>
        ))}
        {data.map((d,i)=>{
          const y0=gy(i), label=d.fullLabel||d.label;
          if(stacked){
            const v1=d.v1||0, v2=d.v2||0, tot=v1+v2;
            return (
              <g key={i} style={{cursor:'pointer'}}
                onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,dark,label,rows:[{name:d.l1||'Corrective',value:v1,color},{name:d.l2||'Préventive',value:v2,color:color2}]})}
                onMouseMove={e=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:t)}
                onMouseLeave={()=>setTip(null)}>
                <rect x={padL} y={y0} width={cW} height={barH} fill={dark?'#1f2937':'#f1f5f9'} rx={7}/>
                {v1>0&&<rect x={padL} y={y0} width={bw(v1)} height={barH} fill={color} rx={7}/>}
                {v2>0&&<rect x={padL+bw(v1)} y={y0} width={bw(v2)} height={barH} fill={color2} rx={v1===0?7:0}/>}
                {tot>0&&<text x={padL+bw(tot)+5} y={y0+barH/2+4} fontSize={11} fontWeight="700" fill={dark?'#e2e8f0':'#374151'}>{tot}</text>}
                <text x={padL-6} y={y0+barH/2+4} textAnchor="end" fontSize={10} fill={dark?'#9ca3af':'#6b7280'}>{d.label}</text>
              </g>
            );
          }
          if(color2){
            const v1=d.v1||0, v2=d.v2||0;
            return (
              <g key={i} style={{cursor:'pointer'}}
                onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,dark,label,rows:[{name:d.l1||'En cours',value:v1,color},{name:d.l2||'En attente',value:v2,color:color2}]})}
                onMouseMove={e=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:t)}
                onMouseLeave={()=>setTip(null)}>
                <rect x={padL} y={y0} width={cW} height={barH} fill={dark?'#1f2937':'#f1f5f9'} rx={7}/>
                {v1>0&&<rect x={padL} y={y0} width={bw(v1)} height={barH} fill={color} rx={7}/>}
                {v1>0&&<text x={padL+bw(v1)+5} y={y0+barH/2+4} fontSize={11} fontWeight="700" fill={dark?'#e2e8f0':'#374151'}>{v1}</text>}
                <rect x={padL} y={y0+barH+barGap} width={cW} height={barH} fill={dark?'#1f2937':'#f1f5f9'} rx={7}/>
                {v2>0&&<rect x={padL} y={y0+barH+barGap} width={bw(v2)} height={barH} fill={color2} rx={7}/>}
                {v2>0&&<text x={padL+bw(v2)+5} y={y0+barH+barGap+barH/2+4} fontSize={11} fontWeight="700" fill={dark?'#e2e8f0':'#374151'}>{v2}</text>}
                <text x={padL-6} y={y0+barH+barGap/2+4} textAnchor="end" fontSize={10} fill={dark?'#9ca3af':'#6b7280'}>{d.label}</text>
              </g>
            );
          }
          const val=d.value||0;
          return (
            <g key={i} style={{cursor:'pointer'}}
              onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,dark,label,rows:[{name:'Total',value:val,color:d.color||color}]})}
              onMouseMove={e=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:t)}
              onMouseLeave={()=>setTip(null)}>
              <rect x={padL} y={y0} width={cW} height={barH} fill={dark?'#1f2937':'#f1f5f9'} rx={7}/>
              {val>0&&<rect x={padL} y={y0} width={bw(val)} height={barH} fill={d.color||color} rx={7}/>}
              {val>0&&<text x={padL+bw(val)+5} y={y0+barH/2+4} fontSize={11} fontWeight="700" fill={dark?'#e2e8f0':'#374151'}>{val}</text>}
              <text x={padL-6} y={y0+barH/2+4} textAnchor="end" fontSize={10} fill={dark?'#9ca3af':'#6b7280'}>{d.label}</text>
            </g>
          );
        })}
        <line x1={padL} x2={padL} y1={padT} y2={H-padB} stroke={dark?'#374151':'#e2e8f0'} strokeWidth={1}/>
      </svg>
    </div>
  );
};

// ============================================================================
// GRAPHIQUE COURBE
// ============================================================================
const LineChart = ({ data, dark, color, color2, height=160 }) => {
  const [tip, setTip] = useState(null);
  if (!data || data.length < 2) return null;

  const pad={l:36,r:20,t:16,b:32};
  const W=560, H=height;
  const vals1=data.map(d=>d.v1||d.value||0);
  const vals2=color2?data.map(d=>d.v2||0):[];
  const maxVal=Math.max(...vals1,...vals2,1);
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
  const px=i=>pad.l+(i/(data.length-1))*cW;
  const py=v=>pad.t+cH-(v/maxVal)*cH;
  const pts1=vals1.map((v,i)=>`${px(i)},${py(v)}`).join(' L ');
  const pts2=vals2.map((v,i)=>`${px(i)},${py(v)}`).join(' L ');
  const area1=`M ${px(0)},${H-pad.b} L ${pts1} L ${px(data.length-1)},${H-pad.b} Z`;
  const area2=`M ${px(0)},${H-pad.b} L ${pts2} L ${px(data.length-1)},${H-pad.b} Z`;

  return (
    <div className="relative w-full">
      <ChartTooltip tip={tip}/>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height}}>
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
          {color2&&<linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color2} stopOpacity="0.14"/>
            <stop offset="100%" stopColor={color2} stopOpacity="0"/>
          </linearGradient>}
        </defs>
        {Array.from({length:5},(_,i)=>{
          const val=Math.round((maxVal/4)*i), yy=py(val);
          return (<g key={i}><line x1={pad.l} x2={W-pad.r} y1={yy} y2={yy} stroke={dark?'#1f2937':'#f1f5f9'} strokeWidth={1} strokeDasharray={i===0?'0':'3,3'}/><text x={pad.l-5} y={yy+4} textAnchor="end" fontSize={9} fill={dark?'#4b5563':'#9ca3af'}>{val}</text></g>);
        })}
        {color2&&<path d={area2} fill="url(#lg2)"/>}
        <path d={area1} fill="url(#lg1)"/>
        {color2&&<path d={`M ${pts2}`} fill="none" stroke={color2} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.85}/>}
        <path d={`M ${pts1}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
        {data.map((d,i)=>(
          <g key={i}
            onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,dark,label:d.label,rows:[{name:d.l1||'Total',value:vals1[i],color},...(color2?[{name:d.l2||'Série 2',value:vals2[i],color:color2}]:[])]})}
            onMouseMove={e=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:t)}
            onMouseLeave={()=>setTip(null)}
            style={{cursor:'pointer'}}>
            <rect x={px(i)-16} y={pad.t} width={32} height={cH} fill="transparent"/>
            <circle cx={px(i)} cy={py(vals1[i])} r={tip&&tip.label===d.label?5:3} fill={color} stroke={dark?'#0f172a':'#fff'} strokeWidth={2} style={{transition:'r .1s'}}/>
            {color2&&<circle cx={px(i)} cy={py(vals2[i])} r={tip&&tip.label===d.label?4:2.5} fill={color2} stroke={dark?'#0f172a':'#fff'} strokeWidth={1.5} style={{transition:'r .1s'}}/>}
            {tip&&tip.label===d.label&&<line x1={px(i)} x2={px(i)} y1={pad.t} y2={H-pad.b} stroke={dark?'#334155':'#e2e8f0'} strokeWidth={1} strokeDasharray="3,3"/>}
            <text x={px(i)} y={H-pad.b+15} textAnchor="middle" fontSize={9} fill={dark?'#6b7280':'#9ca3af'}>{d.label}</text>
          </g>
        ))}
        <line x1={pad.l} x2={W-pad.r} y1={H-pad.b} y2={H-pad.b} stroke={dark?'#374151':'#e5e7eb'} strokeWidth={1}/>
      </svg>
    </div>
  );
};

// ============================================================================
// MODAL DÉTAIL
//  • INTERNE : directement « en cours », aucune décision → 2 colonnes
//  • EXTERNE : en_attente → en_cours / rejetee (DAAL) → 3 colonnes (avec « Décision »)
// Les droits (valider / rejeter / modifier / supprimer) sont calculés dans le
// composant principal à partir de l'API ET du rôle (DAAL = pas de CRUD) :
//   item.can_treat · item.can_edit · item.can_delete
// Les confirmations (valider, rejeter, supprimer) sont gérées par SweetAlert2
// dans le composant principal ; les handlers renvoient true si l'action a eu lieu.
// ============================================================================
const DetailModal = ({ item, dark, theme, onClose, onEdit, onValider, onReject, onDelete }) => {
  const priorite =getPrioriteInfo(item.priorite);
  const statut   =getStatutInfo(item.statut);
  const typeMaint=getTypeMaintInfo(item.type_maintenance);
  const nature   =getNatureInfo(item.nature_intervention);
  const roleD    =roleStyle(item.demandeur_role_code);
  const externe  =item.nature_intervention==='externe';
  const vehLabel =`${item.vehicule_marque||''} ${item.vehicule_modele||''}`.trim();
  const kmVal    = item.kilometrage!=null ? item.kilometrage : item.vehicule_kilometrage;

  // ── styles réutilisables (polices agrandies)
  const secT  = `text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${dark?'text-gray-400':'text-gray-500'}`;
  const txt   = `text-base leading-relaxed whitespace-pre-line ${dark?'text-gray-300':'text-gray-700'}`;
  const empty = `italic ${dark?'text-gray-600':'text-gray-400'}`;
  const badge = 'px-3.5 py-1.5 rounded-full text-sm font-bold';

  const Row = ({label, value, icon}) => (
    <div className={`flex items-center justify-between gap-4 py-3 border-b ${dark?'border-gray-700/50':'border-gray-100'} last:border-0`}>
      <div className={`flex items-center gap-2.5 text-base ${dark?'text-gray-400':'text-gray-500'}`}>
        {icon && <i className={`bi ${icon} w-5 text-center`}></i>}
        <span>{label}</span>
      </div>
      <span className={`text-base font-semibold text-right ${dark?'text-gray-100':'text-gray-800'}`}>{value||'—'}</span>
    </div>
  );

  // Exécute le handler (avec sa confirmation Swal) et ferme la modale seulement si l'action a abouti
  const run = fn => async () => { if (await fn(item)) onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5" style={{background:'rgba(0,0,0,0.65)'}}>
      <div
        className={`${dark?'bg-gray-900':'bg-white'} rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full`}
        style={{
          maxWidth: 'min(1600px, calc(100vw - 24px))',
          height: 'min(92vh, 960px)',
          minHeight: '520px',
        }}
      >
        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <div
          className={`shrink-0 flex items-center justify-between gap-4 px-8 py-5 border-b ${dark?'border-gray-800':'border-gray-200'}`}
          style={{background:`linear-gradient(135deg,${theme.primary}18,transparent)`}}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-white shadow-lg"
              style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
              <i className="bi bi-file-earmark-plus-fill text-2xl"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className={`text-2xl font-black ${dark?'text-white':'text-gray-900'}`}>
                  {refDem(item.id)}
                </h2>
                <span className={`${badge} ${statut.bg}`}>
                  <i className={`bi ${statut.icon} mr-1.5`}></i>{statut.libelle}
                </span>
              </div>
              <p className={`text-base mt-1 truncate ${dark?'text-gray-400':'text-gray-500'}`}>
                {getTypeIntLib(item.type_intervention)} · {fmtDT(item.date_demande)}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dark?'hover:bg-gray-800 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* ══ BODY : 3 colonnes (externe) · 2 colonnes (interne : pas de décision) ═══ */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className={`grid grid-cols-1 ${externe?'md:grid-cols-3':'md:grid-cols-2'} divide-y md:divide-y-0 md:divide-x h-full ${dark?'divide-gray-800':'divide-gray-100'}`}>

            {/* ── COL 1 ── Intervention + Véhicule + Demandeur + Traçabilité */}
            <div className={`flex flex-col overflow-y-auto divide-y ${dark?'divide-gray-800':'divide-gray-100'}`}>

              <div className="p-6">
                <p className={secT}><i className="bi bi-tools text-amber-400"></i>Intervention</p>
                <Row label="Nature de l'intervention" icon="bi-diagram-2"
                  value={<span className={`${badge} ${nature.bg}`}><i className={`bi ${nature.icon} mr-1.5`}></i>{nature.libelle}</span>}/>
                <Row label="Type de maintenance" icon="bi-wrench"
                  value={<span className={`${badge} ${typeMaint.bg}`}>{typeMaint.libelle}</span>}/>
                <Row label="Type d'intervention" icon="bi-gear-wide-connected"
                  value={getTypeIntLib(item.type_intervention)}/>
                <Row label="Priorité" icon="bi-flag-fill"
                  value={<span className={`${badge} ${priorite.bg}`}><i className={`bi ${priorite.icon} mr-1.5`}></i>{priorite.libelle}</span>}/>
              </div>

              <div className="p-6">
                <p className={secT}><i className="bi bi-car-front-fill text-blue-400"></i>Véhicule</p>
                <Row label="Immatriculation"    value={item.vehicule_immatriculation} icon="bi-card-text"/>
                <Row label="Marque / Modèle"    value={vehLabel||'—'} icon="bi-car-front"/>
                <Row label="Kilométrage relevé" value={kmVal!=null?`${kmVal.toLocaleString('fr-FR')} km`:'—'} icon="bi-speedometer2"/>
                <Row label="Statut actuel"      value={libStatutVeh(item.vehicule_statut)} icon="bi-circle-fill"/>
                <Row label="Statut demandé"     value={item.statut_vehicule?libStatutVeh(item.statut_vehicule):'Inchangé'} icon="bi-arrow-repeat"/>
              </div>

              <div className="p-6">
                <p className={secT}><i className="bi bi-person-fill text-indigo-400"></i>Demandeur</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-white text-xl font-black"
                    style={{background:roleD.dot}}>
                    {item.demandeur_nom?.charAt(0)||'?'}
                  </div>
                  <div>
                    <p className={`font-bold text-lg leading-tight ${dark?'text-white':'text-gray-900'}`}>{item.demandeur_nom||'  '}</p>
                    <span className={`text-sm px-2.5 py-0.5 rounded-full font-semibold ${roleD.bg}`}>{item.demandeur_role_libelle||'Saisie libre'}</span>
                    <p className={`text-sm mt-1 ${dark?'text-gray-500':'text-gray-400'}`}>{item.demandeur_direction||'  '}</p>
                  </div>
                </div>
                <Row label="Date demande"        value={fmtDT(item.date_demande)} icon="bi-calendar-event"/>
                <Row label="Direction / service" value={item.direction_service}   icon="bi-diagram-3"/>
              </div>

              <div className="p-6">
                <p className={secT}><i className="bi bi-clock-history text-slate-400"></i>Traçabilité</p>
                <Row label="Référence"   value={refDem(item.id)}              icon="bi-hash"/>
                <Row label="Créée le"    value={fmtDT(item.date_creation)}     icon="bi-plus-circle"/>
                <Row label="Modifiée le" value={fmtDT(item.date_modification)} icon="bi-pencil"/>
              </div>
            </div>

            {/* ── COL 2 ── Anomalie constatée + Recommandation + État */}
            <div className={`flex flex-col overflow-y-auto divide-y ${dark?'divide-gray-800':'divide-gray-100'}`}>

              <div className="p-6">
                <p className={secT}><i className="bi bi-exclamation-octagon-fill text-orange-400"></i>Anomalie constatée</p>
                <p className={txt}>{item.anomalie_constatee||<span className={empty}>Non renseignée.</span>}</p>
              </div>

              <div className="p-6">
                <p className={secT}><i className="bi bi-lightbulb-fill text-yellow-400"></i>Recommandation</p>
                <p className={txt}>{item.recommandation||<span className={empty}>Aucune recommandation.</span>}</p>
              </div>

              <div className="p-6">
                <p className={secT}><i className="bi bi-activity text-teal-400"></i>État de l'intervention</p>

                {item.statut==='en_attente' && (
                  <div className={`rounded-xl p-5 flex items-start gap-3 ${dark?'bg-yellow-900/20 border border-yellow-800':'bg-yellow-50 border border-yellow-200'}`}>
                    <i className="bi bi-hourglass-split text-yellow-400 text-xl mt-0.5"></i>
                    <div>
                      <p className={`text-base font-bold ${dark?'text-yellow-300':'text-yellow-700'}`}>En attente de validation</p>
                      <p className={`text-sm mt-1 ${dark?'text-yellow-500':'text-yellow-600'}`}>
                        Intervention externe : en attente de la décision du DAAL.
                      </p>
                    </div>
                  </div>
                )}

                {item.statut==='en_cours' && (
                  <div className={`rounded-xl p-5 flex items-start gap-3 ${dark?'bg-blue-900/20 border border-blue-800':'bg-blue-50 border border-blue-200'}`}>
                    <i className="bi bi-gear-fill text-blue-400 text-xl mt-0.5 animate-spin" style={{animationDuration:'3s'}}></i>
                    <div>
                      <p className={`text-base font-bold ${dark?'text-blue-300':'text-blue-700'}`}>En cours de traitement</p>
                      <p className={`text-sm mt-1 ${dark?'text-blue-400':'text-blue-600'}`}>
                        {externe
                          ? <>Approuvée par le DAAL. Réf. intervention : <strong>INT-{String(item.id).padStart(5,'0')}</strong></>
                          : <>Intervention interne : traitement en cours, aucune validation requise. Réf. : <strong>INT-{String(item.id).padStart(5,'0')}</strong></>}
                      </p>
                      {externe && item.valideur_nom && (
                        <p className="text-sm mt-1 text-blue-500">Approuvée par {item.valideur_nom} le {fmtDate(item.date_validation)}</p>
                      )}
                    </div>
                  </div>
                )}

                {item.statut==='termine' && (
                  <div className={`rounded-xl p-5 flex items-start gap-3 ${dark?'bg-green-900/20 border border-green-800':'bg-green-50 border border-green-200'}`}>
                    <i className="bi bi-check-circle-fill text-green-400 text-xl mt-0.5"></i>
                    <div>
                      <p className={`text-base font-bold ${dark?'text-green-300':'text-green-700'}`}>Intervention terminée</p>
                      <p className={`text-sm mt-1 ${dark?'text-green-400':'text-green-600'}`}>
                        Clôturée. Réf. : <strong>INT-{String(item.id).padStart(5,'0')}</strong>
                      </p>
                      {externe && item.valideur_nom && (
                        <p className="text-sm mt-1 text-green-500">Traitée par {item.valideur_nom} le {fmtDate(item.date_validation)}</p>
                      )}
                    </div>
                  </div>
                )}

                {item.statut==='rejetee' && (
                  <div className={`rounded-xl p-5 flex items-start gap-3 ${dark?'bg-red-900/20 border border-red-800':'bg-red-50 border border-red-200'}`}>
                    <i className="bi bi-x-circle-fill text-red-400 text-xl mt-0.5"></i>
                    <div>
                      <p className={`text-base font-bold ${dark?'text-red-300':'text-red-700'}`}>Demande rejetée</p>
                      {item.motif_rejet && (
                        <p className={`text-sm mt-1 leading-relaxed ${dark?'text-red-400':'text-red-600'}`}>{item.motif_rejet}</p>
                      )}
                      {item.valideur_nom && <p className="text-sm mt-1 text-red-400">Par {item.valideur_nom} le {fmtDate(item.date_validation)}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── COL 3 ── Décision : uniquement pour les demandes EXTERNES (DAAL) */}
            {externe && (
              <div className="flex flex-col overflow-y-auto">
                <div className="p-6 flex-1">
                  <div className="flex items-center justify-between mb-5">
                    <p className={secT + " mb-0"}><i className="bi bi-shield-fill-check text-green-400"></i>Décision</p>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${dark?'bg-fuchsia-900/40 text-fuchsia-300':'bg-fuchsia-100 text-fuchsia-700'}`}>
                      DAAL uniquement
                    </span>
                  </div>

                  {/* ── en_attente + peut traiter (DAAL) */}
                  {item.statut==='en_attente' && item.can_treat && (
                    <div className="space-y-4">
                      <p className={`text-base leading-relaxed ${dark?'text-gray-400':'text-gray-500'}`}>
                        Approuvez pour passer la demande en <strong>En cours de traitement</strong>, ou rejetez-la avec un motif obligatoire.
                      </p>
                      <button onClick={run(onValider)}
                        className="w-full py-3.5 rounded-xl text-white text-base font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-md transition-opacity"
                        style={{background:'linear-gradient(135deg,#3b82f6,#1d4ed8)'}}>
                        <i className="bi bi-gear-fill"></i>Approuver l'intervention
                      </button>
                      <button onClick={run(onReject)}
                        className={`w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 border-2 border-red-400 text-red-500 transition-colors ${dark?'hover:bg-red-900/20':'hover:bg-red-50'}`}>
                        <i className="bi bi-x-circle"></i>Rejeter la demande
                      </button>
                    </div>
                  )}

                  {/* ── en_attente sans droits */}
                  {item.statut==='en_attente' && !item.can_treat && (
                    <div className={`flex items-start gap-3 p-5 rounded-xl ${dark?'bg-gray-800':'bg-gray-100'}`}>
                      <i className="bi bi-lock-fill text-gray-400 text-xl mt-0.5"></i>
                      <p className={`text-base ${dark?'text-gray-400':'text-gray-500'}`}>
                        En attente de validation par le <strong>DAAL</strong>.
                      </p>
                    </div>
                  )}

                  {/* ── approuvée */}
                  {(item.statut==='en_cours' || item.statut==='termine') && (
                    <div>
                      <Row label="Approuvée par"   value={item.valideur_nom||'—'}          icon="bi-person-check-fill"/>
                      <Row label="Rôle"            value={item.valideur_role_libelle||'—'} icon="bi-award-fill"/>
                      <Row label="Date validation" value={fmtDT(item.date_validation)}     icon="bi-calendar-check-fill"/>
                    </div>
                  )}

                  {/* ── rejetée */}
                  {item.statut==='rejetee' && (
                    <div>
                      <Row label="Rejetée par" value={item.valideur_nom||'—'}          icon="bi-person-x-fill"/>
                      <Row label="Rôle"        value={item.valideur_role_libelle||'—'} icon="bi-award-fill"/>
                      <Row label="Date rejet"  value={fmtDT(item.date_validation)}     icon="bi-calendar-x-fill"/>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>{/* end grid */}
        </div>{/* end body */}

        {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
        <div className={`shrink-0 px-8 py-4 border-t ${dark?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'} flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            {/* Saisir l'intervention si en cours ou approuvée */}
            {['en_cours', 'validee', 'approuvee'].includes(item.statut) && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/Admin/Navigation/InterventionsVehicules?demande_id=${item.id}`);
                }}
                className="px-5 py-3 rounded-xl text-white text-base font-bold flex items-center gap-2 hover:opacity-90 shadow transition-opacity bg-amber-600 hover:bg-amber-700"
              >
                <i className="bi bi-tools"></i>Saisir l'intervention
              </button>
            )}
            {/* Modifier / Supprimer : masqués pour le DAAL (lecture seule) */}
            {item.can_edit && (
              <button onClick={()=>{onEdit(item);onClose();}}
                className="px-6 py-3 rounded-xl text-white text-base font-bold flex items-center gap-2 hover:opacity-90 shadow transition-opacity"
                style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
                <i className="bi bi-pencil-fill"></i>Modifier
              </button>
            )}
            {item.can_delete && (
              <button onClick={run(onDelete)}
                className={`px-5 py-3 rounded-xl text-base font-semibold border flex items-center gap-2 transition-colors ${dark?'border-red-800 text-red-400 hover:bg-red-900/20':'border-red-200 text-red-400 hover:bg-red-50'}`}>
                <i className="bi bi-trash3-fill"></i>Supprimer
              </button>
            )}
          </div>
          <button onClick={onClose}
            className={`px-7 py-3 rounded-xl text-base font-semibold transition-colors ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL FORMULAIRE (jamais affiché pour le DAAL)
// Champs : véhicule (saisie ou liste) · demandeur (liste ou autre nom) · date auto ·
//          type de maintenance · nature (interne/externe) · type d'intervention · priorité ·
//          anomalie constatée · direction/service (liste directions + affectations, ou saisie) ·
//          recommandation · kilométrage · statut du véhicule
// ============================================================================
const FormModal = ({ item, refs, me, dark, theme, onClose, onSave }) => {
  const isEdit = !!item;
  const autoDate = new Date().toISOString();

  const vehicules    = refs?.vehicules    || [];
  const utilisateurs = refs?.utilisateurs || [];
  const directions   = refs?.directions   || [];
  const affectations = refs?.affectations || [];
  const statutsVeh   = refs?.statuts_vehicule?.length ? refs.statuts_vehicule : STATUTS_VEHICULE_DEFAULT;

  const initialService = item?.direction_id ? `d:${item.direction_id}` : item?.affectation_id ? `a:${item.affectation_id}` : '';

  const [form, setForm] = useState({
    vehicule_immatriculation: item?.vehicule_immatriculation || '',
    demandeur_user_id:        item ? (item.demandeur_user_id || '') : (me?.id || ''),
    demandeur_autre:          item?.demandeur_autre          || '',
    nature_intervention:      item?.nature_intervention      || 'interne',
    type_maintenance:         item?.type_maintenance         || 'corrective',
    type_intervention:        item?.type_intervention        || '',
    priorite:                 item?.priorite                 || 'normale',
    anomalie_id:              item?.anomalie_id              || '',
    anomalie_constatee:       item?.anomalie_constatee       || '',
    service_select:           initialService,
    direction_service_autre:  item?.direction_service_autre  || '',
    recommandation:           item?.recommandation           || '',
    kilometrage:              item?.kilometrage ?? '',
    statut_vehicule:          item?.statut_vehicule          || '',
    commentaire:              item?.commentaire              || '',
  });
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const vehInfo = vehicules.find(v=>v.immatriculation.toLowerCase()===form.vehicule_immatriculation.trim().toLowerCase());
  const externe = form.nature_intervention==='externe';

  const onVehiculeChange = val => {
    const v = vehicules.find(x=>x.immatriculation.toLowerCase()===val.trim().toLowerCase());
    setForm(f=>({
      ...f,
      vehicule_immatriculation: v ? v.immatriculation : val,
      anomalie_id: '',
      // pré-remplissage du kilométrage et du service avec ceux du véhicule (modifiables)
      kilometrage: v && !isEdit ? v.kilometrage : f.kilometrage,
      service_select: v && !isEdit && !f.service_select && !f.direction_service_autre
        ? (v.direction_id ? `d:${v.direction_id}` : v.affectation_id ? `a:${v.affectation_id}` : '')
        : f.service_select,
    }));
  };

  const demandeurOk = !!form.demandeur_user_id || form.demandeur_autre.trim().length>0;
  const canSubmit   = !!vehInfo && demandeurOk && form.type_intervention && form.anomalie_constatee.trim().length>0 && !saving;

  const inp=`w-full px-3 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none ${dark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-gray-50 border-gray-200 text-gray-900'}`;
  const lbl=`block text-sm font-bold mb-1.5 ${dark?'text-gray-200':'text-gray-700'}`;
  const blk=`${dark?'bg-gray-800 border-gray-700':'bg-gray-50 border-gray-200'} rounded-2xl border p-5`;
  const sec=`text-sm font-bold mb-4 flex items-center gap-2 ${dark?'text-gray-200':'text-gray-700'}`;

  const submit = async () => {
    if(!canSubmit) return;
    const autre = form.demandeur_autre.trim();
    const [kind,rawId] = form.service_select ? form.service_select.split(':') : [null,null];
    const payload = {
      ...(isEdit ? { matricule_demande: item.matricule_demande || refDem(item.id) } : {}),
      vehicule_immatriculation: vehInfo.immatriculation,
      demandeur_user_id:        autre ? null : (form.demandeur_user_id ? Number(form.demandeur_user_id) : null),
      demandeur_autre:          autre || null,
      nature_intervention:      form.nature_intervention,
      type_maintenance:         form.type_maintenance,
      type_intervention:        form.type_intervention,
      priorite:                 form.priorite,
      anomalie_id:              form.anomalie_id ? Number(form.anomalie_id) : null,
      anomalie_constatee:       form.anomalie_constatee.trim(),
      direction_id:             kind==='d' ? Number(rawId) : null,
      affectation_id:           kind==='a' ? Number(rawId) : null,
      direction_service_autre:  form.direction_service_autre.trim() || null,
      recommandation:           form.recommandation.trim() || null,
      kilometrage:              form.kilometrage==='' ? null : Number(form.kilometrage),
      statut_vehicule:          form.statut_vehicule || null,
      commentaire:              form.commentaire.trim() || null,
    };
    setSaving(true); setError('');
    try {
      const saved = await onSave(payload, item?.id);   // les erreurs sont affichées par SweetAlert dans le parent
      if (saved === false) { setSaving(false); return; }
      onClose();                                        // succès → le formulaire se ferme
    } catch(e){
      setError(e?.message || 'Une erreur est survenue.'); setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${dark?'bg-gray-900':'bg-white'} rounded-2xl w-[90vw] max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl`}>
        <div className={`p-6 border-b ${dark?'border-gray-800':'border-gray-200'} flex items-center justify-between shrink-0`}
          style={{background:`linear-gradient(135deg,${theme.primary}15,transparent)`}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
              style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
              <i className={`bi ${isEdit?'bi-pencil-fill':'bi-plus-lg'} text-base`}></i>
            </div>
            <div>
              <h2 className={`text-lg font-bold ${dark?'text-white':'text-gray-900'}`}>
                {isEdit ? "Modifier la demande" : "Nouvelle demande d'intervention"}
              </h2>
              <p className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>
                {isEdit
                  ? `${refDem(item.id)} · ${item.nature_intervention==='externe' ? "Une demande externe n'est modifiable qu'en attente" : 'Demande interne modifiable à tout moment'}`
                  : "La date et l'heure sont enregistrées automatiquement"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${dark?'hover:bg-gray-800 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── Véhicule & Demandeur */}
          <div className={blk}>
            <p className={sec}><i className="bi bi-car-front-fill text-blue-400"></i>Véhicule & Demandeur</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Véhicule * <span className="font-normal normal-case opacity-60">(saisir ou sélectionner)</span></label>
                <input list="dl-vehicules" value={form.vehicule_immatriculation}
                  onChange={e=>onVehiculeChange(e.target.value)}
                  placeholder="Ex : FM 643 AA" className={inp}/>
                <datalist id="dl-vehicules">
                  {vehicules.map(v => {
                    const nom = `${v.marque || ''} ${v.modele || ''}`.trim();
                    return (
                      <option
                        key={v.immatriculation}
                        value={v.immatriculation}
                        label={nom ? `${v.immatriculation} — ${nom}` : v.immatriculation}
                      />
                    );
                  })}
                </datalist>
                {form.vehicule_immatriculation && !vehInfo && (
                  <p className="text-[10px] mt-1 text-red-500 font-semibold"><i className="bi bi-exclamation-circle mr-1"></i>Véhicule introuvable — choisissez une immatriculation de la liste.</p>
                )}
                {vehInfo&&(
                  <p className={`text-[10px] mt-1 ${dark?'text-gray-500':'text-gray-400'}`}>
                    <i className="bi bi-car-front mr-1"></i>{`${vehInfo.marque||''} ${vehInfo.modele||''}`.trim()} ·
                    <i className="bi bi-speedometer2 mx-1"></i>{vehInfo.kilometrage.toLocaleString('fr-FR')} km ·
                    <span className={`ml-1 font-semibold ${vehInfo.statut==='disponible'?'text-green-500':vehInfo.statut==='en_maintenance'?'text-orange-500':'text-red-500'}`}>
                      {libStatutVeh(vehInfo.statut)}
                    </span>
                  </p>
                )}
              </div>
          
         
         
              <div>
                <label className={lbl}>Demandeur</label>
                <input type="text" value={form.demandeur_autre}
                  onChange={e=>{set('demandeur_autre',e.target.value);if(e.target.value.trim())set('demandeur_user_id','');}}
                  placeholder="Ex : MOUSSAVOU Bernard" className={inp}/>
                <p className={`text-[10px] mt-1 ${dark?'text-gray-500':'text-gray-400'}`}></p>
              </div>
              <div className={`col-span-2 flex items-center gap-3 px-3 py-2.5 rounded-xl border ${dark?'border-gray-700 bg-gray-800/50':'border-gray-200 bg-gray-50'}`}>
                <i className={`bi bi-clock-fill text-sm ${dark?'text-gray-500':'text-gray-400'}`}></i>
                <div className="flex-1">
                  <p className={`text-xs font-semibold ${dark?'text-gray-300':'text-gray-700'}`}>Date et heure de la demande</p>
                  <p className={`text-[11px] ${dark?'text-gray-500':'text-gray-400'}`}>Générée automatiquement à la soumission · {fmtDT(isEdit?item.date_demande:autoDate)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${dark?'bg-gray-700 text-gray-400':'bg-gray-200 text-gray-500'}`}>Auto</span>
              </div>
            </div>
          </div>

          {/* ── Nature / Type / Priorité */}
          <div className={blk}>
            <p className={sec}><i className="bi bi-tools text-amber-400"></i>Type d'intervention & Priorité</p>

            <label className={lbl}>Intervention * {isEdit && <span className="font-normal normal-case opacity-60">(non modifiable après soumission)</span>}</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {NATURES.map(n=>{
                const active = form.nature_intervention===n.code;
                return (
                  <button type="button" key={n.code} disabled={isEdit}
                    onClick={()=>set('nature_intervention',n.code)}
                    className={`px-4 py-3 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed
                      ${active ? 'text-white border-transparent shadow' : dark?'border-gray-700 text-gray-400 hover:bg-gray-700/40':'border-gray-200 text-gray-500 hover:bg-gray-100'} ${isEdit&&!active?'opacity-40':''}`}
                    style={active?{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}:{}}>
                    <i className={`bi ${n.icon}`}></i>{n.libelle}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Type maintenance</label>
                <select value={form.type_maintenance} onChange={e=>set('type_maintenance',e.target.value)} className={inp}>
                  {TYPES_MAINTENANCE.map(t=><option key={t.code} value={t.code}>{t.libelle}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Type d'intervention *</label>
                <select value={form.type_intervention} onChange={e=>set('type_intervention',e.target.value)} className={inp}>
                  <option value="">Sélectionner</option>
                  {TYPES_INTERVENTION.map(t=><option key={t.code} value={t.code}>{t.libelle}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Priorité</label>
                <select value={form.priorite} onChange={e=>set('priorite',e.target.value)} className={inp}>
                  {PRIORITES.map(p=><option key={p.code} value={p.code}>{p.libelle}</option>)}
                </select>
                {form.priorite==='urgente'&&<p className="text-[10px] mt-1 text-red-500 font-semibold"><i className="bi bi-lightning-charge-fill mr-0.5"></i>Notification immédiate</p>}
              </div>
            </div>
          </div>

          {/* ── Anomalie constatée */}
          <div className={blk}>
            <p className={sec}><i className="bi bi-exclamation-octagon-fill text-orange-400"></i>Anomalie constatée *</p>
            <textarea rows={3} value={form.anomalie_constatee} onChange={e=>set('anomalie_constatee',e.target.value)}
              placeholder="Que constate-t-on ? De quoi s'agit-il (symptômes, panne, usure...) ?"
              className={inp+' resize-none'}/>

          </div>

          {/* ── Direction / service + km + statut véhicule */}
          <div className={blk}>
            <p className={sec}><i className="bi bi-diagram-3-fill text-indigo-400"></i>Direction / service & état du véhicule</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Direction / service (liste)</label>
                <select value={form.service_select}
                  onChange={e=>{set('service_select',e.target.value);if(e.target.value)set('direction_service_autre','');}} className={inp}>
                  <option value="">— Sélectionner —</option>
                  <optgroup label="Directions">
                    {directions.map(d=><option key={`d${d.id}`} value={`d:${d.id}`}>{d.nom}{d.reference?` (${d.reference})`:''}</option>)}
                  </optgroup>
                  <optgroup label="Services / affectations">
                    {affectations.map(a=><option key={`a${a.id}`} value={`a:${a.id}`}>{a.nom}</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className={lbl}>Ou saisir un service</label>
                <input type="text" value={form.direction_service_autre}
                  onChange={e=>{set('direction_service_autre',e.target.value);if(e.target.value.trim())set('service_select','');}}
                  placeholder="Ex : Agence de Moanda" className={inp}/>
              </div>
              <div>
                <label className={lbl}>Kilométrage (km)</label>
                <input type="number" min={0} value={form.kilometrage}
                  onChange={e=>set('kilometrage',e.target.value)} placeholder="Relevé du compteur" className={inp}/>
                {vehInfo && <p className={`text-[10px] mt-1 ${dark?'text-gray-500':'text-gray-400'}`}>Actuel : {vehInfo.kilometrage.toLocaleString('fr-FR')} km (ne peut pas être inférieur)</p>}
              </div>
              <div>
                <label className={lbl}>Statut du véhicule</label>
                <select value={form.statut_vehicule} onChange={e=>set('statut_vehicule',e.target.value)} className={inp}>
                  <option value="">Ne pas modifier</option>
                  {statutsVeh.map(s=><option key={s.code} value={s.code}>{s.libelle}</option>)}
                </select>
                <p className={`text-[10px] mt-1 ${dark?'text-gray-500':'text-gray-400'}`}>Appliqué au véhicule dès la soumission.</p>
              </div>
            </div>
          </div>

          {/* ── Recommandation */}
          <div className={blk}>
            <p className={sec}><i className="bi bi-lightbulb-fill text-yellow-400"></i>Recommandation</p>
            <textarea rows={3} value={form.recommandation} onChange={e=>set('recommandation',e.target.value)}
              placeholder="Intervention conseillée, pièces à prévoir, précautions..."
              className={inp+' resize-none'}/>
          </div>

          {/* Information workflow : uniquement pour les demandes EXTERNES (aucun texte pour l'interne) */}
          {externe && (
            <div className={`${dark?'bg-fuchsia-900/20 border-fuchsia-800 text-fuchsia-300':'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700'} rounded-2xl border p-4 flex items-start gap-3`}>
              <i className="bi bi-envelope-paper-fill text-lg mt-0.5 shrink-0"></i>
              <p className="text-xs leading-relaxed">
                Intervention <strong>externe</strong> : un email est envoyé au <strong>DAAL</strong>, seul habilité à l'<strong>approuver</strong> ou la <strong>rejeter</strong> (motif obligatoire).
              </p>
            </div>
          )}

          {error && (
            <div className={`rounded-2xl border p-4 flex items-start gap-3 ${dark?'bg-red-900/20 border-red-800 text-red-300':'bg-red-50 border-red-200 text-red-700'}`}>
              <i className="bi bi-x-circle-fill text-lg mt-0.5 shrink-0"></i>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}
        </div>

        <div className={`p-5 border-t ${dark?'border-gray-800':'border-gray-200'} flex justify-end gap-3 shrink-0`}>
          <button onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Annuler
          </button>
          <button onClick={submit} disabled={!canSubmit}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow hover:opacity-90 disabled:opacity-40"
            style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
            <i className={`bi ${saving?'bi-arrow-repeat animate-spin':isEdit?'bi-check-lg':'bi-send-fill'}`}></i>
            {saving ? 'Envoi...' : isEdit ? 'Enregistrer' : 'Soumettre la demande'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Menu 3 points — les actions dépendent des droits calculés (API + rôle)
// Le DAAL ne voit que : « Voir les détails » + « Approuver / Rejeter » (demandes externes en attente)
// (les confirmations sont faites par SweetAlert2 dans les handlers du composant principal)
const ActionMenu = ({ item, dark, theme, onView, onEdit, onValider, onRejectQuick, onDelete, onCreerIntervention }) => {
  const [open,setOpen]=useState(false); const [pos,setPos]=useState({top:0,left:0}); const ref=useRef(null);
  const toggle=e=>{e.stopPropagation();if(!open){const r=ref.current.getBoundingClientRect();setPos({top:r.bottom+4,left:r.right-220});}setOpen(o=>!o);};
  useEffect(()=>{ if(!open)return; const c=()=>setOpen(false); const t=setTimeout(()=>document.addEventListener('click',c,{once:true}),0); return()=>{clearTimeout(t);document.removeEventListener('click',c);}; },[open]);
  const mi=(l,ic,c,fn)=>(
    <button onClick={e=>{e.stopPropagation();setOpen(false);fn();}}
      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 ${dark?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}>
      <i className={`bi ${ic} text-base`} style={{color:c}}></i>{l}
    </button>
  );
  return (
    <>
      <button ref={ref} onClick={toggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${open?'text-white':dark?'text-gray-400 hover:bg-gray-700':'text-gray-400 hover:bg-gray-100'}`}
        style={open?{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}:{}}>
        <i className="bi bi-three-dots-vertical text-sm"></i>
      </button>
      {open&&createPortal(
        <div onClick={e=>e.stopPropagation()}
          className={`fixed z-[9999] rounded-xl shadow-2xl border py-1.5 w-56 ${dark?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}
          style={{top:pos.top,left:pos.left,animation:'fadeInDown .15s ease-out'}}>
          {mi('Voir les détails','bi-eye-fill',theme.primary,()=>onView(item))}
          {item.can_edit&&mi('Modifier','bi-pencil-fill',theme.primary,()=>onEdit(item))}
          {['en_cours', 'validee', 'approuvee'].includes(item.statut) && onCreerIntervention && (
            mi('Saisir l\'intervention', 'bi-tools', '#f59e0b', () => onCreerIntervention(item))
          )}
          {/* Approuver / Rejeter : demandes EXTERNES en attente, DAAL uniquement (droit calculé par l'API) */}
          {item.can_treat&&mi('Approuver l\'intervention','bi-gear-fill','#3b82f6',()=>onValider(item))}
          {item.can_treat&&mi('Rejeter','bi-x-circle-fill','#ef4444',()=>onRejectQuick(item))}
          {item.can_delete&&(
            <>
              <div className={`my-1 mx-3 border-t ${dark?'border-gray-700':'border-gray-100'}`}/>
              {mi('Supprimer','bi-trash3-fill','#ef4444',()=>onDelete(item))}
            </>
          )}
        </div>,document.body
      )}
    </>
  );
};

// ── Groupes d'export (Excel : une feuille par groupe · PDF : une section par groupe)
const EXPORT_GROUPS = [
  { key:'statut',           label:'Par statut',               list:STATUTS,           get:d=>d.statut              },
  { key:'priorite',         label:'Par priorité',             list:PRIORITES,         get:d=>d.priorite            },
  { key:'nature',           label:'Par nature',               list:NATURES,           get:d=>d.nature_intervention },
  { key:'type_maintenance', label:'Par type de maintenance',  list:TYPES_MAINTENANCE, get:d=>d.type_maintenance    },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
const DemandesIntervention = () => {
  const [dark,setDark]=useState(()=>{try{const s=localStorage.getItem('fleetify_darkMode');return s!==null?s==='true':true;}catch{return true;}});
  useEffect(()=>{try{localStorage.setItem('fleetify_darkMode',String(dark));}catch{}}, [dark]);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [showNotif,setShowNotif]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [anim,setAnim]=useState(false);
  const { theme } = useTheme();
  const navigate  = useNavigate();
  useEffect(()=>{const id=requestAnimationFrame(()=>requestAnimationFrame(()=>setAnim(true)));return()=>cancelAnimationFrame(id);},[]);

  // ── RÔLE UTILISATEUR ─────────────────────────────────────────────────────
  // DAAL = lecture + export + valider/rejeter uniquement (pas de CRUD).
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
  const canWrite = userRole !== null && !isDaal;   // créer / modifier / supprimer

  // ── Styles SweetAlert2 (thème dynamique)
  useEffect(()=>{
    const styleId='swal-custom-styles';
    document.getElementById(styleId)?.remove();
    const style=document.createElement('style');
    style.id=styleId;
    style.textContent=buildSwalStyles(theme);
    document.head.appendChild(style);
  },[theme]);

  // ── Données issues du backend
  const [demandesRaw,setDemandes]=useState([]);
  const [refs,setRefs]=useState(null);
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState('');
  const me = refs?.me || {};

  // Droits effectifs = droits de l'API ∩ droits du rôle.
  //  • DAAL : can_treat reste celui de l'API (valider / rejeter) ; edit / delete forcés à false
  //  • valider / rejeter : uniquement les demandes EXTERNES (une interne n'est jamais validée)
  //  • « Terminer » n'existe plus sur cette page
  const demandes = useMemo(() => demandesRaw.map(d => ({
    ...d,
    can_edit:     canWrite && !!d.can_edit,
    can_terminer: false,
    can_delete:   canWrite,
    can_treat:    d.nature_intervention === 'externe' && !!d.can_treat,
  })), [demandesRaw, canWrite]);

  const [search,setSearch]=useState('');
  const [fPeriode,setFPeriode]=useState('365j');
  const [fVehicule,setFVehicule]=useState('');
  const [fStatut,setFStatut]=useState('');
  const [fPriorite,setFPriorite]=useState('');
  const [fRole,setFRole]=useState('');
  const [fNature,setFNature]=useState('');
  const [sortBy,setSortBy]=useState('date_demande');
  const [sortDir,setSortDir]=useState('desc');
  const [page,setPage]=useState(1);
  const [vue,setVue]=useState('table');

  const [detailItem,setDetailItem]=useState(null);
  const [editItem,setEditItem]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [exportOpen,setExportOpen]=useState(false);
  const expRef=useRef(null);

  // ── Raccourcis SweetAlert2 liés au thème courant
  const ok  = (title,text)=>showSuccess(dark,theme,title,text);
  const err = (title,text,icon)=>showError(dark,theme,title,text,icon);

  useEffect(()=>{const h=e=>{if(expRef.current&&!expRef.current.contains(e.target))setExportOpen(false);};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);

  // Sécurité : un DAAL ne peut jamais garder le formulaire ouvert
  useEffect(()=>{ if(!canWrite && showForm){ setShowForm(false); setEditItem(null); } },[canWrite,showForm]);

  // ── Chargement des données (axios)
  //  • load()      → chargement INITIAL : affiche les skeletons
  //  • load(true)  → rechargement SILENCIEUX : aucun skeleton, aucun clignotement ;
  //                  les nouvelles données remplacent simplement les anciennes dès qu'elles arrivent.
  // reqIdRef évite qu'une réponse ancienne (plus lente) écrase une réponse plus récente.
  const reqIdRef = useRef(0);
  const load = useCallback(async (silent = false) => {
    const myId = ++reqIdRef.current;
    if (!silent) setLoading(true);
    try {
      const [r, l] = await Promise.all([getReferences(), getDemandes()]);
      if (myId !== reqIdRef.current) return;      // une requête plus récente est déjà passée
      setRefs(r);
      setDemandes(l.data || []);
      setLoadError('');
    } catch (e) {
      if (e?.response?.status === 401) { navigate('/login'); return; }
      if (!silent) setLoadError(getApiError(e, 'Impossible de charger les demandes.'));
      // en mode silencieux : on garde simplement l'affichage actuel, sans message d'erreur
    } finally {
      if (!silent && myId === reqIdRef.current) setLoading(false);
    }
  }, [navigate]);
  useEffect(() => { load(); }, [load]);

  // Rechargement silencieux en arrière-plan (liste des demandes + référentiels véhicules, km, statuts…)
  // Volontairement NON attendu : il tourne pendant que le SweetAlert est affiché.
  const refreshSilent = useCallback(() => { load(true); }, [load]);

  // Mise à jour locale IMMÉDIATE (l'utilisateur voit le changement tout de suite)
  const upsert = d => {
    if(!d || d.id==null) return;
    setDemandes(prev=>prev.some(x=>x.id===d.id)?prev.map(x=>x.id===d.id?d:x):[d,...prev]);
  };

  const IPPG=10;
  const periodeInfo=PERIODES.find(p=>p.code===fPeriode)||PERIODES[4];
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-periodeInfo.jours);

  const filtered=demandes.filter(d=>{
    if(new Date(d.date_demande)<cutoff)return false;
    if(fVehicule&&d.vehicule_immatriculation!==fVehicule)return false;
    if(fStatut&&d.statut!==fStatut)return false;
    if(fPriorite&&d.priorite!==fPriorite)return false;
    if(fNature&&d.nature_intervention!==fNature)return false;
    if(fRole&&d.demandeur_role_code!==fRole)return false;
    if(search){const q=search.toLowerCase();
      return refDem(d.id).toLowerCase().includes(q)||d.vehicule_immatriculation.toLowerCase().includes(q)||(d.demandeur_nom||'').toLowerCase().includes(q)||getTypeIntLib(d.type_intervention).toLowerCase().includes(q);}
    return true;
  });

  const sorted=[...filtered].sort((a,b)=>{
    let va=a[sortBy],vb=b[sortBy];
    if(sortBy==='date_demande'){va=new Date(va||0);vb=new Date(vb||0);}
    return sortDir==='asc'?(va<vb?-1:va>vb?1:0):(va>vb?-1:va<vb?1:0);
  });
  const totalPages=Math.ceil(sorted.length/IPPG);
  const paginated=sorted.slice((page-1)*IPPG,page*IPPG);
  useEffect(()=>setPage(1),[fVehicule,fStatut,fPriorite,fRole,fNature,search,fPeriode]);

  // Si, après un rechargement/suppression, la page courante n'existe plus → on revient à la dernière page valide
  useEffect(()=>{ if(totalPages>0 && page>totalPages) setPage(totalPages); },[totalPages,page]);

  const hasF=fVehicule||fStatut||fPriorite||fRole||fNature||search;
  const resetF=()=>{setFVehicule('');setFStatut('');setFPriorite('');setFRole('');setFNature('');setSearch('');};
  const handleSort=col=>{if(sortBy===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortBy(col);setSortDir('desc');}};

  const nbEnAttente =filtered.filter(d=>d.statut==='en_attente').length;
  const nbEnCours   =filtered.filter(d=>d.statut==='en_cours').length;
  const nbTermine   =filtered.filter(d=>d.statut==='termine').length;
  const nbRejetee   =filtered.filter(d=>d.statut==='rejetee').length;
  const nbUrgEntAttente=filtered.filter(d=>d.priorite==='urgente'&&d.statut==='en_attente').length;

  // ── Actions → API (axios) + SweetAlert2
  // Ordre pour chaque action réussie :
  //   1) mise à jour locale immédiate (upsert / filter)
  //   2) rechargement silencieux lancé en arrière-plan (refreshSilent)
  //   3) SweetAlert affiché dans la foulée → les deux se produisent EN MÊME TEMPS
  // Création / modification : l'erreur remonte au formulaire (qui l'affiche) pour ne pas perdre la saisie
  // Renvoie true si l'enregistrement a abouti, false sinon.
  // Toute erreur (droits, validation 422, erreur serveur 500, réseau…) s'affiche dans un SweetAlert ;
  // le formulaire reste ouvert pour ne pas perdre la saisie.
  const handleSave=async(payload,id)=>{
    if(!canWrite){
      err('Action non autorisée',"Votre rôle ne permet pas de créer ou modifier une demande.");
      return false;
    }
    let res;
    try{
      res = id ? await updateDemande(id,payload) : await createDemande(payload);
    }catch(e){
      console.error('Erreur enregistrement demande :',e);
      err(id?'Modification impossible':'Soumission impossible', getApiError(e,"Une erreur est survenue pendant l'enregistrement."));
      return false;
    }
    // 0) fermeture IMMÉDIATE des modales (formulaire + détail), avant tout le reste
    setShowForm(false); setEditItem(null); setDetailItem(null);
    if(res?.data) upsert(res.data);         // 1) affichage immédiat
    refreshSilent();                        // 2) resynchronisation silencieuse en arrière-plan
    if(res?.warning){                       // demande enregistrée mais email DAAL non parti
      showError(dark,theme,id?'Demande modifiée':'Demande soumise',res.warning,'warning');
    }else{
      ok(id?'Demande modifiée':'Demande soumise', res?.message||(id?'Les modifications ont été enregistrées.':'La demande a été soumise avec succès.'));
    }
    return true;
  };

  // Exécute un appel axios, met à jour l'état, affiche le résultat via Swal. Renvoie true si OK.
  const act=async(fn,okTitle,okText)=>{
    try{
      const res=await fn();
      if(res?.data) upsert(res.data);       // 1) affichage immédiat
      refreshSilent();                      // 2) resynchronisation silencieuse en arrière-plan
      ok(okTitle,res?.message||okText);     // 3) alerte (en même temps)
      return true;
    }catch(e){
      refreshSilent();                      // l'état serveur a peut-être changé (ex. déjà traitée par un autre) → on resynchronise
      err('Action impossible',getApiError(e,'Action impossible'));
      return false;
    }
  };

  const descDem = item => `<strong>${esc(refDem(item.id))}</strong> · ${esc(getTypeIntLib(item.type_intervention))} · ${esc(item.vehicule_immatriculation)}`;

  // en_attente → en_cours   (demandes EXTERNES : DAAL uniquement — contrôlé par l'API)
  const handleValider=async item=>{
    if(!item.can_treat) return false;
    const r=await showConfirm(dark,theme,{
      title: "Approuver l'intervention ?",
      html: `${descDem(item)}<br/>La demande passera en <strong style="color:${theme.primary}">En cours de traitement</strong>.`,
      confirmText: 'Approuver',
    });
    if(!r.isConfirmed) return false;
    return act(()=>validerDemande(item.id),'Demande validée','L\'intervention est en cours de traitement.');
  };

  // en_attente → rejetee (motif obligatoire, saisi dans la boîte SweetAlert2)
  const handleReject=async item=>{
    if(!item.can_treat) return false;
    const r=await createSwal(dark,theme).fire({
      icon:'warning',
      title:'Rejeter la demande',
      html:descDem(item),
      input:'textarea',
      inputPlaceholder:'Expliquez la raison du refus...',
      inputAttributes:{'aria-label':'Motif du rejet'},
      showCancelButton:true,
      confirmButtonText:'Confirmer le rejet',
      cancelButtonText:'Annuler',
      customClass:{
        popup:         dark?'swal-dark-popup':'swal-light-popup',
        title:         dark?'swal-dark-title':'swal-light-title',
        htmlContainer: dark?'swal-dark-html':'swal-light-html',
        input:         dark?'swal-dark-input':'swal-light-input',
        confirmButton: 'swal-confirm-btn swal-danger',
        cancelButton:  'swal-cancel-btn',
      },
      buttonsStyling:false,
      inputValidator:v=>(!v||!v.trim())?'Le motif du rejet est obligatoire.':undefined,
    });
    if(!r.isConfirmed) return false;
    return act(()=>rejeterDemande(item.id,r.value.trim()),'Demande rejetée','La demande a été rejetée.');
  };

  // Suppression (interdite au DAAL)
  const handleDelete=async item=>{
    if(!canWrite) return false;
    const r=await showConfirm(dark,theme,{
      title:'Confirmer la suppression',
      html:`${descDem(item)}<br/><small style="color:#9ca3af">Cette action est irréversible.</small>`,
      confirmText:'<i class="bi bi-trash" style="margin-right:6px"></i>Supprimer',
      isDanger:true,
    });
    if(!r.isConfirmed) return false;
    try{
      const res=await deleteDemande(item.id);
      setDemandes(prev=>prev.filter(d=>d.id!==item.id));   // 1) disparition immédiate de la ligne
      refreshSilent();                                      // 2) resynchronisation silencieuse
      ok('Supprimée',res?.message||`La demande ${refDem(item.id)} a été supprimée.`); // 3) alerte
      return true;
    }catch(e){
      refreshSilent();
      err('Suppression impossible',getApiError(e,'Suppression impossible'));
      return false;
    }
  };

  // ── EXPORTS (ouverts à tous les rôles, DAAL compris) ─────────────────────
  // Colonnes exportées (Excel + PDF) — « Anomalie constatée » et « Commentaire » fusionnés
  const expHeaders=['Référence','Date','Véhicule','Demandeur','Nature','Type','Intervention','Priorité','Statut','Direction / service','Kilométrage','Statut véhicule','Anomalie constatée et Commentaire'];
  const anomalieEtCommentaire = d => {
    const parts = [];
    if (d.anomalie_constatee) parts.push(d.anomalie_constatee);
    if (d.commentaire)        parts.push(`Commentaire : ${d.commentaire}`);
    return parts.length ? parts.join(' | ') : '—';
  };
  const toRow=d=>[
    refDem(d.id),
    fmtDT(d.date_demande),
    d.vehicule_immatriculation,
    d.demandeur_nom||'—',
    getNatureInfo(d.nature_intervention).libelle,
    getTypeMaintInfo(d.type_maintenance).libelle,
    getTypeIntLib(d.type_intervention),
    getPrioriteInfo(d.priorite).libelle,
    getStatutInfo(d.statut).libelle,
    d.direction_service||'—',
    d.kilometrage??'—',
    d.statut_vehicule?libStatutVeh(d.statut_vehicule):'—',
    anomalieEtCommentaire(d),
  ];

  // format : 'excel' | 'pdf' ; group : un élément de EXPORT_GROUPS ou null (= tout)
  const doExport=(format,group=null)=>{
    if(sorted.length===0){ err('Aucune donnée','Aucune demande à exporter avec les filtres actuels.','warning'); setExportOpen(false); return; }
    const sections = group
      ? group.list.map(it=>({ name:it.libelle, rows:sorted.filter(d=>group.get(d)===it.code).map(toRow) })).filter(s=>s.rows.length>0)
      : [{ name:'Demandes', rows:sorted.map(toRow) }];
    try{
      if(format==='excel'){
        exportToExcel(sections, group?`Demandes_intervention_${group.key}`:'Demandes_intervention', expHeaders, theme?.primary);
        ok('Export effectué','Le fichier Excel a été généré.');
      }else{
        exportToPDF(
          group?`Demandes d'intervention — ${group.label}`:"Demandes d'intervention",
          expHeaders,
          sections.map(s=>({ title:group?s.name:null, rows:s.rows }))
        );
        ok('Export généré','Le PDF est prêt à être imprimé.');
      }
    }catch(e){
      console.error('Erreur export :',e);
      err('Export impossible',"Une erreur est survenue pendant l'export.");
    }
    setExportOpen(false);
  };

  const SortIc=({col})=><i className={`bi bi-arrow-${sortBy===col?(sortDir==='asc'?'up':'down'):'down-up'} text-[10px] ml-1 opacity-60`}></i>;

  const Pagination=()=>totalPages<=1?null:(
    <div className={`px-6 py-4 border-t ${dark?'border-gray-800':'border-gray-100'} flex items-center justify-between`}>
      <p className={`text-sm ${dark?'text-gray-400':'text-gray-500'}`}>{(page-1)*IPPG+1}–{Math.min(page*IPPG,sorted.length)} sur {sorted.length}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
          className={`p-2 rounded-lg ${dark?'text-gray-400 hover:bg-gray-800 disabled:opacity-30':'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
          <i className="bi bi-chevron-left"></i>
        </button>
        {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
          let p;if(totalPages<=5)p=i+1;else if(page<=3)p=i+1;else if(page>=totalPages-2)p=totalPages-4+i;else p=page-2+i;
          return <button key={p} onClick={()=>setPage(p)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold ${page===p?'text-white':dark?'text-gray-400 hover:bg-gray-800':'text-gray-600 hover:bg-gray-100'}`}
            style={page===p?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>{p}</button>;
        })}
        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
          className={`p-2 rounded-lg ${dark?'text-gray-400 hover:bg-gray-800 disabled:opacity-30':'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );

  // Les actions de la modale détail agissent sur la version « vivante » de la demande
  const liveDetail = detailItem ? (demandes.find(d=>d.id===detailItem.id)||detailItem) : null;

  // Props communes du menu d'actions
  const menuProps = {
    dark, theme,
    onView:   it=>setDetailItem(it),
    onEdit:   it=>{ if(!canWrite) return; setEditItem(it);setShowForm(true); },
    onValider:handleValider,
    onRejectQuick:handleReject,
    onDelete: handleDelete,
    onCreerIntervention: it => navigate(`/Admin/Navigation/InterventionsVehicules?demande_id=${it.id}`),
  };

  return (
    <div className={`${dark?'bg-gray-950':'bg-gray-50'} min-h-screen flex flex-col`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
      <style>{`
        @keyframes fadeInUp   {from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInDown {from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        .rh:hover{filter:brightness(1.06);cursor:pointer}
        .ch{transition:transform .15s,box-shadow .15s}.ch:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.13)}
      `}</style>

      <Sidebar darkMode={dark} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate}/>
      <Header  darkMode={dark} setDarkMode={setDark} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotif} setShowNotifications={setShowNotif} showProfile={showProfile} setShowProfile={setShowProfile}/>

      {(showNotif||showProfile)&&<div className="fixed inset-0 z-30" onClick={()=>{setShowNotif(false);setShowProfile(false);}}/>}

      <main className="flex-1 transition-all duration-300 pt-24 px-4 pb-10" style={{marginLeft:sidebarCollapsed?'4.5rem':'15rem'}}>

        {/* Erreur de chargement */}
        {loadError&&(
          <div className={`mb-5 p-4 rounded-2xl border flex items-center gap-3 ${dark?'bg-red-900/20 border-red-800':'bg-red-50 border-red-200'}`}>
            <i className="bi bi-wifi-off text-red-400 text-xl shrink-0"></i>
            <div className="flex-1">
              <p className={`text-sm font-bold ${dark?'text-red-300':'text-red-700'}`}>Chargement impossible</p>
              <p className={`text-xs ${dark?'text-red-500':'text-red-400'}`}>{loadError}</p>
            </div>
            <button onClick={()=>load()} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600">Réessayer</button>
          </div>
        )}


        {/* Alerte urgences */}
        {!loading&&nbUrgEntAttente>0&&(
          <div className={`mb-5 p-4 rounded-2xl border flex items-center gap-3 ${dark?'bg-red-900/20 border-red-800':'bg-red-50 border-red-200'}`}
            style={{animation:anim?'fadeInUp .4s ease-out both':'none'}}>
            <i className="bi bi-lightning-charge-fill text-red-400 text-xl shrink-0"></i>
            <div className="flex-1">
              <p className={`text-sm font-bold ${dark?'text-red-300':'text-red-700'}`}>
                {nbUrgEntAttente} demande{nbUrgEntAttente>1?'s urgentes':' urgente'} en attente de validation
              </p>
              <p className={`text-xs ${dark?'text-red-500':'text-red-400'}`}>Action immédiate requise</p>
            </div>
            <button onClick={()=>{setFPriorite('urgente');setFStatut('en_attente');}}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600">
              Voir
            </button>
          </div>
        )}

        {/* ── KPIs COMPACTS — 4 tuiles : En attente / En cours / Terminées / Rejetées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {loading ? (
            Array.from({length:4}).map((_,i)=><SkeletonKpi key={i} dark={dark}/>)
          ) : (
            <>
              <KpiCard label="En attente"             target={nbEnAttente} total={filtered.length} icon="bi-hourglass-split"    color="#f59e0b" sub="en attente de validation"  delay={0}    dark={dark} animate={anim}/>
              <KpiCard label="En cours de traitement" target={nbEnCours}   total={filtered.length} icon="bi-gear-fill"          color="#3b82f6" sub="interventions en cours"     delay={0.07} dark={dark} animate={anim}/>
              <KpiCard label="Terminées"              target={nbTermine}   total={filtered.length} icon="bi-check-circle-fill"  color="#10b981" sub="interventions clôturées"    delay={0.14} dark={dark} animate={anim}/>
              <KpiCard label="Rejetées"               target={nbRejetee}   total={filtered.length} icon="bi-x-circle-fill"      color="#ef4444" sub="demandes refusées"          delay={0.21} dark={dark} animate={anim}/>
            </>
          )}
        </div>

        {/* ── GRAPHIQUES ── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {Array.from({length:3}).map((_,i)=><SkeletonChart key={i} dark={dark}/>)}
          </div>
        ) : (() => {
          const topVehicules=[...new Set(demandes.map(d=>d.vehicule_immatriculation))].map(im=>({
            im, label:im.split(' ').slice(0,2).join(' '),
            en_cours:  demandes.filter(d=>d.vehicule_immatriculation===im&&d.statut==='en_cours').length,
            en_attente:demandes.filter(d=>d.vehicule_immatriculation===im&&d.statut==='en_attente').length,
            total:     demandes.filter(d=>d.vehicule_immatriculation===im).length,
          })).sort((a,b)=>b.total-a.total).slice(0,6);

          const topTypes=TYPES_INTERVENTION.map(t=>({
            label:t.libelle.slice(0,8), fullLabel:t.libelle,
            v1:filtered.filter(d=>d.type_intervention===t.code&&d.type_maintenance==='corrective').length,
            v2:filtered.filter(d=>d.type_intervention===t.code&&d.type_maintenance==='preventive').length,
            l1:'Correc.',l2:'Prév.',
          })).filter(t=>t.v1+t.v2>0).sort((a,b)=>(b.v1+b.v2)-(a.v1+a.v2)).slice(0,7);

          const mois=['Jan','Fév','Mar','Avr','Mai','Jui','Jul','Aoû','Sep','Oct','Nov','Déc'];
          const now=new Date();
          const evolutionData=Array.from({length:8},(_,i)=>{
            const d=new Date(now.getFullYear(),now.getMonth()-7+i,1);
            const m=d.getMonth(), y=d.getFullYear();
            const inMonth=ds=>{const dd=new Date(ds);return dd.getMonth()===m&&dd.getFullYear()===y;};
            return {
              label:`${mois[m]}`,
              v1:demandes.filter(d=>inMonth(d.date_demande)).length,
              v2:demandes.filter(d=>inMonth(d.date_demande)&&d.statut==='termine').length,
              l1:'Total', l2:'Terminées',
            };
          });

          const gCard=`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-6`;
          const gTitle=(t,sub,ic,c)=>(
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full" style={{background:c||theme.primary}}></div>
                  <h3 className={`font-bold ${dark?'text-white':'text-gray-900'}`}>{t}</h3>
                </div>
                <p className={`text-xs mt-0.5 ml-3 ${dark?'text-gray-500':'text-gray-400'}`}>{sub}</p>
              </div>
              <i className={`bi ${ic} text-xl`} style={{color:c||theme.primary,opacity:.5}}></i>
            </div>
          );

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <div className={gCard} style={{animation:anim?'fadeInUp .5s ease-out .28s both':'none'}}>
                {gTitle('Demandes par véhicule','En cours vs En attente · top 6','bi-car-front-fill','#3b82f6')}
                <BarChart data={topVehicules.map(v=>({label:v.label,v1:v.en_cours,v2:v.en_attente,l1:'En cours',l2:'Attente'}))} dark={dark} color="#3b82f6" color2="#f59e0b" stacked={false}/>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>En cours</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-yellow-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>En attente</span></div>
                </div>
              </div>

              <div className={gCard} style={{animation:anim?'fadeInUp .5s ease-out .35s both':'none'}}>
                {gTitle("Types d'intervention",'Correctives vs Préventives','bi-tools','#ef4444')}
                <BarChart data={topTypes} dark={dark} color="#ef4444" color2="#10b981" stacked={true}/>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>Corrective</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>Préventive</span></div>
                </div>
              </div>

              <div className={gCard} style={{animation:anim?'fadeInUp .5s ease-out .42s both':'none'}}>
                {gTitle('Évolution mensuelle','Total demandes · Terminées (8 mois)','bi-graph-up',theme.primary)}
                <LineChart data={evolutionData} dark={dark} color={theme.primary} color2="#10b981"/>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 rounded-full" style={{background:theme.primary}}></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>Total</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 rounded-full bg-green-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>Terminées</span></div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6" style={{animation:anim?'fadeInUp .4s ease-out .05s both':'none'}}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
              <i className="bi bi-file-earmark-plus-fill text-white text-xl"></i>
            </div>
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${dark?'text-white':'text-gray-900'}`}>Demandes d'intervention</h1>
            </div>
          </div>
          {/* Ajouter une demande : masqué pour le DAAL */}
          {loading ? (
            <Sk dark={dark} className="h-10 w-72 rounded-xl"/>
          ) : (canWrite && me.can_create) && (
            <button onClick={()=>{setEditItem(null);setShowForm(true);}}
              className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-lg hover:opacity-90"
              style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
              <i className="bi bi-plus-circle-fill"></i>Ajouter une nouvelle demande d'intervention
            </button>
          )}
        </div>

        {/* Toolbar
            position:relative + zIndex : la barre (et son menu Exporter) passe AU-DESSUS du tableau,
            dont l'animation (transform) créait sinon une couche qui masquait le menu. */}
        <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 mb-6`}
          style={{position:'relative',zIndex:30,animation:anim?'fadeInUp .5s ease-out .5s both':'none'}}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                [fPeriode,  setFPeriode,  PERIODES.map(p=>({value:p.code,label:p.libelle})),                                   null,             'bi-calendar-range'],
                [fVehicule, setFVehicule, (refs?.vehicules||[]).map(v=>({value:v.immatriculation,label:v.immatriculation})),    'Tous véhicules', 'bi-car-front-fill'],
                [fNature,   setFNature,   NATURES.map(n=>({value:n.code,label:n.libelle})),                                     'Toutes natures', 'bi-box-arrow-up-right'],
                [fRole,     setFRole,     [{value:'chauffeur',label:'Chauffeurs'},{value:'chef_parc',label:'Chef de parc'},{value:'admin',label:'Admin'},{value:'daal',label:'DAAL'}],'Tous rôles','bi-people-fill'],
                [fPriorite, setFPriorite, PRIORITES.map(p=>({value:p.code,label:p.libelle})),                                  'Priorités',      'bi-flag-fill'],
                [fStatut,   setFStatut,   STATUTS.map(s=>({value:s.code,label:s.libelle})),                                    'Tous statuts',   'bi-circle-half'],
              ].map(([val,setter,opts,ph,ic],i)=>(
                <div key={i} className="relative">
                  <i className={`bi ${ic} absolute left-2.5 top-1/2 -translate-y-1/2 text-xs ${dark?'text-gray-500':'text-gray-400'} pointer-events-none`}></i>
                  <select value={val} onChange={e=>setter(e.target.value)}
                    className={`pl-7 pr-3 py-2 rounded-xl border text-sm font-medium appearance-none ${dark?'bg-gray-800 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                    {ph&&<option value="">{ph}</option>}
                    {opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
              {hasF&&<button onClick={resetF} className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 ${dark?'text-red-400 hover:bg-gray-800':'text-red-500 hover:bg-red-50'}`}><i className="bi bi-x-lg text-xs"></i>Effacer</button>}
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex rounded-xl border overflow-hidden ${dark?'border-gray-700':'border-gray-200'}`}>
                {[['table','bi-table'],['cards','bi-grid-3x3-gap-fill']].map(([v,ic])=>(
                  <button key={v} onClick={()=>setVue(v)}
                    className={`p-2 text-sm ${vue===v?'text-white':dark?'text-gray-400 hover:bg-gray-800':'text-gray-500 hover:bg-gray-50'}`}
                    style={vue===v?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>
                    <i className={`bi ${ic}`}></i>
                  </button>
                ))}
              </div>
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs ${dark?'text-gray-500':'text-gray-400'}`}></i>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Réf, véhicule, demandeur..."
                  className={`pl-8 pr-4 py-2 rounded-xl border text-sm w-52 ${dark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-gray-50 border-gray-200'} focus:outline-none`}/>
              </div>

              {/* Export : disponible pour tous les rôles (y compris DAAL) */}
              <div className="relative" ref={expRef}>
                <button onClick={()=>setExportOpen(!exportOpen)} disabled={loading}
                  className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <i className="bi bi-download"></i>Exporter
                </button>
                {exportOpen&&(
                  <div className={`absolute right-0 top-full mt-1 z-[60] rounded-xl shadow-2xl border py-2 min-w-[320px] max-h-[70vh] overflow-y-auto ${dark?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    <p className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${dark?'text-gray-500':'text-gray-400'}`}>Toutes les demandes filtrées ({sorted.length})</p>
                    {[['Exporter tout en Excel','bi-file-earmark-spreadsheet','text-green-500','excel',null],
                      ['Exporter tout en PDF','bi-file-earmark-pdf','text-red-500','pdf',null]]
                    .map(([l,ic,cl,fmt,g],i)=>(
                      <button key={i} onClick={()=>doExport(fmt,g)}
                        className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 transition-colors ${dark?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}>
                        <i className={`bi ${ic} ${cl} text-base`}></i>{l}
                      </button>
                    ))}
                    {EXPORT_GROUPS.map(g=>(
                      <React.Fragment key={g.key}>
                        <div className={`my-2 border-t ${dark?'border-gray-700':'border-gray-200'}`}></div>
                        <p className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${dark?'text-gray-500':'text-gray-400'}`}>{g.label}</p>
                        <button onClick={()=>doExport('excel',g)}
                          className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 transition-colors ${dark?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}>
                          <i className="bi bi-file-earmark-spreadsheet text-green-500 text-base"></i>{g.label} — Excel
                        </button>
                        <button onClick={()=>doExport('pdf',g)}
                          className={`w-full text-left px-4 py-2 text-sm font-semibold flex items-center gap-2.5 transition-colors ${dark?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}>
                          <i className="bi bi-file-earmark-pdf text-red-500 text-base"></i>{g.label} — PDF
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {loading
            ? <Sk dark={dark} className="h-3 w-32"/>
            : <p className={`text-xs ${dark?'text-gray-600':'text-gray-400'}`}>{sorted.length} résultat(s) affiché{sorted.length>1?'s':''}</p>}
        </div>

        {/* Tableau */}
        {vue==='table'&&(
          <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm overflow-hidden`}
            style={{animation:anim?'fadeInUp .5s ease-out .55s both':'none'}}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
                    {[['Réf.','id'],['Date','date_demande'],['Véhicule','vehicule_immatriculation'],['Demandeur / Rôle',null],['Type',null],['Priorité','priorite'],['Statut','statut'],['Actions',null]].map(([h,col],i)=>(
                      <th key={i} onClick={()=>col&&!loading&&handleSort(col)}
                        className={`px-4 py-4 text-left text-sm font-bold uppercase tracking-wider text-white whitespace-nowrap ${col?'cursor-pointer hover:bg-white/10 select-none':''}`}>
                        {h}{col&&<SortIc col={col}/>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({length:IPPG}).map((_,i)=><SkeletonRow key={i} dark={dark}/>)
                  ) : paginated.length===0?(
                    <tr><td colSpan={8} className={`text-center py-16 ${dark?'text-gray-500':'text-gray-400'}`}>
                      <i className="bi bi-file-earmark-x text-5xl block mb-3 opacity-30"></i>
                      <p className="text-base">Aucune demande trouvée</p>
                    </td></tr>
                  ):paginated.map((item,idx)=>{
                    const pri=getPrioriteInfo(item.priorite);
                    const stat=getStatutInfo(item.statut);
                    const nat=getNatureInfo(item.nature_intervention);
                    const rs=roleStyle(item.demandeur_role_code);
                    const vehLabel=`${item.vehicule_marque||''} ${item.vehicule_modele||''}`.trim();
                    return (
                      <tr key={item.id} className="rh transition-all"
                        style={{backgroundColor:idx%2===0?(dark?'#0c1929':'#fafafa'):(dark?'#111827':'#fff'),animation:anim?`fadeInUp .35s ease-out ${idx*.04}s both`:''}}
                        onClick={()=>setDetailItem(item)}>
                        <td className="px-4 py-5"><span className={`text-sm font-mono font-bold ${dark?'text-gray-400':'text-gray-500'}`}>{refDem(item.id)}</span></td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <p className={`text-base font-semibold ${dark?'text-gray-100':'text-gray-900'}`}>{fmtDate(item.date_demande)}</p>
                          <p className={`text-sm ${dark?'text-gray-500':'text-gray-400'}`}>{fmtRel(item.date_demande)}</p>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <p className={`text-base font-bold ${dark?'text-gray-100':'text-gray-900'}`}>{item.vehicule_immatriculation}</p>
                          <p className={`text-sm ${dark?'text-gray-500':'text-gray-400'}`}>{vehLabel||'—'}</p>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0" style={{background:rs.dot}}>
                              {item.demandeur_nom?.charAt(0)||'?'}
                            </div>
                            <div>
                              <p className={`text-base font-semibold ${dark?'text-gray-100':'text-gray-900'}`}>{item.demandeur_nom||'—'}</p>

                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <p className={`text-sm font-semibold ${dark?'text-gray-200':'text-gray-800'}`}>{getTypeIntLib(item.type_intervention)}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${getTypeMaintInfo(item.type_maintenance).bg}`}>{getTypeMaintInfo(item.type_maintenance).libelle}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${nat.bg}`}>{nat.libelle}</span>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${pri.bg}`}><i className={`bi ${pri.icon} mr-1`}></i>{pri.libelle}</span>
                        </td>
                        <td className="px-4 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${stat.bg}`}><i className={`bi ${stat.icon} mr-1`}></i>{stat.libelle}</span>
                          {item.statut==='rejetee'&&item.motif_rejet&&(
                            <p className={`text-xs mt-1 max-w-[130px] truncate ${dark?'text-gray-500':'text-gray-400'}`} title={item.motif_rejet}>{item.motif_rejet}</p>
                          )}
                        </td>
                        <td className="px-4 py-5 text-center" onClick={e=>e.stopPropagation()}>
                          <ActionMenu item={item} {...menuProps}/>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!loading&&<Pagination/>}
          </div>
        )}

        {/* Cards */}
        {vue==='cards'&&(
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              Array.from({length:6}).map((_,i)=><SkeletonCard key={i} dark={dark}/>)
            ) : paginated.length===0?(
              <div className="col-span-full text-center py-16">
                <i className={`bi bi-file-earmark-x text-5xl block mb-3 ${dark?'text-gray-600':'text-gray-300'}`}></i>
                <p className={`text-sm ${dark?'text-gray-500':'text-gray-400'}`}>Aucune demande trouvée</p>
              </div>
            ):paginated.map((item,idx)=>{
              const pri=getPrioriteInfo(item.priorite);
              const stat=getStatutInfo(item.statut);
              const nat=getNatureInfo(item.nature_intervention);
              const rs=roleStyle(item.demandeur_role_code);
              return (
                <div key={item.id} onClick={()=>setDetailItem(item)}
                  className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5 cursor-pointer ch`}
                  style={{animation:anim?`fadeInUp .4s ease-out ${idx*.04}s both`:'none'}}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-xs font-mono font-bold ${dark?'text-gray-500':'text-gray-400'}`}>{refDem(item.id)}</span>
                      <p className={`text-sm font-bold mt-0.5 ${dark?'text-gray-100':'text-gray-900'}`}>{getTypeIntLib(item.type_intervention)}</p>
                    </div>
                    <div onClick={e=>e.stopPropagation()}>
                      <ActionMenu item={item} {...menuProps}/>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stat.bg}`}><i className={`bi ${stat.icon} mr-0.5`}></i>{stat.libelle}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pri.bg}`}>{pri.libelle}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getTypeMaintInfo(item.type_maintenance).bg}`}>{getTypeMaintInfo(item.type_maintenance).libelle}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${nat.bg}`}><i className={`bi ${nat.icon} mr-0.5`}></i>{nat.libelle}</span>
                  </div>
                  <div className={`${dark?'bg-gray-800':'bg-gray-50'} rounded-xl p-3 space-y-1.5 mb-3`}>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-car-front-fill text-xs ${dark?'text-gray-500':'text-gray-400'}`}></i>
                      <span className={`text-xs font-semibold ${dark?'text-gray-300':'text-gray-700'}`}>{item.vehicule_immatriculation}</span>
                      <span className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>{item.vehicule_marque?` · ${item.vehicule_marque}`:''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{background:rs.dot}}>
                        {item.demandeur_nom?.charAt(0)||'?'}
                      </div>
                      <span className={`text-xs ${dark?'text-gray-300':'text-gray-700'}`}>{item.demandeur_nom||'—'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-auto ${rs.bg}`}>{item.demandeur_role_libelle||'Saisie libre'}</span>
                    </div>
                  </div>
                  {item.anomalie_constatee&&<p className={`text-xs italic mb-2 line-clamp-2 ${dark?'text-gray-500':'text-gray-400'}`}>"{item.anomalie_constatee}"</p>}
                  {item.statut==='rejetee'&&item.motif_rejet&&<p className="text-xs text-red-500 mb-1 line-clamp-1"><i className="bi bi-x-circle-fill mr-1"></i>{item.motif_rejet}</p>}

                  {/* Actions rapides card — demandes EXTERNES en attente (approuver / rejeter : DAAL selon l'API) */}
                  {item.statut==='en_attente'&&item.can_treat&&(
                    <div className="flex gap-1.5 mt-3 pt-3" style={{borderTop:`1px solid ${dark?'#1f2937':'#f1f5f9'}`}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>handleValider(item)}
                        className="flex-1 py-1.5 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90"
                        style={{background:'linear-gradient(to right,#3b82f6,#2563eb)'}}>
                        <i className="bi bi-gear-fill"></i>Approuver
                      </button>
                      <button onClick={()=>handleReject(item)}
                        className="flex-1 py-1.5 rounded-lg border border-red-300 text-red-500 text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-50">
                        <i className="bi bi-x-lg"></i>Rejeter
                      </button>
                    </div>
                  )}

                  <p className={`text-[10px] mt-2 ${dark?'text-gray-600':'text-gray-400'}`}>{fmtRel(item.date_demande)}</p>
                </div>
              );
            })}
            {!loading&&totalPages>1&&(
              <div className="col-span-full">
                <div className={`rounded-2xl border ${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} shadow-sm`}><Pagination/></div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER (identique à la page Véhicules) ── */}
      <Footer darkMode={dark} sidebarCollapsed={sidebarCollapsed} theme={theme} />

      {liveDetail&&(
        <DetailModal
          item={liveDetail} dark={dark} theme={theme}
          onClose={()=>setDetailItem(null)}
          onEdit={it=>{ if(!canWrite) return; setEditItem(it);setShowForm(true); }}
          onValider={handleValider}
          onReject={handleReject}
          onDelete={handleDelete}/>
      )}
      {/* Formulaire création / modification : masqué pour le DAAL */}
      {canWrite&&showForm&&<FormModal item={editItem} refs={refs} me={me} dark={dark} theme={theme} onClose={()=>{setShowForm(false);setEditItem(null);}} onSave={handleSave}/>}
    </div>
  );
};

export default DemandesIntervention;