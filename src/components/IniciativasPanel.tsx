"use client";

import { useActionState, useState, useTransition } from "react";
import clsx from "clsx";
import {
  addIniciativa,
  deleteIniciativa,
  setEstadoIniciativa,
  toggleIniciativa,
  type IniciativaState,
} from "@/app/(protected)/iniciativas/actions";
import {
  ESTADOS_INICIATIVA,
  ESTADO_INICIATIVA_LABELS,
  type EstadoIniciativa,
  type Iniciativa,
} from "@/lib/types";
import {
  avanceIniciativas,
  estaVencida,
  ESTADO_INICIATIVA_CLASES,
} from "@/lib/iniciativas";
import { Avatar } from "@/components/Avatar";

/** Contador compacto para la portada de la card. */
export function IniciativasContador({
  iniciativas,
}: {
  iniciativas: Iniciativa[];
}) {
  const { total, completadas, bloqueadas, pct } = avanceIniciativas(iniciativas);
  if (total === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs text-tenue">
        <span>
          {completadas}/{total} Iniciativas completadas
        </span>
        {bloqueadas > 0 && (
          <span className="font-medium text-red-700 dark:text-red-400">
            {bloqueadas} bloqueada{bloqueadas > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-linea">
        <div
          className="h-full rounded-full bg-oxford transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function IniciativasPanel({
  krId,
  iniciativas,
  responsablePorDefecto,
}: {
  krId: string;
  iniciativas: Iniciativa[];
  responsablePorDefecto?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [abriendoForm, setAbriendoForm] = useState(false);
  const boundAction = addIniciativa.bind(null, krId);
  const [state, formAction, agregando] = useActionState<IniciativaState, FormData>(
    boundAction,
    undefined
  );

  const ordenadas = [...iniciativas].sort((a, b) => a.orden - b.orden);
  const { total, completadas } = avanceIniciativas(iniciativas);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Iniciativas Clave</h3>
        <span className="text-xs text-tenue">
          {total === 0 ? "Sin iniciativas" : `${completadas}/${total} completadas`}
        </span>
      </div>

      {ordenadas.length > 0 && (
        <ul className="space-y-2">
          {ordenadas.map((i) => {
            const vencida = estaVencida(i);
            return (
              <li
                key={i.id}
                className="flex items-start gap-2 rounded-lg border border-linea p-2.5"
              >
                <input
                  type="checkbox"
                  checked={i.estado === "completado"}
                  disabled={isPending}
                  onChange={(e) =>
                    startTransition(() => {
                      toggleIniciativa(i.id, krId, e.target.checked);
                    })
                  }
                  aria-label={`Marcar "${i.titulo}" como completada`}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-linea-fuerte accent-[var(--oxford)]"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p
                    className={clsx(
                      "text-sm leading-snug",
                      i.estado === "completado" && "text-tenue line-through"
                    )}
                  >
                    {i.titulo}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={i.estado}
                      disabled={isPending}
                      onChange={(e) =>
                        startTransition(() => {
                          setEstadoIniciativa(
                            i.id,
                            krId,
                            e.target.value as EstadoIniciativa
                          );
                        })
                      }
                      aria-label="Estado de la iniciativa"
                      className={clsx(
                        "rounded-full border-0 px-2 py-0.5 text-[11px] font-medium",
                        ESTADO_INICIATIVA_CLASES[i.estado]
                      )}
                    >
                      {ESTADOS_INICIATIVA.map((e) => (
                        <option key={e} value={e}>
                          {ESTADO_INICIATIVA_LABELS[e]}
                        </option>
                      ))}
                    </select>

                    {i.responsable && <Avatar nombre={i.responsable} />}

                    {i.fecha_limite && (
                      <span
                        className={clsx(
                          "text-[11px]",
                          vencida
                            ? "font-medium text-red-700 dark:text-red-400"
                            : "text-tenue"
                        )}
                      >
                        {vencida ? "⚠ Venció " : "Vence "}
                        {new Date(i.fecha_limite).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    )}

                    {i.link_recurso && (
                      <a
                        href={i.link_recurso}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-oxford hover:underline"
                      >
                        Abrir recurso ↗
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      deleteIniciativa(i.id, krId);
                    })
                  }
                  aria-label={`Borrar "${i.titulo}"`}
                  className="shrink-0 rounded p-1 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!abriendoForm ? (
        <button
          type="button"
          onClick={() => setAbriendoForm(true)}
          className="w-full rounded-lg border border-dashed border-linea-fuerte px-3 py-2 text-xs font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground"
        >
          + Agregar iniciativa
        </button>
      ) : (
        <form
          action={formAction}
          onSubmit={() => setAbriendoForm(true)}
          className="space-y-2 rounded-lg border border-linea p-3"
        >
          <input
            name="titulo"
            autoFocus
            placeholder="¿Qué hay que hacer? Ej: adaptar videos verticales para Meta"
            className="w-full rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm outline-none focus:border-oxford"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              name="responsable"
              defaultValue={responsablePorDefecto ?? ""}
              placeholder="Responsable"
              className="rounded-md border border-linea bg-transparent px-2 py-1.5 text-xs outline-none focus:border-oxford"
            />
            <input
              name="fecha_limite"
              type="date"
              aria-label="Fecha límite"
              className="rounded-md border border-linea bg-transparent px-2 py-1.5 text-xs outline-none focus:border-oxford"
            />
          </div>
          <input
            name="link_recurso"
            placeholder="Link de trabajo (Drive, Notion, Figma)"
            className="w-full rounded-md border border-linea bg-transparent px-2 py-1.5 text-xs outline-none focus:border-oxford"
          />
          {state?.error && (
            <p className="text-xs text-red-700 dark:text-red-400">{state.error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={agregando}
              className="rounded-md bg-oxford px-3 py-1.5 text-xs font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50"
            >
              {agregando ? "Guardando…" : "Agregar"}
            </button>
            <button
              type="button"
              onClick={() => setAbriendoForm(false)}
              className="rounded-md border border-linea px-3 py-1.5 text-xs font-medium text-tenue"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
