import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { db, storage } from '../firebase';

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
  static async getAllEmployees(): Promise<Employee[]> {
    try {
      // First try to get from localStorage (immediate response)
      const localData = this.getFromLocalStorage();
      if (localData.length > 0) {
        // Return local data immediately, then try to sync with Firebase in background
        this.syncWithFirebase(localData);
        return localData;
      }

      // If no local data, try Firebase
      if (db) {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const employees = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Employee));

        // Save to localStorage for future use
        this.saveToLocalStorage(employees);
        return employees;
      }

      // If neither localStorage nor Firebase available, return empty array
      return [];
    } catch (error) {
      console.error('Error obteniendo empleados:', error);
      // Return localStorage data as fallback
      return this.getFromLocalStorage();
    }
  }

  private static getFromLocalStorage(): Employee[] {
    try {
      const data = localStorage.getItem('empleados-data');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  private static saveToLocalStorage(employees: Employee[]): void {
    try {
      localStorage.setItem('empleados-data', JSON.stringify(employees));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private static async syncWithFirebase(localData: Employee[]): Promise<void> {
    if (!db) return;

    try {
      // This would sync local changes to Firebase when available
      // For now, just log that Firebase is available
      console.log('Firebase disponible - datos locales listos para sincronizar');
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
    }
  }

  static async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      // Try Firebase first
      if (db) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data()
          } as Employee;
        }
      }

      // Fallback to localStorage
      const localData = this.getFromLocalStorage();
      return localData.find(emp => emp.id === id) || null;
    } catch (error) {
      console.error('Error obteniendo empleado:', error);
      // Fallback to localStorage
      const localData = this.getFromLocalStorage();
      return localData.find(emp => emp.id === id) || null;
    }
  }

  static async createEmployee(employeeData: Omit<Employee, 'id'>): Promise<string> {
    try {
      // Generate automatic employee code if not provided
      const finalEmployeeData = {
        ...employeeData,
        employeeCode: employeeData.employeeCode || this.generateEmployeeCode()
      };

      // Try Firebase first
      if (db) {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
          ...finalEmployeeData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        return docRef.id;
      }

      // Fallback to localStorage
      const localId = Date.now().toString();
      const localEmployee = {
        ...finalEmployeeData,
        id: localId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingData = this.getFromLocalStorage();
      existingData.push(localEmployee);
      this.saveToLocalStorage(existingData);

      return localId;
    } catch (error) {
      console.error('Error creando empleado:', error);

      // Always fallback to localStorage
      const localId = Date.now().toString();
      const localEmployee = {
        ...employeeData,
        id: localId,
        employeeCode: employeeData.employeeCode || this.generateEmployeeCode(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingData = this.getFromLocalStorage();
      existingData.push(localEmployee);
      this.saveToLocalStorage(existingData);

      return localId;
    }
  }

  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<void> {
    try {
      // Try Firebase first
      if (db) {
        await updateDoc(doc(db, COLLECTION_NAME, id), {
          ...employeeData,
          updatedAt: new Date().toISOString()
        });
      }

      // Always update localStorage
      const localData = this.getFromLocalStorage();
      const index = localData.findIndex(emp => emp.id === id);
      if (index !== -1) {
        localData[index] = { ...localData[index], ...employeeData, updatedAt: new Date().toISOString() };
        this.saveToLocalStorage(localData);
      }
    } catch (error) {
      console.error('Error actualizando empleado:', error);
      // Fallback to localStorage only
      const localData = this.getFromLocalStorage();
      const index = localData.findIndex(emp => emp.id === id);
      if (index !== -1) {
        localData[index] = { ...localData[index], ...employeeData, updatedAt: new Date().toISOString() };
        this.saveToLocalStorage(localData);
      }
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    try {
      // Try Firebase first
      if (db) {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      }

      // Always update localStorage
      const localData = this.getFromLocalStorage();
      const filteredData = localData.filter(emp => emp.id !== id);
      this.saveToLocalStorage(filteredData);
    } catch (error) {
      console.error('Error eliminando empleado:', error);
      // Fallback to localStorage only
      const localData = this.getFromLocalStorage();
      const filteredData = localData.filter(emp => emp.id !== id);
      this.saveToLocalStorage(filteredData);
    }
  }

  static async searchEmployees(searchTerm: string): Promise<Employee[]> {
    try {
      // Get all employees and filter client-side
      const employees = await this.getAllEmployees();

      if (!searchTerm.trim()) return employees;

      const term = searchTerm.toLowerCase().trim();
      return employees.filter(employee =>
        employee.nombres?.toLowerCase().includes(term) ||
        employee.apellidoPaterno?.toLowerCase().includes(term) ||
        employee.apellidoMaterno?.toLowerCase().includes(term) ||
        employee.dni?.includes(term) ||
        employee.employeeCode?.toLowerCase().includes(term) ||
        employee.puesto?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error buscando empleados:', error);
      // Fallback to localStorage search
      const localData = this.getFromLocalStorage();
      if (!searchTerm.trim()) return localData;

      const term = searchTerm.toLowerCase().trim();
      return localData.filter(employee =>
        employee.nombres?.toLowerCase().includes(term) ||
        employee.apellidoPaterno?.toLowerCase().includes(term) ||
        employee.apellidoMaterno?.toLowerCase().includes(term) ||
        employee.dni?.includes(term) ||
        employee.employeeCode?.toLowerCase().includes(term) ||
        employee.puesto?.toLowerCase().includes(term)
      );
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
    try {
      // Try Firebase Storage first
      if (storage) {
        const storageRef = ref(storage, `employees/photos/photo_${Date.now()}.jpg`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
      }
    } catch (storageError) {
      console.warn('Firebase Storage failed, using base64 fallback:', storageError);
    }

    // Fallback: Convert to base64 and store as data URL
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

  private static generateEmployeeCode(): string {
    // Simple code generation - in production you might want to check existing codes
    const timestamp = Date.now().toString().slice(-4);
    return `EMP${timestamp}`;
  }
}

export {};