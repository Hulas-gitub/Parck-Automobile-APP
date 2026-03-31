import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// ============================================================================
// WORKFLOW — demandes_intervention
// ─────────────────────────────────────────────────────────────────────────────
//  CHAUFFEUR   → peut CRÉER une demande (véhicule, type, priorité, commentaire)
//               → voit seulement ses propres demandes
//               → NE peut PAS valider / rejeter / terminer
//
//  MÉCANICIEN  → voit toutes les demandes (en lecture)
//               → peut marquer une demande comme TERMINÉE
//               → NE peut PAS créer / valider / rejeter
//
//  CHEF PARC   → voit toutes les demandes
//               → peut CRÉER, VALIDER (→ En cours), REJETER, TERMINER
//
//  ADMIN       → voit toutes les demandes
//               → peut CRÉER, VALIDER (→ En cours), REJETER, TERMINER
//
// CYCLE DE VIE :
//   en_attente  ──► en_cours (approuvée par Admin/Chef)
//   en_cours    ──► termine  (intervention terminée par Mécanicien/Admin/Chef)
//   en_attente  ──► rejetee  (rejetée par Admin/Chef)
// ============================================================================

// ── Utilisateur connecté simulé (en prod : récupéré depuis JWT)
const CURRENT_USER = {
  id: 1,
  nom: 'Hulas Djyembi',
  role_code: 'admin',
  role_libelle: 'Administrateur',
  can_create:   true,   // admin + chef_parc + chauffeur
  can_validate: true,   // admin + chef_parc seulement
  can_termine:  true,   // admin + chef_parc + mecanicien
};

// ── table: utilisateurs
const UTILISATEURS = [
  { id:1, nom:'Hulas Djyembi', role_code:'admin',      role_libelle:'Administrateur',       direction:'DSI'                  },
  { id:2, nom:'Chef du Parc',  role_code:'chef_parc',  role_libelle:'Gestionnaire du Parc', direction:'Direction Technique'  },
  { id:3, nom:'Marc Essono',   role_code:'chauffeur',  role_libelle:'Chauffeur',            direction:'Direction Logistique' },
  { id:4, nom:'Alain Nguema',  role_code:'chauffeur',  role_libelle:'Chauffeur',            direction:'Direction Technique'  },
  { id:5, nom:'Pierre Nzong',  role_code:'chauffeur',  role_libelle:'Chauffeur',            direction:'Direction Technique'  },
  { id:6, nom:'Sophie Ondo',   role_code:'chauffeur',  role_libelle:'Chauffeur',            direction:'Direction Générale'   },
  { id:7, nom:'Jean Mékamé',   role_code:'mecanicien', role_libelle:'Mécanicien',           direction:'Direction Technique'  },
];

// ── table: vehicules
const VEHICULES = [
  { immatriculation:'GA-1234-AB', marque:'Toyota',     modele:'Land Cruiser', kilometrage:145000, statut:'disponible'     },
  { immatriculation:'GA-5678-CD', marque:'Ford',       modele:'Ranger',       kilometrage:89000,  statut:'disponible'     },
  { immatriculation:'GA-9012-EF', marque:'Nissan',     modele:'Patrol',       kilometrage:210000, statut:'en_maintenance' },
  { immatriculation:'GA-3456-GH', marque:'Toyota',     modele:'Hilux',        kilometrage:67000,  statut:'disponible'     },
  { immatriculation:'GA-7890-IJ', marque:'Mitsubishi', modele:'L200',         kilometrage:112000, statut:'disponible'     },
  { immatriculation:'GA-2345-KL', marque:'Mercedes',   modele:'Sprinter',     kilometrage:55000,  statut:'disponible'     },
  { immatriculation:'GA-6789-MN', marque:'Hyundai',    modele:'H350',         kilometrage:78000,  statut:'immobilise'     },
  { immatriculation:'GA-1122-TF', marque:'Toyota',     modele:'HiAce',        kilometrage:33000,  statut:'disponible'     },
];

// ── table: anomalies (ouvertes / en_cours uniquement)
const ANOMALIES = [
  { id:1, vehicule_immatriculation:'GA-1234-AB', description:'Fuite huile moteur constatée lors du tour de véhicule', severite:'haute',    statut:'ouverte'  },
  { id:2, vehicule_immatriculation:'GA-5678-CD', description:'Pédale de frein molle, pression insuffisante',          severite:'critique', statut:'ouverte'  },
  { id:3, vehicule_immatriculation:'GA-9012-EF', description:'Surchauffe moteur signalée en route',                   severite:'critique', statut:'en_cours' },
  { id:4, vehicule_immatriculation:'GA-3456-GH', description:'Phares avant défaillants côté droit',                   severite:'moyenne',  statut:'ouverte'  },
  { id:5, vehicule_immatriculation:'GA-7890-IJ', description:'Vibrations anormales à vitesse élevée',                 severite:'haute',    statut:'ouverte'  },
  { id:6, vehicule_immatriculation:'GA-1122-TF', description:'Climatisation ne fonctionne plus',                      severite:'faible',   statut:'ouverte'  },
];

// ── Enums BDD
const TYPES_MAINTENANCE = [
  { code:'corrective', libelle:'Corrective', color:'#ef4444', bg:'bg-red-100 text-red-700',     icon:'bi-wrench'            },
  { code:'preventive', libelle:'Préventive', color:'#10b981', bg:'bg-green-100 text-green-700', icon:'bi-shield-check-fill' },
];
const TYPES_INTERVENTION = [
  { code:'revision_generale',     libelle:'Révision générale'       },
  { code:'vidange',               libelle:'Vidange'                  },
  { code:'freinage',              libelle:'Freinage'                 },
  { code:'moteur',                libelle:'Moteur'                   },
  { code:'transmission',          libelle:'Transmission'             },
  { code:'electricite',           libelle:'Électricité'              },
  { code:'carrosserie',           libelle:'Carrosserie'              },
  { code:'pneumatiques',          libelle:'Pneumatiques'             },
  { code:'climatisation',         libelle:'Climatisation'            },
  { code:'suspension',            libelle:'Suspension'               },
  { code:'batterie',              libelle:'Batterie'                 },
  { code:'echappement',           libelle:'Échappement'              },
  { code:'direction',             libelle:'Direction'                },
  { code:'refroidissement',       libelle:'Refroidissement'          },
  { code:'courroie_distribution', libelle:'Courroie de distribution' },
];
const PRIORITES = [
  { code:'faible',  libelle:'Faible',  color:'#10b981', bg:'bg-green-100 text-green-700',   icon:'bi-arrow-down-circle-fill'  },
  { code:'normale', libelle:'Normale', color:'#6366f1', bg:'bg-indigo-100 text-indigo-700', icon:'bi-dash-circle-fill'         },
  { code:'haute',   libelle:'Haute',   color:'#f59e0b', bg:'bg-yellow-100 text-yellow-700', icon:'bi-arrow-up-circle-fill'    },
  { code:'urgente', libelle:'Urgente', color:'#ef4444', bg:'bg-red-100 text-red-700',       icon:'bi-lightning-charge-fill'   },
];

// ── STATUTS MIS À JOUR — cycle de vie correct
const STATUTS = [
  { code:'en_attente', libelle:'En attente',          color:'#f59e0b', bg:'bg-yellow-100 text-yellow-700',  icon:'bi-hourglass-split'      },
  { code:'en_cours',   libelle:'En cours de traitement', color:'#3b82f6', bg:'bg-blue-100 text-blue-700',   icon:'bi-gear-fill'            },
  { code:'termine',    libelle:'Terminé',              color:'#10b981', bg:'bg-green-100 text-green-700',   icon:'bi-check-circle-fill'    },
  { code:'rejetee',    libelle:'Rejetée',              color:'#ef4444', bg:'bg-red-100 text-red-700',       icon:'bi-x-circle-fill'        },
];

const PERIODES = [
  { code:'7j',   libelle:'7 jours',     jours:7   },
  { code:'30j',  libelle:'Mensuel',     jours:30  },
  { code:'90j',  libelle:'Trimestriel', jours:90  },
  { code:'180j', libelle:'Semestriel',  jours:180 },
  { code:'365j', libelle:'Annuel',      jours:365 },
];

// ── Couleur par rôle
const roleStyle = code => {
  if(code==='admin')     return { bg:'bg-purple-100 text-purple-700', dot:'#8b5cf6', label:'Admin' };
  if(code==='chef_parc') return { bg:'bg-blue-100 text-blue-700',     dot:'#3b82f6', label:'Chef de parc' };
  if(code==='chauffeur') return { bg:'bg-teal-100 text-teal-700',     dot:'#14b8a6', label:'Chauffeur' };
  if(code==='mecanicien')return { bg:'bg-orange-100 text-orange-700', dot:'#f97316', label:'Mécanicien' };
  return { bg:'bg-gray-100 text-gray-600', dot:'#94a3b8', label:code };
};

