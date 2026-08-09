export const AREAS = [
  "Comercial / Clientes",
  "Digital",
  "Arte / Diseño",
  "Consultoría",
  "Planificación y Operaciones",
  "Administración y Finanzas",
  "Equipo Consciente / Cultura",
  "Dirección General",
] as const;

export type Area = (typeof AREAS)[number];

export const TRIMESTRES = ["Q1", "Q2", "Q3", "Q4"] as const;
export type Trimestre = (typeof TRIMESTRES)[number];

export const TIPOS_MEDICION = [
  "porcentaje",
  "moneda",
  "numerico",
  "hitos",
] as const;
export type TipoMedicion = (typeof TIPOS_MEDICION)[number];

export const SEMAFOROS = ["verde", "amarillo", "rojo"] as const;
export type Semaforo = (typeof SEMAFOROS)[number];

export const ROLES = ["direccion", "equipo", "lectura"] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_LABELS: Record<Rol, string> = {
  direccion: "Dirección",
  equipo: "Equipo",
  lectura: "Solo lectura",
};

/** Lista blanca de acceso y perfil de la persona en una sola fila. */
export interface UsuarioAutorizado {
  id: string;
  email: string;
  nombre: string;
  /** Nombre tal cual figura en okr_trimestral.responsable. */
  responsable: string | null;
  rol: Rol;
  activo: boolean;
  creado_at: string;
}

export interface Pilar {
  id: string;
  nombre: string;
  descripcion: string | null;
  anio: number;
  created_at: string;
}

export interface OkrAnual {
  id: string;
  pilar_id: string | null;
  titulo: string;
  objetivo: string | null;
  /** Nombre de quien rinde cuentas. Se mantiene sincronizado con
   * responsable_id: lo leen los informes, Scout y el mail de recordatorio. */
  responsable: string | null;
  responsable_id: string | null;
  es_colaborativo: boolean;
  areas_involucradas: Area[];
  created_at: string;
}

export interface OkrTrimestral {
  id: string;
  okr_anual_id: string | null;
  area: Area;
  titulo: string;
  trimestre: Trimestre;
  anio: number;
  /** Nombre de quien rinde cuentas, sincronizado con responsable_id. Los
   * demás responsables salen de okr_responsables. */
  responsable: string;
  responsable_id: string | null;
  es_colaborativo: boolean;
  areas_involucradas: Area[];
  created_at: string;
}

export interface KeyResult {
  id: string;
  okr_trimestral_id: string;
  titulo: string;
  tipo_medicion: TipoMedicion;
  valor_inicial: number;
  valor_meta: number;
  valor_actual: number;
  estado_semaforo: Semaforo;
  /** Texto histórico. Se mantiene sincronizado con cliente_id hasta que el
   * código nuevo esté desplegado; después se borra la columna. */
  cliente_asociado: string | null;
  cliente_id: string | null;
  es_colaborativo: boolean;
  areas_involucradas: Area[];
  margen_utilidad_esperado: number;
  margen_actual_pct: number | null;
  margen_actualizado_at: string | null;
  link_trabajo: string | null;
  created_at: string;
  updated_at: string;
}

export const ESTADOS_INICIATIVA = [
  "pendiente",
  "en_curso",
  "bloqueado",
  "completado",
] as const;
export type EstadoIniciativa = (typeof ESTADOS_INICIATIVA)[number];

export const ESTADO_INICIATIVA_LABELS: Record<EstadoIniciativa, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  bloqueado: "Bloqueado",
  completado: "Completado",
};

/** Trabajo concreto del POD que mueve la aguja de un KR. */
export interface Iniciativa {
  id: string;
  kr_id: string;
  titulo: string;
  responsable: string | null;
  estado: EstadoIniciativa;
  fecha_limite: string | null;
  link_recurso: string | null;
  orden: number;
  creado_at: string;
  actualizado_at: string;
}

export interface HitoKr {
  id: string;
  kr_id: string;
  titulo: string;
  cumplido: boolean;
  orden: number;
  created_at: string;
}

