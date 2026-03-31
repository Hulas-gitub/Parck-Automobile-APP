import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

// ============================================================================
// IMPORTS DES COMPOSANTS SÉPARÉS - SIDEBAR ET HEADER
// ============================================================================
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
// ============================================================================

const Interventions = () => {
  // ── Dark mode: persiste dans localStorage, default = true (sombre) ──
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

  // ============================================================================
  // ÉTATS POUR LES FILTRES ET MODALS
  // ============================================================================
  const [activeFilter, setActiveFilter] = useState('interventions'); // interventions, inspections, intervenants, checklists
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null); // Pour gérer le menu déroulant ouvert

  // ============================================================================
  // DONNÉES FACTICES (À REMPLACER PAR APPELS API)
  // ============================================================================
  
  // Types d'Intervention
  const [typesIntervention, setTypesIntervention] = useState([
    { id: 1, libelle: 'Vidange moteur', code: 'vidange', description: 'Changement d\'huile moteur', frequence_km: 10000, est_actif: true },
    { id: 2, libelle: 'Révision complète', code: 'revision_complete', description: 'Révision complète du véhicule', frequence_km: 30000, est_actif: true },
    { id: 3, libelle: 'Changement freins', code: 'freins', description: 'Remplacement des plaquettes de frein', frequence_km: 50000, est_actif: true },
    { id: 4, libelle: 'Changement pneus', code: 'pneus', description: 'Remplacement des pneumatiques', frequence_km: 40000, est_actif: true },
    { id: 5, libelle: 'Réparation carrosserie', code: 'carrosserie', description: 'Réparation de la carrosserie', frequence_km: null, est_actif: true },
  ]);

  // Types d'Inspection
  const [typesInspection, setTypesInspection] = useState([
    { id: 1, libelle: 'Inspection quotidienne', code: 'quotidienne', description: 'Inspection quotidienne avant départ', frequence_jours: 1, est_obligatoire: true, est_actif: true },
    { id: 2, libelle: 'Inspection hebdomadaire', code: 'hebdomadaire', description: 'Inspection hebdomadaire complète', frequence_jours: 7, est_obligatoire: false, est_actif: true },
    { id: 3, libelle: 'Inspection mensuelle', code: 'mensuelle', description: 'Inspection mensuelle détaillée', frequence_jours: 30, est_obligatoire: false, est_actif: true },
    { id: 4, libelle: 'Inspection TF', code: 'tf', description: 'Inspection spéciale Transport de Fonds', frequence_jours: 1, est_obligatoire: true, est_actif: true },
  ]);

  // Types d'Intervenant
  const [typesIntervenant, setTypesIntervenant] = useState([
    { id: 1, libelle: 'Mécanicien général', code: 'mecanicien', description: 'Mécanicien polyvalent', competences_requises: 'Mécanique générale, diagnostics', est_actif: true },
    { id: 2, libelle: 'Électricien automobile', code: 'electricien', description: 'Spécialiste électricité véhicule', competences_requises: 'Électricité, électronique embarquée', est_actif: true },
    { id: 3, libelle: 'Carrossier', code: 'carrossier', description: 'Spécialiste carrosserie', competences_requises: 'Carrosserie, peinture', est_actif: true },
    { id: 4, libelle: 'Pneumaticien', code: 'pneumaticien', description: 'Spécialiste pneus', competences_requises: 'Pneumatiques, équilibrage', est_actif: true },
  ]);

  // Checklists
  const [checklists, setChecklists] = useState([
    { id: 1, libelle: 'Checklist vidange', code: 'checklist_vidange', description: 'Points de contrôle pour vidange', categorie: 'niveaux_fluides', type_inspection_id: 2, est_actif: true },
    { id: 2, libelle: 'Checklist freins', code: 'checklist_freins', description: 'Points de contrôle système de freinage', categorie: 'freinage', type_inspection_id: 2, est_actif: true },
    { id: 3, libelle: 'Checklist TF', code: 'checklist_tf', description: 'Checklist Transport de Fonds', categorie: 'equipements_securite', type_inspection_id: 4, est_actif: true },
    { id: 4, libelle: 'Checklist pneumatiques', code: 'checklist_pneus', description: 'Contrôle des pneumatiques', categorie: 'pneumatiques', type_inspection_id: 1, est_actif: true },
  ]);

  // ============================================================================
  // FORM DATA STATE
  // ============================================================================
  const [formData, setFormData] = useState({
    libelle: '',
    code: '',
    description: '',
    frequence_km: '',
    frequence_jours: '',
    est_obligatoire: false,
    est_actif: true,
    competences_requises: '',
    categorie: '',
    type_inspection_id: '',
  });

  // ============================================================================
  // GESTION DU MENU DÉROULANT
  // ============================================================================
  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.action-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // ============================================================================
  // FONCTIONS CRUD
  // ============================================================================
  
  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    setOpenMenuId(null); // Fermer le menu
    
    if (mode === 'edit' && item) {
      setFormData({
        libelle: item.libelle || '',
        code: item.code || '',
        description: item.description || '',
        frequence_km: item.frequence_km || '',
        frequence_jours: item.frequence_jours || '',
        est_obligatoire: item.est_obligatoire || false,
        est_actif: item.est_actif !== undefined ? item.est_actif : true,
        competences_requises: item.competences_requises || '',
        categorie: item.categorie || '',
        type_inspection_id: item.type_inspection_id || '',
      });
    } else {
      // Reset form pour création
      setFormData({
        libelle: '',
        code: '',
        description: '',
        frequence_km: '',
        frequence_jours: '',
        est_obligatoire: false,
        est_actif: true,
        competences_requises: '',
        categorie: '',
        type_inspection_id: '',
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setFormData({
      libelle: '',
      code: '',
      description: '',
      frequence_km: '',
      frequence_jours: '',
      est_obligatoire: false,
      est_actif: true,
      competences_requises: '',
      categorie: '',
      type_inspection_id: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // TODO: Appel API Backend
    if (modalMode === 'create') {
      // Créer un nouvel élément
      const newItem = {
        id: Date.now(), // Temporaire, remplacer par ID du backend
        ...formData
      };
      
      switch (activeFilter) {
        case 'interventions':
          setTypesIntervention([...typesIntervention, newItem]);
          break;
        case 'inspections':
          setTypesInspection([...typesInspection, newItem]);
          break;
        case 'intervenants':
          setTypesIntervenant([...typesIntervenant, newItem]);
          break;
        case 'checklists':
          setChecklists([...checklists, newItem]);
          break;
        default:
          break;
      }
    } else if (modalMode === 'edit' && selectedItem) {
      // Modifier un élément existant
      switch (activeFilter) {
        case 'interventions':
          setTypesIntervention(typesIntervention.map(item => 
            item.id === selectedItem.id ? { ...item, ...formData } : item
          ));
          break;
        case 'inspections':
          setTypesInspection(typesInspection.map(item => 
            item.id === selectedItem.id ? { ...item, ...formData } : item
          ));
          break;
        case 'intervenants':
          setTypesIntervenant(typesIntervenant.map(item => 
            item.id === selectedItem.id ? { ...item, ...formData } : item
          ));
          break;
        case 'checklists':
          setChecklists(checklists.map(item => 
            item.id === selectedItem.id ? { ...item, ...formData } : item
          ));
          break;
        default:
          break;
      }
    }
    
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      setOpenMenuId(null); // Fermer le menu
      // TODO: Appel API Backend
      switch (activeFilter) {
        case 'interventions':
          setTypesIntervention(typesIntervention.filter(item => item.id !== id));
          break;
        case 'inspections':
          setTypesInspection(typesInspection.filter(item => item.id !== id));
          break;
        case 'intervenants':
          setTypesIntervenant(typesIntervenant.filter(item => item.id !== id));
          break;
        case 'checklists':
          setChecklists(checklists.filter(item => item.id !== id));
          break;
        default:
          break;
      }
    }
  };

  const handleToggleStatus = (id) => {
    setOpenMenuId(null); // Fermer le menu
    // TODO: Appel API Backend
    switch (activeFilter) {
      case 'interventions':
        setTypesIntervention(typesIntervention.map(item => 
          item.id === id ? { ...item, est_actif: !item.est_actif } : item
        ));
        break;
      case 'inspections':
        setTypesInspection(typesInspection.map(item => 
          item.id === id ? { ...item, est_actif: !item.est_actif } : item
        ));
        break;
      case 'intervenants':
        setTypesIntervenant(typesIntervenant.map(item => 
          item.id === id ? { ...item, est_actif: !item.est_actif } : item
        ));
        break;
      case 'checklists':
        setChecklists(checklists.map(item => 
          item.id === id ? { ...item, est_actif: !item.est_actif } : item
        ));
        break;
      default:
        break;
    }
  };

  // ============================================================================
  // FILTRAGE DES DONNÉES
  // ============================================================================
  const getFilteredData = () => {
    let data = [];
    switch (activeFilter) {
      case 'interventions':
        data = typesIntervention;
        break;
      case 'inspections':
        data = typesInspection;
        break;
      case 'intervenants':
        data = typesIntervenant;
        break;
      case 'checklists':
        data = checklists;
        break;
      default:
        data = [];
    }

    if (searchTerm) {
      return data.filter(item => 
        item.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return data;
  };

  const filteredData = getFilteredData();

  // ============================================================================
  // STATISTIQUES PAR TYPE
  // ============================================================================
  const getStats = () => {
    switch (activeFilter) {
      case 'interventions':
        return {
          total: typesIntervention.length,
          actifs: typesIntervention.filter(t => t.est_actif).length,
          inactifs: typesIntervention.filter(t => !t.est_actif).length,
        };
      case 'inspections':
        return {
          total: typesInspection.length,
          actifs: typesInspection.filter(t => t.est_actif).length,
          obligatoires: typesInspection.filter(t => t.est_obligatoire).length,
        };
      case 'intervenants':
        return {
          total: typesIntervenant.length,
          actifs: typesIntervenant.filter(t => t.est_actif).length,
          inactifs: typesIntervenant.filter(t => !t.est_actif).length,
        };
      case 'checklists':
        return {
          total: checklists.length,
          actifs: checklists.filter(t => t.est_actif).length,
          categories: [...new Set(checklists.map(c => c.categorie))].length,
        };
      default:
        return { total: 0, actifs: 0, inactifs: 0 };
    }
  };

  const stats = getStats();

  // ============================================================================
  // RENDER MODAL FORM FIELDS
  // ============================================================================
  const renderFormFields = () => {
    switch (activeFilter) {
      case 'interventions':
        return (
          <>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Libellé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: Vidange moteur"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: vidange"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Description détaillée"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Fréquence (Km)
              </label>
              <input
                type="number"
                name="frequence_km"
                value={formData.frequence_km}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: 10000"
              />
            </div>
          </>
        );

      case 'inspections':
        return (
          <>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Libellé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: Inspection quotidienne"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: quotidienne"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Description détaillée"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Fréquence (Jours)
              </label>
              <input
                type="number"
                name="frequence_jours"
                value={formData.frequence_jours}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: 7"
              />
            </div>

            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                name="est_obligatoire"
                checked={formData.est_obligatoire}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Inspection obligatoire
              </label>
            </div>
          </>
        );

      case 'intervenants':
        return (
          <>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Libellé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: Mécanicien général"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: mecanicien"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Description détaillée"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Compétences requises
              </label>
              <textarea
                name="competences_requises"
                value={formData.competences_requises}
                onChange={handleInputChange}
                rows="2"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: Mécanique générale, diagnostics"
              />
            </div>
          </>
        );

      case 'checklists':
        return (
          <>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Libellé <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="libelle"
                value={formData.libelle}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: Checklist vidange"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Ex: checklist_vidange"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Description détaillée"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Catégorie
              </label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="accessoires">Accessoires</option>
                <option value="niveaux_fluides">Niveaux fluides</option>
                <option value="pneumatiques">Pneumatiques</option>
                <option value="carrosserie">Carrosserie</option>
                <option value="freinage">Freinage</option>
                <option value="direction">Direction</option>
                <option value="electricite">Électricité</option>
                <option value="equipements_securite">Équipements sécurité</option>
              </select>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Type d'inspection
              </label>
              <select
                name="type_inspection_id"
                value={formData.type_inspection_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Sélectionner un type</option>
                {typesInspection.map(type => (
                  <option key={type.id} value={type.id}>{type.libelle}</option>
                ))}
              </select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER TABLE COLUMNS
  // ============================================================================
  const renderTableColumns = () => {
    switch (activeFilter) {
      case 'interventions':
        return (
          <>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Libellé
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Code
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Description
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Fréquence (Km)
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Statut
            </th>
            <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Actions
            </th>
          </>
        );

      case 'inspections':
        return (
          <>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Libellé
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Code
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Description
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Fréquence (Jours)
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Obligatoire
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Statut
            </th>
            <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Actions
            </th>
          </>
        );

      case 'intervenants':
        return (
          <>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Libellé
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Code
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Description
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Compétences
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Statut
            </th>
            <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Actions
            </th>
          </>
        );

      case 'checklists':
        return (
          <>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Libellé
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Code
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Description
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Catégorie
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Type Inspection
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Statut
            </th>
            <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Actions
            </th>
          </>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER TABLE ROWS
  // ============================================================================
  const renderTableRows = () => {
    if (filteredData.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="px-6 py-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <i className={`bi bi-inbox text-5xl mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}></i>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Aucun élément trouvé
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {searchTerm ? 'Essayez une autre recherche' : 'Commencez par créer un nouvel élément'}
              </p>
            </div>
          </td>
        </tr>
      );
    }

    return filteredData.map((item) => {
      switch (activeFilter) {
        case 'interventions':
          return (
            <tr key={item.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <div className="flex items-center gap-2">
                  <i className="bi bi-wrench text-blue-500"></i>
                  <span className="font-medium">{item.libelle}</span>
                </div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <code className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {item.code}
                </code>
              </td>
              <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="max-w-xs truncate">{item.description || '-'}</div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.frequence_km ? `${item.frequence_km.toLocaleString()} km` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.est_actif
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {item.est_actif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="relative action-menu inline-block">
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title="Actions"
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  
                  {openMenuId === item.id && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
                      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="py-1">
                        <button
                          onClick={() => handleOpenModal('edit', item)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                          } flex items-center gap-2`}
                        >
                          <i className="bi bi-pencil-square text-blue-500"></i>
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                          } flex items-center gap-2`}
                        >
                          <i className={`bi ${item.est_actif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-500'}`}></i>
                          {item.est_actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                        <button
                          onClick={() => handleDelete(item.id)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                          } flex items-center gap-2`}
                        >
                          <i className="bi bi-trash3"></i>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          );

        case 'inspections':
          return (
            <tr key={item.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <div className="flex items-center gap-2">
                  <i className="bi bi-clipboard-check text-purple-500"></i>
                  <span className="font-medium">{item.libelle}</span>
                </div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <code className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {item.code}
                </code>
              </td>
              <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="max-w-xs truncate">{item.description || '-'}</div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.frequence_jours ? `${item.frequence_jours} jours` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {item.est_obligatoire ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    Obligatoire
                  </span>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    Facultatif
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.est_actif
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {item.est_actif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="relative action-menu inline-block">
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title="Actions"
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  
                  {openMenuId === item.id && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
                      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="py-1">
                        <button
                          onClick={() => handleOpenModal('edit', item)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                          } flex items-center gap-2`}
                        >
                          <i className="bi bi-pencil-square text-blue-500"></i>
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                          } flex items-center gap-2`}
                        >
                          <i className={`bi ${item.est_actif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-500'}`}></i>
                          {item.est_actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                        <button
                          onClick={() => handleDelete(item.id)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                          } flex items-center gap-2`}
                        >
                          <i className="bi bi-trash3"></i>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          );

        case 'intervenants':
          return (
            <tr key={item.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <div className="flex items-center gap-2">
                  <i className="bi bi-person-gear text-green-500"></i>
                  <span className="font-medium">{item.libelle}</span>
                </div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <code className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {item.code}
                </code>
              </td>
              <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="max-w-xs truncate">{item.description || '-'}</div>
              </td>
              <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="max-w-xs truncate">{item.competences_requises || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.est_actif
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {item.est_actif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="relative action-menu inline-block">
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title="Actions"
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  
                  {openMenuId === item.id && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
                      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="py-1">
                        <button
                          onClick={() => handleOpenModal('edit', item)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                          } flex items-center gap-2`}
                        >
                          <i className="bi bi-pencil-square text-blue-500"></i>
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                          } flex items-center gap-2`}
                        >
                          <i className={`bi ${item.est_actif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-500'}`}></i>
                          {item.est_actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                        <button
                          onClick={() => handleDelete(item.id)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                          } flex items-center gap-2`}
                        >
                          <i className="bi bi-trash3"></i>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          );

        case 'checklists':
          const typeInspection = typesInspection.find(t => t.id === item.type_inspection_id);
          return (
            <tr key={item.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <div className="flex items-center gap-2">
                  <i className="bi bi-list-check text-yellow-500"></i>
                  <span className="font-medium">{item.libelle}</span>
                </div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <code className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {item.code}
                </code>
              </td>
              <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="max-w-xs truncate">{item.description || '-'}</div>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.categorie ? (
                  <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {item.categorie.replace(/_/g, ' ')}
                  </span>
                ) : '-'}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {typeInspection ? typeInspection.libelle : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.est_actif
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {item.est_actif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="relative action-menu inline-block">
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                    title="Actions"
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  
                  {openMenuId === item.id && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10 ${
                      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="py-1">
                        <button
                          onClick={() => handleOpenModal('edit', item)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                          } flex items-center gap-2`}
                        >
                          <i className="bi bi-pencil-square text-blue-500"></i>
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                          } flex items-center gap-2`}
                        >
                          <i className={`bi ${item.est_actif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-500'}`}></i>
                          {item.est_actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                        <button
                          onClick={() => handleDelete(item.id)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                          } flex items-center gap-2`}
                        >
                          <i className="bi bi-trash3"></i>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          );

        default:
          return null;
      }
    });
  };

  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      
      {/* ============================================================================ */}
      {/* UTILISATION DU COMPOSANT SIDEBAR IMPORTÉ */}
      {/* ============================================================================ */}
      <Sidebar 
        darkMode={darkMode} 
        sidebarCollapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* ============================================================================ */}
      {/* UTILISATION DU COMPOSANT HEADER IMPORTÉ */}
      {/* ============================================================================ */}
      <Header 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        sidebarCollapsed={sidebarCollapsed}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        showProfile={showProfile}
        setShowProfile={setShowProfile}
      />

      <main 
        className="transition-all duration-300 pt-24 px-6 pb-6"
        style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}
      >
        {/* ─── STATISTIQUES ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Total
                </p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.total}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <i className="bi bi-list-ul text-2xl text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  {activeFilter === 'inspections' ? 'Obligatoires' : 'Actifs'}
                </p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {activeFilter === 'inspections' ? stats.obligatoires : stats.actifs}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <i className="bi bi-check-circle text-2xl text-green-600 dark:text-green-400"></i>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  {activeFilter === 'checklists' ? 'Catégories' : 'Inactifs'}
                </p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {activeFilter === 'checklists' ? stats.categories : stats.inactifs}
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${activeFilter === 'checklists' ? 'bg-purple-100 dark:bg-purple-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                <i className={`bi ${activeFilter === 'checklists' ? 'bi-grid-3x3' : 'bi-x-circle'} text-2xl ${activeFilter === 'checklists' ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}></i>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FILTRES ET ACTIONS ─── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filtres */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('interventions')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeFilter === 'interventions'
                    ? 'text-white shadow-md'
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                }`}
                style={activeFilter === 'interventions' ? {
                  background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
                } : {}}
              >
                <i className="bi bi-wrench"></i>
                Types Intervention
              </button>

              <button
                onClick={() => setActiveFilter('inspections')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeFilter === 'inspections'
                    ? 'text-white shadow-md'
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                }`}
                style={activeFilter === 'inspections' ? {
                  background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
                } : {}}
              >
                <i className="bi bi-clipboard-check"></i>
                Types Inspection
              </button>

              <button
                onClick={() => setActiveFilter('intervenants')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeFilter === 'intervenants'
                    ? 'text-white shadow-md'
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                }`}
                style={activeFilter === 'intervenants' ? {
                  background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
                } : {}}
              >
                <i className="bi bi-person-gear"></i>
                Types Intervenant
              </button>

              <button
                onClick={() => setActiveFilter('checklists')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeFilter === 'checklists'
                    ? 'text-white shadow-md'
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                }`}
                style={activeFilter === 'checklists' ? {
                  background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
                } : {}}
              >
                <i className="bi bi-list-check"></i>
                Checklists
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
                <input 
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 w-64`}
                  style={{ '--tw-ring-color': theme.primary }}
                />
              </div>

              <button
                onClick={() => handleOpenModal('create')}
                className="px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 hover:shadow-md flex items-center gap-2"
                style={{
                  background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
                }}
              >
                <i className="bi bi-plus-lg"></i>
                Nouveau
              </button>
            </div>
          </div>
        </div>

        {/* ─── TABLE ─── */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  {renderTableColumns()}
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-900 divide-gray-800' : 'bg-white divide-gray-200'} divide-y`}>
                {renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-center">
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              © 2026 SGS Tous droits reservés - Version 1.0
            </p>
          </div>
        </div>
      </main>

      {/* ============================================================================ */}
      {/* MODAL CRUD */}
      {/* ============================================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={handleCloseModal}
            ></div>

            {/* Modal */}
            <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {modalMode === 'create' ? 'Créer' : 'Modifier'} - {
                      activeFilter === 'interventions' ? 'Type d\'intervention' :
                      activeFilter === 'inspections' ? 'Type d\'inspection' :
                      activeFilter === 'intervenants' ? 'Type d\'intervenant' :
                      'Checklist'
                    }
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-6 py-4">
                  {renderFormFields()}

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      name="est_actif"
                      checked={formData.est_actif}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Actif
                    </label>
                  </div>
                </div>

                <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800 bg-gray-850' : 'border-gray-200 bg-gray-50'} flex justify-end gap-3`}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className={`px-4 py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 hover:shadow-md"
                    style={{
                      background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
                    }}
                  >
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

export default Interventions;