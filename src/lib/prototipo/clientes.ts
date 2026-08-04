/**
 * DATOS DE MAQUETA — solo para el prototipo de navegación.
 *
 * Nada de esto sale de la base: son constantes escritas a mano para que las
 * pantallas nuevas se puedan mostrar en una demo. Si el módulo se aprueba,
 * esto se reemplaza por tablas reales y este archivo se borra.
 */

export type EstadoCliente = "activo" | "en_riesgo" | "onboarding";

export const ESTADO_CLIENTE_LABELS: Record<EstadoCliente, string> = {
  activo: "Activo",
  en_riesgo: "En Riesgo",
  onboarding: "Onboarding",
};

export interface MetricaNivel {
  titulo: string;
  valorActual: string;
  meta: string;
  /** 0 a 100. Se usa para la barra de avance. */
  progreso: number;
  detalle?: string;
  krVinculado?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  estado: EstadoCliente;
  feeMensual: number;
  squad: string;
  /** Espejo de SOLOP, cargado a mano en la maqueta. */
  horasConsumidas: number;
  horasPresupuestadas: number;
  margenPct: number;
  rendimientoHora: number;
  /** Nivel 1: el objetivo de negocio del contrato. */
  nivel1: MetricaNivel;
  /** Nivel 2: salud del funnel. */
  nivel2: MetricaNivel[];
  /** Nivel 3: micro-KPIs tácticos. */
  nivel3: MetricaNivel[];
}

