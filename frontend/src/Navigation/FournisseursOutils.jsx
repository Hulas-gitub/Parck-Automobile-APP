import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import { useTheme } from '../contexts/ThemeContext';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getRowBackgroundColor } from '../utils/uniformStyles';
import { showSuccess, showError, getSwalConfig } from '../utils/walConfig';
import {
  getFournisseurs, createFournisseur, updateFournisseur, toggleFournisseur, deleteFournisseur,
  getOutils, createOutil, updateOutil, deleteOutil,
  getProblemes, createProbleme, updateProbleme, prendreEnChargeProbleme, resoudreProbleme, deleteProbleme,
} from '../api/Admin-Axios/Intervention-axios';

// API PAR ONGLET
const FETCHERS = { fournisseurs: getFournisseurs, outils: getOutils, problemes: getProblemes };

const CRUD = {
  fournisseurs: { create: createFournisseur, update: updateFournisseur, remove: deleteFournisseur },
  outils: { create: createOutil, update: updateOutil, remove: deleteOutil },
  problemes: { create: createProbleme, update: updateProbleme, remove: deleteProbleme },
};

// Listes à recharger après une modification (données liées côté serveur)
const REFRESH_AFTER = {
  fournisseurs: [],
  outils: ['problemes'],    // outil_nom affiché dans les problèmes
  problemes: ['outils'],    // outils.etat synchronisé (OK ou defaut)
};

// UTILITAIRES
const extractErrorMessage = (error) => {
  const data = error?.response?.data;
  if (!data) return error?.message || 'Erreur réseau inconnue.';
  if (data.errors) return Object.values(data.errors).flat().join('\n');
  return data.message || 'Une erreur inattendue est survenue.';
};

// « 2026-03-01 14:00:00 » donne une Date (compatible Safari)
const toDate = (d) => new Date(String(d).replace(' ', 'T'));
// valeur pour <input type="datetime-local">
const toInputDT = (d) => (d ? String(d).replace(' ', 'T').slice(0, 16) : '');
// valeur pour <input type="date">
const toInputDate = (d) => (d ? String(d).slice(0, 10) : '');

const fmtDate = (d) => {
  if (!d) return '';
  const dt = toDate(d);
  if (isNaN(dt)) return '';
  return dt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtNum = (n) => Number(n ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });

// CONSTANTES STATUTS PROBLÈMES
const STATUTS_PROBLEME = [
  { code: 'signale', libelle: 'Signalé', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', darkBg: 'bg-red-900/30', darkText: 'text-red-400' },
  { code: 'en_cours', libelle: 'En cours', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', darkBg: 'bg-yellow-900/30', darkText: 'text-yellow-400' },
  { code: 'resolu', libelle: 'Résolu', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', darkBg: 'bg-green-900/30', darkText: 'text-green-400' },
];
const statutProblemeCfg = (code) => STATUTS_PROBLEME.find((s) => s.code === code) || STATUTS_PROBLEME[0];

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

const etatOutilCls = (etat) =>
  etat === 'OK' ? 'bg-green-100 text-green-700' :
    etat === 'Maintenance' ? 'bg-yellow-100 text-yellow-700' :
      etat === 'defaut' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
const etatOutilLabel = (etat) => (etat === 'defaut' ? 'Défaut signalé' : etat);

// MENU D'ACTIONS (portal : jamais coupé par le overflow du tableau)
const MenuItem = ({ icon, label, onClick, tone = 'default', darkMode }) => {
  const tones = {
    default: darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100',
    danger: darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50',
    success: darkMode ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-green-50',
    warning: darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-yellow-600 hover:bg-yellow-50',
  };
  return (
    <button onClick={onClick} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${tones[tone]}`}>
      <i className={`bi ${icon}`}></i>{label}
    </button>
  );
};

const MenuDivider = ({ darkMode }) => <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />;

const ActionMenu = ({ darkMode, children }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 208) });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button ref={btnRef} onClick={toggle}
        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}>
        <i className="bi bi-three-dots-vertical"></i>
      </button>
      {open && ReactDOM.createPortal(
        <div className={`fixed z-[9999] w-52 rounded-lg shadow-xl py-1 text-left ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
          style={{ top: pos.top, left: pos.left }}>
          {children}
        </div>,
        document.body
      )}
    </>
  );
};

// LISTE DÉROULANTE AVEC SAISIE
const CATEGORIES_OUTIL = ['Outillage mécanique', 'Levage', 'Diagnostic', 'Électrique', 'Pneumatique', 'Carrosserie', 'Consommable'];

/**
 * Liste déroulante où l'on peut toujours taper.
 *  allowCustom = true  : la valeur saisie est conservée telle quelle (champs texte libres)
 *  allowCustom = false : la saisie sert à filtrer, il faut choisir un élément (champs liés à un id)
 * options : string[] ou [{ value, label }]
 */
const ComboBox = ({ value, onChange, options, allowCustom = false, placeholder, clearLabel, darkMode, inputCls }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typed, setTyped] = useState(false);
  const ref = useRef(null);

  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = opts.find((o) => String(o.value) === String(value));

  const display = allowCustom ? (value ?? '') : (open && typed ? query : (selected?.label ?? ''));
  const filtered = typed && query ? opts.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : opts;

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setTyped(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const choose = (v) => { onChange(v); setOpen(false); setTyped(false); setQuery(''); };

  const handleType = (e) => {
    const t = e.target.value;
    setQuery(t); setTyped(true); setOpen(true);
    if (allowCustom) onChange(t);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setTyped(false); }
    if (e.key === 'Enter' && open) {
      e.preventDefault(); // ne soumet pas le formulaire
      if (!allowCustom && filtered[0]) choose(filtered[0].value);
      else { setOpen(false); setTyped(false); }
    }
  };

  const itemCls = `w-full text-left px-3 py-2 text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`;

  return (
    <div className="relative" ref={ref}>
      <input type="text" value={display} placeholder={placeholder} autoComplete="off"
        onChange={handleType} onFocus={() => setOpen(true)} onClick={() => setOpen(true)} onKeyDown={handleKeyDown}
        className={`${inputCls} pr-8`} />
      <i className={`bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>

      {open && (
        <div className={`absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {clearLabel && (
            <button type="button" className={`${itemCls} italic opacity-70`} onMouseDown={(e) => e.preventDefault()} onClick={() => choose('')}>
              {clearLabel}
            </button>
          )}
          {filtered.length === 0 ? (
            <p className={`px-3 py-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {allowCustom ? 'Aucune suggestion, la valeur saisie sera utilisée' : 'Aucun résultat'}
            </p>
          ) : filtered.map((o) => (
            <button type="button" key={o.value} className={`${itemCls} ${String(o.value) === String(value) ? 'font-semibold' : ''}`}
              onMouseDown={(e) => e.preventDefault()} onClick={() => choose(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// SKELETON DE CHARGEMENT (toute la page)
const Shimmer = ({ darkMode, className = '' }) => (
  <div className={`relative overflow-hidden rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const SkeletonPage = ({ darkMode }) => {
  const card = `${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm`;
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Shimmer darkMode={darkMode} className="w-72 h-8" />
        <Shimmer darkMode={darkMode} className="w-96 max-w-full h-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${card} p-6 flex items-center justify-between`}>
            <div className="space-y-3">
              <Shimmer darkMode={darkMode} className="w-32 h-3" />
              <Shimmer darkMode={darkMode} className="w-16 h-8" />
            </div>
            <Shimmer darkMode={darkMode} className="w-12 h-12 rounded-lg" />
          </div>
        ))}
      </div>

      <div className={`${card} p-5 mb-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['w-32', 'w-24', 'w-44'].map((w, i) => (
              <Shimmer key={i} darkMode={darkMode} className={`${w} h-9 rounded-lg`} />
            ))}
          </div>
          <div className="flex gap-3">
            <Shimmer darkMode={darkMode} className="w-60 h-9 rounded-lg" />
            <Shimmer darkMode={darkMode} className="w-28 h-9 rounded-lg" />
          </div>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className={`px-6 py-4 flex gap-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Shimmer key={i} darkMode={darkMode} className="flex-1 h-3" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`px-6 py-4 flex items-center gap-6 ${i % 2 === 0 ? (darkMode ? 'bg-gray-900' : 'bg-white') : (darkMode ? 'bg-gray-900/60' : 'bg-gray-50/60')}`}>
            <div className="flex items-center gap-2 flex-1">
              <Shimmer darkMode={darkMode} className="w-5 h-5 rounded" />
              <Shimmer darkMode={darkMode} className="w-28 h-3" />
            </div>
            <Shimmer darkMode={darkMode} className="flex-1 h-3" />
            <Shimmer darkMode={darkMode} className="flex-1 h-3" />
            <Shimmer darkMode={darkMode} className="flex-1 h-3" />
            <Shimmer darkMode={darkMode} className="w-20 h-6 rounded-full" />
            <Shimmer darkMode={darkMode} className="w-16 h-6 rounded-full" />
            <Shimmer darkMode={darkMode} className="w-8 h-8 rounded-lg" />
          </div>
        ))}
        <div className="px-6 py-4 flex items-center justify-between">
          <Shimmer darkMode={darkMode} className="w-40 h-3" />
          <div className="flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} darkMode={darkMode} className="w-9 h-9 rounded-lg" />)}
          </div>
        </div>
      </div>
    </div>
  );
};

