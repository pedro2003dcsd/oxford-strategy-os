"use client";

import { useState } from "react";
import clsx from "clsx";
import { Avatar } from "@/components/Avatar";
import {
  BorrarCondicion,
  BorrarExperimento,
  CondicionModal,
  ExperimentoModal,
  SelectorEstado,
} from "@/components/clientes/KataFormularios";
import {
  consolidadoCartera,
  fmtPesos,
  type ResumenSolop,
} from "@/lib/clientes-logic";
import { META_MARGEN } from "@/lib/solop-logic";
import { ESTADO_PDCA_LABELS } from "@/lib/types";
import type { ClienteCompleto, CondicionConExperimentos } from "@/lib/clientes";
import type { Cliente, EstadoPdca, KataCondicion } from "@/lib/types";

const PESTANAS = [
  { id: "condicion", emoji: "📍", label: "Condición Objetivo" },
  { id: "pdca", emoji: "🔄", label: "PDCA (Experimentos)" },
  { id: "rentabilidad", emoji: "💰", label: "Rentabilidad ($/h)" },
] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

const TONO_EXPERIMENTO: Record<EstadoPdca, string> = {
  planificado: "bg-linea/60 text-tenue",
  en_curso: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  validado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  descartado: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
};

const botonAlta =
  "w-full rounded-lg border border-dashed border-linea-fuerte px-3 py-2 text-xs font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground";

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

