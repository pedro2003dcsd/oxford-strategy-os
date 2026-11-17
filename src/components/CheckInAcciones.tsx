"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  borrarCheckIn,
  editarCheckIn,
  type CheckInState,
} from "@/app/(protected)/kr/[id]/actions";
import {
  ErrorText,
  Modal,
  inputClass,
  labelClass,
  submitClass,
} from "@/components/Modal";
import { motivoCorreccionInvalida } from "@/lib/checkin-logic";
import type { CheckIn, Semaforo } from "@/lib/types";

const btnMini =
  "rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground";

/** Editar o borrar el último check-in de un KR.
 *
 * Quién ve estos botones lo decide la ficha del KR con checkInCorregible.
 * Que la persona sea la autora y que el check-in siga siendo el último lo
 * vuelve a verificar la base al guardar o borrar: si mientras tanto alguien
 * cargó otro, la corrección se rechaza y acá se ofrece actualizar el
 * historial. */
export function CheckInAcciones({
  checkIn,
  restaura,
}: {
  checkIn: CheckIn;
  /** A qué vuelve el KR si se borra, ya formateado. Null si no se sabe. */
  restaura: string | null;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<CheckInState>(undefined);
  const [pending, start] = useTransition();

  function borrar() {
    setError(undefined);
    start(async () => {
      const res = await borrarCheckIn(checkIn.kr_id, checkIn.id);
      if (res?.error) {
        setError(res);
        setConfirmando(false);
      }
    });
  }

  if (confirmando) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-red-700 dark:text-red-400">
          ¿Borrar este check-in?
          {restaura && ` El KR vuelve a ${restaura}.`}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={borrar}
          className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? "Borrando…" : "Sí, borrar"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmando(false)}
          className={btnMini}
        >
          No
        </button>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-1">
      <Modal
        titulo="Editar check-in"
        triggerLabel="Editar"
        triggerClassName={btnMini}
      >
        {(cerrar) => (
          <EditarCheckInForm
            checkIn={checkIn}
            onDone={cerrar}
            onActualizar={() => {
              cerrar();
              router.refresh();
            }}
          />
        )}
      </Modal>
      <button
        type="button"
        onClick={() => {
          setError(undefined);
          setConfirmando(true);
        }}
        className={btnMini}
      >
        Borrar
      </button>
      {error?.error && (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-red-600">{error.error}</span>
          {error.actualizar && (
            <button
              type="button"
              onClick={() => router.refresh()}
              className={btnMini}
            >
              Actualizar historial
            </button>
          )}
        </span>
      )}
    </span>
  );
}

function EditarCheckInForm({
  checkIn,
  onDone,
  onActualizar,
}: {
  checkIn: CheckIn;
  onDone: () => void;
  onActualizar: () => void;
}) {
  // Controlados y no `defaultValue`: useActionState resetea el formulario
  // cuando la acción termina, también si devolvió error, y con campos no
  // controlados eso borra lo que la persona acababa de corregir. El
  // comentario arranca con el que ya tenía el check-in: editar el valor o el
  // semáforo no lo toca.
  const [valor, setValor] = useState(String(checkIn.valor_registrado));
  const [estado, setEstado] = useState<Semaforo>(checkIn.estado_semaforo);
  const [comentario, setComentario] = useState(checkIn.comentario_bloqueos ?? "");
  const pideExplicacion = estado === "amarillo" || estado === "rojo";

  const [state, formAction, pending] = useActionState<CheckInState, FormData>(
    async (prev, formData) => {
      // Mismo chequeo que hace el servidor, para avisar sin ir y volver.
      const motivo = motivoCorreccionInvalida({ valor, estado, comentario });
      if (motivo) return { error: motivo };

      const result = await editarCheckIn(checkIn.kr_id, checkIn.id, prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} noValidate className="space-y-3">
      <div className="space-y-1">
        <label className={labelClass}>Valor registrado</label>
        <input
          name="valor_registrado"
          type="number"
          step="any"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <span className={labelClass}>Semáforo</span>
        <div className="flex gap-4 text-sm">
          {(["verde", "amarillo", "rojo"] as const).map((s) => (
            <label key={s} className="flex items-center gap-1.5 capitalize">
              <input
                type="radio"
                name="estado_semaforo"
                value={s}
                checked={estado === s}
                onChange={() => setEstado(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>
          Bloqueos o necesidades{" "}
          {pideExplicacion ? "(obligatorio en amarillo o rojo)" : "(opcional)"}
        </label>
        <textarea
          name="comentario_bloqueos"
          rows={2}
          required={pideExplicacion}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className={inputClass}
        />
      </div>
      <p className="text-xs text-tenue">
        El avance y el semáforo del KR pasan a ser los que guardes acá.
      </p>
      <ErrorText state={state} />
      <div className="flex justify-end gap-2 pt-1">
        {state?.actualizar && (
          <button
            type="button"
            onClick={onActualizar}
            className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium"
          >
            Actualizar historial
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium"
        >
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={submitClass}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
