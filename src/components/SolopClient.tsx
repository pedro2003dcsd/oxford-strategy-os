"use client";

import { useMemo, useState, useTransition } from "react";
import { useActionState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  asignarKrAProyecto,
  upsertProyectoSolop,
  type SolopState,
} from "@/app/(protected)/solop/actions";
import {
  advertenciaHoras,
  brechaHorasVsAvance,
  BRECHA_SCOPE_CREEP,
  costoPorHora,
  ESTADO_FINANCIERO_LABELS,
  estadoFinanciero,
  facturacionPorHora,
  margenReal,
  META_MARGEN,
  ratioHoras,
  tieneRiesgoScopeCreep,
  UMBRAL_ALERTA_HORAS,
  UMBRAL_SCOPE_CREEP,
  type EstadoFinanciero,
} from "@/lib/solop-logic";
import { progresoPct } from "@/lib/kr-logic";
import { TIPOS_CONTRATO } from "@/lib/types";
import type { KeyResult, ProyectoSolop } from "@/lib/types";

const META_CLIENTES = 20;

const inputClass =
  "w-full rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm";
const labelClass = "text-xs font-medium text-tenue";

/** "Hoy 10:15 hs" si es de hoy, si no la fecha. Saber cuándo se cargó por
 * última vez es la diferencia entre confiar en el número y no. */
