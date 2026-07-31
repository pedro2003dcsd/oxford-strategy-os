import Link from "next/link";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import type { KeyResultCompleto } from "@/lib/types";
import { formatValor, hasAlertaRentabilidad, progresoPct } from "@/lib/kr-logic";

export function KrCard({ kr }: { kr: KeyResultCompleto }) {
  const alerta = hasAlertaRentabilidad(kr);

  return (
    <Link
      href={`/kr/${kr.id}`}
      className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 transition hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{kr.titulo}</p>
        <SemaforoBadge estado={kr.estado_semaforo} compact />
      </div>

      {kr.okr_trimestral && (
        <p className="text-xs text-neutral-500">
          {kr.okr_trimestral.titulo} · {kr.okr_trimestral.trimestre}{" "}
          {kr.okr_trimestral.anio}
        </p>
      )}

      {kr.tipo_medicion !== "hitos" ? (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-neutral-900 dark:bg-white"
              style={{ width: `${progresoPct(kr)}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500">
            {formatValor(kr.valor_actual, kr.tipo_medicion)} /{" "}
            {formatValor(kr.valor_meta, kr.tipo_medicion)}
          </p>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          {kr.hitos_kr.filter((h) => h.cumplido).length} / {kr.hitos_kr.length}{" "}
          hitos cumplidos
        </p>
      )}

      {alerta && (
        <p className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400">
          ⚠ Cumplido, pero margen real ({kr.margen_actual_pct}%) por debajo del
          esperado ({kr.margen_utilidad_esperado}%)
        </p>
      )}
    </Link>
  );
}
