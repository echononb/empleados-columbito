import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'consulta' | 'digitador' | 'administrador' | ('consulta' | 'digitador' | 'administrador')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Verificando autenticación...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const hasAccess = Array.isArray(requiredRole)
      ? requiredRole.includes(userRole as 'consulta' | 'digitador' | 'administrador')
      : userRole === requiredRole;

    if (!hasAccess) {
      const requiredRolesText = Array.isArray(requiredRole)
        ? requiredRole.join(' o ')
        : requiredRole;

      return (
        <div className="loading-container">
          <div className="error-message">
            No tienes permisos para acceder a esta sección.
            <br />
            Rol requerido: {requiredRolesText}
            <br />
            Tu rol actual: {userRole || 'Sin rol asignado'}
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;