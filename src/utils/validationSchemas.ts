import { z } from 'zod';

// Custom validation functions
const dniRegex = /^[0-9]{8}$/;
const phoneRegex = /^[0-9]{7,9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const accountNumberRegex = /^[0-9]{10,20}$/;
const cciRegex = /^[0-9]{20}$/;

// Helper function to validate date strings
const validateDateString = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const match = dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  return date instanceof Date && !isNaN(date.getTime()) && !!match;
};

// Helper function to validate age (must be 18+)
const validateAge = (birthDate: string): boolean => {
  if (!validateDateString(birthDate)) return false;
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
};

// Base schemas for reusable parts
const lugarNacimientoSchema = z.object({
  departamento: z.string().min(1, 'Departamento es requerido').max(100),
  provincia: z.string().min(1, 'Provincia es requerida').max(100),
  distrito: z.string().min(1, 'Distrito es requerido').max(100)
});

const eppSchema = z.object({
  tallaCalzado: z.string().min(1, 'Talla de calzado es requerida').max(10),
  tallaVestimenta: z.string().min(1, 'Talla de vestimenta es requerida').max(5)
});

const informacionAcademicaSchema = z.object({
  gradoInstruccion: z.string().min(1, 'Grado de instrucción es requerido').max(100),
  nombreInstitucion: z.string().min(1, 'Nombre de institución es requerido').max(200),
  tipoInstitucion: z.string().min(1, 'Tipo de institución es requerido').max(100),
  carrera: z.string().min(1, 'Carrera es requerida').max(150),
  anoEgreso: z.number()
    .int('Año de egreso debe ser un número entero')
    .min(1950, 'Año de egreso debe ser posterior a 1950')
    .max(new Date().getFullYear(), 'Año de egreso no puede ser en el futuro')
});

const conyugeSchema = z.object({
  apellidosNombres: z.string().max(200, 'Máximo 200 caracteres').optional(),
  dni: z.string().regex(dniRegex, 'DNI debe tener 8 dígitos').optional(),
  fechaNacimiento: z.string()
    .refine(validateDateString, 'Fecha de nacimiento no válida')
    .optional(),
  telefono: z.string().regex(phoneRegex, 'Teléfono debe tener 7-9 dígitos').optional(),
  documentoVinculo: z.string().max(100, 'Máximo 100 caracteres').optional()
});

const hijoSchema = z.object({
  dni: z.string().regex(dniRegex, 'DNI debe tener 8 dígitos'),
  apellidos: z.string().min(1, 'Apellidos son requeridos').max(150),
  nombres: z.string().min(1, 'Nombres son requeridos').max(100)
});

// Main Employee schema
export const employeeSchema = z.object({
  employeeCode: z.string()
    .min(1, 'Código de empleado es requerido')
    .max(20, 'Código máximo 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Código solo puede contener letras mayúsculas y números'),

  dni: z.string()
    .regex(dniRegex, 'DNI debe tener exactamente 8 dígitos'),

  apellidoPaterno: z.string()
    .min(1, 'Apellido paterno es requerido')
    .max(100, 'Apellido paterno máximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Apellido paterno solo puede contener letras'),

  apellidoMaterno: z.string()
    .min(1, 'Apellido materno es requerido')
    .max(100, 'Apellido materno máximo 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Apellido materno solo puede contener letras'),

  nombres: z.string()
    .min(1, 'Nombres son requeridos')
    .max(150, 'Nombres máximo 150 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombres solo pueden contener letras'),

  direccionActual: z.string()
    .min(1, 'Dirección actual es requerida')
    .max(300, 'Dirección máximo 300 caracteres'),

  referenciaDireccion: z.string()
    .min(1, 'Referencia de dirección es requerida')
    .max(200, 'Referencia máximo 200 caracteres'),

  puesto: z.string()
    .min(1, 'Puesto es requerido')
    .max(100, 'Puesto máximo 100 caracteres'),

  fechaIngreso: z.string()
    .refine(validateDateString, 'Fecha de ingreso no válida')
    .refine((date) => {
      const fechaIngreso = new Date(date);
      const today = new Date();
      return fechaIngreso <= today;
    }, 'Fecha de ingreso no puede ser en el futuro'),

  regimenLaboral: z.string()
    .min(1, 'Régimen laboral es requerido')
    .max(100, 'Régimen laboral máximo 100 caracteres'),

  fechaNacimiento: z.string()
    .refine(validateDateString, 'Fecha de nacimiento no válida')
    .refine(validateAge, 'Empleado debe ser mayor de 18 años'),

  lugarNacimiento: lugarNacimientoSchema,

  fotoUrl: z.string().optional(),

  sexo: z.string(),

  numeroFotocheck: z.string()
    .min(1, 'Número de fotocheck es requerido')
    .max(20, 'Número de fotocheck máximo 20 caracteres'),

  telefonoCelular: z.string()
    .regex(phoneRegex, 'Teléfono celular debe tener 7-9 dígitos'),

  telefonoFijo: z.string()
    .regex(phoneRegex, 'Teléfono fijo debe tener 7-9 dígitos')
    .optional(),

  estadoCivil: z.string(),

  afp: z.string()
    .min(1, 'AFP es requerida')
    .max(100, 'AFP máximo 100 caracteres'),

  email: z.string()
    .regex(emailRegex, 'Email no válido'),

  licenciaConducir: z.string()
    .min(1, 'Licencia de conducir es requerida')
    .max(50, 'Licencia de conducir máximo 50 caracteres'),

  categoriaLicencia: z.string()
    .min(1, 'Categoría de licencia es requerida')
    .max(50, 'Categoría de licencia máximo 50 caracteres'),

  banco: z.string()
    .min(1, 'Banco es requerido')
    .max(100, 'Banco máximo 100 caracteres'),

  numeroCuenta: z.string()
    .regex(accountNumberRegex, 'Número de cuenta debe tener 10-20 dígitos'),

  cci: z.string()
    .regex(cciRegex, 'CCI debe tener exactamente 20 dígitos'),

  factorRH: z.string()
    .min(1, 'Factor RH es requerido')
    .max(5, 'Factor RH máximo 5 caracteres'),

  antecedentesPenales: z.boolean(),

  epp: eppSchema,

  informacionAcademica: informacionAcademicaSchema,

  estudiosComplementarios: z.array(z.object({
    diploma: z.string().min(1, 'Diploma es requerido').max(200),
    institucion: z.string().min(1, 'Institución es requerida').max(200),
    fechaEgreso: z.string().refine(validateDateString, 'Fecha de egreso no válida')
  })).optional().default([]),

  datosFamilia: z.object({
    conyuge: conyugeSchema,
    tieneHijos: z.boolean()
  }),

  hijos: z.array(hijoSchema).optional().default([]),

  assignedProjects: z.array(z.string()).optional().default([]),

  isActive: z.boolean().optional().default(true),
  creationStep: z.number().int().min(1).max(6).optional().default(1),
  draftData: z.any().optional(),

  // Status management fields
  deactivationDate: z.string().optional(),
  activationDate: z.string().optional(),
  deactivationReason: z.string().max(500, 'Motivo máximo 500 caracteres').optional(),
  lastAssignedProject: z.string().optional(),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

// Partial schema for updates
export const employeeUpdateSchema = employeeSchema.partial();

// Schema for employee creation (without system-generated fields)
export const employeeCreateSchema = employeeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deactivationDate: true,
  activationDate: true
});

// Schema for status change
export const employeeStatusChangeSchema = z.object({
  isActive: z.boolean(),
  deactivationDate: z.string().optional(),
  deactivationReason: z.string().max(500, 'Motivo máximo 500 caracteres').optional(),
  activationDate: z.string().optional(),
  assignedProject: z.string().optional()
});

// Schema for search
export const employeeSearchSchema = z.object({
  searchTerm: z.string().max(100, 'Término de búsqueda máximo 100 caracteres').optional(),
  showInactive: z.boolean().optional().default(false),
  filters: z.object({
    puesto: z.string().optional(),
    departamento: z.string().optional(),
    isActive: z.boolean().optional()
  }).optional()
});

