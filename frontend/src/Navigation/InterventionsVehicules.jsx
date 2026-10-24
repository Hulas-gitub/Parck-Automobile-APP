import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Swal from 'sweetalert2';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Modales et composants métier
import InterventionCreateModal from '../components/interventions/InterventionCreateModal';
import InterventionDetailModal from '../components/interventions/InterventionDetailModal';
import CaisseTab from '../components/interventions/CaisseTab';

import {
  getInterventions,
  getInterventionStatistiques,
  deleteIntervention,
  updateStatutIntervention,
  getApiError,
} from '../api/Admin-Axios/Intervention-axios';
import { getSwalConfig, showSuccess } from '../utils/walConfig';
import { todayLocal, formatDateFR, formatDuree } from '../api/Admin-Axios/Intervention-axios';
import { getTableStyles, getCardStyles, getRowBackgroundColor, PageSkeleton } from '../utils/uniformStyles';

// ─────────────────────────────────────────────────────────────
// CONFIGURATIONS ET BADGES
// Seuls 3 statuts existent : en_cours | partiel | resolu
// Le statut affiché est TOUJOURS celui choisi par l'utilisateur (renvoyé par l'API).
// ─────────────────────────────────────────────────────────────
const STATUTS = {
  en_cours: { libelle: 'En cours', color: '#f59e0b', bg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20', icon: 'bi-tools' },
  partiel: { libelle: 'Partiel', color: '#8b5cf6', bg: 'bg-purple-500/10 text-purple-500 border border-purple-500/20', icon: 'bi-info-circle-fill' },
  resolu: { libelle: 'Résolue', color: '#10b981', bg: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20', icon: 'bi-check-circle-fill' },
};

// Statut inconnu (ancienne donnée en base) : on affiche la valeur brute, sans le transformer
const STATUT_INCONNU = {
  libelle: null,
  color: '#6b7280',
  bg: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  icon: 'bi-question-circle-fill',
};

// Statuts pour lesquels le véhicule est encore immobilisé (on peut donc clôturer)
const STATUTS_OUVERTS = ['en_cours', 'partiel'];

const formatCFA = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(Math.round(val)) + ' FCFA';
};

const EMPTY_STATS = {
  nb_interventions: 0,
  en_cours: 0,
  partiels: 0,
  resolus: 0, // CORRECTION : le backend renvoie "resolus" (et non "resolues")
  cout_total: 0,
  par_nature: [],
};

// ============================================================================
// MENU TROIS POINTS — toutes les actions d'une ligne sont regroupées ici
// (même principe que la page Véhicules). Les droits sont calculés dans le
// composant principal ; une action non autorisée n'apparaît tout simplement pas.
// ============================================================================
const RowActionsMenu = ({ item, darkMode, theme, onView, onEdit, onTerminer, onDelete, canEdit, canTerminer, canDelete }) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const nbActions = 1 + (canEdit ? 1 : 0) + (canTerminer ? 1 : 0) + (canDelete ? 1 : 0);
  const menuHeight = nbActions * 44 + 12 + (canDelete && nbActions > 1 ? 9 : 0);
  const menuWidth = 220;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8;
      setMenuStyle({
        position: 'fixed',
        top: showAbove ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left: Math.max(8, rect.right - menuWidth),
        zIndex: 99999,
        width: menuWidth,
      });
    }
  }, [open, menuHeight]);

  const mi = (label, icon, color, fn, textCls) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setOpen(false); fn(item); }}
      className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2.5 transition-colors ${textCls}`}
    >
      <i className={`bi ${icon} text-base`} style={{ color }}></i>{label}
    </button>
  );

  const neutral = darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50';
  const danger = darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50';

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        title="Actions"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${open
          ? 'text-white'
          : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        style={open ? { background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` } : {}}
      >
        <i className="bi bi-three-dots-vertical text-sm"></i>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className={`rounded-xl shadow-2xl border py-1.5 overflow-hidden text-left ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={menuStyle}
        >
          {mi('Voir les détails', 'bi-eye-fill', theme.primary, onView, neutral)}
          {canEdit && mi('Modifier', 'bi-pencil-square', '#f59e0b', onEdit, neutral)}
          {canTerminer && mi('Clôturer la réparation', 'bi-check2-circle', '#10b981', onTerminer, neutral)}
          {canDelete && (
            <>
              <div className={`my-1 mx-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
              {mi('Supprimer', 'bi-trash3-fill', '#ef4444', onDelete, danger)}
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

const InterventionsVehicules = () => {
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

  // ── Droits utilisateurs (DAAL = Lecture seule sur l'onglet Véhicules)
  const [userRole] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return u?.role?.code || u?.role_code || (typeof u?.role === 'string' ? u?.role : null);
      }
    } catch { }
    return null;
  });
  const isReadOnly = userRole === 'daal';

  // ── Caisse : visible uniquement pour DAAL et admin (lecture + écriture).
  //    Les autres rôles ne voient pas l'onglet.
  const canAccessCaisse = userRole === 'daal' || userRole === 'admin';

  // ── Onglets principaux : 'vehicules' | 'caisse'
  const [activeTab, setActiveTab] = useState('vehicules');

  // Sécurité : un rôle sans accès à la caisse ne peut jamais rester sur cet onglet
  useEffect(() => {
    if (!canAccessCaisse && activeTab === 'caisse') setActiveTab('vehicules');
  }, [canAccessCaisse, activeTab]);

  // ── Données des interventions
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // skeleton plein écran au premier chargement
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [page, setPage] = useState(1);

  // ── Statistiques GLOBALES (calculées côté serveur, tous véhicules, toutes pages)
  const [statsGlobal, setStatsGlobal] = useState(EMPTY_STATS);

  // ── Filtres
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [natureFilter, setNatureFilter] = useState(''); // '' | 'interne' | 'externe'
  const [statutFilter, setStatutFilter] = useState(''); // '' | 'en_cours' | 'partiel' | 'resolu'
  const [vue, setVue] = useState('table'); // 'table' | 'cards'

  // Recherche avec temporisation (évite une requête à chaque frappe)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Modales
  const [initialDemandeId, setInitialDemandeId] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('demande_id');
    } catch {
      return null;
    }
  });
  const [showCreateModal, setShowCreateModal] = useState(() => Boolean(initialDemandeId));
  const [editTarget, setEditTarget] = useState(null);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ── Chargement de la liste
  const loadInterventions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 25,
        search: searchTerm || undefined,
        nature: natureFilter || undefined, // le backend lit "nature"
        statut: statutFilter || undefined,
      };
      const res = await getInterventions(params);
      const rawList = res?.data?.items ?? (Array.isArray(res?.data) ? res.data : (res?.data?.data ?? res?.items ?? []));
      const items = Array.isArray(rawList) ? rawList : [];
      setInterventions(items);
      setMeta({
        total: res?.data?.total ?? res?.meta?.total ?? res?.total ?? items.length,
        last_page: res?.data?.last_page ?? res?.meta?.last_page ?? res?.last_page ?? 1,
      });
    } catch (err) {
      console.error('Erreur chargement interventions véhicules:', err);
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, natureFilter, statutFilter]);

  // ── Chargement des statistiques globales
  const loadStats = useCallback(async () => {
    try {
      const res = await getInterventionStatistiques();
      setStatsGlobal({ ...EMPTY_STATS, ...(res?.data || {}) });
    } catch (err) {
      console.error('Erreur chargement statistiques interventions:', err);
    }
  }, []);

  // Premier chargement : liste + statistiques en parallèle, puis on retire le skeleton
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      Promise.allSettled([loadInterventions(), loadStats()]).finally(() => setInitialLoading(false));
    } else {
      loadInterventions();
    }
  }, [loadInterventions, loadStats]);

  const refreshAll = useCallback(() => {
    loadInterventions();
    loadStats();
  }, [loadInterventions, loadStats]);

  // ── Clôturer rapidement une intervention en cours ou partielle
  const handleTerminerRapide = async (item) => {
    const result = await Swal.fire({
      ...getSwalConfig(darkMode, theme),
      title: 'Clôturer cette réparation ?',
      text: `Confirmez-vous que le véhicule ${item.vehicule_immatriculation} a été réparé et remis en état ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, clôturer',
      cancelButtonText: 'Annuler',
    });

    if (!result.isConfirmed) return;

    try {
      // Date de sortie du garage / atelier (sans heure), identique pour interne et externe
      await updateStatutIntervention(item.id, 'resolu', {
        resultat: 'resolu',
        date_sortie_garage: todayLocal(),
      });
      showSuccess(darkMode, theme, 'Intervention résolue', 'Le véhicule est maintenant marqué comme réparé.');
      refreshAll();
    } catch (err) {
      Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'error',
        title: 'Erreur',
        text: getApiError(err, 'Impossible de résoudre cette intervention.'),
      });
    }
  };

  // ── Supprimer une intervention
  const handleDelete = async (item) => {
    const result = await Swal.fire({
      ...getSwalConfig(darkMode, theme),
      title: 'Supprimer cette intervention ?',
      text: `Cette action supprimera l'intervention du véhicule ${item.vehicule_immatriculation} (stock et caisse seront contre-passés).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteIntervention(item.id);
      showSuccess(darkMode, theme, 'Intervention supprimée', "L'intervention a été supprimée avec succès.");
      refreshAll();
    } catch (err) {
      Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'error',
        title: 'Erreur',
        text: getApiError(err, "Impossible de supprimer cette intervention."),
      });
    }
  };

  // ── KPI : TOUS les véhicules (statistiques serveur), pas seulement la page courante
  const stats = useMemo(() => {
    const nat = (n) => statsGlobal.par_nature?.find((x) => x.nature === n)?.nb || 0;
    return {
      total: statsGlobal.nb_interventions,
      enCours: statsGlobal.en_cours,
      partiels: statsGlobal.partiels,
      resolues: statsGlobal.resolus,
      coutGlobal: statsGlobal.cout_total,
      internes: nat('interne'),
      externes: nat('externe'),
    };
  }, [statsGlobal]);

  const openDetail = (item) => {
    setSelectedIntervention(item);
    setShowDetailModal(true);
  };

  const openEdit = (item) => {
    setShowDetailModal(false);
    setSelectedIntervention(null);
    setEditTarget(item);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setEditTarget(null);
    setInitialDemandeId(null);
  };

  // Durée lisible (jours / semaines / mois / années) pour la colonne Dates
  const dureeDe = (item) =>
    item.duree_texte || formatDuree(item.date_entree_garage || item.date_debut, item.date_sortie_garage || item.date_fin).texte;

  const intervenantAffiche = (item) =>
    item.intervenants?.length ? item.intervenants.join(', ') : item.intervenant_nom || '—';

  // Styles uniformes
  const tableStyles = getTableStyles(darkMode);
  const cardStyles = getCardStyles(darkMode);

  return (
    <div className={`${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen flex flex-col`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      {/* ── SIDEBAR & HEADER ── */}
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
          <>
            {/* ── EN-TÊTE DE PAGE ET ONGLETS ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
                  >
                    <i className="bi bi-tools text-xl" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">Interventions Véhicules</h1>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Gestion des véhicules réparés, saisie des interventions (atelier & prestataires externes) et suivi des coûts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation par Onglets */}
              <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 shadow-sm ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <button
                  onClick={() => setActiveTab('vehicules')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'vehicules'
                    ? 'text-white shadow-md'
                    : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}`}
                  style={activeTab === 'vehicules' ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
                >
                  <i className="bi bi-car-front-fill" />
                  Véhicules Réparés & Suivi
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'vehicules' ? 'bg-white/20 text-white' : `${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-700'}`}`}>
                    {stats.total}
                  </span>
                </button>

                {/* Onglet Caisse : DAAL et admin uniquement */}
                {canAccessCaisse && (
                  <button
                    onClick={() => setActiveTab('caisse')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'caisse'
                      ? 'text-white shadow-md'
                      : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}`}
                    style={activeTab === 'caisse' ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
                  >
                    <i className="bi bi-cash-coin" />
                    Caisse
                  </button>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                ONGLET 1 : VÉHICULES RÉPARÉS & INTERVENTIONS
               ══════════════════════════════════════════════════════════ */}
            {activeTab === 'vehicules' && (
              <div className="space-y-6">

                {/* ── KPI CARDS ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-gray-900/80 border-gray-800/80' : 'bg-white border-gray-200'} shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Réparations</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <i className="bi bi-clipboard-check-fill" />
                      </div>
                    </div>
                    <div className="text-2xl font-black">{stats.total}</div>
                    <p className={`text-[11px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {stats.internes} atelier interne · {stats.externes} prestataires
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-gray-900/80 border-gray-800/80' : 'bg-white border-gray-200'} shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>En Cours</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <i className="bi bi-tools" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-amber-500">{stats.enCours}</div>
                    <p className={`text-[11px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Véhicules immobilisés · {stats.partiels} partielle(s)
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-gray-900/80 border-gray-800/80' : 'bg-white border-gray-200'} shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Résolues</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <i className="bi bi-check-circle-fill" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-500">{stats.resolues}</div>
                    <p className={`text-[11px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Véhicules réparés et remis en service</p>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-gray-900/80 border-gray-800/80' : 'bg-white border-gray-200'} shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Coût Global Réparations</span>
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <i className="bi bi-cash-stack" />
                      </div>
                    </div>
                    <div className="text-xl font-black text-purple-500">{formatCFA(stats.coutGlobal)}</div>
                    <p className={`text-[11px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Tous véhicules confondus · {statsGlobal.nb_vehicules ?? 0} véhicule(s)
                    </p>
                  </div>
                </div>

                {/* ── BARRE D'ACTIONS ET FILTRES ── */}
                <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    {/* Recherche */}
                    <div className="relative flex-1 min-w-[220px]">
                      <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Rechercher immat, référence, intervenant..."
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                      />
                    </div>

                    {/* Filtre Nature */}
                    <select
                      value={natureFilter}
                      onChange={(e) => { setNatureFilter(e.target.value); setPage(1); }}
                      className={`px-3 py-2 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    >
                      <option value="">Toutes les natures</option>
                      <option value="interne">Atelier interne</option>
                      <option value="externe">Prestataire externe</option>
                    </select>

                    {/* Filtre Statut : 3 statuts seulement */}
                    <select
                      value={statutFilter}
                      onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
                      className={`px-3 py-2 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                    >
                      <option value="">Tous les statuts</option>
                      <option value="en_cours">En cours</option>
                      <option value="partiel">Partiel</option>
                      <option value="resolu">Résolue</option>
                    </select>

                    {/* Switch vue Table */}
                    <div className={`flex rounded-xl border p-0.5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                      <button
                        onClick={() => setVue('table')}
                        className={`p-1.5 rounded-lg text-xs transition-all ${vue === 'table' ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm'}` : 'text-gray-400 hover:text-gray-200'}`}
                        title="Vue Tableau"
                      >
                        <i className="bi bi-table" />
                      </button>
                    </div>
                  </div>

                  {/* Bouton Saisir une intervention */}
                  {!isReadOnly && (
                    <button
                      onClick={() => { setEditTarget(null); setShowCreateModal(true); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                      style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                    >
                      <i className="bi bi-plus-circle-fill text-sm" />
                      Saisir une Réparation / Véhicule
                    </button>
                  )}
                </div>

                {/* ── LISTE : VUE TABLEAU ── */}
                {vue === 'table' && (
                  <div className={tableStyles.container}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        {/* En-tête aux couleurs du thème (ThemeContext) — identique à la page Véhicules :
                            le dégradé est posé sur la LIGNE <tr>, texte blanc sur chaque cellule */}
                        <thead>
                          <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                            <th className="px-4 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-white">Réf & Véhicule</th>
                            <th className="px-4 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-white">Nature & Intervenant</th>
                            <th className="px-4 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-white">Travaux & Type</th>
                            <th className="px-4 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-white">Statut</th>
                            <th className="px-4 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-white">Dates & Durée</th>
                            <th className="px-4 py-3.5 text-right text-xs font-extrabold uppercase tracking-wider text-white">Coût Total</th>
                            <th className="px-4 py-3.5 text-center text-xs font-extrabold uppercase tracking-wider text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y text-sm ${darkMode ? 'divide-gray-800/40' : 'divide-gray-100'}`}>
                          {loading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                              <tr key={`skel-${idx}`} className="animate-pulse">
                                {[['w-24', 'w-32'], ['w-24', 'w-28'], ['w-44', 'w-20'], ['w-20'], ['w-24', 'w-16'], ['w-20'], ['w-16']].map((ws, c) => (
                                  <td key={c} className="py-4 px-4">
                                    {ws.map((w, k) => (
                                      <div key={k} className={`h-3.5 ${w} rounded ${k ? 'mt-1.5' : ''} ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
                                    ))}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (!Array.isArray(interventions) || interventions.length === 0) ? (
                            <tr>
                              <td colSpan="7" className="text-center py-12">
                                <i className="bi bi-inbox text-4xl text-gray-500 block mb-2" />
                                <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Aucune intervention enregistrée</p>
                                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  Cliquez sur "Saisir une Réparation / Véhicule" pour en enregistrer une.
                                </p>
                              </td>
                            </tr>
                          ) : (
                            interventions.map((item, rowIdx) => {
                              // Le statut affiché = le statut réellement enregistré (choisi par l'utilisateur)
                              const stat = STATUTS[item.statut] || STATUT_INCONNU;
                              const libelleStatut = stat.libelle || item.statut_libelle || item.statut || '—';
                              const isOuverte = STATUTS_OUVERTS.includes(item.statut);

                              // Droits de la ligne (les actions non autorisées n'apparaissent pas dans le menu)
                              const canEditRow = !isReadOnly && !!item.can_edit && (item.statut !== 'resolu' || userRole === 'admin');
                              const canTerminerRow = !isReadOnly && isOuverte;
                              const canDeleteRow = !isReadOnly;

                              return (
                                <tr
                                  key={item.id}
                                  onClick={() => openDetail(item)}
                                  className={`cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-blue-50/40'}`}
                                  style={{ backgroundColor: getRowBackgroundColor(rowIdx, darkMode) }}
                                >
                                  {/* Réf & Véhicule */}
                                  <td className="py-3.5 px-4">
                                    <div className="font-black text-sm text-blue-500">
                                      {item.reference_intervention || `INT-${String(item.id).padStart(5, '0')}`}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className={tableStyles.cellBold}>{item.vehicule_immatriculation}</span>
                                      {(item.vehicule_marque || item.vehicule_modele) && (
                                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                          ({item.vehicule_marque} {item.vehicule_modele})
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Nature & Intervenant */}
                                  <td className="py-3.5 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${item.nature_intervention === 'interne'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                                      <i className={`bi ${item.nature_intervention === 'interne' ? 'bi-wrench' : 'bi-building'}`} />
                                      {item.nature_intervention === 'interne' ? 'Atelier interne' : 'Garage externe'}
                                    </span>
                                    <p className={`mt-1 font-medium truncate max-w-[180px] ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={intervenantAffiche(item)}>
                                      {intervenantAffiche(item)}
                                    </p>
                                  </td>

                                  {/* Travaux & Type */}
                                  <td className="py-3.5 px-4">
                                    <p className={`font-medium line-clamp-1 max-w-[220px] ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                      {item.travaux_effectues || item.type_intervention || 'Réparation générale'}
                                    </p>
                                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {item.km_au_moment_intervention ? `${Number(item.km_au_moment_intervention).toLocaleString()} km` : 'Km non spécifié'}
                                    </span>
                                  </td>

                                  {/* Statut */}
                                  <td className="py-3.5 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold ${stat.bg}`}>
                                      <i className={`bi ${stat.icon}`} />
                                      {libelleStatut}
                                    </span>
                                  </td>

                                  {/* Dates & Durée */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Entrée : {formatDateFR(item.date_entree_garage || item.date_debut)}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      Sortie : {formatDateFR(item.date_sortie_garage || item.date_fin)}
                                    </p>
                                    {dureeDe(item) && (
                                      <p className="text-xs font-semibold text-teal-400 mt-0.5">{dureeDe(item)}</p>
                                    )}
                                  </td>

                                  {/* Coût Total */}
                                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                                    <span className={tableStyles.cellBold}>{formatCFA(item.cout_total)}</span>
                                  </td>

                                  {/* Actions : tout est regroupé dans le menu trois points */}
                                  <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <RowActionsMenu
                                      item={item}
                                      darkMode={darkMode}
                                      theme={theme}
                                      onView={openDetail}
                                      onEdit={openEdit}
                                      onTerminer={handleTerminerRapide}
                                      onDelete={handleDelete}
                                      canEdit={canEditRow}
                                      canTerminer={canTerminerRow}
                                      canDelete={canDeleteRow}
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {meta.last_page > 1 && (
                      <div className={`p-3 border-t flex items-center justify-between text-xs ${darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                        <span>Page {page} sur {meta.last_page}</span>
                        <div className="flex items-center gap-1">
                          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded-lg border disabled:opacity-40">
                            Précédent
                          </button>
                          <button disabled={page >= meta.last_page} onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} className="px-3 py-1 rounded-lg border disabled:opacity-40">
                            Suivant
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                ONGLET 2 : CAISSE (DAAL + admin : lecture et écriture)
               ══════════════════════════════════════════════════════════ */}
            {activeTab === 'caisse' && canAccessCaisse && (
              <CaisseTab darkMode={darkMode} theme={theme} isReadOnly={false} />
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      {!initialLoading && <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />}

      {/* ── MODALE SAISIE / MODIFICATION (plein écran) ── */}
      <InterventionCreateModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        onSuccess={refreshAll}
        initialDemandeId={initialDemandeId}
        intervention={editTarget}
        darkMode={darkMode}
        theme={theme}
      />

      {/* ── MODALE DÉTAIL (plein écran) ── */}
      <InterventionDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedIntervention(null);
        }}
        intervention={selectedIntervention}
        onRefresh={refreshAll}
        onEdit={openEdit}
        darkMode={darkMode}
        theme={theme}
        isReadOnly={isReadOnly}
      />

    </div>
  );
};

export default InterventionsVehicules;