// ============================================================
// src/api/Admin-Axios/Intervention-axios.js
// ============================================================
// Regroupe dans un seul fichier :
//   1. Interventions   → /admin/interventions   (InterventionController)
//   2. Caisse          → /admin/caisse          (InterventionController, ex-CaisseController)
//   3. Inventaire      → /admin/inventaire      (FournisseurOutilController)
// Ex-Caisse-axios.js et ex-Inventaire-axios.js fusionnés ici.
// ============================================================
import api from './Vehicules-axios';

const BASE = '/admin/interventions';
const BASE_CAISSE = '/admin/caisse';
const BASE_INVENTAIRE = '/admin/inventaire';

export const getApiError = (error, fallback = 'Une erreur est survenue.') => {
  const data = error?.response?.data;
  const firstValidation = data?.errors ? Object.values(data.errors).flat()[0] : null;
  return firstValidation || data?.message || (error?.response ? `Erreur ${error.response.status}` : error?.message) || fallback;
};

// ─────────────────────────────────────────────────────────────
// OUTILS INTERNES (multipart / fichiers)
// ─────────────────────────────────────────────────────────────

/** Ajoute récursivement une valeur à un FormData (notation Laravel : a[0][b]). null/undefined ignorés. */
const appendFormData = (fd, key, value) => {
  if (value === undefined || value === null) return;
  if (typeof File !== 'undefined' && (value instanceof File || value instanceof Blob)) {
    fd.append(key, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => appendFormData(fd, `${key}[${i}]`, v));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => appendFormData(fd, `${key}[${k}]`, v));
    return;
  }
  if (typeof value === 'boolean') {
    fd.append(key, value ? '1' : '0');
    return;
  }
  fd.append(key, value);
};

const toFormData = (payload) => {
  const fd = new FormData();
  Object.entries(payload).forEach(([k, v]) => appendFormData(fd, k, v));
  return fd;
};

const hasFile = (payload) =>
  typeof File !== 'undefined' && Object.values(payload || {}).some((v) => v instanceof File);

/**
 * URL absolue d'un fichier stocké côté Laravel (ex: "/storage/interventions_factures/x.pdf").
 * Les chemins relatifs sont résolus sur l'origine de l'API (et non celle du front).
 */
export const getFileUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  try {
    const origin = new URL(api.defaults?.baseURL || '', window.location.origin).origin;
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch {
    return path;
  }
};

// ─────────────────────────────────────────────────────────────
// RÉFÉRENCES & DEMANDES
// ─────────────────────────────────────────────────────────────

/** Références pour le formulaire : intervenants (suggestions), outils, pièces, véhicules, statuts véhicule, solde caisse */
export const getInterventionReferences = (nature = null) =>
  api.get(`${BASE}/references`, { params: nature ? { nature } : {} }).then((r) => r.data);

