import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EmployeeService, Employee } from '../services/employeeService';
import PhotoUpload from './PhotoUpload';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
}

const EmployeeWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
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
    assignedProjects: [],
    isActive: true,
    creationStep: 1
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  const steps: WizardStep[] = [
    {
      id: 1,
      title: 'Información Básica',
      description: 'Datos personales principales del empleado',
      required: true,
      completed: false
    },
    {
      id: 2,
      title: 'Información de Contacto',
      description: 'Dirección, teléfonos y datos de contacto',
      required: false,
      completed: false
    },
    {
      id: 3,
      title: 'Información Laboral',
      description: 'Puesto, régimen laboral y datos bancarios',
      required: false,
      completed: false
    },
    {
      id: 4,
      title: 'Información Académica',
      description: 'Grado de instrucción y formación académica',
      required: false,
      completed: false
    },
    {
      id: 5,
      title: 'Información Familiar',
      description: 'Datos del cónyuge e hijos',
      required: false,
      completed: false
    },
    {
      id: 6,
      title: 'Información Adicional',
      description: 'EPP, licencias y datos complementarios',
      required: false,
      completed: false
    }
  ];

  useEffect(() => {
    if (isEditing) {
      loadEmployeeData();
    }
  }, [id, isEditing]);

  const loadEmployeeData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const employeeData = await EmployeeService.getEmployeeById(id);
      if (employeeData) {
        setEmployee(employeeData);
        setCurrentStep(employeeData.creationStep || 1);
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

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};

    switch (step) {
      case 1: // Información Básica
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
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const autoSave = async () => {
    if (isEditing && id) {
      try {
        setSaving(true);
        await EmployeeService.updateEmployee(id, {
          ...employee,
          creationStep: currentStep
        });
        console.log('Auto-saved step', currentStep);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Auto-save current step
    await autoSave();

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to completed steps or current step
    if (stepId <= currentStep || steps[stepId - 1]?.completed) {
      setCurrentStep(stepId);
      setErrors({});
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

  const handlePhotoUploaded = (url: string) => {
    setEmployee(prev => ({ ...prev, fotoUrl: url }));
  };

  const handlePhotoRemoved = () => {
    setEmployee(prev => ({ ...prev, fotoUrl: undefined }));
  };

  const handleFinish = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      if (isEditing && id) {
        await EmployeeService.updateEmployee(id, {
          ...employee,
          creationStep: steps.length // Mark as completed
        });
        setSuccessMessage('Empleado actualizado exitosamente!');
      } else {
        await EmployeeService.createEmployee({
          ...employee,
          creationStep: steps.length // Mark as completed
        });
        setSuccessMessage('Empleado creado exitosamente!');
      }

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="wizard-step-content">
            <div className="photo-section">
              <PhotoUpload
                currentPhotoUrl={employee.fotoUrl}
                onPhotoUploaded={handlePhotoUploaded}
                onPhotoRemoved={handlePhotoRemoved}
                disabled={loading}
              />
            </div>

            <div className="form-grid">
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

              <div className="form-row">
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

                <div className="form-group">
                  <label htmlFor="sexo">Sexo</label>
                  <select
                    id="sexo"
                    name="sexo"
                    value={employee.sexo}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="wizard-step-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="direccionActual">Dirección Actual</label>
                <input
                  type="text"
                  id="direccionActual"
                  name="direccionActual"
                  value={employee.direccionActual}
                  onChange={handleInputChange}
                  placeholder="Ej: Av. Principal 123, San Isidro"
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
                  placeholder="Ej: Frente al parque, cerca del mercado"
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
                    placeholder="987654321"
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
                    placeholder="01-2345678"
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
                  placeholder="correo@empresa.com"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="wizard-step-content">
            <div className="form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="numeroFotocheck">Número de Fotocheck</label>
                  <input
                    type="text"
                    id="numeroFotocheck"
                    name="numeroFotocheck"
                    value={employee.numeroFotocheck}
                    onChange={handleInputChange}
                    placeholder="Número de identificación laboral"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="estadoCivil">Estado Civil</label>
                  <select
                    id="estadoCivil"
                    name="estadoCivil"
                    value={employee.estadoCivil}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="soltero">Soltero/a</option>
                    <option value="casado">Casado/a</option>
                    <option value="divorciado">Divorciado/a</option>
                    <option value="viudo">Viudo/a</option>
                    <option value="conviviente">Conviviente</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="banco">Banco</label>
                  <input
                    type="text"
                    id="banco"
                    name="banco"
                    value={employee.banco}
                    onChange={handleInputChange}
                    placeholder="Ej: BCP, Interbank, BBVA"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="numeroCuenta">Número de Cuenta</label>
                  <input
                    type="text"
                    id="numeroCuenta"
                    name="numeroCuenta"
                    value={employee.numeroCuenta}
                    onChange={handleInputChange}
                    placeholder="Número de cuenta bancaria"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cci">CCI (Código de Cuenta Interbancario)</label>
                  <input
                    type="text"
                    id="cci"
                    name="cci"
                    value={employee.cci}
                    onChange={handleInputChange}
                    placeholder="20 dígitos del CCI"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="factorRH">Factor RH (Grupo Sanguíneo)</label>
                  <select
                    id="factorRH"
                    name="factorRH"
                    value={employee.factorRH}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="antecedentesPenales"
                    checked={employee.antecedentesPenales}
                    onChange={handleInputChange}
                  />
                  ¿Tiene antecedentes penales?
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="wizard-step-content">
            <div className="form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="informacionAcademica.gradoInstruccion">Grado de Instrucción</label>
                  <select
                    id="gradoInstruccion"
                    name="informacionAcademica.gradoInstruccion"
                    value={employee.informacionAcademica.gradoInstruccion}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="primaria">Primaria Completa</option>
                    <option value="secundaria">Secundaria Completa</option>
                    <option value="tecnico">Técnico</option>
                    <option value="universitario">Universitario</option>
                    <option value="postgrado">Postgrado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="informacionAcademica.tipoInstitucion">Tipo de Institución</label>
                  <select
                    id="tipoInstitucion"
                    name="informacionAcademica.tipoInstitucion"
                    value={employee.informacionAcademica.tipoInstitucion}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="publica">Pública</option>
                    <option value="privada">Privada</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="informacionAcademica.nombreInstitucion">Nombre de Institución</label>
                  <input
                    type="text"
                    id="nombreInstitucion"
                    name="informacionAcademica.nombreInstitucion"
                    value={employee.informacionAcademica.nombreInstitucion}
                    onChange={handleInputChange}
                    placeholder="Ej: Universidad Nacional, Instituto Técnico"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="informacionAcademica.carrera">Carrera/Especialidad</label>
                  <input
                    type="text"
                    id="carrera"
                    name="informacionAcademica.carrera"
                    value={employee.informacionAcademica.carrera}
                    onChange={handleInputChange}
                    placeholder="Ej: Ingeniería Civil, Administración"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="informacionAcademica.anoEgreso">Año de Egreso</label>
                <input
                  type="number"
                  id="anoEgreso"
                  name="informacionAcademica.anoEgreso"
                  value={employee.informacionAcademica.anoEgreso || ''}
                  onChange={handleInputChange}
                  min="1950"
                  max={new Date().getFullYear()}
                  placeholder="2020"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="wizard-step-content">
            <div className="form-grid">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="datosFamilia.tieneHijos"
                    checked={employee.datosFamilia.tieneHijos}
                    onChange={handleInputChange}
                  />
                  ¿Tiene hijos?
                </label>
              </div>

              <div className="form-section">
                <h4>Información del Cónyuge/Conviviente</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="conyuge.apellidosNombres">Apellidos y Nombres</label>
                    <input
                      type="text"
                      id="conyuge.apellidosNombres"
                      name="datosFamilia.conyuge.apellidosNombres"
                      value={employee.datosFamilia.conyuge.apellidosNombres}
                      onChange={handleInputChange}
                      placeholder="Ej: García López, María Elena"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="conyuge.dni">DNI</label>
                    <input
                      type="text"
                      id="conyuge.dni"
                      name="datosFamilia.conyuge.dni"
                      value={employee.datosFamilia.conyuge.dni}
                      onChange={handleInputChange}
                      maxLength={8}
                      placeholder="12345678"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="conyuge.fechaNacimiento">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      id="conyuge.fechaNacimiento"
                      name="datosFamilia.conyuge.fechaNacimiento"
                      value={employee.datosFamilia.conyuge.fechaNacimiento}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="conyuge.telefono">Teléfono</label>
                    <input
                      type="tel"
                      id="conyuge.telefono"
                      name="datosFamilia.conyuge.telefono"
                      value={employee.datosFamilia.conyuge.telefono}
                      onChange={handleInputChange}
                      placeholder="987654321"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="conyuge.documentoVinculo">Documento que acredita vínculo</label>
                  <input
                    type="text"
                    id="conyuge.documentoVinculo"
                    name="datosFamilia.conyuge.documentoVinculo"
                    value={employee.datosFamilia.conyuge.documentoVinculo}
                    onChange={handleInputChange}
                    placeholder="Ej: Partida de matrimonio, Declaración jurada"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="wizard-step-content">
            <div className="form-grid">
              <div className="form-section">
                <h4>Equipo de Protección Personal (EPP)</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="epp.tallaCalzado">Talla de Calzado</label>
                    <input
                      type="text"
                      id="tallaCalzado"
                      name="epp.tallaCalzado"
                      value={employee.epp.tallaCalzado}
                      onChange={handleInputChange}
                      placeholder="Ej: 42, 38.5"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="epp.tallaVestimenta">Talla de Vestimenta</label>
                    <input
                      type="text"
                      id="tallaVestimenta"
                      name="epp.tallaVestimenta"
                      value={employee.epp.tallaVestimenta}
                      onChange={handleInputChange}
                      placeholder="Ej: M, L, XL"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Licencias y Permisos</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="licenciaConducir">Licencia de Conducir</label>
                    <input
                      type="text"
                      id="licenciaConducir"
                      name="licenciaConducir"
                      value={employee.licenciaConducir}
                      onChange={handleInputChange}
                      placeholder="Número de licencia"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="categoriaLicencia">Categoría de Licencia</label>
                    <select
                      id="categoriaLicencia"
                      name="categoriaLicencia"
                      value={employee.categoriaLicencia}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="A-I">A-I</option>
                      <option value="A-IIa">A-IIa</option>
                      <option value="A-IIb">A-IIb</option>
                      <option value="A-IIIa">A-IIIa</option>
                      <option value="A-IIIb">A-IIIb</option>
                      <option value="A-IIIc">A-IIIc</option>
                      <option value="B-I">B-I</option>
                      <option value="B-IIa">B-IIa</option>
                      <option value="B-IIb">B-IIb</option>
                      <option value="B-IIc">B-IIc</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Información Adicional</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      value={employee.fechaNacimiento}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="afp">AFP</label>
                    <select
                      id="afp"
                      name="afp"
                      value={employee.afp}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="habitat">Habitat</option>
                      <option value="integra">Integra</option>
                      <option value="prima">Prima</option>
                      <option value="profuturo">Profuturo</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Lugar de Nacimiento</label>
                  <div className="form-row">
                    <input
                      type="text"
                      name="lugarNacimiento.departamento"
                      value={employee.lugarNacimiento.departamento}
                      onChange={handleInputChange}
                      placeholder="Departamento"
                    />
                    <input
                      type="text"
                      name="lugarNacimiento.provincia"
                      value={employee.lugarNacimiento.provincia}
                      onChange={handleInputChange}
                      placeholder="Provincia"
                    />
                    <input
                      type="text"
                      name="lugarNacimiento.distrito"
                      value={employee.lugarNacimiento.distrito}
                      onChange={handleInputChange}
                      placeholder="Distrito"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && isEditing) {
    return <div className="loading">Cargando empleado...</div>;
  }

  const currentStepData = steps.find(step => step.id === currentStep);

  return (
    <div className="employee-wizard">
      <div className="wizard-header">
        <h1>{isEditing ? 'Editar Empleado' : 'Crear Nuevo Empleado'}</h1>
        <div className="wizard-progress">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`wizard-step ${step.id === currentStep ? 'active' : ''} ${step.id < currentStep ? 'completed' : ''}`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="step-number">{step.id}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content">
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

        <div className="wizard-step-header">
          <h2>Paso {currentStep}: {currentStepData?.title}</h2>
          <p>{currentStepData?.description}</p>
          {saving && <small className="auto-save">💾 Guardando automáticamente...</small>}
        </div>

        {renderStepContent()}

        <div className="wizard-navigation">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="btn btn-secondary"
          >
            ← Anterior
          </button>

          <div className="wizard-step-indicator">
            Paso {currentStep} de {steps.length}
          </div>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="btn btn-success"
            >
              {loading ? 'Finalizando...' : 'Finalizar ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeWizard;