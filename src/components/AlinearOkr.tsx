"use client";

import { useState, useTransition } from "react";
import { alinearOkrTrimestral } from "@/app/(protected)/okrs/actions";
import type { OkrAnual } from "@/lib/types";

/** Botón + dropdown para adoptar un OKR trimestral suelto. */
export function AlinearOkr({
  okrTrimestralId,
  okrsAnuales,
}: {
  okrTrimestralId: string;
  okrsAnuales: OkrAnual[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  if (okrsAnuales.length === 0) {
    return (
      <span className="text-xs text-tenue">
        Creá primero un OKR anual para poder alinearlo.
      </span>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="shrink-0 rounded-md border border-oxford/40 px-2.5 py-1 text-xs font-medium text-oxford transition hover:bg-oxford-suave"
      >
        🔗 Alinear a OKR Anual
      </button>
    );
  }

  return (
    <select
      autoFocus
      defaultValue=""
      disabled={pendiente}
      aria-label="Elegí el OKR anual"
      onChange={(e) => {
        const valor = e.target.value;
        if (!valor) {
          setAbierto(false);
          return;
        }
        startTransition(() => {
          alinearOkrTrimestral(okrTrimestralId, valor);
        });
      }}
      className="w-full max-w-xs rounded-md border border-oxford/40 bg-transparent px-2 py-1 text-xs disabled:opacity-50"
    >
      <option value="">Elegí el OKR anual…</option>
      {okrsAnuales.map((oa) => (
        <option key={oa.id} value={oa.id}>
          {oa.titulo}
        </option>
      ))}
    </select>
  );
}
