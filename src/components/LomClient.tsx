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
import { formatValor, hasAlertaRentabilidad } from "@/lib/kr-logic";
import { generarResumenLom, generarResumenChat } from "@/lib/resumen-lom";
import { AREAS, TRIMESTRES } from "@/lib/types";
import type { CheckIn, CompromisoLom, KeyResultCompleto } from "@/lib/types";

const TRIM_OPTIONS = ["Todos", ...TRIMESTRES] as const;
const AREA_OPTIONS = ["Todas", ...AREAS] as const;

function CompromisosLom({
  kr,
  compromisos,
}: {
  kr: KeyResultCompleto;
  compromisos: CompromisoLom[];
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
      <ul className="space-y-1">
        {compromisos.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={c.cumplido}
              disabled={isPending}
              onChange={(e) =>
                startTransition(() => {
                  toggleCompromisoLom(c.id, e.target.checked);
                })
              }
              className="mt-0.5 h-3.5 w-3.5 rounded border-linea-fuerte"
            />
            <span className={clsx(c.cumplido && "text-tenue line-through")}>
              {c.descripcion}
            </span>
          </li>
        ))}
      </ul>
      <form action={formAction} className="flex gap-1.5">
        <input
          name="descripcion"
          placeholder='Ej: "Mateo revisa presupuesto con Dolores"'
          className="w-full rounded-md border border-linea bg-transparent px-2 py-1 text-xs"
        />
        <button
          type="submit"
          disabled={adding}
          className="shrink-0 rounded-md border border-linea px-2 py-1 text-xs font-medium disabled:opacity-50"
        >
          {adding ? "…" : "Anotar"}
        </button>
      </form>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-linea/600 p-4"
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
                    checkIns={historial.slice(-6)}
                    valorMeta={kr.tipo_medicion === "hitos" ? 100 : kr.valor_meta}
                  />
                </div>
                <p className="shrink-0 text-xs text-tenue">
                  {kr.tipo_medicion === "hitos"
                    ? `${kr.hitos_kr.filter((h) => h.cumplido).length}/${kr.hitos_kr.length} hitos`
                    : `${formatValor(kr.valor_actual, kr.tipo_medicion)} / ${formatValor(kr.valor_meta, kr.tipo_medicion)}`}
                </p>
              </div>

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

              <CompromisosLom kr={kr} compromisos={compPorKr.get(kr.id) ?? []} />
            </div>
          );
        })}
      </div>

      {resumen && <ResumenModal markdown={resumen} onClose={() => setResumen(null)} />}
    </div>
  );
}
