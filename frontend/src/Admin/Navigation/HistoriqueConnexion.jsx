import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

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

const NAVIGATEURS = [
  { code: 'chrome',  libelle: 'Google Chrome',   icon: 'bi-browser-chrome',  color: '#f59e0b' },
  { code: 'firefox', libelle: 'Mozilla Firefox',  icon: 'bi-browser-firefox', color: '#f97316' },
  { code: 'safari',  libelle: 'Apple Safari',     icon: 'bi-browser-safari',  color: '#3b82f6' },
  { code: 'edge',    libelle: 'Microsoft Edge',   icon: 'bi-browser-edge',    color: '#06b6d4' },
  { code: 'opera',   libelle: 'Opera',            icon: 'bi-globe',           color: '#ef4444' },
];

const OS_LIST = [
  { code: 'windows', libelle: 'Windows 11',  icon: 'bi-windows',  color: '#06b6d4' },
  { code: 'macos',   libelle: 'macOS Sonoma', icon: 'bi-apple',   color: '#94a3b8' },
  { code: 'android', libelle: 'Android 14',  icon: 'bi-android2', color: '#10b981' },
  { code: 'ios',     libelle: 'iOS 17',      icon: 'bi-phone',    color: '#6366f1' },
  { code: 'linux',   libelle: 'Linux Ubuntu', icon: 'bi-terminal', color: '#f59e0b' },
];

const PERIODES = [
  { code: '7j',    libelle: '7 derniers jours',  jours: 7 },
  { code: '30j',   libelle: 'Mensuel',           jours: 30 },
  { code: '90j',   libelle: 'Trimestriel',       jours: 90 },
  { code: '180j',  libelle: 'Semestriel',        jours: 180 },
  { code: '365j',  libelle: 'Annuel',            jours: 365 },
];

// ============================================================================
// DONNÉES DE DÉMONSTRATION — sessions de connexion
// ============================================================================
const USERS = [
  { id: 1, nom: 'Hulas Djyembi',  email: 'hulassanders@sgs.ga',  role: 'admin',          direction: 'Direction Générale',    avatar_color: '#ef4444' },
  { id: 2, nom: 'Pierre Nzong',   email: 'p.nzong@sgs.ga',       role: 'chauffeur',      direction: 'Direction Technique',   avatar_color: '#8b5cf6' },
  { id: 3, nom: 'Marc Essono',    email: 'm.essono@sgs.ga',       role: 'chef_parc',      direction: 'Direction Logistique',  avatar_color: '#6366f1' },
  { id: 4, nom: 'Luc Mba',        email: 'l.mba@sgs.ga',          role: 'chauffeur',      direction: 'Direction Technique',   avatar_color: '#8b5cf6' },
  { id: 5, nom: 'Sophie Ondo',    email: 's.ondo@sgs.ga',         role: 'agent_pc_radio', direction: 'Direction Générale',    avatar_color: '#06b6d4' },
  { id: 6, nom: 'François Obame', email: 'f.obame@sgs.ga',        role: 'mecanicien',     direction: 'Direction Technique',   avatar_color: '#10b981' },
  { id: 7, nom: 'Claire Bouanga', email: 'c.bouanga@sgs.ga',      role: 'chef_tf',        direction: 'Transport de Fonds',    avatar_color: '#f59e0b' },
  { id: 8, nom: 'Alain Nguema',   email: 'a.nguema@sgs.ga',       role: 'chef_parc',      direction: 'Direction Logistique',  avatar_color: '#6366f1' },
];

const LOCATIONS = [
  { ville: 'Libreville',  pays: 'Gabon', drapeau: '🇬🇦', lat: 0.39, lon: 9.45 },

];

