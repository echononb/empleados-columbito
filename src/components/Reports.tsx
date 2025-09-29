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

  const exportToExcel = (data: any[], filename: string, sheetName: string = 'Datos') => {
    if (data.length === 0) return;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Enhanced column auto-sizing with better calculations
    const colWidths = Object.keys(data[0] || {}).map(key => {
      const headerLength = key.length;
      const maxDataLength = Math.max(
        ...data.map(row => {
          const value = row[key];
          if (value === null || value === undefined) return 0;
          if (typeof value === 'number') return value.toString().length;
          if (typeof value === 'boolean') return value ? 4 : 5; // "true" or "false"
          return String(value).length;
        })
      );
      return { wch: Math.max(headerLength, maxDataLength, 10) + 2 }; // Minimum 10, +2 for padding
    });
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Save file
    XLSX.writeFile(wb, filename);
  };

  const exportCompleteReport = () => {
    const wb = XLSX.utils.book_new();
    const timestamp = new Date().toISOString().split('T')[0];

    // 1. Employees Sheet
    const employeeData = employees.map(emp => {
      const assignedProjectNames = emp.assignedProjects
        .map(projectId => projects.find(p => p.id === projectId)?.name)
        .filter(name => name)
        .join('; ');

      return {
        'Código Empleado': emp.employeeCode,
        'DNI': emp.dni,
        'Apellido Paterno': emp.apellidoPaterno,
        'Apellido Materno': emp.apellidoMaterno,
        'Nombres': emp.nombres,
        'Fecha Nacimiento': emp.fechaNacimiento ? new Date(emp.fechaNacimiento).toLocaleDateString('es-PE') : '',
        'Edad': EmployeeService.calculateAge(emp.fechaNacimiento),
        'Fecha Ingreso': emp.fechaIngreso ? new Date(emp.fechaIngreso).toLocaleDateString('es-PE') : '',
        'Puesto': emp.puesto,
        'Régimen Laboral': emp.regimenLaboral,
        'Estado Civil': emp.estadoCivil,
        'Teléfono Celular': emp.telefonoCelular,
        'Teléfono Fijo': emp.telefonoFijo,
        'Email': emp.email,
        'Dirección': emp.direccionActual,
        'Referencia': emp.referenciaDireccion,
        'Sexo': emp.sexo,
        'Número Fotocheck': emp.numeroFotocheck,
        'Estado': emp.isActive ? 'Activo' : 'Inactivo',
        'Proyectos Asignados': assignedProjectNames || 'Ninguno',
        'Cantidad Proyectos': emp.assignedProjects.length
      };
    });

    const wsEmployees = XLSX.utils.json_to_sheet(employeeData);
    wsEmployees['!cols'] = Object.keys(employeeData[0] || {}).map(() => ({ wch: 15 }));
    XLSX.utils.book_append_sheet(wb, wsEmployees, 'Empleados');

    // 2. Projects Sheet
    const projectData = projects.map(proj => {
      const client = clients.find(c => c.id === proj.clientId);
      const assignedEmployeeNames = proj.assignedEmployees
        .map(empId => {
          const emp = employees.find(e => e.id === empId);
          return emp ? `${emp.apellidoPaterno} ${emp.apellidoMaterno}, ${emp.nombres}` : '';
        })
        .filter(name => name)
        .join('; ');

      return {
        'Nombre Proyecto': proj.name,
        'Contrato': proj.contrato,
        'Cliente': client?.name || 'N/A',
        'RUC Cliente': client?.ruc || 'N/A',
        'Estado': proj.status === 'active' ? 'Activo' :
                 proj.status === 'completed' ? 'Completado' : 'En Espera',
        'Fecha Inicio': proj.startDate ? new Date(proj.startDate).toLocaleDateString('es-PE') : '',
        'Fecha Fin': proj.endDate ? new Date(proj.endDate).toLocaleDateString('es-PE') : '',
        'Empleados Asignados': assignedEmployeeNames || 'Ninguno',
        'Cantidad Empleados': proj.assignedEmployees.length,
        'Descripción': proj.description
      };
    });

    const wsProjects = XLSX.utils.json_to_sheet(projectData);
    wsProjects['!cols'] = Object.keys(projectData[0] || {}).map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, wsProjects, 'Proyectos');

    // 3. Clients Sheet
    const clientData = clients.map(client => {
      const clientProjects = projects.filter(project => project.clientId === client.id!);
      const activeProjects = clientProjects.filter(project => project.status === 'active');
      const completedProjects = clientProjects.filter(project => project.status === 'completed');
      const onHoldProjects = clientProjects.filter(project => project.status === 'on-hold');

      return {
        'Nombre Cliente': client.name,
        'RUC': client.ruc,
        'Email': client.contactInfo.email,
        'Teléfono': client.contactInfo.phone,
        'Dirección': client.contactInfo.address,
        'Proyectos Activos': activeProjects.length,
        'Proyectos Completados': completedProjects.length,
        'Proyectos en Espera': onHoldProjects.length,
        'Total Proyectos': clientProjects.length,
        'Fecha Creación': client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-PE') : 'N/A'
      };
    });

    const wsClients = XLSX.utils.json_to_sheet(clientData);
    wsClients['!cols'] = Object.keys(clientData[0] || {}).map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes');

    // 4. Summary Sheet
    const summaryData = [
      { 'Métrica': 'Total Empleados', 'Valor': employees.length, 'Activos': employees.filter(e => e.isActive).length },
      { 'Métrica': 'Total Proyectos', 'Valor': projects.length, 'Activos': projects.filter(p => p.status === 'active').length },
      { 'Métrica': 'Total Clientes', 'Valor': clients.length, 'Con Proyectos': clients.filter(c => projects.some(p => p.clientId === c.id)).length },
      { 'Métrica': 'Fecha del Reporte', 'Valor': new Date().toLocaleDateString('es-PE'), 'Hora': new Date().toLocaleTimeString('es-PE') }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 20 }, // Métrica
      { wch: 10 }, // Valor
      { wch: 10 }  // Activos/Con Proyectos
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    // Save the complete workbook
    XLSX.writeFile(wb, `reporte-completo-empleados-columbito-${timestamp}.xlsx`);
  };

  // Get filtered and paginated data
  const getFilteredData = () => {
    let data: any[] = [];

    switch (reportType) {
      case 'employees':
        data = employees.map(emp => {
          const assignedProjectNames = emp.assignedProjects
            .map(projectId => projects.find(p => p.id === projectId)?.name)
            .filter(name => name)
            .join(', ');

          return {
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
            'Proyectos Asignados': assignedProjectNames || 'Ninguno',
            'Cantidad Proyectos': emp.assignedProjects.length,
            'Estado': emp.isActive ? 'Activo' : 'Inactivo'
          };
        });

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
        data = clients.map(client => {
          const clientProjects = projects.filter(project => project.clientId === client.id!);
          const activeProjects = clientProjects.filter(project => project.status === 'active');
          const inactiveProjects = clientProjects.filter(project => project.status !== 'active');

          return {
            'Nombre Cliente': client.name,
            'RUC': client.ruc,
            'Email': client.contactInfo.email,
            'Teléfono': client.contactInfo.phone,
            'Dirección': client.contactInfo.address,
            'Proyectos Activos': activeProjects.length,
            'Proyectos Inactivos': inactiveProjects.length,
            'Total Proyectos': clientProjects.length,
            'Fecha Creación': client.createdAt || 'N/A'
          };
        });
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

    // Transform data for export with better formatting
    const reportData = filteredEmployees.map(emp => {
      const assignedProjectNames = emp.assignedProjects
        .map(projectId => projects.find(p => p.id === projectId)?.name)
        .filter(name => name)
        .join('; ');

      return {
        'Código Empleado': emp.employeeCode,
        'DNI': emp.dni,
        'Apellido Paterno': emp.apellidoPaterno,
        'Apellido Materno': emp.apellidoMaterno,
        'Nombres': emp.nombres,
        'Fecha Nacimiento': emp.fechaNacimiento ? new Date(emp.fechaNacimiento).toLocaleDateString('es-PE') : '',
        'Edad': EmployeeService.calculateAge(emp.fechaNacimiento),
        'Fecha Ingreso': emp.fechaIngreso ? new Date(emp.fechaIngreso).toLocaleDateString('es-PE') : '',
        'Puesto': emp.puesto,
        'Régimen Laboral': emp.regimenLaboral,
        'Estado Civil': emp.estadoCivil,
        'Teléfono Celular': emp.telefonoCelular,
        'Teléfono Fijo': emp.telefonoFijo,
        'Email': emp.email,
        'Dirección': emp.direccionActual,
        'Referencia': emp.referenciaDireccion,
        'Sexo': emp.sexo,
        'Estado': emp.isActive ? 'Activo' : 'Inactivo',
        'Proyectos Asignados': assignedProjectNames || 'Ninguno',
        'Cantidad Proyectos': emp.assignedProjects.length
      };
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reporte-empleados-${timestamp}.xlsx`;
    exportToExcel(reportData, filename, 'Empleados');
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
      const assignedEmployeeNames = proj.assignedEmployees
        .map(empId => {
          const emp = employees.find(e => e.id === empId);
          return emp ? `${emp.apellidoPaterno} ${emp.apellidoMaterno}, ${emp.nombres}` : '';
        })
        .filter(name => name)
        .join('; ');

      return {
        'Nombre Proyecto': proj.name,
        'Contrato': proj.contrato,
        'Cliente': client?.name || 'N/A',
        'RUC Cliente': client?.ruc || 'N/A',
        'Estado': proj.status === 'active' ? 'Activo' :
                 proj.status === 'completed' ? 'Completado' : 'En Espera',
        'Fecha Inicio': proj.startDate ? new Date(proj.startDate).toLocaleDateString('es-PE') : '',
        'Fecha Fin': proj.endDate ? new Date(proj.endDate).toLocaleDateString('es-PE') : '',
        'Empleados Asignados': assignedEmployeeNames || 'Ninguno',
        'Cantidad Empleados': proj.assignedEmployees.length,
        'Descripción': proj.description
      };
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reporte-proyectos-${timestamp}.xlsx`;
    exportToExcel(reportData, filename, 'Proyectos');
  };

  const generateClientReport = () => {
    const reportData = clients.map(client => {
      const clientProjects = projects.filter(project => project.clientId === client.id!);
      const activeProjects = clientProjects.filter(project => project.status === 'active');
      const completedProjects = clientProjects.filter(project => project.status === 'completed');
      const onHoldProjects = clientProjects.filter(project => project.status === 'on-hold');

      const projectNames = clientProjects.map(p => p.name).join('; ');

      return {
        'Nombre Cliente': client.name,
        'RUC': client.ruc,
        'Email': client.contactInfo.email,
        'Teléfono': client.contactInfo.phone,
        'Dirección': client.contactInfo.address,
        'Proyectos Activos': activeProjects.length,
        'Proyectos Completados': completedProjects.length,
        'Proyectos en Espera': onHoldProjects.length,
        'Total Proyectos': clientProjects.length,
        'Lista de Proyectos': projectNames || 'Ninguno',
        'Fecha Creación': client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-PE') : 'N/A'
      };
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reporte-clientes-${timestamp}.xlsx`;
    exportToExcel(reportData, filename, 'Clientes');
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
          <div className="export-info">
            <h4>Opciones de Exportación Excel</h4>
            <div className="export-options">
              <div className="option-item">
                <strong>📊 Reporte Individual:</strong> Exporta solo los datos del tipo seleccionado con filtros aplicados
              </div>
              <div className="option-item">
                <strong>📈 Reporte Completo:</strong> Exporta todos los empleados, proyectos y clientes en un archivo Excel con múltiples hojas
              </div>
            </div>
          </div>

          <div className="export-buttons">
            <button onClick={() => setShowVisualization(!showVisualization)} className="btn btn-secondary">
              {showVisualization ? '📊 Ocultar Vista Previa' : '👁️ Ver Vista Previa'}
            </button>
            <button onClick={handleExport} className="btn btn-primary">
              📊 Exportar Reporte Individual
            </button>
            <button onClick={exportCompleteReport} className="btn btn-success">
              📈 Exportar Reporte Completo
            </button>
          </div>
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