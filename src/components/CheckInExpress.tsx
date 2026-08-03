"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { submitCheckInExpress, type ExpressState } from "@/app/(protected)/checkin/actions";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { RentabilityBadge } from "@/components/RentabilityBadge";
import { TrendChart } from "@/components/TrendChart";
import { formatValor, progresoPct } from "@/lib/kr-logic";
import type { CheckIn, KeyResultCompleto, Semaforo } from "@/lib/types";

const DIAS_FRESCO = 7;

const SEMAFORO_OPCIONES: { valor: Semaforo; label: string; sub: string }[] = [
  { valor: "verde", label: "Verde", sub: "En camino" },
  { valor: "amarillo", label: "Amarillo", sub: "En riesgo / Atención" },
  { valor: "rojo", label: "Rojo", sub: "Bloqueado / Crítico" },
];

function ultimoCheckIn(checkIns: CheckIn[]): CheckIn | null {
  return checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;
}

function esPendiente(checkIns: CheckIn[]): boolean {
  const ultimo = ultimoCheckIn(checkIns);
  if (!ultimo) return true;
  const dias = (Date.now() - new Date(ultimo.creado_at).getTime()) / 86400000;
  return dias >= DIAS_FRESCO;
}

function QuickSteps({
  onStep,
  tipo,
}: {
  onStep: (delta: number) => void;
  tipo: string;
}) {
  const pasos = tipo === "moneda" ? [-100000, -10000, 10000, 100000] : [-10, -1, 1, 10];
  const fmt = (n: number) =>
    tipo === "moneda"
      ? `${n > 0 ? "+" : "−"}${Math.abs(n) / 1000}k`
      : `${n > 0 ? "+" : "−"}${Math.abs(n)}`;
  return (
    <div className="flex gap-1">
      {pasos.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onStep(p)}
          className="rounded-md border border-linea px-2 py-1 text-xs font-medium text-tenue transition hover:bg-linea/60"
        >
          {fmt(p)}
        </button>
      ))}
    </div>
  );
}

