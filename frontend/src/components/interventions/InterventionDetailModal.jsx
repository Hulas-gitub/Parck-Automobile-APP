import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  updateStatutIntervention,
  getApiError,
  getFileUrl,
  VEHICULE_STATUTS,
  todayLocal,
  formatDateFR,
  formatDuree,
} from '../../api/Admin-Axios/Intervention-axios';
import { getSwalConfig, showSuccess } from '../../utils/walConfig';
import { getModalStyles } from '../../utils/uniformStyles';

const STATUT_LIBELLES = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

const STATUT_ICONES = {
  planifiee: 'bi-calendar-check',
  en_cours: 'bi-gear-fill',
  terminee: 'bi-check-circle-fill',
  annulee: 'bi-x-circle-fill',
};

const PRIORITES = { faible: 'Faible', normale: 'Normale', haute: 'Haute', urgente: 'Urgente' };
const MAINTENANCES = { corrective: 'Corrective', preventive: 'Préventive' };
const PAIEMENTS = { en_attente: 'En attente', paye: 'Payé', partiel: 'Partiel' };
const RESULTATS = { en_attente: 'En attente', en_cours: 'En cours', resolu: 'Résolu', partiel: 'Partiel', echec: 'Échec' };

const humanize = (v) => {
  if (!v) return '—';
  const s = String(v).replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const InterventionDetailModal = ({
  isOpen,
  onClose,
  intervention,
  onRefresh,
  onEdit,
  darkMode,
  theme,
  isReadOnly = false,
}) => {
  const [closing, setClosing] = useState(false);

  // Verrouillage du scroll + Échap
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !Swal.isVisible()) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !intervention) return null;

  // ── Styles uniformes
  const { muted, cardClass, innerRow, divider, smallLabel, accent, gradient } = getModalStyles(darkMode, theme);

  const handleCloturer = async () => {
    const optionsStatut = VEHICULE_STATUTS.map((s) => `<option value="${s.value}">${s.label}</option>`).join('');
    const { value: formValues } = await Swal.fire({
      ...getSwalConfig(darkMode, theme),
      title: 'Clôturer cette intervention',
      html: `
        <div style="text-align: left; font-size: 13px;">
          <label style="display:block; margin-bottom: 4px; font-weight: bold;">Date de sortie (${intervention.nature_intervention === 'externe' ? 'garage' : 'atelier'}) :</label>
          <input id="swal-date" type="date" class="swal2-input" style="width: 100%; margin: 0 0 15px 0;" value="${todayLocal()}" />
          <label style="display:block; margin-bottom: 4px; font-weight: bold;">Résultat de l'intervention :</label>
          <select id="swal-resultat" class="swal2-input" style="width: 100%; margin: 0 0 15px 0;">
            <option value="resolu">Résolu avec succès</option>
            <option value="partiel">Résolution partielle</option>
            <option value="echec">Échec / Non résolu</option>
          </select>
          <label style="display:block; margin-bottom: 4px; font-weight: bold;">Statut du véhicule :</label>
          <select id="swal-statut-vehicule" class="swal2-input" style="width: 100%; margin: 0 0 15px 0;">
            <option value="">Automatique (Disponible)</option>
            ${optionsStatut}
          </select>
          <label style="display:block; margin-bottom: 4px; font-weight: bold;">Notes de clôture / Observations :</label>
          <textarea id="swal-notes" class="swal2-textarea" style="width: 100%; margin: 0;" placeholder="Travaux terminés, véhicule vérifié..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmer la clôture',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const date = document.getElementById('swal-date').value;
        const entree = String(intervention.date_entree_garage || intervention.date_debut || '').slice(0, 10);
        if (!date) {
          Swal.showValidationMessage('La date de sortie est obligatoire.');
          return false;
        }
        if (entree && date < entree) {
          Swal.showValidationMessage("La date de sortie doit être postérieure ou égale à la date d'entrée.");
          return false;
        }
        return {
          date_sortie_garage: date,
          resultat: document.getElementById('swal-resultat').value,
          statut_vehicule: document.getElementById('swal-statut-vehicule').value,
          notes: document.getElementById('swal-notes').value,
        };
      },
    });

    if (!formValues) return;

    setClosing(true);
    try {
      const payload = {
        resultat: formValues.resultat,
        notes: formValues.notes,
        date_sortie_garage: formValues.date_sortie_garage,
      };
      if (formValues.statut_vehicule) payload.statut_vehicule = formValues.statut_vehicule;

      const res = await updateStatutIntervention(intervention.id, 'terminee', payload);
      onRefresh?.();
      onClose();
      showSuccess(darkMode, theme, 'Intervention terminée !', res.message || 'Le véhicule et ses KPI ont été mis à jour.');
    } catch (err) {
      Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'error',
        title: 'Erreur',
        text: getApiError(err, 'Impossible de terminer cette intervention.'),
      });
    } finally {
      setClosing(false);
    }
  };

  const title = (icon, text, right = null) => (
    <div className="flex items-center justify-between gap-2 mb-3">
      <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: accent }}>
        <i className={`bi ${icon}`} /> {text}
      </h4>
      {right}
    </div>
  );
  const row = (label, value, strong = false) => (
    <div className="flex justify-between gap-3">
      <span className={muted}>{label}</span>
      <span className={`text-right ${strong ? 'font-bold' : 'font-semibold'}`}>{value}</span>
    </div>
  );

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');
  const achatsCaisseList = intervention.achats_caisse || [];
  const demandesList = intervention.demandes || [];
  const outilsList = intervention.outils || [];
  const intervenantsList = intervention.intervenants?.length
    ? intervention.intervenants
    : intervention.intervenant_nom
      ? [intervention.intervenant_nom]
      : [];
  const estExterne = intervention.nature_intervention === 'externe';
  const lieu = estExterne ? 'garage' : 'atelier';

  // Coût total fourni par le serveur (main d'œuvre + pièces) : évite de compter deux fois la part prestataire
  const coutTotal =
    intervention.cout_total ?? Number(intervention.cout_main_oeuvre || 0) + Number(intervention.cout_pieces || 0);
  const totalAchatsCaisse = achatsCaisseList.reduce((a, x) => a + Number(x.montant || 0), 0);

  const entree = intervention.date_entree_garage || intervention.date_debut;
  const sortie = intervention.date_sortie_garage || intervention.date_fin;
  const dureeTexte = intervention.duree_texte || formatDuree(entree, sortie).texte;
  const factureUrl = getFileUrl(intervention.facture_url);
  const reference = intervention.reference_intervention || `INT-${String(intervention.id).padStart(5, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60" role="dialog" aria-modal="true">
      <div
        className={`relative flex flex-col w-full max-w-[1400px] rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}
        style={{ height: 'calc(100vh - 2rem)', maxHeight: 'calc(100vh - 1rem)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between gap-3 text-white shrink-0" style={gradient}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <i className="bi bi-file-earmark-text text-xl" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">
                {reference} — {intervention.vehicule_immatriculation}
              </h3>
              <p className="text-xs text-white/85 truncate">
                {intervention.vehicule_marque} {intervention.vehicule_modele} • {estExterne ? 'Garage externe' : 'Atelier interne'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 bg-white/20 border border-white/30">
              <i className={`bi ${STATUT_ICONES[intervention.statut] || 'bi-circle'}`} />
              {STATUT_LIBELLES[intervention.statut] || intervention.statut}
            </span>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/15 transition-colors" title="Fermer (Échap)">
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4">
          {/* Infos clés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cardClass}>
              <span className={smallLabel}>Véhicule</span>
              <span className="font-extrabold text-xl" style={{ color: accent }}>{intervention.vehicule_immatriculation}</span>
              <p className={`text-sm ${muted}`}>{intervention.vehicule_marque} {intervention.vehicule_modele}</p>
              {intervention.vehicule_statut && (
                <p className={`text-xs mt-1 ${muted}`}>Statut : <span className="font-semibold">{intervention.vehicule_statut}</span></p>
              )}
            </div>

            <div className={cardClass}>
              <span className={smallLabel}>{estExterne ? 'Prestataire / garage' : 'Intervenant(s) atelier'}</span>
              {intervenantsList.length === 0 ? (
                <span className="font-bold text-base">Non spécifié</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {intervenantsList.map((n) => (
                    <span key={n} className={`px-2.5 py-1 rounded-full text-sm font-bold border ${innerRow}`} style={{ color: accent, borderColor: accent }}>
                      {n}
                    </span>
                  ))}
                </div>
              )}
              {intervention.intervenant_telephone && <p className={`text-sm mt-1 ${muted}`}>{intervention.intervenant_telephone}</p>}
            </div>

            <div className={cardClass}>
              <span className={smallLabel}>Kilométrage relevé</span>
              <span className="font-extrabold text-xl">
                {intervention.km_au_moment_intervention ? `${Number(intervention.km_au_moment_intervention).toLocaleString('fr-FR')} km` : '—'}
              </span>
              <p className={`text-sm ${muted}`}>Lors de la réparation</p>
            </div>

            <div className={cardClass}>
              <span className={smallLabel}>Coût total</span>
              <span className="font-black text-xl" style={{ color: accent }}>{fmt(coutTotal)} FCFA</span>
              <p className={`text-sm ${muted}`}>{estExterne ? "Pièces + main d'œuvre prestataire" : 'Pièces (caisse + stock)'}</p>
            </div>
          </div>

          {/* Demande(s) traitée(s) : anomalie complète + informations */}
          <div className={cardClass}>
            {title('bi-card-checklist', "Demande(s) d'intervention traitée(s)")}
            {demandesList.length === 0 ? (
              <div className={`text-sm ${muted}`}>
                {intervention.matricule_demande ? (
                  <span className="font-bold" style={{ color: accent }}>Demande N° {intervention.matricule_demande}</span>
                ) : (
                  'Aucune demande spécifique enregistrée.'
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {demandesList.map((dem) => (
                  <div key={dem.id} className={`rounded-xl border ${innerRow}`} style={{ borderLeft: `4px solid ${accent}` }}>
                    <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: accent }}>
                        <i className="bi bi-exclamation-diamond me-1.5" />Anomalie constatée
                      </span>
                      <span className={`text-xs font-bold ${muted}`}>{dem.matricule_demande}</span>
                      {dem.est_principale ? <span className={`text-[11px] px-2 py-0.5 rounded border ${divider} ${muted}`}>Principale</span> : null}
                    </div>
                    <p className="px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                      {dem.anomalie_constatee || <span className={`italic ${muted}`}>Aucune anomalie renseignée.</span>}
                    </p>
                    <div className={`px-4 py-3 border-t grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-2 text-sm ${divider}`}>
                      {[
                        ['N° de demande', dem.matricule_demande || '—'],
                        ['Demandeur', dem.demandeur_nom || 'Non spécifié'],
                        ['Priorité', PRIORITES[dem.priorite] || humanize(dem.priorite)],
                        ['Type de maintenance', MAINTENANCES[dem.type_maintenance] || humanize(dem.type_maintenance)],
                        ["Type d'intervention", humanize(dem.type_intervention)],
                        ['Date de la demande', dem.date_demande ? formatDateFR(dem.date_demande) : '—'],
                      ].map(([l, v]) => (
                        <div key={l} className="min-w-0">
                          <span className={`block text-[11px] uppercase font-bold ${muted}`}>{l}</span>
                          <span className="font-semibold break-words">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pièces caisse + Outils */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cardClass}>
              {title(
                'bi-wallet2',
                'Pièces achetées (caisse)',
                <span className="text-sm font-black" style={{ color: accent }}>{fmt(totalAchatsCaisse)} FCFA</span>
              )}
              {achatsCaisseList.length === 0 ? (
                <p className={`text-sm italic ${muted}`}>Aucun achat de pièce enregistré sur la caisse.</p>
              ) : (
                <div className="space-y-2">
                  {achatsCaisseList.map((ac, idx) => (
                    <div key={ac.id ?? idx} className={`px-3.5 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm ${innerRow}`}>
                      <div className="min-w-0">
                        <span className="font-bold break-words">{ac.article || ac.libelle}</span>
                        {ac.fournisseur_nom && <span className={muted}> ({ac.fournisseur_nom})</span>}
                      </div>
                      <span className="font-extrabold whitespace-nowrap">{fmt(ac.montant)} FCFA</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={cardClass}>
              {title('bi-tools', `Outils utilisés (${outilsList.length})`)}
              {outilsList.length === 0 ? (
                <p className={`text-sm italic ${muted}`}>Aucun outil du stock atelier affecté à cette intervention.</p>
              ) : (
                <div className="space-y-2">
                  {outilsList.map((tool, idx) => (
                    <div key={tool.id ?? idx} className={`px-3.5 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-sm ${innerRow}`}>
                      <div className="min-w-0">
                        <div className="font-bold break-words">{tool.outil_nom}</div>
                        {tool.notes && <div className={`text-xs ${muted}`}>{tool.notes}</div>}
                      </div>
                      <span className="font-extrabold whitespace-nowrap">Qté : {tool.quantite || 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dates + Détail financier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cardClass}>
              {title('bi-calendar-event', 'Dates & durée')}
              <div className="space-y-2 text-sm">
                {row(`Entrée (${lieu}) :`, formatDateFR(entree))}
                {row(`Sortie (${lieu}) :`, sortie ? formatDateFR(sortie) : 'En cours')}
                {estExterne && row('N° devis / facture :', intervention.numero_devis_facture || '—', true)}
                {row('Résultat :', RESULTATS[intervention.resultat] || humanize(intervention.resultat))}
                {dureeTexte && (
                  <div className={`pt-2 border-t ${divider}`}>{row('Durée en réparation :', dureeTexte, true)}</div>
                )}
              </div>
            </div>

            <div className={cardClass}>
              {title('bi-cash-stack', 'Détail financier')}
              <div className="space-y-2 text-sm">
                {row('Pièces achetées (caisse) :', `${fmt(totalAchatsCaisse)} FCFA`)}
                {estExterne && (
                  <>
                    {row("Main d'œuvre prestataire :", `${fmt(intervention.montant_main_oeuvre_prestataire)} FCFA`)}
                    {row('Garantie :', intervention.garantie_jours ? `${intervention.garantie_jours} jours` : '—')}
                    {row('Paiement :', PAIEMENTS[intervention.statut_paiement] || intervention.statut_paiement || '—')}
                    <div className="flex justify-between gap-3 items-center">
                      <span className={muted}>Facture :</span>
                      {factureUrl ? (
                        <a href={factureUrl} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline inline-flex items-center gap-1" style={{ color: accent }}>
                          <i className="bi bi-file-earmark-arrow-down" /> {intervention.facture?.nom || 'Voir la facture'}
                        </a>
                      ) : (
                        <span className="font-semibold">Aucune facture jointe</span>
                      )}
                    </div>
                  </>
                )}
                <div className={`pt-2 border-t ${divider} flex justify-between font-bold text-base`} style={{ color: accent }}>
                  <span>Total général :</span>
                  <span>{fmt(coutTotal)} FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Travaux et notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={cardClass}>
              <span className={smallLabel}>Travaux effectués</span>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {intervention.travaux_effectues || intervention.diagnostic || 'Aucun travail renseigné.'}
              </p>
            </div>
            <div className={cardClass}>
              <span className={smallLabel}>Observations & notes</span>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {intervention.notes || 'Aucune observation supplémentaire.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t shrink-0 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
          <div className={`text-sm ${muted}`}>
            {reference} • Résultat : <strong className="uppercase">{RESULTATS[intervention.resultat] || intervention.resultat || 'en cours'}</strong>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && onEdit && intervention.can_edit && (
              <button
                type="button"
                onClick={() => onEdit(intervention)}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow flex items-center gap-1.5 hover:opacity-90"
                style={gradient}
              >
                <i className="bi bi-pencil-square" /> Modifier
              </button>
            )}
            {!isReadOnly && intervention.statut === 'en_cours' && (
              <button
                type="button"
                onClick={handleCloturer}
                disabled={closing}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold border flex items-center gap-1.5 transition-colors disabled:opacity-60 ${darkMode ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                style={{ color: accent }}
              >
                <i className="bi bi-check2-circle" /> Clôturer la réparation
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterventionDetailModal;