import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseCleaner } from '../utils/databaseCleaner';
import { UserService, UserProfile } from '../services/userService';
import { auth } from '../firebase';

interface User extends UserProfile {}

interface PendingUser {
  email: string;
  role: 'consulta' | 'digitador' | 'administrador';
  assignedAt: string;
  assignedBy?: string;
  type: 'pending';
}

const UserManagement: React.FC = () => {
  const { user: currentUser, updateUserRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
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
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);

  useEffect(() => {
    loadUsers();
    loadDataStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Load both registered and pending users
      const { registered, pending } = await UserService.getAllManageableUsers();

      setUsers(registered);
      setPendingUsers(pending.map(p => ({ ...p, type: 'pending' as const })));
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to empty arrays if Firebase is not available
      setUsers([]);
      setPendingUsers([]);
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

  const handleRoleChange = async (userId: string, newRole: 'consulta' | 'digitador' | 'administrador') => {
    if (userId === currentUser?.uid && newRole !== 'administrador') {
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
        alert(`Tu rol ha sido actualizado exitosamente.`);
      } else {
        alert(`Rol de usuario actualizado exitosamente.\n\nNota: El usuario debe cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto.`);
      }
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

  const handleCreateUser = async (userData: { email: string; password: string; displayName?: string; role?: 'consulta' | 'digitador' | 'administrador' }) => {
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

  const handleAssignRole = async (emailData: { email: string; role: 'consulta' | 'digitador' | 'administrador' }) => {
    setSaving('assign');
    try {
      await UserService.assignRoleToEmail(emailData.email, emailData.role, currentUser?.uid);

      // Reload users to show the new pending assignment
      await loadUsers();

      alert('Rol asignado exitosamente. El usuario tendrá este rol cuando inicie sesión.');
      setShowAssignRoleModal(false);
    } catch (error: any) {
      console.error('Error assigning role:', error);

      // Provide more specific error messages
      let errorMessage = 'Error al asignar el rol.';

      if (error.code === 'permission-denied') {
        errorMessage = 'Error de permisos: No tienes permisos para asignar roles. Solo administradores pueden asignar roles.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Error de conexión: No se puede conectar a Firebase. Verifica tu conexión a internet.';
      } else if (error.code === 'deadline-exceeded') {
        errorMessage = 'Error de tiempo de espera: La operación tardó demasiado. Inténtalo de nuevo.';
      } else if (error.message) {
        errorMessage = `Error al asignar el rol: ${error.message}`;
      } else {
        errorMessage = 'Error desconocido al asignar el rol. Revisa la consola para más detalles.';
      }

      alert(errorMessage);
    } finally {
      setSaving(null);
    }
  };

  const handleRemovePendingRole = async (email: string) => {
    if (!window.confirm('¿Estás seguro de que quieres remover esta asignación de rol pendiente?')) {
      return;
    }

    setSaving(email);
    try {
      await UserService.removePendingRole(email);

      // Update local state
      setPendingUsers(prev => prev.filter(p => p.email !== email));

      alert('Asignación de rol removida exitosamente.');
    } catch (error) {
      console.error('Error removing pending role:', error);
      alert('Error al remover la asignación de rol.');
    } finally {
      setSaving(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'administrador': return '#e74c3c';
      case 'digitador': return '#f39c12';
      case 'consulta': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'administrador': return 'Administrador';
      case 'digitador': return 'Digitador';
      case 'consulta': return 'Consulta';
      default: return role;
    }
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
        <div className="header-actions">
          <button
            onClick={() => setShowAssignRoleModal(true)}
            className="btn btn-secondary"
            title="Asignar rol a email (para usuarios que aún no han iniciado sesión)"
          >
            👤 Asignar Rol
          </button>
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="btn btn-primary"
            disabled={!auth}
            title={!auth ? 'Firebase no configurado' : 'Crear nuevo usuario con contraseña'}
          >
            ➕ Crear Usuario
          </button>
        </div>
      </div>

      <div className="user-stats">
        <div className="stat-card">
          <h4>{users.length + pendingUsers.length}</h4>
          <p>Total Usuarios</p>
        </div>
        <div className="stat-card">
          <h4>{users.filter(u => u.role === 'administrador').length + pendingUsers.filter(p => p.role === 'administrador').length}</h4>
          <p>Administradores</p>
        </div>
        <div className="stat-card">
          <h4>{users.filter(u => u.role === 'digitador').length + pendingUsers.filter(p => p.role === 'digitador').length}</h4>
          <p>Digitadores</p>
        </div>
        <div className="stat-card">
          <h4>{users.filter(u => u.role === 'consulta').length + pendingUsers.filter(p => p.role === 'consulta').length}</h4>
          <p>Consulta</p>
        </div>
        <div className="stat-card">
          <h4>{pendingUsers.length}</h4>
          <p>Asignaciones Pendientes</p>
        </div>
      </div>

      {/* Registered Users Table */}
      {users.length > 0 && (
        <div className="user-table-container">
          <h3>👥 Usuarios Registrados</h3>
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
                      {getRoleDisplayName(user.role)}
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
                        onChange={(e) => handleRoleChange(user.uid, e.target.value as 'consulta' | 'digitador' | 'administrador')}
                        disabled={saving === user.uid}
                        className="role-select"
                        title="Cambiar rol"
                      >
                        <option value="consulta">👁️ Consulta</option>
                        <option value="digitador">✏️ Digitador</option>
                        <option value="administrador">👑 Administrador</option>
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
      )}

      {/* Pending Role Assignments Table */}
      {pendingUsers.length > 0 && (
        <div className="user-table-container">
          <h3>⏳ Asignaciones de Rol Pendientes</h3>
          <p className="pending-info">
            Estos roles serán asignados automáticamente cuando los usuarios inicien sesión por primera vez.
            Si un usuario ya inició sesión pero no recibió el rol, puede deberse a problemas de sincronización.
            Usa el botón 🔍 para diagnosticar problemas específicos.
          </p>
          <table className="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol Asignado</th>
                <th>Fecha de Asignación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(pending => (
                <tr key={pending.email}>
                  <td className="user-email">{pending.email}</td>
                  <td>
                    <span
                      className="role-badge"
                      style={{ backgroundColor: getRoleBadgeColor(pending.role) }}
                    >
                      {getRoleDisplayName(pending.role)}
                    </span>
                  </td>
                  <td>{formatDate(pending.assignedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => {
                          // Import UserService dynamically to avoid circular imports
                          import('../services/userService').then(({ UserService }) => {
                            UserService.debugPendingRoleApplication(pending.email);
                            alert(`Debug info logged to console for ${pending.email}. Check browser console for details.`);
                          });
                        }}
                        className="btn btn-secondary btn-small"
                        title="Debug pending role application"
                      >
                        🔍
                      </button>
                      <button
                        onClick={() => handleRemovePendingRole(pending.email)}
                        disabled={saving === pending.email}
                        className="btn btn-danger btn-small"
                        title="Remover asignación pendiente"
                      >
                        🗑️
                      </button>
                      {saving === pending.email && <span className="saving-indicator">Eliminando...</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {users.length === 0 && pendingUsers.length === 0 && (
        <div className="no-users">
          <div className="no-users-icon">👥</div>
          <h3>No hay usuarios registrados</h3>
          <p>Usa los botones de arriba para crear usuarios o asignar roles a emails.</p>
        </div>
      )}

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
            <h4>👁️ Consulta</h4>
            <ul>
              <li>Solo lectura de empleados, proyectos y clientes</li>
              <li>No puede crear ni editar registros</li>
              <li>No acceso a reportes ni administración</li>
            </ul>
          </div>
          <div className="role-item">
            <h4>✏️ Digitador</h4>
            <ul>
              <li>Lectura y escritura de empleados, proyectos y clientes</li>
              <li>Acceso completo a reportes</li>
              <li>No puede gestionar usuarios ni configuración</li>
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

      {/* Assign Role Modal */}
      {showAssignRoleModal && (
        <AssignRoleModal
          onSave={handleAssignRole}
          onClose={() => setShowAssignRoleModal(false)}
          loading={saving === 'assign'}
        />
      )}
    </div>
  );
};

export default UserManagement;

// Create User Modal Component
interface CreateUserModalProps {
  onSave: (userData: { email: string; password: string; displayName?: string; role?: 'consulta' | 'digitador' | 'administrador' }) => void;
  onClose: () => void;
  loading: boolean;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onSave, onClose, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'consulta' as 'consulta' | 'digitador' | 'administrador'
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
              <option value="consulta">👁️ Consulta</option>
              <option value="digitador">✏️ Digitador</option>
              <option value="administrador">👑 Administrador</option>
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

// Assign Role Modal Component
interface AssignRoleModalProps {
  onSave: (roleData: { email: string; role: 'consulta' | 'digitador' | 'administrador' }) => void;
  onClose: () => void;
  loading: boolean;
}

const AssignRoleModal: React.FC<AssignRoleModalProps> = ({ onSave, onClose, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'consulta' as 'consulta' | 'digitador' | 'administrador'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email no es válido';
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
      email: formData.email.toLowerCase(),
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
          <h3>Asignar Rol a Usuario</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-info">
            <div className="info-icon">ℹ️</div>
            <p>
              Asigna un rol a un email. Cuando el usuario inicie sesión por primera vez,
              automáticamente recibirá este rol.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email del Usuario *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="usuario@empresa.com"
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="role">Rol a Asignar *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="consulta">👁️ Consulta</option>
              <option value="digitador">✏️ Digitador</option>
              <option value="administrador">👑 Administrador</option>
            </select>
            <small className="help-text">
              El usuario tendrá este rol cuando inicie sesión por primera vez.
            </small>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Asignando...' : 'Asignar Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export {};