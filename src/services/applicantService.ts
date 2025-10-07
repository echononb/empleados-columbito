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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { Applicant, ApplicantFilters, ApplicantStats, ApplicantStatus } from '../types/applicant';
import logger from '../utils/logger';

const COLLECTION_NAME = 'applicants';

export class ApplicantService {
  /**
   * Obtener todos los postulantes con filtros opcionales
   */
  static async getAllApplicants(filters?: ApplicantFilters): Promise<Applicant[]> {
    try {
      if (!db) {
        logger.warn('Firebase not available, using localStorage fallback');
        return this.getFromLocalStorage();
      }

      // Obtener todos los postulantes primero
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      let applicants = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Applicant));

      // Aplicar filtros del lado del cliente
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          const statusSet = new Set(filters.status);
          applicants = applicants.filter(app => statusSet.has(app.status));
        }

        if (filters.puestoInteres) {
          applicants = applicants.filter(app =>
            app.puestoInteres.toLowerCase().includes(filters.puestoInteres!.toLowerCase())
          );
        }

        if (filters.fuentePostulacion && filters.fuentePostulacion.length > 0) {
          const fuenteSet = new Set(filters.fuentePostulacion);
          applicants = applicants.filter(app => fuenteSet.has(app.fuentePostulacion));
        }

        if (filters.fechaDesde) {
          applicants = applicants.filter(app => app.fechaPostulacion >= filters.fechaDesde!);
        }

        if (filters.fechaHasta) {
          applicants = applicants.filter(app => app.fechaPostulacion <= filters.fechaHasta!);
        }

        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          applicants = applicants.filter(app =>
            app.nombres.toLowerCase().includes(term) ||
            app.apellidoPaterno.toLowerCase().includes(term) ||
            app.dni.includes(term) ||
            app.puestoInteres.toLowerCase().includes(term)
          );
        }
      }

      // Ordenar por fecha de postulación (más recientes primero)
      applicants.sort((a, b) => new Date(b.fechaPostulacion).getTime() - new Date(a.fechaPostulacion).getTime());

      // Sincronizar con localStorage para respaldo
      this.saveToLocalStorage(applicants);

      return applicants;
    } catch (error) {
      logger.error('Error getting applicants from Firestore', error);
      // Fallback to localStorage
      return this.getFromLocalStorage();
    }
  }

  /**
   * Obtener postulante por ID
   */
  static async getApplicantById(id: string): Promise<Applicant | null> {
    try {
      if (!db) {
        return this.getFromLocalStorage().find(app => app.id === id) || null;
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Applicant;
      }

      return null;
    } catch (error) {
      logger.error('Error getting applicant by ID', error);
      return this.getFromLocalStorage().find(app => app.id === id) || null;
    }
  }

  /**
   * Crear nuevo postulante
   */
  static async createApplicant(applicantData: Omit<Applicant, 'id'>): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase no está disponible para crear postulantes');
      }

      const now = new Date().toISOString();
      const finalApplicantData = {
        ...applicantData,
        status: 'pendiente' as ApplicantStatus,
        fechaPostulacion: now,
        fechaUltimaActualizacion: now,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), finalApplicantData);

      // Sincronizar con localStorage
      const newApplicant = { ...finalApplicantData, id: docRef.id };
      const existingData = this.getFromLocalStorage();
      existingData.push(newApplicant);
      this.saveToLocalStorage(existingData);

      logger.info('Applicant created successfully', { id: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating applicant', error);
      throw error;
    }
  }

  /**
   * Actualizar postulante
   */
  static async updateApplicant(id: string, applicantData: Partial<Applicant>): Promise<void> {
    try {
      if (!db) {
        // Fallback to localStorage
        const localData = this.getFromLocalStorage();
        const index = localData.findIndex(app => app.id === id);
        if (index !== -1) {
          localData[index] = {
            ...localData[index],
            ...applicantData,
            fechaUltimaActualizacion: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.saveToLocalStorage(localData);
        }
        return;
      }

      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...applicantData,
        fechaUltimaActualizacion: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Actualizar localStorage también
      const localData = this.getFromLocalStorage();
      const index = localData.findIndex(app => app.id === id);
      if (index !== -1) {
        localData[index] = {
          ...localData[index],
          ...applicantData,
          fechaUltimaActualizacion: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.saveToLocalStorage(localData);
      }

      logger.info('Applicant updated successfully', { id });
    } catch (error) {
      logger.error('Error updating applicant', error);
      throw error;
    }
  }

  /**
   * Actualizar estado del postulante
   */
  static async updateApplicantStatus(
    id: string,
    status: ApplicantStatus,
    updatedBy?: string,
    observaciones?: string
  ): Promise<void> {
    try {
      const updateData: Partial<Applicant> = {
        status,
        fechaUltimaActualizacion: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        actualizadoPor: updatedBy
      };

      if (observaciones) {
        updateData.observaciones = observaciones;
      }

      await this.updateApplicant(id, updateData);

      logger.info('Applicant status updated', { id, status, updatedBy });
    } catch (error) {
      logger.error('Error updating applicant status', error);
      throw error;
    }
  }

  /**
   * Buscar postulantes
   */
  static async searchApplicants(searchTerm: string): Promise<Applicant[]> {
    try {
      const applicants = await this.getAllApplicants();

      if (!searchTerm.trim()) return applicants;

      const term = searchTerm.toLowerCase().trim();
      return applicants.filter(applicant =>
        applicant.nombres?.toLowerCase().includes(term) ||
        applicant.apellidoPaterno?.toLowerCase().includes(term) ||
        applicant.apellidoMaterno?.toLowerCase().includes(term) ||
        applicant.dni?.includes(term) ||
        applicant.puestoInteres?.toLowerCase().includes(term) ||
        applicant.email?.toLowerCase().includes(term)
      );
    } catch (error) {
      logger.error('Error searching applicants', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de postulantes
   */
  static async getApplicantStats(): Promise<ApplicantStats> {
    try {
      const applicants = await this.getAllApplicants();
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const stats: ApplicantStats = {
        total: applicants.length,
        pendientes: applicants.filter(app => app.status === 'pendiente').length,
        en_revision: applicants.filter(app => app.status === 'en_revision').length,
        aprobados: applicants.filter(app => app.status === 'aprobado').length,
        rechazados: applicants.filter(app => app.status === 'rechazado').length,
        contratados: applicants.filter(app => app.status === 'contratado').length,
        nuevos_hoy: applicants.filter(app => app.fechaPostulacion.startsWith(today)).length,
        nuevos_semana: applicants.filter(app => app.fechaPostulacion >= weekAgo).length
      };

      return stats;
    } catch (error) {
      logger.error('Error getting applicant stats', error);
      return {
        total: 0,
        pendientes: 0,
        en_revision: 0,
        aprobados: 0,
        rechazados: 0,
        contratados: 0,
        nuevos_hoy: 0,
        nuevos_semana: 0
      };
    }
  }

  /**
   * Subir archivo de postulante
   */
  static async uploadApplicantFile(file: File, applicantId: string, fileType: string): Promise<string> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage no está disponible');
      }

      const fileExtension = file.name.split('.').pop();
      const fileName = `${fileType}_${applicantId}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `applicants/${applicantId}/${fileName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      logger.info('Applicant file uploaded successfully', { applicantId, fileType, fileName });
      return downloadURL;
    } catch (error) {
      logger.error('Error uploading applicant file', error);
      throw error;
    }
  }

  /**
   * Eliminar archivo de postulante
   */
  static async deleteApplicantFile(fileUrl: string): Promise<void> {
    try {
      if (!storage) {
        logger.warn('Firebase Storage not available for file deletion');
        return;
      }

      // Extraer el path del archivo desde la URL
      const url = new URL(fileUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (!pathMatch) {
        throw new Error('Could not extract file path from URL');
      }

      const filePath = decodeURIComponent(pathMatch[1]);
      const fileRef = ref(storage, filePath);

      await deleteObject(fileRef);

      logger.info('Applicant file deleted successfully', { fileUrl });
    } catch (error) {
      logger.error('Error deleting applicant file', error);
      throw error;
    }
  }

  /**
   * Convertir postulante a empleado
   */
  static async convertToEmployee(applicantId: string, convertedBy: string): Promise<string | null> {
    try {
      const applicant = await this.getApplicantById(applicantId);
      if (!applicant) {
        throw new Error('Applicant not found');
      }

      if (applicant.status !== 'aprobado') {
        throw new Error('Only approved applicants can be converted to employees');
      }

      // Crear datos básicos del empleado desde el postulante
      const employeeData = {
        dni: applicant.dni,
        apellidoPaterno: applicant.apellidoPaterno,
        apellidoMaterno: applicant.apellidoMaterno,
        nombres: applicant.nombres,
        fechaNacimiento: applicant.fechaNacimiento,
        lugarNacimiento: applicant.lugarNacimiento,
        sexo: applicant.sexo,
        estadoCivil: applicant.estadoCivil,
        direccionActual: applicant.direccionActual,
        referenciaDireccion: applicant.referenciaDireccion,
        telefonoCelular: applicant.telefonoCelular,
        telefonoFijo: applicant.telefonoFijo || '',
        email: applicant.email,
        puesto: applicant.puestoInteres,
        fechaIngreso: new Date().toISOString().split('T')[0],
        regimenLaboral: 'Tiempo completo', // Valor por defecto
        numeroFotocheck: '', // Se asignará después
        afp: 'Por definir', // Se definirá después
        licenciaConducir: 'Sin licencia', // Valor por defecto
        categoriaLicencia: 'Sin licencia', // Valor por defecto
        banco: 'Por definir', // Se definirá después
        numeroCuenta: '',
        cci: '',
        factorRH: 'Por definir', // Se definirá después
        antecedentesPenales: false, // Se verificará después
        epp: {
          tallaCalzado: 'Por definir',
          tallaVestimenta: 'Por definir'
        },
        informacionAcademica: {
          gradoInstruccion: applicant.gradoInstruccion,
          nombreInstitucion: applicant.nombreInstitucion,
          tipoInstitucion: 'Por definir',
          carrera: applicant.carreraProfesional || 'Por definir',
          anoEgreso: applicant.anoEgreso
        },
        estudiosComplementarios: applicant.estudiosComplementarios || [],
        datosFamilia: {
          conyuge: {
            apellidosNombres: '',
            dni: '',
            fechaNacimiento: '',
            telefono: '',
            documentoVinculo: ''
          },
          tieneHijos: false
        },
        hijos: [],
        assignedProjects: [],
        isActive: true,
        creationStep: 1, // Iniciar proceso de creación
        draftData: applicant // Guardar datos originales del postulante
      };

      // Aquí se llamaría al servicio de empleados para crear el empleado
      // Por ahora, solo actualizamos el estado del postulante
      await this.updateApplicantStatus(applicantId, 'contratado', convertedBy, 'Convertido a empleado');

      // Actualizar el postulante con información de conversión
      await this.updateApplicant(applicantId, {
        convertidoAEmpleado: {
          empleadoId: 'pending', // Se actualizará cuando se cree el empleado
          fechaConversion: new Date().toISOString(),
          convertidoPor: convertedBy
        }
      });

      logger.info('Applicant converted to employee successfully', { applicantId, convertedBy });
      return 'pending'; // ID del empleado pendiente
    } catch (error) {
      logger.error('Error converting applicant to employee', error);
      throw error;
    }
  }

  /**
   * Obtener postulantes recientes (últimos 7 días)
   */
  static async getRecentApplicants(limitCount = 10): Promise<Applicant[]> {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      return await this.getAllApplicants({
        fechaDesde: weekAgo
      });
    } catch (error) {
      logger.error('Error getting recent applicants', error);
      return [];
    }
  }

  /**
   * Métodos privados para localStorage fallback
   */
  private static getFromLocalStorage(): Applicant[] {
    try {
      const data = localStorage.getItem('applicants-data');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Error reading applicants from localStorage', error);
      return [];
    }
  }

  private static saveToLocalStorage(applicants: Applicant[]): void {
    try {
      localStorage.setItem('applicants-data', JSON.stringify(applicants));
    } catch (error) {
      logger.error('Error saving applicants to localStorage', error);
    }
  }
}

export default ApplicantService;