export const CLIENTES: Cliente[] = [
  {
    id: "batistella",
    nombre: "Batistella (Bati Off)",
    estado: "en_riesgo",
    feeMensual: 1800000,
    squad: "POD Digital · Ayelén Bruno",
    horasConsumidas: 88,
    horasPresupuestadas: 100,
    margenPct: 54,
    rendimientoHora: 136364,
    nivel1: {
      titulo: "Tickets vendidos por mes",
      valorActual: "24.800",
      meta: "40.000",
      progreso: 62,
      detalle: "Objetivo principal del contrato anual.",
      krVinculado: "Alcanzar $12M de retorno en ventas para el cliente Batistella",
    },
    nivel2: [
      {
        titulo: "ROAS Meta Ads",
        valorActual: "4,9x",
        meta: "> 7,8x",
        progreso: 63,
        detalle: "Cayó con el agotamiento creativo de los formatos verticales.",
      },
      {
        titulo: "CPL",
        valorActual: "$14.200",
        meta: "$8.000 a $20.000",
        progreso: 78,
        detalle: "Dentro de rango, pero en la mitad alta.",
      },
      {
        titulo: "Leads calificados",
        valorActual: "612",
        meta: "900 / mes",
        progreso: 68,
      },
    ],
    nivel3: [
      { titulo: "CTR", valorActual: "2,1%", meta: "> 3%", progreso: 70 },
      { titulo: "Apertura de emailing", valorActual: "31%", meta: "> 28%", progreso: 100 },
      {
        titulo: "Entregables de Arte a tiempo",
        valorActual: "60%",
        meta: "100%",
        progreso: 60,
        detalle: "Cuello de botella declarado en el check-in.",
      },
    ],
  },
  {
    id: "eseka",
    nombre: "Eseka",
    estado: "activo",
    feeMensual: 1450000,
    squad: "POD Comercial · Cristóbal Dávalos",
    horasConsumidas: 62,
    horasPresupuestadas: 110,
    margenPct: 71,
    rendimientoHora: 189000,
    nivel1: {
      titulo: "Facturación en locales propios",
      valorActual: "$142M",
      meta: "$180M / trimestre",
      progreso: 79,
    },
    nivel2: [
      { titulo: "Ticket promedio", valorActual: "$38.500", meta: "> $36.000", progreso: 100 },
      { titulo: "Tráfico a locales", valorActual: "18.400", meta: "22.000 / mes", progreso: 84 },
      { titulo: "Conversión en tienda", valorActual: "4,2%", meta: "> 4%", progreso: 100 },
    ],
    nivel3: [
      { titulo: "Alcance orgánico", valorActual: "212K", meta: "180K", progreso: 100 },
      { titulo: "Frecuencia de posteo", valorActual: "4/sem", meta: "5/sem", progreso: 80 },
    ],
  },
  {
    id: "conquistadores",
    nombre: "Conquistadores",
    estado: "activo",
    feeMensual: 2100000,
    squad: "POD Consultoría · Sebastián",
    horasConsumidas: 95,
    horasPresupuestadas: 140,
    margenPct: 68,
    rendimientoHora: 174000,
    nivel1: {
      titulo: "Clientes cerrados en el año",
      valorActual: "31",
      meta: "50 / año",
      progreso: 62,
      detalle: "Ritmo de cierre por encima del año pasado.",
    },
    nivel2: [
      { titulo: "Oportunidades en pipeline", valorActual: "84", meta: "> 70", progreso: 100 },
      { titulo: "Tasa de cierre", valorActual: "37%", meta: "> 40%", progreso: 92 },
      { titulo: "Costo por oportunidad", valorActual: "$62.000", meta: "< $70.000", progreso: 100 },
    ],
    nivel3: [
      { titulo: "Tiempo de respuesta a lead", valorActual: "3,4 h", meta: "< 2 h", progreso: 58 },
      { titulo: "Reuniones agendadas", valorActual: "22", meta: "25 / mes", progreso: 88 },
    ],
  },
  {
    id: "sipssa",
    nombre: "Sipssa",
    estado: "activo",
    feeMensual: 980000,
    squad: "POD Digital · Ayelén Bruno",
    horasConsumidas: 41,
    horasPresupuestadas: 70,
    margenPct: 66,
    rendimientoHora: 158000,
    nivel1: {
      titulo: "Cotizaciones solicitadas",
      valorActual: "310",
      meta: "400 / trimestre",
      progreso: 78,
    },
    nivel2: [
      { titulo: "CPL", valorActual: "$9.800", meta: "$8.000 a $20.000", progreso: 100 },
      { titulo: "Leads calificados", valorActual: "188", meta: "220 / mes", progreso: 85 },
    ],
    nivel3: [
      { titulo: "CTR", valorActual: "3,4%", meta: "> 3%", progreso: 100 },
      { titulo: "Tiempo en landing", valorActual: "1:42", meta: "> 1:30", progreso: 100 },
    ],
  },
  {
    id: "blangino",
    nombre: "Blangino",
    estado: "onboarding",
    feeMensual: 1200000,
    squad: "POD Arte · Matías Merlo",
    horasConsumidas: 12,
    horasPresupuestadas: 80,
    margenPct: 74,
    rendimientoHora: 201000,
    nivel1: {
      titulo: "Lanzamiento de marca renovada",
      valorActual: "2 de 6 hitos",
      meta: "6 hitos",
      progreso: 33,
      detalle: "Cuenta en onboarding: métricas de resultado todavía no aplican.",
    },
    nivel2: [
      { titulo: "Manual de marca aprobado", valorActual: "En revisión", meta: "Aprobado", progreso: 60 },
      { titulo: "Piezas base entregadas", valorActual: "8", meta: "24", progreso: 33 },
    ],
    nivel3: [
      { titulo: "Rondas de corrección", valorActual: "2,4", meta: "< 3", progreso: 100 },
    ],
  },
  {
    id: "panther",
    nombre: "Panther",
    estado: "en_riesgo",
    feeMensual: 760000,
    squad: "POD Digital · Ayelén Bruno",
    horasConsumidas: 118,
    horasPresupuestadas: 90,
    margenPct: 5,
    rendimientoHora: 2000,
    nivel1: {
      titulo: "Ventas del canal online",
      valorActual: "$18M",
      meta: "$45M / trimestre",
      progreso: 40,
      detalle: "Cuenta con rentabilidad crítica: 118 horas sobre 90 presupuestadas.",
    },
    nivel2: [
      { titulo: "ROAS", valorActual: "2,1x", meta: "> 5x", progreso: 42 },
      { titulo: "CPL", valorActual: "$27.400", meta: "$8.000 a $20.000", progreso: 30 },
    ],
    nivel3: [
      { titulo: "CTR", valorActual: "1,4%", meta: "> 3%", progreso: 47 },
      { titulo: "Carritos abandonados", valorActual: "78%", meta: "< 65%", progreso: 35 },
    ],
  },
];

