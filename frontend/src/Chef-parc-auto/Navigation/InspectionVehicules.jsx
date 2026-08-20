import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// Liste complète des accessoires du formulaire PDF
const ACCESSOIRES_LIST = [
  'Visite technique',
  'Gilet de sécurité',
  'Carte grise',
  'Auto radio',
  'Attestation assurance',
  'Balais essuie-glace',
  'État fermetures',
  'Climatisation',
  'Extincteur + carte',
  'Rétroviseurs',
  'Trousse de secours',
  'Gardes boue',
  'Cale x2',
  'Phares',
  'Feux stop',
  'Clignotants',
  'État pneumatiques',
  'Niveau liquide refroidissement',
  'Niveau huile moteur',
  'Niveau eau essuie-glace',
  'Plaque immatriculation x2',
  'Roue de secours',
  'Klaxon',
  'État vitrage',
  'Ceintures de sécurité',
  'Cric',
  'Enjoliveurs',
  'Manivelle',
  'État peinture',
  'Triangle x2',
  'Propreté',
  'Niveau huile frein',
  'Plaquettes / garnitures (usure)',
  'Niveau huile direction',
  'Amortisseurs',
  'Niveau huile pont',
  'Pneus (usure, pression)',
  'Embrayage',
  'Carrosserie',
  'Tuyau échappement',
  'État intérieur',
  'État bielettes',
  'État rotules',
];

// Liste des véhicules disponibles (à connecter à votre source de données)
const VEHICULES_LIST = [
  { immatriculation: 'AB-1234-GA', label: 'AB-1234-GA — Toyota Hilux' },
  { immatriculation: 'CD-5678-GA', label: 'CD-5678-GA — Mitsubishi L200' },
  { immatriculation: 'EF-9012-GA', label: 'EF-9012-GA — Ford Ranger' },
  { immatriculation: 'GH-3456-GA', label: 'GH-3456-GA — Nissan Navara' },
  { immatriculation: 'IJ-7890-GA', label: 'IJ-7890-GA — Toyota Land Cruiser' },
  { immatriculation: 'KL-1122-GA', label: 'KL-1122-GA — Isuzu D-Max' },
];

