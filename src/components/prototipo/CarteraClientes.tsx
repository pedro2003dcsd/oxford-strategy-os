"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  CLIENTES,
  ESTADO_CLIENTE_LABELS,
  fmtPesos,
  type Cliente,
  type MetricaNivel,
  type Squad,
} from "@/lib/prototipo/clientes";
import { BannerMaqueta, useToastDemo } from "@/components/prototipo/ToastDemo";
import { Avatar } from "@/components/Avatar";

const TONO_ESTADO: Record<Cliente["estado"], string> = {
  activo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  en_riesgo: "bg-red-500/15 text-red-700 dark:text-red-300",
  onboarding: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
};

/** Ficha destacada para PO y Chapter Leads. */
function FichaLider({
  nombre,
  rol,
  destacado = false,
}: {
  nombre: string;
  rol: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded-lg border px-2.5 py-2",
        destacado ? "border-oxford/40 bg-oxford-suave" : "border-linea"
      )}
    >
      <Avatar nombre={nombre} conNombre={false} size="md" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{nombre}</span>
        <span
          className={clsx(
            "block truncate text-[11px]",
            destacado ? "font-medium text-oxford" : "text-tenue"
          )}
        >
          {rol}
        </span>
      </span>
    </div>
  );
}

function ComposicionSquad({ squad }: { squad: Squad }) {
  return (
    <section className="space-y-4 rounded-xl border border-linea bg-panel p-4">
      <div>
        <h3 className="text-sm font-semibold">
          <span aria-hidden>👥</span> Composición del Squad & Ritos
        </h3>
        <p className="text-xs text-tenue">
          Quién responde por la cuenta y con qué ritmo se juntan.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-tenue">
          Liderazgo
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <FichaLider nombre={squad.po} rol="PO / Client Partner" destacado />
          {squad.chapterLeads.map((m) => (
            <FichaLider
              key={`${m.nombre}-${m.rol}`}
              nombre={m.nombre}
              rol={`Chapter Lead · ${m.rol}`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-tenue">
          Equipo ejecutor ({squad.ejecutores.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {squad.ejecutores.map((m) => (
            <span
              key={`${m.nombre}-${m.rol}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-linea px-2.5 py-1 text-xs"
            >
              <span className="font-medium">{m.nombre}</span>
              <span className="text-tenue">· {m.rol}</span>
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-tenue">
          Ceremonias
        </p>
        <div className="flex flex-wrap gap-1.5">
          {squad.ceremonias.map((c) => (
            <span
              key={c}
              className="rounded-full bg-oxford-suave px-2.5 py-1 text-xs font-medium text-oxford"
            >
              🔁 {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function colorBarra(progreso: number): string {
  if (progreso >= 85) return "bg-emerald-500";
  if (progreso >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function FilaMetrica({
  m,
  nivel,
  onSimular,
}: {
  m: MetricaNivel;
  nivel: 1 | 2 | 3;
  onSimular: (texto?: string) => void;
}) {
  return (
    <div className="space-y-1.5 rounded-lg border border-linea p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={clsx("font-medium", nivel === 1 ? "text-base" : "text-sm")}>
          {m.titulo}
        </p>
        <p className="text-sm">
          <span
            className={clsx(
              "font-semibold",
              nivel === 1 && "text-lg text-oxford"
            )}
          >
            {m.valorActual}
          </span>
          <span className="text-tenue"> / {m.meta}</span>
        </p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
        <div
          className={clsx("h-full rounded-full transition-all", colorBarra(m.progreso))}
          style={{ width: `${Math.min(100, m.progreso)}%` }}
        />
      </div>

      {m.detalle && <p className="text-xs text-tenue">{m.detalle}</p>}

      <div className="flex flex-wrap items-center gap-2 pt-0.5 print:hidden">
        {m.krVinculado ? (
          <span className="rounded-full bg-oxford-suave px-2 py-0.5 text-[11px] font-medium text-oxford">
            🔗 {m.krVinculado}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSimular()}
            className="rounded-full border border-dashed border-linea-fuerte px-2.5 py-0.5 text-[11px] font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground"
          >
            ➕ Vincular a KR del Trimestre
          </button>
        )}
      </div>
    </div>
  );
}

function Nivel({
  numero,
  emoji,
  titulo,
  bajada,
  metricas,
  onSimular,
}: {
  numero: 1 | 2 | 3;
  emoji: string;
  titulo: string;
  bajada: string;
  metricas: MetricaNivel[];
  onSimular: (texto?: string) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">
            <span aria-hidden>{emoji}</span> Nivel {numero} · {titulo}
          </h3>
          <p className="text-xs text-tenue">{bajada}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            onSimular(
              `Esta acción agregará una métrica nueva al Nivel ${numero} de la ficha del cliente`
            )
          }
          className="rounded-full border border-dashed border-linea-fuerte px-2.5 py-1 text-[11px] font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground print:hidden"
        >
          ➕ Agregar métrica
        </button>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {metricas.map((m) => (
          <FilaMetrica
            key={m.titulo}
            m={m}
            nivel={numero}
            onSimular={onSimular}
          />
        ))}
      </div>
    </section>
  );
}

export function CarteraClientes() {
  const [id, setId] = useState(CLIENTES[0].id);
  const [poFiltro, setPoFiltro] = useState("Todos");
  const { simular, toast } = useToastDemo();

  const pos = [
    "Todos",
    ...new Set(
      CLIENTES.map((c) => c.squadDetalle?.po).filter((p): p is string => Boolean(p))
    ),
  ];
  const visibles =
    poFiltro === "Todos"
      ? CLIENTES
      : CLIENTES.filter((c) => c.squadDetalle?.po === poFiltro);

  // Si el filtro deja fuera al cliente abierto, se muestra el primero visible.
  const cliente =
    visibles.find((c) => c.id === id) ?? visibles[0] ?? CLIENTES[0];
  const pctHoras = Math.round(
    (cliente.horasConsumidas / cliente.horasPresupuestadas) * 100
  );

  return (
    <div className="documento-ejecutivo space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Cartera de Clientes</h1>
          <p className="text-sm text-tenue">
            Ficha estratégica de cada cuenta con la estructura estandarizada de
            tres niveles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-oxford px-4 py-2 text-sm font-semibold text-white transition hover:bg-oxford-fuerte print:hidden"
        >
          📄 Exportar Expediente
        </button>
      </div>

      <BannerMaqueta />

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <label className="flex items-center gap-1.5 text-xs text-tenue">
          Squad / PO:
          <select
            value={poFiltro}
            onChange={(e) => setPoFiltro(e.target.value)}
            className="rounded-full border border-linea bg-transparent px-3 py-1.5 text-xs"
          >
            {pos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        {visibles.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setId(c.id)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              c.id === cliente.id
                ? "border-oxford bg-oxford text-white"
                : "border-linea text-tenue hover:border-oxford/50 hover:text-foreground"
            )}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <section className="space-y-4 rounded-xl border border-linea bg-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{cliente.nombre}</h2>
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  TONO_ESTADO[cliente.estado]
                )}
              >
                {ESTADO_CLIENTE_LABELS[cliente.estado]}
              </span>
            </div>
            <p className="text-sm text-tenue">{cliente.squad}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-tenue">Fee mensual</p>
              <p className="text-lg font-semibold">
                {fmtPesos(cliente.feeMensual)}
              </p>
            </div>
            {cliente.lookerUrl && (
              <a
                href={cliente.lookerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-oxford px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-oxford-fuerte print:hidden"
              >
                📊 Ver Reporte Live en Looker Studio ↗
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-linea p-3">
            <p className="text-xs text-tenue">Horas consumidas</p>
            <p className="text-xl font-semibold">
              {pctHoras}%
              <span className="ml-1 text-xs font-normal text-tenue">
                {cliente.horasConsumidas} / {cliente.horasPresupuestadas} hs
              </span>
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-linea">
              <div
                className={clsx(
                  "h-full rounded-full",
                  pctHoras >= 100
                    ? "bg-red-500"
                    : pctHoras >= 75
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, pctHoras)}%` }}
              />
            </div>
          </div>

          <div
            className={clsx(
              "rounded-lg border p-3",
              cliente.margenPct >= 65
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-red-500/30 bg-red-500/5"
            )}
          >
            <p className="text-xs text-tenue">Margen actual (meta 65%)</p>
            <p
              className={clsx(
                "text-xl font-semibold",
                cliente.margenPct >= 65
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-700 dark:text-red-400"
              )}
            >
              {cliente.margenPct}%
            </p>
          </div>

          <div className="rounded-lg border border-linea p-3">
            <p className="text-xs text-tenue">Rendimiento por hora</p>
            <p className="text-xl font-semibold">
              {fmtPesos(cliente.rendimientoHora)}
              <span className="text-xs font-normal text-tenue">/h</span>
            </p>
          </div>
        </div>
      </section>

      {cliente.squadDetalle && <ComposicionSquad squad={cliente.squadDetalle} />}

      <Nivel
        numero={1}
        emoji="🎯"
        titulo="Objetivo de Negocio"
        bajada="La métrica principal del contrato. Es la que justifica el fee."
        metricas={[cliente.nivel1]}
        onSimular={simular}
      />

      <Nivel
        numero={2}
        emoji="📈"
        titulo="Salud del Funnel"
        bajada="Indicadores de conversión y de medios que explican el Nivel 1."
        metricas={cliente.nivel2}
        onSimular={simular}
      />

      <Nivel
        numero={3}
        emoji="🔍"
        titulo="Micro-KPIs Tácticos"
        bajada="Lo que el POD mueve todas las semanas."
        metricas={cliente.nivel3}
        onSimular={simular}
      />

      {toast}
    </div>
  );
}
