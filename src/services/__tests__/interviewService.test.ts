import { InterviewService } from '../interviewService';
import { Interview } from '../../types/interview';

// Mock Firebase
jest.mock('../../firebase', () => ({
  db: null, // Simulate no Firebase connection for testing
  storage: null
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('InterviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getAllInterviews', () => {
    it('should return empty array when no data exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const interviews = await InterviewService.getAllInterviews();

      expect(interviews).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('interviews-data');
    });

    it('should return interviews from localStorage when Firebase is unavailable', async () => {
      const mockInterviews: Interview[] = [
        {
          id: '1',
          applicantId: 'app1',
          applicantDNI: '12345678',
          applicantName: 'Juan Pérez',
          applicantEmail: 'juan@example.com',
          applicantPhone: '987654321',
          puestoInteres: 'Desarrollador',
          fechaEntrevista: '2023-12-01T10:00:00.000Z',
          tipoEntrevista: 'telefonica',
          modalidad: 'telefonica',
          entrevistadorPrincipal: 'María García',
          departamentoEntrevistador: 'RRHH',
          status: 'programada',
          duracionEstimada: 30,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-01T00:00:00.000Z',
          fechaActualizacion: '2023-11-01T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInterviews));

      const interviews = await InterviewService.getAllInterviews();

      expect(interviews).toEqual(mockInterviews);
      expect(interviews).toHaveLength(1);
      expect(interviews[0].applicantName).toBe('Juan Pérez');
    });

    it('should filter interviews by status', async () => {
      const mockInterviews: Interview[] = [
        {
          id: '1',
          applicantId: 'app1',
          applicantDNI: '12345678',
          applicantName: 'Juan Pérez',
          applicantEmail: 'juan@example.com',
          applicantPhone: '987654321',
          puestoInteres: 'Desarrollador',
          fechaEntrevista: '2023-12-01T10:00:00.000Z',
          tipoEntrevista: 'telefonica',
          modalidad: 'telefonica',
          entrevistadorPrincipal: 'María García',
          departamentoEntrevistador: 'RRHH',
          status: 'programada',
          duracionEstimada: 30,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-01T00:00:00.000Z',
          fechaActualizacion: '2023-11-01T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        },
        {
          id: '2',
          applicantId: 'app2',
          applicantDNI: '87654321',
          applicantName: 'Ana López',
          applicantEmail: 'ana@example.com',
          applicantPhone: '912345678',
          puestoInteres: 'Diseñadora',
          fechaEntrevista: '2023-12-02T14:00:00.000Z',
          tipoEntrevista: 'virtual',
          modalidad: 'virtual',
          entrevistadorPrincipal: 'Carlos Rodríguez',
          departamentoEntrevistador: 'TI',
          status: 'completada',
          duracionEstimada: 45,
          resultado: 'positivo',
          calificacionGeneral: 8,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-02T00:00:00.000Z',
          fechaActualizacion: '2023-11-02T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInterviews));

      const scheduledInterviews = await InterviewService.getAllInterviews({
        status: ['programada']
      });

      expect(scheduledInterviews).toHaveLength(1);
      expect(scheduledInterviews[0].status).toBe('programada');
      expect(scheduledInterviews[0].applicantName).toBe('Juan Pérez');
    });

    it('should filter interviews by search term', async () => {
      const mockInterviews: Interview[] = [
        {
          id: '1',
          applicantId: 'app1',
          applicantDNI: '12345678',
          applicantName: 'Juan Pérez',
          applicantEmail: 'juan@example.com',
          applicantPhone: '987654321',
          puestoInteres: 'Desarrollador',
          fechaEntrevista: '2023-12-01T10:00:00.000Z',
          tipoEntrevista: 'telefonica',
          modalidad: 'telefonica',
          entrevistadorPrincipal: 'María García',
          departamentoEntrevistador: 'RRHH',
          status: 'programada',
          duracionEstimada: 30,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-01T00:00:00.000Z',
          fechaActualizacion: '2023-11-01T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInterviews));

      const results = await InterviewService.getAllInterviews({
        searchTerm: 'juan'
      });

      expect(results).toHaveLength(1);
      expect(results[0].applicantName).toBe('Juan Pérez');
    });
  });

  describe('createInterview', () => {
    it('should create interview with required fields', async () => {
      const interviewData: Omit<Interview, 'id'> = {
        applicantId: 'app1',
        applicantDNI: '12345678',
        applicantName: 'Juan Pérez',
        applicantEmail: 'juan@example.com',
        applicantPhone: '987654321',
        puestoInteres: 'Desarrollador',
        fechaEntrevista: '2023-12-01T10:00:00.000Z',
        tipoEntrevista: 'telefonica',
        modalidad: 'telefonica',
        entrevistadorPrincipal: 'María García',
        departamentoEntrevistador: 'RRHH',
        status: 'programada',
        duracionEstimada: 30,
        creadaPor: 'user1',
        fechaCreacion: '2023-11-01T00:00:00.000Z',
        fechaActualizacion: '2023-11-01T00:00:00.000Z',
        notificacionesEnviadas: [],
        archivosAdjuntos: []
      };

      localStorageMock.getItem.mockReturnValue('[]');

      const interviewId = await InterviewService.createInterview(interviewData);

      expect(interviewId).toBeDefined();
      expect(typeof interviewId).toBe('string');
      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Verify the interview was saved with correct data
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].applicantName).toBe('Juan Pérez');
      expect(savedData[0].status).toBe('programada');
    });
  });

  describe('updateInterviewStatus', () => {
    it('should update interview status correctly', async () => {
      const mockInterviews: Interview[] = [
        {
          id: '1',
          applicantId: 'app1',
          applicantDNI: '12345678',
          applicantName: 'Juan Pérez',
          applicantEmail: 'juan@example.com',
          applicantPhone: '987654321',
          puestoInteres: 'Desarrollador',
          fechaEntrevista: '2023-12-01T10:00:00.000Z',
          tipoEntrevista: 'telefonica',
          modalidad: 'telefonica',
          entrevistadorPrincipal: 'María García',
          departamentoEntrevistador: 'RRHH',
          status: 'programada',
          duracionEstimada: 30,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-01T00:00:00.000Z',
          fechaActualizacion: '2023-11-01T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInterviews));

      await InterviewService.updateInterviewStatus('1', 'completada', 'positivo', 'user123');

      // Verify the update was called
      expect(localStorageMock.setItem).toHaveBeenCalled();

      const updatedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(updatedData[0].status).toBe('completada');
      expect(updatedData[0].resultado).toBe('positivo');
    });
  });

  describe('getInterviewStats', () => {
    it('should calculate interview statistics correctly', async () => {
      const mockInterviews: Interview[] = [
        {
          id: '1',
          applicantId: 'app1',
          applicantDNI: '12345678',
          applicantName: 'Juan Pérez',
          applicantEmail: 'juan@example.com',
          applicantPhone: '987654321',
          puestoInteres: 'Desarrollador',
          fechaEntrevista: '2023-12-01T10:00:00.000Z',
          tipoEntrevista: 'telefonica',
          modalidad: 'telefonica',
          entrevistadorPrincipal: 'María García',
          departamentoEntrevistador: 'RRHH',
          status: 'programada',
          duracionEstimada: 30,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-01T00:00:00.000Z',
          fechaActualizacion: '2023-11-01T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        },
        {
          id: '2',
          applicantId: 'app2',
          applicantDNI: '87654321',
          applicantName: 'Ana López',
          applicantEmail: 'ana@example.com',
          applicantPhone: '912345678',
          puestoInteres: 'Diseñadora',
          fechaEntrevista: '2023-12-02T14:00:00.000Z',
          tipoEntrevista: 'virtual',
          modalidad: 'virtual',
          entrevistadorPrincipal: 'Carlos Rodríguez',
          departamentoEntrevistador: 'TI',
          status: 'completada',
          duracionEstimada: 45,
          resultado: 'positivo',
          calificacionGeneral: 8,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-02T00:00:00.000Z',
          fechaActualizacion: '2023-11-02T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        },
        {
          id: '3',
          applicantId: 'app3',
          applicantDNI: '11111111',
          applicantName: 'Carlos Test',
          applicantEmail: 'carlos@example.com',
          applicantPhone: '999999999',
          puestoInteres: 'Tester',
          fechaEntrevista: '2023-12-03T09:00:00.000Z',
          tipoEntrevista: 'presencial',
          modalidad: 'presencial',
          entrevistadorPrincipal: 'Ana Martínez',
          departamentoEntrevistador: 'QA',
          status: 'completada',
          duracionEstimada: 60,
          resultado: 'negativo',
          calificacionGeneral: 5,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-03T00:00:00.000Z',
          fechaActualizacion: '2023-11-03T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInterviews));

      const stats = await InterviewService.getInterviewStats();

      expect(stats.total).toBe(3);
      expect(stats.programadas).toBe(1);
      expect(stats.completadas).toBe(2);
      expect(stats.positivas).toBe(1);
      expect(stats.negativas).toBe(1);
      expect(stats.promedio_calificacion).toBe(6.5); // (8 + 5) / 2
    });
  });

  describe('searchInterviews', () => {
    it('should return all interviews when no search term provided', async () => {
      const mockInterviews: Interview[] = [
        {
          id: '1',
          applicantId: 'app1',
          applicantDNI: '12345678',
          applicantName: 'Juan Pérez',
          applicantEmail: 'juan@example.com',
          applicantPhone: '987654321',
          puestoInteres: 'Desarrollador',
          fechaEntrevista: '2023-12-01T10:00:00.000Z',
          tipoEntrevista: 'telefonica',
          modalidad: 'telefonica',
          entrevistadorPrincipal: 'María García',
          departamentoEntrevistador: 'RRHH',
          status: 'programada',
          duracionEstimada: 30,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-01T00:00:00.000Z',
          fechaActualizacion: '2023-11-01T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInterviews));

      const results = await InterviewService.searchInterviews('');

      expect(results).toEqual(mockInterviews);
      expect(results).toHaveLength(1);
    });

    it('should filter interviews by applicant name', async () => {
      const mockInterviews: Interview[] = [
        {
          id: '1',
          applicantId: 'app1',
          applicantDNI: '12345678',
          applicantName: 'Juan Pérez',
          applicantEmail: 'juan@example.com',
          applicantPhone: '987654321',
          puestoInteres: 'Desarrollador',
          fechaEntrevista: '2023-12-01T10:00:00.000Z',
          tipoEntrevista: 'telefonica',
          modalidad: 'telefonica',
          entrevistadorPrincipal: 'María García',
          departamentoEntrevistador: 'RRHH',
          status: 'programada',
          duracionEstimada: 30,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-01T00:00:00.000Z',
          fechaActualizacion: '2023-11-01T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        },
        {
          id: '2',
          applicantId: 'app2',
          applicantDNI: '87654321',
          applicantName: 'Ana López',
          applicantEmail: 'ana@example.com',
          applicantPhone: '912345678',
          puestoInteres: 'Diseñadora',
          fechaEntrevista: '2023-12-02T14:00:00.000Z',
          tipoEntrevista: 'virtual',
          modalidad: 'virtual',
          entrevistadorPrincipal: 'Carlos Rodríguez',
          departamentoEntrevistador: 'TI',
          status: 'completada',
          duracionEstimada: 45,
          resultado: 'positivo',
          calificacionGeneral: 8,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-02T00:00:00.000Z',
          fechaActualizacion: '2023-11-02T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInterviews));

      const results = await InterviewService.searchInterviews('juan');

      expect(results).toHaveLength(1);
      expect(results[0].applicantName).toBe('Juan Pérez');
    });

    it('should filter interviews by DNI', async () => {
      const mockInterviews: Interview[] = [
        {
          id: '1',
          applicantId: 'app1',
          applicantDNI: '12345678',
          applicantName: 'Juan Pérez',
          applicantEmail: 'juan@example.com',
          applicantPhone: '987654321',
          puestoInteres: 'Desarrollador',
          fechaEntrevista: '2023-12-01T10:00:00.000Z',
          tipoEntrevista: 'telefonica',
          modalidad: 'telefonica',
          entrevistadorPrincipal: 'María García',
          departamentoEntrevistador: 'RRHH',
          status: 'programada',
          duracionEstimada: 30,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-01T00:00:00.000Z',
          fechaActualizacion: '2023-11-01T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInterviews));

      const results = await InterviewService.searchInterviews('12345678');

      expect(results).toHaveLength(1);
      expect(results[0].applicantDNI).toBe('12345678');
    });
  });

  describe('getUpcomingInterviews', () => {
    it('should return upcoming interviews within 7 days', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

      const mockInterviews: Interview[] = [
        {
          id: '1',
          applicantId: 'app1',
          applicantDNI: '12345678',
          applicantName: 'Juan Pérez',
          applicantEmail: 'juan@example.com',
          applicantPhone: '987654321',
          puestoInteres: 'Desarrollador',
          fechaEntrevista: tomorrow.toISOString(),
          tipoEntrevista: 'telefonica',
          modalidad: 'telefonica',
          entrevistadorPrincipal: 'María García',
          departamentoEntrevistador: 'RRHH',
          status: 'programada',
          duracionEstimada: 30,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-01T00:00:00.000Z',
          fechaActualizacion: '2023-11-01T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        },
        {
          id: '2',
          applicantId: 'app2',
          applicantDNI: '87654321',
          applicantName: 'Ana López',
          applicantEmail: 'ana@example.com',
          applicantPhone: '912345678',
          puestoInteres: 'Diseñadora',
          fechaEntrevista: nextWeek.toISOString(),
          tipoEntrevista: 'virtual',
          modalidad: 'virtual',
          entrevistadorPrincipal: 'Carlos Rodríguez',
          departamentoEntrevistador: 'TI',
          status: 'programada',
          duracionEstimada: 45,
          creadaPor: 'user1',
          fechaCreacion: '2023-11-02T00:00:00.000Z',
          fechaActualizacion: '2023-11-02T00:00:00.000Z',
          notificacionesEnviadas: [],
          archivosAdjuntos: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockInterviews));

      const upcomingInterviews = await InterviewService.getUpcomingInterviews();

      expect(upcomingInterviews).toHaveLength(1);
      expect(upcomingInterviews[0].applicantName).toBe('Juan Pérez');
    });
  });
});