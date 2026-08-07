"use client";

import { useActionState, useTransition, type ReactNode } from "react";
import {
  addSquadMiembro,
  createCliente,
  deleteMetrica,
  removeSquadMiembro,
  updateCliente,
  upsertMetrica,
  type FormActionState,
} from "@/app/(protected)/clientes/actions";
import {
  ErrorText,
  Modal,
  inputClass,
  labelClass,
  submitClass,
} from "@/components/Modal";
import {
  ESTADOS_CLIENTE,
  ESTADO_CLIENTE_LABELS,
  ROLES_SQUAD,
} from "@/lib/types";
import type {
  Cliente,
  KeyResult,
  MetricaCliente,
  NivelMetrica,
  UsuarioAutorizado,
} from "@/lib/types";

// ------------------------------------------------------------
// Cliente
// ------------------------------------------------------------

export function ClienteModal({
  cliente,
  triggerLabel,
  triggerClassName,
}: {
  cliente?: Cliente;
  triggerLabel: ReactNode;
  triggerClassName: string;
}) {
  const esEdicion = !!cliente;

  return (
    <Modal
      titulo={esEdicion ? "Editar cliente" : "Nuevo cliente"}
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
    >
      {(cerrar) => (
        <ClienteForm cliente={cliente} onDone={cerrar} />
      )}
    </Modal>
  );
}

