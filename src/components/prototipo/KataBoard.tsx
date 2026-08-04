"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  CLIENTES,
  CONDICIONES_OBJETIVO,
  EXPERIMENTOS,
  ESTADO_EXPERIMENTO_LABELS,
  clientePorId,
  consolidado,
  fmtPesos,
  type ExperimentoPdca,
} from "@/lib/prototipo/clientes";
import { Avatar } from "@/components/Avatar";

const PESTANAS = [
  { id: "condicion", emoji: "📍", label: "Condición Objetivo" },
  { id: "pdca", emoji: "🔄", label: "PDCA (Experimentos)" },
  { id: "rentabilidad", emoji: "💰", label: "Rentabilidad ($/h)" },
] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

const TONO_EXPERIMENTO: Record<ExperimentoPdca["estado"], string> = {
  planificado: "bg-linea/60 text-tenue",
  en_curso: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  medido: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  cerrado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

function Kpi({
  label,
  valor,
  tono,
}: {
  label: string;
  valor: string;
  tono?: "alerta";
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-4",
        tono === "alerta"
          ? "border-red-500/30 bg-red-500/5"
          : "border-linea bg-panel"
      )}
    >
      <p className="text-xs font-medium text-tenue">{label}</p>
      <p className="text-2xl font-semibold">{valor}</p>
    </div>
  );
}

function CondicionObjetivoTab() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CONDICIONES_OBJETIVO.map((co) => {
        const cliente = clientePorId(co.clienteId);
        const activos = EXPERIMENTOS.filter(
          (e) =>
            e.clienteId === co.clienteId &&
            (e.estado === "en_curso" || e.estado === "planificado")
        ).length;

        return (
          <article
            key={co.clienteId}
            className="flex flex-col gap-3 rounded-xl border border-linea bg-panel p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-tenue">
                  {cliente.nombre}
                </p>
                <h3 className="text-sm font-semibold leading-snug">{co.titulo}</h3>
              </div>
              <Avatar nombre={co.responsable} conNombre={false} />
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-tenue">{co.metrica}</span>
                <span className="text-sm font-semibold">{co.progreso}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
                <div
                  className="h-full rounded-full bg-oxford transition-all"
                  style={{ width: `${co.progreso}%` }}
                />
              </div>
            </div>

            <div className="rounded-md bg-red-500/10 px-2.5 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                Obstáculo actual
              </p>
              <p className="text-xs italic leading-snug text-red-700 dark:text-red-300">
                &ldquo;{co.obstaculo}&rdquo;
              </p>
            </div>

            <div className="rounded-md bg-oxford-suave px-2.5 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-oxford">
                Siguiente paso
              </p>
              <p className="text-xs leading-snug">{co.siguientePaso}</p>
            </div>

            <p className="mt-auto text-xs text-tenue">
              🔄 {activos} experimento{activos === 1 ? "" : "s"} en curso
            </p>
          </article>
        );
      })}
    </div>
  );
}

function PdcaTab() {
  return (
    <div className="space-y-2">
      {EXPERIMENTOS.map((e) => {
        const cliente = clientePorId(e.clienteId);
        return (
          <article
            key={e.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-linea bg-panel p-3.5"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-tenue">
                {cliente.nombre}
              </p>
              <p className="text-sm leading-snug">{e.hipotesis}</p>
              {e.aprendizaje && (
                <p className="rounded-md bg-linea/60 px-2 py-1 text-xs text-tenue">
                  <span className="font-semibold">Aprendizaje:</span>{" "}
                  {e.aprendizaje}
                </p>
              )}
            </div>
            <span
              className={clsx(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                TONO_EXPERIMENTO[e.estado]
              )}
            >
              {ESTADO_EXPERIMENTO_LABELS[e.estado]}
            </span>
          </article>
        );
      })}
    </div>
  );
}

function RentabilidadTab() {
  const ordenados = [...CLIENTES].sort(
    (a, b) => a.rendimientoHora - b.rendimientoHora
  );
  const maxRend = Math.max(...CLIENTES.map((c) => c.rendimientoHora));

  return (
    <div className="overflow-x-auto rounded-xl border border-linea">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-linea text-left text-xs uppercase tracking-wide text-tenue">
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Facturación</th>
            <th className="px-4 py-3">Horas</th>
            <th className="px-4 py-3 min-w-[180px]">Rendimiento por hora</th>
            <th className="px-4 py-3">Margen</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((c) => {
            const critico = c.margenPct < 65;
            return (
              <tr key={c.id} className="border-b border-linea last:border-0">
                <td className="px-4 py-3 font-medium">
                  {c.nombre}
                  {critico && (
                    <span className="mt-0.5 block text-[11px] font-normal text-red-700 dark:text-red-400">
                      ⚠️ Rentabilidad crítica
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-tenue">{fmtPesos(c.feeMensual)}</td>
                <td className="px-4 py-3 text-tenue">
                  {c.horasConsumidas} / {c.horasPresupuestadas} hs
                </td>
                <td className="px-4 py-3">
                  <p
                    className={clsx(
                      "font-semibold",
                      critico
                        ? "text-red-700 dark:text-red-400"
                        : "text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    {fmtPesos(c.rendimientoHora)}/h
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-linea">
                    <div
                      className={clsx(
                        "h-full rounded-full",
                        critico ? "bg-red-500" : "bg-emerald-500"
                      )}
                      style={{
                        width: `${Math.max(3, (c.rendimientoHora / maxRend) * 100)}%`,
                      }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "font-semibold",
                      critico
                        ? "text-red-700 dark:text-red-400"
                        : "text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    {c.margenPct}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function KataBoard() {
  const [pestana, setPestana] = useState<Pestana>("condicion");
  const c = consolidado();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Kata Board</h1>
        <p className="text-sm text-tenue">
          Mejora continua con Toyota Kata: dónde queremos estar, qué nos frena y
          qué estamos probando para destrabarlo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Facturación total" valor={fmtPesos(c.facturacionTotal)} />
        <Kpi label="Utilidad bruta global" valor={`${c.margenPromedio}%`} />
        <Kpi label="Rendimiento medio" valor={`${fmtPesos(c.rendimientoMedio)}/h`} />
        <Kpi
          label="Squads en riesgo"
          valor={String(c.squadsEnRiesgo)}
          tono={c.squadsEnRiesgo > 0 ? "alerta" : undefined}
        />
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-linea/60 p-1">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestana(p.id)}
            className={clsx(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              pestana === p.id
                ? "bg-panel text-foreground shadow-sm"
                : "text-tenue hover:text-foreground"
            )}
          >
            <span aria-hidden>{p.emoji}</span> {p.label}
          </button>
        ))}
      </div>

      {pestana === "condicion" && <CondicionObjetivoTab />}
      {pestana === "pdca" && <PdcaTab />}
      {pestana === "rentabilidad" && <RentabilidadTab />}
    </div>
  );
}
