"use client";

import { useActionState } from "react";
import {
  createHito,
  createKeyResult,
  createOkrAnual,
  createOkrTrimestral,
  createPilar,
  type FormActionState,
} from "@/app/(protected)/okrs/actions";
import { AREAS, TIPOS_MEDICION, TRIMESTRES } from "@/lib/types";
import type { KeyResult, OkrAnual, OkrTrimestral, Pilar } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20";
const labelClass = "text-xs font-medium text-neutral-500";
const submitClass =
  "rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900";

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
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creando…" : "Crear OKR trimestral"}
      </button>
    </form>
  );
}

export function NewKeyResultForm({
  okrsTrimestrales,
}: {
  okrsTrimestrales: OkrTrimestral[];
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    createKeyResult,
    undefined
  );
  return (
    <form action={formAction} className="space-y-2">
      <div className="space-y-1">
        <label className={labelClass}>OKR trimestral</label>
        <select name="okr_trimestral_id" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Elegí un OKR trimestral
          </option>
          {okrsTrimestrales.map((o) => (
            <option key={o.id} value={o.id}>
              [{o.area}] {o.titulo} ({o.trimestre} {o.anio})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Título del KR</label>
        <input name="titulo" required className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Tipo de medición</label>
        <select name="tipo_medicion" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Elegí un tipo
          </option>
          {TIPOS_MEDICION.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={labelClass}>Valor inicial</label>
          <input name="valor_inicial" type="number" step="any" defaultValue={0} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Meta (ignorado si es &quot;hitos&quot;)</label>
          <input name="valor_meta" type="number" step="any" className={inputClass} />
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Cliente asociado (opcional)</label>
        <input name="cliente_asociado" className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Margen de utilidad esperado (%)</label>
        <input
          name="margen_utilidad_esperado"
          type="number"
          step="any"
          defaultValue={65}
          className={inputClass}
        />
      </div>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creando…" : "Crear Key Result"}
      </button>
    </form>
  );
}

export function NewHitoForm({ keyResults }: { keyResults: KeyResult[] }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    createHito,
    undefined
  );
  const krsHitos = keyResults.filter((kr) => kr.tipo_medicion === "hitos");

  if (krsHitos.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Creá primero un Key Result de tipo &quot;hitos&quot; para poder agregarle hitos.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <div className="space-y-1">
        <label className={labelClass}>Key Result</label>
        <select name="kr_id" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Elegí un KR
          </option>
          {krsHitos.map((kr) => (
            <option key={kr.id} value={kr.id}>
              {kr.titulo}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Título del hito</label>
        <input name="titulo" required className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Orden</label>
        <input name="orden" type="number" defaultValue={0} className={inputClass} />
      </div>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creando…" : "Crear hito"}
      </button>
    </form>
  );
}
