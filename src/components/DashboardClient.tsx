"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { AREAS } from "@/lib/types";
import type { KeyResultCompleto } from "@/lib/types";
import { hasAlertaRentabilidad } from "@/lib/kr-logic";
import { KrCard } from "@/components/KrCard";

const AREA_ORDER = [...AREAS, "Sin área asignada"];

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "red";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
        tone === "emerald" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        tone === "amber" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        tone === "red" && "bg-red-500/10 text-red-700 dark:text-red-400"
      )}
    >
      {label}
      <span className="font-semibold">{value}</span>
    </span>
  );
}

export function DashboardClient({ krs }: { krs: KeyResultCompleto[] }) {
  const [modoLom, setModoLom] = useState(false);

  const visibles = useMemo(
    () => (modoLom ? krs.filter((kr) => kr.estado_semaforo !== "verde") : krs),
    [krs, modoLom]
  );

  const counts = useMemo(
    () =>
      krs.reduce(
        (acc, kr) => {
          acc[kr.estado_semaforo]++;
          if (hasAlertaRentabilidad(kr)) acc.alertaRentabilidad++;
          return acc;
        },
        { verde: 0, amarillo: 0, rojo: 0, alertaRentabilidad: 0 }
      ),
    [krs]
  );

  const grupos = useMemo(() => {
    const porArea = new Map<string, KeyResultCompleto[]>();
    for (const kr of visibles) {
      const area = kr.okr_trimestral?.area ?? "Sin área asignada";
      if (!porArea.has(area)) porArea.set(area, []);
      porArea.get(area)!.push(kr);
    }
    return [...porArea.entries()].sort(
      (a, b) => AREA_ORDER.indexOf(a[0]) - AREA_ORDER.indexOf(b[0])
    );
  }, [visibles]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <StatPill label="Verde" value={counts.verde} tone="emerald" />
          <StatPill label="Amarillo" value={counts.amarillo} tone="amber" />
          <StatPill label="Rojo" value={counts.rojo} tone="red" />
          {counts.alertaRentabilidad > 0 && (
            <StatPill
              label="Alerta rentabilidad"
              value={counts.alertaRentabilidad}
              tone="red"
            />
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={modoLom}
            onChange={(e) => setModoLom(e.target.checked)}
            className="h-4 w-4 rounded border-black/20 dark:border-white/30"
          />
          <span className="font-medium">Modo LOM — solo amarillo/rojo</span>
        </label>
      </div>

      {grupos.length === 0 && (
        <p className="text-sm text-neutral-500">
          {modoLom
            ? "Nada en riesgo o retrasado. Todo verde."
            : "Todavía no hay Key Results cargados."}
        </p>
      )}

      {grupos.map(([area, items]) => (
        <section key={area} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {area}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((kr) => (
              <KrCard key={kr.id} kr={kr} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
