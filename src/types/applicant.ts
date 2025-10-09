/**
 * Tipos y interfaces para el módulo de postulantes
 * Sistema de gestión de postulaciones para CPQ-Columbito
 */

export type ApplicantStatus = 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado' | 'contratado';

export type ApplicationSource = 'web' | 'referido' | 'feria_empleo' | 'redes_sociales' | 'otro';

export interface Applicant {
  id?: string;

  // Información Personal
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  fechaNacimiento: string;
  lugarNacimiento: {
    departamento: string;
    provincia: string;
    distrito: string;
  };
  sexo: 'Masculino' | 'Femenino';
  estadoCivil: 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo';

  // Información de Contacto
  direccionActual: string;
  referenciaDireccion: string;
  telefonoCelular: string;
  telefonoFijo?: string;
  email: string;

  // Información Laboral
  puestoInteres: string;
  proyectoInteres?: string; // Nuevo campo: Proyecto específico al que postula
  experienciaPrevia: string;
  salarioEsperado?: number;
  disponibilidadInmediata: boolean;
  fechaDisponibilidad?: string;

  // Información Académica
  gradoInstruccion: string;
  nombreInstitucion: string;
  carreraProfesional?: string;
  anoEgreso: number;
  estudiosComplementarios?: Array<{
    nombre: string;
    institucion: string;
    anoEgreso: number;
  }>;

  // Información Adicional
  fuentePostulacion: ApplicationSource;
  referidoPor?: string;
  observaciones?: string;

  // Archivos Adjuntos
  cvUrl?: string;
  certificadoEstudiosUrl?: string;
  certificadoAntecedentesUrl?: string;
  otrosDocumentos?: Array<{
    nombre: string;
    url: string;
    tipo: string;
  }>;

  // Estado y Seguimiento
  status: ApplicantStatus;
  fechaPostulacion: string;
  fechaUltimaActualizacion: string;
  actualizadoPor?: string;

  // Proceso de Selección
  entrevistas?: Array<{
    fecha: string;
    tipo: 'telefonica' | 'presencial' | 'virtual';
    entrevistador: string;
    resultado: 'positivo' | 'negativo' | 'pendiente';
    observaciones?: string;
  }>;

  // Notificaciones
  notificacionesEnviadas?: Array<{
    tipo: 'confirmacion' | 'cita' | 'resultado' | 'recordatorio';
    fecha: string;
    metodo: 'email' | 'sms' | 'telefono';
    estado: 'enviado' | 'fallido' | 'pendiente';
  }>;

  // Conversión a Empleado
  convertidoAEmpleado?: {
    empleadoId: string;
    fechaConversion: string;
    convertidoPor: string;
  };

  // Auditoría
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ApplicantFilters {
  status?: ApplicantStatus[];
  puestoInteres?: string;
  fuentePostulacion?: ApplicationSource[];
  fechaDesde?: string;
  fechaHasta?: string;
  searchTerm?: string;
}

export interface ApplicantStats {
  total: number;
  pendientes: number;
  en_revision: number;
  aprobados: number;
  rechazados: number;
  contratados: number;
  nuevos_hoy: number;
  nuevos_semana: number;
}