"use client";

import { useActionState, useState } from "react";
import {
  createOkrAnual,
  createOkrTrimestral,
  createPilar,
  updateOkrAnual,
  updateOkrTrimestral,
  type FormActionState,
} from "@/app/(protected)/okrs/actions";
import { Modal } from "@/components/Modal";
import { AREAS, TRIMESTRES } from "@/lib/types";
import type {
  Area,
  OkrAnual,
  OkrTrimestral,
  Pilar,
  UsuarioAutorizado,
} from "@/lib/types";

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

export function NewOkrAnualForm({
  pilares,
  personas,
}: {
  pilares: Pilar[];
  personas: UsuarioAutorizado[];
}) {
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
      <SelectorResponsables personas={personas} />
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creando…" : "Crear OKR anual"}
      </button>
    </form>
  );
}

/** Cómo se nombra a una persona en el selector.
 *
 * Manda `nombre`, que es la identidad: `responsable` es el alias con el que
 * figura en los OKRs y dos personas pueden compartirlo, con lo cual el
 * desplegable mostraría dos opciones idénticas. Cuando difieren, el alias
 * va entre paréntesis para poder reconocerlo. */
function etiquetaPersona(p: UsuarioAutorizado): string {
  const alias = p.responsable?.trim();
  if (!alias || alias === p.nombre) return p.nombre;
  return `${p.nombre} (${alias})`;
}

/** Quién rinde cuentas, más los que comparten el objetivo.
 *
 * El principal sale por id y no por texto: hasta ahora se tipeaba a mano y
 * el filtro de "Mis Objetivos" comparaba ese texto con un igual exacto, así
 * que un "Ayelén" contra un "Ayelén Bruno" dejaba el objetivo sin dueño sin
 * avisar nada.
 *
 * Los co-responsables se excluyen del principal en vivo: tenerlo en las dos
 * listas duplicaría su avatar en cada tarjeta. */
