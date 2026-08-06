import type { MetricaCliente, ProyectoSolop, SquadMiembro } from "@/lib/types";
import { META_MARGEN, UMBRAL_ALERTA_HORAS } from "@/lib/solop-logic";

/** Espejo de SOLOP para una cuenta entera. */
export interface ResumenSolop {
  horas_consumidas: number;
  horas_presupuestadas: number;
  facturacion_total: number;
  costo_operativo: number;
  margen_pct: number | null;
  rendimiento_hora: number | null;
  ratio_horas: number | null;
}

/** Consolida los proyectos de un cliente.
 *
 * Suma primero y divide después, en vez de promediar los márgenes de cada
 * proyecto: un fee de $2M al 70% y un adhoc de $50.000 al 20% no dan 45%.
 * Promediar ratios de bases distintas es la forma clásica de mentirse. */
export function resumenSolop(proyectos: ProyectoSolop[]): ResumenSolop {
  const horas_consumidas = suma(proyectos, (p) => p.horas_consumidas);
  const horas_presupuestadas = suma(proyectos, (p) => p.horas_presupuestadas);
  const facturacion_total = suma(proyectos, (p) => p.facturacion_total);
  const costo_operativo = suma(proyectos, (p) => p.costo_operativo);

  return {
    horas_consumidas,
    horas_presupuestadas,
    facturacion_total,
    costo_operativo,
    margen_pct:
      facturacion_total > 0
        ? redondear1((facturacion_total - costo_operativo) / facturacion_total * 100)
        : null,
    rendimiento_hora:
      horas_consumidas > 0
        ? Math.round(facturacion_total / horas_consumidas)
        : null,
    ratio_horas:
      horas_presupuestadas > 0 ? horas_consumidas / horas_presupuestadas : null,
  };
}

function suma<T>(items: T[], f: (item: T) => number): number {
  return items.reduce((acc, item) => acc + (f(item) || 0), 0);
}

function redondear1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Mismo criterio que la Torre de Control: horas arriba del 75% o margen
 * por debajo de la meta. Ver la nota de tieneRiesgoScopeCreep. */
export function clienteEnRiesgo(resumen: ResumenSolop): boolean {
  if (resumen.ratio_horas !== null && resumen.ratio_horas > UMBRAL_ALERTA_HORAS) {
    return true;
  }
  return resumen.margen_pct !== null && resumen.margen_pct < META_MARGEN;
}

/** Etiqueta corta para la tarjeta: "PO Leticia · 9 ejecutores". */
export function resumenSquad(miembros: SquadMiembro[]): string {
  const po = miembros.find((m) => m.rol_squad === "PO");
  const ejecutores = miembros.filter((m) => m.rol_squad === "Ejecutor").length;

  const partes: string[] = [];
  if (po) partes.push(`PO ${po.nombre}`);
  if (ejecutores > 0) {
    partes.push(`${ejecutores} ejecutor${ejecutores > 1 ? "es" : ""}`);
  }
  return partes.length > 0 ? partes.join(" · ") : "Sin squad cargado";
}

export function miembrosPorRol(
  miembros: SquadMiembro[],
  rol: SquadMiembro["rol_squad"]
): SquadMiembro[] {
  return miembros.filter((m) => m.rol_squad === rol);
}

/** Las métricas se muestran agrupadas por nivel: negocio, performance,
 * operación. Devuelve las tres listas aunque alguna venga vacía, así la
 * pantalla no tiene que preguntar. */
export function metricasPorNivel(metricas: MetricaCliente[]): {
  nivel1: MetricaCliente[];
  nivel2: MetricaCliente[];
  nivel3: MetricaCliente[];
} {
  return {
    nivel1: metricas.filter((m) => m.nivel === 1),
    nivel2: metricas.filter((m) => m.nivel === 2),
    nivel3: metricas.filter((m) => m.nivel === 3),
  };
}

export interface ConsolidadoCartera {
  facturacion_total: number;
  margen_global: number | null;
  rendimiento_medio: number | null;
  squads_en_riesgo: number;
}

/** Los cuatro números de arriba del Kata Board.
 *
 * "Margen global" y no "margen promedio": se calcula sobre la facturación
 * total de la cartera, no promediando los márgenes de cada cuenta. Con
 * cuentas de tamaños muy distintos, el promedio de porcentajes exagera el
 * peso de las chicas. */
export function consolidadoCartera(
  resumenes: ResumenSolop[]
): ConsolidadoCartera {
  const facturacion_total = suma(resumenes, (r) => r.facturacion_total);
  const costo_total = suma(resumenes, (r) => r.costo_operativo);
  const horas_totales = suma(resumenes, (r) => r.horas_consumidas);

  return {
    facturacion_total,
    margen_global:
      facturacion_total > 0
        ? redondear1(((facturacion_total - costo_total) / facturacion_total) * 100)
        : null,
    rendimiento_medio:
      horas_totales > 0 ? Math.round(facturacion_total / horas_totales) : null,
    squads_en_riesgo: resumenes.filter(clienteEnRiesgo).length,
  };
}

export const fmtPesos = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