// ============================================================================
// 20 DEMANDES — cycle de vie mis à jour :
//   "approuvee" → remplacé par "en_cours" (en cours de traitement)
//   ajout de "termine" pour les demandes finalisées
// ============================================================================
const INIT_DEMANDES = [
  { id:1,  anomalie_id:1,    vehicule_immatriculation:'GA-1234-AB', demandeur_user_id:3, date_demande:'2025-12-08T08:00:00Z', type_maintenance:'corrective', type_intervention:'moteur',             priorite:'haute',   statut:'termine',    commentaire:"Fuite huile constatée ce matin en démarrant le véhicule.",    motif_rejet:null,                                                      validee_par_user_id:2, date_validation:'2025-12-08T10:30:00Z', date_creation:'2025-12-08T08:00:00Z', date_modification:'2025-12-08T10:30:00Z' },
  { id:2,  anomalie_id:2,    vehicule_immatriculation:'GA-5678-CD', demandeur_user_id:4, date_demande:'2025-12-07T14:30:00Z', type_maintenance:'corrective', type_intervention:'freinage',           priorite:'urgente', statut:'en_cours',   commentaire:"Pédale de frein très molle, dangereux pour la circulation.", motif_rejet:null,                                                      validee_par_user_id:2, date_validation:'2025-12-07T16:00:00Z', date_creation:'2025-12-07T14:30:00Z', date_modification:'2025-12-07T16:00:00Z' },
  { id:3,  anomalie_id:null, vehicule_immatriculation:'GA-9012-EF', demandeur_user_id:2, date_demande:'2025-11-19T07:00:00Z', type_maintenance:'preventive', type_intervention:'vidange',            priorite:'normale', statut:'termine',    commentaire:"Vidange planifiée à 210 000 km.",                             motif_rejet:null,                                                      validee_par_user_id:1, date_validation:'2025-11-19T09:00:00Z', date_creation:'2025-11-19T07:00:00Z', date_modification:'2025-11-19T09:00:00Z' },
  { id:4,  anomalie_id:4,    vehicule_immatriculation:'GA-3456-GH', demandeur_user_id:6, date_demande:'2025-12-10T09:30:00Z', type_maintenance:'corrective', type_intervention:'electricite',         priorite:'haute',   statut:'en_attente', commentaire:"Phares avant HS, mission de nuit impossible.",                motif_rejet:null,                                                      validee_par_user_id:null, date_validation:null, date_creation:'2025-12-10T09:30:00Z', date_modification:'2025-12-10T09:30:00Z' },
  { id:5,  anomalie_id:5,    vehicule_immatriculation:'GA-7890-IJ', demandeur_user_id:3, date_demande:'2025-12-12T16:30:00Z', type_maintenance:'corrective', type_intervention:'pneumatiques',        priorite:'urgente', statut:'en_attente', commentaire:"Vibrations intenses, pneus avant très usés.",                 motif_rejet:null,                                                      validee_par_user_id:null, date_validation:null, date_creation:'2025-12-12T16:30:00Z', date_modification:'2025-12-12T16:30:00Z' },
  { id:6,  anomalie_id:null, vehicule_immatriculation:'GA-2345-KL', demandeur_user_id:2, date_demande:'2025-10-11T07:00:00Z', type_maintenance:'preventive', type_intervention:'revision_generale',   priorite:'normale', statut:'termine',    commentaire:"Révision des 55 000 km.",                                     motif_rejet:null,                                                      validee_par_user_id:1, date_validation:'2025-10-11T08:00:00Z', date_creation:'2025-10-11T07:00:00Z', date_modification:'2025-10-11T08:00:00Z' },
  { id:7,  anomalie_id:6,    vehicule_immatriculation:'GA-1122-TF', demandeur_user_id:6, date_demande:'2025-12-15T08:30:00Z', type_maintenance:'corrective', type_intervention:'climatisation',       priorite:'faible',  statut:'rejetee',    commentaire:"Climatisation en panne depuis hier.",                         motif_rejet:"Intervention non prioritaire, reporter au prochain planning.", validee_par_user_id:2, date_validation:'2025-12-16T09:00:00Z', date_creation:'2025-12-15T08:30:00Z', date_modification:'2025-12-16T09:00:00Z' },
  { id:8,  anomalie_id:null, vehicule_immatriculation:'GA-6789-MN', demandeur_user_id:5, date_demande:'2025-12-18T10:00:00Z', type_maintenance:'corrective', type_intervention:'suspension',          priorite:'haute',   statut:'en_attente', commentaire:"Amortisseurs arrière défaillants, véhicule instable.",       motif_rejet:null,                                                      validee_par_user_id:null, date_validation:null, date_creation:'2025-12-18T10:00:00Z', date_modification:'2025-12-18T10:00:00Z' },
  { id:9,  anomalie_id:null, vehicule_immatriculation:'GA-1234-AB', demandeur_user_id:2, date_demande:'2025-09-14T08:00:00Z', type_maintenance:'preventive', type_intervention:'courroie_distribution',priorite:'normale', statut:'termine',    commentaire:"Courroie de distribution proche de la limite kilométrique.",  motif_rejet:null,                                                      validee_par_user_id:1, date_validation:'2025-09-14T09:30:00Z', date_creation:'2025-09-14T08:00:00Z', date_modification:'2025-09-14T09:30:00Z' },
  { id:10, anomalie_id:null, vehicule_immatriculation:'GA-5678-CD', demandeur_user_id:4, date_demande:'2025-12-20T07:30:00Z', type_maintenance:'corrective', type_intervention:'batterie',            priorite:'haute',   statut:'en_attente', commentaire:"Batterie morte, démarrage impossible ce matin.",              motif_rejet:null,                                                      validee_par_user_id:null, date_validation:null, date_creation:'2025-12-20T07:30:00Z', date_modification:'2025-12-20T07:30:00Z' },
  { id:11, anomalie_id:null, vehicule_immatriculation:'GA-9012-EF', demandeur_user_id:5, date_demande:'2025-11-01T09:00:00Z', type_maintenance:'corrective', type_intervention:'echappement',         priorite:'faible',  statut:'termine',    commentaire:"Bruit anormal à l'échappement en accélération.",              motif_rejet:null,                                                      validee_par_user_id:2, date_validation:'2025-11-01T10:00:00Z', date_creation:'2025-11-01T09:00:00Z', date_modification:'2025-11-01T10:00:00Z' },
  { id:12, anomalie_id:null, vehicule_immatriculation:'GA-3456-GH', demandeur_user_id:6, date_demande:'2025-12-22T08:00:00Z', type_maintenance:'corrective', type_intervention:'direction',           priorite:'urgente', statut:'en_attente', commentaire:"Direction assistée défaillante, véhicule très difficile à manœuvrer.", motif_rejet:null,                                             validee_par_user_id:null, date_validation:null, date_creation:'2025-12-22T08:00:00Z', date_modification:'2025-12-22T08:00:00Z' },
  { id:13, anomalie_id:null, vehicule_immatriculation:'GA-7890-IJ', demandeur_user_id:2, date_demande:'2025-08-19T08:00:00Z', type_maintenance:'preventive', type_intervention:'refroidissement',     priorite:'normale', statut:'termine',    commentaire:"Circuit de refroidissement à vérifier avant la saison chaude.", motif_rejet:null,                                                    validee_par_user_id:1, date_validation:'2025-08-19T09:00:00Z', date_creation:'2025-08-19T08:00:00Z', date_modification:'2025-08-19T09:00:00Z' },
  { id:14, anomalie_id:null, vehicule_immatriculation:'GA-2345-KL', demandeur_user_id:4, date_demande:'2025-07-09T10:00:00Z', type_maintenance:'corrective', type_intervention:'transmission',        priorite:'haute',   statut:'rejetee',    commentaire:"Boîte de vitesses qui claque lors des changements.",          motif_rejet:"Véhicule en fin de vie, déclassement prévu en Q4.",           validee_par_user_id:1, date_validation:'2025-07-10T14:00:00Z', date_creation:'2025-07-09T10:00:00Z', date_modification:'2025-07-10T14:00:00Z' },
  { id:15, anomalie_id:null, vehicule_immatriculation:'GA-6789-MN', demandeur_user_id:5, date_demande:'2025-12-28T09:00:00Z', type_maintenance:'corrective', type_intervention:'carrosserie',         priorite:'faible',  statut:'rejetee',    commentaire:"Rayures suite à un accrochage en stationnement.",             motif_rejet:"Dossier assurance en cours, ne pas intervenir avant clôture.", validee_par_user_id:2, date_validation:'2025-12-29T11:00:00Z', date_creation:'2025-12-28T09:00:00Z', date_modification:'2025-12-29T11:00:00Z' },
  { id:16, anomalie_id:null, vehicule_immatriculation:'GA-1122-TF', demandeur_user_id:2, date_demande:'2025-06-04T07:00:00Z', type_maintenance:'preventive', type_intervention:'vidange',             priorite:'normale', statut:'termine',    commentaire:"Vidange des 30 000 km selon planning maintenance.",           motif_rejet:null,                                                      validee_par_user_id:1, date_validation:'2025-06-04T08:00:00Z', date_creation:'2025-06-04T07:00:00Z', date_modification:'2025-06-04T08:00:00Z' },
  { id:17, anomalie_id:null, vehicule_immatriculation:'GA-1234-AB', demandeur_user_id:3, date_demande:'2026-01-05T07:00:00Z', type_maintenance:'corrective', type_intervention:'moteur',             priorite:'urgente', statut:'en_attente', commentaire:"Perte de puissance soudaine sur la RN1, fumée blanche.",      motif_rejet:null,                                                      validee_par_user_id:null, date_validation:null, date_creation:'2026-01-05T07:00:00Z', date_modification:'2026-01-05T07:00:00Z' },
  { id:18, anomalie_id:null, vehicule_immatriculation:'GA-5678-CD', demandeur_user_id:4, date_demande:'2026-01-09T08:00:00Z', type_maintenance:'corrective', type_intervention:'freinage',           priorite:'haute',   statut:'en_cours',   commentaire:"Disques de frein avant usés, grincement fort au freinage.",   motif_rejet:null,                                                      validee_par_user_id:2, date_validation:'2026-01-09T09:00:00Z', date_creation:'2026-01-09T08:00:00Z', date_modification:'2026-01-09T09:00:00Z' },
  { id:19, anomalie_id:null, vehicule_immatriculation:'GA-9012-EF', demandeur_user_id:5, date_demande:'2026-01-14T09:00:00Z', type_maintenance:'corrective', type_intervention:'electricite',         priorite:'normale', statut:'en_attente', commentaire:"Alternateur suspect, voyant batterie allumé depuis hier.",    motif_rejet:null,                                                      validee_par_user_id:null, date_validation:null, date_creation:'2026-01-14T09:00:00Z', date_modification:'2026-01-14T09:00:00Z' },
  { id:20, anomalie_id:null, vehicule_immatriculation:'GA-3456-GH', demandeur_user_id:6, date_demande:'2026-02-01T08:00:00Z', type_maintenance:'preventive', type_intervention:'revision_generale',   priorite:'normale', statut:'en_attente', commentaire:"Révision des 70 000 km à programmer.",                       motif_rejet:null,                                                      validee_par_user_id:null, date_validation:null, date_creation:'2026-02-01T08:00:00Z', date_modification:'2026-02-01T08:00:00Z' },
];

// ============================================================================
// UTILITAIRES
// ============================================================================
const getStatutInfo    = c => STATUTS.find(s=>s.code===c)           || { libelle:c, color:'#94a3b8', bg:'bg-gray-100 text-gray-600', icon:'bi-circle' };
const getPrioriteInfo  = c => PRIORITES.find(p=>p.code===c)         || { libelle:c, color:'#94a3b8', bg:'bg-gray-100 text-gray-600', icon:'bi-circle' };
const getTypeMaintInfo = c => TYPES_MAINTENANCE.find(t=>t.code===c) || { libelle:c, color:'#94a3b8', bg:'bg-gray-100 text-gray-600' };
const getTypeIntLib    = c => TYPES_INTERVENTION.find(t=>t.code===c)?.libelle || c || '—';
const getUser          = id => UTILISATEURS.find(u=>u.id===id);
const getVehicule      = im => VEHICULES.find(v=>v.immatriculation===im);
const getAnomalie      = id => ANOMALIES.find(a=>a.id===id);

const fmtDate = iso => !iso ? '—' : new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
const fmtDT   = iso => !iso ? '—' : new Date(iso).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const fmtRel  = iso => {
  if(!iso) return '—';
  const s=(new Date()-new Date(iso))/1000;
  if(s<3600)  return `Il y a ${Math.floor(s/60)} min`;
  if(s<86400) return `Il y a ${Math.floor(s/3600)}h`;
  if(s<604800)return `Il y a ${Math.floor(s/86400)} j`;
  return fmtDate(iso);
};

