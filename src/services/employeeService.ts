import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Employee {
  id?: string;
  employeeCode: string;
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  direccionActual: string;
  referenciaDireccion: string;
  puesto: string;
  fechaIngreso: string;
  regimenLaboral: string;
  fechaNacimiento: string;
  lugarNacimiento: {
    departamento: string;
    provincia: string;
    distrito: string;
  };
  fotoUrl?: string;
  sexo: string;
  numeroFotocheck: string;
  telefonoCelular: string;
  telefonoFijo: string;
  estadoCivil: string;
  afp: string;
  email: string;
  licenciaConducir: string;
  categoriaLicencia: string;
  banco: string;
  numeroCuenta: string;
  cci: string;
  factorRH: string;
  antecedentesPenales: boolean;
  epp: {
    tallaCalzado: string;
    tallaVestimenta: string;
  };
  informacionAcademica: {
    gradoInstruccion: string;
    nombreInstitucion: string;
    tipoInstitucion: string;
    carrera: string;
    anoEgreso: number;
  };
  estudiosComplementarios: Array<{
    diploma: string;
    institucion: string;
    fechaEgreso: string;
  }>;
  datosFamilia: {
    conyuge: {
      apellidosNombres: string;
      dni: string;
      fechaNacimiento: string;
      telefono: string;
      documentoVinculo: string;
    };
    tieneHijos: boolean;
  };
  hijos: Array<{
    dni: string;
    apellidos: string;
    nombres: string;
  }>;
  assignedProjects: string[];
  createdAt?: string;
  updatedAt?: string;
}

const COLLECTION_NAME = 'employees';

export class EmployeeService {
  // Simple in-memory cache for better performance
  private static cache: { [key: string]: { data: Employee[]; timestamp: number } } = {};
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getAllEmployees(useCache: boolean = true): Promise<Employee[]> {
    try {
      if (!db) {
        throw new Error('Firebase not configured. Please set up Firebase environment variables.');
      }

      // Check cache first
      const cacheKey = 'all_employees';
      const now = Date.now();

      if (useCache && this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.CACHE_DURATION) {
        return this.cache[cacheKey].data;
      }

      // Fetch from Firestore
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const employees = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee));

      // Cache the result
      this.cache[cacheKey] = { data: employees, timestamp: now };

      return employees;
    } catch (error) {
      console.error('Error getting employees:', error);
      throw error;
    }
  }

  // Clear cache when data is modified
  static clearCache(): void {
    this.cache = {};
  }

  static async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      if (!db) {
        throw new Error('Firebase not configured. Please set up Firebase environment variables.');
      }
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Employee;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  }

  static async createEmployee(employeeData: Omit<Employee, 'id'>): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase not configured. Please set up Firebase environment variables.');
      }
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...employeeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Clear cache after creating
      this.clearCache();

      return docRef.id;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not configured. Please set up Firebase environment variables.');
      }
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...employeeData,
        updatedAt: new Date().toISOString()
      });

      // Clear cache after updating
      this.clearCache();

    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  static async searchEmployees(searchTerm: string): Promise<Employee[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - you might want to use Algolia or ElasticSearch for production
      const employees = await this.getAllEmployees();

      return employees.filter(employee =>
        employee.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.apellidoPaterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.apellidoMaterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.dni.includes(searchTerm) ||
        employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.puesto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }

  static calculateAge(fechaNacimiento: string): number {
    const birthDate = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}

export {};