function CheckInModal({
  kr,
  checkIns,
  usuario,
  onClose,
}: {
  kr: KeyResultCompleto;
  checkIns: CheckIn[];
  usuario: string;
  onClose: () => void;
}) {
  const esHitos = kr.tipo_medicion === "hitos";
  const [valor, setValor] = useState(kr.valor_actual);
  const [estado, setEstado] = useState<Semaforo>(kr.estado_semaforo);
  const [cumplidos, setCumplidos] = useState<Set<string>>(
    new Set(kr.hitos_kr.filter((h) => h.cumplido).map((h) => h.id))
  );

  const boundAction = submitCheckInExpress.bind(null, kr.id);
  const [state, formAction, pending] = useActionState<ExpressState, FormData>(
    async (prev, formData) => {
      const result = await boundAction(prev, formData);
      if (result?.ok) onClose();
      return result;
    },
    undefined
  );

  const hitosOrdenados = [...kr.hitos_kr].sort((a, b) => a.orden - b.orden);
  const pctHitos =
    hitosOrdenados.length === 0
      ? 0
      : Math.round((cumplidos.size / hitosOrdenados.length) * 100);

  const requiereComentario = estado === "amarillo" || estado === "rojo";
  // margen_utilidad_esperado siempre tiene default; el impacto real en la
  // Estrella Polar lo marca tener un cliente asociado o margen real cargado.
  const tieneImpactoRentabilidad =
    kr.cliente_asociado != null || kr.margen_actual_pct != null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-linea/600 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-linea bg-panel p-6 shadow-xl">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-tenue">
              {kr.okr_trimestral?.area} · {kr.okr_trimestral?.titulo}
            </p>
            <h2 className="text-base font-semibold leading-snug">{kr.titulo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-tenue hover:text-foreground"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 mt-3">
          <TrendChart
            checkIns={checkIns.slice(-8)}
            valorMeta={esHitos ? 100 : kr.valor_meta}
          />
        </div>

        {tieneImpactoRentabilidad && (
          <div className="mb-4 rounded-lg border border-oxford/30 bg-oxford-suave px-3 py-2 text-xs text-oxford">
            <span className="font-semibold">Recordatorio SOLOP:</span> este
            objetivo impacta en la Estrella Polar. Verificá la rentabilidad en
            SOLOP si hubo cambio de alcance.
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="usuario" value={usuario} />
          <input type="hidden" name="tipo_medicion" value={kr.tipo_medicion} />

          {esHitos ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-tenue">
                  Hitos cumplidos
                </span>
                <span className="text-sm font-semibold">{pctHitos}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
                <div
                  className="h-full rounded-full bg-oxford transition-all"
                  style={{ width: `${pctHitos}%` }}
                />
              </div>
              <ul className="space-y-2 pt-1">
                {hitosOrdenados.map((hito) => (
                  <li key={hito.id} className="flex items-center gap-2 text-sm">
                    <input type="hidden" name="hito_todos" value={hito.id} />
                    <input
                      type="checkbox"
                      name="hito_cumplido"
                      value={hito.id}
                      checked={cumplidos.has(hito.id)}
                      onChange={(e) =>
                        setCumplidos((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(hito.id);
                          else next.delete(hito.id);
                          return next;
                        })
                      }
                      className="h-4 w-4 rounded border-linea-fuerte"
                    />
                    <span
                      className={clsx(
                        cumplidos.has(hito.id) && "text-tenue line-through"
                      )}
                    >
                      {hito.titulo}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium text-tenue">
                Valor actual{" "}
                <span className="text-tenue">
                  (meta: {formatValor(kr.valor_meta, kr.tipo_medicion)})
                </span>
              </label>
              <div className="flex items-center gap-2">
                {kr.tipo_medicion === "moneda" && (
                  <span className="text-sm text-tenue">$</span>
                )}
                <input
                  name="valor_registrado"
                  type="number"
                  step="any"
                  value={valor}
                  onChange={(e) => setValor(Number(e.target.value))}
                  className="w-32 rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
                />
                {kr.tipo_medicion === "porcentaje" && (
                  <span className="text-sm text-tenue">%</span>
                )}
                <QuickSteps
                  tipo={kr.tipo_medicion}
                  onStep={(d) => setValor((v) => Math.round((v + d) * 100) / 100)}
                />
              </div>
              {kr.tipo_medicion === "moneda" && (
                <p className="text-xs text-tenue">
                  {formatValor(valor, "moneda")}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-tenue">Estado</span>
            <div className="grid grid-cols-3 gap-2">
              {SEMAFORO_OPCIONES.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  onClick={() => setEstado(op.valor)}
                  className={clsx(
                    "rounded-lg border px-2 py-2 text-left transition",
                    estado === op.valor
                      ? op.valor === "verde"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : op.valor === "amarillo"
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-red-500 bg-red-500/10"
                      : "border-linea hover:border-oxford/50"
                  )}
                >
                  <span className="block text-sm font-semibold">{op.label}</span>
                  <span className="block text-xs text-tenue">{op.sub}</span>
                </button>
              ))}
            </div>
            <input type="hidden" name="estado_semaforo" value={estado} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-tenue">
              ¿Qué bloqueos o necesidades tenés para presentar en la reunión LOM?
              {requiereComentario && (
                <span className="ml-1 text-red-600">(obligatorio)</span>
              )}
            </label>
            <textarea
              name="comentario_bloqueos"
              rows={2}
              required={requiereComentario}
              className="w-full rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
            />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-oxford px-3 py-2 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar check-in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function CheckInExpress({
  krs,
  checkIns,
  trimestre,
  anio,
}: {
  krs: KeyResultCompleto[];
  checkIns: CheckIn[];
  trimestre: string;
  anio: number;
}) {
  const responsables = useMemo(() => {
    const set = new Set<string>();
    for (const kr of krs) {
      if (kr.okr_trimestral?.responsable) set.add(kr.okr_trimestral.responsable);
    }
    return [...set].sort();
  }, [krs]);

  const [responsable, setResponsable] = useState<string>("Todos");
  const [modalKr, setModalKr] = useState<KeyResultCompleto | null>(null);

  const porKr = useMemo(() => {
    const map = new Map<string, CheckIn[]>();
    for (const c of checkIns) {
      if (!map.has(c.kr_id)) map.set(c.kr_id, []);
      map.get(c.kr_id)!.push(c);
    }
    return map;
  }, [checkIns]);

  const visibles = useMemo(
    () =>
      responsable === "Todos"
        ? krs
        : krs.filter((kr) => kr.okr_trimestral?.responsable === responsable),
    [krs, responsable]
  );

  const pendientes = visibles.filter((kr) => esPendiente(porKr.get(kr.id) ?? []));
  const alDia = visibles.filter((kr) => !esPendiente(porKr.get(kr.id) ?? []));
  const todoCompleto = visibles.length > 0 && pendientes.length === 0;

  function renderCard(kr: KeyResultCompleto, pendiente: boolean) {
    const historial = porKr.get(kr.id) ?? [];
    const ultimo = ultimoCheckIn(historial);
    const hitosCumplidos = kr.hitos_kr.filter((h) => h.cumplido).length;

    return (
      <div
        key={kr.id}
        className={clsx(
          "flex flex-col gap-2 rounded-lg border p-4",
          pendiente
            ? "border-linea"
            : "border-linea opacity-70"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-tenue">
            {kr.okr_trimestral?.area}
          </p>
          <span className="flex items-center gap-1.5">
            <RentabilityBadge kr={kr} />
            <SemaforoBadge estado={kr.estado_semaforo} compact />
          </span>
        </div>
        <p className="text-sm font-medium leading-snug">{kr.titulo}</p>

        {kr.tipo_medicion !== "hitos" ? (
          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-linea">
              <div
                className="h-full rounded-full bg-oxford"
                style={{ width: `${progresoPct(kr)}%` }}
              />
            </div>
            <p className="text-xs text-tenue">
              {formatValor(kr.valor_actual, kr.tipo_medicion)} /{" "}
              {formatValor(kr.valor_meta, kr.tipo_medicion)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-tenue">
            {hitosCumplidos} / {kr.hitos_kr.length} hitos cumplidos
          </p>
        )}

        <p className="text-xs text-tenue">
          {ultimo
            ? `Último check-in ${formatDistanceToNow(new Date(ultimo.creado_at), {
                addSuffix: true,
                locale: es,
              })} · ${ultimo.usuario}`
            : "Sin check-ins todavía"}
        </p>

        <button
          type="button"
          onClick={() => setModalKr(kr)}
          className={clsx(
            "mt-auto rounded-md px-3 py-1.5 text-sm font-medium transition",
            pendiente
              ? "bg-oxford text-white"
              : "border border-linea text-tenue border-linea "
          )}
        >
          {pendiente ? "Cargar check-in (2 min)" : "Actualizar check-in"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Check-in Express</h1>
          <p className="text-sm text-tenue">
            {trimestre} {anio} · carga semanal en menos de 2 minutos por KR.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-tenue">Responsable:</span>
          <select
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            className="rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="Todos">Todos</option>
            {responsables.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      {todoCompleto && (
        <div className="animate-bounce rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          🎉 ¡Todos los check-ins de la semana están al día!
        </div>
      )}

      {visibles.length === 0 && (
        <p className="text-sm text-tenue">
          No hay Key Results en {trimestre} {anio} para este responsable.
        </p>
      )}

      {pendientes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tenue">
            Pendientes esta semana ({pendientes.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendientes.map((kr) => renderCard(kr, true))}
          </div>
        </section>
      )}

      {alDia.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tenue">
            Al día ({alDia.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alDia.map((kr) => renderCard(kr, false))}
          </div>
        </section>
      )}

      {modalKr && (
        <CheckInModal
          kr={modalKr}
          checkIns={porKr.get(modalKr.id) ?? []}
          usuario={
            responsable !== "Todos"
              ? responsable
              : (modalKr.okr_trimestral?.responsable ?? "Equipo")
          }
          onClose={() => setModalKr(null)}
        />
      )}
    </div>
  );
}
