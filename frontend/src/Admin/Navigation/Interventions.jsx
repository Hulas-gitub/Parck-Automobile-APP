import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Swal from 'sweetalert2';

import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

import {
  fetchAllReferentiels,
  fetchTypesInspection,
  fetchTypesIntervenant,
  createTypeInspection,
  updateTypeInspection,
  deleteTypeInspection,
  toggleStatutTypeInspection,
  createTypeIntervenant,
  updateTypeIntervenant,
  deleteTypeIntervenant,
  toggleStatutTypeIntervenant,
} from '../../api/Admin-Axios/InterventionsReferentiel-axios';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const buildSwalConfig = (darkMode, primaryColor) => ({
  background:    darkMode ? '#1e2433' : '#ffffff',
  color:         darkMode ? '#e2e8f0' : '#1a202c',
  confirmButtonColor: primaryColor,
  cancelButtonColor:  darkMode ? '#374151' : '#9ca3af',
  customClass: {
    popup:         'swal-fleetify-popup',
    confirmButton: 'swal-fleetify-confirm',
    cancelButton:  'swal-fleetify-cancel',
    title:         'swal-fleetify-title',
    htmlContainer: 'swal-fleetify-html',
  },
});

const extractErrorMessage = (err) => {
  const data = err?.response?.data;
  if (!data) return 'Une erreur réseau est survenue.';
  if (data.errors) {
    return Object.values(data.errors).flat().join('\n');
  }
  return data.message || 'Une erreur est survenue.';
};

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────
const SkeletonRow = ({ cols, darkMode }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div
          className={`h-4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          style={{ width: `${60 + Math.random() * 30}%` }}
        />
      </td>
    ))}
  </tr>
);

const SkeletonRows = ({ count = 5, cols, darkMode }) =>
  Array.from({ length: count }).map((_, i) => (
    <SkeletonRow key={i} cols={cols} darkMode={darkMode} />
  ));

const StatCardSkeleton = ({ darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className={`h-3 w-20 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-8 w-12 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
      <div className={`w-12 h-12 rounded-lg animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// CONFIG PAR FILTRE — Inspections + Intervenants uniquement
// ─────────────────────────────────────────────────────────────
const FILTER_CONFIG = {
  inspections: {
    label:    'Types Inspection',
    icon:     'bi-clipboard-check',
    colCount: 5,
  },
  intervenants: {
    label:    'Types Intervenant',
    icon:     'bi-person-gear',
    colCount: 5,
  },
};

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
const Interventions = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('fleetify_darkMode');
      return saved !== null ? saved === 'true' : true;
    } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {}
  }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const { theme } = useTheme();
  const navigate  = useNavigate();

  // ── State données ────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('inspections');
  const [data, setData]                 = useState({
    inspections:  [],
    intervenants: [],
  });
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ── State UI ─────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]     = useState('');
  const [openMenuId, setOpenMenuId]     = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [modalMode, setModalMode]       = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    libelle:              '',
    code:                 '',
    description:          '',
    est_obligatoire:      false,
    est_actif:            true,
    competences_requises: '',
  });

  const darkModeRef = useRef(darkMode);
  const themeRef    = useRef(theme);
  useEffect(() => { darkModeRef.current = darkMode; }, [darkMode]);
  useEffect(() => { themeRef.current   = theme;     }, [theme]);

  // ─────────────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllReferentiels();
      const d   = res.data?.data ?? {};
      setData({
        inspections:  d.types_inspection  ?? [],
        intervenants: d.types_intervenant ?? [],
      });
    } catch (err) {
      console.error('Erreur chargement référentiels:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFilter = useCallback(async (filter) => {
    setLoading(true);
    try {
      let res;
      const params = { search: searchTerm, per_page: 100 };
      switch (filter) {
        case 'inspections':  res = await fetchTypesInspection(params);  break;
        case 'intervenants': res = await fetchTypesIntervenant(params); break;
        default: return;
      }
      const payload = res.data?.data ?? {};
      setData(prev => ({ ...prev, [filter]: payload.items ?? [] }));
    } catch (err) {
      console.error('Erreur chargement filtre:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { loadFilter(activeFilter); }, [activeFilter, loadFilter]);

  // ─────────────────────────────────────────────────────────────
  // SWAL HELPERS
  // ─────────────────────────────────────────────────────────────
  const swalError = useCallback((message) => {
    const cfg = buildSwalConfig(darkModeRef.current, themeRef.current.primary);
    return Swal.fire({ ...cfg, icon: 'error', title: 'Erreur',
      html: `<span style="white-space:pre-line">${message}</span>`,
      confirmButtonText: "D'ACCORD", showCancelButton: false });
  }, []);

  const swalSuccess = useCallback((message) => {
    const cfg = buildSwalConfig(darkModeRef.current, themeRef.current.primary);
    return Swal.fire({ ...cfg, icon: 'success', title: 'Succès', text: message,
      timer: 1800, timerProgressBar: true, showConfirmButton: false });
  }, []);

  const swalConfirm = useCallback((opts = {}) => {
    const cfg = buildSwalConfig(darkModeRef.current, themeRef.current.primary);
    return Swal.fire({ ...cfg, icon: 'warning', showCancelButton: true,
      confirmButtonText: opts.confirm ?? 'Confirmer',
      cancelButtonText:  opts.cancel  ?? 'Annuler',
      title:             opts.title   ?? "Confirmer l'action",
      text:              opts.text    ?? '',
      reverseButtons: true });
  }, []);

  // ─────────────────────────────────────────────────────────────
  // MENU & MODAL
  // ─────────────────────────────────────────────────────────────
  const toggleMenu = (id) => setOpenMenuId(prev => prev === id ? null : id);

  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('.action-menu')) setOpenMenuId(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const emptyForm = {
    libelle: '', code: '', description: '',
    est_obligatoire: false, est_actif: true, competences_requises: '',
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    setOpenMenuId(null);
    setFormData(mode === 'edit' && item ? {
      libelle:              item.libelle              ?? '',
      code:                 item.code                ?? '',
      description:          item.description         ?? '',
      est_obligatoire:      item.est_obligatoire     ?? false,
      est_actif:            item.est_actif           ?? true,
      competences_requises: item.competences_requises ?? '',
    } : emptyForm);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setFormData(emptyForm);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ─────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (modalMode === 'create') {
        switch (activeFilter) {
          case 'inspections':  await createTypeInspection(formData);  break;
          case 'intervenants': await createTypeIntervenant(formData); break;
        }
      } else {
        const id = selectedItem.id;
        switch (activeFilter) {
          case 'inspections':  await updateTypeInspection(id, formData);  break;
          case 'intervenants': await updateTypeIntervenant(id, formData); break;
        }
      }
      handleCloseModal();
      await swalSuccess(modalMode === 'create' ? 'Élément créé avec succès.' : 'Élément mis à jour avec succès.');
      await loadFilter(activeFilter);
    } catch (err) {
      await swalError(extractErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (item) => {
    setOpenMenuId(null);
    const result = await swalConfirm({
      title: 'Supprimer cet élément ?',
      text:  `"${item.libelle}" sera supprimé définitivement.`,
      confirm: 'Supprimer', cancel: 'Annuler',
    });
    if (!result.isConfirmed) return;
    setActionLoading(true);
    try {
      switch (activeFilter) {
        case 'inspections':  await deleteTypeInspection(item.id);  break;
        case 'intervenants': await deleteTypeIntervenant(item.id); break;
      }
      await swalSuccess('Élément supprimé.');
      await loadFilter(activeFilter);
    } catch (err) {
      await swalError(extractErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    setOpenMenuId(null);
    setActionLoading(true);
    try {
      switch (activeFilter) {
        case 'inspections':  await toggleStatutTypeInspection(item.id);  break;
        case 'intervenants': await toggleStatutTypeIntervenant(item.id); break;
      }
      await swalSuccess(item.est_actif ? 'Élément désactivé.' : 'Élément activé.');
      await loadFilter(activeFilter);
    } catch (err) {
      await swalError(extractErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DONNÉES & STATS
  // ─────────────────────────────────────────────────────────────
  const filteredData = (data[activeFilter] ?? []).filter(item => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return item.libelle?.toLowerCase().includes(s)
        || item.code?.toLowerCase().includes(s)
        || item.description?.toLowerCase().includes(s);
  });

  const computedStats = (() => {
    const items = data[activeFilter] ?? [];
    return {
      total:        items.length,
      actifs:       items.filter(i => i.est_actif).length,
      inactifs:     items.filter(i => !i.est_actif).length,
      obligatoires: items.filter(i => i.est_obligatoire).length,
    };
  })();

  // ─────────────────────────────────────────────────────────────
  // STYLES
  // ─────────────────────────────────────────────────────────────
  const inputCls = `w-full px-3 py-2 rounded-lg border ${
    darkMode
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  } focus:outline-none focus:ring-2 transition-colors`;

  const labelCls = `block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  const getRowStyle = (index) => ({
    backgroundColor: index % 2 === 0
      ? darkMode ? '#1a2535' : '#eef2ff'
      : darkMode ? '#1c1f2b' : '#f3f4f6',
    borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
    transition: 'background-color 0.15s ease',
  });
  const onRowEnter = (e) => { e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`; };
  const onRowLeave = (e, i) => { e.currentTarget.style.backgroundColor = i % 2 === 0 ? (darkMode ? '#1a2535' : '#eef2ff') : (darkMode ? '#1c1f2b' : '#f3f4f6'); };

  // ─────────────────────────────────────────────────────────────
  // SUB-COMPONENTS
  // ─────────────────────────────────────────────────────────────
  const statusBadge = (active) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {active ? 'Actif' : 'Inactif'}
    </span>
  );

  const codeBadge = (code) => (
    <code className={`px-2 py-1 rounded text-xs font-mono ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
      {code}
    </code>
  );

  const ActionMenu = ({ item }) => (
    <div className="relative action-menu inline-block">
      <button onClick={() => toggleMenu(item.id)} disabled={actionLoading}
        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} disabled:opacity-50`}>
        <i className="bi bi-three-dots-vertical" />
      </button>
      {openMenuId === item.id && (
        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl z-20 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="py-1">
            <button onClick={() => handleOpenModal('edit', item)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              <i className="bi bi-pencil-square text-blue-500" /> Modifier
            </button>
            <button onClick={() => handleToggleStatus(item)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              <i className={`bi ${item.est_actif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-400'}`} />
              {item.est_actif ? 'Désactiver' : 'Activer'}
            </button>
            <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            <button onClick={() => handleDelete(item)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}>
              <i className="bi bi-trash3" /> Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderFormFields = () => {
    const common = (
      <>
        <div className="mb-4">
          <label className={labelCls}>Libellé <span className="text-red-500">*</span></label>
          <input type="text" name="libelle" value={formData.libelle} onChange={handleInputChange}
            required className={inputCls} placeholder="Ex: Inspection technique" />
        </div>
        <div className="mb-4">
          <label className={labelCls}>Référence <span className="text-red-500">*</span></label>
          <input type="text" name="code" value={formData.code} onChange={handleInputChange}
            required className={inputCls} placeholder="Ex: inspection_technique" />
        </div>
        <div className="mb-4">
          <label className={labelCls}>Description</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange}
            rows="3" className={inputCls} placeholder="Description détaillée" />
        </div>
      </>
    );

    if (activeFilter === 'inspections') return (
      <>
        {common}
        <div className="mb-4 flex items-center gap-3">
          <input type="checkbox" name="est_obligatoire" id="est_obligatoire"
            checked={formData.est_obligatoire} onChange={handleInputChange}
            className="w-4 h-4 rounded accent-blue-600" />
          <label htmlFor="est_obligatoire" className={`text-sm font-medium cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Inspection obligatoire réglementaire
          </label>
        </div>
      </>
    );

    return <>{common}</>;
  };

  const renderTableHeader = () => {
    const th = (label) => (
      <th key={label} className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">{label}</th>
    );
    return <>{th('Libellé')}{th('Référence')}{th('Description')}{th('Statut')}
      <th className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
    </>;
  };

  const renderTableRows = () => {
    const cols = FILTER_CONFIG[activeFilter]?.colCount ?? 5;

    if (loading) return <SkeletonRows count={5} cols={cols} darkMode={darkMode} />;

    if (filteredData.length === 0) return (
      <tr>
        <td colSpan={cols} className="px-6 py-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <i className={`bi bi-inbox text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun élément trouvé</p>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {searchTerm ? 'Essayez une autre recherche' : 'Commencez par créer un nouvel élément'}
            </p>
          </div>
        </td>
      </tr>
    );

    const tdBase  = 'px-6 py-4';
    const tdMuted = `${tdBase} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;
    const iconMap = {
      inspections:  { icon: 'bi-clipboard-check', color: 'text-purple-500' },
      intervenants: { icon: 'bi-person-gear',     color: 'text-green-500'  },
    };
    const { icon, color } = iconMap[activeFilter] ?? {};

    return filteredData.map((item, index) => (
      <tr key={item.id} style={getRowStyle(index)}
        onMouseEnter={onRowEnter} onMouseLeave={(e) => onRowLeave(e, index)}>
        <td className={`${tdBase} ${darkMode ? 'text-white' : 'text-gray-900'} whitespace-nowrap`}>
          <div className="flex items-center gap-2">
            <i className={`bi ${icon} ${color}`} />
            <span className="font-medium">{item.libelle}</span>
          </div>
        </td>
        <td className={`${tdBase} whitespace-nowrap`}>{codeBadge(item.code)}</td>
        <td className={tdMuted}><div className="max-w-xs truncate">{item.description || '—'}</div></td>
        <td className={`${tdBase} whitespace-nowrap`}>{statusBadge(item.est_actif)}</td>
        <td className={`${tdBase} whitespace-nowrap text-center`}><ActionMenu item={item} /></td>
      </tr>
    ));
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <style>{`
        .swal-fleetify-popup  { border-radius: 1rem !important; border: 1px solid ${darkMode ? '#374151' : '#e5e7eb'} !important; }
        .swal-fleetify-title  { font-size: 1.15rem !important; font-weight: 700 !important; }
        .swal-fleetify-html   { font-size: 0.92rem !important; }
        .swal-fleetify-confirm, .swal-fleetify-cancel { border-radius: 0.5rem !important; font-weight: 600 !important; padding: 0.55rem 1.4rem !important; }
      `}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      <Header darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile} />

      <main className="transition-all duration-300 pt-24 px-6 pb-6"
        style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {loading ? (
            <><StatCardSkeleton darkMode={darkMode} /><StatCardSkeleton darkMode={darkMode} /><StatCardSkeleton darkMode={darkMode} /></>
          ) : (
            <>
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{computedStats.total}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100"><i className="bi bi-list-ul text-2xl text-blue-600" /></div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {activeFilter === 'inspections' ? 'Obligatoires' : 'Actifs'}
                    </p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {activeFilter === 'inspections' ? computedStats.obligatoires : computedStats.actifs}
                    </h3>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100"><i className="bi bi-check-circle text-2xl text-green-600" /></div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Inactifs</p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{computedStats.inactifs}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-red-100"><i className="bi bi-x-circle text-2xl text-red-600" /></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── FILTRES & RECHERCHE ── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-5 border shadow-sm mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(FILTER_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => { setActiveFilter(key); setSearchTerm(''); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                    activeFilter === key ? 'text-white shadow-md' : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                  }`}
                  style={activeFilter === key ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                  <i className={`bi ${cfg.icon}`} />
                  {cfg.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3 items-center">
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input type="text" placeholder="Rechercher…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`pl-9 pr-4 py-2 rounded-lg border text-sm w-56 ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2`} />
              </div>
              <button onClick={() => handleOpenModal('create')} disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 hover:shadow-md flex items-center gap-2 disabled:opacity-50"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                {actionLoading ? <i className="bi bi-arrow-repeat animate-spin" /> : <i className="bi bi-plus-lg" />}
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <tr>{renderTableHeader()}</tr>
              </thead>
              <tbody>{renderTableRows()}</tbody>
            </table>
          </div>
          {!loading && filteredData.length > 0 && (
            <div className={`px-6 py-3 border-t text-xs ${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
              {filteredData.length} élément{filteredData.length > 1 ? 's' : ''} affiché{filteredData.length > 1 ? 's' : ''}
              {searchTerm && ` pour "${searchTerm}"`}
            </div>
          )}
        </div>

        <div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            © 2026 SGS Tous droits réservés — Version 1.0
          </p>
        </div>
      </main>

      {/* ── MODAL CRUD ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleCloseModal} />
            <div className={`relative ${darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'} rounded-2xl shadow-2xl w-full max-w-lg z-10`}>

              <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                    <i className={`bi ${FILTER_CONFIG[activeFilter]?.icon} text-white text-sm`} />
                  </div>
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {modalMode === 'create' ? 'Créer' : 'Modifier'} — {FILTER_CONFIG[activeFilter]?.label}
                  </h3>
                </div>
                <button onClick={handleCloseModal}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                  {renderFormFields()}
                  <div className={`mt-2 flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <input type="checkbox" name="est_actif" id="est_actif_modal"
                      checked={formData.est_actif} onChange={handleInputChange}
                      className="w-4 h-4 rounded accent-green-500" />
                    <label htmlFor="est_actif_modal" className={`text-sm font-medium cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Actif
                    </label>
                  </div>
                </div>

                <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                  <button type="button" onClick={handleCloseModal} disabled={actionLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Annuler
                  </button>
                  <button type="submit" disabled={actionLoading}
                    className="px-5 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                    {actionLoading && <i className="bi bi-arrow-repeat animate-spin" />}
                    {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interventions;