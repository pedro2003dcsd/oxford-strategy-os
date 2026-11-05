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
  moverNodosBatch,
  vincularKr,
  vincularOkr,
} from "@/app/(protected)/okrs/actions";
import { progresoPct } from "@/lib/kr-logic";
import { KrModal } from "@/components/KrModal";
import { KrAnualModal } from "@/components/KrAnualModal";
import { BorrarAnual } from "@/components/BorrarAnual";
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
/** Dos anchors son conectables si son de la misma familia (okr/kr) y de
 * lados opuestos (anual/trimestral). Nunca OKR↔KR, nunca anual↔anual. */
const compatibles = (a: Kind, b: Kind) => familia(a) === familia(b) && lado(a) !== lado(b);

type Punto = { x: number; y: number };
type NodoKey = string; // "A:<id>" | "T:<id>"
type Seleccion = { kind: Kind; id: string } | null;

const ANCHO_CUADRO = 360;
const SEP_DEFECTO = 260; // separación vertical del acomodo por defecto
const UMBRAL = 4; // px para distinguir click de arrastre
const MIN_ESCALA = 0.25;
const MAX_ESCALA = 2;
const clampEscala = (s: number) => Math.min(MAX_ESCALA, Math.max(MIN_ESCALA, s));

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
  esDireccion = false,
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
  /** Borrar OKR/KR anual queda reservado a Dirección, igual que el resto de
   * los borrados estratégicos. El botón ni aparece para los demás. */
  esDireccion?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [anclas, setAnclas] = useState<Record<string, Punto>>({});
  const [tick, setTick] = useState(0);
  const [, startTransition] = useTransition();

  // Zoom y desplazamiento del lienzo. Los refs son la fuente para los
  // handlers imperativos (rueda, botones) y evitan closures viejos.
  const [escala, setEscala] = useState(1);
  const [pan, setPan] = useState<Punto>({ x: 24, y: 24 });
  const escalaRef = useRef(escala);
  const panRef = useRef(pan);
  useEffect(() => {
    escalaRef.current = escala;
  }, [escala]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const [hoverLinea, setHoverLinea] = useState<string | null>(null);

  const posPorDefecto = useMemo(() => {
    const m: Record<NodoKey, Punto> = {};
    okrsAnuales.forEach((o, i) => {
      m[`A:${o.id}`] = { x: 40, y: 40 + i * SEP_DEFECTO };
    });
    okrsTrimestrales.forEach((o, i) => {
      m[`T:${o.id}`] = { x: 40 + ANCHO_CUADRO + 240, y: 40 + i * SEP_DEFECTO };
    });
    return m;
  }, [okrsAnuales, okrsTrimestrales]);

  const [movidos, setMovidos] = useState<Record<NodoKey, Punto>>({});
  // Espejo para leer la posición final al soltar sin meter un startTransition
  // dentro de un updater de estado (eso corre en render y React lo prohíbe).
  const movidosRef = useRef(movidos);
  useEffect(() => {
    movidosRef.current = movidos;
  }, [movidos]);

  const posDe = useCallback(
    (key: NodoKey, guardada: Punto | null): Punto =>
      movidos[key] ?? guardada ?? posPorDefecto[key] ?? { x: 40, y: 40 },
    [movidos, posPorDefecto]
  );

  // Arrastres en curso.
  const [dragCard, setDragCard] = useState<
    | {
        key: NodoKey;
        nodeKind: Kind;
        tipo: "anual" | "trimestral";
        id: string;
        offX: number;
        offY: number;
        startCX: number;
        startCY: number;
        movible: boolean;
      }
    | null
  >(null);
  const [conectando, setConectando] = useState<
    { kind: Kind; id: string; x: number; y: number } | null
  >(null);
  const [paneando, setPaneando] = useState<
    { startCX: number; startCY: number; panX0: number; panY0: number } | null
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

  // Quién tiene al menos una relación de su tipo. Lo que no esté acá se marca
  // "Sin alineación" (sólo visual, para detectar huecos de un vistazo).
  const alineados = useMemo(
    () => ({
      okrA: new Set(okrLinks.map((l) => l.okr_anual_id)),
      okrT: new Set(okrLinks.map((l) => l.okr_trimestral_id)),
      krA: new Set(krLinks.map((l) => l.kr_anual_id)),
      krT: new Set(krLinks.map((l) => l.kr_trimestral_id)),
    }),
    [okrLinks, krLinks]
  );

  /** Qué se lleva por delante borrar un OKR anual, para la confirmación. */
  function advertenciaOkrAnual(okrAnualId: string): string {
    const krs = krsAnualesPorOkr.get(okrAnualId) ?? [];
    const tieneAlin =
      alineados.okrA.has(okrAnualId) || krs.some((k) => alineados.krA.has(k.id));
    const partes: string[] = [];
    if (krs.length > 0)
      partes.push(`sus ${krs.length} KR anual${krs.length > 1 ? "es" : ""}`);
    if (tieneAlin) partes.push("sus alineaciones");
    return partes.length
      ? `Se borran también ${partes.join(" y ")}.`
      : "No tiene KR anuales ni alineaciones.";
  }

  // clientX/Y → coordenadas del mundo (sin la escala). worldRect ya incluye
  // el pan, así que sólo hace falta dividir por la escala.
  const puntoMundo = useCallback((e: { clientX: number; clientY: number }): Punto => {
    const world = worldRef.current;
    if (!world) return { x: 0, y: 0 };
    const r = world.getBoundingClientRect();
    const s = escalaRef.current || 1;
    return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
  }, []);

  // Centro de cada punto de conexión, en unidades de mundo (dividido por la
  // escala → queda invariante al zoom/pan; sólo cambia al mover/redimensionar).
  const recalcular = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    const base = world.getBoundingClientRect();
    const s = escalaRef.current || 1;
    const next: Record<string, Punto> = {};
    world.querySelectorAll<HTMLElement>("[data-anchor-key]").forEach((el) => {
      const r = el.getBoundingClientRect();
      next[el.dataset.anchorKey!] = {
        x: (r.left + r.width / 2 - base.left) / s,
        y: (r.top + r.height / 2 - base.top) / s,
      };
    });
    setAnclas(next);
  }, []);

  useLayoutEffect(() => {
    recalcular();
  }, [recalcular, tick, movidos, okrsAnuales, krsAnuales, okrsTrimestrales, keyResults, okrLinks, krLinks]);

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(world);
    return () => ro.disconnect();
  }, []);

  // Rueda del mouse: zoom hacia el cursor (listener nativo no pasivo para
  // poder frenar el scroll de la página).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      aplicarZoom(
        escalaRef.current * Math.exp(-e.deltaY * 0.0015),
        e.clientX - r.left,
        e.clientY - r.top
      );
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, []);

  /** Aplica una escala nueva manteniendo fijo el punto (cx,cy) del viewport. */
  function aplicarZoom(escalaCruda: number, cx: number, cy: number) {
    const prev = escalaRef.current;
    const n = clampEscala(escalaCruda);
    const p = panRef.current;
    const np = { x: cx - (cx - p.x) * (n / prev), y: cy - (cy - p.y) * (n / prev) };
    escalaRef.current = n;
    panRef.current = np;
    setEscala(n);
    setPan(np);
  }

  const centroViewport = () => {
    const r = viewportRef.current?.getBoundingClientRect();
    return { x: (r?.width ?? 800) / 2, y: (r?.height ?? 500) / 2 };
  };

  // ---- Mover cuadro (drag) o seleccionar (click) ----
  useEffect(() => {
    if (!dragCard) return;
    let movido = false;
    function mover(e: PointerEvent) {
      if (Math.hypot(e.clientX - dragCard!.startCX, e.clientY - dragCard!.startCY) > UMBRAL)
        movido = true;
      if (movido && dragCard!.movible) {
        const p = puntoMundo(e);
        // Sin tope en 0: el cuadro se mueve libre en cualquier dirección, como
        // un mapa conceptual amplio. Antes quedaba atrapado contra el borde
        // superior-izquierdo. "Ajustar" siempre reencuadra todo.
        setMovidos((m) => ({
          ...m,
          [dragCard!.key]: { x: p.x - dragCard!.offX, y: p.y - dragCard!.offY },
        }));
      }
    }
    function soltar() {
      if (movido && dragCard!.movible) {
        const pos = movidosRef.current[dragCard!.key];
        if (pos)
          startTransition(() =>
            moverNodo(dragCard!.tipo, dragCard!.id, Math.round(pos.x), Math.round(pos.y))
          );
      } else if (!movido) {
        setSeleccion({ kind: dragCard!.nodeKind, id: dragCard!.id });
      }
      setDragCard(null);
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [dragCard, puntoMundo]);

  // ---- Conectar ----
  useEffect(() => {
    if (!conectando) return;
    function mover(e: PointerEvent) {
      const p = puntoMundo(e);
      setConectando((c) => (c ? { ...c, x: p.x, y: p.y } : c));
      const el = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-anchor-key]");
      let ht: string | null = null;
      if (el) {
        const [k, i] = el.dataset.anchorKey!.split(":") as [Kind, string];
        if (compatibles(k, conectando!.kind) && i !== conectando!.id) ht = el.dataset.anchorKey!;
      }
      setHoverTarget(ht);
    }
    function soltar(e: PointerEvent) {
      const destino = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-anchor-key]");
      const c = conectando!; // kind/id no cambian durante el arrastre
      if (destino) {
        const [kindDest, idDest] = destino.dataset.anchorKey!.split(":") as [Kind, string];
        if (compatibles(kindDest, c.kind) && idDest !== c.id) {
          const trimId = lado(c.kind) === "trim" ? c.id : idDest;
          const anualId = lado(c.kind) === "anual" ? c.id : idDest;
          startTransition(() => {
            if (familia(c.kind) === "okr") vincularOkr(trimId, anualId);
            else vincularKr(trimId, anualId);
          });
        }
      }
      setConectando(null);
      setHoverTarget(null);
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [conectando, puntoMundo]);

  // ---- Panear el fondo ----
  useEffect(() => {
    if (!paneando) return;
    let movido = false;
    function mover(e: PointerEvent) {
      const dx = e.clientX - paneando!.startCX;
      const dy = e.clientY - paneando!.startCY;
      if (Math.hypot(dx, dy) > UMBRAL) movido = true;
      const np = { x: paneando!.panX0 + dx, y: paneando!.panY0 + dy };
      panRef.current = np;
      setPan(np);
    }
    function soltar() {
      if (!movido) setSeleccion(null); // click en vacío limpia la selección
      setPaneando(null);
    }
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
  }, [paneando]);

  function fondoPointerDown(e: React.PointerEvent) {
    // Sólo llega acá si el gesto no salió de una tarjeta/ancla (esos cortan
    // la propagación). Es fondo vacío → panear.
    setPaneando({
      startCX: e.clientX,
      startCY: e.clientY,
      panX0: panRef.current.x,
      panY0: panRef.current.y,
    });
  }

  function cardPointerDown(
    e: React.PointerEvent,
    key: NodoKey,
    nodeKind: Kind,
    tipo: "anual" | "trimestral",
    id: string,
    actual: Punto
  ) {
    e.stopPropagation(); // no panear al tocar una tarjeta
    if ((e.target as HTMLElement).closest("button, a, input, select, [data-anchor-key], [data-krrow]"))
      return;
    const p = puntoMundo(e);
    setDragCard({
      key,
      nodeKind,
      tipo,
      id,
      offX: p.x - actual.x,
      offY: p.y - actual.y,
      startCX: e.clientX,
      startCY: e.clientY,
      movible: puedeEditar,
    });
  }

  function empezarConectar(e: React.PointerEvent, kind: Kind, id: string) {
    if (!puedeEditar) return;
    e.stopPropagation();
    e.preventDefault();
    const p = puntoMundo(e);
    setConectando({ kind, id, x: p.x, y: p.y });
  }

  function seleccionarKr(e: React.MouseEvent, kind: Kind, id: string) {
    if ((e.target as HTMLElement).closest("button, a, [data-anchor-key]")) return;
    setSeleccion({ kind, id });
  }

  // ---- Foco (modo reunión): qué líneas/nodos se resaltan ----
  const foco = useMemo(() => {
    if (!seleccion) return null;
    const lineKeys = new Set<string>();
    const nodeKeys = new Set<string>();
    const { kind, id } = seleccion;
    if (familia(kind) === "okr") {
      for (const l of okrLinks) {
        if ((kind === "okrA" && l.okr_anual_id === id) || (kind === "okrT" && l.okr_trimestral_id === id)) {
          lineKeys.add(`okr:${l.okr_trimestral_id}:${l.okr_anual_id}`);
          nodeKeys.add(
            kind === "okrA"
              ? claveAncla("okrT", l.okr_trimestral_id)
              : claveAncla("okrA", l.okr_anual_id)
          );
        }
      }
    } else {
      for (const l of krLinks) {
        if ((kind === "krA" && l.kr_anual_id === id) || (kind === "krT" && l.kr_trimestral_id === id)) {
          lineKeys.add(`kr:${l.kr_trimestral_id}:${l.kr_anual_id}`);
          nodeKeys.add(
            kind === "krA"
              ? claveAncla("krT", l.kr_trimestral_id)
              : claveAncla("krA", l.kr_anual_id)
          );
        }
      }
    }
    return { lineKeys, nodeKeys, selKey: claveAncla(kind, id) };
  }, [seleccion, okrLinks, krLinks]);

  const estaSel = (kind: Kind, id: string) =>
    seleccion?.kind === kind && seleccion?.id === id;
  const estaRel = (kind: Kind, id: string) => foco?.nodeKeys.has(claveAncla(kind, id)) ?? false;

  // ---- Líneas ----
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
          quitar: () => startTransition(() => desvincularOkr(l.okr_trimestral_id, l.okr_anual_id)),
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
          quitar: () => startTransition(() => desvincularKr(l.kr_trimestral_id, l.kr_anual_id)),
        });
    }
    return out;
  }, [okrLinks, krLinks, anclas]);

  const curva = (a: Punto, b: Punto) => {
    const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  };

  const anclaConn = conectando ? anclas[claveAncla(conectando.kind, conectando.id)] : null;

  const tamano = useMemo(() => {
    let w = 1200;
    let h = 700;
    const consid = (p: Punto) => {
      w = Math.max(w, p.x + ANCHO_CUADRO + 80);
      h = Math.max(h, p.y + 360);
    };
    okrsAnuales.forEach((o) => consid(posDe(`A:${o.id}`, xy(o))));
    okrsTrimestrales.forEach((o) => consid(posDe(`T:${o.id}`, xy(o))));
    return { w, h };
  }, [okrsAnuales, okrsTrimestrales, posDe]);

  // ---- Ajustar (fit) y Ordenar ----
  function ajustar() {
    const vp = viewportRef.current;
    const world = worldRef.current;
    if (!vp || !world) return;
    const cards = [...world.querySelectorAll<HTMLElement>("[data-card-key]")];
    if (cards.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of cards) {
      minX = Math.min(minX, c.offsetLeft);
      minY = Math.min(minY, c.offsetTop);
      maxX = Math.max(maxX, c.offsetLeft + c.offsetWidth);
      maxY = Math.max(maxY, c.offsetTop + c.offsetHeight);
    }
    const bw = maxX - minX;
    const bh = maxY - minY;
    const r = vp.getBoundingClientRect();
    const m = 48;
    const s = clampEscala(Math.min((r.width - 2 * m) / bw, (r.height - 2 * m) / bh));
    const np = { x: (r.width - bw * s) / 2 - minX * s, y: (r.height - bh * s) / 2 - minY * s };
    escalaRef.current = s;
    panRef.current = np;
    setEscala(s);
    setPan(np);
  }

  function ordenar() {
    const world = worldRef.current;
    if (!world) return;
    const alturaDe = (key: NodoKey) =>
      world.querySelector<HTMLElement>(`[data-card-key="${key}"]`)?.offsetHeight ?? 160;
    const GAP = 28;
    const X_A = 40;
    const X_T = 40 + ANCHO_CUADRO + 240;
    const nuevos: Record<NodoKey, Punto> = { ...movidos };
    const items: { tipo: "anual" | "trimestral"; id: string; x: number; y: number }[] = [];
    let yA = 40;
    for (const o of okrsAnuales) {
      const key = `A:${o.id}`;
      nuevos[key] = { x: X_A, y: yA };
      items.push({ tipo: "anual", id: o.id, x: X_A, y: Math.round(yA) });
      yA += alturaDe(key) + GAP;
    }
    let yT = 40;
    for (const o of okrsTrimestrales) {
      const key = `T:${o.id}`;
      nuevos[key] = { x: X_T, y: yT };
      items.push({ tipo: "trimestral", id: o.id, x: X_T, y: Math.round(yT) });
      yT += alturaDe(key) + GAP;
    }
    setMovidos(nuevos);
    startTransition(() => moverNodosBatch(items));
  }

  const btnMini =
    "rounded-md px-2 py-0.5 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground";
  const btnAlta =
    "rounded-md px-2 py-0.5 text-xs font-medium text-oxford transition hover:bg-oxford-suave";
  const btnTool =
    "rounded-md px-2 py-1 text-xs font-medium text-tenue transition hover:bg-linea/60 hover:text-foreground";

  /** El punto de conexión, con feedback durante el arrastre. Punteado y
   * tenue cuando el nodo no tiene ninguna relación. */
  function Punto2({
    kind,
    id,
    desalineado,
    className,
  }: {
    kind: Kind;
    id: string;
    desalineado?: boolean;
    className?: string;
  }) {
    const key = claveAncla(kind, id);
    const esFuente = conectando?.kind === kind && conectando?.id === id;
    const compat = conectando && !esFuente && compatibles(kind, conectando.kind);
    const incompat = conectando && !compat && !esFuente;
    const esHover = hoverTarget === key;
    return (
      <span
        data-anchor-key={key}
        onPointerDown={puedeEditar ? (e) => empezarConectar(e, kind, id) : undefined}
        title={
          desalineado
            ? "Sin alineación — arrastrá para conectar"
            : puedeEditar
              ? "Arrastrá hasta otro punto para conectar"
              : undefined
        }
        className={clsx(
          "block h-3 w-3 shrink-0 rounded-full border-2 border-oxford bg-panel transition",
          desalineado && !conectando && "border-dashed border-oxford/50",
          puedeEditar && "cursor-crosshair touch-none",
          !conectando && puedeEditar && "hover:scale-125",
          incompat && "opacity-20",
          compat && "ring-2 ring-oxford/60 ring-offset-1 ring-offset-panel scale-110",
          esHover && "!bg-oxford scale-150",
          className
        )}
      />
    );
  }

  /** Chip discreto para un OKR sin ninguna relación. */
  function ChipSinAlineacion() {
    return (
      <span className="shrink-0 rounded border border-dashed border-linea px-1 text-[9px] font-medium text-tenue">
        Sin alineación
      </span>
    );
  }

  function Cuadro({
    tipo,
    id,
    children,
    x,
    y,
    acento,
    resaltado,
    seleccionado,
  }: {
    tipo: "anual" | "trimestral";
    id: string;
    children: React.ReactNode;
    x: number;
    y: number;
    acento: string;
    resaltado: boolean;
    seleccionado: boolean;
  }) {
    const key: NodoKey = `${tipo === "anual" ? "A" : "T"}:${id}`;
    const nodeKind: Kind = tipo === "anual" ? "okrA" : "okrT";
    return (
      <div
        data-card-key={key}
        onPointerDown={(e) => cardPointerDown(e, key, nodeKind, tipo, id, { x, y })}
        style={{ left: x, top: y, width: ANCHO_CUADRO }}
        className={clsx(
          "absolute select-none rounded-xl bg-panel shadow-md transition-shadow",
          acento,
          puedeEditar && "cursor-grab active:cursor-grabbing",
          dragCard?.key === key && "z-30 shadow-xl",
          seleccionado
            ? "ring-2 ring-oxford"
            : resaltado
              ? "ring-2 ring-oxford/40"
              : ""
        )}
      >
        {children}
      </div>
    );
  }

  const hint = puedeEditar
    ? "Arrastrá para mover · ● para conectar · clic para enfocar · arrastrá el fondo para desplazarte"
    : "Clic para enfocar · arrastrá el fondo para desplazarte";

  return (
    <div>
      {puedeEditar && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <NewOkrAnualModal
            personas={personas}
            triggerLabel="+ OKR anual"
            triggerClassName="rounded-md border border-linea px-3 py-1.5 text-xs font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground"
          />
          <NewOkrTrimestralModal
            personas={personas}
            triggerLabel="+ OKR trimestral"
            triggerClassName="rounded-md border border-linea px-3 py-1.5 text-xs font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground"
          />
        </div>
      )}

      {/* Viewport (recorta) */}
      <div
        ref={viewportRef}
        onPointerDown={fondoPointerDown}
        className={clsx(
          "relative touch-none overflow-hidden rounded-xl border border-linea",
          paneando ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ height: "72vh", backgroundColor: "var(--panel)" }}
      >
        {/* Barra de herramientas (fuera del transform, no escala) */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-3 top-3 z-40 flex items-center gap-1 rounded-lg border border-linea bg-panel/95 p-1 shadow-md backdrop-blur"
        >
          <button
            type="button"
            onClick={() => {
              const c = centroViewport();
              aplicarZoom(escalaRef.current / 1.2, c.x, c.y);
            }}
            className={btnTool}
            title="Alejar"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => {
              const c = centroViewport();
              aplicarZoom(1, c.x, c.y);
            }}
            className={clsx(btnTool, "tabular-nums")}
            title="Volver a 100%"
          >
            {Math.round(escala * 100)}%
          </button>
          <button
            type="button"
            onClick={() => {
              const c = centroViewport();
              aplicarZoom(escalaRef.current * 1.2, c.x, c.y);
            }}
            className={btnTool}
            title="Acercar"
          >
            +
          </button>
          <span className="mx-0.5 h-4 w-px bg-linea" />
          <button type="button" onClick={ajustar} className={btnTool} title="Encajar todo el mapa en pantalla">
            Ajustar
          </button>
          {puedeEditar && (
            <button
              type="button"
              onClick={ordenar}
              className={btnTool}
              title="Reacomodar los cuadros en columnas y guardar"
            >
              Ordenar
            </button>
          )}
        </div>

        {/* Mundo (transformado) */}
        <div
          ref={worldRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: tamano.w,
            height: tamano.h,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${escala})`,
            backgroundImage: "radial-gradient(var(--linea) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {/* Conectores (no capturan puntero). overflow visible: las líneas
              hacia cuadros movidos a coordenadas negativas siguen dibujándose. */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={tamano.w}
            height={tamano.h}
            style={{ overflow: "visible" }}
          >
            {lineas.map((l) => {
              const enfocada = foco?.lineKeys.has(l.key) ?? false;
              // Sin selección las conexiones quedan tenues para no ensuciar el
              // mapa; con selección, el foco manda (fuertes vs. casi invisibles).
              const opacidadBase = l.kr ? 0.28 : 0.42;
              const op = foco ? (enfocada ? 0.95 : 0.07) : opacidadBase;
              return (
                <path
                  key={l.key}
                  d={curva(l.a, l.b)}
                  fill="none"
                  stroke="var(--oxford)"
                  strokeWidth={(enfocada ? 1.6 : 1) * (l.kr ? 1.5 : 2.5)}
                  strokeOpacity={op}
                  strokeLinecap="round"
                />
              );
            })}
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

          {/* Capa de hover de líneas: trazo transparente ancho sólo para
              detectar el mouse sobre la línea y revelar la ✕. */}
          {puedeEditar && (
            <svg
              className="pointer-events-none absolute inset-0"
              width={tamano.w}
              height={tamano.h}
              style={{ overflow: "visible" }}
            >
              {lineas.map((l) => (
                <path
                  key={l.key}
                  d={curva(l.a, l.b)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                  style={{ pointerEvents: "stroke" }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setHoverLinea(l.key)}
                  onMouseLeave={() => setHoverLinea((h) => (h === l.key ? null : h))}
                />
              ))}
            </svg>
          )}

          {/* ✕ para desvincular: sólo en líneas enfocadas o con el mouse encima. */}
          {puedeEditar &&
            lineas
              .filter((l) => (foco?.lineKeys.has(l.key) ?? false) || hoverLinea === l.key)
              .map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={l.quitar}
                  onMouseEnter={() => setHoverLinea(l.key)}
                  onMouseLeave={() => setHoverLinea((h) => (h === l.key ? null : h))}
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
                acento="border-2 border-oxford/60"
                seleccionado={estaSel("okrA", oa.id)}
                resaltado={estaRel("okrA", oa.id)}
              >
                <div className="flex items-start justify-between gap-1 rounded-t-xl border-b border-oxford/20 bg-oxford-suave px-3 py-2">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-oxford">
                        OKR anual
                      </span>
                      {!alineados.okrA.has(oa.id) && <ChipSinAlineacion />}
                    </span>
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">
                      {oa.titulo}
                    </p>
                    {oa.responsable && (
                      <p className="truncate text-xs text-tenue">{oa.responsable}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    {puedeEditar && (
                      <OkrAnualModal
                        okr={oa}
                        personas={personas}
                        coResponsablesActuales={[]}
                        triggerLabel="✎"
                        triggerClassName={btnMini}
                      />
                    )}
                    {esDireccion && (
                      <BorrarAnual
                        tipo="okrAnual"
                        id={oa.id}
                        titulo={oa.titulo}
                        advertencia={advertenciaOkrAnual(oa.id)}
                        triggerClassName={btnMini}
                      />
                    )}
                    <Punto2 kind="okrA" id={oa.id} desalineado={!alineados.okrA.has(oa.id)} />
                  </div>
                </div>
                <div className="space-y-1 px-3 py-2">
                  {krs.length === 0 ? (
                    <p className="text-xs text-tenue">Sin KR anuales.</p>
                  ) : (
                    krs.map((kr, i) => (
                      <div
                        key={kr.id}
                        data-krrow
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => seleccionarKr(e, "krA", kr.id)}
                        className={clsx(
                          "flex cursor-pointer items-start gap-1.5 rounded px-1 text-sm transition",
                          estaSel("krA", kr.id)
                            ? "bg-oxford/15 ring-1 ring-oxford"
                            : estaRel("krA", kr.id)
                              ? "bg-oxford/5"
                              : "hover:bg-linea/40"
                        )}
                      >
                        <span className="shrink-0 rounded bg-linea/60 px-1.5 py-0.5 text-[11px] font-semibold text-tenue">
                          KR{i + 1}
                        </span>
                        <span className="min-w-0 flex-1 line-clamp-2 leading-snug">{kr.titulo}</span>
                        <span className="shrink-0 text-xs text-tenue">{formatearMeta(kr)}</span>
                        {puedeEditar && (
                          <KrAnualModal
                            okrAnualId={oa.id}
                            kr={kr}
                            triggerLabel="✎"
                            triggerClassName={btnMini}
                          />
                        )}
                        {esDireccion && (
                          <BorrarAnual
                            tipo="krAnual"
                            id={kr.id}
                            titulo={kr.titulo}
                            advertencia={
                              alineados.krA.has(kr.id) ? "Se quitan sus alineaciones." : ""
                            }
                            triggerClassName={btnMini}
                          />
                        )}
                        <Punto2 kind="krA" id={kr.id} desalineado={!alineados.krA.has(kr.id)} />
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
                acento="border border-linea"
                seleccionado={estaSel("okrT", ot.id)}
                resaltado={estaRel("okrT", ot.id)}
              >
                <div className="flex items-start justify-between gap-1 rounded-t-xl border-b border-linea bg-linea/30 px-3 py-2">
                  <div className="flex min-w-0 items-start gap-1.5">
                    <Punto2
                      kind="okrT"
                      id={ot.id}
                      desalineado={!alineados.okrT.has(ot.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-tenue">
                          OKR trimestral · {ot.trimestre} {ot.anio}
                        </span>
                        {!alineados.okrT.has(ot.id) && <ChipSinAlineacion />}
                      </span>
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">
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
                      personas={personas}
                      coResponsablesActuales={[]}
                      triggerLabel="✎"
                      triggerClassName={btnMini}
                    />
                  )}
                </div>
                <div className="space-y-1 px-3 py-2">
                  {krs.length === 0 ? (
                    <p className="text-xs text-tenue">Sin KR trimestrales.</p>
                  ) : (
                    krs.map((kr, i) => (
                      <div
                        key={kr.id}
                        data-krrow
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => seleccionarKr(e, "krT", kr.id)}
                        className={clsx(
                          "flex cursor-pointer items-start gap-1.5 rounded px-1 text-sm transition",
                          estaSel("krT", kr.id)
                            ? "bg-oxford/15 ring-1 ring-oxford"
                            : estaRel("krT", kr.id)
                              ? "bg-oxford/5"
                              : "hover:bg-linea/40"
                        )}
                      >
                        <Punto2 kind="krT" id={kr.id} desalineado={!alineados.krT.has(kr.id)} />
                        <span className="shrink-0 rounded bg-linea/60 px-1.5 py-0.5 text-[11px] font-semibold text-tenue">
                          KR{i + 1}
                        </span>
                        <span className="min-w-0 flex-1 line-clamp-2 leading-snug">{kr.titulo}</span>
                        <SemaforoBadge estado={kr.estado_semaforo} compact />
                        <span className="shrink-0 text-xs text-tenue">{progresoPct(kr)}%</span>
                        {puedeEditar && (
                          <KrModal
                            okrFijo={ot}
                            clientes={clientes}
                            kr={kr}
                            hitos={kr.hitos_kr ?? []}
                            triggerLabel="✎"
                            triggerClassName={btnMini}
                          />
                        )}
                      </div>
                    ))
                  )}
                  {puedeEditar && (
                    <KrModal
                      okrFijo={ot}
                      clientes={clientes}
                      triggerLabel="+ KR trimestral"
                      triggerClassName={btnAlta}
                    />
                  )}
                </div>
              </Cuadro>
            );
          })}
        </div>

        {/* Ayuda */}
        <div className="pointer-events-none absolute bottom-2 left-3 z-40 max-w-[60%] text-[11px] text-tenue">
          {hint}
        </div>

        {/* Leyenda: qué conecta con qué. Debajo de los controles. */}
        <div className="pointer-events-none absolute right-3 top-14 z-40 flex items-center gap-3 rounded-md border border-linea bg-panel/90 px-2 py-1 text-[10px] text-tenue backdrop-blur">
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded-full bg-oxford/70" />
            OKR ↔ OKR
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-px w-4 rounded-full bg-oxford/50" />
            KR ↔ KR
          </span>
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
