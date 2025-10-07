import React, { useState } from 'react';
import { Applicant, ApplicantStatus } from '../types/applicant';
import { ApplicantService } from '../services/applicantService';
import { Button } from './ui';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

interface ApplicantStatusModalProps {
  applicant: Applicant;
  onStatusChange: (applicant: Applicant) => void;
  onClose: () => void;
}

const ApplicantStatusModal: React.FC<ApplicantStatusModalProps> = ({
  applicant,
  onStatusChange,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [observations, setObservations] = useState('');

  const handleStatusChange = async (newStatus: ApplicantStatus) => {
    if (newStatus === 'rechazado' && !rejectionReason.trim()) {
      alert('Debe proporcionar un motivo para rechazar la postulación');
      return;
    }

    setLoading(true);

    try {
      await ApplicantService.updateApplicantStatus(
        applicant.id!,
        newStatus,
        user?.uid,
        newStatus === 'rechazado' ? rejectionReason : observations
      );

      // Actualizar el postulante localmente
      const updatedApplicant = {
        ...applicant,
        status: newStatus,
        fechaUltimaActualizacion: new Date().toISOString(),
        actualizadoPor: user?.uid,
        observaciones: newStatus === 'rechazado' ? rejectionReason : observations
      };

      onStatusChange(updatedApplicant);
      onClose();

      logger.info('Applicant status updated successfully', {
        applicantId: applicant.id,
        newStatus,
        updatedBy: user?.uid
      });
    } catch (error) {
      logger.error('Error updating applicant status', error);
      alert('Error al actualizar el estado del postulante. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToEmployee = async () => {
    if (!applicant.id) return;

    if (!window.confirm('¿Está seguro de convertir este postulante en empleado? Esta acción creará un nuevo registro de empleado.')) {
      return;
    }

    setLoading(true);

    try {
      const currentUser = localStorage.getItem('currentUser');
      const userId = currentUser ? JSON.parse(currentUser).uid : 'system';
      const employeeId = await ApplicantService.convertToEmployee(applicant.id, userId);

      // Actualizar el estado del postulante
      const updatedApplicant = {
        ...applicant,
        status: 'contratado' as ApplicantStatus,
        fechaUltimaActualizacion: new Date().toISOString(),
        actualizadoPor: userId,
        convertidoAEmpleado: {
          empleadoId: employeeId || 'pending',
          fechaConversion: new Date().toISOString(),
          convertidoPor: userId
        }
      };

      onStatusChange(updatedApplicant);
      onClose();

      logger.info('Applicant converted to employee successfully', {
        applicantId: applicant.id,
        employeeId,
        convertedBy: user?.uid
      });

      window.alert('Postulante convertido a empleado exitosamente. Se ha creado un nuevo registro de empleado.');
    } catch (error) {
      logger.error('Error converting applicant to employee', error);
      window.alert('Error al convertir el postulante en empleado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusActions = () => {
    switch (applicant.status) {
      case 'pendiente':
        return (
          <div className="status-actions">
            <Button
              variant="success"
              onClick={() => handleStatusChange('en_revision')}
              disabled={loading}
            >
              Iniciar Revisión
            </Button>
            <Button
              variant="warning"
              onClick={() => handleStatusChange('rechazado')}
              disabled={loading}
            >
              Rechazar
            </Button>
          </div>
        );

      case 'en_revision':
        return (
          <div className="status-actions">
            <Button
              variant="success"
              onClick={() => handleStatusChange('aprobado')}
              disabled={loading}
            >
              Aprobar
            </Button>
            <Button
              variant="danger"
              onClick={() => handleStatusChange('rechazado')}
              disabled={loading}
            >
              Rechazar
            </Button>
          </div>
        );

      case 'aprobado':
        return (
          <div className="status-actions">
            <Button
              variant="primary"
              onClick={handleConvertToEmployee}
              disabled={loading}
            >
              Convertir a Empleado
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleStatusChange('en_revision')}
              disabled={loading}
            >
              Volver a Revisión
            </Button>
          </div>
        );

      case 'rechazado':
        return (
          <div className="status-actions">
            <Button
              variant="primary"
              onClick={() => handleStatusChange('en_revision')}
              disabled={loading}
            >
              Reconsiderar
            </Button>
          </div>
        );

      case 'contratado':
        return (
          <div className="status-actions">
            <span className="conversion-info">
              ✅ Convertido a empleado
              {applicant.convertidoAEmpleado?.empleadoId && (
                <small> (ID: {applicant.convertidoAEmpleado.empleadoId})</small>
              )}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h3>Cambiar Estado del Postulante</h3>
          <button type="button" onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {/* Información del Postulante */}
          <div className="applicant-info">
            <div className="applicant-details">
              <h4>{applicant.apellidoPaterno} {applicant.apellidoMaterno}, {applicant.nombres}</h4>
              <p><strong>DNI:</strong> {applicant.dni}</p>
              <p><strong>Puesto de Interés:</strong> {applicant.puestoInteres}</p>
              <p><strong>Estado Actual:</strong>
                <span className={`status-badge ${getStatusBadgeClass(applicant.status)}`}>
                  {getStatusDisplayName(applicant.status)}
                </span>
              </p>
              <p><strong>Fecha de Postulación:</strong> {formatDate(applicant.fechaPostulacion)}</p>
            </div>
          </div>

          {/* Estado Actual */}
          <div className="current-status-info">
            <div className={`status-indicator status-${applicant.status}`}>
              <strong>Estado Actual:</strong> {getStatusDisplayName(applicant.status)}
            </div>
          </div>

          {/* Acciones Disponibles */}
          <div className="status-actions-section">
            <h4>Acciones Disponibles:</h4>
            {getStatusActions()}
          </div>

          {/* Formulario para Rechazo */}
          {applicant.status !== 'rechazado' && (
            <div className="form-section">
              <h4>Motivo de Rechazo (si aplica)</h4>
              <div className="form-group">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique el motivo del rechazo..."
                  rows={3}
                  className="form-control"
                />
              </div>
            </div>
          )}

          {/* Observaciones Generales */}
          <div className="form-section">
            <h4>Observaciones</h4>
            <div className="form-group">
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observaciones adicionales sobre el postulante..."
                rows={3}
                className="form-control"
              />
            </div>
          </div>

          {/* Información de Ayuda */}
          <div className="help-info">
            <h4>💡 Información de Ayuda</h4>
            <ul>
              <li><strong>Pendiente:</strong> Nueva postulación recibida</li>
              <li><strong>En Revisión:</strong> Postulación siendo evaluada</li>
              <li><strong>Aprobado:</strong> Postulante aprobado para contratación</li>
              <li><strong>Rechazado:</strong> Postulación no aprobada</li>
              <li><strong>Contratado:</strong> Convertido a empleado del sistema</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares
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

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE');
};

export default ApplicantStatusModal;