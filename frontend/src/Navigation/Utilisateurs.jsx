import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
import { getFormStyles, getTableStyles, getRowBackgroundColor, PageSkeleton } from '../utils/uniformStyles';
import { showSuccess, showError, showConfirm } from '../utils/walConfig';
import {
  getUtilisateurs,
  getUtilisateur,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  toggleStatutUtilisateur,
  resetPasswordUtilisateur,
  generatePassword,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  toggleStatutRole,
  getDirections,
  createDirection,
  updateDirection,
  toggleStatutDirection,
  deleteDirection,
} from '../api/Admin-Axios/Utilisateurs-axios';

// ============================================================================
// UTILISATEURS / RÔLES / DIRECTIONS
//
// RAFRAÎCHISSEMENT (même principe que la page « Demandes d'intervention ») :
//  • Après chaque action (créer / modifier / supprimer / bloquer / réinitialiser) :
//      1) les modales se ferment et l'interface est mise à jour IMMÉDIATEMENT
//         (mise à jour locale quand c'est possible : suppression, blocage…)
//      2) un rechargement SILENCIEUX (sans skeleton, sans clignotement) part en
//         arrière-plan EN MÊME TEMPS que l'affichage du SweetAlert
//      → les données du serveur (compteurs, stats, nouvelles lignes…) sont à jour
//        derrière l'alerte, sans que la page ne « recharge » visuellement.
//  • Le skeleton plein écran n'apparaît que pour le chargement initial et le
//    changement d'onglet. La recherche et les filtres rechargent en silence
//    (le champ de recherche garde donc le focus).
//  • Toutes les erreurs (validation 422, erreur serveur 500, réseau…) s'affichent
//    dans un SweetAlert ; la modale reste ouverte pour ne pas perdre la saisie.
//
// MENU « ACTIONS » (trois points) :
//  • Le menu est rendu dans un PORTAIL (document.body) en position fixe : il n'est
//    donc plus coupé par le overflow du tableau. Il s'ouvre vers le haut s'il n'y
//    a pas assez de place en bas, et se ferme au scroll / redimensionnement.
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT SPINNER
// ─────────────────────────────────────────────────────────────────────────────
const Spinner = ({ size = 'md' }) => {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return (
    <div className={`${s} border-2 border-current border-t-transparent rounded-full animate-spin opacity-70`} />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MENU D'ACTIONS (trois points) — rendu en PORTAIL
// Défini EN DEHORS de la page pour ne pas être recréé à chaque rendu.
// ─────────────────────────────────────────────────────────────────────────────
const MENU_WIDTH = 192; // = w-48

const ActionMenuPortal = ({ menuKey, openKey, setOpenKey, darkMode, children }) => {
  const btnRef  = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);
  const isOpen = openKey === menuKey;

  // Calcule la position une fois le menu monté (on connaît alors sa vraie hauteur)
  useLayoutEffect(() => {
    if (!isOpen) { setPos(null); return; }
    const btn  = btnRef.current;
    const menu = menuRef.current;
    if (!btn || !menu) return;

    const r      = btn.getBoundingClientRect();
    const menuH  = menu.offsetHeight;
    const gap    = 4;
    const margin = 8;

    // Horizontal : aligné à droite du bouton, sans sortir de l'écran
    let left = r.right - MENU_WIDTH;
    left = Math.max(margin, Math.min(left, window.innerWidth - MENU_WIDTH - margin));

    // Vertical : en dessous si la place suffit, sinon au-dessus
    const spaceBelow = window.innerHeight - r.bottom;
    let top = spaceBelow >= menuH + gap + margin ? r.bottom + gap : r.top - menuH - gap;
    top = Math.max(margin, Math.min(top, window.innerHeight - menuH - margin));

    setPos({ top, left });
  }, [isOpen]);

  // Ferme le menu au scroll / redimensionnement (position fixe → évite le décalage)
  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => {
      if (menuRef.current && e?.target instanceof Node && menuRef.current.contains(e.target)) return;
      setOpenKey(null);
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen, setOpenKey]);

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={() => setOpenKey(isOpen ? null : menuKey)}
        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
      >
        <i className="bi bi-three-dots-vertical" />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          // La classe "action-menu-portal" sert au gestionnaire de clic extérieur de la page
          className={`action-menu-portal fixed rounded-xl border shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            top:        pos ? pos.top  : 0,
            left:       pos ? pos.left : 0,
            width:      MENU_WIDTH,
            zIndex:     9999,
            visibility: pos ? 'visible' : 'hidden', // masqué le temps de mesurer
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const SkeletonPulse = ({ darkMode, className = '' }) => (
  <div
    className={`rounded animate-pulse ${className}`}
    style={{ backgroundColor: darkMode ? '#1e293b' : '#e2e8f0' }}
  />
);

// Skeleton pour les onglets
const TabsSkeleton = ({ darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm mb-6 p-2`}>
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex-1 px-6 py-3 rounded-lg">
          <SkeletonPulse darkMode={darkMode} className="h-5 w-full" />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton pour les 4 stat cards
const StatCardsSkeleton = ({ darkMode }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-5 border shadow-sm`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <SkeletonPulse darkMode={darkMode} className="h-3 w-24" />
            <SkeletonPulse darkMode={darkMode} className="h-8 w-14 mt-1" />
            <SkeletonPulse darkMode={darkMode} className="h-2.5 w-20" />
          </div>
          <SkeletonPulse darkMode={darkMode} className="w-11 h-11 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton pour la barre d'outils (au-dessus du tableau)
const ToolbarSkeleton = ({ darkMode }) => (
  <div className={`p-5 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="space-y-2">
        <SkeletonPulse darkMode={darkMode} className="h-5 w-44" />
        <SkeletonPulse darkMode={darkMode} className="h-3 w-28" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonPulse darkMode={darkMode} className="h-9 w-56 rounded-lg" />
        <SkeletonPulse darkMode={darkMode} className="h-9 w-24 rounded-lg" />
        <SkeletonPulse darkMode={darkMode} className="h-9 w-44 rounded-lg" />
      </div>
    </div>
  </div>
);

// Skeleton pour l'en-tête du tableau
const TableHeadSkeleton = ({ darkMode, cols = 7 }) => (
  <thead>
    <tr className={darkMode ? 'bg-gray-800/60' : 'bg-gray-100'}>
      {[...Array(cols)].map((_, i) => (
        <th key={i} className="px-6 py-4">
          <SkeletonPulse darkMode={darkMode} className="h-3 w-16" />
        </th>
      ))}
    </tr>
  </thead>
);

// Skeleton pour les lignes du tableau utilisateurs
const TableRowsSkeleton = ({ darkMode, cols = 7, rows = 6 }) => (
  <>
    {[...Array(rows)].map((_, i) => (
      <tr
        key={i}
        style={{
          backgroundColor: i % 2 === 0
            ? (darkMode ? '#1a2535' : '#eef2ff')
            : (darkMode ? '#1c1f2b' : '#f3f4f6'),
        }}
      >
        {/* Colonne avatar + nom */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <SkeletonPulse darkMode={darkMode} className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="space-y-1.5">
              <SkeletonPulse darkMode={darkMode} className="h-3 w-28" />
              <SkeletonPulse darkMode={darkMode} className="h-2.5 w-20" />
            </div>
          </div>
        </td>
        {/* Colonnes intermédiaires */}
        {[...Array(cols - 2)].map((_, j) => (
          <td key={j} className="px-6 py-4">
            <SkeletonPulse darkMode={darkMode} className="h-3 w-20" />
          </td>
        ))}
        {/* Colonne actions */}
        <td className="px-6 py-4">
          <SkeletonPulse darkMode={darkMode} className="w-8 h-8 rounded-lg" />
        </td>
      </tr>
    ))}
  </>
);

// Skeleton pour le pied de tableau
const TableFooterSkeleton = ({ darkMode }) => (
  <div className={`px-6 py-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
    <SkeletonPulse darkMode={darkMode} className="h-3 w-24" />
  </div>
);

// Skeleton complet pour le tableau (head + rows + footer), avec toolbar
const TableBlockSkeleton = ({ darkMode, cols = 7, rows = 6 }) => (
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
    <ToolbarSkeleton darkMode={darkMode} />
    <div className="overflow-x-auto">
      <table className="w-full">
        <TableHeadSkeleton darkMode={darkMode} cols={cols} />
        <tbody>
          <TableRowsSkeleton darkMode={darkMode} cols={cols} rows={rows} />
        </tbody>
      </table>
    </div>
    <TableFooterSkeleton darkMode={darkMode} />
  </div>
);

// Skeleton de page entière : onglets + stats + tableau
const FullPageSkeleton = ({ darkMode }) => (
  <>
    <TabsSkeleton darkMode={darkMode} />
    <StatCardsSkeleton darkMode={darkMode} />
    <TableBlockSkeleton darkMode={darkMode} cols={7} rows={6} />
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : badge statut
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge = ({ active, labelTrue = 'Actif', labelFalse = 'Inactif' }) => (
  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
    active
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }`}>
    {active ? labelTrue : labelFalse}
  </span>
);

// Badge niveau accès
const NiveauBadge = ({ niveau }) => {
  const cls = {
    'Complet': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Élevé':   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Moyen':   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  }[niveau] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{niveau}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILISATEURS — COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const Utilisateurs = () => {
  const { theme } = useTheme();
  const navigate  = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('fleetify_darkMode') !== 'false'; }
    catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {}
  }, [darkMode]);

  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile,       setShowProfile]       = useState(false);

  // Onglets
  const [activeTab, setActiveTab] = useState('utilisateurs');

  // Données
  const [usersData,      setUsersData]      = useState([]);
  const [rolesData,      setRolesData]      = useState([]);
  const [directionsData, setDirectionsData] = useState([]);
  const [stats,          setStats]          = useState({});

  // Chargement
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});

  // Filtres
  const [searchQuery,    setSearchQuery]    = useState('');
  const [roleFilter,     setRoleFilter]     = useState('Tous');
  const [statusFilter,   setStatusFilter]   = useState('Tous');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Modales
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [showEditModal,    setShowEditModal]    = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentItem,      setCurrentItem]      = useState(null);
  const [showActionMenu,   setShowActionMenu]   = useState(null);

  // Formulaire
  const [formData,      setFormData]      = useState({});
  const [generatingPwd, setGeneratingPwd] = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // REFS
  //  • loadDataRef  : dernière version de loadData (évite les closures obsolètes)
  //  • reqIdRef     : numéro de la requête la plus récente (ignore les réponses périmées)
  //  • loadedTabRef : dernier onglet chargé (skeleton seulement au 1er chargement d'un onglet)
  //  • rolesRef     : rôles courants, lus par loadData sans le faire dépendre de rolesData
  // ─────────────────────────────────────────────────────────────────────────
  const loadDataRef  = useRef(null);
  const reqIdRef     = useRef(0);
  const loadedTabRef = useRef(null);
  const rolesRef     = useRef([]);
  useEffect(() => { rolesRef.current = rolesData; }, [rolesData]);

  // ─────────────────────────────────────────────────────────────────────────
  // SWEETALERT2 — helpers centralisés avec thème dynamique
  // ─────────────────────────────────────────────────────────────────────────

  const swalBase = useCallback(() => ({
    background:         darkMode ? '#111827' : '#ffffff',
    color:              darkMode ? '#f9fafb' : '#111827',
    confirmButtonColor: theme.primary,
    customClass: {
      popup:         darkMode ? 'swal-dark-popup'  : 'swal-light-popup',
      confirmButton: 'swal-confirm-btn',
      cancelButton:  'swal-cancel-btn',
    },
  }), [darkMode, theme.primary]);

  // Succès : le rechargement silencieux part IMMÉDIATEMENT, en même temps que l'alerte
  const swalSuccess = useCallback((message) => {
    if (loadDataRef.current) loadDataRef.current(true);   // rafraîchissement en arrière-plan
    showSuccess(darkMode, theme, 'Succès', message);
  }, [darkMode, theme]);

  const swalError = useCallback((message) => {
    showError(darkMode, theme, 'Erreur', message);
  }, [darkMode, theme]);

  const swalConfirm = useCallback(async ({ title, text, confirmText = 'Confirmer', isDanger = false }) => {
    return await showConfirm(darkMode, theme, { title, html: text, confirmText, isDanger });
  }, [darkMode, theme]);

  // Fermeture menus au clic dehors
  // (le menu en portail porte la classe "action-menu-portal" : un clic dedans ne le ferme pas ici)
  useEffect(() => {
    const handler = (e) => {
      if (e.target?.closest?.('.action-menu-portal')) return;
      setShowActionMenu(null);
      setShowFilterMenu(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CHARGEMENT DES DONNÉES
  //  • loadData()      → avec skeleton (premier chargement d'un onglet)
  //  • loadData(true)  → SILENCIEUX : aucun skeleton, aucun clignotement ;
  //                      les nouvelles données remplacent simplement les anciennes.
  // ─────────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    const myId = ++reqIdRef.current;
    if (!silent) setLoading(true);
    try {
      if (activeTab === 'utilisateurs') {
        const params = {};
        if (searchQuery)                    params.search  = searchQuery;
        if (roleFilter !== 'Tous')          params.role_id = rolesRef.current.find(r => r.nom === roleFilter)?.id;
        if (statusFilter === 'Actif')       params.statut  = 1;
        else if (statusFilter === 'Bloqué') params.statut  = 0;

        const res = await getUtilisateurs(params);
        if (myId !== reqIdRef.current) return;     // une requête plus récente est déjà passée
        if (res.data.success) {
          setUsersData(res.data.data);
          setStats(res.data.stats ?? {});
        }
      } else if (activeTab === 'roles') {
        const params = searchQuery ? { search: searchQuery } : {};
        const res = await getRoles(params);
        if (myId !== reqIdRef.current) return;
        if (res.data.success) {
          setRolesData(res.data.data);
          setStats(res.data.stats ?? {});
        }
      } else {
        const params = searchQuery ? { search: searchQuery } : {};
        const res = await getDirections(params);
        if (myId !== reqIdRef.current) return;
        if (res.data.success) {
          setDirectionsData(res.data.data);
          setStats(res.data.stats ?? {});
        }
      }
      loadedTabRef.current = activeTab;
    } catch {
      // En mode silencieux, on garde l'affichage actuel sans message d'erreur.
      if (!silent && myId === reqIdRef.current) swalError('Erreur lors du chargement des données.');
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }, [activeTab, searchQuery, roleFilter, statusFilter, swalError]);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // Déclenche le chargement :
  //  • 1er chargement d'un onglet → avec skeleton, immédiat
  //  • recherche / filtres        → silencieux, avec un léger délai (anti-rebond)
  useEffect(() => {
    const silent = loadedTabRef.current === activeTab;
    const t = setTimeout(() => loadData(silent), silent ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadData, activeTab]);

  // Pré-charger rôles + directions pour les selects
  useEffect(() => {
    const preload = async () => {
      try {
        const [rRes, dRes] = await Promise.all([getRoles(), getDirections()]);
        if (rRes.data.success) setRolesData(rRes.data.data);
        if (dRes.data.success) setDirectionsData(dRes.data.data);
      } catch {}
    };
    preload();
  }, []);

  // La recherche ne fait que mettre à jour l'état : l'effet ci-dessus recharge en silence.
  const handleSearchChange = (val) => setSearchQuery(val);

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITAIRES FORMULAIRE
  // ─────────────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormData({});
    setErrors({});
    setShowPassword(false);
    setCurrentItem(null);
    setShowAddModal(true);
  };

  const openEdit = (item) => {
    setCurrentItem(item);
    setErrors({});
    if (activeTab === 'utilisateurs') {
      setFormData({
        nom:          item.nom,
        email:        item.email,
        role_id:      item.roleId,
        direction_id: item.directionId,
      });
    } else if (activeTab === 'roles') {
      setFormData({
        code:        item.code,
        libelle:     item.nom,
        description: item.description,
      });
    } else {
      setFormData({
        nom:       item.nom,
        reference: item.reference ?? '',
      });
    }
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const openDetails = (item) => {
    setCurrentItem(item);
    setShowDetailsModal(true);
    setShowActionMenu(null);
  };

  // Toute erreur API (422 validation, 500, réseau…) → SweetAlert
  const handleApiErrors = (err) => {
    if (err.response?.data?.errors) {
      setErrors(err.response.data.errors);
      const firstMsg = Object.values(err.response.data.errors)[0];
      swalError(Array.isArray(firstMsg) ? firstMsg[0] : firstMsg);
    } else {
      swalError(err.response?.data?.message ?? 'Une erreur est survenue.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GÉNÉRATION MOT DE PASSE
  // ─────────────────────────────────────────────────────────────────────────
  const handleGeneratePassword = async () => {
    setGeneratingPwd(true);
    try {
      const res = await generatePassword(formData.nom ?? '');
      if (res.data.success) {
        setFormData((prev) => ({ ...prev, mot_de_passe: res.data.password }));
        setShowPassword(true);
      }
    } catch {
      swalError('Impossible de générer le mot de passe.');
    } finally {
      setGeneratingPwd(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD UTILISATEURS
  //  Ordre après succès : 1) fermeture de la modale  2) alerte + rechargement
  //  silencieux simultanés (voir swalSuccess).
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddUser = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const res = await createUtilisateur({
        nom:          formData.nom,
        email:        formData.email,
        role_id:      formData.role_id,
        direction_id: formData.direction_id || null,
        mot_de_passe: formData.mot_de_passe,
      });
      if (res.data.success) {
        setShowAddModal(false);
        swalSuccess(res.data.message ?? 'Utilisateur créé avec succès.');
      }
    } catch (err) { handleApiErrors(err); }
    finally { setSubmitting(false); }
  };

  const handleEditUser = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const res = await updateUtilisateur(currentItem.id, {
        nom:          formData.nom,
        email:        formData.email,
        role_id:      formData.role_id,
        direction_id: formData.direction_id || null,
      });
      if (res.data.success) {
        setShowEditModal(false);
        swalSuccess(res.data.message ?? 'Utilisateur modifié avec succès.');
      }
    } catch (err) { handleApiErrors(err); }
    finally { setSubmitting(false); }
  };

  const handleDeleteUser = async (item) => {
    setShowActionMenu(null);
    const confirmed = await swalConfirm({
      title:        'Supprimer cet utilisateur ?',
      text:         `Voulez-vous vraiment supprimer "${item.nom}" ? Cette action est irréversible.`,
      confirmText:  'Supprimer',
      confirmColor: '#dc2626',
      icon:         'warning',
    });
    if (!confirmed) return;
    try {
      const res = await deleteUtilisateur(item.id);
      if (res.data.success) {
        setUsersData(prev => prev.filter(u => u.id !== item.id));   // disparition immédiate de la ligne
        swalSuccess(res.data.message ?? 'Utilisateur supprimé.');
      }
    } catch (err) {
      loadDataRef.current?.(true);   // l'état serveur a peut-être changé
      swalError(err.response?.data?.message ?? 'Erreur lors de la suppression.');
    }
  };

  const handleToggleUserStatus = async (user) => {
    setShowActionMenu(null);
    const confirmed = await swalConfirm({
      title:        `${user.est_actif ? 'Bloquer' : 'Débloquer'} cet utilisateur ?`,
      text:         `Voulez-vous vraiment ${user.est_actif ? 'bloquer' : 'débloquer'} ${user.nom} ?`,
      confirmText:  user.est_actif ? 'Bloquer' : 'Débloquer',
      confirmColor: '#dc2626',
      icon:         'question',
    });
    if (!confirmed) return;
    try {
      const res = await toggleStatutUtilisateur(user.id);
      if (res.data.success) {
        // changement de statut visible immédiatement
        setUsersData(prev => prev.map(u => u.id === user.id ? { ...u, est_actif: !u.est_actif } : u));
        swalSuccess(res.data.message ?? 'Statut mis à jour.');
      }
    } catch (err) {
      loadDataRef.current?.(true);
      swalError(err.response?.data?.message ?? 'Erreur.');
    }
  };

  const handleResetPassword = async (userId) => {
    const confirmed = await swalConfirm({
      title:        'Réinitialiser le mot de passe ?',
      text:         'Un nouveau mot de passe sera généré et envoyé par email. Les sessions actives seront fermées.',
      confirmText:  'Réinitialiser',
      confirmColor: '#d97706',
      icon:         'warning',
    });
    if (!confirmed) return;
    try {
      const res = await resetPasswordUtilisateur(userId);
      if (res.data.success) {
        swalSuccess(res.data.message ?? 'Mot de passe réinitialisé et envoyé par email.');
      } else {
        swalError(res.data.message);
      }
    } catch (err) { swalError(err.response?.data?.message ?? 'Erreur lors de la réinitialisation.'); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD RÔLES
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddRole = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const res = await createRole({
        code:        formData.code,
        libelle:     formData.libelle,
        description: formData.description,
      });
      if (res.data.success) {
        setShowAddModal(false);
        swalSuccess(res.data.message ?? 'Rôle créé avec succès.');
      }
    } catch (err) { handleApiErrors(err); }
    finally { setSubmitting(false); }
  };

  const handleEditRole = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const res = await updateRole(currentItem.id, {
        code:        formData.code,
        libelle:     formData.libelle,
        description: formData.description,
      });
      if (res.data.success) {
        setShowEditModal(false);
        swalSuccess(res.data.message ?? 'Rôle modifié avec succès.');
      }
    } catch (err) { handleApiErrors(err); }
    finally { setSubmitting(false); }
  };

  const handleDeleteRole = async (item) => {
    setShowActionMenu(null);
    const confirmed = await swalConfirm({
      title:        'Supprimer ce rôle ?',
      text:         `Voulez-vous vraiment supprimer le rôle "${item.nom}" ? Cette action est irréversible.`,
      confirmText:  'Supprimer',
      confirmColor: '#dc2626',
      icon:         'warning',
    });
    if (!confirmed) return;
    try {
      const res = await deleteRole(item.id);
      if (res.data.success) {
        setRolesData(prev => prev.filter(r => r.id !== item.id));   // disparition immédiate
        swalSuccess(res.data.message ?? 'Rôle supprimé.');
      }
    } catch (err) {
      loadDataRef.current?.(true);
      swalError(err.response?.data?.message ?? 'Erreur lors de la suppression.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD DIRECTIONS
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddDirection = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const res = await createDirection({
        nom:       formData.nom,
        reference: formData.reference || null,
      });
      if (res.data.success) {
        setShowAddModal(false);
        swalSuccess(res.data.message ?? 'Direction créée avec succès.');
      }
    } catch (err) { handleApiErrors(err); }
    finally { setSubmitting(false); }
  };

  const handleEditDirection = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const res = await updateDirection(currentItem.id, {
        nom:       formData.nom,
        reference: formData.reference || null,
      });
      if (res.data.success) {
        setShowEditModal(false);
        swalSuccess(res.data.message ?? 'Direction modifiée avec succès.');
      }
    } catch (err) { handleApiErrors(err); }
    finally { setSubmitting(false); }
  };

  const handleDeleteDirection = async (item) => {
    setShowActionMenu(null);
    const confirmed = await swalConfirm({
      title:        'Supprimer cette direction ?',
      text:         `Voulez-vous vraiment supprimer la direction "${item.nom}" ? Cette action est irréversible.`,
      confirmText:  'Supprimer',
      confirmColor: '#dc2626',
      icon:         'warning',
    });
    if (!confirmed) return;
    try {
      const res = await deleteDirection(item.id);
      if (res.data.success) {
        setDirectionsData(prev => prev.filter(d => d.id !== item.id));   // disparition immédiate
        swalSuccess(res.data.message ?? 'Direction supprimée.');
      }
    } catch (err) {
      loadDataRef.current?.(true);
      swalError(err.response?.data?.message ?? 'Erreur lors de la suppression.');
    }
  };

  // Dispatch submit
  const handleSubmitAdd  = () => { if (activeTab === 'utilisateurs') handleAddUser();  else if (activeTab === 'roles') handleAddRole();  else handleAddDirection(); };
  const handleSubmitEdit = () => { if (activeTab === 'utilisateurs') handleEditUser(); else if (activeTab === 'roles') handleEditRole(); else handleEditDirection(); };

  // ─────────────────────────────────────────────────────────────────────────
  // STATS CARDS
  // ─────────────────────────────────────────────────────────────────────────
  const getStatsCards = () => {
    if (activeTab === 'utilisateurs') return [
      { title: 'Total Utilisateurs', value: stats.total   ?? usersData.length,                          subtitle: 'comptes créés',      icon: 'bi-people-fill',       iconBg: 'bg-blue-100 dark:bg-blue-900/40',    textColor: 'text-blue-600 dark:text-blue-400' },
      { title: 'Actifs',             value: stats.actifs  ?? usersData.filter(u => u.est_actif).length,  subtitle: 'utilisateurs actifs', icon: 'bi-check-circle-fill', iconBg: 'bg-green-100 dark:bg-green-900/40',  textColor: 'text-green-600 dark:text-green-400' },
      { title: 'Bloqués',            value: stats.bloques ?? usersData.filter(u => !u.est_actif).length, subtitle: 'comptes bloqués',     icon: 'bi-x-circle-fill',     iconBg: 'bg-red-100 dark:bg-red-900/40',      textColor: 'text-red-600 dark:text-red-400' },
      { title: 'Administrateurs',    value: stats.admins  ?? 0,                                          subtitle: 'rôles admin',         icon: 'bi-shield-fill-check', iconBg: 'bg-purple-100 dark:bg-purple-900/40', textColor: 'text-purple-600 dark:text-purple-400' },
    ];
    if (activeTab === 'roles') return [
      { title: 'Total Rôles',           value: stats.total                ?? rolesData.length,                         subtitle: 'rôles créés',        icon: 'bi-shield-fill',       iconBg: 'bg-blue-100 dark:bg-blue-900/40',    textColor: 'text-blue-600 dark:text-blue-400' },
      { title: 'Rôles Actifs',          value: stats.actifs               ?? rolesData.filter(r => r.estActif).length, subtitle: 'actuellement actifs', icon: 'bi-check-circle-fill', iconBg: 'bg-green-100 dark:bg-green-900/40',  textColor: 'text-green-600 dark:text-green-400' },
      { title: 'Utilisateurs Assignés', value: stats.utilisateursAssignes ?? rolesData.reduce((a, r) => a + r.nbUtilisateurs, 0), subtitle: 'au total', icon: 'bi-people-fill', iconBg: 'bg-purple-100 dark:bg-purple-900/40', textColor: 'text-purple-600 dark:text-purple-400' },
      { title: 'Accès Élevé',           value: rolesData.filter(r => r.niveauAcces === 'Élevé' || r.niveauAcces === 'Complet').length, subtitle: 'accès total', icon: 'bi-key-fill', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40', textColor: 'text-yellow-600 dark:text-yellow-400' },
    ];
    return [
      { title: 'Total Directions',   value: stats.total  ?? directionsData.length,                              subtitle: 'directions',      icon: 'bi-building',          iconBg: 'bg-blue-100 dark:bg-blue-900/40',    textColor: 'text-blue-600 dark:text-blue-400' },
      { title: 'Véhicules',          value: directionsData.reduce((a, d) => a + d.nbVehicules, 0),              subtitle: 'au total',        icon: 'bi-car-front-fill',    iconBg: 'bg-green-100 dark:bg-green-900/40',  textColor: 'text-green-600 dark:text-green-400' },
      { title: 'Utilisateurs',       value: directionsData.reduce((a, d) => a + d.nbUtilisateurs, 0),           subtitle: 'au total',        icon: 'bi-people-fill',       iconBg: 'bg-purple-100 dark:bg-purple-900/40', textColor: 'text-purple-600 dark:text-purple-400' },
      { title: 'Directions Actives', value: stats.actifs ?? directionsData.filter(d => d.estActif).length,      subtitle: 'opérationnelles', icon: 'bi-check-circle-fill', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40', textColor: 'text-yellow-600 dark:text-yellow-400' },
    ];
  };

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS UI
  // ─────────────────────────────────────────────────────────────────────────
  const dm = (dark, light) => darkMode ? dark : light;

  const inputCls = `w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
    dm('bg-gray-800 border-gray-700 text-white placeholder-gray-500',
       'bg-white border-gray-300 text-gray-900 placeholder-gray-400')
  }`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${dm('text-gray-400', 'text-gray-600')}`;

  const FieldError = ({ name }) => errors[name]
    ? <p className="text-red-500 text-xs mt-1">{Array.isArray(errors[name]) ? errors[name][0] : errors[name]}</p>
    : null;

  const uniqueRoleNames = ['Tous', ...new Set(usersData.map(u => u.roleName))];

  // Styles tableau
  const theadStyle = { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` };
  const trStyle = (index) => ({
    backgroundColor: getRowBackgroundColor(index, darkMode),
    borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
    transition: 'background-color 0.15s ease',
  });
  const trHover = { backgroundColor: darkMode ? `${theme.primary}28` : `${theme.primary}15` };

  const Th = ({ children }) => (
    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">{children}</th>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAT VIDE
  // ─────────────────────────────────────────────────────────────────────────
  const EmptyState = ({ message }) => (
    <tr>
      <td colSpan={10} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${dm('bg-gray-800', 'bg-gray-100')}`}>
            <i className={`bi bi-inbox text-2xl ${dm('text-gray-600', 'text-gray-400')}`} />
          </div>
          <p className={`text-sm ${dm('text-gray-400', 'text-gray-500')}`}>{message}</p>
        </div>
      </td>
    </tr>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // BARRE OUTILS
  // NB : appelée comme une FONCTION ( {Toolbar({ count, countLabel })} ) et non comme
  // un composant <Toolbar/> : défini dans le composant parent, un <Toolbar/> serait
  // recréé à chaque rendu, ce qui démonterait le champ de recherche (perte du focus
  // à chaque lettre tapée).
  // ─────────────────────────────────────────────────────────────────────────
  const Toolbar = ({ count, countLabel }) => (
    <div className={`p-5 border-b ${dm('border-gray-800', 'border-gray-100')}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className={`text-lg font-bold ${dm('text-white', 'text-gray-900')}`}>
            {activeTab === 'utilisateurs' ? 'Liste des Utilisateurs' : activeTab === 'roles' ? 'Liste des Rôles' : 'Liste des Directions'}
          </h3>
          <p className={`text-sm ${dm('text-gray-400', 'text-gray-500')}`}>
            {count} {countLabel} trouvé{count > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Recherche */}
          <div className="relative">
            <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${dm('text-gray-400', 'text-gray-400')}`} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className={`pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 w-56 ${
                dm('bg-gray-800 border-gray-700 text-white placeholder-gray-500',
                   'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400')
              }`}
              style={{ '--tw-ring-color': theme.primary }}
            />
          </div>

          {/* Filtres utilisateurs uniquement */}
          {activeTab === 'utilisateurs' && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setShowFilterMenu(p => !p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  dm('bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750',
                     'bg-white border-gray-200 text-gray-700 hover:bg-gray-50')
                }`}
              >
                <i className="bi bi-funnel" />
                <span>Filtres</span>
                {(roleFilter !== 'Tous' || statusFilter !== 'Tous') && (
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
              {showFilterMenu && (
                <div className={`absolute right-0 mt-2 w-60 rounded-xl border shadow-2xl z-50 p-4 space-y-4 ${
                  dm('bg-gray-800 border-gray-700', 'bg-white border-gray-200')
                }`}>
                  <div>
                    <label className={labelCls}>Rôle</label>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={inputCls}>
                      {uniqueRoleNames.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Statut</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls}>
                      <option value="Tous">Tous</option>
                      <option value="Actif">Actif</option>
                      <option value="Bloqué">Bloqué</option>
                    </select>
                  </div>
                  {(roleFilter !== 'Tous' || statusFilter !== 'Tous') && (
                    <button onClick={() => { setRoleFilter('Tous'); setStatusFilter('Tous'); }} className="text-xs text-red-500 hover:text-red-400">
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bouton ajouter */}
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 shadow-md transition-all"
            style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
          >
            <i className="bi bi-plus-lg" />
            <span>
              {activeTab === 'utilisateurs' ? 'Ajouter un utilisateur' :
               activeTab === 'roles' ? 'Ajouter un rôle' : 'Ajouter une direction'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MENU ACTION — UTILISATEURS
  // NB : appelé comme une FONCTION ( {ActionMenuUtilisateur({ menuKey, item })} ) :
  // le composant ActionMenuPortal (stable, défini hors de la page) n'est ainsi
  // jamais remonté à chaque rendu de la page.
  // ─────────────────────────────────────────────────────────────────────────
  const menuItemCls = `w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${dm('text-gray-300 hover:bg-gray-700', 'text-gray-700 hover:bg-gray-50')}`;
  const menuDangerCls = `w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${dm('text-red-400 hover:bg-gray-700', 'text-red-600 hover:bg-red-50')}`;

  const ActionMenuUtilisateur = ({ menuKey, item }) => (
    <ActionMenuPortal menuKey={menuKey} openKey={showActionMenu} setOpenKey={setShowActionMenu} darkMode={darkMode}>
      <button onClick={() => openDetails(item)} className={menuItemCls}>
        <i className="bi bi-eye-fill text-blue-500" /><span>Voir détails</span>
      </button>
      <button onClick={() => openEdit(item)} className={menuItemCls}>
        <i className="bi bi-pencil-fill text-yellow-500" /><span>Modifier</span>
      </button>
      <button onClick={() => handleToggleUserStatus(item)} className={menuItemCls}>
        <i className={`bi ${item.est_actif ? 'bi-lock-fill text-red-500' : 'bi-unlock-fill text-green-500'}`} />
        <span>{item.est_actif ? 'Bloquer' : 'Débloquer'}</span>
      </button>
      <div className={`border-t ${dm('border-gray-700', 'border-gray-100')}`} />
      <button onClick={() => handleDeleteUser(item)} className={menuDangerCls}>
        <i className="bi bi-trash-fill" /><span>Supprimer</span>
      </button>
    </ActionMenuPortal>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MENU ACTION — RÔLES & DIRECTIONS
  // ─────────────────────────────────────────────────────────────────────────
  const ActionMenuSimple = ({ menuKey, item }) => (
    <ActionMenuPortal menuKey={menuKey} openKey={showActionMenu} setOpenKey={setShowActionMenu} darkMode={darkMode}>
      <button onClick={() => openDetails(item)} className={menuItemCls}>
        <i className="bi bi-eye-fill text-blue-500" /><span>Voir détails</span>
      </button>
      <button onClick={() => openEdit(item)} className={menuItemCls}>
        <i className="bi bi-pencil-fill text-yellow-500" /><span>Modifier</span>
      </button>
      <div className={`border-t ${dm('border-gray-700', 'border-gray-100')}`} />
      <button
        onClick={() => activeTab === 'roles' ? handleDeleteRole(item) : handleDeleteDirection(item)}
        className={menuDangerCls}
      >
        <i className="bi bi-trash-fill" /><span>Supprimer</span>
      </button>
    </ActionMenuPortal>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MODALE DÉTAILS
  // ─────────────────────────────────────────────────────────────────────────
  const DetailsModal = () => {
    if (!showDetailsModal || !currentItem) return null;
    const item = currentItem;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
        <div className={`${dm('bg-gray-900 border-gray-800', 'bg-white border-gray-200')} border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
          <div className={`flex items-center justify-between px-6 py-5 border-b ${dm('border-gray-800', 'border-gray-100')}`}>
            <h3 className={`text-lg font-bold ${dm('text-white', 'text-gray-900')}`}>
              Détails {activeTab === 'utilisateurs' ? "de l'utilisateur" : activeTab === 'roles' ? 'du rôle' : 'de la direction'}
            </h3>
            <button onClick={() => setShowDetailsModal(false)} className={`p-2 rounded-lg ${dm('hover:bg-gray-800 text-gray-400', 'hover:bg-gray-100 text-gray-500')}`}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
          <div className="px-6 py-6">
            {activeTab === 'utilisateurs' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0" style={{ backgroundColor: item.couleur }}>
                    {item.initiales}
                  </div>
                  <div>
                    <h4 className={`text-xl font-bold ${dm('text-white', 'text-gray-900')}`}>{item.nom}</h4>
                    <p className={`text-sm ${dm('text-gray-400', 'text-gray-600')}`}>{item.roleName}</p>
                  </div>
                  <StatusBadge active={item.est_actif} labelTrue="Actif" labelFalse="Bloqué" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Email',               value: item.email },
                    { label: 'Direction',            value: item.directionName },
                    { label: 'Référence direction',  value: item.directionCode },
                    { label: 'Dernière connexion',   value: item.dernierConnexion },
                    { label: 'Date de création',     value: item.dateCreation ? new Date(item.dateCreation).toLocaleDateString('fr-FR') : '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${dm('text-gray-500', 'text-gray-500')}`}>{label}</p>
                      <p className={`mt-1 text-sm ${dm('text-gray-200', 'text-gray-800')}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className={`p-4 rounded-xl border ${dm('border-yellow-900/30 bg-yellow-900/10', 'border-yellow-200 bg-yellow-50')}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <i className={`bi bi-shield-lock text-xl ${dm('text-yellow-400', 'text-yellow-600')}`} />
                      <div>
                        <p className={`font-semibold text-sm ${dm('text-yellow-400', 'text-yellow-800')}`}>Sécurité du compte</p>
                        <p className={`text-xs ${dm('text-yellow-500', 'text-yellow-700')}`}>Générer un nouveau mot de passe temporaire</p>
                      </div>
                    </div>
                    <button onClick={() => handleResetPassword(item.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium transition-colors whitespace-nowrap">
                      <i className="bi bi-key" /> Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'roles' && (
              <div className="space-y-5">
                <div>
                  <h4 className={`text-xl font-bold ${dm('text-white', 'text-gray-900')}`}>{item.nom}</h4>
                  <p className={`text-xs mt-1 ${dm('text-gray-400', 'text-gray-500')}`}>Référence : <span className="font-mono">{item.code}</span></p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${dm('text-gray-500', 'text-gray-500')}`}>Niveau d'accès</p>
                    <p className={`mt-1 text-sm ${dm('text-gray-200', 'text-gray-800')}`}>{item.niveauAcces}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${dm('text-gray-500', 'text-gray-500')}`}>Utilisateurs assignés</p>
                    <p className={`mt-1 text-2xl font-bold ${dm('text-white', 'text-gray-900')}`}>{item.nbUtilisateurs}</p>
                  </div>
                </div>
                {item.description && (
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${dm('text-gray-500', 'text-gray-500')}`}>Description</p>
                    <p className={`mt-1 text-sm ${dm('text-gray-200', 'text-gray-800')}`}>{item.description}</p>
                  </div>
                )}
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${dm('text-gray-500', 'text-gray-500')}`}>Statut</p>
                  <StatusBadge active={item.estActif} />
                </div>
              </div>
            )}
            {activeTab === 'directions' && (
              <div className="space-y-5">
                <div>
                  <h4 className={`text-xl font-bold ${dm('text-white', 'text-gray-900')}`}>{item.nom}</h4>
                  <p className={`text-xs mt-1 ${dm('text-gray-400', 'text-gray-500')}`}>Référence : <span className="font-mono">{item.reference || '—'}</span></p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[{ label: 'Véhicules', value: item.nbVehicules }, { label: 'Utilisateurs', value: item.nbUtilisateurs }].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${dm('text-gray-500', 'text-gray-500')}`}>{label}</p>
                      <p className={`mt-1 text-2xl font-bold ${dm('text-white', 'text-gray-900')}`}>{value}</p>
                    </div>
                  ))}
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${dm('text-gray-500', 'text-gray-500')}`}>Statut</p>
                    <div className="mt-2"><StatusBadge active={item.estActif} /></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className={`flex justify-end px-6 py-4 border-t ${dm('border-gray-800', 'border-gray-100')}`}>
            <button onClick={() => setShowDetailsModal(false)} className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${dm('border-gray-700 text-gray-300 hover:bg-gray-800', 'border-gray-300 text-gray-700 hover:bg-gray-50')}`}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MODALE FORMULAIRE
  // ─────────────────────────────────────────────────────────────────────────
  const renderFormModal = (show, onClose, isEdit) => {
    if (!show) return null;

    const title = isEdit
      ? `Modifier ${activeTab === 'utilisateurs' ? "l'utilisateur" : activeTab === 'roles' ? 'le rôle' : 'la direction'}`
      : `Ajouter ${activeTab === 'utilisateurs' ? 'un utilisateur' : activeTab === 'roles' ? 'un rôle' : 'une direction'}`;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className={`${dm('bg-gray-900 border-gray-800', 'bg-white border-gray-200')} border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-5 border-b ${dm('border-gray-800', 'border-gray-100')}`}>
            <h3 className={`text-lg font-bold ${dm('text-white', 'text-gray-900')}`}>{title}</h3>
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${dm('hover:bg-gray-800 text-gray-400', 'hover:bg-gray-100 text-gray-500')}`}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-5">

            {/* ── FORMULAIRE UTILISATEUR ── */}
            {activeTab === 'utilisateurs' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nom complet <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.nom ?? ''}
                      onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))}
                      placeholder="Dupont Jean"
                      className={inputCls}
                      autoComplete="off"
                    />
                    <FieldError name="nom" />
                  </div>
                  <div>
                    <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="email"
                      value={formData.email ?? ''}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      placeholder="jean.dupont@sgs-gabon.com"
                      className={inputCls}
                      autoComplete="off"
                    />
                    <FieldError name="email" />
                  </div>
                  <div>
                    <label className={labelCls}>Rôle <span className="text-red-500">*</span></label>
                    <select
                      value={formData.role_id ?? ''}
                      onChange={e => setFormData(p => ({ ...p, role_id: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">Sélectionner un rôle</option>
                      {rolesData.filter(r => r.estActif).map(r => (
                        <option key={r.id} value={r.id}>{r.nom}</option>
                      ))}
                    </select>
                    <FieldError name="role_id" />
                  </div>
                  <div>
                    <label className={labelCls}>Direction</label>
                    <select
                      value={formData.direction_id ?? ''}
                      onChange={e => setFormData(p => ({ ...p, direction_id: e.target.value }))}
                      className={inputCls}
                    >
                      <option value="">Aucune direction</option>
                      {directionsData.filter(d => d.estActif).map(d => (
                        <option key={d.id} value={d.id}>{d.nom}</option>
                      ))}
                    </select>
                    <FieldError name="direction_id" />
                  </div>
                </div>

                {/* Mot de passe — création uniquement */}
                {!isEdit && (
                  <div>
                    <label className={labelCls}>Mot de passe <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      disabled={generatingPwd}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors mb-3 ${
                        dm('border-indigo-500 text-indigo-300 hover:bg-indigo-900/30 bg-indigo-900/20',
                           'border-indigo-400 text-indigo-700 hover:bg-indigo-50 bg-indigo-50')
                      } disabled:opacity-50`}
                    >
                      {generatingPwd ? <Spinner size="sm" /> : <i className="bi bi-magic text-base" />}
                      <span>{generatingPwd ? 'Génération...' : 'Générer un mot de passe sécurisé'}</span>
                    </button>
                    {formData.mot_de_passe ? (
                      <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg ${dm('bg-gray-800 border border-gray-700', 'bg-gray-100 border border-gray-200')}`}>
                        <span className={`font-mono text-sm tracking-widest ${dm('text-emerald-400', 'text-emerald-700')}`}>
                          {showPassword ? formData.mot_de_passe : '••••••••••••'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setShowPassword(p => !p)} className={`p-1.5 rounded ${dm('text-gray-400 hover:text-gray-200', 'text-gray-500 hover:text-gray-700')}`}>
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(formData.mot_de_passe);
                              showSuccess(darkMode, theme, 'Copié !', 'Mot de passe copié dans le presse-papier.');
                            }}
                            className={`p-1.5 rounded ${dm('text-gray-400 hover:text-gray-200', 'text-gray-500 hover:text-gray-700')}`}
                          >
                            <i className="bi bi-clipboard" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-xs ${dm('text-gray-500', 'text-gray-500')}`}>
                        Cliquez sur le bouton ci-dessus pour générer un mot de passe sécurisé.
                      </p>
                    )}
                    <FieldError name="mot_de_passe" />
                  </div>
                )}
              </>
            )}

            {/* ── FORMULAIRE RÔLE ── */}
            {activeTab === 'roles' && (
              <>
                <div>
                  <label className={labelCls}>Référence <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.code ?? ''}
                    onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                    placeholder="chef_parc"
                    className={inputCls}
                    autoComplete="off"
                  />
                  <p className={`text-xs mt-1 ${dm('text-gray-500', 'text-gray-500')}`}>
                    Sera converti en minuscules avec underscores (ex: chef_parc).
                  </p>
                  <FieldError name="code" />
                </div>
                <div>
                  <label className={labelCls}>Libellé <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.libelle ?? ''}
                    onChange={e => setFormData(p => ({ ...p, libelle: e.target.value }))}
                    placeholder="Chef du Parc"
                    className={inputCls}
                    autoComplete="off"
                  />
                  <FieldError name="libelle" />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={3}
                    value={formData.description ?? ''}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description du rôle..."
                    className={inputCls + ' resize-none'}
                  />
                  <FieldError name="description" />
                </div>
              </>
            )}

            {/* ── FORMULAIRE DIRECTION ── */}
            {activeTab === 'directions' && (
              <>
                <div>
                  <label className={labelCls}>Nom <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.nom ?? ''}
                    onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Direction Générale"
                    className={inputCls}
                    autoComplete="off"
                  />
                  <FieldError name="nom" />
                </div>
                <div>
                  <label className={labelCls}>Référence</label>
                  <input
                    type="text"
                    value={formData.reference ?? ''}
                    onChange={e => setFormData(p => ({ ...p, reference: e.target.value.toUpperCase() }))}
                    placeholder="DG"
                    className={inputCls}
                    autoComplete="off"
                  />
                  <p className={`text-xs mt-1 ${dm('text-gray-500', 'text-gray-500')}`}>
                    {isEdit
                      ? 'Modifiez la référence si nécessaire (sera convertie en MAJUSCULES).'
                      : 'Optionnel. Sera convertie en MAJUSCULES automatiquement.'}
                  </p>
                  <FieldError name="reference" />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-3 px-6 py-5 border-t ${dm('border-gray-800', 'border-gray-100')}`}>
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                dm('border-gray-700 text-gray-300 hover:bg-gray-800', 'border-gray-300 text-gray-700 hover:bg-gray-50')
              }`}
            >
              Annuler
            </button>
            <button
              onClick={isEdit ? handleSubmitEdit : handleSubmitAdd}
              disabled={submitting || (!isEdit && activeTab === 'utilisateurs' && !formData.mot_de_passe)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
            >
              {submitting && <Spinner size="sm" />}
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`${dm('bg-gray-950', 'bg-gray-50')} min-h-screen flex flex-col transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .animate-fade-in { animation: fade-in 0.2s ease; }
        .swal-dark-popup  { border: 1px solid #1e293b !important; border-radius: 16px !important; }
        .swal-light-popup { border: 1px solid #e5e7eb !important; border-radius: 16px !important; }
        .swal-confirm-btn { font-weight: 600 !important; border-radius: 8px !important; padding: 10px 24px !important; font-size: 14px !important; }
        .swal-cancel-btn  { font-weight: 500 !important; border-radius: 8px !important; padding: 10px 20px !important; font-size: 14px !important; }
      `}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile} />

      <main className=" flex-1 transition-all duration-300 pt-24 px-4 pb-8" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '16.25rem' }}>

        {/* ════════════════════════════════════════════════════════════════
            SKELETON PLEINE PAGE : uniquement au premier chargement d'un onglet.
            Les rechargements en arrière-plan (après une action, recherche, filtres)
            ne l'affichent jamais.
        ════════════════════════════════════════════════════════════════ */}
        {loading ? (
          <FullPageSkeleton darkMode={darkMode} />
        ) : (
          <>
            {/* ONGLETS */}
            <div className={`${dm('bg-gray-900 border-gray-800', 'bg-white border-gray-100')} rounded-xl border shadow-sm mb-6 p-2`}>
              <div className="flex gap-2">
                {[
                  { key: 'utilisateurs', icon: 'bi-people-fill', label: 'Utilisateurs', count: usersData.length },
                  { key: 'roles',        icon: 'bi-shield-fill',  label: 'Rôles',        count: rolesData.length },
                  { key: 'directions',   icon: 'bi-building',     label: 'Directions',   count: directionsData.length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setSearchQuery(''); setShowActionMenu(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all text-sm ${
                      activeTab === tab.key ? 'text-white shadow-md' : dm('text-gray-400 hover:bg-gray-800', 'text-gray-600 hover:bg-gray-50')
                    }`}
                    style={activeTab === tab.key ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
                  >
                    <i className={`bi ${tab.icon} text-base`} />
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20 text-white' : dm('bg-gray-800 text-gray-400', 'bg-gray-100 text-gray-600')}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {getStatsCards().map((card, i) => (
                <div key={i} className={`${dm('bg-gray-900 border-gray-800', 'bg-white border-gray-100')} rounded-xl p-5 border shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xs font-medium mb-1 ${dm('text-gray-400', 'text-gray-600')}`}>{card.title}</p>
                      <p className={`text-3xl font-bold ${dm('text-white', 'text-gray-900')}`}>{card.value ?? '—'}</p>
                      <p className={`text-xs mt-1 ${dm('text-gray-500', 'text-gray-500')}`}>{card.subtitle}</p>
                    </div>
                    <div className={`${card.iconBg} ${card.textColor} p-3 rounded-lg`}>
                      <i className={`bi ${card.icon} text-xl`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── TABLE UTILISATEURS ── */}
            {activeTab === 'utilisateurs' && (
              <div className={`${dm('bg-gray-900 border-gray-800', 'bg-white border-gray-100')} rounded-xl border shadow-sm overflow-hidden`}>
                {Toolbar({ count: usersData.length, countLabel: 'utilisateur' })}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={theadStyle}>
                      <tr>
                        <Th>Utilisateur</Th>
                        <Th>Email</Th>
                        <Th>Rôle</Th>
                        <Th>Direction</Th>
                        <Th>Référence</Th>
                        <Th>Statut</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.length === 0 ? (
                        <EmptyState message="Aucun utilisateur trouvé." />
                      ) : usersData.map((user, i) => (
                        <tr key={user.id} style={trStyle(i)}
                          onMouseEnter={e => Object.assign(e.currentTarget.style, trHover)}
                          onMouseLeave={e => Object.assign(e.currentTarget.style, trStyle(i))}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: user.couleur }}>
                                {user.initiales}
                              </div>
                              <div>
                                <p className={`font-semibold text-sm ${dm('text-white', 'text-gray-900')}`}>{user.nom}</p>
                                <p className={`text-xs ${dm('text-gray-400', 'text-gray-500')}`}>{user.dernierConnexion}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`text-sm ${dm('text-gray-300', 'text-gray-700')}`}>{user.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.roleName?.includes('Admin') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              user.roleName?.includes('Chef')  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>{user.roleName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`text-sm ${dm('text-gray-300', 'text-gray-700')}`}>{user.directionName}</p>
                          </td>
                          <td className="px-6 py-4">
                            {user.directionCode && user.directionCode !== '—'
                              ? <span className={`text-sm font-mono ${dm('text-gray-300', 'text-gray-600')}`}>{user.directionCode}</span>
                              : <span className={`text-sm ${dm('text-gray-500', 'text-gray-400')}`}>—</span>
                            }
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge active={user.est_actif} labelTrue="Actif" labelFalse="Bloqué" />
                          </td>
                          <td className="px-6 py-4">
                            {ActionMenuUtilisateur({ menuKey: `user-${user.id}`, item: user })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={`px-6 py-3 border-t ${dm('border-gray-800', 'border-gray-100')}`}>
                  <p className={`text-xs ${dm('text-gray-500', 'text-gray-500')}`}>{usersData.length} utilisateur{usersData.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {/* ── TABLE RÔLES ── */}
            {activeTab === 'roles' && (
              <div className={`${dm('bg-gray-900 border-gray-800', 'bg-white border-gray-100')} rounded-xl border shadow-sm overflow-hidden`}>
                {Toolbar({ count: rolesData.length, countLabel: 'rôle' })}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={theadStyle}>
                      <tr>
                        <Th>Rôle</Th>
                        <Th>Description</Th>
                        <Th>Référence</Th>
                        <Th>Niveau d'accès</Th>
                        <Th>Utilisateurs</Th>
                        <Th>Statut</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rolesData.length === 0 ? (
                        <EmptyState message="Aucun rôle trouvé." />
                      ) : rolesData.map((role, i) => (
                        <tr key={role.id} style={trStyle(i)}
                          onMouseEnter={e => Object.assign(e.currentTarget.style, trHover)}
                          onMouseLeave={e => Object.assign(e.currentTarget.style, trStyle(i))}>
                          <td className="px-6 py-4">
                            <p className={`font-semibold text-sm ${dm('text-white', 'text-gray-900')}`}>{role.nom}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`text-sm ${dm('text-gray-300', 'text-gray-600')}`}>{role.description || '—'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-mono ${dm('text-gray-300', 'text-gray-600')}`}>{role.code}</span>
                          </td>
                          <td className="px-6 py-4"><NiveauBadge niveau={role.niveauAcces} /></td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-bold ${dm('text-white', 'text-gray-900')}`}>{role.nbUtilisateurs}</span>
                          </td>
                          <td className="px-6 py-4"><StatusBadge active={role.estActif} /></td>
                          <td className="px-6 py-4">
                            {ActionMenuSimple({ menuKey: `role-${role.id}`, item: role })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={`px-6 py-3 border-t ${dm('border-gray-800', 'border-gray-100')}`}>
                  <p className={`text-xs ${dm('text-gray-500', 'text-gray-500')}`}>{rolesData.length} rôle{rolesData.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {/* ── TABLE DIRECTIONS ── */}
            {activeTab === 'directions' && (
              <div className={`${dm('bg-gray-900 border-gray-800', 'bg-white border-gray-100')} rounded-xl border shadow-sm overflow-hidden`}>
                {Toolbar({ count: directionsData.length, countLabel: 'direction' })}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={theadStyle}>
                      <tr>
                        <Th>Direction</Th>
                        <Th>Référence</Th>
                        <Th>Véhicules</Th>
                        <Th>Utilisateurs</Th>
                        <Th>Statut</Th>
                        <Th>Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {directionsData.length === 0 ? (
                        <EmptyState message="Aucune direction trouvée." />
                      ) : directionsData.map((dir, i) => (
                        <tr key={dir.id} style={trStyle(i)}
                          onMouseEnter={e => Object.assign(e.currentTarget.style, trHover)}
                          onMouseLeave={e => Object.assign(e.currentTarget.style, trStyle(i))}>
                          <td className="px-6 py-4">
                            <p className={`font-semibold text-sm ${dm('text-white', 'text-gray-900')}`}>{dir.nom}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-mono ${dm('text-gray-300', 'text-gray-600')}`}>{dir.reference || '—'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-bold ${dm('text-white', 'text-gray-900')}`}>{dir.nbVehicules}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-bold ${dm('text-white', 'text-gray-900')}`}>{dir.nbUtilisateurs}</span>
                          </td>
                          <td className="px-6 py-4"><StatusBadge active={dir.estActif} /></td>
                          <td className="px-6 py-4">
                            {ActionMenuSimple({ menuKey: `dir-${dir.id}`, item: dir })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={`px-6 py-3 border-t ${dm('border-gray-800', 'border-gray-100')}`}>
                  <p className={`text-xs ${dm('text-gray-500', 'text-gray-500')}`}>{directionsData.length} direction{directionsData.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
          </>
        )}

      </main>
        <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />
      {/* MODALES */}
      {renderFormModal(showAddModal,  () => { setShowAddModal(false);  setErrors({}); }, false)}
      {renderFormModal(showEditModal, () => { setShowEditModal(false); setErrors({}); }, true)}
      <DetailsModal />
    </div>
  );
};

export default Utilisateurs;