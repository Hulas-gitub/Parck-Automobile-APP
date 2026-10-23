import React, { useState, useEffect, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  getInterventionReferences,
  createIntervention,
  updateIntervention,
  getApiError,
  VEHICULE_STATUTS,
  todayLocal,
  toInputDate,
  formatDuree,
  formatDateFR,
} from '../../api/Admin-Axios/Intervention-axios';
import { getSwalConfig, showSuccess } from '../../utils/walConfig';
import { getFormStyles, getModalStyles } from '../../utils/uniformStyles';

const FACTURE_MAX = 5 * 1024 * 1024; // 5 Mo (identique au backend)
const FACTURE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const PRIORITES = { faible: 'Faible', normale: 'Normale', haute: 'Haute', urgente: 'Urgente' };
const MAINTENANCES = { corrective: 'Corrective', preventive: 'Préventive' };

const humanize = (v) => {
  if (!v) return '—';
  const s = String(v).replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');

// ─────────────────────────────────────────────────────────────
// ÉTAT D'UNE ÉTAPE (= une demande à saisir)
// ─────────────────────────────────────────────────────────────
const newPiece = () => ({ id: Date.now() + Math.random(), nom: '', quantite: 1, prix_unitaire: '' });
const newOutil = () => ({ id: Date.now() + Math.random(), outil_id: '', quantite: 1, notes: '' });

const emptyForm = (over = {}) => ({
  nature: 'interne',
  typeIntervention: '',
  dateEntree: todayLocal(),
  dateSortie: '',
  resultat: 'en_cours',
  travaux: '',
  notes: '',
  // Externe
  nomPrestataire: '',
  fonctionPrestataire: '',
  numDevisFacture: '',
  coutMOPrestataire: '',
  garantieJours: '',
  statutPaiement: 'en_attente',
  ...over,
});

const emptyStep = (over = {}) => ({
  form: emptyForm(),
  intervenants: [],
  intervenantInput: '',
  facture: null,
  pieces: [newPiece()],
  outils: [],
  touched: false, // l'utilisateur a modifié quelque chose
  saved: null, // { id, reference } une fois enregistrée
  error: null, // dernier message d'erreur serveur
  ...over,
});

const normDemande = (d) => ({
  id: d.id,
  matricule: d.matricule_demande,
  anomalie: d.anomalie_constatee,
  priorite: d.priorite,
  typeMaintenance: d.type_maintenance,
  typeIntervention: d.type_intervention,
  date: d.date_demande,
  demandeur: d.demandeur_nom,
});

const caisseTotal = (st) =>
  st.pieces.reduce((acc, p) => acc + (parseFloat(p.quantite) || 0) * (parseFloat(p.prix_unitaire) || 0), 0);

const stepErrors = (st) => {
  const errs = [];
  const f = st.form;
  if (f.nature === 'interne') {
    if (!st.intervenants.length && !st.intervenantInput.trim()) {
      errs.push('Saisissez au moins un mécanicien / intervenant interne.');
    }
  } else if (!f.nomPrestataire.trim()) {
    errs.push('Renseignez le nom du prestataire / garage externe.');
  }
  if (!f.dateEntree) errs.push("La date d'entrée est obligatoire.");
  if (f.dateSortie && f.dateEntree && f.dateSortie < f.dateEntree) {
    errs.push("La date de sortie doit être postérieure ou égale à la date d'entrée.");
  }
  return errs;
};

/**
 * Modale de saisie ET de modification d'une intervention (grande taille, corps scrollable).
 *  - intervention = null  → création : une demande = une étape ; un seul bouton enregistre tout
 *  - intervention = {...} → modification (PUT /admin/interventions/{id})
 */
const InterventionCreateModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialDemandeId = null,
  intervention = null,
  darkMode,
  theme,
}) => {
  const isEdit = Boolean(intervention);

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [refs, setRefs] = useState({
    demandes: [],
    intervenants_internes: [],
    intervenants_externes: [],
    vehicules: [],
    outils: [],
    solde_caisse: 0,
    statuts_vehicule: VEHICULE_STATUTS,
  });

  // ── Partagé par toutes les demandes du véhicule
  const [demandeSearch, setDemandeSearch] = useState('');
  const [selectedDemandeId, setSelectedDemandeId] = useState('');
  const [selectedImmat, setSelectedImmat] = useState('');
  const [vehiculeInfo, setVehiculeInfo] = useState(null);
  const [km, setKm] = useState('');
  const [statutVehicule, setStatutVehicule] = useState('');

  // ── Une étape par demande (clé = id de la demande, ou 'edit')
  const [steps, setSteps] = useState({});
  const [order, setOrder] = useState([]);
  const [activeKey, setActiveKey] = useState(null);

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);

  const statutApplique = useRef(false); // le statut véhicule n'est envoyé qu'une fois
  const fileRefs = useRef({});
  const bodyRef = useRef(null);

  // ── Réinitialisation / pré-remplissage à l'ouverture
  useEffect(() => {
    if (!isOpen) return;
    setDemandeSearch('');
    setSaving(false);
    setProgress(null);
    statutApplique.current = false;

    if (isEdit) {
      const it = intervention;
      const ext = it.nature_intervention === 'externe';
      setSteps({
        edit: emptyStep({
          form: emptyForm({
            nature: it.nature_intervention || 'interne',
            typeIntervention: it.type_intervention || '',
            dateEntree: toInputDate(it.date_entree_garage || it.date_debut) || todayLocal(),
            dateSortie: toInputDate(it.date_sortie_garage || it.date_fin),
            resultat: it.resultat || 'en_cours',
            travaux: it.travaux_effectues || it.diagnostic || '',
            notes: it.notes || '',
            nomPrestataire: ext ? it.intervenant_nom || '' : '',
            numDevisFacture: it.numero_devis_facture || '',
            coutMOPrestataire: it.montant_main_oeuvre_prestataire ?? '',
            garantieJours: it.garantie_jours ?? '',
            statutPaiement: it.statut_paiement || 'en_attente',
          }),
          intervenants: ext ? [] : it.intervenants || [],
          outils: (it.outils || []).map((o) => ({
            id: `o-${o.id}`,
            outil_id: String(o.outil_id),
            quantite: o.quantite || 1,
            notes: o.notes || '',
          })),
        }),
      });
      setOrder(['edit']);
      setActiveKey('edit');
      setSelectedImmat(it.vehicule_immatriculation || '');
      setSelectedDemandeId(it.demande_id ? String(it.demande_id) : '');
      setKm(it.km_au_moment_intervention ? String(it.km_au_moment_intervention) : '');
      setStatutVehicule('');
      setVehiculeInfo({
        immatriculation: it.vehicule_immatriculation,
        marque: it.vehicule_marque || '—',
        modele: it.vehicule_modele || '—',
        statut: it.vehicule_statut || '—',
      });
    } else {
      setSteps({});
      setOrder([]);
      setActiveKey(null);
      setSelectedImmat('');
      setSelectedDemandeId('');
      setVehiculeInfo(null);
      setKm('');
      setStatutVehicule('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, intervention?.id]);

  // ── Remonter en haut du formulaire quand on change d'étape
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 });
  }, [activeKey]);

  // ── Références
  useEffect(() => {
    if (!isOpen) return;
    setLoadingRefs(true);
    getInterventionReferences()
      .then((res) => {
        const d = res.data || {};
        const all = Array.isArray(d.intervenants) ? d.intervenants : [];
        setRefs({
          demandes: Array.isArray(d.demandes) ? d.demandes : [],
          intervenants_internes: Array.isArray(d.intervenants_internes)
            ? d.intervenants_internes
            : all.filter((i) => !i.est_externe || i.type_code === 'mecanicien_interne'),
          intervenants_externes: Array.isArray(d.intervenants_externes)
            ? d.intervenants_externes
            : all.filter((i) => i.est_externe || i.type_code === 'prestataire_externe'),
          vehicules: Array.isArray(d.vehicules) ? d.vehicules : [],
          outils: Array.isArray(d.outils) ? d.outils : [],
          solde_caisse: Number(d.solde_caisse || 0),
          statuts_vehicule:
            Array.isArray(d.statuts_vehicule) && d.statuts_vehicule.length ? d.statuts_vehicule : VEHICULE_STATUTS,
        });
      })
      .catch((err) => {
        Swal.fire({
          ...getSwalConfig(darkMode, theme),
          icon: 'error',
          title: 'Erreur',
          text: getApiError(err, 'Impossible de charger les données de référence.'),
        });
      })
      .finally(() => setLoadingRefs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Demande(s) → étapes
  const filteredDemandes = useMemo(() => {
    if (!demandeSearch.trim()) return refs.demandes;
    const term = demandeSearch.toLowerCase().trim();
    return refs.demandes.filter(
      (d) =>
        (d.matricule_demande && d.matricule_demande.toLowerCase().includes(term)) ||
        (d.vehicule_immatriculation && d.vehicule_immatriculation.toLowerCase().includes(term)) ||
        (d.anomalie_constatee && d.anomalie_constatee.toLowerCase().includes(term)) ||
        (d.type_intervention && d.type_intervention.toLowerCase().includes(term))
    );
  }, [refs.demandes, demandeSearch]);

  const demandeParCle = (key) => {
    const d = refs.demandes.find((x) => String(x.id) === String(key));
    return d ? normDemande(d) : null;
  };

  const handleSelectDemande = (idStr) => {
    setSelectedDemandeId(idStr);

    if (!idStr) {
      setSteps({});
      setOrder([]);
      setActiveKey(null);
      setSelectedImmat('');
      setVehiculeInfo(null);
      setKm('');
      setStatutVehicule('');
      return;
    }

    const dId = parseInt(idStr, 10);
    const target = refs.demandes.find((x) => x.id === dId);
    if (!target) return;

    const immat = target.vehicule_immatriculation || '';
    const sameVehicle = immat === selectedImmat && order.length > 0;

    // Première demande choisie + toutes les autres demandes ouvertes du même véhicule
    const memeVehicule = refs.demandes.filter((d) => d.vehicule_immatriculation === immat);
    const autres = memeVehicule
      .filter((d) => d.id !== dId)
      .sort((a, b) => String(a.date_demande || '').localeCompare(String(b.date_demande || '')));
    const ordonnees = [target, ...autres];

    setOrder(ordonnees.map((d) => String(d.id)));
    setActiveKey(String(dId));
    setSteps((prev) => {
      const next = sameVehicle ? { ...prev } : {};
      ordonnees.forEach((d) => {
        const k = String(d.id);
        if (!next[k]) {
          next[k] = emptyStep({
            form: emptyForm({
              nature: d.nature_intervention || 'interne',
              typeIntervention: d.type_intervention || '',
            }),
          });
        }
      });
      return next;
    });

    if (!sameVehicle) {
      const vMatch = refs.vehicules.find((v) => v.immatriculation === immat);
      setSelectedImmat(immat);
      setVehiculeInfo({
        immatriculation: immat,
        marque: target.vehicule_marque || vMatch?.marque || '—',
        modele: target.vehicule_modele || vMatch?.modele || '—',
        statut: target.vehicule_statut || vMatch?.statut || '—',
      });
      const kmDefaut = target.demande_kilometrage || target.vehicule_kilometrage || vMatch?.kilometrage;
      setKm(kmDefaut ? String(kmDefaut) : '');
      setStatutVehicule('');
      statutApplique.current = false;
    }
  };

  // Auto-sélection si initialDemandeId fourni (création uniquement)
  useEffect(() => {
    if (isOpen && !isEdit && initialDemandeId && !selectedDemandeId && refs.demandes.length > 0) {
      handleSelectDemande(String(initialDemandeId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit, initialDemandeId, refs.demandes]);

  // ── Mise à jour d'une étape
  const patchStep = (key, patch, touch = true) =>
    setSteps((prev) => {
      const cur = prev[key];
      if (!cur) return prev;
      const p = typeof patch === 'function' ? patch(cur) : patch;
      return { ...prev, [key]: { ...cur, ...p, ...(touch ? { touched: true } : {}) } };
    });

  const setF = (key, field, val) =>
    patchStep(key, (st) => {
      const form = { ...st.form, [field]: val };
      // Une date de sortie = intervention terminée : « en cours » n'est plus un résultat cohérent
      if (field === 'dateSortie' && val && form.resultat === 'en_cours') form.resultat = 'resolu';
      return { form };
    });

  const addIntervenant = (key, raw) =>
    patchStep(key, (st) => {
      const nom = (raw || '').trim().replace(/,$/, '').trim();
      if (!nom) return { intervenantInput: '' };
      const existe = st.intervenants.some((n) => n.toLowerCase() === nom.toLowerCase());
      return { intervenants: existe ? st.intervenants : [...st.intervenants, nom], intervenantInput: '' };
    });
  const removeIntervenant = (key, nom) =>
    patchStep(key, (st) => ({ intervenants: st.intervenants.filter((n) => n !== nom) }));

  const updatePiece = (key, id, field, val) =>
    patchStep(key, (st) => ({ pieces: st.pieces.map((p) => (p.id === id ? { ...p, [field]: val } : p)) }));
  const addPiece = (key) => patchStep(key, (st) => ({ pieces: [...st.pieces, newPiece()] }));
  const removePiece = (key, id) =>
    patchStep(key, (st) => {
      const f = st.pieces.filter((p) => p.id !== id);
      return { pieces: f.length ? f : [newPiece()] };
    });

  const addOutil = (key) => patchStep(key, (st) => ({ outils: [...st.outils, newOutil()] }));
  const updateOutil = (key, id, field, val) =>
    patchStep(key, (st) => ({ outils: st.outils.map((o) => (o.id === id ? { ...o, [field]: val } : o)) }));
  const removeOutil = (key, id) => patchStep(key, (st) => ({ outils: st.outils.filter((o) => o.id !== id) }));

  const handleFacture = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!FACTURE_TYPES.includes(file.type)) {
      Swal.fire({ ...getSwalConfig(darkMode, theme), icon: 'warning', title: 'Format invalide', text: 'La facture doit être au format PDF, JPG ou PNG.' });
      e.target.value = '';
      return;
    }
    if (file.size > FACTURE_MAX) {
      Swal.fire({ ...getSwalConfig(darkMode, theme), icon: 'warning', title: 'Fichier trop lourd', text: 'La facture ne doit pas dépasser 5 Mo.' });
      e.target.value = '';
      return;
    }
    patchStep(key, { facture: file });
  };
  const removeFacture = (key) => {
    patchStep(key, { facture: null });
    if (fileRefs.current[key]) fileRefs.current[key].value = '';
  };

  // ── Statut d'une étape : saved | ok | incomplete | todo
  const stepStatus = (key) => {
    const st = steps[key];
    if (!st) return 'todo';
    if (st.saved) return 'saved';
    if (stepErrors(st).length === 0) return 'ok';
    return st.touched ? 'incomplete' : 'todo';
  };

  const pendingKeys = order.filter((k) => steps[k] && !steps[k].saved);
  const readyKeys = pendingKeys.filter((k) => stepErrors(steps[k]).length === 0);

  // ── Totaux
  const totalOf = (st) => {
    const f = st.form;
    const mo = f.nature === 'externe' ? parseFloat(f.coutMOPrestataire || 0) || 0 : 0;
    if (isEdit) {
      const base = Number(intervention.cout_pieces || 0);
      return base + mo;
    }
    return caisseTotal(st) + mo;
  };

  const grandTotal = isEdit
    ? steps.edit
      ? totalOf(steps.edit)
      : 0
    : readyKeys.reduce((a, k) => a + totalOf(steps[k]), 0);

  const totalCaisseALancer = readyKeys.reduce((a, k) => a + caisseTotal(steps[k]), 0);
  const soldeInsuffisant = !isEdit && totalCaisseALancer > refs.solde_caisse;

  const warn = (title, text) => Swal.fire({ ...getSwalConfig(darkMode, theme), icon: 'warning', title, text });

  // ── Fermeture (avec confirmation s'il reste de la saisie non enregistrée)
  const requestClose = async () => {
    if (saving) return;
    const dirty = !isEdit && order.some((k) => steps[k]?.touched && !steps[k]?.saved);
    if (dirty) {
      const r = await Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'question',
        title: 'Abandonner la saisie ?',
        text: 'Les informations saisies et non enregistrées seront perdues.',
        showCancelButton: true,
        confirmButtonText: 'Oui, fermer',
        cancelButtonText: 'Continuer la saisie',
      });
      if (!r.isConfirmed) return;
    }
    onClose();
  };

  // ── Verrouillage du scroll de la page + Échap
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !Swal.isVisible()) requestCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  // ── Construction du payload d'une étape
  const buildPayload = (key, { withStatutVehicule }) => {
    const st = steps[key];
    const f = st.form;
    const nat = f.nature;

    const finalIntervenants = [...st.intervenants];
    const pending = st.intervenantInput.trim();
    if (pending && !finalIntervenants.some((n) => n.toLowerCase() === pending.toLowerCase())) {
      finalIntervenants.push(pending);
    }

    const outilsPayload = st.outils
      .filter((o) => o.outil_id !== '')
      .map((o) => ({
        outil_id: parseInt(o.outil_id, 10),
        quantite: Math.max(1, parseInt(o.quantite, 10) || 1),
        notes: o.notes?.trim() || null,
      }));

    const payload = {
      type_intervention: f.typeIntervention || 'Réparation mécanique',
      diagnostic: f.travaux, // « Travaux effectués » = colonne diagnostic
      notes: f.notes,
      resultat: f.resultat,
      km_au_moment_intervention: km ? parseInt(km, 10) : null,
      date_entree_garage: f.dateEntree, // Y-m-d, sans heure
      date_sortie_garage: f.dateSortie || null,
      outils_ids: outilsPayload,
    };
    if (withStatutVehicule && statutVehicule) payload.statut_vehicule = statutVehicule;

    if (isEdit) {
      if (f.dateSortie && intervention.statut === 'en_cours') payload.statut = 'terminee';
      // Un envoi multipart ne transporte pas une liste vide : on signale « plus aucun outil »
      if (outilsPayload.length === 0) payload.outils_vide = true;
    }

    if (nat === 'interne') {
      payload.intervenants = finalIntervenants.map((nom) => ({ nom }));
    } else {
      payload.intervenants = [{ nom: f.nomPrestataire.trim(), specialisation: f.fonctionPrestataire.trim() }];
      payload.numero_devis_facture = f.numDevisFacture || null;
      payload.montant_main_oeuvre_prestataire = parseFloat(f.coutMOPrestataire || 0);
      payload.garantie_jours = f.garantieJours ? parseInt(f.garantieJours, 10) : null;
      payload.statut_paiement = f.statutPaiement;
      if (st.facture) payload.facture = st.facture;
    }

    if (!isEdit) {
      payload.vehicule_immatriculation = selectedImmat;
      payload.nature_intervention = nat;
      payload.demandes_ids = [parseInt(key, 10)];
      payload.pieces_achetees = st.pieces
        .filter((p) => p.nom.trim() !== '')
        .map((p) => {
          const q = Math.max(0.1, parseFloat(p.quantite) || 1);
          const pu = Math.max(0, parseFloat(p.prix_unitaire) || 0);
          return { nom: p.nom.trim(), article: p.nom.trim(), quantite: q, prix_unitaire: pu, montant: q * pu };
        });
    }
    return payload;
  };

  // ── Soumission : modification
  const submitEdit = async () => {
    const errs = stepErrors(steps.edit);
    if (errs.length) return warn('Informations manquantes', errs[0]);

    setSaving(true);
    try {
      const res = await updateIntervention(intervention.id, buildPayload('edit', { withStatutVehicule: true }));
      onSuccess?.();
      onClose();
      showSuccess(darkMode, theme, 'Intervention mise à jour !', res.message || 'Opération réalisée avec succès.');
    } catch (err) {
      Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'error',
        title: 'Erreur',
        text: getApiError(err, "Impossible d'enregistrer l'intervention."),
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Soumission : création (une intervention par demande saisie)
  const submitCreate = async () => {
    if (!selectedImmat || order.length === 0) {
      return warn('Demande requise', 'Veuillez sélectionner la demande d’intervention à traiter.');
    }
    if (pendingKeys.length === 0) {
      return warn('Rien à enregistrer', 'Toutes les demandes ont déjà été enregistrées.');
    }

    const notReady = pendingKeys.filter((k) => !readyKeys.includes(k));

    if (readyKeys.length === 0) {
      const k = notReady.find((x) => steps[x].touched) || notReady[0];
      setActiveKey(k);
      return warn('Informations manquantes', stepErrors(steps[k])[0]);
    }

    if (totalCaisseALancer > refs.solde_caisse) {
      return warn(
        'Solde de caisse insuffisant',
        `Achats à enregistrer : ${fmt(totalCaisseALancer)} FCFA — solde disponible : ${fmt(refs.solde_caisse)} FCFA. Approvisionnez la caisse ou réduisez les achats.`
      );
    }

    if (notReady.length > 0) {
      const noms = notReady.map((k) => demandeParCle(k)?.matricule || `#${k}`).join(', ');
      const r = await Swal.fire({
        ...getSwalConfig(darkMode, theme),
        icon: 'question',
        title: `${notReady.length} demande(s) non saisie(s)`,
        text: `${noms} ne seront pas enregistrées et resteront ouvertes. Enregistrer les ${readyKeys.length} autre(s) ?`,
        showCancelButton: true,
        confirmButtonText: 'Oui, enregistrer',
        cancelButtonText: 'Revenir au formulaire',
      });
      if (!r.isConfirmed) return;
    }

    setSaving(true);
    const okList = [];
    const koList = [];

    for (let i = 0; i < readyKeys.length; i += 1) {
      const k = readyKeys[i];
      setProgress({ done: i, total: readyKeys.length });
      // Le statut du véhicule est réglé une seule fois, avec la dernière demande enregistrée
      const sendStatut = i === readyKeys.length - 1 && !statutApplique.current;
      try {
        const res = await createIntervention(buildPayload(k, { withStatutVehicule: sendStatut }));
        if (sendStatut && statutVehicule) statutApplique.current = true;
        const created = res?.data || {};
        const reference = created.reference_intervention || (created.id ? `INT-${String(created.id).padStart(5, '0')}` : '');
        patchStep(k, { saved: { id: created.id, reference }, error: null }, false);
        okList.push(demandeParCle(k)?.matricule || `#${k}`);
      } catch (err) {
        const message = getApiError(err, "Impossible d'enregistrer cette demande.");
        patchStep(k, { error: message }, false);
        koList.push({ nom: demandeParCle(k)?.matricule || `#${k}`, key: k, message });
      }
    }

    setSaving(false);
    setProgress(null);

    if (koList.length === 0) {
      onSuccess?.();
      onClose();
      showSuccess(
        darkMode,
        theme,
        okList.length > 1 ? 'Interventions enregistrées !' : 'Intervention enregistrée !',
        okList.length > 1 ? `${okList.length} interventions ont été créées (une par demande).` : 'Opération réalisée avec succès.'
      );
      return;
    }

    // Échec partiel : on rafraîchit la liste, on garde les demandes en échec dans le formulaire
    if (okList.length > 0) onSuccess?.();
    setActiveKey(koList[0].key);
    Swal.fire({
      ...getSwalConfig(darkMode, theme),
      icon: okList.length > 0 ? 'warning' : 'error',
      title: okList.length > 0 ? 'Enregistrement partiel' : "Aucune intervention enregistrée",
      html: `<div style="text-align:left;font-size:13px">
        ${okList.length ? `<p style="margin-bottom:8px"><b>Enregistrées :</b> ${okList.map(escapeHtml).join(', ')}</p>` : ''}
        <p style="margin-bottom:4px"><b>À corriger (restent dans le formulaire) :</b></p>
        <ul style="padding-left:18px;list-style:disc">${koList
          .map((x) => `<li><b>${escapeHtml(x.nom)}</b> : ${escapeHtml(x.message)}</li>`)
          .join('')}</ul>
      </div>`,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;
    if (isEdit) submitEdit();
    else submitCreate();
  };

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────
  // STYLES UNIFORMES
  // ─────────────────────────────────────────────────────────
  const { inputClass, labelClass } = getFormStyles(darkMode);
  const { muted, cardClass, accent, gradient } = getModalStyles(darkMode, theme);
  const subCard = darkMode ? 'bg-gray-900/60 border-gray-700' : 'bg-white border-gray-200';
  const ghostBtn = `px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-40 ${
    darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
  }`;
  const skel = darkMode ? 'bg-gray-800' : 'bg-gray-200';

  const title = (icon, text) => (
    <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: accent }}>
      <i className={`bi ${icon}`} /> {text}
    </h4>
  );

  // ── Bloc « Anomalie + infos de la demande »
  const renderDemande = (d, idx = 0) => (
    <div key={d.id ?? idx} className={`rounded-xl border ${subCard}`} style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="px-4 pt-3 flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wider" style={{ color: accent }}>
          <i className="bi bi-exclamation-diamond me-1.5" />
          Anomalie constatée
        </span>
        {d.matricule && <span className={`text-xs font-bold ${muted}`}>{d.matricule}</span>}
      </div>
      <p className="px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
        {d.anomalie || <span className={`italic ${muted}`}>Aucune anomalie renseignée.</span>}
      </p>
      <div
        className={`px-4 py-3 border-t grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-2 text-sm ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        {[
          ['N° de demande', d.matricule || '—'],
          ['Demandeur', d.demandeur || 'Non spécifié'],
          ['Priorité', PRIORITES[d.priorite] || humanize(d.priorite)],
          ['Type de maintenance', MAINTENANCES[d.typeMaintenance] || humanize(d.typeMaintenance)],
          ["Type d'intervention", humanize(d.typeIntervention)],
          ['Date de la demande', d.date ? formatDateFR(d.date) : '—'],
        ].map(([l, v]) => (
          <div key={l} className="min-w-0">
            <span className={`block text-[11px] uppercase font-bold ${muted}`}>{l}</span>
            <span className="font-semibold break-words">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Contenu d'une étape (une demande)
  const renderStep = (key) => {
    const st = steps[key];
    if (!st) return null;
    const f = st.form;
    const nat = f.nature;
    const lieu = nat === 'interne' ? "l'atelier" : 'le garage';
    const locked = Boolean(st.saved);
    const duree = formatDuree(f.dateEntree, f.dateSortie);
    const total = caisseTotal(st);

    const demandesInfos = isEdit
      ? (intervention.demandes || []).length
        ? intervention.demandes.map(normDemande)
        : [{ id: 'm', matricule: intervention.matricule_demande, typeIntervention: intervention.type_intervention }]
      : [demandeParCle(key)].filter(Boolean);

    return (
      <div className="space-y-4">
        {locked && (
          <div className={`px-3.5 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 ${subCard}`} style={{ color: accent }}>
            <i className="bi bi-lock-fill" /> Enregistrée{st.saved.reference ? ` (${st.saved.reference})` : ''} — cette demande n'est plus modifiable ici.
          </div>
        )}
        {st.error && !locked && (
          <div className="px-3.5 py-2.5 rounded-xl border border-red-500/40 text-sm font-semibold text-red-500 flex items-start gap-2">
            <i className="bi bi-exclamation-triangle-fill mt-0.5" /> <span>{st.error}</span>
          </div>
        )}

        {demandesInfos.map((d, i) => renderDemande(d, i))}

        <fieldset disabled={locked || saving} className="min-w-0 space-y-4">
          {/* INTERVENANTS / PRESTATAIRE */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3 gap-2">
              {title('bi-person-badge', nat === 'interne' ? 'Intervenants internes (atelier)' : 'Prestataire / garage externe')}
              <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide border ${subCard}`} style={{ color: accent, borderColor: accent }}>
                {nat === 'interne' ? 'Atelier interne' : 'Garage externe'}
              </span>
            </div>

            <div className="space-y-4">
              {nat === 'interne' ? (
                <div>
                  <label className={labelClass}>Mécanicien / intervenant interne *</label>
                  <div className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                    {st.intervenants.map((nom) => (
                      <span key={nom} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold border ${subCard}`} style={{ color: accent, borderColor: accent }}>
                        <i className="bi bi-person-fill" /> {nom}
                        <button type="button" onClick={() => removeIntervenant(key, nom)} className="hover:text-red-500" title="Retirer">
                          <i className="bi bi-x" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      list="intervenants-internes-suggestions"
                      value={st.intervenantInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v.endsWith(',')) addIntervenant(key, v);
                        else patchStep(key, { intervenantInput: v });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addIntervenant(key, st.intervenantInput);
                        } else if (e.key === 'Backspace' && !st.intervenantInput && st.intervenants.length) {
                          patchStep(key, (s) => ({ intervenants: s.intervenants.slice(0, -1) }));
                        }
                      }}
                      onBlur={() => st.intervenantInput.trim() && addIntervenant(key, st.intervenantInput)}
                      placeholder={st.intervenants.length ? 'Ajouter un autre intervenant...' : 'Nom puis Entrée (ou virgule)'}
                      className={`flex-1 min-w-[220px] bg-transparent px-2 py-1 text-sm focus:outline-none ${darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                    />
                    <datalist id="intervenants-internes-suggestions">
                      {refs.intervenants_internes.map((i) => (
                        <option key={i.id} value={i.nom_externe} />
                      ))}
                    </datalist>
                  </div>
                  <p className={`text-xs mt-1.5 ${muted}`}>Saisie libre, plusieurs intervenants possibles.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Prestataire / garage *</label>
                      <input
                        type="text"
                        list="intervenants-externes-suggestions"
                        value={f.nomPrestataire}
                        onChange={(e) => setF(key, 'nomPrestataire', e.target.value)}
                        placeholder="Ex: Garage Central"
                        className={inputClass}
                      />
                      <datalist id="intervenants-externes-suggestions">
                        {refs.intervenants_externes.map((i) => (
                          <option key={i.id} value={i.nom_externe} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className={labelClass}>Spécialisation</label>
                      <input type="text" value={f.fonctionPrestataire} onChange={(e) => setF(key, 'fonctionPrestataire', e.target.value)} placeholder="Ex: Électricien auto" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>N° devis / facture</label>
                      <input type="text" value={f.numDevisFacture} onChange={(e) => setF(key, 'numDevisFacture', e.target.value)} placeholder="Ex: DEV-2026-042" className={inputClass} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Main d'œuvre (FCFA)</label>
                      <input type="number" min="0" value={f.coutMOPrestataire} onChange={(e) => setF(key, 'coutMOPrestataire', e.target.value)} placeholder="150000" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Garantie (jours)</label>
                      <input type="number" min="0" value={f.garantieJours} onChange={(e) => setF(key, 'garantieJours', e.target.value)} placeholder="90" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Paiement</label>
                      <select value={f.statutPaiement} onChange={(e) => setF(key, 'statutPaiement', e.target.value)} className={inputClass}>
                        <option value="en_attente">En attente</option>
                        <option value="paye">Payé</option>
                        <option value="partiel">Partiel</option>
                      </select>
                    </div>
                  </div>

                  <div className={`flex flex-wrap items-center gap-3 p-3 rounded-lg border border-dashed ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      ref={(el) => {
                        fileRefs.current[key] = el;
                      }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={(e) => handleFacture(key, e)}
                      className="hidden"
                      id={`facture-upload-${key}`}
                    />
                    <label htmlFor={`facture-upload-${key}`} className="cursor-pointer px-3.5 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-2 hover:opacity-90" style={gradient}>
                      <i className="bi bi-upload" /> {st.facture ? 'Remplacer' : 'Joindre la facture'}
                    </label>
                    {st.facture ? (
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <i className="bi bi-file-earmark-check-fill" style={{ color: accent }} /> {st.facture.name}
                        <span className={`font-normal ${muted}`}>({(st.facture.size / 1024).toFixed(0)} Ko)</span>
                        <button type="button" onClick={() => removeFacture(key)} className="text-red-500 hover:text-red-400" title="Retirer">
                          <i className="bi bi-x-circle-fill" />
                        </button>
                      </span>
                    ) : isEdit && intervention.facture ? (
                      <span className={`text-sm ${muted}`}>
                        <i className="bi bi-paperclip me-1" />Facture actuelle : {intervention.facture.nom} (remplacée si vous choisissez un nouveau fichier)
                      </span>
                    ) : (
                      <span className={`text-sm ${muted}`}>PDF, JPG ou PNG — 5 Mo max</span>
                    )}
                  </div>
                </>
              )}

              {/* Dates (sans heure) + résultat */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Entrée {lieu} *</label>
                  <input type="date" value={f.dateEntree} onChange={(e) => setF(key, 'dateEntree', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Sortie {lieu}</label>
                  <input type="date" min={f.dateEntree || undefined} value={f.dateSortie} onChange={(e) => setF(key, 'dateSortie', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Durée</label>
                  <div className={`px-3.5 py-2 rounded-lg border text-sm font-bold truncate ${subCard}`} style={{ color: accent }} title={duree.texte || ''}>
                    {duree.texte || '—'}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Résultat</label>
                  <select value={f.resultat} onChange={(e) => setF(key, 'resultat', e.target.value)} className={inputClass}>
                    <option value="en_cours" disabled={Boolean(f.dateSortie)}>En cours</option>
                    <option value="resolu">Résolu</option>
                    <option value="partiel">Partiel</option>
                    <option value="echec">Échec</option>
                  </select>
                </div>
              </div>
              <p className={`text-xs -mt-1 ${muted}`}>Sortie vide = véhicule toujours en réparation. Une date de sortie termine l'intervention.</p>
            </div>
          </div>

          {/* PIÈCES ACHETÉES (CAISSE) */}
          {!isEdit ? (
            <div className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                {title('bi-wallet2', 'Pièces achetées (sortie caisse)')}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold border ${subCard}`}>
                    Solde caisse : {fmt(refs.solde_caisse)} FCFA
                  </span>
                  <button type="button" onClick={() => addPiece(key)} className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:opacity-90" style={gradient}>
                    <i className="bi bi-plus-lg" /> Ajouter
                  </button>
                </div>
              </div>
              <p className={`text-xs mb-3 ${muted}`}>Enregistrées automatiquement comme dépenses de caisse.</p>

              <div className="space-y-2.5">
                {st.pieces.map((p, index) => {
                  const sousTotal = (parseFloat(p.quantite) || 0) * (parseFloat(p.prix_unitaire) || 0);
                  return (
                    <div key={p.id} className={`p-2.5 rounded-lg border grid grid-cols-12 gap-2.5 items-center ${subCard}`}>
                      <div className="col-span-12 md:col-span-5">
                        <input type="text" placeholder={`Pièce #${index + 1} (ex: Plaquettes de frein)`} value={p.nom} onChange={(e) => updatePiece(key, p.id, 'nom', e.target.value)} className={inputClass} />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <input type="number" min="0.1" step="any" placeholder="Qté" value={p.quantite} onChange={(e) => updatePiece(key, p.id, 'quantite', e.target.value)} className={`${inputClass} text-center`} />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <input type="number" min="0" placeholder="Prix unit." value={p.prix_unitaire} onChange={(e) => updatePiece(key, p.id, 'prix_unitaire', e.target.value)} className={`${inputClass} text-right`} />
                      </div>
                      <div className="col-span-4 md:col-span-3 flex items-center justify-end gap-2">
                        <span className="text-sm font-extrabold whitespace-nowrap">{fmt(sousTotal)} FCFA</span>
                        <button type="button" onClick={() => removePiece(key, p.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg" title="Supprimer cette ligne">
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-right text-sm font-bold">
                <span className={muted}>Total pièces : </span>
                <span className="text-base font-black" style={{ color: accent }}>{fmt(total)} FCFA</span>
              </div>
            </div>
          ) : (
            <div className={`${cardClass} text-sm flex items-center gap-2 ${muted}`}>
              <i className="bi bi-info-circle" style={{ color: accent }} />
              Les achats de pièces déjà enregistrés en caisse ne se modifient pas ici : utilisez l'onglet Caisse (contre-passation).
            </div>
          )}

          {/* OUTILS */}
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                {title('bi-tools', 'Outils utilisés (décompte du stock)')}
              </div>
              <button type="button" onClick={() => addOutil(key)} className={ghostBtn}>
                <i className="bi bi-plus-circle me-1" /> Ajouter un outil
              </button>
            </div>

            {st.outils.length === 0 ? (
              <p className={`text-sm text-center py-3 border border-dashed rounded-lg ${muted} ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                Aucun outil du stock sélectionné pour cette intervention.
              </p>
            ) : (
              <div className="space-y-2.5">
                {st.outils.map((o) => {
                  const sel = refs.outils.find((r) => String(r.id) === String(o.outil_id));
                  const stockDispo = sel ? sel.quantite_stock ?? 0 : null;
                  return (
                    <div key={o.id} className={`p-2.5 rounded-lg border grid grid-cols-12 gap-2.5 items-center ${subCard}`}>
                      <div className="col-span-12 md:col-span-5">
                        <select value={o.outil_id} onChange={(e) => updateOutil(key, o.id, 'outil_id', e.target.value)} className={inputClass}>
                          <option value="">-- Outil du stock --</option>
                          {refs.outils.map((tool) => (
                            <option key={tool.id} value={tool.id}>
                              {tool.nom} {tool.categorie ? `(${tool.categorie})` : ''} — stock : {tool.quantite_stock ?? 0}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <input type="number" min="1" max={stockDispo !== null ? Math.max(1, stockDispo) : undefined} placeholder="Qté" value={o.quantite} onChange={(e) => updateOutil(key, o.id, 'quantite', e.target.value)} className={`${inputClass} text-center`} title={stockDispo !== null ? `En stock : ${stockDispo}` : 'Quantité'} />
                      </div>
                      <div className="col-span-7 md:col-span-4">
                        <input type="text" placeholder="Notes" value={o.notes || ''} onChange={(e) => updateOutil(key, o.id, 'notes', e.target.value)} className={inputClass} />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button type="button" onClick={() => removeOutil(key, o.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg" title="Retirer cet outil">
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TRAVAUX & NOTES */}
          <div className={cardClass}>
            <div className="mb-3">{title('bi-clipboard2-pulse', 'Travaux effectués & notes')}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Travaux effectués</label>
                <textarea rows={4} value={f.travaux} onChange={(e) => setF(key, 'travaux', e.target.value)} placeholder="Détail des travaux et réparations effectués..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Notes & recommandations</label>
                <textarea rows={4} value={f.notes} onChange={(e) => setF(key, 'notes', e.target.value)} placeholder="Observations, prochaines révisions à prévoir..." className={inputClass} />
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    );
  };

  // ── Libellés des étapes
  const statutLabel = {
    saved: ['bi-lock-fill', 'Enregistrée'],
    ok: ['bi-check-circle-fill', 'Saisie'],
    incomplete: ['bi-exclamation-circle', 'Incomplète'],
    todo: ['bi-circle', 'À saisir'],
  };

  const activeIndex = order.indexOf(activeKey);
  const nbPending = pendingKeys.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60" role="dialog" aria-modal="true">
      <div
        className={`relative flex flex-col w-full max-w-[1400px] rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}
        style={{ height: 'calc(100vh - 2rem)', maxHeight: 'calc(100vh - 1rem)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between text-white shrink-0" style={gradient}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-tools'} text-xl`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-extrabold tracking-tight truncate">
                {isEdit
                  ? `Modifier l'intervention ${intervention.reference_intervention || `#${intervention.id}`} — ${intervention.vehicule_immatriculation}`
                  : "Saisie d'une réparation / intervention"}
              </h3>
              <p className="text-xs text-white/85 truncate">
                {isEdit ? 'Mise à jour des informations de la réparation' : 'Une intervention est créée pour chaque demande saisie'}
              </p>
            </div>
          </div>
          <button type="button" onClick={requestClose} className="p-2 rounded-lg hover:bg-white/15 transition-colors" title="Fermer (Échap)">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Corps scrollable */}
          <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4">
            {loadingRefs ? (
              <div className="space-y-3 animate-pulse">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`${cardClass} space-y-2`}>
                    <div className={`h-3.5 w-56 rounded ${skel}`} />
                    <div className={`h-8 w-full rounded-lg ${skel}`} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* DEMANDE (création) */}
                {!isEdit && (
                  <div className={cardClass}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {title('bi-card-checklist', "Demande d'intervention")}
                      <span className={`text-xs ${muted}`}>{filteredDemandes.length} demande(s) ouverte(s)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-4 relative">
                        <i className={`bi bi-search absolute left-3 top-3 text-xs ${muted}`} />
                        <input type="text" placeholder="Filtrer : N° DEM, immat, anomalie..." value={demandeSearch} onChange={(e) => setDemandeSearch(e.target.value)} className={`${inputClass} pl-9`} />
                      </div>
                      <div className="md:col-span-8">
                        <select value={selectedDemandeId} onChange={(e) => handleSelectDemande(e.target.value)} disabled={saving} className={inputClass}>
                          <option value="">-- Choisir la première demande à saisir --</option>
                          {filteredDemandes.map((d) => (
                            <option key={d.id} value={d.id}>
                              [{d.matricule_demande}] {d.vehicule_immatriculation} — {d.vehicule_marque} {d.vehicule_modele} ({d.nature_intervention === 'externe' ? 'externe' : 'interne'}) {d.anomalie_constatee ? `: ${d.anomalie_constatee.slice(0, 40)}${d.anomalie_constatee.length > 40 ? '…' : ''}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {filteredDemandes.length === 0 && (
                      <p className={`text-sm mt-2 ${muted}`}>
                        <i className="bi bi-info-circle me-1" />
                        {demandeSearch ? 'Aucune demande ne correspond à la recherche.' : 'Aucune demande en attente ou en cours trouvée.'}
                      </p>
                    )}
                  </div>
                )}

                {/* VÉHICULE : infos, kilométrage, statut (réglés une seule fois) */}
                {vehiculeInfo ? (
                  <div className={cardClass}>
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                      <div className="flex items-center gap-3" style={{ flex: '2 1 340px', minWidth: 0 }}>
                        <div className="w-12 h-12 rounded-lg text-white flex items-center justify-center text-xl shrink-0" style={gradient}>
                          <i className="bi bi-car-front" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="font-extrabold text-xl tracking-wide whitespace-nowrap" style={{ color: accent }}>{vehiculeInfo.immatriculation}</div>
                          <div className={`text-sm break-words ${muted}`}>
                            {vehiculeInfo.marque} {vehiculeInfo.modele} • Statut actuel : <span className="font-semibold">{vehiculeInfo.statut}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ flex: '1 1 220px' }}>
                        <label className={labelClass}>Kilométrage relevé (km)</label>
                        <input type="number" min="0" value={km} onChange={(e) => setKm(e.target.value)} disabled={saving} placeholder="Ex: 85000" className={`${inputClass} text-center font-bold`} />
                      </div>
                      <div style={{ flex: '2 1 300px' }}>
                        <label className={labelClass}>Statut du véhicule</label>
                        <select value={statutVehicule} onChange={(e) => setStatutVehicule(e.target.value)} disabled={saving} className={inputClass}>
                          <option value="">Automatique (selon l'avancement)</option>
                          {refs.statuts_vehicule.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {!isEdit && order.length > 1 && (
                      <p className={`text-xs mt-3 ${muted}`}>Le kilométrage et le statut sont réglés une seule fois pour le véhicule, quelle que soit la demande.</p>
                    )}
                  </div>
                ) : (
                  !isEdit && (
                    <div className={`p-4 rounded-xl border border-dashed text-center text-sm ${muted} ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                      <i className="bi bi-info-circle me-1.5" /> Le véhicule et son kilométrage se chargent dès que vous sélectionnez une demande.
                    </div>
                  )
                )}

                {/* ÉTAPES : une par demande du véhicule */}
                {!isEdit && order.length > 1 && (
                  <div className={cardClass}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {title('bi-list-check', `Demandes ouvertes sur ${selectedImmat}`)}
                      <span className={`text-xs ${muted}`}>Saisissez chaque demande, puis un seul bouton enregistre tout</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {order.map((k, i) => {
                        const s = stepStatus(k);
                        const [icon, lib] = statutLabel[s];
                        const active = k === activeKey;
                        const d = demandeParCle(k);
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setActiveKey(k)}
                            className={`px-4 py-2 rounded-lg border text-left transition-all ${
                              active ? 'text-white shadow-md border-transparent' : darkMode ? 'bg-gray-900/60 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-300 hover:border-gray-400'
                            }`}
                            style={active ? gradient : undefined}
                          >
                            <span className="block text-sm font-extrabold">
                              Demande {i + 1}/{order.length} · {d?.matricule || `#${k}`}
                            </span>
                            <span
                              className={`block text-xs font-semibold ${s === 'incomplete' && !active ? 'text-red-500' : ''}`}
                              style={!active && (s === 'ok' || s === 'saved') ? { color: accent } : undefined}
                            >
                              <i className={`bi ${icon} me-1`} />
                              {lib}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contenu de l'étape active */}
                {activeKey && renderStep(activeKey)}

                {/* Navigation entre demandes */}
                {!isEdit && order.length > 1 && activeKey && (
                  <div className="flex items-center justify-between pt-1">
                    <button type="button" className={ghostBtn} disabled={activeIndex <= 0} onClick={() => setActiveKey(order[activeIndex - 1])}>
                      <i className="bi bi-arrow-left me-1" /> Demande précédente
                    </button>
                    <span className={`text-xs ${muted}`}>Demande {activeIndex + 1} / {order.length}</span>
                    <button type="button" className={ghostBtn} disabled={activeIndex >= order.length - 1} onClick={() => setActiveKey(order[activeIndex + 1])}>
                      Demande suivante <i className="bi bi-arrow-right ms-1" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className={`px-5 py-3.5 border-t shrink-0 flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'}`}>
            <div className="flex items-center gap-2 flex-wrap text-sm min-w-0">
              <span className={`uppercase font-extrabold tracking-wide text-xs ${muted}`}>Coût estimé</span>
              <span className="text-lg font-black" style={{ color: accent }}>{fmt(grandTotal)} FCFA</span>
              {!isEdit && order.length > 0 && (
                <span className={`text-xs ${muted}`}>
                  ({readyKeys.length} demande(s) prête(s) sur {nbPending})
                </span>
              )}
              {soldeInsuffisant && (
                <span className="font-bold text-red-500 flex items-center gap-1">
                  <i className="bi bi-exclamation-triangle-fill" /> Dépasse le solde de caisse
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={requestClose} disabled={saving} className={ghostBtn}>
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || loadingRefs || (!isEdit && order.length === 0)}
                className="px-6 py-2.5 rounded-lg text-sm font-extrabold text-white shadow flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                style={gradient}
              >
                {saving ? (
                  <>
                    <i className="bi bi-arrow-repeat animate-spin" />
                    <span>{progress ? `Enregistrement ${progress.done + 1}/${progress.total}...` : 'Enregistrement...'}</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill" />
                    <span>
                      {isEdit
                        ? 'Enregistrer les modifications'
                        : readyKeys.length > 1
                          ? `Enregistrer les ${readyKeys.length} interventions`
                          : "Enregistrer l'intervention"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterventionCreateModal;