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

export interface MiembroSquad {
  nombre: string;
  rol: string;
}

/** Composición real del squad y su ritmo de ceremonias. */
export interface Squad {
  po: string;
  chapterLeads: MiembroSquad[];
  ejecutores: MiembroSquad[];
  ceremonias: string[];
}

export interface Cliente {
  id: string;
  nombre: string;
  estado: EstadoCliente;
  feeMensual: number;
  /** Etiqueta corta para las tarjetas. La composición completa va en `squadDetalle`. */
  squad: string;
  squadDetalle?: Squad;
  /** Tablero del cliente en Looker Studio, si tiene uno publicado. */
  lookerUrl?: string;
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
    squad: "PO Leticia · POD Digital",
    squadDetalle: {
      po: "Leticia",
      chapterLeads: [
        { nombre: "Mateo", rol: "Arte" },
        { nombre: "Ayelén", rol: "Digital" },
        { nombre: "Seba", rol: "Consultoría" },
        { nombre: "Cristóbal", rol: "Cliente" },
      ],
      ejecutores: [
        { nombre: "Nico", rol: "Diseño" },
        { nombre: "Maca", rol: "Redacción" },
        { nombre: "Pepe", rol: "Animación / Motion" },
        { nombre: "Bruno", rol: "Diseño" },
        { nombre: "OMG / Maribel", rol: "Pauta Digital" },
        { nombre: "Celina", rol: "Mailing" },
        { nombre: "Franco B.", rol: "Coordinación" },
        { nombre: "Danilo / Dani T.", rol: "P&S" },
        { nombre: "Laura / Gon", rol: "Medios" },
      ],
      ceremonias: ["Weekly Quincenal", "Review Quincenal", "Retro Mensual"],
    },
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
    nombre: "Eseka (Cocot & Dufour)",
    estado: "activo",
    feeMensual: 1450000,
    squad: "PO Agostina · POD Comercial",
    lookerUrl:
      "https://lookerstudio.google.com/u/0/reporting/67beab94-6566-4c66-8c26-f72d8de2314c/page/p_66o0rk0itd",
    squadDetalle: {
      po: "Agostina",
      chapterLeads: [
        { nombre: "Mateo", rol: "Arte" },
        { nombre: "Ayelén", rol: "Digital" },
        { nombre: "Seba", rol: "Consultoría" },
        { nombre: "Cristóbal", rol: "Cliente" },
      ],
      ejecutores: [
        { nombre: "Primo", rol: "Redacción" },
        { nombre: "Meli", rol: "CM / Influencers" },
        { nombre: "OMG", rol: "Pauta" },
        { nombre: "Celi", rol: "Mailing" },
        { nombre: "Igna", rol: "Ecommerce" },
      ],
      ceremonias: ["Weekly Quincenal", "Review Quincenal", "Retro Bimensual"],
    },
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
    squad: "PO Agostina · POD Consultoría",
    squadDetalle: {
      po: "Agostina",
      chapterLeads: [
        { nombre: "Mateo", rol: "Arte" },
        { nombre: "Anto", rol: "Cliente" },
        { nombre: "Seba", rol: "Consultoría" },
        { nombre: "Ayelén", rol: "Digital" },
      ],
      ejecutores: [
        { nombre: "Eli", rol: "Diseño" },
        { nombre: "Primo", rol: "Redacción" },
        { nombre: "Pepe", rol: "Animación" },
        { nombre: "Bruno", rol: "Diseño" },
        { nombre: "Advicers", rol: "Pauta" },
        { nombre: "Aldana", rol: "CM" },
        { nombre: "Dani T. / Danilo", rol: "P&S" },
        { nombre: "Laura", rol: "Eventos / Medios" },
      ],
      ceremonias: ["Weekly Quincenal", "Review Mensual", "Retro Bimensual"],
    },
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
    squad: "PO Maxi · POD Digital",
    squadDetalle: {
      po: "Maxi",
      chapterLeads: [
        { nombre: "Mateo", rol: "Arte" },
        { nombre: "Ayelén", rol: "Digital" },
        { nombre: "Seba", rol: "Consultoría" },
        { nombre: "Cristóbal", rol: "Cliente" },
      ],
      ejecutores: [
        { nombre: "Nico", rol: "Diseño" },
        { nombre: "Maca", rol: "Redacción" },
        { nombre: "Pepe", rol: "Motion" },
        { nombre: "Javi", rol: "Diseño" },
        { nombre: "Advicers Dani / Fran", rol: "Pauta & CRM" },
        { nombre: "Dani T. / Laura", rol: "P&S / BTL" },
      ],
      ceremonias: ["Weekly Quincenal", "Review Quincenal", "Retro Mensual"],
    },
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
    squad: "PO Agostina · POD Arte",
    squadDetalle: {
      po: "Agostina",
      chapterLeads: [
        { nombre: "Mateo", rol: "Arte" },
        { nombre: "Ayelén", rol: "Digital" },
        { nombre: "Seba", rol: "Consultoría" },
        { nombre: "Cristóbal", rol: "Cliente" },
      ],
      ejecutores: [
        { nombre: "Eli Druetta", rol: "Diseño" },
        { nombre: "Mati Mazzoni", rol: "Redacción" },
        { nombre: "Pepe", rol: "Animación" },
        { nombre: "Advicers", rol: "Pauta" },
        { nombre: "Celina", rol: "Email Mkt" },
        { nombre: "Dani T. / Danilo", rol: "P&S" },
        { nombre: "Javi", rol: "Diseño" },
      ],
      ceremonias: ["Weekly Quincenal", "Review Quincenal", "Retro Mensual"],
    },
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
    squad: "PO Gon / Leti · POD Digital",
    squadDetalle: {
      po: "Gon / Leti",
      chapterLeads: [
        { nombre: "Mati", rol: "Arte" },
        { nombre: "Juli", rol: "Digital" },
        { nombre: "Anto", rol: "Cliente / Ej. Cuentas" },
      ],
      ejecutores: [
        { nombre: "Nico", rol: "Diseño" },
        { nombre: "Maca", rol: "Redacción" },
        { nombre: "Pepe", rol: "Animación" },
        { nombre: "Juli", rol: "P&S" },
        { nombre: "OMG", rol: "Pauta" },
        { nombre: "Meli", rol: "CM" },
      ],
      ceremonias: ["Weekly", "Review Chapter", "Retro cada 2-3 meses"],
    },
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

/** Bloque de la matriz de valoración, con su subtotal y quién lo califica. */
export interface CategoriaValoracion {
  titulo: string;
  fuente: string;
  items: Evaluacion[];
  subtotal: number;
  etiqueta?: string;
}

/** KPI de calidad de entregables, con semáforo contra la meta. */
export interface KpiCalidad {
  titulo: string;
  meta: string;
  actual: string;
  estado: "verde" | "amarillo" | "rojo";
  nota?: string;
}

export interface ExpedienteKpi {
  clienteId: string;
  clienteHaciaOxford: Evaluacion[];
  oxfordHaciaCliente: Evaluacion[];
  objetivosComerciales: Evaluacion[];
  /** Últimos 3 meses, del más viejo al más nuevo. */
  tendencia: { mes: string; puntaje: number }[];
  /** Matriz completa del Tablero de Seguimiento, si la cuenta ya la tiene. */
  matriz?: CategoriaValoracion[];
  kpisCalidad?: KpiCalidad[];
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
    // Tendencia del Tablero de Seguimiento real de la cuenta.
    tendencia: [
      { mes: "Marzo", puntaje: 2.0 },
      { mes: "Abril", puntaje: 1.5 },
      { mes: "Mayo", puntaje: 1.9 },
    ],
    matriz: [
      {
        titulo: "Objetivos Comerciales",
        fuente: "Responsabilidad del cliente",
        subtotal: 1.9,
        items: [
          { criterio: "Impacto en ventas offline", puntaje: 3 },
          { criterio: "Mix de productos de terceros", puntaje: 1 },
          { criterio: "Crecimiento de base de datos", puntaje: 2 },
        ],
      },
      {
        titulo: "Performance Digital",
        fuente: "Responsabilidad de la agencia",
        subtotal: 4.2,
        etiqueta: "Alta Performance",
        items: [
          { criterio: "Alcance digital", puntaje: 4 },
          { criterio: "Crecimiento de comunidad", puntaje: 5 },
          { criterio: "CR de e-commerce", puntaje: 5 },
        ],
      },
      {
        titulo: "Relacionamiento",
        fuente: "Cliente ↔ Agencia",
        subtotal: 3.8,
        items: [
          { criterio: "Entrega de información", puntaje: 4 },
          { criterio: "Calidad del feedback", puntaje: 3 },
          { criterio: "Tiempos de respuesta", puntaje: 3.6 },
        ],
      },
    ],
    kpisCalidad: [
      {
        titulo: "Aprobación en 1ª presentación",
        meta: "> 70%",
        actual: "78%",
        estado: "verde",
        nota: "Mide re-trabajo y rebote de piezas.",
      },
      {
        titulo: "Consistencia de marca",
        meta: "> 85%",
        actual: "90%",
        estado: "verde",
        nota: "Evaluación semáforo sobre las piezas entregadas.",
      },
      {
        titulo: "CTR Meta / Google Ads",
        meta: "3%",
        actual: "3,2%",
        estado: "verde",
      },
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

/**
 * Los datos de maqueta en texto plano, para que Scout pueda responder sobre
 * ellos durante la demo. Se marca explícitamente como prototipo para que la
 * IA no los presente como si salieran del sistema.
 */
export function contextoPrototipo(): string {
  const l: string[] = [];
  const c = consolidado();

  l.push("=== MÓDULO PERFORMANCE CLIENTES (PROTOTIPO) ===");
  l.push(
    "Atención: estos datos son de una maqueta en evaluación, no del sistema en producción. Si te preguntan por ellos, respondé con confianza pero aclarando una vez que son del prototipo de Performance Clientes."
  );
  l.push("");
  l.push(
    `Consolidado: facturación ${fmtPesos(c.facturacionTotal)}, utilidad bruta global ${c.margenPromedio}%, rendimiento medio ${fmtPesos(c.rendimientoMedio)}/h, ${c.squadsEnRiesgo} squads en riesgo.`
  );

  l.push("");
  l.push("## Cartera de clientes");
  for (const cl of CLIENTES) {
    l.push(
      `- ${cl.nombre} [${ESTADO_CLIENTE_LABELS[cl.estado]}] · ${cl.squad} · fee ${fmtPesos(cl.feeMensual)} · horas ${cl.horasConsumidas}/${cl.horasPresupuestadas} · margen ${cl.margenPct}% · rendimiento ${fmtPesos(cl.rendimientoHora)}/h`
    );
    l.push(
      `  - Nivel 1 (objetivo de negocio): ${cl.nivel1.titulo} — ${cl.nivel1.valorActual} de ${cl.nivel1.meta} (${cl.nivel1.progreso}%)`
    );
    for (const m of cl.nivel2) {
      l.push(
        `  - Nivel 2 (funnel): ${m.titulo} — ${m.valorActual} contra meta ${m.meta}`
      );
    }
    for (const m of cl.nivel3) {
      l.push(
        `  - Nivel 3 (táctico): ${m.titulo} — ${m.valorActual} contra meta ${m.meta}`
      );
    }
    if (cl.squadDetalle) {
      const s = cl.squadDetalle;
      l.push(`  - PO / Client Partner: ${s.po}`);
      l.push(
        `  - Chapter Leads: ${s.chapterLeads.map((m) => `${m.nombre} (${m.rol})`).join(", ")}`
      );
      l.push(
        `  - Equipo ejecutor: ${s.ejecutores.map((m) => `${m.nombre} (${m.rol})`).join(", ")}`
      );
      l.push(`  - Ceremonias: ${s.ceremonias.join(", ")}`);
    }
    if (cl.lookerUrl) {
      l.push(`  - Tiene tablero en vivo en Looker Studio: ${cl.lookerUrl}`);
    }
  }

  l.push("");
  l.push("## Kata: condiciones objetivo");
  for (const co of CONDICIONES_OBJETIVO) {
    const cl = clientePorId(co.clienteId);
    l.push(
      `- ${cl.nombre}: "${co.titulo}" · métrica ${co.metrica} · ${co.progreso}% · responsable ${co.responsable}`
    );
    l.push(`  - Obstáculo actual: "${co.obstaculo}"`);
    l.push(`  - Siguiente paso: ${co.siguientePaso}`);
  }

  l.push("");
  l.push("## Kata: experimentos PDCA");
  for (const e of EXPERIMENTOS) {
    const cl = clientePorId(e.clienteId);
    l.push(
      `- [${ESTADO_EXPERIMENTO_LABELS[e.estado]}] ${cl.nombre}: ${e.hipotesis}${e.aprendizaje ? ` — Aprendizaje: ${e.aprendizaje}` : ""}`
    );
  }

  l.push("");
  l.push("## KPIs de clientes (evaluación 360, escala 1 a 5)");
  for (const exp of EXPEDIENTES) {
    const cl = clientePorId(exp.clienteId);
    const prom = (evs: Evaluacion[]) =>
      Math.round((evs.reduce((a, e) => a + e.puntaje, 0) / evs.length) * 10) / 10;
    l.push(
      `- ${cl.nombre}: cliente→Oxford ${prom(exp.clienteHaciaOxford)}, Oxford→cliente ${prom(exp.oxfordHaciaCliente)}, objetivos comerciales ${prom(exp.objetivosComerciales)}`
    );
    l.push(
      `  - Tendencia: ${exp.tendencia.map((t) => `${t.mes} ${t.puntaje}`).join(" → ")}`
    );
    const flojos = exp.clienteHaciaOxford
      .concat(exp.oxfordHaciaCliente)
      .filter((e) => e.puntaje <= 2);
    if (flojos.length > 0) {
      l.push(
        `  - Puntos flojos: ${flojos.map((f) => `${f.criterio} (${f.puntaje})`).join(", ")}`
      );
    }
    if (exp.matriz) {
      l.push("  - Matriz de valoración 1 a 5:");
      for (const cat of exp.matriz) {
        l.push(
          `    - ${cat.titulo} (${cat.fuente}): subtotal ${cat.subtotal}${cat.etiqueta ? ` [${cat.etiqueta}]` : ""} · ${cat.items.map((i) => `${i.criterio} ${i.puntaje}/5`).join(", ")}`
        );
      }
    }
    if (exp.kpisCalidad) {
      l.push("  - KPIs de calidad y entregables:");
      for (const k of exp.kpisCalidad) {
        l.push(`    - ${k.titulo}: ${k.actual} contra meta ${k.meta} (${k.estado})`);
      }
    }
  }

  return l.join("\n");
}

/**
 * Respuesta por reglas para preguntas sobre un cliente del prototipo. Si la
 * IA no está disponible en la demo, esto evita que Scout diga que no sabe
 * nada de Panther justo cuando lo estás mostrando.
 */
export function respuestaPrototipoFallback(pregunta: string): string | null {
  const q = pregunta.toLowerCase();
  const cl = CLIENTES.find((c) =>
    q.includes(c.nombre.split(" ")[0].toLowerCase())
  );
  if (!cl) return null;

  const co = CONDICIONES_OBJETIVO.find((x) => x.clienteId === cl.id);
  const exp = EXPEDIENTES.find((x) => x.clienteId === cl.id);
  const activos = EXPERIMENTOS.filter(
    (e) => e.clienteId === cl.id && e.estado !== "cerrado"
  );

  const l: string[] = [];
  l.push(`## ${cl.nombre}`);
  l.push("");
  l.push(
    `- **Estado:** ${ESTADO_CLIENTE_LABELS[cl.estado]} · ${cl.squad} · fee ${fmtPesos(cl.feeMensual)}`
  );
  if (cl.squadDetalle) {
    l.push(
      `- **Squad:** PO ${cl.squadDetalle.po} · ${cl.squadDetalle.ejecutores.length} ejecutores · ${cl.squadDetalle.ceremonias.join(", ")}`
    );
  }
  l.push(
    `- **Rentabilidad:** margen ${cl.margenPct}% · ${fmtPesos(cl.rendimientoHora)}/h · horas ${cl.horasConsumidas} de ${cl.horasPresupuestadas}`
  );
  l.push(
    `- **Nivel 1:** ${cl.nivel1.titulo} — ${cl.nivel1.valorActual} de ${cl.nivel1.meta} (${cl.nivel1.progreso}%)`
  );

  if (co) {
    l.push("");
    l.push("### Condición objetivo");
    l.push(`- ${co.titulo} · ${co.metrica} · ${co.progreso}%`);
    l.push(`- ⚠ Obstáculo: "${co.obstaculo}"`);
    l.push(`- Siguiente paso: ${co.siguientePaso} (${co.responsable})`);
  }

  if (activos.length > 0) {
    l.push("");
    l.push(`### ${activos.length} experimento(s) abiertos`);
    for (const e of activos) l.push(`- ${e.hipotesis}`);
  }

  if (exp) {
    const prom = (evs: Evaluacion[]) =>
      Math.round((evs.reduce((a, e) => a + e.puntaje, 0) / evs.length) * 10) / 10;
    l.push("");
    l.push("### Evaluación 360");
    l.push(
      `- Cliente → Oxford: ${prom(exp.clienteHaciaOxford)} · Oxford → Cliente: ${prom(exp.oxfordHaciaCliente)}`
    );
    l.push(
      `- Tendencia: ${exp.tendencia.map((t) => `${t.mes} ${t.puntaje}`).join(" → ")}`
    );
  }

  l.push("");
  l.push("_Datos del prototipo de Performance Clientes, todavía en maqueta._");
  return l.join("\n");
}

export const fmtPesos = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
