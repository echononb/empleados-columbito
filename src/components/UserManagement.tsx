import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  lastLogin?: string;
  createdAt?: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser, updateUserRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    // In a real app, this would fetch users from Firebase Auth Admin SDK
    // For now, we'll simulate with localStorage data
    const mockUsers: User[] = [
      {
        uid: 'user1',
        email: 'admin@columbito.com',
        role: 'admin',
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        uid: 'user2',
        email: 'usuario@empresa.com',
        role: 'user',
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        uid: 'user3',
        email: 'jefe@construccion.com',
        role: 'user',
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Load roles from localStorage
    const usersWithRoles = mockUsers.map(user => ({
      ...user,
      role: (localStorage.getItem(`userRole_${user.uid}`) as 'admin' | 'user') ||
            (user.email === 'admin@columbito.com' ? 'admin' : 'user')
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    if (userId === currentUser?.uid && newRole !== 'admin') {
      alert('No puedes quitarte permisos de administrador a ti mismo.');
      return;
    }

    setSaving(userId);
    try {
      // In a real app, this would update the user's custom claims in Firebase
      localStorage.setItem(`userRole_${userId}`, newRole);

      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, role: newRole } : user
      ));

      // If updating current user, update context
      if (userId === currentUser?.uid) {
        await updateUserRole(newRole);
      }

      alert(`Rol de usuario actualizado exitosamente.`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar el rol del usuario.');
    } finally {
      setSaving(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? '#e74c3c' : '#3498db';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  return (
    <div className="user-management">
      <h2>Administración de Usuarios</h2>
      <p className="description">
        Gestiona los roles y permisos de los usuarios del sistema.
        Los administradores tienen acceso completo a reportes y configuración.
      </p>

      <div className="user-stats">
        <div className="stat-card">
          <h4>{users.length}</h4>
          <p>Total Usuarios</p>
        </div>
        <div className="stat-card">
          <h4>{users.filter(u => u.role === 'admin').length}</h4>
          <p>Administradores</p>
        </div>
        <div className="stat-card">
          <h4>{users.filter(u => u.role === 'user').length}</h4>
          <p>Usuarios Regulares</p>
        </div>
      </div>

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Rol Actual</th>
              <th>Último Acceso</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid}>
                <td className="user-email">
                  {user.email}
                  {user.uid === currentUser?.uid && <span className="current-user-badge">(Tú)</span>}
                </td>
                <td>
                  <span
                    className="role-badge"
                    style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                  >
                    {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                </td>
                <td>{user.lastLogin ? formatDate(user.lastLogin) : 'Nunca'}</td>
                <td>{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value as 'admin' | 'user')}
                    disabled={saving === user.uid}
                    className="role-select"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                  {saving === user.uid && <span className="saving-indicator">Guardando...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="user-management-info">
        <h3>Información sobre Roles</h3>
        <div className="role-info">
          <div className="role-item">
            <h4>👤 Usuario Regular</h4>
            <ul>
              <li>Acceso a empleados, proyectos y clientes</li>
              <li>Crear y editar registros básicos</li>
              <li>No acceso a reportes ni administración</li>
            </ul>
          </div>
          <div className="role-item">
            <h4>👑 Administrador</h4>
            <ul>
              <li>Acceso completo a todas las funciones</li>
              <li>Generar y exportar reportes</li>
              <li>Gestionar roles de usuarios</li>
              <li>Configurar permisos del sistema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

export {};