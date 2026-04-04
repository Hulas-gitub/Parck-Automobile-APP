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

  // ── fire() stable via ref ──
  const fireRef = useRef(null);
  useEffect(() => {
    fireRef.current = (options) => {
      const dm = darkMode; const th = theme;
      const bg = dm ? '#111827' : '#ffffff'; const color = dm ? '#f9fafb' : '#111827';
      const border = dm ? '#1f2937' : '#e5e7eb'; const primary = th?.primary || '#6366f1'; const primaryDk = th?.primaryDark || '#4f46e5';
      return MySwal.fire({
        background: bg, color, confirmButtonColor: primary, cancelButtonColor: dm ? '#374151' : '#6b7280',
        customClass: { popup: 'swal-themed-popup', title: 'swal-themed-title', htmlContainer: 'swal-themed-html', confirmButton: 'swal-themed-confirm', cancelButton: 'swal-themed-cancel' },
        didOpen: (popup) => { popup.style.setProperty('--swal-bg', bg); popup.style.setProperty('--swal-color', color); popup.style.setProperty('--swal-border', border); popup.style.setProperty('--swal-primary', primary); popup.style.setProperty('--swal-primary-dk', primaryDk); },
        ...options,
      });
    };
  }, [darkMode, theme]);
  const fire = useCallback((options) => fireRef.current?.(options), []);

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
  const [exportParams,   setExportParams]   = useState({ date_debut: '', date_fin: '' });
  const [exportLoading,  setExportLoading]  = useState({ pdf: false, excel: false });

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
  }, []); // ← volontairement vide : chargement unique au montage

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

  // ── CRUD ──
  const handleAdd = async (localData) => {
    try {
      await createCarburant(immatriculation, { mission_id: localData.mission_id || null, date_plein: localData.date_plein, station: localData.station || null, litres: localData.litres, prix_unitaire: localData.prix_unitaire || null, kilometrage: localData.kilometrage || null, notes: localData.notes || null });
      setShowAddModal(false); setFormData({});
      await loadCarnets();
      fire({ icon: 'success', title: 'Succès !', text: 'Plein ajouté.', timer: 2000, showConfirmButton: false });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      fire({ icon: 'error', title: 'Erreur', text: errors ? Object.values(errors).flat().join('\n') : (err?.response?.data?.message || 'Une erreur est survenue.') });
    }
  };

  const handleEdit = async (localData) => {
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
      fire({ icon: 'success', title: 'Modifié !', text: 'Plein mis à jour.', timer: 2000, showConfirmButton: false });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      fire({ icon: 'error', title: 'Erreur', text: errors ? Object.values(errors).flat().join('\n') : (err?.response?.data?.message || 'Une erreur est survenue.') });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCarburant(immatriculation, currentItem.id);
      setShowDeleteModal(false); setCurrentItem(null);
      await loadCarnets();
      fire({ icon: 'success', title: 'Supprimé !', timer: 2000, showConfirmButton: false });
    } catch (err) {
      fire({ icon: 'error', title: 'Erreur', text: err?.response?.data?.message || 'Impossible de supprimer.' });
    }
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

  const handleExportPdf = async () => {
    setExportLoading(p => ({ ...p, pdf: true }));
    try {
      const params = {};
      if (exportParams.date_debut) params.date_debut = exportParams.date_debut;
      if (exportParams.date_fin)   params.date_fin   = exportParams.date_fin;
      await exportCarburantPdf(immatriculation, params);
      fire({ icon: 'success', title: 'PDF téléchargé !', timer: 1500, showConfirmButton: false });
    } catch { fire({ icon: 'error', title: 'Erreur', text: 'Impossible de générer le PDF.' }); }
    finally { setExportLoading(p => ({ ...p, pdf: false })); setShowExportMenu(false); }
  };

  const handleExportExcel = async () => {
    setExportLoading(p => ({ ...p, excel: true }));
    try {
      const params = {};
      if (exportParams.date_debut) params.date_debut = exportParams.date_debut;
      if (exportParams.date_fin)   params.date_fin   = exportParams.date_fin;
      await exportCarburantExcel(immatriculation, params);
      fire({ icon: 'success', title: 'Excel téléchargé !', timer: 1500, showConfirmButton: false });
    } catch { fire({ icon: 'error', title: 'Erreur', text: 'Impossible de générer le fichier Excel.' }); }
    finally { setExportLoading(p => ({ ...p, excel: false })); setShowExportMenu(false); }
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
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{label} {required && <span className="text-red-500">*</span>}</label>
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
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Mission <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optionnelle — CAS 1)</span></label>
              <select value={local.mission_id || ''} onChange={e => setLocal({ ...local, mission_id: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2`}>
                <option value="">— Sans mission (CAS 2) —</option>
                {missionsDisponibles.map(m => (<option key={m.id} value={m.id}>{m.label} [{m.statut}]</option>))}
              </select>
            </div>
            {missionSelectionnee && (
              <div className={`rounded-lg p-4 border ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}><i className="bi bi-info-circle me-1"></i>Infos mission</p>
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
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Notes</label>
              <textarea value={local.notes || ''} onChange={e => setLocal({ ...local, notes: e.target.value })} rows={3} placeholder="Observations éventuelles..."
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2`} />
            </div>
            {!local.mission_id && local.litres && local.prix_unitaire && (
              <div className={`rounded-lg p-3 border ${darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-700'}`}><i className="bi bi-calculator me-1"></i>Coût calculé (CAS 2) : <strong>{fmt(parseFloat(local.litres) * parseFloat(local.prix_unitaire), 0)} FCFA</strong></p>
              </div>
            )}
          </div>
          <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end gap-3`}>
            <button onClick={onClose} className={`px-6 py-2 rounded-lg border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Annuler</button>
            <button onClick={() => onSubmit(local)} className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>{currentItem ? 'Modifier' : 'Ajouter'}</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Modal Supprimer ──
  const DeleteModal = ({ show, onClose, onConfirm }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl max-w-md w-full`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><i className="bi bi-exclamation-triangle-fill text-2xl text-red-600"></i></div>
              <div><h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Confirmer la suppression</h3><p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Cette action est irréversible</p></div>
            </div>
          </div>
          <div className="p-6"><p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Supprimer le plein du <strong>{fmtDate(currentItem?.date_plein)}</strong>{currentItem?.station ? ` à ${currentItem.station}` : ''} ?</p></div>
          <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end gap-3`}>
            <button onClick={onClose} className={`px-6 py-2 rounded-lg border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Annuler</button>
            <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">Supprimer</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Modal Détails ──
  const DetailsModal = ({ show, onClose }) => {
    if (!show || !detailData) return null;
    const d = detailData; const cb = d.carburant; const v = d.vehicule; const m = d.mission; const ch = d.chauffeur; const avecMission = d.cas === 'avec_mission';
    const Row = ({ label, value }) => (<div><label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-500'} uppercase`}>{label}</label><p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1 text-sm`}>{value || '—'}</p></div>);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}><i className="bi bi-droplet-fill text-white"></i></div>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Détail — {fmtDate(cb.date_plein)}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${avecMission ? (darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>{avecMission ? 'Avec Mission' : 'Autonome'}</span>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><i className={`bi bi-x-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i></button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-car-front me-2"></i>Véhicule</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Row label="Immatriculation" value={v.immatriculation} /><Row label="Marque / Modèle" value={`${v.marque || ''} ${v.modele || ''}`} /><Row label="Catégorie" value={v.categorie} /><Row label="Km actuel" value={v.kilometrage ? `${Number(v.kilometrage).toLocaleString('fr-FR')} km` : null} />
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-fuel-pump me-2"></i>Carburant</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Row label="Date du plein" value={fmtDate(cb.date_plein)} /><Row label="Station" value={cb.station} /><Row label="Litres" value={cb.litres ? `${fmt(cb.litres, 2)} L` : null} />
                <Row label="Prix unitaire" value={cb.prix_unitaire ? `${fmt(cb.prix_unitaire, 2)} FCFA/L` : null} /><Row label="Coût total" value={cb.cout_total ? `${fmt(cb.cout_total, 0)} FCFA` : null} />
                <Row label="Km au plein" value={cb.kilometrage_au_plein ? `${Number(cb.kilometrage_au_plein).toLocaleString('fr-FR')} km` : null} />
                <Row label="Km depuis préc." value={cb.km_depuis_dernier_plein ? `${Number(cb.km_depuis_dernier_plein).toLocaleString('fr-FR')} km` : null} />
                {!avecMission && <Row label="Coût calculé (CAS 2)" value={cb.consommation_calculee ? `${fmt(cb.consommation_calculee, 0)} FCFA` : null} />}
                <Row label="Notes" value={cb.notes} />
              </div>
            </div>
            {avecMission && m && (
              <div className={`rounded-xl p-4 border ${darkMode ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}><i className="bi bi-map me-2"></i>Mission</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Row label="Référence" value={m.reference_mission} /><Row label="Destination" value={m.destination} /><Row label="Type" value={m.type_mission} /><Row label="Statut" value={m.statut} />
                  <Row label="Départ prévu" value={fmtDate(m.date_depart_prevue)} /><Row label="Départ réel" value={fmtDate(m.date_depart_reelle)} /><Row label="Retour réel" value={fmtDate(m.date_retour_reelle)} />
                  <Row label="Km départ" value={m.km_depart ? `${Number(m.km_depart).toLocaleString('fr-FR')} km` : null} /><Row label="Km retour" value={m.km_retour ? `${Number(m.km_retour).toLocaleString('fr-FR')} km` : null} />
                  <Row label="Carburant mission" value={m.carburant_consomme ? `${fmt(m.carburant_consomme, 2)} L` : null} /><Row label="Coût mission" value={m.cout_carburant ? `${fmt(m.cout_carburant, 0)} FCFA` : null} />
                </div>
              </div>
            )}
            {avecMission && ch && (
              <div>
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-person-badge me-2"></i>Chauffeur</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4"><Row label="Nom" value={ch.nom} /><Row label="Email" value={ch.email} /><Row label="Rôle" value={ch.role} /></div>
              </div>
            )}
          </div>
          <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end`}>
            <button onClick={onClose} className={`px-6 py-2 rounded-lg border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Fermer</button>
          </div>
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
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Véhicule</span>
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
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? sc.bgDark + ' ' + sc.textDark : sc.bg + ' ' + sc.text}`}>{v.statut?.replace('_', ' ')}</span>
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
                {(() => { const sc = STATUT_COLORS[vehiculeSelectionne.statut] || STATUT_COLORS.disponible; return (<span className={`text-xs px-3 py-1 rounded-full font-medium ${darkMode ? sc.bgDark + ' ' + sc.textDark : sc.bg + ' ' + sc.text}`}>{vehiculeSelectionne.statut?.replace('_', ' ')}</span>); })()}
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><i className="bi bi-speedometer2 me-1"></i>{Number(vehiculeSelectionne.kilometrage).toLocaleString('fr-FR')} km</span>
                {vehiculeSelectionne.total_cout > 0 && (<span className={`text-sm font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}><i className="bi bi-cash me-1"></i>{fmt(vehiculeSelectionne.total_cout, 0)} FCFA total</span>)}
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
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[
                { title: 'Total Pleins',  value: stats.total+'',               subtitle: 'enregistrements',    icon: 'bi-droplet-fill',   iconBg: darkMode?'bg-blue-800':'bg-blue-100',   textColor: darkMode?'text-blue-400':'text-blue-600'   },
                { title: 'Total Litres',  value: fmt(stats.totalLitres,1)+' L', subtitle: 'consommés',          icon: 'bi-fuel-pump-fill', iconBg: darkMode?'bg-green-800':'bg-green-100',  textColor: darkMode?'text-green-400':'text-green-600'  },
                { title: 'Coût Total',    value: fmt(stats.totalCout,0)+' FCFA',subtitle: 'dépenses carburant', icon: 'bi-cash-stack',     iconBg: darkMode?'bg-yellow-800':'bg-yellow-100',textColor: darkMode?'text-yellow-400':'text-yellow-600' },
                { title: 'Avec Mission',  value: stats.avecMission+'',          subtitle: `dont ${stats.sansMission} autonomes`,icon:'bi-map-fill',iconBg:darkMode?'bg-purple-800':'bg-purple-100',textColor:darkMode?'text-purple-400':'text-purple-600'},
              ].map((card, idx) => (
                <div key={idx} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{card.title}</p>
                      <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>{card.value}</h3>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{card.subtitle}</p>
                    </div>
                    <div className={`${card.iconBg} ${card.textColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}><i className={card.icon} style={{ fontSize: '1.5rem' }}></i></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tableau */}
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
              <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
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
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setShowFilterMenu(p => !p)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}><i className="bi bi-funnel"></i><span className="text-sm">Filtres</span></button>
                      {showFilterMenu && (
                        <div className={`absolute right-0 mt-2 w-56 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 p-4`}>
                          <label className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>Type</label>
                          <select value={casFilter} onChange={e => setCasFilter(e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}>
                            <option value="Tous">Tous</option><option value="avec_mission">Avec mission</option><option value="sans_mission">Sans mission</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setShowExportMenu(p => !p)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}><i className="bi bi-download"></i><span className="text-sm">Exporter</span></button>
                      {showExportMenu && (
                        <div className={`absolute right-0 mt-2 w-72 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 p-4 space-y-3`}>
                          <p className={`text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Filtres d'export</p>
                          <div><label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1 block`}>Date début</label><input type="date" value={exportParams.date_debut} onChange={e => setExportParams(p => ({ ...p, date_debut: e.target.value }))} className={`w-full px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} /></div>
                          <div><label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1 block`}>Date fin</label><input type="date" value={exportParams.date_fin} onChange={e => setExportParams(p => ({ ...p, date_fin: e.target.value }))} className={`w-full px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} /></div>
                          <div className="flex gap-2">
                            <button onClick={handleExportPdf} disabled={exportLoading.pdf} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-60">{exportLoading.pdf ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className="bi bi-file-pdf"></i>} PDF</button>
                            <button onClick={handleExportExcel} disabled={exportLoading.excel} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-60">{exportLoading.excel ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className="bi bi-file-excel"></i>} Excel</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={() => { setFormData({}); setCurrentItem(null); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 shadow-md" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                      <i className="bi bi-plus-lg"></i><span>Ajouter un plein</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${theme.primary} transparent transparent transparent` }}></div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chargement...</p>
                    </div>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                      <tr>{['Type','Date / Station','Litres','Prix/L','Coût Total','Kilométrage','Km depuis préc.','Mission / Chauffeur','Actions'].map(h => (<th key={h} className="px-5 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">{h}</th>))}</tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={9} className="text-center py-16"><div className="flex flex-col items-center gap-3"><i className={`bi bi-droplet text-5xl ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}></i><p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun plein de carburant enregistré</p></div></td></tr>
                      ) : filtered.map((c, index) => {
                        const b = casBadge(c.cas);
                        return (
                          <tr key={c.id}
                            style={{ backgroundColor: index%2===0?(darkMode?'#1a2535':'#eef2ff'):(darkMode?'#1c1f2b':'#f3f4f6'), borderBottom: darkMode?'1px solid #1e293b':'1px solid #e5e7eb', transition:'background-color 0.15s ease' }}
                            onMouseEnter={e=>e.currentTarget.style.backgroundColor=darkMode?`${theme.primary}30`:`${theme.primary}18`}
                            onMouseLeave={e=>e.currentTarget.style.backgroundColor=index%2===0?(darkMode?'#1a2535':'#eef2ff'):(darkMode?'#1c1f2b':'#f3f4f6')}
                          >
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${b.color==='blue'?(darkMode?'bg-blue-900/40 text-blue-300':'bg-blue-100 text-blue-700'):(darkMode?'bg-gray-800 text-gray-300':'bg-gray-100 text-gray-700')}`}>{b.text}</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><p className={`font-semibold text-sm ${darkMode?'text-white':'text-gray-900'}`}>{fmtDate(c.date_plein)}</p><p className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{c.station||'—'}</p></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`font-semibold ${darkMode?'text-white':'text-gray-900'}`}>{fmt(c.litres,2)} L</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{c.prix_unitaire?`${fmt(c.prix_unitaire,0)} F`:'—'}</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`font-semibold text-sm ${darkMode?'text-green-400':'text-green-600'}`}>{c.cout_total?`${fmt(c.cout_total,0)} FCFA`:'—'}</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{c.kilometrage?`${Number(c.kilometrage).toLocaleString('fr-FR')} km`:'—'}</span></td>
                            <td className="px-5 py-4 whitespace-nowrap"><span className={`text-sm ${darkMode?'text-gray-300':'text-gray-700'}`}>{c.km_depuis_dernier_plein?`${Number(c.km_depuis_dernier_plein).toLocaleString('fr-FR')} km`:'—'}</span></td>
                            <td className="px-5 py-4">{c.cas==='avec_mission'?(<div><p className={`text-sm font-medium ${darkMode?'text-blue-300':'text-blue-600'}`}>{c.reference_mission||'—'}</p><p className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{c.mission_destination||''}{c.chauffeur_nom?` · ${c.chauffeur_nom}`:''}</p></div>):(<span className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>—</span>)}</td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="relative" onClick={e=>e.stopPropagation()}>
                                <button onClick={()=>setShowActionMenu(showActionMenu===c.id?null:c.id)} className={`p-2 rounded-lg ${darkMode?'hover:bg-gray-700':'hover:bg-gray-100'}`}><i className={`bi bi-three-dots-vertical ${darkMode?'text-gray-400':'text-gray-600'}`}></i></button>
                                {showActionMenu===c.id && (
                                  <div className={`absolute right-0 mt-2 w-48 ${darkMode?'bg-gray-800 border-gray-700':'bg-white border-gray-200'} border rounded-lg shadow-xl z-50`}>
                                    <button onClick={()=>handleViewDetail(c)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-eye-fill text-blue-500"></i><span>Voir détails</span></button>
                                    <button onClick={()=>handleOpenEdit(c)} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}><i className="bi bi-pencil-fill text-yellow-500"></i><span>Modifier</span></button>
                                    <button onClick={()=>{setCurrentItem(c);setShowDeleteModal(true);setShowActionMenu(null);}} className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode?'text-red-400 hover:bg-gray-700':'text-red-600 hover:bg-gray-50'}`}><i className="bi bi-trash-fill"></i><span>Supprimer</span></button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className={`px-6 py-4 border-t ${darkMode?'border-gray-800':'border-gray-100'} flex items-center justify-between`}>
                <p className={`text-sm ${darkMode?'text-gray-400':'text-gray-600'}`}>Affichage de {filtered.length} plein{filtered.length>1?'s':''}</p>
                {carnets.length > 0 && (
                  <div className="flex items-center gap-6 text-sm">
                    <span className={darkMode?'text-gray-400':'text-gray-500'}>Total : <strong className={darkMode?'text-white':'text-gray-900'}>{fmt(stats.totalLitres,1)} L</strong></span>
                    <span className={darkMode?'text-gray-400':'text-gray-500'}>Coût : <strong className={darkMode?'text-green-400':'text-green-600'}>{fmt(stats.totalCout,0)} FCFA</strong></span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className={`mt-8 py-6 border-t ${darkMode?'border-gray-800':'border-gray-200'} text-center`}>
          <p className={`text-sm ${darkMode?'text-gray-500':'text-gray-600'}`}>© 2026 SGS Tous droits réservés — Version 1.0</p>
        </div>
      </main>

      <FormModal show={showAddModal}  onClose={()=>{setShowAddModal(false);setFormData({});}}  title="Ajouter un plein de carburant" onSubmit={handleAdd}  initialData={{}} />
      <FormModal show={showEditModal} onClose={()=>{setShowEditModal(false);setCurrentItem(null);setFormData({});}} title="Modifier le plein de carburant"  onSubmit={handleEdit} initialData={formData} />
      <DeleteModal  show={showDeleteModal}  onClose={()=>{setShowDeleteModal(false);setCurrentItem(null);}}  onConfirm={handleDelete} />
      <DetailsModal show={showDetailsModal} onClose={()=>{setShowDetailsModal(false);setCurrentItem(null);setDetailData(null);}} />
    </div>
  );
};

export default CarnetCarburant;