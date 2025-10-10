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
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Interview,
  InterviewFilters,
  InterviewStats,
  InterviewStatus,
  InterviewResult,
  InterviewTemplate
} from '../types/interview';
import logger from '../utils/logger';

const COLLECTION_NAME = 'interviews';
const TEMPLATES_COLLECTION = 'interviewTemplates';

export class InterviewService {
  /**
   * Obtener todas las entrevistas con filtros opcionales
   */
  static async getAllInterviews(filters?: InterviewFilters): Promise<Interview[]> {
    try {
      if (!db) {
        logger.warn('Firebase not available, using localStorage fallback');
        return this.getFromLocalStorage();
      }

      // Obtener todas las entrevistas primero
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      let interviews = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Interview));

      // Aplicar filtros del lado del cliente
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          const statusSet = new Set(filters.status);
          interviews = interviews.filter(interview => statusSet.has(interview.status));
        }

        if (filters.tipoEntrevista && filters.tipoEntrevista.length > 0) {
          const tipoSet = new Set(filters.tipoEntrevista);
          interviews = interviews.filter(interview => tipoSet.has(interview.tipoEntrevista));
        }

        if (filters.fechaDesde) {
          interviews = interviews.filter(interview => interview.fechaEntrevista >= filters.fechaDesde!);
        }

        if (filters.fechaHasta) {
          interviews = interviews.filter(interview => interview.fechaEntrevista <= filters.fechaHasta!);
        }

        if (filters.entrevistador) {
          interviews = interviews.filter(interview =>
            interview.entrevistadorPrincipal.toLowerCase().includes(filters.entrevistador!.toLowerCase()) ||
            (interview.entrevistadoresAdicionales &&
             interview.entrevistadoresAdicionales.some(e => e.toLowerCase().includes(filters.entrevistador!.toLowerCase())))
          );
        }

        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          interviews = interviews.filter(interview =>
            interview.applicantName.toLowerCase().includes(term) ||
            interview.applicantDNI.includes(term) ||
            interview.puestoInteres.toLowerCase().includes(term)
          );
        }

        if (filters.applicantId) {
          interviews = interviews.filter(interview => interview.applicantId === filters.applicantId);
        }
      }

      // Ordenar por fecha de entrevista (más recientes primero)
      interviews.sort((a, b) => new Date(b.fechaEntrevista).getTime() - new Date(a.fechaEntrevista).getTime());

      // Sincronizar con localStorage para respaldo
      this.saveToLocalStorage(interviews);

      return interviews;
    } catch (error) {
      logger.error('Error getting interviews from Firestore', error);
      // Fallback to localStorage
      return this.getFromLocalStorage();
    }
  }

  /**
   * Obtener entrevista por ID
   */
  static async getInterviewById(id: string): Promise<Interview | null> {
    try {
      if (!db) {
        return this.getFromLocalStorage().find(interview => interview.id === id) || null;
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Interview;
      }

      return null;
    } catch (error) {
      logger.error('Error getting interview by ID', error);
      return this.getFromLocalStorage().find(interview => interview.id === id) || null;
    }
  }

  /**
   * Crear nueva entrevista
   */
  static async createInterview(interviewData: Omit<Interview, 'id'>): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase no está disponible para crear entrevistas');
      }

      const now = new Date().toISOString();
      const finalInterviewData = {
        ...interviewData,
        status: 'programada' as InterviewStatus,
        fechaCreacion: now,
        fechaActualizacion: now
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), finalInterviewData);

      // Sincronizar con localStorage
      const newInterview = { ...finalInterviewData, id: docRef.id };
      const existingData = this.getFromLocalStorage();
      existingData.push(newInterview);
      this.saveToLocalStorage(existingData);

      logger.info('Interview created successfully', { id: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating interview', error);
      throw error;
    }
  }

  /**
   * Actualizar entrevista
   */
  static async updateInterview(id: string, interviewData: Partial<Interview>): Promise<void> {
    try {
      if (!db) {
        // Fallback to localStorage
        const localData = this.getFromLocalStorage();
        const index = localData.findIndex(interview => interview.id === id);
        if (index !== -1) {
          localData[index] = {
            ...localData[index],
            ...interviewData,
            fechaActualizacion: new Date().toISOString(),
            actualizadaPor: interviewData.actualizadaPor
          };
          this.saveToLocalStorage(localData);
        }
        return;
      }

      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...interviewData,
        fechaActualizacion: new Date().toISOString()
      });

      // Actualizar localStorage también
      const localData = this.getFromLocalStorage();
      const index = localData.findIndex(interview => interview.id === id);
      if (index !== -1) {
        localData[index] = {
          ...localData[index],
          ...interviewData,
          fechaActualizacion: new Date().toISOString()
        };
        this.saveToLocalStorage(localData);
      }

      logger.info('Interview updated successfully', { id });
    } catch (error) {
      logger.error('Error updating interview', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de la entrevista
   */
  static async updateInterviewStatus(
    id: string,
    status: InterviewStatus,
    resultado?: InterviewResult,
    actualizadaPor?: string
  ): Promise<void> {
    try {
      const updateData: Partial<Interview> = {
        status,
        fechaActualizacion: new Date().toISOString(),
        actualizadaPor
      };

      if (resultado) {
        updateData.resultado = resultado;
      }

      // Si se completa la entrevista, registrar hora de fin
      if (status === 'completada') {
        updateData.horaFin = new Date().toISOString();
      }

      await this.updateInterview(id, updateData);

      logger.info('Interview status updated', { id, status, resultado });
    } catch (error) {
      logger.error('Error updating interview status', error);
      throw error;
    }
  }

  /**
   * Buscar entrevistas
   */
  static async searchInterviews(searchTerm: string): Promise<Interview[]> {
    try {
      const interviews = await this.getAllInterviews();

      if (!searchTerm.trim()) return interviews;

      const term = searchTerm.toLowerCase().trim();
      return interviews.filter(interview =>
        interview.applicantName?.toLowerCase().includes(term) ||
        interview.applicantDNI?.includes(term) ||
        interview.puestoInteres?.toLowerCase().includes(term) ||
        interview.entrevistadorPrincipal?.toLowerCase().includes(term)
      );
    } catch (error) {
      logger.error('Error searching interviews', error);
      return [];
    }
  }

  /**
   * Obtener entrevistas por postulante
   */
  static async getInterviewsByApplicant(applicantId: string): Promise<Interview[]> {
    try {
      return await this.getAllInterviews({ applicantId });
    } catch (error) {
      logger.error('Error getting interviews by applicant', error);
      return [];
    }
  }

  /**
   * Obtener entrevistas por entrevistador
   */
  static async getInterviewsByInterviewer(entrevistador: string): Promise<Interview[]> {
    try {
      return await this.getAllInterviews({ entrevistador });
    } catch (error) {
      logger.error('Error getting interviews by interviewer', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de entrevistas
   */
  static async getInterviewStats(): Promise<InterviewStats> {
    try {
      const interviews = await this.getAllInterviews();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats: InterviewStats = {
        total: interviews.length,
        programadas: interviews.filter(i => i.status === 'programada').length,
        completadas: interviews.filter(i => i.status === 'completada').length,
        canceladas: interviews.filter(i => i.status === 'cancelada').length,
        positivas: interviews.filter(i => i.resultado === 'positivo').length,
        negativas: interviews.filter(i => i.resultado === 'negativo').length,
        pendientes: interviews.filter(i => i.resultado === 'pendiente').length,
        esta_semana: interviews.filter(i => new Date(i.fechaEntrevista) >= weekAgo).length,
        este_mes: interviews.filter(i => new Date(i.fechaEntrevista) >= monthAgo).length,
        promedio_calificacion: this.calculateAverageRating(interviews),
        tiempo_promedio: this.calculateAverageDuration(interviews)
      };

      return stats;
    } catch (error) {
      logger.error('Error getting interview stats', error);
      return {
        total: 0,
        programadas: 0,
        completadas: 0,
        canceladas: 0,
        positivas: 0,
        negativas: 0,
        pendientes: 0,
        esta_semana: 0,
        este_mes: 0,
        promedio_calificacion: 0,
        tiempo_promedio: 0
      };
    }
  }

  /**
   * Obtener entrevistas próximas (próximos 7 días)
   */
  static async getUpcomingInterviews(limitCount = 20): Promise<Interview[]> {
    try {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const interviews = await this.getAllInterviews({
        fechaDesde: now.toISOString(),
        fechaHasta: weekFromNow.toISOString(),
        status: ['programada', 'confirmada']
      });

      return interviews.slice(0, limitCount);
    } catch (error) {
      logger.error('Error getting upcoming interviews', error);
      return [];
    }
  }

  /**
   * Cancelar entrevista
   */
  static async cancelInterview(id: string, motivo: string, canceladaPor: string): Promise<void> {
    try {
      await this.updateInterviewStatus(id, 'cancelada', undefined, canceladaPor);

      // Agregar nota de cancelación
      const interview = await this.getInterviewById(id);
      if (interview) {
        await this.updateInterview(id, {
          observaciones: `${interview.observaciones || ''}\n\nCancelada: ${motivo}`.trim()
        });
      }

      logger.info('Interview cancelled successfully', { id, motivo });
    } catch (error) {
      logger.error('Error cancelling interview', error);
      throw error;
    }
  }

  /**
   * Reprogramar entrevista
   */
  static async rescheduleInterview(
    id: string,
    nuevaFecha: string,
    motivo: string,
    reprogramadaPor: string
  ): Promise<void> {
    try {
      await this.updateInterview(id, {
        fechaEntrevista: nuevaFecha,
        status: 'reprogramada',
        observaciones: `Reprogramada: ${motivo}`,
        actualizadaPor: reprogramadaPor,
        fechaActualizacion: new Date().toISOString()
      });

      logger.info('Interview rescheduled successfully', { id, nuevaFecha });
    } catch (error) {
      logger.error('Error rescheduling interview', error);
      throw error;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private static calculateAverageRating(interviews: Interview[]): number {
    const completedInterviews = interviews.filter(i => i.status === 'completada' && i.calificacionGeneral);
    if (completedInterviews.length === 0) return 0;

    const sum = completedInterviews.reduce((acc, interview) => acc + (interview.calificacionGeneral || 0), 0);
    return Math.round((sum / completedInterviews.length) * 100) / 100;
  }

  private static calculateAverageDuration(interviews: Interview[]): number {
    const completedInterviews = interviews.filter(i => i.status === 'completada' && i.duracionReal);
    if (completedInterviews.length === 0) return 0;

    const sum = completedInterviews.reduce((acc, interview) => acc + (interview.duracionReal || 0), 0);
    return Math.round(sum / completedInterviews.length);
  }

  /**
   * Métodos privados para localStorage fallback
   */
  private static getFromLocalStorage(): Interview[] {
    try {
      const data = localStorage.getItem('interviews-data');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Error reading interviews from localStorage', error);
      return [];
    }
  }

  private static saveToLocalStorage(interviews: Interview[]): void {
    try {
      localStorage.setItem('interviews-data', JSON.stringify(interviews));
    } catch (error) {
      logger.error('Error saving interviews to localStorage', error);
    }
  }

  /**
   * Gestión de plantillas de entrevistas
   */
  static async createInterviewTemplate(template: Omit<InterviewTemplate, 'id'>): Promise<string> {
    try {
      if (!db) {
        throw new Error('Firebase no está disponible para crear plantillas');
      }

      const now = new Date().toISOString();
      const finalTemplate = {
        ...template,
        activo: true,
        fechaCreacion: now
      };

      const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), finalTemplate);

      logger.info('Interview template created successfully', { id: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating interview template', error);
      throw error;
    }
  }

  static async getInterviewTemplates(): Promise<InterviewTemplate[]> {
    try {
      if (!db) {
        return [];
      }

      const querySnapshot = await getDocs(
        query(collection(db, TEMPLATES_COLLECTION), where('activo', '==', true))
      );

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InterviewTemplate));
    } catch (error) {
      logger.error('Error getting interview templates', error);
      return [];
    }
  }
}

export default InterviewService;