"use client";

import { useState } from "react";
import { useActionState } from "react";
import clsx from "clsx";
import {
  createKeyResult,
  updateKeyResult,
  type FormActionState,
} from "@/app/(protected)/okrs/actions";
import { TIPOS_MEDICION } from "@/lib/types";
import type { HitoKr, KeyResult, OkrTrimestral, TipoMedicion } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20";
const labelClass = "text-xs font-medium text-neutral-500";

const TIPO_LABELS: Record<TipoMedicion, string> = {
  porcentaje: "% Porcentaje",
  moneda: "$ Moneda",
  numerico: "# Numérico",
  hitos: "☑ Hitos",
};

type HitoRow = { id: string | null; titulo: string; key: number };

export function KrModal({
  okrsTrimestrales,
  kr,
  hitos,
  triggerLabel,
  triggerClassName,
}: {
  okrsTrimestrales?: OkrTrimestral[];
  kr?: KeyResult;
  hitos?: HitoKr[];
  triggerLabel: string;
  triggerClassName: string;
}) {
  const isEdit = !!kr;
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoMedicion>(kr?.tipo_medicion ?? "porcentaje");
  const [hitoRows, setHitoRows] = useState<HitoRow[]>([]);
  const [nextKey, setNextKey] = useState(0);

  function openModal() {
    const base = (hitos ?? [])
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((h, i) => ({ id: h.id, titulo: h.titulo, key: i }));
    setHitoRows(base);
    setNextKey(base.length);
    setTipo(kr?.tipo_medicion ?? "porcentaje");
    setOpen(true);
  }

  const action = isEdit ? updateKeyResult.bind(null, kr.id) : createKeyResult;
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (!result?.error) setOpen(false);
      return result;
    },
    undefined
  );

  return (
    <>
      <button type="button" onClick={openModal} className={triggerClassName}>
        {triggerLabel}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {isEdit ? "Editar Key Result" : "Nuevo Key Result"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="space-y-3">
              {!isEdit && (
                <div className="space-y-1">
                  <label className={labelClass}>OKR trimestral</label>
                  <select
                    name="okr_trimestral_id"
                    required
                    className={inputClass}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Elegí un OKR trimestral
                    </option>
                    {(okrsTrimestrales ?? []).map((o) => (
                      <option key={o.id} value={o.id}>
                        [{o.area}] {o.titulo} ({o.trimestre} {o.anio})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className={labelClass}>Título del KR</label>
                <input
                  name="titulo"
                  required
                  defaultValue={kr?.titulo ?? ""}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Tipo de medición</label>
                <div className="flex flex-wrap gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/10">
                  {TIPOS_MEDICION.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={clsx(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition",
                        tipo === t
                          ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      )}
                    >
                      {TIPO_LABELS[t]}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="tipo_medicion" value={tipo} />
              </div>

              {tipo !== "hitos" ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className={labelClass}>Valor inicial</label>
                    <input
                      name="valor_inicial"
                      type="number"
                      step="any"
                      defaultValue={kr?.valor_inicial ?? 0}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Meta</label>
                    <input
                      name="valor_meta"
                      type="number"
                      step="any"
                      required
                      defaultValue={kr?.valor_meta ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Valor actual</label>
                    <input
                      type="number"
                      disabled
                      value={kr?.valor_actual ?? 0}
                      title="Se actualiza con cada check-in"
                      className={clsx(inputClass, "opacity-50")}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className={labelClass}>Checklist de hitos</label>
                  {hitoRows.map((row, i) => (
                    <div key={row.key} className="flex items-center gap-2">
                      <input type="hidden" name="hito_id" value={row.id ?? ""} />
                      <input
                        name="hito_titulo"
                        defaultValue={row.titulo}
                        placeholder={`Hito ${i + 1}`}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setHitoRows((rows) => rows.filter((r) => r.key !== row.key))
                        }
                        className="shrink-0 rounded-md px-2 py-1 text-sm text-neutral-400 hover:text-red-600"
                        aria-label="Eliminar hito"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setHitoRows((rows) => [
                        ...rows,
                        { id: null, titulo: "", key: nextKey },
                      ]);
                      setNextKey((k) => k + 1);
                    }}
                    className="rounded-md border border-dashed border-black/20 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:border-black/40 hover:text-neutral-900 dark:border-white/20 dark:hover:text-white"
                  >
                    + Agregar hito
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={labelClass}>Cliente asociado (opcional)</label>
                  <input
                    name="cliente_asociado"
                    defaultValue={kr?.cliente_asociado ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Margen esperado (%)</label>
                  <input
                    name="margen_utilidad_esperado"
                    type="number"
                    step="any"
                    defaultValue={kr?.margen_utilidad_esperado ?? 65}
                    className={inputClass}
                  />
                </div>
              </div>

              {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium dark:border-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                >
                  {pending
                    ? "Guardando…"
                    : isEdit
                      ? "Guardar cambios"
                      : "Crear Key Result"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
