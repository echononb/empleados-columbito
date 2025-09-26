import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeService, Employee } from '../services/employeeService';
import LazyImage from './LazyImage';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Load employees from Firestore
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');

      const employeeData = await EmployeeService.getAllEmployees();
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Error al cargar los empleados desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    if (!employee.id) return;

    const action = employee.isActive ? 'desactivar' : 'activar';
    const confirmMessage = `¿Estás seguro de que quieres ${action} al empleado?\n\n${employee.apellidoPaterno} ${employee.apellidoMaterno}, ${employee.nombres}\nDNI: ${employee.dni}\nCódigo: ${employee.employeeCode}\n\nEl empleado ${employee.isActive ? 'no podrá acceder al sistema' : 'podrá acceder nuevamente'}.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setTogglingId(employee.id);
    try {
      await EmployeeService.updateEmployee(employee.id, {
        isActive: !employee.isActive,
        updatedAt: new Date().toISOString()
      });
      // Reload employees after status change
      await loadEmployees();
    } catch (error) {
      console.error('Error toggling employee status:', error);
      setError(`Error al ${action} el empleado. Inténtalo de nuevo.`);
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    loadEmployees();
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
        <Link to="/employees/new" className="btn btn-primary">
          Agregar Empleado
        </Link>
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
                      Ver/Editar
                    </Link>
                    <button
                      onClick={() => handleToggleActive(employee)}
                      disabled={togglingId === employee.id}
                      className={`btn ${employee.isActive ? 'btn-warning' : 'btn-success'} btn-small`}
                      title={employee.isActive ? 'Desactivar empleado (no podrá acceder al sistema)' : 'Activar empleado (podrá acceder al sistema)'}
                    >
                      {togglingId === employee.id ? '⏳ Cambiando...' : (employee.isActive ? '🚫 Desactivar' : '✅ Activar')}
                    </button>
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
    </div>
  );
};

export default EmployeeList;