import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
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
import { getSwalConfig, showSuccess } from '../../utils/walConfig';


const extractErrorMessage = (err) => {
  const data = err?.response?.data;
  if (!data) return 'Une erreur réseau est survenue.';
  if (data.errors) {
    return Object.values(data.errors).flat().join('\n');
  }
  return data.message || 'Une erreur est survenue.';
};

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

const ReferentielsTab = ({ darkMode, theme, isReadOnly = false }) => {
  const [activeFilter, setActiveFilter] = useState('inspections');
  const [data, setData] = useState({
    inspections:  [],
    intervenants: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    libelle: '',
    code: '',
    description: '',
    est_obligatoire: false,
    est_actif: true,
    competences_requises: '',
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAllReferentiels();
      const d = res.data?.data ?? {};
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
      showSuccess(darkMode, theme, 'Succès', modalMode === 'create' ? 'Élément créé avec succès.' : 'Élément mis à jour avec succès.');
      await loadFilter(activeFilter);
    } catch (err) {
      Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'error',
        title: 'Erreur',
        text: extractErrorMessage(err),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (item) => {
    setOpenMenuId(null);
    const result = await Swal.fire({
      ...getSwalConfig(darkMode, theme),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      title: 'Supprimer cet élément ?',
      text: `"${item.libelle}" sera supprimé définitivement.`,
    });
    if (!result.isConfirmed) return;
    setActionLoading(true);
    try {
      switch (activeFilter) {
        case 'inspections':  await deleteTypeInspection(item.id);  break;
        case 'intervenants': await deleteTypeIntervenant(item.id); break;
      }
      showSuccess(darkMode, theme, 'Succès', 'Élément supprimé.');
      await loadFilter(activeFilter);
    } catch (err) {
      Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'error',
        title: 'Erreur',
        text: extractErrorMessage(err),
      });
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
      showSuccess(darkMode, theme, 'Succès', item.est_actif ? 'Élément désactivé.' : 'Élément activé.');
      await loadFilter(activeFilter);
    } catch (err) {
      Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'error',
        title: 'Erreur',
        text: extractErrorMessage(err),
      });
    } finally {
      setActionLoading(false);
    }
  };

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

  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  }`;

  return (
    <div className="space-y-6">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl p-6 border shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
              <h3 className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{computedStats.total}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><i className="bi bi-list-ul text-2xl" /></div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl p-6 border shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {activeFilter === 'inspections' ? 'Obligatoires' : 'Actifs'}
              </p>
              <h3 className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeFilter === 'inspections' ? computedStats.obligatoires : computedStats.actifs}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-green-100 text-green-600"><i className="bi bi-check-circle text-2xl" /></div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl p-6 border shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Inactifs</p>
              <h3 className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{computedStats.inactifs}</h3>
            </div>
            <div className="p-3 rounded-xl bg-red-100 text-red-600"><i className="bi bi-x-circle text-2xl" /></div>
          </div>
        </div>
      </div>

      {/* ── FILTRES & RECHERCHE ── */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl p-5 border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(FILTER_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setActiveFilter(key); setSearchTerm(''); }}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs uppercase tracking-wider ${
                activeFilter === key ? 'text-white shadow-md' : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
              }`}
              style={activeFilter === key ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
            >
              <i className={`bi ${cfg.icon}`} />
              {cfg.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`pl-8 pr-3 py-2 rounded-xl border text-xs w-56 ${inputCls}`}
            />
          </div>
          {!isReadOnly && (
            <button
              onClick={() => handleOpenModal('create')}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 shadow-md flex items-center gap-2 disabled:opacity-50"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
            >
              {actionLoading ? <i className="bi bi-arrow-repeat animate-spin" /> : <i className="bi bi-plus-lg" />}
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl border shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }} className="text-white">
              <tr>
                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">Libellé</th>
                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                  {activeFilter === 'inspections' ? 'Obligatoire' : 'Compétences'}
                </th>
                <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-center font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/20">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    <i className="bi bi-arrow-repeat animate-spin text-xl block mb-2" />
                    Chargement des référentiels...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Aucun enregistrement trouvé.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 font-bold">{item.libelle}</td>
                    <td className="px-6 py-4 font-mono text-gray-400">{item.code || '—'}</td>
                    <td className="px-6 py-4">
                      {activeFilter === 'inspections' ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.est_obligatoire ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {item.est_obligatoire ? 'Oui' : 'Non'}
                        </span>
                      ) : (
                        <span className="text-gray-300">{item.competences_requises || '—'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.est_actif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.est_actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {!isReadOnly ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title={item.est_actif ? 'Désactiver' : 'Activer'}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
                          >
                            <i className={`bi ${item.est_actif ? 'bi-toggle-on text-green-400' : 'bi-toggle-off text-gray-500'} text-base`} />
                          </button>
                          <button
                            onClick={() => handleOpenModal('edit', item)}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL RÉFÉRENTIELS ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
            <div className={`relative ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl shadow-2xl w-full max-w-md z-10 border overflow-hidden`}>
              <div
                className="px-6 py-4 text-white flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
              >
                <h3 className="font-bold text-base">
                  {modalMode === 'create' ? 'Ajouter' : 'Modifier'} — {FILTER_CONFIG[activeFilter]?.label}
                </h3>
                <button onClick={handleCloseModal}><i className="bi bi-x-lg" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Libellé *</label>
                  <input
                    type="text"
                    required
                    value={formData.libelle}
                    onChange={handleInputChange}
                    name="libelle"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={handleInputChange}
                    name="code"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={handleInputChange}
                    name="description"
                    className={inputCls}
                  />
                </div>

                {activeFilter === 'inspections' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="est_obligatoire"
                      name="est_obligatoire"
                      checked={formData.est_obligatoire}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <label htmlFor="est_obligatoire" className="text-xs font-bold text-gray-300 cursor-pointer">
                      Inspection obligatoire
                    </label>
                  </div>
                )}

                {activeFilter === 'intervenants' && (
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Compétences requises</label>
                    <input
                      type="text"
                      value={formData.competences_requises}
                      onChange={handleInputChange}
                      name="competences_requises"
                      className={inputCls}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="est_actif"
                    name="est_actif"
                    checked={formData.est_actif}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded accent-green-600"
                  />
                  <label htmlFor="est_actif" className="text-xs font-bold text-gray-300 cursor-pointer">
                    Élément actif
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/20">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-700 text-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
                  >
                    {actionLoading && <i className="bi bi-arrow-repeat animate-spin" />}
                    Enregistrer
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

export default ReferentielsTab;
