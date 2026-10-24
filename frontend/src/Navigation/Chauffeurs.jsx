import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import chauffeurApi from '../api/Admin-Axios/Chauffeurs-axios';
import Swal from 'sweetalert2';
import XLSX from 'xlsx-js-style';
import { getSwalConfig, showSuccess, showError, showConfirm } from '../utils/walConfig';
import { getFormStyles, getTableStyles, getRowBackgroundColor, PageSkeleton } from '../utils/uniformStyles';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const MISSION_TYPES = {
  transport_fonds:  { label: 'Transport de fonds',   color: '#ef4444', icon: 'bi-safe-fill',       weight: 3   },
  vip:              { label: 'VIP / Protocole',       color: '#8b5cf6', icon: 'bi-star-fill',        weight: 2   },
  administratif:    { label: 'Administratif',         color: '#3b82f6', icon: 'bi-briefcase-fill',   weight: 1   },
  logistique:       { label: 'Logistique',            color: '#f97316', icon: 'bi-box-seam-fill',    weight: 1.5 },
  urgence:          { label: 'Urgence / Prioritaire', color: '#dc2626', icon: 'bi-lightning-fill',   weight: 2.5 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonPulse = ({ darkMode, className = '' }) => (
  <div className={`rounded animate-pulse ${className}`}
    style={{ backgroundColor: darkMode ? '#1e293b' : '#e2e8f0' }} />
);

const StatCardsSkeleton = ({ darkMode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <SkeletonPulse darkMode={darkMode} className="h-3 w-28" />
            <SkeletonPulse darkMode={darkMode} className="h-8 w-16 mt-2" />
            <SkeletonPulse darkMode={darkMode} className="h-3 w-20" />
          </div>
          <SkeletonPulse darkMode={darkMode} className="w-12 h-12 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const TableRowsSkeleton = ({ darkMode, cols = 7, rows = 6 }) => (
  <>
    {[...Array(rows)].map((_, i) => (
      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? (darkMode ? '#1a2535' : '#eef2ff') : (darkMode ? '#1c1f2b' : '#f3f4f6') }}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <SkeletonPulse darkMode={darkMode} className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <SkeletonPulse darkMode={darkMode} className="h-3 w-28" />
              <SkeletonPulse darkMode={darkMode} className="h-2.5 w-20" />
            </div>
          </div>
        </td>
        {[...Array(cols - 2)].map((_, j) => (
          <td key={j} className="px-6 py-4">
            <SkeletonPulse darkMode={darkMode} className="h-3 w-20 mx-auto" />
          </td>
        ))}
        <td className="px-6 py-4">
          <div className="flex gap-2">
            <SkeletonPulse darkMode={darkMode} className="w-8 h-8 rounded-lg" />
            <SkeletonPulse darkMode={darkMode} className="w-8 h-8 rounded-lg" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

const KpiMetricsSkeleton = ({ darkMode }) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SkeletonPulse darkMode={darkMode} className="h-3 w-32" />
              <SkeletonPulse darkMode={darkMode} className="h-8 w-20 mt-1" />
            </div>
            <SkeletonPulse darkMode={darkMode} className="w-10 h-10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}>
          <SkeletonPulse darkMode={darkMode} className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <SkeletonPulse darkMode={darkMode} className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <SkeletonPulse darkMode={darkMode} className="h-3 w-32" />
                  <SkeletonPulse darkMode={darkMode} className="h-2 w-20" />
                </div>
                <SkeletonPulse darkMode={darkMode} className="w-20 h-2 rounded-full" />
                <SkeletonPulse darkMode={darkMode} className="w-8 h-3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4`}>
          <SkeletonPulse darkMode={darkMode} className="h-4 w-36 mb-4" />
          <div className="space-y-2.5">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <SkeletonPulse darkMode={darkMode} className="h-2.5 w-16" />
                <SkeletonPulse darkMode={darkMode} className="flex-1 h-3 rounded-full" />
                <SkeletonPulse darkMode={darkMode} className="h-2.5 w-6" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS SCORE
// ─────────────────────────────────────────────────────────────────────────────

function calculerScore(kpi) {
  let score = 100;
  const accRecentResp    = kpi.accidentParType?.responsable_1an    || 0;
  const accRecentNonResp = kpi.accidentParType?.non_responsable_1an || 0;
  const accAncienResp    = Math.max(0, (kpi.accidentParType?.responsable    || 0) - accRecentResp);
  const accAncienNonResp = Math.max(0, (kpi.accidentParType?.non_responsable || 0) - accRecentNonResp);
  score -= accRecentResp    * 20;
  score -= accRecentNonResp * 8;
  score -= accAncienResp    * 8;
  score -= accAncienNonResp * 3;
  const missionsAn = kpi.missions?.['1an'] || 0;
  if (missionsAn >= 80) score += 5;
  else if (missionsAn >= 60) score += 3;
  else if (missionsAn >= 40) score += 1;
  const typesEffectues = Object.values(kpi.missionsParType || {}).filter(v => v > 0).length;
  if (typesEffectues >= 4) score += 3;
  else if (typesEffectues >= 3) score += 2;
  else if (typesEffectues >= 2) score += 1;
  return Math.max(0, Math.min(100, Math.round(score)));
}

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

// ─────────────────────────────────────────────────────────────────────────────
// SOUS-COMPOSANTS CHARTS
// ─────────────────────────────────────────────────────────────────────────────

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

const ScoreGauge = ({ score, animateCharts }) => {
  const color = getScoreColor(score);
  const r = 56, circ = 2 * Math.PI * r;
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

const MiniBarChart = ({ data, color, animateCharts, darkMode }) => {
  const max = Math.max(...data, 1);
  const W = 270, H = 85, left = 26, bottom = 66;
  const chartH = bottom - 10;
  const slotW = (W - left) / data.length;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {[0, Math.round(max / 2), max].map((v, i) => (
        <text key={i} x={left - 4} y={bottom - (v / max) * chartH} textAnchor="end" fontSize="7.5" fill={darkMode ? '#6b7280' : '#9ca3af'}>{v}</text>
      ))}
      {[0, 1, 2].map(i => (
        <line key={i} x1={left} y1={bottom - ([0, Math.round(max / 2), max][i] / max) * chartH} x2={W - 4} y2={bottom - ([0, Math.round(max / 2), max][i] / max) * chartH} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="0.5" />
      ))}
      {data.map((v, idx) => {
        const cx = left + slotW * idx + slotW / 2;
        const bw = Math.min(slotW * 0.6, 13);
        const h = animateCharts ? (v / max) * chartH : 0;
        return (
          <g key={idx}>
            <rect x={cx - bw / 2} y={bottom - h} width={bw} height={h || 0} fill={color} rx="2"
              style={{ transition: `height 0.7s ease-out ${idx * 0.04}s, y 0.7s ease-out ${idx * 0.04}s` }} />
            <text x={cx} y={H - 1} textAnchor="middle" fontSize="7" fill={darkMode ? '#6b7280' : '#9ca3af'}>{MOIS[idx]}</text>
          </g>
        );
      })}
    </svg>
  );
};

const AccidentLineChart = ({ data, animateCharts, darkMode }) => {
  const W = 270, H = 85, left = 26, bottom = 66;
  const chartH = bottom - 10;
  const max = Math.max(...data, 1);
  const slotW = (W - left - 4) / (data.length - 1);
  const px = (i) => left + i * slotW;
  const py = (v) => bottom - (v / max) * chartH;
  const pathD = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)},${py(v)}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {[0, 1, 2].map(i => (
        <line key={i} x1={left} y1={py([0, Math.round(max / 2), max][i])} x2={W - 4} y2={py([0, Math.round(max / 2), max][i])} stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth="0.5" />
      ))}
      {[0, Math.round(max / 2), max].map((v, i) => (
        <text key={i} x={left - 4} y={py(v)} textAnchor="end" fontSize="7.5" fill={darkMode ? '#6b7280' : '#9ca3af'}>{v}</text>
      ))}
      <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"
        style={{ strokeDasharray: animateCharts ? '0' : '1000', strokeDashoffset: animateCharts ? '0' : '1000', transition: 'stroke-dashoffset 1.2s ease-out' }} />
      {data.map((v, i) => (
        <g key={i}>
          <circle cx={px(i)} cy={py(v)} r="3" fill={v > 0 ? '#ef4444' : '#10b981'}
            style={{ opacity: animateCharts ? 1 : 0, transition: `opacity 0.3s ${i * 0.08 + 1}s` }} />
          <text x={px(i)} y={H - 1} textAnchor="middle" fontSize="7" fill={darkMode ? '#6b7280' : '#9ca3af'}>{MOIS[i]}</text>
        </g>
      ))}
    </svg>
  );
};

const MiniDonut = ({ responsable, non_responsable, animateCharts }) => {
  const total = responsable + non_responsable || 1;
  const r = 36, circ = 2 * Math.PI * r;
  const pctNR = non_responsable / total;
  const pctR  = responsable / total;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#374151" strokeWidth="16" />
      <circle cx="55" cy="55" r={r} fill="none" stroke="#10b981" strokeWidth="16"
        strokeDasharray={`${animateCharts ? pctNR * circ : 0} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s ease-out', transform: 'rotate(-90deg)', transformOrigin: '55px 55px' }} />
      <circle cx="55" cy="55" r={r} fill="none" stroke="#ef4444" strokeWidth="16"
        strokeDasharray={`${animateCharts ? pctR * circ : 0} ${circ}`}
        strokeDashoffset={`${-pctNR * circ}`}
        style={{ transition: 'stroke-dasharray 1s ease-out 0.3s', transform: 'rotate(-90deg)', transformOrigin: '55px 55px' }} />
      <text x="55" y="51" textAnchor="middle" fontSize="17" fontWeight="bold" fill="#ef4444">{responsable}</text>
      <text x="55" y="65" textAnchor="middle" fontSize="8" fill="#9ca3af">resp.</text>
    </svg>
  );
};

const MissionsTypeChart = ({ missionsParType, animateCharts, darkMode }) => {
  const total = Object.values(missionsParType).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-2">
      {Object.entries(MISSION_TYPES).map(([key, mt]) => {
        const val = missionsParType[key] || 0;
        const pct = (val / total) * 100;
        return (
          <div key={key} className="flex items-center gap-2">
            <i className={`${mt.icon} text-xs flex-shrink-0`} style={{ color: mt.color }}></i>
            <span className={`text-[10px] w-28 truncate flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{mt.label}</span>
            <div className={`flex-1 h-2.5 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: animateCharts ? `${pct}%` : '0%', backgroundColor: mt.color }} />
            </div>
            <span className="text-[11px] font-bold w-6 text-right" style={{ color: mt.color }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS EXCEL (xlsx-js-style — même principe que la page Véhicules)
// ─────────────────────────────────────────────────────────────────────────────

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

// Construit une feuille stylée : en-tête coloré, bordures, lignes alternées,
// largeur de colonnes adaptée, filtre automatique.
const buildStyledSheet = (headers, data, headerColor) => {
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
  ws['!cols'] = headers.map((h, i) => ({
    wch: Math.min(40, Math.max(String(h).length, ...data.map(r => String(r[i] ?? '').length)) + 3),
  }));
  ws['!rows'] = [{ hpt: 26 }];
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(data.length, 0), c: headers.length - 1 } }) };
  return ws;
};

const safeSheetName = (n) => String(n).replace(/[\\/:*?\[\]]/g, '_').slice(0, 31);
const safeFileName  = (n) => String(n).replace(/[\\/:*?"<>|]/g, '_');

// Liste des chauffeurs → Excel
function exportChauffeursExcel(chauffeurs, kpiMap, headerColor) {
  const headers = ['Nom','Email','Direction','Statut','Date Embauche','Permis','Score','Missions (1an)','Accidents (1an)','Acc. Responsable','Acc. Non-Resp.','KM Total'];
  const rows = chauffeurs.map(c => {
    const kpi = kpiMap[c.id] || {};
    return [
      c.nom, c.email, c.direction || '-', c.statut === 'actif' ? 'Actif' : 'Inactif',
      c.dateEmbauche ? new Date(c.dateEmbauche).toLocaleDateString('fr-FR') : '-',
      c.categoriesPermis || '-',
      kpi.score || 0, kpi.missions?.['1an'] || 0,
      kpi.accidents?.['1an'] || 0, kpi.accidentParType?.responsable_1an || 0,
      kpi.accidentParType?.non_responsable_1an || 0, kpi.km || 0,
    ];
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildStyledSheet(headers, rows, headerColor), safeSheetName('Chauffeurs'));
  XLSX.writeFile(wb, `${safeFileName('Chauffeurs')}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Alertes & suivis + résumé de tous les chauffeurs → Excel (2 feuilles)
function exportAlertesExcel(chauffeurs, kpiMap, headerColor) {
  const alertChauffeurs = chauffeurs.filter(c =>
    (kpiMap[c.id]?.accidents?.['1an'] || 0) >= 2 || (kpiMap[c.id]?.score || 100) < 70
  );

  const hAlertes = ['#','Chauffeur','Direction','Statut','Score /100','Niveau alerte','Acc. (3m)','Acc. (6m)','Acc. (1an)','Acc. Responsable','Acc. Non-Resp.','Missions (1an)','KM'];
  const rAlertes = alertChauffeurs.map((c, i) => {
    const kpi = kpiMap[c.id] || {};
    const isDanger = (kpi.accidents?.['1an'] || 0) >= 3;
    return [
      i + 1, c.nom, c.direction || '-',
      c.statut === 'actif' ? 'Actif' : 'Inactif',
      kpi.score || 0,
      isDanger ? 'URGENT' : 'À surveiller',
      kpi.accidents?.['3m'] || 0, kpi.accidents?.['6m'] || 0, kpi.accidents?.['1an'] || 0,
      kpi.accidentParType?.responsable_1an || 0, kpi.accidentParType?.non_responsable_1an || 0,
      kpi.missions?.['1an'] || 0, kpi.km || 0,
    ];
  });

  const hResume = ['#','Chauffeur','Direction','Statut','Score /100','Niveau','Acc. (1an)','Missions (1an)','KM total'];
  const rResume = chauffeurs
    .map(c => ({ ...c, score: kpiMap[c.id]?.score || 0 }))
    .sort((a, b) => b.score - a.score)
    .map((c, i) => {
      const kpi = kpiMap[c.id] || {};
      return [i + 1, c.nom, c.direction || '-', c.statut === 'actif' ? 'Actif' : 'Inactif', kpi.score || 0, getScoreLabel(kpi.score || 0), kpi.accidents?.['1an'] || 0, kpi.missions?.['1an'] || 0, kpi.km || 0];
    });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildStyledSheet(hAlertes, rAlertes, headerColor), safeSheetName('Alertes & Suivis'));
  XLSX.utils.book_append_sheet(wb, buildStyledSheet(hResume, rResume, headerColor), safeSheetName('Tous les chauffeurs'));
  XLSX.writeFile(wb, `alertes_fleetify_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS PDF
// ─────────────────────────────────────────────────────────────────────────────

function exportPDF(chauffeurs, kpiMap) {
  const win = window.open('', '_blank');
  const now = new Date().toLocaleDateString('fr-FR');
  const rows = chauffeurs.map((c, i) => {
    const kpi = kpiMap[c.id] || {};
    const score = kpi.score || 0;
    const sFg = score >= 90 ? '#059669' : score >= 75 ? '#2563eb' : score >= 60 ? '#d97706' : '#dc2626';
    const sBg = score >= 90 ? '#d1fae5' : score >= 75 ? '#dbeafe' : score >= 60 ? '#fef3c7' : '#fee2e2';
    const stBg = c.statut === 'actif' ? '#d1fae5' : '#fee2e2';
    const stFg = c.statut === 'actif' ? '#065f46' : '#991b1b';
    const bg = i % 2 === 0 ? '#f0f4ff' : '#ffffff';
    const acc1an = kpi.accidents?.['1an'] || 0;
    return `<tr style="background:${bg}${acc1an >= 2 ? ';border-left:3px solid #ef4444' : ''}">
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb"><strong>${c.nom}</strong><br><small style="color:#6b7280">${c.direction}</small></td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center"><span style="background:${stBg};color:${stFg};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600">${c.statut === 'actif' ? 'Actif' : 'Inactif'}</span></td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${c.categoriesPermis || '-'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#2563eb;font-weight:bold">${kpi.missions?.['1an'] || 0}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:${acc1an >= 3 ? '#dc2626' : acc1an >= 1 ? '#d97706' : '#059669'};font-weight:bold">${acc1an}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626">${kpi.accidentParType?.responsable_1an || 0}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${(kpi.km || 0).toLocaleString('fr-FR')} km</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center"><span style="background:${sBg};color:${sFg};padding:3px 10px;border-radius:20px;font-weight:bold;font-size:11px">${score}/100</span></td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:10px;color:${sFg}">${getScoreLabel(score)}</td>
    </tr>`;
  }).join('');
  const totalAcc  = chauffeurs.reduce((a, c) => a + (kpiMap[c.id]?.accidents?.['1an'] || 0), 0);
  const totalMiss = chauffeurs.reduce((a, c) => a + (kpiMap[c.id]?.missions?.['1an'] || 0), 0);
  const totalKm   = chauffeurs.reduce((a, c) => a + (kpiMap[c.id]?.km || 0), 0);
  const avgScore  = chauffeurs.length ? Math.round(chauffeurs.reduce((a, c) => a + (kpiMap[c.id]?.score || 0), 0) / chauffeurs.length) : 0;
  const nbAlerts  = chauffeurs.filter(c => (kpiMap[c.id]?.accidents?.['1an'] || 0) >= 2).length;
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Chauffeurs – ${now}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;padding:28px}
  .header{background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;padding:20px 24px;border-radius:10px;margin-bottom:20px}
  .header h1{font-size:20px;margin-bottom:4px}.header p{opacity:.8;font-size:11px}
  .kpi-row{display:flex;gap:10px;margin-bottom:18px}
  .kpi-box{flex:1;padding:12px;border-radius:8px;border:1px solid #e5e7eb;text-align:center}
  .kpi-box .val{font-size:22px;font-weight:bold}.kpi-box .lbl{font-size:10px;color:#6b7280;margin-top:2px}
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
  win.document.close(); win.focus(); setTimeout(() => win.print(), 400);
}

function exportDriverPDF(chauffeur, kpiMap) {
  const kpi = kpiMap[chauffeur.id] || {};
  const win = window.open('', '_blank');
  const now = new Date().toLocaleDateString('fr-FR');
  const score = kpi.score || 0;
  const sFg = score >= 90 ? '#059669' : score >= 75 ? '#2563eb' : score >= 60 ? '#d97706' : '#dc2626';
  const sBg = score >= 90 ? '#d1fae5' : score >= 75 ? '#dbeafe' : score >= 60 ? '#fef3c7' : '#fee2e2';
  const periodRows = [
    { key: '3m', label: '3 mois' }, { key: '6m', label: '6 mois' },
    { key: '1an', label: '1 an' }, { key: 'all', label: 'Total' },
  ].map((p, i) => {
    const acc = kpi.accidents?.[p.key] || 0, miss = kpi.missions?.[p.key] || 0;
    return `<tr style="background:${i % 2 === 0 ? '#f0f4ff' : '#fff'}"><td style="padding:7px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${p.label}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${acc >= 3 ? '#dc2626' : acc >= 1 ? '#d97706' : '#059669'};font-weight:bold">${acc}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#2563eb;font-weight:bold">${miss}</td></tr>`;
  }).join('');
  const moisRows = MOIS.map((m, i) => {
    const acc = kpi.accidentParMois?.[i] || 0, miss = kpi.missionsParMois?.[i] || 0;
    return `<tr style="background:${i % 2 === 0 ? '#f0f4ff' : '#fff'}"><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${m}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${acc > 0 ? '#dc2626' : '#059669'};font-weight:${acc > 0 ? 'bold' : 'normal'}">${acc}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#2563eb">${miss}</td></tr>`;
  }).join('');
  const typeRows = Object.entries(MISSION_TYPES).map(([key, mt], i) => {
    const val = kpi.missionsParType?.[key] || 0;
    return `<tr style="background:${i % 2 === 0 ? '#f0f4ff' : '#fff'}"><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:${mt.color};font-weight:600">${mt.label}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:bold;color:${mt.color}">${val}</td></tr>`;
  }).join('');
  win.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Bilan – ${chauffeur.nom}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#1f2937;padding:26px}
  .header{background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#fff;padding:18px 22px;border-radius:10px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}
  .header h1{font-size:18px;margin-bottom:3px}.header p{opacity:.8;font-size:11px}
  .score-badge{padding:8px 20px;border-radius:8px;font-size:24px;font-weight:bold;border:2px solid ${sFg};color:${sFg};background:${sBg};white-space:nowrap}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
  .info-item{background:#f9fafb;padding:8px 12px;border-radius:8px;border:1px solid #e5e7eb}
  .info-item .lbl{font-size:10px;color:#6b7280;margin-bottom:2px}.info-item .val{font-size:12px;font-weight:600}
  .section-title{font-size:13px;font-weight:bold;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:5px;margin-bottom:10px;margin-top:16px}
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
    <div class="info-item"><div class="lbl">Date d'embauche</div><div class="val">${chauffeur.dateEmbauche ? new Date(chauffeur.dateEmbauche).toLocaleDateString('fr-FR') : '-'}</div></div>
    <div class="info-item"><div class="lbl">Permis</div><div class="val">${chauffeur.categoriesPermis || '-'}</div></div>
    <div class="info-item"><div class="lbl">Statut</div><div class="val" style="color:${chauffeur.statut === 'actif' ? '#059669' : '#dc2626'}">${chauffeur.statut === 'actif' ? '✅ Actif' : '❌ Inactif'}</div></div>
    <div class="info-item"><div class="lbl">Direction</div><div class="val">${chauffeur.direction}</div></div>
    <div class="info-item"><div class="lbl">Kilométrage total</div><div class="val" style="color:#2563eb">${(kpi.km || 0).toLocaleString('fr-FR')} km</div></div>
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
    </div>
  </div>
  <br><p style="color:#9ca3af;font-size:10px;text-align:center">© 2026 SGS Gabon – Fleetify v1.0 | Document confidentiel</p>
  </body></html>`);
  win.document.close(); win.focus(); setTimeout(() => win.print(), 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DÉTAIL CHAUFFEUR — ÉLARGI
// ─────────────────────────────────────────────────────────────────────────────

const ChauffeurDetailModal = ({ chauffeur, darkMode, theme, onClose, onEdit }) => {
  const cardBg  = darkMode ? 'bg-gray-800/60' : 'bg-gray-50';
  const textMain = darkMode ? 'text-white' : 'text-gray-900';
  const textSub  = darkMode ? 'text-gray-400' : 'text-gray-500';
  const border   = darkMode ? 'border-gray-700' : 'border-gray-200';

  const infoItems = [
    { icon: 'bi-envelope-fill',       label: 'Email',              value: chauffeur.email,                                                                                              color: '#3b82f6' },
    { icon: 'bi-building',            label: 'Direction',          value: chauffeur.direction || '–',                                                                                   color: '#8b5cf6' },
    { icon: 'bi-person-badge-fill',   label: 'Rôle',               value: chauffeur.role || 'Chauffeur',                                                                                color: '#10b981' },
    { icon: 'bi-calendar-check-fill', label: "Date d'embauche",    value: chauffeur.dateEmbauche ? new Date(chauffeur.dateEmbauche).toLocaleDateString('fr-FR') : '–',                  color: '#f59e0b' },
    { icon: 'bi-credit-card-fill',    label: 'Catégories permis',  value: chauffeur.categoriesPermis || '–',                                                                            color: '#ef4444' },
    { icon: 'bi-circle-fill',         label: 'Statut',             value: chauffeur.statut === 'actif' ? 'Actif' : 'Inactif', color: chauffeur.statut === 'actif' ? '#10b981' : '#ef4444' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full overflow-hidden`}
        style={{ maxWidth: '780px', animation: 'slideUp 0.25s ease-out' }}
      >
        {/* ── Bandeau header gradient + avatar ── */}
        <div className="relative h-32 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
          {/* Motif décoratif */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition-all">
            <i className="bi bi-x-lg"></i>
          </button>
          {/* Avatar grand format */}
          <div className="absolute -bottom-12 left-8">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl border-4"
              style={{ backgroundColor: chauffeur.couleur, borderColor: darkMode ? '#111827' : '#ffffff' }}
            >
              {chauffeur.initiales}
            </div>
          </div>
          {/* Nom dans le header */}
          <div className="absolute bottom-4 left-36">
            <h2 className="text-xl font-bold text-white drop-shadow">{chauffeur.nom}</h2>
            <p className="text-white/70 text-sm">{chauffeur.direction}</p>
          </div>
          {/* Badge statut dans le header */}
          <div className="absolute top-4 left-8">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              chauffeur.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <i className={`bi ${chauffeur.statut === 'actif' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
              {chauffeur.statut === 'actif' ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* ── Corps ── */}
        <div className="pt-16 px-8 pb-8">
          {/* Grille 3 colonnes pour les infos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
            {infoItems.map((item, i) => (
              <div key={i} className={`${cardBg} rounded-xl p-4 flex items-start gap-3 border ${border}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.color + '20' }}>
                  <i className={`${item.icon} text-base`} style={{ color: item.color }}></i>
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${textSub} mb-0.5`}>{item.label}</p>
                  <p className={`text-sm font-semibold ${textMain} truncate`}
                    style={item.label === 'Statut' ? { color: item.color } : {}}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Séparateur */}
          <div className={`border-t ${border} mb-6`} />

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <i className="bi bi-x-lg mr-2"></i>Fermer
            </button>
            <button onClick={onEdit}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className="bi bi-pencil-fill"></i>
              Modifier ce chauffeur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL EDIT CHAUFFEUR
// ─────────────────────────────────────────────────────────────────────────────

const ChauffeurEditModal = ({ chauffeur, darkMode, theme, onClose, onSaved }) => {
  const [form, setForm] = useState({
    dateEmbauche: chauffeur.dateEmbauche || '',
    categoriesPermis: chauffeur.categoriesPermis || '',
  });
  const [saving, setSaving] = useState(false);
  const primaryColor = theme.primary || '#3b82f6';

  const handleSave = async () => {
    setSaving(true);
    try {
      await chauffeurApi.put(`/admin/chauffeurs/${chauffeur.id}`, {
        date_embauche:     form.dateEmbauche     || null,
        categories_permis: form.categoriesPermis || null,
      });
      onSaved({ ...chauffeur, dateEmbauche: form.dateEmbauche, categoriesPermis: form.categoriesPermis });
      showSuccess(darkMode, theme, 'Chauffeur mis à jour !', 'Les informations ont été enregistrées avec succès.');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response?.data?.errors || {}).flat().join(' ')
        : 'Une erreur est survenue lors de la mise à jour.';
      showError(darkMode, primaryColor, 'Erreur de mise à jour', msg);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
    darkMode
      ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500/30 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500/20 focus:border-blue-400'
  }`;
  const labelClass = `block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden`}
        style={{ animation: 'slideUp 0.25s ease-out' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: chauffeur.couleur }}>
              {chauffeur.initiales}
            </div>
            <div>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Modifier le chauffeur</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{chauffeur.nom}</p>
            </div>
          </div>
          <button onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className={`${darkMode ? 'bg-gray-800/50' : 'bg-blue-50'} rounded-xl p-3 flex items-center gap-2`}>
            <i className="bi bi-info-circle text-blue-500"></i>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-blue-700'}`}>
              Seuls la date d'embauche et les catégories de permis sont modifiables ici.
            </p>
          </div>
          <div>
            <label className={labelClass}><i className="bi bi-calendar-check mr-1 text-blue-500"></i>Date d'embauche</label>
            <input type="date" value={form.dateEmbauche} max={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(f => ({ ...f, dateEmbauche: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}><i className="bi bi-credit-card mr-1 text-purple-500"></i>Catégories de permis</label>
            <input type="text" placeholder="ex: B, C, E" value={form.categoriesPermis}
              onChange={e => setForm(f => ({ ...f, categoriesPermis: e.target.value }))} className={inputClass} />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Séparez les catégories par des virgules</p>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
            {saving
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Enregistrement…</>
              : <><i className="bi bi-check-lg"></i> Enregistrer</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DÉTAIL DOCUMENT — ÉLARGI
// ─────────────────────────────────────────────────────────────────────────────

const DocumentDetailModal = ({ document: doc, darkMode, theme, onClose, onEdit }) => {
  const textMain = darkMode ? 'text-white' : 'text-gray-900';
  const textSub  = darkMode ? 'text-gray-400' : 'text-gray-500';
  const cardBg   = darkMode ? 'bg-gray-800/60' : 'bg-gray-50';
  const border   = darkMode ? 'border-gray-700' : 'border-gray-200';

  const statutConfig = {
    valide:         { label: 'Valide',         bg: 'bg-green-100',  text: 'text-green-700',  icon: 'bi-check-circle-fill',        accent: '#10b981' },
    expire_bientot: { label: 'Expire bientôt', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'bi-exclamation-circle-fill',  accent: '#f59e0b' },
    expire:         { label: 'Expiré',         bg: 'bg-red-100',    text: 'text-red-700',    icon: 'bi-x-circle-fill',            accent: '#ef4444' },
  };
  const st = statutConfig[doc.statut] || statutConfig.valide;

  const typeIcon = doc.typeDocumentCode === 'permis_conduire'  ? 'bi-credit-card-fill'
    : doc.typeDocumentCode === 'carte_identite'                ? 'bi-person-badge-fill'
    : doc.typeDocumentCode === 'visite_medicale'               ? 'bi-heart-pulse-fill'
    : doc.typeDocumentCode === 'passeport'                     ? 'bi-book-fill'
    :                                                            'bi-file-earmark-fill';

  const typeColor = doc.typeDocumentCode === 'permis_conduire'  ? '#3b82f6'
    : doc.typeDocumentCode === 'carte_identite'                 ? '#8b5cf6'
    : doc.typeDocumentCode === 'visite_medicale'                ? '#10b981'
    : doc.typeDocumentCode === 'passeport'                      ? '#f97316'
    :                                                             '#6b7280';

  // Champs répartis en deux colonnes
  const fieldsLeft = [
    { icon: 'bi-person-fill',         color: '#3b82f6', label: 'Chauffeur',          value: doc.chauffeurNom || '–'       },
    { icon: typeIcon,                 color: typeColor,  label: 'Type de document',   value: doc.typeDocument || '–'       },
    { icon: 'bi-hash',                color: '#8b5cf6', label: 'N° de document',      value: doc.numeroPermis || '–'       },
    { icon: 'bi-tag-fill',            color: '#f97316', label: 'Catégories permis',   value: doc.categoriesPermis || '–'   },
  ];
  const fieldsRight = [
    { icon: 'bi-geo-alt-fill',        color: '#10b981', label: 'Pays de délivrance',  value: doc.paysDelivrance || '–'    },
    { icon: 'bi-calendar-check-fill', color: '#f59e0b', label: 'Date de délivrance',  value: doc.dateDelivrance  ? new Date(doc.dateDelivrance).toLocaleDateString('fr-FR')  : '–' },
    { icon: 'bi-calendar-x-fill',     color: '#ef4444', label: "Date d'expiration",   value: doc.dateExpiration  ? new Date(doc.dateExpiration).toLocaleDateString('fr-FR')  : '–' },
    { icon: 'bi-file-earmark-text',   color: '#6b7280', label: 'Nom du document',     value: doc.nomDocument || '–'       },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl w-full overflow-hidden`}
        style={{ maxWidth: '860px', animation: 'slideUp 0.25s ease-out' }}
      >
        {/* ── Header gradient ── */}
        <div
          className="relative px-8 pt-7 pb-10"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
        >
          {/* Motif décoratif */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition-all z-10">
            <i className="bi bi-x-lg text-sm"></i>
          </button>

          {/* Layout header : icone + titre + badge statut */}
          <div className="relative flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
              <i className={`${typeIcon} text-white text-3xl`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-1 truncate">
                {doc.nomDocument || doc.typeDocument || 'Document'}
              </h2>
              <p className="text-white/70 text-sm mb-3">{doc.chauffeurNom}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                  <i className={st.icon}></i>
                  {st.label}
                </span>
                {doc.dateExpiration && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                    <i className="bi bi-calendar3"></i>
                    Exp. : {new Date(doc.dateExpiration).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Corps ── */}
        <div className="px-8 py-7">
          {/* Grille 2 colonnes × 4 lignes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Colonne gauche */}
            <div className="space-y-3">
              {fieldsLeft.map((f, i) => (
                <div key={i} className={`${cardBg} rounded-xl p-4 flex items-center gap-3 border ${border}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: f.color + '22' }}>
                    <i className={`${f.icon} text-base`} style={{ color: f.color }}></i>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${textSub} mb-0.5`}>{f.label}</p>
                    <p className={`text-sm font-semibold ${textMain} truncate`}>{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Colonne droite */}
            <div className="space-y-3">
              {fieldsRight.map((f, i) => (
                <div key={i} className={`${cardBg} rounded-xl p-4 flex items-center gap-3 border ${border}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: f.color + '22' }}>
                    <i className={`${f.icon} text-base`} style={{ color: f.color }}></i>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${textSub} mb-0.5`}>{f.label}</p>
                    <p className={`text-sm font-semibold ${textMain} truncate`}
                      style={f.label === "Date d'expiration" ? { color: st.accent } : {}}>
                      {f.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes — pleine largeur */}
          {doc.notes && (
            <div className={`${cardBg} rounded-xl p-5 border ${border} mb-5`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${textSub} mb-2`}>Notes</p>
              <p className={`text-sm ${textMain} leading-relaxed`}>{doc.notes}</p>
            </div>
          )}

          {/* Lien fichier — pleine largeur */}
          {doc.urlFichier && (
            <a href={doc.urlFichier} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${border} mb-6 group transition-all hover:border-blue-400`}
              style={{ backgroundColor: darkMode ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)' }}>
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="bi bi-file-earmark-arrow-down text-blue-600 text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${textMain} group-hover:text-blue-500 transition-colors`}>Télécharger le fichier</p>
                <p className={`text-xs ${textSub} truncate`}>{doc.urlFichier}</p>
              </div>
              <i className="bi bi-arrow-up-right text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-lg"></i>
            </a>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <i className="bi bi-x-lg mr-2"></i>Fermer
            </button>
            <button onClick={onEdit}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className="bi bi-pencil-fill"></i>
              Modifier ce document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KPI PANEL
// ─────────────────────────────────────────────────────────────────────────────

const KPIPanel = ({ chauffeur, darkMode, theme, animateCharts, onClose }) => {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('1an');
  const pLabels = { '3m': '3 mois', '6m': '6 mois', '1an': '1 an', all: 'Tout' };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    chauffeurApi.get(`/admin/chauffeurs/${chauffeur.id}/kpi`)
      .then(res => setKpi(res.data.data))
      .catch(() => setKpi(null))
      .finally(() => setLoading(false));
    return () => { document.body.style.overflow = ''; };
  }, [chauffeur.id]);

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl p-12 flex flex-col items-center gap-4`}>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Chargement des KPI…</p>
      </div>
    </div>
  );

  if (!kpi) return null;

  const score = kpi.score || calculerScore(kpi);
  const accRecentResp    = kpi.accidentParType?.responsable_1an    || 0;
  const accRecentNonResp = kpi.accidentParType?.non_responsable_1an || 0;
  const missAn           = kpi.missions?.['1an'] || 0;
  const typesEff         = Object.values(kpi.missionsParType || {}).filter(v => v > 0).length;
  const accidents1an     = kpi.accidents?.['1an'] || 0;
  const alertLevel       = accidents1an >= 3 ? 'danger' : accidents1an >= 2 ? 'warning' : 'ok';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden`}
        style={{ maxWidth: '1400px', maxHeight: 'calc(100vh - 2rem)' }}>

        <div className="flex-shrink-0 rounded-t-2xl" style={{ background: `linear-gradient(135deg,${theme.primary},${theme.primaryDark})` }}>
          <div className="flex items-center justify-between px-7 py-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white/30"
                style={{ backgroundColor: chauffeur.couleur }}>{chauffeur.initiales}</div>
              <div>
                <h2 className="text-xl font-bold text-white">{chauffeur.nom}</h2>
                <p className="text-white/70 text-sm mt-0.5">{chauffeur.direction}</p>
              </div>
              {alertLevel === 'danger' && <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5"><i className="bi bi-exclamation-triangle-fill"></i>SUIVI URGENT</span>}
              {alertLevel === 'warning' && <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold flex items-center gap-1.5"><i className="bi bi-eye-fill"></i>À SURVEILLER</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => exportDriverPDF(chauffeur, { [chauffeur.id]: kpi })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-semibold border border-white/30 transition-all">
                <i className="bi bi-file-pdf-fill text-red-300"></i> Bilan PDF
              </button>
              <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/25 text-white border border-white/20 transition-all">
                <i className="bi bi-x-lg text-lg"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="flex items-center gap-2 mb-5">
            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Période :</span>
            {Object.entries(pLabels).map(([key, label]) => (
              <button key={key} onClick={() => setPeriod(key)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={period === key ? { background: `linear-gradient(to right,${theme.primary},${theme.primaryDark})`, color: 'white' } : { background: darkMode ? '#1f2937' : '#f3f4f6', color: darkMode ? '#9ca3af' : '#374151' }}>
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Accidents',   value: kpi.accidents?.[period] || 0,                  icon: 'bi-exclamation-octagon-fill', color: '#ef4444', bg: darkMode ? '#450a0a' : '#fee2e2' },
              { label: 'Missions',    value: kpi.missions?.[period] || 0,                   icon: 'bi-flag-fill',                color: '#3b82f6', bg: darkMode ? '#1e3a5f' : '#dbeafe' },
              { label: 'Acc. Resp.',  value: accRecentResp,                                 icon: 'bi-shield-x-fill',            color: '#dc2626', bg: darkMode ? '#450a0a' : '#ffe4e6' },
              { label: 'Kilométrage', value: `${(kpi.km || 0).toLocaleString('fr-FR')} km`, icon: 'bi-speedometer2',             color: '#10b981', bg: darkMode ? '#052e16' : '#d1fae5' },
            ].map((card, i) => (
              <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border p-4 flex items-center gap-3 shadow-sm`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: card.bg }}>
                  <i className={card.icon} style={{ color: card.color, fontSize: '1.4rem' }}></i>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: card.color }}>{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <ChartCard darkMode={darkMode}>
              <ChartTitle icon="bi-exclamation-octagon-fill" darkMode={darkMode}>Accidents par mois</ChartTitle>
              <div className="flex-1 flex flex-col justify-center">
                <AccidentLineChart data={kpi.accidentParMois || Array(12).fill(0)} animateCharts={animateCharts} darkMode={darkMode} />
              </div>
              <div className={`mt-2 p-2 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Responsable : </span>
                <span className="text-xs font-bold text-red-500">{kpi.accidentParType?.responsable_1an || 0}</span>
                <span className={`text-xs mx-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Non-resp. : </span>
                <span className="text-xs font-bold text-green-500">{kpi.accidentParType?.non_responsable_1an || 0}</span>
              </div>
            </ChartCard>

            <ChartCard darkMode={darkMode}>
              <ChartTitle icon="bi-pie-chart-fill" darkMode={darkMode}>Types de missions (1 an)</ChartTitle>
              <div className="flex-1 flex flex-col justify-center">
                <MissionsTypeChart missionsParType={kpi.missionsParType || {}} animateCharts={animateCharts} darkMode={darkMode} />
              </div>
              <div className={`mt-3 flex items-center justify-between px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="text-[10px]">Total : <strong className={darkMode ? 'text-white' : 'text-gray-800'}>{kpi.missions?.['1an'] || 0} missions</strong></span>
                <span className="text-[10px]">{typesEff} type(s) effectué(s)</span>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <ChartCard darkMode={darkMode}>
              <ChartTitle icon="bi-flag-fill" darkMode={darkMode}>Missions réalisées (mensuel)</ChartTitle>
              <div className="flex-1 flex flex-col justify-center">
                <MiniBarChart data={kpi.missionsParMois || Array(12).fill(0)} color="#3b82f6" animateCharts={animateCharts} darkMode={darkMode} />
              </div>
              <LegendRow items={[{ label: 'Missions', color: '#3b82f6' }]} darkMode={darkMode} />
            </ChartCard>

            <ChartCard darkMode={darkMode}>
              <ChartTitle icon="bi-bar-chart-steps" darkMode={darkMode}>Comparaison par période</ChartTitle>
              <div className="flex-1 flex flex-col justify-center gap-2">
                {[
                  { label: '3 mois', acc: kpi.accidents?.['3m'] || 0,  miss: kpi.missions?.['3m'] || 0  },
                  { label: '6 mois', acc: kpi.accidents?.['6m'] || 0,  miss: kpi.missions?.['6m'] || 0  },
                  { label: '1 an',   acc: kpi.accidents?.['1an'] || 0, miss: kpi.missions?.['1an'] || 0 },
                  { label: 'Total',  acc: kpi.accidents?.['all'] || 0, miss: kpi.missions?.['all'] || 0 },
                ].map((row, i) => (
                  <div key={i} className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg px-4 py-2 flex items-center gap-4`}>
                    <span className={`text-xs font-bold w-12 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.label}</span>
                    <div className="flex-1 flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Acc :</span>
                        <span className="text-xs font-bold text-red-500">{row.acc}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Miss :</span>
                        <span className="text-xs font-bold text-blue-500">{row.miss}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden mb-4`}>
            <div className={`px-5 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <i className="bi bi-calendar3 text-blue-500"></i> Détail mensuel
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: `linear-gradient(to right,${theme.primary},${theme.primaryDark})` }}>
                  <tr>
                    {['Indicateur', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Total'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-center text-xs font-semibold text-white">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Accidents', data: kpi.accidentParMois || Array(12).fill(0), color: '#ef4444', bg: darkMode ? '#450a0a15' : '#fef2f2' },
                    { label: 'Missions',  data: kpi.missionsParMois || Array(12).fill(0), color: '#3b82f6', bg: darkMode ? '#1e3a5f15' : '#eff6ff' },
                  ].map((row, i) => (
                    <tr key={i} style={{ backgroundColor: row.bg }}>
                      <td className="px-3 py-2.5 text-xs font-bold" style={{ color: row.color }}>{row.label}</td>
                      {row.data.map((v, j) => (
                        <td key={j} className="px-3 py-2.5 text-center text-xs font-semibold"
                          style={{ color: v > 0 ? row.color : darkMode ? '#4b5563' : '#9ca3af' }}>{v}</td>
                      ))}
                      <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: row.color }}>
                        {row.data.reduce((a, b) => a + b, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const Chauffeurs = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [activeTab, setActiveTab]                 = useState('chauffeurs');
  const [animateCharts, setAnimateCharts]         = useState(false);

  const [chauffeurs, setChauffeurs]               = useState([]);
  const [filteredChauffeurs, setFilteredChauffeurs] = useState([]);
  const [loadingChauffeurs, setLoadingChauffeurs] = useState(true);
  const [searchTerm, setSearchTerm]               = useState('');
  const [filterDirection, setFilterDirection]     = useState('all');
  const [filterStatus, setFilterStatus]           = useState('all');
  const [currentPage, setCurrentPage]             = useState(1);
  const [showFilterMenu, setShowFilterMenu]       = useState(false);
  const itemsPerPage = 10;

  const [documents, setDocuments]                   = useState([]);
  const [filteredDocuments, setFilteredDocuments]   = useState([]);
  const [loadingDocuments, setLoadingDocuments]     = useState(false);
  const [searchDocTerm, setSearchDocTerm]           = useState('');
  const [filterTypeDoc, setFilterTypeDoc]           = useState('all');
  const [filterStatutDoc, setFilterStatutDoc]       = useState('all');
  const [currentDocPage, setCurrentDocPage]         = useState(1);
  const [showDocFilterMenu, setShowDocFilterMenu]   = useState(false);

  const [kpiGlobal, setKpiGlobal]   = useState(null);
  const [kpiMap, setKpiMap]         = useState({});
  const [loadingKpi, setLoadingKpi] = useState(false);

  const [directions, setDirections] = useState([]);

  const [detailChauffeur, setDetailChauffeur] = useState(null);
  const [editChauffeur, setEditChauffeur]     = useState(null);
  const [detailDocument, setDetailDocument]   = useState(null);

  const [showDocModal, setShowDocModal]         = useState(false);
  const [docModalMode, setDocModalMode]         = useState('add');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [savingDoc, setSavingDoc]               = useState(false);
  const [docFile, setDocFile]                   = useState(null);

  const [showActionMenu, setShowActionMenu] = useState(null);
  const [kpiChauffeur, setKpiChauffeur]     = useState(null);

  const { theme } = useTheme();
  const navigate  = useNavigate();
  const primaryColor = theme.primary || '#3b82f6';

  useEffect(() => {
    const id = requestAnimationFrame(() => { const id2 = requestAnimationFrame(() => setAnimateCharts(true)); return () => cancelAnimationFrame(id2); });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('[data-menu]')) {
        setShowActionMenu(null);
        setShowFilterMenu(false);
        setShowDocFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const fetchChauffeurs = useCallback(async () => {
    setLoadingChauffeurs(true);
    try {
      const params = {};
      if (searchTerm)                params.search       = searchTerm;
      if (filterDirection !== 'all') params.direction_id = filterDirection;
      const res = await chauffeurApi.get('/admin/chauffeurs', { params });
      setChauffeurs(res.data.data || []);
    } catch (err) {
      showError(darkMode, primaryColor, 'Erreur de chargement', 'Impossible de charger la liste des chauffeurs.');
    } finally {
      setLoadingChauffeurs(false);
    }
  }, [searchTerm, filterDirection, darkMode, primaryColor]);

  useEffect(() => { fetchChauffeurs(); }, []);

  useEffect(() => {
    chauffeurApi.get('/admin/directions')
      .then(res => setDirections(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let f = chauffeurs;
    if (filterStatus !== 'all') f = f.filter(c => c.statut === filterStatus);
    setFilteredChauffeurs(f);
    setCurrentPage(1);
  }, [chauffeurs, filterStatus]);

  const fetchDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      const params = {};
      if (searchDocTerm)             params.search        = searchDocTerm;
      if (filterTypeDoc !== 'all')   params.type_document = filterTypeDoc;
      if (filterStatutDoc !== 'all') params.statut        = filterStatutDoc;
      const res = await chauffeurApi.get('/admin/chauffeurs/documents/liste', { params });
      setDocuments(res.data.data || []);
    } catch (err) {
      showError(darkMode, primaryColor, 'Erreur de chargement', 'Impossible de charger les documents.');
    } finally {
      setLoadingDocuments(false);
    }
  }, [searchDocTerm, filterTypeDoc, filterStatutDoc, darkMode, primaryColor]);

  useEffect(() => { if (activeTab === 'documents') fetchDocuments(); }, [activeTab]);

  useEffect(() => { setFilteredDocuments(documents); setCurrentDocPage(1); }, [documents]);

  useEffect(() => {
    if (activeTab !== 'kpi') return;
    setLoadingKpi(true);
    chauffeurApi.get('/admin/chauffeurs/kpi/global')
      .then(res => {
        const data = res.data.data;
        setKpiGlobal(data);
        const map = {};
        (data.chauffeurs_kpi || []).forEach(k => {
          map[k.chauffeur_id] = {
            score:    k.score,
            accidents: { '1an': k.acc_1an, '3m': 0, '6m': 0, all: k.acc_1an },
            missions:  { '1an': k.miss_1an, '3m': 0, '6m': 0, all: k.miss_1an },
            accidentParType:  { responsable_1an: 0, non_responsable_1an: 0, responsable: 0, non_responsable: 0 },
            accidentParMois:  Array(12).fill(0),
            missionsParMois:  Array(12).fill(0),
            missionsParType:  {},
            km: 0,
          };
        });
        setKpiMap(map);
      })
      .catch(() => showError(darkMode, primaryColor, 'Erreur KPI', 'Impossible de charger les KPI globaux.'))
      .finally(() => setLoadingKpi(false));
  }, [activeTab]);

  const currentChauffeurs = filteredChauffeurs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentDocuments  = filteredDocuments.slice((currentDocPage - 1) * itemsPerPage, currentDocPage * itemsPerPage);

  const handleViewChauffeur = (c) => { setDetailChauffeur({ ...c }); setShowActionMenu(null); };
  const handleEditChauffeur = (c) => { setDetailChauffeur(null); setEditChauffeur({ ...c }); setShowActionMenu(null); };
  const handleChauffeurSaved = (updated) => {
    setChauffeurs(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setEditChauffeur(null);
  };

  const handleAddDocument = () => {
    setDocModalMode('add');
    setSelectedDocument({ chauffeur_user_id: '', typeDocumentCode: 'permis_conduire', nomDocument: '', numeroPermis: '', categoriesPermis: '', paysDelivrance: 'Gabon', dateDelivrance: '', dateExpiration: '', notes: '' });
    setDocFile(null);
    setShowDocModal(true);
  };

  const handleEditDocument = (d) => {
    setDetailDocument(null);
    setDocModalMode('edit');
    setSelectedDocument({ ...d, typeDocumentCode: d.typeDocumentCode || 'permis_conduire' });
    setDocFile(null);
    setShowDocModal(true);
    setShowActionMenu(null);
  };

  const handleViewDocument = (d) => { setDetailDocument(d); setShowActionMenu(null); };

  const handleSaveDocument = async () => {
    if (!selectedDocument) return;
    setSavingDoc(true);
    try {
      const fd = new FormData();
      fd.append('type_document',  selectedDocument.typeDocumentCode || 'permis_conduire');
      fd.append('nom_document',   selectedDocument.nomDocument || '');
      if (selectedDocument.numeroPermis)     fd.append('numero_permis',    selectedDocument.numeroPermis);
      if (selectedDocument.categoriesPermis) fd.append('categories_permis', selectedDocument.categoriesPermis);
      if (selectedDocument.paysDelivrance)   fd.append('pays_delivrance',  selectedDocument.paysDelivrance);
      if (selectedDocument.dateDelivrance)   fd.append('date_delivrance',  selectedDocument.dateDelivrance);
      if (selectedDocument.dateExpiration)   fd.append('date_expiration',  selectedDocument.dateExpiration);
      if (selectedDocument.notes)            fd.append('notes',            selectedDocument.notes);
      if (docFile)                           fd.append('fichier',          docFile);

      if (docModalMode === 'add') {
        if (!docFile) { showError(darkMode, primaryColor, 'Fichier manquant', 'Veuillez joindre un fichier.'); setSavingDoc(false); return; }
        const chauffeurId = selectedDocument.chauffeur_user_id;
        if (!chauffeurId) { showError(darkMode, primaryColor, 'Chauffeur manquant', 'Veuillez sélectionner un chauffeur.'); setSavingDoc(false); return; }
        await chauffeurApi.post(`/admin/chauffeurs/${chauffeurId}/documents`, fd);
        setShowDocModal(false); fetchDocuments();
        showSuccess(darkMode, theme, 'Document ajouté !', 'Le document a été enregistré avec succès.');
      } else {
        await chauffeurApi.post(`/admin/chauffeurs/documents/${selectedDocument.id}`, fd);
        setShowDocModal(false); fetchDocuments();
        showSuccess(darkMode, theme, 'Document mis à jour !', 'Les modifications ont été enregistrées.');
      }
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join('\n') : (err.response?.data?.message || 'Une erreur est survenue.');
      showError(darkMode, primaryColor, 'Erreur', msg);
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDocument = async (d) => {
    setShowActionMenu(null);
    const result = await showConfirm(darkMode, primaryColor, 'Supprimer ce document ?', `<span style="color:${darkMode ? '#f3f4f6' : '#374151'}">Cette action est <strong>irréversible</strong>.</span>`, 'Supprimer');
    if (!result.isConfirmed) return;
    try {
      await chauffeurApi.delete(`/admin/chauffeurs/documents/${d.id}`);
      fetchDocuments();
      showSuccess(darkMode, theme, 'Document supprimé', 'Le document a bien été supprimé.');
    } catch (err) {
      showError(darkMode, primaryColor, 'Erreur', 'Impossible de supprimer ce document.');
    }
  };

  const getStats = () => activeTab === 'chauffeurs'
    ? [
        { title: 'Total Chauffeurs',  value: chauffeurs.length,                                                          subtitle: 'enregistrés',       icon: 'bi-people-fill',               iconBg: 'bg-blue-100',   textColor: 'text-blue-600'   },
        { title: 'Actifs',            value: chauffeurs.filter(c => c.statut === 'actif').length,                         subtitle: 'chauffeurs actifs',  icon: 'bi-check-circle-fill',         iconBg: 'bg-green-100',  textColor: 'text-green-600'  },
        { title: 'Inactifs',          value: chauffeurs.filter(c => c.statut === 'inactif').length,                       subtitle: 'inactifs',           icon: 'bi-x-circle-fill',             iconBg: 'bg-red-100',    textColor: 'text-red-600'    },
        { title: 'À surveiller',      value: Object.values(kpiMap).filter(k => (k.accidents?.['1an'] || 0) >= 2).length, subtitle: '≥ 2 accidents/an',   icon: 'bi-exclamation-triangle-fill', iconBg: 'bg-yellow-100', textColor: 'text-yellow-600' },
      ]
    : [
        { title: 'Total Documents', value: documents.length,                                                     subtitle: 'enregistrés',  icon: 'bi-file-earmark-text-fill',   iconBg: 'bg-blue-100',   textColor: 'text-blue-600'   },
        { title: 'Valides',         value: documents.filter(d => d.statut === 'valide').length,                   subtitle: 'valides',      icon: 'bi-check-circle-fill',        iconBg: 'bg-green-100',  textColor: 'text-green-600'  },
        { title: 'Expire bientôt',  value: documents.filter(d => d.statut === 'expire_bientot').length,           subtitle: 'à renouveler', icon: 'bi-exclamation-triangle-fill', iconBg: 'bg-yellow-100', textColor: 'text-yellow-600' },
        { title: 'Permis',          value: documents.filter(d => d.typeDocumentCode === 'permis_conduire').length, subtitle: 'permis',       icon: 'bi-credit-card-fill',         iconBg: 'bg-purple-100', textColor: 'text-purple-600' },
      ];

  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex flex-col transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .swal-dark-popup  { border: 1px solid #374151 !important; border-radius: 14px !important; }
        .swal-light-popup { border: 1px solid #e5e7eb !important; border-radius: 14px !important; }
        .swal-title-dark  { color: #f3f4f6 !important; }
        .swal-title-light { color: #111827 !important; }
        .swal-html-dark   { color: #d1d5db !important; }
        .swal-html-light  { color: #374151 !important; }
        .swal-confirm-btn { border-radius: 8px !important; font-weight: 600 !important; }
        .swal-cancel-dark  { background: #374151 !important; color: #d1d5db !important; border-radius: 8px !important; font-weight: 600 !important; }
        .swal-cancel-light { background: #e5e7eb !important; color: #374151 !important; border-radius: 8px !important; font-weight: 600 !important; }
        .swal2-timer-progress-bar { background: ${primaryColor} !important; }
      `}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile} />

      <main className=" flex-1 transition-all duration-300 pt-24 px-4 pb-6" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '16.25rem' }}>

        {/* ── Tabs ── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm mb-6 p-2`}>
          <div className="flex gap-2">
            {[
              { key: 'chauffeurs', label: 'Chauffeurs',        icon: 'bi-people-fill',           count: chauffeurs.length },
              { key: 'documents',  label: 'Documents',         icon: 'bi-file-earmark-text-fill', count: documents.length  },
              { key: 'kpi',        label: 'KPI & Performance', icon: 'bi-graph-up-arrow',         count: null              },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === tab.key ? 'text-white shadow-md' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`}
                style={activeTab === tab.key ? { background: `linear-gradient(to right,${theme.primary},${theme.primaryDark})` } : {}}>
                <i className={`${tab.icon} text-xl`}></i>
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20' : darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats cards ── */}
        {activeTab !== 'kpi' && (
          loadingChauffeurs && activeTab === 'chauffeurs'
            ? <StatCardsSkeleton darkMode={darkMode} />
            : loadingDocuments && activeTab === 'documents'
              ? <StatCardsSkeleton darkMode={darkMode} />
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {getStats().map((card, idx) => (
                    <div key={idx} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{card.title}</p>
                          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{card.value}</h3>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{card.subtitle}</p>
                        </div>
                        <div className={`${card.iconBg} ${card.textColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                          <i className={card.icon} style={{ fontSize: '1.5rem' }}></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
        )}

        {/* ══ ONGLET KPI ══ */}
        {activeTab === 'kpi' && (
          <div>
            {loadingKpi ? <KpiMetricsSkeleton darkMode={darkMode} /> : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {[
                    { label: 'Score moyen',           value: kpiGlobal?.score_moyen         || 0, unit: '/100', color: '#3b82f6', icon: 'bi-award-fill'              },
                    { label: 'Total accidents (1an)',  value: kpiGlobal?.total_accidents_1an || 0, unit: '',     color: '#ef4444', icon: 'bi-exclamation-octagon-fill' },
                    { label: 'Total missions (1an)',   value: kpiGlobal?.total_missions_1an  || 0, unit: '',     color: '#10b981', icon: 'bi-flag-fill'                },
                    { label: 'Alertes (≥2 acc.)',      value: kpiGlobal?.nb_alertes          || 0, unit: '',     color: '#dc2626', icon: 'bi-shield-x-fill'            },
                  ].map((card, i) => (
                    <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
                          <p className="text-3xl font-bold mt-1" style={{ color: card.color }}>{card.value}<span className="text-base font-normal">{card.unit}</span></p>
                        </div>
                        <i className={`${card.icon} text-3xl`} style={{ color: card.color, opacity: 0.3 }}></i>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}>
                    <h3 className={`text-base font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                      <i className="bi bi-trophy-fill text-yellow-500"></i> Classement Performance
                    </h3>
                    <div className="space-y-2">
                      {[...chauffeurs].map(c => ({ ...c, score: kpiMap[c.id]?.score || 0 })).sort((a, b) => b.score - a.score).map((c, i) => {
                        const color = getScoreColor(c.score);
                        return (
                          <div key={c.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                            onClick={() => setKpiChauffeur(c)}>
                            <span className={`w-6 text-center text-sm font-bold ${i < 3 ? 'text-yellow-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{i + 1}</span>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.couleur }}>{c.initiales}</div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{c.nom}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{c.direction}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-20 h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${animateCharts ? c.score : 0}%`, backgroundColor: color }}></div>
                              </div>
                              <span className="text-sm font-bold w-8 text-right" style={{ color }}>{c.score}</span>
                            </div>
                            <button onClick={e => { e.stopPropagation(); setKpiChauffeur(c); }}
                              className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                              <i className="bi bi-graph-up"></i>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}>
                    <h3 className={`text-base font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                      <i className="bi bi-exclamation-triangle-fill text-red-500"></i> Alertes & Suivis
                    </h3>
                    <div className="space-y-3 mb-4">
                      {chauffeurs.filter(c => (kpiMap[c.id]?.accidents?.['1an'] || 0) >= 2 || (kpiMap[c.id]?.score || 100) < 70).map(c => {
                        const kpi = kpiMap[c.id] || {};
                        const isDanger = (kpi.accidents?.['1an'] || 0) >= 3;
                        return (
                          <div key={c.id}
                            className={`p-3 rounded-lg border-l-4 cursor-pointer ${isDanger ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'}`}
                            onClick={() => setKpiChauffeur(c)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.couleur }}>{c.initiales}</div>
                                <div>
                                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{c.nom}</p>
                                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{kpi.accidents?.['1an'] || 0} accident(s) • Score {kpi.score || 0}/100</p>
                                </div>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDanger ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{isDanger ? 'URGENT' : 'Attention'}</span>
                            </div>
                          </div>
                        );
                      })}
                      {chauffeurs.filter(c => (kpiMap[c.id]?.accidents?.['1an'] || 0) >= 2 || (kpiMap[c.id]?.score || 100) < 70).length === 0 && (
                        <div className="flex items-center gap-3 text-green-500 py-6 justify-center">
                          <i className="bi bi-check-circle-fill text-2xl"></i>
                          <span className="font-medium">Aucune alerte active</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex gap-2">
                      <button onClick={() => exportPDF(chauffeurs, kpiMap)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg ${darkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'} text-sm font-medium transition-colors`}>
                        <i className="bi bi-file-pdf-fill"></i> Rapport PDF
                      </button>
                      <button onClick={() => exportAlertesExcel(chauffeurs, kpiMap, theme.primary)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg ${darkMode ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' : 'bg-green-50 text-green-600 hover:bg-green-100'} text-sm font-medium transition-colors`}>
                        <i className="bi bi-file-earmark-excel-fill"></i> Export Excel
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <ChartCard darkMode={darkMode}>
                    <ChartTitle icon="bi-exclamation-octagon-fill" darkMode={darkMode}>Accidents / chauffeur (1 an)</ChartTitle>
                    <div className="flex-1 flex flex-col justify-center gap-1.5 py-2">
                      {chauffeurs.slice(0, 8).map(c => {
                        const acc = kpiMap[c.id]?.accidents?.['1an'] || 0;
                        return (
                          <div key={c.id} className="flex items-center gap-2">
                            <span className={`text-[10px] w-20 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{c.nom.split(' ')[0]}</span>
                            <div className={`flex-1 h-3 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${animateCharts ? (acc / 4) * 100 : 0}%`, backgroundColor: acc > 2 ? '#ef4444' : acc > 0 ? '#f59e0b' : '#10b981' }}></div>
                            </div>
                            <span className="text-[11px] font-bold w-4 text-right" style={{ color: acc > 2 ? '#ef4444' : acc > 0 ? '#f59e0b' : '#10b981' }}>{acc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </ChartCard>

                  <ChartCard darkMode={darkMode}>
                    <ChartTitle icon="bi-flag-fill" darkMode={darkMode}>Missions / chauffeur (1 an)</ChartTitle>
                    <div className="flex-1 flex flex-col justify-center gap-1.5 py-2">
                      {chauffeurs.slice(0, 8).map(c => {
                        const m = kpiMap[c.id]?.missions?.['1an'] || 0;
                        return (
                          <div key={c.id} className="flex items-center gap-2">
                            <span className={`text-[10px] w-20 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{c.nom.split(' ')[0]}</span>
                            <div className={`flex-1 h-3 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${animateCharts ? (m / 90) * 100 : 0}%`, backgroundColor: '#3b82f6' }}></div>
                            </div>
                            <span className={`text-[11px] font-bold w-6 text-right ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{m}</span>
                          </div>
                        );
                      })}
                    </div>
                  </ChartCard>

                  <ChartCard darkMode={darkMode}>
                    <ChartTitle icon="bi-award-fill" darkMode={darkMode}>Score performance global</ChartTitle>
                    <div className="flex-1 flex flex-col justify-center gap-1.5 py-2">
                      {chauffeurs.map(c => {
                        const s = kpiMap[c.id]?.score || 0;
                        return (
                          <div key={c.id} className="flex items-center gap-2">
                            <span className={`text-[10px] w-20 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{c.nom.split(' ')[0]}</span>
                            <div className={`flex-1 h-3 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                              <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${animateCharts ? s : 0}%`, backgroundColor: getScoreColor(s) }}></div>
                            </div>
                            <span className="text-[11px] font-bold w-8 text-right" style={{ color: getScoreColor(s) }}>{s}</span>
                          </div>
                        );
                      })}
                    </div>
                  </ChartCard>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ ONGLET CHAUFFEURS ══ */}
        {activeTab === 'chauffeurs' && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Liste des Chauffeurs</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{filteredChauffeurs.length} chauffeur(s)</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" placeholder="Rechercher…" value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') fetchChauffeurs(); }}
                      className={`pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none w-56`} />
                  </div>
                  <button onClick={fetchChauffeurs}
                    className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                    <i className="bi bi-search"></i>
                  </button>
                  <div className="relative" data-menu>
                    <button onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                      <i className="bi bi-funnel"></i><span className="text-sm font-medium">Filtres</span>
                    </button>
                    {showFilterMenu && (
                      <div className={`absolute right-0 mt-2 w-60 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 p-4`}>
                        <div className="mb-3">
                          <label className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1.5 block`}>Direction</label>
                          <select value={filterDirection} onChange={e => { setFilterDirection(e.target.value); fetchChauffeurs(); }}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} text-sm`}>
                            <option value="all">Toutes</option>
                            {directions.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1.5 block`}>Statut</label>
                          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} text-sm`}>
                            <option value="all">Tous</option>
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => exportPDF(filteredChauffeurs, kpiMap)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                    <i className="bi bi-file-pdf-fill text-red-500"></i><span className="text-sm font-medium">PDF</span>
                  </button>
                  <button onClick={() => exportChauffeursExcel(filteredChauffeurs, kpiMap, theme.primary)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                    <i className="bi bi-file-earmark-spreadsheet text-green-500"></i><span className="text-sm font-medium">Excel</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: `linear-gradient(to right,${theme.primary},${theme.primaryDark})` }}>
                  <tr>{['Chauffeur', 'Email', 'Direction', 'Permis', 'Score', 'Statut', 'Actions'].map(h =>
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">{h}</th>
                  )}</tr>
                </thead>
                <tbody>
                  {loadingChauffeurs ? <TableRowsSkeleton darkMode={darkMode} cols={7} rows={6} /> :
                    currentChauffeurs.length === 0 ? (
                      <tr><td colSpan={7} className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun chauffeur trouvé.</td></tr>
                    ) : currentChauffeurs.map((chauffeur, index) => {
                      const kpi = kpiMap[chauffeur.id] || {};
                      const score = kpi.score || 0;
                      const scoreColor = getScoreColor(score);
                      const hasAlert = (kpi.accidents?.['1an'] || 0) >= 2;
                      return (
                        <tr key={chauffeur.id}
                          style={{ backgroundColor: getRowBackgroundColor(index, darkMode), borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb', transition: 'background-color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = getRowBackgroundColor(index, darkMode)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: chauffeur.couleur }}>{chauffeur.initiales}</div>
                                {hasAlert && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></div>}
                              </div>
                              <div>
                                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{chauffeur.nom}</p>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{chauffeur.dateEmbauche ? `Embauché le ${new Date(chauffeur.dateEmbauche).toLocaleDateString('fr-FR')}` : '–'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap"><p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{chauffeur.email}</p></td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{chauffeur.direction || '–'}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>{chauffeur.categoriesPermis || '–'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-16 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div className="h-1.5 rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColor }}></div>
                              </div>
                              <span className="text-xs font-bold" style={{ color: scoreColor }}>{score || '–'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${chauffeur.statut === 'actif' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {chauffeur.statut === 'actif' ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative flex items-center gap-1" data-menu>
                              <button onClick={() => setKpiChauffeur(chauffeur)}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`} title="Voir KPI">
                                <i className={`bi bi-graph-up ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}></i>
                              </button>
                              <button onClick={() => setShowActionMenu(showActionMenu === chauffeur.id ? null : chauffeur.id)}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                                <i className={`bi bi-three-dots-vertical ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                              </button>
                              {showActionMenu === chauffeur.id && (
                                <div className={`absolute right-0 mt-2 w-52 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 top-full`}>
                                  <button onClick={() => handleViewChauffeur(chauffeur)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-eye-fill text-blue-500"></i>Voir détails</button>
                                  <button onClick={() => handleEditChauffeur(chauffeur)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-pencil-fill text-yellow-500"></i>Modifier</button>
                                  <button onClick={() => { setKpiChauffeur(chauffeur); setShowActionMenu(null); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-graph-up text-blue-400"></i>Voir KPI</button>
                                  <button onClick={() => exportDriverPDF(chauffeur, kpiMap)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-file-pdf-fill text-red-500"></i>Bilan PDF</button>
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

            <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Affichage de {currentChauffeurs.length} / {filteredChauffeurs.length} chauffeurs</p>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}><i className="bi bi-chevron-left"></i></button>
                <span className={`px-3 py-1.5 text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currentPage}</span>
                <button disabled={currentPage * itemsPerPage >= filteredChauffeurs.length} onClick={() => setCurrentPage(p => p + 1)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}><i className="bi bi-chevron-right"></i></button>
              </div>
            </div>
          </div>
        )}

        {/* ══ ONGLET DOCUMENTS ══ */}
        {activeTab === 'documents' && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Liste des Documents</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{filteredDocuments.length} document(s)</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input type="text" placeholder="Rechercher…" value={searchDocTerm}
                      onChange={e => setSearchDocTerm(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') fetchDocuments(); }}
                      className={`pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none w-56`} />
                  </div>
                  <button onClick={fetchDocuments} className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}><i className="bi bi-search"></i></button>
                  <div className="relative" data-menu>
                    <button onClick={() => setShowDocFilterMenu(!showDocFilterMenu)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                      <i className="bi bi-funnel"></i><span className="text-sm font-medium">Filtres</span>
                    </button>
                    {showDocFilterMenu && (
                      <div className={`absolute right-0 mt-2 w-60 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 p-4`}>
                        <div className="mb-3">
                          <label className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1.5 block`}>Type</label>
                          <select value={filterTypeDoc} onChange={e => { setFilterTypeDoc(e.target.value); fetchDocuments(); }}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} text-sm`}>
                            <option value="all">Tous</option>
                            <option value="permis_conduire">Permis de conduire</option>
                            <option value="carte_identite">Carte d'identité</option>
                            <option value="visite_medicale">Certificat médical</option>
                            <option value="passeport">Passeport</option>
                            <option value="autre">Autre</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1.5 block`}>Statut</label>
                          <select value={filterStatutDoc} onChange={e => { setFilterStatutDoc(e.target.value); fetchDocuments(); }}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} text-sm`}>
                            <option value="all">Tous</option>
                            <option value="valide">Valide</option>
                            <option value="expire_bientot">Expire bientôt</option>
                            <option value="expire">Expiré</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={handleAddDocument}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-md hover:opacity-90"
                    style={{ background: `linear-gradient(to right,${theme.primary},${theme.primaryDark})` }}>
                    <i className="bi bi-plus-lg"></i><span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: `linear-gradient(to right,${theme.primary},${theme.primaryDark})` }}>
                  <tr>{['Chauffeur', 'Type', 'N° Document', 'Catégories', 'Expiration', 'Statut', 'Actions'].map(h =>
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">{h}</th>
                  )}</tr>
                </thead>
                <tbody>
                  {loadingDocuments ? <TableRowsSkeleton darkMode={darkMode} cols={7} rows={5} /> :
                    currentDocuments.length === 0 ? (
                      <tr><td colSpan={7} className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun document trouvé.</td></tr>
                    ) : currentDocuments.map((doc, index) => (
                      <tr key={doc.id}
                        style={{ backgroundColor: getRowBackgroundColor(index, darkMode), borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb', transition: 'background-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = getRowBackgroundColor(index, darkMode)}>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{doc.chauffeurNom}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <i className={`bi ${doc.typeDocumentCode === 'permis_conduire' ? 'bi-credit-card text-blue-500' : 'bi-file-medical text-green-500'}`}></i>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{doc.typeDocument}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{doc.numeroPermis || '–'}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{doc.categoriesPermis || '–'}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{doc.dateExpiration ? new Date(doc.dateExpiration).toLocaleDateString('fr-FR') : '–'}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${doc.statut === 'valide' ? 'bg-green-100 text-green-800' : doc.statut === 'expire_bientot' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {doc.statut === 'valide' ? 'Valide' : doc.statut === 'expire_bientot' ? 'Expire bientôt' : 'Expiré'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative" data-menu>
                            <button onClick={() => setShowActionMenu(showActionMenu === `doc-${doc.id}` ? null : `doc-${doc.id}`)}
                              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                              <i className={`bi bi-three-dots-vertical ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                            </button>
                            {showActionMenu === `doc-${doc.id}` && (
                              <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50`}>
                                <button onClick={() => handleViewDocument(doc)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-eye-fill text-blue-500"></i>Voir détails</button>
                                <button onClick={() => handleEditDocument(doc)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-pencil-fill text-yellow-500"></i>Modifier</button>
                                {doc.urlFichier && (
                                  <a href={doc.urlFichier} target="_blank" rel="noopener noreferrer"
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                    <i className="bi bi-download text-green-500"></i>Télécharger
                                  </a>
                                )}
                                <button onClick={() => handleDeleteDocument(doc)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-50'}`}><i className="bi bi-trash-fill"></i>Supprimer</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Affichage de {currentDocuments.length} / {filteredDocuments.length} documents</p>
              <div className="flex gap-2">
                <button disabled={currentDocPage === 1} onClick={() => setCurrentDocPage(p => p - 1)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}><i className="bi bi-chevron-left"></i></button>
                <span className={`px-3 py-1.5 text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currentDocPage}</span>
                <button disabled={currentDocPage * itemsPerPage >= filteredDocuments.length} onClick={() => setCurrentDocPage(p => p + 1)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}><i className="bi bi-chevron-right"></i></button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL DOCUMENT (ajouter / modifier) ══ */}
        {showDocModal && selectedDocument && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
              style={{ animation: 'slideUp 0.25s ease-out' }}>
              <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between sticky top-0 z-10 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                    <i className="bi bi-file-earmark-text-fill text-white text-sm"></i>
                  </div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {docModalMode === 'add' ? 'Ajouter un document' : 'Modifier le document'}
                  </h3>
                </div>
                <button onClick={() => setShowDocModal(false)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {docModalMode === 'add' ? (
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Chauffeur <span className="text-red-500">*</span></label>
                    <select value={selectedDocument.chauffeur_user_id || ''}
                      onChange={e => setSelectedDocument({ ...selectedDocument, chauffeur_user_id: parseInt(e.target.value) })}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                      <option value="">Sélectionner un chauffeur…</option>
                      {chauffeurs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Chauffeur</label>
                    <div className={`px-4 py-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>{selectedDocument.chauffeurNom || '–'}</div>
                  </div>
                )}
                {[
                  { label: 'Type de document', required: true, content: <select value={selectedDocument.typeDocumentCode || 'permis_conduire'} onChange={e => setSelectedDocument({ ...selectedDocument, typeDocumentCode: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}><option value="permis_conduire">Permis de conduire</option><option value="carte_identite">Carte d'identité</option><option value="visite_medicale">Certificat médical</option><option value="passeport">Passeport</option><option value="autre">Autre</option></select> },
                  { label: 'Nom du document', required: true, content: <input type="text" placeholder="ex: Permis catégorie B" value={selectedDocument.nomDocument || ''} onChange={e => setSelectedDocument({ ...selectedDocument, nomDocument: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /> },
                  { label: 'N° de document', required: false, content: <input type="text" placeholder="PC123456" value={selectedDocument.numeroPermis || ''} onChange={e => setSelectedDocument({ ...selectedDocument, numeroPermis: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /> },
                  { label: 'Catégories', required: false, content: <input type="text" placeholder="B, C, E" value={selectedDocument.categoriesPermis || ''} onChange={e => setSelectedDocument({ ...selectedDocument, categoriesPermis: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /> },
                  { label: 'Pays de délivrance', required: false, content: <input type="text" placeholder="Gabon" value={selectedDocument.paysDelivrance || 'Gabon'} onChange={e => setSelectedDocument({ ...selectedDocument, paysDelivrance: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /> },
                  { label: 'Date de délivrance', required: false, content: <input type="date" value={selectedDocument.dateDelivrance || ''} onChange={e => setSelectedDocument({ ...selectedDocument, dateDelivrance: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /> },
                  { label: "Date d'expiration", required: false, content: <input type="date" value={selectedDocument.dateExpiration || ''} onChange={e => setSelectedDocument({ ...selectedDocument, dateExpiration: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /> },
                ].map((field, i) => (
                  <div key={i}>
                    <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                    {field.content}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fichier {docModalMode === 'add' ? <span className="text-red-500">*</span> : <span className={`text-xs font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(laisser vide pour conserver l'actuel)</span>}</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDocFile(e.target.files[0] || null)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700'} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700`} />
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>PDF, JPG, PNG — max 10 Mo</p>
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</label>
                  <textarea rows={2} placeholder="Remarques éventuelles…" value={selectedDocument.notes || ''}
                    onChange={e => setSelectedDocument({ ...selectedDocument, notes: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none resize-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end gap-3 sticky bottom-0 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <button onClick={() => setShowDocModal(false)}
                  className={`px-6 py-2.5 rounded-xl border text-sm font-medium transition-all ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  Annuler
                </button>
                <button onClick={handleSaveDocument} disabled={savingDoc}
                  className="px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-md"
                  style={{ background: `linear-gradient(to right,${theme.primary},${theme.primaryDark})` }}>
                  {savingDoc && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {docModalMode === 'add' ? 'Ajouter' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal DÉTAIL DOCUMENT ── */}
        {detailDocument && (
          <DocumentDetailModal document={detailDocument} darkMode={darkMode} theme={theme}
            onClose={() => setDetailDocument(null)} onEdit={() => handleEditDocument(detailDocument)} />
        )}

        {/* ── Modal DÉTAIL CHAUFFEUR ── */}
        {detailChauffeur && (
          <ChauffeurDetailModal chauffeur={detailChauffeur} darkMode={darkMode} theme={theme}
            onClose={() => setDetailChauffeur(null)}
            onEdit={() => { setEditChauffeur(detailChauffeur); setDetailChauffeur(null); }} />
        )}

        {/* ── Modal EDIT CHAUFFEUR ── */}
        {editChauffeur && (
          <ChauffeurEditModal chauffeur={editChauffeur} darkMode={darkMode} theme={theme}
            onClose={() => setEditChauffeur(null)} onSaved={handleChauffeurSaved} />
        )}

        {/* ── KPI Panel ── */}
        {kpiChauffeur && (
          <KPIPanel chauffeur={kpiChauffeur} darkMode={darkMode} theme={theme} animateCharts={animateCharts} onClose={() => setKpiChauffeur(null)} />
        )}

      </main>
       <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />
    </div>
  );
};

export default Chauffeurs;