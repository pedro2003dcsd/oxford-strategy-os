"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { AREAS, TRIMESTRES } from "@/lib/types";
import type { KeyResultCompleto } from "@/lib/types";
import { hasAlertaRentabilidad } from "@/lib/kr-logic";
import { KrCard } from "@/components/KrCard";
import { EstrellaPolar } from "@/components/EstrellaPolar";

const AREA_ORDER = [...AREAS, "Sin área asignada"];

function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/10">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={clsx(
            "rounded-md px-2.5 py-1 text-xs font-medium transition",
            value === opt
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

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

const TRIM_OPTIONS = ["Todos", ...TRIMESTRES] as const;
const AREA_OPTIONS = ["Todas", ...AREAS] as const;

export function DashboardClient({ krs }: { krs: KeyResultCompleto[] }) {
  const [modoLom, setModoLom] = useState(false);
  const [trimestre, setTrimestre] = useState<(typeof TRIM_OPTIONS)[number]>("Todos");
  const [area, setArea] = useState<(typeof AREA_OPTIONS)[number]>("Todas");

  const filtrados = useMemo(
    () =>
      krs.filter((kr) => {
        if (trimestre !== "Todos" && kr.okr_trimestral?.trimestre !== trimestre)
          return false;
        if (area !== "Todas" && kr.okr_trimestral?.area !== area) return false;
        return true;
      }),
    [krs, trimestre, area]
  );

  const visibles = useMemo(
    () =>
      modoLom
        ? filtrados.filter((kr) => kr.estado_semaforo !== "verde")
        : filtrados,
    [filtrados, modoLom]
  );

  const counts = useMemo(
    () =>
      filtrados.reduce(
        (acc, kr) => {
          acc[kr.estado_semaforo]++;
          if (hasAlertaRentabilidad(kr)) acc.alertaRentabilidad++;
          return acc;
        },
        { verde: 0, amarillo: 0, rojo: 0, alertaRentabilidad: 0 }
      ),
    [filtrados]
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
      <EstrellaPolar krs={krs} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs options={TRIM_OPTIONS} value={trimestre} onChange={setTrimestre} />
          <FilterTabs options={AREA_OPTIONS} value={area} onChange={setArea} />
        </div>
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
      </div>

      {grupos.length === 0 && (
        <p className="text-sm text-neutral-500">
          {modoLom
            ? "Nada en riesgo o retrasado. Todo verde."
            : "No hay Key Results para este filtro."}
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