function CondicionObjetivoTab({
  condiciones,
  clientes,
  nombrePorCliente,
}: {
  condiciones: CondicionConExperimentos[];
  clientes: Cliente[];
  nombrePorCliente: Map<string, string>;
}) {
  return (
    <div className="space-y-3">
      <CondicionModal
        clientes={clientes}
        triggerLabel="➕ Crear Condición Objetivo"
        triggerClassName={botonAlta}
      />

      {condiciones.length === 0 ? (
        <p className="rounded-lg border border-dashed border-linea p-6 text-center text-sm text-tenue">
          Sin condiciones objetivo cargadas. Es el punto de partida del Kata:
          dónde queremos estar con esta cuenta.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {condiciones.map((co) => {
            const activos = co.pdca_experimentos.filter(
              (e) => e.estado === "en_curso" || e.estado === "planificado"
            ).length;

            return (
              <article
                key={co.id}
                className="flex flex-col gap-3 rounded-xl border border-linea bg-panel p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-tenue">
                      {nombrePorCliente.get(co.cliente_id) ?? "Cliente sin nombre"}
                    </p>
                    <h3 className="text-sm font-semibold leading-snug">
                      {co.titulo}
                    </h3>
                  </div>
                  {co.responsable_nombre && (
                    <Avatar nombre={co.responsable_nombre} conNombre={false} />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-tenue">{co.meta ?? "—"}</span>
                    <span className="text-sm font-semibold">
                      {co.progreso_porcentaje}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
                    <div
                      className="h-full rounded-full bg-oxford transition-all"
                      style={{
                        width: `${Math.min(100, co.progreso_porcentaje)}%`,
                      }}
                    />
                  </div>
                </div>

                {co.obstaculo_actual && (
                  <div className="rounded-md bg-red-500/10 px-2.5 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                      Obstáculo actual
                    </p>
                    <p className="text-xs italic leading-snug text-red-700 dark:text-red-300">
                      &ldquo;{co.obstaculo_actual}&rdquo;
                    </p>
                  </div>
                )}

                {co.siguiente_paso && (
                  <div className="rounded-md bg-oxford-suave px-2.5 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-oxford">
                      Siguiente paso
                    </p>
                    <p className="text-xs leading-snug">{co.siguiente_paso}</p>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-tenue">
                    🔄 {activos} experimento{activos === 1 ? "" : "s"} en curso
                  </p>
                  <span className="flex items-center gap-2">
                    <CondicionModal
                      clientes={clientes}
                      condicion={co}
                      triggerLabel="Editar"
                      triggerClassName="text-[11px] text-tenue transition hover:text-foreground"
                    />
                    <BorrarCondicion condicionId={co.id} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PdcaTab({
  condiciones,
  nombrePorCliente,
}: {
  condiciones: CondicionConExperimentos[];
  nombrePorCliente: Map<string, string>;
}) {
  const paraSelect = condiciones.map((c) => ({
    ...(c as KataCondicion),
    clienteNombre: nombrePorCliente.get(c.cliente_id) ?? "—",
  }));

  const experimentos = condiciones.flatMap((c) =>
    c.pdca_experimentos.map((e) => ({
      experimento: e,
      condicion: c,
      clienteNombre: nombrePorCliente.get(c.cliente_id) ?? "—",
    }))
  );

  return (
    <div className="space-y-2">
      <ExperimentoModal
        condiciones={paraSelect}
        triggerLabel="➕ Crear Experimento"
        triggerClassName={botonAlta}
      />

      {condiciones.length === 0 ? (
        <p className="rounded-lg border border-dashed border-linea p-6 text-center text-sm text-tenue">
          Primero hace falta una condición objetivo: un experimento siempre
          cuelga de una.
        </p>
      ) : experimentos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-linea p-6 text-center text-sm text-tenue">
          Sin experimentos cargados todavía.
        </p>
      ) : (
        experimentos.map(({ experimento: e, condicion, clienteNombre }) => (
          <article
            key={e.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-linea bg-panel p-3.5"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-tenue">
                {clienteNombre} · {condicion.titulo}
              </p>
              <p className="text-sm leading-snug">{e.hipotesis}</p>
              {e.experimento && (
                <p className="text-xs text-tenue">{e.experimento}</p>
              )}
              {e.aprendizaje && (
                <p className="rounded-md bg-linea/60 px-2 py-1 text-xs text-tenue">
                  <span className="font-semibold">Aprendizaje:</span>{" "}
                  {e.aprendizaje}
                </p>
              )}
              <div className="flex items-center gap-2 pt-0.5">
                <ExperimentoModal
                  condiciones={paraSelect}
                  experimento={e}
                  triggerLabel="Editar"
                  triggerClassName="text-[11px] text-tenue transition hover:text-foreground"
                />
                <BorrarExperimento experimentoId={e.id} />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  TONO_EXPERIMENTO[e.estado]
                )}
              >
                {ESTADO_PDCA_LABELS[e.estado]}
              </span>
              <SelectorEstado experimento={e} />
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function RentabilidadTab({ clientes }: { clientes: ClienteCompleto[] }) {
  const conRendimiento = clientes.filter((c) => c.solop.rendimiento_hora !== null);

  if (conRendimiento.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-linea p-6 text-center text-sm text-tenue">
        Sin horas ni facturación cargadas en SOLOP. La rentabilidad por hora
        sale de ahí.
      </p>
    );
  }

  const ordenados = [...conRendimiento].sort(
    (a, b) => (a.solop.rendimiento_hora ?? 0) - (b.solop.rendimiento_hora ?? 0)
  );
  const maxRend = Math.max(
    ...conRendimiento.map((c) => c.solop.rendimiento_hora ?? 0)
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-linea">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-linea text-left text-xs uppercase tracking-wide text-tenue">
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Facturación</th>
            <th className="px-4 py-3">Horas</th>
            <th className="min-w-[180px] px-4 py-3">Rendimiento por hora</th>
            <th className="px-4 py-3">Margen</th>
          </tr>
        </thead>
        <tbody>
          {ordenados.map((c) => {
            const margen = c.solop.margen_pct;
            const critico = margen !== null && margen < META_MARGEN;
            const rend = c.solop.rendimiento_hora ?? 0;

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
                <td className="px-4 py-3 text-tenue">
                  {fmtPesos(c.solop.facturacion_total)}
                </td>
                <td className="px-4 py-3 text-tenue">
                  {c.solop.horas_consumidas} / {c.solop.horas_presupuestadas} hs
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
                    {fmtPesos(rend)}/h
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-linea">
                    <div
                      className={clsx(
                        "h-full rounded-full",
                        critico ? "bg-red-500" : "bg-emerald-500"
                      )}
                      style={{
                        width: `${Math.max(3, maxRend > 0 ? (rend / maxRend) * 100 : 0)}%`,
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
                    {margen === null ? "—" : `${margen}%`}
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

export function KataBoard({
  clientes,
  condiciones,
}: {
  clientes: ClienteCompleto[];
  condiciones: CondicionConExperimentos[];
}) {
  const [pestana, setPestana] = useState<Pestana>("condicion");

  const nombrePorCliente = new Map(clientes.map((c) => [c.id, c.nombre]));
  const resumenes: ResumenSolop[] = clientes.map((c) => c.solop);
  const c = consolidadoCartera(resumenes);

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
        <Kpi label="Facturación total" valor={fmtPesos(c.facturacion_total)} />
        <Kpi
          label="Utilidad bruta global"
          valor={c.margen_global === null ? "—" : `${c.margen_global}%`}
        />
        <Kpi
          label="Rendimiento medio"
          valor={
            c.rendimiento_medio === null
              ? "—"
              : `${fmtPesos(c.rendimiento_medio)}/h`
          }
        />
        <Kpi
          label="Squads en riesgo"
          valor={String(c.squads_en_riesgo)}
          tono={c.squads_en_riesgo > 0 ? "alerta" : undefined}
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

      {pestana === "condicion" && (
        <CondicionObjetivoTab
          condiciones={condiciones}
          clientes={clientes}
          nombrePorCliente={nombrePorCliente}
        />
      )}
      {pestana === "pdca" && (
        <PdcaTab condiciones={condiciones} nombrePorCliente={nombrePorCliente} />
      )}
      {pestana === "rentabilidad" && <RentabilidadTab clientes={clientes} />}
    </div>
  );
}
