import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './Auth/Login';
import Dashboard from './Navigation/Dashboard';
import Theme from './Navigation/Theme';
import Utilisateurs from './Navigation/Utilisateurs';
import Vehicules from './Navigation/Vehicules';
import Interventions from './Navigation/Interventions';
import FournisseursOutils from './Navigation/FournisseursOutils';
import InspectionVehicules from './Navigation/InspectionVehicules';
import Chauffeurs from './Navigation/Chauffeurs';
import MonProfil from './Profils/MonProfil';
import Activitesysteme from './Navigation/ActiviteSysteme';
import HistoriqueConnexion from './Navigation/HistoriqueConnexion';
import Accidents from './Navigation/Accidents';
import Missions from './Navigation/Missions';
import DemandesInterventions from './Navigation/DemandesInterventions';
import InterventionsVehicules from './Navigation/InterventionsVehicules';
import CarnetCarburant from './Navigation/CarnetCarburant';
import HistoriqueVehicule from './Navigation/HistoriqueVehicule';
import Notifications from './Navigation/Notifications';

// Composant pour protéger les routes avec contrôle d'accès basé sur les rôles (RBAC)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/Login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      const roleCode = user?.role?.code;

      // L'administrateur a accès à tout par défaut
      if (roleCode && roleCode !== 'admin' && !allowedRoles.includes(roleCode)) {
        return <Navigate to="/Navigation/Dashboard" replace />;
      }
    } catch {
      return <Navigate to="/Login" replace />;
    }
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Route par défaut - redirige vers login */}
          <Route path="/" element={<Navigate to="/Login" replace />} />
          
          {/* Route publique */}
          <Route path="/Login" element={<Login />} />
          <Route path="/login" element={<Navigate to="/Login" replace />} />

          {/* Profil utilisateur (tous les utilisateurs connectés) */}
          <Route 
            path="/Profils/Monprofil" 
            element={
              <ProtectedRoute>
                <MonProfil />
              </ProtectedRoute>
            } 
          />

          {/* Tableau de bord (Admin, Chef Parc, DAAL) */}
          <Route 
            path="/Navigation/Dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'daal']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/admin/Navigation/Dashboard" element={<Navigate to="/Navigation/Dashboard" replace />} />
          <Route path="/Admin/Navigation/Dashboard" element={<Navigate to="/Navigation/Dashboard" replace />} />

          {/* Gestion des Véhicules */}
          <Route 
            path="/Navigation/Vehicules" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'daal']}>
                <Vehicules />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/Vehicules" element={<Navigate to="/Navigation/Vehicules" replace />} />

          {/* Documents Véhicules */}
          <Route 
            path="/Navigation/HistoriqueVehicule" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'daal']}>
                <HistoriqueVehicule />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/HistoriqueVehicule" element={<Navigate to="/Navigation/HistoriqueVehicule" replace />} />

          {/* Carnet Carburant */}
          <Route 
            path="/Navigation/CarnetCarburant" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc']}>
                <CarnetCarburant />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/CarnetCarburant" element={<Navigate to="/Navigation/CarnetCarburant" replace />} />

          {/* Gestion des Utilisateurs (Admin uniquement) */}
          <Route 
            path="/Navigation/Utilisateurs" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Utilisateurs />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/Utilisateurs" element={<Navigate to="/Navigation/Utilisateurs" replace />} />

          {/* Gestion des Chauffeurs */}
          <Route 
            path="/Navigation/Chauffeurs" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc']}>
                <Chauffeurs />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/Chauffeurs" element={<Navigate to="/Navigation/Chauffeurs" replace />} />

          {/* Missions */}
          <Route 
            path="/Navigation/Missions" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'chef_tf', 'chauffeur']}>
                <Missions />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/Missions" element={<Navigate to="/Navigation/Missions" replace />} />

          {/* Demandes d'Intervention */}
          <Route 
            path="/Navigation/DemandesInterventions" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'daal', 'mecanicien', 'chauffeur']}>
                <DemandesInterventions />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/DemandesInterventions" element={<Navigate to="/Navigation/DemandesInterventions" replace />} />

          {/* Interventions Véhicules */}
          <Route 
            path="/Navigation/InterventionsVehicules" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'mecanicien', 'daal']}>
                <InterventionsVehicules />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/InterventionsVehicules" element={<Navigate to="/Navigation/InterventionsVehicules" replace />} />

          {/* Référentiels Interventions */}
          <Route 
            path="/Navigation/Interventions" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'mecanicien', 'daal']}>
                <Interventions />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/Interventions" element={<Navigate to="/Navigation/Interventions" replace />} />

          {/* Inspections Véhicules */}
          <Route 
            path="/Navigation/InspectionVehicules" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'mecanicien', 'chauffeur']}>
                <InspectionVehicules />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/InspectionVehicules" element={<Navigate to="/Navigation/InspectionVehicules" replace />} />

          {/* Fournisseurs & Outils */}
          <Route 
            path="/Navigation/FournisseursOutils" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'mecanicien']}>
                <FournisseursOutils />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/FournisseursOutils" element={<Navigate to="/Navigation/FournisseursOutils" replace />} />

          {/* Accidents & Sinistres */}
          <Route 
            path="/Navigation/Accidents" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'chef_parc', 'chef_tf']}>
                <Accidents />
              </ProtectedRoute>
            } 
          />
          <Route path="/admin/Navigation/Accidents" element={<Navigate to="/Navigation/Accidents" replace />} />
          <Route path="/Admin/Navigation/Accidents" element={<Navigate to="/Navigation/Accidents" replace />} />

          {/* Activités Système / Journal d'audit (Admin uniquement) */}
          <Route 
            path="/Navigation/ActiviteSysteme" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Activitesysteme />
              </ProtectedRoute>
            } 
          />
          <Route path="/admin/Navigation/Activitesysteme" element={<Navigate to="/Navigation/ActiviteSysteme" replace />} />
          <Route path="/Admin/Navigation/ActiviteSysteme" element={<Navigate to="/Navigation/ActiviteSysteme" replace />} />

          {/* Historique des Connexions (Admin uniquement) */}
          <Route 
            path="/Navigation/HistoriqueConnexion" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HistoriqueConnexion />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/HistoriqueConnexion" element={<Navigate to="/Navigation/HistoriqueConnexion" replace />} />

          {/* Paramètres de Thème (Admin uniquement) */}
          <Route 
            path="/Navigation/Theme" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Theme />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/Theme" element={<Navigate to="/Navigation/Theme" replace />} />

          {/* Notifications (Admin uniquement) */}
          <Route 
            path="/Navigation/Notifications" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Notifications />
              </ProtectedRoute>
            } 
          />
          <Route path="/Admin/Navigation/Notifications" element={<Navigate to="/Navigation/Notifications" replace />} />

          {/* Route 404 */}
          <Route 
            path="*" 
            element={
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{ fontSize: '72px', margin: '0', color: '#000000' }}>404</h1>
                  <p  style={{ fontSize: '18px', color: '#6B7280' }}>Page non trouvée</p>
                  <a 
                    href="/Login" 
                    style={{
                      display: 'inline-block',
                      marginTop: '20px',
                      padding: '10px 24px',
                      backgroundColor: '#000000',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: '500'
                    }}
                  >
                    Retour à l'accueil
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;