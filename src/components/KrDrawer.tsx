"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import clsx from "clsx";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { Avatar } from "@/components/Avatar";
import { IniciativasPanel } from "@/components/IniciativasPanel";
import {
  updateLinkTrabajo,
  type LinkTrabajoState,
} from "@/app/(protected)/iniciativas/actions";
import { formatValor, isKrCumplido, esDescendente } from "@/lib/kr-logic";
import {
  advertenciaHoras,
  margenReal,
  ratioHoras,
  META_MARGEN,
} from "@/lib/solop-logic";
import type { CheckIn, KeyResultCompleto, ProyectoSolop } from "@/lib/types";

function Rentabilidad({
  kr,
  proyecto,
}: {
  kr: KeyResultCompleto;
  proyecto: ProyectoSolop | null;
}) {
  if (!proyecto && kr.margen_actual_pct == null) return null;

  const margen = proyecto ? margenReal(proyecto) : kr.margen_actual_pct;
  const ratio = proyecto ? ratioHoras(proyecto) : null;
  const advertencia = proyecto ? advertenciaHoras(proyecto) : null;
  const bajoMeta = margen != null && margen < kr.margen_utilidad_esperado;

  return (
    <section className="space-y-2.5">
      <h3 className="text-sm font-semibold">Rentabilidad (SOLOP)</h3>
      <div
        className={clsx(
          "space-y-2.5 rounded-lg border p-3",
          bajoMeta ? "border-red-500/40 bg-red-500/5" : "border-linea"
        )}
      >
        {proyecto && (
          <p className="text-xs text-tenue">
            {proyecto.cliente} ·{" "}
            {proyecto.tipo_contrato === "AdHoc" ? "Ad-Hoc" : "Fee mensual"}
          </p>
        )}

        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-tenue">Margen real</span>
          <span
            className={clsx(
              "text-lg font-semibold",
              bajoMeta
                ? "text-red-700 dark:text-red-400"
                : "text-emerald-700 dark:text-emerald-400"
            )}
          >
            {margen != null ? `${margen}%` : "sin cargar"}
            <span className="ml-1 text-xs font-normal text-tenue">
              (meta {kr.margen_utilidad_esperado || META_MARGEN}%)
            </span>
          </span>
        </div>

        {proyecto && ratio != null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs text-tenue">
              <span>Horas consumidas</span>
              <span className="font-medium text-foreground">
                {proyecto.horas_consumidas} / {proyecto.horas_presupuestadas} hs (
                {Math.round(ratio * 100)}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
              <div
                className={clsx(
                  "h-full rounded-full transition-all",
                  ratio >= 0.9
                    ? "bg-red-500"
                    : ratio >= 0.75
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
              />
            </div>
          </div>
        )}

        {advertencia && (
          <p className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-300">
            ⚠️ {advertencia}
          </p>
        )}

        {bajoMeta && (
          <p className="text-xs text-red-700 dark:text-red-400">
            El margen está por debajo de la meta de la Estrella Polar. Revisar
            scope con el líder de cuenta.
          </p>
        )}
      </div>
    </section>
  );
}

function LinkTrabajo({ kr }: { kr: KeyResultCompleto }) {
  const bound = updateLinkTrabajo.bind(null, kr.id);
  const [state, formAction, guardando] = useActionState<
    LinkTrabajoState,
    FormData
  >(bound, undefined);

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Link de trabajo</h3>
      {kr.link_trabajo && (
        <a
          href={kr.link_trabajo}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-xs font-medium text-oxford hover:underline"
        >
          {kr.link_trabajo} ↗
        </a>
      )}
      <form action={formAction} className="flex gap-2">
        <input
          name="link_trabajo"
          defaultValue={kr.link_trabajo ?? ""}
          placeholder="https:// Drive, Notion o Figma"
          className="min-w-0 flex-1 rounded-md border border-linea bg-transparent px-2 py-1.5 text-xs outline-none focus:border-oxford"
        />
        <button
          type="submit"
          disabled={guardando}
          className="shrink-0 rounded-md border border-linea px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {guardando ? "…" : "Guardar"}
        </button>
      </form>
      {state?.error && (
        <p className="text-xs text-red-700 dark:text-red-400">{state.error}</p>
      )}
    </section>
  );
}

export function KrDrawer({
  kr,
  checkIns,
  proyecto,
  onClose,
}: {
  kr: KeyResultCompleto;
  checkIns: CheckIn[];
  proyecto: ProyectoSolop | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const historial = [...checkIns].reverse();
  const cumplido = isKrCumplido(kr);
  const okrTrim = kr.okr_trimestral;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={kr.titulo}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-linea bg-panel shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-linea px-5 py-4">
          <div className="min-w-0 space-y-1.5">
            {okrTrim && (
              <p className="text-xs uppercase tracking-wide text-tenue">
                {okrTrim.area} · {okrTrim.trimestre} {okrTrim.anio}
              </p>
            )}
            <h2 className="text-base font-semibold leading-snug">{kr.titulo}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <SemaforoBadge estado={kr.estado_semaforo} />
              {cumplido && (
                <span className="rounded-full bg-linea px-2.5 py-1 text-xs font-medium">
                  Cumplido
                </span>
              )}
              {okrTrim?.responsable && <Avatar nombre={okrTrim.responsable} />}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-md p-1.5 text-tenue transition hover:bg-linea/60 hover:text-foreground"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-tenue">
                {kr.tipo_medicion === "hitos" ? "Hitos cumplidos" : "Avance"}
              </span>
              <span className="text-sm font-semibold">
                {kr.tipo_medicion === "hitos"
                  ? `${kr.hitos_kr.filter((h) => h.cumplido).length} / ${kr.hitos_kr.length}`
                  : `${formatValor(kr.valor_actual, kr.tipo_medicion)} / ${formatValor(kr.valor_meta, kr.tipo_medicion)}`}
              </span>
            </div>
            {esDescendente(kr) && (
              <p className="text-xs text-tenue">
                Métrica descendente: arrancó en{" "}
                {formatValor(kr.valor_inicial, kr.tipo_medicion)} y el objetivo es
                bajarla.
              </p>
            )}
            {kr.cliente_asociado && (
              <p className="text-xs text-tenue">
                Cliente: {kr.cliente_asociado}
              </p>
            )}
          </section>

          <IniciativasPanel
            krId={kr.id}
            iniciativas={kr.iniciativas ?? []}
            responsablePorDefecto={okrTrim?.responsable}
          />

          <Rentabilidad kr={kr} proyecto={proyecto} />

          <LinkTrabajo kr={kr} />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Historial de check-ins</h3>
            {historial.length === 0 ? (
              <p className="text-xs text-tenue">Sin check-ins todavía.</p>
            ) : (
              <ol className="space-y-3 border-l border-linea pl-4">
                {historial.map((c) => (
                  <li key={c.id} className="relative space-y-1">
                    <span
                      className={clsx(
                        "absolute -left-[21px] top-1.5 h-2 w-2 rounded-full",
                        c.estado_semaforo === "verde"
                          ? "bg-emerald-500"
                          : c.estado_semaforo === "amarillo"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      )}
                    />
                    <p className="text-xs">
                      <span className="font-medium">{c.usuario}</span>
                      <span className="text-tenue">
                        {" "}
                        registró{" "}
                        {formatValor(c.valor_registrado, kr.tipo_medicion)} ·{" "}
                        {new Date(c.creado_at).toLocaleDateString("es-AR")}
                      </span>
                    </p>
                    {c.comentario_bloqueos && (
                      <p className="rounded-md bg-linea/60 px-2 py-1 text-xs italic leading-snug text-tenue">
                        &ldquo;{c.comentario_bloqueos}&rdquo;
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <footer className="border-t border-linea px-5 py-3">
          <Link
            href={`/kr/${kr.id}`}
            className="text-xs font-medium text-oxford hover:underline"
          >
            Abrir ficha completa (cargar check-in, hitos y margen) ↗
          </Link>
        </footer>
      </aside>
    </>
  );
}