const genMAC = () => Array.from({length:6},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(':').toUpperCase();
const genIP  = (local=true) => local ? `192.168.${Math.floor(Math.random()*5)+1}.${Math.floor(Math.random()*200)+10}` : `41.${Math.floor(Math.random()*200)+50}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}`;

const genSessions = () => {
  const sessions = [];
  let id = 1;
  const now = new Date();

  USERS.forEach(user => {
    // Nombre de sessions par utilisateur (5 à 25)
    const nbSessions = Math.floor(Math.random() * 20) + 5;
    for (let s = 0; s < nbSessions; s++) {
      const daysAgo  = Math.floor(Math.random() * 30);
      const hLogin   = Math.floor(Math.random() * 13) + 6; // 6h-19h
      const mLogin   = Math.floor(Math.random() * 60);
      const loginDate = new Date(now);
      loginDate.setDate(loginDate.getDate() - daysAgo);
      loginDate.setHours(hLogin, mLogin, 0, 0);

      // Durée de session (5min à 8h)
      const dureeMins = Math.floor(Math.random() * 480) + 5;
      const logoutDate = new Date(loginDate.getTime() + dureeMins * 60 * 1000);

      // Session active ? (seulement les sessions d'aujourd'hui et pas encore déconnecté)
      const isToday  = daysAgo === 0;
      const isActive = isToday && Math.random() > 0.4 && logoutDate > now;

      const nav = NAVIGATEURS[Math.floor(Math.random() * NAVIGATEURS.length)];
      const os  = OS_LIST[Math.floor(Math.random() * OS_LIST.length)];
      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const ip  = Math.random() > 0.2 ? genIP(true) : genIP(false);
      const isExternal = !ip.startsWith('192.168.');

      // Score de risque
      const anomalies = [];
      if (isExternal)  anomalies.push({ type: 'ip_externe',   label: 'IP externe',      severity: 'medium' });
      if (hLogin < 6 || hLogin > 20) anomalies.push({ type: 'heure_inhabituelle', label: 'Heure inhabituelle', severity: 'low' });
      if (dureeMins > 420) anomalies.push({ type: 'session_longue', label: 'Session très longue', severity: 'low' });
      const riskScore = anomalies.reduce((acc, a) => acc + (a.severity === 'high' ? 30 : a.severity === 'medium' ? 20 : 10), 0);

      sessions.push({
        id: id++,
        session_id: `SES-${String(id).padStart(6,'0')}`,
        user_id: user.id,
        user_nom: user.nom,
        user_email: user.email,
        user_role: user.role,
        user_direction: user.direction,
        avatar_color: user.avatar_color,
        navigateur_code: nav.code,
        navigateur_libelle: nav.libelle,
        navigateur_version: `${nav.libelle.split(' ')[1] || 'v'} ${Math.floor(Math.random()*10)+110}`,
        navigateur_icon: nav.icon,
        navigateur_color: nav.color,
        os_code: os.code,
        os_libelle: os.libelle,
        os_icon: os.icon,
        os_color: os.color,
        adresse_ip: ip,
        adresse_mac: genMAC(),
        location: loc,
        is_externe: isExternal,
        login_at: loginDate.toISOString(),
        logout_at: isActive ? null : logoutDate.toISOString(),
        duree_mins: isActive ? Math.round((now - loginDate) / 60000) : dureeMins,
        is_active: isActive,
        anomalies,
        risk_score: riskScore,
        pages_visitees: Math.floor(Math.random() * 40) + 1,
        actions_effectuees: Math.floor(Math.random() * 20),
        user_agent: `Mozilla/5.0 (${os.libelle}; x64) ${nav.libelle}/${Math.floor(Math.random()*10)+110}.0`,
      });
    }
  });

  return sessions.sort((a,b) => new Date(b.login_at) - new Date(a.login_at));
};

const ALL_SESSIONS = genSessions();

// ============================================================================
// UTILITAIRES
// ============================================================================
const getRoleInfo = (code) => ROLES.find(r => r.code === code) || { libelle: code, color: '#94a3b8', bg: 'bg-gray-100 text-gray-600' };

const formatDuree = (mins) => {
  if (mins < 1)   return '< 1 min';
  if (mins < 60)  return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

const formatRelative = (isoDate) => {
  const diff = (new Date() - new Date(isoDate)) / 1000;
  if (diff < 60)   return 'Il y a quelques secondes';
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
  return `Il y a ${Math.floor(diff/86400)} j`;
};

const getRiskColor = (score) => {
  if (score === 0) return { text: 'text-green-500',  bg: 'bg-green-100 text-green-700',  label: 'Sûr' };
  if (score <= 20) return { text: 'text-yellow-500', bg: 'bg-yellow-100 text-yellow-700', label: 'Faible' };
  if (score <= 40) return { text: 'text-orange-500', bg: 'bg-orange-100 text-orange-700', label: 'Moyen' };
  return              { text: 'text-red-500',    bg: 'bg-red-100 text-red-700',    label: 'Élevé' };
};

const exportToExcel = (data, filename, headers) => {
  let csv = '\uFEFF' + headers.join(';') + '\n';
  data.forEach(r => { csv += r.map(c => `"${String(c??'').replace(/"/g,'""')}"`).join(';') + '\n'; });
  const link = document.createElement('a');
  link.href  = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const exportToPDF = (title, headers, rows) => {
  const win = window.open('','_blank');
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
  <h1>${title}</h1><div class="meta">Export le ${new Date().toLocaleDateString('fr-FR')} — ${rows.length} session(s)</div>
  <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c??'—'}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="footer">SGS Fleetify — Historique Connexions — ${new Date().getFullYear()}</div>
  <script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
};

// ============================================================================
// TOAST
// ============================================================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg   = { success:'bg-green-500', error:'bg-red-500', warning:'bg-orange-500', info:'bg-blue-500' }[type];
  const icon = { success:'bi-check-circle-fill', error:'bi-x-circle-fill', warning:'bi-exclamation-triangle-fill', info:'bi-info-circle-fill' }[type];
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
// MODAL DÉTAIL SESSION
// ============================================================================
const SessionModal = ({ session: s, darkMode, theme, onClose, onForceLogout }) => {
  const ri   = getRoleInfo(s.user_role);
  const risk = getRiskColor(s.risk_score);
  const loginDate  = new Date(s.login_at);
  const logoutDate = s.logout_at ? new Date(s.logout_at) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl`}>

        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}
          style={{ background: `linear-gradient(135deg, ${theme.primary}18, transparent)` }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
              style={{ background: s.avatar_color }}>{s.user_nom.charAt(0)}</div>
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
          {s.anomalies.length > 0 && (
            <div className={`rounded-xl p-4 border ${darkMode ? 'bg-red-900/15 border-red-800/30' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                <i className="bi bi-exclamation-triangle-fill mr-1.5"></i>Anomalies détectées
              </p>
              <div className="flex flex-wrap gap-2">
                {s.anomalies.map((a, i) => (
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
                  ['Direction', s.user_direction],
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
                  ['Navigateur',  <span className="flex items-center gap-1.5 text-sm font-medium"><i className={`${s.navigateur_icon}`} style={{ color: s.navigateur_color }}></i>{s.navigateur_libelle}</span>],
                  ['Système',     <span className="flex items-center gap-1.5 text-sm font-medium"><i className={`${s.os_icon}`} style={{ color: s.os_color }}></i>{s.os_libelle}</span>],
                  ['Adresse IP',  <span className={`font-mono text-sm font-semibold ${s.is_externe ? 'text-orange-500' : (darkMode ? 'text-gray-200' : 'text-gray-800')}`}>{s.adresse_ip}{s.is_externe && ' ⚠️'}</span>],
                  ['Adresse MAC', <span className="font-mono text-xs text-gray-400">{s.adresse_mac}</span>],
                  ['Localisation',<span className="text-sm">{s.location.drapeau} {s.location.ville}, {s.location.pays}</span>],
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
              {/* Connexion */}
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold mx-auto mb-1">
                  <i className="bi bi-box-arrow-in-right"></i>
                </div>
                <p className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Connexion</p>
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{loginDate.toLocaleTimeString('fr-FR')}</p>
                <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{loginDate.toLocaleDateString('fr-FR')}</p>
              </div>

              {/* Barre de durée */}
              <div className="flex-1 relative">
                <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500" style={{ width: s.is_active ? '100%' : '100%' }}></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'} shadow`}>
                    {formatDuree(s.duree_mins)}
                  </span>
                </div>
              </div>

              {/* Déconnexion */}
              <div className="text-center">
                {s.is_active ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white text-sm font-bold mx-auto mb-1 animate-pulse">
                      <i className="bi bi-circle-fill text-xs"></i>
                    </div>
                    <p className={`text-xs font-bold text-green-500`}>En ligne</p>
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

          {/* Stats activité session */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pages visitées',      val: s.pages_visitees,    icon: 'bi-layers-fill',      color: '#6366f1' },
              { label: 'Actions effectuées',  val: s.actions_effectuees, icon: 'bi-lightning-fill',  color: '#f59e0b' },
              { label: 'Score de risque',     val: `${s.risk_score}/100`, icon: 'bi-shield-fill',   color: risk.text.replace('text-','#').replace('green-500','10b981').replace('yellow-500','f59e0b').replace('orange-500','f97316').replace('red-500','ef4444') },
            ].map((k, i) => (
              <div key={i} className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4 text-center`}>
                <i className={`${k.icon} text-2xl mb-2 block`} style={{ color: k.color }}></i>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{k.val}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{k.label}</p>
              </div>
            ))}
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
              <button onClick={() => { onForceLogout(s.id); onClose(); }}
                className="px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
                <i className="bi bi-power"></i> Forcer la déconnexion
              </button>
            )}
            <button onClick={() => {
              const h = ['ID Session','Utilisateur','Email','Rôle','Connexion','Durée','Navigateur','OS','IP','MAC','Localisation','Pages','Actions','Risque'];
              exportToExcel([[s.session_id,s.user_nom,s.user_email,getRoleInfo(s.user_role).libelle,new Date(s.login_at).toLocaleString('fr-FR'),formatDuree(s.duree_mins),s.navigateur_libelle,s.os_libelle,s.adresse_ip,s.adresse_mac,`${s.location.ville} (${s.location.pays})`,s.pages_visitees,s.actions_effectuees,s.risk_score]], `Session_${s.id}`, h);
            }} className={`px-4 py-2.5 rounded-lg border text-sm flex items-center gap-2 ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} transition-colors`}>
              <i className="bi bi-file-earmark-spreadsheet text-green-500"></i> Exporter
            </button>
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
  const [showProfile, setShowProfile]             = useState(false);
  const [animateCards, setAnimateCards]           = useState(false);
  const { theme } = useTheme();
  const navigate  = useNavigate();

  useEffect(() => {
    const id = requestAnimationFrame(() => { const id2 = requestAnimationFrame(() => setAnimateCards(true)); return () => cancelAnimationFrame(id2); });
    return () => cancelAnimationFrame(id);
  }, []);

  // ── États ──
  const [sessions, setSessions]         = useState(ALL_SESSIONS);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterRole, setFilterRole]     = useState('');
  const [filterNav, setFilterNav]       = useState('');
  const [filterOS, setFilterOS]         = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterRisk, setFilterRisk]     = useState('');
  const [filterPeriode, setFilterPeriode] = useState('30j');
  const [sortBy, setSortBy]             = useState('login_at');
  const [sortDir, setSortDir]           = useState('desc');
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [toast, setToast]               = useState(null);
  const [exportOpen, setExportOpen]     = useState(false);
  const [view, setView]                 = useState('table'); // table | cards
  const exportRef = useRef(null);
  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  useEffect(() => {
    const h = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Ticker temps réel pour les sessions actives
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(i); }, []);

  const ITEMS_PER_PAGE = 10;

  // ── Filtrage ──
  const periodeInfo = PERIODES.find(p => p.code === filterPeriode) || PERIODES[1];
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - periodeInfo.jours);

  const filtered = sessions.filter(s => {
    if (new Date(s.login_at) < cutoff)                      return false;
    if (filterRole   && s.user_role       !== filterRole)   return false;
    if (filterNav    && s.navigateur_code !== filterNav)    return false;
    if (filterOS     && s.os_code         !== filterOS)     return false;
    if (filterStatut === 'active'    && !s.is_active)       return false;
    if (filterStatut === 'inactive'  && s.is_active)        return false;
    if (filterRisk   === 'safe'      && s.risk_score > 0)   return false;
    if (filterRisk   === 'risk'      && s.risk_score === 0) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return s.user_nom.toLowerCase().includes(q) || s.adresse_ip.includes(q) ||
             s.adresse_mac.toLowerCase().includes(q) || s.navigateur_libelle.toLowerCase().includes(q) ||
             s.location.ville.toLowerCase().includes(q);
    }
    return true;
  });

  // ── Tri ──
  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortBy], vb = b[sortBy];
    if (sortBy === 'login_at') { va = new Date(va); vb = new Date(vb); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated  = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => setCurrentPage(1), [filterRole, filterNav, filterOS, filterStatut, filterRisk, filterPeriode, searchTerm, sortBy, sortDir]);

  const resetFilters = () => { setFilterRole(''); setFilterNav(''); setFilterOS(''); setFilterStatut(''); setFilterRisk(''); setSearchTerm(''); };
  const hasFilters   = filterRole || filterNav || filterOS || filterStatut || filterRisk || searchTerm;

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const handleForceLogout = (sessionId) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, is_active: false, logout_at: new Date().toISOString() } : s));
    showToast('Session déconnectée de force', 'warning');
  };

  // ── Stats globales ──
  const actives      = sessions.filter(s => s.is_active);
  const total        = filtered.length;
  const nbActive     = filtered.filter(s => s.is_active).length;
  const nbRisk       = filtered.filter(s => s.risk_score > 0).length;
  const dureeMoyenne = filtered.length > 0 ? Math.round(filtered.reduce((a, s) => a + s.duree_mins, 0) / filtered.length) : 0;

  // ── Répartitions pour barres horizontales ──
  const navStats = NAVIGATEURS.map(n => ({ ...n, count: filtered.filter(s => s.navigateur_code === n.code).length }));
  const osStats  = OS_LIST.map(o     => ({ ...o, count: filtered.filter(s => s.os_code === o.code).length }));
  const maxNav   = Math.max(...navStats.map(n => n.count), 1);
  const maxOS    = Math.max(...osStats.map(o => o.count), 1);

  // ── Localisation ──
  const locStats = LOCATIONS.map(l => ({ ...l, count: filtered.filter(s => s.location.ville === l.ville).length }));
  const maxLoc   = Math.max(...locStats.map(l => l.count), 1);

  // ── Heures de pointe ──
  const heures = Array.from({length:24}, (_,h) => ({
    heure: h,
    count: filtered.filter(s => new Date(s.login_at).getHours() === h).length,
  }));
  const maxHeure = Math.max(...heures.map(h => h.count), 1);

  // ── Export ──
  const expHeaders = ['ID Session','Utilisateur','Email','Rôle','Connexion','Durée','Statut','Navigateur','OS','IP','MAC','Localisation','Pages','Actions','Score Risque','Anomalies'];
  const toRow = (s) => [s.session_id, s.user_nom, s.user_email, getRoleInfo(s.user_role).libelle,
    new Date(s.login_at).toLocaleString('fr-FR'), formatDuree(s.duree_mins),
    s.is_active ? 'En ligne' : 'Déconnecté', s.navigateur_libelle, s.os_libelle,
    s.adresse_ip, s.adresse_mac, `${s.location.ville} (${s.location.pays})`,
    s.pages_visitees, s.actions_effectuees, s.risk_score,
    s.anomalies.map(a => a.label).join(', ') || 'Aucune'];

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
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.3} }
        .row-hover:hover { filter: brightness(1.09); }
        .sort-btn:hover { opacity:1!important; }
      `}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header  darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {(showNotifications || showProfile) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfile(false); }} />
      )}

      <main className="transition-all duration-300 pt-24 px-6 pb-10" style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}>

        {/* ════ EN-TÊTE avec indicateur live ════ */}
        <div className="flex items-center justify-between mb-6"
          style={{ animation: animateCards ? 'fadeInUp .4s ease-out both' : 'none' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
              <i className="bi bi-person-check-fill text-white text-lg"></i>
            </div>
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Historique des Connexions
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Surveillance des sessions utilisateurs — navigateurs, IP, MAC, durée
              </p>
            </div>
          </div>

          {/* Indicateur sessions actives */}
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" style={{ animation: 'pulse-dot 1.5s infinite' }}></span>
              <span className={`text-sm font-bold text-green-500`}>{actives.length}</span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>en ligne maintenant</span>
            </div>
          </div>
        </div>

        {/* ════ KPI CARDS ════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Sessions totales', val: total,             icon: 'bi-person-lines-fill',  color: theme.primary,  sub: `sur ${periodeInfo.libelle.toLowerCase()}` },
            { label: 'En ligne',         val: nbActive,          icon: 'bi-wifi',               color: '#10b981',       sub: 'sessions actives' },
            { label: 'Durée moyenne',    val: formatDuree(dureeMoyenne), icon: 'bi-stopwatch-fill', color: '#f59e0b', sub: 'par session' },
            { label: 'Sessions à risque',val: nbRisk,            icon: 'bi-shield-exclamation', color: '#ef4444',       sub: 'anomalies détectées' },
          ].map((k, i) => (
            <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5`}
              style={{ animation: animateCards ? `fadeInUp .5s ease-out ${i*.07}s both` : 'none' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${k.color}22` }}>
                  <i className={`${k.icon} text-lg`} style={{ color: k.color }}></i>
                </div>
                {i === 1 && nbActive > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" style={{ animation: 'pulse-dot 2s infinite' }}></span>
                )}
              </div>
              <p className={`text-3xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>{k.val}</p>
              <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{k.label}</p>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ════ GRAPHIQUES BARRES HORIZONTALES ════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Navigateurs */}
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .28s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Navigateurs utilisés</h3>
            </div>
            <div className="space-y-3">
              {navStats.sort((a,b) => b.count - a.count).map(n => (
                <div key={n.code} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-36 shrink-0">
                    <i className={`${n.icon} text-base`} style={{ color: n.color }}></i>
                    <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{n.libelle.split(' ')[1] || n.libelle}</span>
                  </div>
                  <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(n.count/maxNav)*100}%`, background: n.color }} />
                  </div>
                  <span className={`text-sm font-bold w-6 text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{n.count}</span>
                  <span className={`text-xs w-10 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{total>0?((n.count/total)*100).toFixed(0):0}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Systèmes d'exploitation */}
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .35s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Systèmes d'exploitation</h3>
            </div>
            <div className="space-y-3">
              {osStats.sort((a,b) => b.count - a.count).map(o => (
                <div key={o.code} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-36 shrink-0">
                    <i className={`${o.icon} text-base`} style={{ color: o.color }}></i>
                    <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{o.libelle.split(' ')[0]}</span>
                  </div>
                  <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(o.count/maxOS)*100}%`, background: o.color }} />
                  </div>
                  <span className={`text-sm font-bold w-6 text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{o.count}</span>
                  <span className={`text-xs w-10 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{total>0?((o.count/total)*100).toFixed(0):0}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Localisation */}
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-8`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .42s both' : 'none' }}>
            <div className="flex items-center gap- mb-3">
              <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Localisation des connexions</h3>
            </div>
            <div className="space-y-3">
              {locStats.sort((a,b) => b.count - a.count).map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-36 shrink-0">
                    <span className="text-lg">{l.drapeau}</span>
                    <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{l.ville}</span>
                  </div>
                  <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(l.count/maxLoc)*100}%`, background: theme.primary }} />
                  </div>
                  <span className={`text-sm font-bold w-6 text-right ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{l.count}</span>
                  <span className={`text-xs w-10 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{total>0?((l.count/total)*100).toFixed(0):0}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Heures de pointe */}
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .49s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: theme.primary }}></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Heures de connexion (heatmap)</h3>
            </div>
            {/* Mini heatmap 24h */}
            <div className="grid grid-cols-12 gap-1 mb-2">
              {heures.map(h => {
                const pct = h.count / maxHeure;
                const alpha = Math.max(0.1, pct);
                return (
                  <div key={h.heure} className="flex flex-col items-center gap-1" title={`${h.heure}h : ${h.count} connexion(s)`}>
                    <div className="w-full rounded" style={{ height: '36px', background: `${theme.primary}`, opacity: alpha }}></div>
                    {h.heure % 6 === 0 && <span className={`text-[9px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{h.heure}h</span>}
                  </div>
                );
              })}
            </div>
            <p className={`text-xs text-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Heure de pointe : {heures.reduce((m,h) => h.count > m.count ? h : m, heures[0]).heure}h00
            </p>
          </div>
        </div>

        {/* ════ SESSIONS ACTIVES EN TEMPS RÉEL ════ */}
        {actives.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-5 mb-6`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .55s both' : 'none' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-green-500"></div>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Sessions actives en ce moment
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-semibold">{actives.length}</span>
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {actives.map(s => (
                <button key={s.id} onClick={() => { setSelectedSession(s); setShowModal(true); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-105 ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-green-500/50' : 'bg-gray-50 border-gray-200 hover:border-green-400'}`}>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: s.avatar_color }}>
                      {s.user_nom.charAt(0)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-900" style={{ animation: 'pulse-dot 2s infinite' }}></span>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{s.user_nom}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDuree(s.duree_mins)} · {s.adresse_ip}</p>
                  </div>
                  <i className={`${s.navigateur_icon} text-base ml-1`} style={{ color: s.navigateur_color }}></i>
                </button>
              ))}
            </div>
          </div>
        )}

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
                <option value="active">En ligne</option>
                <option value="inactive">Déconnectés</option>
              </select>

              {/* Rôle */}
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les rôles</option>
                {ROLES.map(r => <option key={r.code} value={r.code}>{r.libelle}</option>)}
              </select>

              {/* Navigateur */}
              <select value={filterNav} onChange={e => setFilterNav(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les navigateurs</option>
                {NAVIGATEURS.map(n => <option key={n.code} value={n.code}>{n.libelle}</option>)}
              </select>

              {/* OS */}
              <select value={filterOS} onChange={e => setFilterOS(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les OS</option>
                {OS_LIST.map(o => <option key={o.code} value={o.code}>{o.libelle}</option>)}
              </select>

              {/* Risque */}
              <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                <option value="">Tous les niveaux</option>
                <option value="safe">Sûr (sans anomalie)</option>
                <option value="risk">Avec anomalie</option>
              </select>

              {hasFilters && (
                <button onClick={resetFilters}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${darkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-red-50 text-red-600 hover:bg-red-100'} transition-colors`}>
                  <i className="bi bi-x-lg text-xs"></i> Effacer
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Vue table / cards */}
              <div className={`flex rounded-lg border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {[['table','bi-table'],['cards','bi-grid-3x3-gap-fill']].map(([v, ic]) => (
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
                  placeholder="Nom, IP, MAC, navigateur..."
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
                    <p className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sorted.length} session(s)</p>
                    <button onClick={() => { exportToExcel(sorted.map(toRow),'Historique_Connexions',expHeaders); showToast('Export Excel effectué','success'); setExportOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                      <i className="bi bi-file-earmark-spreadsheet text-green-500 text-base"></i>
                      <div><p className="font-medium">Exporter en Excel</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Format CSV (UTF-8)</p></div>
                    </button>
                    <button onClick={() => { exportToPDF('Historique des Connexions', expHeaders, sorted.map(toRow)); showToast('Export PDF généré','success'); setExportOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                      <i className="bi bi-file-earmark-pdf text-red-500 text-base"></i>
                      <div><p className="font-medium">Exporter en PDF</p><p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Impression paysage</p></div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{sorted.length} session(s) trouvée(s)</p>
        </div>

        {/* ════ VUE TABLEAU ════ */}
        {view === 'table' && (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}
            style={{ animation: animateCards ? 'fadeInUp .5s ease-out .65s both' : 'none' }}>

            {/* Sous-header */}
            <div className={`px-6 py-3 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <i className="bi bi-person-check mr-2"></i>{sorted.length} session(s) — {periodeInfo.libelle}
              </p>
              <div className="flex items-center gap-6">
                {[
                  { label:'En ligne',   val:nbActive,              color:'text-green-500' },
                  { label:'Déconnectés',val:total-nbActive,        color:'text-gray-400' },
                  { label:'Avec anomalie',val:nbRisk,              color:'text-orange-500' },
                  { label:'Durée moy.', val:formatDuree(dureeMoyenne), color:darkMode?'text-gray-300':'text-gray-700' },
                ].map((k,i) => (
                  <div key={i} className="text-center">
                    <p className={`text-sm font-bold ${k.color}`}>{k.val}</p>
                    <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>{k.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                    {[
                      ['Statut',           null],
                      ['Utilisateur',      'user_nom'],
                      ['Rôle',             null],
                      ['Navigateur / OS',  null],
                      ['Adresse IP / MAC', null],
                  
                      ['Connexion',        'login_at'],
                      ['Durée',            'duree_mins'],
                      ['Risque',           'risk_score'],
                      ['Actions',          null],
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
                    <tr><td colSpan={10} className={`text-center py-16 ${darkMode?'text-gray-500':'text-gray-400'}`}>
                      <i className="bi bi-person-x text-5xl block mb-3 opacity-40"></i>
                      <span className="text-sm">Aucune session pour les filtres sélectionnés</span>
                    </td></tr>
                  ) : paginated.map((s, idx) => {
                    const ri   = getRoleInfo(s.user_role);
                    const risk = getRiskColor(s.risk_score);
                    const d    = new Date(s.login_at);
                    return (
                      <tr key={s.id} className="row-hover transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: idx%2===0 ? (darkMode?'#0c1929':'#e8eef6') : (darkMode?'#162033':'#f1f4f9'),
                          animation: animateCards ? `fadeInUp .4s ease-out ${idx*.04}s both` : 'none',
                        }}
                        onClick={() => { setSelectedSession(s); setShowModal(true); }}>

                        {/* Statut */}
                        <td className="px-4 py-4 whitespace-nowrap"><SessionBadge active={s.is_active} /></td>

                        {/* Utilisateur */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: s.avatar_color }}>
                                {s.user_nom.charAt(0)}
                              </div>
                              {s.is_active && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-gray-900" style={{ animation: 'pulse-dot 2s infinite' }}></span>}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${darkMode?'text-gray-100':'text-gray-900'}`}>{s.user_nom}</p>
                              <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>{s.user_email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Rôle */}
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${ri.bg}`}>{ri.libelle}</span>
                        </td>

                        {/* Navigateur / OS */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <i className={`${s.navigateur_icon} text-base`} style={{ color: s.navigateur_color }}></i>
                            <span className={`text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{s.navigateur_libelle.split(' ')[1]||s.navigateur_libelle}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <i className={`${s.os_icon} text-sm`} style={{ color: s.os_color }}></i>
                            <span className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>{s.os_libelle.split(' ')[0]}</span>
                          </div>
                        </td>

                        {/* IP / MAC */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-mono font-semibold ${s.is_externe ? 'text-orange-500' : (darkMode?'text-gray-200':'text-gray-800')}`}>{s.adresse_ip}</span>
                            {s.is_externe && <i className="bi bi-exclamation-triangle-fill text-orange-400 text-xs" title="IP externe"></i>}
                          </div>
                          <p className={`text-[10px] font-mono ${darkMode?'text-gray-600':'text-gray-400'}`}>{s.adresse_mac}</p>
                        </td>

                      
                        {/* Connexion */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${darkMode?'text-gray-100':'text-gray-900'}`}>{d.toLocaleDateString('fr-FR')}</p>
                          <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>{d.toLocaleTimeString('fr-FR')}</p>
                        </td>

                        {/* Durée */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${s.is_active ? 'text-green-500' : (darkMode?'text-gray-300':'text-gray-700')}`}>
                            {s.is_active && <i className="bi bi-clock-fill mr-1 text-xs"></i>}
                            {formatDuree(s.duree_mins)}
                          </span>
                        </td>

                        {/* Risque */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${risk.bg}`}>{risk.label}</span>
                            {s.anomalies.length > 0 && (
                              <span className="text-orange-400 text-xs" title={s.anomalies.map(a=>a.label).join(', ')}>
                                <i className="bi bi-exclamation-triangle-fill"></i>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setSelectedSession(s); setShowModal(true); }}
                              className={`p-2 rounded-lg transition-colors ${darkMode?'hover:bg-gray-700 text-gray-400 hover:text-white':'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                              title="Voir détails"><i className="bi bi-eye"></i></button>
                            {s.is_active && (
                              <button onClick={() => handleForceLogout(s.id)}
                                className={`p-2 rounded-lg transition-colors hover:bg-red-500/20 text-red-400 hover:text-red-500`}
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
            {totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${darkMode?'border-gray-800':'border-gray-100'} flex items-center justify-between`}>
                <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-500'}`}>
                  {((currentPage-1)*ITEMS_PER_PAGE)+1}–{Math.min(currentPage*ITEMS_PER_PAGE,sorted.length)} sur {sorted.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}
                    className={`p-2 rounded-lg ${darkMode?'text-gray-400 hover:bg-gray-800 disabled:opacity-40':'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {Array.from({length: Math.min(7,totalPages)}, (_,i) => {
                    let page;
                    if (totalPages <= 7) page = i+1;
                    else if (currentPage <= 4) page = i+1;
                    else if (currentPage >= totalPages-3) page = totalPages-6+i;
                    else page = currentPage-3+i;
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${currentPage===page?'text-white shadow-sm':darkMode?'text-gray-400 hover:bg-gray-800':'text-gray-600 hover:bg-gray-100'}`}
                        style={currentPage===page?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>
                        {page}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                    className={`p-2 rounded-lg ${darkMode?'text-gray-400 hover:bg-gray-800 disabled:opacity-40':'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}>
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
            {paginated.map((s, idx) => {
              const ri   = getRoleInfo(s.user_role);
              const risk = getRiskColor(s.risk_score);
              return (
                <div key={s.id} onClick={() => { setSelectedSession(s); setShowModal(true); }}
                  className={`${darkMode?'bg-gray-900 border-gray-800 hover:border-gray-600':'bg-white border-gray-100 hover:border-gray-300'} rounded-xl border shadow-sm p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5`}
                  style={{ animation: animateCards ? `fadeInUp .4s ease-out ${idx*.04}s both` : 'none' }}>

                  {/* Header card */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: s.avatar_color }}>
                          {s.user_nom.charAt(0)}
                        </div>
                        {s.is_active && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-900" style={{ animation: 'pulse-dot 2s infinite' }}></span>}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${darkMode?'text-gray-100':'text-gray-900'}`}>{s.user_nom}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ri.bg}`}>{ri.libelle}</span>
                      </div>
                    </div>
                    <SessionBadge active={s.is_active} />
                  </div>

                  {/* Infos techniques */}
                  <div className={`rounded-lg p-3 mb-3 space-y-2 ${darkMode?'bg-gray-800':'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <i className={`${s.navigateur_icon} text-sm`} style={{ color: s.navigateur_color }}></i>
                      <span className={`text-xs ${darkMode?'text-gray-300':'text-gray-600'}`}>{s.navigateur_libelle}</span>
                      <span className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>·</span>
                      <i className={`${s.os_icon} text-xs`} style={{ color: s.os_color }}></i>
                      <span className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{s.os_libelle.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-ethernet text-sm ${s.is_externe?'text-orange-400':'text-gray-400'}`}></i>
                      <span className={`text-xs font-mono font-semibold ${s.is_externe?'text-orange-500':(darkMode?'text-gray-300':'text-gray-700')}`}>{s.adresse_ip}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-geo-alt text-sm text-gray-400`}></i>
                      <span className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{s.location.drapeau} {s.location.ville}</span>
                    </div>
                  </div>

                  {/* Footer card */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>Connexion</p>
                      <p className={`text-sm font-semibold ${darkMode?'text-gray-200':'text-gray-800'}`}>{new Date(s.login_at).toLocaleTimeString('fr-FR')}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>Durée</p>
                      <p className={`text-sm font-semibold ${s.is_active?'text-green-500':(darkMode?'text-gray-200':'text-gray-800')}`}>{formatDuree(s.duree_mins)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${risk.bg}`}>{risk.label}</span>
                  </div>

                  {/* Anomalies */}
                  {s.anomalies.length > 0 && (
                    <div className={`mt-3 pt-3 border-t ${darkMode?'border-gray-700':'border-gray-100'} flex flex-wrap gap-1`}>
                      {s.anomalies.map((a,i) => (
                        <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${darkMode?'bg-orange-900/30 text-orange-400':'bg-orange-50 text-orange-600'}`}>
                          <i className="bi bi-exclamation-circle mr-0.5"></i>{a.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination pour cards */}
            {totalPages > 1 && (
              <div className={`col-span-full flex items-center justify-between px-2 py-3`}>
                <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-500'}`}>{((currentPage-1)*ITEMS_PER_PAGE)+1}–{Math.min(currentPage*ITEMS_PER_PAGE,sorted.length)} sur {sorted.length}</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}
                    className={`p-2 rounded-lg ${darkMode?'text-gray-400 hover:bg-gray-800 disabled:opacity-40':'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  {Array.from({length:totalPages},(_,i)=>i+1).slice(Math.max(0,currentPage-3), Math.min(totalPages, currentPage+2)).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold ${currentPage===page?'text-white':darkMode?'text-gray-400 hover:bg-gray-800':'text-gray-600 hover:bg-gray-100'}`}
                      style={currentPage===page?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                    className={`p-2 rounded-lg ${darkMode?'text-gray-400 hover:bg-gray-800 disabled:opacity-40':'text-gray-600 hover:bg-gray-100 disabled:opacity-40'}`}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={`mt-8 py-6 border-t ${darkMode?'border-gray-800':'border-gray-200'} flex items-center justify-center`}>
          <p className={`text-sm ${darkMode?'text-gray-500':'text-gray-600'}`}>{"© 2026 SGS — Historique des Connexions — Surveillance en temps réel"}</p>
        </div>
      </main>

      {/* ════ MODAL ════ */}
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