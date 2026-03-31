import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
// ============================================================================
// IMPORTS DES COMPOSANTS SÉPARÉS - SIDEBAR ET HEADER
// ============================================================================
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
// ============================================================================

const Utilisateurs = () => {
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
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const { theme } = useTheme();
  const navigate = useNavigate();

  // États pour les popups et les onglets
  const [activeTab, setActiveTab] = useState('utilisateurs'); // utilisateurs, roles, directions
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);

  // États pour les formulaires
  const [formData, setFormData] = useState({});

  // ============================================================================
  // DONNÉES INITIALES
  // ============================================================================
  
  // Rôles
  const [rolesData, setRolesData] = useState([
    { 
      id: 1, 
      code: 'super_admin', 
      nom: 'Super Administrateur', 
      description: 'Accès complet au système',
      permissions: ['Tous'],
      niveauAcces: 'Complet',
      nbUtilisateurs: 1,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    },
    { 
      id: 2, 
      code: 'admin', 
      nom: 'Administrateur', 
      description: 'Gestion administrative',
      permissions: ['Gestion utilisateurs', 'Gestion véhicules', 'Rapports'],
      niveauAcces: 'Élevé',
      nbUtilisateurs: 2,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    },
    { 
      id: 3, 
      code: 'chef_parc', 
      nom: 'Chef du Parc', 
      description: 'Gestion du parc automobile',
      permissions: ['Gestion véhicules', 'Maintenance', 'Affectations'],
      niveauAcces: 'Moyen',
      nbUtilisateurs: 1,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    },
    { 
      id: 4, 
      code: 'chef_tf', 
      nom: 'Chef Transport de Fonds', 
      description: 'Gestion transport de fonds',
      permissions: ['Missions TF', 'Suivi véhicules TF'],
      niveauAcces: 'Moyen',
      nbUtilisateurs: 1,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    },
    { 
      id: 5, 
      code: 'chauffeur', 
      nom: 'Chauffeur', 
      description: 'Conduite de véhicules',
      permissions: ['Voir missions', 'Signaler anomalies'],
      niveauAcces: 'Limité',
      nbUtilisateurs: 1,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    },
    { 
      id: 6, 
      code: 'mecanicien', 
      nom: 'Mécanicien', 
      description: 'Maintenance et réparations',
      permissions: ['Interventions', 'Stock pièces'],
      niveauAcces: 'Limité',
      nbUtilisateurs: 1,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    },
    { 
      id: 7, 
      code: 'agent_pc_radio', 
      nom: 'Agent PC Radio', 
      description: 'Gestion PC Radio',
      permissions: ['PC Radio', 'Suivi temps réel'],
      niveauAcces: 'Limité',
      nbUtilisateurs: 1,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    }
  ]);

  // Directions
  const [directionsData, setDirectionsData] = useState([
    { 
      id: 1, 
      code: 'DG', 
      nom: 'Direction Générale', 
      description: 'Direction de l\'entreprise',
      responsable: 'Jean Mbourou',
      nbVehicules: 5,
      nbUtilisateurs: 3,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    },
    { 
      id: 2, 
      code: 'DT', 
      nom: 'Direction Technique', 
      description: 'Gestion technique et maintenance',
      responsable: 'Pierre Nzong',
      nbVehicules: 8,
      nbUtilisateurs: 5,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    },
    { 
      id: 3, 
      code: 'TF', 
      nom: 'Transport de Fonds', 
      description: 'Gestion transport de fonds',
      responsable: 'Marie Obame',
      nbVehicules: 12,
      nbUtilisateurs: 8,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    },
    { 
      id: 4, 
      code: 'DL', 
      nom: 'Direction Logistique', 
      description: 'Gestion logistique',
      responsable: 'Paul Ondo',
      nbVehicules: 6,
      nbUtilisateurs: 4,
      estActif: true,
      dateCreation: '2025-01-15 08:00:00'
    }
  ]);

  // Utilisateurs
  const [usersData, setUsersData] = useState([
    { 
      id: 1, 
      nom: 'Jean', 
      prenom: 'Mbourou',
      email: 'j.mbourou@sgs.ga', 
      telephone: '+241 77 00 00 01', 
      roleId: 1,
      roleName: 'Super Administrateur', 
      directionId: 1,
      directionName: 'Direction Générale',
      statut: 'Actif',
      dernierConnexion: "Aujourd'hui, 10:30",
      initiales: 'JM',
      couleur: '#f59e0b',
      dateCreation: '2025-01-15 08:00:00',
      derniereModification: '2026-02-03 10:30:00'
    },
    { 
      id: 2, 
      nom: 'Nzong',
      prenom: 'Pierre', 
      email: 'p.nzong@sgs.ga', 
      telephone: '+241 77 00 00 02', 
      roleId: 3,
      roleName: 'Chef du Parc', 
      directionId: 2,
      directionName: 'Direction Technique',
      statut: 'Actif',
      dernierConnexion: "Aujourd'hui, 09:15",
      initiales: 'PN',
      couleur: '#3b82f6',
      dateCreation: '2025-01-15 08:00:00',
      derniereModification: '2026-02-03 09:15:00'
    },
    { 
      id: 3, 
      nom: 'Obame',
      prenom: 'Marie', 
      email: 'm.obame@sgs.ga', 
      telephone: '+241 77 00 00 03', 
      roleId: 4,
      roleName: 'Chef TF', 
      directionId: 3,
      directionName: 'Transport de Fonds',
      statut: 'Actif',
      dernierConnexion: 'Hier, 17:45',
      initiales: 'MO',
      couleur: '#10b981',
      dateCreation: '2025-01-15 08:00:00',
      derniereModification: '2026-02-02 17:45:00'
    },
    { 
      id: 4, 
      nom: 'Ondo',
      prenom: 'Paul', 
      email: 'p.ondo@sgs.ga', 
      telephone: '+241 77 00 00 04', 
      roleId: 5,
      roleName: 'Chauffeur', 
      directionId: 4,
      directionName: 'Direction Logistique',
      statut: 'Actif',
      dernierConnexion: "Aujourd'hui, 08:00",
      initiales: 'PO',
      couleur: '#8b5cf6',
      dateCreation: '2025-01-15 08:00:00',
      derniereModification: '2026-02-03 08:00:00'
    },
    { 
      id: 5, 
      nom: 'Essono',
      prenom: 'Marc', 
      email: 'm.essono@sgs.ga', 
      telephone: '+241 77 00 00 05', 
      roleId: 6,
      roleName: 'Mécanicien', 
      directionId: 2,
      directionName: 'Direction Technique',
      statut: 'Actif',
      dernierConnexion: "Aujourd'hui, 07:30",
      initiales: 'ME',
      couleur: '#ef4444',
      dateCreation: '2025-01-15 08:00:00',
      derniereModification: '2026-02-03 07:30:00'
    },
    { 
      id: 6, 
      nom: 'Mba',
      prenom: 'Luc', 
      email: 'l.mba@sgs.ga', 
      telephone: '+241 77 00 00 06', 
      roleId: 7,
      roleName: 'Agent PC Radio', 
      directionId: 2,
      directionName: 'Direction Technique',
      statut: 'Actif',
      dernierConnexion: "Aujourd'hui, 11:00",
      initiales: 'LM',
      couleur: '#ec4899',
      dateCreation: '2025-01-15 08:00:00',
      derniereModification: '2026-02-03 11:00:00'
    },
    { 
      id: 7, 
      nom: 'Nguema',
      prenom: 'Anne', 
      email: 'a.nguema@sgs.ga', 
      telephone: '+241 77 00 00 07', 
      roleId: 5,
      roleName: 'Chauffeur', 
      directionId: 3,
      directionName: 'Transport de Fonds',
      statut: 'Bloqué',
      dernierConnexion: 'Il y a 15 jours',
      initiales: 'AN',
      couleur: '#6b7280',
      dateCreation: '2025-01-15 08:00:00',
      derniereModification: '2026-01-20 14:30:00'
    }
  ]);

  // ============================================================================
  // FONCTIONS CRUD
  // ============================================================================

  // UTILISATEURS
  const handleAddUser = () => {
    const newUser = {
      id: usersData.length + 1,
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      telephone: formData.telephone,
      roleId: parseInt(formData.roleId),
      roleName: rolesData.find(r => r.id === parseInt(formData.roleId))?.nom,
      directionId: parseInt(formData.directionId),
      directionName: directionsData.find(d => d.id === parseInt(formData.directionId))?.nom,
      statut: 'Actif',
      dernierConnexion: 'Jamais',
      initiales: `${formData.prenom.charAt(0)}${formData.nom.charAt(0)}`,
      couleur: '#' + Math.floor(Math.random()*16777215).toString(16),
      dateCreation: new Date().toISOString(),
      derniereModification: new Date().toISOString()
    };
    setUsersData([...usersData, newUser]);
    setShowAddModal(false);
    setFormData({});
    alert('✅ Utilisateur ajouté avec succès !');
  };

  const handleEditUser = () => {
    setUsersData(usersData.map(user => 
      user.id === currentItem.id 
        ? {
            ...user,
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            telephone: formData.telephone,
            roleId: parseInt(formData.roleId),
            roleName: rolesData.find(r => r.id === parseInt(formData.roleId))?.nom,
            directionId: parseInt(formData.directionId),
            directionName: directionsData.find(d => d.id === parseInt(formData.directionId))?.nom,
            derniereModification: new Date().toISOString()
          }
        : user
    ));
    setShowEditModal(false);
    setFormData({});
    setCurrentItem(null);
    alert('✅ Utilisateur modifié avec succès !');
  };

  const handleDeleteUser = () => {
    setUsersData(usersData.filter(user => user.id !== currentItem.id));
    setShowDeleteModal(false);
    setCurrentItem(null);
    alert('✅ Utilisateur supprimé avec succès !');
  };

  const handleToggleUserStatus = (user) => {
    const newStatus = user.statut === 'Actif' ? 'Bloqué' : 'Actif';
    setUsersData(usersData.map(u => 
      u.id === user.id 
        ? { ...u, statut: newStatus, derniereModification: new Date().toISOString() }
        : u
    ));
    alert(`✅ Utilisateur ${newStatus === 'Actif' ? 'débloqué' : 'bloqué'} avec succès !`);
    setShowActionMenu(null);
  };

  // RÔLES
  const handleAddRole = () => {
    const newRole = {
      id: rolesData.length + 1,
      code: formData.code.toLowerCase().replace(/\s+/g, '_'),
      nom: formData.nom,
      description: formData.description,
      permissions: formData.permissions ? formData.permissions.split(',').map(p => p.trim()) : [],
      niveauAcces: formData.niveauAcces,
      nbUtilisateurs: 0,
      estActif: true,
      dateCreation: new Date().toISOString()
    };
    setRolesData([...rolesData, newRole]);
    setShowAddModal(false);
    setFormData({});
    alert('✅ Rôle ajouté avec succès !');
  };

  const handleEditRole = () => {
    setRolesData(rolesData.map(role => 
      role.id === currentItem.id 
        ? {
            ...role,
            nom: formData.nom,
            description: formData.description,
            permissions: formData.permissions ? formData.permissions.split(',').map(p => p.trim()) : role.permissions,
            niveauAcces: formData.niveauAcces
          }
        : role
    ));
    setShowEditModal(false);
    setFormData({});
    setCurrentItem(null);
    alert('✅ Rôle modifié avec succès !');
  };

  const handleDeleteRole = () => {
    if (currentItem.nbUtilisateurs > 0) {
      alert('⚠️ Impossible de supprimer un rôle assigné à des utilisateurs !');
      return;
    }
    setRolesData(rolesData.filter(role => role.id !== currentItem.id));
    setShowDeleteModal(false);
    setCurrentItem(null);
    alert('✅ Rôle supprimé avec succès !');
  };

  const handleToggleRoleStatus = (role) => {
    setRolesData(rolesData.map(r => 
      r.id === role.id 
        ? { ...r, estActif: !r.estActif }
        : r
    ));
    alert(`✅ Rôle ${!role.estActif ? 'activé' : 'désactivé'} avec succès !`);
    setShowActionMenu(null);
  };

  // DIRECTIONS
  const handleAddDirection = () => {
    const newDirection = {
      id: directionsData.length + 1,
      code: formData.code.toUpperCase(),
      nom: formData.nom,
      description: formData.description,
      responsable: formData.responsable,
      nbVehicules: 0,
      nbUtilisateurs: 0,
      estActif: true,
      dateCreation: new Date().toISOString()
    };
    setDirectionsData([...directionsData, newDirection]);
    setShowAddModal(false);
    setFormData({});
    alert('✅ Direction ajoutée avec succès !');
  };

  const handleEditDirection = () => {
    setDirectionsData(directionsData.map(dir => 
      dir.id === currentItem.id 
        ? {
            ...dir,
            nom: formData.nom,
            description: formData.description,
            responsable: formData.responsable
          }
        : dir
    ));
    setShowEditModal(false);
    setFormData({});
    setCurrentItem(null);
    alert('✅ Direction modifiée avec succès !');
  };

  const handleDeleteDirection = () => {
    if (currentItem.nbUtilisateurs > 0 || currentItem.nbVehicules > 0) {
      alert('⚠️ Impossible de supprimer une direction avec des utilisateurs ou véhicules assignés !');
      return;
    }
    setDirectionsData(directionsData.filter(dir => dir.id !== currentItem.id));
    setShowDeleteModal(false);
    setCurrentItem(null);
    alert('✅ Direction supprimée avec succès !');
  };

  const handleToggleDirectionStatus = (direction) => {
    setDirectionsData(directionsData.map(d => 
      d.id === direction.id 
        ? { ...d, estActif: !d.estActif }
        : d
    ));
    alert(`✅ Direction ${!direction.estActif ? 'activée' : 'désactivée'} avec succès !`);
    setShowActionMenu(null);
  };

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

  // ============================================================================
  // MODALS
  // ============================================================================

 // Modal Ajouter/Modifier utilisateur;roles;direction
