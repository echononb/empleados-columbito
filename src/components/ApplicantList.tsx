import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ApplicantService } from '../services/applicantService';
import { Applicant } from '../types/applicant';
import { ApplicantFilters, ApplicantStats } from '../types/applicant';
import { Button, Card } from './ui';
import { useAuth } from '../contexts/AuthContext';
import ApplicantStatusModal from './ApplicantStatusModal';
import logger from '../utils/logger';

const ApplicantList: React.FC = () => {
  const { userRole } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [stats, setStats] = useState<ApplicantStats | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  // Check if user can manage applicants
  const canManage = userRole === 'digitador' || userRole === 'administrador';

  // Load applicants and stats
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [applicantsData, statsData] = await Promise.all([
        ApplicantService.getAllApplicants(),
        ApplicantService.getApplicantStats()
      ]);

      setApplicants(applicantsData);
      setStats(statsData);
    } catch (error) {
      logger.error('Error loading applicants', error);
      setError('Error al cargar los postulantes desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter applicants based on search term and status
  const filteredApplicants = useMemo(() => {
    let filtered = applicants;

    // Filter by status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(applicant => applicant.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(applicant =>
        applicant.nombres?.toLowerCase().includes(term) ||
        applicant.apellidoPaterno?.toLowerCase().includes(term) ||
        applicant.apellidoMaterno?.toLowerCase().includes(term) ||
        applicant.dni?.includes(term) ||
        applicant.puestoInteres?.toLowerCase().includes(term) ||
        applicant.email?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [applicants, searchTerm, statusFilter]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE');
  };

  // Helper function to get status badge class
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

  // Helper function to get status display name
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

  // Handle status change
  const handleStatusChange = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowStatusModal(true);
  };

  // Handle applicant update after status change
  const handleApplicantUpdate = (updatedApplicant: Applicant) => {
    setApplicants(prev => prev.map(app =>
      app.id === updatedApplicant.id ? updatedApplicant : app
    ));

    // Reload stats
    loadData();
  };

  // Handle convert to employee
  const handleConvertToEmployee = async (applicant: Applicant) => {
    if (!applicant.id) return;

    if (!window.confirm('¿Está seguro de convertir este postulante en empleado? Esta acción creará un nuevo registro de empleado.')) {
      return;
    }

    try {
      const currentUser = localStorage.getItem('currentUser');
      const userId = currentUser ? JSON.parse(currentUser).uid : 'system';

      const employeeId = await ApplicantService.convertToEmployee(applicant.id, userId);

      // Update local state
      const updatedApplicant = {
        ...applicant,
        status: 'contratado' as const,
        fechaUltimaActualizacion: new Date().toISOString(),
        actualizadoPor: userId,
        convertidoAEmpleado: {
          empleadoId: employeeId || 'pending',
          fechaConversion: new Date().toISOString(),
          convertidoPor: userId
        }
      };

      handleApplicantUpdate(updatedApplicant);

      window.alert('Postulante convertido a empleado exitosamente. Se ha creado un nuevo registro de empleado.');
    } catch (error) {
      logger.error('Error converting applicant to employee', error);
      window.alert('Error al convertir el postulante en empleado. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="loading">Cargando postulantes...</div>
      </Card>
    );
  }

  return (
    <div className="applicant-list">
      <div className="applicant-list-header">
        <div>
          <h2>Gestión de Postulantes</h2>
          <div className="user-role-info">
            <small>Rol actual: <strong>{userRole || 'Cargando...'}</strong></small>
            {canManage && <small style={{ color: '#28a745', marginLeft: '10px' }}>✅ Tiene permisos para gestionar postulantes</small>}
            {!canManage && userRole && <small style={{ color: '#dc3545', marginLeft: '10px' }}>❌ No tiene permisos para gestionar postulantes</small>}
          </div>
        </div>

        <div className="header-actions">
          <Link to="/applicants/new" className="btn btn-primary">
            Nueva Postulación
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <Card className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total Postulantes</p>
          </Card>
          <Card className="stat-card">
            <h3>{stats.pendientes}</h3>
            <p>Pendientes</p>
          </Card>
          <Card className="stat-card">
            <h3>{stats.aprobados}</h3>
            <p>Aprobados</p>
          </Card>
          <Card className="stat-card">
            <h3>{stats.contratados}</h3>
            <p>Contratados</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-container">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, puesto o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Filtrar por estado:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_revision">En Revisión</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
              <option value="contratado">Contratados</option>
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Applicants Table */}
      <Card className="table-card">
        <div className="table-container">
          <table className="applicant-table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Apellidos y Nombres</th>
                <th>Puesto de Interés</th>
                <th>Fecha Postulación</th>
                <th>Estado</th>
                <th>Fuente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map(applicant => (
                <tr key={applicant.id}>
                  <td>{applicant.dni}</td>
                  <td>{`${applicant.apellidoPaterno} ${applicant.apellidoMaterno}, ${applicant.nombres}`}</td>
                  <td>{applicant.puestoInteres}</td>
                  <td>{formatDate(applicant.fechaPostulacion)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(applicant.status)}`}>
                      {getStatusDisplayName(applicant.status)}
                    </span>
                  </td>
                  <td>{applicant.fuentePostulacion}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Link
                        to={`/applicants/${applicant.id}`}
                        className="btn btn-secondary btn-small"
                      >
                        Ver Detalles
                      </Link>
                      {canManage && (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleStatusChange(applicant)}
                          title="Gestionar estado del postulante"
                        >
                          Gestionar Estado
                        </Button>
                      )}
                      {canManage && applicant.status === 'aprobado' && (
                        <Button
                          variant="success"
                          size="small"
                          onClick={() => handleConvertToEmployee(applicant)}
                          title="Convertir a empleado"
                        >
                          Contratar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredApplicants.length === 0 && (
        <Card className="no-results-card">
          <div className="no-results">
            {searchTerm || statusFilter !== 'todos'
              ? 'No se encontraron postulantes que coincidan con los filtros.'
              : 'No hay postulantes registrados.'}
          </div>
        </Card>
      )}

      {/* Status Management Modal */}
      {showStatusModal && selectedApplicant && (
        <ApplicantStatusModal
          applicant={selectedApplicant}
          onStatusChange={handleApplicantUpdate}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedApplicant(null);
          }}
        />
      )}
    </div>
  );
};

export default ApplicantList;