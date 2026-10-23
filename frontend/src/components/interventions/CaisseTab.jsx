import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
  getSoldeCaisse,
  getMouvementsCaisse,
  approvisionnerCaisse,
  annulerMouvementCaisse,
  getApiError,
} from '../../api/Admin-Axios/Intervention-axios';
import { getSwalConfig, showSuccess } from '../../utils/walConfig';


const CaisseTab = ({ darkMode, theme, isReadOnly = false }) => {
  const [soldeInfo, setSoldeInfo] = useState({
    solde_actuel: 0,
    entrees_mois: 0,
    sorties_mois: 0,
    nb_mouvements_mois: 0,
  });

  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });

  // Modales
  const [showApproModal, setShowApproModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Formulaire Approvisionnement
  const [approForm, setApproForm] = useState({ montant: '', libelle: '', article: '' });
  const [approFile, setApproFile] = useState(null);

  // ── Chargement des données
  const fetchCaisseData = useCallback(async () => {
    setLoading(true);
    try {
      const [soldeRes, mouvRes] = await Promise.all([
        getSoldeCaisse(),
        getMouvementsCaisse({
          page,
          search: searchTerm || undefined,
          type_mouvement: filterType || undefined,
        }),
      ]);

      setSoldeInfo(soldeRes.data || {});
      setMouvements(mouvRes.data || []);
      setMeta(mouvRes.meta || { total: 0, last_page: 1 });
    } catch (err) {
      console.error('Erreur caisse:', err);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, [page, searchTerm, filterType]);

  useEffect(() => {
    fetchCaisseData();
  }, [fetchCaisseData]);

  // ── Approvisionnement
  const handleApprovisionner = async (e) => {
    e.preventDefault();
    if (!approForm.montant || parseFloat(approForm.montant) <= 0) {
      Swal.fire({ ...getSwalConfig(darkMode, theme), icon: 'warning', title: 'Attention', text: 'Montant invalide.' });
      return;
    }
    if (!approForm.libelle) {
      Swal.fire({ ...getSwalConfig(darkMode, theme), icon: 'warning', title: 'Attention', text: 'Le libellé est obligatoire.' });
      return;
    }

    const formData = new FormData();
    formData.append('montant', approForm.montant);
    formData.append('libelle', approForm.libelle);
    if (approForm.article) formData.append('article', approForm.article);
    if (approFile) formData.append('justificatif', approFile);

    setModalLoading(true);
    try {
      await approvisionnerCaisse(formData);
      showSuccess(darkMode, theme, 'Caisse approvisionnée !', 'Les fonds ont été ajoutés avec succès.');
      setShowApproModal(false);
      setApproForm({ montant: '', libelle: '', article: '' });
      setApproFile(null);
      fetchCaisseData();
    } catch (err) {
      Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'error',
        title: 'Erreur',
        text: getApiError(err, "Impossible d'effectuer l'approvisionnement."),
      });
    } finally {
      setModalLoading(false);
    }
  };

  // ── Annuler par Contre-passation
  const handleAnnuler = async (mouvement) => {
    const result = await Swal.fire({
      ...getSwalConfig(darkMode, theme),
      title: 'Contre-passation comptable',
      html: `Voulez-vous annuler le mouvement <strong>#${mouvement.id}</strong> (${Number(mouvement.montant).toLocaleString()} XAF) ?<br/><small class="text-gray-400">Une écriture inverse de contre-passation sera générée selon les normes comptables.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, contre-passer',
      cancelButtonText: 'Annuler',
    });

    if (!result.isConfirmed) return;

    try {
      await annulerMouvementCaisse(mouvement.id);
      showSuccess(darkMode, theme, 'Contre-passation effectuée', 'Le mouvement a été annulé avec succès.');
      fetchCaisseData();
    } catch (err) {
      Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'error',
        title: 'Erreur',
        text: getApiError(err, "Impossible d'annuler le mouvement."),
      });
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
    darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
  }`;

  const sk = darkMode ? 'bg-gray-800' : 'bg-gray-200';
  const cardSk = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';

  // Skeleton complet au premier chargement : rien n'est affiché avant les données
  if (firstLoad) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`p-6 rounded-2xl border ${cardSk}`}>
              <div className={`h-3 w-32 rounded mb-3 ${sk}`} />
              <div className={`h-7 w-40 rounded ${sk}`} />
            </div>
          ))}
        </div>
        <div className={`p-4 rounded-2xl border ${cardSk}`}>
          <div className={`h-9 w-72 rounded-xl ${sk}`} />
        </div>
        <div className={`rounded-2xl border overflow-hidden ${cardSk}`}>
          <div className={`h-11 ${sk}`} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex gap-6">
              <div className={`h-3.5 w-28 rounded ${sk}`} />
              <div className={`h-3.5 w-48 rounded ${sk}`} />
              <div className={`h-3.5 w-20 rounded ${sk}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── KPI SOLDE ET STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Solde actuel */}
        <div
          className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Solde Actuel en Caisse</p>
              <h3 className="text-2xl font-black text-amber-500">
                {Number(soldeInfo.solde_actuel || 0).toLocaleString()} <span className="text-sm font-bold text-gray-400">XAF</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl">
              <i className="bi bi-wallet2" />
            </div>
          </div>
        </div>

        {/* Entrées du mois */}
        <div
          className={`p-6 rounded-2xl border shadow-sm ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Approvisionnements (Mois)</p>
              <h3 className="text-2xl font-bold text-green-500">
                +{Number(soldeInfo.entrees_mois || 0).toLocaleString()} <span className="text-sm font-bold text-gray-400">XAF</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-500 flex items-center justify-center text-xl">
              <i className="bi bi-arrow-down-left-circle" />
            </div>
          </div>
        </div>

        {/* Sorties du mois */}
        <div
          className={`p-6 rounded-2xl border shadow-sm ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Dépenses (Mois)</p>
              <h3 className="text-2xl font-bold text-red-500">
                -{Number(soldeInfo.sorties_mois || 0).toLocaleString()} <span className="text-sm font-bold text-gray-400">XAF</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center text-xl">
              <i className="bi bi-arrow-up-right-circle" />
            </div>
          </div>
        </div>

        {/* Total Mouvements */}
        <div
          className={`p-6 rounded-2xl border shadow-sm ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Mouvements (Mois)</p>
              <h3 className="text-2xl font-bold text-blue-500">
                {soldeInfo.nb_mouvements_mois || 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center text-xl">
              <i className="bi bi-clock-history" />
            </div>
          </div>
        </div>
      </div>

      {/* ── BARRE D'ACTIONS ET FILTRES ── */}
      <div
        className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Recherche */}
          <div className="relative">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher article, libellé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-8 pr-3 py-2 rounded-xl border text-xs w-60 ${inputClass}`}
            />
          </div>

          {/* Filtre type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs ${inputClass}`}
          >
            <option value="">Tous les types</option>
            <option value="approvisionnement">Approvisionnements (+)</option>
            <option value="sortie">Dépenses / Sorties (-)</option>
            <option value="contre_passation">Contre-passations (±)</option>
          </select>
        </div>

        {/* Boutons d'action (masqués pour DAAL en lecture seule) */}
        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowApproModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <i className="bi bi-plus-circle text-sm" /> Approvisionner la caisse
            </button>
          </div>
        )}
      </div>

      {/* ── TABLEAU DES MOUVEMENTS ── */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.primaryDark})` }} className="text-white">
              <tr>
                <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Date & Heure</th>
                <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Libellé / Objet</th>
                <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Véhicule / Ref</th>
                <th className="px-5 py-3 text-right font-bold uppercase tracking-wider">Montant</th>
                <th className="px-5 py-3 text-right font-bold uppercase tracking-wider">Solde Après</th>
                <th className="px-5 py-3 text-left font-bold uppercase tracking-wider">Auteur</th>
                <th className="px-5 py-3 text-center font-bold uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/20">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className={`h-3.5 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} ${j === 2 ? 'w-40' : 'w-20'}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : mouvements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    Aucun mouvement de caisse trouvé.
                  </td>
                </tr>
              ) : (
                mouvements.map((m) => {
                  const isAnnule = m.est_annule;
                  const isEntree = m.type_mouvement === 'approvisionnement';
                  const isSortie = m.type_mouvement === 'sortie';
                  const isContre = m.type_mouvement === 'contre_passation';

                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors ${isAnnule ? 'opacity-40 line-through' : ''} ${
                        darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-5 py-3 whitespace-nowrap text-gray-400">
                        {new Date(m.date_mouvement || m.date_creation).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        {isEntree && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            Entrée (+)
                          </span>
                        )}
                        {isSortie && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Sortie (-)
                          </span>
                        )}
                        {isContre && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            Contre-passation
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        <p className="font-bold">{m.libelle}</p>
                        {m.article && <p className="text-[11px] text-gray-400">{m.article}</p>}
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        {m.vehicule_immatriculation ? (
                          <span className="font-semibold text-blue-400">{m.vehicule_immatriculation}</span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                        {m.intervention_id && (
                          <span className="block text-[10px] text-gray-400">Interv #{m.intervention_id}</span>
                        )}
                      </td>

                      <td className="px-5 py-3 text-right font-black whitespace-nowrap">
                        <span className={isEntree ? 'text-green-400' : isSortie ? 'text-amber-400' : 'text-purple-400'}>
                          {isEntree ? '+' : isSortie ? '-' : ''}
                          {Number(m.montant).toLocaleString()} XAF
                        </span>
                      </td>

                      <td className="px-5 py-3 text-right font-bold text-gray-300 whitespace-nowrap">
                        {Number(m.solde_apres).toLocaleString()} XAF
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap text-gray-400">
                        {m.auteur_nom || '—'}
                      </td>

                      <td className="px-5 py-3 text-center whitespace-nowrap">
                        {!isReadOnly && !isAnnule && !isContre && (
                          <button
                            onClick={() => handleAnnuler(m)}
                            title="Annuler par contre-passation comptable"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <i className="bi bi-arrow-counterclockwise text-sm" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL APPROVISIONNEMENT ── */}
      {showApproModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowApproModal(false)} />
            <div className={`relative ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-2xl shadow-2xl w-full max-w-md z-10 border overflow-hidden`}>
              <div className="px-6 py-4 bg-green-600 text-white flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <i className="bi bi-wallet" /> Approvisionnement Caisse
                </h3>
                <button onClick={() => setShowApproModal(false)}><i className="bi bi-x-lg" /></button>
              </div>
              <form onSubmit={handleApprovisionner} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Montant à verser (XAF) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="Ex: 50000"
                    value={approForm.montant}
                    onChange={(e) => setApproForm({ ...approForm, montant: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Libellé de l'approvisionnement *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Approvisionnement hebdo carburant / pièces"
                    value={approForm.libelle}
                    onChange={(e) => setApproForm({ ...approForm, libelle: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Détails / Motif</label>
                  <textarea
                    rows={2}
                    placeholder="Remarques..."
                    value={approForm.article}
                    onChange={(e) => setApproForm({ ...approForm, article: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Justificatif / Reçu (PDF, photo)</label>
                  <input
                    type="file"
                    onChange={(e) => setApproFile(e.target.files[0] || null)}
                    className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-700 file:text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/20">
                  <button
                    type="button"
                    onClick={() => setShowApproModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-700 text-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5"
                  >
                    {modalLoading && <i className="bi bi-arrow-repeat animate-spin" />}
                    Valider le versement
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

export default CaisseTab;
