import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface Project {
  id?: string;
  name: string;
  description: string;
  clientId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'on-hold';
  assignedEmployees: string[];
  createdAt?: string;
  updatedAt?: string;
}

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data for now - will be replaced with Firebase
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Construcción Edificio Residencial',
          description: 'Proyecto de construcción de edificio de 10 pisos en Miraflores',
          clientId: 'client1',
          startDate: '2024-01-15',
          endDate: '2024-12-15',
          status: 'active',
          assignedEmployees: ['1', '2']
        },
        {
          id: '2',
          name: 'Remodelación Centro Comercial',
          description: 'Remodelación completa del centro comercial Plaza Norte',
          clientId: 'client2',
          startDate: '2024-03-01',
          endDate: '2024-08-01',
          status: 'on-hold',
          assignedEmployees: ['1']
        },
        {
          id: '3',
          name: 'Construcción Puente Vehicular',
          description: 'Proyecto de construcción de puente sobre el río Rímac',
          clientId: 'client3',
          startDate: '2023-06-01',
          endDate: '2024-06-01',
          status: 'completed',
          assignedEmployees: ['2']
        }
      ];
      setProjects(mockProjects);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#27ae60';
      case 'completed': return '#3498db';
      case 'on-hold': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'on-hold': return 'En Espera';
      default: return status;
    }
  };

  if (loading) {
    return <div className="loading">Cargando proyectos...</div>;
  }

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>Lista de Proyectos</h2>
        <Link to="/projects/new" className="btn btn-primary">
          Nuevo Proyecto
        </Link>
      </div>

      <div className="filters-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-select"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="completed">Completados</option>
            <option value="on-hold">En Espera</option>
          </select>
        </div>
      </div>

      <div className="project-table-container">
        <table className="project-table">
          <thead>
            <tr>
              <th>Nombre del Proyecto</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Empleados Asignados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map(project => (
              <tr key={project.id}>
                <td className="project-name">{project.name}</td>
                <td className="project-description">{project.description}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(project.status) }}
                  >
                    {getStatusText(project.status)}
                  </span>
                </td>
                <td>{new Date(project.startDate).toLocaleDateString('es-PE')}</td>
                <td>{new Date(project.endDate).toLocaleDateString('es-PE')}</td>
                <td>{project.assignedEmployees.length} empleados</td>
                <td>
                  <Link to={`/projects/${project.id}`} className="btn btn-secondary">
                    Ver/Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProjects.length === 0 && (
        <div className="no-results">
          {searchTerm || statusFilter !== 'all'
            ? 'No se encontraron proyectos que coincidan con los filtros.'
            : 'No hay proyectos registrados.'}
        </div>
      )}

      <div className="project-stats">
        <div className="stat-card">
          <h3>{projects.filter(p => p.status === 'active').length}</h3>
          <p>Proyectos Activos</p>
        </div>
        <div className="stat-card">
          <h3>{projects.filter(p => p.status === 'completed').length}</h3>
          <p>Proyectos Completados</p>
        </div>
        <div className="stat-card">
          <h3>{projects.filter(p => p.status === 'on-hold').length}</h3>
          <p>Proyectos en Espera</p>
        </div>
        <div className="stat-card">
          <h3>{projects.length}</h3>
          <p>Total de Proyectos</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;