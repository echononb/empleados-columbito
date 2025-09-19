import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface Client {
  id?: string;
  name: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  projects: string[];
  createdAt?: string;
  updatedAt?: string;
}

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for now - will be replaced with Firebase
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'Constructora Lima S.A.',
          contactInfo: {
            email: 'contacto@constructoralima.com',
            phone: '+51 987 654 321',
            address: 'Av. Javier Prado 123, San Isidro, Lima'
          },
          projects: ['1', '2']
        },
        {
          id: '2',
          name: 'Inmobiliaria Pacífico',
          contactInfo: {
            email: 'info@inmobiliariapacífico.com.pe',
            phone: '+51 987 123 456',
            address: 'Calle Los Olivos 456, Miraflores, Lima'
          },
          projects: ['2']
        },
        {
          id: '3',
          name: 'Municipalidad de Lima',
          contactInfo: {
            email: 'proyectos@munlima.gob.pe',
            phone: '+51 987 789 012',
            address: 'Plaza Mayor s/n, Cercado de Lima'
          },
          projects: ['3']
        }
      ];
      setClients(mockClients);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;

    const term = searchTerm.toLowerCase().trim();
    return clients.filter(client =>
      client.name.toLowerCase().includes(term) ||
      client.contactInfo.email.toLowerCase().includes(term) ||
      client.contactInfo.phone.includes(term)
    );
  }, [clients, searchTerm]);

  if (loading) {
    return <div className="loading">Cargando clientes...</div>;
  }

  return (
    <div className="client-list">
      <div className="client-list-header">
        <h2>Lista de Clientes</h2>
        <Link to="/clients/new" className="btn btn-primary">
          Nuevo Cliente
        </Link>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="client-table-container">
        <table className="client-table">
          <thead>
            <tr>
              <th>Nombre del Cliente</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Proyectos Activos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id}>
                <td className="client-name">{client.name}</td>
                <td>{client.contactInfo.email}</td>
                <td>{client.contactInfo.phone}</td>
                <td className="client-address">{client.contactInfo.address}</td>
                <td>{client.projects.length} proyectos</td>
                <td>
                  <Link to={`/clients/${client.id}`} className="btn btn-secondary">
                    Ver/Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredClients.length === 0 && (
        <div className="no-results">
          {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados.'}
        </div>
      )}

      <div className="client-stats">
        <div className="stat-card">
          <h3>{clients.length}</h3>
          <p>Total de Clientes</p>
        </div>
        <div className="stat-card">
          <h3>{clients.reduce((sum, client) => sum + client.projects.length, 0)}</h3>
          <p>Proyectos Totales</p>
        </div>
        <div className="stat-card">
          <h3>{clients.filter(client => client.projects.length > 0).length}</h3>
          <p>Clientes Activos</p>
        </div>
      </div>
    </div>
  );
};

export default ClientList;