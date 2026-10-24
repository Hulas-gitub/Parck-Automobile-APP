import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getHistoriqueVehicules, getTypesDocuments } from '../api/Admin-Axios/HistoriqueVehicule-axios';

const LARAVEL_BASE_URL = import.meta.env.VITE_LARAVEL_URL;
const getStorageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${LARAVEL_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const STATUT_CONFIG = {
  expire:         { label: 'Expiré',         cls: 'bg-red-100 text-red-700',    dark: 'bg-red-900/30 text-red-400' },
  expire_bientot: { label: 'Expire bientôt', cls: 'bg-orange-100 text-orange-700', dark: 'bg-orange-900/30 text-orange-400' },
  valide:         { label: 'Valide',         cls: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
  sans_document:  { label: 'Sans document',  cls: 'bg-gray-200 text-gray-700',  dark: 'bg-gray-800 text-gray-400' },
  permanent:      { label: "N'expire pas",   cls: 'bg-indigo-100 text-indigo-700', dark: 'bg-indigo-900/30 text-indigo-300' },
};

const NIVEAU_CONFIG = {
  critique:  { label: '≤ 5 jours',  cls: 'bg-red-600 text-white' },
  urgent:    { label: '≤ 15 jours', cls: 'bg-orange-500 text-white' },
  attention: { label: '≤ 30 jours', cls: 'bg-amber-400 text-gray-900' },
  expire:    { label: 'Expiré',     cls: 'bg-red-700 text-white' },
};

const StatutBadge = ({ statut, darkMode }) => {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.valide;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${darkMode ? cfg.dark : cfg.cls}`}>{cfg.label}</span>;
};

const NiveauBadge = ({ niveau }) => {
  if (!niveau) return null;
  const cfg = NIVEAU_CONFIG[niveau];
  if (!cfg) return null;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${cfg.cls}`}>{cfg.label}</span>;
};

// ── Brique de base du skeleton ──
const Sk = ({ darkMode, className = '', style }) => (
  <div className={`animate-pulse rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} ${className}`} style={style} />
);

// ── Skeleton des lignes du tableau ──
const TableSkeletonRows = ({ darkMode, rows = 6 }) =>
  Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      <td className="px-5 py-4">
        <Sk darkMode={darkMode} className="h-4 w-28 mb-2" />
        <Sk darkMode={darkMode} className="h-3 w-40" />
      </td>
      <td className="px-5 py-4"><Sk darkMode={darkMode} className="h-4 w-24" /></td>
      <td className="px-5 py-4"><Sk darkMode={darkMode} className="h-4 w-20" /></td>
      <td className="px-5 py-4"><Sk darkMode={darkMode} className="h-4 w-20" /></td>
      <td className="px-5 py-4"><Sk darkMode={darkMode} className="h-4 w-16" /></td>
      <td className="px-5 py-4"><Sk darkMode={darkMode} className="h-6 w-24 rounded-full" /></td>
      <td className="px-5 py-4"><Sk darkMode={darkMode} className="h-7 w-7 rounded-lg" /></td>
    </tr>
  ));

// ── Skeleton complet de la page (au chargement initial) ──
const PageSkeleton = ({ darkMode, theme }) => {
  const card = `${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm`;
  return (
    <>
      {/* Titre + sous-titre */}
      <Sk darkMode={darkMode} className="h-6 w-96 max-w-full mb-3" />
      <Sk darkMode={darkMode} className="h-4 w-[34rem] max-w-full mb-6" />

      {/* Recherche par matricule */}
      <div className={`${card} p-4 mb-4`}>
        <Sk darkMode={darkMode} className="h-3 w-48 mb-3" />
        <div className="flex items-center gap-3">
          <Sk darkMode={darkMode} className="h-11 flex-1 rounded-lg" />
          <Sk darkMode={darkMode} className="h-11 w-56 rounded-lg" />
        </div>
      </div>

      {/* Filtres */}
      <div className={`${card} p-4 mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Sk darkMode={darkMode} className="h-3 w-32 mb-2" />
              <Sk darkMode={darkMode} className="h-11 w-full rounded-lg" />
            </div>
          ))}
          <div className="flex gap-2">
            <Sk darkMode={darkMode} className="h-11 flex-1 rounded-lg" />
            <Sk darkMode={darkMode} className="h-11 w-11 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className={`${card} overflow-hidden`}>
        <div className={`px-5 py-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <Sk darkMode={darkMode} className="h-4 w-44" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <th key={i} className="px-5 py-3.5 text-left">
                    <div className="h-3 w-20 rounded bg-white/40 animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableSkeletonRows darkMode={darkMode} rows={6} />
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const HistoriqueVehicule = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [darkMode] = useState(() => {
    try { const s = localStorage.getItem('fleetify_darkMode'); return s !== null ? s === 'true' : true; } catch { return true; }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // ── Chargement initial de la page (skeleton) ──
  const [pageLoading, setPageLoading] = useState(true);

  // ── Filtres de recherche par période ──
  const [dateDebut, setDateDebut]         = useState('');
  const [dateFin, setDateFin]             = useState('');
  const [typeDocument, setTypeDocument]   = useState('');
  const [typesDisponibles, setTypesDisponibles] = useState([]);
  // Par défaut, on affiche les documents "en règle" : valides ET permanents
  // (ex. carte grise) ensemble, puisque les deux signifient "rien à faire".
  const [filterStatut, setFilterStatut]   = useState('valide,permanent');

  // ── Recherche rapide par matricule ──
  const [searchImmatriculation, setSearchImmatriculation] = useState('');

  // ── Données ──
  const [results, setResults]     = useState([]);
  const [compteurs, setCompteurs] = useState({ expire: 0, expire_bientot: 0, valide: 0, sans_document: 0, permanent: 0 });
  const [loading, setLoading]     = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const itemsPerPage = 10;

  // Le skeleton reste affiché jusqu'à la fin du chargement initial
  useEffect(() => {
    getTypesDocuments()
      .then(setTypesDisponibles)
      .catch((err) => {
        if (err?.response?.status === 401) navigate('/login');
      })
      .finally(() => setPageLoading(false));
  }, [navigate]);


  const lancerRecherche = useCallback(async (page = 1, overrides = {}) => {
    const effDateDebut       = overrides.dateDebut ?? dateDebut;
    const effDateFin         = overrides.dateFin ?? dateFin;
    const effImmatriculation = overrides.searchImmatriculation ?? searchImmatriculation;
    const effTypeDocument    = overrides.typeDocument ?? typeDocument;
    const effFilterStatut    = overrides.filterStatut ?? filterStatut;

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await getHistoriqueVehicules({
        date_debut: effDateDebut || undefined,
        date_fin: effDateFin || undefined,
        immatriculation: effImmatriculation || undefined,
        type_document: effTypeDocument || undefined,
        statut: effFilterStatut || undefined,
        page,
        per_page: itemsPerPage,
      });
      setResults(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.last_page ?? 1);
      setCompteurs(data.compteurs ?? { expire: 0, expire_bientot: 0, valide: 0, sans_document: 0, permanent: 0 });
      setCurrentPage(page);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      console.error('Erreur recherche historique :', err);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin, searchImmatriculation, typeDocument, filterStatut, navigate]);

  // ── Recherche automatique au premier affichage (statut = valide par défaut) ──
  useEffect(() => {
    if (!pageLoading) {
      lancerRecherche(1, { filterStatut: 'valide,permanent' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLoading]);

  // ── Recherche rapide dédiée par matricule (réinitialise la période ET le
  // filtre statut, pour retrouver le véhicule quel que soit l'état de ses
  // documents — sinon le filtre "valide" par défaut le masquerait) ──
  const rechercherParMatricule = () => {
    if (!searchImmatriculation.trim()) return;
    setDateDebut('');
    setDateFin('');
    setFilterStatut('');
    lancerRecherche(1, { dateDebut: '', dateFin: '', filterStatut: '' });
  };

  const resetFiltres = () => {
    setDateDebut('');
    setDateFin('');
    setTypeDocument('');
    setSearchImmatriculation('');
    setFilterStatut('valide,permanent');
    lancerRecherche(1, {
      dateDebut: '', dateFin: '', searchImmatriculation: '', typeDocument: '', filterStatut: 'valide,permanent',
    });
  };

  const inputCls = `px-3 py-2.5 rounded-lg border text-sm font-semibold ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`;
  const labelCls = `block text-xs font-bold mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className={`${darkMode ? 'bg-gray-950' : 'bg-gray-50'} min-h-screen flex flex-col transition-colors duration-300`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      <Sidebar darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate} />
      <Header darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} showNotifications={showNotifications} setShowNotifications={setShowNotifications} showProfile={showProfile} setShowProfile={setShowProfile} />
      {(showNotifications || showProfile) && <div className="fixed inset-0 z-30" onClick={() => { setShowNotifications(false); setShowProfile(false); }} />}

      <main className="flex-1 transition-all duration-300 pt-24 px-4 pb-6" style={{ marginLeft: sidebarCollapsed ? '4.5rem' : '16.25rem' }}>
        {pageLoading ? (
          <PageSkeleton darkMode={darkMode} theme={theme} />
        ) : (
          <>
            <h1 className={`text-xl font-extrabold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <i className="bi bi-clock-history mr-2" style={{ color: theme.primary }}></i>
              Historique de conformité des documents véhicules
            </h1>
            <p className={`text-sm font-semibold mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Recherchez les documents (assurance, visite technique, ...) expirés ou proches de l'expiration sur une période, ou par matricule.
            </p>

            {/* ── CARTES COMPTEURS ── */}
            {hasSearched && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[
                  { key: 'expire', label: 'Documents expirés', icon: 'bi-exclamation-octagon-fill', color: '#ef4444' },
                  { key: 'expire_bientot', label: 'Expirent bientôt', icon: 'bi-exclamation-triangle-fill', color: '#f59e0b' },
                  { key: 'valide', label: 'Documents valides', icon: 'bi-check-circle-fill', color: '#10b981' },
                  { key: 'permanent', label: "N'expirent pas", icon: 'bi-infinity', color: '#6366f1' },
                  { key: 'sans_document', label: 'Sans document', icon: 'bi-file-earmark-excel-fill', color: '#9ca3af' },
                ].map(c => (
                  <div key={c.key} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 flex items-center justify-between`}>
                    <div>
                      <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{c.label}</p>
                      {loading ? (
                        <Sk darkMode={darkMode} className="h-7 w-12 mt-2" />
                      ) : (
                        <p className={`text-2xl font-extrabold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{compteurs[c.key] ?? 0}</p>
                      )}
                    </div>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${c.color}22` }}><i className={`${c.icon} text-lg`} style={{ color: c.color }}></i></div>
                  </div>
                ))}
              </div>
            )}

            {/* ── BLOC RECHERCHE PAR MATRICULE ── */}
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-4`}>
              <label className={labelCls}>Recherche rapide par matricule</label>
              <div className="flex items-center gap-3">
                <div className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <i className={`bi bi-upc-scan text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                  <input
                    type="text"
                    value={searchImmatriculation}
                    onChange={(e) => setSearchImmatriculation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && rechercherParMatricule()}
                    placeholder="Ex : AB-1234-GA"
                    className={`bg-transparent text-sm font-semibold outline-none w-full ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
                <button onClick={rechercherParMatricule} className="px-5 py-2.5 rounded-lg text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                  <i className="bi bi-search"></i> Rechercher par matricule
                </button>
              </div>
            </div>

            {/* ── BLOC RECHERCHE PAR PÉRIODE + FILTRES ── */}
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm p-4 mb-6`}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className={labelCls}>Date d'émission (à partir de)</label>
                  <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className={labelCls}>Date d'expiration (jusqu'à)</label>
                  <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className={`${inputCls} w-full`} />
                </div>
                <div>
                  <label className={labelCls}>Type de document</label>
                  <select value={typeDocument} onChange={e => setTypeDocument(e.target.value)} className={`${inputCls} w-full`}>
                    <option value="">Tous</option>
                    {typesDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Statut</label>
                  <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className={`${inputCls} w-full`}>
                    <option value="">Tous</option>
                    <option value="valide,permanent">En règle (valide + n'expire pas)</option>
                    <option value="expire">Expiré</option>
                    <option value="expire_bientot">Expire bientôt</option>
                    <option value="valide">Valide uniquement</option>
                    <option value="permanent">N'expire pas uniquement (ex. carte grise)</option>
                    <option value="sans_document">Sans document</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => lancerRecherche(1)} className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }}>
                    <i className="bi bi-funnel"></i> Rechercher
                  </button>
                  <button onClick={resetFiltres} className={`px-3 py-2.5 rounded-lg text-sm font-bold ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`} title="Réinitialiser">
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* ── TABLEAU RÉSULTATS ── */}
            <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden`}>
              <div className={`px-5 py-3 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                {loading ? (
                  <Sk darkMode={darkMode} className="h-4 w-44" />
                ) : (
                  <p className={`text-sm font-extrabold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <i className="bi bi-list-ul mr-2"></i>{hasSearched ? `${total} document(s) trouvé(s)` : 'Lancez une recherche'}
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}>
                      {['Véhicule', 'Type document', "Date d'émission", "Date d'expiration", 'Jours restants', 'Statut', 'Fichier'].map((h, i) => (
                        <th key={i} className="px-5 py-3.5 text-left text-xs font-extrabold uppercase tracking-wider text-white">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableSkeletonRows darkMode={darkMode} rows={6} />
                    ) : !hasSearched ? (
                      <tr><td colSpan={7} className={`text-center py-16 font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <i className="bi bi-search text-4xl block mb-2"></i>Choisissez une période ou un matricule pour lancer la recherche
                      </td></tr>
                    ) : results.length === 0 ? (
                      <tr><td colSpan={7} className={`text-center py-16 font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <i className="bi bi-inbox text-4xl block mb-2"></i>Aucun document trouvé pour ces critères
                      </td></tr>
                    ) : results.map((doc, idx) => (
                      <tr key={doc.document_id ?? `${doc.immatriculation}-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? (darkMode ? '#0c1929' : '#e8eef6') : (darkMode ? '#162033' : '#f1f4f9') }}>
                        <td className="px-5 py-4">
                          <p className={`font-extrabold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{doc.immatriculation}</p>
                          <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{doc.marque} {doc.modele} {doc.affectation ? `· ${doc.affectation}` : ''}</p>
                        </td>
                        <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{doc.type_document ?? '—'}</td>
                        <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{doc.date_emission ? new Date(doc.date_emission).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className={`px-5 py-4 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{doc.date_expiration ? new Date(doc.date_expiration).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className={`px-5 py-4 text-sm font-extrabold ${doc.statut === 'permanent' ? (darkMode ? 'text-indigo-300' : 'text-indigo-600') : doc.jours_restants == null ? (darkMode ? 'text-gray-500' : 'text-gray-400') : doc.jours_restants < 0 ? 'text-red-500' : doc.jours_restants <= 30 ? 'text-orange-500' : darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {doc.statut === 'permanent'
                            ? <><i className="bi bi-infinity mr-1"></i>N'expire pas</>
                            : doc.jours_restants == null ? '—' : doc.jours_restants < 0 ? `${Math.abs(doc.jours_restants)}j de retard` : `${doc.jours_restants}j`}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatutBadge statut={doc.statut} darkMode={darkMode} />
                            <NiveauBadge niveau={doc.niveau_urgence} />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {doc.url_fichier
                            ? <button onClick={() => window.open(getStorageUrl(doc.url_fichier), '_blank')} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'} transition-colors`} title="Ouvrir"><i className="bi bi-eye"></i></button>
                            : <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasSearched && totalPages > 1 && (
                <div className={`px-5 py-3.5 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, total)} sur {total} document(s)</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => lancerRecherche(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}><i className="bi bi-chevron-left"></i></button>
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => lancerRecherche(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === page ? 'text-white shadow-sm' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                        style={currentPage === page ? { background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` } : {}}
                      >
                        {page}
                      </button>
                    ))}
                    <button onClick={() => lancerRecherche(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className={`p-2 rounded-lg ${darkMode ? 'text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'text-gray-600 hover:bg-gray-100 disabled:opacity-40'} transition-colors`}><i className="bi bi-chevron-right"></i></button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <Footer darkMode={darkMode} sidebarCollapsed={sidebarCollapsed} theme={theme} />
    </div>
  );
};

export default HistoriqueVehicule;