const exportCSV = (rows,filename,headers) => {
  let csv='\uFEFF'+headers.join(';')+'\n';
  rows.forEach(r=>{ csv+=r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(';')+'\n'; });
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})); a.download=`${filename}.csv`; a.click();
};
const exportPDF = (title,headers,rows) => {
  const w=window.open('','_blank'); if(!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>@page{size:landscape;margin:12mm}body{font-family:'Segoe UI',sans-serif;color:#1a1a2e;padding:16px}
  h1{font-size:16px;border-bottom:2px solid #1e3a5f;padding-bottom:6px}
  .sub{color:#64748b;font-size:10px;margin-bottom:10px}
  table{width:100%;border-collapse:collapse;font-size:9px}
  th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:left;font-size:8px;text-transform:uppercase}
  td{padding:5px 8px;border-bottom:1px solid #e2e8f0}
  tr:nth-child(even) td{background:#f8fafc}
  .foot{margin-top:10px;text-align:center;color:#94a3b8;font-size:9px;border-top:1px solid #e2e8f0;padding-top:6px}
  </style></head><body>
  <h1>📋 ${title}</h1><div class="sub">Export le ${new Date().toLocaleDateString('fr-FR')} — ${rows.length} entrée(s)</div>
  <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c??'—'}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="foot">SGS Fleetify — ${title} — ${new Date().getFullYear()}</div>
  <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
};

// ============================================================================
// COMPTEUR ANIMÉ
// ============================================================================
const useCountUp = (target, dur=1200) => {
  const [v,setV]=useState(0); const raf=useRef(null),t0=useRef(null);
  useEffect(()=>{
    if(!target){setV(0);return;} t0.current=null;
    const s=ts=>{if(!t0.current)t0.current=ts;const p=Math.min((ts-t0.current)/dur,1);setV(Math.round((1-Math.pow(2,-10*p))*target));if(p<1)raf.current=requestAnimationFrame(s);};
    raf.current=requestAnimationFrame(s); return()=>cancelAnimationFrame(raf.current);
  },[target,dur]);
  return v;
};

// ============================================================================
// KPI CARD
// ============================================================================
const KpiCard = ({ label, target, total, icon, color, sub, trend, trendLabel, delay, dark, animate }) => {
  const v   = useCountUp(target);
  const pct = total ? Math.round((target / total) * 100) : null;
  const up  = trend > 0;
  return (
    <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5 flex flex-col gap-3`}
      style={{animation:animate?`fadeInUp .5s ease-out ${delay}s both`:'none'}}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:`${color}22`}}>
          <i className={`${icon} text-base`} style={{color}}></i>
        </div>
        {trend!=null && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1
            ${up ? 'bg-green-100 text-green-600' : trend<0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
            <i className={`bi ${up?'bi-arrow-up-right':trend<0?'bi-arrow-down-right':'bi-dash'}`}></i>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className={`text-3xl font-black leading-none ${dark?'text-white':'text-gray-900'}`}>{v}</p>
        <p className={`text-sm font-semibold mt-1 ${dark?'text-gray-300':'text-gray-700'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${dark?'text-gray-500':'text-gray-400'}`}>{sub}</p>
      </div>
      {pct!=null && (
        <div>
          <div className={`w-full h-1.5 rounded-full ${dark?'bg-gray-800':'bg-gray-100'}`}>
            <div className="h-1.5 rounded-full transition-all duration-1000" style={{width:`${pct}%`,background:color}}></div>
          </div>
          <p className={`text-[10px] mt-1 ${dark?'text-gray-600':'text-gray-400'}`}>{pct}% du total · {trendLabel||''}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TOOLTIP CHART
// ============================================================================
const ChartTooltip = ({ tip }) => {
  if (!tip) return null;
  return ReactDOM.createPortal(
    <div style={{position:'fixed',left:tip.x+14,top:tip.y-10,zIndex:99999,pointerEvents:'none',animation:'fadeInDown .12s ease-out'}}>
      <div style={{background:tip.dark?'#1e293b':'#fff',border:`1px solid ${tip.dark?'#334155':'#e2e8f0'}`,borderRadius:12,padding:'10px 14px',minWidth:140,boxShadow:'0 8px 32px rgba(0,0,0,.22)'}}>
        <p style={{fontSize:13,fontWeight:700,marginBottom:6,color:tip.dark?'#f1f5f9':'#1e293b'}}>{tip.label}</p>
        {tip.rows.map((r,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:i<tip.rows.length-1?4:0}}>
            <div style={{width:10,height:10,borderRadius:3,background:r.color,flexShrink:0}}></div>
            <span style={{fontSize:12,color:tip.dark?'#94a3b8':'#64748b',flex:1}}>{r.name}</span>
            <span style={{fontSize:13,fontWeight:700,color:tip.dark?'#f1f5f9':'#1e293b'}}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

// ============================================================================
// GRAPHIQUE BARRES HORIZONTALES
// ============================================================================
const BarChart = ({ data, dark, color, color2, stacked }) => {
  const [tip, setTip] = useState(null);
  if (!data || data.length === 0) return null;

  const barH=26, barGap=6;
  const rowH = color2 && !stacked ? barH*2+barGap+14 : barH+14;
  const padL=76, padR=28, padT=8, padB=20;
  const W=560, H=padT+data.length*rowH+padB, cW=W-padL-padR;

  const maxVal = stacked
    ? Math.max(...data.map(d=>(d.v1||0)+(d.v2||0)),1)
    : Math.max(...data.map(d=>Math.max(d.value||0,d.v1||0,d.v2||0)),1);

  const bw = v => (v/maxVal)*cW;
  const gy = i => padT+i*rowH;
  const gridVals = Array.from({length:5},(_,i)=>Math.round((maxVal/4)*i));

  return (
    <div className="relative w-full">
      <ChartTooltip tip={tip}/>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {gridVals.map((val,i)=>(
          <g key={i}>
            <line x1={padL+bw(val)} x2={padL+bw(val)} y1={padT} y2={H-padB} stroke={dark?'#1f2937':'#f0f0f0'} strokeWidth={1} strokeDasharray={i===0?'0':'3,3'}/>
            <text x={padL+bw(val)} y={H-4} textAnchor="middle" fontSize={9} fill={dark?'#4b5563':'#9ca3af'}>{val}</text>
          </g>
        ))}
        {data.map((d,i)=>{
          const y0=gy(i), label=d.fullLabel||d.label;
          if(stacked){
            const v1=d.v1||0, v2=d.v2||0, tot=v1+v2;
            return (
              <g key={i} style={{cursor:'pointer'}}
                onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,dark,label,rows:[{name:d.l1||'Corrective',value:v1,color},{name:d.l2||'Préventive',value:v2,color:color2}]})}
                onMouseMove={e=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:t)}
                onMouseLeave={()=>setTip(null)}>
                <rect x={padL} y={y0} width={cW} height={barH} fill={dark?'#1f2937':'#f1f5f9'} rx={7}/>
                {v1>0&&<rect x={padL} y={y0} width={bw(v1)} height={barH} fill={color} rx={7}/>}
                {v2>0&&<rect x={padL+bw(v1)} y={y0} width={bw(v2)} height={barH} fill={color2} rx={v1===0?7:0}/>}
                {tot>0&&<text x={padL+bw(tot)+5} y={y0+barH/2+4} fontSize={11} fontWeight="700" fill={dark?'#e2e8f0':'#374151'}>{tot}</text>}
                <text x={padL-6} y={y0+barH/2+4} textAnchor="end" fontSize={10} fill={dark?'#9ca3af':'#6b7280'}>{d.label}</text>
              </g>
            );
          }
          if(color2){
            const v1=d.v1||0, v2=d.v2||0;
            return (
              <g key={i} style={{cursor:'pointer'}}
                onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,dark,label,rows:[{name:d.l1||'En cours',value:v1,color},{name:d.l2||'En attente',value:v2,color:color2}]})}
                onMouseMove={e=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:t)}
                onMouseLeave={()=>setTip(null)}>
                <rect x={padL} y={y0} width={cW} height={barH} fill={dark?'#1f2937':'#f1f5f9'} rx={7}/>
                {v1>0&&<rect x={padL} y={y0} width={bw(v1)} height={barH} fill={color} rx={7}/>}
                {v1>0&&<text x={padL+bw(v1)+5} y={y0+barH/2+4} fontSize={11} fontWeight="700" fill={dark?'#e2e8f0':'#374151'}>{v1}</text>}
                <rect x={padL} y={y0+barH+barGap} width={cW} height={barH} fill={dark?'#1f2937':'#f1f5f9'} rx={7}/>
                {v2>0&&<rect x={padL} y={y0+barH+barGap} width={bw(v2)} height={barH} fill={color2} rx={7}/>}
                {v2>0&&<text x={padL+bw(v2)+5} y={y0+barH+barGap+barH/2+4} fontSize={11} fontWeight="700" fill={dark?'#e2e8f0':'#374151'}>{v2}</text>}
                <text x={padL-6} y={y0+barH+barGap/2+4} textAnchor="end" fontSize={10} fill={dark?'#9ca3af':'#6b7280'}>{d.label}</text>
              </g>
            );
          }
          const val=d.value||0;
          return (
            <g key={i} style={{cursor:'pointer'}}
              onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,dark,label,rows:[{name:'Total',value:val,color:d.color||color}]})}
              onMouseMove={e=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:t)}
              onMouseLeave={()=>setTip(null)}>
              <rect x={padL} y={y0} width={cW} height={barH} fill={dark?'#1f2937':'#f1f5f9'} rx={7}/>
              {val>0&&<rect x={padL} y={y0} width={bw(val)} height={barH} fill={d.color||color} rx={7}/>}
              {val>0&&<text x={padL+bw(val)+5} y={y0+barH/2+4} fontSize={11} fontWeight="700" fill={dark?'#e2e8f0':'#374151'}>{val}</text>}
              <text x={padL-6} y={y0+barH/2+4} textAnchor="end" fontSize={10} fill={dark?'#9ca3af':'#6b7280'}>{d.label}</text>
            </g>
          );
        })}
        <line x1={padL} x2={padL} y1={padT} y2={H-padB} stroke={dark?'#374151':'#e2e8f0'} strokeWidth={1}/>
      </svg>
    </div>
  );
};

// ============================================================================
// GRAPHIQUE COURBE
// ============================================================================
const LineChart = ({ data, dark, color, color2, height=160 }) => {
  const [tip, setTip] = useState(null);
  if (!data || data.length < 2) return null;

  const pad={l:36,r:20,t:16,b:32};
  const W=560, H=height;
  const vals1=data.map(d=>d.v1||d.value||0);
  const vals2=color2?data.map(d=>d.v2||0):[];
  const maxVal=Math.max(...vals1,...vals2,1);
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
  const px=i=>pad.l+(i/(data.length-1))*cW;
  const py=v=>pad.t+cH-(v/maxVal)*cH;
  const pts1=vals1.map((v,i)=>`${px(i)},${py(v)}`).join(' L ');
  const pts2=vals2.map((v,i)=>`${px(i)},${py(v)}`).join(' L ');
  const area1=`M ${px(0)},${H-pad.b} L ${pts1} L ${px(data.length-1)},${H-pad.b} Z`;
  const area2=`M ${px(0)},${H-pad.b} L ${pts2} L ${px(data.length-1)},${H-pad.b} Z`;

  return (
    <div className="relative w-full">
      <ChartTooltip tip={tip}/>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height}}>
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
          {color2&&<linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color2} stopOpacity="0.14"/>
            <stop offset="100%" stopColor={color2} stopOpacity="0"/>
          </linearGradient>}
        </defs>
        {Array.from({length:5},(_,i)=>{
          const val=Math.round((maxVal/4)*i), yy=py(val);
          return (<g key={i}><line x1={pad.l} x2={W-pad.r} y1={yy} y2={yy} stroke={dark?'#1f2937':'#f1f5f9'} strokeWidth={1} strokeDasharray={i===0?'0':'3,3'}/><text x={pad.l-5} y={yy+4} textAnchor="end" fontSize={9} fill={dark?'#4b5563':'#9ca3af'}>{val}</text></g>);
        })}
        {color2&&<path d={area2} fill="url(#lg2)"/>}
        <path d={area1} fill="url(#lg1)"/>
        {color2&&<path d={`M ${pts2}`} fill="none" stroke={color2} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.85}/>}
        <path d={`M ${pts1}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
        {data.map((d,i)=>(
          <g key={i}
            onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,dark,label:d.label,rows:[{name:d.l1||'Total',value:vals1[i],color},...(color2?[{name:d.l2||'Série 2',value:vals2[i],color:color2}]:[])]})}
            onMouseMove={e=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:t)}
            onMouseLeave={()=>setTip(null)}
            style={{cursor:'pointer'}}>
            <rect x={px(i)-16} y={pad.t} width={32} height={cH} fill="transparent"/>
            <circle cx={px(i)} cy={py(vals1[i])} r={tip&&tip.label===d.label?5:3} fill={color} stroke={dark?'#0f172a':'#fff'} strokeWidth={2} style={{transition:'r .1s'}}/>
            {color2&&<circle cx={px(i)} cy={py(vals2[i])} r={tip&&tip.label===d.label?4:2.5} fill={color2} stroke={dark?'#0f172a':'#fff'} strokeWidth={1.5} style={{transition:'r .1s'}}/>}
            {tip&&tip.label===d.label&&<line x1={px(i)} x2={px(i)} y1={pad.t} y2={H-pad.b} stroke={dark?'#334155':'#e2e8f0'} strokeWidth={1} strokeDasharray="3,3"/>}
            <text x={px(i)} y={H-pad.b+15} textAnchor="middle" fontSize={9} fill={dark?'#6b7280':'#9ca3af'}>{d.label}</text>
          </g>
        ))}
        <line x1={pad.l} x2={W-pad.r} y1={H-pad.b} y2={H-pad.b} stroke={dark?'#374151':'#e5e7eb'} strokeWidth={1}/>
      </svg>
    </div>
  );
};

// ── Toast
const Toast = ({ message, type, onClose, theme }) => {
  useEffect(()=>{const t=setTimeout(onClose,4500);return()=>clearTimeout(t);},[onClose]);
  const col={success:'#10b981',error:'#ef4444',warning:'#f97316',info:theme?.primary||'#3b82f6'};
  const ic ={success:'bi-check-circle-fill',error:'bi-x-circle-fill',warning:'bi-exclamation-triangle-fill',info:'bi-info-circle-fill'};
  return (
    <div className="fixed top-4 right-4 z-[9999] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[290px]"
      style={{background:col[type]||col.info,animation:'fadeInDown .3s ease-out'}}>
      <i className={`bi ${ic[type]||ic.info} text-lg`}></i>
      <span className="font-semibold text-sm flex-1">{message}</span>
      <button onClick={onClose}><i className="bi bi-x-lg text-xs opacity-70 hover:opacity-100"></i></button>
    </div>
  );
};

// ============================================================================
// MODAL DÉTAIL — cycle de vie : en_attente → en_cours → termine / rejetee
// ============================================================================
const DetailModal = ({ item, dark, theme, onClose, onEdit, onValider, onReject, onTerminer, onDelete }) => {
  const [rejectForm,setRejectForm]=useState(false);
  const [motif,setMotif]=useState('');
  const [confirmDel,setConfirmDel]=useState(false);

  const demandeur=getUser(item.demandeur_user_id);
  const valideur =getUser(item.validee_par_user_id);
  const vehicule =getVehicule(item.vehicule_immatriculation);
  const anomalie =getAnomalie(item.anomalie_id);
  const priorite =getPrioriteInfo(item.priorite);
  const statut   =getStatutInfo(item.statut);
  const typeMaint=getTypeMaintInfo(item.type_maintenance);
  const roleD    =roleStyle(demandeur?.role_code);

  // ── styles réutilisables
  const card  = `${dark?'bg-gray-800/60 border-gray-700':'bg-gray-50 border-gray-200'} rounded-2xl border p-5 flex flex-col gap-0`;
  const secT  = `text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${dark?'text-gray-400':'text-gray-400'}`;
  const divider = `border-t ${dark?'border-gray-700':'border-gray-200'} my-1`;

  const Row = ({label, value, icon}) => (
    <div className={`flex items-center justify-between py-2.5 border-b ${dark?'border-gray-700/50':'border-gray-100'} last:border-0`}>
      <div className={`flex items-center gap-2 text-sm ${dark?'text-gray-400':'text-gray-500'}`}>
        {icon && <i className={`bi ${icon} w-4 text-center`}></i>}
        <span>{label}</span>
      </div>
      <span className={`text-sm font-semibold ml-4 text-right ${dark?'text-gray-100':'text-gray-800'}`}>{value||'—'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8" style={{background:'rgba(0,0,0,0.65)'}}>
      {/* Fenêtre modale — s'adapte à l'écran comme une vraie fenêtre OS */}
      <div
        className={`${dark?'bg-gray-900':'bg-white'} rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full`}
        style={{
          maxWidth: 'min(1320px, calc(100vw - 32px))',
          height: 'min(88vh, 860px)',
          minHeight: '500px',
        }}
      >
        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <div
          className={`shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b ${dark?'border-gray-800':'border-gray-200'}`}
          style={{background:`linear-gradient(135deg,${theme.primary}18,transparent)`}}
        >
          {/* Icône + titre */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white shadow-lg"
              style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
              <i className="bi bi-file-earmark-plus-fill text-xl"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-xl font-black ${dark?'text-white':'text-gray-900'}`}>
                  DEM-{String(item.id).padStart(5,'0')}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statut.bg}`}>
                  <i className={`bi ${statut.icon} mr-1`}></i>{statut.libelle}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${priorite.bg}`}>
                  <i className={`bi ${priorite.icon} mr-1`}></i>{priorite.libelle}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeMaint.bg}`}>
                  {typeMaint.libelle}
                </span>
              </div>
              <p className={`text-sm mt-0.5 truncate ${dark?'text-gray-400':'text-gray-500'}`}>
                {getTypeIntLib(item.type_intervention)} · {fmtDT(item.date_demande)}
              </p>
            </div>
          </div>
          {/* Bouton fermer */}
          <button onClick={onClose}
            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${dark?'hover:bg-gray-800 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg text-base"></i>
          </button>
        </div>

        {/* ══ BODY ═══════════════════════════════════════════════════════════ */}
        {/* Layout : 3 colonnes sur grand écran, 1 colonne sur mobile */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x h-full"
            style={{divideColor: dark?'#1f2937':'#f1f5f9'}}>

            {/* ── COL 1 ── Véhicule + Demandeur + Traçabilité */}
            <div className={`flex flex-col gap-0 overflow-y-auto divide-y ${dark?'divide-gray-800':'divide-gray-100'}`}>

              {/* Véhicule */}
              <div className="p-5">
                <p className={secT}><i className="bi bi-car-front-fill text-blue-400"></i>Véhicule</p>
                <Row label="Immatriculation" value={item.vehicule_immatriculation} icon="bi-card-text"/>
                <Row label="Marque / Modèle" value={vehicule?`${vehicule.marque} ${vehicule.modele}`:'—'} icon="bi-car-front"/>
                <Row label="Kilométrage"     value={vehicule?`${vehicule.kilometrage.toLocaleString('fr-FR')} km`:'—'} icon="bi-speedometer2"/>
                <Row label="Statut"          value={vehicule?.statut?.replace(/_/g,' ')||'—'} icon="bi-circle-fill"/>
              </div>

              {/* Demandeur */}
              <div className="p-5">
                <p className={secT}><i className="bi bi-person-fill text-indigo-400"></i>Demandeur</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white text-base font-black"
                    style={{background:roleD.dot}}>
                    {demandeur?.nom.charAt(0)||'?'}
                  </div>
                  <div>
                    <p className={`font-bold text-base leading-tight ${dark?'text-white':'text-gray-900'}`}>{demandeur?.nom||'—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleD.bg}`}>{demandeur?.role_libelle||'—'}</span>
                    <p className={`text-xs mt-0.5 ${dark?'text-gray-500':'text-gray-400'}`}>{demandeur?.direction||'—'}</p>
                  </div>
                </div>
                <Row label="Date demande"     value={fmtDT(item.date_demande)}        icon="bi-calendar-event"/>
                <Row label="Type maintenance" value={getTypeMaintInfo(item.type_maintenance).libelle} icon="bi-wrench"/>
                <Row label="Intervention"     value={getTypeIntLib(item.type_intervention)} icon="bi-tools"/>
              </div>

              {/* Traçabilité */}
              <div className="p-5">
                <p className={secT}><i className="bi bi-clock-history text-slate-400"></i>Traçabilité</p>
                <Row label="Référence"   value={`DEM-${String(item.id).padStart(5,'0')}`} icon="bi-hash"/>
                <Row label="Créée le"    value={fmtDT(item.date_creation)}    icon="bi-plus-circle"/>
                <Row label="Modifiée le" value={fmtDT(item.date_modification)} icon="bi-pencil"/>
              </div>
            </div>

            {/* ── COL 2 ── Commentaire + Anomalie + État */}
            <div className={`flex flex-col gap-0 overflow-y-auto divide-y ${dark?'divide-gray-800':'divide-gray-100'}`}>

              {/* Commentaire */}
              <div className="p-5">
                <p className={secT}><i className="bi bi-chat-quote-fill text-amber-400"></i>Commentaire</p>
                <p className={`text-sm leading-relaxed ${dark?'text-gray-300':'text-gray-700'}`}>
                  {item.commentaire||<span className={`italic ${dark?'text-gray-600':'text-gray-400'}`}>Aucun commentaire saisi.</span>}
                </p>
              </div>

              {/* Anomalie liée */}
              <div className="p-5">
                <p className={secT}><i className="bi bi-exclamation-triangle-fill text-red-400"></i>Anomalie liée</p>
                {anomalie ? (
                  <div className={`rounded-xl p-4 ${dark?'bg-red-900/20 border border-red-800':'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm font-semibold mb-2 ${dark?'text-gray-200':'text-gray-800'}`}>{anomalie.description}</p>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-100 text-red-700">
                      Sévérité : {anomalie.severite}
                    </span>
                  </div>
                ) : (
                  <div className={`rounded-xl p-4 flex items-center gap-3 ${dark?'bg-gray-800 border border-gray-700':'bg-gray-100 border border-gray-200'}`}>
                    <i className={`bi bi-link-slash text-2xl ${dark?'text-gray-600':'text-gray-400'}`}></i>
                    <p className={`text-sm ${dark?'text-gray-500':'text-gray-400'}`}>Aucune anomalie liée</p>
                  </div>
                )}
              </div>

              {/* Bandeau état de l'intervention */}
              <div className="p-5">
                <p className={secT}><i className="bi bi-activity text-teal-400"></i>État de l'intervention</p>
                {item.statut==='en_attente' && (
                  <div className={`rounded-xl p-4 flex items-start gap-3 ${dark?'bg-yellow-900/20 border border-yellow-800':'bg-yellow-50 border border-yellow-200'}`}>
                    <i className="bi bi-hourglass-split text-yellow-400 text-lg mt-0.5"></i>
                    <div>
                      <p className={`text-sm font-bold ${dark?'text-yellow-300':'text-yellow-700'}`}>En attente de validation</p>
                      <p className={`text-xs mt-0.5 ${dark?'text-yellow-500':'text-yellow-600'}`}>La demande n'a pas encore été traitée.</p>
                    </div>
                  </div>
                )}
                {item.statut==='en_cours' && (
                  <div className={`rounded-xl p-4 flex items-start gap-3 ${dark?'bg-blue-900/20 border border-blue-800':'bg-blue-50 border border-blue-200'}`}>
                    <i className="bi bi-gear-fill text-blue-400 text-lg mt-0.5 animate-spin" style={{animationDuration:'3s'}}></i>
                    <div>
                      <p className={`text-sm font-bold ${dark?'text-blue-300':'text-blue-700'}`}>En cours de traitement</p>
                      <p className={`text-xs mt-0.5 ${dark?'text-blue-400':'text-blue-600'}`}>
                        Réf. intervention : <strong>INT-{String(item.id).padStart(5,'0')}</strong>
                      </p>
                      {valideur && <p className={`text-xs mt-1 ${dark?'text-blue-500':'text-blue-500'}`}>Lancée par {valideur.nom} le {fmtDate(item.date_validation)}</p>}
                    </div>
                  </div>
                )}
                {item.statut==='termine' && (
                  <div className={`rounded-xl p-4 flex items-start gap-3 ${dark?'bg-green-900/20 border border-green-800':'bg-green-50 border border-green-200'}`}>
                    <i className="bi bi-check-circle-fill text-green-400 text-lg mt-0.5"></i>
                    <div>
                      <p className={`text-sm font-bold ${dark?'text-green-300':'text-green-700'}`}>Intervention terminée</p>
                      <p className={`text-xs mt-0.5 ${dark?'text-green-400':'text-green-600'}`}>
                        Clôturée. Réf. : <strong>INT-{String(item.id).padStart(5,'0')}</strong>
                      </p>
                      {valideur && <p className={`text-xs mt-1 ${dark?'text-green-500':'text-green-500'}`}>Traitée par {valideur.nom} le {fmtDate(item.date_validation)}</p>}
                    </div>
                  </div>
                )}
                {item.statut==='rejetee' && (
                  <div className={`rounded-xl p-4 flex items-start gap-3 ${dark?'bg-red-900/20 border border-red-800':'bg-red-50 border border-red-200'}`}>
                    <i className="bi bi-x-circle-fill text-red-400 text-lg mt-0.5"></i>
                    <div>
                      <p className={`text-sm font-bold ${dark?'text-red-300':'text-red-700'}`}>Demande rejetée</p>
                      {item.motif_rejet && (
                        <p className={`text-xs mt-1 leading-relaxed ${dark?'text-red-400':'text-red-600'}`}>{item.motif_rejet}</p>
                      )}
                      {valideur && <p className={`text-xs mt-1 ${dark?'text-red-500':'text-red-400'}`}>Par {valideur.nom} le {fmtDate(item.date_validation)}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── COL 3 ── Zone action */}
            <div className={`flex flex-col overflow-y-auto divide-y ${dark?'divide-gray-800':'divide-gray-100'}`}>

              {/* Section décision */}
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <p className={secT + " mb-0"}><i className="bi bi-shield-fill-check text-green-400"></i>Décision</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dark?'bg-purple-900/40 text-purple-300':'bg-purple-100 text-purple-700'}`}>
                    Admin · Chef de parc
                  </span>
                </div>

                {/* ── en_attente + peut valider */}
                {item.statut==='en_attente' && CURRENT_USER.can_validate && !rejectForm && (
                  <div className="space-y-4">
                    <p className={`text-sm leading-relaxed ${dark?'text-gray-400':'text-gray-500'}`}>
                      Validez pour passer la demande en <strong>En cours de traitement</strong>, ou rejetez-la avec un motif obligatoire.
                    </p>
                    <button onClick={()=>{onValider(item.id);onClose();}}
                      className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-md transition-opacity"
                      style={{background:'linear-gradient(135deg,#3b82f6,#1d4ed8)'}}>
                      <i className="bi bi-gear-fill text-base"></i>Lancer l'intervention
                    </button>
                    <button onClick={()=>setRejectForm(true)}
                      className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border-2 border-red-400 text-red-500 transition-colors ${dark?'hover:bg-red-900/20':'hover:bg-red-50'}`}>
                      <i className="bi bi-x-circle text-base"></i>Rejeter la demande
                    </button>
                  </div>
                )}

                {/* ── en_attente + formulaire rejet */}
                {item.statut==='en_attente' && CURRENT_USER.can_validate && rejectForm && (
                  <div className="space-y-3">
                    <label className={`block text-xs font-bold uppercase tracking-wider ${dark?'text-gray-400':'text-gray-500'}`}>
                      Motif du rejet <span className="text-red-500">*</span>
                    </label>
                    <textarea rows={5} value={motif} onChange={e=>setMotif(e.target.value)}
                      placeholder="Expliquez la raison du refus..."
                      className={`w-full px-4 py-3 rounded-xl border text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30 ${dark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-gray-50 border-gray-200 text-gray-900'}`}/>
                    <button onClick={()=>{if(motif.trim()){onReject(item.id,motif);onClose();}}}
                      disabled={!motif.trim()}
                      className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-40 transition-colors">
                      Confirmer le rejet
                    </button>
                    <button onClick={()=>{setRejectForm(false);setMotif('');}}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      Annuler
                    </button>
                  </div>
                )}

                {/* ── en_attente sans droits */}
                {item.statut==='en_attente' && !CURRENT_USER.can_validate && (
                  <div className={`flex items-start gap-3 p-4 rounded-xl ${dark?'bg-gray-800':'bg-gray-100'}`}>
                    <i className="bi bi-lock-fill text-gray-400 text-lg mt-0.5"></i>
                    <p className={`text-sm ${dark?'text-gray-400':'text-gray-500'}`}>
                      En attente de validation par l'<strong>administrateur</strong> ou le <strong>chef de parc</strong>.
                    </p>
                  </div>
                )}

                {/* ── en_cours + peut terminer */}
                {item.statut==='en_cours' && CURRENT_USER.can_termine && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl flex items-start gap-3 ${dark?'bg-blue-900/20 border border-blue-800':'bg-blue-50 border border-blue-200'}`}>
                      <i className="bi bi-info-circle-fill text-blue-400 text-base mt-0.5"></i>
                      <p className={`text-sm ${dark?'text-blue-300':'text-blue-700'}`}>
                        Cliquez sur <strong>Terminer</strong> une fois l'intervention effectivement réalisée sur le véhicule.
                      </p>
                    </div>
                    <Row label="Validée par"    value={valideur?.nom||'—'}          icon="bi-person-check-fill"/>
                    <Row label="Rôle"           value={valideur?.role_libelle||'—'} icon="bi-award-fill"/>
                    <Row label="Date lancement" value={fmtDT(item.date_validation)} icon="bi-calendar-check-fill"/>
                    <button onClick={()=>{onTerminer(item.id);onClose();}}
                      className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-md transition-opacity mt-2"
                      style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
                      <i className="bi bi-check-circle-fill text-base"></i>Marquer comme Terminé
                    </button>
                  </div>
                )}

                {/* ── en_cours sans droits */}
                {item.statut==='en_cours' && !CURRENT_USER.can_termine && (
                  <div className="space-y-3">
                    <Row label="Validée par"    value={valideur?.nom||'—'}          icon="bi-person-check-fill"/>
                    <Row label="Rôle"           value={valideur?.role_libelle||'—'} icon="bi-award-fill"/>
                    <Row label="Date lancement" value={fmtDT(item.date_validation)} icon="bi-calendar-check-fill"/>
                  </div>
                )}

                {/* ── terminé */}
                {item.statut==='termine' && (
                  <div className="space-y-0">
                    <Row label="Traitée par"  value={valideur?.nom||'—'}          icon="bi-person-check-fill"/>
                    <Row label="Rôle"         value={valideur?.role_libelle||'—'} icon="bi-award-fill"/>
                    <Row label="Date clôture" value={fmtDT(item.date_validation)} icon="bi-calendar-check-fill"/>
                  </div>
                )}

                {/* ── rejetée */}
                {item.statut==='rejetee' && (
                  <div className="space-y-0">
                    <Row label="Rejetée par" value={valideur?.nom||'—'}          icon="bi-person-x-fill"/>
                    <Row label="Rôle"        value={valideur?.role_libelle||'—'} icon="bi-award-fill"/>
                    <Row label="Date rejet"  value={fmtDT(item.date_validation)} icon="bi-calendar-x-fill"/>
                  </div>
                )}
              </div>
            </div>

          </div>{/* end grid */}
        </div>{/* end body */}

        {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
        <div className={`shrink-0 px-6 py-4 border-t ${dark?'border-gray-800 bg-gray-900':'border-gray-200 bg-white'} flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-2">
            {item.statut==='en_attente' && (
              <button onClick={()=>{onEdit(item);onClose();}}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow transition-opacity"
                style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
                <i className="bi bi-pencil-fill"></i>Modifier
              </button>
            )}
            {!confirmDel ? (
              <button onClick={()=>setConfirmDel(true)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border flex items-center gap-2 transition-colors ${dark?'border-red-800 text-red-400 hover:bg-red-900/20':'border-red-200 text-red-400 hover:bg-red-50'}`}>
                <i className="bi bi-trash3-fill"></i>Supprimer
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${dark?'text-gray-400':'text-gray-500'}`}>Confirmer la suppression ?</span>
                <button onClick={()=>{onDelete(item.id);onClose();}} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Oui</button>
                <button onClick={()=>setConfirmDel(false)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${dark?'bg-gray-800 text-gray-300':'bg-gray-100 text-gray-600'}`}>Non</button>
              </div>
            )}
          </div>
          <button onClick={onClose}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL FORMULAIRE
// ============================================================================
const FormModal = ({ item, dark, theme, onClose, onSave }) => {
  const isEdit = !!item;
  const autoDate = new Date().toISOString();

  const [form, setForm] = useState({
    vehicule_immatriculation: item?.vehicule_immatriculation || '',
    demandeur_user_id:        item?.demandeur_user_id        || CURRENT_USER.id,
    demandeur_autre:          item?.demandeur_autre          || '',
    type_maintenance:         item?.type_maintenance         || 'corrective',
    type_intervention:        item?.type_intervention        || '',
    priorite:                 item?.priorite                 || 'normale',
    commentaire:              item?.commentaire              || '',
    anomalie_id:              item?.anomalie_id              || '',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const isAutre = form.demandeur_user_id === 'autre';
  const anomaliesVeh = ANOMALIES.filter(a=>a.vehicule_immatriculation===form.vehicule_immatriculation&&(a.statut==='ouverte'||a.statut==='en_cours'));
  const vehInfo = getVehicule(form.vehicule_immatriculation);
  const demandeurOk = !!form.demandeur_user_id || form.demandeur_autre.trim().length>0;
  const canSubmit   = form.vehicule_immatriculation && demandeurOk && form.type_intervention;

  const inp=`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 ${dark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-gray-50 border-gray-200 text-gray-900'}`;
  const lbl=`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark?'text-gray-400':'text-gray-500'}`;
  const blk=`${dark?'bg-gray-800 border-gray-700':'bg-gray-50 border-gray-200'} rounded-2xl border p-5`;
  const sec=`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${dark?'text-gray-400':'text-gray-500'}`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${dark?'bg-gray-900':'bg-white'} rounded-2xl w-[90vw] max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl`}>
        <div className={`p-6 border-b ${dark?'border-gray-800':'border-gray-200'} flex items-center justify-between shrink-0`}
          style={{background:`linear-gradient(135deg,${theme.primary}15,transparent)`}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
              style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
              <i className={`bi ${isEdit?'bi-pencil-fill':'bi-plus-lg'} text-base`}></i>
            </div>
            <div>
              <h2 className={`text-lg font-bold ${dark?'text-white':'text-gray-900'}`}>
                {isEdit ? "Modifier la demande" : "Nouvelle demande d'intervention"}
              </h2>
              <p className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>
                {isEdit ? `DEM-${String(item.id).padStart(5,'0')} · Seules les demandes en attente sont modifiables` : "La date et l'heure sont enregistrées automatiquement"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${dark?'hover:bg-gray-800 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          <div className={blk}>
            <p className={sec}><i className="bi bi-car-front-fill text-blue-400"></i>Véhicule & Demandeur</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Véhicule *</label>
                <select value={form.vehicule_immatriculation}
                  onChange={e=>{set('vehicule_immatriculation',e.target.value);set('anomalie_id','');}} className={inp}>
                  <option value="">Sélectionner un véhicule</option>
                  {VEHICULES.map(v=>(
                    <option key={v.immatriculation} value={v.immatriculation}>{v.immatriculation} — {v.marque} {v.modele}</option>
                  ))}
                </select>
                {vehInfo&&(
                  <p className={`text-[10px] mt-1 ${dark?'text-gray-500':'text-gray-400'}`}>
                    <i className="bi bi-speedometer2 mr-1"></i>{vehInfo.kilometrage.toLocaleString('fr-FR')} km ·
                    <span className={`ml-1 font-semibold ${vehInfo.statut==='disponible'?'text-green-500':vehInfo.statut==='en_maintenance'?'text-orange-500':'text-red-500'}`}>
                      {vehInfo.statut.replace(/_/g,' ')}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className={lbl}>Demandeur (liste)</label>
                <select value={form.demandeur_user_id||''} onChange={e=>{set('demandeur_user_id',e.target.value?Number(e.target.value):'');if(e.target.value)set('demandeur_autre','');}} className={inp}>
                  <option value="">— Sélectionner un agent —</option>
                  {UTILISATEURS.map(u=><option key={u.id} value={u.id}>{u.nom} — {u.role_libelle}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Ou saisir un autre nom</label>
                <input type="text" value={form.demandeur_autre}
                  onChange={e=>{set('demandeur_autre',e.target.value);if(e.target.value.trim())set('demandeur_user_id','');}}
                  placeholder="Ex : Jean Dupont, visiteur, fournisseur..." className={inp}/>
                <p className={`text-[10px] mt-1 ${dark?'text-gray-500':'text-gray-400'}`}><i className="bi bi-info-circle mr-1"></i>Remplir l'un ou l'autre des deux champs.</p>
              </div>
              <div className={`col-span-2 flex items-center gap-3 px-3 py-2.5 rounded-xl border ${dark?'border-gray-700 bg-gray-800/50':'border-gray-200 bg-gray-50'}`}>
                <i className={`bi bi-clock-fill text-sm ${dark?'text-gray-500':'text-gray-400'}`}></i>
                <div className="flex-1">
                  <p className={`text-xs font-semibold ${dark?'text-gray-300':'text-gray-700'}`}>Date et heure de la demande</p>
                  <p className={`text-[11px] ${dark?'text-gray-500':'text-gray-400'}`}>Générée automatiquement à la soumission · {fmtDT(autoDate)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${dark?'bg-gray-700 text-gray-400':'bg-gray-200 text-gray-500'}`}>Auto</span>
              </div>
            </div>
          </div>

          <div className={blk}>
            <p className={sec}><i className="bi bi-tools text-amber-400"></i>Type d'intervention & Priorité</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Type maintenance</label>
                <select value={form.type_maintenance} onChange={e=>set('type_maintenance',e.target.value)} className={inp}>
                  {TYPES_MAINTENANCE.map(t=><option key={t.code} value={t.code}>{t.libelle}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Type d'intervention *</label>
                <select value={form.type_intervention} onChange={e=>set('type_intervention',e.target.value)} className={inp}>
                  <option value="">Sélectionner</option>
                  {TYPES_INTERVENTION.map(t=><option key={t.code} value={t.code}>{t.libelle}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Priorité</label>
                <select value={form.priorite} onChange={e=>set('priorite',e.target.value)} className={inp}>
                  {PRIORITES.map(p=><option key={p.code} value={p.code}>{p.libelle}</option>)}
                </select>
                {form.priorite==='urgente'&&<p className="text-[10px] mt-1 text-red-500 font-semibold"><i className="bi bi-lightning-charge-fill mr-0.5"></i>Notification immédiate</p>}
              </div>
            </div>
          </div>

          <div className={blk}>
            <p className={sec}><i className="bi bi-exclamation-triangle-fill text-red-400"></i>Anomalie liée <span className="font-normal normal-case opacity-60">(optionnel)</span></p>
            {!form.vehicule_immatriculation ? (
              <p className={`text-xs italic ${dark?'text-gray-600':'text-gray-400'}`}>Sélectionnez d'abord un véhicule.</p>
            ) : anomaliesVeh.length===0 ? (
              <p className={`text-xs italic ${dark?'text-gray-600':'text-gray-400'}`}>Aucune anomalie ouverte pour ce véhicule.</p>
            ) : (
              <select value={form.anomalie_id} onChange={e=>set('anomalie_id',e.target.value?Number(e.target.value):'')} className={inp}>
                <option value="">Aucune anomalie liée — demande spontanée</option>
                {anomaliesVeh.map(a=><option key={a.id} value={a.id}>[Sév. {a.severite}] {a.description.slice(0,65)}{a.description.length>65?'…':''}</option>)}
              </select>
            )}
          </div>

          <div className={blk}>
            <p className={sec}><i className="bi bi-chat-text-fill text-indigo-400"></i>Commentaire</p>
            <textarea rows={4} value={form.commentaire} onChange={e=>set('commentaire',e.target.value)}
              placeholder="Décrivez le problème : symptômes, contexte, lieu..."
              className={inp+' resize-none'}/>
          </div>

          {/* Rappel workflow mis à jour */}
          <div className={`${dark?'bg-blue-900/20 border-blue-800':'bg-blue-50 border-blue-200'} rounded-2xl border p-4 flex items-start gap-3`}>
            <i className="bi bi-info-circle-fill text-blue-400 text-lg mt-0.5 shrink-0"></i>
            <div>
              <p className={`text-xs font-bold mb-1 ${dark?'text-blue-300':'text-blue-700'}`}>Cycle de vie de la demande</p>
              <div className={`space-y-0.5 text-xs ${dark?'text-blue-400':'text-blue-600'}`}>
                <p><i className="bi bi-1-circle-fill mr-1.5 opacity-60"></i>La demande est soumise avec le statut <strong>En attente</strong></p>
                <p><i className="bi bi-2-circle-fill mr-1.5 opacity-60"></i>L'<strong>Admin</strong> ou le <strong>Chef de parc</strong> valide → statut <strong>En cours de traitement</strong></p>
                <p><i className="bi bi-3-circle-fill mr-1.5 opacity-60"></i>Une fois l'intervention réalisée → statut <strong>Terminé</strong></p>
                <p><i className="bi bi-x-circle-fill mr-1.5 opacity-60"></i>Si refus → statut <strong>Rejetée</strong> (avec motif obligatoire)</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-5 border-t ${dark?'border-gray-800':'border-gray-200'} flex justify-end gap-3 shrink-0`}>
          <button onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Annuler
          </button>
          <button
            onClick={()=>{
              if(!canSubmit) return;
              onSave({...form,id:item?.id,date_demande:new Date().toISOString(),demandeur_user_id:isAutre?null:form.demandeur_user_id});
            }}
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow hover:opacity-90 disabled:opacity-40"
            style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
            <i className={`bi ${isEdit?'bi-check-lg':'bi-send-fill'}`}></i>
            {isEdit ? 'Enregistrer' : 'Soumettre la demande'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Menu 3 points — mis à jour avec l'action "Terminer"
const ActionMenu = ({ item, dark, theme, onView, onEdit, onValider, onRejectQuick, onTerminer, onDelete }) => {
  const [open,setOpen]=useState(false); const [pos,setPos]=useState({top:0,left:0}); const ref=useRef(null);
  const toggle=e=>{e.stopPropagation();if(!open){const r=ref.current.getBoundingClientRect();setPos({top:r.bottom+4,left:r.right-220});}setOpen(o=>!o);};
  useEffect(()=>{ if(!open)return; const c=()=>setOpen(false); const t=setTimeout(()=>document.addEventListener('click',c,{once:true}),0); return()=>{clearTimeout(t);document.removeEventListener('click',c);}; },[open]);
  const mi=(l,ic,c,fn)=>(
    <button onClick={e=>{e.stopPropagation();fn();setOpen(false);}}
      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 ${dark?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}>
      <i className={`bi ${ic} text-base`} style={{color:c}}></i>{l}
    </button>
  );
  return (
    <>
      <button ref={ref} onClick={toggle}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${open?'text-white':dark?'text-gray-400 hover:bg-gray-700':'text-gray-400 hover:bg-gray-100'}`}
        style={open?{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}:{}}>
        <i className="bi bi-three-dots-vertical text-sm"></i>
      </button>
      {open&&ReactDOM.createPortal(
        <div onClick={e=>e.stopPropagation()}
          className={`fixed z-[9999] rounded-xl shadow-2xl border py-1.5 w-56 ${dark?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}
          style={{top:pos.top,left:pos.left,animation:'fadeInDown .15s ease-out'}}>
          {mi('Voir les détails','bi-eye-fill',theme.primary,()=>onView(item))}
          {item.statut==='en_attente'&&mi('Modifier','bi-pencil-fill',theme.primary,()=>onEdit(item))}
          {/* Valider → En cours : Admin + Chef de parc */}
          {item.statut==='en_attente'&&CURRENT_USER.can_validate&&mi('Lancer l\'intervention','bi-gear-fill','#3b82f6',()=>onValider(item.id))}
          {item.statut==='en_attente'&&CURRENT_USER.can_validate&&mi('Rejeter','bi-x-circle-fill','#ef4444',()=>onRejectQuick(item))}
          {/* Terminer → Terminé : Admin + Chef + Mécanicien */}
          {item.statut==='en_cours'&&CURRENT_USER.can_termine&&mi('Marquer Terminé','bi-check-circle-fill','#10b981',()=>onTerminer(item.id))}
          <div className={`my-1 mx-3 border-t ${dark?'border-gray-700':'border-gray-100'}`}/>
          {mi('Supprimer','bi-trash3-fill','#ef4444',()=>{if(window.confirm('Supprimer cette demande ?'))onDelete(item.id);})}
        </div>,document.body
      )}
    </>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
const DemandesIntervention = () => {
  const [dark,setDark]=useState(()=>{try{const s=localStorage.getItem('fleetify_darkMode');return s!==null?s==='true':true;}catch{return true;}});
  useEffect(()=>{try{localStorage.setItem('fleetify_darkMode',String(dark));}catch{}}, [dark]);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [showNotif,setShowNotif]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [anim,setAnim]=useState(false);
  const { theme } = useTheme();
  const navigate  = useNavigate();
  useEffect(()=>{const id=requestAnimationFrame(()=>requestAnimationFrame(()=>setAnim(true)));return()=>cancelAnimationFrame(id);},[]);

  const [demandes,setDemandes]=useState(INIT_DEMANDES);
  const [search,setSearch]=useState('');
  const [fPeriode,setFPeriode]=useState('365j');
  const [fVehicule,setFVehicule]=useState('');
  const [fStatut,setFStatut]=useState('');
  const [fPriorite,setFPriorite]=useState('');
  const [fRole,setFRole]=useState('');
  const [sortBy,setSortBy]=useState('date_demande');
  const [sortDir,setSortDir]=useState('desc');
  const [page,setPage]=useState(1);
  const [vue,setVue]=useState('table');

  const [detailItem,setDetailItem]=useState(null);
  const [editItem,setEditItem]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [rejectItem,setRejectItem]=useState(null);
  const [rejectMotif,setRejectMotif]=useState('');
  const [toast,setToast]=useState(null);
  const [exportOpen,setExportOpen]=useState(false);
  const expRef=useRef(null);

  const showToast=(msg,type='success')=>setToast({message:msg,type});
  useEffect(()=>{const h=e=>{if(expRef.current&&!expRef.current.contains(e.target))setExportOpen(false);};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);

  const IPPG=10;
  const periodeInfo=PERIODES.find(p=>p.code===fPeriode)||PERIODES[4];
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-periodeInfo.jours);

  const filtered=demandes.filter(d=>{
    if(new Date(d.date_demande)<cutoff)return false;
    if(fVehicule&&d.vehicule_immatriculation!==fVehicule)return false;
    if(fStatut&&d.statut!==fStatut)return false;
    if(fPriorite&&d.priorite!==fPriorite)return false;
    if(fRole){const dem=getUser(d.demandeur_user_id);if(dem?.role_code!==fRole)return false;}
    if(search){const q=search.toLowerCase();const dem=getUser(d.demandeur_user_id);
      return `DEM-${String(d.id).padStart(5,'0')}`.toLowerCase().includes(q)||d.vehicule_immatriculation.toLowerCase().includes(q)||(dem?.nom||'').toLowerCase().includes(q)||getTypeIntLib(d.type_intervention).toLowerCase().includes(q);}
    return true;
  });

  const sorted=[...filtered].sort((a,b)=>{
    let va=a[sortBy],vb=b[sortBy];
    if(sortBy==='date_demande'){va=new Date(va||0);vb=new Date(vb||0);}
    return sortDir==='asc'?(va<vb?-1:va>vb?1:0):(va>vb?-1:va<vb?1:0);
  });
  const totalPages=Math.ceil(sorted.length/IPPG);
  const paginated=sorted.slice((page-1)*IPPG,page*IPPG);
  useEffect(()=>setPage(1),[fVehicule,fStatut,fPriorite,fRole,search,fPeriode]);

  const hasF=fVehicule||fStatut||fPriorite||fRole||search;
  const resetF=()=>{setFVehicule('');setFStatut('');setFPriorite('');setFRole('');setSearch('');};
  const handleSort=col=>{if(sortBy===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortBy(col);setSortDir('desc');}};

  const nbEnAttente =filtered.filter(d=>d.statut==='en_attente').length;
  const nbEnCours   =filtered.filter(d=>d.statut==='en_cours').length;
  const nbTermine   =filtered.filter(d=>d.statut==='termine').length;
  const nbRejetee   =filtered.filter(d=>d.statut==='rejetee').length;
  const nbUrgEntAttente=filtered.filter(d=>d.priorite==='urgente'&&d.statut==='en_attente').length;

  // ── CRUD
  const handleSave=data=>{
    if(data.id){
      setDemandes(prev=>prev.map(d=>d.id===data.id?{...d,...data,statut:'en_attente',validee_par_user_id:null,date_validation:null,date_modification:new Date().toISOString()}:d));
      showToast('Demande mise à jour','success');
    } else {
      setDemandes(prev=>[{...data,id:Math.max(...prev.map(d=>d.id))+1,statut:'en_attente',motif_rejet:null,validee_par_user_id:null,date_validation:null,est_supprime:0,date_creation:new Date().toISOString(),date_modification:new Date().toISOString()},...prev]);
      showToast("Demande soumise — en attente de validation",'success');
    }
    setShowForm(false);setEditItem(null);
  };

  // en_attente → en_cours (anciennement "approuver")
  const handleValider=id=>{
    setDemandes(prev=>prev.map(d=>d.id===id?{...d,statut:'en_cours',validee_par_user_id:CURRENT_USER.id,date_validation:new Date().toISOString(),motif_rejet:null,date_modification:new Date().toISOString()}:d));
    showToast('Demande validée — intervention en cours de traitement','success');
  };

  // en_cours → termine
  const handleTerminer=id=>{
    setDemandes(prev=>prev.map(d=>d.id===id?{...d,statut:'termine',date_modification:new Date().toISOString()}:d));
    showToast('Intervention marquée comme terminée','success');
  };

  const handleReject=(id,motif)=>{
    setDemandes(prev=>prev.map(d=>d.id===id?{...d,statut:'rejetee',motif_rejet:motif,validee_par_user_id:CURRENT_USER.id,date_validation:new Date().toISOString(),date_modification:new Date().toISOString()}:d));
    showToast('Demande rejetée','warning');
    setRejectItem(null);setRejectMotif('');
  };
  const handleDelete=id=>{
    setDemandes(prev=>prev.filter(d=>d.id!==id));
    showToast('Demande supprimée','warning');
  };

  const expHeaders=['Référence','Date','Véhicule','Demandeur','Rôle','Type','Intervention','Priorité','Statut','Commentaire','Traité par','Date action','Motif rejet'];
  const toRow=d=>[`DEM-${String(d.id).padStart(5,'0')}`,fmtDT(d.date_demande),d.vehicule_immatriculation,getUser(d.demandeur_user_id)?.nom||'—',getUser(d.demandeur_user_id)?.role_libelle||'—',getTypeMaintInfo(d.type_maintenance).libelle,getTypeIntLib(d.type_intervention),getPrioriteInfo(d.priorite).libelle,getStatutInfo(d.statut).libelle,d.commentaire||'—',getUser(d.validee_par_user_id)?.nom||'—',fmtDT(d.date_validation),d.motif_rejet||'—'];

  const SortIc=({col})=><i className={`bi bi-arrow-${sortBy===col?(sortDir==='asc'?'up':'down'):'down-up'} text-[10px] ml-1 opacity-60`}></i>;

  const Pagination=()=>totalPages<=1?null:(
    <div className={`px-6 py-4 border-t ${dark?'border-gray-800':'border-gray-100'} flex items-center justify-between`}>
      <p className={`text-sm ${dark?'text-gray-400':'text-gray-500'}`}>{(page-1)*IPPG+1}–{Math.min(page*IPPG,sorted.length)} sur {sorted.length}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
          className={`p-2 rounded-lg ${dark?'text-gray-400 hover:bg-gray-800 disabled:opacity-30':'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
          <i className="bi bi-chevron-left"></i>
        </button>
        {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
          let p;if(totalPages<=5)p=i+1;else if(page<=3)p=i+1;else if(page>=totalPages-2)p=totalPages-4+i;else p=page-2+i;
          return <button key={p} onClick={()=>setPage(p)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold ${page===p?'text-white':dark?'text-gray-400 hover:bg-gray-800':'text-gray-600 hover:bg-gray-100'}`}
            style={page===p?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>{p}</button>;
        })}
        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
          className={`p-2 rounded-lg ${dark?'text-gray-400 hover:bg-gray-800 disabled:opacity-30':'text-gray-600 hover:bg-gray-100 disabled:opacity-30'}`}>
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${dark?'bg-gray-950':'bg-gray-50'} min-h-screen`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
      <style>{`
        @keyframes fadeInUp   {from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInDown {from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
        .rh:hover{filter:brightness(1.06);cursor:pointer}
        .ch{transition:transform .15s,box-shadow .15s}.ch:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.13)}
      `}</style>

      <Sidebar darkMode={dark} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} theme={theme} navigate={navigate}/>
      <Header  darkMode={dark} setDarkMode={setDark} sidebarCollapsed={sidebarCollapsed} theme={theme}
        showNotifications={showNotif} setShowNotifications={setShowNotif} showProfile={showProfile} setShowProfile={setShowProfile}/>

      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} theme={theme}/>}
      {(showNotif||showProfile)&&<div className="fixed inset-0 z-30" onClick={()=>{setShowNotif(false);setShowProfile(false);}}/>}

      <main className="transition-all duration-300 pt-24 px-6 pb-10" style={{marginLeft:sidebarCollapsed?'5rem':'18rem'}}>

        {/* Alerte urgences */}
        {nbUrgEntAttente>0&&(
          <div className={`mb-5 p-4 rounded-2xl border flex items-center gap-3 ${dark?'bg-red-900/20 border-red-800':'bg-red-50 border-red-200'}`}
            style={{animation:anim?'fadeInUp .4s ease-out both':'none'}}>
            <i className="bi bi-lightning-charge-fill text-red-400 text-xl shrink-0"></i>
            <div className="flex-1">
              <p className={`text-sm font-bold ${dark?'text-red-300':'text-red-700'}`}>
                {nbUrgEntAttente} demande{nbUrgEntAttente>1?'s urgentes':' urgente'} en attente de validation
              </p>
              <p className={`text-xs ${dark?'text-red-500':'text-red-400'}`}>Action immédiate requise</p>
            </div>
            <button onClick={()=>{setFPriorite('urgente');setFStatut('en_attente');}}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600">
              Voir
            </button>
          </div>
        )}

        {/* ── KPIs — 4 tuiles : En attente / En cours / Terminées / Rejetées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard label="En attente"             target={nbEnAttente} total={filtered.length} icon="bi-hourglass-split"    color="#f59e0b" sub="en attente de validation"        trend={-5}  trendLabel="du total" delay={0}    dark={dark} animate={anim}/>
          <KpiCard label="En cours de traitement" target={nbEnCours}   total={filtered.length} icon="bi-gear-fill"          color="#3b82f6" sub="interventions en cours"           trend={8}   trendLabel="du total" delay={0.07} dark={dark} animate={anim}/>
          <KpiCard label="Terminées"              target={nbTermine}   total={filtered.length} icon="bi-check-circle-fill"  color="#10b981" sub="interventions clôturées"          trend={12}  trendLabel="du total" delay={0.14} dark={dark} animate={anim}/>
          <KpiCard label="Rejetées"               target={nbRejetee}   total={filtered.length} icon="bi-x-circle-fill"      color="#ef4444" sub="demandes refusées"               trend={-2}  trendLabel="du total" delay={0.21} dark={dark} animate={anim}/>
        </div>

        {/* ── GRAPHIQUES ── */}
        {(() => {
          const topVehicules=[...new Set(demandes.map(d=>d.vehicule_immatriculation))].map(im=>({
            im, label:im.split('-').slice(0,2).join('-'),
            en_cours:  demandes.filter(d=>d.vehicule_immatriculation===im&&d.statut==='en_cours').length,
            en_attente:demandes.filter(d=>d.vehicule_immatriculation===im&&d.statut==='en_attente').length,
            total:     demandes.filter(d=>d.vehicule_immatriculation===im).length,
          })).sort((a,b)=>b.total-a.total).slice(0,6);

          const topTypes=TYPES_INTERVENTION.map(t=>({
            label:t.libelle.slice(0,8), fullLabel:t.libelle,
            v1:filtered.filter(d=>d.type_intervention===t.code&&d.type_maintenance==='corrective').length,
            v2:filtered.filter(d=>d.type_intervention===t.code&&d.type_maintenance==='preventive').length,
            l1:'Correc.',l2:'Prév.',
          })).filter(t=>t.v1+t.v2>0).sort((a,b)=>(b.v1+b.v2)-(a.v1+a.v2)).slice(0,7);

          const mois=['Jan','Fév','Mar','Avr','Mai','Jui','Jul','Aoû','Sep','Oct','Nov','Déc'];
          const now=new Date();
          const evolutionData=Array.from({length:8},(_,i)=>{
            const d=new Date(now.getFullYear(),now.getMonth()-7+i,1);
            const m=d.getMonth(), y=d.getFullYear();
            const inMonth=ds=>{const dd=new Date(ds);return dd.getMonth()===m&&dd.getFullYear()===y;};
            return {
              label:`${mois[m]}`,
              v1:demandes.filter(d=>inMonth(d.date_demande)).length,
              v2:demandes.filter(d=>inMonth(d.date_demande)&&d.statut==='termine').length,
              l1:'Total', l2:'Terminées',
            };
          });

          const gCard=`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-6`;
          const gTitle=(t,sub,ic,c)=>(
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full" style={{background:c||theme.primary}}></div>
                  <h3 className={`font-bold ${dark?'text-white':'text-gray-900'}`}>{t}</h3>
                </div>
                <p className={`text-xs mt-0.5 ml-3 ${dark?'text-gray-500':'text-gray-400'}`}>{sub}</p>
              </div>
              <i className={`bi ${ic} text-xl`} style={{color:c||theme.primary,opacity:.5}}></i>
            </div>
          );

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <div className={gCard} style={{animation:anim?'fadeInUp .5s ease-out .28s both':'none'}}>
                {gTitle('Demandes par véhicule','En cours vs En attente · top 6','bi-car-front-fill','#3b82f6')}
                <BarChart data={topVehicules.map(v=>({label:v.label,v1:v.en_cours,v2:v.en_attente,l1:'En cours',l2:'Attente'}))} dark={dark} color="#3b82f6" color2="#f59e0b" stacked={false}/>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>En cours</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-yellow-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>En attente</span></div>
                </div>
              </div>

              <div className={gCard} style={{animation:anim?'fadeInUp .5s ease-out .35s both':'none'}}>
                {gTitle("Types d'intervention",'Correctives vs Préventives','bi-tools','#ef4444')}
                <BarChart data={topTypes} dark={dark} color="#ef4444" color2="#10b981" stacked={true}/>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>Corrective</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>Préventive</span></div>
                </div>
              </div>

              <div className={gCard} style={{animation:anim?'fadeInUp .5s ease-out .42s both':'none'}}>
                {gTitle('Évolution mensuelle','Total demandes · Terminées (8 mois)','bi-graph-up',theme.primary)}
                <LineChart data={evolutionData} dark={dark} color={theme.primary} color2="#10b981"/>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 rounded-full" style={{background:theme.primary}}></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>Total</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 rounded-full bg-green-400"></div><span className={`text-[10px] ${dark?'text-gray-400':'text-gray-500'}`}>Terminées</span></div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6" style={{animation:anim?'fadeInUp .4s ease-out .05s both':'none'}}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
              <i className="bi bi-file-earmark-plus-fill text-white text-xl"></i>
            </div>
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${dark?'text-white':'text-gray-900'}`}>Demandes d'intervention</h1>
            </div>
          </div>
          {CURRENT_USER.can_create&&(
            <button onClick={()=>{setEditItem(null);setShowForm(true);}}
              className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-lg hover:opacity-90"
              style={{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}}>
              <i className="bi bi-plus-circle-fill"></i>Ajouter une nouvelle demande d'intervention
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-4 mb-6`}
          style={{animation:anim?'fadeInUp .5s ease-out .5s both':'none'}}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                [fPeriode,  setFPeriode,  PERIODES.map(p=>({value:p.code,label:p.libelle})),                                   null,             'bi-calendar-range'],
                [fVehicule, setFVehicule, VEHICULES.map(v=>({value:v.immatriculation,label:v.immatriculation})),               'Tous véhicules', 'bi-car-front-fill'],
                [fRole,     setFRole,     [{value:'chauffeur',label:'Chauffeurs'},{value:'chef_parc',label:'Chef de parc'},{value:'admin',label:'Admin'}],'Tous rôles','bi-people-fill'],
                [fPriorite, setFPriorite, PRIORITES.map(p=>({value:p.code,label:p.libelle})),                                  'Priorités',      'bi-flag-fill'],
                [fStatut,   setFStatut,   STATUTS.map(s=>({value:s.code,label:s.libelle})),                                    'Tous statuts',   'bi-circle-half'],
              ].map(([val,setter,opts,ph,ic],i)=>(
                <div key={i} className="relative">
                  <i className={`bi ${ic} absolute left-2.5 top-1/2 -translate-y-1/2 text-xs ${dark?'text-gray-500':'text-gray-400'} pointer-events-none`}></i>
                  <select value={val} onChange={e=>setter(e.target.value)}
                    className={`pl-7 pr-3 py-2 rounded-xl border text-sm font-medium appearance-none ${dark?'bg-gray-800 border-gray-700 text-white':'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none`}>
                    {ph&&<option value="">{ph}</option>}
                    {opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
              {hasF&&<button onClick={resetF} className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 ${dark?'text-red-400 hover:bg-gray-800':'text-red-500 hover:bg-red-50'}`}><i className="bi bi-x-lg text-xs"></i>Effacer</button>}
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex rounded-xl border overflow-hidden ${dark?'border-gray-700':'border-gray-200'}`}>
                {[['table','bi-table'],['cards','bi-grid-3x3-gap-fill']].map(([v,ic])=>(
                  <button key={v} onClick={()=>setVue(v)}
                    className={`p-2 text-sm ${vue===v?'text-white':dark?'text-gray-400 hover:bg-gray-800':'text-gray-500 hover:bg-gray-50'}`}
                    style={vue===v?{background:`linear-gradient(to right,${theme.primary},${theme.primaryDark})`}:{}}>
                    <i className={`bi ${ic}`}></i>
                  </button>
                ))}
              </div>
              <div className="relative">
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs ${dark?'text-gray-500':'text-gray-400'}`}></i>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Réf, véhicule, demandeur..."
                  className={`pl-8 pr-4 py-2 rounded-xl border text-sm w-52 ${dark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-gray-50 border-gray-200'} focus:outline-none`}/>
              </div>
              <div className="relative" ref={expRef}>
                <button onClick={()=>setExportOpen(!exportOpen)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <i className="bi bi-download"></i>Exporter
                </button>
                {exportOpen&&(
                  <div className={`absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl border py-2 min-w-[200px] ${dark?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                    <p className={`px-4 py-1 text-xs font-bold uppercase ${dark?'text-gray-500':'text-gray-400'}`}>{sorted.length} entrée(s)</p>
                    {[['Excel (CSV)','bi-file-earmark-spreadsheet','text-green-500',()=>{exportCSV(sorted.map(toRow),'demandes_intervention',expHeaders);showToast('Export CSV effectué','success');setExportOpen(false);}],
                      ['PDF','bi-file-earmark-pdf','text-red-500',()=>{exportPDF("Demandes d'intervention",expHeaders,sorted.map(toRow));showToast('Export PDF généré','success');setExportOpen(false);}]]
                    .map(([l,ic,cl,fn],i)=>(
                      <button key={i} onClick={fn}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 ${dark?'text-gray-300 hover:bg-gray-700':'text-gray-700 hover:bg-gray-50'}`}>
                        <i className={`bi ${ic} ${cl} text-base`}></i>{l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className={`text-xs ${dark?'text-gray-600':'text-gray-400'}`}>{sorted.length} résultat(s) affiché{sorted.length>1?'s':''}</p>
        </div>

        {/* Tableau */}
        {vue==='table'&&(
          <div className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm overflow-hidden`}
            style={{animation:anim?'fadeInUp .5s ease-out .55s both':'none'}}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`}}>
                    {[['Réf.','id'],['Date','date_demande'],['Véhicule','vehicule_immatriculation'],['Demandeur / Rôle',null],['Type',null],['Priorité','priorite'],['Statut','statut'],['Anomalie',null],['Actions',null]].map(([h,col],i)=>(
                      <th key={i} onClick={()=>col&&handleSort(col)}
                        className={`px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap ${col?'cursor-pointer hover:bg-white/10 select-none':''}`}>
                        {h}{col&&<SortIc col={col}/>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length===0?(
                    <tr><td colSpan={9} className={`text-center py-16 ${dark?'text-gray-500':'text-gray-400'}`}>
                      <i className="bi bi-file-earmark-x text-5xl block mb-3 opacity-30"></i>
                      <p className="text-sm">Aucune demande trouvée</p>
                    </td></tr>
                  ):paginated.map((item,idx)=>{
                    const pri=getPrioriteInfo(item.priorite);
                    const stat=getStatutInfo(item.statut);
                    const dem=getUser(item.demandeur_user_id);
                    const veh=getVehicule(item.vehicule_immatriculation);
                    const anom=getAnomalie(item.anomalie_id);
                    const rs=roleStyle(dem?.role_code);
                    return (
                      <tr key={item.id} className="rh transition-all"
                        style={{backgroundColor:idx%2===0?(dark?'#0c1929':'#fafafa'):(dark?'#111827':'#fff'),animation:anim?`fadeInUp .35s ease-out ${idx*.04}s both`:''}}
                        onClick={()=>setDetailItem(item)}>
                        <td className="px-4 py-4"><span className={`text-xs font-mono font-bold ${dark?'text-gray-400':'text-gray-500'}`}>DEM-{String(item.id).padStart(5,'0')}</span></td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${dark?'text-gray-100':'text-gray-900'}`}>{fmtDate(item.date_demande)}</p>
                          <p className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>{fmtRel(item.date_demande)}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className={`text-sm font-bold ${dark?'text-gray-100':'text-gray-900'}`}>{item.vehicule_immatriculation}</p>
                          <p className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>{veh?`${veh.marque} ${veh.modele}`:'—'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{background:rs.dot}}>
                              {dem?.nom.charAt(0)||'?'}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${dark?'text-gray-100':'text-gray-900'}`}>{dem?.nom||'—'}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${rs.bg}`}>{dem?.role_libelle||'—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className={`text-xs font-semibold ${dark?'text-gray-200':'text-gray-800'}`}>{getTypeIntLib(item.type_intervention)}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${getTypeMaintInfo(item.type_maintenance).bg}`}>{getTypeMaintInfo(item.type_maintenance).libelle}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pri.bg}`}><i className={`bi ${pri.icon} mr-1`}></i>{pri.libelle}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stat.bg}`}><i className={`bi ${stat.icon} mr-1`}></i>{stat.libelle}</span>
                          {item.statut==='rejetee'&&item.motif_rejet&&(
                            <p className={`text-[10px] mt-1 max-w-[130px] truncate ${dark?'text-gray-500':'text-gray-400'}`} title={item.motif_rejet}>{item.motif_rejet}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {anom?<span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 flex items-center gap-1 w-fit"><i className="bi bi-exclamation-triangle-fill"></i>Liée</span>
                            :<span className={`text-xs ${dark?'text-gray-700':'text-gray-300'}`}>—</span>}
                        </td>
                        <td className="px-4 py-4 text-center" onClick={e=>e.stopPropagation()}>
                          <ActionMenu item={item} dark={dark} theme={theme}
                            onView={it=>setDetailItem(it)}
                            onEdit={it=>{setEditItem(it);setShowForm(true);}}
                            onValider={handleValider}
                            onRejectQuick={it=>{setRejectItem(it);setRejectMotif('');}}
                            onTerminer={handleTerminer}
                            onDelete={handleDelete}/>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination/>
          </div>
        )}

        {/* Cards */}
        {vue==='cards'&&(
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.length===0?(
              <div className="col-span-full text-center py-16">
                <i className={`bi bi-file-earmark-x text-5xl block mb-3 ${dark?'text-gray-600':'text-gray-300'}`}></i>
                <p className={`text-sm ${dark?'text-gray-500':'text-gray-400'}`}>Aucune demande trouvée</p>
              </div>
            ):paginated.map((item,idx)=>{
              const pri=getPrioriteInfo(item.priorite);
              const stat=getStatutInfo(item.statut);
              const dem=getUser(item.demandeur_user_id);
              const veh=getVehicule(item.vehicule_immatriculation);
              const anom=getAnomalie(item.anomalie_id);
              const rs=roleStyle(dem?.role_code);
              return (
                <div key={item.id} onClick={()=>setDetailItem(item)}
                  className={`${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} rounded-2xl border shadow-sm p-5 cursor-pointer ch`}
                  style={{animation:anim?`fadeInUp .4s ease-out ${idx*.04}s both`:'none'}}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-xs font-mono font-bold ${dark?'text-gray-500':'text-gray-400'}`}>DEM-{String(item.id).padStart(5,'0')}</span>
                      <p className={`text-sm font-bold mt-0.5 ${dark?'text-gray-100':'text-gray-900'}`}>{getTypeIntLib(item.type_intervention)}</p>
                    </div>
                    <div onClick={e=>e.stopPropagation()}>
                      <ActionMenu item={item} dark={dark} theme={theme}
                        onView={it=>setDetailItem(it)}
                        onEdit={it=>{setEditItem(it);setShowForm(true);}}
                        onValider={handleValider}
                        onRejectQuick={it=>{setRejectItem(it);setRejectMotif('');}}
                        onTerminer={handleTerminer}
                        onDelete={handleDelete}/>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stat.bg}`}><i className={`bi ${stat.icon} mr-0.5`}></i>{stat.libelle}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pri.bg}`}>{pri.libelle}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getTypeMaintInfo(item.type_maintenance).bg}`}>{getTypeMaintInfo(item.type_maintenance).libelle}</span>
                    {anom&&<span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700"><i className="bi bi-exclamation-triangle-fill mr-0.5"></i>Anomalie</span>}
                  </div>
                  <div className={`${dark?'bg-gray-800':'bg-gray-50'} rounded-xl p-3 space-y-1.5 mb-3`}>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-car-front-fill text-xs ${dark?'text-gray-500':'text-gray-400'}`}></i>
                      <span className={`text-xs font-semibold ${dark?'text-gray-300':'text-gray-700'}`}>{item.vehicule_immatriculation}</span>
                      <span className={`text-xs ${dark?'text-gray-500':'text-gray-400'}`}>{veh?`— ${veh.marque}`:''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{background:rs.dot}}>
                        {dem?.nom.charAt(0)||'?'}
                      </div>
                      <span className={`text-xs ${dark?'text-gray-300':'text-gray-700'}`}>{dem?.nom||'—'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-auto ${rs.bg}`}>{dem?.role_libelle||'—'}</span>
                    </div>
                  </div>
                  {item.commentaire&&<p className={`text-xs italic mb-2 line-clamp-2 ${dark?'text-gray-500':'text-gray-400'}`}>"{item.commentaire}"</p>}
                  {item.statut==='rejetee'&&item.motif_rejet&&<p className="text-xs text-red-500 mb-1 line-clamp-1"><i className="bi bi-x-circle-fill mr-1"></i>{item.motif_rejet}</p>}

                  {/* Actions rapides card — en_attente */}
                  {item.statut==='en_attente'&&CURRENT_USER.can_validate&&(
                    <div className="flex gap-1.5 mt-3 pt-3" style={{borderTop:`1px solid ${dark?'#1f2937':'#f1f5f9'}`}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>handleValider(item.id)}
                        className="flex-1 py-1.5 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90"
                        style={{background:'linear-gradient(to right,#3b82f6,#2563eb)'}}>
                        <i className="bi bi-gear-fill"></i>Lancer
                      </button>
                      <button onClick={()=>{setRejectItem(item);setRejectMotif('');}}
                        className="flex-1 py-1.5 rounded-lg border border-red-300 text-red-500 text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-50">
                        <i className="bi bi-x-lg"></i>Rejeter
                      </button>
                    </div>
                  )}

                  {/* Actions rapides card — en_cours */}
                  {item.statut==='en_cours'&&CURRENT_USER.can_termine&&(
                    <div className="mt-3 pt-3" style={{borderTop:`1px solid ${dark?'#1f2937':'#f1f5f9'}`}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>handleTerminer(item.id)}
                        className="w-full py-1.5 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90"
                        style={{background:'linear-gradient(to right,#10b981,#059669)'}}>
                        <i className="bi bi-check-circle-fill"></i>Marquer Terminé
                      </button>
                    </div>
                  )}

                  <p className={`text-[10px] mt-2 ${dark?'text-gray-600':'text-gray-400'}`}>{fmtRel(item.date_demande)}</p>
                </div>
              );
            })}
            {totalPages>1&&(
              <div className="col-span-full">
                <div className={`rounded-2xl border ${dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100'} shadow-sm`}><Pagination/></div>
              </div>
            )}
          </div>
        )}

        <div className={`mt-8 py-6 border-t ${dark?'border-gray-800':'border-gray-200'} text-center`}>
          <p className={`text-sm ${dark?'text-gray-600':'text-gray-400'}`}>
            © 2026 SGS — Demandes d'intervention — Fleetify · <code className="font-mono text-xs">demandes_intervention</code>
          </p>
        </div>
      </main>

      {/* Modal rejet rapide */}
      {rejectItem&&(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${dark?'bg-gray-900':'bg-white'} rounded-2xl w-full max-w-md shadow-2xl p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <i className="bi bi-x-circle-fill text-red-500 text-xl"></i>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${dark?'text-white':'text-gray-900'}`}>Rejeter la demande</h3>
                <p className={`text-xs ${dark?'text-gray-400':'text-gray-500'}`}>DEM-{String(rejectItem.id).padStart(5,'0')} · {getTypeIntLib(rejectItem.type_intervention)}</p>
              </div>
            </div>
            <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${dark?'text-gray-400':'text-gray-500'}`}>Motif du rejet *</label>
            <textarea rows={3} value={rejectMotif} onChange={e=>setRejectMotif(e.target.value)}
              placeholder="Expliquez la raison du refus..."
              className={`w-full px-3 py-2.5 rounded-xl border text-sm resize-none focus:outline-none mb-4 ${dark?'bg-gray-800 border-gray-700 text-white placeholder-gray-500':'bg-gray-50 border-gray-200'}`}/>
            <div className="flex justify-end gap-3">
              <button onClick={()=>{setRejectItem(null);setRejectMotif('');}}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${dark?'bg-gray-800 text-gray-300 hover:bg-gray-700':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Annuler
              </button>
              <button onClick={()=>handleReject(rejectItem.id,rejectMotif)} disabled={!rejectMotif.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-40">
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {detailItem&&(
        <DetailModal
          item={detailItem} dark={dark} theme={theme}
          onClose={()=>setDetailItem(null)}
          onEdit={it=>{setEditItem(it);setShowForm(true);}}
          onValider={handleValider}
          onReject={handleReject}
          onTerminer={handleTerminer}
          onDelete={handleDelete}/>
      )}
      {showForm&&<FormModal item={editItem} dark={dark} theme={theme} onClose={()=>{setShowForm(false);setEditItem(null);}} onSave={handleSave}/>}
    </div>
  );
};

export default DemandesIntervention;