// Type exports
export type EmployeeFormData = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateData = z.infer<typeof employeeUpdateSchema>;
export type EmployeeStatusChangeData = z.infer<typeof employeeStatusChangeSchema>;
export type EmployeeSearchData = z.infer<typeof employeeSearchSchema>;

// Validation helper functions
export const validateEmployee = (data: unknown) => {
  return employeeCreateSchema.safeParse(data);
};

export const validateEmployeeUpdate = (data: unknown) => {
  return employeeUpdateSchema.safeParse(data);
};

export const validateEmployeeStatusChange = (data: unknown) => {
  return employeeStatusChangeSchema.safeParse(data);
};

export const validateEmployeeSearch = (data: unknown) => {
  return employeeSearchSchema.safeParse(data);
};

// Esquemas de validación para postulantes - Eliminado esquema duplicado

// Schema simplificado para validación básica de postulantes
export const applicantCreateSchema = z.object({
  dni: z.string().regex(/^[0-9]{8}$/, 'DNI debe tener 8 dígitos'),
  apellidoPaterno: z.string().min(1, 'Apellido paterno requerido'),
  apellidoMaterno: z.string().min(1, 'Apellido materno requerido'),
  nombres: z.string().min(1, 'Nombres requeridos'),
  fechaNacimiento: z.string().refine(validateDateString, 'Fecha inválida'),
  lugarNacimiento: z.object({
    departamento: z.string().min(1),
    provincia: z.string().min(1),
    distrito: z.string().min(1)
  }),
  sexo: z.string(),
  estadoCivil: z.string(),
  direccionActual: z.string().min(1, 'Dirección requerida'),
  referenciaDireccion: z.string().min(1, 'Referencia requerida'),
  telefonoCelular: z.string().regex(phoneRegex, 'Teléfono inválido'),
  email: z.string().email('Email inválido'),
  puestoInteres: z.string().min(1, 'Puesto requerido'),
  proyectoInteres: z.string().max(200, 'Proyecto máximo 200 caracteres').optional(),
  experienciaPrevia: z.string().min(1, 'Experiencia requerida'),
  gradoInstruccion: z.string().min(1, 'Grado requerido'),
  nombreInstitucion: z.string().min(1, 'Institución requerida'),
  anoEgreso: z.number().min(1950).max(new Date().getFullYear()),
  fuentePostulacion: z.string()
});

// Schema para actualización de postulantes
export const applicantUpdateSchema = applicantCreateSchema.partial().extend({
  status: z.string().optional(),
  actualizadoPor: z.string().optional(),
  entrevistas: z.array(z.object({
    fecha: z.string(),
    tipo: z.string(),
    entrevistador: z.string(),
    resultado: z.string(),
    observaciones: z.string().optional()
  })).optional(),
  notificacionesEnviadas: z.array(z.object({
    tipo: z.string(),
    fecha: z.string(),
    metodo: z.string(),
    estado: z.string()
  })).optional()
});

// Schema para filtros de búsqueda
export const applicantFiltersSchema = z.object({
  status: z.array(z.string()).optional(),
  puestoInteres: z.string().optional(),
  fuentePostulacion: z.array(z.string()).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  searchTerm: z.string().max(100).optional()
});

// Type exports para postulantes
export type ApplicantFormData = z.infer<typeof applicantCreateSchema>;
export type ApplicantUpdateData = z.infer<typeof applicantUpdateSchema>;
export type ApplicantFiltersData = z.infer<typeof applicantFiltersSchema>;

// Funciones de validación para postulantes
export const validateApplicant = (data: unknown) => {
  return applicantCreateSchema.safeParse(data);
};

export const validateApplicantUpdate = (data: unknown) => {
  return applicantUpdateSchema.safeParse(data);
};

export const validateApplicantFilters = (data: unknown) => {
  return applicantFiltersSchema.safeParse(data);
};

// Custom error formatter
export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.issues.reduce((acc, error) => {
    const path = error.path.join('.');
    acc[path] = error.message;
    return acc;
  }, {} as Record<string, string>);
};