import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeService, Employee } from '../services/employeeService';
import { ProjectService, Project } from '../services/projectService';
import LazyImage from './LazyImage';
import { useAuth } from '../contexts/AuthContext';

const EmployeeList: React.FC = () => {
  const { userRole } = useAuth();
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
  const canManage = userRole === 'administrador';

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
    <div className="employee-list">
      <div className="employee-list-header">
        <h2>Lista de Empleados</h2>
        {canEdit && (
          <Link to="/employees/new" className="btn btn-primary">
            Agregar Empleado
          </Link>
        )}
      </div>

      <div className="filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Mostrar empleados inactivos
          </label>
          <small className="help-text" style={{ display: 'block', marginTop: '4px', color: '#6c757d' }}>
            💡 Usa "Desactivar" para quitar acceso al sistema sin perder datos
          </small>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Código</th>
              <th>DNI</th>
              <th>Apellidos y Nombres</th>
              <th>Puesto</th>
              <th>Fecha Ingreso</th>
              <th>Edad</th>
              <th>Estado</th>
              <th>Proyectos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(employee => (
              <tr key={employee.id}>
                <td>
                  {employee.fotoUrl ? (
                    <LazyImage
                      src={employee.fotoUrl}
                      alt={`Foto de ${employee.nombres}`}
                      className="employee-photo-thumbnail"
                      placeholder="👤"
                    />
                  ) : (
                    <div className="employee-photo-placeholder">📷</div>
                  )}
                </td>
                <td>{employee.employeeCode}</td>
                <td>{employee.dni}</td>
                <td>{`${employee.apellidoPaterno} ${employee.apellidoMaterno}, ${employee.nombres}`}</td>
                <td>{employee.puesto}</td>
                <td>{formatDate(employee.fechaIngreso)}</td>
                <td>{EmployeeService.calculateAge(employee.fechaNacimiento)}</td>
                <td>
                  <span className={`status-badge ${employee.isActive ? 'status-active' : 'status-inactive'}`}>
                    {employee.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <span className="projects-count">
                    {employee.assignedProjects?.length || 0} proyecto{employee.assignedProjects?.length !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <Link to={`/employees/${employee.id}`} className="btn btn-secondary btn-small">
                      {canEdit ? 'Ver/Editar' : 'Ver'}
                    </Link>
                    {canManage && (
                      <button
                        onClick={() => handleToggleActive(employee)}
                        disabled={togglingId === employee.id}
                        className={`btn ${employee.isActive ? 'btn-warning' : 'btn-success'} btn-small`}
                        title={employee.isActive ? 'Desactivar empleado (no podrá acceder al sistema)' : 'Activar empleado (podrá acceder al sistema)'}
                      >
                        {togglingId === employee.id ? '⏳ Cambiando...' : (employee.isActive ? '🚫 Desactivar' : '✅ Activar')}
                      </button>
                    )}
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