"use client";

import { useActionState, useTransition } from "react";
import clsx from "clsx";
import {
  deleteActa,
  toggleCompromisoLom,
  upsertActa,
  type CompromisoState,
} from "@/app/(protected)/lom/actions";
import {
  ErrorText,
  Modal,
  inputClass,
  labelClass,
  submitClass,
} from "@/components/Modal";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { Avatar } from "@/components/Avatar";
import { compromisoVencido } from "@/lib/lom";
import type {
  ActaDirectorio,
  CheckIn,
  CompromisoLom,
  KeyResultCompleto,
} from "@/lib/types";

/** Columna de la pizarra. Cada una es un bloque de la reunión: mirar el
 * desvío, ver qué se prometió la semana pasada, dejar el acta. */
function Columna({
  titulo,
  bajada,
  contador,
  accion,
  children,
}: {
  titulo: string;
  bajada: string;
  contador?: number;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-linea bg-panel/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">
            {titulo}
            {contador !== undefined && (
              <span className="ml-1.5 rounded-full bg-linea/60 px-1.5 py-0.5 text-xs font-medium text-tenue">
                {contador}
              </span>
            )}
          </h2>
          <p className="text-xs text-tenue">{bajada}</p>
        </div>
        {accion}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Papelito({
  children,
  tono,
}: {
  children: React.ReactNode;
  tono?: "alerta" | "vencido";
}) {
  return (
    <article
      className={clsx(
        "rounded-lg border p-3 text-sm shadow-sm transition",
        tono === "alerta"
          ? "border-red-500/40 bg-red-500/5"
          : tono === "vencido"
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-linea bg-panel"
      )}
    >
      {children}
    </article>
  );
}

function TildeCompromiso({ compromiso }: { compromiso: CompromisoLom }) {
  const [pending, start] = useTransition();
  return (
    <input
      type="checkbox"
      checked={compromiso.cumplido}
      disabled={pending}
      onChange={(e) =>
        start(() => toggleCompromisoLom(compromiso.id, e.target.checked))
      }
      className="mt-0.5 shrink-0 accent-oxford disabled:opacity-40"
      aria-label={`Marcar "${compromiso.descripcion}" como cumplido`}
    />
  );
}

function ActaForm({ acta, onDone }: { acta?: ActaDirectorio; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<CompromisoState, FormData>(
    async (prev, formData) => {
      const result = await upsertActa(prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      {acta && <input type="hidden" name="acta_id" value={acta.id} />}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelClass}>Fecha</label>
          <input
            name="fecha"
            type="date"
            defaultValue={acta?.fecha ?? new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Título</label>
          <input
            name="titulo"
            required
            defaultValue={acta?.titulo}
            placeholder="LOM del 6 de agosto"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Contenido</label>
        <textarea
          name="contenido"
          rows={8}
          defaultValue={acta?.contenido ?? ""}
          placeholder="Qué se decidió, qué quedó pendiente y quién lo lleva."
          className={inputClass}
        />
      </div>

      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Guardando…" : acta ? "Guardar cambios" : "Crear acta"}
      </button>
    </form>
  );
}

function BorrarActa({ actaId }: { actaId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deleteActa(actaId))}
      className="text-[11px] text-tenue transition hover:text-red-600 disabled:opacity-40"
    >
      Borrar
    </button>
  );
}

export function PizarraLom({
  krs,
  checkIns,
  compromisos,
  actas,
}: {
  krs: KeyResultCompleto[];
  checkIns: CheckIn[];
  compromisos: CompromisoLom[];
  actas: ActaDirectorio[];
}) {
  const ultimoPorKr = new Map<string, CheckIn>();
  for (const c of checkIns) {
    const previo = ultimoPorKr.get(c.kr_id);
    if (!previo || new Date(c.creado_at) > new Date(previo.creado_at)) {
      ultimoPorKr.set(c.kr_id, c);
    }
  }

  const desvios = krs.filter((kr) => kr.estado_semaforo !== "verde");
  const abiertos = compromisos.filter((c) => !c.cumplido);
  const tituloKr = new Map(krs.map((kr) => [kr.id, kr.titulo]));

  const botonAlta =
    "shrink-0 rounded-full border border-dashed border-linea-fuerte px-2.5 py-1 text-[11px] font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground";

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Columna
        titulo="Desvíos de la semana"
        bajada="Amarillos y rojos del último check-in."
        contador={desvios.length}
      >
        {desvios.length === 0 ? (
          <p className="text-sm text-tenue">
            Sin desvíos. Toda la cartera en verde.
          </p>
        ) : (
          desvios.map((kr) => {
            const ultimo = ultimoPorKr.get(kr.id);
            return (
              <Papelito
                key={kr.id}
                tono={kr.estado_semaforo === "rojo" ? "alerta" : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{kr.titulo}</p>
                  <SemaforoBadge estado={kr.estado_semaforo} compact />
                </div>
                {kr.okr_trimestral && (
                  <p className="mt-1 text-xs text-tenue">
                    {kr.okr_trimestral.area} · {kr.okr_trimestral.responsable}
                  </p>
                )}
                {ultimo?.comentario_bloqueos && (
                  <p className="mt-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-xs italic leading-snug text-amber-800 dark:text-amber-300">
                    &ldquo;{ultimo.comentario_bloqueos}&rdquo;
                  </p>
                )}
              </Papelito>
            );
          })
        )}
      </Columna>

      <Columna
        titulo="Compromisos abiertos"
        bajada="Lo que se prometió y todavía no se cumplió."
        contador={abiertos.length}
      >
        {abiertos.length === 0 ? (
          <p className="text-sm text-tenue">
            Sin compromisos pendientes. Se cargan desde la tarjeta de cada KR.
          </p>
        ) : (
          abiertos.map((c) => (
            <Papelito
              key={c.id}
              tono={compromisoVencido(c) ? "vencido" : undefined}
            >
              <div className="flex items-start gap-2">
                <TildeCompromiso compromiso={c} />
                <div className="min-w-0 flex-1">
                  <p className="leading-snug">{c.descripcion}</p>
                  <p className="mt-1 text-xs text-tenue">
                    {tituloKr.get(c.kr_id) ?? "KR sin título"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {c.responsable && <Avatar nombre={c.responsable} />}
                    {c.fecha_limite && (
                      <span
                        className={clsx(
                          "text-xs",
                          compromisoVencido(c)
                            ? "font-medium text-amber-700 dark:text-amber-400"
                            : "text-tenue"
                        )}
                      >
                        {compromisoVencido(c) ? "⚠ Vencido " : "Para el "}
                        {new Date(c.fecha_limite).toLocaleDateString("es-AR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Papelito>
          ))
        )}
      </Columna>

      <Columna
        titulo="Actas de directorio"
        bajada="Qué se decidió en cada reunión."
        contador={actas.length}
        accion={
          <Modal
            titulo="Nueva acta"
            triggerLabel="➕ Acta"
            triggerClassName={botonAlta}
          >
            {(cerrar) => <ActaForm onDone={cerrar} />}
          </Modal>
        }
      >
        {actas.length === 0 ? (
          <p className="text-sm text-tenue">
            Todavía no hay actas cargadas.
          </p>
        ) : (
          actas.map((a) => (
            <Papelito key={a.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-snug">{a.titulo}</p>
                <span className="shrink-0 text-xs text-tenue">
                  {new Date(a.fecha).toLocaleDateString("es-AR")}
                </span>
              </div>
              {a.contenido && (
                <p className="mt-1.5 whitespace-pre-wrap text-xs leading-snug text-tenue">
                  {a.contenido}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-tenue">
                  {a.autor_nombre ? `Tomada por ${a.autor_nombre}` : ""}
                </span>
                <span className="flex items-center gap-2">
                  <Modal
                    titulo="Editar acta"
                    triggerLabel="Editar"
                    triggerClassName="text-[11px] text-tenue transition hover:text-foreground"
                  >
                    {(cerrar) => <ActaForm acta={a} onDone={cerrar} />}
                  </Modal>
                  <BorrarActa actaId={a.id} />
                </span>
              </div>
            </Papelito>
          ))
        )}
      </Columna>
    </div>
  );
}
