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
  created_at: string;
}

export interface OkrTrimestral {
  id: string;
  okr_anual_id: string | null;
  area: Area;
  titulo: string;
  trimestre: Trimestre;
  anio: number;
  responsable: string;
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
  cliente_asociado: string | null;
  margen_utilidad_esperado: number;
  margen_actual_pct: number | null;
  margen_actualizado_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HitoKr {
  id: string;
  kr_id: string;
  titulo: string;
  cumplido: boolean;
  orden: number;
  created_at: string;
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

export interface OkrTrimestralConAncestros extends OkrTrimestral {
  okr_anual: (OkrAnual & { pilares: Pilar | null }) | null;
}

export interface KeyResultCompleto extends KeyResult {
  hitos_kr: HitoKr[];
  okr_trimestral: OkrTrimestralConAncestros | null;
}
