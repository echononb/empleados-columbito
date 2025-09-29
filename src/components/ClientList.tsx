import React, { useState, useEffect, useMemo } from 'react';
import { ClientService, Client } from '../services/clientService';

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  // Load clients from Firebase
  const loadClients = async () => {
    try {
      setLoading(true);
      const clientData = await ClientService.getAllClients();
      setClients(clientData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
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

  const handleCreateClient = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleSaveClient = async (clientData: Omit<Client, 'id'>) => {
    setSaving(true);
    try {
      if (editingClient && editingClient.id) {
        // Update existing client
        await ClientService.updateClient(editingClient.id, clientData);
      } else {
        // Create new client
        await ClientService.createClient(clientData);
      }
      setShowModal(false);
      setEditingClient(null);
      // Reload clients
      await loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando clientes...</div>;
  }

  return (
    <div className="client-list">
      <div className="client-list-header">
        <h2>Lista de Clientes</h2>
        <button onClick={handleCreateClient} className="btn btn-primary">
          Nuevo Cliente
        </button>
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
              <th>RUC</th>
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
                <td>{client.ruc}</td>
                <td>{client.contactInfo.email}</td>
                <td>{client.contactInfo.phone}</td>
                <td className="client-address">{client.contactInfo.address}</td>
                <td>{client.projects.length} proyectos</td>
                <td>
                  <button onClick={() => handleEditClient(client)} className="btn btn-secondary">
                    Ver/Editar
                  </button>
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

      {showModal && (
        <ClientModal
          client={editingClient}
          onSave={handleSaveClient}
          onClose={() => {
            setShowModal(false);
            setEditingClient(null);
          }}
          loading={saving}
        />
      )}
    </div>
  );
};

// Client Modal Component
interface ClientModalProps {
  client: Client | null;
  onSave: (client: Omit<Client, 'id'>) => void;
  onClose: () => void;
  loading: boolean;
}

const ClientModal: React.FC<ClientModalProps> = ({ client, onSave, onClose, loading }) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    name: client?.name || '',
    ruc: client?.ruc || '',
    contactInfo: {
      email: client?.contactInfo.email || '',
      phone: client?.contactInfo.phone || '',
      address: client?.contactInfo.address || ''
    },
    projects: client?.projects || []
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nombre del cliente es requerido';
    }
    if (!formData.ruc.trim()) {
      newErrors.ruc = 'RUC es requerido';
    } else if (!/^\d{11}$/.test(formData.ruc)) {
      newErrors.ruc = 'RUC debe tener 11 dígitos';
    }
    if (!formData.contactInfo.email.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactInfo.email)) {
      newErrors.email = 'Email no es válido';
    }
    if (!formData.contactInfo.phone.trim()) {
      newErrors.phone = 'Teléfono es requerido';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="name">Nombre del Cliente *</label>
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
            <label htmlFor="ruc">RUC *</label>
            <input
              type="text"
              id="ruc"
              name="ruc"
              value={formData.ruc}
              onChange={handleInputChange}
              maxLength={11}
              placeholder="Ej: 20123456789"
              className={errors.ruc ? 'error' : ''}
              required
            />
            {errors.ruc && <span className="error-message">{errors.ruc}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="contactInfo.email"
              value={formData.contactInfo.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono *</label>
            <input
              type="tel"
              id="phone"
              name="contactInfo.phone"
              value={formData.contactInfo.phone}
              onChange={handleInputChange}
              className={errors.phone ? 'error' : ''}
              required
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="address">Dirección</label>
            <textarea
              id="address"
              name="contactInfo.address"
              value={formData.contactInfo.address}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Guardando...' : (client ? 'Actualizar' : 'Crear Cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientList;