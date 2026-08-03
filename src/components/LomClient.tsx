"use client";

import { useMemo, useState, useTransition } from "react";
import { useActionState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  addCompromisoLom,
  toggleCompromisoLom,
  type CompromisoState,
} from "@/app/(protected)/lom/actions";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { RentabilityBadge } from "@/components/RentabilityBadge";
import { Sparkline } from "@/components/Sparkline";
import { Avatar } from "@/components/Avatar";
import { formatValor, hasAlertaRentabilidad, progresoPct } from "@/lib/kr-logic";
import { generarResumenLom, generarResumenChat } from "@/lib/resumen-lom";
import {
  areaPorResponsable,
  compromisosDeLaLomPasada,
  compromisoVencido,
  dependenciaCruzada,
} from "@/lib/lom";
import { responsablesDe } from "@/lib/personas";
import { AREAS, TRIMESTRES } from "@/lib/types";
import type { CheckIn, CompromisoLom, KeyResultCompleto } from "@/lib/types";

const TRIM_OPTIONS = ["Todos", ...TRIMESTRES] as const;
const AREA_OPTIONS = ["Todas", ...AREAS] as const;

const DIAS_CUATRO_SEMANAS = 28;

/** Los check-ins de las últimas 4 semanas. Si en ese lapso hubo menos de dos,
 * caemos a los últimos 6 para que la línea no quede vacía. */
function ultimasCuatroSemanas(historial: CheckIn[]): CheckIn[] {
  const corte = Date.now() - DIAS_CUATRO_SEMANAS * 86400000;
  const recientes = historial.filter(
    (c) => new Date(c.creado_at).getTime() >= corte
  );
  return recientes.length >= 2 ? recientes : historial.slice(-6);
}