// ------------------------------------------------------------
// Kata Board
// ------------------------------------------------------------

export interface ExperimentoPdca {
  id: string;
  clienteId: string;
  hipotesis: string;
  estado: "planificado" | "en_curso" | "medido" | "cerrado";
  aprendizaje?: string;
}

export interface CondicionObjetivo {
  clienteId: string;
  titulo: string;
  metrica: string;
  progreso: number;
  obstaculo: string;
  siguientePaso: string;
  responsable: string;
}

export const CONDICIONES_OBJETIVO: CondicionObjetivo[] = [
  {
    clienteId: "batistella",
    titulo: "Recuperar el rendimiento de la pauta",
    metrica: "ROAS > 7,8x",
    progreso: 62,
    obstaculo:
      "Retraso en la entrega de kits de video vertical por parte de Arte",
    siguientePaso:
      "Matías entrega 6 adaptados 9:16 el jueves para relanzar la campaña",
    responsable: "Ayelén Bruno",
  },
  {
    clienteId: "panther",
    titulo: "Volver la cuenta a rentabilidad sana",
    metrica: "Margen > 65%",
    progreso: 8,
    obstaculo:
      "Se consumieron 118 horas sobre 90 presupuestadas sin renegociar alcance",
    siguientePaso:
      "Cristóbal presenta addenda de alcance al cliente antes del viernes",
    responsable: "Cristóbal Dávalos",
  },
  {
    clienteId: "conquistadores",
    titulo: "Acortar el tiempo de respuesta a leads",
    metrica: "< 2 horas",
    progreso: 58,
    obstaculo:
      "Los leads entran por tres canales y nadie tiene la bandeja unificada",
    siguientePaso: "Probar bandeja única en HubSpot durante dos semanas",
    responsable: "Sebastián",
  },
  {
    clienteId: "eseka",
    titulo: "Sostener el tráfico a locales en temporada baja",
    metrica: "22.000 visitas / mes",
    progreso: 84,
    obstaculo: "La campaña de geolocalización no escala más allá de Córdoba",
    siguientePaso: "Piloto de radio segmentada en dos ciudades nuevas",
    responsable: "Cristóbal Dávalos",
  },
];

export const EXPERIMENTOS: ExperimentoPdca[] = [
  {
    id: "e1",
    clienteId: "batistella",
    hipotesis:
      "Si publicamos 3 cortes verticales por semana, el ROAS sube de 4,9x a 6,5x en 14 días",
    estado: "en_curso",
  },
  {
    id: "e2",
    clienteId: "batistella",
    hipotesis:
      "Si separamos el público de retargeting por profundidad de visita, el CPL baja 15%",
    estado: "medido",
    aprendizaje: "El CPL bajó 9%. Sirve, pero menos de lo esperado.",
  },
  {
    id: "e3",
    clienteId: "panther",
    hipotesis:
      "Si limitamos las rondas de corrección a dos, recuperamos 20 horas por mes",
    estado: "planificado",
  },
  {
    id: "e4",
    clienteId: "conquistadores",
    hipotesis:
      "Si asignamos un responsable de guardia por turno, el tiempo de respuesta baja a 2 h",
    estado: "en_curso",
  },
  {
    id: "e5",
    clienteId: "eseka",
    hipotesis:
      "Si adelantamos la pauta 10 días al evento, el tráfico sube 12%",
    estado: "cerrado",
    aprendizaje: "Subió 14%. Se adopta como práctica estándar.",
  },
];

export const ESTADO_EXPERIMENTO_LABELS: Record<ExperimentoPdca["estado"], string> =
  {
    planificado: "Planificado",
    en_curso: "En curso",
    medido: "Medido",
    cerrado: "Cerrado",
  };

// ------------------------------------------------------------
// KPIs de clientes: evaluación 360
// ------------------------------------------------------------

export interface Evaluacion {
  criterio: string;
  puntaje: number; // 1 a 5
}