const FormModal = ({ show, onClose, title, onSubmit, type, initialData }) => {
  const [localFormData, setLocalFormData] = React.useState(initialData || {});

  React.useEffect(() => {
    setLocalFormData(initialData || {});
  }, [initialData, show]);

  if (!show) return null;

  const handleSubmit = () => {
    onSubmit(localFormData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <button 
              onClick={onClose}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
            >
              <i className={`bi bi-x-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
            </button>
          </div>
        </div>

        <div className="p-6">
          {type === 'utilisateur' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localFormData.nom || ''}
                  onChange={(e) => setLocalFormData({...localFormData, nom: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="Dupont"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localFormData.prenom || ''}
                  onChange={(e) => setLocalFormData({...localFormData, prenom: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={localFormData.email || ''}
                  onChange={(e) => setLocalFormData({...localFormData, email: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="jean.dupont@sgs.ga"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={localFormData.telephone || ''}
                  onChange={(e) => setLocalFormData({...localFormData, telephone: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="+241 77 00 00 00"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Rôle <span className="text-red-500">*</span>
                </label>
                <select
                  value={localFormData.roleId || ''}
                  onChange={(e) => setLocalFormData({...localFormData, roleId: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                >
                  <option value="">Sélectionner un rôle</option>
                  {rolesData.filter(r => r.estActif).map(role => (
                    <option key={role.id} value={role.id}>{role.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Direction <span className="text-red-500">*</span>
                </label>
                <select
                  value={localFormData.directionId || ''}
                  onChange={(e) => setLocalFormData({...localFormData, directionId: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                >
                  <option value="">Sélectionner une direction</option>
                  {directionsData.filter(d => d.estActif).map(dir => (
                    <option key={dir.id} value={dir.id}>{dir.nom}</option>
                  ))}
                </select>
              </div>
   
            
            </div>
          )}

          {type === 'role' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localFormData.code || ''}
                  onChange={(e) => setLocalFormData({...localFormData, code: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="admin"
                  disabled={currentItem !== null}
                />
                {currentItem === null && (
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                    Le code sera automatiquement formaté en minuscules
                  </p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localFormData.nom || ''}
                  onChange={(e) => setLocalFormData({...localFormData, nom: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="Administrateur"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Description
                </label>
                <textarea
                  value={localFormData.description || ''}
                  onChange={(e) => setLocalFormData({...localFormData, description: e.target.value})}
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="Description du rôle"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Niveau d'accès <span className="text-red-500">*</span>
                </label>
                <select
                  value={localFormData.niveauAcces || ''}
                  onChange={(e) => setLocalFormData({...localFormData, niveauAcces: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                >
                  <option value="">Sélectionner</option>
                  <option value="Complet">Complet</option>
                  <option value="Élevé">Élevé</option>
                  <option value="Moyen">Moyen</option>
                  <option value="Limité">Limité</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Permissions (séparées par des virgules)
                </label>
                <input
                  type="text"
                  value={localFormData.permissions || ''}
                  onChange={(e) => setLocalFormData({...localFormData, permissions: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="Gestion utilisateurs, Gestion véhicules"
                />
              </div>
            </div>
          )}

          {type === 'direction' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localFormData.code || ''}
                  onChange={(e) => setLocalFormData({...localFormData, code: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="DG"
                  disabled={currentItem !== null}
                />
                {currentItem === null && (
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mt-1`}>
                    Le code sera automatiquement formaté en majuscules
                  </p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={localFormData.nom || ''}
                  onChange={(e) => setLocalFormData({...localFormData, nom: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="Direction Générale"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Description
                </label>
                <textarea
                  value={localFormData.description || ''}
                  onChange={(e) => setLocalFormData({...localFormData, description: e.target.value})}
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="Description de la direction"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Responsable
                </label>
                <input
                  type="text"
                  value={localFormData.responsable || ''}
                  onChange={(e) => setLocalFormData({...localFormData, responsable: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2`}
                  style={{ '--tw-ring-color': theme.primary }}
                  placeholder="Nom du responsable"
                />
              </div>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg border ${
              darkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            } transition-colors`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
            style={{
              background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
            }}
          >
            {currentItem ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
};
  // Modal Supprimer
  const DeleteModal = ({ show, onClose, onConfirm, itemName }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl max-w-md w-full`}>
          <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <i className="bi bi-exclamation-triangle-fill text-2xl text-red-600 dark:text-red-400"></i>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Confirmer la suppression</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Cette action est irréversible
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Êtes-vous sûr de vouloir supprimer <strong>{itemName}</strong> ?
            </p>
          </div>

          <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end gap-3`}>
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg border ${
                darkMode 
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  };

// Modal Détails
const DetailsModal = ({ show, onClose, item, type }) => {
  if (!show || !item) return null;

  const handleResetPassword = async () => {
    if (!confirm(`Voulez-vous vraiment réinitialiser le mot de passe de ${item.prenom} ${item.nom} ?`)) {
      return;
    }

    try {
      // Appel API pour réinitialiser le mot de passe
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: item.id })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Mot de passe réinitialisé avec succès !\nNouveau mot de passe : ${data.temporaryPassword}\n\nL'utilisateur devra le changer à la prochaine connexion.`);
      } else {
        alert('Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Détails {type === 'utilisateur' ? 'de l\'utilisateur' : type === 'role' ? 'du rôle' : 'de la direction'}
            </h3>
            <button 
              onClick={onClose}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
            >
              <i className={`bi bi-x-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
            </button>
          </div>
        </div>

        <div className="p-6">
          {type === 'utilisateur' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: item.couleur }}
                >
                  {item.initiales}
                </div>
                <div>
                  <h4 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.prenom} {item.nom}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    {item.roleName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Email
                  </label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{item.email}</p>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Téléphone
                  </label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{item.telephone}</p>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Direction
                  </label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{item.directionName}</p>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Statut
                  </label>
                  <p className="mt-1">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      item.statut === 'Actif' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {item.statut}
                    </span>
                  </p>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Dernière Connexion
                  </label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{item.dernierConnexion}</p>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Date de Création
                  </label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>
                    {new Date(item.dateCreation).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Bouton Réinitialiser mot de passe */}
              <div className={`p-4 rounded-lg border ${darkMode ? 'border-yellow-900/30 bg-yellow-900/10' : 'border-yellow-200 bg-yellow-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <i className={`bi bi-shield-lock text-xl ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}></i>
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                        Sécurité du compte
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-yellow-500' : 'text-yellow-700'}`}>
                        Générer un nouveau mot de passe temporaire
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetPassword}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    <i className="bi bi-key mr-2"></i>
                    Réinitialiser le mot de passe
                  </button>
                </div>
              </div>
            </div>
          )}

          {type === 'role' && (
            <div className="space-y-6">
              <div>
                <h4 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {item.nom}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Code: {item.code}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Description
                  </label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{item.description}</p>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Niveau d'accès
                  </label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{item.niveauAcces}</p>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Permissions
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.permissions.map((perm, idx) => (
                      <span 
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          darkMode 
                            ? 'bg-blue-900/30 text-blue-400' 
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                      Utilisateurs assignés
                    </label>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>
                      {item.nbUtilisateurs}
                    </p>
                  </div>
                  <div>
                    <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                      Statut
                    </label>
                    <p className="mt-1">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        item.estActif 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.estActif ? 'Actif' : 'Inactif'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'direction' && (
            <div className="space-y-6">
              <div>
                <h4 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {item.nom}
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Code: {item.code}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Description
                  </label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{item.description}</p>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                    Responsable
                  </label>
                  <p className={`${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{item.responsable}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                      Véhicules
                    </label>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>
                      {item.nbVehicules}
                    </p>
                  </div>
                  <div>
                    <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                      Utilisateurs
                    </label>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>
                      {item.nbUtilisateurs}
                    </p>
                  </div>
                  <div>
                    <label className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase`}>
                      Statut
                    </label>
                    <p className="mt-1">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        item.estActif 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.estActif ? 'Actif' : 'Inactif'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg border ${
              darkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            } transition-colors`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
  // ============================================================================
  // FILTRAGE DES DONNÉES
  // ============================================================================
  const filteredUsers = usersData.filter(user => {
    const matchesSearch = user.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.telephone.includes(searchQuery);
    const matchesRole = roleFilter === 'Tous' || user.roleName === roleFilter;
    const matchesStatus = statusFilter === 'Tous' || user.statut === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredRoles = rolesData.filter(role => {
    return role.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
           role.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredDirections = directionsData.filter(dir => {
    return dir.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
           dir.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ============================================================================
  // STATS CARDS
  // ============================================================================
  const getStatsForTab = () => {
    if (activeTab === 'utilisateurs') {
      return [
        { 
          title: 'Total Utilisateurs', 
          value: usersData.length.toString(), 
          subtitle: 'comptes créés',
          icon: 'bi-people-fill',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          iconBg: 'bg-blue-100 dark:bg-blue-800',
          textColor: 'text-blue-600 dark:text-blue-400'
        },
        { 
          title: 'Actifs', 
          value: usersData.filter(u => u.statut === 'Actif').length.toString(), 
          subtitle: 'utilisateurs actifs',
          icon: 'bi-check-circle-fill',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          iconBg: 'bg-green-100 dark:bg-green-800',
          textColor: 'text-green-600 dark:text-green-400'
        },
        { 
          title: 'Bloqués', 
          value: usersData.filter(u => u.statut === 'Bloqué').length.toString(), 
          subtitle: 'comptes bloqués',
          icon: 'bi-x-circle-fill',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          iconBg: 'bg-red-100 dark:bg-red-800',
          textColor: 'text-red-600 dark:text-red-400'
        },
        { 
          title: 'Administrateurs', 
          value: usersData.filter(u => u.roleName.includes('Admin')).length.toString(), 
          subtitle: 'rôles admin',
          icon: 'bi-shield-fill-check',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          iconBg: 'bg-purple-100 dark:bg-purple-800',
          textColor: 'text-purple-600 dark:text-purple-400'
        }
      ];
    } else if (activeTab === 'roles') {
      return [
        { 
          title: 'Total Rôles', 
          value: rolesData.length.toString(), 
          subtitle: 'rôles créés',
          icon: 'bi-shield-fill',
          bgColor: 'bg-blue-50 dark:bg-blue-5000/20',
          iconBg: 'bg-blue-100 dark:bg-blue-800',
          textColor: 'text-blue-600 dark:text-blue-800'
        },
        { 
          title: 'Rôles Actifs', 
          value: rolesData.filter(r => r.estActif).length.toString(), 
          subtitle: 'actuellement actifs',
          icon: 'bi-check-circle-fill',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          iconBg: 'bg-green-100 dark:bg-green-800',
          textColor: 'text-green-600 dark:text-green-400'
        },
        { 
          title: 'Utilisateurs Assignés', 
          value: rolesData.reduce((acc, r) => acc + r.nbUtilisateurs, 0).toString(), 
          subtitle: 'au total',
          icon: 'bi-people-fill',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          iconBg: 'bg-purple-100 dark:bg-purple-800',
          textColor: 'text-purple-600 dark:text-purple-400'
        },
        { 
          title: 'Accès Complet', 
          value: rolesData.filter(r => r.niveauAcces === 'Complet').length.toString(), 
          subtitle: 'accès total',
          icon: 'bi-key-fill',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          iconBg: 'bg-yellow-100 dark:bg-yellow-800',
          textColor: 'text-yellow-600 dark:text-yellow-400'
        }
      ];
    } else {
      return [
        { 
          title: 'Total Directions', 
          value: directionsData.length.toString(), 
          subtitle: 'directions actives',
          icon: 'bi-building',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          iconBg: 'bg-blue-100 dark:bg-blue-800',
          textColor: 'text-blue-600 dark:text-blue-400'
        },
        { 
          title: 'Véhicules', 
          value: directionsData.reduce((acc, d) => acc + d.nbVehicules, 0).toString(), 
          subtitle: 'au total',
          icon: 'bi-car-front-fill',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          iconBg: 'bg-green-100 dark:bg-green-800',
          textColor: 'text-green-600 dark:text-green-400'
        },
        { 
          title: 'Utilisateurs', 
          value: directionsData.reduce((acc, d) => acc + d.nbUtilisateurs, 0).toString(), 
          subtitle: 'au total',
          icon: 'bi-people-fill',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          iconBg: 'bg-purple-100 dark:bg-purple-800',
          textColor: 'text-purple-600 dark:text-purple-400'
        },
        { 
          title: 'Directions Actives', 
          value: directionsData.filter(d => d.estActif).length.toString(), 
          subtitle: 'opérationnelles',
          icon: 'bi-check-circle-fill',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          iconBg: 'bg-yellow-100 dark:bg-yellow-800',
          textColor: 'text-yellow-600 dark:text-yellow-400'
        }
      ];
    }
  };

  const uniqueRoles = ['Tous', ...new Set(usersData.map(u => u.roleName))];

  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      
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

      <main 
        className="transition-all duration-300 pt-24 px-6 pb-6"
        style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}
      >
        {/* Onglets de navigation */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm mb-6 p-2`}>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('utilisateurs')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'utilisateurs'
                  ? 'text-white shadow-md'
                  : `${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`
              }`}
              style={activeTab === 'utilisateurs' ? {
                background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
              } : {}}
            >
              <i className="bi bi-people-fill text-xl"></i>
              <span>Utilisateurs</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'utilisateurs'
                  ? 'bg-white/20'
                  : `${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`
              }`}>
                {usersData.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'roles'
                  ? 'text-white shadow-md'
                  : `${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`
              }`}
              style={activeTab === 'roles' ? {
                background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
              } : {}}
            >
              <i className="bi bi-shield-fill text-xl"></i>
              <span>Rôles</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'roles'
                  ? 'bg-white/20'
                  : `${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`
              }`}>
                {rolesData.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('directions')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'directions'
                  ? 'text-white shadow-md'
                  : `${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'}`
              }`}
              style={activeTab === 'directions' ? {
                background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
              } : {}}
            >
              <i className="bi bi-building text-xl"></i>
              <span>Directions</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'directions'
                  ? 'bg-white/20'
                  : `${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`
              }`}>
                {directionsData.length}
              </span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {getStatsForTab().map((card, idx) => (
            <div 
              key={idx}
              className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    {card.title}
                  </p>
                  <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {card.value}
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {card.subtitle}
                  </p>
                </div>
                <div className={`${card.iconBg} ${card.textColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  <i className={card.icon} style={{ fontSize: '1.5rem' }}></i>
                </div>
              </div>
            </div>
          ))}
        </div>
{activeTab === 'utilisateurs' && (
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
    <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Liste des Utilisateurs
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className={`bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
            <input 
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 w-64`}
              style={{ '--tw-ring-color': theme.primary }}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              <i className="bi bi-funnel"></i>
              <span className="text-sm font-medium">Filtres</span>
            </button>

            {showFilterMenu && (
              <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 p-4`}>
                <div className="mb-4">
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>
                    Rôle
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } text-sm`}
                  >
                    {uniqueRoles.map((role, idx) => (
                      <option key={idx} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    } text-sm`}
                  >
                    <option value="Tous">Tous</option>
                    <option value="Actif">Actif</option>
                    <option value="Bloqué">Bloqué</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            } transition-colors`}
          >
            <i className="bi bi-download"></i>
            <span className="text-sm font-medium">Exporter</span>
          </button>

          <button
            onClick={() => {
              setFormData({});
              setCurrentItem(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 shadow-md hover:shadow-lg"
            style={{
              background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
            }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Ajouter un utilisateur</span>
          </button>
        </div>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">

        {/* ✅ THEAD — vraie couleur du thème actif */}
        <thead
          style={{
            background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`,
          }}
        >
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Utilisateur
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Rôle
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Direction
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        {/* ✅ TBODY — lignes alternées : bleu pastel / gris pastel */}
        <tbody>
          {filteredUsers.map((user, index) => (
            <tr
              key={user.id}
              style={{
                backgroundColor: index % 2 === 0
                  ? darkMode ? '#1a2535' : '#eef2ff'
                  : darkMode ? '#1c1f2b' : '#f3f4f6',
                borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = index % 2 === 0
                ? darkMode ? '#1a2535' : '#eef2ff'
                : darkMode ? '#1c1f2b' : '#f3f4f6'
              }
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: user.couleur }}
                  >
                    {user.initiales}
                  </div>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.prenom} {user.nom}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.dernierConnexion}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user.email}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  {user.telephone}
                </p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  user.roleName === 'Super Administrateur' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-5000/30 dark:text-yellow-800'
                    : user.roleName.includes('Chef')
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-5000/30 dark:text-purple-800'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-5000/30 dark:text-blue-800'
                }`}>
                  {user.roleName}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user.directionName}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  user.statut === 'Actif' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-5000/30 dark:text-green-800'
                    : 'bg-red-100 text-red-800 dark:bg-red-5000/30 dark:text-red-800'
                }`}>
                  {user.statut}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <i className={`bi bi-three-dots-vertical ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  </button>

                  {showActionMenu === user.id && (
                    <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50`}>
                      <button
                        onClick={() => {
                          setCurrentItem(user);
                          setShowDetailsModal(true);
                          setShowActionMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className="bi bi-eye-fill text-blue-500"></i>
                        <span>Voir détails</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentItem(user);
                          setFormData({
                            nom: user.nom,
                            prenom: user.prenom,
                            email: user.email,
                            telephone: user.telephone,
                            roleId: user.roleId,
                            directionId: user.directionId
                          });
                          setShowEditModal(true);
                          setShowActionMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className="bi bi-pencil-fill text-yellow-500"></i>
                        <span>Modifier</span>
                      </button>
                      
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className={`bi ${user.statut === 'Actif' ? 'bi-lock-fill text-orange-500' : 'bi-unlock-fill text-green-500'}`}></i>
                        <span>{user.statut === 'Actif' ? 'Bloquer' : 'Débloquer'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentItem(user);
                          setShowDeleteModal(true);
                          setShowActionMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className="bi bi-trash-fill"></i>
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Affichage de {filteredUsers.length} utilisateurs
      </p>
    </div>
  </div>
)}
       {activeTab === 'roles' && (
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
    <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Liste des Rôles
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredRoles.length} rôle{filteredRoles.length > 1 ? 's' : ''} trouvé{filteredRoles.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className={`bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
            <input 
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 w-64`}
              style={{ '--tw-ring-color': theme.primary }}
            />
          </div>

          <button
            onClick={() => {
              setFormData({});
              setCurrentItem(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 shadow-md hover:shadow-lg"
            style={{
              background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
            }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Ajouter</span>
          </button>
        </div>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">

        {/* ✅ THEAD — vraie couleur du thème actif */}
        <thead
          style={{
            background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`,
          }}
        >
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Rôle
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Niveau d'accès
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Utilisateurs
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        {/* ✅ TBODY — lignes alternées : bleu pastel / gris pastel */}
        <tbody>
          {filteredRoles.map((role, index) => (
            <tr
              key={role.id}
              style={{
                backgroundColor: index % 2 === 0
                  ? darkMode ? '#1a2535' : '#eef2ff'
                  : darkMode ? '#1c1f2b' : '#f3f4f6',
                borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = index % 2 === 0
                ? darkMode ? '#1a2535' : '#eef2ff'
                : darkMode ? '#1c1f2b' : '#f3f4f6'
              }
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {role.nom}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {role.code}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {role.description}
                </p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  role.niveauAcces === 'Complet' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    : role.niveauAcces === 'Élevé'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : role.niveauAcces === 'Moyen'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {role.niveauAcces}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {role.nbUtilisateurs}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  role.estActif 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {role.estActif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(showActionMenu === `role-${role.id}` ? null : `role-${role.id}`)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <i className={`bi bi-three-dots-vertical ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  </button>

                  {showActionMenu === `role-${role.id}` && (
                    <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50`}>
                      <button
                        onClick={() => {
                          setCurrentItem(role);
                          setShowDetailsModal(true);
                          setShowActionMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className="bi bi-eye-fill text-blue-500"></i>
                        <span>Voir détails</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentItem(role);
                          setFormData({
                            code: role.code,
                            nom: role.nom,
                            description: role.description,
                            niveauAcces: role.niveauAcces,
                            permissions: role.permissions.join(', ')
                          });
                          setShowEditModal(true);
                          setShowActionMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className="bi bi-pencil-fill text-yellow-500"></i>
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleToggleRoleStatus(role)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className={`bi ${role.estActif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-500'}`}></i>
                        <span>{role.estActif ? 'Désactiver' : 'Activer'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentItem(role);
                          setShowDeleteModal(true);
                          setShowActionMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className="bi bi-trash-fill"></i>
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Affichage de {filteredRoles.length} rôles
      </p>
    </div>
  </div>
)}

    {activeTab === 'directions' && (
  <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
    <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Liste des Directions
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredDirections.length} direction{filteredDirections.length > 1 ? 's' : ''} trouvée{filteredDirections.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className={`bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
            <input 
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 w-64`}
              style={{ '--tw-ring-color': theme.primary }}
            />
          </div>

          <button
            onClick={() => {
              setFormData({});
              setCurrentItem(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 shadow-md hover:shadow-lg"
            style={{
              background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`
            }}
          >
            <i className="bi bi-plus-lg"></i>
            <span>Ajouter</span>
          </button>
        </div>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">

        {/* ✅ THEAD — vraie couleur du thème actif */}
        <thead
          style={{
            background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})`,
          }}
        >
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Direction
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Responsable
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Véhicules
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Utilisateurs
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        {/* ✅ TBODY — lignes alternées : bleu pastel / gris pastel */}
        <tbody>
          {filteredDirections.map((dir, index) => (
            <tr
              key={dir.id}
              style={{
                backgroundColor: index % 2 === 0
                  ? darkMode ? '#1a2535' : '#eef2ff'
                  : darkMode ? '#1c1f2b' : '#f3f4f6',
                borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = index % 2 === 0
                ? darkMode ? '#1a2535' : '#eef2ff'
                : darkMode ? '#1c1f2b' : '#f3f4f6'
              }
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {dir.nom}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Code: {dir.code}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {dir.description}
                </p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {dir.responsable}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {dir.nbVehicules}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {dir.nbUtilisateurs}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  dir.estActif 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {dir.estActif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(showActionMenu === `dir-${dir.id}` ? null : `dir-${dir.id}`)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <i className={`bi bi-three-dots-vertical ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                  </button>

                  {showActionMenu === `dir-${dir.id}` && (
                    <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50`}>
                      <button
                        onClick={() => {
                          setCurrentItem(dir);
                          setShowDetailsModal(true);
                          setShowActionMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className="bi bi-eye-fill text-blue-500"></i>
                        <span>Voir détails</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentItem(dir);
                          setFormData({
                            code: dir.code,
                            nom: dir.nom,
                            description: dir.description,
                            responsable: dir.responsable
                          });
                          setShowEditModal(true);
                          setShowActionMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className="bi bi-pencil-fill text-yellow-500"></i>
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => handleToggleDirectionStatus(dir)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className={`bi ${dir.estActif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-500'}`}></i>
                        <span>{dir.estActif ? 'Désactiver' : 'Activer'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentItem(dir);
                          setShowDeleteModal(true);
                          setShowActionMenu(null);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-50'} transition-colors`}
                      >
                        <i className="bi bi-trash-fill"></i>
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Affichage de {filteredDirections.length} directions
      </p>
    </div>
  </div>
)}

        {/* Footer */}
        <div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-center">
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              © 2026 SGS Tous droits réservés - Version 1.0
      
            </p>
          </div>
        </div>
      </main>

      {/* MODALS */}
      <FormModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Ajouter ${activeTab === 'utilisateurs' ? 'un utilisateur' : activeTab === 'roles' ? 'un rôle' : 'une direction'}`}
        onSubmit={activeTab === 'utilisateurs' ? handleAddUser : activeTab === 'roles' ? handleAddRole : handleAddDirection}
        type={activeTab === 'utilisateurs' ? 'utilisateur' : activeTab === 'roles' ? 'role' : 'direction'}
      />

      <FormModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setCurrentItem(null);
          setFormData({});
        }}
        title={`Modifier ${activeTab === 'utilisateurs' ? 'l\'utilisateur' : activeTab === 'roles' ? 'le rôle' : 'la direction'}`}
        onSubmit={activeTab === 'utilisateurs' ? handleEditUser : activeTab === 'roles' ? handleEditRole : handleEditDirection}
        type={activeTab === 'utilisateurs' ? 'utilisateur' : activeTab === 'roles' ? 'role' : 'direction'}
      />

      <DeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCurrentItem(null);
        }}
        onConfirm={activeTab === 'utilisateurs' ? handleDeleteUser : activeTab === 'roles' ? handleDeleteRole : handleDeleteDirection}
        itemName={currentItem ? (activeTab === 'utilisateurs' ? `${currentItem.prenom} ${currentItem.nom}` : currentItem.nom) : ''}
      />

      <DetailsModal
        show={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setCurrentItem(null);
        }}
        item={currentItem}
        type={activeTab === 'utilisateurs' ? 'utilisateur' : activeTab === 'roles' ? 'role' : 'direction'}
      />
    </div>
  );
};

export default Utilisateurs;