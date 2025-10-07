import { ApplicantService } from '../applicantService';
import { Applicant } from '../../types/applicant';

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

describe('ApplicantService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getAllApplicants', () => {
    it('should return empty array when no data exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const applicants = await ApplicantService.getAllApplicants();

      expect(applicants).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('applicants-data');
    });

    it('should return applicants from localStorage when Firebase is unavailable', async () => {
      const mockApplicants: Applicant[] = [
        {
          id: '1',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          estadoCivil: 'Soltero',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          telefonoCelular: '987654321',
          email: 'juan@example.com',
          puestoInteres: 'Desarrollador',
          experienciaPrevia: '5 años de experiencia',
          disponibilidadInmediata: true,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test',
          anoEgreso: 2015,
          fuentePostulacion: 'web',
          status: 'pendiente',
          fechaPostulacion: '2023-01-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockApplicants));

      const applicants = await ApplicantService.getAllApplicants();

      expect(applicants).toEqual(mockApplicants);
      expect(applicants).toHaveLength(1);
      expect(applicants[0].nombres).toBe('Juan Carlos');
    });

    it('should filter applicants by status', async () => {
      const mockApplicants: Applicant[] = [
        {
          id: '1',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          estadoCivil: 'Soltero',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          telefonoCelular: '987654321',
          email: 'juan@example.com',
          puestoInteres: 'Desarrollador',
          experienciaPrevia: '5 años de experiencia',
          disponibilidadInmediata: true,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test',
          anoEgreso: 2015,
          fuentePostulacion: 'web',
          status: 'pendiente',
          fechaPostulacion: '2023-01-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          dni: '87654321',
          apellidoPaterno: 'Martínez',
          apellidoMaterno: 'Rodríguez',
          nombres: 'Ana María',
          fechaNacimiento: '1992-05-15',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'San Isidro'
          },
          sexo: 'Femenino',
          estadoCivil: 'Casada',
          direccionActual: 'Test Address 2',
          referenciaDireccion: 'Test Reference 2',
          telefonoCelular: '912345678',
          email: 'ana@example.com',
          puestoInteres: 'Diseñadora',
          experienciaPrevia: '3 años de experiencia',
          disponibilidadInmediata: false,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test 2',
          anoEgreso: 2018,
          fuentePostulacion: 'referido',
          status: 'aprobado',
          fechaPostulacion: '2023-02-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-02-01T00:00:00.000Z',
          createdAt: '2023-02-01T00:00:00.000Z',
          updatedAt: '2023-02-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockApplicants));

      const pendingApplicants = await ApplicantService.getAllApplicants({
        status: ['pendiente']
      });

      expect(pendingApplicants).toHaveLength(1);
      expect(pendingApplicants[0].status).toBe('pendiente');
      expect(pendingApplicants[0].nombres).toBe('Juan Carlos');
    });

    it('should filter applicants by search term', async () => {
      const mockApplicants: Applicant[] = [
        {
          id: '1',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          estadoCivil: 'Soltero',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          telefonoCelular: '987654321',
          email: 'juan@example.com',
          puestoInteres: 'Desarrollador',
          experienciaPrevia: '5 años de experiencia',
          disponibilidadInmediata: true,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test',
          anoEgreso: 2015,
          fuentePostulacion: 'web',
          status: 'pendiente',
          fechaPostulacion: '2023-01-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockApplicants));

      const results = await ApplicantService.getAllApplicants({
        searchTerm: 'juan'
      });

      expect(results).toHaveLength(1);
      expect(results[0].nombres).toBe('Juan Carlos');
    });
  });

  describe('createApplicant', () => {
    it('should create applicant with required fields', async () => {
      const applicantData: Omit<Applicant, 'id'> = {
        dni: '87654321',
        apellidoPaterno: 'Martínez',
        apellidoMaterno: 'Rodríguez',
        nombres: 'Ana María',
        fechaNacimiento: '1992-05-15',
        lugarNacimiento: {
          departamento: 'Lima',
          provincia: 'Lima',
          distrito: 'San Isidro'
        },
        sexo: 'Femenino',
        estadoCivil: 'Casada',
        direccionActual: 'Test Address 2',
        referenciaDireccion: 'Test Reference 2',
        telefonoCelular: '912345678',
        email: 'ana@example.com',
        puestoInteres: 'Diseñadora',
        experienciaPrevia: '3 años de experiencia',
        disponibilidadInmediata: false,
        gradoInstruccion: 'Universitario',
        nombreInstitucion: 'Universidad Test 2',
        anoEgreso: 2018,
        fuentePostulacion: 'referido',
        status: 'pendiente',
        fechaPostulacion: '2023-02-01T00:00:00.000Z',
        fechaUltimaActualizacion: '2023-02-01T00:00:00.000Z',
        createdAt: '2023-02-01T00:00:00.000Z',
        updatedAt: '2023-02-01T00:00:00.000Z'
      };

      localStorageMock.getItem.mockReturnValue('[]');

      const applicantId = await ApplicantService.createApplicant(applicantData);

      expect(applicantId).toBeDefined();
      expect(typeof applicantId).toBe('string');
      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Verify the applicant was saved with correct data
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].nombres).toBe('Ana María');
      expect(savedData[0].status).toBe('pendiente');
    });
  });

  describe('updateApplicantStatus', () => {
    it('should update applicant status correctly', async () => {
      const mockApplicants: Applicant[] = [
        {
          id: '1',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          estadoCivil: 'Soltero',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          telefonoCelular: '987654321',
          email: 'juan@example.com',
          puestoInteres: 'Desarrollador',
          experienciaPrevia: '5 años de experiencia',
          disponibilidadInmediata: true,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test',
          anoEgreso: 2015,
          fuentePostulacion: 'web',
          status: 'pendiente',
          fechaPostulacion: '2023-01-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockApplicants));

      await ApplicantService.updateApplicantStatus('1', 'en_revision', 'user123', 'Iniciando revisión');

      // Verify the update was called
      expect(localStorageMock.setItem).toHaveBeenCalled();

      const updatedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(updatedData[0].status).toBe('en_revision');
      expect(updatedData[0].actualizadoPor).toBe('user123');
      expect(updatedData[0].observaciones).toBe('Iniciando revisión');
    });
  });

  describe('getApplicantStats', () => {
    it('should calculate applicant statistics correctly', async () => {
      const mockApplicants: Applicant[] = [
        {
          id: '1',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          estadoCivil: 'Soltero',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          telefonoCelular: '987654321',
          email: 'juan@example.com',
          puestoInteres: 'Desarrollador',
          experienciaPrevia: '5 años de experiencia',
          disponibilidadInmediata: true,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test',
          anoEgreso: 2015,
          fuentePostulacion: 'web',
          status: 'pendiente',
          fechaPostulacion: '2023-01-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          dni: '87654321',
          apellidoPaterno: 'Martínez',
          apellidoMaterno: 'Rodríguez',
          nombres: 'Ana María',
          fechaNacimiento: '1992-05-15',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'San Isidro'
          },
          sexo: 'Femenino',
          estadoCivil: 'Casado',
          direccionActual: 'Test Address 2',
          referenciaDireccion: 'Test Reference 2',
          telefonoCelular: '912345678',
          email: 'ana@example.com',
          puestoInteres: 'Diseñadora',
          experienciaPrevia: '3 años de experiencia',
          disponibilidadInmediata: false,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test 2',
          anoEgreso: 2018,
          fuentePostulacion: 'referido',
          status: 'aprobado',
          fechaPostulacion: '2023-02-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-02-01T00:00:00.000Z',
          createdAt: '2023-02-01T00:00:00.000Z',
          updatedAt: '2023-02-01T00:00:00.000Z'
        },
        {
          id: '3',
          dni: '11111111',
          apellidoPaterno: 'Test',
          apellidoMaterno: 'User',
          nombres: 'Test',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Lima'
          },
          sexo: 'Masculino',
          estadoCivil: 'Soltero',
          direccionActual: 'Test Address 3',
          referenciaDireccion: 'Test Reference 3',
          telefonoCelular: '999999999',
          email: 'test@example.com',
          puestoInteres: 'Tester',
          experienciaPrevia: '2 años de experiencia',
          disponibilidadInmediata: true,
          gradoInstruccion: 'Técnico',
          nombreInstitucion: 'Instituto Test',
          anoEgreso: 2020,
          fuentePostulacion: 'feria_empleo',
          status: 'contratado',
          fechaPostulacion: '2023-03-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-03-01T00:00:00.000Z',
          createdAt: '2023-03-01T00:00:00.000Z',
          updatedAt: '2023-03-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockApplicants));

      const stats = await ApplicantService.getApplicantStats();

      expect(stats.total).toBe(3);
      expect(stats.pendientes).toBe(1);
      expect(stats.aprobados).toBe(1);
      expect(stats.contratados).toBe(1);
      expect(stats.rechazados).toBe(0);
      expect(stats.en_revision).toBe(0);
    });
  });

  describe('searchApplicants', () => {
    it('should return all applicants when no search term provided', async () => {
      const mockApplicants: Applicant[] = [
        {
          id: '1',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          estadoCivil: 'Soltero',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          telefonoCelular: '987654321',
          email: 'juan@example.com',
          puestoInteres: 'Desarrollador',
          experienciaPrevia: '5 años de experiencia',
          disponibilidadInmediata: true,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test',
          anoEgreso: 2015,
          fuentePostulacion: 'web',
          status: 'pendiente',
          fechaPostulacion: '2023-01-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockApplicants));

      const results = await ApplicantService.searchApplicants('');

      expect(results).toEqual(mockApplicants);
      expect(results).toHaveLength(1);
    });

    it('should filter applicants by name', async () => {
      const mockApplicants: Applicant[] = [
        {
          id: '1',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          estadoCivil: 'Soltero',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          telefonoCelular: '987654321',
          email: 'juan@example.com',
          puestoInteres: 'Desarrollador',
          experienciaPrevia: '5 años de experiencia',
          disponibilidadInmediata: true,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test',
          anoEgreso: 2015,
          fuentePostulacion: 'web',
          status: 'pendiente',
          fechaPostulacion: '2023-01-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          dni: '87654321',
          apellidoPaterno: 'Martínez',
          apellidoMaterno: 'Rodríguez',
          nombres: 'Ana María',
          fechaNacimiento: '1992-05-15',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'San Isidro'
          },
          sexo: 'Femenino',
          estadoCivil: 'Casada',
          direccionActual: 'Test Address 2',
          referenciaDireccion: 'Test Reference 2',
          telefonoCelular: '912345678',
          email: 'ana@example.com',
          puestoInteres: 'Diseñadora',
          experienciaPrevia: '3 años de experiencia',
          disponibilidadInmediata: false,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test 2',
          anoEgreso: 2018,
          fuentePostulacion: 'referido',
          status: 'aprobado',
          fechaPostulacion: '2023-02-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-02-01T00:00:00.000Z',
          createdAt: '2023-02-01T00:00:00.000Z',
          updatedAt: '2023-02-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockApplicants));

      const results = await ApplicantService.searchApplicants('juan');

      expect(results).toHaveLength(1);
      expect(results[0].nombres).toBe('Juan Carlos');
    });

    it('should filter applicants by DNI', async () => {
      const mockApplicants: Applicant[] = [
        {
          id: '1',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          estadoCivil: 'Soltero',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          telefonoCelular: '987654321',
          email: 'juan@example.com',
          puestoInteres: 'Desarrollador',
          experienciaPrevia: '5 años de experiencia',
          disponibilidadInmediata: true,
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test',
          anoEgreso: 2015,
          fuentePostulacion: 'web',
          status: 'pendiente',
          fechaPostulacion: '2023-01-01T00:00:00.000Z',
          fechaUltimaActualizacion: '2023-01-01T00:00:00.000Z',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockApplicants));

      const results = await ApplicantService.searchApplicants('12345678');

      expect(results).toHaveLength(1);
      expect(results[0].dni).toBe('12345678');
    });
  });
});