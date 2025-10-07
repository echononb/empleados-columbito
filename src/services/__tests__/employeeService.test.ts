import { EmployeeService, Employee } from '../employeeService';

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

describe('EmployeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getAllEmployees', () => {
    it('should return empty array when no data exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const employees = await EmployeeService.getAllEmployees();

      expect(employees).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('empleados-data');
    });

    it('should return employees from localStorage when Firebase is unavailable', async () => {
      const mockEmployees: Employee[] = [
        {
          id: '1',
          employeeCode: 'EMP001',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          puesto: 'Developer',
          fechaIngreso: '2023-01-01',
          regimenLaboral: 'Tiempo completo',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          numeroFotocheck: '12345',
          telefonoCelular: '987654321',
          telefonoFijo: '012345678',
          estadoCivil: 'Soltero',
          afp: 'AFP1',
          email: 'juan@example.com',
          licenciaConducir: 'B-I',
          categoriaLicencia: 'B-I',
          banco: 'Banco1',
          numeroCuenta: '123456789',
          cci: '12345678901234567890',
          factorRH: 'O+',
          antecedentesPenales: false,
          epp: {
            tallaCalzado: '42',
            tallaVestimenta: 'M'
          },
          informacionAcademica: {
            gradoInstruccion: 'Universitario',
            nombreInstitucion: 'Universidad Test',
            tipoInstitucion: 'Universidad',
            carrera: 'Ingeniería de Sistemas',
            anoEgreso: 2015
          },
          estudiosComplementarios: [],
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
          creationStep: 6,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEmployees));

      const employees = await EmployeeService.getAllEmployees();

      expect(employees).toEqual(mockEmployees);
      expect(employees).toHaveLength(1);
      expect(employees[0].nombres).toBe('Juan Carlos');
    });
  });

  describe('createEmployee', () => {
    it('should create employee with auto-generated code when not provided', async () => {
      const employeeData: Omit<Employee, 'id'> = {
        employeeCode: '',
        dni: '87654321',
        apellidoPaterno: 'Martínez',
        apellidoMaterno: 'Rodríguez',
        nombres: 'Ana María',
        direccionActual: 'Test Address 2',
        referenciaDireccion: 'Test Reference 2',
        puesto: 'Designer',
        fechaIngreso: '2023-02-01',
        regimenLaboral: 'Tiempo completo',
        fechaNacimiento: '1992-05-15',
        lugarNacimiento: {
          departamento: 'Lima',
          provincia: 'Lima',
          distrito: 'San Isidro'
        },
        sexo: 'Femenino',
        numeroFotocheck: '54321',
        telefonoCelular: '912345678',
        telefonoFijo: '076543210',
        estadoCivil: 'Casada',
        afp: 'AFP2',
        email: 'ana@example.com',
        licenciaConducir: 'B-II',
        categoriaLicencia: 'B-II',
        banco: 'Banco2',
        numeroCuenta: '987654321',
        cci: '98765432109876543210',
        factorRH: 'A+',
        antecedentesPenales: false,
        epp: {
          tallaCalzado: '38',
          tallaVestimenta: 'S'
        },
        informacionAcademica: {
          gradoInstruccion: 'Universitario',
          nombreInstitucion: 'Universidad Test 2',
          tipoInstitucion: 'Universidad',
          carrera: 'Diseño Gráfico',
          anoEgreso: 2018
        },
        estudiosComplementarios: [],
        datosFamilia: {
          conyuge: {
            apellidosNombres: 'Test Spouse',
            dni: '11111111',
            fechaNacimiento: '1990-01-01',
            telefono: '999999999',
            documentoVinculo: 'DNI'
          },
          tieneHijos: true
        },
        hijos: [
          {
            dni: '22222222',
            apellidos: 'Martínez Spouse',
            nombres: 'Hijo Test'
          }
        ],
        assignedProjects: [],
        isActive: true,
        creationStep: 6,
        createdAt: '2023-02-01T00:00:00.000Z',
        updatedAt: '2023-02-01T00:00:00.000Z'
      };

      localStorageMock.getItem.mockReturnValue('[]');

      const employeeId = await EmployeeService.createEmployee(employeeData);

      expect(employeeId).toBeDefined();
      expect(typeof employeeId).toBe('string');
      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Verify the employee was saved with auto-generated code
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].employeeCode).toMatch(/^EMP\d{4}$/);
      expect(savedData[0].nombres).toBe('Ana María');
    });

    it('should create employee with provided code', async () => {
      const employeeData: Omit<Employee, 'id'> = {
        employeeCode: 'CUSTOM001',
        dni: '11111111',
        apellidoPaterno: 'Test',
        apellidoMaterno: 'User',
        nombres: 'Test',
        direccionActual: 'Test Address',
        referenciaDireccion: 'Test Reference',
        puesto: 'Tester',
        fechaIngreso: '2023-03-01',
        regimenLaboral: 'Tiempo completo',
        fechaNacimiento: '1990-01-01',
        lugarNacimiento: {
          departamento: 'Lima',
          provincia: 'Lima',
          distrito: 'Lima'
        },
        sexo: 'Masculino',
        numeroFotocheck: '99999',
        telefonoCelular: '999999999',
        telefonoFijo: '999999999',
        estadoCivil: 'Soltero',
        afp: 'AFP1',
        email: 'test@example.com',
        licenciaConducir: 'B-I',
        categoriaLicencia: 'B-I',
        banco: 'Banco1',
        numeroCuenta: '111111111',
        cci: '11111111111111111111',
        factorRH: 'O+',
        antecedentesPenales: false,
        epp: {
          tallaCalzado: '42',
          tallaVestimenta: 'M'
        },
        informacionAcademica: {
          gradoInstruccion: 'Técnico',
          nombreInstitucion: 'Instituto Test',
          tipoInstitucion: 'Instituto',
          carrera: 'Testing',
          anoEgreso: 2020
        },
        estudiosComplementarios: [],
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
        creationStep: 6,
        createdAt: '2023-03-01T00:00:00.000Z',
        updatedAt: '2023-03-01T00:00:00.000Z'
      };

      localStorageMock.getItem.mockReturnValue('[]');

      const employeeId = await EmployeeService.createEmployee(employeeData);

      expect(employeeId).toBeDefined();

      // Verify the employee was saved with provided code
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].employeeCode).toBe('CUSTOM001');
    });
  });

  describe('searchEmployees', () => {
    it('should return all employees when no search term provided', async () => {
      const mockEmployees: Employee[] = [
        {
          id: '1',
          employeeCode: 'EMP001',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          puesto: 'Developer',
          fechaIngreso: '2023-01-01',
          regimenLaboral: 'Tiempo completo',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          numeroFotocheck: '12345',
          telefonoCelular: '987654321',
          telefonoFijo: '012345678',
          estadoCivil: 'Soltero',
          afp: 'AFP1',
          email: 'juan@example.com',
          licenciaConducir: 'B-I',
          categoriaLicencia: 'B-I',
          banco: 'Banco1',
          numeroCuenta: '123456789',
          cci: '12345678901234567890',
          factorRH: 'O+',
          antecedentesPenales: false,
          epp: {
            tallaCalzado: '42',
            tallaVestimenta: 'M'
          },
          informacionAcademica: {
            gradoInstruccion: 'Universitario',
            nombreInstitucion: 'Universidad Test',
            tipoInstitucion: 'Universidad',
            carrera: 'Ingeniería de Sistemas',
            anoEgreso: 2015
          },
          estudiosComplementarios: [],
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
          creationStep: 6,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEmployees));

      const results = await EmployeeService.searchEmployees('');

      expect(results).toEqual(mockEmployees);
      expect(results).toHaveLength(1);
    });

    it('should filter employees by name', async () => {
      const mockEmployees: Employee[] = [
        {
          id: '1',
          employeeCode: 'EMP001',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          puesto: 'Developer',
          fechaIngreso: '2023-01-01',
          regimenLaboral: 'Tiempo completo',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          numeroFotocheck: '12345',
          telefonoCelular: '987654321',
          telefonoFijo: '012345678',
          estadoCivil: 'Soltero',
          afp: 'AFP1',
          email: 'juan@example.com',
          licenciaConducir: 'B-I',
          categoriaLicencia: 'B-I',
          banco: 'Banco1',
          numeroCuenta: '123456789',
          cci: '12345678901234567890',
          factorRH: 'O+',
          antecedentesPenales: false,
          epp: {
            tallaCalzado: '42',
            tallaVestimenta: 'M'
          },
          informacionAcademica: {
            gradoInstruccion: 'Universitario',
            nombreInstitucion: 'Universidad Test',
            tipoInstitucion: 'Universidad',
            carrera: 'Ingeniería de Sistemas',
            anoEgreso: 2015
          },
          estudiosComplementarios: [],
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
          creationStep: 6,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          employeeCode: 'EMP002',
          dni: '87654321',
          apellidoPaterno: 'Martínez',
          apellidoMaterno: 'Rodríguez',
          nombres: 'Ana María',
          direccionActual: 'Test Address 2',
          referenciaDireccion: 'Test Reference 2',
          puesto: 'Designer',
          fechaIngreso: '2023-02-01',
          regimenLaboral: 'Tiempo completo',
          fechaNacimiento: '1992-05-15',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'San Isidro'
          },
          sexo: 'Femenino',
          numeroFotocheck: '54321',
          telefonoCelular: '912345678',
          telefonoFijo: '076543210',
          estadoCivil: 'Casada',
          afp: 'AFP2',
          email: 'ana@example.com',
          licenciaConducir: 'B-II',
          categoriaLicencia: 'B-II',
          banco: 'Banco2',
          numeroCuenta: '987654321',
          cci: '98765432109876543210',
          factorRH: 'A+',
          antecedentesPenales: false,
          epp: {
            tallaCalzado: '38',
            tallaVestimenta: 'S'
          },
          informacionAcademica: {
            gradoInstruccion: 'Universitario',
            nombreInstitucion: 'Universidad Test 2',
            tipoInstitucion: 'Universidad',
            carrera: 'Diseño Gráfico',
            anoEgreso: 2018
          },
          estudiosComplementarios: [],
          datosFamilia: {
            conyuge: {
              apellidosNombres: 'Test Spouse',
              dni: '11111111',
              fechaNacimiento: '1990-01-01',
              telefono: '999999999',
              documentoVinculo: 'DNI'
            },
            tieneHijos: true
          },
          hijos: [
            {
              dni: '22222222',
              apellidos: 'Martínez Spouse',
              nombres: 'Hijo Test'
            }
          ],
          assignedProjects: [],
          isActive: true,
          creationStep: 6,
          createdAt: '2023-02-01T00:00:00.000Z',
          updatedAt: '2023-02-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEmployees));

      const results = await EmployeeService.searchEmployees('juan');

      expect(results).toHaveLength(1);
      expect(results[0].nombres).toBe('Juan Carlos');
    });

    it('should filter employees by DNI', async () => {
      const mockEmployees: Employee[] = [
        {
          id: '1',
          employeeCode: 'EMP001',
          dni: '12345678',
          apellidoPaterno: 'García',
          apellidoMaterno: 'López',
          nombres: 'Juan Carlos',
          direccionActual: 'Test Address',
          referenciaDireccion: 'Test Reference',
          puesto: 'Developer',
          fechaIngreso: '2023-01-01',
          regimenLaboral: 'Tiempo completo',
          fechaNacimiento: '1990-01-01',
          lugarNacimiento: {
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores'
          },
          sexo: 'Masculino',
          numeroFotocheck: '12345',
          telefonoCelular: '987654321',
          telefonoFijo: '012345678',
          estadoCivil: 'Soltero',
          afp: 'AFP1',
          email: 'juan@example.com',
          licenciaConducir: 'B-I',
          categoriaLicencia: 'B-I',
          banco: 'Banco1',
          numeroCuenta: '123456789',
          cci: '12345678901234567890',
          factorRH: 'O+',
          antecedentesPenales: false,
          epp: {
            tallaCalzado: '42',
            tallaVestimenta: 'M'
          },
          informacionAcademica: {
            gradoInstruccion: 'Universitario',
            nombreInstitucion: 'Universidad Test',
            tipoInstitucion: 'Universidad',
            carrera: 'Ingeniería de Sistemas',
            anoEgreso: 2015
          },
          estudiosComplementarios: [],
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
          creationStep: 6,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEmployees));

      const results = await EmployeeService.searchEmployees('12345678');

      expect(results).toHaveLength(1);
      expect(results[0].dni).toBe('12345678');
    });
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = '1990-05-15';
      const age = EmployeeService.calculateAge(birthDate);

      const expectedAge = new Date().getFullYear() - 1990;
      expect(age).toBe(expectedAge);
    });

    it('should handle edge case of birthday today', () => {
      const today = new Date();
      const birthDate = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const age = EmployeeService.calculateAge(birthDate);

      expect(age).toBe(25);
    });
  });
});