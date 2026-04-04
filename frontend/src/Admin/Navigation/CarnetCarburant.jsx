import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {
  getVehiculesCarburant,
  getMissionsDisponibles,
  getCarburant,
  getCarburantDetail,
  getCarburantSimple,
  createCarburant,
  updateCarburant,
  deleteCarburant,
  exportCarburantPdf,
  exportCarburantExcel,
} from '../../api/Admin-Axios/CarnetCarburant-axios';

const MySwal = withReactContent(Swal);

const fmt = (n, dec = 2) =>
  n !== null && n !== undefined
    ? Number(n).toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : '—';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const casBadge = (cas) =>
  cas === 'avec_mission' ? { text: 'Mission', color: 'blue' } : { text: 'Autonome', color: 'gray' };

const STATUT_COLORS = {
  disponible:     { bg: 'bg-green-100',  text: 'text-green-700',  bgDark: 'bg-green-900/40',  textDark: 'text-green-300'  },
  en_mission:     { bg: 'bg-blue-100',   text: 'text-blue-700',   bgDark: 'bg-blue-900/40',   textDark: 'text-blue-300'   },
  en_maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-700', bgDark: 'bg-yellow-900/40', textDark: 'text-yellow-300' },
  immobilise:     { bg: 'bg-red-100',    text: 'text-red-700',    bgDark: 'bg-red-900/40',    textDark: 'text-red-300'    },
};

