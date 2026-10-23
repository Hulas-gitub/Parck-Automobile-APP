import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  fetchHistoriqueConnexions,
  forceLogoutSession,
  fetchAllHistoriqueConnexionsForExport,
}
 from '../api/Admin-Axios/HistoriqueConnexion-axios';

// ============================================================================
// DONNÉES DE RÉFÉRENCE
// ============================================================================
const ROLES = [
  { code: 'admin',           libelle: 'Super Administrateur',    color: '#ef4444', bg: 'bg-red-100 text-red-700' },
  { code: 'chef_parc',       libelle: 'Gestionnaire du Parc',    color: '#6366f1', bg: 'bg-indigo-100 text-indigo-700' },
  { code: 'chef_tf',         libelle: 'Chef Transport de Fonds', color: '#f59e0b', bg: 'bg-yellow-100 text-yellow-700' },
  { code: 'agent_pc_radio',  libelle: 'Agent PC Radio',          color: '#06b6d4', bg: 'bg-cyan-100 text-cyan-700' },
  { code: 'mecanicien',      libelle: 'Mécanicien / Technicien', color: '#10b981', bg: 'bg-green-100 text-green-700' },
  { code: 'chauffeur',       libelle: 'Chauffeur',               color: '#8b5cf6', bg: 'bg-purple-100 text-purple-700' },
];

// Mapping icône/couleur pour les navigateurs détectés par jenssegers/agent
const NAV_META = {
  chrome:  { icon: 'bi-browser-chrome',  color: '#f59e0b' },
  firefox: { icon: 'bi-browser-firefox', color: '#f97316' },
  safari:  { icon: 'bi-browser-safari',  color: '#3b82f6' },
  edge:    { icon: 'bi-browser-edge',    color: '#06b6d4' },
  opera:   { icon: 'bi-globe',           color: '#ef4444' },
  'internet explorer': { icon: 'bi-globe', color: '#3b82f6' },
};

// Mapping icône/couleur pour les OS détectés
const OS_META = {
  windows: { icon: 'bi-windows',  color: '#06b6d4' },
  'os x':  { icon: 'bi-apple',    color: '#94a3b8' },
  ios:     { icon: 'bi-phone',    color: '#6366f1' },
  android: { icon: 'bi-android2', color: '#10b981' },
  linux:   { icon: 'bi-terminal', color: '#f59e0b' },
};

const getNavMeta = (nom) => NAV_META[(nom || '').toLowerCase()] || { icon: 'bi-globe2', color: '#94a3b8' };
const getOsMeta   = (nom) => OS_META[(nom || '').toLowerCase()] || { icon: 'bi-pc-display', color: '#94a3b8' };

const PERIODES = [
  { code: '7j',    libelle: '7 derniers jours' },
  { code: '30j',   libelle: 'Mensuel' },
  { code: '90j',   libelle: 'Trimestriel' },
  { code: '180j',  libelle: 'Semestriel' },
  { code: '365j',  libelle: 'Annuel' },
];

const PER_PAGE = 20;

// Palette stable pour générer un avatar coloré par utilisateur (pas de backend pour ça)
const AVATAR_PALETTE = ['#ef4444','#f59e0b','#10b981','#06b6d4','#6366f1','#8b5cf6','#ec4899','#14b8a6'];
const colorForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Initiales : 1re lettre du nom + 1re lettre du prénom (ex. "MBA Jean" → "MJ").
 * Calculé à partir du nom complet (user_nom) : aucun changement backend nécessaire.
 * - 2 mots ou plus : 1re lettre des deux premiers mots
 * - 1 seul mot     : ses deux premières lettres
 * - vide           : "?"
 */
const getInitiales = (nomComplet) => {
  const mots = String(nomComplet || '').trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '?';
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0].charAt(0) + mots[1].charAt(0)).toUpperCase();
};

const getRoleInfo = (code, libelleFallback) => {
  const found = ROLES.find(r => r.code === code);
  if (found) return found;
  return { libelle: libelleFallback || code || '  ', color: '#94a3b8', bg: 'bg-gray-100 text-gray-600' };
};

