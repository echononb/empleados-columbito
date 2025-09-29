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

export interface Project {
  id?: string;
  name: string;
  description: string;
  contrato: string;
  clientId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'on-hold';
  assignedEmployees: string[];
  createdAt?: string;
  updatedAt?: string;
}

const COLLECTION_NAME = 'projects';

export class ProjectService {
  static async getAllProjects(): Promise<Project[]> {
    try {
      if (db) {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const projects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project));

        this.saveToLocalStorage(projects);
        return projects;
      }

      return this.getFromLocalStorage();
    } catch (error) {
      console.error('Error obteniendo proyectos de Firestore:', error);
      return this.getFromLocalStorage();
    }
  }

  private static getFromLocalStorage(): Project[] {
    try {
      const data = localStorage.getItem('proyectos-data');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  private static saveToLocalStorage(projects: Project[]): void {
    try {
      localStorage.setItem('proyectos-data', JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static async getProjectById(id: string): Promise<Project | null> {
    try {
      if (db) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data()
          } as Project;
        }
      }

      const localData = this.getFromLocalStorage();
      return localData.find(project => project.id === id) || null;
    } catch (error) {
      console.error('Error obteniendo proyecto:', error);
      const localData = this.getFromLocalStorage();
      return localData.find(project => project.id === id) || null;
    }
  }

  static async createProject(projectData: Omit<Project, 'id'>): Promise<string> {
    try {
      if (db) {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...projectData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        const newProject = { ...projectData, id: docRef.id };
        const existingData = this.getFromLocalStorage();
        existingData.push(newProject);
        this.saveToLocalStorage(existingData);

        return docRef.id;
      }

      const localId = Date.now().toString();
      const localProject = {
        ...projectData,
        id: localId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingData = this.getFromLocalStorage();
      existingData.push(localProject);
      this.saveToLocalStorage(existingData);

      return localId;
    } catch (error) {
      console.error('Error creando proyecto:', error);
      throw error;
    }
  }

  static async updateProject(id: string, projectData: Partial<Project>): Promise<void> {
    try {
      if (db) {
        await updateDoc(doc(db, COLLECTION_NAME, id), {
          ...projectData,
          updatedAt: new Date().toISOString()
        });
      }

      const localData = this.getFromLocalStorage();
      const index = localData.findIndex(project => project.id === id);
      if (index !== -1) {
        localData[index] = { ...localData[index], ...projectData, updatedAt: new Date().toISOString() };
        this.saveToLocalStorage(localData);
      }
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      const localData = this.getFromLocalStorage();
      const index = localData.findIndex(project => project.id === id);
      if (index !== -1) {
        localData[index] = { ...localData[index], ...projectData, updatedAt: new Date().toISOString() };
        this.saveToLocalStorage(localData);
      }
    }
  }

  static async deleteProject(id: string): Promise<void> {
    try {
      if (db) {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      }

      const localData = this.getFromLocalStorage();
      const filteredData = localData.filter(project => project.id !== id);
      this.saveToLocalStorage(filteredData);
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      const localData = this.getFromLocalStorage();
      const filteredData = localData.filter(project => project.id !== id);
      this.saveToLocalStorage(filteredData);
    }
  }

  static async searchProjects(searchTerm: string): Promise<Project[]> {
    try {
      const projects = await this.getAllProjects();

      if (!searchTerm.trim()) return projects;

      const term = searchTerm.toLowerCase().trim();
      return projects.filter(project =>
        project.name.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        project.contrato.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error buscando proyectos:', error);
      const localData = this.getFromLocalStorage();
      if (!searchTerm.trim()) return localData;

      const term = searchTerm.toLowerCase().trim();
      return localData.filter(project =>
        project.name.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        project.contrato.toLowerCase().includes(term)
      );
    }
  }

  static async assignEmployeeToProject(projectId: string, employeeId: string): Promise<void> {
    try {
      // Always get fresh project data to avoid stale data issues with multiple assignments
      const project = await this.getProjectById(projectId);
      if (project) {
        // Check if employee is already assigned (double-check with fresh data)
        if (!project.assignedEmployees.includes(employeeId)) {
          const updatedEmployees = [...project.assignedEmployees, employeeId];
          await this.updateProject(projectId, { assignedEmployees: updatedEmployees });
        }

        // Also update employee's assigned projects
        const { EmployeeService } = await import('./employeeService');
        const employee = await EmployeeService.getEmployeeById(employeeId);
        if (employee && !employee.assignedProjects.includes(projectId)) {
          const updatedProjects = [...employee.assignedProjects, projectId];
          await EmployeeService.updateEmployee(employeeId, { assignedProjects: updatedProjects });
        }
      }
    } catch (error) {
      console.error('Error asignando empleado al proyecto:', error);
      throw error;
    }
  }

  static async removeEmployeeFromProject(projectId: string, employeeId: string): Promise<void> {
    try {
      const project = await this.getProjectById(projectId);
      if (project) {
        const updatedEmployees = project.assignedEmployees.filter(id => id !== employeeId);
        await this.updateProject(projectId, { assignedEmployees: updatedEmployees });

        // Also update employee's assigned projects
        const { EmployeeService } = await import('./employeeService');
        const employee = await EmployeeService.getEmployeeById(employeeId);
        if (employee) {
          const updatedProjects = employee.assignedProjects.filter(id => id !== projectId);
          await EmployeeService.updateEmployee(employeeId, { assignedProjects: updatedProjects });
        }
      }
    } catch (error) {
      console.error('Error removiendo empleado del proyecto:', error);
      throw error;
    }
  }
}

export {};