function ItemCompromiso({
  compromiso,
  onToggle,
  deshabilitado,
}: {
  compromiso: CompromisoLom;
  onToggle: (cumplido: boolean) => void;
  deshabilitado: boolean;
}) {
  const vencido = compromisoVencido(compromiso);
  return (
    <li className="flex items-start gap-2 text-xs">
      <input
        type="checkbox"
        checked={compromiso.cumplido}
        disabled={deshabilitado}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={`Marcar cumplido: ${compromiso.descripcion}`}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-linea-fuerte accent-[var(--oxford)]"
      />
      <span className="min-w-0 flex-1">
        <span className={clsx("block", compromiso.cumplido && "text-tenue line-through")}>
          {compromiso.descripcion}
        </span>
        <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {compromiso.responsable && <Avatar nombre={compromiso.responsable} />}
          {compromiso.fecha_limite && (
            <span
              className={clsx(
                "text-[11px]",
                vencido ? "font-medium text-red-700 dark:text-red-400" : "text-tenue"
              )}
            >
              {vencido ? "⚠ Venció " : "Vence "}
              {new Date(compromiso.fecha_limite).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
        </span>
      </span>
    </li>
  );
}

function CompromisosLom({
  kr,
  compromisos,
  responsables,
}: {
  kr: KeyResultCompleto;
  compromisos: CompromisoLom[];
  responsables: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const boundAction = addCompromisoLom.bind(null, kr.id);
  const [state, formAction, adding] = useActionState<CompromisoState, FormData>(
    boundAction,
    undefined
  );

  return (
    <div className="space-y-1.5 border-t border-linea pt-2">
      <p className="text-xs font-semibold text-tenue">Compromisos LOM</p>
      {compromisos.length === 0 && (
        <p className="text-xs text-tenue">Sin compromisos anotados.</p>
      )}
      <ul className="space-y-1.5">
        {compromisos.map((c) => (
          <ItemCompromiso
            key={c.id}
            compromiso={c}
            deshabilitado={isPending}
            onToggle={(cumplido) =>
              startTransition(() => {
                toggleCompromisoLom(c.id, cumplido);
              })
            }
          />
        ))}
      </ul>
      <form action={formAction} className="space-y-1.5">
        <input
          name="descripcion"
          placeholder='Ej: "Revisar presupuesto con Dolores"'
          className="w-full rounded-md border border-linea bg-transparent px-2 py-1 text-xs"
        />
        <div className="flex gap-1.5">
          <select
            name="responsable"
            defaultValue={kr.okr_trimestral?.responsable ?? ""}
            aria-label="Responsable del compromiso"
            className="min-w-0 flex-1 rounded-md border border-linea bg-transparent px-2 py-1 text-xs"
          >
            <option value="">Responsable…</option>
            {responsables.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            name="fecha_limite"
            type="date"
            aria-label="Fecha límite del compromiso"
            className="rounded-md border border-linea bg-transparent px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={adding}
            className="shrink-0 rounded-md border border-linea px-2 py-1 text-xs font-medium transition hover:border-oxford/50 disabled:opacity-50"
          >
            {adding ? "…" : "Anotar"}
          </button>
        </div>
      </form>
      {state?.error && (
        <p className="text-xs text-red-700 dark:text-red-400">{state.error}</p>
      )}
    </div>
  );
}

/** Revisión de la reunión anterior: lo primero que hace la LOM es preguntar
 * qué pasó con lo que se acordó la semana pasada. */
function RevisionLomPasada({
  compromisos,
  krs,
}: {
  compromisos: CompromisoLom[];
  krs: KeyResultCompleto[];
}) {
  const [isPending, startTransition] = useTransition();
  const pasados = useMemo(() => compromisosDeLaLomPasada(compromisos), [compromisos]);

  if (pasados.length === 0) return null;

  const cumplidos = pasados.filter((c) => c.cumplido).length;

  return (
    <details
      open
      className="rounded-xl border border-linea bg-panel p-4"
    >
      <summary className="cursor-pointer text-sm font-semibold">
        Compromisos de la LOM pasada{" "}
        <span className="font-normal text-tenue">
          · {cumplidos} de {pasados.length} cumplidos
        </span>
      </summary>
      <ul className="mt-3 space-y-2">
        {pasados.map((c) => {
          const kr = krs.find((k) => k.id === c.kr_id);
          return (
            <li key={c.id}>
              <ItemCompromiso
                compromiso={c}
                deshabilitado={isPending}
                onToggle={(cumplido) =>
                  startTransition(() => {
                    toggleCompromisoLom(c.id, cumplido);
                  })
                }
              />
              {kr && (
                <p className="pl-6 text-[11px] text-tenue">sobre: {kr.titulo}</p>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function ResumenModal({
  markdown,
  onClose,
}: {
  markdown: string;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function descargar() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumen-lom-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-linea bg-panel shadow-xl">
        <div className="flex items-center justify-between border-b border-linea px-6 py-4">
          <h2 className="text-base font-semibold">Resumen ejecutivo LOM</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copiar}
              className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium"
            >
              {copiado ? "✓ Copiado" : "Copiar resumen"}
            </button>
            <button
              type="button"
              onClick={descargar}
              className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium"
            >
              Descargar .md
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-tenue hover:text-foreground"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-6 py-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {markdown}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function LomClient({
  krs,
  checkIns,
  compromisos,
}: {
  krs: KeyResultCompleto[];
  checkIns: CheckIn[];
  compromisos: CompromisoLom[];
}) {
  const [soloDesvios, setSoloDesvios] = useState(true);
  const [trimestre, setTrimestre] = useState<(typeof TRIM_OPTIONS)[number]>("Todos");
  const [area, setArea] = useState<(typeof AREA_OPTIONS)[number]>("Todas");
  const [resumen, setResumen] = useState<string | null>(null);
  const [copiadoChat, setCopiadoChat] = useState<"ok" | "error" | null>(null);

  const porKr = useMemo(() => {
    const map = new Map<string, CheckIn[]>();
    for (const c of checkIns) {
      if (!map.has(c.kr_id)) map.set(c.kr_id, []);
      map.get(c.kr_id)!.push(c);
    }
    return map;
  }, [checkIns]);

  const responsables = useMemo(() => responsablesDe(krs), [krs]);
  const areasPorResponsable = useMemo(() => areaPorResponsable(krs), [krs]);

  const compPorKr = useMemo(() => {
    const map = new Map<string, CompromisoLom[]>();
    for (const c of compromisos) {
      if (!map.has(c.kr_id)) map.set(c.kr_id, []);
      map.get(c.kr_id)!.push(c);
    }
    return map;
  }, [compromisos]);

  const filtrados = useMemo(
    () =>
      krs.filter((kr) => {
        if (trimestre !== "Todos" && kr.okr_trimestral?.trimestre !== trimestre)
          return false;
        if (area !== "Todas" && kr.okr_trimestral?.area !== area) return false;
        return true;
      }),
    [krs, trimestre, area]
  );

  const total = filtrados.length;
  const nVerde = filtrados.filter((k) => k.estado_semaforo === "verde").length;
  const nAmarillo = filtrados.filter((k) => k.estado_semaforo === "amarillo").length;
  const nRojo = filtrados.filter((k) => k.estado_semaforo === "rojo").length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const visibles = useMemo(() => {
    const lista = soloDesvios
      ? filtrados.filter((k) => k.estado_semaforo !== "verde")
      : filtrados;
    // Rojos primero, después amarillos, después verdes.
    const orden = { rojo: 0, amarillo: 1, verde: 2 };
    return [...lista].sort(
      (a, b) => orden[a.estado_semaforo] - orden[b.estado_semaforo]
    );
  }, [filtrados, soloDesvios]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Modo LOM</h1>
          <p className="text-sm text-tenue">
            Tablero de dirección: solo lo que necesita atención.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              const texto = generarResumenChat(filtrados, checkIns, compromisos);
              try {
                await navigator.clipboard.writeText(texto);
                setCopiadoChat("ok");
              } catch {
                // Pasa si el navegador bloquea el portapapeles: mostramos el
                // resumen en el modal para que se pueda copiar a mano.
                setCopiadoChat("error");
                setResumen(texto);
              }
              setTimeout(() => setCopiadoChat(null), 2500);
            }}
            className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium transition hover:border-oxford/50"
          >
            {copiadoChat === "ok"
              ? "✓ Copiado"
              : copiadoChat === "error"
                ? "Copialo del cuadro"
                : "📋 Copiar para Slack / WhatsApp"}
          </button>
          <button
            type="button"
            onClick={() =>
              setResumen(generarResumenLom(filtrados, checkIns, compromisos))
            }
            className="rounded-md bg-oxford px-3 py-1.5 text-sm font-medium text-white transition hover:bg-oxford-fuerte"
          >
            ✦ Generar resumen LOM
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Verde", nVerde, "emerald"],
            ["Amarillo", nAmarillo, "amber"],
            ["Rojo", nRojo, "red"],
          ] as const
        ).map(([label, n, tone]) => (
          <div
            key={label}
            className={clsx(
              "rounded-xl border p-4",
              tone === "emerald" && "border-emerald-500/30 bg-emerald-500/5",
              tone === "amber" && "border-amber-500/30 bg-amber-500/5",
              tone === "red" && "border-red-500/30 bg-red-500/5"
            )}
          >
            <p className="text-xs font-medium text-tenue">{label}</p>
            <p className="text-2xl font-semibold">
              {pct(n)}%{" "}
              <span className="text-sm font-normal text-tenue">
                ({n} de {total})
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={trimestre}
            onChange={(e) => setTrimestre(e.target.value as typeof trimestre)}
            className="rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
          >
            {TRIM_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t === "Todos" ? "Todos los trimestres" : t}
              </option>
            ))}
          </select>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as typeof area)}
            className="rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm"
          >
            {AREA_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a === "Todas" ? "Todas las áreas" : a}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloDesvios}
            onChange={(e) => setSoloDesvios(e.target.checked)}
            className="h-4 w-4 rounded border-linea-fuerte"
          />
          <span className="font-medium">Solo desvíos (amarillo/rojo)</span>
        </label>
      </div>

      <RevisionLomPasada compromisos={compromisos} krs={krs} />

      {visibles.length === 0 && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          🎉 Sin desvíos para este filtro: nada que escalar a la LOM.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {visibles.map((kr) => {
          const historial = porKr.get(kr.id) ?? [];
          const ultimoConComentario = [...historial]
            .reverse()
            .find((c) => c.comentario_bloqueos);
          const alerta = hasAlertaRentabilidad(kr);
          const dependencia = dependenciaCruzada(
            kr,
            ultimoConComentario ?? null,
            areasPorResponsable
          );

          return (
            <div
              key={kr.id}
              className={clsx(
                "flex flex-col gap-2.5 rounded-xl border p-4",
                kr.estado_semaforo === "rojo"
                  ? "border-red-500/40"
                  : kr.estado_semaforo === "amarillo"
                    ? "border-amber-500/40"
                    : "border-linea"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-tenue">
                  {kr.okr_trimestral?.area ?? "Sin área"}
                  {kr.okr_trimestral?.responsable && (
                    <span className="ml-2 rounded-full bg-linea/60 px-2 py-0.5 font-medium normal-case tracking-normal">
                      {kr.okr_trimestral.responsable}
                    </span>
                  )}
                </p>
                <span className="flex items-center gap-1.5">
                  <RentabilityBadge kr={kr} />
                  <SemaforoBadge estado={kr.estado_semaforo} />
                </span>
              </div>

              <Link
                href={`/kr/${kr.id}`}
                className="text-sm font-medium leading-snug hover:underline"
              >
                {kr.titulo}
              </Link>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Sparkline
                    checkIns={ultimasCuatroSemanas(historial)}
                    valorMeta={kr.tipo_medicion === "hitos" ? 100 : kr.valor_meta}
                  />
                  <p className="pt-0.5 text-[11px] text-tenue">Últimas 4 semanas</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{progresoPct(kr)}%</p>
                  <p className="text-xs text-tenue">
                    {kr.tipo_medicion === "hitos"
                      ? `${kr.hitos_kr.filter((h) => h.cumplido).length}/${kr.hitos_kr.length} hitos`
                      : `${formatValor(kr.valor_actual, kr.tipo_medicion)} / ${formatValor(kr.valor_meta, kr.tipo_medicion)}`}
                  </p>
                </div>
              </div>

              {dependencia && (
                <p className="rounded-md bg-oxford-suave px-2 py-1 text-xs font-medium text-oxford">
                  🔗 Caído por bloqueo en: {dependencia.area}
                  <span className="block font-normal text-tenue">
                    {dependencia.detalle}
                  </span>
                </p>
              )}

              {alerta && (
                <p className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                  ⚠ Margen real ({kr.margen_actual_pct}%) por debajo del esperado (
                  {kr.margen_utilidad_esperado}%)
                </p>
              )}

              {ultimoConComentario && (
                <blockquote className="border-l-2 border-linea-fuerte pl-2 text-xs italic text-tenue">
                  &ldquo;{ultimoConComentario.comentario_bloqueos}&rdquo;
                  <span className="not-italic"> — {ultimoConComentario.usuario}</span>
                </blockquote>
              )}

              <CompromisosLom
                kr={kr}
                compromisos={compPorKr.get(kr.id) ?? []}
                responsables={responsables}
              />
            </div>
          );
        })}
      </div>

      {resumen && <ResumenModal markdown={resumen} onClose={() => setResumen(null)} />}
    </div>
  );
}
