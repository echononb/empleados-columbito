import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Client {
  id?: string;
  name: string;
  ruc: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  projects: string[];
  createdAt?: string;
  updatedAt?: string;
}

const COLLECTION_NAME = 'clients';

export class ClientService {
  static async getAllClients(): Promise<Client[]> {
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const clients = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Client));

        this.saveToLocalStorage(clients);
        return clients;
      }

      return this.getFromLocalStorage();
    } catch (error) {
      console.error('Error obteniendo clientes de Firestore:', error);
      return this.getFromLocalStorage();
    }
  }

  private static getFromLocalStorage(): Client[] {
    try {
      const data = localStorage.getItem('clientes-data');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  private static saveToLocalStorage(clients: Client[]): void {
    try {
      localStorage.setItem('clientes-data', JSON.stringify(clients));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static async getClientById(id: string): Promise<Client | null> {
    try {
      if (db) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data()
          } as Client;
        }
      }

      const localData = this.getFromLocalStorage();
      return localData.find(client => client.id === id) || null;
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      const localData = this.getFromLocalStorage();
      return localData.find(client => client.id === id) || null;
    }
  }

  static async createClient(clientData: Omit<Client, 'id'>): Promise<string> {
    try {
      if (db) {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...clientData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        const newClient = { ...clientData, id: docRef.id };
        const existingData = this.getFromLocalStorage();
        existingData.push(newClient);
        this.saveToLocalStorage(existingData);

        return docRef.id;
      }

      const localId = Date.now().toString();
      const localClient = {
        ...clientData,
        id: localId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingData = this.getFromLocalStorage();
      existingData.push(localClient);
      this.saveToLocalStorage(existingData);

      return localId;
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  }

  static async updateClient(id: string, clientData: Partial<Client>): Promise<void> {
    try {
      if (db) {
        await updateDoc(doc(db, COLLECTION_NAME, id), {
          ...clientData,
          updatedAt: new Date().toISOString()
        });
      }

      const localData = this.getFromLocalStorage();
      const index = localData.findIndex(client => client.id === id);
      if (index !== -1) {
        localData[index] = { ...localData[index], ...clientData, updatedAt: new Date().toISOString() };
        this.saveToLocalStorage(localData);
      }
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      const localData = this.getFromLocalStorage();
      const index = localData.findIndex(client => client.id === id);
      if (index !== -1) {
        localData[index] = { ...localData[index], ...clientData, updatedAt: new Date().toISOString() };
        this.saveToLocalStorage(localData);
      }
    }
  }

  static async deleteClient(id: string): Promise<void> {
    try {
      if (db) {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      }

      const localData = this.getFromLocalStorage();
      const filteredData = localData.filter(client => client.id !== id);
      this.saveToLocalStorage(filteredData);
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      const localData = this.getFromLocalStorage();
      const filteredData = localData.filter(client => client.id !== id);
      this.saveToLocalStorage(filteredData);
    }
  }

  static async searchClients(searchTerm: string): Promise<Client[]> {
    try {
      const clients = await this.getAllClients();

      if (!searchTerm.trim()) return clients;

      const term = searchTerm.toLowerCase().trim();
      return clients.filter(client =>
        client.name.toLowerCase().includes(term) ||
        client.contactInfo.email.toLowerCase().includes(term) ||
        client.contactInfo.phone.includes(term) ||
        client.ruc.includes(term)
      );
    } catch (error) {
      console.error('Error buscando clientes:', error);
      const localData = this.getFromLocalStorage();
      if (!searchTerm.trim()) return localData;

      const term = searchTerm.toLowerCase().trim();
      return localData.filter(client =>
        client.name.toLowerCase().includes(term) ||
        client.contactInfo.email.toLowerCase().includes(term) ||
        client.contactInfo.phone.includes(term) ||
        client.ruc.includes(term)
      );
    }
  }
}

export {};