/** Demandes ouvertes pour un véhicule */
export const getDemandesOuvertes = (immat) =>
  api.get(`${BASE}/${encodeURIComponent(immat)}/demandes-ouvertes`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// STATISTIQUES GLOBALES (panneau « Coût global réparations »)
// ─────────────────────────────────────────────────────────────

/**
 * Totaux calculés côté serveur sur TOUTES les interventions (hors supprimées / annulées),
 * indépendamment de la pagination.
 * Filtres optionnels : vehicule, nature, date_from, date_to.
 * @returns {Promise<{ data: { nb_interventions, nb_vehicules, en_cours, terminees,
 *   cout_main_oeuvre, cout_pieces, cout_total, par_nature:[{nature,nb,cout_total}],
 *   top_vehicules:[...] } }>}
 */
export const getInterventionStatistiques = (params = {}) =>
  api.get(`${BASE}/statistiques`, { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────
// CRUD INTERVENTIONS
// ─────────────────────────────────────────────────────────────

/** Liste des interventions (filtres : search, vehicule, statut, nature, date_from, date_to, page, per_page) */
export const getInterventions = (params = {}) =>
  api.get(BASE, { params }).then((r) => r.data);

/** Détail d'une intervention */
export const getIntervention = (id) =>
  api.get(`${BASE}/${id}`).then((r) => r.data);

/**
 * Création d'une intervention (transaction complète).
 * Si `payload.facture` est un File (externe) → envoi en multipart/form-data, sinon JSON.
 * Champs gérés : statut_vehicule, intervenants [{nom, telephone?, specialisation?}],
 * date_entree_garage / date_sortie_garage (Y-m-d), diagnostic (= « Travaux effectués »), facture.
 */
export const createIntervention = (payload) => {
  if (hasFile(payload)) {
    return api
      .post(BASE, toFormData(payload), { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  }
  return api.post(BASE, payload).then((r) => r.data);
};

/**
 * Modification d'une intervention.
 * Avec fichier : POST + _method=PUT (PHP ne lit pas le multipart sur un vrai PUT).
 */
export const updateIntervention = (id, payload) => {
  if (hasFile(payload)) {
    const fd = toFormData({ ...payload, _method: 'PUT' });
    return api
      .post(`${BASE}/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  }
  return api.put(`${BASE}/${id}`, payload).then((r) => r.data);
};

/** Suppression d'une intervention (contre-passation stock + caisse côté serveur) */
export const deleteIntervention = (id) =>
  api.delete(`${BASE}/${id}`).then((r) => r.data);

/**
 * Changement rapide de statut (ex: terminee, annulee).
 * payload accepté : resultat, notes, date_sortie_garage (Y-m-d), statut_vehicule.
 */
export const updateStatutIntervention = (id, statut, payload = {}) =>
  api.patch(`${BASE}/${id}/statut`, { statut, ...payload }).then((r) => r.data);

// ═════════════════════════════════════════════════════════════
// CAISSE  (ex-Petite caisse / ex-Caisse-axios.js)
// ═════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// OPÉRATIONS DE CAISSE
// ─────────────────────────────────────────────────────────────

/** Solde courant et statistiques du mois */
export const getSoldeCaisse = () =>
  api.get(`${BASE_CAISSE}/solde`).then((r) => r.data);

/** Liste paginée des mouvements de caisse */
export const getMouvementsCaisse = (params = {}) =>
  api.get(`${BASE_CAISSE}/mouvements`, { params }).then((r) => r.data);

/** Approvisionnement de caisse (FormData pour pièce jointe) */
export const approvisionnerCaisse = (formData) =>
  api.post(`${BASE_CAISSE}/approvisionnement`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

/**
 * Sortie de caisse manuelle (FormData pour justificatif).
 * Conservée côté API ; l'onglet « Nouvelle dépense » n'existe plus dans l'interface :
 * les dépenses sont enregistrées automatiquement à l'ajout d'une intervention.
 */
export const sortieCaisse = (formData) =>
  api.post(`${BASE_CAISSE}/sortie`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

/** Annuler un mouvement de caisse par contre-passation */
export const annulerMouvementCaisse = (id) =>
  api.post(`${BASE_CAISSE}/mouvements/${id}/annuler`).then((r) => r.data);

/** Périodes de caisse */
export const getPeriodesCaisse = () =>
  api.get(`${BASE_CAISSE}/periodes`).then((r) => r.data);

/** Clôturer une période mensuelle de caisse */
export const cloturerPeriodeCaisse = (id) =>
  api.post(`${BASE_CAISSE}/periodes/${id}/cloturer`).then((r) => r.data);

/** Export des mouvements pour la comptabilité */
export const exportMouvementsCaisse = (params = {}) =>
  api.get(`${BASE_CAISSE}/export`, { params }).then((r) => r.data);

// ═════════════════════════════════════════════════════════════
// INVENTAIRE : FOURNISSEURS, OUTILS, PIÈCES, PROBLÈMES  (ex-Inventaire-axios.js)
// Correspond à FournisseurOutilController.
// Réponses : { data: ... } (liste / ressource), { message } (suppression).
// Erreurs de validation Laravel : 422 { message, errors }.
// ═════════════════════════════════════════════════════════════

// 1. FOURNISSEURS

/** @returns {Promise<{ data: Fournisseur[] }>} */
export const getFournisseurs = () =>
  api.get(`${BASE_INVENTAIRE}/fournisseurs`).then((r) => r.data);

/**
 * @param {{ nom:string, type:'pieces'|'carburant'|'assurance'|'autre',
 *           contact?:string, telephone?:string, email?:string,
 *           adresse?:string, est_actif?:boolean }} data
 */
export const createFournisseur = (data) =>
  api.post(`${BASE_INVENTAIRE}/fournisseurs`, data).then((r) => r.data);

export const updateFournisseur = (id, data) =>
  api.put(`${BASE_INVENTAIRE}/fournisseurs/${id}`, data).then((r) => r.data);

/** Active / désactive un fournisseur */
export const toggleFournisseur = (id) =>
  api.patch(`${BASE_INVENTAIRE}/fournisseurs/${id}/toggle`).then((r) => r.data);

/** 409 si le fournisseur est lié à des pièces actives */
export const deleteFournisseur = (id) =>
  api.delete(`${BASE_INVENTAIRE}/fournisseurs/${id}`).then((r) => r.data);

// 2. OUTILS

export const getOutils = () =>
  api.get(`${BASE_INVENTAIRE}/outils`).then((r) => r.data);

/**
 * @param {{ nom:string, etat:'OK'|'Maintenance'|'Hors service'|'defaut',
 *           type?:string, categorie?:string, emplacement?:string,
 *           date_dernier_controle?:string, notes?:string }} data
 */
export const createOutil = (data) =>
  api.post(`${BASE_INVENTAIRE}/outils`, data).then((r) => r.data);

export const updateOutil = (id, data) =>
  api.put(`${BASE_INVENTAIRE}/outils/${id}`, data).then((r) => r.data);

export const deleteOutil = (id) =>
  api.delete(`${BASE_INVENTAIRE}/outils/${id}`).then((r) => r.data);

// 3. PIÈCES DÉTACHÉES

/**
 * Chaque pièce : { id, sku, nom, type_piece, description,
 *   quantite_stock, seuil_alerte, unite, prix_unitaire,
 *   fournisseur_id, fournisseur_nom, fournisseur_telephone, fournisseur_email,
 *   emplacement, est_actif, en_alerte }
 */
export const getPieces = () =>
  api.get(`${BASE_INVENTAIRE}/pieces`).then((r) => r.data);

export const createPiece = (data) =>
  api.post(`${BASE_INVENTAIRE}/pieces`, data).then((r) => r.data);

/** Modifier la quantité ici crée un mouvement « ajustement » côté serveur */
export const updatePiece = (id, data) =>
  api.put(`${BASE_INVENTAIRE}/pieces/${id}`, data).then((r) => r.data);

export const togglePiece = (id) =>
  api.patch(`${BASE_INVENTAIRE}/pieces/${id}/toggle`).then((r) => r.data);

/**
 * Réapprovisionnement.
 * @param {{ quantite:number, prix_unitaire?:number, fournisseur_id?:number,
 *           notes?:string, chemin_document?:string }} data
 */
export const entreeStockPiece = (id, data) =>
  api.post(`${BASE_INVENTAIRE}/pieces/${id}/entree`, data).then((r) => r.data);

/** Historique des 100 derniers mouvements */
export const getPieceMouvements = (id) =>
  api.get(`${BASE_INVENTAIRE}/pieces/${id}/mouvements`).then((r) => r.data);

export const deletePiece = (id) =>
  api.delete(`${BASE_INVENTAIRE}/pieces/${id}`).then((r) => r.data);

// 4. PROBLÈMES D'OUTILS

/**
 * Chaque problème : { id, outil_id, outil_nom, signale_par (nom),
 *   signale_par_user_id, description_probleme, statut, date_signalement,
 *   date_resolution, notes_resolution, photos }
 */
export const getProblemes = () =>
  api.get(`${BASE_INVENTAIRE}/problemes`).then((r) => r.data);

/** Le signalant est déduit du token (pas besoin de l'envoyer) */
export const createProbleme = (data) =>
  api.post(`${BASE_INVENTAIRE}/problemes`, data).then((r) => r.data);

export const updateProbleme = (id, data) =>
  api.put(`${BASE_INVENTAIRE}/problemes/${id}`, data).then((r) => r.data);

export const prendreEnChargeProbleme = (id) =>
  api.patch(`${BASE_INVENTAIRE}/problemes/${id}/en-cours`).then((r) => r.data);

/** @param {string} [notes_resolution] */
export const resoudreProbleme = (id, notes_resolution = '') =>
  api.patch(`${BASE_INVENTAIRE}/problemes/${id}/resoudre`, { notes_resolution }).then((r) => r.data);

export const deleteProbleme = (id) =>
  api.delete(`${BASE_INVENTAIRE}/problemes/${id}`).then((r) => r.data);

// 5. ALERTES STOCK FAIBLE

/**
 * Déclenche l'envoi des emails en attente.
 * @returns {Promise<{ message:string, summary:{ emails_envoyes, ignores, deja_pris, erreurs } }>}
 */
export const envoyerAlertesStock = () =>
  api.get(`${BASE_INVENTAIRE}/stock/envoyer-alertes`).then((r) => r.data);

// ═════════════════════════════════════════════════════════════
// HELPERS INTERVENTIONS : dates sans heure, durée lisible, statuts véhicule
// ═════════════════════════════════════════════════════════════

/** Statuts véhicule proposés (valeurs identiques à InterventionController::STATUTS_VEHICULE_MAP). */
export const VEHICULE_STATUTS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'En reparation', label: 'En réparation' },
  { value: 'En panne', label: 'En panne' },
  { value: 'immobilisation courte', label: 'Immobilisation courte' },
  { value: 'immobilisation longue', label: 'Immobilisation longue' },
  { value: 'indisponible', label: 'Hors service' },
  { value: 'en_mission', label: 'En mission' },
];

const pad = (n) => String(n).padStart(2, '0');

/** Date du jour au format Y-m-d (heure locale, pas UTC). */
export const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Convertit 'Y-m-d', 'Y-m-d H:i:s' ou ISO en Date locale à minuit (sans décalage de fuseau). */
export const parseJour = (v) => {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/** Normalise n'importe quelle date en 'Y-m-d' (pour <input type="date">). */
export const toInputDate = (v) => {
  const d = parseJour(v);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '';
};

/** Date lisible sans heure : 21 oct. 2026 */
export const formatDateFR = (v) => {
  const d = parseJour(v);
  return d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
};

/**
 * Durée lisible entre deux dates : "1 an 2 mois 1 semaine 3 jours".
 * Sans date de fin → calculée jusqu'à aujourd'hui (marquée "en cours").
 * (Le backend renvoie déjà `duree_texte` ; ceci sert d'aperçu dans le formulaire et de repli.)
 */
export const formatDuree = (debut, fin) => {
  const d = parseJour(debut);
  if (!d) return { texte: null, jours: null, enCours: false };

  const enCours = !fin;
  let f = fin ? parseJour(fin) : parseJour(todayLocal());
  if (!f || f < d) f = new Date(d);

  const jours = Math.round((f - d) / 86400000);

  let y = f.getFullYear() - d.getFullYear();
  let m = f.getMonth() - d.getMonth();
  let j = f.getDate() - d.getDate();
  if (j < 0) {
    m -= 1;
    j += new Date(f.getFullYear(), f.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  const semaines = Math.floor(j / 7);
  const jr = j % 7;

  const parts = [];
  if (y) parts.push(`${y} ${y > 1 ? 'ans' : 'an'}`);
  if (m) parts.push(`${m} mois`);
  if (semaines) parts.push(`${semaines} ${semaines > 1 ? 'semaines' : 'semaine'}`);
  if (jr) parts.push(`${jr} ${jr > 1 ? 'jours' : 'jour'}`);

  let texte = parts.length ? parts.join(' ') : "Moins d'un jour";
  if (enCours) texte += ' (en cours)';
  return { texte, jours, enCours };
};

export default api;