import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Swal from 'sweetalert2';

import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// ============================================================================
// DONNÉES MOCK
// ============================================================================
const MOCK_FOURNISSEURS = [
  { id: 1, nom: 'AutoPièces Pro', contact: 'Jean Martin', telephone: '+241 01 23 45 67', email: 'contact@autopieces.ga', type: 'pieces', adresse: 'Zone Industrielle Owendo, Libreville', est_actif: true },
  { id: 2, nom: 'Garage Central', contact: 'Marie Dupont', telephone: '+241 07 89 01 23', email: 'info@garagecentral.ga', type: 'pieces', adresse: 'Boulevard Triomphal, Libreville', est_actif: true },
  { id: 3, nom: 'Total Gabon', contact: 'Service Commercial', telephone: '+241 01 76 54 32', email: 'commercial@total.ga', type: 'carburant', adresse: 'Avenue Bouet, Libreville', est_actif: true },
];

const MOCK_OUTILS = [
  { id: 1, nom: 'Clé dynamométrique 200Nm', type: 'Clé spéciale', categorie: 'Outillage mécanique', etat: 'OK', emplacement: 'Atelier principal - Armoire A2', date_dernier_controle: '2026-01-15', notes: 'Calibration à jour' },
  { id: 2, nom: 'Pont élévateur 4 colonnes', type: 'Équipement lourd', categorie: 'Levage', etat: 'OK', emplacement: 'Atelier principal - Zone 1', date_dernier_controle: '2025-12-10', notes: 'Contrôle annuel effectué' },
  { id: 3, nom: 'Valise diagnostic OBD2', type: 'Électronique', categorie: 'Diagnostic', etat: 'Maintenance', emplacement: 'Atelier électrique', date_dernier_controle: '2026-02-01', notes: 'Mise à jour logicielle en cours' },
  { id: 4, nom: 'Compresseur d\'air 50L', type: 'Pneumatique', categorie: 'Pneumatique', etat: 'Hors service', emplacement: 'Atelier principal - Zone 2', date_dernier_controle: '2025-11-20', notes: '' },
];

const MOCK_PIECES = [
  { id: 1, sku: 'FLT-001', nom: 'Filtre à huile standard', type_piece: 'Filtre', description: 'Filtre à huile compatible Toyota, Nissan', quantite_stock: 45, seuil_alerte: 20, unite: 'unité', prix_unitaire: 8500, fournisseur_id: 1, emplacement: 'Magasin - Rayon B3', est_actif: true },
  { id: 2, sku: 'PLQ-002', nom: 'Plaquettes de frein avant', type_piece: 'Freinage', description: 'Jeu de plaquettes avant premium', quantite_stock: 12, seuil_alerte: 15, unite: 'jeu', prix_unitaire: 35000, fournisseur_id: 1, emplacement: 'Magasin - Rayon A1', est_actif: true },
  { id: 3, sku: 'HUI-003', nom: 'Huile moteur 5W30 synthétique', type_piece: 'Lubrifiant', description: 'Huile moteur synthétique 5 litres', quantite_stock: 5, seuil_alerte: 10, unite: 'bidon', prix_unitaire: 28000, fournisseur_id: 3, emplacement: 'Magasin - Zone huiles', est_actif: true },
];

const MOCK_PROBLEMES = [
  { id: 1, outil_id: 3, signale_par: 'Didier ONDO', description_probleme: 'Écran noir au démarrage, impossible de lancer un diagnostic.', statut: 'en_cours', date_signalement: '2026-02-15 09:30', date_resolution: null, notes_resolution: '' },
  { id: 2, outil_id: 4, signale_par: 'Paul NZAMBA', description_probleme: 'Fuite d\'air importante au niveau du tuyau principal, pression insuffisante.', statut: 'signale', date_signalement: '2026-03-01 14:00', date_resolution: null, notes_resolution: '' },
];

// ============================================================================
// CONSTANTES STATUTS PROBLÈMES
// ============================================================================
const STATUTS_PROBLEME = [
  { code: 'signale',    libelle: 'Signalé',      bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    darkBg: 'bg-red-900/30',    darkText: 'text-red-400'    },
  { code: 'en_cours',  libelle: 'En cours',      bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', darkBg: 'bg-yellow-900/30', darkText: 'text-yellow-400' },
  { code: 'resolu',    libelle: 'Résolu',        bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  darkBg: 'bg-green-900/30',  darkText: 'text-green-400'  },
];

const statutProblemeCfg = (code) => STATUTS_PROBLEME.find(s => s.code === code) || STATUTS_PROBLEME[0];

// ============================================================================
// COMPOSANT BADGE STATUT PROBLÈME
// ============================================================================
const StatutBadge = ({ statut, darkMode }) => {
  const cfg = statutProblemeCfg(statut);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
      ${darkMode ? `${cfg.darkBg} ${cfg.darkText}` : `${cfg.bg} ${cfg.text}`}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
      {cfg.libelle}
    </span>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
const FournisseursOutils = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch {} }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const { theme } = useTheme();

  const [activeFilter, setActiveFilter] = useState('fournisseurs');
  const [showModal, setShowModal]       = useState(false);
  const [modalMode, setModalMode]       = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [openMenuId, setOpenMenuId]     = useState(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const itemsPerPage = 10;

  // ── Données ──
  const [fournisseurs, setFournisseurs] = useState(MOCK_FOURNISSEURS);
  const [outils, setOutils]             = useState(MOCK_OUTILS);
  const [pieces, setPieces]             = useState(MOCK_PIECES);
  const [problemes, setProblemes]       = useState(MOCK_PROBLEMES);

  // ── Formulaire générique ──
  const emptyForm = {
    nom: '', contact: '', telephone: '', email: '', type: 'pieces', adresse: '', est_actif: true,
    categorie: '', etat: 'OK', emplacement: '', date_dernier_controle: '', notes: '',
    sku: '', type_piece: '', description: '', quantite_stock: 0, seuil_alerte: 0,
    unite: 'unité', prix_unitaire: 0, fournisseur_id: '',
    // Problème outil
    outil_id: '', signale_par: '', description_probleme: '',
    statut: 'signale', date_signalement: '', date_resolution: '', notes_resolution: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  // ============================================================================
  // MENU DÉROULANT
  // ============================================================================
  const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);
  useEffect(() => {
    const handler = (e) => { if (openMenuId && !e.target.closest('.action-menu')) setOpenMenuId(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  // ============================================================================
  // HELPERS
  // ============================================================================
  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const outilNom = (id) => outils.find(o => o.id === Number(id))?.nom || '—';

  const nbProblemesOuverts = problemes.filter(p => p.statut !== 'resolu').length;

  // ============================================================================
  // CRUD
  // ============================================================================
  const handleOpenModal = (mode, item = null, forceTab = null) => {
    const tab = forceTab || activeFilter;
    setModalMode(mode);
    setSelectedItem(item);
    setOpenMenuId(null);

    if (mode === 'edit' && item) {
      setFormData({ ...emptyForm, ...item });
    } else if (mode === 'create_probleme') {
      // Pré-remplir l'outil si on vient du menu d'un outil
      setFormData({
        ...emptyForm,
        outil_id: item?.id || '',
        date_signalement: new Date().toISOString().slice(0, 16),
        statut: 'signale',
      });
      setActiveFilter('problemes');
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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation minimale
    if (activeFilter === 'problemes' && !formData.description_probleme) {
      Swal.fire({ icon: 'warning', title: 'Champ requis', text: 'La description du problème est obligatoire.', confirmButtonColor: theme.primary }); return;
    }
    if (activeFilter !== 'problemes' && !formData.nom) {
      Swal.fire({ icon: 'warning', title: 'Champ requis', text: 'Le nom est obligatoire.', confirmButtonColor: theme.primary }); return;
    }

    const isEdit = modalMode === 'edit' && selectedItem;
    const newItem = { id: isEdit ? selectedItem.id : Date.now(), ...formData };

    const updater = (setter, list) =>
      setter(isEdit ? list.map(x => x.id === selectedItem.id ? newItem : x) : [...list, newItem]);

    switch (activeFilter) {
      case 'fournisseurs': updater(setFournisseurs, fournisseurs); break;
      case 'outils':       updater(setOutils, outils); break;
      case 'pieces':       updater(setPieces, pieces); break;
      case 'problemes':    updater(setProblemes, problemes); break;
    }

    handleCloseModal();
    Swal.fire({
      icon: 'success',
      title: isEdit ? 'Modifié !' : 'Créé !',
      text: isEdit ? 'L\'élément a été mis à jour.' : 'L\'élément a été créé avec succès.',
      timer: 1800, timerProgressBar: true, showConfirmButton: false,
      background: darkMode ? '#111827' : '#fff',
      color: darkMode ? '#f1f5f9' : '#111827',
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      icon: 'warning', title: 'Supprimer cet élément ?',
      showCancelButton: true, confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444', cancelButtonColor: darkMode ? '#374151' : '#9ca3af',
      background: darkMode ? '#111827' : '#fff', color: darkMode ? '#f1f5f9' : '#111827',
      reverseButtons: true,
    }).then(res => {
      if (!res.isConfirmed) return;
      setOpenMenuId(null);
      switch (activeFilter) {
        case 'fournisseurs': setFournisseurs(fournisseurs.filter(x => x.id !== id)); break;
        case 'outils':       setOutils(outils.filter(x => x.id !== id)); break;
        case 'pieces':       setPieces(pieces.filter(x => x.id !== id)); break;
        case 'problemes':    setProblemes(problemes.filter(x => x.id !== id)); break;
      }
      Swal.fire({ icon: 'success', title: 'Supprimé', timer: 1500, showConfirmButton: false, background: darkMode ? '#111827' : '#fff', color: darkMode ? '#f1f5f9' : '#111827' });
    });
  };

  const handleToggleStatus = (id) => {
    setOpenMenuId(null);
    if (activeFilter === 'fournisseurs') setFournisseurs(fournisseurs.map(x => x.id === id ? { ...x, est_actif: !x.est_actif } : x));
    if (activeFilter === 'pieces')       setPieces(pieces.map(x => x.id === id ? { ...x, est_actif: !x.est_actif } : x));
  };

  // Résoudre directement un problème depuis le menu
  const handleResoudreProbleme = (item) => {
    setOpenMenuId(null);
    Swal.fire({
      title: 'Résoudre le problème',
      input: 'textarea',
      inputLabel: 'Notes de résolution',
      inputPlaceholder: 'Décrire la solution apportée…',
      showCancelButton: true,
      confirmButtonText: 'Marquer comme résolu',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#22c55e',
      background: darkMode ? '#111827' : '#fff',
      color: darkMode ? '#f1f5f9' : '#111827',
    }).then(res => {
      if (res.isConfirmed) {
        setProblemes(prev => prev.map(p => p.id === item.id
          ? { ...p, statut: 'resolu', date_resolution: new Date().toISOString().slice(0, 16), notes_resolution: res.value || '' }
          : p
        ));
        Swal.fire({ icon: 'success', title: 'Résolu !', timer: 1500, showConfirmButton: false, background: darkMode ? '#111827' : '#fff', color: darkMode ? '#f1f5f9' : '#111827' });
      }
    });
  };

  // ============================================================================
  // FILTRAGE & PAGINATION
  // ============================================================================
  const getFilteredData = () => {
    const map = { fournisseurs, outils, pieces, problemes };
    const data = map[activeFilter] || [];
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    return data.filter(item =>
      (item.nom                  && item.nom.toLowerCase().includes(q)) ||
      (item.sku                  && item.sku.toLowerCase().includes(q)) ||
      (item.type                 && item.type.toLowerCase().includes(q)) ||
      (item.contact              && item.contact.toLowerCase().includes(q)) ||
      (item.description_probleme && item.description_probleme.toLowerCase().includes(q)) ||
      (item.signale_par          && item.signale_par.toLowerCase().includes(q)) ||
      (item.outil_id             && outilNom(item.outil_id).toLowerCase().includes(q))
    );
  };

  const filteredData  = getFilteredData();
  const totalPages    = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems  = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeFilter, searchTerm]);

  // ============================================================================
  // STATS
  // ============================================================================
  const getStats = () => {
    switch (activeFilter) {
      case 'fournisseurs': return [
        { label: 'Total Fournisseurs', value: fournisseurs.length,                              icon: 'bi-building',           color: 'blue'   },
        { label: 'Actifs',             value: fournisseurs.filter(f => f.est_actif).length,     icon: 'bi-check-circle',        color: 'green'  },
        { label: 'Pièces détachées',   value: fournisseurs.filter(f => f.type === 'pieces').length, icon: 'bi-box-seam',        color: 'purple' },
      ];
      case 'outils': return [
        { label: 'Total Outils',    value: outils.length,                                    icon: 'bi-tools',                  color: 'orange' },
        { label: 'État OK',         value: outils.filter(o => o.etat === 'OK').length,       icon: 'bi-check-circle',            color: 'green'  },
        { label: 'En Maintenance',  value: outils.filter(o => o.etat === 'Maintenance').length, icon: 'bi-wrench',              color: 'yellow' },
      ];
      case 'pieces': return [
        { label: 'Total Pièces',  value: pieces.length,                                                                icon: 'bi-box-seam',              color: 'blue'   },
        { label: 'Stock Faible',  value: pieces.filter(p => p.quantite_stock <= p.seuil_alerte && p.quantite_stock > 0).length, icon: 'bi-exclamation-triangle', color: 'orange' },
        { label: 'Stock Épuisé',  value: pieces.filter(p => p.quantite_stock === 0).length,                           icon: 'bi-x-circle',              color: 'red'    },
      ];
      case 'problemes': return [
        { label: 'Total signalés', value: problemes.length,                                         icon: 'bi-exclamation-octagon', color: 'red'    },
        { label: 'En cours',       value: problemes.filter(p => p.statut === 'en_cours').length,    icon: 'bi-arrow-repeat',        color: 'yellow' },
        { label: 'Résolus',        value: problemes.filter(p => p.statut === 'resolu').length,      icon: 'bi-check2-circle',       color: 'green'  },
      ];
      default: return [];
    }
  };

  const colorMap = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400' },
    green: { bg: 'bg-green-100 dark:bg-green-900/20', icon: 'text-green-600 dark:text-green-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', icon: 'text-yellow-600 dark:text-yellow-400' },
    red: { bg: 'bg-red-100 dark:bg-red-900/20', icon: 'text-red-600 dark:text-red-400' },
  };

  // ============================================================================
  // STOCK STATUS
  // ============================================================================
  const getStockStatus = (q, s) => {
    const pct = (q / s) * 100;
    if (q === 0)       return { label: 'Épuisé',      color: 'bg-red-100 text-red-700',    icon: 'bi-arrow-down-circle-fill text-red-500' };
    if (q <= s)        return { label: 'Stock faible', color: 'bg-orange-100 text-orange-700', icon: 'bi-exclamation-triangle-fill text-orange-500' };
    if (pct <= 150)    return { label: 'Stock moyen',  color: 'bg-yellow-100 text-yellow-700', icon: 'bi-arrow-right-circle-fill text-yellow-500' };
    return               { label: 'Stock élevé',   color: 'bg-green-100 text-green-700',  icon: 'bi-arrow-up-circle-fill text-green-500' };
  };

  // ============================================================================
  // ROW STYLE
  // ============================================================================
  const rowBg = (index) => index % 2 === 0
    ? (darkMode ? '#1a2535' : '#eef2ff')
    : (darkMode ? '#1c1f2b' : '#f3f4f6');

  const rowStyle = (index) => ({
    backgroundColor: rowBg(index),
    borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
    transition: 'background-color 0.15s ease',
  });

  const rowHover = (index) => ({
    onMouseEnter: (e) => { e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`; },
    onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = rowBg(index); },
  });

  // ── shared cell classes ──
  const td  = `px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`;
  const tds = `px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`;

  // ============================================================================
  // MENU ACTION (réutilisable)
  // ============================================================================
  const ActionMenu = ({ item, extraItems }) => (
    <div className="relative action-menu inline-block">
      <button onClick={() => toggleMenu(item.id)}
        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}>
        <i className="bi bi-three-dots-vertical"></i>
      </button>
      {openMenuId === item.id && (
        <div className={`absolute right-0 mt-2 w-52 rounded-lg shadow-lg z-20 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="py-1">
            {extraItems}
            <button onClick={() => handleOpenModal('edit', item)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              <i className="bi bi-pencil-square text-blue-500"></i>Modifier
            </button>
            <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            <button onClick={() => handleDelete(item.id)}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}>
              <i className="bi bi-trash3"></i>Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDER TABLE
  // ============================================================================
  const renderTable = () => {
    if (currentItems.length === 0) return (
      <tr>
        <td colSpan="8" className="px-6 py-12 text-center">
          <i className={`bi bi-inbox text-5xl block mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}></i>
          <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun élément trouvé</p>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {searchTerm ? 'Essayez une autre recherche' : 'Commencez par créer un nouvel élément'}
          </p>
        </td>
      </tr>
    );

    return currentItems.map((item, index) => {
      const rs = rowStyle(index);
      const rh = rowHover(index);

      // ── FOURNISSEURS ──
      if (activeFilter === 'fournisseurs') return (
        <tr key={item.id} style={rs} {...rh}>
          <td className={td}><div className="flex items-center gap-2"><i className="bi bi-building text-blue-500"></i><span className="font-medium">{item.nom}</span></div></td>
          <td className={tds}>{item.contact || '—'}</td>
          <td className={tds}>{item.telephone || '—'}</td>
          <td className={tds}>{item.email || '—'}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              item.type === 'pieces'    ? 'bg-purple-100 text-purple-700' :
              item.type === 'carburant' ? 'bg-orange-100 text-orange-700' :
              item.type === 'assurance' ? 'bg-blue-100 text-blue-700'     : 'bg-gray-100 text-gray-700'}`}>
              {item.type}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.est_actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {item.est_actif ? 'Actif' : 'Inactif'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <ActionMenu item={item} extraItems={
              <button onClick={() => handleToggleStatus(item.id)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                <i className={`bi ${item.est_actif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-500'}`}></i>
                {item.est_actif ? 'Désactiver' : 'Activer'}
              </button>
            } />
          </td>
        </tr>
      );

      // ── OUTILS ──
      if (activeFilter === 'outils') return (
        <tr key={item.id} style={rs} {...rh}>
          <td className={td}><div className="flex items-center gap-2"><i className="bi bi-tools text-orange-500"></i><span className="font-medium">{item.nom}</span></div></td>
          <td className={tds}>{item.type || '—'}</td>
          <td className={tds}>{item.categorie || '—'}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              item.etat === 'OK'          ? 'bg-green-100 text-green-700' :
              item.etat === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {item.etat}
            </span>
          </td>
          <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><div className="max-w-xs truncate">{item.emplacement || '—'}</div></td>
          <td className={tds}>{item.date_dernier_controle || '—'}</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <ActionMenu item={item} extraItems={
              <>
                {/* ★ DÉCLARER UN PROBLÈME depuis le menu outil ★ */}
                <button
                  onClick={() => { setOpenMenuId(null); handleOpenModal('create_probleme', item); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}>
                  <i className="bi bi-exclamation-octagon-fill text-red-500"></i>
                  Déclarer un problème
                </button>
                <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
              </>
            } />
          </td>
        </tr>
      );

      // ── PIÈCES ──
      if (activeFilter === 'pieces') {
        const fourn = fournisseurs.find(f => f.id === item.fournisseur_id);
        const ss    = getStockStatus(item.quantite_stock, item.seuil_alerte);
        return (
          <tr key={item.id} style={rs} {...rh}>
            <td className={td}>
              <div className="flex items-center gap-2">
                <i className="bi bi-box-seam text-green-500"></i>
                <div>
                  <div className="font-medium">{item.nom}</div>
                  {item.sku && <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SKU: {item.sku}</div>}
                </div>
              </div>
            </td>
            <td className={tds}>{item.type_piece || '—'}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <i className={ss.icon}></i>
                <div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.quantite_stock} {item.unite}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Seuil: {item.seuil_alerte}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1 rounded-full text-xs font-medium ${ss.color}`}>{ss.label}</span></td>
            <td className={tds}>{item.prix_unitaire.toLocaleString()} FCFA</td>
            <td className={tds}>{fourn ? fourn.nom : '—'}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.est_actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {item.est_actif ? 'Actif' : 'Inactif'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <ActionMenu item={item} extraItems={
                <button onClick={() => handleToggleStatus(item.id)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <i className={`bi ${item.est_actif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-500'}`}></i>
                  {item.est_actif ? 'Désactiver' : 'Activer'}
                </button>
              } />
            </td>
          </tr>
        );
      }

      // ── PROBLÈMES D'OUTILS ──
      if (activeFilter === 'problemes') return (
        <tr key={item.id} style={rs} {...rh}>
          {/* Outil */}
          <td className={td}>
            <div className="flex items-center gap-2">
              <i className="bi bi-tools text-orange-500"></i>
              <span className="font-medium">{outilNom(item.outil_id)}</span>
            </div>
          </td>
          {/* Signalé par */}
          <td className={tds}>{item.signale_par || '—'}</td>
          {/* Description */}
          <td className={`px-6 py-4 max-w-xs`}>
            <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.description_probleme}</p>
          </td>
          {/* Statut */}
          <td className="px-6 py-4 whitespace-nowrap">
            <StatutBadge statut={item.statut} darkMode={darkMode} />
          </td>
          {/* Date signalement */}
          <td className={tds}>{fmtDate(item.date_signalement)}</td>
          {/* Date résolution */}
          <td className={tds}>{item.date_resolution ? fmtDate(item.date_resolution) : '—'}</td>
          {/* Notes résolution */}
          <td className={`px-6 py-4 max-w-xs`}>
            <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.notes_resolution || '—'}</p>
          </td>
          {/* Actions */}
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <ActionMenu item={item} extraItems={
              item.statut !== 'resolu' && (
                <>
                  <button onClick={() => handleResoudreProbleme(item)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-green-50'}`}>
                    <i className="bi bi-check2-circle text-green-500"></i>
                    Marquer résolu
                  </button>
                  {item.statut === 'signale' && (
                    <button onClick={() => { setProblemes(prev => prev.map(p => p.id === item.id ? { ...p, statut: 'en_cours' } : p)); setOpenMenuId(null); }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-yellow-600 hover:bg-yellow-50'}`}>
                      <i className="bi bi-arrow-repeat text-yellow-500"></i>
                      Passer en cours
                    </button>
                  )}
                  <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                </>
              )
            } />
          </td>
        </tr>
      );

      return null;
    });
  };

  // ============================================================================
  // FORM FIELDS
  // ============================================================================
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
  }`;
  const labelCls = `block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  const renderFormFields = () => {
    switch (activeFilter) {

      case 'fournisseurs': return (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={labelCls}>Nom <span className="text-red-500">*</span></label>
              <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} className={inputCls} placeholder="Ex: AutoPièces Pro" /></div>
            <div><label className={labelCls}>Contact</label>
              <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} className={inputCls} placeholder="Nom du contact" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={labelCls}>Téléphone</label>
              <input type="tel" name="telephone" value={formData.telephone} onChange={handleInputChange} className={inputCls} placeholder="+241 XX XX XX XX" /></div>
            <div><label className={labelCls}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputCls} placeholder="email@exemple.com" /></div>
          </div>
          <div className="mb-4"><label className={labelCls}>Type <span className="text-red-500">*</span></label>
            <select name="type" value={formData.type} onChange={handleInputChange} className={inputCls}>
              <option value="pieces">Pièces détachées</option>
              <option value="carburant">Carburant</option>
              <option value="assurance">Assurance</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="mb-4"><label className={labelCls}>Adresse</label>
            <textarea name="adresse" value={formData.adresse} onChange={handleInputChange} rows="3" className={`${inputCls} resize-none`} placeholder="Adresse complète" /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="est_actif" checked={formData.est_actif} onChange={handleInputChange} className="w-4 h-4 rounded accent-blue-500" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actif</span>
          </label>
        </>
      );

      case 'outils': return (
        <>
          <div className="mb-4"><label className={labelCls}>Nom <span className="text-red-500">*</span></label>
            <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} className={inputCls} placeholder="Ex: Clé dynamométrique 200Nm" /></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={labelCls}>Type</label>
              <input type="text" name="type" value={formData.type} onChange={handleInputChange} className={inputCls} placeholder="Ex: Clé spéciale" /></div>
            <div><label className={labelCls}>Catégorie</label>
              <select name="categorie" value={formData.categorie} onChange={handleInputChange} className={inputCls}>
                <option value="">— Sélectionner —</option>
                <option>Outillage mécanique</option><option>Levage</option><option>Diagnostic</option>
                <option>Électrique</option><option>Pneumatique</option><option>Carrosserie</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={labelCls}>État <span className="text-red-500">*</span></label>
              <select name="etat" value={formData.etat} onChange={handleInputChange} className={inputCls}>
                <option value="OK">OK</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Hors service">Hors service</option>
              </select>
            </div>
            <div><label className={labelCls}>Dernier contrôle</label>
              <input type="date" name="date_dernier_controle" value={formData.date_dernier_controle} onChange={handleInputChange} className={inputCls} /></div>
          </div>
          <div className="mb-4"><label className={labelCls}>Emplacement</label>
            <input type="text" name="emplacement" value={formData.emplacement} onChange={handleInputChange} className={inputCls} placeholder="Ex: Atelier principal - Armoire A2" /></div>
          <div><label className={labelCls}>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className={`${inputCls} resize-none`} placeholder="Notes et observations" /></div>
        </>
      );

      case 'pieces': return (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={labelCls}>SKU / Référence</label>
              <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className={inputCls} placeholder="Ex: FLT-001" /></div>
            <div><label className={labelCls}>Nom <span className="text-red-500">*</span></label>
              <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} className={inputCls} placeholder="Ex: Filtre à huile" /></div>
          </div>
          <div className="mb-4"><label className={labelCls}>Type de pièce</label>
            <select name="type_piece" value={formData.type_piece} onChange={handleInputChange} className={inputCls}>
              <option value="">— Sélectionner —</option>
              <option>Filtre</option><option>Freinage</option><option>Lubrifiant</option>
              <option>Pneumatique</option><option>Électrique</option><option>Carrosserie</option><option>Moteur</option><option>Autre</option>
            </select>
          </div>
          <div className="mb-4"><label className={labelCls}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" className={`${inputCls} resize-none`} /></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><label className={labelCls}>Quantité <span className="text-red-500">*</span></label>
              <input type="number" name="quantite_stock" value={formData.quantite_stock} onChange={handleInputChange} className={inputCls} min="0" /></div>
            <div><label className={labelCls}>Seuil alerte <span className="text-red-500">*</span></label>
              <input type="number" name="seuil_alerte" value={formData.seuil_alerte} onChange={handleInputChange} className={inputCls} min="0" /></div>
            <div><label className={labelCls}>Unité</label>
              <select name="unite" value={formData.unite} onChange={handleInputChange} className={inputCls}>
                <option>unité</option><option>jeu</option><option>bidon</option><option>litre</option><option>kg</option><option>mètre</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={labelCls}>Prix unitaire (FCFA) <span className="text-red-500">*</span></label>
              <input type="number" name="prix_unitaire" value={formData.prix_unitaire} onChange={handleInputChange} className={inputCls} min="0" /></div>
            <div><label className={labelCls}>Fournisseur</label>
              <select name="fournisseur_id" value={formData.fournisseur_id} onChange={handleInputChange} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {fournisseurs.filter(f => f.est_actif).map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4"><label className={labelCls}>Emplacement</label>
            <input type="text" name="emplacement" value={formData.emplacement} onChange={handleInputChange} className={inputCls} placeholder="Ex: Magasin - Rayon B3" /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="est_actif" checked={formData.est_actif} onChange={handleInputChange} className="w-4 h-4 rounded accent-blue-500" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actif</span>
          </label>
        </>
      );

      // ── FORMULAIRE PROBLÈME D'OUTIL ──
      case 'problemes': return (
        <>
          {/* Outil concerné */}
          <div className="mb-4">
            <label className={labelCls}>Outil concerné <span className="text-red-500">*</span></label>
            <select name="outil_id" value={formData.outil_id} onChange={handleInputChange} className={inputCls}>
              <option value="">— Sélectionner un outil —</option>
              {outils.map(o => <option key={o.id} value={o.id}>{o.nom} ({o.etat})</option>)}
            </select>
            {/* Aperçu état outil */}
            {formData.outil_id && (() => {
              const o = outils.find(x => x.id === Number(formData.outil_id));
              if (!o) return null;
              return (
                <div className={`mt-2 p-3 rounded-lg text-xs flex items-center gap-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <i className="bi bi-tools text-orange-500 text-base"></i>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{o.nom}</p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{o.categorie} · {o.emplacement}</p>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full font-medium ${
                    o.etat === 'OK' ? 'bg-green-100 text-green-700' :
                    o.etat === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {o.etat}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Signalé par */}
          <div className="mb-4">
            <label className={labelCls}>Signalé par <span className="text-red-500">*</span></label>
            <input type="text" name="signale_par" value={formData.signale_par} onChange={handleInputChange}
              className={inputCls} placeholder="Nom de l'agent / mécanicien" />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className={labelCls}>Description du problème <span className="text-red-500">*</span></label>
            <textarea name="description_probleme" value={formData.description_probleme} onChange={handleInputChange}
              rows="4" className={`${inputCls} resize-none`}
              placeholder="Décrire précisément le problème constaté…" />
          </div>

          {/* Statut & Date signalement */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Statut</label>
              <select name="statut" value={formData.statut} onChange={handleInputChange} className={inputCls}>
                <option value="signale">Signalé</option>
                <option value="en_cours">En cours</option>
                <option value="resolu">Résolu</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Date de signalement</label>
              <input type="datetime-local" name="date_signalement" value={formData.date_signalement} onChange={handleInputChange} className={inputCls} />
            </div>
          </div>

          {/* Résolution (conditionnel) */}
          {formData.statut === 'resolu' && (
            <>
              <div className="mb-4">
                <label className={labelCls}>Date de résolution</label>
                <input type="datetime-local" name="date_resolution" value={formData.date_resolution} onChange={handleInputChange} className={inputCls} />
              </div>
              <div className="mb-4">
                <label className={labelCls}>Notes de résolution</label>
                <textarea name="notes_resolution" value={formData.notes_resolution} onChange={handleInputChange}
                  rows="3" className={`${inputCls} resize-none`} placeholder="Solution apportée…" />
              </div>
            </>
          )}
        </>
      );

      default: return null;
    }
  };

  // ============================================================================
  // THEAD CONFIG
  // ============================================================================
  const theadCols = {
    fournisseurs: ['Nom', 'Contact', 'Téléphone', 'Email', 'Type', 'Statut', 'Actions'],
    outils:       ['Nom', 'Type', 'Catégorie', 'État', 'Emplacement', 'Dernier contrôle', 'Actions'],
    pieces:       ['Pièce', 'Type', 'Stock', 'Alerte', 'Prix unitaire', 'Fournisseur', 'Statut', 'Actions'],
    problemes:    ['Outil', 'Signalé par', 'Description', 'Statut', 'Date signalement', 'Date résolution', 'Notes résolution', 'Actions'],
  };

  // ============================================================================
  // PAGINATION
  // ============================================================================
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const maxV = 5;
    let start = Math.max(1, currentPage - Math.floor(maxV / 2));
    let end   = Math.min(totalPages, start + maxV - 1);
    if (end - start < maxV - 1) start = Math.max(1, end - maxV + 1);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const btnBase = `px-3 py-2 rounded-lg text-sm transition-colors border`;
    const btnNormal = `${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`;
    const btnDisabled = `${darkMode ? 'bg-gray-800 text-gray-600 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'} cursor-not-allowed`;

    return (
      <div className="flex items-center justify-between px-6 py-4">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} sur {filteredData.length} résultats
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
            className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnNormal}`}>
            <i className="bi bi-chevron-left"></i>
          </button>
          {start > 1 && <><button onClick={() => setCurrentPage(1)} className={`${btnBase} ${btnNormal}`}>1</button>{start > 2 && <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>…</span>}</>}
          {pages.map(n => (
            <button key={n} onClick={() => setCurrentPage(n)}
              className={`${btnBase} ${n === currentPage ? 'text-white border-transparent' : btnNormal}`}
              style={n === currentPage ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
              {n}
            </button>
          ))}
          {end < totalPages && <>{end < totalPages - 1 && <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>…</span>}<button onClick={() => setCurrentPage(totalPages)} className={`${btnBase} ${btnNormal}`}>{totalPages}</button></>}
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
            className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnNormal}`}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  const modalTitle = () => {
    const action = modalMode === 'create' || modalMode === 'create_probleme' ? 'Déclarer' : 'Modifier';
    const map = { fournisseurs: 'un fournisseur', outils: 'un outil', pieces: 'une pièce', problemes: 'un problème d\'outil' };
    return `${action === 'Modifier' ? 'Modifier' : (activeFilter === 'problemes' ? 'Déclarer' : 'Créer')} ${map[activeFilter]}`;
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

        {/* EN-TÊTE */}
        <div className="mb-6">
          <h1 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fournisseurs & Inventaire</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gérez vos fournisseurs, outils, pièces détachées et problèmes signalés</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {getStats().map((s, i) => {
            const c = colorMap[s.color];
            return (
              <div key={i} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-6 border shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</p>
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.value}</h3>
                  </div>
                  <div className={`p-3 rounded-lg ${c.bg}`}><i className={`bi ${s.icon} text-2xl ${c.icon}`}></i></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ONGLETS + RECHERCHE + BOUTON */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-5 border shadow-sm mb-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* Onglets */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'fournisseurs', icon: 'bi-building',           label: 'Fournisseurs' },
                { key: 'outils',       icon: 'bi-tools',              label: 'Outils' },
                { key: 'pieces',       icon: 'bi-box-seam',           label: 'Pièces détachées' },
                { key: 'problemes',    icon: 'bi-exclamation-octagon', label: 'Problèmes d\'outils', badge: nbProblemesOuverts },
              ].map(({ key, icon, label, badge }) => (
                <button key={key} onClick={() => setActiveFilter(key)}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                    activeFilter === key ? 'text-white shadow-md' : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                  }`}
                  style={activeFilter === key ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                  <i className={`bi ${icon}`}></i>
                  {label}
                  {/* Badge alerte problèmes ouverts */}
                  {badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold leading-none ${
                      activeFilter === key ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Recherche + Ajouter */}
            <div className="flex gap-3">
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
                <input type="text" placeholder="Rechercher…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className={`pl-9 pr-4 py-2 rounded-lg border text-sm outline-none focus:ring-2 w-60 ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/30'}`} />
              </div>
              <button onClick={() => handleOpenModal('create')}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 hover:shadow-md flex items-center gap-2 transition-all"
                style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <i className="bi bi-plus-lg"></i>
                {activeFilter === 'problemes' ? 'Déclarer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                <tr>
                  {(theadCols[activeFilter] || []).map((col, i) => (
                    <th key={i} className={`px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider ${i === (theadCols[activeFilter].length - 1) ? 'text-center' : 'text-left'}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{renderTable()}</tbody>
            </table>
          </div>
          {renderPagination()}
        </div>

        {/* FOOTER */}
        <div className={`mt-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-sm text-center ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>© 2026 SGS Tous droits réservés — Version 1.0</p>
        </div>
      </main>

      {/* ══════════════════════════════════════════════
          MODAL CRUD
      ══════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>

            {/* Header modal */}
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                  <i className={`bi ${
                    activeFilter === 'fournisseurs' ? 'bi-building' :
                    activeFilter === 'outils'       ? 'bi-tools' :
                    activeFilter === 'pieces'       ? 'bi-box-seam' :
                    'bi-exclamation-octagon-fill'} text-lg`}></i>
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modalTitle()}</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {modalMode === 'edit' ? 'Modification d\'un élément existant' : 'Création d\'un nouvel élément'}
                  </p>
                </div>
              </div>
              <button onClick={handleCloseModal}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <i className="bi bi-x-lg text-lg"></i>
              </button>
            </div>

            {/* Body modal */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-1">
                {renderFormFields()}
              </div>
              <div className={`flex justify-end gap-3 px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100 bg-gray-50'}`}>
                <button type="button" onClick={handleCloseModal}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}>
                  Annuler
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 hover:shadow-md transition-all"
                  style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                  <i className={`bi ${modalMode === 'edit' ? 'bi-check-lg' : 'bi-plus-lg'} mr-1`}></i>
                  {modalMode === 'edit' ? 'Enregistrer' : (activeFilter === 'problemes' ? 'Déclarer' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FournisseursOutils;