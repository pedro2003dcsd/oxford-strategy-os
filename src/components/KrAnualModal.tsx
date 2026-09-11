"use client";

import { useActionState, useState } from "react";
import clsx from "clsx";
import {
  createKrAnual,
  updateKrAnual,
  type FormActionState,
} from "@/app/(protected)/okrs/actions";
import { Modal, inputClass, labelClass, submitClass, ErrorText } from "@/components/Modal";
import type { KrAnual, TipoMedicion } from "@/lib/types";

/** El KR anual es una meta, no un número que se sigue día a día: por eso no
 * ofrece "hitos" (que necesitaría un checklist) ni valor actual. */
const TIPOS_KR_ANUAL: TipoMedicion[] = ["porcentaje", "moneda", "numerico"];

const TIPO_LABELS: Record<TipoMedicion, string> = {
  porcentaje: "% Porcentaje",
  moneda: "$ Moneda",
  numerico: "# Numérico",
  hitos: "☑ Hitos",
};

function KrAnualForm({
  okrAnualId,
  kr,
  onDone,
}: {
  okrAnualId: string;
  kr?: KrAnual;
  onDone: () => void;
}) {
  const isEdit = !!kr;
  const [tipo, setTipo] = useState<TipoMedicion>(kr?.tipo_medicion ?? "porcentaje");
  const accion = isEdit
    ? updateKrAnual.bind(null, kr.id)
    : createKrAnual.bind(null, okrAnualId);

  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await accion(prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className={labelClass}>Título del KR anual</label>
        <input
          name="titulo"
          required
          defaultValue={kr?.titulo ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Tipo de medición</label>
        <div className="flex flex-wrap gap-1 rounded-lg bg-linea/60 p-1">
          {TIPOS_KR_ANUAL.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={clsx(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                tipo === t
                  ? "bg-panel text-foreground shadow-sm"
                  : "text-tenue hover:text-foreground"
              )}
            >
              {TIPO_LABELS[t]}
            </button>
          ))}
        </div>
        <input type="hidden" name="tipo_medicion" value={tipo} />
      </div>

      <div className="grid grid-cols-2 gap-2">
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
          <label className={labelClass}>Meta del año</label>
          <input
            name="valor_meta"
            type="number"
            step="any"
            required
            defaultValue={kr?.valor_meta ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-xs text-tenue">
        El KR anual no lleva avance propio: su progreso se ve en el mapa por lo
        que empujan los KR trimestrales vinculados.
      </p>

      <ErrorText state={state} />
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium"
        >
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={submitClass}>
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear KR anual"}
        </button>
      </div>
    </form>
  );
}

export function KrAnualModal({
  okrAnualId,
  kr,
  triggerLabel,
  triggerClassName,
}: {
  okrAnualId: string;
  kr?: KrAnual;
  triggerLabel: string;
  triggerClassName: string;
}) {
  return (
    <Modal
      titulo={kr ? "Editar KR anual" : "Nuevo KR anual"}
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
    >
      {(cerrar) => <KrAnualForm okrAnualId={okrAnualId} kr={kr} onDone={cerrar} />}
    </Modal>
  );
}