const formatDuree = (mins) => {
  if (mins == null) return '  ';
  if (mins < 1)   return '< 1 min';
  if (mins < 60)  return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

/**
 * Anomalies calculées côté client à partir de données réelles
 * (IP externe fournie par le backend, heure de connexion, durée de session).
 * Aucune donnée simulée ici — uniquement des règles appliquées aux vraies valeurs.
 */
const computeAnomalies = (s) => {
  const anomalies = [];
  if (s.is_externe) anomalies.push({ type: 'ip_externe', label: 'IP externe', severity: 'medium' });
  const heure = new Date(s.login_at).getHours();
  if (heure < 6 || heure > 20) anomalies.push({ type: 'heure_inhabituelle', label: 'Heure inhabituelle', severity: 'low' });
  if (s.duree_mins > 420) anomalies.push({ type: 'session_longue', label: 'Session très longue', severity: 'low' });
  const score = anomalies.reduce((acc, a) => acc + (a.severity === 'high' ? 30 : a.severity === 'medium' ? 20 : 10), 0);
  return { anomalies, score };
};

const getRiskColor = (score) => {
  if (score === 0) return { text: 'text-green-500',  bg: 'bg-green-100 text-green-700',  label: 'Sûr' };
  if (score <= 20) return { text: 'text-yellow-500', bg: 'bg-yellow-100 text-yellow-700', label: 'Faible' };
  if (score <= 40) return { text: 'text-orange-500', bg: 'bg-orange-100 text-orange-700', label: 'Moyen' };
  return              { text: 'text-red-500',    bg: 'bg-red-100 text-red-700',    label: 'Élevé' };
};

const exportToExcel = (data, filename, headers) => {
  let csv = '\uFEFF' + headers.join(';') + '\n';
  data.forEach(r => { csv += r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';') + '\n'; });
  const link = document.createElement('a');
  link.href  = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const exportToPDF = (title, headers, rows) => {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>@page{size:landscape;margin:15mm}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:20px}
  h1{font-size:20px;border-bottom:3px solid #3b82f6;padding-bottom:8px;margin-bottom:12px}
  .meta{color:#64748b;font-size:11px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;font-size:10px}
  th{background:#1e3a5f;color:#fff;padding:8px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.5px}
  td{padding:7px 10px;border-bottom:1px solid #e2e8f0}
  tr:nth-child(odd) td{background:#f0f4ff}tr:nth-child(even) td{background:#f8fafc}
  .footer{margin-top:20px;text-align:center;color:#94a3b8;font-size:10px;border-top:1px solid #e2e8f0;padding-top:8px}
  </style></head><body>
  <h1>${title}</h1><div class="meta">Export le ${new Date().toLocaleDateString('fr-FR')}  ${rows.length} session(s)</div>
  <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? '  '}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="footer">SGS Fleetify  Historique Connexions ${new Date().getFullYear()}</div>
  <script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
};

// ============================================================================
// AVATAR (initiales nom + prénom)
// ============================================================================
const Avatar = ({ name, sizeClass = 'w-8 h-8', textClass = 'text-xs', roundedClass = 'rounded-full', className = '' }) => (
  <div className={`${sizeClass} ${roundedClass} ${textClass} flex items-center justify-center text-white font-bold shrink-0 tracking-wide select-none ${className}`}
    style={{ background: colorForName(name) }}
    title={name}>
    {getInitiales(name)}
  </div>
);

// ============================================================================
// TOAST
// ============================================================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg   = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-orange-500', info: 'bg-blue-500' }[type];
  const icon = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }[type];
  return (
    <div className={`fixed top-4 right-4 z-[9999] ${bg} text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3`}
      style={{ animation: 'fadeInDown .3s ease-out' }}>
      <i className={`${icon} text-xl`}></i>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-80"><i className="bi bi-x-lg"></i></button>
    </div>
  );
};

// ============================================================================
// BADGE STATUT SESSION
// ============================================================================
const SessionBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
    {active ? 'En ligne' : 'Déconnecté'}
  </span>
);

// ============================================================================
// SKELETON PLEINE PAGE (pendant le chargement)
// ============================================================================
const SkeletonBlock = ({ darkMode, className = '' }) => (
  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded animate-pulse ${className}`}></div>
);

const PageSkeleton = ({ darkMode }) => (
  <>
    {/* KPI skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5`}>
          <SkeletonBlock darkMode={darkMode} className="w-10 h-10 rounded-xl mb-3" />
          <SkeletonBlock darkMode={darkMode} className="h-8 w-16 mb-2" />
          <SkeletonBlock darkMode={darkMode} className="h-4 w-24" />
        </div>
      ))}
    </div>

    {/* Graphiques skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {[1, 2, 3].map(i => (
        <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}>
          <SkeletonBlock darkMode={darkMode} className="h-5 w-32 mb-5" />
          {[1, 2, 3, 4].map(j => (
            <div key={j} className="flex items-center gap-3 mb-3">
              <SkeletonBlock darkMode={darkMode} className="h-3 w-20 shrink-0" />
              <SkeletonBlock darkMode={darkMode} className="h-2.5 flex-1" />
              <SkeletonBlock darkMode={darkMode} className="h-3 w-6 shrink-0" />
            </div>
          ))}
        </div>
      ))}
    </div>

    {/* Toolbar skeleton */}
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-6`}>
      <div className="flex items-center gap-3 flex-wrap">
        {[1, 2, 3].map(i => <SkeletonBlock key={i} darkMode={darkMode} className="h-9 w-32" />)}
        <div className="flex-1" />
        <SkeletonBlock darkMode={darkMode} className="h-9 w-52" />
        <SkeletonBlock darkMode={darkMode} className="h-9 w-28" />
      </div>
    </div>

    {/* Tableau skeleton */}
    <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
      <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <SkeletonBlock darkMode={darkMode} className="h-4 w-48" />
      </div>
      <div className={darkMode ? 'bg-gray-800/60' : 'bg-gray-100'} style={{ height: '46px' }}></div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className={`flex items-center gap-4 px-4 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <SkeletonBlock darkMode={darkMode} className="w-16 h-6 rounded-full shrink-0" />
          <SkeletonBlock darkMode={darkMode} className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBlock darkMode={darkMode} className="h-3 w-32" />
            <SkeletonBlock darkMode={darkMode} className="h-2.5 w-40" />
          </div>
          <SkeletonBlock darkMode={darkMode} className="h-5 w-24 rounded-full shrink-0" />
          <SkeletonBlock darkMode={darkMode} className="h-3 w-20 shrink-0" />
          <SkeletonBlock darkMode={darkMode} className="h-3 w-16 shrink-0" />
          <SkeletonBlock darkMode={darkMode} className="h-5 w-14 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  </>
);

// ============================================================================
// MODAL DÉTAIL SESSION
// ============================================================================
const SessionModal = ({ session: s, darkMode, theme, onClose, onForceLogout }) => {
  const ri = getRoleInfo(s.user_role, s.user_role_libelle);
  const { anomalies, score } = computeAnomalies(s);
  const navMeta = getNavMeta(s.navigateur);
  const osMeta = getOsMeta(s.os);
  const loginDate  = new Date(s.login_at);
  const logoutDate = s.logout_at ? new Date(s.logout_at) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}>

        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}
          style={{ background: `linear-gradient(135deg, ${theme.primary}18, transparent)` }}>
          <div className="flex items-center gap-4">
            <Avatar name={s.user_nom} sizeClass="w-12 h-12" textClass="text-base" roundedClass="rounded-xl" className="shadow-lg" />
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.user_nom}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <SessionBadge active={s.is_active} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.session_id}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <div className={`rounded-xl p-4 border ${darkMode ? 'bg-red-900/15 border-red-800/30' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                <i className="bi bi-exclamation-triangle-fill mr-1.5"></i>Anomalies détectées
              </p>
              <div className="flex flex-wrap gap-2">
                {anomalies.map((a, i) => (
                  <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    a.severity === 'high' ? 'bg-red-100 text-red-700' : a.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                  }`}><i className="bi bi-exclamation-circle mr-1"></i>{a.label}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Utilisateur */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-blue-50'} rounded-xl p-5`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Utilisateur</p>
              <div className="space-y-2.5">
                {[
                  ['Nom',       s.user_nom],
                  ['Email',     s.user_email],
                  ['Rôle',      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ri.bg}`}>{ri.libelle}</span>],
                  ['Direction', s.user_direction || ' '],
                ].map(([l, v], i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{l}</span>
                    <span className={`text-sm font-medium text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technique */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-purple-50'} rounded-xl p-5`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Informations techniques</p>
              <div className="space-y-2.5">
                {[
                  ['Navigateur',  <span className="flex items-center gap-1.5 text-sm font-medium"><i className={navMeta.icon} style={{ color: navMeta.color }}></i>{s.navigateur} {s.navigateur_version}</span>],
                  ['Système',     <span className="flex items-center gap-1.5 text-sm font-medium"><i className={osMeta.icon} style={{ color: osMeta.color }}></i>{s.os} {s.os_version}</span>],
                  ['Adresse IP',  <span className={`font-mono text-sm font-semibold ${s.is_externe ? 'text-orange-500' : (darkMode ? 'text-gray-200' : 'text-gray-800')}`}>{s.adresse_ip || '  '}{s.is_externe && ' ⚠️'}</span>],
                ].map(([l, v], i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} shrink-0`}>{l}</span>
                    <div className={`text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline session */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-green-50'} rounded-xl p-5`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <i className="bi bi-clock-history mr-1.5"></i>Timeline de la session
            </p>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold mx-auto mb-1">
                  <i className="bi bi-box-arrow-in-right"></i>
                </div>
                <p className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Connexion</p>
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{loginDate.toLocaleTimeString('fr-FR')}</p>
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{loginDate.toLocaleDateString('fr-FR')}</p>
              </div>

              <div className="flex-1 relative">
                <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500" style={{ width: '100%' }}></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'} shadow`}>
                    {formatDuree(s.duree_mins)}
                  </span>
                </div>
              </div>

              <div className="text-center">
                {s.is_active ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white text-sm font-bold mx-auto mb-1 animate-pulse">
                      <i className="bi bi-circle-fill text-xs"></i>
                    </div>
                    <p className="text-xs font-bold text-green-500">En ligne</p>
                    <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Maintenant</p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-red-400 flex items-center justify-center text-white text-sm font-bold mx-auto mb-1">
                      <i className="bi bi-box-arrow-right"></i>
                    </div>
                    <p className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Déconnexion</p>
                    <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{logoutDate?.toLocaleTimeString('fr-FR')}</p>
                    <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{logoutDate?.toLocaleDateString('fr-FR')}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Score de risque */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4 text-center`}>
            <i className="bi bi-shield-fill text-2xl mb-2 block" style={{ color: score === 0 ? '#10b981' : score <= 20 ? '#f59e0b' : score <= 40 ? '#f97316' : '#ef4444' }}></i>
            <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{score}/100</p>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Score de risque</p>
          </div>

          {/* User agent complet */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>User Agent</p>
            <p className={`text-xs font-mono break-all ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.user_agent}</p>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {s.is_active && (
              <button onClick={() => onForceLogout(s.id)}
                className="px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
                <i className="bi bi-power"></i> Forcer la déconnexion
              </button>
            )}
          </div>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const HistoriqueConnexion = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [animateCards, setAnimateCards] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => { const id2 = requestAnimationFrame(() => setAnimateCards(true)); return () => cancelAnimationFrame(id2); });
    return () => cancelAnimationFrame(id);
  }, []);

  // Configuration SweetAlert2 adaptée au thème actif (même principe que Login.jsx)
  const getSwalConfig = () => ({
    background: darkMode ? '#1e293b' : '#ffffff',
    color: darkMode ? '#f1f5f9' : '#111827',
    confirmButtonColor: theme.primary,
    cancelButtonColor: darkMode ? '#334155' : '#9ca3af',
    customClass: {
      popup: darkMode ? 'swal-dark-popup' : 'swal-light-popup',
      confirmButton: 'swal-confirm-btn',
    },
  });

  // ── États données API ──
  const [sessions, setSessions]   = useState([]);
  const [meta, setMeta]           = useState({ current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE });
  const [stats, setStats]         = useState({ total: 0, en_ligne: 0, deconnectes: 0, duree_moyenne_mins: 0 });
  const [navStats, setNavStats]   = useState({});
  const [osStats, setOsStats]     = useState({});
  const [heures, setHeures]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ── Filtres ──
  const [searchTerm, setSearchTerm]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole]       = useState('');
  const [filterNav, setFilterNav]         = useState('');
  const [filterOS, setFilterOS]           = useState('');
  const [filterStatut, setFilterStatut]   = useState('');
  const [filterPeriode, setFilterPeriode] = useState('30j');
  const [sortBy, setSortBy]               = useState('login_at');
  const [sortDir, setSortDir]             = useState('desc');
  const [currentPage, setCurrentPage]     = useState(1);

  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [toast, setToast]             = useState(null);
  const [exportOpen, setExportOpen]   = useState(false);
  const [exporting, setExporting]     = useState(false);
  const [view, setView]               = useState('table');
  const exportRef = useRef(null);
  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  // Debounce recherche
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset page à 1 quand un filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, filterNav, filterOS, filterStatut, filterPeriode, debouncedSearch, sortBy, sortDir]);

  // Fermer le menu export au clic extérieur
  useEffect(() => {
    const h = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const buildParams = useCallback((overrides = {}) => ({
    periode: filterPeriode,
    role: filterRole || undefined,
    navigateur: filterNav || undefined,
    os: filterOS || undefined,
    statut: filterStatut || undefined,
    search: debouncedSearch || undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
    page: currentPage,
    per_page: PER_PAGE,
    ...overrides,
  }), [filterPeriode, filterRole, filterNav, filterOS, filterStatut, debouncedSearch, sortBy, sortDir, currentPage]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchHistoriqueConnexions(buildParams());
      setSessions(data.data || []);
      setMeta(data.meta || { current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE });
      setStats(data.stats || { total: 0, en_ligne: 0, deconnectes: 0, duree_moyenne_mins: 0 });
      setNavStats(data.navigateurs || {});
      setOsStats(data.os || {});
      setHeures(data.heures || {});
    } catch (err) {
      console.error('Erreur chargement historique connexions:', err);
      setError("Impossible de charger l'historique des connexions");
      showToast("Erreur lors du chargement de l'historique", 'error');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { loadData(); }, [loadData]);

  // Rafraîchissement léger périodique (sessions actives, durées) sans reset des filtres
  useEffect(() => {
    const i = setInterval(() => { loadData(); }, 60000);
    return () => clearInterval(i);
  }, [loadData]);

  const resetFilters = () => {
    setFilterRole(''); setFilterNav(''); setFilterOS(''); setFilterStatut(''); setSearchTerm('');
  };
  const hasFilters = filterRole || filterNav || filterOS || filterStatut || searchTerm;

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('desc'); }
  };

  // ── Déconnexion forcée avec confirmation SweetAlert2 ──
  const handleForceLogout = async (sessionId) => {
    const result = await Swal.fire({
      ...getSwalConfig(),
      icon: 'warning',
      iconColor: '#f59e0b',
      title: 'Forcer la déconnexion ?',
      text: 'Cette action va immédiatement mettre fin à cette session. L\'utilisateur devra se reconnecter.',
      showCancelButton: true,
      confirmButtonText: 'Oui, déconnecter',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await forceLogoutSession(sessionId);
      setShowModal(false);
      showToast('Session déconnectée de force', 'warning');
      loadData();
    } catch (err) {
      console.error('Erreur force logout:', err);
      Swal.fire({
        ...getSwalConfig(),
        icon: 'error',
        iconColor: '#ef4444',
        title: 'Erreur',
        text: 'Impossible de forcer la déconnexion de cette session.',
        confirmButtonText: 'Fermer',
      });
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const { data } = await fetchAllHistoriqueConnexionsForExport(buildParams({ page: 1 }));
      const rows = data.data || [];
      const headers = ['ID Session', 'Utilisateur', 'Email', 'Rôle', 'Connexion', 'Durée', 'Statut', 'Navigateur', 'OS', 'IP', 'Score Risque', 'Anomalies'];
      const toRow = (s) => {
        const { anomalies, score } = computeAnomalies(s);
        return [
          s.session_id, s.user_nom, s.user_email, getRoleInfo(s.user_role, s.user_role_libelle).libelle,
          new Date(s.login_at).toLocaleString('fr-FR'), formatDuree(s.duree_mins),
          s.is_active ? 'En ligne' : 'Déconnecté', s.navigateur, s.os, s.adresse_ip, score,
          anomalies.map(a => a.label).join(', ') || 'Aucune',
        ];
      };
      const exportRows = rows.map(toRow);
      if (format === 'excel') {
        exportToExcel(exportRows, 'Historique_Connexions', headers);
        showToast('Export Excel effectué', 'success');
      } else {
        exportToPDF('Historique des Connexions', headers, exportRows);
        showToast('Export PDF généré', 'success');
      }
    } catch (err) {
      console.error('Erreur export:', err);
      showToast("Erreur lors de l'export", 'error');
    } finally {
      setExporting(false);
      setExportOpen(false);
    }
  };

  const periodeInfo = PERIODES.find(p => p.code === filterPeriode) || PERIODES[1];

  // Distribution navigateurs/OS triée, sous forme de liste avec meta icône/couleur
  const navStatsList = Object.entries(navStats).map(([nom, count]) => ({ nom, count, ...getNavMeta(nom) })).sort((a, b) => b.count - a.count);
  const osStatsList  = Object.entries(osStats).map(([nom, count]) => ({ nom, count, ...getOsMeta(nom) })).sort((a, b) => b.count - a.count);
  const maxNav = Math.max(...navStatsList.map(n => n.count), 1);
  const maxOS  = Math.max(...osStatsList.map(o => o.count), 1);

  // Heatmap 24h à partir des données backend { "0": n, "1": n, ... }
  const heuresList = Array.from({ length: 24 }, (_, h) => ({ heure: h, count: heures[String(h)] || 0 }));
  const maxHeure = Math.max(...heuresList.map(h => h.count), 1);
  const heurePointe = heuresList.reduce((m, h) => (h.count > m.count ? h : m), heuresList[0]);

  // Sessions actives visibles sur la page chargée (bandeau temps réel)
  const activesSurPage = sessions.filter(s => s.is_active);

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
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.3} }
        .row-hover:hover { filter: brightness(1.09); }
        .swal-dark-popup { border: 1px solid #334155 !important; border-radius: 16px !important; }
        .swal-light-popup { border-radius: 16px !important; box-shadow: 0 25px 50px rgba(0,0,0,0.15) !important; }
        .swal-confirm-btn { border-radius: 10px !important; font-weight: 600 !important; padding: 10px 28px !important; }
      `}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header  darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {(showNotifications || showProfile) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfile(false); }} />
      )}

      <main className="flex-1 transition-all duration-300 pt-24 px-4 pb-10" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '15rem' }}>

        {/* ════ EN-TÊTE ════ */}
        <div className="flex items-center justify-between mb-6" style={{ animation: animateCards ? 'fadeInUp .4s ease-out both' : 'none' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className="bi bi-person-check-fill text-white text-lg"></i>
            </div>
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Historique des Connexions</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Surveillance des sessions utilisateurs navigateurs, IP, durée</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" style={{ animation: 'pulse-dot 1.5s infinite' }}></span>
              <span className="text-sm font-bold text-green-500">{stats.en_ligne}</span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>en ligne (sur la période)</span>
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-6 rounded-xl p-4 border ${darkMode ? 'bg-red-900/15 border-red-800/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <i className="bi bi-exclamation-triangle-fill mr-2"></i>{error}
          </div>
        )}


        {loading ? (
          <PageSkeleton darkMode={darkMode} />
        ) : (
          <>
            {/* ════ KPI CARDS ════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Sessions totales', val: stats.total,   icon: 'bi-person-lines-fill', color: theme.primary, sub: `sur ${periodeInfo.libelle.toLowerCase()}` },
                { label: 'En ligne',         val: stats.en_ligne, icon: 'bi-wifi',              color: '#10b981',      sub: 'sessions actives' },
                { label: 'Durée moyenne',    val: formatDuree(stats.duree_moyenne_mins), icon: 'bi-stopwatch-fill', color: '#f59e0b', sub: 'par session' },
                { label: 'Déconnectés',      val: stats.deconnectes, icon: 'bi-power',          color: '#94a3b8',      sub: 'sur la période' },
              ].map((k, i) => (
                <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5`}
                  style={{ animation: animateCards ? `fadeInUp .5s ease-out ${i * .07}s both` : 'none' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${k.color}22` }}>
                      <i className={`${k.icon} text-lg`} style={{ color: k.color }}></i>
                    </div>
                    {i === 1 && stats.en_ligne > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400" style={{ animation: 'pulse-dot 2s infinite' }}></span>
                    )}
                  </div>
                  <p className={`text-3xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>{k.val}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{k.label}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* ════ GRAPHIQUES ════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              {/* Navigateurs */}
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
                style={{ animation: animateCards ? 'fadeInUp .5s ease-out .28s both' : 'none' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Navigateurs utilisés</h3>
                </div>
                <div className="space-y-3">
                  {navStatsList.length === 0 && <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune donnée</p>}
                  {navStatsList.map(n => (
                    <div key={n.nom} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <i className={`${n.icon} text-base`} style={{ color: n.color }}></i>
                        <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{n.nom}</span>
                      </div>
                      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(n.count / maxNav) * 100}%`, background: n.color }} />
                      </div>
                      <span className={`text-sm font-bold w-6 text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{n.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OS */}
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
                style={{ animation: animateCards ? 'fadeInUp .5s ease-out .35s both' : 'none' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Systèmes d'exploitation</h3>
                </div>
                <div className="space-y-3">
                  {osStatsList.length === 0 && <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucune donnée</p>}
                  {osStatsList.map(o => (
                    <div key={o.nom} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <i className={`${o.icon} text-base`} style={{ color: o.color }}></i>
                        <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{o.nom}</span>
                      </div>
                      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(o.count / maxOS) * 100}%`, background: o.color }} />
                      </div>
                      <span className={`text-sm font-bold w-6 text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{o.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heures de pointe */}
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
                style={{ animation: animateCards ? 'fadeInUp .5s ease-out .42s both' : 'none' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Heures de connexion</h3>
                </div>
                <div className="grid grid-cols-12 gap-1 mb-2">
                  {heuresList.map(h => {
                    const alpha = Math.max(0.1, h.count / maxHeure);
                    return (
                      <div key={h.heure} className="flex flex-col items-center gap-1" title={`${h.heure}h : ${h.count} connexion(s)`}>
                        <div className="w-full rounded" style={{ height: '36px', background: theme.primary, opacity: alpha }}></div>
                        {h.heure % 6 === 0 && <span className={`text-[9px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{h.heure}h</span>}
                      </div>
                    );
                  })}
                </div>
                <p className={`text-xs text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  Heure de pointe : {heurePointe?.heure ?? ' '}h00
                </p>
              </div>
            </div>

            {/* ════ SESSIONS ACTIVES (page courante) ════ */}
            {activesSurPage.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5 mb-6`}
                style={{ animation: animateCards ? 'fadeInUp .5s ease-out .55s both' : 'none' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-green-500"></div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Sessions actives (page en cours)
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-semibold">{activesSurPage.length}</span>
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {activesSurPage.map(s => (
                    <button key={s.id} onClick={() => { setSelectedSession(s); setShowModal(true); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-105 ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-green-500/50' : 'bg-gray-50 border-gray-200 hover:border-green-400'}`}>
                      <div className="relative">
                        <Avatar name={s.user_nom} sizeClass="w-9 h-9" textClass="text-xs" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-900" style={{ animation: 'pulse-dot 2s infinite' }}></span>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{s.user_nom}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDuree(s.duree_mins)}</p>
                      </div>
                      <i className={`${getNavMeta(s.navigateur).icon} text-base ml-1`} style={{ color: getNavMeta(s.navigateur).color }}></i>
                    </button>
                  ))}
                </div>
              </div>
            )}

        {/* ════ TOOLBAR ════ */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-6`}
          style={{ animation: animateCards ? 'fadeInUp .5s ease-out .1s both' : 'none' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">

            <div className="flex items-center gap-3 flex-wrap">
              <select value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                {PERIODES.map(p => <option key={p.code} value={p.code}>{p.libelle}</option>)}
              </select>

              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les statuts</option>
                <option value="active">En ligne</option>
                <option value="inactive">Déconnectés</option>
              </select>

              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les rôles</option>
                {ROLES.map(r => <option key={r.code} value={r.code}>{r.libelle}</option>)}
              </select>

              {hasFilters && (
                <button onClick={resetFilters}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${darkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}>
                  <i className="bi bi-x-lg text-xs"></i> Effacer
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex rounded-lg border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {[['table', 'bi-table'], ['cards', 'bi-grid-3x3-gap-fill']].map(([v, ic]) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`p-2 text-sm transition-colors ${view === v ? 'text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
                    style={view === v ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                    <i className={`bi ${ic}`}></i>
                  </button>
                ))}
              </div>

              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Nom, email..."
                  className={`pl-9 pr-4 py-2 rounded-lg border text-sm w-52 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`} />
              </div>

            </div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{loading ? 'Chargement...' : `${meta.total} session(s) trouvée(s)`}</p>
        </div>

            {/* ════ VUE TABLEAU ════ */}
            {view === 'table' && (
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}
                style={{ animation: animateCards ? 'fadeInUp .5s ease-out .65s both' : 'none' }}>

                <div className={`px-6 py-3 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <i className="bi bi-person-check mr-2"></i>{meta.total} session(s)   {periodeInfo.libelle}
                  </p>
                  <div className="flex items-center gap-6">
                    {[
                      { label: 'En ligne', val: stats.en_ligne, color: 'text-green-500' },
                      { label: 'Déconnectés', val: stats.deconnectes, color: 'text-gray-400' },
                      { label: 'Durée moy.', val: formatDuree(stats.duree_moyenne_mins), color: darkMode ? 'text-gray-300' : 'text-gray-700' },
                    ].map((k, i) => (
                      <div key={i} className="text-center">
                        <p className={`text-sm font-bold ${k.color}`}>{k.val}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{k.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                        {[
                          ['Statut', null],
                          ['Utilisateur', 'user_nom'],
                          ['Rôle', null],
                          ['Navigateur / OS', null],
                          ['Connexion', 'login_at'],
                          ['Durée', 'duree_mins'],
                          ['Risque', null],
                          ['Actions', null],
                        ].map(([h, col], i) => (
                          <th key={i} onClick={() => col && handleSort(col)}
                            className={`px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white ${col ? 'cursor-pointer hover:bg-white/10 select-none' : ''}`}>
                            {h}{col && <SortIcon col={col} />}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.length === 0 ? (
                        <tr><td colSpan={8} className={`text-center py-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          <i className="bi bi-person-x text-5xl block mb-3 opacity-40"></i>
                          <span className="text-sm">Aucune session pour les filtres sélectionnés</span>
                        </td></tr>
                      ) : sessions.map((s, idx) => {
                        const ri = getRoleInfo(s.user_role, s.user_role_libelle);
                        const { anomalies, score } = computeAnomalies(s);
                        const risk = getRiskColor(score);
                        const navMeta = getNavMeta(s.navigateur);
                        const osMeta = getOsMeta(s.os);
                        const d = new Date(s.login_at);
                        return (
                          <tr key={s.id} className="row-hover transition-all duration-150 cursor-pointer"
                            style={{
                              backgroundColor: idx % 2 === 0 ? (darkMode ? '#0c1929' : '#e8eef6') : (darkMode ? '#162033' : '#f1f4f9'),
                              animation: animateCards ? `fadeInUp .4s ease-out ${idx * .04}s both` : 'none',
                            }}
                            onClick={() => { setSelectedSession(s); setShowModal(true); }}>

                            <td className="px-4 py-4 whitespace-nowrap"><SessionBadge active={s.is_active} /></td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar name={s.user_nom} sizeClass="w-9 h-9" textClass="text-xs" />
                                  {s.is_active && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-gray-900" style={{ animation: 'pulse-dot 2s infinite' }}></span>}
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{s.user_nom}</p>
                                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.user_email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${ri.bg}`}>{ri.libelle}</span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5">
                                <i className={`${navMeta.icon} text-base`} style={{ color: navMeta.color }}></i>
                                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.navigateur}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <i className={`${osMeta.icon} text-sm`} style={{ color: osMeta.color }}></i>
                                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.os}</span>
                              </div>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{d.toLocaleDateString('fr-FR')}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{d.toLocaleTimeString('fr-FR')}</p>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`text-sm font-semibold ${s.is_active ? 'text-green-500' : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                                {s.is_active && <i className="bi bi-clock-fill mr-1 text-xs"></i>}
                                {formatDuree(s.duree_mins)}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${risk.bg}`}>{risk.label}</span>
                                {anomalies.length > 0 && (
                                  <span className="text-orange-400 text-xs" title={anomalies.map(a => a.label).join(', ')}>
                                    <i className="bi bi-exclamation-triangle-fill"></i>
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => { setSelectedSession(s); setShowModal(true); }}
                                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                                  title="Voir détails"><i className="bi bi-eye"></i></button>
                                {s.is_active && (
                                  <button onClick={() => handleForceLogout(s.id)}
                                    className="p-2 rounded-lg transition-colors hover:bg-red-500/20 text-red-400 hover:text-red-500"
                                    title="Forcer déconnexion"><i className="bi bi-power"></i></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {meta.last_page > 1 && (
                  <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} sur {meta.total}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={meta.current_page === 1}
                        className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      {Array.from({ length: Math.min(7, meta.last_page) }, (_, i) => {
                        let page;
                        if (meta.last_page <= 7) page = i + 1;
                        else if (meta.current_page <= 4) page = i + 1;
                        else if (meta.current_page >= meta.last_page - 3) page = meta.last_page - 6 + i;
                        else page = meta.current_page - 3 + i;
                        return (
                          <button key={page} onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${meta.current_page === page ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                            style={meta.current_page === page ? { background: `linear-gradient(to right,${theme.primary},${theme.primaryDark})` } : {}}>
                            {page}
                          </button>
                        );
                      })}
                      <button onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page}
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" style={{ animation: animateCards ? 'fadeInUp .5s ease-out .65s both' : 'none' }}>
                {sessions.map((s, idx) => {
                  const ri = getRoleInfo(s.user_role, s.user_role_libelle);
                  const { anomalies, score } = computeAnomalies(s);
                  const risk = getRiskColor(score);
                  const navMeta = getNavMeta(s.navigateur);
                  const osMeta = getOsMeta(s.os);
                  return (
                    <div key={s.id} onClick={() => { setSelectedSession(s); setShowModal(true); }}
                      className={`${darkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-300'} rounded-xl border shadow-sm p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5`}
                      style={{ animation: animateCards ? `fadeInUp .4s ease-out ${idx * .04}s both` : 'none' }}>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar name={s.user_nom} sizeClass="w-10 h-10" textClass="text-sm" />
                            {s.is_active && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-900" style={{ animation: 'pulse-dot 2s infinite' }}></span>}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{s.user_nom}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ri.bg}`}>{ri.libelle}</span>
                          </div>
                        </div>
                        <SessionBadge active={s.is_active} />
                      </div>

                      <div className={`rounded-lg p-3 mb-3 space-y-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <i className={`${navMeta.icon} text-sm`} style={{ color: navMeta.color }}></i>
                          <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{s.navigateur}</span>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>·</span>
                          <i className={`${osMeta.icon} text-xs`} style={{ color: osMeta.color }}></i>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.os}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Connexion</p>
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{new Date(s.login_at).toLocaleTimeString('fr-FR')}</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Durée</p>
                          <p className={`text-sm font-semibold ${s.is_active ? 'text-green-500' : (darkMode ? 'text-gray-200' : 'text-gray-800')}`}>{formatDuree(s.duree_mins)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${risk.bg}`}>{risk.label}</span>
                      </div>

                      {anomalies.length > 0 && (
                        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex flex-wrap gap-1`}>
                          {anomalies.map((a, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                              <i className="bi bi-exclamation-circle mr-0.5"></i>{a.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {meta.last_page > 1 && (
                  <div className="col-span-full flex items-center justify-between px-2 py-3">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} sur {meta.total}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={meta.current_page === 1}
                        className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      {Array.from({ length: meta.last_page }, (_, i) => i + 1).slice(Math.max(0, meta.current_page - 3), Math.min(meta.last_page, meta.current_page + 2)).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-semibold ${meta.current_page === page ? 'text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                          style={meta.current_page === page ? { background: `linear-gradient(to right,${theme.primary},${theme.primaryDark})` } : {}}>
                          {page}
                        </button>
                      ))}
                      <button onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page}
                        className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
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

      {/* ── FOOTER ── */}
      <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />

      {showModal && selectedSession && (
        <SessionModal
          session={selectedSession}
          darkMode={darkMode}
          theme={theme}
          onClose={() => setShowModal(false)}
          onForceLogout={handleForceLogout}
        />
      )}
    </div>
  );
};

export default HistoriqueConnexion;