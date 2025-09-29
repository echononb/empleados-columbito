import React, { useState, useEffect, useCallback } from 'react';
import { EmployeeService, Employee } from '../services/employeeService';
import { ProjectService, Project } from '../services/projectService';

interface ProjectAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onAssignmentChange: () => void;
}

const ProjectAssignmentModal: React.FC<ProjectAssignmentModalProps> = ({
  isOpen,
  onClose,
  project,
  onAssignmentChange
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!project) return;

    setLoading(true);
    try {
      const [employeesData] = await Promise.all([
        EmployeeService.getAllEmployees()
      ]);

      // Filter only active employees
      const activeEmployees = employeesData.filter(emp => emp.isActive);
      setEmployees(activeEmployees);

      // Set currently assigned employees
      setSelectedEmployees(new Set(project.assignedEmployees || []));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    if (isOpen && project) {
      loadData();
    }
  }, [isOpen, project, loadData]);

  const filteredEmployees = employees.filter(employee => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    return (
      employee.nombres.toLowerCase().includes(term) ||
      employee.apellidoPaterno.toLowerCase().includes(term) ||
      employee.apellidoMaterno.toLowerCase().includes(term) ||
      employee.dni.includes(term) ||
      employee.employeeCode.toLowerCase().includes(term) ||
      employee.puesto.toLowerCase().includes(term)
    );
  });

  const handleEmployeeToggle = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleSave = async () => {
    if (!project?.id) return;

    setLoading(true);
    try {
      const currentAssigned = new Set(project.assignedEmployees || []);
      const newAssigned = selectedEmployees;

      // Employees to add
      const toAdd = Array.from(newAssigned).filter(id => !currentAssigned.has(id));

      // Employees to remove
      const toRemove = Array.from(currentAssigned).filter(id => !newAssigned.has(id));

      console.log('Asignaciones a realizar:', { toAdd, toRemove });

      // Execute assignments sequentially to avoid race conditions
      for (const employeeId of toAdd) {
        try {
          await ProjectService.assignEmployeeToProject(project.id!, employeeId);
          console.log(`Empleado ${employeeId} asignado correctamente`);
        } catch (error) {
          console.error(`Error asignando empleado ${employeeId}:`, error);
        }
      }

      for (const employeeId of toRemove) {
        try {
          await ProjectService.removeEmployeeFromProject(project.id!, employeeId);
          console.log(`Empleado ${employeeId} removido correctamente`);
        } catch (error) {
          console.error(`Error removiendo empleado ${employeeId}:`, error);
        }
      }

      onAssignmentChange();
      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
      alert('Error al guardar las asignaciones. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeDisplayName = (employee: Employee) => {
    return `${employee.apellidoPaterno} ${employee.apellidoMaterno}, ${employee.nombres}`;
  };

  if (!isOpen || !project) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h3>Asignar Empleados al Proyecto</h3>
          <button type="button" onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="project-info">
            <h4>{project.name}</h4>
            <p>{project.description}</p>
            <small>Contrato: {project.contrato}</small>
          </div>

          <div className="assignment-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar empleados por nombre, DNI o puesto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="assignment-summary">
              <span>{selectedEmployees.size} empleados asignados</span>
            </div>
          </div>

          <div className="employees-list">
            {loading ? (
              <div className="loading">Cargando empleados...</div>
            ) : (
              <div className="employee-checkboxes">
                {filteredEmployees.map(employee => (
                  <div key={employee.id} className="employee-checkbox-item">
                    <label className="checkbox-label employee-label">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.has(employee.id!)}
                        onChange={() => handleEmployeeToggle(employee.id!)}
                      />
                      <div className="employee-info">
                        <div className="employee-name">
                          {getEmployeeDisplayName(employee)}
                        </div>
                        <div className="employee-details">
                          <span className="employee-code">{employee.employeeCode}</span>
                          <span className="employee-dni">DNI: {employee.dni}</span>
                          <span className="employee-position">{employee.puesto}</span>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {filteredEmployees.length === 0 && !loading && (
              <div className="no-results">
                {searchTerm ? 'No se encontraron empleados que coincidan con la búsqueda.' : 'No hay empleados activos disponibles.'}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Guardando...' : 'Guardar Asignaciones'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectAssignmentModal;