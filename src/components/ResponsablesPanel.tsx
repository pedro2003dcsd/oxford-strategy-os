"use client";

import { useActionState, useState, useTransition } from "react";
import {
  agregarResponsable,
  quitarResponsable,
  type FormActionState,
} from "@/app/(protected)/okrs/actions";
import { Avatar } from "@/components/Avatar";
import { AREAS } from "@/lib/types";
import type { Area, OkrResponsable, UsuarioAutorizado } from "@/lib/types";

type ResponsableConPersona = OkrResponsable & {
  usuarios_autorizados: UsuarioAutorizado | null;
};

export function ResponsablesPanel({
  okrId,
  responsables,
  personas,
  areasInvolucradas,
}: {
  okrId: string;
  responsables: ResponsableConPersona[];
  personas: UsuarioAutorizado[];
  areasInvolucradas: Area[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendingDelete, startDelete] = useTransition();
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await agregarResponsable(prev, formData);
      if (!result?.error) setAbierto(false);
      return result;
    },
    undefined
  );

  // Si el OKR declaró áreas, se ofrecen esas: sumar un referente de un área
  // que el objetivo no involucra es casi siempre un error de tipeo.
  const areasOfrecidas = areasInvolucradas.length > 0 ? areasInvolucradas : [...AREAS];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {responsables.length === 0 && (
          <p className="text-xs text-tenue">Sin referentes por área todavía.</p>
        )}
        {responsables.map((r) => (
          <span
            key={r.id}
            className="group flex items-center gap-1.5 rounded-full border border-linea py-0.5 pl-0.5 pr-2 text-xs"
          >
            <Avatar nombre={r.usuarios_autorizados?.nombre ?? "?"} />
            <span>
              {r.usuarios_autorizados?.nombre ?? "—"}
              {/* El área es opcional desde 0014: solo la tienen los
                  referentes cargados desde acá, no los co-responsables que
                  se marcan en el formulario del OKR. */}
              {r.area && <span className="text-tenue"> · {r.area}</span>}
            </span>
            <button
              type="button"
              disabled={pendingDelete}
              onClick={() => startDelete(() => quitarResponsable(r.id))}
              className="text-tenue opacity-0 transition hover:text-red-600 focus:opacity-100 group-hover:opacity-100 disabled:opacity-30"
              aria-label={`Quitar a ${r.usuarios_autorizados?.nombre ?? "esta persona"}`}
            >
              ×
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="rounded-full border border-dashed border-linea px-2 py-1 text-xs text-tenue transition hover:border-oxford hover:text-oxford"
        >
          + Referente
        </button>
      </div>

      {abierto && (
        <form
          action={formAction}
          className="flex flex-wrap items-end gap-2 rounded-md border border-linea p-2"
        >
          <input type="hidden" name="okr_trimestral_id" value={okrId} />
          <div className="space-y-1">
            <label className="text-xs font-medium text-tenue">Persona</label>
            <select
              name="usuario_id"
              required
              defaultValue=""
              className="rounded-md border border-linea bg-transparent px-2 py-1 text-sm"
            >
              <option value="" disabled>
                Elegí
              </option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-tenue">Área</label>
            <select
              name="area"
              required
              defaultValue=""
              className="rounded-md border border-linea bg-transparent px-2 py-1 text-sm"
            >
              <option value="" disabled>
                Elegí
              </option>
              {areasOfrecidas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-oxford px-3 py-1.5 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50"
          >
            {pending ? "Sumando…" : "Sumar"}
          </button>
          {state?.error && (
            <p className="w-full text-sm text-red-600">{state.error}</p>
          )}
        </form>
      )}
    </div>
  );
}