function formatoSync(iso: string): string {
  const fecha = new Date(iso);
  const hora = fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const hoy = new Date();
  const mismoDia = fecha.toDateString() === hoy.toDateString();
  if (mismoDia) return `Hoy ${hora} hs`;

  const ayer = new Date(hoy.getTime() - 86400000);
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer ${hora} hs`;

  return `${fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} ${hora} hs`;
}

const fmtPesos = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

function EstadoBadge({ estado }: { estado: EstadoFinanciero | null }) {
  if (!estado) return <span className="text-xs text-tenue">Sin datos</span>;
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        estado === "saludable" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        estado === "en_alerta" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        estado === "en_perdida" && "bg-red-500/10 text-red-700 dark:text-red-400"
      )}
    >
      {ESTADO_FINANCIERO_LABELS[estado]}
    </span>
  );
}

/** Dos barras apiladas: cuánto se consumió de horas y cuánto avanzó el
 * objetivo. Si las horas le sacan mucha ventaja al resultado, se está
 * trabajando de más para el mismo entregable. */
function HorasBar({
  proyecto,
  avanceKr,
}: {
  proyecto: ProyectoSolop;
  avanceKr: number | null;
}) {
  const ratio = ratioHoras(proyecto);
  if (ratio === null)
    return <span className="text-xs text-tenue">Sin presupuesto</span>;

  const pct = Math.min(100, Math.round(ratio * 100));
  const brecha = brechaHorasVsAvance(proyecto, avanceKr);
  const scopeCreep = brecha !== null && brecha > BRECHA_SCOPE_CREEP;

  return (
    <div className="space-y-1.5">
      <div className="space-y-0.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
          <div
            className={clsx(
              "h-full rounded-full transition-all",
              ratio >= UMBRAL_SCOPE_CREEP
                ? "bg-red-500"
                : ratio >= UMBRAL_ALERTA_HORAS
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-tenue">
          {proyecto.horas_consumidas} / {proyecto.horas_presupuestadas} hs ({pct}
          %) horas
        </p>
      </div>

      {avanceKr !== null && (
        <div className="space-y-0.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
            <div
              className="h-full rounded-full bg-oxford transition-all"
              style={{ width: `${Math.min(100, avanceKr)}%` }}
            />
          </div>
          <p className="text-xs text-tenue">{avanceKr}% avance del KR</p>
        </div>
      )}

      {scopeCreep && (
        <p className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400">
          🔴 Scope Creep Detectado · {brecha} puntos más de horas que de avance
        </p>
      )}
    </div>
  );
}

/** Asignación de KR desde la propia fila, para los proyectos que llegan sin
 * vincular. Sin esto hay que abrir el modal de sincronización solo para eso. */
function SelectorKr({
  proyecto,
  krs,
}: {
  proyecto: ProyectoSolop;
  krs: KeyResult[];
}) {
  const [pendiente, startTransition] = useTransition();

  return (
    <select
      value={proyecto.kr_id ?? ""}
      disabled={pendiente}
      onChange={(e) =>
        startTransition(() => {
          asignarKrAProyecto(proyecto.id, e.target.value || null);
        })
      }
      aria-label={`Asociar un KR a ${proyecto.cliente}`}
      className="w-full max-w-[190px] rounded-md border border-dashed border-linea-fuerte bg-transparent px-2 py-1 text-xs text-tenue transition hover:border-oxford/50 disabled:opacity-50"
    >
      <option value="">🔗 Asociar KR…</option>
      {krs.map((kr) => (
        <option key={kr.id} value={kr.id}>
          {kr.titulo}
        </option>
      ))}
    </select>
  );
}

function ProyectoModal({
  proyecto,
  krs,
  onClose,
}: {
  proyecto: ProyectoSolop | null;
  krs: KeyResult[];
  onClose: () => void;
}) {
  const isEdit = !!proyecto;
  const [preview, setPreview] = useState({
    horas_consumidas: proyecto?.horas_consumidas ?? 0,
    facturacion_total: proyecto?.facturacion_total ?? 0,
    costo_operativo: proyecto?.costo_operativo ?? 0,
  });

  const boundAction = upsertProyectoSolop.bind(null, proyecto?.id ?? null);
  const [state, formAction, pending] = useActionState<SolopState, FormData>(
    async (prev, formData) => {
      const result = await boundAction(prev, formData);
      if (!result?.error) onClose();
      return result;
    },
    undefined
  );

  const previewProyecto = {
    ...(proyecto ?? {
      id: "",
      cliente: "",
      tipo_contrato: "Fee" as const,
      kr_id: null,
      horas_presupuestadas: 0,
      creado_at: "",
      actualizado_at: "",
    }),
    ...preview,
  } as ProyectoSolop;

  const margen = margenReal(previewProyecto);
  const cph = costoPorHora(previewProyecto);
  const fph = facturacionPorHora(previewProyecto);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-linea bg-panel p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {isEdit ? `Sincronizar SOLOP — ${proyecto.cliente}` : "Nuevo proyecto SOLOP"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-tenue hover:text-foreground"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className={labelClass}>Cliente / Proyecto</label>
              <input
                name="cliente"
                required
                defaultValue={proyecto?.cliente ?? ""}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Tipo de contrato</label>
              <select
                name="tipo_contrato"
                required
                defaultValue={proyecto?.tipo_contrato ?? "Fee"}
                className={inputClass}
              >
                {TIPOS_CONTRATO.map((t) => (
                  <option key={t} value={t}>
                    {t === "AdHoc" ? "Ad-Hoc" : t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClass}>KR asociado (opcional)</label>
            <select
              name="kr_id"
              defaultValue={proyecto?.kr_id ?? ""}
              className={inputClass}
            >
              <option value="">Sin KR asociado</option>
              {krs.map((kr) => (
                <option key={kr.id} value={kr.id}>
                  {kr.titulo}
                </option>
              ))}
            </select>
            <p className="text-xs text-tenue">
              Si lo asociás, el margen real de este proyecto se sincroniza con el
              KR y dispara las alertas de rentabilidad.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className={labelClass}>Horas presupuestadas</label>
              <input
                name="horas_presupuestadas"
                type="number"
                step="any"
                min="0"
                defaultValue={proyecto?.horas_presupuestadas ?? 0}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Horas consumidas</label>
              <input
                name="horas_consumidas"
                type="number"
                step="any"
                min="0"
                defaultValue={proyecto?.horas_consumidas ?? 0}
                onChange={(e) =>
                  setPreview((p) => ({ ...p, horas_consumidas: Number(e.target.value) }))
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Facturación total ($)</label>
              <input
                name="facturacion_total"
                type="number"
                step="any"
                min="0"
                defaultValue={proyecto?.facturacion_total ?? 0}
                onChange={(e) =>
                  setPreview((p) => ({ ...p, facturacion_total: Number(e.target.value) }))
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Costo operativo ($)</label>
              <input
                name="costo_operativo"
                type="number"
                step="any"
                min="0"
                defaultValue={proyecto?.costo_operativo ?? 0}
                onChange={(e) =>
                  setPreview((p) => ({ ...p, costo_operativo: Number(e.target.value) }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded-lg border border-linea bg-black/[0.02] p-3 text-sm">
            <p className="mb-2 text-xs font-semibold text-tenue">
              Conciliación por hora-hombre
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-tenue">Facturación/h</p>
                <p className="font-medium">{fph !== null ? fmtPesos(fph) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-tenue">Costo/h</p>
                <p className="font-medium">{cph !== null ? fmtPesos(cph) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-tenue">Margen real</p>
                <p
                  className={clsx(
                    "font-semibold",
                    margen === null
                      ? ""
                      : margen >= META_MARGEN
                        ? "text-emerald-600 dark:text-emerald-400"
                        : margen >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                  )}
                >
                  {margen !== null ? `${margen}%` : "—"}
                </p>
              </div>
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-oxford px-3 py-1.5 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50"
            >
              {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SolopClient({
  proyectos,
  krs,
}: {
  proyectos: ProyectoSolop[];
  krs: KeyResult[];
}) {
  const [tipoFiltro, setTipoFiltro] = useState<"Todos" | "Fee" | "AdHoc">("Todos");
  const [estadoFiltro, setEstadoFiltro] = useState<"Todos" | EstadoFinanciero>("Todos");
  const [modal, setModal] = useState<{ abierto: boolean; proyecto: ProyectoSolop | null }>({
    abierto: false,
    proyecto: null,
  });

  const krPorId = useMemo(() => new Map(krs.map((k) => [k.id, k])), [krs]);

  const conMargen = proyectos.filter((p) => margenReal(p) !== null);
  const promedioUB =
    conMargen.length === 0
      ? null
      : Math.round(
          (conMargen.reduce((acc, p) => acc + (margenReal(p) ?? 0), 0) /
            conMargen.length) *
            10
        ) / 10;
  const clientesIntegrales = new Set(
    proyectos
      .filter((p) => (margenReal(p) ?? 0) >= META_MARGEN)
      .map((p) => p.cliente)
  ).size;
  const conScopeCreep = proyectos.filter(tieneRiesgoScopeCreep).length;

  const visibles = proyectos.filter((p) => {
    if (tipoFiltro !== "Todos" && p.tipo_contrato !== tipoFiltro) return false;
    if (estadoFiltro !== "Todos" && estadoFinanciero(p) !== estadoFiltro) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Torre de Control SOLOP</h1>
          <p className="text-sm text-tenue">
            Rentabilidad por cliente/proyecto — carga manual desde SOLOP.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ abierto: true, proyecto: null })}
          className="rounded-md bg-oxford px-3 py-1.5 text-sm font-medium text-white"
        >
          + Nuevo proyecto
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div
          className={clsx(
            "rounded-xl border p-4",
            promedioUB === null
              ? "border-linea"
              : promedioUB >= META_MARGEN
                ? "border-emerald-500/30 bg-emerald-500/5"
                : promedioUB >= 50
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-red-500/30 bg-red-500/5"
          )}
        >
          <p className="text-xs font-medium text-tenue">
            Utilidad bruta promedio (meta &gt;{META_MARGEN}%)
          </p>
          <p className="text-2xl font-semibold">
            {promedioUB !== null ? `${promedioUB}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-oxford/30 bg-oxford-suave p-4">
          <p className="text-xs font-medium text-tenue">
            Clientes integrales activos (meta {META_CLIENTES})
          </p>
          <p className="text-2xl font-semibold">
            {clientesIntegrales}{" "}
            <span className="text-sm font-normal text-tenue">
              / {META_CLIENTES}
            </span>
          </p>
        </div>
        <div
          className={clsx(
            "rounded-xl border p-4",
            conScopeCreep > 0
              ? "border-red-500/30 bg-red-500/5"
              : "border-linea"
          )}
        >
          <p className="text-xs font-medium text-tenue">
            Proyectos con riesgo de scope creep
          </p>
          <p className="text-2xl font-semibold">{conScopeCreep}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value as typeof tipoFiltro)}
          className="rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
        >
          <option value="Todos">Todos los contratos</option>
          <option value="Fee">Fee</option>
          <option value="AdHoc">Ad-Hoc</option>
        </select>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value as typeof estadoFiltro)}
          className="rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
        >
          <option value="Todos">Todos los estados</option>
          <option value="saludable">Saludable (&ge;{META_MARGEN}%)</option>
          <option value="en_alerta">En alerta (50-{META_MARGEN}%)</option>
          <option value="en_perdida">En pérdida (&lt;50%)</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-linea">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-linea text-left text-xs uppercase tracking-wide text-tenue">
              <th className="px-4 py-3">Cliente / Proyecto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">KR asociado</th>
              <th className="px-4 py-3 min-w-[160px]">Horas</th>
              <th className="px-4 py-3">Margen</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-tenue">
                  No hay proyectos para este filtro.
                </td>
              </tr>
            )}
            {visibles.map((p) => {
              const margen = margenReal(p);
              const kr = p.kr_id ? krPorId.get(p.kr_id) : null;
              const advertencia = advertenciaHoras(p);
              return (
                <tr
                  key={p.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.cliente}</p>
                    {advertencia && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        ⚠ {advertencia}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-tenue">
                    {p.tipo_contrato === "AdHoc" ? "Ad-Hoc" : "Fee"}
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    {kr ? (
                      <Link
                        href={`/kr/${kr.id}`}
                        className="block truncate text-xs hover:underline"
                        title={kr.titulo}
                      >
                        {kr.titulo}
                      </Link>
                    ) : (
                      <SelectorKr proyecto={p} krs={krs} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <HorasBar
                      proyecto={p}
                      avanceKr={kr ? progresoPct(kr) : null}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "font-semibold",
                        margen === null
                          ? "text-tenue"
                          : margen >= META_MARGEN
                            ? "text-emerald-600 dark:text-emerald-400"
                            : margen >= 50
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {margen !== null ? `${margen}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={estadoFinanciero(p)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => setModal({ abierto: true, proyecto: p })}
                        className="rounded-md border border-linea px-2.5 py-1 text-xs font-medium transition hover:border-oxford/50"
                      >
                        Sincronizar
                      </button>
                      <span className="whitespace-nowrap text-[11px] text-tenue">
                        Última sincronización: {formatoSync(p.actualizado_at)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal.abierto && (
        <ProyectoModal
          proyecto={modal.proyecto}
          krs={krs}
          onClose={() => setModal({ abierto: false, proyecto: null })}
        />
      )}
    </div>
  );
}
