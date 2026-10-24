import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

import {
  getNotifications,
  readNotification,
  readAllNotifications,
  syncNotifications,
} from '../api/Admin-Axios/Notifications-axios';
import { getSwalConfig, showSuccess, showError } from '../utils/walConfig';
import { getRowBackgroundColor, PageSkeleton } from '../utils/uniformStyles';

// ─────────────────────────────────────────────────────────────
// CONFIGURATIONS
// ─────────────────────────────────────────────────────────────
const PER_PAGE = 15;

const EMPTY_STATS = { total: 0, unread: 0, read: 0, prioritaires: 0 };

// Niveau de priorité (categories_notifications.niveau_priorite)
const NIVEAUX = {
  critique: { bg: 'bg-red-500/10 text-red-500 border border-red-500/20' },
  important: { bg: 'bg-orange-500/10 text-orange-500 border border-orange-500/20' },
  a_surveiller: { bg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
  normal: { bg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
};

const TYPE_ICON = {
  error: { icon: 'bi-exclamation-triangle-fill', color: '#ef4444' },
  warning: { icon: 'bi-exclamation-circle-fill', color: '#f59e0b' },
  success: { icon: 'bi-check-circle-fill', color: '#10b981' },
  info: { icon: 'bi-bell-fill', color: '#3b82f6' },
};

const formatDateTime = (s) => {
  if (!s) return '—';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Le champ `donnees` peut arriver sous forme de JSON (string) ou d'objet
const parseDonnees = (d) => {
  if (!d) return null;
  if (typeof d === 'object') return d;
  try {
    const parsed = JSON.parse(d);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

// Clés du champ `donnees` qu'on n'affiche jamais
const HIDDEN_DONNEES_KEYS = ['demande_id'];

const humanizeKey = (k) => String(k).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const stringifyValue = (v) => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v));

const Notifications = () => {
  // Même gestion du mode sombre que la page Interventions
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('fleetify_darkMode');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fleetify_darkMode', String(darkMode));
    } catch { }
  }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  // ── Données
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // ── Popup de détail
  const [selected, setSelected] = useState(null);

  // ── Pagination
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });

  // ── Filtres (envoyés au serveur)
  const [etat, setEtat] = useState('all');           // all | unread | read
  const [categorie, setCategorie] = useState('all'); // all | critique | important | a_surveiller | normal

  // Anti-concurrence : seule la dernière requête met l'état à jour
  const requestRef = useRef(0);

  // ── Chargement de la liste
  // La fonction dépend des filtres : sinon elle garde les valeurs du premier rendu.
  const loadNotifications = useCallback(
    async (silent = false) => {
      const requestId = ++requestRef.current;
      if (!silent) setLoading(true);
      setLoadError(false);

      try {
        // Le canal n'est plus filtré : on récupère toutes les notifications
        const res = await getNotifications(page, PER_PAGE, 'all', etat, categorie);
        if (requestId !== requestRef.current) return;

        const payload = res?.data?.data || {};
        const items = Array.isArray(payload.notifications) ? payload.notifications : [];

        setNotifications(items);
        setUnreadCount(payload.unread_count ?? 0);
        setStats({ ...EMPTY_STATS, ...(payload.stats || {}) });
        setMeta({
          total: payload.total ?? items.length,
          last_page: payload.last_page ?? 1,
        });
      } catch (err) {
        if (requestId !== requestRef.current) return;
        console.error('Erreur chargement notifications:', err);
        setNotifications([]);
        setLoadError(true);
      } finally {
        // On ne retire le chargement que si cette requête est toujours la dernière
        if (requestId === requestRef.current) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    },
    [page, etat, categorie]
  );

  // Charge au montage, puis à chaque changement de page ou de filtre
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ── Changement de filtre : retour page 1
  const changeEtat = (v) => { setEtat(v); setPage(1); };
  const changeCategorie = (v) => { setCategorie(v); setPage(1); };
  const resetFilters = () => { setEtat('all'); setCategorie('all'); setPage(1); };
  const hasFilters = etat !== 'all' || categorie !== 'all';

  // ── Fermeture du popup avec Échap
  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  // ── Actions
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncNotifications();
      showSuccess(darkMode, theme, 'Synchronisation', res?.data?.message || 'Notifications synchronisées');
      await loadNotifications(true);
    } catch (err) {
      console.error('Erreur synchronisation:', err);
      showError(darkMode, theme, 'Erreur', 'Impossible de synchroniser les notifications');
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await readNotification(id);
      // Mise à jour immédiate de l'écran, puis resynchronisation silencieuse avec le serveur
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, est_lu: 1 } : n)));
      setSelected((s) => (s && s.id === id ? { ...s, est_lu: 1 } : s));
      setUnreadCount((c) => Math.max(0, c - 1));
      loadNotifications(true);
    } catch (err) {
      console.error('Erreur marquage lecture:', err);
      showError(darkMode, theme, 'Erreur', 'Impossible de marquer comme lue');
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await Swal.fire({
      ...getSwalConfig(darkMode, theme),
      title: 'Tout marquer comme lu ?',
      text: 'Toutes vos notifications seront marquées comme lues.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, tout marquer',
      cancelButtonText: 'Annuler',
    });
    if (!result.isConfirmed) return;

    try {
      const res = await readAllNotifications();
      showSuccess(darkMode, theme, 'Succès', res?.data?.message || 'Toutes les notifications sont marquées comme lues');
      await loadNotifications(true);
    } catch (err) {
      console.error('Erreur marquage tout lu:', err);
      showError(darkMode, theme, 'Erreur', 'Impossible de tout marquer comme lu');
    }
  };

  // Ouvre le popup de détail (et marque comme lue la notification si elle ne l'est pas)
  const openDetail = (notif) => {
    setSelected(notif);
    if (!notif.est_lu) handleMarkAsRead(notif.id);
  };

  // ── Styles (même logique que la page Utilisateurs) ──
  const dm = (dark, light) => (darkMode ? dark : light);

  const theadStyle = { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` };
  const trStyle = (index) => ({
    backgroundColor: getRowBackgroundColor(index, darkMode),
    borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
    transition: 'background-color 0.15s ease',
  });
  const trHover = { backgroundColor: darkMode ? `${theme.primary}28` : `${theme.primary}15` };

  const Th = ({ children, className = '' }) => (
    <th className={`px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );

  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const mutedSoft = darkMode ? 'text-gray-500' : 'text-gray-400';
  const selectClass = `px-3 py-2 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`;
  const cardClass = `p-4 rounded-2xl border transition-all shadow-sm ${darkMode ? 'bg-gray-900/80 border-gray-800/80' : 'bg-white border-gray-200'}`;
  const tableContainer = `${dm('bg-gray-900 border-gray-800', 'bg-white border-gray-100')} rounded-xl border shadow-sm overflow-hidden`;

  // ── Données dérivées du popup
  const selUnread = selected && !selected.est_lu;
  const selTyp = selected ? (TYPE_ICON[selected.type] || TYPE_ICON.info) : TYPE_ICON.info;
  const selNiveau = selected ? (NIVEAUX[selected.categorie_couleur] || NIVEAUX.normal) : NIVEAUX.normal;
  const selDonneesRaw = selected ? parseDonnees(selected.donnees) : null;
  const selDonnees = selDonneesRaw
    ? Object.fromEntries(Object.entries(selDonneesRaw).filter(([k]) => !HIDDEN_DONNEES_KEYS.includes(k)))
    : null;

  return (
    <div className={`${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen flex flex-col`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      {/* ── SIDEBAR & HEADER (hors du <main>, comme la page Interventions) ── */}
      <Sidebar
        darkMode={darkMode}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        theme={theme}
        navigate={navigate}
      />
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        sidebarCollapsed={sidebarCollapsed}
        theme={theme}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        showProfile={showProfile}
        setShowProfile={setShowProfile}
      />

      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}

      {/* ── CONTENU PRINCIPAL ── */}
      <main
        className="flex-1 transition-all duration-300 pt-24 px-4 pb-10"
        style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '16.25rem' }}
      >
        {initialLoading ? (
          <PageSkeleton darkMode={darkMode} />
        ) : (
          <div className="space-y-6">

            {/* ── EN-TÊTE DE PAGE ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
                >
                  <i className="bi bi-bell-fill text-xl" />
                </span>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
                  <p className={`text-xs mt-0.5 ${muted}`}>
                    Alertes et messages du système, avec suivi de lecture.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  <i className={`bi bi-arrow-repeat ${syncing ? 'animate-spin' : ''}`} />
                  Synchroniser
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                  >
                    <i className="bi bi-check2-all text-sm" />
                    Tout marquer comme lu
                  </button>
                )}
              </div>
            </div>

            {/* ── KPI CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Total</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <i className="bi bi-bell-fill" />
                  </div>
                </div>
                <div className="text-2xl font-black">{stats.total}</div>
                <p className={`text-[11px] mt-1 ${mutedSoft}`}>Notifications reçues</p>
              </div>

              <div className={cardClass}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Non lues</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <i className="bi bi-envelope-exclamation-fill" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-500">{stats.unread}</div>
                <p className={`text-[11px] mt-1 ${mutedSoft}`}>En attente de lecture</p>
              </div>

              <div className={cardClass}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Lues</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <i className="bi bi-check-circle-fill" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-500">{stats.read}</div>
                <p className={`text-[11px] mt-1 ${mutedSoft}`}>Déjà traitées</p>
              </div>

              <div className={cardClass}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Prioritaires</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <i className="bi bi-exclamation-triangle-fill" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-500">{stats.prioritaires}</div>
                <p className={`text-[11px] mt-1 ${mutedSoft}`}>Critiques et importantes</p>
              </div>
            </div>

            {/* ── BARRE DE FILTRES ── */}
            <div className={`p-4 rounded-2xl border shadow-sm flex flex-wrap items-center gap-2 ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200'}`}>
              <select value={etat} onChange={(e) => changeEtat(e.target.value)} className={selectClass}>
                <option value="all">Toutes les notifications</option>
                <option value="unread">Non lues</option>
                <option value="read">Lues</option>
              </select>

              <select value={categorie} onChange={(e) => changeCategorie(e.target.value)} className={selectClass}>
                <option value="all">Toutes les catégories</option>
                <option value="critique">Critique</option>
                <option value="important">Important</option>
                <option value="a_surveiller">À surveiller</option>
                <option value="normal">Normal</option>
              </select>

              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <i className="bi bi-x-circle" />
                  Réinitialiser
                </button>
              )}
            </div>

            {/* ── LISTE (tableau) — même entête que la page Utilisateurs ── */}
            <div className={tableContainer}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={theadStyle}>
                    <tr>
                      <Th>Notification</Th>
                      <Th>Catégorie</Th>
                      <Th>Véhicule</Th>
                      <Th>Date</Th>
                      <Th>Statut</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={`skel-${idx}`} className="animate-pulse" style={trStyle(idx)}>
                          {[['w-56', 'w-40'], ['w-24'], ['w-20'], ['w-24', 'w-16'], ['w-16'], ['w-16']].map((ws, c) => (
                            <td key={c} className="px-6 py-4">
                              {ws.map((w, k) => (
                                <div key={k} className={`h-3.5 ${w} rounded ${k ? 'mt-1.5' : ''} ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
                              ))}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : loadError ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12">
                          <i className="bi bi-wifi-off text-4xl text-gray-500 block mb-2" />
                          <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Impossible de charger les notifications</p>
                          <button
                            onClick={() => loadNotifications()}
                            className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90"
                            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                          >
                            Réessayer
                          </button>
                        </td>
                      </tr>
                    ) : notifications.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12">
                          <i className="bi bi-bell-slash text-4xl text-gray-500 block mb-2" />
                          <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Aucune notification</p>
                          <p className={`text-xs mt-1 ${mutedSoft}`}>
                            {hasFilters ? 'Aucun résultat avec ces filtres.' : 'Vous êtes à jour.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      notifications.map((notif, rowIdx) => {
                        const unread = !notif.est_lu;
                        const typ = TYPE_ICON[notif.type] || TYPE_ICON.info;
                        const niveau = NIVEAUX[notif.categorie_couleur] || NIVEAUX.normal;

                        return (
                          <tr
                            key={notif.id}
                            onClick={() => openDetail(notif)}
                            className="cursor-pointer"
                            style={trStyle(rowIdx)}
                            onMouseEnter={(e) => Object.assign(e.currentTarget.style, trHover)}
                            onMouseLeave={(e) => Object.assign(e.currentTarget.style, trStyle(rowIdx))}
                          >
                            {/* Notification */}
                            <td className={`px-6 py-4 border-l-4 ${unread ? 'border-blue-500' : 'border-transparent'}`}>
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${typ.color}20` }}
                                >
                                  <i className={`bi ${typ.icon}`} style={{ color: typ.color }} />
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-sm ${unread ? 'font-black' : 'font-semibold'} line-clamp-1 max-w-[380px]`} title={notif.titre}>
                                    {notif.titre}
                                  </p>
                                  <p className={`text-xs line-clamp-2 max-w-[380px] mt-0.5 ${muted}`} title={notif.message}>
                                    {notif.message}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Catégorie */}
                            <td className="px-6 py-4">
                              {notif.categorie_nom ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${niveau.bg}`}>
                                  {notif.categorie_nom}
                                </span>
                              ) : (
                                <span className={mutedSoft}>—</span>
                              )}
                            </td>

                            {/* Véhicule */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {notif.vehicule_immatriculation ? (
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  <i className="bi bi-car-front" />
                                  {notif.vehicule_immatriculation}
                                </span>
                              ) : (
                                <span className={mutedSoft}>—</span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{notif.time_ago}</p>
                              <p className={`text-xs ${mutedSoft}`}>{formatDateTime(notif.date_creation)}</p>
                            </td>

                            {/* Statut */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {unread ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  <i className="bi bi-circle-fill" style={{ fontSize: '0.45rem' }} />
                                  Non lue
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  <i className="bi bi-check-circle-fill" />
                                  Lue
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openDetail(notif)}
                                  title="Voir le détail"
                                  className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                                >
                                  <i className="bi bi-eye-fill text-sm" />
                                </button>
                                {unread && (
                                  <button
                                    onClick={() => handleMarkAsRead(notif.id)}
                                    title="Marquer comme lue"
                                    className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                                  >
                                    <i className="bi bi-check2-circle text-sm" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pied de tableau / pagination */}
              <div className={`px-6 py-3 border-t flex items-center justify-between text-xs ${darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                <span>
                  {meta.last_page > 1 ? `Page ${page} sur ${meta.last_page} · ` : ''}
                  {meta.total} notification{meta.total > 1 ? 's' : ''}
                </span>
                {meta.last_page > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-lg border disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <button
                      disabled={page >= meta.last_page}
                      onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                      className="px-3 py-1 rounded-lg border disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── POPUP DÉTAIL DE LA NOTIFICATION ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-detail-title"
        >
          <div
            className={`w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col border ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête aux couleurs du thème */}
            <div
              className="px-7 py-5 text-white flex items-start gap-4"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <i className={`bi ${selTyp.icon} text-xl`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">Détail de la notification</p>
                <h2 id="notif-detail-title" className="text-xl font-black leading-snug break-words mt-0.5">
                  {selected.titre}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Corps */}
            <div className="p-7 space-y-6 overflow-y-auto">
              <p className={`text-base leading-relaxed whitespace-pre-line break-words ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {selected.message}
              </p>

              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 rounded-xl p-5 text-sm ${darkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${mutedSoft}`}>Catégorie</p>
                  {selected.categorie_nom ? (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${selNiveau.bg}`}>
                      {selected.categorie_nom}
                    </span>
                  ) : '—'}
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${mutedSoft}`}>Véhicule</p>
                  <p className="font-semibold">{selected.vehicule_immatriculation || '—'}</p>
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${mutedSoft}`}>Statut</p>
                  <p className={`font-semibold ${selUnread ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {selUnread ? 'Non lue' : 'Lue'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${mutedSoft}`}>Reçue le</p>
                  <p className="font-semibold">
                    {formatDateTime(selected.date_creation)}
                    {selected.time_ago ? <span className={`font-normal ${muted}`}> · {selected.time_ago}</span> : null}
                  </p>
                </div>
                {selected.date_lecture && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${mutedSoft}`}>Lue le</p>
                    <p className="font-semibold">{formatDateTime(selected.date_lecture)}</p>
                  </div>
                )}
              </div>

              {/* Données complémentaires (champ `donnees`) */}
              {selDonnees && Object.keys(selDonnees).length > 0 && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${mutedSoft}`}>Informations complémentaires</p>
                  <dl className={`rounded-xl divide-y text-sm ${darkMode ? 'bg-gray-800/60 divide-gray-700/60' : 'bg-gray-50 divide-gray-200'}`}>
                    {Object.entries(selDonnees).map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-6 px-5 py-3">
                        <dt className={`font-semibold ${muted}`}>{humanizeKey(k)}</dt>
                        <dd className="font-semibold text-right break-words min-w-0">{stringifyValue(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Pied : actions */}
            <div className={`px-7 py-4 border-t flex flex-wrap items-center justify-end gap-3 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <button
                onClick={() => setSelected(null)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      {!initialLoading && <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />}
    </div>
  );
};

export default Notifications;