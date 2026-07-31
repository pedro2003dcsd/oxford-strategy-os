import type { HitoKr, KeyResult } from "@/lib/types";

type KrConHitos = KeyResult & { hitos_kr: HitoKr[] };

/** Un KR se considera cumplido si llegó a la meta numérica, o si (siendo
 * cualitativo) tiene al menos un hito y todos están marcados como cumplidos. */
export function isKrCumplido(kr: KrConHitos): boolean {
  if (kr.tipo_medicion === "hitos") {
    return kr.hitos_kr.length > 0 && kr.hitos_kr.every((h) => h.cumplido);
  }
  return kr.valor_actual >= kr.valor_meta;
}

/** Alerta de rentabilidad (scope creep): el KR se dio por cumplido pero el
 * margen real cargado desde SOLOP está por debajo del margen esperado. */
export function hasAlertaRentabilidad(kr: KrConHitos): boolean {
  return (
    isKrCumplido(kr) &&
    kr.margen_actual_pct != null &&
    kr.margen_actual_pct < kr.margen_utilidad_esperado
  );
}

export function progresoPct(kr: KeyResult): number {
  const rango = kr.valor_meta - kr.valor_inicial;
  if (rango === 0) return kr.valor_actual >= kr.valor_meta ? 100 : 0;
  const pct = ((kr.valor_actual - kr.valor_inicial) / rango) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function formatValor(valor: number, tipo: KeyResult["tipo_medicion"]): string {
  switch (tipo) {
    case "porcentaje":
      return `${valor}%`;
    case "moneda":
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(valor);
    default:
      return `${valor}`;
  }
}
