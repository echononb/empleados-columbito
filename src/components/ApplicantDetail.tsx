import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApplicantService } from '../services/applicantService';
import { Applicant } from '../types/applicant';
import { Button, Card } from './ui';
import { useAuth } from '../contexts/AuthContext';
import ApplicantStatusModal from './ApplicantStatusModal';
import logger from '../utils/logger';

const ApplicantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userRole } = useAuth();
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const canManage = userRole === 'digitador' || userRole === 'administrador';

  useEffect(() => {
    if (id) {
      loadApplicant();
    }
  }, [id]);

  const loadApplicant = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const applicantData = await ApplicantService.getApplicantById(id);

      if (!applicantData) {
        setError('Postulante no encontrado');
        return;
      }

      setApplicant(applicantData);
    } catch (error) {
      logger.error('Error loading applicant', error);
      setError('Error al cargar los datos del postulante');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (updatedApplicant: Applicant) => {
    setApplicant(updatedApplicant);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pendiente': return 'status-pending';
      case 'en_revision': return 'status-review';
      case 'aprobado': return 'status-approved';
      case 'rechazado': return 'status-rejected';
      case 'contratado': return 'status-hired';
      default: return 'status-default';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'en_revision': return 'En Revisión';
      case 'aprobado': return 'Aprobado';
      case 'rechazado': return 'Rechazado';
      case 'contratado': return 'Contratado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="loading">Cargando detalles del postulante...</div>
      </Card>
    );
  }

  if (error || !applicant) {
    return (
      <Card>
        <div className="error-message">
          {error || 'Postulante no encontrado'}
        </div>
        <div style={{ marginTop: '20px' }}>
          <Link to="/applicants" className="btn btn-primary">
            Volver a Postulantes
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="applicant-detail">
      {/* Header */}
      <div className="applicant-detail-header">
        <div>
          <h2>Detalles del Postulante</h2>
          <div className="applicant-meta">
            <span><strong>DNI:</strong> {applicant.dni}</span>
            <span><strong>Estado:</strong>
              <span className={`status-badge ${getStatusBadgeClass(applicant.status)}`}>
                {getStatusDisplayName(applicant.status)}
              </span>
            </span>
            <span><strong>Fecha Postulación:</strong> {formatDate(applicant.fechaPostulacion)}</span>
          </div>
        </div>

        <div className="header-actions">
          <Link to="/applicants" className="btn btn-secondary">
            Volver a Lista
          </Link>
          <Link to={`/applicants/${applicant.id}/edit`} className="btn btn-primary">
            Editar Postulante
          </Link>
          {canManage && (
            <Button
              variant="primary"
              onClick={() => setShowStatusModal(true)}
            >
              Gestionar Estado
            </Button>
          )}
        </div>
      </div>

      {/* Información Personal */}
      <Card className="detail-section">
        <h3>Información Personal</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Nombre Completo:</label>
            <span>{`${applicant.apellidoPaterno} ${applicant.apellidoMaterno}, ${applicant.nombres}`}</span>
          </div>
          <div className="info-item">
            <label>Fecha de Nacimiento:</label>
            <span>{formatDate(applicant.fechaNacimiento)}</span>
          </div>
          <div className="info-item">
            <label>Sexo:</label>
            <span>{applicant.sexo}</span>
          </div>
          <div className="info-item">
            <label>Estado Civil:</label>
            <span>{applicant.estadoCivil}</span>
          </div>
          <div className="info-item">
            <label>Lugar de Nacimiento:</label>
            <span>{`${applicant.lugarNacimiento.distrito}, ${applicant.lugarNacimiento.provincia}, ${applicant.lugarNacimiento.departamento}`}</span>
          </div>
        </div>
      </Card>

      {/* Información de Contacto */}
      <Card className="detail-section">
        <h3>Información de Contacto</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Dirección:</label>
            <span>{applicant.direccionActual}</span>
          </div>
          <div className="info-item">
            <label>Referencia:</label>
            <span>{applicant.referenciaDireccion}</span>
          </div>
          <div className="info-item">
            <label>Teléfono Celular:</label>
            <span>{applicant.telefonoCelular}</span>
          </div>
          <div className="info-item">
            <label>Teléfono Fijo:</label>
            <span>{applicant.telefonoFijo || 'No especificado'}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{applicant.email}</span>
          </div>
        </div>
      </Card>

      {/* Información Laboral */}
      <Card className="detail-section">
        <h3>Información Laboral</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Puesto de Interés:</label>
            <span>{applicant.puestoInteres}</span>
          </div>
          {applicant.proyectoInteres && (
            <div className="info-item">
              <label>Proyecto al que Postula:</label>
              <span>{applicant.proyectoInteres}</span>
            </div>
          )}
          <div className="info-item">
            <label>Experiencia Previa:</label>
            <span>{applicant.experienciaPrevia}</span>
          </div>
          <div className="info-item">
            <label>Salario Esperado:</label>
            <span>{applicant.salarioEsperado ? `S/ ${applicant.salarioEsperado}` : 'No especificado'}</span>
          </div>
          <div className="info-item">
            <label>Disponibilidad:</label>
            <span>{applicant.disponibilidadInmediata ? 'Inmediata' : `Desde ${formatDate(applicant.fechaDisponibilidad || '')}`}</span>
          </div>
        </div>
      </Card>

      {/* Información Académica */}
      <Card className="detail-section">
        <h3>Información Académica</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Grado de Instrucción:</label>
            <span>{applicant.gradoInstruccion}</span>
          </div>
          <div className="info-item">
            <label>Institución:</label>
            <span>{applicant.nombreInstitucion}</span>
          </div>
          <div className="info-item">
            <label>Carrera:</label>
            <span>{applicant.carreraProfesional || 'No especificada'}</span>
          </div>
          <div className="info-item">
            <label>Año de Egreso:</label>
            <span>{applicant.anoEgreso}</span>
          </div>
        </div>

        {applicant.estudiosComplementarios && applicant.estudiosComplementarios.length > 0 && (
          <div className="studies-section">
            <h4>Estudios Complementarios:</h4>
            <div className="studies-list">
              {applicant.estudiosComplementarios.map((estudio, index) => (
                <div key={index} className="study-item">
                  <strong>{estudio.nombre}</strong> - {estudio.institucion} ({estudio.anoEgreso})
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Información Adicional */}
      <Card className="detail-section">
        <h3>Información Adicional</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Fuente de Postulación:</label>
            <span>{applicant.fuentePostulacion}</span>
          </div>
          {applicant.referidoPor && (
            <div className="info-item">
              <label>Referido por:</label>
              <span>{applicant.referidoPor}</span>
            </div>
          )}
          {applicant.observaciones && (
            <div className="info-item full-width">
              <label>Observaciones:</label>
              <span>{applicant.observaciones}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Información de Seguimiento */}
      <Card className="detail-section">
        <h3>Seguimiento y Estado</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Estado Actual:</label>
            <span className={`status-badge ${getStatusBadgeClass(applicant.status)}`}>
              {getStatusDisplayName(applicant.status)}
            </span>
          </div>
          <div className="info-item">
            <label>Última Actualización:</label>
            <span>{formatDate(applicant.fechaUltimaActualizacion)}</span>
          </div>
          {applicant.actualizadoPor && (
            <div className="info-item">
              <label>Actualizado por:</label>
              <span>{applicant.actualizadoPor}</span>
            </div>
          )}
        </div>

        {/* Información de Conversión */}
        {applicant.convertidoAEmpleado && (
          <div className="conversion-info">
            <h4>✅ Información de Contratación</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Fecha de Contratación:</label>
                <span>{formatDate(applicant.convertidoAEmpleado.fechaConversion)}</span>
              </div>
              <div className="info-item">
                <label>Contratado por:</label>
                <span>{applicant.convertidoAEmpleado.convertidoPor}</span>
              </div>
              {applicant.convertidoAEmpleado.empleadoId && (
                <div className="info-item">
                  <label>ID de Empleado:</label>
                  <span>{applicant.convertidoAEmpleado.empleadoId}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Status Management Modal */}
      {showStatusModal && (
        <ApplicantStatusModal
          applicant={applicant}
          onStatusChange={handleStatusChange}
          onClose={() => setShowStatusModal(false)}
        />
      )}
    </div>
  );
};

export default ApplicantDetail;