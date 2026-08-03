"use client";

import { useActionState } from "react";
import { updateMargen, type MargenState } from "@/app/(protected)/kr/[id]/actions";

export function MargenForm({
  krId,
  margenActual,
  margenEsperado,
}: {
  krId: string;
  margenActual: number | null;
  margenEsperado: number;
}) {
  const boundAction = updateMargen.bind(null, krId);
  const [state, formAction, pending] = useActionState<MargenState, FormData>(
    boundAction,
    undefined
  );

  return (
    <form
      action={formAction}
      className="space-y-2 rounded-lg border border-linea p-4"
    >
      <h3 className="text-sm font-semibold">Margen real (SOLOP)</h3>
      <p className="text-xs text-tenue">
        Carga manual — margen esperado: {margenEsperado}%
      </p>
      <div className="flex items-center gap-2">
        <input
          name="margen_actual_pct"
          type="number"
          step="any"
          defaultValue={margenActual ?? ""}
          placeholder="Ej: 62.5"
          className="w-28 rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
        />
        <span className="text-sm text-tenue">%</span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
