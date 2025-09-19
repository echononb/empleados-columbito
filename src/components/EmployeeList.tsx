import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeService, Employee } from '../services/employeeService';
import LazyImage from './LazyImage';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');

  // Load employees instantly from localStorage or mock data
  const loadEmployees = () => {
    try {
      setLoading(true);
      setError('');

      // Load from localStorage immediately
      const storedEmployees = localStorage.getItem('empleados-data');
      if (storedEmployees) {
        const parsedEmployees = JSON.parse(storedEmployees);
        setEmployees(parsedEmployees);
      } else {
        // Show mock data immediately if no localStorage
        const mockEmployees: Employee[] = [
        {
          id: '1',
          employeeCode: 'EMP001',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          puesto: 'Ingeniero Civil',
          fechaIngreso: '2023-01-15',
          fechaNacimiento: '1988-05-20',
          fotoUrl: 'https://via.placeholder.com/200x200/3498db/ffffff?text=Juan+Carlos',
          direccionActual: '',
          referenciaDireccion: '',
          regimenLaboral: '',
          lugarNacimiento: { departamento: '', provincia: '', distrito: '' },
          sexo: '',
          numeroFotocheck: '',
          telefonoCelular: '',
          telefonoFijo: '',
          estadoCivil: '',
          afp: '',
          email: '',
          licenciaConducir: '',
          categoriaLicencia: '',
          banco: '',
          numeroCuenta: '',
          cci: '',
          factorRH: '',
          antecedentesPenales: false,
          epp: { tallaCalzado: '', tallaVestimenta: '' },
          informacionAcademica: { gradoInstruccion: '', nombreInstitucion: '', tipoInstitucion: '', carrera: '', anoEgreso: 0 },
          estudiosComplementarios: [],
          datosFamilia: { conyuge: { apellidosNombres: '', dni: '', fechaNacimiento: '', telefono: '', documentoVinculo: '' }, tieneHijos: false },
          hijos: [],
          assignedProjects: []
        },
        {
          id: '2',
          employeeCode: 'EMP002',
          dni: '87654321',
          apellidoPaterno: 'Martínez',
          apellidoMaterno: 'Rodríguez',
          nombres: 'María Elena',
          puesto: 'Arquitecta',
          fechaIngreso: '2023-03-20',
          fechaNacimiento: '1995-08-15',
          fotoUrl: 'https://via.placeholder.com/200x200/e74c3c/ffffff?text=María+Elena',
          direccionActual: '',
          referenciaDireccion: '',
          regimenLaboral: '',
          lugarNacimiento: { departamento: '', provincia: '', distrito: '' },
          sexo: '',
          numeroFotocheck: '',
          telefonoCelular: '',
          telefonoFijo: '',
          estadoCivil: '',
          afp: '',
          email: '',
          licenciaConducir: '',
          categoriaLicencia: '',
          banco: '',
          numeroCuenta: '',
          cci: '',
          factorRH: '',
          antecedentesPenales: false,
          epp: { tallaCalzado: '', tallaVestimenta: '' },
          informacionAcademica: { gradoInstruccion: '', nombreInstitucion: '', tipoInstitucion: '', carrera: '', anoEgreso: 0 },
          estudiosComplementarios: [],
          datosFamilia: { conyuge: { apellidosNombres: '', dni: '', fechaNacimiento: '', telefono: '', documentoVinculo: '' }, tieneHijos: false },
          hijos: [],
          assignedProjects: []
        }
      ];
      setEmployees(mockEmployees);
    }

    setLoading(false);

    // Try Firebase sync in background (non-blocking)
    setTimeout(() => {
      EmployeeService.getAllEmployees()
        .then(employeeData => {
          if (employeeData && employeeData.length > 0) {
            setEmployees(employeeData);
            localStorage.setItem('empleados-data', JSON.stringify(employeeData));
          }
        })
        .catch(firebaseError => {
          console.log('Firebase sync failed, keeping local data');
        });
    }, 100); // Small delay to ensure UI is rendered first
  } catch (error) {
    console.error('Error loading employees:', error);
    setError('Error al cargar los empleados');
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