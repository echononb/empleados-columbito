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
      if (!db) {
        throw new Error('Firebase no está configurado. Verifica las variables de entorno.');
      }

      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const employees = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee));

      return employees;
    } catch (error) {
      console.error('Error obteniendo empleados de Firestore:', error);
      throw new Error('Error al cargar empleados desde la base de datos');
    }
  }

  static async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      if (!db) {
        throw new Error('Firebase no está configurado. Verifica las variables de entorno.');
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
      console.error('Error obteniendo empleado:', error);
      throw error;
    }
  }

  static async createEmployee(employeeData: Omit<Employee, 'id'>): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase no está configurado. Verifica las variables de entorno.');
      }

      // Generate automatic employee code if not provided
      const finalEmployeeData = {
        ...employeeData,
        employeeCode: employeeData.employeeCode || this.generateEmployeeCode()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...finalEmployeeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creando empleado:', error);
      throw new Error('Error al crear empleado en la base de datos');
    }
  }

  static async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase no está configurado. Verifica las variables de entorno.');
      }

      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...employeeData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error actualizando empleado:', error);
      throw new Error('Error al actualizar empleado en la base de datos');
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase no está configurado. Verifica las variables de entorno.');
      }

      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error eliminando empleado:', error);
      throw new Error('Error al eliminar empleado de la base de datos');
    }
  }

  static async searchEmployees(searchTerm: string): Promise<Employee[]> {
    try {
      // Get all employees and filter client-side
      // Note: Firestore doesn't support full-text search natively
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
      console.error('Error buscando empleados:', error);
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

  private static generateEmployeeCode(): string {
    // Simple code generation - in production you might want to check existing codes
    const timestamp = Date.now().toString().slice(-4);
    return `EMP${timestamp}`;
  }
}

export {};