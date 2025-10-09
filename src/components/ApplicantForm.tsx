import React, { useState, useEffect } from 'react';
import { Applicant, ApplicantStatus } from '../types/applicant';
import { ApplicantService } from '../services/applicantService';
import { ProjectService, Project } from '../services/projectService';
import { Button, Card } from './ui';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

interface ApplicantFormProps {
  applicant?: Applicant;
  onSuccess?: (applicant: Applicant) => void;
  onCancel?: () => void;
}

const ApplicantForm: React.FC<ApplicantFormProps> = ({
  applicant,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Información Personal
    dni: applicant?.dni || '',
    apellidoPaterno: applicant?.apellidoPaterno || '',
    apellidoMaterno: applicant?.apellidoMaterno || '',
    nombres: applicant?.nombres || '',
    fechaNacimiento: applicant?.fechaNacimiento || '',
    lugarNacimiento: {
      departamento: applicant?.lugarNacimiento.departamento || '',
      provincia: applicant?.lugarNacimiento.provincia || '',
      distrito: applicant?.lugarNacimiento.distrito || ''
    },
    sexo: applicant?.sexo || 'Masculino',
    estadoCivil: applicant?.estadoCivil || 'Soltero',

    // Información de Contacto
    direccionActual: applicant?.direccionActual || '',
    referenciaDireccion: applicant?.referenciaDireccion || '',
    telefonoCelular: applicant?.telefonoCelular || '',
    telefonoFijo: applicant?.telefonoFijo || '',
    email: applicant?.email || '',

    // Información Laboral
    puestoInteres: applicant?.puestoInteres || '',
    proyectoInteres: applicant?.proyectoInteres || '',
    experienciaPrevia: applicant?.experienciaPrevia || '',
    salarioEsperado: applicant?.salarioEsperado || '',
    disponibilidadInmediata: applicant?.disponibilidadInmediata ?? true,
    fechaDisponibilidad: applicant?.fechaDisponibilidad || '',

    // Información Académica
    gradoInstruccion: applicant?.gradoInstruccion || '',
    nombreInstitucion: applicant?.nombreInstitucion || '',
    carreraProfesional: applicant?.carreraProfesional || '',
    anoEgreso: applicant?.anoEgreso || new Date().getFullYear(),

    // Información Adicional
    fuentePostulacion: applicant?.fuentePostulacion || 'web',
    referidoPor: applicant?.referidoPor || '',
    observaciones: applicant?.observaciones || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load projects for dropdown
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const projectsData = await ProjectService.getAllProjects();
        setProjects(projectsData);
      } catch (error) {
        logger.error('Error loading projects for applicant form', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  const totalSteps = 4;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Información Personal
        if (!formData.dni) newErrors.dni = 'DNI es requerido';
        if (!formData.apellidoPaterno) newErrors.apellidoPaterno = 'Apellido paterno es requerido';
        if (!formData.apellidoMaterno) newErrors.apellidoMaterno = 'Apellido materno es requerido';
        if (!formData.nombres) newErrors.nombres = 'Nombres son requeridos';
        if (!formData.fechaNacimiento) newErrors.fechaNacimiento = 'Fecha de nacimiento es requerida';
        if (!formData.lugarNacimiento.departamento) newErrors['lugarNacimiento.departamento'] = 'Departamento es requerido';
        if (!formData.lugarNacimiento.provincia) newErrors['lugarNacimiento.provincia'] = 'Provincia es requerida';
        if (!formData.lugarNacimiento.distrito) newErrors['lugarNacimiento.distrito'] = 'Distrito es requerido';
        break;

      case 2: // Información de Contacto
        if (!formData.direccionActual) newErrors.direccionActual = 'Dirección es requerida';
        if (!formData.referenciaDireccion) newErrors.referenciaDireccion = 'Referencia es requerida';
        if (!formData.telefonoCelular) newErrors.telefonoCelular = 'Teléfono celular es requerido';
        if (!formData.email) newErrors.email = 'Email es requerido';
        break;

      case 3: // Información Laboral y Académica
        if (!formData.puestoInteres) newErrors.puestoInteres = 'Puesto de interés es requerido';
        if (!formData.experienciaPrevia) newErrors.experienciaPrevia = 'Experiencia previa es requerida';
        if (!formData.gradoInstruccion) newErrors.gradoInstruccion = 'Grado de instrucción es requerido';
        if (!formData.nombreInstitucion) newErrors.nombreInstitucion = 'Institución es requerida';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('lugarNacimiento.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        lugarNacimiento: {
          ...prev.lugarNacimiento,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);

    try {
      const applicantData = {
        ...formData,
        salarioEsperado: formData.salarioEsperado ? Number(formData.salarioEsperado) : undefined,
        anoEgreso: Number(formData.anoEgreso),
        estudiosComplementarios: [],
        entrevistas: [],
        notificacionesEnviadas: [],
        status: 'pendiente' as ApplicantStatus,
        fechaPostulacion: new Date().toISOString(),
        fechaUltimaActualizacion: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        actualizadoPor: user?.uid
      };

      let result: Applicant;

      if (applicant?.id) {
        // Actualizar postulante existente
        await ApplicantService.updateApplicant(applicant.id, applicantData);
        result = { ...applicant, ...applicantData };
        logger.info('Applicant updated successfully', { id: applicant.id });
      } else {
        // Crear nuevo postulante
        const id = await ApplicantService.createApplicant(applicantData);
        result = { id, ...applicantData } as Applicant;
        logger.info('Applicant created successfully', { id });
      }

      onSuccess?.(result);
    } catch (error) {
      logger.error('Error saving applicant', error);
      setErrors({ general: 'Error al guardar el postulante. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
        <div
          key={step}
          className={`step ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
        >
          <div className="step-number">{step}</div>
          <div className="step-label">
            {step === 1 && 'Información Personal'}
            {step === 2 && 'Contacto'}
            {step === 3 && 'Laboral y Académica'}
            {step === 4 && 'Finalizar'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-section">
            <h3>Información Personal</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dni">DNI *</label>
                <input
                  type="text"
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  className={errors.dni ? 'error' : ''}
                  maxLength={8}
                />
                {errors.dni && <span className="error-message">{errors.dni}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="apellidoPaterno">Apellido Paterno *</label>
                <input
                  type="text"
                  id="apellidoPaterno"
                  name="apellidoPaterno"
                  value={formData.apellidoPaterno}
                  onChange={handleInputChange}
                  className={errors.apellidoPaterno ? 'error' : ''}
                />
                {errors.apellidoPaterno && <span className="error-message">{errors.apellidoPaterno}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="apellidoMaterno">Apellido Materno *</label>
                <input
                  type="text"
                  id="apellidoMaterno"
                  name="apellidoMaterno"
                  value={formData.apellidoMaterno}
                  onChange={handleInputChange}
                  className={errors.apellidoMaterno ? 'error' : ''}
                />
                {errors.apellidoMaterno && <span className="error-message">{errors.apellidoMaterno}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="nombres">Nombres *</label>
                <input
                  type="text"
                  id="nombres"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleInputChange}
                  className={errors.nombres ? 'error' : ''}
                />
                {errors.nombres && <span className="error-message">{errors.nombres}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fechaNacimiento">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleInputChange}
                  className={errors.fechaNacimiento ? 'error' : ''}
                />
                {errors.fechaNacimiento && <span className="error-message">{errors.fechaNacimiento}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="sexo">Sexo *</label>
                <select
                  id="sexo"
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleInputChange}
                  className={errors.sexo ? 'error' : ''}
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
                {errors.sexo && <span className="error-message">{errors.sexo}</span>}
              </div>
            </div>

            <div className="form-section">
              <h4>Lugar de Nacimiento</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="lugarNacimiento.departamento">Departamento *</label>
                  <input
                    type="text"
                    id="lugarNacimiento.departamento"
                    name="lugarNacimiento.departamento"
                    value={formData.lugarNacimiento.departamento}
                    onChange={handleInputChange}
                    className={errors['lugarNacimiento.departamento'] ? 'error' : ''}
                    placeholder="Ej: Lima"
                  />
                  {errors['lugarNacimiento.departamento'] && <span className="error-message">{errors['lugarNacimiento.departamento']}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lugarNacimiento.provincia">Provincia *</label>
                  <input
                    type="text"
                    id="lugarNacimiento.provincia"
                    name="lugarNacimiento.provincia"
                    value={formData.lugarNacimiento.provincia}
                    onChange={handleInputChange}
                    className={errors['lugarNacimiento.provincia'] ? 'error' : ''}
                    placeholder="Ej: Lima"
                  />
                  {errors['lugarNacimiento.provincia'] && <span className="error-message">{errors['lugarNacimiento.provincia']}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="lugarNacimiento.distrito">Distrito *</label>
                  <input
                    type="text"
                    id="lugarNacimiento.distrito"
                    name="lugarNacimiento.distrito"
                    value={formData.lugarNacimiento.distrito}
                    onChange={handleInputChange}
                    className={errors['lugarNacimiento.distrito'] ? 'error' : ''}
                    placeholder="Ej: Miraflores"
                  />
                  {errors['lugarNacimiento.distrito'] && <span className="error-message">{errors['lugarNacimiento.distrito']}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="estadoCivil">Estado Civil *</label>
                  <select
                    id="estadoCivil"
                    name="estadoCivil"
                    value={formData.estadoCivil}
                    onChange={handleInputChange}
                  >
                    <option value="Soltero">Soltero</option>
                    <option value="Casado">Casado</option>
                    <option value="Divorciado">Divorciado</option>
                    <option value="Viudo">Viudo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-section">
            <h3>Información de Contacto</h3>

            <div className="form-group">
              <label htmlFor="direccionActual">Dirección Actual *</label>
              <input
                type="text"
                id="direccionActual"
                name="direccionActual"
                value={formData.direccionActual}
                onChange={handleInputChange}
                className={errors.direccionActual ? 'error' : ''}
                placeholder="Ej: Av. Principal 123"
              />
              {errors.direccionActual && <span className="error-message">{errors.direccionActual}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="referenciaDireccion">Referencia de Dirección *</label>
              <input
                type="text"
                id="referenciaDireccion"
                name="referenciaDireccion"
                value={formData.referenciaDireccion}
                onChange={handleInputChange}
                className={errors.referenciaDireccion ? 'error' : ''}
                placeholder="Ej: Frente al parque, casa azul"
              />
              {errors.referenciaDireccion && <span className="error-message">{errors.referenciaDireccion}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefonoCelular">Teléfono Celular *</label>
                <input
                  type="tel"
                  id="telefonoCelular"
                  name="telefonoCelular"
                  value={formData.telefonoCelular}
                  onChange={handleInputChange}
                  className={errors.telefonoCelular ? 'error' : ''}
                  placeholder="987654321"
                />
                {errors.telefonoCelular && <span className="error-message">{errors.telefonoCelular}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="telefonoFijo">Teléfono Fijo</label>
                <input
                  type="tel"
                  id="telefonoFijo"
                  name="telefonoFijo"
                  value={formData.telefonoFijo}
                  onChange={handleInputChange}
                  className={errors.telefonoFijo ? 'error' : ''}
                  placeholder="012345678"
                />
                {errors.telefonoFijo && <span className="error-message">{errors.telefonoFijo}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-section">
            <h3>Información Laboral</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="puestoInteres">Puesto de Interés *</label>
                <input
                  type="text"
                  id="puestoInteres"
                  name="puestoInteres"
                  value={formData.puestoInteres}
                  onChange={handleInputChange}
                  className={errors.puestoInteres ? 'error' : ''}
                  placeholder="Ej: Desarrollador Frontend"
                />
                {errors.puestoInteres && <span className="error-message">{errors.puestoInteres}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="proyectoInteres">Proyecto al que Postula</label>
                <select
                  id="proyectoInteres"
                  name="proyectoInteres"
                  value={formData.proyectoInteres}
                  onChange={handleInputChange}
                  className={errors.proyectoInteres ? 'error' : ''}
                >
                  <option value="">Seleccionar proyecto...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.contrato}
                    </option>
                  ))}
                </select>
                {errors.proyectoInteres && <span className="error-message">{errors.proyectoInteres}</span>}
                <small className="help-text">
                  Selecciona el proyecto específico al que deseas postular
                </small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="experienciaPrevia">Experiencia Previa *</label>
              <textarea
                id="experienciaPrevia"
                name="experienciaPrevia"
                value={formData.experienciaPrevia}
                onChange={handleInputChange}
                className={errors.experienciaPrevia ? 'error' : ''}
                rows={4}
                placeholder="Describe tu experiencia laboral previa..."
              />
              {errors.experienciaPrevia && <span className="error-message">{errors.experienciaPrevia}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="salarioEsperado">Salario Esperado (S/.)</label>
                <input
                  type="number"
                  id="salarioEsperado"
                  name="salarioEsperado"
                  value={formData.salarioEsperado}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                  placeholder="3000"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.disponibilidadInmediata}
                    onChange={(e) => setFormData(prev => ({ ...prev, disponibilidadInmediata: e.target.checked }))}
                  />
                  Disponibilidad inmediata
                </label>
              </div>
            </div>

            {!formData.disponibilidadInmediata && (
              <div className="form-group">
                <label htmlFor="fechaDisponibilidad">Fecha de Disponibilidad</label>
                <input
                  type="date"
                  id="fechaDisponibilidad"
                  name="fechaDisponibilidad"
                  value={formData.fechaDisponibilidad}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <h3>Información Académica</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gradoInstruccion">Grado de Instrucción *</label>
                <select
                  id="gradoInstruccion"
                  name="gradoInstruccion"
                  value={formData.gradoInstruccion}
                  onChange={handleInputChange}
                  className={errors.gradoInstruccion ? 'error' : ''}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Universitario">Universitario</option>
                  <option value="Postgrado">Postgrado</option>
                  <option value="Maestría">Maestría</option>
                  <option value="Doctorado">Doctorado</option>
                </select>
                {errors.gradoInstruccion && <span className="error-message">{errors.gradoInstruccion}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="anoEgreso">Año de Egreso *</label>
                <input
                  type="number"
                  id="anoEgreso"
                  name="anoEgreso"
                  value={formData.anoEgreso}
                  onChange={handleInputChange}
                  min="1950"
                  max={new Date().getFullYear()}
                  className={errors.anoEgreso ? 'error' : ''}
                />
                {errors.anoEgreso && <span className="error-message">{errors.anoEgreso}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombreInstitucion">Nombre de Institución *</label>
                <input
                  type="text"
                  id="nombreInstitucion"
                  name="nombreInstitucion"
                  value={formData.nombreInstitucion}
                  onChange={handleInputChange}
                  className={errors.nombreInstitucion ? 'error' : ''}
                  placeholder="Ej: Universidad Nacional Mayor de San Marcos"
                />
                {errors.nombreInstitucion && <span className="error-message">{errors.nombreInstitucion}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="carreraProfesional">Carrera Profesional</label>
                <input
                  type="text"
                  id="carreraProfesional"
                  name="carreraProfesional"
                  value={formData.carreraProfesional}
                  onChange={handleInputChange}
                  placeholder="Ej: Ingeniería de Sistemas"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-section">
            <h3>Información Adicional</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fuentePostulacion">¿Cómo nos conociste? *</label>
                <select
                  id="fuentePostulacion"
                  name="fuentePostulacion"
                  value={formData.fuentePostulacion}
                  onChange={handleInputChange}
                >
                  <option value="web">Página Web</option>
                  <option value="referido">Referido por alguien</option>
                  <option value="feria_empleo">Feria de Empleo</option>
                  <option value="redes_sociales">Redes Sociales</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {formData.fuentePostulacion === 'referido' && (
                <div className="form-group">
                  <label htmlFor="referidoPor">Referido por</label>
                  <input
                    type="text"
                    id="referidoPor"
                    name="referidoPor"
                    value={formData.referidoPor}
                    onChange={handleInputChange}
                    placeholder="Nombre de quien te refirió"
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows={3}
                placeholder="Información adicional que consideres importante..."
              />
            </div>

            {errors.general && (
              <div className="error-message" style={{ marginTop: '20px' }}>
                {errors.general}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="applicant-form">
      <div className="applicant-form-header">
        <h2>{applicant?.id ? 'Editar Postulante' : 'Nueva Postulación'}</h2>
        <div className="form-subtitle">
          Complete todos los campos requeridos para enviar su postulación
        </div>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="applicant-form-content">
        {renderStepContent()}

        <div className="form-actions">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevious}
            >
              Anterior
            </Button>
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              type="submit"
              variant="success"
              disabled={loading}
            >
              {loading ? 'Enviando...' : (applicant?.id ? 'Actualizar Postulación' : 'Enviar Postulación')}
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default ApplicantForm;