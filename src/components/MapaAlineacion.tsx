"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import clsx from "clsx";
import {
  desvincularKr,
  desvincularOkr,
  vincularKr,
  vincularOkr,
} from "@/app/(protected)/okrs/actions";
import { progresoPct } from "@/lib/kr-logic";
import { KrModal } from "@/components/KrModal";
import { KrAnualModal } from "@/components/KrAnualModal";
import {
  NewOkrAnualModal,
  NewOkrTrimestralModal,
  OkrAnualModal,
  OkrTrimestralModal,
} from "@/components/OkrForms";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import type {
  Cliente,
  HitoKr,
  KeyResult,
  KrAlineacion,
  KrAnual,
  OkrAlineacion,
  OkrAnual,
  OkrTrimestral,
  UsuarioAutorizado,
} from "@/lib/types";

type KrTrim = KeyResult & { hitos_kr: HitoKr[] };

/** Un nodo conectable. La familia dice qué se puede unir con qué (okr con
 * okr, kr con kr) y el lado, de qué columna es. */
type Kind = "okrA" | "okrT" | "krA" | "krT";
const familia = (k: Kind) => (k.startsWith("okr") ? "okr" : "kr");
const lado = (k: Kind) => (k.endsWith("A") ? "anual" : "trim");
const claveAncla = (k: Kind, id: string) => `${k}:${id}`;

type Punto = { x: number; y: number };

export function MapaAlineacion({
  okrsAnuales,
  krsAnuales,
  okrsTrimestrales,
  keyResults,
  okrLinks,
  krLinks,
  personas,
  clientes,
  puedeEditar,
}: {
  okrsAnuales: OkrAnual[];
  krsAnuales: KrAnual[];
  okrsTrimestrales: OkrTrimestral[];
  keyResults: KrTrim[];
  okrLinks: OkrAlineacion[];
  krLinks: KrAlineacion[];
  personas: UsuarioAutorizado[];
  clientes: Cliente[];
  puedeEditar: boolean;
}) {
  const contRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Record<string, Punto>>({});
  const [tamano, setTamano] = useState({ w: 0, h: 0 });
  const [tick, setTick] = useState(0);
  const [, startTransition] = useTransition();

  // Arrastre en curso: desde qué ancla salió y dónde está el cursor.
  const [drag, setDrag] = useState<
    { kind: Kind; id: string; x: number; y: number } | null
  >(null);

  const krsAnualesPorOkr = useMemo(() => {
    const m = new Map<string, KrAnual[]>();
    for (const kr of [...krsAnuales].sort((a, b) => a.orden - b.orden)) {
      if (!m.has(kr.okr_anual_id)) m.set(kr.okr_anual_id, []);
      m.get(kr.okr_anual_id)!.push(kr);
    }
    return m;
  }, [krsAnuales]);

  const krsTrimPorOkr = useMemo(() => {
    const m = new Map<string, KrTrim[]>();
    for (const kr of keyResults) {
      if (!m.has(kr.okr_trimestral_id)) m.set(kr.okr_trimestral_id, []);
      m.get(kr.okr_trimestral_id)!.push(kr);
    }
    return m;
  }, [keyResults]);

  // Recalcula la posición de cada ancla (centro, relativo al contenedor).
  const recalcular = useCallback(() => {
    const cont = contRef.current;
    if (!cont) return;
    const base = cont.getBoundingClientRect();
    const next: Record<string, Punto> = {};
    cont.querySelectorAll<HTMLElement>("[data-anchor-key]").forEach((el) => {
      const r = el.getBoundingClientRect();
      next[el.dataset.anchorKey!] = {
        x: r.left + r.width / 2 - base.left,
        y: r.top + r.height / 2 - base.top,
      };
    });
    setPos(next);
    setTamano({ w: cont.scrollWidth, h: cont.scrollHeight });
  }, []);

  useLayoutEffect(() => {
    recalcular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalcular, tick, okrsAnuales, krsAnuales, okrsTrimestrales, keyResults, okrLinks, krLinks]);

  useEffect(() => {
    const cont = contRef.current;
    if (!cont) return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(cont);
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Mientras se arrastra, seguimos el puntero y al soltar buscamos si cayó
  // sobre un ancla compatible.
  useEffect(() => {
    if (!drag) return;
    const cont = contRef.current;
    if (!cont) return;

    function mover(e: PointerEvent) {
      const base = cont!.getBoundingClientRect();
      setDrag((d) => (d ? { ...d, x: e.clientX - base.left, y: e.clientY - base.top } : d));
    }
    function soltar(e: PointerEvent) {
      const destino = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-anchor-key]");
      setDrag((d) => {
        if (d && destino) {
          const [kindDest, idDest] = destino.dataset.anchorKey!.split(":") as [
            Kind,
            string,
          ];
          if (
            familia(kindDest) === familia(d.kind) &&
            lado(kindDest) !== lado(d.kind) &&
            idDest !== d.id
          ) {
            const trimId = lado(d.kind) === "trim" ? d.id : idDest;
            const anualId = lado(d.kind) === "anual" ? d.id : idDest;
            startTransition(() => {
              if (familia(d.kind) === "okr") vincularOkr(trimId, anualId);
              else vincularKr(trimId, anualId);
            });
          }
        }
        return null;
      });
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [drag]);

  function iniciarArrastre(e: React.PointerEvent, kind: Kind, id: string) {
    if (!puedeEditar) return;
    e.preventDefault();
    const base = contRef.current!.getBoundingClientRect();
    setDrag({ kind, id, x: e.clientX - base.left, y: e.clientY - base.top });
  }

  function quitarOkr(trimId: string, anualId: string) {
    startTransition(() => desvincularOkr(trimId, anualId));
  }
  function quitarKr(trimId: string, anualId: string) {
    startTransition(() => desvincularKr(trimId, anualId));
  }

  /** El puntito del que se tira para conectar. Se renderiza siempre (las
   * líneas necesitan su posición), pero solo arrastra si se puede editar. */
  function Ancla({ kind, id }: { kind: Kind; id: string }) {
    return (
      <span
        data-anchor-key={claveAncla(kind, id)}
        onPointerDown={
          puedeEditar ? (e) => iniciarArrastre(e, kind, id) : undefined
        }
        title={puedeEditar ? "Arrastrá hasta el otro lado para conectar" : undefined}
        className={clsx(
          "inline-block h-3 w-3 shrink-0 rounded-full border-2 border-oxford bg-panel transition",
          puedeEditar && "cursor-grab touch-none hover:scale-125",
          lado(kind) === "anual" ? "ml-2" : "mr-2"
        )}
      />
    );
  }

  // Las líneas a dibujar: cada vínculo, del ancla anual a la trimestral.
  const lineas = useMemo(() => {
    const out: {
      key: string;
      a: Punto;
      b: Punto;
      quitar: () => void;
    }[] = [];
    for (const l of okrLinks) {
      const a = pos[claveAncla("okrA", l.okr_anual_id)];
      const b = pos[claveAncla("okrT", l.okr_trimestral_id)];
      if (a && b)
        out.push({
          key: `okr:${l.okr_trimestral_id}:${l.okr_anual_id}`,
          a,
          b,
          quitar: () => quitarOkr(l.okr_trimestral_id, l.okr_anual_id),
        });
    }
    for (const l of krLinks) {
      const a = pos[claveAncla("krA", l.kr_anual_id)];
      const b = pos[claveAncla("krT", l.kr_trimestral_id)];
      if (a && b)
        out.push({
          key: `kr:${l.kr_trimestral_id}:${l.kr_anual_id}`,
          a,
          b,
          quitar: () => quitarKr(l.kr_trimestral_id, l.kr_anual_id),
        });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [okrLinks, krLinks, pos]);

  const curva = (a: Punto, b: Punto) => {
    const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  };

  const anclaDrag = drag ? pos[claveAncla(drag.kind, drag.id)] : null;

  const cardCol = "flex-1 min-w-0 space-y-3";
  const cardBase = "rounded-xl border border-linea bg-panel p-3";
  const btnMini =
    "rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground";
  const btnAlta =
    "rounded-md px-2 py-0.5 text-xs font-medium text-oxford transition hover:bg-oxford-suave";

  return (
    <div ref={contRef} className="relative">
      {/* Capa de líneas. Debajo de las tarjetas para no tapar los botones,
          salvo los ✕ que van en su propia capa arriba. */}
      <svg
        className="pointer-events-none absolute inset-0 z-0"
        width={tamano.w}
        height={tamano.h}
      >
        {lineas.map((l) => (
          <path
            key={l.key}
            d={curva(l.a, l.b)}
            fill="none"
            stroke="var(--oxford)"
            strokeWidth={2}
            strokeOpacity={0.55}
          />
        ))}
        {anclaDrag && drag && (
          <path
            d={curva(
              lado(drag.kind) === "anual" ? anclaDrag : { x: drag.x, y: drag.y },
              lado(drag.kind) === "anual" ? { x: drag.x, y: drag.y } : anclaDrag
            )}
            fill="none"
            stroke="var(--oxford)"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        )}
      </svg>

      {/* Botones de desvincular, en el punto medio de cada línea. */}
      {puedeEditar && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {lineas.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={l.quitar}
              title="Quitar esta conexión"
              style={{
                left: (l.a.x + l.b.x) / 2,
                top: (l.a.y + l.b.y) / 2,
              }}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-linea bg-panel px-1 text-[10px] leading-4 text-tenue shadow-sm transition hover:border-red-400 hover:text-red-600"
            >
              ✕
            </button>
          ))}
        </div>
      )}

      <div className="relative z-10 flex gap-6">
        {/* ---------------- Columna ANUALES ---------------- */}
        <div className={cardCol}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenue">
              Anuales
            </h2>
            {puedeEditar && (
              <NewOkrAnualModal
                personas={personas}
                triggerLabel="+ OKR anual"
                triggerClassName={btnAlta}
              />
            )}
          </div>

          {okrsAnuales.length === 0 && (
            <p className="text-xs text-tenue">Todavía no hay OKRs anuales.</p>
          )}

          {okrsAnuales.map((oa) => {
            const krs = krsAnualesPorOkr.get(oa.id) ?? [];
            return (
              <article key={oa.id} className={cardBase}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{oa.titulo}</p>
                    {oa.responsable && (
                      <p className="text-xs text-tenue">rinde cuentas {oa.responsable}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center">
                    {puedeEditar && (
                      <OkrAnualModal
                        okr={oa}
                        pilares={[]}
                        personas={personas}
                        coResponsablesActuales={[]}
                        triggerLabel="Editar"
                        triggerClassName={btnMini}
                      />
                    )}
                    <Ancla kind="okrA" id={oa.id} />
                  </div>
                </div>

                <div className="mt-2 space-y-1 border-t border-linea pt-2">
                  {krs.length === 0 ? (
                    <p className="text-xs text-tenue">Sin KR anuales.</p>
                  ) : (
                    krs.map((kr, i) => (
                      <div key={kr.id} className="flex items-center gap-1 text-sm">
                        <span className="shrink-0 rounded bg-linea/60 px-1.5 py-0.5 text-[11px] font-semibold text-tenue">
                          KR{i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{kr.titulo}</span>
                        <span className="shrink-0 text-xs text-tenue">
                          {formatearMeta(kr)}
                        </span>
                        {puedeEditar && (
                          <KrAnualModal
                            okrAnualId={oa.id}
                            kr={kr}
                            triggerLabel="✎"
                            triggerClassName={btnMini}
                          />
                        )}
                        <Ancla kind="krA" id={kr.id} />
                      </div>
                    ))
                  )}
                  {puedeEditar && (
                    <KrAnualModal
                      okrAnualId={oa.id}
                      triggerLabel="+ KR anual"
                      triggerClassName={btnAlta}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* ---------------- Columna TRIMESTRALES ---------------- */}
        <div className={cardCol}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tenue">
              Trimestrales
            </h2>
            {puedeEditar && (
              <NewOkrTrimestralModal
                okrsAnuales={okrsAnuales}
                personas={personas}
                triggerLabel="+ OKR trimestral"
                triggerClassName={btnAlta}
              />
            )}
          </div>

          {okrsTrimestrales.length === 0 && (
            <p className="text-xs text-tenue">Todavía no hay OKRs trimestrales.</p>
          )}

          {okrsTrimestrales.map((ot) => {
            const krs = krsTrimPorOkr.get(ot.id) ?? [];
            return (
              <article key={ot.id} className={cardBase}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-1">
                    <Ancla kind="okrT" id={ot.id} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        <span className="mr-1.5 rounded bg-linea/60 px-1.5 py-0.5 text-[11px] font-semibold">
                          {ot.area}
                        </span>
                        {ot.es_colaborativo && <span className="mr-1">🤝</span>}
                        {ot.titulo}
                      </p>
                      <p className="text-xs text-tenue">
                        {ot.trimestre} {ot.anio}
                        {ot.responsable ? ` · ${ot.responsable}` : ""}
                      </p>
                    </div>
                  </div>
                  {puedeEditar && (
                    <OkrTrimestralModal
                      okr={ot}
                      okrsAnuales={okrsAnuales}
                      personas={personas}
                      coResponsablesActuales={[]}
                      triggerLabel="Editar"
                      triggerClassName={btnMini}
                    />
                  )}
                </div>

                <div className="mt-2 space-y-1 border-t border-linea pt-2">
                  {krs.length === 0 ? (
                    <p className="text-xs text-tenue">Sin Key Results.</p>
                  ) : (
                    krs.map((kr, i) => (
                      <div key={kr.id} className="flex items-center gap-1 text-sm">
                        <Ancla kind="krT" id={kr.id} />
                        <span className="shrink-0 rounded bg-linea/60 px-1.5 py-0.5 text-[11px] font-semibold text-tenue">
                          KR{i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{kr.titulo}</span>
                        <SemaforoBadge estado={kr.estado_semaforo} compact />
                        <span className="shrink-0 text-xs text-tenue">
                          {progresoPct(kr)}%
                        </span>
                      </div>
                    ))
                  )}
                  {puedeEditar && (
                    <KrModal
                      okrFijo={ot}
                      clientes={clientes}
                      triggerLabel="+ KR"
                      triggerClassName={btnAlta}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** La meta del KR anual como texto corto, según su tipo. */
function formatearMeta(kr: KrAnual): string {
  if (kr.tipo_medicion === "moneda")
    return "$ " + kr.valor_meta.toLocaleString("es-AR");
  if (kr.tipo_medicion === "porcentaje") return `${kr.valor_meta}%`;
  return kr.valor_meta.toLocaleString("es-AR");
}
