/**
 * Tipos y interfaces para el módulo de entrevistas
 * Sistema de gestión de entrevistas para postulantes de CPQ-Columbito
 */

export type InterviewType = 'telefonica' | 'presencial' | 'virtual' | 'tecnica' | 'psicologica' | 'final';
export type InterviewStatus = 'programada' | 'confirmada' | 'en_progreso' | 'completada' | 'cancelada' | 'reprogramada';
export type InterviewResult = 'positivo' | 'negativo' | 'pendiente' | 'no_asistio';

export interface Interview {
  id?: string;

  // Información del Postulante
  applicantId: string;
  applicantDNI: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  puestoInteres: string;
  proyectoInteres?: string;

  // Información de la Entrevista
  fechaEntrevista: string; // Fecha y hora programada
  tipoEntrevista: InterviewType;
  modalidad: 'presencial' | 'virtual' | 'telefonica';
  ubicacion?: string; // Para entrevistas presenciales
  plataforma?: string; // Para entrevistas virtuales (Zoom, Teams, etc.)
  linkReunion?: string; // Link para entrevista virtual

  // Entrevistadores
  entrevistadorPrincipal: string;
  entrevistadoresAdicionales?: string[];
  departamentoEntrevistador: string;

  // Estado y Seguimiento
  status: InterviewStatus;
  resultado?: InterviewResult;

  // Duración y Horarios
  duracionEstimada: number; // en minutos
  horaInicio?: string;
  horaFin?: string;
  duracionReal?: number; // en minutos

  // Evaluación y Notas
  calificacionGeneral?: number; // 1-10
  evaluacionTecnica?: number; // 1-10
  evaluacionActitudinal?: number; // 1-10
  evaluacionComunicacion?: number; // 1-10

  // Aspectos Evaluados
  conocimientosTecnicos?: number; // 1-10
  experienciaLaboral?: number; // 1-10
  motivacion?: number; // 1-10
  adaptabilidad?: number; // 1-10
  trabajoEquipo?: number; // 1-10
  liderazgo?: number; // 1-10

  // Notas y Observaciones
  fortalezas?: string;
  areasMejora?: string;
  observaciones?: string;
  notasAdicionales?: string;

  // Información Adicional
  pretensionSalarial?: number;
  montoOfrecido?: number;
  llegoAcuerdo?: boolean;
  fechaInicio?: string; // Si se acordó fecha de inicio

  // Información de Contacto
  viveEn?: string;
  disponibilidad?: string;

  // Estado del Proceso
  requiereSegundaEntrevista?: boolean;
  fechaSegundaEntrevista?: string;
  tipoSegundaEntrevista?: InterviewType;

  // Auditoría
  creadaPor: string;
  actualizadaPor?: string;
  fechaCreacion: string;
  fechaActualizacion: string;

  // Notificaciones
  notificacionesEnviadas?: Array<{
    tipo: 'recordatorio' | 'confirmacion' | 'cancelacion' | 'reprogramacion';
    fecha: string;
    metodo: 'email' | 'sms' | 'telefono' | 'whatsapp';
    estado: 'enviado' | 'fallido' | 'pendiente';
    destinatario?: string;
  }>;

  // Archivos Adjuntos
  archivosAdjuntos?: Array<{
    nombre: string;
    url: string;
    tipo: 'cv' | 'certificado' | 'foto' | 'otro';
    fechaSubida: string;
  }>;
}

export interface InterviewFilters {
  status?: InterviewStatus[];
  tipoEntrevista?: InterviewType[];
  entrevistador?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  resultado?: InterviewResult[];
  searchTerm?: string;
  applicantId?: string;
}

export interface InterviewStats {
  total: number;
  programadas: number;
  completadas: number;
  canceladas: number;
  positivas: number;
  negativas: number;
  pendientes: number;
  esta_semana: number;
  este_mes: number;
  promedio_calificacion: number;
  tiempo_promedio: number; // en minutos
}

export interface InterviewTemplate {
  id?: string;
  nombre: string;
  tipoEntrevista: InterviewType;
  departamento: string;
  preguntasEstandar: Array<{
    categoria: 'tecnica' | 'actitudinal' | 'experiencia' | 'motivacion';
    pregunta: string;
    tipoRespuesta: 'texto' | 'numerica' | 'multiple' | 'si_no';
    opciones?: string[];
    requerida: boolean;
  }>;
  criteriosEvaluacion: Array<{
    aspecto: string;
    peso: number; // porcentaje
    descripcion: string;
  }>;
  activo: boolean;
  creadoPor: string;
  fechaCreacion: string;
}