export const TIPOS_CONTRATO = ["Fee", "AdHoc"] as const;
export type TipoContrato = (typeof TIPOS_CONTRATO)[number];

export interface ProyectoSolop {
  id: string;
  /** Texto histórico, sincronizado con cliente_id. Ver migración 0008. */
  cliente: string;
  cliente_id: string | null;
  tipo_contrato: TipoContrato;
  kr_id: string | null;
  horas_presupuestadas: number;
  horas_consumidas: number;
  facturacion_total: number;
  costo_operativo: number;
  creado_at: string;
  actualizado_at: string;
}

export interface CompromisoLom {
  id: string;
  kr_id: string;
  descripcion: string;
  cumplido: boolean;
  responsable: string | null;
  fecha_limite: string | null;
  creado_at: string;
}

/** Acta de una reunión de directorio, para la pizarra de la LOM. */
export interface ActaDirectorio {
  id: string;
  fecha: string;
  titulo: string;
  contenido: string | null;
  autor_nombre: string | null;
  autor_id: string | null;
  creado_at: string;
  actualizado_at: string;
}

export interface CheckIn {
  id: string;
  kr_id: string;
  usuario: string;
  valor_registrado: number;
  estado_semaforo: Semaforo;
  comentario_bloqueos: string | null;
  creado_at: string;
}

// ------------------------------------------------------------
// Performance Clientes
// ------------------------------------------------------------

export const ESTADOS_CLIENTE = ["activo", "en_riesgo", "onboarding"] as const;
export type EstadoCliente = (typeof ESTADOS_CLIENTE)[number];

export const ESTADO_CLIENTE_LABELS: Record<EstadoCliente, string> = {
  activo: "Activo",
  en_riesgo: "En Riesgo",
  onboarding: "Onboarding",
};

/** Fuente de verdad de la cuenta. Antes era texto suelto en dos tablas. */
export interface Cliente {
  id: string;
  nombre: string;
  logo_url: string | null;
  estado: EstadoCliente;
  fee_mensual: number;
  pod_asignado: string | null;
  looker_studio_url: string | null;
  /** Ritmo de la cuenta: "Weekly Quincenal", "Retro Mensual". Es del squad
   * entero, no de cada integrante. */
  ceremonias: string[];
  creado_at: string;
  actualizado_at: string;
}

export const ROLES_SQUAD = ["PO", "Chapter Lead", "Ejecutor"] as const;
export type RolSquad = (typeof ROLES_SQUAD)[number];

export interface SquadMiembro {
  id: string;
  cliente_id: string;
  /** Quién es. Fuente de verdad: medio squad son proveedores externos
   * ("OMG / Maribel") que no tienen cuenta en la app. */
  nombre: string;
  /** Solo si además tiene acceso a la app. Permite cruzar con Mis Objetivos. */
  usuario_id: string | null;
  rol_squad: RolSquad;
  /** Arte, Digital, Pauta Digital, Mailing… */
  especialidad: string | null;
  creado_at: string;
}

/** Nivel 1 negocio, nivel 2 performance, nivel 3 operación. */
export type NivelMetrica = 1 | 2 | 3;

export const NIVEL_METRICA_LABELS: Record<NivelMetrica, string> = {
  1: "Negocio",
  2: "Performance",
  3: "Operación",
};

export interface MetricaCliente {
  id: string;
  cliente_id: string;
  nivel: NivelMetrica;
  titulo: string;
  /** Texto, no número: las metas reales son "> 7,8x" o "$8.000 a $20.000". */
  meta: string | null;
  valor_actual: string | null;
  unidad: string | null;
  /** El número que sí existe siempre. Es lo que mueve la barra. */
  progreso_porcentaje: number;
  detalle: string | null;
  kr_asociado_id: string | null;
  creado_at: string;
  actualizado_at: string;
}

export interface KataCondicion {
  id: string;
  cliente_id: string;
  titulo: string;
  /** La métrica de la condición objetivo: "ROAS > 7,8x", "Margen > 65%". */
  meta: string | null;
  progreso_porcentaje: number;
  obstaculo_actual: string | null;
  siguiente_paso: string | null;
  responsable_nombre: string | null;
  responsable_id: string | null;
  creado_at: string;
  actualizado_at: string;
}

