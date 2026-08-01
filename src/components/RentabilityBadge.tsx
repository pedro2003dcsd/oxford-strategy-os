import clsx from "clsx";
import type { KeyResult } from "@/lib/types";

/** Insignia de desvío de margen SOLOP: se muestra en cualquier módulo cuando
 * el margen real cargado está por debajo del esperado, sin importar si el KR
 * está cumplido o no. */
export function RentabilityBadge({ kr }: { kr: KeyResult }) {
  if (kr.margen_actual_pct == null) return null;
  if (kr.margen_actual_pct >= kr.margen_utilidad_esperado) return null;

  const critico = kr.margen_actual_pct < 50;

  return (
    <span
      title={`Margen real ${kr.margen_actual_pct}% — esperado ${kr.margen_utilidad_esperado}%`}
      className={clsx(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        critico
          ? "bg-red-500/10 text-red-700 dark:text-red-400"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      )}
    >
      $ {kr.margen_actual_pct}%
    </span>
  );
}
