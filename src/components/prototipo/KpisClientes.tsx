"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  CLIENTES,
  EXPEDIENTES,
  clientePorId,
  type Evaluacion,
} from "@/lib/prototipo/clientes";

function tonoPuntaje(p: number): string {
  if (p >= 4) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (p >= 3) return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  return "bg-red-500/15 text-red-700 dark:text-red-300";
}

function Estrellas({ puntaje }: { puntaje: number }) {
  return (
    <span className="whitespace-nowrap text-sm" aria-label={`${puntaje} de 5`}>
      <span className="text-oxford">{"★".repeat(puntaje)}</span>
      <span className="text-tenue/40">{"★".repeat(5 - puntaje)}</span>
    </span>
  );
}

function promedio(evs: Evaluacion[]): number {
  if (evs.length === 0) return 0;
  return Math.round((evs.reduce((a, e) => a + e.puntaje, 0) / evs.length) * 10) / 10;
}

function BloqueEvaluacion({
  titulo,
  bajada,
  evaluaciones,
}: {
  titulo: string;
  bajada: string;
  evaluaciones: Evaluacion[];
}) {
  const prom = promedio(evaluaciones);

  return (
    <section className="space-y-3 rounded-xl border border-linea bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{titulo}</h3>
          <p className="text-xs text-tenue">{bajada}</p>
        </div>
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-sm font-semibold",
            tonoPuntaje(prom)
          )}
        >
          {prom}
        </span>
      </div>

      <ul className="space-y-2">
        {evaluaciones.map((e) => (
          <li
            key={e.criterio}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-linea pb-2 last:border-0 last:pb-0"
          >
            <span className="text-sm">{e.criterio}</span>
            <Estrellas puntaje={e.puntaje} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KpisClientes() {
  const [id, setId] = useState(CLIENTES[0].id);
  const cliente = clientePorId(id);
  const exp = EXPEDIENTES.find((e) => e.clienteId === id) ?? EXPEDIENTES[0];

  const ultimo = exp.tendencia[exp.tendencia.length - 1];
  const anterior = exp.tendencia[exp.tendencia.length - 2];
  const delta = Math.round((ultimo.puntaje - anterior.puntaje) * 10) / 10;
  const maxTendencia = 5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">KPIs Clientes</h1>
        <p className="text-sm text-tenue">
          Evaluación 360 bidireccional y matriz de salud de cada cuenta.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CLIENTES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setId(c.id)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              c.id === id
                ? "border-oxford bg-oxford text-white"
                : "border-linea text-tenue hover:border-oxford/50 hover:text-foreground"
            )}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <p className="text-sm text-tenue">
        Expediente de <span className="font-semibold text-foreground">{cliente.nombre}</span>{" "}
        · {cliente.squad}
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <BloqueEvaluacion
          titulo="Cliente → Oxford"
          bajada="Cómo nos califica el cliente."
          evaluaciones={exp.clienteHaciaOxford}
        />
        <BloqueEvaluacion
          titulo="Oxford → Cliente"
          bajada="Cómo califica el squad al cliente."
          evaluaciones={exp.oxfordHaciaCliente}
        />
      </div>

      <section className="space-y-3 rounded-xl border border-linea bg-panel p-4">
        <div>
          <h3 className="text-sm font-semibold">Objetivos comerciales</h3>
          <p className="text-xs text-tenue">
            Cada sub-métrica puntuada de 1 a 5.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {exp.objetivosComerciales.map((o) => (
            <div
              key={o.criterio}
              className="flex items-center justify-between gap-2 rounded-lg border border-linea px-3 py-2.5"
            >
              <span className="min-w-0 text-sm">{o.criterio}</span>
              <span
                className={clsx(
                  "shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold",
                  tonoPuntaje(o.puntaje)
                )}
              >
                {o.puntaje}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-linea bg-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Tendencia de los últimos 3 meses</h3>
            <p className="text-xs text-tenue">
              Si la cuenta mejora o se deteriora.
            </p>
          </div>
          <span
            className={clsx(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              delta > 0
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : delta < 0
                  ? "bg-red-500/15 text-red-700 dark:text-red-300"
                  : "bg-linea/60 text-tenue"
            )}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {Math.abs(delta)} vs mes anterior
          </span>
        </div>

        <div className="flex items-end gap-4">
          {exp.tendencia.map((t) => (
            <div key={t.mes} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-sm font-semibold">{t.puntaje}</span>
              <div className="flex h-24 w-full items-end">
                <div
                  className={clsx(
                    "w-full rounded-t-md transition-all",
                    t.puntaje >= 4
                      ? "bg-emerald-500"
                      : t.puntaje >= 3
                        ? "bg-amber-500"
                        : "bg-red-500"
                  )}
                  style={{ height: `${(t.puntaje / maxTendencia) * 100}%` }}
                />
              </div>
              <span className="text-xs text-tenue">{t.mes}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
