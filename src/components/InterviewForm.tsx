import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { InterviewService } from '../services/interviewService';
import { ApplicantService } from '../services/applicantService';
import { ProjectService, Project } from '../services/projectService';
import { Interview, InterviewType, InterviewStatus } from '../types/interview';
import { Applicant } from '../types/applicant';
import { Button, Card } from './ui';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

const InterviewForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [interview, setInterview] = useState<Partial<Interview>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load applicant and projects data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        // Load projects for dropdown
        const projectsData = await ProjectService.getAllProjects();
        setProjects(projectsData);

        // If editing existing interview, load interview data
        if (id) {
          const interviewData = await InterviewService.getInterviewById(id);
          if (interviewData) {
            setInterview(interviewData);
          }
        }
      } catch (error) {
        logger.error('Error loading form data', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [id]);

  // Load applicant data when applicantId changes
  useEffect(() => {
    const loadApplicant = async () => {
      if (interview.applicantId) {
        try {
          const applicantData = await ApplicantService.getApplicantById(interview.applicantId);
          setApplicant(applicantData);
        } catch (error) {
          logger.error('Error loading applicant', error);
        }
      }
    };

    loadApplicant();
  }, [interview.applicantId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'applicantId') {
      // When applicant changes, load applicant data
      setInterview(prev => ({
        ...prev,
        applicantId: value,
        applicantDNI: '',
        applicantName: '',
        applicantEmail: '',
        applicantPhone: ''
      }));

      // Load applicant data
      const loadApplicantData = async () => {
        try {
          const applicantData = await ApplicantService.getApplicantById(value);
          if (applicantData) {
            setApplicant(applicantData);
            setInterview(prev => ({
              ...prev,
              applicantDNI: applicantData.dni,
              applicantName: `${applicantData.apellidoPaterno} ${applicantData.apellidoMaterno}, ${applicantData.nombres}`,
              applicantEmail: applicantData.email,
              applicantPhone: applicantData.telefonoCelular,
              puestoInteres: applicantData.puestoInteres,
              proyectoInteres: applicantData.proyectoInteres
            }));
          }
        } catch (error) {
          logger.error('Error loading applicant data', error);
        }
      };

      loadApplicantData();
    } else {
      setInterview(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!interview.applicantId) newErrors.applicantId = 'Postulante es requerido';
    if (!interview.fechaEntrevista) newErrors.fechaEntrevista = 'Fecha de entrevista es requerida';
    if (!interview.tipoEntrevista) newErrors.tipoEntrevista = 'Tipo de entrevista es requerido';
    if (!interview.entrevistadorPrincipal) newErrors.entrevistadorPrincipal = 'Entrevistador principal es requerido';
    if (!interview.duracionEstimada) newErrors.duracionEstimada = 'Duración estimada es requerida';

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
      const currentUser = localStorage.getItem('currentUser');
      const userId = currentUser ? JSON.parse(currentUser).uid : 'system';

      const interviewData: Omit<Interview, 'id'> = {
        applicantId: interview.applicantId!,
        applicantDNI: interview.applicantDNI!,
        applicantName: interview.applicantName!,
        applicantEmail: interview.applicantEmail!,
        applicantPhone: interview.applicantPhone!,
        puestoInteres: interview.puestoInteres!,
        proyectoInteres: interview.proyectoInteres,
        fechaEntrevista: interview.fechaEntrevista!,
        tipoEntrevista: interview.tipoEntrevista as InterviewType,
        modalidad: interview.modalidad as 'presencial' | 'virtual' | 'telefonica',
        ubicacion: interview.ubicacion,
        plataforma: interview.plataforma,
        linkReunion: interview.linkReunion,
        entrevistadorPrincipal: interview.entrevistadorPrincipal!,
        entrevistadoresAdicionales: interview.entrevistadoresAdicionales,
        departamentoEntrevistador: interview.departamentoEntrevistador || '',
        status: 'programada' as InterviewStatus,
        duracionEstimada: Number(interview.duracionEstimada!),
        horaInicio: interview.horaInicio,
        horaFin: interview.horaFin,
        duracionReal: interview.duracionReal,
        calificacionGeneral: interview.calificacionGeneral,
        evaluacionTecnica: interview.evaluacionTecnica,
        evaluacionActitudinal: interview.evaluacionActitudinal,
        evaluacionComunicacion: interview.evaluacionComunicacion,
        conocimientosTecnicos: interview.conocimientosTecnicos,
        experienciaLaboral: interview.experienciaLaboral,
        motivacion: interview.motivacion,
        adaptabilidad: interview.adaptabilidad,
        trabajoEquipo: interview.trabajoEquipo,
        liderazgo: interview.liderazgo,
        fortalezas: interview.fortalezas,
        areasMejora: interview.areasMejora,
        observaciones: interview.observaciones,
        notasAdicionales: interview.notasAdicionales,
        pretensionSalarial: interview.pretensionSalarial,
        montoOfrecido: interview.montoOfrecido,
        llegoAcuerdo: interview.llegoAcuerdo,
        fechaInicio: interview.fechaInicio,
        viveEn: interview.viveEn,
        disponibilidad: interview.disponibilidad,
        requiereSegundaEntrevista: interview.requiereSegundaEntrevista,
        fechaSegundaEntrevista: interview.fechaSegundaEntrevista,
        tipoSegundaEntrevista: interview.tipoSegundaEntrevista,
        creadaPor: userId,
        actualizadaPor: userId,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        notificacionesEnviadas: [],
        archivosAdjuntos: []
      };

      if (id) {
        // Update existing interview
        await InterviewService.updateInterview(id, interviewData);
        logger.info('Interview updated successfully', { id });
        window.alert('Entrevista actualizada exitosamente');
      } else {
        // Create new interview
        const interviewId = await InterviewService.createInterview(interviewData);
        logger.info('Interview created successfully', { id: interviewId });
        window.alert('Entrevista programada exitosamente');
      }

      // Reset form or navigate back
      window.history.back();
    } catch (error) {
      logger.error('Error saving interview', error);
      setErrors({ general: 'Error al guardar la entrevista. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Card>
        <div className="loading">Cargando datos del formulario...</div>
      </Card>
    );
  }

  return (
    <Card className="interview-form">
      <div className="form-header">
        <h2>{id ? 'Editar Entrevista' : 'Programar Nueva Entrevista'}</h2>
        <p>Complete todos los campos requeridos para programar una entrevista</p>
      </div>

      <form onSubmit={handleSubmit} className="interview-form-content">
        {/* Información del Postulante */}
        <div className="form-section">
          <h3>Información del Postulante</h3>

          <div className="form-group">
            <label htmlFor="applicantId">Postulante *</label>
            <select
              id="applicantId"
              name="applicantId"
              value={interview.applicantId || ''}
              onChange={handleInputChange}
              className={errors.applicantId ? 'error' : ''}
            >
              <option value="">Seleccionar postulante...</option>
              {/* This would be populated with applicants that can be interviewed */}
            </select>
            {errors.applicantId && <span className="error-message">{errors.applicantId}</span>}
          </div>

          {applicant && (
            <div className="applicant-info-summary">
              <h4>Información del Postulante Seleccionado:</h4>
              <div className="info-grid">
                <div className="info-item">
                  <label>DNI:</label>
                  <span>{applicant.dni}</span>
                </div>
                <div className="info-item">
                  <label>Nombre:</label>
                  <span>{`${applicant.apellidoPaterno} ${applicant.apellidoMaterno}, ${applicant.nombres}`}</span>
                </div>
                <div className="info-item">
                  <label>Puesto de Interés:</label>
                  <span>{applicant.puestoInteres}</span>
                </div>
                <div className="info-item">
                  <label>Proyecto:</label>
                  <span>{applicant.proyectoInteres || 'No especificado'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Información de la Entrevista */}
        <div className="form-section">
          <h3>Información de la Entrevista</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fechaEntrevista">Fecha y Hora *</label>
              <input
                type="datetime-local"
                id="fechaEntrevista"
                name="fechaEntrevista"
                value={interview.fechaEntrevista || ''}
                onChange={handleInputChange}
                className={errors.fechaEntrevista ? 'error' : ''}
              />
              {errors.fechaEntrevista && <span className="error-message">{errors.fechaEntrevista}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tipoEntrevista">Tipo de Entrevista *</label>
              <select
                id="tipoEntrevista"
                name="tipoEntrevista"
                value={interview.tipoEntrevista || ''}
                onChange={handleInputChange}
                className={errors.tipoEntrevista ? 'error' : ''}
              >
                <option value="">Seleccionar tipo...</option>
                <option value="telefonica">Telefónica</option>
                <option value="virtual">Virtual</option>
                <option value="presencial">Presencial</option>
                <option value="tecnica">Técnica</option>
                <option value="psicologica">Psicológica</option>
                <option value="final">Final</option>
              </select>
              {errors.tipoEntrevista && <span className="error-message">{errors.tipoEntrevista}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modalidad">Modalidad</label>
              <select
                id="modalidad"
                name="modalidad"
                value={interview.modalidad || ''}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar modalidad...</option>
                <option value="telefonica">Telefónica</option>
                <option value="virtual">Virtual</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="duracionEstimada">Duración Estimada (minutos) *</label>
              <input
                type="number"
                id="duracionEstimada"
                name="duracionEstimada"
                value={interview.duracionEstimada || ''}
                onChange={handleInputChange}
                min="15"
                max="480"
                className={errors.duracionEstimada ? 'error' : ''}
              />
              {errors.duracionEstimada && <span className="error-message">{errors.duracionEstimada}</span>}
            </div>
          </div>

          {/* Conditional fields based on interview type */}
          {interview.modalidad === 'presencial' && (
            <div className="form-group">
              <label htmlFor="ubicacion">Ubicación</label>
              <input
                type="text"
                id="ubicacion"
                name="ubicacion"
                value={interview.ubicacion || ''}
                onChange={handleInputChange}
                placeholder="Dirección o lugar de la entrevista"
              />
            </div>
          )}

          {interview.modalidad === 'virtual' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="plataforma">Plataforma</label>
                <select
                  id="plataforma"
                  name="plataforma"
                  value={interview.plataforma || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccionar plataforma...</option>
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="skype">Skype</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="linkReunion">Link de Reunión</label>
                <input
                  type="url"
                  id="linkReunion"
                  name="linkReunion"
                  value={interview.linkReunion || ''}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Información del Entrevistador */}
        <div className="form-section">
          <h3>Información del Entrevistador</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="entrevistadorPrincipal">Entrevistador Principal *</label>
              <input
                type="text"
                id="entrevistadorPrincipal"
                name="entrevistadorPrincipal"
                value={interview.entrevistadorPrincipal || ''}
                onChange={handleInputChange}
                className={errors.entrevistadorPrincipal ? 'error' : ''}
                placeholder="Nombre del entrevistador principal"
              />
              {errors.entrevistadorPrincipal && <span className="error-message">{errors.entrevistadorPrincipal}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="departamentoEntrevistador">Departamento</label>
              <input
                type="text"
                id="departamentoEntrevistador"
                name="departamentoEntrevistador"
                value={interview.departamentoEntrevistador || ''}
                onChange={handleInputChange}
                placeholder="Departamento del entrevistador"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="entrevistadoresAdicionales">Entrevistadores Adicionales</label>
            <input
              type="text"
              id="entrevistadoresAdicionales"
              name="entrevistadoresAdicionales"
              value={interview.entrevistadoresAdicionales?.join(', ') || ''}
              onChange={(e) => {
                const value = e.target.value;
                setInterview(prev => ({
                  ...prev,
                  entrevistadoresAdicionales: value ? value.split(',').map(s => s.trim()).filter(s => s) : undefined
                }));
              }}
              placeholder="Nombres separados por comas"
            />
          </div>
        </div>

        {/* Notas y Observaciones */}
        <div className="form-section">
          <h3>Notas y Observaciones</h3>

          <div className="form-group">
            <label htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={interview.observaciones || ''}
              onChange={handleInputChange}
              rows={4}
              placeholder="Notas adicionales sobre la entrevista..."
            />
          </div>
        </div>

        {errors.general && (
          <div className="error-message" style={{ marginTop: '20px' }}>
            {errors.general}
          </div>
        )}

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="success"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (id ? 'Actualizar Entrevista' : 'Programar Entrevista')}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default InterviewForm;