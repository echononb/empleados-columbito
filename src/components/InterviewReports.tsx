import React, { useState, useEffect } from 'react';
import { InterviewService } from '../services/interviewService';
import { ProjectService, Project } from '../services/projectService';
import { InterviewStats, InterviewFilters } from '../types/interview';
import { Button, Card } from './ui';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

const InterviewReports: React.FC = () => {
  const { userRole } = useAuth();
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<InterviewFilters>({});
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Check if user can view reports
  const canViewReports = userRole === 'digitador' || userRole === 'administrador';

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsData, projectsData] = await Promise.all([
        InterviewService.getInterviewStats(),
        ProjectService.getAllProjects()
      ]);

      setStats(statsData);
      setProjects(projectsData);
    } catch (error) {
      logger.error('Error loading interview reports data', error);
      setError('Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewReports) {
      loadData();
    }
  }, [canViewReports]);

  const handleFilterChange = (newFilters: Partial<InterviewFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export functionality
    logger.info('Exporting interview data to Excel');
    alert('Funcionalidad de exportación a Excel será implementada próximamente');
  };

  const generateReport = () => {
    // TODO: Implement report generation
    logger.info('Generating interview report');
    alert('Funcionalidad de generación de reportes será implementada próximamente');
  };

  if (!canViewReports) {
    return (
      <Card>
        <div className="error-message">
          No tienes permisos para acceder a los reportes de entrevistas.
          <br />
          Rol requerido: Digitador o Administrador
          <br />
          Tu rol actual: {userRole || 'Sin rol asignado'}
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <div className="loading">Cargando reportes de entrevistas...</div>
      </Card>
    );
  }

  return (
    <div className="interview-reports">
      <div className="reports-header">
        <div>
          <h2>Reportes de Entrevistas</h2>
          <p>Análisis y estadísticas del proceso de entrevistas</p>
        </div>

        <div className="header-actions">
          <Button
            variant="secondary"
            onClick={() => setShowExportOptions(!showExportOptions)}
          >
            Exportar Datos
          </Button>
          <Button
            variant="primary"
            onClick={generateReport}
          >
            Generar Reporte
          </Button>
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="stats-grid">
          <Card className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total de Entrevistas</p>
            <small>Entrevistas registradas en el sistema</small>
          </Card>

          <Card className="stat-card">
            <h3>{stats.completadas}</h3>
            <p>Completadas</p>
            <small>Entrevistas finalizadas</small>
          </Card>

          <Card className="stat-card">
            <h3>{stats.positivas}</h3>
            <p>Resultados Positivos</p>
            <small>Candidatos aprobados</small>
          </Card>

          <Card className="stat-card">
            <h3>{stats.promedio_calificacion.toFixed(1)}</h3>
            <p>Calificación Promedio</p>
            <small>De las entrevistas completadas</small>
          </Card>

          <Card className="stat-card">
            <h3>{stats.esta_semana}</h3>
            <p>Esta Semana</p>
            <small>Entrevistas programadas</small>
          </Card>

          <Card className="stat-card">
            <h3>{stats.tiempo_promedio} min</h3>
            <p>Tiempo Promedio</p>
            <small>Duración de entrevistas</small>
          </Card>
        </div>
      )}

      {/* Filters Section */}
      <Card className="filters-section">
        <h3>Filtros de Reporte</h3>
        <div className="filters-container">
          <div className="filter-group">
            <label>Período de Tiempo:</label>
            <select
              onChange={(e) => handleFilterChange({
                fechaDesde: e.target.value ? new Date(Date.now() - parseInt(e.target.value)).toISOString() : undefined
              })}
            >
              <option value="">Todo el período</option>
              <option value="604800000">Última semana</option>
              <option value="2592000000">Último mes</option>
              <option value="7776000000">Últimos 3 meses</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Estado:</label>
            <select
              onChange={(e) => handleFilterChange({
                status: e.target.value ? [e.target.value as any] : undefined
              })}
            >
              <option value="">Todos los estados</option>
              <option value="programada">Programadas</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Proyecto:</label>
            <select
              onChange={(e) => handleFilterChange({
                // This would need to be implemented based on interview-project relationship
              })}
            >
              <option value="">Todos los proyectos</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Export Options */}
      {showExportOptions && (
        <Card className="export-section">
          <h3>Opciones de Exportación</h3>
          <div className="export-options">
            <Button
              variant="secondary"
              onClick={exportToExcel}
            >
              📊 Exportar a Excel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                // TODO: Implement PDF export
                alert('Exportación a PDF será implementada próximamente');
              }}
            >
              📄 Exportar a PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                // TODO: Implement CSV export
                alert('Exportación a CSV será implementada próximamente');
              }}
            >
              📋 Exportar a CSV
            </Button>
          </div>
        </Card>
      )}

      {/* Additional Analytics */}
      <div className="analytics-section">
        <Card>
          <h3>Análisis de Entrevistas</h3>
          <div className="analytics-content">
            <div className="metric-group">
              <h4>Por Tipo de Entrevista</h4>
              <div className="metric-item">
                <span className="metric-label">Telefónicas:</span>
                <span className="metric-value">0</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Virtuales:</span>
                <span className="metric-value">0</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Presenciales:</span>
                <span className="metric-value">0</span>
              </div>
            </div>

            <div className="metric-group">
              <h4>Por Resultado</h4>
              <div className="metric-item">
                <span className="metric-label">Positivas:</span>
                <span className="metric-value">{stats?.positivas || 0}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Negativas:</span>
                <span className="metric-value">{stats?.negativas || 0}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Pendientes:</span>
                <span className="metric-value">{stats?.pendientes || 0}</span>
              </div>
            </div>

            <div className="metric-group">
              <h4>Tasa de Éxito</h4>
              <div className="metric-item">
                <span className="metric-label">Entrevistas Exitosas:</span>
                <span className="metric-value">
                  {stats && stats.completadas > 0
                    ? `${Math.round((stats.positivas / stats.completadas) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="recommendations-section">
        <h3>💡 Recomendaciones</h3>
        <div className="recommendations-list">
          <div className="recommendation-item">
            <strong>Mejorar proceso de entrevistas:</strong> Considere implementar entrevistas técnicas para evaluar habilidades específicas.
          </div>
          <div className="recommendation-item">
            <strong>Optimizar tiempos:</strong> El tiempo promedio de entrevista es de {stats?.tiempo_promedio || 0} minutos.
          </div>
          <div className="recommendation-item">
            <strong>Seguimiento de candidatos:</strong> {stats?.positivas || 0} candidatos han pasado el proceso de entrevistas.
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InterviewReports;