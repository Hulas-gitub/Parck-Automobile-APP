import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './Auth/Login';
import Dashboard from './Admin/Navigation/Dashboard';
import Theme from './Admin/Navigation/Theme';
import Utilisateurs from './Admin/Navigation/Utilisateurs';
import Vehicules from './Admin/Navigation/Vehicules';
import Interventions from './Admin/Navigation/Interventions';
import FournisseursOutils from './Admin/Navigation/FournisseursOutils';
import InspectionVehicules from './Admin/Navigation/InspectionVehicules';
import Chauffeurs from './Admin/Navigation/Chauffeurs';
import MonProfil from './Profils/MonProfil';
import Activitesysteme from './Admin/Navigation/ActiviteSysteme';
import HistoriqueConnexion from './Admin/Navigation/HistoriqueConnexion';
import Accidents from './Admin/Navigation/Accidents';
import Missions from './Admin/Navigation/Missions';
import DemandesInterventions from './Admin/Navigation/DemandesInterventions';
import InterventionsVehicules from './Admin/Navigation/InterventionsVehicules';
// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
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
          
          {/* Routes protégées - Dashboard Admin */}
          <Route 
            path="/admin/Navigation/Dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
              {/* Route protégée - Gestion des Thèmes */}
          <Route 
            path="/Admin/Navigation/Missions"
            element={
              <ProtectedRoute>
                <Missions />
              </ProtectedRoute>
            } 
          />
          {/* Route protégée - Gestion des Thèmes */}
          <Route 
            path="/Admin/Navigation/InterventionsVehicules"
            element={
              <ProtectedRoute>
                <InterventionsVehicules />
              </ProtectedRoute>
            } 
          />
             <Route 
            path="/Admin/Navigation/DemandesInterventions"
            element={
              <ProtectedRoute>
                <DemandesInterventions />
              </ProtectedRoute>
            } 
          />
          {/* Routes protégées - Dashboard Admin */}
          <Route 
            path="/admin/Navigation/Accidents" 
            element={
              <ProtectedRoute>
                <Accidents/>
              </ProtectedRoute>
            } 
          />
            <Route 
            path="/admin/Navigation/Activitesysteme" 
            element={
              <ProtectedRoute>
                <Activitesysteme/>
              </ProtectedRoute>
            } 
          />
          {/* Routes protégées - Navigation */}
            <Route  path="/Profils/Monprofil"
            element={
              <ProtectedRoute>
                <MonProfil/>
              </ProtectedRoute>
            } 
          />

          {/* Route protégée - Gestion des Utilisateurs */}
          <Route 
            path="/Admin/Navigation/Utilisateurs"
            element={
              <ProtectedRoute>
                <Utilisateurs />
              </ProtectedRoute>
            } 
          />
          
               {/* Route protégée - Gestion des Utilisateurs */}
          <Route 
            path="/Admin/Navigation/HistoriqueConnexion"
            element={
              <ProtectedRoute>
                <HistoriqueConnexion/>
              </ProtectedRoute>
            } 
          />
              {/* Route protégée - Gestion des Vehicules */}
          <Route 
            path="/Admin/Navigation/Vehicules"
            element={
              <ProtectedRoute>
                <Vehicules />
              </ProtectedRoute>
            } 
          />

         {/* Route protégée - Gestion des Interventions*/}
          <Route 
            path="/Admin/Navigation/Interventions"
            element={
              <ProtectedRoute>
                <Interventions/>
              </ProtectedRoute>
            } 
          />
   {/* Route protégée - Gestion des InspectionVehicules*/}
          <Route 
            path="/Admin/Navigation/InspectionVehicules"
            element={
              <ProtectedRoute>
                <InspectionVehicules/>
              </ProtectedRoute>
            } 
          />
   {/* Route protégée - Gestion des Fournisseurs-Outils */}
          <Route 
            path="/Admin/Navigation/FournisseursOutils"
            element={
              <ProtectedRoute>
                <FournisseursOutils/>
              </ProtectedRoute>
            } 
          />

  {/* Route protégée - Gestion des Fournisseurs-Outils */}
          <Route 
            path="/Admin/Navigation/Chauffeurs"
            element={
              <ProtectedRoute>
                <Chauffeurs/>
              </ProtectedRoute>
            } 
          />

          {/* Route protégée - Gestion des Thèmes */}
          <Route 
            path="/Admin/Navigation/Theme"
            element={
              <ProtectedRoute>
                <Theme />
              </ProtectedRoute>
            } 
          />
         
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
                  <h1 style={{ fontSize: '72px', margin: '0', color: '#ffc400' }}>404</h1>
                  <p  style={{ fontSize: '18px', color: '#6B7280' }}>Page non trouvée</p>
                  <a 
                    href="/Login" 
                    style={{
                      display: 'inline-block',
                      marginTop: '20px',
                      padding: '10px 24px',
                      backgroundColor: '#ffc400',
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