function ClienteForm({
  cliente,
  onDone,
}: {
  cliente?: Cliente;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = cliente
        ? await updateCliente(cliente.id, prev, formData)
        : await createCliente(prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label className={labelClass}>Nombre</label>
        <input
          name="nombre"
          required
          defaultValue={cliente?.nombre}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelClass}>Estado</label>
          <select
            name="estado"
            defaultValue={cliente?.estado ?? "activo"}
            className={inputClass}
          >
            {ESTADOS_CLIENTE.map((e) => (
              <option key={e} value={e}>
                {ESTADO_CLIENTE_LABELS[e]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Fee mensual</label>
          <input
            name="fee_mensual"
            type="number"
            min={0}
            step={1000}
            defaultValue={cliente?.fee_mensual ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>POD asignado</label>
        <input
          name="pod_asignado"
          defaultValue={cliente?.pod_asignado ?? ""}
          placeholder="POD Digital"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Ceremonias (separadas por coma)</label>
        <input
          name="ceremonias"
          defaultValue={(cliente?.ceremonias ?? []).join(", ")}
          placeholder="Weekly Quincenal, Review Quincenal, Retro Mensual"
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Tablero en Looker Studio</label>
        <input
          name="looker_studio_url"
          type="url"
          defaultValue={cliente?.looker_studio_url ?? ""}
          placeholder="https://lookerstudio.google.com/…"
          className={inputClass}
        />
      </div>

      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Guardando…" : esGuardar(cliente)}
      </button>
    </form>
  );
}

function esGuardar(cliente?: Cliente) {
  return cliente ? "Guardar cambios" : "Crear cliente";
}

// ------------------------------------------------------------
// Métricas
// ------------------------------------------------------------

export function MetricaModal({
  clienteId,
  nivel,
  metrica,
  keyResults,
  triggerLabel,
  triggerClassName,
}: {
  clienteId: string;
  nivel: NivelMetrica;
  metrica?: MetricaCliente;
  keyResults: KeyResult[];
  triggerLabel: ReactNode;
  triggerClassName: string;
}) {
  return (
    <Modal
      titulo={metrica ? "Editar métrica" : `Nueva métrica de Nivel ${nivel}`}
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
    >
      {(cerrar) => (
        <MetricaForm
          clienteId={clienteId}
          nivel={nivel}
          metrica={metrica}
          keyResults={keyResults}
          onDone={cerrar}
        />
      )}
    </Modal>
  );
}

function MetricaForm({
  clienteId,
  nivel,
  metrica,
  keyResults,
  onDone,
}: {
  clienteId: string;
  nivel: NivelMetrica;
  metrica?: MetricaCliente;
  keyResults: KeyResult[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await upsertMetrica(prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="nivel" value={metrica?.nivel ?? nivel} />
      {metrica && <input type="hidden" name="metrica_id" value={metrica.id} />}

      <div className="space-y-1">
        <label className={labelClass}>Título</label>
        <input
          name="titulo"
          required
          defaultValue={metrica?.titulo}
          placeholder="ROAS Meta Ads"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelClass}>Valor actual</label>
          <input
            name="valor_actual"
            defaultValue={metrica?.valor_actual ?? ""}
            placeholder="4,9x"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Meta</label>
          <input
            name="meta"
            defaultValue={metrica?.meta ?? ""}
            placeholder="> 7,8x"
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-xs text-tenue">
        Van como texto libre: las metas reales son rangos y múltiplos, no
        números sueltos.
      </p>

      <div className="space-y-1">
        <label className={labelClass}>Progreso (0 a 100)</label>
        <input
          name="progreso_porcentaje"
          type="number"
          min={0}
          max={100}
          defaultValue={metrica?.progreso_porcentaje ?? 0}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Detalle</label>
        <textarea
          name="detalle"
          rows={2}
          defaultValue={metrica?.detalle ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>KR del trimestre vinculado</label>
        <select
          name="kr_asociado_id"
          defaultValue={metrica?.kr_asociado_id ?? ""}
          className={inputClass}
        >
          <option value="">Sin vincular</option>
          {keyResults.map((kr) => (
            <option key={kr.id} value={kr.id}>
              {kr.titulo}
            </option>
          ))}
        </select>
      </div>

      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Guardando…" : metrica ? "Guardar cambios" : "Agregar métrica"}
      </button>
    </form>
  );
}

export function BorrarMetrica({ metricaId }: { metricaId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => deleteMetrica(metricaId))}
      className="text-[11px] text-tenue transition hover:text-red-600 disabled:opacity-40"
    >
      Borrar
    </button>
  );
}

// ------------------------------------------------------------
// Squad
// ------------------------------------------------------------

export function SquadMiembroModal({
  clienteId,
  personas,
  triggerLabel,
  triggerClassName,
}: {
  clienteId: string;
  personas: UsuarioAutorizado[];
  triggerLabel: ReactNode;
  triggerClassName: string;
}) {
  return (
    <Modal
      titulo="Sumar al squad"
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
    >
      {(cerrar) => (
        <SquadMiembroForm
          clienteId={clienteId}
          personas={personas}
          onDone={cerrar}
        />
      )}
    </Modal>
  );
}

function SquadMiembroForm({
  clienteId,
  personas,
  onDone,
}: {
  clienteId: string;
  personas: UsuarioAutorizado[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await addSquadMiembro(prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="cliente_id" value={clienteId} />

      <div className="space-y-1">
        <label className={labelClass}>Nombre</label>
        <input
          name="nombre"
          required
          placeholder="Ayelén"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelClass}>Rol en el squad</label>
          <select name="rol_squad" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Elegí
            </option>
            {ROLES_SQUAD.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Especialidad</label>
          <input
            name="especialidad"
            placeholder="Digital"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Cuenta en la app (opcional)</label>
        <select name="usuario_id" defaultValue="" className={inputClass}>
          <option value="">Sin cuenta / proveedor externo</option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <p className="text-xs text-tenue">
          Vincularlo permite cruzar la cuenta con “Mis Objetivos”. Los
          proveedores externos se cargan solo con el nombre.
        </p>
      </div>

      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Sumando…" : "Sumar al squad"}
      </button>
    </form>
  );
}

export function QuitarMiembro({ miembroId }: { miembroId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => removeSquadMiembro(miembroId))}
      className="text-tenue opacity-0 transition hover:text-red-600 focus:opacity-100 group-hover:opacity-100 disabled:opacity-30"
      aria-label="Quitar del squad"
    >
      ×
    </button>
  );
}
