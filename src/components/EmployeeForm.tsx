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
  const [successMessage, setSuccessMessage] = useState<string>('');

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
      setErrors({ general: 'Error al cargar los datos del empleado' });
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
    setSuccessMessage('');
    setErrors({});

    try {
      if (isEditing && id) {
        // Update existing employee in Firestore
        await EmployeeService.updateEmployee(id, employee);
        setSuccessMessage('Empleado actualizado exitosamente!');
      } else {
        // Create new employee in Firestore
        await EmployeeService.createEmployee(employee);
        setSuccessMessage('Empleado creado exitosamente!');
      }

      // Show success message for 2 seconds, then navigate
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error saving employee:', error);
      setErrors({ general: 'Error al guardar el empleado. Por favor, inténtalo de nuevo.' });
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

      {successMessage && (
        <div className="success-message">
          ✅ {successMessage}
        </div>
      )}

      {errors.general && (
        <div className="error-message-general">
          ❌ {errors.general}
        </div>
      )}

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
                placeholder={isEditing ? employee.employeeCode : "Se generará automáticamente"}
                disabled={!isEditing}
                className={!isEditing ? 'auto-generated' : ''}
              />
              {!isEditing && <small className="help-text">El código se genera automáticamente al guardar</small>}
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