export interface ExpedienteKpi {
  clienteId: string;
  clienteHaciaOxford: Evaluacion[];
  oxfordHaciaCliente: Evaluacion[];
  objetivosComerciales: Evaluacion[];
  /** Últimos 3 meses, del más viejo al más nuevo. */
  tendencia: { mes: string; puntaje: number }[];
}

export const EXPEDIENTES: ExpedienteKpi[] = [
  {
    clienteId: "batistella",
    clienteHaciaOxford: [
      { criterio: "Tiempos de respuesta", puntaje: 3 },
      { criterio: "Calidad del feedback", puntaje: 4 },
      { criterio: "Claridad de los briefs", puntaje: 2 },
      { criterio: "Entrega de información", puntaje: 2 },
    ],
    oxfordHaciaCliente: [
      { criterio: "Cumplimiento de pagos", puntaje: 5 },
      { criterio: "Agilidad en aprobaciones", puntaje: 2 },
      { criterio: "Respeto de procesos", puntaje: 3 },
    ],
    objetivosComerciales: [
      { criterio: "Facturación en locales", puntaje: 3 },
      { criterio: "Mix de producto", puntaje: 2 },
      { criterio: "Base de datos", puntaje: 2 },
      { criterio: "Performance digital", puntaje: 3 },
      { criterio: "Presencia de marca", puntaje: 4 },
    ],
    tendencia: [
      { mes: "Mayo", puntaje: 2.9 },
      { mes: "Junio", puntaje: 2.3 },
      { mes: "Julio", puntaje: 2.5 },
    ],
  },
  {
    clienteId: "eseka",
    clienteHaciaOxford: [
      { criterio: "Tiempos de respuesta", puntaje: 5 },
      { criterio: "Calidad del feedback", puntaje: 4 },
      { criterio: "Claridad de los briefs", puntaje: 4 },
      { criterio: "Entrega de información", puntaje: 4 },
    ],
    oxfordHaciaCliente: [
      { criterio: "Cumplimiento de pagos", puntaje: 5 },
      { criterio: "Agilidad en aprobaciones", puntaje: 4 },
      { criterio: "Respeto de procesos", puntaje: 5 },
    ],
    objetivosComerciales: [
      { criterio: "Facturación en locales", puntaje: 4 },
      { criterio: "Mix de producto", puntaje: 4 },
      { criterio: "Base de datos", puntaje: 3 },
      { criterio: "Performance digital", puntaje: 4 },
      { criterio: "Presencia de marca", puntaje: 5 },
    ],
    tendencia: [
      { mes: "Mayo", puntaje: 3.8 },
      { mes: "Junio", puntaje: 4.1 },
      { mes: "Julio", puntaje: 4.3 },
    ],
  },
  {
    clienteId: "conquistadores",
    clienteHaciaOxford: [
      { criterio: "Tiempos de respuesta", puntaje: 4 },
      { criterio: "Calidad del feedback", puntaje: 3 },
      { criterio: "Claridad de los briefs", puntaje: 3 },
      { criterio: "Entrega de información", puntaje: 4 },
    ],
    oxfordHaciaCliente: [
      { criterio: "Cumplimiento de pagos", puntaje: 4 },
      { criterio: "Agilidad en aprobaciones", puntaje: 3 },
      { criterio: "Respeto de procesos", puntaje: 4 },
    ],
    objetivosComerciales: [
      { criterio: "Facturación en locales", puntaje: 3 },
      { criterio: "Mix de producto", puntaje: 3 },
      { criterio: "Base de datos", puntaje: 4 },
      { criterio: "Performance digital", puntaje: 3 },
      { criterio: "Presencia de marca", puntaje: 3 },
    ],
    tendencia: [
      { mes: "Mayo", puntaje: 3.2 },
      { mes: "Junio", puntaje: 3.4 },
      { mes: "Julio", puntaje: 3.4 },
    ],
  },
  {
    clienteId: "sipssa",
    clienteHaciaOxford: [
      { criterio: "Tiempos de respuesta", puntaje: 4 },
      { criterio: "Calidad del feedback", puntaje: 3 },
      { criterio: "Claridad de los briefs", puntaje: 4 },
      { criterio: "Entrega de información", puntaje: 3 },
    ],
    oxfordHaciaCliente: [
      { criterio: "Cumplimiento de pagos", puntaje: 4 },
      { criterio: "Agilidad en aprobaciones", puntaje: 4 },
      { criterio: "Respeto de procesos", puntaje: 4 },
    ],
    objetivosComerciales: [
      { criterio: "Facturación en locales", puntaje: 3 },
      { criterio: "Mix de producto", puntaje: 3 },
      { criterio: "Base de datos", puntaje: 3 },
      { criterio: "Performance digital", puntaje: 4 },
      { criterio: "Presencia de marca", puntaje: 3 },
    ],
    tendencia: [
      { mes: "Mayo", puntaje: 3.3 },
      { mes: "Junio", puntaje: 3.5 },
      { mes: "Julio", puntaje: 3.6 },
    ],
  },
  {
    clienteId: "blangino",
    clienteHaciaOxford: [
      { criterio: "Tiempos de respuesta", puntaje: 4 },
      { criterio: "Calidad del feedback", puntaje: 3 },
      { criterio: "Claridad de los briefs", puntaje: 2 },
      { criterio: "Entrega de información", puntaje: 2 },
    ],
    oxfordHaciaCliente: [
      { criterio: "Cumplimiento de pagos", puntaje: 5 },
      { criterio: "Agilidad en aprobaciones", puntaje: 2 },
      { criterio: "Respeto de procesos", puntaje: 3 },
    ],
    objetivosComerciales: [
      { criterio: "Facturación en locales", puntaje: 2 },
      { criterio: "Mix de producto", puntaje: 2 },
      { criterio: "Base de datos", puntaje: 1 },
      { criterio: "Performance digital", puntaje: 2 },
      { criterio: "Presencia de marca", puntaje: 3 },
    ],
    tendencia: [
      { mes: "Mayo", puntaje: 2.1 },
      { mes: "Junio", puntaje: 2.4 },
      { mes: "Julio", puntaje: 2.6 },
    ],
  },
  {
    clienteId: "panther",
    clienteHaciaOxford: [
      { criterio: "Tiempos de respuesta", puntaje: 3 },
      { criterio: "Calidad del feedback", puntaje: 2 },
      { criterio: "Claridad de los briefs", puntaje: 1 },
      { criterio: "Entrega de información", puntaje: 2 },
    ],
    oxfordHaciaCliente: [
      { criterio: "Cumplimiento de pagos", puntaje: 3 },
      { criterio: "Agilidad en aprobaciones", puntaje: 1 },
      { criterio: "Respeto de procesos", puntaje: 2 },
    ],
    objetivosComerciales: [
      { criterio: "Facturación en locales", puntaje: 2 },
      { criterio: "Mix de producto", puntaje: 2 },
      { criterio: "Base de datos", puntaje: 2 },
      { criterio: "Performance digital", puntaje: 1 },
      { criterio: "Presencia de marca", puntaje: 2 },
    ],
    tendencia: [
      { mes: "Mayo", puntaje: 2.6 },
      { mes: "Junio", puntaje: 2.2 },
      { mes: "Julio", puntaje: 1.9 },
    ],
  },
];

// ------------------------------------------------------------
// Consolidados para la barra superior del Kata Board
// ------------------------------------------------------------

export function consolidado() {
  const facturacionTotal = CLIENTES.reduce((a, c) => a + c.feeMensual, 0);
  const margenPromedio =
    Math.round(
      (CLIENTES.reduce((a, c) => a + c.margenPct, 0) / CLIENTES.length) * 10
    ) / 10;
  const horas = CLIENTES.reduce((a, c) => a + c.horasConsumidas, 0);
  const rendimientoMedio = Math.round(facturacionTotal / horas);
  const squadsEnRiesgo = CLIENTES.filter(
    (c) => c.estado === "en_riesgo" || c.margenPct < 65
  ).length;

  return { facturacionTotal, margenPromedio, rendimientoMedio, squadsEnRiesgo };
}

export function clientePorId(id: string): Cliente {
  return CLIENTES.find((c) => c.id === id) ?? CLIENTES[0];
}

export const fmtPesos = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
