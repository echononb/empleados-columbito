import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EmployeeService, Employee } from '../services/employeeService';
import PhotoUpload from './PhotoUpload';

const EmployeeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [employee, setEmployee] = useState<Employee>({
    employeeCode: '',
    dni: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    nombres: '',
    direccionActual: '',
    referenciaDireccion: '',
    puesto: '',
    fechaIngreso: '',
    regimenLaboral: '',
    fechaNacimiento: '',
    lugarNacimiento: {
      departamento: '',
      provincia: '',
      distrito: ''
    },
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
    epp: {
      tallaCalzado: '',
      tallaVestimenta: ''
    },
    informacionAcademica: {
      gradoInstruccion: '',
      nombreInstitucion: '',
      tipoInstitucion: '',
      carrera: '',
      anoEgreso: 0
    },
    estudiosComplementarios: [],
    datosFamilia: {
      conyuge: {
        apellidosNombres: '',
        dni: '',
        fechaNacimiento: '',
        telefono: '',
        documentoVinculo: ''
      },
      tieneHijos: false
    },
    hijos: [],
    assignedProjects: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isEditing) {
      // Load employee data for editing
      loadEmployeeData();
    }
  }, [id, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEmployeeData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const employeeData = await EmployeeService.getEmployeeById(id);
      if (employeeData) {
        setEmployee(employeeData);
      } else {
        console.error('Employee not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      // Fallback to mock data for development
      const mockEmployee: Employee = {
        id: id,
        employeeCode: 'EMP001',
        dni: '12345678',
        apellidoPaterno: 'García',
        apellidoMaterno: 'López',
        nombres: 'Juan Carlos',
        puesto: 'Ingeniero Civil',
        fechaIngreso: '2023-01-15',
        fechaNacimiento: '1988-05-20',
        fotoUrl: 'https://via.placeholder.com/200x200/3498db/ffffff?text=Juan+Carlos',
        lugarNacimiento: {
          departamento: 'Lima',
          provincia: 'Lima',
          distrito: 'Miraflores'
        },
        sexo: 'masculino',
        telefonoCelular: '987654321',
        estadoCivil: 'casado',
        afp: 'Integra',
        email: 'juan.garcia@email.com',
        antecedentesPenales: false,
        epp: {
          tallaCalzado: '42',
          tallaVestimenta: 'M'
        },
        informacionAcademica: {
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Nacional',
          tipoInstitucion: 'publica',
          carrera: 'Ingeniería Civil',
          anoEgreso: 2012
        },
        estudiosComplementarios: [],
        datosFamilia: {
          conyuge: {
            apellidosNombres: '',
            dni: '',
            fechaNacimiento: '',
            telefono: '',
            documentoVinculo: ''
          },
          tieneHijos: false
        },
        hijos: [],
        assignedProjects: [],
        direccionActual: '',
        referenciaDireccion: '',
        regimenLaboral: '',
        numeroFotocheck: '',
        telefonoFijo: '',
        licenciaConducir: '',
        categoriaLicencia: '',
        banco: '',
        numeroCuenta: '',
        cci: '',
        factorRH: ''
      };
      setEmployee(mockEmployee);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!employee.dni || employee.dni.length !== 8) {
      newErrors.dni = 'DNI debe tener 8 dígitos';
    }
    if (!employee.apellidoPaterno) {
      newErrors.apellidoPaterno = 'Apellido paterno es requerido';
    }
    if (!employee.apellidoMaterno) {
      newErrors.apellidoMaterno = 'Apellido materno es requerido';
    }
    if (!employee.nombres) {
      newErrors.nombres = 'Nombres son requeridos';
    }
    if (!employee.puesto) {
      newErrors.puesto = 'Puesto es requerido';
    }
    if (!employee.fechaIngreso) {
      newErrors.fechaIngreso = 'Fecha de ingreso es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditing && id) {
        // Update existing employee
        await EmployeeService.updateEmployee(id, employee);
        console.log('Employee updated successfully');
      } else {
        // Create new employee
        const newEmployeeId = await EmployeeService.createEmployee(employee);
        console.log('Employee created successfully with ID:', newEmployeeId);
      }

      navigate('/');
    } catch (error) {
      console.error('Error saving employee:', error);
      // For now, just log the error. In production, you might want to show a user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEmployee(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof Employee] as any,
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setEmployee(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (loading && isEditing) {
    return <div className="loading">Cargando empleado...</div>;
  }

  const handlePhotoUploaded = (url: string) => {
    setEmployee(prev => ({ ...prev, fotoUrl: url }));
  };

  const handlePhotoRemoved = () => {
    setEmployee(prev => ({ ...prev, fotoUrl: undefined }));
  };

  return (
    <div className="employee-form">
      <h2>{isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>

      <div className="photo-section">
        <PhotoUpload
          currentPhotoUrl={employee.fotoUrl}
          onPhotoUploaded={handlePhotoUploaded}
          onPhotoRemoved={handlePhotoRemoved}
          disabled={loading}
        />
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        {/* Información Personal Básica */}
        <div className="form-section">
          <h3>Información Personal Básica</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dni">DNI *</label>
              <input
                type="text"
                id="dni"
                name="dni"
                value={employee.dni}
                onChange={handleInputChange}
                maxLength={8}
                className={errors.dni ? 'error' : ''}
              />
              {errors.dni && <span className="error-message">{errors.dni}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="employeeCode">Código Empleado</label>
              <input
                type="text"
                id="employeeCode"
                name="employeeCode"
                value={employee.employeeCode}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="apellidoPaterno">Apellido Paterno *</label>
              <input
                type="text"
                id="apellidoPaterno"
                name="apellidoPaterno"
                value={employee.apellidoPaterno}
                onChange={handleInputChange}
                className={errors.apellidoPaterno ? 'error' : ''}
              />
              {errors.apellidoPaterno && <span className="error-message">{errors.apellidoPaterno}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="apellidoMaterno">Apellido Materno *</label>
              <input
                type="text"
                id="apellidoMaterno"
                name="apellidoMaterno"
                value={employee.apellidoMaterno}
                onChange={handleInputChange}
                className={errors.apellidoMaterno ? 'error' : ''}
              />
              {errors.apellidoMaterno && <span className="error-message">{errors.apellidoMaterno}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nombres">Nombres *</label>
            <input
              type="text"
              id="nombres"
              name="nombres"
              value={employee.nombres}
              onChange={handleInputChange}
              className={errors.nombres ? 'error' : ''}
            />
            {errors.nombres && <span className="error-message">{errors.nombres}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="puesto">Puesto *</label>
              <input
                type="text"
                id="puesto"
                name="puesto"
                value={employee.puesto}
                onChange={handleInputChange}
                className={errors.puesto ? 'error' : ''}
              />
              {errors.puesto && <span className="error-message">{errors.puesto}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="fechaIngreso">Fecha de Ingreso *</label>
              <input
                type="date"
                id="fechaIngreso"
                name="fechaIngreso"
                value={employee.fechaIngreso}
                onChange={handleInputChange}
                className={errors.fechaIngreso ? 'error' : ''}
              />
              {errors.fechaIngreso && <span className="error-message">{errors.fechaIngreso}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="regimenLaboral">Régimen Laboral</label>
            <select
              id="regimenLaboral"
              name="regimenLaboral"
              value={employee.regimenLaboral}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar...</option>
              <option value="construccion">Régimen de Construcción Civil</option>
              <option value="comun">Régimen Laboral Común</option>
            </select>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="form-section">
          <h3>Información de Contacto</h3>

          <div className="form-group">
            <label htmlFor="direccionActual">Dirección Actual</label>
            <input
              type="text"
              id="direccionActual"
              name="direccionActual"
              value={employee.direccionActual}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="referenciaDireccion">Referencia de Dirección</label>
            <input
              type="text"
              id="referenciaDireccion"
              name="referenciaDireccion"
              value={employee.referenciaDireccion}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefonoCelular">Teléfono Celular</label>
              <input
                type="tel"
                id="telefonoCelular"
                name="telefonoCelular"
                value={employee.telefonoCelular}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefonoFijo">Teléfono Fijo</label>
              <input
                type="tel"
                id="telefonoFijo"
                name="telefonoFijo"
                value={employee.telefonoFijo}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={employee.email}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/')} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;