const InspectionVehicules = () => {
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
    } catch {}
  }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // ============================================================================
  // DONNÉES
  // ============================================================================
  const [inspectionsVehicules, setInspectionsVehicules] = useState([
    {
      id: 1,
      vehicule_immatriculation: 'AB-1234-GA',
      type_inspection: 'Inspection quotidienne',
      date_inspection: '2026-02-05 08:30:00',
      km_au_moment_inspection: 45230,
      statut_global: 'conforme',
      anomalies_detectees: false,
      observations_vehicule: 'Véhicule en bon état général',
      nom_verificateurs: 'Jean Dupont, Marie Martin',
      element_verifie: 'Contrôle général moteur',
      accessoires: ['Visite technique', 'Carte grise', 'Attestation assurance', 'Extincteur + carte', 'Trousse de secours', 'Triangle x2', 'Gilet de sécurité', 'Roue de secours', 'Cric', 'Manivelle'],
      commentaire: 'Tout est conforme, véhicule prêt pour la route.',
    },
    {
      id: 2,
      vehicule_immatriculation: 'CD-5678-GA',
      type_inspection: 'Inspection hebdomadaire',
      date_inspection: '2026-02-04 14:15:00',
      km_au_moment_inspection: 67890,
      statut_global: 'non_conforme',
      anomalies_detectees: true,
      observations_vehicule: 'Pneus avant usés, remplacement nécessaire',
      nom_verificateurs: 'Marie Martin',
      element_verifie: 'Vérification pneumatiques',
      accessoires: ['Pneus (usure, pression)', 'Plaquettes / garnitures (usure)', 'Niveau huile moteur', 'Niveau liquide refroidissement'],
      commentaire: 'Pneus avant à remplacer rapidement.',
    },
    {
      id: 3,
      vehicule_immatriculation: 'EF-9012-GA',
      type_inspection: 'Inspection TF',
      date_inspection: '2026-02-03 09:00:00',
      km_au_moment_inspection: 23450,
      statut_global: 'danger_immediat',
      anomalies_detectees: true,
      observations_vehicule: 'Freins défectueux - DANGER IMMÉDIAT',
      nom_verificateurs: 'Pierre Leblanc, Jacques Noir',
      element_verifie: 'Système de freinage',
      accessoires: ['Niveau huile frein', 'Plaquettes / garnitures (usure)', 'Amortisseurs'],
      commentaire: 'DANGER - Plaquettes usées au métal. Véhicule immobilisé.',
    },
    {
      id: 4,
      vehicule_immatriculation: 'GH-3456-GA',
      type_inspection: 'Inspection mensuelle',
      date_inspection: '2026-02-01 10:30:00',
      km_au_moment_inspection: 89123,
      statut_global: 'conforme',
      anomalies_detectees: false,
      observations_vehicule: 'RAS',
      nom_verificateurs: 'Sophie Blanc',
      element_verifie: 'Inspection complète carrosserie',
      accessoires: ['Carrosserie', 'État peinture', 'État intérieur', 'État vitrage', 'Éclairage', 'Ceintures de sécurité'],
      commentaire: 'Quelques rayures mineures sans gravité.',
    },
  ]);

  const emptyForm = {
    vehicule_immatriculation: '',
    type_inspection: '',
    date_inspection: '',
    km_au_moment_inspection: '',
    statut_global: 'conforme',
    anomalies_detectees: false,
    observations_vehicule: '',
    nom_verificateurs: '',
    element_verifie: '',
    accessoires: [],
    commentaire: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  // ============================================================================
  // MENU DÉROULANT
  // ============================================================================
  const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.action-menu')) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // ============================================================================
  // CRUD
  // ============================================================================
  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    setOpenMenuId(null);
    if (mode === 'edit' && item) {
      setFormData({
        vehicule_immatriculation: item.vehicule_immatriculation || '',
        type_inspection: item.type_inspection || '',
        date_inspection: item.date_inspection || '',
        km_au_moment_inspection: item.km_au_moment_inspection || '',
        statut_global: item.statut_global || 'conforme',
        anomalies_detectees: item.anomalies_detectees || false,
        observations_vehicule: item.observations_vehicule || '',
        nom_verificateurs: item.nom_verificateurs || '',
        element_verifie: item.element_verifie || '',
        accessoires: item.accessoires || [],
        commentaire: item.commentaire || '',
      });
    } else {
      setFormData(emptyForm);
    }
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

  const handleAccessoireToggle = (acc) => {
    setFormData(prev => {
      const exists = prev.accessoires.includes(acc);
      return {
        ...prev,
        accessoires: exists
          ? prev.accessoires.filter(a => a !== acc)
          : [...prev.accessoires, acc],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'create') {
      const newItem = { id: Date.now(), ...formData };
      setInspectionsVehicules(prev => [...prev, newItem]);
    } else if (modalMode === 'edit' && selectedItem) {
      setInspectionsVehicules(prev =>
        prev.map(item => item.id === selectedItem.id ? { ...item, ...formData } : item)
      );
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      setOpenMenuId(null);
      setInspectionsVehicules(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleShowDetail = (item) => {
    setDetailItem(item);
    setOpenMenuId(null);
    setShowDetailModal(true);
  };

  // ============================================================================
  // FILTRAGE & STATS
  // ============================================================================
  const filteredData = searchTerm
    ? inspectionsVehicules.filter(item => {
        const s = searchTerm.toLowerCase();
        return (
          item.vehicule_immatriculation.toLowerCase().includes(s) ||
          item.type_inspection.toLowerCase().includes(s) ||
          item.inspecteur_nom.toLowerCase().includes(s) ||
          item.element_verifie.toLowerCase().includes(s) ||
          (item.observations_vehicule && item.observations_vehicule.toLowerCase().includes(s)) ||
          (item.accessoires && item.accessoires.some(a => a.toLowerCase().includes(s)))
        );
      })
    : inspectionsVehicules;

  const stats = {
    total: inspectionsVehicules.length,
    conformes: inspectionsVehicules.filter(i => i.statut_global === 'conforme').length,
    non_conformes: inspectionsVehicules.filter(i => i.statut_global === 'non_conforme').length,
    danger: inspectionsVehicules.filter(i => i.statut_global === 'danger_immediat').length,
  };

  // ============================================================================
  // HELPERS UI
  // ============================================================================
  const statutBadge = (statut) => {
    if (statut === 'conforme') return 'bg-green-100 text-green-700';
    if (statut === 'non_conforme') return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };
  const statutLabel = (statut) => {
    if (statut === 'conforme') return 'Conforme';
    if (statut === 'non_conforme') return 'Non conforme';
    return 'Danger immédiat';
  };

  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      <Header
        darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile}
      />

      <main className="transition-all duration-300 pt-24 px-6 pb-6" style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}>

        {/* ─── STATISTIQUES ─── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: 'bi-list-ul', color: 'blue' },
            { label: 'Conformes', value: stats.conformes, icon: 'bi-check-circle', color: 'green' },
            { label: 'Non conformes', value: stats.non_conformes, icon: 'bi-exclamation-triangle', color: 'orange' },
            { label: 'Danger immédiat', value: stats.danger, icon: 'bi-shield-fill-exclamation', color: 'red' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{label}</p>
                  <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
                </div>
                <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
                  <i className={`bi ${icon} text-2xl text-${color}-600 dark:text-${color}-400`}></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── BARRE ACTIONS ─── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <i className="bi bi-clipboard-check text-white text-xl"></i>
              </div>
              <div>
                <h2 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Inspections des véhicules</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avec vérification des accessoires</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
                <input
                  type="text" placeholder="Rechercher..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 w-64`}
                />
              </div>
              <button
                onClick={() => handleOpenModal('create')}
                className="px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 hover:shadow-md flex items-center gap-2"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}
              >
                <i className="bi bi-plus-lg"></i>
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* ─── TABLE ─── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <tr>
                  {[
                    'Élément vérifié', 'Véhicule', "Type d'inspection", 'Vérificateur',
                    'Date', 'Kilométrage', 'Anomalies', 'Accessoires', 'Commentaire', 'Statut', 'Actions'
                  ].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <i className={`bi bi-inbox text-5xl mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}></i>
                        <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun élément trouvé</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {searchTerm ? 'Essayez une autre recherche' : 'Commencez par créer un nouvel élément'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.map((item, index) => {
                  const rowBg = index % 2 === 0
                    ? darkMode ? '#1a2535' : '#eef2ff'
                    : darkMode ? '#1c1f2b' : '#f3f4f6';
                  return (
                    <tr key={item.id}
                      style={{ backgroundColor: rowBg, borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = rowBg}
                    >
                      {/* Élément vérifié */}
                      <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        <div className="flex items-center gap-2 max-w-[160px]">
                          <i className="bi bi-check2-square text-purple-500 flex-shrink-0"></i>
                          <span className="truncate text-sm">{item.element_verifie || '-'}</span>
                        </div>
                      </td>
                      {/* Véhicule */}
                      <td className={`px-4 py-3 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <div className="flex items-center gap-2">
                          <i className="bi bi-car-front-fill text-blue-500"></i>
                          <span className="font-medium">{item.vehicule_immatriculation}</span>
                        </div>
                      </td>
                      {/* Type inspection */}
                      <td className={`px-4 py-3 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {item.type_inspection}
                        </span>
                      </td>
                      {/* Vérificateur */}
                      <td className={`px-4 py-3 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-2">
                          <i className="bi bi-person-circle text-purple-500"></i>
                          <span className="text-sm">{item.nom_verificateurs || '-'}</span>
                        </div>
                      </td>
                      {/* Date */}
                      <td className={`px-4 py-3 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-1">
                          <i className="bi bi-calendar3 text-gray-400 text-xs"></i>
                          <span className="text-sm">{new Date(item.date_inspection).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <i className="bi bi-clock text-gray-400 text-xs"></i>
                          <span className="text-xs text-gray-500">{new Date(item.date_inspection).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      {/* Kilométrage */}
                      <td className={`px-4 py-3 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item.km_au_moment_inspection ? (
                          <span className="flex items-center gap-1 text-sm">
                            <i className="bi bi-speedometer2 text-gray-400 text-xs"></i>
                            {Number(item.km_au_moment_inspection).toLocaleString()} km
                          </span>
                        ) : '-'}
                      </td>
                      {/* Anomalies */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {item.anomalies_detectees ? (
                          <i className="bi bi-exclamation-triangle-fill text-red-500 text-lg" title="Anomalies détectées"></i>
                        ) : (
                          <i className="bi bi-check-circle-fill text-green-500 text-lg" title="Pas d'anomalies"></i>
                        )}
                      </td>
                      {/* Accessoires */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {item.accessoires && item.accessoires.length > 0 ? (
                            <>
                              {item.accessoires.slice(0, 2).map(acc => (
                                <span key={acc} className={`px-1.5 py-0.5 rounded text-xs ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                  {acc}
                                </span>
                              ))}
                              {item.accessoires.length > 2 && (
                                <span className={`px-1.5 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                                  +{item.accessoires.length - 2}
                                </span>
                              )}
                            </>
                          ) : <span className="text-gray-400 text-xs">-</span>}
                        </div>
                      </td>
                      {/* Commentaire */}
                      <td className={`px-4 py-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="max-w-[160px] truncate text-sm">{item.commentaire || '-'}</div>
                      </td>
                      {/* Statut */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statutBadge(item.statut_global)}`}>
                          {statutLabel(item.statut_global)}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="relative action-menu inline-block">
                          <button
                            onClick={() => toggleMenu(item.id)}
                            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>
                          {openMenuId === item.id && (
                            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                              <div className="py-1">
                                <button onClick={() => handleShowDetail(item)}
                                  className={`w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} flex items-center gap-2`}>
                                  <i className="bi bi-eye text-purple-500"></i>Voir détails
                                </button>
                                <button onClick={() => handleOpenModal('edit', item)}
                                  className={`w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} flex items-center gap-2`}>
                                  <i className="bi bi-pencil-square text-blue-500"></i>Modifier
                                </button>
                                <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                                <button onClick={() => handleDelete(item.id)}
                                  className={`w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'} flex items-center gap-2`}>
                                  <i className="bi bi-trash3"></i>Supprimer
                                </button>
                              </div>
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
        </div>

        {/* Footer */}
        <div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-center">
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              © 2026 SGS Tous droits réservés - Version 1.0
            </p>
          </div>
        </div>
      </main>

      {/* ============================================================================
          MODAL CRUD — LARGE
      ============================================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-10">
            <div className="fixed inset-0 bg-black bg-opacity-60" onClick={handleCloseModal}></div>
            <div className={`relative w-full max-w-7xl rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'} overflow-hidden`}>
              {/* Header modal */}
              <div className="px-8 py-5 border-b flex items-center justify-between"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <div className="flex items-center gap-3">
                  <i className={`bi ${modalMode === 'create' ? 'bi-plus-circle' : 'bi-pencil-square'} text-white text-xl`}></i>
                  <h3 className="text-lg font-bold text-white">
                    {modalMode === 'create' ? 'Créer une inspection' : 'Modifier l\'inspection'}
                  </h3>
                </div>
                <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-8 py-6 max-h-[75vh] overflow-y-auto">
                  {/* Grille 3 colonnes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                    {/* Immatriculation — menu déroulant */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Véhicule (immatriculation) <span className="text-red-500">*</span>
                      </label>
                      <select name="vehicule_immatriculation" value={formData.vehicule_immatriculation}
                        onChange={handleInputChange} required
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                        <option value="">Sélectionner un véhicule</option>
                        {VEHICULES_LIST.map(v => (
                          <option key={v.immatriculation} value={v.immatriculation}>{v.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Type d'inspection */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Type d'inspection <span className="text-red-500">*</span>
                      </label>
                      <select name="type_inspection" value={formData.type_inspection} onChange={handleInputChange} required
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                        <option value="">Sélectionner un type</option>
                        <option value="Inspection quotidienne">Inspection quotidienne</option>
                        <option value="Inspection hebdomadaire">Inspection hebdomadaire</option>
                        <option value="Inspection mensuelle">Inspection mensuelle</option>
                        <option value="Inspection TF">Inspection TF</option>
                        <option value="Inspection complète">Inspection complète</option>
                      </select>
                    </div>

                    {/* Date inspection */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Date et heure <span className="text-red-500">*</span>
                      </label>
                      <input type="datetime-local" name="date_inspection" value={formData.date_inspection}
                        onChange={handleInputChange} required
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                    </div>

                    {/* Kilométrage */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kilométrage</label>
                      <input type="number" name="km_au_moment_inspection" value={formData.km_au_moment_inspection}
                        onChange={handleInputChange} placeholder="Ex: 45230"
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                    </div>

                    {/* Statut global */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Statut global <span className="text-red-500">*</span>
                      </label>
                      <select name="statut_global" value={formData.statut_global} onChange={handleInputChange} required
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                        <option value="conforme">Conforme</option>
                        <option value="non_conforme">Non conforme</option>
                        <option value="danger_immediat">Danger immédiat</option>
                      </select>
                    </div>

                    {/* Vérificateurs */}
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Vérificateurs</label>
                      <input type="text" name="nom_verificateurs" value={formData.nom_verificateurs}
                        onChange={handleInputChange} placeholder="Ex: Jean Dupont, Marie Martin"
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                    </div>
                  </div>

                  {/* Élément inspecté — pleine largeur */}
                  <div className="mb-5">
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Élément inspecté <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name="element_verifie" value={formData.element_verifie}
                      onChange={handleInputChange} required placeholder="Ex: Vérification du système de freinage, contrôle moteur..."
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                  </div>

                  {/* ─── ACCESSOIRES ─── */}
                  <div className="mb-5">
                    <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Accessoires inspectés
                      <span className={`ml-2 text-xs font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        ({formData.accessoires.length} sélectionné{formData.accessoires.length > 1 ? 's' : ''})
                      </span>
                    </label>
                    <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {ACCESSOIRES_LIST.map(acc => {
                          const checked = formData.accessoires.includes(acc);
                          return (
                            <label key={acc}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm select-none
                                ${checked
                                  ? darkMode ? 'bg-blue-900/50 border border-blue-500 text-blue-300' : 'bg-blue-50 border border-blue-400 text-blue-700'
                                  : darkMode ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                              <input type="checkbox" className="hidden" checked={checked}
                                onChange={() => handleAccessoireToggle(acc)} />
                              <i className={`bi ${checked ? 'bi-check-square-fill text-blue-500' : 'bi-square text-gray-400'} flex-shrink-0`}></i>
                              <span className="truncate">{acc}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Grille 2 colonnes : observations + commentaire */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Observations sur le véhicule</label>
                      <textarea name="observations_vehicule" value={formData.observations_vehicule} onChange={handleInputChange} rows="3"
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Observations générales sur le véhicule..." />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Commentaire / Préconisations</label>
                      <textarea name="commentaire" value={formData.commentaire} onChange={handleInputChange} rows="3"
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Commentaires additionnels, préconisations..." />
                    </div>
                  </div>

                  {/* Anomalies détectées */}
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="anomalies_detectees" name="anomalies_detectees"
                      checked={formData.anomalies_detectees} onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="anomalies_detectees" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Anomalies détectées
                    </label>
                  </div>
                </div>

                {/* Footer modal */}
                <div className={`px-8 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200 bg-gray-50'} flex justify-end gap-3`}>
                  <button type="button" onClick={handleCloseModal}
                    className={`px-5 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}>
                    Annuler
                  </button>
                  <button type="submit"
                    className="px-5 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 hover:shadow-md flex items-center gap-2"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                    <i className={`bi ${modalMode === 'create' ? 'bi-plus-lg' : 'bi-check-lg'}`}></i>
                    {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL DÉTAIL
      ============================================================================ */}
      {showDetailModal && detailItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-10">
            <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setShowDetailModal(false)}></div>
            <div className={`relative w-full max-w-7xl rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'} overflow-hidden`}>

              {/* Header */}
              <div className="px-8 py-5 flex items-center justify-between"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <div className="flex items-center gap-3">
                  <i className="bi bi-file-earmark-text text-white text-2xl"></i>
                  <div>
                    <h3 className="text-lg font-bold text-white">Détail de l'inspection</h3>
                    <p className="text-white/70 text-sm">{detailItem.vehicule_immatriculation} — {new Date(detailItem.date_inspection).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="px-8 py-6 max-h-[80vh] overflow-y-auto">

                {/* Statut badge */}
                <div className="flex items-center gap-3 mb-6">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${statutBadge(detailItem.statut_global)}`}>
                    <i className={`bi ${detailItem.statut_global === 'conforme' ? 'bi-check-circle' : detailItem.statut_global === 'non_conforme' ? 'bi-exclamation-triangle' : 'bi-shield-fill-exclamation'} mr-2`}></i>
                    {statutLabel(detailItem.statut_global)}
                  </span>
                  {detailItem.anomalies_detectees && (
                    <span className="px-3 py-2 rounded-full text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                      Anomalies détectées
                    </span>
                  )}
                </div>

                {/* Infos générales */}
                <div className={`rounded-xl border p-5 mb-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <i className="bi bi-info-circle mr-2"></i>Informations générales
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Véhicule', value: detailItem.vehicule_immatriculation, icon: 'bi-car-front-fill', color: 'text-blue-500' },
                      { label: "Type d'inspection", value: detailItem.type_inspection, icon: 'bi-clipboard-check', color: 'text-purple-500' },
                      { label: 'Date', value: new Date(detailItem.date_inspection).toLocaleString('fr-FR'), icon: 'bi-calendar3', color: 'text-orange-500' },
                      { label: 'Kilométrage', value: detailItem.km_au_moment_inspection ? `${Number(detailItem.km_au_moment_inspection).toLocaleString()} km` : '-', icon: 'bi-speedometer2', color: 'text-cyan-500' },
                      { label: 'Vérificateurs', value: detailItem.nom_verificateurs || '-', icon: 'bi-people', color: 'text-pink-500' },
                    ].map(({ label, value, icon, color }) => (
                      <div key={label}>
                        <p className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>{label}</p>
                        <div className="flex items-center gap-2">
                          <i className={`bi ${icon} ${color} text-sm`}></i>
                          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Élément inspecté */}
                <div className={`rounded-xl border p-5 mb-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <i className="bi bi-check2-square mr-2 text-purple-500"></i>Élément inspecté
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{detailItem.element_verifie || '-'}</p>
                </div>

                {/* Accessoires */}
                <div className={`rounded-xl border p-5 mb-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <i className="bi bi-grid-3x3-gap mr-2 text-blue-500"></i>
                    Accessoires inspectés ({detailItem.accessoires?.length || 0})
                  </h4>
                  {detailItem.accessoires && detailItem.accessoires.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {detailItem.accessoires.map(acc => (
                        <div key={acc} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
                          ${darkMode ? 'bg-blue-900/30 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                          <i className="bi bi-check-circle-fill text-green-500 flex-shrink-0"></i>
                          <span>{acc}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Aucun accessoire sélectionné.</p>
                  )}
                </div>

                {/* Observations & Commentaires */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className={`rounded-xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <i className="bi bi-chat-text mr-2 text-orange-500"></i>Observations
                    </h4>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {detailItem.observations_vehicule || 'Aucune observation.'}
                    </p>
                  </div>
                  <div className={`rounded-xl border p-5 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <i className="bi bi-clipboard2-pulse mr-2 text-cyan-500"></i>Commentaires / Préconisations
                    </h4>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {detailItem.commentaire || 'Aucun commentaire.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer modal détail */}
              <div className={`px-8 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200 bg-gray-50'} flex justify-end gap-3`}>
                <button onClick={() => { setShowDetailModal(false); handleOpenModal('edit', detailItem); }}
                  className="px-5 py-2 rounded-lg text-white font-medium flex items-center gap-2 hover:opacity-90"
                  style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                  <i className="bi bi-pencil-square"></i>Modifier
                </button>
                <button onClick={() => setShowDetailModal(false)}
                  className={`px-5 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionVehicules;