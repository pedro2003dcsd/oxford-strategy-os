"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  TIPOS_REPORTE,
  TIPO_REPORTE_LABELS,
  SECCIONES_INFORME,
  SECCION_LABELS,
  type InformeGuardado,
  type SeccionInforme,
  type TipoReporte,
} from "@/lib/informes";
import {
  borrarInforme,
  guardarInforme,
} from "@/app/(protected)/informes/actions";
import { AREAS, TRIMESTRES } from "@/lib/types";

const MAIL_DIRECCION = "";

const inputClass =
  "rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm border-linea ";
const labelClass = "text-xs font-medium text-tenue";

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
            <h2 key={i} className="border-b border-linea pb-1 pt-4 text-base font-semibold">
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
              <span className="select-none text-tenue">•</span>
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
            <p key={i} className="text-xs italic text-tenue">
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
  guardados = [],
}: {
  areasConDatos: string[];
  trimestreActual: string;
  anioActual: number;
  guardados?: InformeGuardado[];
}) {
  const [secciones, setSecciones] = useState<SeccionInforme[]>([
    ...SECCIONES_INFORME,
  ]);
  const [guardando, startGuardar] = useTransition();
  const [guardado, setGuardado] = useState(false);
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
          secciones,
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
      setGuardado(false);
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

  function tituloInforme() {
    const etiqueta = TIPO_REPORTE_LABELS[tipo];
    const fecha = new Date().toLocaleDateString("es-AR");
    return tipo === "area"
      ? `${etiqueta} — ${area} — ${fecha}`
      : `${etiqueta} — ${trimestre} ${anioActual} — ${fecha}`;
  }

  /** Abre el cliente de mail con el informe cargado. No se manda solo a
   * propósito: el envío lo confirma quien firma el informe. */
  function enviarPorMail() {
    if (!markdown) return;
    const asunto = encodeURIComponent(`[Oxford Strategy OS] ${tituloInforme()}`);
    // Los clientes de mail cortan los mailto largos, así que va un resumen
    // y el texto completo queda en el portapapeles.
    const cuerpo = encodeURIComponent(
      `${markdown.slice(0, 1500)}${markdown.length > 1500 ? "\n\n[...] El informe completo quedó copiado en el portapapeles." : ""}`
    );
    navigator.clipboard.writeText(markdown).catch(() => {});
    window.location.href = `mailto:${MAIL_DIRECCION}?subject=${asunto}&body=${cuerpo}`;
  }

  function guardar() {
    if (!markdown) return;
    const fd = new FormData();
    fd.set("markdown", markdown);
    fd.set("tipo_reporte", tipo);
    fd.set("titulo", tituloInforme());
    fd.set("fuente", fuente ?? "reglas");
    if (tipo === "area") fd.set("area", area);
    fd.set("trimestre", trimestre);
    fd.set("anio", String(anioActual));
    startGuardar(async () => {
      const res = await guardarInforme(undefined, fd);
      if (res?.ok) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 3000);
      } else if (res?.error) {
        setError(res.error);
      }
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
        <p className="text-sm text-tenue">
          Resúmenes ejecutivos generados a partir de los check-ins, desvíos y
          rentabilidad cargados en el sistema.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-linea p-4 print:hidden">
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

        <div className="space-y-1">
          <label className={labelClass}>Secciones a incluir</label>
          <div className="flex flex-wrap gap-3 py-1.5">
            {SECCIONES_INFORME.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={secciones.includes(s)}
                  onChange={(e) =>
                    setSecciones((prev) =>
                      e.target.checked
                        ? [...prev, s]
                        : prev.filter((x) => x !== s)
                    )
                  }
                  className="h-4 w-4 rounded border-linea-fuerte accent-[var(--oxford)]"
                />
                {SECCION_LABELS[s]}
              </label>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={generar}
          disabled={cargando || secciones.length === 0}
          title={
            secciones.length === 0 ? "Elegí al menos una sección" : undefined
          }
          className="rounded-md bg-oxford px-4 py-2 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50"
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
        <div className="flex items-center gap-3 rounded-lg border border-oxford/30 bg-oxford-suave px-4 py-6">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-oxford border-t-transparent" />
          <p className="text-sm text-oxford">
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
                    ? "bg-oxford-suave text-oxford"
                    : "bg-neutral-500/10 text-tenue"
                )}
              >
                {fuente === "ia" ? "✦ Redactado con IA" : "Informe automático"}
              </span>
              {motivo && (
                <span className="text-xs text-tenue">{motivo}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditando((v) => !v)}
                className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium"
              >
                {editando ? "Ver formateado" : "Editar texto"}
              </button>
              <button
                type="button"
                onClick={descargarMd}
                className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium"
              >
                Descargar .md
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="rounded-md border border-linea px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                {guardado ? "✓ Guardado" : guardando ? "Guardando…" : "💾 Guardar"}
              </button>
            </div>
          </div>

          {/* Botonera principal de salida: lo que se hace con el informe una
              vez que está listo. Separada de los controles de edición. */}
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-oxford px-4 py-2 text-sm font-semibold text-white transition hover:bg-oxford-fuerte"
            >
              📄 Descargar PDF
            </button>
            <button
              type="button"
              onClick={copiar}
              className="rounded-md border border-oxford/40 px-4 py-2 text-sm font-semibold text-oxford transition hover:bg-oxford-suave"
            >
              {copiado ? "✓ Copiado" : "📋 Copiar Markdown (Notion)"}
            </button>
            <button
              type="button"
              onClick={enviarPorMail}
              className="rounded-md border border-oxford/40 px-4 py-2 text-sm font-semibold text-oxford transition hover:bg-oxford-suave"
            >
              📧 Enviar a Dirección
            </button>
          </div>

          {editando ? (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={28}
              className="w-full rounded-lg border border-linea bg-transparent p-4 font-mono text-sm leading-relaxed"
            />
          ) : (
            <div
              ref={impresionRef}
              className="documento-ejecutivo rounded-lg border border-linea bg-panel p-6"
            >
              <MarkdownView texto={markdown} />
            </div>
          )}
        </div>
      )}

      <HistoricoInformes
        guardados={guardados}
        onAbrir={(informe) => {
          setMarkdown(informe.markdown);
          setFuente(informe.fuente);
          setMotivo(
            `Informe guardado el ${new Date(informe.creado_at).toLocaleString("es-AR")}`
          );
          setEditando(false);
          setError(null);
        }}
      />
    </div>
  );
}

