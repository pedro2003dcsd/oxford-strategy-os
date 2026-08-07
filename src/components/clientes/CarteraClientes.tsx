"use client";

import { useState } from "react";
import clsx from "clsx";
import { Avatar } from "@/components/Avatar";
import {
  BorrarMetrica,
  ClienteModal,
  MetricaModal,
  QuitarMiembro,
  SquadMiembroModal,
} from "@/components/clientes/ClienteFormularios";
import {
  fmtPesos,
  metricasPorNivel,
  miembrosPorRol,
  resumenSquad,
} from "@/lib/clientes-logic";
import { META_MARGEN } from "@/lib/solop-logic";
import { ESTADO_CLIENTE_LABELS } from "@/lib/types";
import type { ClienteCompleto } from "@/lib/clientes";
import type {
  EstadoCliente,
  KeyResult,
  MetricaCliente,
  NivelMetrica,
  SquadMiembro,
  UsuarioAutorizado,
} from "@/lib/types";

const TONO_ESTADO: Record<EstadoCliente, string> = {
  activo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  en_riesgo: "bg-red-500/15 text-red-700 dark:text-red-300",
  onboarding: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
};

const botonFantasma =
  "rounded-full border border-dashed border-linea-fuerte px-2.5 py-1 text-[11px] font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground print:hidden";

function FichaLider({
  miembro,
  destacado = false,
}: {
  miembro: SquadMiembro;
  destacado?: boolean;
}) {
  const rol = miembro.especialidad
    ? `${miembro.rol_squad} · ${miembro.especialidad}`
    : miembro.rol_squad;

  return (
    <div
      className={clsx(
        "group flex items-center gap-2 rounded-lg border px-2.5 py-2",
        destacado ? "border-oxford/40 bg-oxford-suave" : "border-linea"
      )}
    >
      <Avatar nombre={miembro.nombre} conNombre={false} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {miembro.nombre}
        </span>
        <span
          className={clsx(
            "block truncate text-[11px]",
            destacado ? "font-medium text-oxford" : "text-tenue"
          )}
        >
          {destacado ? "PO / Client Partner" : rol}
        </span>
      </span>
      <span className="print:hidden">
        <QuitarMiembro miembroId={miembro.id} />
      </span>
    </div>
  );
}

