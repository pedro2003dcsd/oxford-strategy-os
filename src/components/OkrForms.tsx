"use client";

import { useActionState, useState } from "react";
import {
  createOkrAnual,
  createOkrTrimestral,
  createPilar,
  updateOkrTrimestral,
  type FormActionState,
} from "@/app/(protected)/okrs/actions";
import { AREAS, TRIMESTRES } from "@/lib/types";
import type { Area, OkrAnual, OkrTrimestral, Pilar } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm";
const labelClass = "text-xs font-medium text-tenue";
const submitClass =
  "rounded-md bg-oxford px-3 py-1.5 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50";

function ErrorText({ state }: { state: FormActionState }) {
  if (!state?.error) return null;
  return <p className="text-sm text-red-600">{state.error}</p>;
}

export function NewPilarForm() {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    createPilar,
    undefined
  );
  return (
    <form action={formAction} className="space-y-2">
      <div className="space-y-1">
        <label className={labelClass}>Nombre</label>
        <input name="nombre" required className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Descripción</label>
        <input name="descripcion" className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Año</label>
        <input name="anio" type="number" defaultValue={2026} className={inputClass} />
      </div>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creando…" : "Crear pilar"}
      </button>
    </form>
  );
}

export function NewOkrAnualForm({ pilares }: { pilares: Pilar[] }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    createOkrAnual,
    undefined
  );
  return (
    <form action={formAction} className="space-y-2">
      <div className="space-y-1">
        <label className={labelClass}>Pilar</label>
        <select name="pilar_id" required className={inputClass}>
          {pilares.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Título del OKR anual</label>
        <input name="titulo" required className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Objetivo</label>
        <textarea name="objetivo" rows={2} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Responsable</label>
        <input name="responsable" className={inputClass} />
      </div>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creando…" : "Crear OKR anual"}
      </button>
    </form>
  );
}

/** Casilla de colaborativo más la grilla de áreas.
 *
 * Las áreas aparecen solo con la casilla tildada: mostrarlas siempre invita
 * a marcar áreas en objetivos de una sola, y después el filtro de
 * colaborativos trae cosas que no lo son. */
function CamposColaborativos({
  defaultChecked = false,
  defaultAreas = [],
}: {
  defaultChecked?: boolean;
  defaultAreas?: Area[];
}) {
  const [colaborativo, setColaborativo] = useState(defaultChecked);

  return (
    <div className="space-y-2 rounded-md border border-linea p-2.5">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="es_colaborativo"
          checked={colaborativo}
          onChange={(e) => setColaborativo(e.target.checked)}
          className="accent-oxford"
        />
        <span className="font-medium">Objetivo colaborativo</span>
      </label>
      <p className="text-xs text-tenue">
        Transversal a varias áreas, como “Vender más Oxford” o “Eficiencia
        operativa global”.
      </p>

      {colaborativo && (
        <div className="space-y-1 pt-1">
          <label className={labelClass}>Áreas involucradas (mínimo dos)</label>
          <div className="grid gap-1 sm:grid-cols-2">
            {AREAS.map((a) => (
              <label key={a} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  name="areas_involucradas"
                  value={a}
                  defaultChecked={defaultAreas.includes(a)}
                  className="accent-oxford"
                />
                {a}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function EditOkrTrimestralForm({
  okr,
  okrsAnuales,
  onDone,
}: {
  okr: OkrTrimestral;
  okrsAnuales: OkrAnual[];
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await updateOkrTrimestral(okr.id, prev, formData);
      if (!result?.error) onDone?.();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-2">
      <div className="space-y-1">
        <label className={labelClass}>OKR anual</label>
        <select
          name="okr_anual_id"
          className={inputClass}
          defaultValue={okr.okr_anual_id ?? ""}
        >
          <option value="">Sin alinear todavía</option>
          {okrsAnuales.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titulo}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Área principal</label>
        <select name="area" required className={inputClass} defaultValue={okr.area}>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Título</label>
        <input name="titulo" required defaultValue={okr.titulo} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelClass}>Trimestre</label>
          <select
            name="trimestre"
            required
            className={inputClass}
            defaultValue={okr.trimestre}
          >
            {TRIMESTRES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Año</label>
          <input
            name="anio"
            type="number"
            defaultValue={okr.anio}
            className={inputClass}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Responsable que rinde cuentas</label>
        <input
          name="responsable"
          required
          defaultValue={okr.responsable}
          className={inputClass}
        />
      </div>
      <CamposColaborativos
        defaultChecked={okr.es_colaborativo}
        defaultAreas={okr.areas_involucradas ?? []}
      />
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

export function NewOkrTrimestralForm({ okrsAnuales }: { okrsAnuales: OkrAnual[] }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    createOkrTrimestral,
    undefined
  );
  return (
    <form action={formAction} className="space-y-2">
      <div className="space-y-1">
        <label className={labelClass}>
          OKR anual (opcional — se puede alinear después)
        </label>
        <select name="okr_anual_id" className={inputClass} defaultValue="">
          <option value="">Sin alinear todavía</option>
          {okrsAnuales.map((o) => (
            <option key={o.id} value={o.id}>
              {o.titulo}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Área</label>
        <select name="area" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Elegí un área
          </option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Título</label>
        <input name="titulo" required className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelClass}>Trimestre</label>
          <select name="trimestre" required className={inputClass} defaultValue="">
            <option value="" disabled>
              --
            </option>
            {TRIMESTRES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Año</label>
          <input name="anio" type="number" defaultValue={2026} className={inputClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Responsable</label>
        <input name="responsable" required className={inputClass} />
      </div>
      <CamposColaborativos />
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creando…" : "Crear OKR trimestral"}
      </button>
    </form>
  );
}
