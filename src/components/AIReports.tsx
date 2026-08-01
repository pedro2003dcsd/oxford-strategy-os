"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { TIPOS_REPORTE, TIPO_REPORTE_LABELS, type TipoReporte } from "@/lib/informes";
import { AREAS, TRIMESTRES } from "@/lib/types";

const inputClass =
  "rounded-md border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20 dark:bg-neutral-900";
const labelClass = "text-xs font-medium text-neutral-500";

const MENSAJES_CARGA = [
  "Leyendo los check-ins de la semana…",
  "Cruzando desvíos con la rentabilidad de SOLOP…",
  "Ordenando los cuellos de botella por área…",
  "Redactando la agenda para la LOM…",
];

/** Render de Markdown acotado a lo que devuelven los informes: títulos,
 * viñetas, negritas y citas. Evita traer una dependencia entera. */
function MarkdownView({ texto }: { texto: string }) {
  const lineas = texto.split("\n");

  function inline(s: string, key: number) {
    const partes = s.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {partes.map((p, i) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={i}>{p.slice(2, -2)}</strong>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {lineas.map((linea, i) => {
        const l = linea.trimEnd();
        const esAlerta = /⚠|ALERTA|🔴/.test(l);
        const esOk = /🎉|✅/.test(l);

        if (l.startsWith("### ")) {
          return (
            <h3 key={i} className="pt-2 text-sm font-semibold">
              {inline(l.slice(4), i)}
            </h3>
          );
        }
        if (l.startsWith("## ")) {
          return (
            <h2 key={i} className="border-b border-black/10 pb-1 pt-4 text-base font-semibold dark:border-white/10">
              {inline(l.slice(3), i)}
            </h2>
          );
        }
        if (l.startsWith("# ")) {
          return (
            <h1 key={i} className="text-xl font-semibold">
              {inline(l.slice(2), i)}
            </h1>
          );
        }
        if (/^\s*[-*]\s+/.test(l)) {
          const sangria = (l.length - l.trimStart().length) / 2;
          return (
            <p
              key={i}
              className={clsx(
                "flex gap-2 text-sm leading-relaxed",
                esAlerta && "rounded-md bg-amber-500/10 px-2 py-1 text-amber-800 dark:text-amber-300",
                esOk && "text-emerald-700 dark:text-emerald-400"
              )}
              style={{ marginLeft: `${sangria * 0.75}rem` }}
            >
              <span className="select-none text-neutral-400">•</span>
              {inline(l.trimStart().replace(/^[-*]\s+/, ""), i)}
            </p>
          );
        }
        if (/^\s*\d+\.\s+/.test(l)) {
          return (
            <p
              key={i}
              className={clsx(
                "text-sm leading-relaxed",
                esAlerta && "rounded-md bg-amber-500/10 px-2 py-1 text-amber-800 dark:text-amber-300"
              )}
            >
              {inline(l.trimStart(), i)}
            </p>
          );
        }
        if (l.startsWith("_") && l.endsWith("_") && l.length > 2) {
          return (
            <p key={i} className="text-xs italic text-neutral-500">
              {l.slice(1, -1)}
            </p>
          );
        }
        if (l === "") return <div key={i} className="h-1" />;
        return (
          <p
            key={i}
            className={clsx(
              "text-sm leading-relaxed",
              esAlerta && "rounded-md bg-amber-500/10 px-2 py-1 text-amber-800 dark:text-amber-300"
            )}
          >
            {inline(l, i)}
          </p>
        );
      })}
    </div>
  );
}

export function AIReports({
  areasConDatos,
  trimestreActual,
  anioActual,
}: {
  areasConDatos: string[];
  trimestreActual: string;
  anioActual: number;
}) {
  const [tipo, setTipo] = useState<TipoReporte>("semanal_lom");
  const [trimestre, setTrimestre] = useState<string>(trimestreActual);
  const [area, setArea] = useState<string>(areasConDatos[0] ?? AREAS[0]);
  const [cargando, setCargando] = useState(false);
  const [mensajeIdx, setMensajeIdx] = useState(0);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [fuente, setFuente] = useState<"ia" | "reglas" | null>(null);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const impresionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cargando) return;
    const id = setInterval(
      () => setMensajeIdx((i) => (i + 1) % MENSAJES_CARGA.length),
      2500
    );
    return () => clearInterval(id);
  }, [cargando]);

  async function generar() {
    setCargando(true);
    setError(null);
    setMotivo(null);
    setMensajeIdx(0);
    try {
      const res = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoReporte: tipo,
          trimestre,
          anio: anioActual,
          area: tipo === "area" ? area : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar el informe.");
        return;
      }
      setMarkdown(data.markdown);
      setFuente(data.fuente);
      setMotivo(data.motivo ?? null);
      setEditando(false);
    } catch {
      setError("No se pudo contactar al servidor.");
    } finally {
      setCargando(false);
    }
  }

  function copiar() {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  function descargarMd() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tipo}-${trimestre}-${anioActual}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Informes automáticos</h1>
        <p className="text-sm text-neutral-500">
          Resúmenes ejecutivos generados a partir de los check-ins, desvíos y
          rentabilidad cargados en el sistema.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4 print:hidden dark:border-white/10">
        <div className="space-y-1">
          <label className={labelClass}>Tipo de reporte</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoReporte)}
            className={inputClass}
          >
            {TIPOS_REPORTE.map((t) => (
              <option key={t} value={t}>
                {TIPO_REPORTE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>Trimestre</label>
          <select
            value={trimestre}
            onChange={(e) => setTrimestre(e.target.value)}
            className={inputClass}
          >
            <option value="Todos">Todos</option>
            {TRIMESTRES.map((t) => (
              <option key={t} value={t}>
                {t} {anioActual}
              </option>
            ))}
          </select>
        </div>

        {tipo === "area" && (
          <div className="space-y-1">
            <label className={labelClass}>Área</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className={inputClass}
            >
              {(areasConDatos.length > 0 ? areasConDatos : AREAS).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={generar}
          disabled={cargando}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {cargando ? "Generando…" : "✨ Generar informe con IA"}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      {cargando && (
        <div className="flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-4 py-6">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {MENSAJES_CARGA[mensajeIdx]}
          </p>
        </div>
      )}

      {markdown && !cargando && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  fuente === "ia"
                    ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                    : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300"
                )}
              >
                {fuente === "ia" ? "✦ Redactado con IA" : "Informe automático"}
              </span>
              {motivo && (
                <span className="text-xs text-neutral-500">{motivo}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditando((v) => !v)}
                className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium dark:border-white/20"
              >
                {editando ? "Ver formateado" : "Editar texto"}
              </button>
              <button
                type="button"
                onClick={copiar}
                className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium dark:border-white/20"
              >
                {copiado ? "✓ Copiado" : "Copiar"}
              </button>
              <button
                type="button"
                onClick={descargarMd}
                className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium dark:border-white/20"
              >
                Descargar .md
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium dark:border-white/20"
              >
                Descargar PDF
              </button>
            </div>
          </div>

          {editando ? (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={28}
              className="w-full rounded-lg border border-black/15 bg-transparent p-4 font-mono text-sm leading-relaxed dark:border-white/20"
            />
          ) : (
            <div
              ref={impresionRef}
              className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-neutral-900 print:border-0 print:p-0"
            >
              <MarkdownView texto={markdown} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
