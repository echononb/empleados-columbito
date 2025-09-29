import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import EmployeeList from './components/EmployeeList';
import EmployeeWizard from './components/EmployeeWizard';
import ProjectList from './components/ProjectList';
import ClientList from './components/ClientList';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';

function AppHeader() {
  const { user, logout, userRole } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
