"use client";

import { useState, useTransition } from "react";
import {
  deleteKeyResult,
  deleteOkrTrimestral,
} from "@/app/(protected)/okrs/actions";

/** Borrar un KR o un objetivo, con un paso de confirmación adentro del
 * mismo botón. El borrado es en cascada: por eso la confirmación dice qué
 * se lleva por delante, no solo "¿seguro?". */
export function BorrarObjetivo({
  tipo,
  id,
  titulo,
}: {
  tipo: "kr" | "okr";
  id: string;
  titulo: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function borrar() {
    setError(null);
    start(async () => {
      const accion = tipo === "kr" ? deleteKeyResult : deleteOkrTrimestral;
      const res = await accion(id);
      if (res?.error) {
        setError(res.error);
        setConfirmando(false);
      }
    });
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="shrink-0 rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-red-500/10 hover:text-red-600"
        title={tipo === "kr" ? "Borrar este KR" : "Borrar este objetivo"}
      >
        Borrar
      </button>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span className="max-w-[16rem] truncate text-xs text-red-700 dark:text-red-400">
        {tipo === "okr"
          ? `¿Borrar "${titulo}" y todos sus KR?`
          : `¿Borrar "${titulo}"?`}
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
        className="rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-linea/60"
      >
        No
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