export const ESTADOS_PDCA = [
  "planificado",
  "en_curso",
  "validado",
  "descartado",
] as const;
export type EstadoPdca = (typeof ESTADOS_PDCA)[number];

export const ESTADO_PDCA_LABELS: Record<EstadoPdca, string> = {
  planificado: "Planificado",
  en_curso: "En curso",
  validado: "Validado",
  descartado: "Descartado",
};

export interface PdcaExperimento {
  id: string;
  condicion_id: string;
  hipotesis: string;
  experimento: string | null;
  estado: EstadoPdca;
  aprendizaje: string | null;
  creado_at: string;
  actualizado_at: string;
}

/** Puntaje 1 a 5 de un criterio de la evaluación 360. */
export interface ItemEvaluacion {
  criterio: string;
  puntaje: number;
}

export interface PuntoTendencia {
  mes: string;
  puntaje: number;
}

/** Bloque del Tablero de Seguimiento, con su subtotal y quién califica. */
export interface CategoriaValoracion {
  titulo: string;
  fuente: string;
  items: ItemEvaluacion[];
  subtotal: number;
  etiqueta?: string;
}

export interface KpiCalidad {
  titulo: string;
  meta: string;
  actual: string;
  estado: Semaforo;
  nota?: string;
}

/** Los bloques van como jsonb: la grilla cambia de trimestre a trimestre y
 * normalizarla obligaría a migrar el esquema cada vez que el directorio
 * agrega una fila. */
export interface Evaluacion360 {
  id: string;
  cliente_id: string;
  periodo: string;
  notas_comerciales_json: ItemEvaluacion[];
  /** Oxford evaluando al cliente. */
  notas_performance_json: ItemEvaluacion[];
  /** El cliente evaluando a Oxford. */
  notas_relacionamiento_json: ItemEvaluacion[];
  kpis_calidad_json: KpiCalidad[];
  tendencia_json: PuntoTendencia[];
  matriz_json: CategoriaValoracion[];
  creado_at: string;
  actualizado_at: string;
}

/** Referente por área en un OKR colaborativo. No reemplaza a
 * okr_trimestral.responsable, que sigue siendo quien rinde cuentas. */
export interface OkrResponsable {
  id: string;
  /** Uno de los dos, nunca los dos. Ver la migración 0014. */
  okr_trimestral_id: string | null;
  okr_anual_id: string | null;
  usuario_id: string;
  /** Solo tiene sentido en un OKR colaborativo: por qué área entra. */
  area: Area | null;
  creado_at: string;
}

export type OkrResponsableConPersona = OkrResponsable & {
  usuarios_autorizados: UsuarioAutorizado | null;
};

export interface OkrColaborativo extends OkrTrimestral {
  okr_responsables?: (OkrResponsable & {
    usuarios_autorizados: UsuarioAutorizado | null;
  })[];
}

/** Auditoría de edición. Apunta a un OKR trimestral o a un KR, nunca a los dos. */
export interface HistorialCambio {
  id: string;
  okr_id: string | null;
  kr_id: string | null;
  usuario_id: string | null;
  campo_modificado: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  fecha: string;
}

export interface ClienteConDetalle extends Cliente {
  squad_miembros?: (SquadMiembro & { usuarios_autorizados: UsuarioAutorizado | null })[];
  metricas_cliente?: MetricaCliente[];
}

export interface KataCondicionConExperimentos extends KataCondicion {
  pdca_experimentos?: PdcaExperimento[];
}

export interface OkrTrimestralConAncestros extends OkrTrimestral {
  okr_anual: (OkrAnual & { pilares: Pilar | null }) | null;
}

export interface KeyResultCompleto extends KeyResult {
  hitos_kr: HitoKr[];
  okr_trimestral: OkrTrimestralConAncestros | null;
  /** Opcional: las consultas de Supabase se castean, así que no todas las
   * pantallas traen las iniciativas. Leerlas siempre con `?? []`. */
  iniciativas?: Iniciativa[];
}
