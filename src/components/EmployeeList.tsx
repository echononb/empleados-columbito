import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeService, Employee } from '../services/employeeService';
import { ProjectService, Project } from '../services/projectService';
import LazyImage from './LazyImage';
import { useAuth } from '../contexts/AuthContext';

const EmployeeList: React.FC = () => {
  const { userRole, refreshUserRole } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeEmployee, setStatusChangeEmployee] = useState<Employee | null>(null);

  // Check if user can edit employees
  const canEdit = userRole === 'digitador' || userRole === 'administrador';

  // Check if user can manage employee status (activate/deactivate)
  // Both digitador and administrador can manage employee status
  const canManage = userRole === 'digitador' || userRole === 'administrador';

  // Debug logging - detailed role checking
  console.log('=== EMPLOYEE LIST ROLE DEBUG ===');
  console.log('userRole value:', userRole);
  console.log('userRole type:', typeof userRole);
  console.log('userRole length:', userRole?.length);
  console.log('userRole === "digitador":', userRole === 'digitador');
  console.log('userRole === "administrador":', userRole === 'administrador');
  console.log('userRole === null:', userRole === null);
  console.log('userRole === undefined:', userRole === undefined);
  console.log('canEdit result:', canEdit);
  console.log('canManage result (activate/deactivate):', canManage);

  // Additional checks
  if (userRole) {
    console.log('userRole toLowerCase:', userRole.toLowerCase());
    console.log('userRole trimmed:', userRole.trim());
    console.log('userRole includes "digitador":', userRole.includes('digitador'));
  }
  console.log('================================');

  // Load employees and projects from Firestore
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [employeeData, projectData] = await Promise.all([
        EmployeeService.getAllEmployees(),
        ProjectService.getAllProjects()
      ]);

      setEmployees(employeeData);
      setProjects(projectData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = (employee: Employee) => {
    setStatusChangeEmployee(employee);
    setShowStatusModal(true);
  };

  const handleStatusChange = async (options: {
    deactivationDate?: string;
    deactivationReason?: string;
    activationDate?: string;
    assignedProject?: string;
  }) => {
    if (!statusChangeEmployee?.id) return;

    const newStatus = !statusChangeEmployee.isActive;
    const action = newStatus ? 'activar' : 'desactivar';

    setTogglingId(statusChangeEmployee.id);
    try {
      await EmployeeService.updateEmployeeStatus(statusChangeEmployee.id, newStatus, options);
      // Reload data after status change
      await loadData();
      setShowStatusModal(false);
      setStatusChangeEmployee(null);
    } catch (error) {
      console.error('Error changing employee status:', error);
      setError(`Error al ${action} el empleado. Inténtalo de nuevo.`);
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper function to properly display dates without timezone issues
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Create date object and ensure it's treated as local date
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('es-PE');
  };

  // Memoized filtered employees for better performance
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(employee => employee.isActive);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(employee =>
        employee.nombres.toLowerCase().includes(term) ||
        employee.apellidoPaterno.toLowerCase().includes(term) ||
        employee.dni.includes(term) ||
        employee.employeeCode.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [employees, searchTerm, showInactive]);

  if (loading) {
    return <div className="loading">Cargando empleados...</div>;
  }

  return (
    <div className="employee-list" role="main" aria-label="Lista de empleados">
      <div className="employee-list-header">
        <div>
          <h2 id="employee-list-title">Lista de Empleados</h2>
          <div className="user-role-info" role="status" aria-live="polite" aria-label="Información del usuario actual">
            <small>Rol actual: <strong aria-label={`Rol de usuario: ${userRole || 'Cargando'}`}>{userRole || 'Cargando...'}</strong></small>
            {canEdit && <small style={{ color: '#28a745', marginLeft: '10px' }} aria-label="Usuario tiene permisos para editar empleados">✅ Tiene permisos para editar</small>}
            {!canEdit && userRole && <small style={{ color: '#dc3545', marginLeft: '10px' }} aria-label="Usuario no tiene permisos para editar empleados">❌ No tiene permisos para editar</small>}
            {userRole && (
              <button
                onClick={refreshUserRole}
                className="btn btn-secondary btn-small"
                style={{ marginLeft: '10px', fontSize: '11px', padding: '2px 6px' }}
                title="Actualizar rol desde el servidor"
                aria-describedby="refresh-role-help"
              >
                🔄 Actualizar Rol
              </button>
            )}
            <div id="refresh-role-help" className="sr-only">
              Haz clic para actualizar tu rol desde el servidor si fue modificado recientemente
            </div>
          </div>
        </div>
        {canEdit && (
          <Link
            to="/employees/new"
            className="btn btn-primary"
            aria-label="Agregar nuevo empleado"
          >
            Agregar Empleado
          </Link>
        )}
        {!canEdit && userRole && (
          <div className="permission-denied" role="alert" aria-live="assertive">
            <small style={{ color: '#6c757d' }}>
              Solo usuarios con rol "Digitador" o "Administrador" pueden gestionar empleados.
              Si tu rol fue actualizado recientemente, haz clic en "Actualizar Rol" o cierra sesión y vuelve a iniciar sesión.
            </small>
          </div>
        )}
      </div>

      <div className="filters-container" role="search" aria-label="Filtros de búsqueda de empleados">
        <div className="search-container">
          <label htmlFor="employee-search" className="sr-only">
            Buscar empleados por nombre, DNI o código
          </label>
          <input
            id="employee-search"
            type="text"
            placeholder="Buscar por nombre, DNI o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-describedby="search-help"
            autoComplete="off"
          />
          <div id="search-help" className="sr-only">
            Busca empleados escribiendo nombre, apellido, DNI o código de empleado
          </div>
        </div>

        <div className="status-filter">
          <label className="checkbox-label" htmlFor="show-inactive-filter">
            <input
              id="show-inactive-filter"
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              aria-describedby="inactive-help"
            />
            Mostrar empleados inactivos
          </label>
          <small
            id="inactive-help"
            className="help-text"
            style={{ display: 'block', marginTop: '4px', color: '#6c757d' }}
            role="tooltip"
          >
            💡 Usa "Desactivar/Reactivar" para gestionar el acceso de empleados al sistema sin perder datos
          </small>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="employee-table-container" role="region" aria-label="Tabla de empleados" aria-describedby="employee-list-title">
        <table className="employee-table" role="table" aria-label="Lista de empleados" aria-rowcount={filteredEmployees.length + 1}>
          <thead>
            <tr role="row">
              <th role="columnheader" aria-label="Foto del empleado">Foto</th>
              <th role="columnheader" aria-label="Código de empleado">Código</th>
              <th role="columnheader" aria-label="Número de DNI">DNI</th>
              <th role="columnheader" aria-label="Apellidos y nombres del empleado">Apellidos y Nombres</th>
              <th role="columnheader" aria-label="Puesto de trabajo">Puesto</th>
              <th role="columnheader" aria-label="Fecha de ingreso">Fecha Ingreso</th>
              <th role="columnheader" aria-label="Edad del empleado">Edad</th>
              <th role="columnheader" aria-label="Estado del empleado">Estado</th>
              <th role="columnheader" aria-label="Número de proyectos asignados">Proyectos</th>
              <th role="columnheader" aria-label="Acciones disponibles">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee, index) => (
              <tr key={employee.id} role="row" aria-rowindex={index + 2}>
                <td role="cell">
                  {employee.fotoUrl ? (
                    <LazyImage
                      src={employee.fotoUrl}
                      alt={`Foto de ${employee.nombres} ${employee.apellidoPaterno}`}
                      className="employee-photo-thumbnail"
                      placeholder="👤"
                    />
                  ) : (
                    <div
                      className="employee-photo-placeholder"
                      aria-label="Sin foto disponible"
                    >
                      📷
                    </div>
                  )}
                </td>
                <td role="cell" aria-label={`Código: ${employee.employeeCode}`}>
                  {employee.employeeCode}
                </td>
                <td role="cell" aria-label={`DNI: ${employee.dni}`}>
                  {employee.dni}
                </td>
                <td role="cell" aria-label={`Nombre: ${employee.apellidoPaterno} ${employee.apellidoMaterno}, ${employee.nombres}`}>
                  {`${employee.apellidoPaterno} ${employee.apellidoMaterno}, ${employee.nombres}`}
                </td>
                <td role="cell" aria-label={`Puesto: ${employee.puesto}`}>
                  {employee.puesto}
                </td>
                <td role="cell" aria-label={`Fecha de ingreso: ${formatDate(employee.fechaIngreso)}`}>
                  {formatDate(employee.fechaIngreso)}
                </td>
                <td role="cell" aria-label={`Edad: ${EmployeeService.calculateAge(employee.fechaNacimiento)} años`}>
                  {EmployeeService.calculateAge(employee.fechaNacimiento)}
                </td>
                <td role="cell">
                  <span
                    className={`status-badge ${employee.isActive ? 'status-active' : 'status-inactive'}`}
                    aria-label={`Estado: ${employee.isActive ? 'Empleado activo' : 'Empleado inactivo'}`}
                    role="status"
                  >
                    {employee.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td role="cell">
                  <span
                    className="projects-count"
                    aria-label={`${employee.assignedProjects?.length || 0} proyecto${employee.assignedProjects?.length !== 1 ? 's' : ''} asignado${employee.assignedProjects?.length !== 1 ? 's' : ''}`}
                  >
                    {employee.assignedProjects?.length || 0} proyecto{employee.assignedProjects?.length !== 1 ? 's' : ''}
                  </span>
                </td>
                <td role="cell" className="actions-cell">
                  <div className="action-buttons" role="group" aria-label="Acciones del empleado">
                    <Link
                      to={`/employees/${employee.id}`}
                      className="btn btn-secondary btn-small"
                      aria-label={`${canEdit ? 'Ver y editar' : 'Ver detalles de'} ${employee.nombres} ${employee.apellidoPaterno}`}
                    >
                      {canEdit ? 'Ver/Editar' : 'Ver'}
                    </Link>
                    {canManage && (
                      <button
                        onClick={() => handleToggleActive(employee)}
                        disabled={togglingId === employee.id}
                        className={`btn ${employee.isActive ? 'btn-warning' : 'btn-success'} btn-small`}
                        title={employee.isActive ? 'Desactivar empleado (no podrá acceder al sistema)' : 'Activar empleado (podrá acceder al sistema)'}
                        aria-label={`${employee.isActive ? 'Desactivar' : 'Activar'} empleado ${employee.nombres} ${employee.apellidoPaterno}`}
                        aria-describedby={`status-help-${employee.id}`}
                      >
                        {togglingId === employee.id ? '⏳ Cambiando...' : (employee.isActive ? '🚫 Desactivar' : '✅ Activar')}
                      </button>
                    )}
                    <div id={`status-help-${employee.id}`} className="sr-only">
                      {employee.isActive
                        ? 'Desactivar empleado lo removerá del acceso al sistema pero mantendrá sus datos'
                        : 'Activar empleado le permitirá acceder al sistema nuevamente'
                      }
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEmployees.length === 0 && (
        <div className="no-results">
          {searchTerm ? 'No se encontraron empleados que coincidan con la búsqueda.' : 'No hay empleados registrados.'}
        </div>
      )}

      {showStatusModal && statusChangeEmployee && (
        <StatusChangeModal
          employee={statusChangeEmployee}
          projects={projects}
          onConfirm={handleStatusChange}
          onClose={() => {
            setShowStatusModal(false);
            setStatusChangeEmployee(null);
          }}
          loading={togglingId === statusChangeEmployee.id}
        />
      )}
    </div>
  );
};

// Status Change Modal Component
interface StatusChangeModalProps {
  employee: Employee;
  projects: Project[];
  onConfirm: (options: {
    deactivationDate?: string;
    deactivationReason?: string;
    activationDate?: string;
    assignedProject?: string;
  }) => void;
  onClose: () => void;
  loading: boolean;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  employee,
  projects,
  onConfirm,
  onClose,
  loading
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    assignedProject: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const isDeactivating = employee.isActive;

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    if (isDeactivating && !formData.reason.trim()) {
      newErrors.reason = 'El motivo de desactivación es requerido';
    }

    if (!isDeactivating && !formData.assignedProject) {
      newErrors.assignedProject = 'Debe seleccionar un proyecto para asignar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isDeactivating) {
      onConfirm({
        deactivationDate: formData.date,
        deactivationReason: formData.reason
      });
    } else {
      onConfirm({
        activationDate: formData.date,
        assignedProject: formData.assignedProject
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
          <h3>
            {isDeactivating ? '🚫 Desactivar Empleado' : '✅ Reactivar Empleado'}
          </h3>
          <button type="button" onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="employee-info">
            <div className="employee-details">
              <h4>{employee.apellidoPaterno} {employee.apellidoMaterno}, {employee.nombres}</h4>
              <p><strong>DNI:</strong> {employee.dni}</p>
              <p><strong>Código:</strong> {employee.employeeCode}</p>
              <p><strong>Puesto:</strong> {employee.puesto}</p>
            </div>
          </div>

          <div className="status-change-info">
            <div className={`status-indicator ${isDeactivating ? 'status-deactivating' : 'status-activating'}`}>
              {isDeactivating
                ? 'El empleado será desactivado y no podrá acceder al sistema'
                : 'El empleado será reactivado y podrá acceder al sistema nuevamente'
              }
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date">
              {isDeactivating ? 'Fecha de Desactivación' : 'Fecha de Reactivación'} *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={errors.date ? 'error' : ''}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>

          {isDeactivating && (
            <div className="form-group">
              <label htmlFor="reason">Motivo de Desactivación *</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Ej: Renuncia voluntaria, Terminación de contrato, etc."
                rows={3}
                className={errors.reason ? 'error' : ''}
              />
              {errors.reason && <span className="error-message">{errors.reason}</span>}
            </div>
          )}

          {!isDeactivating && (
            <div className="form-group">
              <label htmlFor="assignedProject">Proyecto a Asignar *</label>
              <select
                id="assignedProject"
                name="assignedProject"
                value={formData.assignedProject}
                onChange={handleInputChange}
                className={errors.assignedProject ? 'error' : ''}
              >
                <option value="">Seleccionar proyecto...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.contrato}
                  </option>
                ))}
              </select>
              {errors.assignedProject && <span className="error-message">{errors.assignedProject}</span>}
              <small className="help-text">
                El empleado será asignado automáticamente a este proyecto al reactivarse
              </small>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={`btn ${isDeactivating ? 'btn-warning' : 'btn-success'}`}>
              {loading ? 'Procesando...' : (isDeactivating ? '🚫 Desactivar Empleado' : '✅ Reactivar Empleado')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeList;