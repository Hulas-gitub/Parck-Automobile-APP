// ============================================================
// src/api/Admin-Axios/HistoriqueVehicule-axios.js
// ============================================================
// Réutilise l'instance axios partagée (baseURL + intercepteur token/401)
// déjà configurée dans Vehicules-axios.js — ne pas recréer d'instance ici.
// ============================================================
import api from './Vehicules-axios';

// ─────────────────────────────────────────────────────────────
// HISTORIQUE VÉHICULES — conformité des documents
// ─────────────────────────────────────────────────────────────
const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );

/**
 * Liste tous les véhicules avec le statut de conformité de leurs documents.
 *
 * @param {{
 *   immatriculation?: string,
 *   date_debut?: string,
 *   date_fin?: string,
 *   type_document?: string,
 *   statut?: 'valide'|'expire_bientot'|'expire'|'sans_document',
 *   page?: number,
 *   per_page?: number,
 * }} params
 */
export const getHistoriqueVehicules = (params = {}) =>
  api.get('/admin/historique-vehicules', { params: cleanParams(params) }).then((r) => r.data);

/**
 * Liste distincte des types de documents existants (pour le <select> filtre).
 */
export const getTypesDocuments = () =>
  api.get('/admin/historique-vehicules/types-documents').then((r) => r.data);