const CarnetCarburant = () => {
  const { immatriculation: immatFromUrl } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  const fireRef = useRef(null);
  useEffect(() => {
    fireRef.current = (options) => {
      const dm = darkMode; const th = theme;
      const bg = dm ? '#111827' : '#ffffff'; const color = dm ? '#f9fafb' : '#111827';
      const border = dm ? '#1f2937' : '#e5e7eb'; const primary = th?.primary || '#6366f1'; const primaryDk = th?.primaryDark || '#4f46e5';
      return MySwal.fire({
        background: bg, color, confirmButtonColor: primary, cancelButtonColor: dm ? '#374151' : '#6b7280',
        confirmButtonText: "D'ACCORD",
        customClass: { popup: 'swal-themed-popup', title: 'swal-themed-title', htmlContainer: 'swal-themed-html', confirmButton: 'swal-themed-confirm', cancelButton: 'swal-themed-cancel' },
        didOpen: (popup) => { popup.style.setProperty('--swal-bg', bg); popup.style.setProperty('--swal-color', color); popup.style.setProperty('--swal-border', border); popup.style.setProperty('--swal-primary', primary); popup.style.setProperty('--swal-primary-dk', primaryDk); },
        ...options,
      });
    };
  }, [darkMode, theme]);
  
  const fire = useCallback((options) => {
    const defaultOptions = { confirmButtonText: "D'ACCORD" };
    return fireRef.current?.({ ...defaultOptions, ...options });
  }, []);

  // ── Layout ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ── Sélecteur véhicule ──
  const [vehicules,            setVehicules]            = useState([]);
  const [vehiculesLoading,     setVehiculesLoading]     = useState(true);
  const [immatriculation,      setImmatriculation]      = useState(immatFromUrl || '');
  const [vehiculeSelectionne,  setVehiculeSelectionne]  = useState(null);
  const [showVehiculeSelector, setShowVehiculeSelector] = useState(false);
  const [vehiculeSearch,       setVehiculeSearch]       = useState('');

  // ── Données ──
  const [carnets,             setCarnets]             = useState([]);
  const [missionsDisponibles, setMissionsDisponibles] = useState([]);
  const [loading,             setLoading]             = useState(false);

  // ── UI ──
  const [searchQuery,    setSearchQuery]    = useState('');
  const [casFilter,      setCasFilter]      = useState('Tous');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading,  setExportLoading]  = useState({ pdf: false, excel: false });
  const [viewMode,       setViewMode]       = useState('grid'); // 'table' ou 'grid' - grille par défaut

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ── Modals ──
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [showEditModal,    setShowEditModal]    = useState(false);
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentItem,      setCurrentItem]      = useState(null);
  const [detailData,       setDetailData]       = useState(null);
  const [formData,         setFormData]         = useState({});

  // ── Chargement véhicules (une seule fois) ──
  useEffect(() => {
    const load = async () => {
      setVehiculesLoading(true);
      try {
        const data = await getVehiculesCarburant();
        const list = Array.isArray(data) ? data : [];
        setVehicules(list);
        if (immatFromUrl) {
          const found = list.find(v => v.immatriculation === immatFromUrl);
          if (found) setVehiculeSelectionne(found);
        }
      } catch {
        fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger la liste des véhicules.' });
      } finally {
        setVehiculesLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chargement carnets quand immatriculation change ──
  const loadCarnets = useCallback(async () => {
    if (!immatriculation) return;
    setLoading(true);
    try {
      const [carnetsData, missionsData] = await Promise.all([
        getCarburant(immatriculation),
        getMissionsDisponibles(immatriculation),
      ]);
      setCarnets(Array.isArray(carnetsData) ? carnetsData : []);
      setMissionsDisponibles(Array.isArray(missionsData) ? missionsData : []);
    } catch {
      fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger les données carburant.' });
    } finally {
      setLoading(false);
    }
  }, [immatriculation, fire]);

  useEffect(() => {
    if (immatriculation) loadCarnets();
    else { setCarnets([]); setMissionsDisponibles([]); }
  }, [immatriculation, loadCarnets]);

  // Reset page quand filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, casFilter]);

  // Fermer menus clic extérieur
  useEffect(() => {
    const h = () => { setShowActionMenu(null); setShowFilterMenu(false); setShowExportMenu(false); setShowVehiculeSelector(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  // ── Sélection véhicule ──
  const handleSelectVehicule = (v) => {
    setVehiculeSelectionne(v);
    setImmatriculation(v.immatriculation);
    setShowVehiculeSelector(false);
    setVehiculeSearch('');
    setCarnets([]);
    setSearchQuery('');
    setCasFilter('Tous');
    setCurrentPage(1);
  };

  const vehiculesFiltres = vehicules.filter(v => {
    const q = vehiculeSearch.toLowerCase();
    return v.immatriculation.toLowerCase().includes(q) || (v.marque || '').toLowerCase().includes(q) || (v.modele || '').toLowerCase().includes(q) || (v.statut || '').toLowerCase().includes(q);
  });

  // ── Stats ──
  const stats = React.useMemo(() => ({
    total:       carnets.length,
    avecMission: carnets.filter(c => c.cas === 'avec_mission').length,
    sansMission: carnets.filter(c => c.cas === 'sans_mission').length,
    totalLitres: carnets.reduce((s, c) => s + (parseFloat(c.litres) || 0), 0),
    totalCout:   carnets.reduce((s, c) => s + (parseFloat(c.cout_total) || 0), 0),
  }), [carnets]);

  // ── Filtrage ──
  const filtered = carnets.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      ((c.station || '').toLowerCase().includes(q) || (c.reference_mission || '').toLowerCase().includes(q) || (c.mission_destination || '').toLowerCase().includes(q) || (c.chauffeur_nom || '').toLowerCase().includes(q) || (c.date_plein || '').includes(q)) &&
      (casFilter === 'Tous' || (casFilter === 'avec_mission' && c.cas === 'avec_mission') || (casFilter === 'sans_mission' && c.cas === 'sans_mission'))
    );
  });

  // ── Pagination logic ──
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // ── Validation des champs (messages en français) ──
  const validateForm = (data, isEdit = false) => {
    const errors = [];
    if (!data.date_plein) errors.push('La date du plein est obligatoire.');
    if (!data.litres || parseFloat(data.litres) <= 0) errors.push('Le nombre de litres est obligatoire et doit être supérieur à 0.');
    if (!isEdit && !data.mission_id && (!data.prix_unitaire || parseFloat(data.prix_unitaire) <= 0)) {
      errors.push('Pour un plein sans mission, le prix unitaire est obligatoire.');
    }
    return errors;
  };

  // ── CRUD ──
  const handleAdd = async (localData) => {
    const errors = validateForm(localData, false);
    if (errors.length > 0) {
      fire({ icon: 'error', title: 'Formulaire incomplet', text: errors.join('\n') });
      return;
    }
    try {
      await createCarburant(immatriculation, { mission_id: localData.mission_id || null, date_plein: localData.date_plein, station: localData.station || null, litres: localData.litres, prix_unitaire: localData.prix_unitaire || null, kilometrage: localData.kilometrage || null, notes: localData.notes || null });
      setShowAddModal(false); setFormData({});
      await loadCarnets();
      setCurrentPage(1);
      fire({ icon: 'success', title: 'Succès !', text: 'Plein ajouté avec succès.', timer: 2000, showConfirmButton: false });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      fire({ icon: 'error', title: 'Erreur', text: errors ? Object.values(errors).flat().join('\n') : (err?.response?.data?.message || 'Une erreur est survenue lors de l\'ajout.') });
    }
  };

  const handleEdit = async (localData) => {
    const errors = validateForm(localData, true);
    if (errors.length > 0) {
      fire({ icon: 'error', title: 'Formulaire incomplet', text: errors.join('\n') });
      return;
    }
    try {
      const payload = {};
      if (localData.mission_id    !== undefined) payload.mission_id    = localData.mission_id    || null;
      if (localData.date_plein)                  payload.date_plein    = localData.date_plein;
      if (localData.station       !== undefined) payload.station       = localData.station       || null;
      if (localData.litres)                      payload.litres        = localData.litres;
      if (localData.prix_unitaire !== undefined) payload.prix_unitaire = localData.prix_unitaire || null;
      if (localData.kilometrage   !== undefined) payload.kilometrage   = localData.kilometrage   || null;
      if (localData.notes         !== undefined) payload.notes         = localData.notes         || null;
      await updateCarburant(immatriculation, currentItem.id, payload);
      setShowEditModal(false); setFormData({}); setCurrentItem(null);
      await loadCarnets();
      fire({ icon: 'success', title: 'Modifié !', text: 'Plein mis à jour avec succès.', timer: 2000, showConfirmButton: false });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      fire({ icon: 'error', title: 'Erreur', text: errors ? Object.values(errors).flat().join('\n') : (err?.response?.data?.message || 'Une erreur est survenue lors de la modification.') });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCarburant(immatriculation, currentItem.id);
      setShowDeleteModal(false); setCurrentItem(null);
      await loadCarnets();
      setCurrentPage(1);
      fire({ icon: 'success', title: 'Supprimé !', text: 'Le plein a été supprimé avec succès.', timer: 2000, showConfirmButton: false });
    } catch (err) {
      fire({ icon: 'error', title: 'Erreur', text: err?.response?.data?.message || 'Impossible de supprimer ce plein.' });
    }
  };

  // SweetAlert pour confirmation suppression (avec thème)
  const confirmDelete = (item) => {
    const th = theme;
    MySwal.fire({
      title: 'Confirmation de suppression',
      text: `Supprimer le plein du ${fmtDate(item?.date_plein)}${item?.station ? ` à ${item.station}` : ''} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: th?.primary || '#6366f1',
      cancelButtonColor: darkMode ? '#374151' : '#6b7280',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      background: darkMode ? '#111827' : '#ffffff',
      color: darkMode ? '#f9fafb' : '#111827',
    }).then((result) => {
      if (result.isConfirmed) {
        setCurrentItem(item);
        handleDelete();
      }
    });
  };

  const handleViewDetail = async (item) => {
    try {
      const detail = await getCarburantDetail(immatriculation, item.id);
      setDetailData(detail); setCurrentItem(item); setShowDetailsModal(true); setShowActionMenu(null);
    } catch { fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger le détail.' }); }
  };

  const handleOpenEdit = async (item) => {
    try {
      const simple = await getCarburantSimple(immatriculation, item.id);
      setCurrentItem(item);
      setFormData({
        mission_id:    simple.mission_id    != null ? String(simple.mission_id)    : '',
        date_plein:    simple.date_plein    || '',
        station:       simple.station       || '',
        litres:        simple.litres        != null ? String(simple.litres)        : '',
        prix_unitaire: simple.prix_unitaire != null ? String(simple.prix_unitaire) : '',
        kilometrage:   simple.kilometrage   != null ? String(simple.kilometrage)   : '',
        notes:         simple.notes         || '',
      });
      setShowEditModal(true); setShowActionMenu(null);
    } catch { fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger les données.' }); }
  };

  // ── Export SANS dates ──
  const handleExportPdf = async () => {
    setExportLoading(p => ({ ...p, pdf: true }));
    try {
      await exportCarburantPdf(immatriculation, {});
      fire({ icon: 'success', title: 'PDF téléchargé !', text: 'L\'export PDF a été généré avec succès.', timer: 1500, showConfirmButton: false });
    } catch { fire({ icon: 'error', title: 'Erreur', text: 'Impossible de générer le PDF.' }); }
    finally { setExportLoading(p => ({ ...p, pdf: false })); setShowExportMenu(false); }
  };

  const handleExportExcel = async () => {
    setExportLoading(p => ({ ...p, excel: true }));
    try {
      await exportCarburantExcel(immatriculation, {});
      fire({ icon: 'success', title: 'Excel téléchargé !', text: 'L\'export Excel a été généré avec succès.', timer: 1500, showConfirmButton: false });
    } catch { fire({ icon: 'error', title: 'Erreur', text: 'Impossible de générer le fichier Excel.' }); }
    finally { setExportLoading(p => ({ ...p, excel: false })); setShowExportMenu(false); }
  };

  // ── Composant Pagination ──
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    };

    return (
      <div className={`flex items-center justify-between flex-wrap gap-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Lignes par page :</span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className={`px-2 py-1 rounded-lg border text-sm font-bold ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">
            {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filtered.length)} sur {filtered.length}
          </span>
          
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                currentPage === page
                  ? 'text-white'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={currentPage === page ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  };

  // ── Modal Formulaire ──
  const FormModal = ({ show, onClose, title, onSubmit, initialData }) => {
    const [local, setLocal] = useState(initialData || {});
    const [missionSelectionnee, setMissionSelectionnee] = useState(null);

    useEffect(() => { setLocal(initialData || {}); }, [show, initialData]);
    useEffect(() => {
      if (local.mission_id) { const m = missionsDisponibles.find(m => String(m.id) === String(local.mission_id)); setMissionSelectionnee(m || null); }
      else setMissionSelectionnee(null);
    }, [local.mission_id]);

    if (!show) return null;
    const field = (label, key, type = 'text', required = false, placeholder = '') => (
      <div>
        <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{label} {required && <span className="text-red-500">*</span>}</label>
        <input type={type} value={local[key] || ''} onChange={e => setLocal({ ...local, [key]: e.target.value })} placeholder={placeholder}
          className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2`} style={{ '--tw-ring-color': theme.primary }} />
      </div>
    );
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><i className={`bi bi-x-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Mission <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optionnelle — CAS 1)</span></label>
              <select value={local.mission_id || ''} onChange={e => setLocal({ ...local, mission_id: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2`}>
                <option value="">— Sans mission (CAS 2) —</option>
                {missionsDisponibles.map(m => (<option key={m.id} value={m.id}>{m.label} [{m.statut}]</option>))}
              </select>
            </div>
            {missionSelectionnee && (
              <div className={`rounded-lg p-4 border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}><i className="bi bi-info-circle me-1"></i>Infos mission</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Destination :</span> <strong className={darkMode ? 'text-white' : ''}>{missionSelectionnee.destination || '—'}</strong></div>
                  <div><span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Type :</span> <strong className={darkMode ? 'text-white' : ''}>{missionSelectionnee.type_mission || '—'}</strong></div>
                  <div><span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Carburant :</span> <strong className={darkMode ? 'text-white' : ''}>{fmt(missionSelectionnee.carburant_consomme, 2)} L</strong></div>
                  <div><span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Coût :</span> <strong className={darkMode ? 'text-white' : ''}>{fmt(missionSelectionnee.cout_carburant, 0)} FCFA</strong></div>
                  {missionSelectionnee.chauffeur && (<div className="col-span-2"><span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Chauffeur :</span> <strong className={darkMode ? 'text-white' : ''}>{missionSelectionnee.chauffeur.nom}</strong></div>)}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {field('Date du plein', 'date_plein', 'date', true)}
              {field('Station', 'station', 'text', false, 'Ex: Total Owendo')}
              {field('Litres', 'litres', 'number', true, '0.00')}
              {field('Prix unitaire (FCFA/L)', 'prix_unitaire', 'number', false, '0.00')}
              {field('Kilométrage au plein', 'kilometrage', 'number', false, '0')}
            </div>
            <div>
              <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Notes</label>
              <textarea value={local.notes || ''} onChange={e => setLocal({ ...local, notes: e.target.value })} rows={3} placeholder="Observations éventuelles..."
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2`} />
            </div>
            {!local.mission_id && local.litres && local.prix_unitaire && (
              <div className={`rounded-lg p-3 border ${darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                <p className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}><i className="bi bi-calculator me-1"></i>Coût calculé (CAS 2) : <strong>{fmt(parseFloat(local.litres) * parseFloat(local.prix_unitaire), 0)} FCFA</strong></p>
              </div>
            )}
          </div>
          <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end gap-3`}>
            <button onClick={onClose} className={`px-6 py-2 rounded-lg border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Annuler</button>
            <button onClick={() => onSubmit(local)} className="px-6 py-2 rounded-lg text-white font-bold hover:opacity-90" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>{currentItem ? 'Modifier' : 'Ajouter'}</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Modal Détails TRÈS GRAND format ──
  const DetailsModal = ({ show, onClose }) => {
    if (!show || !detailData) return null;
    const d = detailData; const cb = d.carburant; const v = d.vehicule; const m = d.mission; const ch = d.chauffeur; const avecMission = d.cas === 'avec_mission';
    const Row = ({ label, value }) => (
      <div className="bg-opacity-30 rounded-lg p-3" style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
        <label className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-500'} block mb-1`}>{label}</label>
        <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} text-sm`}>{value || '—'}</p>
      </div>
    );
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-[98vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] 2xl:max-w-[80vw] max-h-[95vh] overflow-y-auto`}>
          <div className={`p-4 sm:p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between sticky top-0 bg-inherit z-10`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-droplet-fill text-white"></i></div>
              <div>
                <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Détail du plein — {fmtDate(cb.date_plein)}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${avecMission ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>{avecMission ? 'Avec Mission' : 'Autonome'}</span>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><i className={`bi bi-x-lg text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i></button>
          </div>
          <div className="p-4 sm:p-6 space-y-6">
            <div>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-car-front me-2"></i>Véhicule</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Row label="Immatriculation" value={v.immatriculation} />
                <Row label="Marque / Modèle" value={`${v.marque || ''} ${v.modele || ''}`} />
                <Row label="Catégorie" value={v.categorie} />
                <Row label="Km actuel" value={v.kilometrage ? `${Number(v.kilometrage).toLocaleString('fr-FR')} km` : null} />
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-fuel-pump me-2"></i>Carburant</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Row label="Date du plein" value={fmtDate(cb.date_plein)} />
                <Row label="Station" value={cb.station} />
                <Row label="Litres" value={cb.litres ? `${fmt(cb.litres, 2)} L` : null} />
                <Row label="Prix unitaire" value={cb.prix_unitaire ? `${fmt(cb.prix_unitaire, 2)} FCFA/L` : null} />
                <Row label="Coût total" value={cb.cout_total ? `${fmt(cb.cout_total, 0)} FCFA` : null} />
                <Row label="Km au plein" value={cb.kilometrage_au_plein ? `${Number(cb.kilometrage_au_plein).toLocaleString('fr-FR')} km` : null} />

                {!avecMission && <Row label="Coût calculé (CAS 2)" value={cb.consommation_calculee ? `${fmt(cb.consommation_calculee, 0)} FCFA` : null} />}
                <Row label="Notes" value={cb.notes} />
              </div>
            </div>
            {avecMission && m && (
              <div className={`rounded-xl p-4 border ${darkMode ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}><i className="bi bi-map me-2"></i>Mission</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <Row label="Référence" value={m.reference_mission} />
                  <Row label="Destination" value={m.destination} />
                  <Row label="Type" value={m.type_mission} />
                  <Row label="Statut" value={m.statut} />
                  <Row label="Départ prévu" value={fmtDate(m.date_depart_prevue)} />
                  <Row label="Départ réel" value={fmtDate(m.date_depart_reelle)} />
                  <Row label="Retour réel" value={fmtDate(m.date_retour_reelle)} />
                  <Row label="Km départ" value={m.km_depart ? `${Number(m.km_depart).toLocaleString('fr-FR')} km` : null} />
                  <Row label="Km retour" value={m.km_retour ? `${Number(m.km_retour).toLocaleString('fr-FR')} km` : null} />
                  <Row label="Carburant mission" value={m.carburant_consomme ? `${fmt(m.carburant_consomme, 2)} L` : null} />
                  <Row label="Coût mission" value={m.cout_carburant ? `${fmt(m.cout_carburant, 0)} FCFA` : null} />
                </div>
              </div>
            )}
            {avecMission && ch && (
              <div>
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-person-badge me-2"></i>Chauffeur</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Row label="Nom" value={ch.nom} />
                  <Row label="Email" value={ch.email} />
                  <Row label="Rôle" value={ch.role} />
                </div>
              </div>
            )}
          </div>
          <div className={`p-4 sm:p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end sticky bottom-0 bg-inherit`}>
            <button onClick={onClose} className={`px-6 py-2 rounded-lg border font-bold ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Fermer</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Composant Carte pour la vue grille ──
  const CarburantCard = ({ item, onView, onEdit, onDelete }) => {
    const b = casBadge(item.cas);
    return (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
        {/* En-tête de la carte */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${b.color === 'blue' ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>
              {b.text}
            </span>
            <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{fmtDate(item.date_plein)}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onView(item)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Voir détails">
              <i className="bi bi-eye-fill text-blue-500 text-sm"></i>
            </button>
            <button onClick={() => onEdit(item)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Modifier">
              <i className="bi bi-pencil-fill text-yellow-500 text-sm"></i>
            </button>
            <button onClick={() => onDelete(item)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Supprimer">
              <i className="bi bi-trash-fill text-red-500 text-sm"></i>
            </button>
          </div>
        </div>
        {/* Corps de la carte */}
        <div className="p-4 space-y-3">
          <div>
            <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Station</p>
            <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.station || '—'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Litres</p>
              <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fmt(item.litres, 2)} L</p>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Coût total</p>
              <p className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{item.cout_total ? `${fmt(item.cout_total, 0)} FCFA` : '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Prix/L</p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.prix_unitaire ? `${fmt(item.prix_unitaire, 0)} F` : '—'}</p>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Kilométrage</p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.kilometrage ? `${Number(item.kilometrage).toLocaleString('fr-FR')} km` : '—'}</p>
            </div>
          </div>
          {item.cas === 'avec_mission' && (
            <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Mission / Chauffeur</p>
              <p className={`text-sm font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>{item.reference_mission || '—'}</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.chauffeur_nom ? `Chauffeur: ${item.chauffeur_nom}` : ''}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── RENDER ──
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <style>{`.swal-themed-popup{border-radius:1rem!important;border:1px solid var(--swal-border)!important}.swal-themed-title{color:var(--swal-color)!important;font-size:1.1rem!important}.swal-themed-html{color:var(--swal-color)!important}.swal-themed-confirm{background:linear-gradient(to right,var(--swal-primary),var(--swal-primary-dk))!important;border:none!important;border-radius:.5rem!important}.swal-themed-cancel{border-radius:.5rem!important}`}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} showNotifications={showNotifications} setShowNotifications={setShowNotifications} showProfile={showProfile} setShowProfile={setShowProfile} />

      <main className="transition-all duration-300 pt-24 px-6 pb-6" style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}>

        {/* ── SÉLECTEUR DE VÉHICULE ── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-5 mb-6`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <i className={`bi bi-car-front-fill text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Véhicule</span>
            </div>

            <div className="flex-1 max-w-md relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowVehiculeSelector(p => !p)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'} transition-colors`}>
                {vehiculesLoading ? (
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Chargement...</span>
                ) : vehiculeSelectionne ? (
                  <span className="flex items-center gap-2">
                    <span className="font-bold">{vehiculeSelectionne.immatriculation}</span>
                    <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>—</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{vehiculeSelectionne.marque} {vehiculeSelectionne.modele}</span>
                  </span>
                ) : (
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-400'}>Sélectionnez un véhicule...</span>
                )}
                <i className={`bi bi-chevron-${showVehiculeSelector ? 'up' : 'down'} text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
              </button>

              {showVehiculeSelector && (
                <div className={`absolute top-full left-0 mt-2 w-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-2xl z-50 overflow-hidden`}>
                  <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="relative">
                      <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
                      <input type="text" placeholder="Rechercher..." value={vehiculeSearch} onChange={e => setVehiculeSearch(e.target.value)} autoFocus
                        className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-900 text-white border border-gray-700' : 'bg-gray-50 text-gray-900 border border-gray-200'} focus:outline-none`} />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {vehiculesFiltres.length === 0 ? (
                      <div className={`py-6 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun véhicule trouvé</div>
                    ) : vehiculesFiltres.map(v => {
                      const sc = STATUT_COLORS[v.statut] || STATUT_COLORS.disponible;
                      const isSelected = v.immatriculation === immatriculation;
                      return (
                        <button key={v.immatriculation} onClick={() => handleSelectVehicule(v)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-50') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')}`}>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <i className={`bi bi-car-front ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{v.immatriculation}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${darkMode ? sc.bgDark + ' ' + sc.textDark : sc.bg + ' ' + sc.text}`}>{v.statut?.replace('_', ' ')}</span>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{v.marque} {v.modele} · {Number(v.kilometrage).toLocaleString('fr-FR')} km{v.nb_pleins > 0 ? ` · ${v.nb_pleins} plein${v.nb_pleins > 1 ? 's' : ''}` : ''}</p>
                          </div>
                          {isSelected && <i className="bi bi-check2 text-blue-500 flex-shrink-0"></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {vehiculeSelectionne && (
              <div className="flex items-center gap-4 ml-auto flex-wrap">
                {(() => { const sc = STATUT_COLORS[vehiculeSelectionne.statut] || STATUT_COLORS.disponible; return (<span className={`text-xs px-3 py-1 rounded-full font-bold ${darkMode ? sc.bgDark + ' ' + sc.textDark : sc.bg + ' ' + sc.text}`}>{vehiculeSelectionne.statut?.replace('_', ' ')}</span>); })()}
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-speedometer2 me-1"></i>{Number(vehiculeSelectionne.kilometrage).toLocaleString('fr-FR')} km</span>
                {vehiculeSelectionne.total_cout > 0 && (<span className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}><i className="bi bi-cash me-1"></i>{fmt(vehiculeSelectionne.total_cout, 0)} FCFA total</span>)}
              </div>
            )}
          </div>
        </div>

        {/* ── Contenu ── */}
        {!immatriculation ? (
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm`}>
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}22, ${theme.primaryDark}22)` }}>
                <i className="bi bi-fuel-pump text-4xl" style={{ color: theme.primary }}></i>
              </div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sélectionnez un véhicule</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center max-w-sm`}>Choisissez un véhicule dans le sélecteur ci-dessus pour consulter ou saisir ses données carburant.</p>
              <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{vehicules.length} véhicule{vehicules.length > 1 ? 's' : ''} disponible{vehicules.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats avec hauteur réduite */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { title: 'Total Pleins',  value: stats.total+'',               subtitle: 'enregistrements',    icon: 'bi-droplet-fill',   iconBg: darkMode?'bg-blue-800':'bg-blue-100',   textColor: darkMode?'text-blue-400':'text-blue-600'   },
                { title: 'Total Litres',  value: fmt(stats.totalLitres,1)+' L', subtitle: 'consommés',          icon: 'bi-fuel-pump-fill', iconBg: darkMode?'bg-green-800':'bg-green-100',  textColor: darkMode?'text-green-400':'text-green-600'  },
                { title: 'Coût Total',    value: fmt(stats.totalCout,0)+' FCFA',subtitle: 'dépenses carburant', icon: 'bi-cash-stack',     iconBg: darkMode?'bg-yellow-800':'bg-yellow-100',textColor: darkMode?'text-yellow-400':'text-yellow-600' },
                { title: 'Avec Mission',  value: stats.avecMission+'',          subtitle: `dont ${stats.sansMission} autonomes`,icon:'bi-map-fill',iconBg:darkMode?'bg-purple-800':'bg-purple-100',textColor:darkMode?'text-purple-400':'text-purple-600'},
              ].map((card, idx) => (
                <div key={idx} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-4 border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{card.title}</p>
                      <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{card.value}</h3>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{card.subtitle}</p>
                    </div>
                    <div className={`${card.iconBg} ${card.textColor} p-2 rounded-lg group-hover:scale-110 transition-transform`}><i className={card.icon} style={{ fontSize: '1.25rem' }}></i></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Barre d'outils avec bouton de changement de vue */}
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden mb-6`}>
              <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Carnet de Carburant — {immatriculation}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{filtered.length} plein{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
                      <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className={`pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 w-52`} style={{ '--tw-ring-color': theme.primary }} />
                    </div>
                    
                    {/* Bouton de changement de vue */}
                    <div className="flex items-center gap-1 p-1 rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'table' ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}
                        title="Vue tableau"
                      >
                        <i className="bi bi-table me-1"></i> Tableau
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'grid' ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900') : (darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}
                        title="Vue grille"
                      >
                        <i className="bi bi-grid-3x3-gap-fill me-1"></i> Grille
                      </button>
                    </div>

                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setShowFilterMenu(p => !p)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}><i className="bi bi-funnel"></i><span className="text-sm">Filtres</span></button>
                      {showFilterMenu && (
                        <div className={`absolute right-0 mt-2 w-56 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 p-4`}>
                          <label className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>Type</label>
                          <select value={casFilter} onChange={e => setCasFilter(e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                            <option value="Tous">Tous</option><option value="avec_mission">Avec mission</option><option value="sans_mission">Sans mission</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setShowExportMenu(p => !p)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}><i className="bi bi-download"></i><span className="text-sm">Exporter</span></button>
                      {showExportMenu && (
                        <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 p-4 space-y-3`}>
                          <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Export des données du tableau</p>
                          <div className="flex gap-2">
                            <button onClick={handleExportPdf} disabled={exportLoading.pdf} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold disabled:opacity-60">{exportLoading.pdf ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className="bi bi-file-pdf"></i>} PDF</button>
                            <button onClick={handleExportExcel} disabled={exportLoading.excel} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold disabled:opacity-60">{exportLoading.excel ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className="bi bi-file-excel"></i>} Excel</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={() => { setFormData({}); setCurrentItem(null); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 shadow-md" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                      <i className="bi bi-plus-lg"></i><span>Ajouter un plein</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Contenu principal : Tableau OU Grille avec données paginées */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${theme.primary} transparent transparent transparent` }}></div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chargement...</p>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <i className={`bi bi-droplet text-5xl ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}></i>
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun plein de carburant enregistré</p>
                  </div>
                </div>
              ) : viewMode === 'table' ? (
                /* VUE TABLEAU */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                      <tr>
                        {['Type','Date / Station','Litres','Prix/L','Coût Total','Kilométrage','Mission / Chauffeur','Actions'].map(h => (
                          <th key={h} className="px-5 py-4 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((c, index) => {
                        const b = casBadge(c.cas);
                        return (
                          <tr key={c.id}
                            style={{ backgroundColor: index%2===0?(darkMode?'#1a2535':'#eef2ff'):(darkMode?'#1c1f2b':'#f3f4f6'), borderBottom: darkMode?'1px solid #1e293b':'1px solid #e5e7eb', transition:'background-color 0.15s ease' }}
                            onMouseEnter={e=>e.currentTarget.style.backgroundColor=darkMode?`${theme.primary}30`:`${theme.primary}18`}
                            onMouseLeave={e=>e.currentTarget.style.backgroundColor=index%2===0?(darkMode?'#1a2535':'#eef2ff'):(darkMode?'#1c1f2b':'#f3f4f6')}
                          >
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${b.color==='blue'?(darkMode?'bg-blue-900/40 text-blue-300':'bg-blue-100 text-blue-700'):(darkMode?'bg-gray-800 text-gray-300':'bg-gray-100 text-gray-700')}`}>{b.text}</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><p className={`font-bold text-sm ${darkMode?'text-white':'text-gray-900'}`}>{fmtDate(c.date_plein)}</p><p className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{c.station||'—'}</p></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`font-bold ${darkMode?'text-white':'text-gray-900'}`}>{fmt(c.litres,2)} L</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{c.prix_unitaire?`${fmt(c.prix_unitaire,0)} F`:'—'}</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`font-bold text-sm ${darkMode?'text-green-400':'text-green-600'}`}>{c.cout_total?`${fmt(c.cout_total,0)} FCFA`:'—'}</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{c.kilometrage?`${Number(c.kilometrage).toLocaleString('fr-FR')} km`:'—'}</span></td>

                            <td className="px-5 py-4">{c.cas==='avec_mission'?(<div><p className={`text-sm font-bold ${darkMode?'text-blue-300':'text-blue-600'}`}>{c.reference_mission||'—'}</p><p className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{c.mission_destination||''}{c.chauffeur_nom?` · ${c.chauffeur_nom}`:''}</p></div>):(<span className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>—</span>)}</td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="relative" onClick={e=>e.stopPropagation()}>
                                <button onClick={()=>setShowActionMenu(showActionMenu===c.id?null:c.id)} className={`p-2 rounded-lg ${darkMode?'hover:bg-gray-700':'hover:bg-gray-100'}`}><i className={`bi bi-three-dots-vertical ${darkMode?'text-gray-400':'text-gray-600'}`}></i></button>
                                {showActionMenu===c.id && (
                                  <div className={`absolute right-0 mt-2 w-48 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} border rounded-lg shadow-xl z-50`}>
                                    <button onClick={()=>handleViewDetail(c)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-bold ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-eye-fill text-blue-500"></i><span>Voir détails</span></button>
                                    <button onClick={()=>handleOpenEdit(c)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-bold ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-pencil-fill text-yellow-500"></i><span>Modifier</span></button>
                                    <button onClick={()=>confirmDelete(c)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-bold ${darkMode?'text-red-400 hover:bg-gray-700':'text-red-600 hover:bg-gray-50'}`}><i className="bi bi-trash-fill"></i><span>Supprimer</span></button>
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
              ) : (
                /* VUE GRILLE (CARTES) avec pagination */
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentItems.map((c) => (
                      <CarburantCard
                        key={c.id}
                        item={c}
                        onView={handleViewDetail}
                        onEdit={handleOpenEdit}
                        onDelete={confirmDelete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination - affichée seulement si on a des données */}
              {filtered.length > 0 && (
                <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <Pagination />
                </div>
              )}
            </div>
          </>
        )}
        {/* ── FOOTER ── */}
<div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
  <div className="flex items-center justify-center">
    <p className={`text-sm font-bold ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
      © 2026 SGS Tous droits réservés - Version 1.0
    </p>
  </div>
</div>
      </main>

      <FormModal show={showAddModal}  onClose={()=>{setShowAddModal(false);setFormData({});}}  title="Ajouter un plein de carburant" onSubmit={handleAdd}  initialData={{}} />
      <FormModal show={showEditModal} onClose={()=>{setShowEditModal(false);setCurrentItem(null);setFormData({});}} title="Modifier le plein de carburant"  onSubmit={handleEdit} initialData={formData} />
      <DetailsModal show={showDetailsModal} onClose={()=>{setShowDetailsModal(false);setCurrentItem(null);setDetailData(null);}} />
    </div>
  );
};

export default CarnetCarburant;