function ComposicionSquad({
  cliente,
  personas,
}: {
  cliente: ClienteCompleto;
  personas: UsuarioAutorizado[];
}) {
  const pos = miembrosPorRol(cliente.squad_miembros, "PO");
  const leads = miembrosPorRol(cliente.squad_miembros, "Chapter Lead");
  const ejecutores = miembrosPorRol(cliente.squad_miembros, "Ejecutor");
  const vacio = cliente.squad_miembros.length === 0;

  return (
    <section className="space-y-4 rounded-xl border border-linea bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">
            <span aria-hidden>👥</span> Composición del Squad &amp; Ritos
          </h3>
          <p className="text-xs text-tenue">
            Quién responde por la cuenta y con qué ritmo se juntan.
          </p>
        </div>
        <SquadMiembroModal
          clienteId={cliente.id}
          personas={personas}
          triggerLabel="➕ Sumar integrante"
          triggerClassName={botonFantasma}
        />
      </div>

      {vacio ? (
        <p className="text-sm text-tenue">
          Todavía no hay nadie cargado en este squad.
        </p>
      ) : (
        <>
          {(pos.length > 0 || leads.length > 0) && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-tenue">
                Liderazgo
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {pos.map((m) => (
                  <FichaLider key={m.id} miembro={m} destacado />
                ))}
                {leads.map((m) => (
                  <FichaLider key={m.id} miembro={m} />
                ))}
              </div>
            </div>
          )}

          {ejecutores.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-tenue">
                Equipo ejecutor ({ejecutores.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ejecutores.map((m) => (
                  <span
                    key={m.id}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-linea px-2.5 py-1 text-xs"
                  >
                    <span className="font-medium">{m.nombre}</span>
                    {m.especialidad && (
                      <span className="text-tenue">· {m.especialidad}</span>
                    )}
                    <span className="print:hidden">
                      <QuitarMiembro miembroId={m.id} />
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {cliente.ceremonias.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-tenue">
            Ceremonias
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cliente.ceremonias.map((c) => (
              <span
                key={c}
                className="rounded-full bg-oxford-suave px-2.5 py-1 text-xs font-medium text-oxford"
              >
                🔁 {c}
              </span>
            ))}
          </div>
        </div>
      )}
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
  clienteId,
  keyResults,
}: {
  m: MetricaCliente;
  clienteId: string;
  keyResults: KeyResult[];
}) {
  const krVinculado = keyResults.find((kr) => kr.id === m.kr_asociado_id);

  return (
    <div className="space-y-1.5 rounded-lg border border-linea p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={clsx("font-medium", m.nivel === 1 ? "text-base" : "text-sm")}>
          {m.titulo}
        </p>
        <p className="text-sm">
          <span
            className={clsx(
              "font-semibold",
              m.nivel === 1 && "text-lg text-oxford"
            )}
          >
            {m.valor_actual ?? "—"}
          </span>
          <span className="text-tenue"> / {m.meta ?? "—"}</span>
        </p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            colorBarra(m.progreso_porcentaje)
          )}
          style={{ width: `${Math.min(100, m.progreso_porcentaje)}%` }}
        />
      </div>

      {m.detalle && <p className="text-xs text-tenue">{m.detalle}</p>}

      <div className="flex flex-wrap items-center gap-2 pt-0.5 print:hidden">
        {krVinculado && (
          <span className="rounded-full bg-oxford-suave px-2 py-0.5 text-[11px] font-medium text-oxford">
            🔗 {krVinculado.titulo}
          </span>
        )}
        <MetricaModal
          clienteId={clienteId}
          nivel={m.nivel}
          metrica={m}
          keyResults={keyResults}
          triggerLabel="Editar"
          triggerClassName="text-[11px] text-tenue transition hover:text-foreground"
        />
        <BorrarMetrica metricaId={m.id} />
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
  clienteId,
  keyResults,
}: {
  numero: NivelMetrica;
  emoji: string;
  titulo: string;
  bajada: string;
  metricas: MetricaCliente[];
  clienteId: string;
  keyResults: KeyResult[];
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
        <MetricaModal
          clienteId={clienteId}
          nivel={numero}
          keyResults={keyResults}
          triggerLabel="➕ Agregar métrica"
          triggerClassName={botonFantasma}
        />
      </div>
      {metricas.length === 0 ? (
        <p className="text-xs text-tenue">Sin métricas cargadas en este nivel.</p>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {metricas.map((m) => (
            <FilaMetrica
              key={m.id}
              m={m}
              clienteId={clienteId}
              keyResults={keyResults}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function CarteraClientes({
  clientes,
  keyResults,
  personas,
}: {
  clientes: ClienteCompleto[];
  keyResults: KeyResult[];
  personas: UsuarioAutorizado[];
}) {
  const [id, setId] = useState(clientes[0]?.id ?? "");
  const [poFiltro, setPoFiltro] = useState("Todos");

  if (clientes.length === 0) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-xl font-semibold">Cartera de Clientes</h1>
          <p className="text-sm text-tenue">
            Ficha estratégica de cada cuenta con la estructura estandarizada de
            tres niveles.
          </p>
        </header>
        <div className="rounded-lg border border-dashed border-linea p-6 text-center">
          <p className="text-sm font-medium">Todavía no hay clientes cargados.</p>
          <p className="mt-1 text-sm text-tenue">
            Las cuentas que ya tenían proyectos en SOLOP se migraron solas. Si
            está vacío, cargá la primera a mano.
          </p>
          <div className="mt-3 flex justify-center">
            <ClienteModal
              triggerLabel="➕ Nuevo cliente"
              triggerClassName="rounded-md bg-oxford px-4 py-2 text-sm font-semibold text-white transition hover:bg-oxford-fuerte"
            />
          </div>
        </div>
      </div>
    );
  }

  const posDisponibles = [
    "Todos",
    ...new Set(
      clientes
        .map((c) => miembrosPorRol(c.squad_miembros, "PO")[0]?.nombre)
        .filter((p): p is string => Boolean(p))
    ),
  ];

  const visibles =
    poFiltro === "Todos"
      ? clientes
      : clientes.filter(
          (c) => miembrosPorRol(c.squad_miembros, "PO")[0]?.nombre === poFiltro
        );

  // Si el filtro deja fuera al cliente abierto, se muestra el primero visible.
  const cliente = visibles.find((c) => c.id === id) ?? visibles[0] ?? clientes[0];
  const { solop } = cliente;
  const pctHoras =
    solop.ratio_horas !== null ? Math.round(solop.ratio_horas * 100) : null;
  const niveles = metricasPorNivel(cliente.metricas_cliente);

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
        <div className="flex flex-wrap gap-2 print:hidden">
          <ClienteModal
            triggerLabel="➕ Nuevo cliente"
            triggerClassName="rounded-md border border-linea px-4 py-2 text-sm font-semibold transition hover:border-oxford/50"
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-oxford px-4 py-2 text-sm font-semibold text-white transition hover:bg-oxford-fuerte"
          >
            📄 Exportar Expediente
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <label className="flex items-center gap-1.5 text-xs text-tenue">
          Squad / PO:
          <select
            value={poFiltro}
            onChange={(e) => setPoFiltro(e.target.value)}
            className="rounded-full border border-linea bg-panel px-3 py-1.5 text-xs"
          >
            {posDisponibles.map((p) => (
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
              <ClienteModal
                cliente={cliente}
                triggerLabel="Editar"
                triggerClassName="text-xs text-tenue transition hover:text-foreground print:hidden"
              />
            </div>
            <p className="text-sm text-tenue">
              {resumenSquad(cliente.squad_miembros)}
              {cliente.pod_asignado && ` · ${cliente.pod_asignado}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-tenue">Fee mensual</p>
              <p className="text-lg font-semibold">
                {fmtPesos(cliente.fee_mensual)}
              </p>
            </div>
            {cliente.looker_studio_url && (
              <a
                href={cliente.looker_studio_url}
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
            {pctHoras === null ? (
              <p className="text-sm text-tenue">Sin horas cargadas en SOLOP</p>
            ) : (
              <>
                <p className="text-xl font-semibold">
                  {pctHoras}%
                  <span className="ml-1 text-xs font-normal text-tenue">
                    {solop.horas_consumidas} / {solop.horas_presupuestadas} hs
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
              </>
            )}
          </div>

          <div
            className={clsx(
              "rounded-lg border p-3",
              solop.margen_pct === null
                ? "border-linea"
                : solop.margen_pct >= META_MARGEN
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-red-500/30 bg-red-500/5"
            )}
          >
            <p className="text-xs text-tenue">
              Margen actual (meta {META_MARGEN}%)
            </p>
            {solop.margen_pct === null ? (
              <p className="text-sm text-tenue">Sin facturación cargada</p>
            ) : (
              <p
                className={clsx(
                  "text-xl font-semibold",
                  solop.margen_pct >= META_MARGEN
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
                )}
              >
                {solop.margen_pct}%
              </p>
            )}
          </div>

          <div className="rounded-lg border border-linea p-3">
            <p className="text-xs text-tenue">Rendimiento por hora</p>
            {solop.rendimiento_hora === null ? (
              <p className="text-sm text-tenue">Sin horas consumidas</p>
            ) : (
              <p className="text-xl font-semibold">
                {fmtPesos(solop.rendimiento_hora)}
                <span className="text-xs font-normal text-tenue">/h</span>
              </p>
            )}
          </div>
        </div>
      </section>

      <ComposicionSquad cliente={cliente} personas={personas} />

      <Nivel
        numero={1}
        emoji="🎯"
        titulo="Objetivo de Negocio"
        bajada="La métrica principal del contrato. Es la que justifica el fee."
        metricas={niveles.nivel1}
        clienteId={cliente.id}
        keyResults={keyResults}
      />

      <Nivel
        numero={2}
        emoji="📈"
        titulo="Salud del Funnel"
        bajada="Indicadores de conversión y de medios que explican el Nivel 1."
        metricas={niveles.nivel2}
        clienteId={cliente.id}
        keyResults={keyResults}
      />

      <Nivel
        numero={3}
        emoji="🔍"
        titulo="Micro-KPIs Tácticos"
        bajada="Lo que el POD mueve todas las semanas."
        metricas={niveles.nivel3}
        clienteId={cliente.id}
        keyResults={keyResults}
      />
    </div>
  );
}
