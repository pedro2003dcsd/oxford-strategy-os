"use client";

import clsx from "clsx";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { RentabilityBadge } from "@/components/RentabilityBadge";
import { Avatar } from "@/components/Avatar";
import { IniciativasContador } from "@/components/IniciativasPanel";
import type { CheckIn, KeyResultCompleto } from "@/lib/types";
import { formatValor, hasAlertaRentabilidad, progresoPct } from "@/lib/kr-logic";

export function KrCard({
  kr,
  ultimoBloqueo,
  onSelect,
}: {
  kr: KeyResultCompleto;
  ultimoBloqueo?: CheckIn | null;
  onSelect: (kr: KeyResultCompleto) => void;
}) {
  const alerta = hasAlertaRentabilidad(kr);
  const responsable = kr.okr_trimestral?.responsable;

  return (
    <button
      type="button"
      onClick={() => onSelect(kr)}
      className={clsx(
        "flex flex-col gap-2.5 rounded-xl border bg-panel p-4 text-left transition hover:border-oxford/50 hover:shadow-sm",
        kr.estado_semaforo === "rojo"
          ? "border-red-500/40"
          : kr.estado_semaforo === "amarillo"
            ? "border-amber-500/40"
            : "border-linea"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{kr.titulo}</p>
        <span className="flex shrink-0 items-center gap-1.5">
          <RentabilityBadge kr={kr} />
          <SemaforoBadge estado={kr.estado_semaforo} compact />
        </span>
      </div>

      {responsable && <Avatar nombre={responsable} />}

      {kr.okr_trimestral && (
        <p className="text-xs text-tenue">
          {kr.okr_trimestral.titulo} · {kr.okr_trimestral.trimestre}{" "}
          {kr.okr_trimestral.anio}
        </p>
      )}

      {kr.tipo_medicion !== "hitos" ? (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
            <div
              className="h-full rounded-full bg-oxford"
              style={{ width: `${progresoPct(kr)}%` }}
            />
          </div>
          <p className="text-xs text-tenue">
            {formatValor(kr.valor_actual, kr.tipo_medicion)} /{" "}
            {formatValor(kr.valor_meta, kr.tipo_medicion)}
          </p>
        </div>
      ) : (
        <p className="text-xs text-tenue">
          {kr.hitos_kr.filter((h) => h.cumplido).length} / {kr.hitos_kr.length}{" "}
          hitos cumplidos
        </p>
      )}

      <IniciativasContador iniciativas={kr.iniciativas ?? []} />

      {alerta && (
        <p className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400">
          ⚠ Cumplido, pero margen real ({kr.margen_actual_pct}%) por debajo del
          esperado ({kr.margen_utilidad_esperado}%)
        </p>
      )}

      {ultimoBloqueo?.comentario_bloqueos && (
        <p className="rounded-md bg-amber-500/10 px-2 py-1.5 text-xs leading-snug text-amber-800 dark:text-amber-300">
          <span className="font-semibold">⚠️ Bloqueo:</span>{" "}
          {ultimoBloqueo.comentario_bloqueos}
        </p>
      )}
    </button>
  );
}
