import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { InterviewService } from '../services/interviewService';
import { ProjectService, Project } from '../services/projectService';
import { Interview, InterviewFilters, InterviewStats } from '../types/interview';
import { Button, Card } from './ui';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

const InterviewList: React.FC = () => {
  const { userRole } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [stats, setStats] = useState<InterviewStats | null>(null);

  // Check if user can manage interviews
  const canManage = userRole === 'digitador' || userRole === 'administrador';

  // Load interviews, projects and stats
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [interviewsData, projectsData, statsData] = await Promise.all([
        InterviewService.getAllInterviews(),
        ProjectService.getAllProjects(),
        InterviewService.getInterviewStats()
      ]);

      setInterviews(interviewsData);
      setProjects(projectsData);
      setStats(statsData);
    } catch (error) {
      logger.error('Error loading interviews', error);
      setError('Error al cargar las entrevistas desde la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter interviews based on search term and filters
  const filteredInterviews = useMemo(() => {
    let filtered = interviews;

    // Filter by status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(interview => interview.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'todos') {
      filtered = filtered.filter(interview => interview.tipoEntrevista === typeFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(interview =>
        interview.applicantName?.toLowerCase().includes(term) ||
        interview.applicantDNI?.includes(term) ||
        interview.puestoInteres?.toLowerCase().includes(term) ||
        interview.entrevistadorPrincipal?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [interviews, searchTerm, statusFilter, typeFilter]);

  // Helper function to format date and time
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('es-PE');
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'programada': return 'status-scheduled';
      case 'confirmada': return 'status-confirmed';
      case 'en_progreso': return 'status-in-progress';
      case 'completada': return 'status-completed';
      case 'cancelada': return 'status-cancelled';
      case 'reprogramada': return 'status-rescheduled';
      default: return 'status-default';
    }
  };

  // Helper function to get status display name
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'programada': return 'Programada';
      case 'confirmada': return 'Confirmada';
      case 'en_progreso': return 'En Progreso';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      case 'reprogramada': return 'Reprogramada';
      default: return status;
    }
  };

  // Helper function to get type display name
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'telefonica': return 'Telefónica';
      case 'virtual': return 'Virtual';
      case 'presencial': return 'Presencial';
      case 'tecnica': return 'Técnica';
      case 'psicologica': return 'Psicológica';
      case 'final': return 'Final';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="loading">Cargando entrevistas...</div>
      </Card>
    );
  }

  return (
    <div className="interview-list">
      <div className="interview-list-header">
        <div>
          <h2>Gestión de Entrevistas</h2>
          <div className="user-role-info">
            <small>Rol actual: <strong>{userRole || 'Cargando...'}</strong></small>
            {canManage && <small style={{ color: '#28a745', marginLeft: '10px' }}>✅ Tiene permisos para gestionar entrevistas</small>}
            {!canManage && userRole && <small style={{ color: '#dc3545', marginLeft: '10px' }}>❌ No tiene permisos para gestionar entrevistas</small>}
          </div>
        </div>

        <div className="header-actions">
          <Link to="/interviews/new" className="btn btn-primary">
            Programar Entrevista
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <Card className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total Entrevistas</p>
          </Card>
          <Card className="stat-card">
            <h3>{stats.programadas}</h3>
            <p>Programadas</p>
          </Card>
          <Card className="stat-card">
            <h3>{stats.completadas}</h3>
            <p>Completadas</p>
          </Card>
          <Card className="stat-card">
            <h3>{stats.promedio_calificacion.toFixed(1)}</h3>
            <p>Calificación Promedio</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-container">
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar por postulante, DNI, puesto o entrevistador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Estado:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los estados</option>
              <option value="programada">Programadas</option>
              <option value="confirmada">Confirmadas</option>
              <option value="en_progreso">En Progreso</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="type-filter">Tipo:</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos los tipos</option>
              <option value="telefonica">Telefónica</option>
              <option value="virtual">Virtual</option>
              <option value="presencial">Presencial</option>
              <option value="tecnica">Técnica</option>
              <option value="psicologica">Psicológica</option>
              <option value="final">Final</option>
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Interviews Table */}
      <Card className="table-card">
        <div className="table-container">
          <table className="interview-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Postulante</th>
                <th>DNI</th>
                <th>Puesto</th>
                <th>Proyecto</th>
                <th>Tipo</th>
                <th>Entrevistador</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.map(interview => (
                <tr key={interview.id}>
                  <td>{formatDateTime(interview.fechaEntrevista)}</td>
                  <td>{interview.applicantName}</td>
                  <td>{interview.applicantDNI}</td>
                  <td>{interview.puestoInteres}</td>
                  <td>
                    {interview.proyectoInteres
                      ? (projects.find(p => p.id === interview.proyectoInteres)
                          ? projects.find(p => p.id === interview.proyectoInteres)?.name
                          : 'Proyecto no encontrado')
                      : 'No especificado'
                    }
                  </td>
                  <td>{getTypeDisplayName(interview.tipoEntrevista)}</td>
                  <td>{interview.entrevistadorPrincipal}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(interview.status)}`}>
                      {getStatusDisplayName(interview.status)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Link
                        to={`/interviews/${interview.id}`}
                        className="btn btn-secondary btn-small"
                      >
                        Ver Detalles
                      </Link>
                      {canManage && interview.status === 'programada' && (
                        <button
                          className="btn btn-success btn-small"
                          title="Iniciar entrevista"
                        >
                          Iniciar
                        </button>
                      )}
                      {canManage && (interview.status === 'programada' || interview.status === 'confirmada') && (
                        <button
                          className="btn btn-warning btn-small"
                          title="Cancelar entrevista"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredInterviews.length === 0 && (
        <Card className="no-results-card">
          <div className="no-results">
            {searchTerm || statusFilter !== 'todos' || typeFilter !== 'todos'
              ? 'No se encontraron entrevistas que coincidan con los filtros.'
              : 'No hay entrevistas registradas.'}
          </div>
        </Card>
      )}
    </div>
  );
};

export default InterviewList;