import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

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

  const [activeFilter, setActiveFilter] = useState('inspections');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  // ============================================================================
  // DONNÉES
  // ============================================================================
  const [inspectionsVehicules, setInspectionsVehicules] = useState([
    {
      id: 1, inspection_id: 1,
      vehicule_immatriculation: 'AB-1234-GA',
      type_inspection: 'Inspection quotidienne',
      inspecteur_nom: 'Jean Dupont',
      date_inspection: '2026-02-05 08:30:00',
      km_au_moment_inspection: 45230,
      statut_global: 'conforme',
      anomalies_detectees: false,
      observations_vehicule: 'Véhicule en bon état général',
      nom_verificateurs: 'Jean Dupont, Marie Martin'
    },
    {
      id: 2, inspection_id: 2,
      vehicule_immatriculation: 'CD-5678-GA',
      type_inspection: 'Inspection hebdomadaire',
      inspecteur_nom: 'Marie Martin',
      date_inspection: '2026-02-04 14:15:00',
      km_au_moment_inspection: 67890,
      statut_global: 'non_conforme',
      anomalies_detectees: true,
      observations_vehicule: 'Pneus avant usés, remplacement nécessaire',
      nom_verificateurs: 'Marie Martin'
    },
    {
      id: 3, inspection_id: 3,
      vehicule_immatriculation: 'EF-9012-GA',
      type_inspection: 'Inspection TF',
      inspecteur_nom: 'Pierre Leblanc',
      date_inspection: '2026-02-03 09:00:00',
      km_au_moment_inspection: 23450,
      statut_global: 'danger_immediat',
      anomalies_detectees: true,
      observations_vehicule: 'Freins défectueux - DANGER IMMÉDIAT',
      nom_verificateurs: 'Pierre Leblanc, Jacques Noir'
    },
    {
      id: 4, inspection_id: 4,
      vehicule_immatriculation: 'GH-3456-GA',
      type_inspection: 'Inspection mensuelle',
      inspecteur_nom: 'Sophie Blanc',
      date_inspection: '2026-02-01 10:30:00',
      km_au_moment_inspection: 89123,
      statut_global: 'conforme',
      anomalies_detectees: false,
      observations_vehicule: 'RAS',
      nom_verificateurs: 'Sophie Blanc'
    },
  ]);

  const [elementsInspectes, setElementsInspectes] = useState([
    { id: 1, inspection_vehicule_id: 1, vehicule_immatriculation: 'AB-1234-GA', checklist_libelle: 'Niveaux fluides', element_verifie: 'Niveau huile moteur', statut: 'OK', valeur_relevee: 'Normal', commentaire: 'Niveau correct', date_inspection: '2026-02-05 08:30:00' },
    { id: 2, inspection_vehicule_id: 1, vehicule_immatriculation: 'AB-1234-GA', checklist_libelle: 'Niveaux fluides', element_verifie: 'Niveau liquide de refroidissement', statut: 'OK', valeur_relevee: 'Normal', commentaire: 'RAS', date_inspection: '2026-02-05 08:30:00' },
    { id: 3, inspection_vehicule_id: 2, vehicule_immatriculation: 'CD-5678-GA', checklist_libelle: 'Pneumatiques', element_verifie: 'État pneu avant gauche', statut: 'use', valeur_relevee: '3mm', commentaire: 'Usure importante, remplacement nécessaire', date_inspection: '2026-02-04 14:15:00' },
    { id: 4, inspection_vehicule_id: 2, vehicule_immatriculation: 'CD-5678-GA', checklist_libelle: 'Pneumatiques', element_verifie: 'État pneu avant droit', statut: 'use', valeur_relevee: '2.5mm', commentaire: 'Usure critique', date_inspection: '2026-02-04 14:15:00' },
    { id: 5, inspection_vehicule_id: 3, vehicule_immatriculation: 'EF-9012-GA', checklist_libelle: 'Freinage', element_verifie: 'Plaquettes de frein avant', statut: 'defectueux', valeur_relevee: '1mm', commentaire: 'DANGER - Plaquettes usées au métal', date_inspection: '2026-02-03 09:00:00' },
    { id: 6, inspection_vehicule_id: 3, vehicule_immatriculation: 'EF-9012-GA', checklist_libelle: 'Freinage', element_verifie: 'Liquide de frein', statut: 'NOK', valeur_relevee: 'Bas', commentaire: 'Niveau critique', date_inspection: '2026-02-03 09:00:00' },
    { id: 7, inspection_vehicule_id: 4, vehicule_immatriculation: 'GH-3456-GA', checklist_libelle: 'Carrosserie', element_verifie: 'État général carrosserie', statut: 'OK', valeur_relevee: 'Bon', commentaire: 'Quelques rayures mineures', date_inspection: '2026-02-01 10:30:00' },
  ]);

  const [formData, setFormData] = useState({
    vehicule_immatriculation: '', type_inspection:  '',
    date_inspection: '', km_au_moment_inspection: '', statut_global: 'conforme',
    anomalies_detectees: false, observations_vehicule: '', nom_verificateurs: '',
    inspection_vehicule_id: '', checklist_libelle: '', element_verifie: '',
    statut: 'OK', valeur_relevee: '', commentaire: '',
  });

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
        inspecteur_nom: item.inspecteur_nom || '',
        date_inspection: item.date_inspection || '',
        km_au_moment_inspection: item.km_au_moment_inspection || '',
        statut_global: item.statut_global || 'conforme',
        anomalies_detectees: item.anomalies_detectees || false,
        observations_vehicule: item.observations_vehicule || '',
        nom_verificateurs: item.nom_verificateurs || '',
        inspection_vehicule_id: item.inspection_vehicule_id || '',
        checklist_libelle: item.checklist_libelle || '',
        element_verifie: item.element_verifie || '',
        statut: item.statut || 'OK',
        valeur_relevee: item.valeur_relevee || '',
        commentaire: item.commentaire || '',
      });
    } else {
      setFormData({
        vehicule_immatriculation: '', type_inspection: '', inspecteur_nom: '',
        date_inspection: '', km_au_moment_inspection: '', statut_global: 'conforme',
        anomalies_detectees: false, observations_vehicule: '', nom_verificateurs: '',
        inspection_vehicule_id: '', checklist_libelle: '', element_verifie: '',
        statut: 'OK', valeur_relevee: '', commentaire: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setFormData({
      vehicule_immatriculation: '', type_inspection: '', inspecteur_nom: '',
      date_inspection: '', km_au_moment_inspection: '', statut_global: 'conforme',
      anomalies_detectees: false, observations_vehicule: '', nom_verificateurs: '',
      inspection_vehicule_id: '', checklist_libelle: '', element_verifie: '',
      statut: 'OK', valeur_relevee: '', commentaire: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'create') {
      const newItem = { id: Date.now(), ...formData };
      if (activeFilter === 'inspections') setInspectionsVehicules([...inspectionsVehicules, newItem]);
      else setElementsInspectes([...elementsInspectes, newItem]);
    } else if (modalMode === 'edit' && selectedItem) {
      if (activeFilter === 'inspections') {
        setInspectionsVehicules(inspectionsVehicules.map(item => item.id === selectedItem.id ? { ...item, ...formData } : item));
      } else {
        setElementsInspectes(elementsInspectes.map(item => item.id === selectedItem.id ? { ...item, ...formData } : item));
      }
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      setOpenMenuId(null);
      if (activeFilter === 'inspections') setInspectionsVehicules(inspectionsVehicules.filter(item => item.id !== id));
      else setElementsInspectes(elementsInspectes.filter(item => item.id !== id));
    }
  };

  // ============================================================================
  // FILTRAGE
  // ============================================================================
  const getFilteredData = () => {
    let data = activeFilter === 'inspections' ? inspectionsVehicules : elementsInspectes;
    if (searchTerm) {
      return data.filter(item => {
        const s = searchTerm.toLowerCase();
        if (activeFilter === 'inspections') {
          return item.vehicule_immatriculation.toLowerCase().includes(s) ||
                 item.type_inspection.toLowerCase().includes(s) ||
                 item.inspecteur_nom.toLowerCase().includes(s) ||
                 (item.observations_vehicule && item.observations_vehicule.toLowerCase().includes(s));
        } else {
          return item.vehicule_immatriculation.toLowerCase().includes(s) ||
                 item.element_verifie.toLowerCase().includes(s) ||
                 item.checklist_libelle.toLowerCase().includes(s) ||
                 (item.commentaire && item.commentaire.toLowerCase().includes(s));
        }
      });
    }
    return data;
  };

  const filteredData = getFilteredData();

  const getStats = () => {
    if (activeFilter === 'inspections') {
      return {
        total: inspectionsVehicules.length,
        conformes: inspectionsVehicules.filter(i => i.statut_global === 'conforme').length,
        non_conformes: inspectionsVehicules.filter(i => i.statut_global === 'non_conforme').length,
        danger: inspectionsVehicules.filter(i => i.statut_global === 'danger_immediat').length,
      };
    } else {
      return {
        total: elementsInspectes.length,
        ok: elementsInspectes.filter(e => e.statut === 'OK').length,
        nok: elementsInspectes.filter(e => e.statut === 'NOK').length,
        defectueux: elementsInspectes.filter(e => e.statut === 'defectueux').length,
      };
    }
  };

  const stats = getStats();

  // ============================================================================
  // FORM FIELDS
  // ============================================================================
  const renderFormFields = () => {
    if (activeFilter === 'inspections') {
      return (
        <>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Immatriculation du véhicule <span className="text-red-500">*</span></label>
            <input type="text" name="vehicule_immatriculation" value={formData.vehicule_immatriculation} onChange={handleInputChange} required
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ex: AB-1234-GA" />
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type d'inspection <span className="text-red-500">*</span></label>
            <select name="type_inspection" value={formData.type_inspection} onChange={handleInputChange} required
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
              <option value="">Sélectionner un type</option>
              <option value="Inspection quotidienne">Inspection quotidienne</option>
              <option value="Inspection hebdomadaire">Inspection hebdomadaire</option>
              <option value="Inspection mensuelle">Inspection mensuelle</option>
              <option value="Inspection TF">Inspection TF</option>
              <option value="Inspection complète">Inspection complète</option>
            </select>
          </div>
        
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date et heure d'inspection <span className="text-red-500">*</span></label>
            <input type="datetime-local" name="date_inspection" value={formData.date_inspection} onChange={handleInputChange} required
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kilométrage au moment de l'inspection</label>
            <input type="number" name="km_au_moment_inspection" value={formData.km_au_moment_inspection} onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ex: 45230" />
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Statut global <span className="text-red-500">*</span></label>
            <select name="statut_global" value={formData.statut_global} onChange={handleInputChange} required
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
              <option value="conforme">Conforme</option>
              <option value="non_conforme">Non conforme</option>
              <option value="danger_immediat">Danger immédiat</option>
            </select>
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Vérificateurs</label>
            <input type="text" name="nom_verificateurs" value={formData.nom_verificateurs} onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ex: Jean Dupont, Marie Martin" />
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Observations sur le véhicule</label>
            <textarea name="observations_vehicule" value={formData.observations_vehicule} onChange={handleInputChange} rows="3"
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Observations générales..." />
          </div>
          <div className="mb-4 flex items-center">
            <input type="checkbox" name="anomalies_detectees" checked={formData.anomalies_detectees} onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Anomalies détectées</label>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Immatriculation du véhicule <span className="text-red-500">*</span></label>
            <input type="text" name="vehicule_immatriculation" value={formData.vehicule_immatriculation} onChange={handleInputChange} required
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ex: AB-1234-GA" />
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Checklist <span className="text-red-500">*</span></label>
            <select name="checklist_libelle" value={formData.checklist_libelle} onChange={handleInputChange} required
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
              <option value="">Sélectionner une checklist</option>
              <option value="Niveaux fluides">Niveaux fluides</option>
              <option value="Pneumatiques">Pneumatiques</option>
              <option value="Freinage">Freinage</option>
              <option value="Carrosserie">Carrosserie</option>
              <option value="Électricité">Électricité</option>
              <option value="Équipements sécurité">Équipements sécurité</option>
            </select>
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Élément vérifié <span className="text-red-500">*</span></label>
            <input type="text" name="element_verifie" value={formData.element_verifie} onChange={handleInputChange} required
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ex: Niveau huile moteur" />
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Statut <span className="text-red-500">*</span></label>
            <select name="statut" value={formData.statut} onChange={handleInputChange} required
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
              <option value="OK">OK</option>
              <option value="NOK">NOK</option>
              <option value="manquant">Manquant</option>
              <option value="use">Usé</option>
              <option value="defectueux">Défectueux</option>
            </select>
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Valeur relevée</label>
            <input type="text" name="valeur_relevee" value={formData.valeur_relevee} onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ex: 3mm, Normal, Bas..." />
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Commentaire</label>
            <textarea name="commentaire" value={formData.commentaire} onChange={handleInputChange} rows="3"
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Commentaires additionnels..." />
          </div>
        </>
      );
    }
  };

  // ============================================================================
  // ✅ RENDER TABLE COLUMNS — texte blanc sur fond thème
  // ============================================================================
  const renderTableColumns = () => {
    if (activeFilter === 'inspections') {
      return (
        <>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Véhicule</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Type d'inspection</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Vérificateur</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Date</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Kilométrage</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Statut</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Anomalies</th>
          <th className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
        </>
      );
    } else {
      return (
        <>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Véhicule</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Checklist</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Élément vérifié</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Statut</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Valeur relevée</th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Commentaire</th>
          <th className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
        </>
      );
    }
  };

  // ============================================================================
  // ✅ RENDER TABLE ROWS — lignes alternées bleu pastel / gris pastel
  // ============================================================================
  const renderTableRows = () => {
    if (filteredData.length === 0) {
      return (
        <tr>
          <td colSpan="8" className="px-6 py-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <i className={`bi bi-inbox text-5xl mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}></i>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun élément trouvé</p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {searchTerm ? 'Essayez une autre recherche' : 'Commencez par créer un nouvel élément'}
              </p>
            </div>
          </td>
        </tr>
      );
    }

    if (activeFilter === 'inspections') {
      return filteredData.map((item, index) => {
        const rowStyle = {
          backgroundColor: index % 2 === 0
            ? darkMode ? '#1a2535' : '#eef2ff'
            : darkMode ? '#1c1f2b' : '#f3f4f6',
          borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
          transition: 'background-color 0.15s ease'
        };
        const onMouseEnter = (e) => { e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`; };
        const onMouseLeave = (e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? (darkMode ? '#1a2535' : '#eef2ff') : (darkMode ? '#1c1f2b' : '#f3f4f6'); };

        return (
          <tr key={item.id} style={rowStyle} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2">
                <i className="bi bi-car-front-fill text-blue-500"></i>
                <span className="font-medium">{item.vehicule_immatriculation}</span>
              </div>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                {item.type_inspection}
              </span>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex items-center gap-2">
                <i className="bi bi-person-circle text-purple-500"></i>
                {item.inspecteur_nom}
              </div>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex items-center gap-1">
                <i className="bi bi-calendar3 text-gray-400 text-xs"></i>
                <span className="text-sm">{new Date(item.date_inspection).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <i className="bi bi-clock text-gray-400 text-xs"></i>
                <span className="text-xs text-gray-500">{new Date(item.date_inspection).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {item.km_au_moment_inspection ? (
                <span className="flex items-center gap-1">
                  <i className="bi bi-speedometer2 text-gray-400 text-xs"></i>
                  {item.km_au_moment_inspection.toLocaleString()} km
                </span>
              ) : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.statut_global === 'conforme'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : item.statut_global === 'non_conforme'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {item.statut_global === 'conforme' ? 'Conforme' : item.statut_global === 'non_conforme' ? 'Non conforme' : 'Danger immédiat'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              {item.anomalies_detectees ? (
                <i className="bi bi-exclamation-triangle-fill text-red-500 text-lg" title="Anomalies détectées"></i>
              ) : (
                <i className="bi bi-check-circle-fill text-green-500 text-lg" title="Pas d'anomalies"></i>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
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
                      <button onClick={() => handleOpenModal('edit', item)}
                        className={`w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} flex items-center gap-2`}>
                        <i className="bi bi-pencil-square text-blue-500"></i>Modifier
                      </button>
                      <button className={`w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} flex items-center gap-2`}>
                        <i className="bi bi-eye text-purple-500"></i>Voir détails
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
      });
    } else {
      return filteredData.map((item, index) => {
        const rowStyle = {
          backgroundColor: index % 2 === 0
            ? darkMode ? '#1a2535' : '#eef2ff'
            : darkMode ? '#1c1f2b' : '#f3f4f6',
          borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
          transition: 'background-color 0.15s ease'
        };
        const onMouseEnter = (e) => { e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`; };
        const onMouseLeave = (e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? (darkMode ? '#1a2535' : '#eef2ff') : (darkMode ? '#1c1f2b' : '#f3f4f6'); };

        return (
          <tr key={item.id} style={rowStyle} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2">
                <i className="bi bi-car-front-fill text-blue-500"></i>
                <span className="font-medium">{item.vehicule_immatriculation}</span>
              </div>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                {item.checklist_libelle}
              </span>
            </td>
            <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex items-center gap-2">
                <i className="bi bi-check2-square text-purple-500"></i>
                {item.element_verifie}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.statut === 'OK'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : item.statut === 'NOK'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : item.statut === 'use'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : item.statut === 'defectueux'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {item.statut}
              </span>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {item.valeur_relevee || '-'}
            </td>
            <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="max-w-xs truncate">{item.commentaire || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
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
      });
    }
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
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</h3>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <i className="bi bi-list-ul text-2xl text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </div>

          {activeFilter === 'inspections' ? (
            <>
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Conformes</p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.conformes}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <i className="bi bi-check-circle text-2xl text-green-600 dark:text-green-400"></i>
                  </div>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Non conformes</p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.non_conformes}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <i className="bi bi-exclamation-triangle text-2xl text-orange-600 dark:text-orange-400"></i>
                  </div>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Danger immédiat</p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.danger}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
                    <i className="bi bi-shield-fill-exclamation text-2xl text-red-600 dark:text-red-400"></i>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>OK</p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.ok}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <i className="bi bi-check-circle text-2xl text-green-600 dark:text-green-400"></i>
                  </div>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>NOK</p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.nok}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <i className="bi bi-x-circle text-2xl text-orange-600 dark:text-orange-400"></i>
                  </div>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Défectueux</p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.defectueux}</h3>
                  </div>
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
                    <i className="bi bi-shield-fill-exclamation text-2xl text-red-600 dark:text-red-400"></i>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── FILTRES ET ACTIONS ─── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('inspections')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeFilter === 'inspections' ? 'text-white shadow-md' : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}`}
                style={activeFilter === 'inspections' ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
              >
                <i className="bi bi-clipboard-check"></i>
                Inspections de véhicules
              </button>
              <button
                onClick={() => setActiveFilter('elements')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeFilter === 'elements' ? 'text-white shadow-md' : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}`}
                style={activeFilter === 'elements' ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
              >
                <i className="bi bi-list-check"></i>
                Éléments inspectés
              </button>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
                <input
                  type="text" placeholder="Rechercher..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 w-64`}
                  style={{ '--tw-ring-color': theme.primary }}
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

              {/* ✅ THEAD — vraie couleur du thème actif */}
              <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <tr>
                  {renderTableColumns()}
                </tr>
              </thead>

              {/* ✅ TBODY — lignes alternées bleu pastel / gris pastel */}
              <tbody>
                {renderTableRows()}
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

      {/* ─── MODAL CRUD ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={handleCloseModal}></div>
            <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {modalMode === 'create' ? 'Créer' : 'Modifier'} - {activeFilter === 'inspections' ? 'Inspection de véhicule' : 'Élément inspecté'}
                  </h3>
                  <button onClick={handleCloseModal}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                  {renderFormFields()}
                </div>
                <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200 bg-gray-50'} flex justify-end gap-3`}>
                  <button type="button" onClick={handleCloseModal}
                    className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}>
                    Annuler
                  </button>
                  <button type="submit"
                    className="px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 hover:shadow-md"
                    style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                    {modalMode === 'create' ? 'Créer' : 'Modifier'}
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

export default InspectionVehicules;