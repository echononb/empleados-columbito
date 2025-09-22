import React, { useState, useEffect } from 'react';
import { EmployeeService, Employee } from '../services/employeeService';
import { ProjectService, Project } from '../services/projectService';
import { ClientService, Client } from '../services/clientService';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'employees' | 'projects' | 'clients'>('employees');
  const [showVisualization, setShowVisualization] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    projectId: '',
    clientId: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeeData, projectData, clientData] = await Promise.all([
        EmployeeService.getAllEmployees(),
        ProjectService.getAllProjects(),
        ClientService.getAllClients()
      ]);

      setEmployees(employeeData);
      setProjects(projectData);
      setClients(clientData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = (data: any[], filename: string) => {
    if (data.length === 0) return;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length))
    }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

    // Save file
    XLSX.writeFile(wb, filename);
  };

  // Get filtered and paginated data
  const getFilteredData = () => {
    let data: any[] = [];

    switch (reportType) {
      case 'employees':
        data = employees.map(emp => ({
          'Código Empleado': emp.employeeCode,
          'DNI': emp.dni,
          'Apellido Paterno': emp.apellidoPaterno,
          'Apellido Materno': emp.apellidoMaterno,
          'Nombres': emp.nombres,
          'Fecha Ingreso': emp.fechaIngreso,
          'Puesto': emp.puesto,
          'Régimen Laboral': emp.regimenLaboral,
          'Teléfono Celular': emp.telefonoCelular,
          'Email': emp.email,
          'Estado Civil': emp.estadoCivil,
          'Dirección': emp.direccionActual,
          'Edad': EmployeeService.calculateAge(emp.fechaNacimiento),
          'Proyectos Asignados': emp.assignedProjects.length,
          'Estado': emp.isActive ? 'Activo' : 'Inactivo'
        }));

        // Apply filters
        if (filters.projectId) {
          data = data.filter((_, index) => employees[index].assignedProjects.includes(filters.projectId));
        }
        if (filters.startDate) {
          data = data.filter((_, index) => new Date(employees[index].fechaIngreso) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
          data = data.filter((_, index) => new Date(employees[index].fechaIngreso) <= new Date(filters.endDate));
        }
        break;

      case 'projects':
        data = projects.map(proj => {
          const client = clients.find(c => c.id === proj.clientId);
          return {
            'Nombre Proyecto': proj.name,
            'Contrato': proj.contrato,
            'Cliente': client?.name || 'N/A',
            'Estado': proj.status === 'active' ? 'Activo' :
                     proj.status === 'completed' ? 'Completado' : 'En Espera',
            'Fecha Inicio': proj.startDate,
            'Fecha Fin': proj.endDate,
            'Empleados Asignados': proj.assignedEmployees.length,
            'Descripción': proj.description
          };
        });

        if (filters.clientId) {
          data = data.filter((_, index) => projects[index].clientId === filters.clientId);
        }
        if (filters.status) {
          data = data.filter((_, index) => projects[index].status === filters.status);
        }
        break;

      case 'clients':
        data = clients.map(client => ({
          'Nombre Cliente': client.name,
          'RUC': client.ruc,
          'Email': client.contactInfo.email,
          'Teléfono': client.contactInfo.phone,
          'Dirección': client.contactInfo.address,
          'Proyectos Activos': client.projects.length,
          'Fecha Creación': client.createdAt || 'N/A'
        }));
        break;
    }

    return data;
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generateEmployeeReport = () => {
    let filteredEmployees = [...employees];

    // Apply filters
    if (filters.projectId) {
      filteredEmployees = filteredEmployees.filter(emp =>
        emp.assignedProjects.includes(filters.projectId)
      );
    }

    if (filters.startDate) {
      filteredEmployees = filteredEmployees.filter(emp =>
        new Date(emp.fechaIngreso) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filteredEmployees = filteredEmployees.filter(emp =>
        new Date(emp.fechaIngreso) <= new Date(filters.endDate)
      );
    }

    // Transform data for export
    const reportData = filteredEmployees.map(emp => ({
      'Código Empleado': emp.employeeCode,
      'DNI': emp.dni,
      'Apellido Paterno': emp.apellidoPaterno,
      'Apellido Materno': emp.apellidoMaterno,
      'Nombres': emp.nombres,
      'Fecha Ingreso': emp.fechaIngreso,
      'Puesto': emp.puesto,
      'Régimen Laboral': emp.regimenLaboral,
      'Teléfono Celular': emp.telefonoCelular,
      'Email': emp.email,
      'Estado Civil': emp.estadoCivil,
      'Dirección': emp.direccionActual,
      'Edad': EmployeeService.calculateAge(emp.fechaNacimiento),
      'Proyectos Asignados': emp.assignedProjects.length,
      'Estado': emp.isActive ? 'Activo' : 'Inactivo'
    }));

    exportToExcel(reportData, `reporte-empleados-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const generateProjectReport = () => {
    let filteredProjects = [...projects];

    if (filters.clientId) {
      filteredProjects = filteredProjects.filter(proj => proj.clientId === filters.clientId);
    }

    if (filters.status) {
      filteredProjects = filteredProjects.filter(proj => proj.status === filters.status);
    }

    const reportData = filteredProjects.map(proj => {
      const client = clients.find(c => c.id === proj.clientId);
      return {
        'Nombre Proyecto': proj.name,
        'Contrato': proj.contrato,
        'Cliente': client?.name || 'N/A',
        'Estado': proj.status === 'active' ? 'Activo' :
                 proj.status === 'completed' ? 'Completado' : 'En Espera',
        'Fecha Inicio': proj.startDate,
        'Fecha Fin': proj.endDate,
        'Empleados Asignados': proj.assignedEmployees.length,
        'Descripción': proj.description
      };
    });

    exportToExcel(reportData, `reporte-proyectos-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const generateClientReport = () => {
    const reportData = clients.map(client => ({
      'Nombre Cliente': client.name,
      'RUC': client.ruc,
      'Email': client.contactInfo.email,
      'Teléfono': client.contactInfo.phone,
      'Dirección': client.contactInfo.address,
      'Proyectos Activos': client.projects.length,
      'Fecha Creación': client.createdAt || 'N/A'
    }));

    exportToExcel(reportData, `reporte-clientes-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExport = () => {
    switch (reportType) {
      case 'employees':
        generateEmployeeReport();
        break;
      case 'projects':
        generateProjectReport();
        break;
      case 'clients':
        generateClientReport();
        break;
    }
  };

  if (loading) {
    return <div className="loading">Cargando datos para reportes...</div>;
  }

  return (
    <div className="reports">
      <h2>Reportes y Exportación de Datos</h2>

      <div className="report-controls">
        <div className="form-group">
          <label>Tipo de Reporte:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as typeof reportType)}
          >
            <option value="employees">Empleados</option>
            <option value="projects">Proyectos</option>
            <option value="clients">Clientes</option>
          </select>
        </div>

        {reportType === 'employees' && (
          <div className="filters-section">
            <h3>Filtros para Empleados</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Proyecto:</label>
                <select
                  value={filters.projectId}
                  onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
                >
                  <option value="">Todos los proyectos</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Fecha Ingreso Desde:</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Fecha Ingreso Hasta:</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {reportType === 'projects' && (
          <div className="filters-section">
            <h3>Filtros para Proyectos</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Cliente:</label>
                <select
                  value={filters.clientId}
                  onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
                >
                  <option value="">Todos los clientes</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Estado:</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="completed">Completado</option>
                  <option value="on-hold">En Espera</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="export-section">
          <button onClick={() => setShowVisualization(!showVisualization)} className="btn btn-secondary">
            {showVisualization ? '📊 Ocultar Vista Previa' : '👁️ Ver Vista Previa'}
          </button>
          <button onClick={handleExport} className="btn btn-primary">
            📊 Exportar Reporte Excel
          </button>
        </div>
      </div>

      <div className="report-summary">
        <h3>Resumen de Datos</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>{employees.length}</h4>
            <p>Total Empleados</p>
          </div>
          <div className="stat-card">
            <h4>{projects.length}</h4>
            <p>Total Proyectos</p>
          </div>
          <div className="stat-card">
            <h4>{clients.length}</h4>
            <p>Total Clientes</p>
          </div>
          <div className="stat-card">
            <h4>{employees.filter(e => e.isActive).length}</h4>
            <p>Empleados Activos</p>
          </div>
        </div>
      </div>

      {showVisualization && (
        <div className="report-visualization">
          <h3>Vista Previa del Reporte - {reportType === 'employees' ? 'Empleados' : reportType === 'projects' ? 'Proyectos' : 'Clientes'}</h3>
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  {filteredData.length > 0 && Object.keys(filteredData[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex}>{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                ← Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                Siguiente →
              </button>
            </div>
          )}

          <div className="visualization-info">
            <p>Mostrando {paginatedData.length} de {filteredData.length} registros</p>
          </div>
        </div>
      )}
    </div>
  );
};

export {};

export default Reports;