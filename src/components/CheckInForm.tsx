"use client";

import { useActionState } from "react";
import { addCheckIn, type CheckInState } from "@/app/(protected)/kr/[id]/actions";

export function CheckInForm({
  krId,
  valorActual,
}: {
  krId: string;
  valorActual: number;
}) {
  const boundAction = addCheckIn.bind(null, krId);
  const [state, formAction, pending] = useActionState<CheckInState, FormData>(
    boundAction,
    undefined
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-linea p-4"
    >
      <h3 className="text-sm font-semibold">Check-in rápido</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-tenue">Tu nombre</label>
          <input
            name="usuario"
            required
            className="w-full rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-tenue">Valor actual</label>
          <input
            name="valor_registrado"
            type="number"
            step="any"
            defaultValue={valorActual}
            required
            className="w-full rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-xs font-medium text-tenue">Semáforo</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="estado_semaforo" value="verde" defaultChecked />
            Verde
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="estado_semaforo" value="amarillo" />
            Amarillo
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="estado_semaforo" value="rojo" />
            Rojo
          </label>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-tenue">
          Bloqueos / comentario (opcional)
        </label>
        <textarea
          name="comentario_bloqueos"
          rows={2}
          className="w-full rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-oxford px-3 py-1.5 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar check-in"}
      </button>
    </form>
  );
}
