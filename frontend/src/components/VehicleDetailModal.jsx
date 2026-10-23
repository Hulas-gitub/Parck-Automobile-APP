import React from 'react';

/**
 * Composant Modal Détail Véhicule
 * Affiche l'ensemble des informations, documents, historique d'entretien, missions et stats d'un véhicule.
 */
export const VehicleDetailModal = ({
  show,
  vehicle,
  darkMode,
  theme = {},
  canWrite = false,
  detailTab = 'general',
  setDetailTab,
  loadingDetail = false,
  vehicleDocuments = [],
  vehicleMaintenances = [],
  vehicleMissions = [],
  vehicleStats = null,
  getStatutColor = () => 'bg-gray-100 text-gray-700',
  onClose,
  onOpenEdit,
  onAddDocument,
  onOpenDocument,
  onEditDocument,
  onDeleteDocument,
  StableImage,
}) => {
  if (!show || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full max-w-[95vw] overflow-hidden flex flex-col shadow-2xl`}
        style={{ height: '92vh' }}
      >
        {/* Entête du modal */}
        <div
          className="flex items-center justify-between px-6 py-3 flex-shrink-0"
          style={{ background: `linear-gradient(to right, ${theme.primary || '#3b82f6'}, ${theme.primaryDark || '#1d4ed8'})` }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-extrabold text-white tracking-tight">{vehicle.immatriculation}</h2>
            <span className="text-white/70 text-sm">·</span>
            <span className="text-white/90 text-sm font-bold">
              {vehicle.marque} {vehicle.modele} · {vehicle.annee}
            </span>
            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-extrabold ${getStatutColor(vehicle.statut)}`}>
              {vehicle.statut}
            </span>
            {vehicle.ville && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1">
                <i className="bi bi-geo-alt-fill text-[10px]"></i>
                {vehicle.ville}
              </span>
            )}
            {vehicle.affectation && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1">
                <i className="bi bi-tag-fill text-[10px]"></i>
                {vehicle.affectation}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <i className="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        {/* Corps du modal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Panneau gauche : Image & infos clés */}
          <div
            className={`flex flex-col border-r overflow-y-auto ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}
            style={{ width: '50%' }}
          >
            <div
              className="flex-shrink-0 p-5"
              style={{ background: darkMode ? 'linear-gradient(135deg, #0c1929, #162033)' : 'linear-gradient(135deg, #1e293b, #334155)' }}
            >
              <div
                className="relative overflow-hidden"
                style={{
                  height: '300px',
                  borderRadius: '16px',
                  border: `3px solid ${theme.primary || '#3b82f6'}55`,
                  boxShadow: `0 0 30px ${theme.primary || '#3b82f6'}33, 0 8px 32px rgba(0,0,0,0.4)`,
                }}
              >
                {StableImage ? (
                  <StableImage
                    src={vehicle.image}
                    alt={`${vehicle.marque} ${vehicle.modele}`}
                    className="w-full h-full"
                    darkMode={darkMode}
                    clickable={true}
                  />
                ) : (
                  <img
                    src={vehicle.image || ''}
                    alt={`${vehicle.marque} ${vehicle.modele}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-white text-base font-extrabold drop-shadow">
                    {vehicle.marque} {vehicle.modele}
                  </p>
                  <p className="text-gray-300 text-sm font-semibold">
                    {vehicle.categorie} · {vehicle.couleur}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-5 space-y-3 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              {[
                { icon: 'bi-upc-scan',     label: 'N° Châssis',       value: vehicle.numero_chassis || '—' },
                { icon: 'bi-speedometer2', label: 'Kilométrage',       value: `${(vehicle.kilometrage || 0).toLocaleString()} km` },
                { icon: 'bi-people',       label: 'Nb. places',        value: vehicle.nb_places || '—' },
                { icon: 'bi-building',     label: 'Direction',         value: vehicle.direction },
                { icon: 'bi-geo-alt-fill', label: 'Ville',             value: vehicle.ville || '—' },
                { icon: 'bi-tag-fill',     label: 'Affectation',       value: vehicle.affectation || '—' },
                { icon: 'bi-person-badge', label: 'Responsable',       value: vehicle.responsable_du_vehicule || '—' },
                { icon: 'bi-fuel-pump',    label: 'Carburant',         value: vehicle.carburant || '—' },
                { icon: 'bi-graph-up',     label: 'Conso. moy.',       value: vehicle.consommation_moyenne ? `${vehicle.consommation_moyenne} L/100` : '—' },
                { icon: 'bi-wrench',       label: 'Km proch. vidange', value: vehicle.km_prochaine_vidange ? `${parseInt(vehicle.km_prochaine_vidange).toLocaleString()} km` : '—' },
                { icon: 'bi-calendar3',    label: "Date d'achat",      value: vehicle.dateAchat ? new Date(vehicle.dateAchat).toLocaleDateString('fr-FR') : '—' },
                { icon: 'bi-cash-stack',   label: "Coût acquisition",  value: vehicle.cout_acquisition ? `${vehicle.cout_acquisition.toLocaleString()} CFA` : '—' },
                { icon: 'bi-bank',         label: 'Valeur résiduelle', value: vehicle.valeur_residuelle ? `${vehicle.valeur_residuelle.toLocaleString()} CFA` : '—' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <i className={`${item.icon} text-base w-5 text-center`} style={{ color: theme.primary || '#3b82f6' }}></i>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</span>
                    <span className={`text-sm font-extrabold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5">
              <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-4 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <i className="bi bi-calendar-event text-orange-400"></i>Échéances importantes
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Assurance',        value: vehicle.assuranceExpire ? new Date(vehicle.assuranceExpire).toLocaleDateString('fr-FR') : '—', icon: 'bi-shield-check',    color: 'text-emerald-400' },
                  { label: 'Visite technique', value: vehicle.visiteExpire    ? new Date(vehicle.visiteExpire).toLocaleDateString('fr-FR')    : '—', icon: 'bi-clipboard-check', color: 'text-blue-400' },
                  { label: 'Inspecteur',       value: vehicle.assuranceExpire ? new Date(vehicle.visiteExpire).toLocaleDateString('fr-FR')    : '—', icon: 'bi-clipboard-check', color: 'text-blue-400' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-orange-50'}`}>
                    <div className="flex items-center gap-2">
                      <i className={`${item.icon} text-lg ${item.color}`}></i>
                      <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</span>
                    </div>
                    <span className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panneau droit : Onglets & Contenus */}
          <div className="flex flex-col overflow-hidden" style={{ width: '50%' }}>
            <div className={`flex gap-1 px-5 border-b flex-shrink-0 ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex-wrap`}>
              {[
                { key: 'general',      label: 'Général',     icon: 'bi-info-circle' },
                { key: 'documents',    label: 'Documents',   icon: 'bi-file-earmark-text' },
                { key: 'maintenance',  label: 'Maintenance', icon: 'bi-tools' },
                { key: 'missions',     label: 'Missions',    icon: 'bi-geo-alt' },
                { key: 'statistiques', label: 'Stats',       icon: 'bi-bar-chart' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab && setDetailTab(tab.key)}
                  className={`px-3 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                    detailTab === tab.key
                      ? 'border-transparent text-white'
                      : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                  style={
                    detailTab === tab.key
                      ? {
                          background: `linear-gradient(to right, ${theme.primary || '#3b82f6'}, ${theme.primaryDark || '#1d4ed8'})`,
                          borderRadius: '8px 8px 0 0',
                        }
                      : {}
                  }
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loadingDetail ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chargement...</p>
                  </div>
                </div>
              ) : (
                <>
                  {detailTab === 'general' && (
                    <div className="space-y-4">
                      {[
                        {
                          title: 'Informations véhicule',
                          icon: 'bi-car-front',
                          iconColor: 'text-blue-500',
                          bg: darkMode ? 'bg-gray-800' : 'bg-blue-50',
                          fields: [
                            ['Immatriculation', vehicle.immatriculation],
                            ['N° Châssis', vehicle.numero_chassis || '—'],
                            ['Marque', vehicle.marque],
                            ['Modèle', vehicle.modele],
                            ['Catégorie', vehicle.categorie],
                            ['Année', vehicle.annee],
                            ['Couleur', vehicle.couleur || '—'],
                            ['Carburant', vehicle.carburant || '—'],
                            ['Nombre de places', vehicle.nb_places || '—'],
                            ['Kilométrage', `${(vehicle.kilometrage || 0).toLocaleString()} km`],
                            ['Conso. moy.', vehicle.consommation_moyenne ? `${vehicle.consommation_moyenne} L/100` : '—'],
                            ['Km proch. vidange', vehicle.km_prochaine_vidange ? `${parseInt(vehicle.km_prochaine_vidange).toLocaleString()} km` : '—'],
                          ],
                        },
                        {
                          title: 'Affectation & Responsabilité',
                          icon: 'bi-people',
                          iconColor: 'text-purple-500',
                          bg: darkMode ? 'bg-gray-800' : 'bg-purple-50',
                          fields: [
                            ['Direction', vehicle.direction],
                            ['Ville', vehicle.ville || '—'],
                            ['Affectation', vehicle.affectation || '—'],
                            ['Responsable', vehicle.responsable_du_vehicule || '—'],
                            ['Statut', vehicle.statut],
                          ],
                        },
                        {
                          title: 'Informations financières',
                          icon: 'bi-currency-dollar',
                          iconColor: 'text-green-500',
                          bg: darkMode ? 'bg-gray-800' : 'bg-green-50',
                          fields: [
                            ["Date d'achat", vehicle.dateAchat ? new Date(vehicle.dateAchat).toLocaleDateString('fr-FR') : '—'],
                            ["Coût d'acquisition", vehicle.cout_acquisition ? `${vehicle.cout_acquisition.toLocaleString()} CFA` : '—'],
                            ['Valeur résiduelle', vehicle.valeur_residuelle ? `${vehicle.valeur_residuelle.toLocaleString()} CFA` : '—'],
                          ],
                        },
                      ].map((card, ci) => (
                        <div key={ci} className={`${card.bg} rounded-xl p-4`}>
                          <h3 className={`font-extrabold mb-3 flex items-center gap-2 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <i className={`${card.icon} ${card.iconColor}`}></i>
                            {card.title}
                          </h3>
                          <div className="space-y-2">
                            {card.fields.map(([label, value], fi) => (
                              <div key={fi} className="flex justify-between">
                                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
                                <span className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab === 'documents' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Documents du véhicule
                          {vehicleDocuments.length > 0 && (
                            <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                              {vehicleDocuments.length}
                            </span>
                          )}
                        </h3>
                        {canWrite && (
                          <button
                            onClick={onAddDocument}
                            className="px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2"
                            style={{ background: `linear-gradient(to right, ${theme.primary || '#3b82f6'}, ${theme.primaryDark || '#1d4ed8'})` }}
                          >
                            <i className="bi bi-plus-lg"></i>Ajouter
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {vehicleDocuments.length === 0 ? (
                          <div className="text-center py-12">
                            <i className={`bi bi-file-earmark-x text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                            <p className={`mt-3 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucun document enregistré</p>
                            {canWrite && (
                              <button
                                onClick={onAddDocument}
                                className="mt-3 px-4 py-2 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all inline-flex items-center gap-2"
                                style={{ background: `linear-gradient(to right, ${theme.primary || '#3b82f6'}, ${theme.primaryDark || '#1d4ed8'})` }}
                              >
                                <i className="bi bi-plus-lg"></i>Ajouter le premier document
                              </button>
                            )}
                          </div>
                        ) : (
                          vehicleDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4 flex items-center justify-between border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
                                  <i className="bi bi-file-earmark-text text-lg text-blue-500"></i>
                                </div>
                                <div className="min-w-0">
                                  <p className={`font-extrabold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{doc.nom_document}</p>
                                  <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {doc.type_document} · Expire : {doc.date_expiration ? new Date(doc.date_expiration).toLocaleDateString('fr-FR') : '—'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    doc.statut === 'valide'
                                      ? 'bg-green-100 text-green-700'
                                      : doc.statut === 'expire_bientot'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {doc.statut}
                                </span>
                                <button
                                  onClick={() => onOpenDocument && onOpenDocument(doc)}
                                  className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'} transition-colors`}
                                  title="Ouvrir"
                                >
                                  <i className="bi bi-eye text-sm"></i>
                                </button>
                                {canWrite && (
                                  <>
                                    <button
                                      onClick={() => onEditDocument && onEditDocument(doc)}
                                      className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-amber-900/40 text-amber-400 hover:text-amber-300' : 'hover:bg-amber-50 text-amber-500 hover:text-amber-700'} transition-colors`}
                                      title="Modifier"
                                    >
                                      <i className="bi bi-pencil-square text-sm"></i>
                                    </button>
                                    <button
                                      onClick={() => onDeleteDocument && onDeleteDocument(doc)}
                                      className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-500'} transition-colors`}
                                      title="Supprimer"
                                    >
                                      <i className="bi bi-trash text-sm"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === 'maintenance' && (
                    <div>
                      <h3 className={`font-extrabold text-sm mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Historique de maintenance</h3>
                      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} rounded-xl border overflow-hidden`}>
                        {vehicleMaintenances.length === 0 ? (
                          <div className="text-center py-12">
                            <i className={`bi bi-tools text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                            <p className={`mt-3 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune maintenance enregistrée</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr style={{ background: `linear-gradient(135deg, ${theme.primary || '#3b82f6'}, ${theme.primaryDark || '#1d4ed8'})` }}>
                                  {['Type', 'Date', 'Km', 'Coût', 'Statut'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wider text-white">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {vehicleMaintenances.map((m, idx) => (
                                  <tr
                                    key={m.id}
                                    style={{
                                      backgroundColor:
                                        idx % 2 === 0
                                          ? darkMode ? '#0c1929' : '#e8eef6'
                                          : darkMode ? '#162033' : '#f1f4f9',
                                    }}
                                  >
                                    <td className={`px-4 py-3 text-sm font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{m.type_intervention}</td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {m.date_debut ? new Date(m.date_debut).toLocaleDateString('fr-FR') : '—'}
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {m.km_au_moment_intervention?.toLocaleString() ?? '—'} km
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {((m.cout_main_oeuvre || 0) + (m.cout_pieces || 0)).toLocaleString()} CFA
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                          m.statut === 'terminee'
                                            ? 'bg-green-100 text-green-700'
                                            : m.statut === 'planifiee'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-orange-100 text-orange-700'
                                        }`}
                                      >
                                        {m.statut}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === 'missions' && (
                    <div>
                      <h3 className={`font-extrabold text-sm mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Historique des missions</h3>
                      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} rounded-xl border overflow-hidden`}>
                        {vehicleMissions.length === 0 ? (
                          <div className="text-center py-12">
                            <i className={`bi bi-geo-alt text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                            <p className={`mt-3 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune mission enregistrée</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr style={{ background: `linear-gradient(135deg, ${theme.primary || '#3b82f6'}, ${theme.primaryDark || '#1d4ed8'})` }}>
                                  {['Destination', 'Départ', 'Retour', 'Statut'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wider text-white">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {vehicleMissions.map((m, idx) => (
                                  <tr
                                    key={m.id}
                                    style={{
                                      backgroundColor:
                                        idx % 2 === 0
                                          ? darkMode ? '#0c1929' : '#e8eef6'
                                          : darkMode ? '#162033' : '#f1f4f9',
                                    }}
                                  >
                                    <td className={`px-4 py-3 text-sm font-extrabold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{m.destination}</td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {m.date_depart_prevue ? new Date(m.date_depart_prevue).toLocaleDateString('fr-FR') : '—'}
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {m.date_retour_reelle ? new Date(m.date_retour_reelle).toLocaleDateString('fr-FR') : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                          m.statut === 'terminee'
                                            ? 'bg-green-100 text-green-700'
                                            : m.statut === 'en_cours'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                        }`}
                                      >
                                        {m.statut}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === 'statistiques' && (
                    <div>
                      <h3 className={`font-extrabold mb-4 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Statistiques du véhicule</h3>
                      {vehicleStats ? (
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Total missions',   value: vehicleStats.total_missions,                                    icon: 'bi-geo-alt-fill',   iconColor: 'text-blue-500',   iconBg: 'bg-blue-500/20',   bg: darkMode ? 'bg-gray-800' : 'bg-blue-50' },
                            { label: 'KM parcourus',     value: (vehicleStats.total_km || 0).toLocaleString(),                  icon: 'bi-speedometer2',   iconColor: 'text-green-500',  iconBg: 'bg-green-500/20',  bg: darkMode ? 'bg-gray-800' : 'bg-green-50' },
                            { label: 'Carburant total',  value: `${vehicleStats.total_litres || 0} L`,                          icon: 'bi-fuel-pump-fill', iconColor: 'text-yellow-500', iconBg: 'bg-yellow-500/20', bg: darkMode ? 'bg-gray-800' : 'bg-yellow-50' },
                            { label: 'Conso. moy.',      value: `${vehicleStats.consommation_moyenne || 0} L/100`,              icon: 'bi-graph-up',       iconColor: 'text-purple-500', iconBg: 'bg-purple-500/20', bg: darkMode ? 'bg-gray-800' : 'bg-purple-50' },
                            { label: 'Coût maintenance', value: `${(vehicleStats.cout_maintenance || 0).toLocaleString()} CFA`, icon: 'bi-tools',          iconColor: 'text-orange-500', iconBg: 'bg-orange-500/20', bg: darkMode ? 'bg-gray-800' : 'bg-orange-50' },
                            { label: 'Coût total',       value: `${(vehicleStats.cout_total || 0).toLocaleString()} CFA`,       icon: 'bi-cash-stack',     iconColor: 'text-red-500',    iconBg: 'bg-red-500/20',    bg: darkMode ? 'bg-gray-800' : 'bg-red-50' },
                          ].map((card, i) => (
                            <div key={i} className={`${card.bg} rounded-xl p-4`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
                                  <p className={`text-xl font-extrabold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
                                </div>
                                <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                                  <i className={`${card.icon} ${card.iconColor} text-lg`}></i>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <i className={`bi bi-bar-chart text-5xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                          <p className={`mt-3 text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Aucune statistique disponible</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pied du panneau droit */}
            <div className={`px-5 py-4 border-t flex-shrink-0 flex items-center justify-end gap-3 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              {canWrite && (
                <button
                  onClick={() => onOpenEdit && onOpenEdit(vehicle)}
                  className={`px-5 py-2.5 rounded-lg border text-sm font-bold flex items-center gap-2 ${
                    darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <i className="bi bi-pencil"></i>Modifier
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-all"
                style={{ background: `linear-gradient(to right, ${theme.primary || '#3b82f6'}, ${theme.primaryDark || '#1d4ed8'})` }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailModal;
