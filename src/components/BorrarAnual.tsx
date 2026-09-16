"use client";

import { useState, useTransition } from "react";
import { deleteKrAnual, deleteOkrAnual } from "@/app/(protected)/okrs/actions";

/** Borrar un OKR anual o un KR anual, con un paso de confirmación explícito.
 * Solo se muestra a Dirección (el llamador lo decide) y el servidor vuelve a
 * chequear con vetoDeBorrado. El borrado es en cascada por FK: por eso la
 * confirmación dice qué se lleva por delante, no sólo "¿seguro?". */
export function BorrarAnual({
  tipo,
  id,
  titulo,
  advertencia,
  triggerClassName,
}: {
  tipo: "okrAnual" | "krAnual";
  id: string;
  titulo: string;
  /** Qué más desaparece (KR anuales, alineaciones). Se muestra en la
   * confirmación para que quede claro el alcance del borrado. */
  advertencia: string;
  triggerClassName: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function borrar() {
    setError(null);
    start(async () => {
      const res = tipo === "okrAnual" ? await deleteOkrAnual(id) : await deleteKrAnual(id);
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
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setConfirmando(true)}
        title={tipo === "okrAnual" ? "Borrar este OKR anual" : "Borrar este KR anual"}
        className={triggerClassName}
      >
        🗑
      </button>
    );
  }

  return (
    <span
      onPointerDown={(e) => e.stopPropagation()}
      className="flex shrink-0 flex-wrap items-center gap-1.5"
    >
      <span className="max-w-[15rem] text-[11px] text-red-700 dark:text-red-400">
        ¿Borrar “{titulo}”? {advertencia}
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
