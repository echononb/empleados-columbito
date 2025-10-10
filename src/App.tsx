import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import logger from './utils/logger';

// Lazy load components for better performance
const Auth = lazy(() => import('./components/Auth'));
const EmployeeList = lazy(() => import('./components/EmployeeList'));
const EmployeeWizard = lazy(() => import('./components/EmployeeWizard'));
const ProjectList = lazy(() => import('./components/ProjectList'));
const ClientList = lazy(() => import('./components/ClientList'));
const Reports = lazy(() => import('./components/Reports'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const ApplicantList = lazy(() => import('./components/ApplicantList'));
const ApplicantForm = lazy(() => import('./components/ApplicantForm'));
const ApplicantDetail = lazy(() => import('./components/ApplicantDetail'));
const InterviewList = lazy(() => import('./components/InterviewList'));
const InterviewForm = lazy(() => import('./components/InterviewForm'));

function AppHeader() {
   const { user, logout, userRole } = useAuth();

   const handleLogout = async () => {
     try {
       await logout();
       logger.info('User logged out successfully');
     } catch (error) {
       logger.error('Error during logout', error);
     }
   };

  // Helper function to get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'administrador': return 'Administrador';
      case 'digitador': return 'Digitador';
      case 'consulta': return 'Consulta';
      default: return role;
    }
  };

  return (
    <header className="App-header">
      <h1>Empleados CPQ-Columbito</h1>
      {user && (
        <div className="header-actions">
          <nav>
            <ul>
              <li><a href="/">Empleados</a></li>
              <li><a href="/projects">Proyectos</a></li>
              <li><a href="/clients">Clientes</a></li>
              <li><a href="/applicants">Postulantes</a></li>
              <li><a href="/interviews">Entrevistas</a></li>
              {(userRole === 'digitador' || userRole === 'administrador') && (
                <li><a href="/reports">Reportes</a></li>
              )}
              {userRole === 'administrador' && (
                <li><a href="/users">Usuarios</a></li>
              )}
            </ul>
          </nav>
          <div className="user-info">
            <span>{user.email}</span>
            <span className="user-role">({getRoleDisplayName(userRole || '')})</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-small">
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function AppContent() {
  return (
    <Router>
      <div className="App">
        <AppHeader />
        <main>
           <Suspense fallback={<LoadingSpinner message="Cargando página..." />}>
             <Routes>
               <Route path="/auth" element={<Auth />} />
               <Route path="/" element={
                 <ProtectedRoute>
                   <EmployeeList />
                 </ProtectedRoute>
               } />
               <Route path="/employees/new" element={
                 <ProtectedRoute requiredRole={['digitador', 'administrador']}>
                   <EmployeeWizard />
                 </ProtectedRoute>
               } />
               <Route path="/employees/:id" element={
                 <ProtectedRoute requiredRole={['digitador', 'administrador']}>
                   <EmployeeWizard />
                 </ProtectedRoute>
               } />
               <Route path="/projects" element={
                 <ProtectedRoute>
                   <ProjectList />
                 </ProtectedRoute>
               } />
               <Route path="/clients" element={
                 <ProtectedRoute>
                   <ClientList />
                 </ProtectedRoute>
               } />
               <Route path="/reports" element={
                 <ProtectedRoute requiredRole={['digitador', 'administrador']}>
                   <Reports />
                 </ProtectedRoute>
               } />
               <Route path="/users" element={
                 <ProtectedRoute requiredRole="administrador">
                   <UserManagement />
                 </ProtectedRoute>
               } />
               <Route path="/applicants" element={
                 <ProtectedRoute>
                   <ApplicantList />
                 </ProtectedRoute>
               } />
               <Route path="/applicants/new" element={
                 <ProtectedRoute>
                   <ApplicantForm />
                 </ProtectedRoute>
               } />
               <Route path="/applicants/:id" element={
                 <ProtectedRoute>
                   <ApplicantDetail />
                 </ProtectedRoute>
               } />
               <Route path="/applicants/:id/edit" element={
                 <ProtectedRoute>
                   <ApplicantForm />
                 </ProtectedRoute>
               } />
               <Route path="/interviews" element={
                 <ProtectedRoute>
                   <InterviewList />
                 </ProtectedRoute>
               } />
               <Route path="/interviews/new" element={
                 <ProtectedRoute>
                   <InterviewForm />
                 </ProtectedRoute>
               } />
               <Route path="/interviews/:id" element={
                 <ProtectedRoute>
                   <InterviewForm />
                 </ProtectedRoute>
               } />
             </Routes>
           </Suspense>
         </main>
      </div>
    </Router>
  );
}

function App() {
   return (
     <ErrorBoundary>
       <AuthProvider>
         <AppContent />
       </AuthProvider>
     </ErrorBoundary>
   );
}

export default App;
