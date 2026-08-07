"use client";

import { useActionState, useTransition, type ReactNode } from "react";
import {
  cambiarEstadoExperimento,
  deleteCondicion,
  deleteExperimento,
  upsertCondicion,
  upsertExperimento,
  type FormActionState,
} from "@/app/(protected)/kata/actions";
import {
  ErrorText,
  Modal,
  inputClass,
  labelClass,
  submitClass,
} from "@/components/Modal";
import { ESTADOS_PDCA, ESTADO_PDCA_LABELS } from "@/lib/types";
import type {
  Cliente,
  EstadoPdca,
  KataCondicion,
  PdcaExperimento,
} from "@/lib/types";

export function CondicionModal({
  clientes,
  condicion,
  triggerLabel,
  triggerClassName,
}: {
  clientes: Cliente[];
  condicion?: KataCondicion;
  triggerLabel: ReactNode;
  triggerClassName: string;
}) {
  return (
    <Modal
      titulo={condicion ? "Editar condición objetivo" : "Nueva condición objetivo"}
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
    >
      {(cerrar) => (
        <CondicionForm
          clientes={clientes}
          condicion={condicion}
          onDone={cerrar}
        />
      )}
    </Modal>
  );
}

function CondicionForm({
  clientes,
  condicion,
  onDone,
}: {
  clientes: Cliente[];
  condicion?: KataCondicion;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await upsertCondicion(prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      {condicion && (
        <input type="hidden" name="condicion_id" value={condicion.id} />
      )}

      <div className="space-y-1">
        <label className={labelClass}>Cliente</label>
        <select
          name="cliente_id"
          required
          defaultValue={condicion?.cliente_id ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Elegí una cuenta
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Condición objetivo</label>
        <input
          name="titulo"
          required
          defaultValue={condicion?.titulo}
          placeholder="Recuperar el rendimiento de la pauta"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelClass}>Métrica</label>
          <input
            name="meta"
            defaultValue={condicion?.meta ?? ""}
            placeholder="ROAS > 7,8x"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Progreso (0 a 100)</label>
          <input
            name="progreso_porcentaje"
            type="number"
            min={0}
            max={100}
            defaultValue={condicion?.progreso_porcentaje ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Obstáculo actual</label>
        <textarea
          name="obstaculo_actual"
          rows={2}
          defaultValue={condicion?.obstaculo_actual ?? ""}
          placeholder="Qué está frenando el avance, en palabras del equipo."
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Siguiente paso</label>
        <textarea
          name="siguiente_paso"
          rows={2}
          defaultValue={condicion?.siguiente_paso ?? ""}
          placeholder="Quién hace qué y para cuándo."
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Responsable</label>
        <input
          name="responsable_nombre"
          defaultValue={condicion?.responsable_nombre ?? ""}
          className={inputClass}
        />
      </div>

      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Guardando…" : condicion ? "Guardar cambios" : "Crear condición"}
      </button>
    </form>
  );
}

export function ExperimentoModal({
  condiciones,
  condicionIdPorDefecto,
  experimento,
  triggerLabel,
  triggerClassName,
}: {
  condiciones: (KataCondicion & { clienteNombre: string })[];
  condicionIdPorDefecto?: string;
  experimento?: PdcaExperimento;
  triggerLabel: ReactNode;
  triggerClassName: string;
}) {
  return (
    <Modal
      titulo={experimento ? "Editar experimento" : "Nuevo experimento PDCA"}
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
    >
      {(cerrar) => (
        <ExperimentoForm
          condiciones={condiciones}
          condicionIdPorDefecto={condicionIdPorDefecto}
          experimento={experimento}
          onDone={cerrar}
        />
      )}
    </Modal>
  );
}

function ExperimentoForm({
  condiciones,
  condicionIdPorDefecto,
  experimento,
  onDone,
}: {
  condiciones: (KataCondicion & { clienteNombre: string })[];
  condicionIdPorDefecto?: string;
  experimento?: PdcaExperimento;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await upsertExperimento(prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      {experimento && (
        <input type="hidden" name="experimento_id" value={experimento.id} />
      )}

      <div className="space-y-1">
        <label className={labelClass}>Condición objetivo</label>
        <select
          name="condicion_id"
          required
          defaultValue={
            experimento?.condicion_id ?? condicionIdPorDefecto ?? ""
          }
          className={inputClass}
        >
          <option value="" disabled>
            Elegí una condición
          </option>
          {condiciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.clienteNombre} · {c.titulo}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Hipótesis</label>
        <textarea
          name="hipotesis"
          required
          rows={2}
          defaultValue={experimento?.hipotesis}
          placeholder="Si hacemos X, esperamos que pase Y."
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Experimento</label>
        <textarea
          name="experimento"
          rows={2}
          defaultValue={experimento?.experimento ?? ""}
          placeholder="Qué se va a probar concretamente y cómo se mide."
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Estado</label>
        <select
          name="estado"
          defaultValue={experimento?.estado ?? "planificado"}
          className={inputClass}
        >
          {ESTADOS_PDCA.map((e) => (
            <option key={e} value={e}>
              {ESTADO_PDCA_LABELS[e]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Aprendizaje</label>
        <textarea
          name="aprendizaje"
          rows={2}
          defaultValue={experimento?.aprendizaje ?? ""}
          placeholder="Qué dejó, se haya validado o no."
          className={inputClass}
        />
      </div>

      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Guardando…" : experimento ? "Guardar cambios" : "Crear experimento"}
      </button>
    </form>
  );
}

/** Cambio de columna sin abrir el formulario: es el gesto más frecuente. */
export function SelectorEstado({
  experimento,
}: {
  experimento: PdcaExperimento;
}) {
  const [pending, start] = useTransition();

  return (
    <select
      value={experimento.estado}
      disabled={pending}
      onChange={(e) =>
        start(() =>
          cambiarEstadoExperimento(experimento.id, e.target.value as EstadoPdca)
        )
      }
      className="rounded-full border border-linea bg-panel px-2 py-1 text-xs font-medium disabled:opacity-50"
      aria-label="Estado del experimento"
    >
      {ESTADOS_PDCA.map((e) => (
        <option key={e} value={e}>
          {ESTADO_PDCA_LABELS[e]}
        </option>
      ))}
    </select>
  );
}

export function BorrarCondicion({ condicionId }: { condicionId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deleteCondicion(condicionId))}
      className="text-[11px] text-tenue transition hover:text-red-600 disabled:opacity-40"
    >
      Borrar
    </button>
  );
}

export function BorrarExperimento({ experimentoId }: { experimentoId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deleteExperimento(experimentoId))}
      className="text-[11px] text-tenue transition hover:text-red-600 disabled:opacity-40"
    >
      Borrar
    </button>
  );
}
