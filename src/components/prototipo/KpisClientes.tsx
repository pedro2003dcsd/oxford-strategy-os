"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  CLIENTES,
  EXPEDIENTES,
  clientePorId,
  type CategoriaValoracion,
  type Evaluacion,
  type KpiCalidad,
} from "@/lib/prototipo/clientes";
import { BannerMaqueta, useToastDemo } from "@/components/prototipo/ToastDemo";

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

/** Matriz de valoración por categoría, con el subtotal de cada bloque. */
function MatrizValoracion({ matriz }: { matriz: CategoriaValoracion[] }) {
  const global =
    Math.round(
      (matriz.reduce((a, c) => a + c.subtotal, 0) / matriz.length) * 10
    ) / 10;

  return (
    <section className="space-y-3 rounded-xl border border-linea bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">
            Matriz de Valoración · escala de impacto 1 a 5
          </h3>
          <p className="text-xs text-tenue">
            Separa lo que depende del cliente de lo que depende de la agencia.
          </p>
        </div>
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-sm font-semibold",
            tonoPuntaje(global)
          )}
        >
          {global} global
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {matriz.map((cat) => (
          <div
            key={cat.titulo}
            className={clsx(
              "space-y-2 rounded-lg border p-3",
              cat.subtotal >= 4
                ? "border-emerald-500/40"
                : cat.subtotal >= 3
                  ? "border-amber-500/40"
                  : "border-red-500/40"
            )}
          >
            <div>
              <p className="text-sm font-semibold">{cat.titulo}</p>
              <p className="text-[11px] text-tenue">{cat.fuente}</p>
            </div>

            <ul className="space-y-1">
              {cat.items.map((i) => (
                <li
                  key={i.criterio}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="min-w-0 text-tenue">{i.criterio}</span>
                  <span
                    className={clsx(
                      "shrink-0 rounded-full px-1.5 py-0.5 font-semibold",
                      tonoPuntaje(i.puntaje)
                    )}
                  >
                    {i.puntaje}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-2 border-t border-linea pt-2">
              <span className="text-xs font-medium">Subtotal</span>
              <span className="flex items-center gap-1.5">
                {cat.etiqueta && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {cat.etiqueta}
                  </span>
                )}
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-sm font-semibold",
                    tonoPuntaje(cat.subtotal)
                  )}
                >
                  {cat.subtotal}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KpisDeCalidad({ kpis }: { kpis: KpiCalidad[] }) {
  return (
    <section className="space-y-3 rounded-xl border border-linea bg-panel p-4">
      <div>
        <h3 className="text-sm font-semibold">KPIs de calidad y entregables</h3>
        <p className="text-xs text-tenue">
          Miden el trabajo de la agencia, no el resultado del negocio.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {kpis.map((k) => (
          <div
            key={k.titulo}
            className={clsx(
              "space-y-1 rounded-lg border p-3",
              k.estado === "verde"
                ? "border-emerald-500/40 bg-emerald-500/5"
                : k.estado === "amarillo"
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-red-500/40 bg-red-500/5"
            )}
          >
            <p className="text-xs font-medium">{k.titulo}</p>
            <p className="text-xl font-semibold">
              {k.estado === "verde" ? "🟢" : k.estado === "amarillo" ? "🟡" : "🔴"}{" "}
              {k.actual}
            </p>
            <p className="text-[11px] text-tenue">Meta {k.meta}</p>
            {k.nota && <p className="text-[11px] text-tenue">{k.nota}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function KpisClientes() {
  const [id, setId] = useState(CLIENTES[0].id);
  const { simular, toast } = useToastDemo();
  const cliente = clientePorId(id);
  const exp = EXPEDIENTES.find((e) => e.clienteId === id) ?? EXPEDIENTES[0];

  const ultimo = exp.tendencia[exp.tendencia.length - 1];
  const anterior = exp.tendencia[exp.tendencia.length - 2];
  const delta = Math.round((ultimo.puntaje - anterior.puntaje) * 10) / 10;
  const maxTendencia = 5;

  return (
    <div className="documento-ejecutivo space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">KPIs Clientes</h1>
          <p className="text-sm text-tenue">
            Evaluación 360 bidireccional y matriz de salud de cada cuenta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={() =>
              simular(
                "Esta acción abrirá el formulario de evaluación del mes para el Squad y el cliente"
              )
            }
            className="rounded-md border border-oxford/40 px-4 py-2 text-sm font-semibold text-oxford transition hover:bg-oxford-suave"
          >
            ✏️ Cargar evaluación del mes
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-oxford px-4 py-2 text-sm font-semibold text-white transition hover:bg-oxford-fuerte"
          >
            📄 Exportar Expediente
          </button>
        </div>
      </div>

      <BannerMaqueta />

      <div className="flex flex-wrap gap-1.5 print:hidden">
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

      {exp.matriz && <MatrizValoracion matriz={exp.matriz} />}
      {exp.kpisCalidad && <KpisDeCalidad kpis={exp.kpisCalidad} />}

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

      {toast}
    </div>
  );
}