function SelectorResponsables({
  personas,
  principalPorDefecto = "",
  coPorDefecto = [],
}: {
  personas: UsuarioAutorizado[];
  principalPorDefecto?: string;
  coPorDefecto?: string[];
}) {
  const [principal, setPrincipal] = useState(principalPorDefecto);
  const [co, setCo] = useState<string[]>(coPorDefecto);

  function alternar(id: string, marcado: boolean) {
    setCo((prev) => (marcado ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  const otros = personas.filter((p) => p.id !== principal);
  const elegidos = co.filter((id) => id !== principal);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className={labelClass}>Quién rinde cuentas</label>
        <select
          name="responsable_id"
          required
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Elegí una persona
          </option>
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {etiquetaPersona(p)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1 rounded-md border border-linea p-2.5">
        <label className={labelClass}>
          Además es de… {elegidos.length > 0 && `· ${elegidos.length}`}
        </label>
        <p className="text-xs text-tenue">
          El objetivo aparece en “Mis Objetivos” de todos los que marques.
        </p>
        {otros.length === 0 ? (
          <p className="pt-1 text-xs text-tenue">
            No hay otras personas cargadas en la lista de accesos.
          </p>
        ) : (
          <div className="grid max-h-40 gap-1 overflow-y-auto pt-1 sm:grid-cols-2">
            {otros.map((p) => (
              <label key={p.id} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  name="co_responsables"
                  value={p.id}
                  checked={elegidos.includes(p.id)}
                  onChange={(e) => alternar(p.id, e.target.checked)}
                  className="accent-oxford"
                />
                {etiquetaPersona(p)}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
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
  // Controlado y no `defaultChecked`: useActionState re-renderiza el
  // formulario cuando la acción devuelve error, y con checkbox no
  // controlados eso borra lo que la persona acababa de tildar. Justo
  // después de un error es el peor momento para perderle la selección.
  const [areas, setAreas] = useState<Area[]>(defaultAreas);

  function alternar(area: Area, marcada: boolean) {
    setAreas((prev) =>
      marcada ? [...prev, area] : prev.filter((a) => a !== area)
    );
  }

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
          <label className={labelClass}>
            Áreas involucradas (mínimo dos) · {areas.length} elegida
            {areas.length === 1 ? "" : "s"}
          </label>
          <div className="grid gap-1 sm:grid-cols-2">
            {AREAS.map((a) => (
              <label key={a} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  name="areas_involucradas"
                  value={a}
                  checked={areas.includes(a)}
                  onChange={(e) => alternar(a, e.target.checked)}
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

export function OkrTrimestralModal({
  okr,
  okrsAnuales,
  personas,
  coResponsablesActuales,
  triggerLabel,
  triggerClassName,
}: {
  okr: OkrTrimestral;
  okrsAnuales: OkrAnual[];
  personas: UsuarioAutorizado[];
  coResponsablesActuales: string[];
  triggerLabel: string;
  triggerClassName: string;
}) {
  return (
    <Modal
      titulo="Editar OKR trimestral"
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
    >
      {(cerrar) => (
        <EditOkrTrimestralForm
          okr={okr}
          okrsAnuales={okrsAnuales}
          personas={personas}
          coResponsablesActuales={coResponsablesActuales}
          onDone={cerrar}
        />
      )}
    </Modal>
  );
}

export function OkrAnualModal({
  okr,
  pilares,
  personas,
  coResponsablesActuales,
  triggerLabel,
  triggerClassName,
}: {
  okr: OkrAnual;
  pilares: Pilar[];
  personas: UsuarioAutorizado[];
  coResponsablesActuales: string[];
  triggerLabel: string;
  triggerClassName: string;
}) {
  return (
    <Modal
      titulo="Editar OKR anual"
      triggerLabel={triggerLabel}
      triggerClassName={triggerClassName}
    >
      {(cerrar) => (
        <EditOkrAnualForm
          okr={okr}
          pilares={pilares}
          personas={personas}
          coResponsablesActuales={coResponsablesActuales}
          onDone={cerrar}
        />
      )}
    </Modal>
  );
}

function EditOkrAnualForm({
  okr,
  pilares,
  personas,
  coResponsablesActuales,
  onDone,
}: {
  okr: OkrAnual;
  pilares: Pilar[];
  personas: UsuarioAutorizado[];
  coResponsablesActuales: string[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    async (prev, formData) => {
      const result = await updateOkrAnual(okr.id, prev, formData);
      if (!result?.error) onDone();
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-2">
      <div className="space-y-1">
        <label className={labelClass}>Pilar</label>
        <select
          name="pilar_id"
          defaultValue={okr.pilar_id ?? ""}
          className={inputClass}
        >
          <option value="">Sin pilar</option>
          {pilares.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Título</label>
        <input
          name="titulo"
          required
          defaultValue={okr.titulo}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Objetivo</label>
        <textarea
          name="objetivo"
          rows={2}
          defaultValue={okr.objetivo ?? ""}
          className={inputClass}
        />
      </div>
      <SelectorResponsables
        personas={personas}
        principalPorDefecto={okr.responsable_id ?? ""}
        coPorDefecto={coResponsablesActuales}
      />
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

export function EditOkrTrimestralForm({
  okr,
  okrsAnuales,
  personas,
  coResponsablesActuales,
  onDone,
}: {
  okr: OkrTrimestral;
  okrsAnuales: OkrAnual[];
  personas: UsuarioAutorizado[];
  coResponsablesActuales: string[];
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
      <SelectorResponsables
        personas={personas}
        principalPorDefecto={okr.responsable_id ?? ""}
        coPorDefecto={coResponsablesActuales}
      />
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

export function NewOkrTrimestralForm({
  okrsAnuales,
  personas,
}: {
  okrsAnuales: OkrAnual[];
  personas: UsuarioAutorizado[];
}) {
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
      <SelectorResponsables personas={personas} />
      <CamposColaborativos />
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creando…" : "Crear OKR trimestral"}
      </button>
    </form>
  );
}
