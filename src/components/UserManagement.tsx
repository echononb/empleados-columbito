import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseCleaner } from '../utils/databaseCleaner';
import { UserService, UserProfile } from '../services/userService';
import { auth } from '../firebase';

interface User extends UserProfile {}

const UserManagement: React.FC = () => {
  const { user: currentUser, updateUserRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [dataStats, setDataStats] = useState({
    employees: 0,
    clients: 0,
    projects: 0,
    totalRecords: 0
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  useEffect(() => {
    loadUsers();
    loadDataStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Load real users from Firebase Auth via UserService
      const userProfiles = await UserService.getAllUserProfiles();
      setUsers(userProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to empty array if Firebase is not available
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDataStats = async () => {
    try {
      const stats = await DatabaseCleaner.getDataStats();
      setDataStats(stats);
    } catch (error) {
      console.error('Error loading data stats:', error);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres ELIMINAR TODOS los datos?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    if (!window.confirm('🚨 CONFIRMACIÓN FINAL: Se eliminarán empleados, clientes y proyectos de Firebase y localStorage.')) {
      return;
    }

    setCleaning(true);
    try {
      await DatabaseCleaner.clearAllData();
      await loadDataStats(); // Refresh stats
      alert('✅ ¡Base de datos limpiada exitosamente!\n\nLa aplicación está lista para ingresar nuevos datos.');
    } catch (error) {
      console.error('Error clearing database:', error);
      alert('❌ Error al limpiar la base de datos. Revisa la consola para más detalles.');
    } finally {
      setCleaning(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    if (userId === currentUser?.uid && newRole !== 'admin') {
      alert('No puedes quitarte permisos de administrador a ti mismo.');
      return;
    }

    setSaving(userId);
    try {
      // Update user role using UserService
      await UserService.updateUserRole(userId, newRole);

      // Update local state
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

  const handleToggleUserStatus = async (userId: string) => {
    if (userId === currentUser?.uid) {
      alert('No puedes desactivar tu propia cuenta.');
      return;
    }

    setSaving(userId);
    try {
      // Toggle user status using UserService
      await UserService.toggleUserStatus(userId);

      // Update local state
      setUsers(prev => prev.map(user =>
        user.uid === userId ? { ...user, isActive: !user.isActive } : user
      ));

      const newStatus = !users.find(u => u.uid === userId)?.isActive;
      alert(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente.`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Error al cambiar el estado del usuario.');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.uid) {
      alert('No puedes eliminar tu propia cuenta.');
      return;
    }

    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    setSaving(userId);
    try {
      // Delete user using UserService
      await UserService.deleteUser(userId);

      // Update local state
      setUsers(prev => prev.filter(user => user.uid !== userId));

      alert('Usuario eliminado exitosamente.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario.');
    } finally {
      setSaving(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleCreateUser = async (userData: { email: string; password: string; displayName?: string; role?: 'admin' | 'user' }) => {
    setSaving('create');
    try {
      const newUser = await UserService.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        role: userData.role
      }, currentUser?.uid);

      // Add to local state
      setUsers(prev => [...prev, newUser]);

      alert('Usuario creado exitosamente.');
      setShowCreateUserModal(false);
    } catch (error: any) {
      console.error('Error creating user:', error);

      // Show specific error messages
      let errorMessage = 'Error al crear el usuario.';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este email ya está registrado en el sistema.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El email proporcionado no es válido.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'La creación de usuarios no está habilitada en Firebase. Configure las reglas de autenticación en Firebase Console.';
            break;
          case 'permission-denied':
            errorMessage = 'No tiene permisos para crear usuarios. Solo administradores pueden crear nuevos usuarios.';
            break;
          default:
            errorMessage = `Error de autenticación: ${error.code}`;
        }
      }

      alert(errorMessage);
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
      <div className="user-management-header">
        <div>
          <h2>Administración de Usuarios</h2>
          <p className="description">
            Gestiona los roles y permisos de los usuarios del sistema.
            Los administradores tienen acceso completo a reportes y configuración.
          </p>
    
          {!auth && (
            <div className="firebase-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <h4>Firebase no configurado</h4>
                <p>
                  La gestión de usuarios requiere configuración de Firebase.
                  Configure las variables de entorno <code>REACT_APP_FIREBASE_*</code> para habilitar
                  la creación y gestión de usuarios.
                </p>
                <p>
                  Actualmente solo puede gestionar usuarios existentes que ya se hayan registrado.
                </p>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowCreateUserModal(true)}
          className="btn btn-primary"
          disabled={!auth}
          title={!auth ? 'Firebase no configurado' : 'Crear nuevo usuario'}
        >
          ➕ Crear Usuario
        </button>
      </div>

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
              <th>Estado</th>
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
                  <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
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
                  <div className="action-buttons">
                    <button
                      onClick={() => handleToggleUserStatus(user.uid)}
                      disabled={saving === user.uid || user.uid === currentUser?.uid}
                      className={`btn btn-small ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                      title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      {user.isActive ? '🚫' : '✅'}
                    </button>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value as 'admin' | 'user')}
                      disabled={saving === user.uid}
                      className="role-select"
                      title="Cambiar rol"
                    >
                      <option value="user">👤 Usuario</option>
                      <option value="admin">👑 Admin</option>
                    </select>
                    <button
                      onClick={() => setShowDeleteConfirm(user.uid)}
                      disabled={saving === user.uid || user.uid === currentUser?.uid}
                      className="btn btn-danger btn-small"
                      title="Eliminar usuario"
                    >
                      🗑️
                    </button>
                    {saving === user.uid && <span className="saving-indicator">Guardando...</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="database-management">
        <h3>🗄️ Gestión de Base de Datos</h3>
        <p className="description">
          Herramientas para gestionar los datos de la aplicación. Usa estas funciones con precaución.
        </p>

        <div className="data-stats">
          <div className="stat-card">
            <h4>{dataStats.employees}</h4>
            <p>Empleados</p>
          </div>
          <div className="stat-card">
            <h4>{dataStats.clients}</h4>
            <p>Clientes</p>
          </div>
          <div className="stat-card">
            <h4>{dataStats.projects}</h4>
            <p>Proyectos</p>
          </div>
          <div className="stat-card">
            <h4>{dataStats.totalRecords}</h4>
            <p>Total Registros</p>
          </div>
        </div>

        <div className="database-actions">
          <div className="action-warning">
            <h4>⚠️ Zona de Peligro</h4>
            <p>Estas acciones eliminarán datos permanentemente. No hay forma de recuperar la información una vez eliminada.</p>
          </div>

          <button
            onClick={handleClearAllData}
            disabled={cleaning}
            className="btn btn-danger btn-large"
          >
            {cleaning ? '🧹 Limpiando...' : '🗑️ Limpiar Toda la Base de Datos'}
          </button>

          <div className="action-info">
            <p><strong>¿Qué hace esta función?</strong></p>
            <ul>
              <li>Elimina todos los empleados de Firebase y localStorage</li>
              <li>Elimina todos los clientes de Firebase y localStorage</li>
              <li>Elimina todos los proyectos de Firebase y localStorage</li>
              <li>Limpia roles de usuario almacenados localmente</li>
              <li>Deja la aplicación lista para ingresar nuevos datos</li>
            </ul>
          </div>
        </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirmar Eliminación</h3>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="warning-icon">⚠️</div>
                <h4>¿Estás seguro de que quieres eliminar este usuario?</h4>
                <p>Esta acción no se puede deshacer. Se eliminarán todos los datos asociados con este usuario.</p>
                <div className="user-info-delete">
                  <strong>Email:</strong> {users.find(u => u.uid === showDeleteConfirm)?.email}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="btn btn-danger"
                disabled={saving === showDeleteConfirm}
              >
                {saving === showDeleteConfirm ? 'Eliminando...' : 'Eliminar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <CreateUserModal
          onSave={handleCreateUser}
          onClose={() => setShowCreateUserModal(false)}
          loading={saving === 'create'}
        />
      )}
    </div>
  );
};

export default UserManagement;

// Create User Modal Component
interface CreateUserModalProps {
  onSave: (userData: { email: string; password: string; displayName?: string; role?: 'admin' | 'user' }) => void;
  onClose: () => void;
  loading: boolean;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onSave, onClose, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'user' as 'admin' | 'user'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'Contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave({
      email: formData.email,
      password: formData.password,
      displayName: formData.displayName || undefined,
      role: formData.role
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Crear Nuevo Usuario</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Nombre para Mostrar</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Opcional"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error' : ''}
                required
                minLength={6}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                required
                minLength={6}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Rol *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="user">👤 Usuario Regular</option>
              <option value="admin">👑 Administrador</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export {};