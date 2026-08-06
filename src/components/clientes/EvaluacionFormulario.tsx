"use client";

import { useActionState, useState, type ReactNode } from "react";
import {
  upsertEvaluacion,
  type FormActionState,
} from "@/app/(protected)/kpis-clientes/actions";
import {
  ErrorText,
  Modal,
  inputClass,
  labelClass,
  submitClass,
} from "@/components/Modal";
import type { Cliente, Evaluacion360, ItemEvaluacion } from "@/lib/types";

/** Bloque de filas criterio + puntaje que se pueden sumar y quitar.
 *
 * Los inputs comparten name, así que la Server Action los recibe como dos
 * arrays paralelos. Quitar una fila la saca del DOM y por lo tanto del
 * envío: no hace falta marcar nada como borrado. */
function FilasEvaluacion({
  prefijo,
  titulo,
  bajada,
  iniciales,
}: {
  prefijo: string;
  titulo: string;
  bajada: string;
  iniciales: ItemEvaluacion[];
}) {
  const [filas, setFilas] = useState<(ItemEvaluacion & { key: number })[]>(
    iniciales.map((i, idx) => ({ ...i, key: idx }))
  );
  const [siguienteKey, setSiguienteKey] = useState(iniciales.length);

  function agregar() {
    setFilas((f) => [...f, { criterio: "", puntaje: 3, key: siguienteKey }]);
    setSiguienteKey((k) => k + 1);
  }

  return (
    <fieldset className="space-y-2 rounded-md border border-linea p-3">
      <legend className="px-1 text-sm font-semibold">{titulo}</legend>
      <p className="text-xs text-tenue">{bajada}</p>

      {filas.map((fila) => (
        <div key={fila.key} className="flex items-center gap-2">
          <input
            name={`${prefijo}_criterio`}
            defaultValue={fila.criterio}
            placeholder="Criterio"
            className={inputClass}
          />
          <input
            name={`${prefijo}_puntaje`}
            type="number"
            min={1}
            max={5}
            defaultValue={fila.puntaje}
            className="w-20 shrink-0 rounded-md border border-linea bg-panel px-2 py-1.5 text-sm"
            aria-label="Puntaje de 1 a 5"
          />
          <button
            type="button"
            onClick={() => setFilas((f) => f.filter((x) => x.key !== fila.key))}
            className="shrink-0 px-1 text-tenue transition hover:text-red-600"
            aria-label="Quitar criterio"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={agregar}
        className="text-xs font-medium text-oxford hover:underline"
      >
        + Agregar criterio
      </button>
    </fieldset>
  );
}

export function EvaluacionModal({
  clientes,
  evaluacion,
  clienteIdPorDefecto,
  triggerLabel,
  triggerClassName,
}: {
  clientes: Cliente[];
  evaluacion?: Evaluacion360;
  clienteIdPorDefecto?: string;
  triggerLabel: ReactNode;
  triggerClassName: string;
}) {
  return (
    <Modal
      titulo={evaluacion ? "Editar evaluación 360" : "Cargar evaluación del período"}
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
    >
      {(cerrar) => (
        <EvaluacionForm
          clientes={clientes}
          evaluacion={evaluacion}
          clienteIdPorDefecto={clienteIdPorDefecto}
          onDone={cerrar}
        />
      )}
    </Modal>
  );
}

function EvaluacionForm({
  clientes,
  evaluacion,
  clienteIdPorDefecto,
  onDone,
}: {
  clientes: Cliente[];
  evaluacion?: Evaluacion360;
  clienteIdPorDefecto?: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await upsertEvaluacion(prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelClass}>Cliente</label>
          <select
            name="cliente_id"
            required
            defaultValue={evaluacion?.cliente_id ?? clienteIdPorDefecto ?? ""}
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
          <label className={labelClass}>Período</label>
          <input
            name="periodo"
            required
            defaultValue={evaluacion?.periodo}
            placeholder="Q3 2026"
            className={inputClass}
          />
        </div>
      </div>

      <FilasEvaluacion
        prefijo="relacionamiento"
        titulo="Cliente → Oxford"
        bajada="Cómo nos califica el cliente."
        iniciales={evaluacion?.notas_relacionamiento_json ?? []}
      />

      <FilasEvaluacion
        prefijo="performance"
        titulo="Oxford → Cliente"
        bajada="Cómo califica el squad al cliente."
        iniciales={evaluacion?.notas_performance_json ?? []}
      />

      <FilasEvaluacion
        prefijo="comercial"
        titulo="Objetivos comerciales"
        bajada="Cada sub-métrica puntuada de 1 a 5."
        iniciales={evaluacion?.notas_comerciales_json ?? []}
      />

      <FilasTendencia iniciales={evaluacion?.tendencia_json ?? []} />

      <p className="text-xs text-tenue">
        La Matriz de Valoración no se toca desde acá: se conserva tal como
        estaba al guardar.
      </p>

      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Guardando…" : "Guardar evaluación"}
      </button>
    </form>
  );
}

function FilasTendencia({
  iniciales,
}: {
  iniciales: { mes: string; puntaje: number }[];
}) {
  const [filas, setFilas] = useState(
    iniciales.map((t, idx) => ({ ...t, key: idx }))
  );
  const [siguienteKey, setSiguienteKey] = useState(iniciales.length);

  return (
    <fieldset className="space-y-2 rounded-md border border-linea p-3">
      <legend className="px-1 text-sm font-semibold">Tendencia mensual</legend>
      <p className="text-xs text-tenue">
        Del mes más viejo al más nuevo. Es lo que dibuja el gráfico.
      </p>

      {filas.map((fila) => (
        <div key={fila.key} className="flex items-center gap-2">
          <input
            name="tendencia_mes"
            defaultValue={fila.mes}
            placeholder="Junio"
            className={inputClass}
          />
          <input
            name="tendencia_puntaje"
            type="number"
            min={0}
            max={5}
            step={0.1}
            defaultValue={fila.puntaje}
            className="w-20 shrink-0 rounded-md border border-linea bg-panel px-2 py-1.5 text-sm"
            aria-label="Puntaje del mes"
          />
          <button
            type="button"
            onClick={() => setFilas((f) => f.filter((x) => x.key !== fila.key))}
            className="shrink-0 px-1 text-tenue transition hover:text-red-600"
            aria-label="Quitar mes"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          setFilas((f) => [...f, { mes: "", puntaje: 3, key: siguienteKey }]);
          setSiguienteKey((k) => k + 1);
        }}
        className="text-xs font-medium text-oxford hover:underline"
      >
        + Agregar mes
      </button>
    </fieldset>
  );
}
