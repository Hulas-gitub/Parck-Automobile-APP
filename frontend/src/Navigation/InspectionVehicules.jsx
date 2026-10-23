import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
import { getFormStyles, getTableStyles, getRowBackgroundColor, PageSkeleton } from '../utils/uniformStyles';

import {
  getReferentiels,
  getInspections,
  createInspection,
  updateInspection,
  deleteInspection,
  getAccessoires,
  createAccessoire,
  updateAccessoire,
  toggleStatutAccessoire,
  deleteAccessoire,
} from '../api/Admin-Axios/Inspectionsvehicules-axios';

// ============================================================================
// INSPECTIONS VÉHICULES
// ─────────────────────────────────────────────────────────────────────────────
//  RAFRAÎCHISSEMENT (même principe que la page Véhicules) :
//  • Après chaque action (créer / modifier / supprimer / activer-désactiver) :
//      1) l'interface est mise à jour IMMÉDIATEMENT (mise à jour locale)
//      2) un rechargement SILENCIEUX (sans skeleton, sans clignotement) est lancé
//         en arrière-plan EN MÊME TEMPS que l'affichage du SweetAlert
//      3) AUCUN window.location.reload()
//  • Le modal de détail reste synchronisé avec la liste rechargée.
//  • Le chargement avec skeleton n'a lieu qu'au 1er affichage / changement d'onglet.
// ============================================================================

const toast = (darkMode, theme) => ({
  fire: (opts) =>
    Swal.fire({
      confirmButtonText: "D'ACCORD",
      confirmButtonColor: theme?.primary || '#3b82f6',
      background: darkMode ? '#1e293b' : '#ffffff',
      color: darkMode ? '#f1f5f9' : '#1e293b',
      ...opts,
    }),
  // Succès : petite alerte auto-fermante. AUCUN rechargement de page.
  success: (title, text) =>
    Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 1400,
      showConfirmButton: false,
      background: darkMode ? '#1e293b' : '#ffffff',
      color: darkMode ? '#f1f5f9' : '#1e293b',
    }),
  error: (title, text) =>
    Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: "D'ACCORD",
      confirmButtonColor: theme?.primary || '#3b82f6',
      background: darkMode ? '#1e293b' : '#ffffff',
      color: darkMode ? '#f1f5f9' : '#1e293b',
    }),
  confirm: (title, text, confirmText = 'Confirmer') =>
    Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: theme?.primary || '#3b82f6',
      background: darkMode ? '#1e293b' : '#ffffff',
      color: darkMode ? '#f1f5f9' : '#1e293b',
    }),
});

const catColor = (cat) => {
  const map = {
    Documents:      'bg-blue-100 text-blue-700',
    Sécurité:       'bg-red-100 text-red-700',
    Équipements:    'bg-purple-100 text-purple-700',
    Mécanique:      'bg-orange-100 text-orange-700',
    Niveaux:        'bg-cyan-100 text-cyan-700',
    Éclairage:      'bg-yellow-100 text-yellow-700',
    'État général': 'bg-pink-100 text-pink-700',
  };
  return map[cat] || 'bg-gray-100 text-gray-700';
};

const statutBadge = (s) =>
  s === 'conforme'     ? 'bg-green-100 text-green-700'  :
  s === 'non_conforme' ? 'bg-orange-100 text-orange-700' :
                         'bg-red-100 text-red-700';

const statutLabel = (s) =>
  s === 'conforme'     ? 'Conforme'       :
  s === 'non_conforme' ? 'Non conforme'   : 'Danger immédiat';

const statutElemBadge = (s) => ({
  OK:         'bg-green-100 text-green-700',
  NOK:        'bg-red-100 text-red-700',
  manquant:   'bg-gray-100 text-gray-600',
  use:        'bg-orange-100 text-orange-700',
  defectueux: 'bg-red-200 text-red-800',
}[s] || 'bg-gray-100 text-gray-600');

// Un accessoire est "actif" sauf si est_actif vaut explicitement false / 0
const isActif = (a) => a.est_actif !== false && a.est_actif !== 0 && a.est_actif !== '0';

const SkeletonRow = ({ cols, darkMode }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className={`h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
             style={{ width: `${60 + Math.random() * 30}%` }} />
      </td>
    ))}
  </tr>
);

const SkeletonCard = ({ darkMode }) => (
  <div className={`rounded-xl p-5 border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
    <div className={`h-3 w-24 rounded animate-pulse mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    <div className={`h-8 w-16 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
  </div>
);

// ─── Composant Pagination ─────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, darkMode, theme, totalItems, pageSize }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left  = currentPage - delta;
  const right = currentPage + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    }
  }

  const withEllipsis = [];
  let prev = null;
  for (const p of pages) {
    if (prev !== null && p - prev > 1) withEllipsis.push('...');
    withEllipsis.push(p);
    prev = p;
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to   = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Affichage de <span className="font-semibold">{from}</span> à <span className="font-semibold">{to}</span> sur <span className="font-semibold">{totalItems}</span> résultat{totalItems > 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed
            ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'}`}>
          <i className="bi bi-chevron-left" />
        </button>

        {withEllipsis.map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} className={`px-2 py-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>…</span>
            : (
              <button key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${currentPage === p
                    ? 'text-white shadow'
                    : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'}`}
                style={currentPage === p ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                {p}
              </button>
            )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed
            ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'}`}>
          <i className="bi bi-chevron-right" />
        </button>
      </div>
    </div>
  );
};

const PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────────────────────
const InspectionVehicules = () => {
  const { theme } = useTheme();

  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; }
    catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {}
  }, [darkMode]);

  const swal = useCallback(() => toast(darkMode, theme), [darkMode, theme]);

  // Toujours la dernière version de swal() (évite une fermeture périmée dans les fetch mémorisés)
  const swalRef = useRef(swal);
  swalRef.current = swal;

  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [activeTab, setActiveTab]                 = useState('inspections');
  const [searchTerm, setSearchTerm]               = useState('');
  const [openMenuId, setOpenMenuId]               = useState(null);

  // ── Pagination ────────────────────────────────────────────────────────────
  const [inspPage, setInspPage] = useState(1);
  const [accPage,  setAccPage]  = useState(1);

  // ── État des données ──────────────────────────────────────────────────────
  const [loading, setLoading]       = useState(true);
  const [loadingAcc, setLoadingAcc] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [inspections, setInspections]   = useState([]);
  const [accessoires, setAccessoires]   = useState([]);
  const [vehicules, setVehicules]       = useState([]);
  const [typesInspection, setTypes]     = useState([]);
  const [stats, setStats]               = useState({ total: 0, conformes: 0, non_conformes: 0, danger: 0 });
  const [accStats, setAccStats]         = useState({ total: 0, actifs: 0, inactifs: 0, categories: 0 });

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showInspModal, setShowInspModal]     = useState(false);
  const [inspModalMode, setInspModalMode]     = useState('create');
  const [selectedInsp, setSelectedInsp]       = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem]           = useState(null);
  const [showAccModal, setShowAccModal]       = useState(false);
  const [accModalMode, setAccModalMode]       = useState('create');
  const [selectedAcc, setSelectedAcc]         = useState(null);

  // ── Formulaires ───────────────────────────────────────────────────────────
  const emptyInsp = {
    vehicule_immatriculation: '', type_inspection_id: '', date_inspection: '',
    km_au_moment_inspection: '', statut_global: 'conforme',
    observations_vehicule: '', nom_verificateurs: '', autres_constats: '', notes: '',
    elements: [],
  };
  const [inspForm, setInspForm] = useState(emptyInsp);

  const emptyAcc = { nom: '', categorie: 'Documents' };
  const [accForm, setAccForm]   = useState(emptyAcc);

  // Seuls les accessoires ACTIFS sont proposés dans le formulaire d'inspection
  const accessoiresActifs = accessoires.filter(isActif);
  const categories = [...new Set(accessoires.map(a => a.categorie))].filter(Boolean);
  const accByCategory = accessoiresActifs.reduce((acc, item) => {
    if (!acc[item.categorie]) acc[item.categorie] = [];
    acc[item.categorie].push(item);
    return acc;
  }, {});

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARGEMENTS (avec mode SILENCIEUX)
  //  • fetch(false) → chargement avec skeleton (1er affichage, changement d'onglet)
  //  • fetch(true)  → rechargement SILENCIEUX : aucun skeleton, aucun clignotement ;
  //                   les nouvelles données remplacent simplement les anciennes.
  // Les reqId évitent qu'une réponse ancienne (plus lente) écrase une plus récente.
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchReferentiels = useCallback(async () => {
    try {
      const res = await getReferentiels();
      setVehicules(res.data.vehicules || []);
      setTypes(res.data.types_inspection || []);
      setAccessoires(res.data.accessoires || []);
    } catch {
      // silencieux
    }
  }, []);

  const inspReqRef = useRef(0);
  const fetchInspections = useCallback(async (silent = false) => {
    const myId = ++inspReqRef.current;
    if (!silent) setLoading(true);
    try {
      const res = await getInspections();
      if (myId !== inspReqRef.current) return;
      setInspections(res.data.data || []);
      setStats(res.data.stats || {});
    } catch (err) {
      if (silent) return; // en mode silencieux : on garde l'affichage actuel, sans message
      const status = err.response?.status;
      if (status >= 500 || !err.response) {
        swalRef.current().error('Erreur serveur', 'Impossible de joindre le serveur.');
      }
      setInspections([]);
      setStats({ total: 0, conformes: 0, non_conformes: 0, danger: 0 });
    } finally {
      if (myId === inspReqRef.current) setLoading(false);
    }
  }, []);

  const accReqRef = useRef(0);
  const fetchAccessoires = useCallback(async (silent = false) => {
    const myId = ++accReqRef.current;
    if (!silent) setLoadingAcc(true);
    try {
      const res = await getAccessoires();
      if (myId !== accReqRef.current) return;
      setAccessoires(res.data.data || []);
      setAccStats(res.data.stats || {});
    } catch (err) {
      if (silent) return;
      const status = err.response?.status;
      if (status >= 500 || !err.response) {
        swalRef.current().error('Erreur serveur', 'Impossible de joindre le serveur.');
      }
      setAccessoires([]);
      setAccStats({ total: 0, actifs: 0, inactifs: 0, categories: 0 });
    } finally {
      if (myId === accReqRef.current) setLoadingAcc(false);
    }
  }, []);

  // Rechargement silencieux en arrière-plan (inspections + accessoires).
  // Volontairement NON attendu : il tourne pendant que le SweetAlert est affiché.
  const refreshSilent = useCallback(() => {
    fetchInspections(true);
    fetchAccessoires(true);
  }, [fetchInspections, fetchAccessoires]);

  useEffect(() => {
    fetchReferentiels();
    fetchInspections();
    // Les statistiques / liste complète des accessoires sont chargées dès le départ
    // (silencieusement) pour que le compteur de l'onglet soit juste.
    fetchAccessoires(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'accessoires') fetchAccessoires();
  }, [activeTab]);

  useEffect(() => { setInspPage(1); }, [searchTerm]);
  useEffect(() => { setAccPage(1);  }, [searchTerm]);

  // Le modal de détail reste synchronisé avec la liste rechargée
  useEffect(() => {
    setDetailItem(d => {
      if (!d) return d;
      const fresh = inspections.find(i => i.id === d.id);
      return fresh && fresh !== d ? fresh : d;
    });
  }, [inspections]);

  useEffect(() => {
    const fn = (e) => { if (openMenuId && !e.target.closest('.action-menu')) setOpenMenuId(null); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [openMenuId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉLÉMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  const toggleElement = (accessoireId) => {
    setInspForm(prev => {
      const exists = prev.elements.find(e => e.accessoire_id === accessoireId);
      if (exists) {
        return { ...prev, elements: prev.elements.filter(e => e.accessoire_id !== accessoireId) };
      }
      return {
        ...prev,
        elements: [...prev.elements, { accessoire_id: accessoireId, statut: 'OK', valeur_relevee: '', commentaire: '' }],
      };
    });
  };

  const updateElement = (accessoireId, field, value) => {
    setInspForm(prev => ({
      ...prev,
      elements: prev.elements.map(e =>
        e.accessoire_id === accessoireId ? { ...e, [field]: value } : e
      ),
    }));
  };

  const isChecked  = (accessoireId) => inspForm.elements.some(e => e.accessoire_id === accessoireId);
  const getElement = (accessoireId) => inspForm.elements.find(e => e.accessoire_id === accessoireId);

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD INSPECTIONS
  //  Ordre pour chaque action réussie :
  //   1) mise à jour locale immédiate
  //   2) rechargement silencieux lancé en arrière-plan (refreshSilent)
  //   3) SweetAlert affiché dans la foulée → les deux se produisent EN MÊME TEMPS
  // ═══════════════════════════════════════════════════════════════════════════
  const openInspModal = (mode, item = null) => {
    setInspModalMode(mode);
    setSelectedInsp(item);
    setOpenMenuId(null);
    if (mode === 'edit' && item) {
      setInspForm({
        vehicule_immatriculation: item.vehicule_immatriculation || '',
        type_inspection_id:       item.type_inspection_id || '',
        date_inspection:          item.date_inspection?.slice(0, 16) || '',
        km_au_moment_inspection:  item.km_au_moment_inspection || '',
        statut_global:            item.statut_global || 'conforme',
        observations_vehicule:    item.observations_vehicule || '',
        nom_verificateurs:        item.nom_verificateurs || '',
        autres_constats:          item.autres_constats || '',
        notes:                    item.notes || '',
        elements: (item.elements || []).map(e => ({
          accessoire_id:  e.accessoire_id,
          statut:         e.statut,
          valeur_relevee: e.valeur_relevee || '',
          commentaire:    e.commentaire || '',
        })),
      });
    } else {
      setInspForm(emptyInsp);
    }
    setShowInspModal(true);
  };

  const closeInspModal = () => {
    setShowInspModal(false);
    setSelectedInsp(null);
    setInspForm(emptyInsp);
  };

  const submitInsp = async (e) => {
    e.preventDefault();
    if (inspForm.elements.length === 0) {
      return swal().error('Validation', 'Sélectionnez au moins un accessoire à inspecter.');
    }
    setSubmitting(true);
    try {
      const isCreate = inspModalMode === 'create';
      if (isCreate) {
        await createInspection(inspForm);
      } else {
        await updateInspection(selectedInsp.id, inspForm);
      }
      closeInspModal();
      refreshSilent();
      swal().success(
        isCreate ? 'Inspection créée !' : 'Inspection mise à jour !',
        isCreate
          ? "L'inspection a été enregistrée avec succès."
          : 'Les modifications ont été sauvegardées.'
      );
    } catch (err) {
      const msg    = err.response?.data?.message || 'Une erreur est survenue.';
      const errors = err.response?.data?.errors;
      const detail = errors ? Object.values(errors).flat().join('\n') : msg;
      swal().error('Erreur', detail);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteInsp = async (id) => {
    const result = await swal().confirm('Supprimer cette inspection ?', 'Cette action est irréversible.', 'Supprimer');
    if (!result.isConfirmed) return;
    setOpenMenuId(null);
    try {
      await deleteInspection(id);
      setInspections(prev => prev.filter(i => i.id !== id));                 // 1) disparition immédiate
      setDetailItem(d => (d && d.id === id ? null : d));
      setShowDetailModal(false);
      refreshSilent();                                                       // 2) resynchronisation silencieuse
      swal().success('Supprimée !', "L'inspection a été supprimée.");        // 3) alerte
    } catch {
      refreshSilent();
      swal().error('Erreur', 'Impossible de supprimer cette inspection.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD ACCESSOIRES
  // ═══════════════════════════════════════════════════════════════════════════
  const openAccModal = (mode, item = null) => {
    setAccModalMode(mode);
    setSelectedAcc(item);
    setOpenMenuId(null);
    setAccForm(mode === 'edit' && item ? { nom: item.nom, categorie: item.categorie } : emptyAcc);
    setShowAccModal(true);
  };

  const closeAccModal = () => {
    setShowAccModal(false);
    setSelectedAcc(null);
    setAccForm(emptyAcc);
  };

  const submitAcc = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isCreate = accModalMode === 'create';
      if (isCreate) {
        await createAccessoire(accForm);
      } else {
        await updateAccessoire(selectedAcc.id, accForm);
        // 1) mise à jour locale immédiate
        setAccessoires(prev => prev.map(a => a.id === selectedAcc.id ? { ...a, ...accForm } : a));
      }
      closeAccModal();
      refreshSilent();
      swal().success(
        isCreate ? 'Accessoire ajouté !' : 'Accessoire modifié !',
        isCreate
          ? 'Il est maintenant disponible dans les inspections.'
          : 'Les modifications ont été enregistrées.'
      );
    } catch (err) {
      swal().error('Erreur', err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatutAcc = async (acc) => {
    try {
      await toggleStatutAccessoire(acc.id);
      // 1) affichage immédiat du nouveau statut
      setAccessoires(prev => prev.map(a => a.id === acc.id ? { ...a, est_actif: !isActif(a) } : a));
      refreshSilent();                                                       // 2) resynchronisation silencieuse
      swal().success(                                                        // 3) alerte
        isActif(acc) ? 'Désactivé' : 'Activé',
        isActif(acc)
          ? `"${acc.nom}" ne s'affichera plus dans les inspections.`
          : `"${acc.nom}" est à nouveau disponible.`
      );
    } catch {
      refreshSilent();
      swal().error('Erreur', 'Impossible de modifier le statut.');
    }
  };

  const deleteAcc = async (acc) => {
    const result = await swal().confirm(
      `Supprimer "${acc.nom}" ?`,
      "S'il est utilisé dans des inspections, il sera simplement désactivé.",
      'Supprimer'
    );
    if (!result.isConfirmed) return;
    setOpenMenuId(null);
    try {
      await deleteAccessoire(acc.id);
      // Le serveur peut soit supprimer, soit simplement désactiver : la resynchronisation
      // silencieuse affichera le résultat réel juste après.
      refreshSilent();
      swal().success('Fait !', "L'accessoire a été traité avec succès.");
    } catch {
      refreshSilent();
      swal().error('Erreur', 'Impossible de supprimer cet accessoire.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTRAGE + PAGINATION
  // ═══════════════════════════════════════════════════════════════════════════
  const filteredInspections = inspections.filter(item => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      item.vehicule_immatriculation?.toLowerCase().includes(s) ||
      item.type_inspection?.toLowerCase().includes(s) ||
      item.inspecteur_nom?.toLowerCase().includes(s) ||
      item.statut_global?.toLowerCase().includes(s)
    );
  });

  const filteredAccessoires = accessoires.filter(a => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return a.nom?.toLowerCase().includes(s) || a.categorie?.toLowerCase().includes(s);
  });

  const inspTotalPages   = Math.max(1, Math.ceil(filteredInspections.length / PAGE_SIZE));
  const inspSafePage     = Math.min(inspPage, inspTotalPages);
  const pagedInspections = filteredInspections.slice((inspSafePage - 1) * PAGE_SIZE, inspSafePage * PAGE_SIZE);

  const accTotalPages   = Math.max(1, Math.ceil(filteredAccessoires.length / PAGE_SIZE));
  const accSafePage     = Math.min(accPage, accTotalPages);
  const pagedAccessoires = filteredAccessoires.slice((accSafePage - 1) * PAGE_SIZE, accSafePage * PAGE_SIZE);

  // ─── Helpers CSS ──────────────────────────────────────────────────────────
  const cardCls  = `${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm`;
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const labelCls = `block text-sm font-semibold mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  const ActionMenu = ({ id, children }) => (
    <div className="relative action-menu inline-block">
      <button onClick={() => setOpenMenuId(openMenuId === id ? null : id)}
        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
        <i className="bi bi-three-dots-vertical" />
      </button>
      {openMenuId === id && (
        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-20 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  );

  const MenuItem = ({ icon, label, color = '', onClick }) => (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm ${color || (darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')} flex items-center gap-2`}>
      <i className={`bi ${icon}`} />{label}
    </button>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex flex-col transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile} />

      <main className="flex-1 transition-all duration-300 pt-24 px-4 pb-6" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '15rem' }}>

        {/* ── ONGLETS ─────────────────────────────────────────────────────── */}
        <div className={`${cardCls} mb-6 p-2 flex gap-2`}>
          {[
            { key: 'inspections', icon: 'bi-clipboard-check', label: 'Inspections véhicules', count: inspections.length },
            { key: 'accessoires', icon: 'bi-grid-3x3-gap',    label: 'Accessoires',            count: accessoires.length },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all
                ${activeTab === tab.key ? 'text-white shadow-md' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
              style={activeTab === tab.key ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
              <i className={`bi ${tab.icon} text-base`} />
              {tab.label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                ${activeTab === tab.key ? 'bg-white/25 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ONGLET INSPECTIONS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'inspections' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} darkMode={darkMode} />)
                : [
                    { label: 'Total',           value: stats.total,         icon: 'bi-list-ul',                color: 'blue'   },
                    { label: 'Conformes',        value: stats.conformes,     icon: 'bi-check-circle',           color: 'green'  },
                    { label: 'Non conformes',    value: stats.non_conformes, icon: 'bi-exclamation-triangle',   color: 'orange' },
                    { label: 'Danger immédiat',  value: stats.danger,        icon: 'bi-shield-fill-exclamation',color: 'red'    },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className={`${cardCls} p-5`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
                          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl bg-${color}-100`}>
                          <i className={`bi ${icon} text-xl text-${color}-600`} />
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>

            <div className={`${cardCls} p-4 mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3`}>
              <div>
                <h2 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Inspections des véhicules</h2>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Suivi des inspections avec vérification des accessoires</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className={`pl-9 pr-4 py-2 rounded-lg border text-sm w-56 focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <button onClick={() => openInspModal('create')}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 shadow"
                  style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                  <i className="bi bi-plus-lg" />Ajouter
                </button>
              </div>
            </div>

            <div className={`${cardCls} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                    <tr>
                      {['Véhicule', "Type d'inspection", 'Nom du vérificateur', 'Date', 'Km', 'Éléments inspectés', 'Anomalies', 'Statut', 'Actions'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={9} darkMode={darkMode} />)
                      : pagedInspections.length === 0
                        ? (
                          <tr><td colSpan="9" className="py-16 text-center">
                            <i className={`bi bi-inbox text-5xl block mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {searchTerm ? 'Aucune inspection ne correspond à votre recherche' : 'Aucune inspection pour le moment'}
                            </p>
                          </td></tr>
                        )
                        : pagedInspections.map((item, idx) => {
                          const bg = getRowBackgroundColor(idx, darkMode);
                          return (
                            <tr key={item.id}
                              style={{ backgroundColor: bg, borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb', transition: 'background-color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}15`}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = bg}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <i className="bi bi-car-front-fill text-blue-500 text-sm" />
                                  <div>
                                    <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.vehicule_immatriculation}</div>
                                    {item.marque && <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.marque} {item.modele}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{item.type_inspection}</span>
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <div className="flex items-center gap-1">
                                  <i className="bi bi-person-circle text-purple-400 text-xs" />
                                  {item.nom_verificateurs || '-'}
                                </div>
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                <div className="text-sm">{new Date(item.date_inspection).toLocaleDateString('fr-FR')}</div>
                                <div className="text-xs text-gray-500">{new Date(item.date_inspection).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {item.km_au_moment_inspection ? `${Number(item.km_au_moment_inspection).toLocaleString()} km` : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1 max-w-[160px]">
                                  {(item.elements || []).slice(0, 2).map(el => (
                                    <span key={el.id} className={`px-1.5 py-0.5 rounded text-xs ${statutElemBadge(el.statut)}`}>{el.accessoire_nom}</span>
                                  ))}
                                  {(item.elements || []).length > 2 && (
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>+{item.elements.length - 2}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.anomalies_detectees
                                  ? <i className="bi bi-exclamation-triangle-fill text-red-500 text-lg" />
                                  : <i className="bi bi-check-circle-fill text-green-500 text-lg" />}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statutBadge(item.statut_global)}`}>{statutLabel(item.statut_global)}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <ActionMenu id={item.id}>
                                  <MenuItem icon="bi-eye text-purple-500" label="Voir détails"
                                    onClick={() => { setDetailItem(item); setShowDetailModal(true); setOpenMenuId(null); }} />
                                  <MenuItem icon="bi-pencil-square text-blue-500" label="Modifier"
                                    onClick={() => openInspModal('edit', item)} />
                                  <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                                  <MenuItem icon="bi-trash3" label="Supprimer"
                                    color={darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}
                                    onClick={() => deleteInsp(item.id)} />
                                </ActionMenu>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
              {!loading && filteredInspections.length > 0 && (
                <Pagination
                  currentPage={inspSafePage}
                  totalPages={inspTotalPages}
                  onPageChange={setInspPage}
                  darkMode={darkMode}
                  theme={theme}
                  totalItems={filteredInspections.length}
                  pageSize={PAGE_SIZE}
                />
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ONGLET ACCESSOIRES
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'accessoires' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {loadingAcc
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} darkMode={darkMode} />)
                : [
                    { label: 'Total',       value: accStats.total,      icon: 'bi-grid-3x3-gap',  color: 'blue'   },
                    { label: 'Actifs',      value: accStats.actifs,     icon: 'bi-check-circle',   color: 'green'  },
                    { label: 'Inactifs',    value: accStats.inactifs,   icon: 'bi-dash-circle',    color: 'gray'   },
                    { label: 'Catégories',  value: accStats.categories, icon: 'bi-tags',           color: 'purple' },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className={`${cardCls} p-5`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
                          <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl bg-${color}-100`}>
                          <i className={`bi ${icon} text-xl text-${color}-600`} />
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>

            <div className={`mb-5 px-4 py-3 rounded-xl border flex items-center gap-3 ${darkMode ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <i className="bi bi-info-circle-fill text-lg flex-shrink-0" />
              <p className="text-sm">Les accessoires créés ici sont automatiquement disponibles dans le formulaire d'inspection.</p>
            </div>

            <div className={`${cardCls} p-4 mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3`}>
              <div>
                <h2 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>Référentiel des accessoires</h2>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gérez les accessoires vérifiables lors d'une inspection</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                  <input type="text" placeholder="Rechercher un accessoire..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className={`pl-9 pr-4 py-2 rounded-lg border text-sm w-64 focus:outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <button onClick={() => openAccModal('create')}
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 shadow"
                  style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                  <i className="bi bi-plus-lg" />Ajouter un accessoire
                </button>
              </div>
            </div>

            <div className={`${cardCls} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                    <tr>
                      {["Nom de l'accessoire", 'Catégorie', 'Statut', 'Utilisé dans', 'Actions'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAcc
                      ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} darkMode={darkMode} />)
                      : pagedAccessoires.length === 0
                        ? (
                          <tr><td colSpan="5" className="py-16 text-center">
                            <i className={`bi bi-inbox text-5xl block mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {searchTerm ? 'Aucun accessoire ne correspond à votre recherche' : 'Aucun accessoire pour le moment'}
                            </p>
                          </td></tr>
                        )
                        : pagedAccessoires.map((acc, idx) => {
                          const bg = getRowBackgroundColor(idx, darkMode);
                          const actif = isActif(acc);
                          return (
                            <tr key={acc.id}
                              style={{ backgroundColor: bg, borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb', transition: 'background-color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}15`}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = bg}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <i className="bi bi-grid-3x3-gap-fill text-blue-500 text-sm flex-shrink-0" />
                                  <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{acc.nom}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${catColor(acc.categorie)}`}>{acc.categorie}</span>
                              </td>
                              <td className="px-4 py-3">
                                {actif
                                  ? <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Actif</span>
                                  : <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Inactif</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>—</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <ActionMenu id={acc.id}>
                                  <MenuItem icon="bi-pencil-square text-blue-500" label="Modifier"
                                    onClick={() => openAccModal('edit', acc)} />
                                  <MenuItem
                                    icon={actif ? 'bi-eye-slash text-orange-500' : 'bi-eye text-green-500'}
                                    label={actif ? 'Désactiver' : 'Activer'}
                                    onClick={() => { setOpenMenuId(null); toggleStatutAcc(acc); }} />
                                  <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                                  <MenuItem icon="bi-trash3" label="Supprimer"
                                    color={darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}
                                    onClick={() => deleteAcc(acc)} />
                                </ActionMenu>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
              {!loadingAcc && filteredAccessoires.length > 0 && (
                <Pagination
                  currentPage={accSafePage}
                  totalPages={accTotalPages}
                  onPageChange={setAccPage}
                  darkMode={darkMode}
                  theme={theme}
                  totalItems={filteredAccessoires.length}
                  pageSize={PAGE_SIZE}
                />
              )}
            </div>
          </>
        )}

      </main>

      {/* ── FOOTER ── */}
      <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — CRÉER / MODIFIER INSPECTION  (plein écran)
      ══════════════════════════════════════════════════════════════════════ */}
      {showInspModal && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Overlay cliquable pour fermer */}
          <div className="fixed inset-0 bg-black/70" onClick={closeInspModal} />

          {/* Fenêtre modale plein écran avec marges */}
          <div
            className={`relative flex flex-col m-3 rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            style={{ flex: 1, minHeight: 0 }}
          >
            {/* ── En-tête ── */}
            <div
              className="flex-shrink-0 px-8 py-5 flex items-center justify-between"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
            >
              <div className="flex items-center gap-3">
                <i className={`bi ${inspModalMode === 'create' ? 'bi-plus-circle' : 'bi-pencil-square'} text-white text-2xl`} />
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {inspModalMode === 'create' ? 'Créer une nouvelle inspection' : "Modifier l'inspection"}
                  </h3>
                  <p className="text-white/70 text-sm mt-0.5">
                    {inspModalMode === 'create'
                      ? 'Remplissez les informations ci-dessous et sélectionnez les accessoires à inspecter'
                      : 'Modifiez les informations et les accessoires inspectés'}
                  </p>
                </div>
              </div>
              <button onClick={closeInspModal} className="p-2 rounded-lg hover:bg-white/20 text-white">
                <i className="bi bi-x-lg text-xl" />
              </button>
            </div>

            {/* ── Corps scrollable ── */}
            <form onSubmit={submitInsp} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

                {/* Infos principales — 3 colonnes sur large */}
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <i className="bi bi-info-circle" />Informations générales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className={labelCls}>Véhicule <span className="text-red-500">*</span></label>
                      <select value={inspForm.vehicule_immatriculation}
                        onChange={e => setInspForm(p => ({ ...p, vehicule_immatriculation: e.target.value }))} required className={inputCls}>
                        <option value="">Sélectionner un véhicule</option>
                        {vehicules.map(v => (
                          <option key={v.immatriculation} value={v.immatriculation}>
                            {v.immatriculation} — {v.marque} {v.modele}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Type d'inspection <span className="text-red-500">*</span></label>
                      <select value={inspForm.type_inspection_id}
                        onChange={e => setInspForm(p => ({ ...p, type_inspection_id: e.target.value }))} required className={inputCls}>
                        <option value="">Sélectionner un type</option>
                        {typesInspection.map(t => <option key={t.id} value={t.id}>{t.libelle}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Date et heure <span className="text-red-500">*</span></label>
                      <input type="datetime-local" value={inspForm.date_inspection}
                        onChange={e => setInspForm(p => ({ ...p, date_inspection: e.target.value }))} required className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Kilométrage</label>
                      <input type="number" value={inspForm.km_au_moment_inspection} placeholder="Ex: 45230"
                        onChange={e => setInspForm(p => ({ ...p, km_au_moment_inspection: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Statut global <span className="text-red-500">*</span></label>
                      <select value={inspForm.statut_global}
                        onChange={e => setInspForm(p => ({ ...p, statut_global: e.target.value }))} required className={inputCls}>
                        <option value="conforme">Conforme</option>
                        <option value="non_conforme">Non conforme</option>
                        <option value="danger_immediat">Danger immédiat</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Vérificateurs</label>
                      <input type="text" value={inspForm.nom_verificateurs} placeholder="Jean Dupont, Marie Martin"
                        onChange={e => setInspForm(p => ({ ...p, nom_verificateurs: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Accessoires */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <i className="bi bi-grid-3x3-gap" />
                      Accessoires inspectés
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold normal-case
                        ${darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        {inspForm.elements.length} sélectionné{inspForm.elements.length > 1 ? 's' : ''}
                      </span>
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <i className="bi bi-info-circle" />Cochez + choisissez le statut
                    </span>
                  </div>
                  <div className={`rounded-xl border p-5 space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    {Object.entries(accByCategory).map(([cat, items]) => (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${catColor(cat)}`}>{cat}</span>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{items.length} élément{items.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {items.map(acc => {
                            const checked = isChecked(acc.id);
                            const elem    = getElement(acc.id);
                            return (
                              <div key={acc.id} className={`rounded-lg border p-3 transition-all
                                ${checked
                                  ? darkMode ? 'bg-blue-900/40 border-blue-500' : 'bg-blue-50 border-blue-300'
                                  : darkMode ? 'bg-gray-700/40 border-gray-600' : 'bg-white border-gray-200'}`}>
                                <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                                  <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleElement(acc.id)} />
                                  <i className={`bi ${checked ? 'bi-check-square-fill text-blue-500' : 'bi-square text-gray-400'} flex-shrink-0 text-base`} />
                                  <span className={`text-xs font-medium leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{acc.nom}</span>
                                </label>
                                {checked && (
                                  <div className="flex gap-1 flex-wrap">
                                    {['OK', 'NOK', 'manquant', 'use', 'defectueux'].map(s => (
                                      <button key={s} type="button"
                                        onClick={() => updateElement(acc.id, 'statut', s)}
                                        className={`px-2 py-0.5 rounded text-xs font-semibold border transition-all
                                          ${elem?.statut === s
                                            ? s === 'OK' ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500'
                                            : darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {checked && elem?.statut !== 'OK' && (
                                  <input type="text" placeholder="Commentaire..." value={elem?.commentaire || ''}
                                    onChange={e => updateElement(acc.id, 'commentaire', e.target.value)}
                                    className={`mt-2 w-full px-2 py-1 rounded text-xs border focus:outline-none
                                      ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-700'}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observations + Autres constats */}
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <i className="bi bi-chat-left-text" />Observations & Constats
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Observations véhicule</label>
                      <textarea rows="4" value={inspForm.observations_vehicule} placeholder="Observations générales..."
                        onChange={e => setInspForm(p => ({ ...p, observations_vehicule: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Autres constats / Préconisations</label>
                      <textarea rows="4" value={inspForm.autres_constats} placeholder="Commentaires additionnels..."
                        onChange={e => setInspForm(p => ({ ...p, autres_constats: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Pied fixe ── */}
              <div className={`flex-shrink-0 px-8 py-4 border-t flex items-center justify-between gap-3 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <span className="text-red-500">*</span> Champs obligatoires
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={closeInspModal}
                    className={`px-6 py-2.5 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-6 py-2.5 rounded-lg text-white font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-60"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                    {submitting
                      ? <><i className="bi bi-arrow-repeat animate-spin" />Enregistrement...</>
                      : <><i className={`bi ${inspModalMode === 'create' ? 'bi-plus-lg' : 'bi-check-lg'}`} />{inspModalMode === 'create' ? "Créer l'inspection" : 'Enregistrer les modifications'}</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — ACCESSOIRE CRUD  (large centré)
      ══════════════════════════════════════════════════════════════════════ */}
      {showAccModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div className="fixed inset-0 bg-black/70" onClick={closeAccModal} />
            <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <div className="px-8 py-5 flex items-center justify-between" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <div className="flex items-center gap-3">
                  <i className={`bi ${accModalMode === 'create' ? 'bi-plus-circle' : 'bi-pencil-square'} text-white text-2xl`} />
                  <div>
                    <h3 className="text-xl font-bold text-white">{accModalMode === 'create' ? 'Ajouter un accessoire' : "Modifier l'accessoire"}</h3>
                    <p className="text-white/70 text-sm mt-0.5">Renseignez le nom et la catégorie de l'accessoire</p>
                  </div>
                </div>
                <button onClick={closeAccModal} className="p-2 rounded-lg hover:bg-white/20 text-white"><i className="bi bi-x-lg text-xl" /></button>
              </div>
              <form onSubmit={submitAcc}>
                <div className="px-8 py-7 space-y-6">
                  <div>
                    <label className={labelCls}>Nom de l'accessoire <span className="text-red-500">*</span></label>
                    <input type="text" value={accForm.nom} required placeholder="Ex: Gilet de sécurité..."
                      onChange={e => setAccForm(p => ({ ...p, nom: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Catégorie <span className="text-red-500">*</span></label>
                    <select value={accForm.categorie} required onChange={e => setAccForm(p => ({ ...p, categorie: e.target.value }))} className={inputCls}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <p className={`text-xs mt-1.5 mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Ou saisir une nouvelle catégorie :</p>
                    <input type="text" value={accForm.categorie} placeholder="Nouvelle catégorie..."
                      onChange={e => setAccForm(p => ({ ...p, categorie: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div className={`px-8 py-4 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                  <button type="button" onClick={closeAccModal}
                    className={`px-6 py-2.5 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-6 py-2.5 rounded-lg text-white font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-60"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                    {submitting
                      ? <><i className="bi bi-arrow-repeat animate-spin" />Enregistrement...</>
                      : <><i className={`bi ${accModalMode === 'create' ? 'bi-plus-lg' : 'bi-check-lg'}`} />{accModalMode === 'create' ? 'Ajouter' : 'Enregistrer'}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — DÉTAIL INSPECTION  (plein écran)
      ══════════════════════════════════════════════════════════════════════ */}
      {showDetailModal && detailItem && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowDetailModal(false)} />

          <div
            className={`relative flex flex-col m-3 rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            style={{ flex: 1, minHeight: 0 }}
          >
            {/* ── En-tête ── */}
            <div
              className="flex-shrink-0 px-8 py-5 flex items-center justify-between"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
            >
              <div className="flex items-center gap-4">
                <i className="bi bi-file-earmark-text text-white text-3xl" />
                <div>
                  <h3 className="text-xl font-bold text-white">Détail de l'inspection</h3>
                  <p className="text-white/70 text-sm mt-0.5">
                    {detailItem.vehicule_immatriculation} — {detailItem.marque} {detailItem.modele} &nbsp;·&nbsp; {new Date(detailItem.date_inspection).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 rounded-lg hover:bg-white/20 text-white">
                <i className="bi bi-x-lg text-xl" />
              </button>
            </div>

            {/* ── Corps scrollable ── */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

              {/* Badges statut */}
              <div className="flex flex-wrap gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${statutBadge(detailItem.statut_global)}`}>
                  {statutLabel(detailItem.statut_global)}
                </span>
                {Number(detailItem.anomalies_detectees) === 1 && (
                  <span className="px-3 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700 flex items-center gap-1">
                    <i className="bi bi-exclamation-triangle-fill" />Anomalies détectées
                  </span>
                )}
              </div>

              {/* Infos générales */}
              <div className={`rounded-xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Informations générales</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Véhicule',      value: `${detailItem.vehicule_immatriculation} — ${detailItem.marque || ''} ${detailItem.modele || ''}`, icon: 'bi-car-front-fill',  color: 'text-blue-500'   },
                    { label: 'Type',           value: detailItem.type_inspection,             icon: 'bi-clipboard-check',  color: 'text-purple-500' },
                    { label: 'Date',           value: new Date(detailItem.date_inspection).toLocaleString('fr-FR'), icon: 'bi-calendar3',       color: 'text-orange-500' },
                    { label: 'Kilométrage',    value: detailItem.km_au_moment_inspection ? `${Number(detailItem.km_au_moment_inspection).toLocaleString()} km` : '-', icon: 'bi-speedometer2', color: 'text-cyan-500' },
                    { label: 'Vérificateurs', value: detailItem.nom_verificateurs || '-',    icon: 'bi-person-check',     color: 'text-green-500'  },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label}>
                      <p className={`text-xs mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                      <div className="flex items-center gap-2">
                        <i className={`bi ${icon} ${color} text-sm flex-shrink-0`} />
                        <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Éléments inspectés */}
              <div className={`rounded-xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Éléments inspectés ({detailItem.elements?.length || 0})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {(detailItem.elements || []).map(el => (
                    <div key={el.id} className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm
                      ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 mt-0.5 ${statutElemBadge(el.statut)}`}>{el.statut}</span>
                      <div>
                        <div className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{el.accessoire_nom}</div>
                        {el.commentaire && <div className="text-xs text-gray-500 mt-1">{el.commentaire}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observations + Autres constats */}
              {(detailItem.observations_vehicule || detailItem.autres_constats) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {detailItem.observations_vehicule && (
                    <div className={`rounded-xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Observations</h4>
                      <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{detailItem.observations_vehicule}</p>
                    </div>
                  )}
                  {detailItem.autres_constats && (
                    <div className={`rounded-xl border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Autres constats</h4>
                      <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{detailItem.autres_constats}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Pied fixe ── */}
            <div className={`flex-shrink-0 px-8 py-4 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <button onClick={() => { setShowDetailModal(false); openInspModal('edit', detailItem); }}
                className="px-6 py-2.5 rounded-lg text-white font-medium text-sm flex items-center gap-2 hover:opacity-90"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <i className="bi bi-pencil-square" />Modifier cette inspection
              </button>
              <button onClick={() => setShowDetailModal(false)}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionVehicules;