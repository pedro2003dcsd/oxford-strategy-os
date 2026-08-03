import type { ProyectoSolop } from "@/lib/types";

export const META_MARGEN = 65;
export const UMBRAL_ALERTA_HORAS = 0.75;
export const UMBRAL_SCOPE_CREEP = 0.9;

export type EstadoFinanciero = "saludable" | "en_alerta" | "en_perdida";

export const ESTADO_FINANCIERO_LABELS: Record<EstadoFinanciero, string> = {
  saludable: "Saludable",
  en_alerta: "En alerta",
  en_perdida: "En pérdida",
};

/** Margen de utilidad real (%) a partir de facturación y costo operativo. */
export function margenReal(p: ProyectoSolop): number | null {
  if (p.facturacion_total <= 0) return null;
  return (
    Math.round(
      ((p.facturacion_total - p.costo_operativo) / p.facturacion_total) * 1000
    ) / 10
  );
}

/** Bandas: >=65 saludable (verde), 50-65 en alerta (amarillo), <50 en pérdida (rojo). */
export function estadoFinanciero(p: ProyectoSolop): EstadoFinanciero | null {
  const margen = margenReal(p);
  if (margen === null) return null;
  if (margen >= META_MARGEN) return "saludable";
  if (margen >= 50) return "en_alerta";
  return "en_perdida";
}

export function ratioHoras(p: ProyectoSolop): number | null {
  if (p.horas_presupuestadas <= 0) return null;
  return p.horas_consumidas / p.horas_presupuestadas;
}

export function advertenciaHoras(p: ProyectoSolop): string | null {
  const ratio = ratioHoras(p);
  if (ratio === null) return null;
  if (ratio >= UMBRAL_SCOPE_CREEP) return "Riesgo de scope creep (90% de horas)";
  if (ratio >= UMBRAL_ALERTA_HORAS) return "Consumo de horas al 75%";
  return null;
}

export function tieneAlertaRentabilidad(p: ProyectoSolop): boolean {
  const margen = margenReal(p);
  return margen !== null && margen < META_MARGEN;
}

/** Riesgo de scope creep para el contador de la Torre de Control. Con el
 * umbral viejo (90% de horas) un proyecto como Batistella, con 88% de horas
 * consumidas y el margen ya caído a 54%, no contaba: justo el caso que hay
 * que ver. Ahora dispara con horas arriba del 75% o margen bajo la meta. */
export function tieneRiesgoScopeCreep(p: ProyectoSolop): boolean {
  const ratio = ratioHoras(p);
  if (ratio !== null && ratio > UMBRAL_ALERTA_HORAS) return true;
  return tieneAlertaRentabilidad(p);
}

/** Brecha en puntos entre el consumo de horas y el avance real del objetivo.
 * Positiva quiere decir que se gastaron más horas de las que justifica el
 * resultado. */
export const BRECHA_SCOPE_CREEP = 15;

export function brechaHorasVsAvance(
  p: ProyectoSolop,
  avanceKrPct: number | null
): number | null {
  const ratio = ratioHoras(p);
  if (ratio === null || avanceKrPct === null) return null;
  return Math.round(ratio * 100) - avanceKrPct;
}

export function costoPorHora(p: ProyectoSolop): number | null {
  if (p.horas_consumidas <= 0) return null;
  return p.costo_operativo / p.horas_consumidas;
}

export function facturacionPorHora(p: ProyectoSolop): number | null {
  if (p.horas_consumidas <= 0) return null;
  return p.facturacion_total / p.horas_consumidas;
}