/** Minutas anteriores. Se guardan tal cual se generaron: regenerar el informe
 * de la LOM pasada con los datos de hoy daría otro texto. */
function HistoricoInformes({
  guardados,
  onAbrir,
}: {
  guardados: InformeGuardado[];
  onAbrir: (informe: InformeGuardado) => void;
}) {
  const [borrando, startBorrar] = useTransition();

  if (guardados.length === 0) {
    return (
      <p className="text-sm text-tenue print:hidden">
        Todavía no hay informes guardados. Generá uno y tocá 💾 Guardar para
        poder volver a consultarlo.
      </p>
    );
  }

  return (
    <section className="space-y-2 print:hidden">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-tenue">
        Informes guardados ({guardados.length})
      </h2>
      <ul className="divide-y divide-linea rounded-lg border border-linea">
        {guardados.map((g) => (
          <li
            key={g.id}
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
          >
            <button
              type="button"
              onClick={() => onAbrir(g)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-sm font-medium hover:underline">
                {g.titulo}
              </span>
              <span className="block text-xs text-tenue">
                {new Date(g.creado_at).toLocaleString("es-AR")}
                {g.fuente === "ia" ? " · ✦ IA" : " · automático"}
                {g.creado_por ? ` · ${g.creado_por}` : ""}
              </span>
            </button>
            <button
              type="button"
              disabled={borrando}
              onClick={() =>
                startBorrar(() => {
                  borrarInforme(g.id);
                })
              }
              aria-label={`Borrar ${g.titulo}`}
              className="shrink-0 rounded p-1 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
