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
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleSaveProject = async (projectData: Omit<Project, 'id'>) => {
    setSaving(true);
    try {
      if (editingProject) {
        // Update existing project
        setProjects(prev => prev.map(p =>
          p.id === editingProject.id ? { ...projectData, id: editingProject.id } : p
        ));
      } else {
        // Create new project
        const newProject: Project = {
          ...projectData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProjects(prev => [...prev, newProject]);
      }
      setShowModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando proyectos...</div>;
  }

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>Lista de Proyectos</h2>
        <button onClick={handleCreateProject} className="btn btn-primary">
          Nuevo Proyecto
        </button>
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
                  <button onClick={() => handleEditProject(project)} className="btn btn-secondary">
                    Ver/Editar
                  </button>
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

      {showModal && (
        <ProjectModal
          project={editingProject}
          onSave={handleSaveProject}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
          loading={saving}
        />
      )}
    </div>
  );
};

// Project Modal Component
interface ProjectModalProps {
  project: Project | null;
  onSave: (project: Omit<Project, 'id'>) => void;
  onClose: () => void;
  loading: boolean;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState<Omit<Project, 'id'>>({
    name: project?.name || '',
    description: project?.description || '',
    clientId: project?.clientId || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    status: project?.status || 'active',
    assignedEmployees: project?.assignedEmployees || []
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nombre del proyecto es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Descripción es requerida';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Fecha de inicio es requerida';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Fecha de fin es requerida';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{project ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="name">Nombre del Proyecto *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? 'error' : ''}
              required
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={errors.description ? 'error' : ''}
              required
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Fecha de Inicio *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={errors.startDate ? 'error' : ''}
                required
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Fecha de Fin *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={errors.endDate ? 'error' : ''}
                required
              />
              {errors.endDate && <span className="error-message">{errors.endDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="on-hold">En Espera</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Guardando...' : (project ? 'Actualizar' : 'Crear Proyecto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectList;