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
  private static readonly LOCAL_STORAGE_KEY = 'empleados_columbito_employees';

  static async getAllEmployees(useCache: boolean = true): Promise<Employee[]> {
    try {
      // Try Firebase first
      if (db) {
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

        // Also save to localStorage as backup
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(employees));

        return employees;
      } else {
        // Fallback to localStorage
        console.warn('Firebase not configured, using localStorage');
        return this.getEmployeesFromLocalStorage();
      }
    } catch (error) {
      console.error('Error getting employees from Firebase, falling back to localStorage:', error);
      return this.getEmployeesFromLocalStorage();
    }
  }

  private static getEmployeesFromLocalStorage(): Employee[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : this.getMockEmployees();
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return this.getMockEmployees();
    }
  }

  private static getMockEmployees(): Employee[] {
    return [
      {
        id: '1',
        employeeCode: 'EMP001',
        dni: '12345678',
        apellidoPaterno: 'García',
        apellidoMaterno: 'López',
        nombres: 'Juan Carlos',
        puesto: 'Ingeniero Civil',
        fechaIngreso: '2023-01-15',
        fechaNacimiento: '1988-05-20',
        fotoUrl: 'https://via.placeholder.com/200x200/3498db/ffffff?text=Juan+Carlos',
        direccionActual: '',
        referenciaDireccion: '',
        regimenLaboral: '',
        lugarNacimiento: { departamento: '', provincia: '', distrito: '' },
        sexo: '',
        numeroFotocheck: '',
        telefonoCelular: '',
        telefonoFijo: '',
        estadoCivil: '',
        afp: '',
        email: '',
        licenciaConducir: '',
        categoriaLicencia: '',
        banco: '',
        numeroCuenta: '',
        cci: '',
        factorRH: '',
        antecedentesPenales: false,
        epp: { tallaCalzado: '', tallaVestimenta: '' },
        informacionAcademica: { gradoInstruccion: '', nombreInstitucion: '', tipoInstitucion: '', carrera: '', anoEgreso: 0 },
        estudiosComplementarios: [],
        datosFamilia: { conyuge: { apellidosNombres: '', dni: '', fechaNacimiento: '', telefono: '', documentoVinculo: '' }, tieneHijos: false },
        hijos: [],
        assignedProjects: []
      },
      {
        id: '2',
        employeeCode: 'EMP002',
        dni: '87654321',
        apellidoPaterno: 'Martínez',
        apellidoMaterno: 'Rodríguez',
        nombres: 'María Elena',
        puesto: 'Arquitecta',
        fechaIngreso: '2023-03-20',
        fechaNacimiento: '1995-08-15',
        fotoUrl: 'https://via.placeholder.com/200x200/e74c3c/ffffff?text=María+Elena',
        direccionActual: '',
        referenciaDireccion: '',
        regimenLaboral: '',
        lugarNacimiento: { departamento: '', provincia: '', distrito: '' },
        sexo: '',
        numeroFotocheck: '',
        telefonoCelular: '',
        telefonoFijo: '',
        estadoCivil: '',
        afp: '',
        email: '',
        licenciaConducir: '',
        categoriaLicencia: '',
        banco: '',
        numeroCuenta: '',
        cci: '',
        factorRH: '',
        antecedentesPenales: false,
        epp: { tallaCalzado: '', tallaVestimenta: '' },
        informacionAcademica: { gradoInstruccion: '', nombreInstitucion: '', tipoInstitucion: '', carrera: '', anoEgreso: 0 },
        estudiosComplementarios: [],
        datosFamilia: { conyuge: { apellidosNombres: '', dni: '', fechaNacimiento: '', telefono: '', documentoVinculo: '' }, tieneHijos: false },
        hijos: [],
        assignedProjects: []
      }
    ];
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
    // Generate automatic employee code if not provided
    const finalEmployeeData = {
      ...employeeData,
      employeeCode: employeeData.employeeCode || this.generateEmployeeCode()
    };

    if (db) {
      // Try Firebase first with timeout
      try {
        const firebasePromise = addDoc(collection(db, COLLECTION_NAME), {
          ...finalEmployeeData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase timeout')), 5000)
        );

        const docRef = await Promise.race([firebasePromise, timeoutPromise]);

        // Clear cache after creating
        this.clearCache();

        return docRef.id;
      } catch (firebaseError) {
        console.warn('Firebase create failed, falling back to localStorage:', firebaseError);
        return this.createEmployeeInLocalStorage(finalEmployeeData);
      }
    } else {
      // Fallback to localStorage
      console.warn('Firebase not configured, saving to localStorage');
      return this.createEmployeeInLocalStorage(finalEmployeeData);
    }
  }

  private static createEmployeeInLocalStorage(employeeData: Omit<Employee, 'id'>): string {
    const employees = this.getEmployeesFromLocalStorage();
    const newId = Date.now().toString();

    const newEmployee: Employee = {
      ...employeeData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    employees.push(newEmployee);
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(employees));

    // Clear cache
    this.clearCache();

    return newId;
  }

  private static generateEmployeeCode(): string {
    const employees = this.getEmployeesFromLocalStorage();
    const existingCodes = employees.map(emp => emp.employeeCode).filter(code => code.startsWith('EMP'));

    let nextNumber = 1;
    if (existingCodes.length > 0) {
      const numbers = existingCodes.map(code => {
        const match = code.match(/EMP(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      nextNumber = Math.max(...numbers) + 1;
    }

    return `EMP${nextNumber.toString().padStart(3, '0')}`;
  }

  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<void> {
    if (db) {
      // Try Firebase first with timeout
      try {
        const firebasePromise = updateDoc(doc(db, COLLECTION_NAME, id), {
          ...employeeData,
          updatedAt: new Date().toISOString()
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase timeout')), 5000)
        );

        await Promise.race([firebasePromise, timeoutPromise]);

        // Clear cache after updating
        this.clearCache();

      } catch (firebaseError) {
        console.warn('Firebase update failed, falling back to localStorage:', firebaseError);
        this.updateEmployeeInLocalStorage(id, employeeData);
      }
    } else {
      // Fallback to localStorage
      console.warn('Firebase not configured, updating in localStorage');
      this.updateEmployeeInLocalStorage(id, employeeData);
    }
  }

  private static updateEmployeeInLocalStorage(id: string, employeeData: Partial<Employee>): void {
    const employees = this.getEmployeesFromLocalStorage();
    const index = employees.findIndex(emp => emp.id === id);

    if (index !== -1) {
      employees[index] = {
        ...employees[index],
        ...employeeData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(employees));

      // Clear cache
      this.clearCache();
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

  // Fallback photo upload using base64 encoding when Firebase Storage is not available
  static async uploadPhotoWithFallback(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }
}

export {};