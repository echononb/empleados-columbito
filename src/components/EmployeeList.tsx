import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeService, Employee } from '../services/employeeService';
import LazyImage from './LazyImage';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');

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

  useEffect(() => {
    loadEmployees();
  }, []);

  // Memoized filtered employees for better performance
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;

    const term = searchTerm.toLowerCase().trim();
    return employees.filter(employee =>
      employee.nombres.toLowerCase().includes(term) ||
      employee.apellidoPaterno.toLowerCase().includes(term) ||
      employee.dni.includes(term) ||
      employee.employeeCode.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

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

      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por nombre, DNI o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
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
                <td>{new Date(employee.fechaIngreso).toLocaleDateString('es-PE')}</td>
                <td>{EmployeeService.calculateAge(employee.fechaNacimiento)}</td>
                <td>
                  <Link to={`/employees/${employee.id}`} className="btn btn-secondary">
                    Ver/Editar
                  </Link>
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