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
  responsable: string | null;
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
  /** Responsable principal. En los colaborativos, el que rinde cuentas;
   * los demás involucrados salen de areas_involucradas. */
  responsable: string;
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

export const ESTADOS_CLIENTE = ["activo", "pausado", "baja"] as const;
export type EstadoCliente = (typeof ESTADOS_CLIENTE)[number];

export const ESTADO_CLIENTE_LABELS: Record<EstadoCliente, string> = {
  activo: "Activo",
  pausado: "Pausado",
  baja: "Baja",
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
  creado_at: string;
  actualizado_at: string;
}

export const ROLES_SQUAD = ["PO", "Chapter Lead", "Ejecutor"] as const;
export type RolSquad = (typeof ROLES_SQUAD)[number];

export interface SquadMiembro {
  id: string;
  cliente_id: string;
  usuario_id: string;
  rol_squad: RolSquad;
  ceremonias: string[];
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
  meta: number | null;
  valor_actual: number | null;
  unidad: string | null;
  kr_asociado_id: string | null;
  creado_at: string;
  actualizado_at: string;
}

export interface KataCondicion {
  id: string;
  cliente_id: string;
  titulo: string;
  meta: string | null;
  progreso_porcentaje: number;
  obstaculo_actual: string | null;
  siguiente_paso: string | null;
  responsable_id: string | null;
  creado_at: string;
  actualizado_at: string;
}

export const ESTADOS_PDCA = ["en_curso", "validado", "descartado"] as const;
export type EstadoPdca = (typeof ESTADOS_PDCA)[number];

export const ESTADO_PDCA_LABELS: Record<EstadoPdca, string> = {
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
  creado_at: string;
  actualizado_at: string;
}

/** Los cuatro bloques van como jsonb: la grilla cambia cada trimestre. */
export interface Evaluacion360 {
  id: string;
  cliente_id: string;
  periodo: string;
  notas_comerciales_json: Record<string, unknown>;
  notas_performance_json: Record<string, unknown>;
  notas_relacionamiento_json: Record<string, unknown>;
  kpis_calidad_json: Record<string, unknown>;
  creado_at: string;
  actualizado_at: string;
}

/** Referente por área en un OKR colaborativo. No reemplaza a
 * okr_trimestral.responsable, que sigue siendo quien rinde cuentas. */
export interface OkrResponsable {
  id: string;
  okr_trimestral_id: string;
  usuario_id: string;
  area: Area;
  creado_at: string;
}

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
