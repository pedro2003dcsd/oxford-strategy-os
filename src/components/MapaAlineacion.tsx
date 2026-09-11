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
  moverNodo,
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

type Kind = "okrA" | "okrT" | "krA" | "krT";
const familia = (k: Kind) => (k.startsWith("okr") ? "okr" : "kr");
const lado = (k: Kind) => (k.endsWith("A") ? "anual" : "trim");
const claveAncla = (k: Kind, id: string) => `${k}:${id}`;

type Punto = { x: number; y: number };
type NodoKey = string; // "A:<id>" | "T:<id>"

const ANCHO_CUADRO = 320;

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
  const worldRef = useRef<HTMLDivElement>(null);
  const [anclas, setAnclas] = useState<Record<string, Punto>>({});
  const [tick, setTick] = useState(0);
  const [, startTransition] = useTransition();

  // Posición de cada cuadro. Arranca de la guardada (pos_x/pos_y) o de un
  // acomodo por defecto; los movimientos del usuario mandan por encima.
  const posPorDefecto = useMemo(() => {
    const m: Record<NodoKey, Punto> = {};
    okrsAnuales.forEach((o, i) => {
      m[`A:${o.id}`] = { x: 40, y: 40 + i * 240 };
    });
    okrsTrimestrales.forEach((o, i) => {
      m[`T:${o.id}`] = { x: 40 + ANCHO_CUADRO + 220, y: 40 + i * 240 };
    });
    return m;
  }, [okrsAnuales, okrsTrimestrales]);

  const [movidos, setMovidos] = useState<Record<NodoKey, Punto>>({});

  const posDe = useCallback(
    (key: NodoKey, guardada: Punto | null): Punto =>
      movidos[key] ?? guardada ?? posPorDefecto[key] ?? { x: 40, y: 40 },
    [movidos, posPorDefecto]
  );

  // Arrastre de un cuadro (mover) o de un punto (conectar).
  const [moviendo, setMoviendo] = useState<
    { key: NodoKey; tipo: "anual" | "trimestral"; id: string; offX: number; offY: number } | null
  >(null);
  const [conectando, setConectando] = useState<
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

  const puntoMundo = useCallback((e: { clientX: number; clientY: number }): Punto => {
    const world = worldRef.current;
    if (!world) return { x: 0, y: 0 };
    const r = world.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  // Recalcula el centro de cada punto de conexión, relativo al mundo.
  const recalcular = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    const base = world.getBoundingClientRect();
    const next: Record<string, Punto> = {};
    world.querySelectorAll<HTMLElement>("[data-anchor-key]").forEach((el) => {
      const r = el.getBoundingClientRect();
      next[el.dataset.anchorKey!] = {
        x: r.left + r.width / 2 - base.left,
        y: r.top + r.height / 2 - base.top,
      };
    });
    setAnclas(next);
  }, []);

  useLayoutEffect(() => {
    recalcular();
  }, [recalcular, tick, movidos, okrsAnuales, krsAnuales, okrsTrimestrales, keyResults, okrLinks, krLinks]);

  // Mover cuadro: seguimos el puntero y al soltar guardamos la posición.
  useEffect(() => {
    if (!moviendo) return;
    function mover(e: PointerEvent) {
      const p = puntoMundo(e);
      setMovidos((m) => ({
        ...m,
        [moviendo!.key]: { x: Math.max(0, p.x - moviendo!.offX), y: Math.max(0, p.y - moviendo!.offY) },
      }));
    }
    function soltar() {
      setMovidos((m) => {
        const pos = m[moviendo!.key];
        if (pos)
          startTransition(() =>
            moverNodo(moviendo!.tipo, moviendo!.id, Math.round(pos.x), Math.round(pos.y))
          );
        return m;
      });
      setMoviendo(null);
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [moviendo, puntoMundo]);

  // Conectar: al soltar buscamos si cayó sobre un punto compatible.
  useEffect(() => {
    if (!conectando) return;
    function mover(e: PointerEvent) {
      const p = puntoMundo(e);
      setConectando((c) => (c ? { ...c, x: p.x, y: p.y } : c));
    }
    function soltar(e: PointerEvent) {
      const destino = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-anchor-key]");
      setConectando((c) => {
        if (c && destino) {
          const [kindDest, idDest] = destino.dataset.anchorKey!.split(":") as [Kind, string];
          if (
            familia(kindDest) === familia(c.kind) &&
            lado(kindDest) !== lado(c.kind) &&
            idDest !== c.id
          ) {
            const trimId = lado(c.kind) === "trim" ? c.id : idDest;
            const anualId = lado(c.kind) === "anual" ? c.id : idDest;
            startTransition(() => {
              if (familia(c.kind) === "okr") vincularOkr(trimId, anualId);
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
  }, [conectando, puntoMundo]);

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(world);
    return () => ro.disconnect();
  }, []);

  function empezarMover(
    e: React.PointerEvent,
    key: NodoKey,
    tipo: "anual" | "trimestral",
    id: string
  ) {
    if (!puedeEditar) return;
    // No arrastrar si el gesto salió de un botón, link o punto de conexión.
    if ((e.target as HTMLElement).closest("button, a, input, select, [data-anchor-key]"))
      return;
    const p = puntoMundo(e);
    const actual = posDe(key, null);
    setMoviendo({ key, tipo, id, offX: p.x - actual.x, offY: p.y - actual.y });
  }

  function empezarConectar(e: React.PointerEvent, kind: Kind, id: string) {
    if (!puedeEditar) return;
    e.stopPropagation();
    e.preventDefault();
    const p = puntoMundo(e);
    setConectando({ kind, id, x: p.x, y: p.y });
  }

  /** El punto del que se tira para conectar. Siempre presente (las líneas
   * necesitan su posición); solo arrastra si se puede editar. */
  function Punto2({ kind, id, className }: { kind: Kind; id: string; className?: string }) {
    return (
      <span
        data-anchor-key={claveAncla(kind, id)}
        onPointerDown={puedeEditar ? (e) => empezarConectar(e, kind, id) : undefined}
        title={puedeEditar ? "Arrastrá hasta otro punto para conectar" : undefined}
        className={clsx(
          "block h-3 w-3 shrink-0 rounded-full border-2 border-oxford bg-panel",
          puedeEditar && "cursor-crosshair touch-none hover:scale-125 transition",
          className
        )}
      />
    );
  }

  // Líneas a dibujar.
  const lineas = useMemo(() => {
    const out: { key: string; a: Punto; b: Punto; kr: boolean; quitar: () => void }[] = [];
    for (const l of okrLinks) {
      const a = anclas[claveAncla("okrA", l.okr_anual_id)];
      const b = anclas[claveAncla("okrT", l.okr_trimestral_id)];
      if (a && b)
        out.push({
          key: `okr:${l.okr_trimestral_id}:${l.okr_anual_id}`,
          a,
          b,
          kr: false,
          quitar: () =>
            startTransition(() => desvincularOkr(l.okr_trimestral_id, l.okr_anual_id)),
        });
    }
    for (const l of krLinks) {
      const a = anclas[claveAncla("krA", l.kr_anual_id)];
      const b = anclas[claveAncla("krT", l.kr_trimestral_id)];
      if (a && b)
        out.push({
          key: `kr:${l.kr_trimestral_id}:${l.kr_anual_id}`,
          a,
          b,
          kr: true,
          quitar: () =>
            startTransition(() => desvincularKr(l.kr_trimestral_id, l.kr_anual_id)),
        });
    }
    return out;
  }, [okrLinks, krLinks, anclas]);

  const curva = (a: Punto, b: Punto) => {
    const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  };

  const anclaConn = conectando ? anclas[claveAncla(conectando.kind, conectando.id)] : null;

  // Tamaño del mundo: alcanza para el cuadro más lejano.
  const tamano = useMemo(() => {
    let w = 1200;
    let h = 700;
    const consid = (p: Punto) => {
      w = Math.max(w, p.x + ANCHO_CUADRO + 80);
      h = Math.max(h, p.y + 320);
    };
    okrsAnuales.forEach((o) => consid(posDe(`A:${o.id}`, xy(o))));
    okrsTrimestrales.forEach((o) => consid(posDe(`T:${o.id}`, xy(o))));
    return { w, h };
  }, [okrsAnuales, okrsTrimestrales, posDe]);

  const btnMini =
    "rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground";
  const btnAlta =
    "rounded-md px-2 py-0.5 text-xs font-medium text-oxford transition hover:bg-oxford-suave";

  function Cuadro({
    tipo,
    id,
    children,
    x,
    y,
    acento,
  }: {
    tipo: "anual" | "trimestral";
    id: string;
    children: React.ReactNode;
    x: number;
    y: number;
    acento: string;
  }) {
    const key: NodoKey = `${tipo === "anual" ? "A" : "T"}:${id}`;
    return (
      <div
        onPointerDown={(e) => empezarMover(e, key, tipo, id)}
        style={{ left: x, top: y, width: ANCHO_CUADRO }}
        className={clsx(
          "absolute select-none rounded-xl border bg-panel shadow-md",
          acento,
          puedeEditar && "cursor-grab active:cursor-grabbing",
          moviendo?.key === key && "z-30 shadow-xl ring-2 ring-oxford/40"
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div>
      {/* Barra de alta */}
      {puedeEditar && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <NewOkrAnualModal
            personas={personas}
            triggerLabel="+ OKR anual"
            triggerClassName="rounded-md border border-linea px-3 py-1.5 text-xs font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground"
          />
          <NewOkrTrimestralModal
            okrsAnuales={okrsAnuales}
            personas={personas}
            triggerLabel="+ OKR trimestral"
            triggerClassName="rounded-md border border-linea px-3 py-1.5 text-xs font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground"
          />
          <span className="text-xs text-tenue">
            Arrastrá los cuadros para acomodarlos · tirá de un punto ● a otro para
            conectar
          </span>
        </div>
      )}

      {/* Lienzo */}
      <div
        className="relative overflow-auto rounded-xl border border-linea"
        style={{
          height: "72vh",
          backgroundColor: "var(--panel)",
          backgroundImage:
            "radial-gradient(var(--linea) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div
          ref={worldRef}
          className="relative"
          style={{ width: tamano.w, height: tamano.h }}
        >
          {/* Conectores */}
          <svg className="pointer-events-none absolute inset-0" width={tamano.w} height={tamano.h}>
            {lineas.map((l) => (
              <path
                key={l.key}
                d={curva(l.a, l.b)}
                fill="none"
                stroke="var(--oxford)"
                strokeWidth={l.kr ? 1.5 : 2.5}
                strokeOpacity={l.kr ? 0.4 : 0.6}
                strokeLinecap="round"
              />
            ))}
            {anclaConn && conectando && (
              <path
                d={curva(
                  lado(conectando.kind) === "anual" ? anclaConn : { x: conectando.x, y: conectando.y },
                  lado(conectando.kind) === "anual" ? { x: conectando.x, y: conectando.y } : anclaConn
                )}
                fill="none"
                stroke="var(--oxford)"
                strokeWidth={2}
                strokeDasharray="5 4"
              />
            )}
          </svg>

          {/* Botones de desvincular */}
          {puedeEditar &&
            lineas.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={l.quitar}
                title="Quitar esta conexión"
                style={{ left: (l.a.x + l.b.x) / 2, top: (l.a.y + l.b.y) / 2 }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-linea bg-panel px-1 text-[10px] leading-4 text-tenue shadow-sm transition hover:border-red-400 hover:text-red-600"
              >
                ✕
              </button>
            ))}

          {/* Cuadros ANUALES */}
          {okrsAnuales.map((oa) => {
            const p = posDe(`A:${oa.id}`, xy(oa));
            const krs = krsAnualesPorOkr.get(oa.id) ?? [];
            return (
              <Cuadro
                key={oa.id}
                tipo="anual"
                id={oa.id}
                x={p.x}
                y={p.y}
                acento="border-oxford/40"
              >
                <div className="flex items-start justify-between gap-1 rounded-t-xl border-b border-linea bg-oxford-suave/60 px-3 py-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-oxford">
                      OKR anual
                    </span>
                    <p className="truncate text-sm font-semibold">{oa.titulo}</p>
                    {oa.responsable && (
                      <p className="truncate text-xs text-tenue">{oa.responsable}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {puedeEditar && (
                      <OkrAnualModal
                        okr={oa}
                        pilares={[]}
                        personas={personas}
                        coResponsablesActuales={[]}
                        triggerLabel="✎"
                        triggerClassName={btnMini}
                      />
                    )}
                    <Punto2 kind="okrA" id={oa.id} />
                  </div>
                </div>
                <div className="space-y-1 px-3 py-2">
                  {krs.length === 0 ? (
                    <p className="text-xs text-tenue">Sin KR anuales.</p>
                  ) : (
                    krs.map((kr, i) => (
                      <div key={kr.id} className="flex items-center gap-1.5 text-sm">
                        <span className="shrink-0 rounded bg-linea/60 px-1.5 py-0.5 text-[11px] font-semibold text-tenue">
                          KR{i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{kr.titulo}</span>
                        <span className="shrink-0 text-xs text-tenue">{formatearMeta(kr)}</span>
                        {puedeEditar && (
                          <KrAnualModal
                            okrAnualId={oa.id}
                            kr={kr}
                            triggerLabel="✎"
                            triggerClassName={btnMini}
                          />
                        )}
                        <Punto2 kind="krA" id={kr.id} />
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
              </Cuadro>
            );
          })}

          {/* Cuadros TRIMESTRALES */}
          {okrsTrimestrales.map((ot) => {
            const p = posDe(`T:${ot.id}`, xy(ot));
            const krs = krsTrimPorOkr.get(ot.id) ?? [];
            return (
              <Cuadro
                key={ot.id}
                tipo="trimestral"
                id={ot.id}
                x={p.x}
                y={p.y}
                acento="border-linea"
              >
                <div className="flex items-start justify-between gap-1 rounded-t-xl border-b border-linea bg-linea/40 px-3 py-2">
                  <div className="flex min-w-0 items-start gap-1.5">
                    <Punto2 kind="okrT" id={ot.id} className="mt-1" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-tenue">
                        OKR trimestral · {ot.trimestre} {ot.anio}
                      </span>
                      <p className="truncate text-sm font-semibold">
                        <span className="mr-1 rounded bg-linea/70 px-1.5 py-0.5 text-[10px] font-semibold">
                          {ot.area}
                        </span>
                        {ot.es_colaborativo && <span className="mr-1">🤝</span>}
                        {ot.titulo}
                      </p>
                    </div>
                  </div>
                  {puedeEditar && (
                    <OkrTrimestralModal
                      okr={ot}
                      okrsAnuales={okrsAnuales}
                      personas={personas}
                      coResponsablesActuales={[]}
                      triggerLabel="✎"
                      triggerClassName={btnMini}
                    />
                  )}
                </div>
                <div className="space-y-1 px-3 py-2">
                  {krs.length === 0 ? (
                    <p className="text-xs text-tenue">Sin Key Results.</p>
                  ) : (
                    krs.map((kr, i) => (
                      <div key={kr.id} className="flex items-center gap-1.5 text-sm">
                        <Punto2 kind="krT" id={kr.id} />
                        <span className="shrink-0 rounded bg-linea/60 px-1.5 py-0.5 text-[11px] font-semibold text-tenue">
                          KR{i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{kr.titulo}</span>
                        <SemaforoBadge estado={kr.estado_semaforo} compact />
                        <span className="shrink-0 text-xs text-tenue">{progresoPct(kr)}%</span>
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
              </Cuadro>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const xy = (o: { pos_x: number | null; pos_y: number | null }): Punto | null =>
  o.pos_x != null && o.pos_y != null ? { x: o.pos_x, y: o.pos_y } : null;

function formatearMeta(kr: KrAnual): string {
  if (kr.tipo_medicion === "moneda") return "$ " + kr.valor_meta.toLocaleString("es-AR");
  if (kr.tipo_medicion === "porcentaje") return `${kr.valor_meta}%`;
  return kr.valor_meta.toLocaleString("es-AR");
}