// COMPOSANT PRINCIPAL
const FournisseursOutils = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem('fleetify_darkMode', String(darkMode)); } catch { } }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { theme } = useTheme();

  const [activeFilter, setActiveFilter] = useState('fournisseurs');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 10;

  // Données (venant de l'API)
  const [fournisseurs, setFournisseurs] = useState([]);
  const [outils, setOutils] = useState([]);
  const [problemes, setProblemes] = useState([]);

  const setters = { fournisseurs: setFournisseurs, outils: setOutils, problemes: setProblemes };

  // Config SweetAlert commune
  const swalBase = () => getSwalConfig(darkMode, theme);

  // Formulaire générique
  const emptyForm = {
    nom: '', contact: '', telephone: '', email: '', type: 'pieces', adresse: '', est_actif: true,
    categorie: '', quantite_stock: '', etat: 'OK', emplacement: '', date_dernier_controle: '', notes: '',
    outil_id: '', description_probleme: '',
    statut: 'signale', date_signalement: '', date_resolution: '', notes_resolution: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  // CHARGEMENT
  const loadList = async (key) => {
    const res = await FETCHERS[key]();
    setters[key](res.data || []);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all(Object.keys(FETCHERS).map(loadList));
    } catch (err) {
      showError(darkMode, theme, 'Erreur de chargement', typeof err === 'string' ? err : extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  // Rechargement silencieux des listes liées
  const refreshLinked = (key) => {
    (REFRESH_AFTER[key] || []).forEach((k) => loadList(k).catch(() => { }));
  };

  // HELPERS
  const outilNom = (id) => outils.find((o) => o.id === Number(id))?.nom || '';
  const nbProblemesOuverts = problemes.filter((p) => p.statut !== 'resolu').length;

  // MODAL
  const normalizeItem = (item) => {
    const f = { ...emptyForm };
    Object.keys(emptyForm).forEach((k) => { if (item[k] !== null && item[k] !== undefined) f[k] = item[k]; });
    // le champ "type" n'a de valeur par défaut que pour les fournisseurs
    f.type = item.type ?? (activeFilter === 'fournisseurs' ? 'pieces' : '');
    f.date_dernier_controle = toInputDate(item.date_dernier_controle);
    f.date_signalement = toInputDT(item.date_signalement);
    f.date_resolution = toInputDT(item.date_resolution);
    return f;
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setSelectedItem(item);

    if (mode === 'edit' && item) {
      setFormData(normalizeItem(item));
    } else if (mode === 'create_probleme') {
      setFormData({
        ...emptyForm,
        outil_id: item?.id || '',
        date_signalement: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        statut: 'signale',
      });
      setActiveFilter('problemes');
    } else {
      setFormData({ ...emptyForm, type: activeFilter === 'fournisseurs' ? 'pieces' : '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setFormData(emptyForm);
  };

  const setField = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // PAYLOADS (uniquement les champs acceptés par le contrôleur)
  const nn = (v) => (v === '' || v === undefined ? null : v);

  const buildPayload = () => {
    const d = formData;
    switch (activeFilter) {
      case 'fournisseurs':
        return {
          nom: d.nom, contact: nn(d.contact), telephone: nn(d.telephone), email: nn(d.email),
          type: d.type, adresse: nn(d.adresse), est_actif: !!d.est_actif
        };
      case 'outils':
        return {
          nom: d.nom, type: nn(d.type), categorie: nn(d.categorie),
          quantite_stock: Math.max(0, parseInt(d.quantite_stock, 10) || 0),
          etat: d.etat, emplacement: nn(d.emplacement),
          date_dernier_controle: nn(d.date_dernier_controle), notes: nn(d.notes)
        };
      case 'problemes':
        return {
          outil_id: Number(d.outil_id), description_probleme: d.description_probleme, statut: d.statut,
          date_signalement: nn(d.date_signalement),
          date_resolution: d.statut === 'resolu' ? nn(d.date_resolution) : null,
          notes_resolution: nn(d.notes_resolution)
        };
      default: return {};
    }
  };

  // CRUD
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeFilter === 'problemes') {
      if (!formData.outil_id) return showError(darkMode, theme, 'Champ requis', 'Veuillez sélectionner un outil.');
      if (!formData.description_probleme.trim()) return showError(darkMode, theme, 'Champ requis', 'La description du problème est obligatoire.');
    } else if (!formData.nom.trim()) {
      return showError(darkMode, theme, 'Champ requis', 'Le nom est obligatoire.');
    }

    if (activeFilter === 'outils') {
      const q = Number(formData.quantite_stock);
      if (formData.quantite_stock === '' || isNaN(q) || q < 0) {
        return showError(darkMode, theme, 'Champ requis', 'La quantité en stock est obligatoire (nombre positif ou nul).');
      }
    }

    const isEdit = modalMode === 'edit' && selectedItem;
    const key = activeFilter;
    setSaving(true);
    try {
      const res = isEdit
        ? await CRUD[key].update(selectedItem.id, buildPayload())
        : await CRUD[key].create(buildPayload());
      const saved = res.data;

      setters[key]((prev) => (isEdit ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved]));
      refreshLinked(key);
      handleCloseModal();
      showSuccess(darkMode, theme, isEdit ? 'Modifié !' : 'Créé !', isEdit ? "L'élément a été mis à jour." : "L'élément a été créé avec succès.");
    } catch (err) {
      showError(darkMode, theme, "Erreur d'enregistrement", typeof err === 'string' ? err : extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const r = await Swal.fire({
      icon: 'warning', title: 'Supprimer cet élément ?', showCancelButton: true,
      confirmButtonText: 'Oui, supprimer', cancelButtonText: 'Annuler', reverseButtons: true,
      ...swalBase(), confirmButtonColor: '#ef4444',
    });
    if (!r.isConfirmed) return;

    const key = activeFilter;
    try {
      await CRUD[key].remove(id);
      setters[key]((prev) => prev.filter((x) => x.id !== id));
      refreshLinked(key);
      showSuccess(darkMode, theme, 'Supprimé', "L'élément a été supprimé avec succès.");
    } catch (err) {
      showError(darkMode, theme, 'Suppression impossible', typeof err === 'string' ? err : extractErrorMessage(err));
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleFournisseur(id);
      setFournisseurs((prev) => prev.map((x) => (x.id === id ? { ...x, ...res.data } : x)));
    } catch (err) {
      showError(darkMode, theme, 'Erreur', typeof err === 'string' ? err : extractErrorMessage(err));
    }
  };

  // Problèmes
  const handlePrendreEnCharge = async (item) => {
    try {
      const res = await prendreEnChargeProbleme(item.id);
      setProblemes((prev) => prev.map((p) => (p.id === item.id ? res.data : p)));
    } catch (err) {
      showError(darkMode, theme, 'Erreur', typeof err === 'string' ? err : extractErrorMessage(err));
    }
  };

  const handleResoudreProbleme = async (item) => {
    const r = await Swal.fire({
      title: 'Résoudre le problème', input: 'textarea', inputLabel: 'Notes de résolution',
      inputPlaceholder: 'Décrire la solution apportée…',
      showCancelButton: true, confirmButtonText: 'Marquer comme résolu', cancelButtonText: 'Annuler',
      ...swalBase(), confirmButtonColor: '#22c55e',
    });
    if (!r.isConfirmed) return;
    try {
      const res = await resoudreProbleme(item.id, r.value || '');
      setProblemes((prev) => prev.map((p) => (p.id === item.id ? res.data : p)));
      loadList('outils').catch(() => { }); // l'état de l'outil a pu changer (defaut vers OK)
      showSuccess(darkMode, theme, 'Résolu !', 'Le problème a été résolu avec succès.');
    } catch (err) {
      showError(darkMode, theme, 'Erreur', typeof err === 'string' ? err : extractErrorMessage(err));
    }
  };

  // FILTRAGE & PAGINATION
  const getFilteredData = () => {
    const map = { fournisseurs, outils, problemes };
    const data = map[activeFilter] || [];
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    const has = (v) => v && String(v).toLowerCase().includes(q);
    return data.filter((item) =>
      has(item.nom) || has(item.type) || has(item.categorie) || has(item.contact) ||
      has(item.description_probleme) || has(item.signale_par) || has(item.outil_nom) ||
      (item.outil_id && has(outilNom(item.outil_id)))
    );
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [activeFilter, searchTerm]);

  // STATS
  const getStats = () => {
    switch (activeFilter) {
      case 'fournisseurs': return [
        { label: 'Total Fournisseurs', value: fournisseurs.length, icon: 'bi-building', color: 'blue' },
        { label: 'Actifs', value: fournisseurs.filter((f) => f.est_actif).length, icon: 'bi-check-circle', color: 'green' },
        { label: 'Inactifs', value: fournisseurs.filter((f) => !f.est_actif).length, icon: 'bi-x-circle', color: 'red' },
      ];
      case 'outils': return [
        { label: 'Total Outils', value: outils.length, icon: 'bi-tools', color: 'orange' },
        { label: 'État OK', value: outils.filter((o) => o.etat === 'OK').length, icon: 'bi-check-circle', color: 'green' },
        { label: 'En Maintenance', value: outils.filter((o) => o.etat === 'Maintenance').length, icon: 'bi-wrench', color: 'yellow' },
      ];
      case 'problemes': return [
        { label: 'Total signalés', value: problemes.length, icon: 'bi-exclamation-octagon', color: 'red' },
        { label: 'En cours', value: problemes.filter((p) => p.statut === 'en_cours').length, icon: 'bi-arrow-repeat', color: 'yellow' },
        { label: 'Résolus', value: problemes.filter((p) => p.statut === 'resolu').length, icon: 'bi-check2-circle', color: 'green' },
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

  // ROW STYLE
  const rowStyle = (index) => ({
    backgroundColor: getRowBackgroundColor(index, darkMode),
    borderBottom: darkMode ? '1px solid #1e293b' : '1px solid #e5e7eb',
    transition: 'background-color 0.15s ease',
  });

  const rowHover = (index) => ({
    onMouseEnter: (e) => { e.currentTarget.style.backgroundColor = darkMode ? `${theme.primary}30` : `${theme.primary}18`; },
    onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = getRowBackgroundColor(index, darkMode); },
  });

  const td = `px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`;
  const tds = `px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`;

  // MENU D'ACTIONS PAR LIGNE
  const renderMenu = (item, extraItems) => (
    <ActionMenu darkMode={darkMode}>
      {extraItems}
      <MenuItem darkMode={darkMode} icon="bi-pencil-square text-blue-500" label="Modifier" onClick={() => handleOpenModal('edit', item)} />
      <MenuDivider darkMode={darkMode} />
      <MenuItem darkMode={darkMode} tone="danger" icon="bi-trash3" label="Supprimer" onClick={() => handleDelete(item.id)} />
    </ActionMenu>
  );

  const toggleItem = (item) => (
    <MenuItem darkMode={darkMode} onClick={() => handleToggleStatus(item.id)}
      icon={item.est_actif ? 'bi-toggle-on text-green-500' : 'bi-toggle-off text-gray-500'}
      label={item.est_actif ? 'Désactiver' : 'Activer'} />
  );

  // RENDER TABLE
  const renderTable = () => {
    if (loading) return (
      <tr>
        <td colSpan="8" className="px-6 py-16 text-center">
          <i className="bi bi-hourglass-split text-4xl block mb-3 animate-spin" style={{ color: theme.primary }}></i>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Chargement…</p>
        </td>
      </tr>
    );

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

      // FOURNISSEURS
      if (activeFilter === 'fournisseurs') return (
        <tr key={item.id} style={rs} {...rh}>
          <td className={td}><div className="flex items-center gap-2"><i className="bi bi-building text-blue-500"></i><span className="font-medium">{item.nom}</span></div></td>
          <td className={tds}>{item.contact || ''}</td>
          <td className={tds}>{item.telephone || ''}</td>
          <td className={tds}>{item.email || ''}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.type === 'pieces' ? 'bg-purple-100 text-purple-700' :
              item.type === 'carburant' ? 'bg-orange-100 text-orange-700' :
                item.type === 'assurance' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              {item.type}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.est_actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {item.est_actif ? 'Actif' : 'Inactif'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">{renderMenu(item, toggleItem(item))}</td>
        </tr>
      );

      // OUTILS
      if (activeFilter === 'outils') return (
        <tr key={item.id} style={rs} {...rh}>
          <td className={td}><div className="flex items-center gap-2"><i className="bi bi-tools text-orange-500"></i><span className="font-medium">{item.nom}</span></div></td>
          <td className={tds}>{item.type || ''}</td>
          <td className={tds}>{item.categorie || ''}</td>
          <td className={`${td} font-semibold`}>{fmtNum(item.quantite_stock)}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${etatOutilCls(item.etat)}`}>{etatOutilLabel(item.etat)}</span>
          </td>
          <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><div className="max-w-xs truncate">{item.emplacement || ''}</div></td>
          <td className={tds}>{toInputDate(item.date_dernier_controle) || ''}</td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            {renderMenu(item, (
              <>
                <MenuItem darkMode={darkMode} tone="danger" icon="bi-exclamation-octagon-fill text-red-500"
                  label="Déclarer un problème" onClick={() => handleOpenModal('create_probleme', item)} />
                <MenuDivider darkMode={darkMode} />
              </>
            ))}
          </td>
        </tr>
      );

      // PROBLÈMES D'OUTILS
      if (activeFilter === 'problemes') return (
        <tr key={item.id} style={rs} {...rh}>
          <td className={td}>
            <div className="flex items-center gap-2">
              <i className="bi bi-tools text-orange-500"></i>
              <span className="font-medium">{item.outil_nom || outilNom(item.outil_id)}</span>
            </div>
          </td>
          <td className={tds}>{item.signale_par || ''}</td>
          <td className="px-6 py-4 max-w-xs">
            <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={item.description_probleme}>{item.description_probleme}</p>
          </td>
          <td className="px-6 py-4 whitespace-nowrap"><StatutBadge statut={item.statut} darkMode={darkMode} /></td>
          <td className={tds}>{fmtDate(item.date_signalement)}</td>
          <td className={tds}>{fmtDate(item.date_resolution)}</td>
          <td className="px-6 py-4 max-w-xs">
            <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={item.notes_resolution}>{item.notes_resolution || ''}</p>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            {renderMenu(item, item.statut !== 'resolu' && (
              <>
                <MenuItem darkMode={darkMode} tone="success" icon="bi-check2-circle text-green-500"
                  label="Marquer résolu" onClick={() => handleResoudreProbleme(item)} />
                {item.statut === 'signale' && (
                  <MenuItem darkMode={darkMode} tone="warning" icon="bi-arrow-repeat text-yellow-500"
                    label="Passer en cours" onClick={() => handlePrendreEnCharge(item)} />
                )}
                <MenuDivider darkMode={darkMode} />
              </>
            ))}
          </td>
        </tr>
      );

      return null;
    });
  };

  // FORM FIELDS
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500/30 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
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
            <input type="checkbox" name="est_actif" checked={!!formData.est_actif} onChange={handleInputChange} className="w-4 h-4 rounded accent-blue-500" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actif</span>
          </label>
        </>
      );

      case 'outils': return (
        <>
          <div className="mb-4"><label className={labelCls}>Nom <span className="text-red-500">*</span></label>
            <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} className={inputCls} placeholder="Ex: Bouteille d'huile de direction" /></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className={labelCls}>Type</label>
              <input type="text" name="type" value={formData.type} onChange={handleInputChange} className={inputCls} placeholder="Ex: Huile, Clé spéciale" /></div>
            <div><label className={labelCls}>Catégorie</label>
              <ComboBox value={formData.categorie} onChange={(v) => setField('categorie', v)}
                options={CATEGORIES_OUTIL} allowCustom placeholder="Choisir ou saisir une catégorie" darkMode={darkMode} inputCls={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><label className={labelCls}>Quantité en stock <span className="text-red-500">*</span></label>
              <input type="number" name="quantite_stock" value={formData.quantite_stock} onChange={handleInputChange}
                className={inputCls} min="0" step="1" placeholder="Ex: 8" /></div>
            <div><label className={labelCls}>État <span className="text-red-500">*</span></label>
              <select name="etat" value={formData.etat} onChange={handleInputChange} className={inputCls}>
                <option value="OK">OK</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Hors service">Hors service</option>
                <option value="defaut">Défaut signalé (auto)</option>
              </select>
            </div>
            <div><label className={labelCls}>Dernier contrôle</label>
              <input type="date" name="date_dernier_controle" value={formData.date_dernier_controle} onChange={handleInputChange} className={inputCls} /></div>
          </div>
          <div className="mb-4"><label className={labelCls}>Emplacement</label>
            <input type="text" name="emplacement" value={formData.emplacement} onChange={handleInputChange} className={inputCls} placeholder="Ex: Atelier principal, Armoire A2" /></div>
          <div><label className={labelCls}>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className={`${inputCls} resize-none`} placeholder="Notes et observations" /></div>
        </>
      );

      case 'problemes': return (
        <>
          <div className="mb-4">
            <label className={labelCls}>Outil concerné <span className="text-red-500">*</span></label>
            <ComboBox value={formData.outil_id} onChange={(v) => setField('outil_id', v)}
              options={outils.map((o) => ({ value: o.id, label: `${o.nom} (${etatOutilLabel(o.etat)})` }))}
              placeholder="Rechercher un outil…" darkMode={darkMode} inputCls={inputCls} />
            {formData.outil_id && (() => {
              const o = outils.find((x) => x.id === Number(formData.outil_id));
              if (!o) return null;
              return (
                <div className={`mt-2 p-3 rounded-lg text-xs flex items-center gap-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <i className="bi bi-tools text-orange-500 text-base"></i>
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{o.nom}</p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{[o.categorie, o.emplacement].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full font-medium ${etatOutilCls(o.etat)}`}>{etatOutilLabel(o.etat)}</span>
                </div>
              );
            })()}
          </div>

          {modalMode !== 'edit' && (
            <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <i className="bi bi-person-check mr-1"></i>Le problème sera signalé au nom de votre compte.
            </p>
          )}

          <div className="mb-4">
            <label className={labelCls}>Description du problème <span className="text-red-500">*</span></label>
            <textarea name="description_probleme" value={formData.description_probleme} onChange={handleInputChange}
              rows="4" className={`${inputCls} resize-none`} placeholder="Décrire précisément le problème constaté…" />
          </div>

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

  // THEAD CONFIG
  const theadCols = {
    fournisseurs: ['Nom', 'Contact', 'Téléphone', 'Email', 'Type', 'Statut', 'Actions'],
    outils: ['Nom', 'Type', 'Catégorie', 'Quantité en stock', 'État', 'Emplacement', 'Dernier contrôle', 'Actions'],
    problemes: ['Outil', 'Signalé par', 'Description', 'Statut', 'Date signalement', 'Date résolution', 'Notes résolution', 'Actions'],
  };

  // PAGINATION
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const maxV = 5;
    let start = Math.max(1, currentPage - Math.floor(maxV / 2));
    let end = Math.min(totalPages, start + maxV - 1);
    if (end - start < maxV - 1) start = Math.max(1, end - maxV + 1);
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const btnBase = 'px-3 py-2 rounded-lg text-sm transition-colors border';
    const btnNormal = darkMode ? 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300';
    const btnDisabled = `${darkMode ? 'bg-gray-800 text-gray-600 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'} cursor-not-allowed`;

    return (
      <div className="flex items-center justify-between px-6 py-4">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredData.length)} sur {filteredData.length} résultats
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}
            className={`${btnBase} ${currentPage === 1 ? btnDisabled : btnNormal}`}>
            <i className="bi bi-chevron-left"></i>
          </button>
          {start > 1 && <><button onClick={() => setCurrentPage(1)} className={`${btnBase} ${btnNormal}`}>1</button>{start > 2 && <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>…</span>}</>}
          {pages.map((n) => (
            <button key={n} onClick={() => setCurrentPage(n)}
              className={`${btnBase} ${n === currentPage ? 'text-white border-transparent' : btnNormal}`}
              style={n === currentPage ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
              {n}
            </button>
          ))}
          {end < totalPages && <>{end < totalPages - 1 && <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>…</span>}<button onClick={() => setCurrentPage(totalPages)} className={`${btnBase} ${btnNormal}`}>{totalPages}</button></>}
          <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}
            className={`${btnBase} ${currentPage === totalPages ? btnDisabled : btnNormal}`}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  };

  // RENDER
  const modalTitle = () => {
    const map = { fournisseurs: 'un fournisseur', outils: 'un outil', problemes: "un problème d'outil" };
    if (modalMode === 'edit') return `Modifier ${map[activeFilter]}`;
    return `${activeFilter === 'problemes' ? 'Déclarer' : 'Créer'} ${map[activeFilter]}`;
  };

  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex flex-col transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>

      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
      <Header
        darkMode={darkMode} setDarkMode={setDarkMode} sidebarCollapsed={sidebarCollapsed}
        showNotifications={showNotifications} setShowNotifications={setShowNotifications}
        showProfile={showProfile} setShowProfile={setShowProfile}
      />

      <main className="flex-1 transition-all duration-300 pt-24 px-4 pb-6" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '16.25rem' }}>

        {loading ? (
          <SkeletonPage darkMode={darkMode} />
        ) : (
          <>

            {/* EN-TÊTE */}
            <div className="mb-6">
              <h1 className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fournisseurs & Inventaire</h1>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Gérez vos fournisseurs, outils et problèmes signalés</p>
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

            {/* ONGLETS + RECHERCHE + BOUTONS */}
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl p-5 border shadow-sm mb-6`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'fournisseurs', icon: 'bi-building', label: 'Fournisseurs' },
                    { key: 'outils', icon: 'bi-tools', label: 'Outils' },
                    { key: 'problemes', icon: 'bi-exclamation-octagon', label: "Problèmes d'outils", badge: nbProblemesOuverts },
                  ].map(({ key, icon, label, badge }) => (
                    <button key={key} onClick={() => setActiveFilter(key)}
                      className={`relative px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${activeFilter === key ? 'text-white shadow-md' : `${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                        }`}
                      style={activeFilter === key ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}>
                      <i className={`bi ${icon}`}></i>
                      {label}
                      {badge > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold leading-none ${activeFilter === key ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                          {badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <div className="relative">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"></i>
                    <input type="text" placeholder="Rechercher…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-9 pr-4 py-2 rounded-lg border text-sm outline-none focus:ring-2 w-60 ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500/30'}`} />
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
                        <th key={i} className={`px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider ${i === theadCols[activeFilter].length - 1 ? 'text-center' : 'text-left'}`}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{renderTable()}</tbody>
                </table>
              </div>
              {!loading && renderPagination()}
            </div>
          </>
        )}
      </main>

      <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />

      {/* MODAL CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={saving ? undefined : handleCloseModal}></div>
          <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>

            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                  <i className={`bi ${activeFilter === 'fournisseurs' ? 'bi-building' :
                    activeFilter === 'outils' ? 'bi-tools' : 'bi-exclamation-octagon-fill'} text-lg`}></i>
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{modalTitle()}</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {modalMode === 'edit' ? "Modification d'un élément existant" : "Création d'un nouvel élément"}
                  </p>
                </div>
              </div>
              <button onClick={handleCloseModal} disabled={saving}
                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <i className="bi bi-x-lg text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-1">{renderFormFields()}</div>
              <div className={`flex justify-end gap-3 px-6 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100 bg-gray-50'}`}>
                <button type="button" onClick={handleCloseModal} disabled={saving}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
                  style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                  {saving
                    ? <><i className="bi bi-hourglass-split animate-spin"></i> Enregistrement...</>
                    : <><i className="bi bi-check-lg"></i> Enregistrer</>}
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