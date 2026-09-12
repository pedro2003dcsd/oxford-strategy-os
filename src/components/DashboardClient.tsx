"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { AREAS, TRIMESTRES } from "@/lib/types";
import type {
  CheckIn,
  Cliente,
  KeyResultCompleto,
  OkrTrimestral,
  ProyectoSolop,
  Trimestre,
  UsuarioAutorizado,
} from "@/lib/types";
import { hasAlertaRentabilidad, numerarKrsPorObjetivo } from "@/lib/kr-logic";
import { tieneAlertaRentabilidad, advertenciaHoras } from "@/lib/solop-logic";
import { responsablesDe } from "@/lib/personas";
import { useResponsable } from "@/lib/use-responsable";
import { KrCard } from "@/components/KrCard";
import { KrDrawer } from "@/components/KrDrawer";
import { KrModal } from "@/components/KrModal";
import { NewOkrTrimestralModal } from "@/components/OkrForms";
import { EstrellaPolar } from "@/components/EstrellaPolar";

const AREA_ORDER = [...AREAS, "Sin área asignada"];

function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-linea/60 p-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={clsx(
            "rounded-md px-2.5 py-1 text-xs font-medium transition",
            value === opt
              ? "bg-panel text-foreground shadow-sm"
              : "text-tenue hover:text-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "red";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
        tone === "emerald" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        tone === "amber" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        tone === "red" && "bg-red-500/10 text-red-700 dark:text-red-400"
      )}
    >
      {label}
      <span className="font-semibold">{value}</span>
    </span>
  );
}

const TRIM_OPTIONS = ["Todos", ...TRIMESTRES] as const;
const AREA_OPTIONS = ["Todas", ...AREAS] as const;

/** Sección fija donde caen los objetivos colaborativos, una sola vez. */
const COLABORATIVOS = "COLABORATIVOS";

/** El trimestre según el mes actual: Ene-Mar Q1, Abr-Jun Q2, Jul-Sep Q3,
 * Oct-Dic Q4. No se hardcodea: se calcula de la fecha. */
function trimestreActual(): Trimestre {
  return TRIMESTRES[Math.floor(new Date().getMonth() / 3)];
}

export function DashboardClient({
  krs,
  checkIns = [],
  proyectos = [],
  responsableDelPerfil = null,
  areaDelPerfil = null,
  misOkrIds = null,
  okrsTrimestrales = [],
  clientes = [],
  personas = [],
  puedeCrear = false,
}: {
  krs: KeyResultCompleto[];
  checkIns?: CheckIn[];
  proyectos?: ProyectoSolop[];
  /** Para el alta desde el Dashboard: crear un KR necesita elegir su OKR
   * trimestral. Vienen del server para no pedirlos desde el cliente en una
   * segunda vuelta. */
  okrsTrimestrales?: OkrTrimestral[];
  clientes?: Cliente[];
  personas?: UsuarioAutorizado[];
  /** Falso para el rol lectura: sin permiso de escritura no se muestran los
   * botones de alta, porque la acción los rechazaría igual. */
  puedeCrear?: boolean;
  /** Viene de la cuenta con la que se entró. Si está, manda sobre el
   * selector manual: nadie tiene que decir quién es si ya se logueó. */
  responsableDelPerfil?: string | null;
  /** El área de la persona logueada. El Dashboard arranca filtrado ahí,
   * como conveniencia: ve lo suyo primero, pero con un clic ve todo. */
  areaDelPerfil?: string | null;
  /** Los OKRs trimestrales que lleva quien está mirando, resueltos por id
   * en el servidor: como principal o compartiendo el objetivo.
   *
   * Antes esto se resolvía comparando el nombre escrito en el OKR contra el
   * de la lista de accesos. Un "Ayelén" contra un "Ayelén Bruno" devolvía
   * cero objetivos sin dar ningún error. */
  misOkrIds?: string[] | null;
}) {
  // Arranca en el trimestre en curso (se puede volver a "Todos" a mano).
  const [trimestre, setTrimestre] =
    useState<(typeof TRIM_OPTIONS)[number]>(trimestreActual());
  const [area, setArea] = useState<(typeof AREA_OPTIONS)[number]>(
    AREA_OPTIONS.includes(areaDelPerfil as (typeof AREA_OPTIONS)[number])
      ? (areaDelPerfil as (typeof AREA_OPTIONS)[number])
      : "Todas"
  );
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [misObjetivos, setMisObjetivos] = useState(false);
  const [elegido, guardarResponsable] = useResponsable();
  const [krAbierto, setKrAbierto] = useState<string | null>(null);

  const responsables = useMemo(() => responsablesDe(krs), [krs]);
  // Número de cada KR dentro de su objetivo, sobre la lista completa: así el
  // número no cambia aunque el filtro por área muestre solo algunos.
  const numeroKr = useMemo(() => numerarKrsPorObjetivo(krs), [krs]);

  // El perfil de la cuenta gana sobre la elección manual del navegador.
  const yo = responsableDelPerfil ?? elegido;
  const perfilFijo = Boolean(responsableDelPerfil);

  function elegirResponsable(nombre: string) {
    guardarResponsable(nombre);
    if (!nombre) setMisObjetivos(false);
  }

  const proyectoPorKr = useMemo(() => {
    const map = new Map<string, ProyectoSolop>();
    for (const p of proyectos) if (p.kr_id) map.set(p.kr_id, p);
    return map;
  }, [proyectos]);

  /** Bloqueo ACTUAL de cada KR: el que trae el último check-in, no un bloqueo
   * viejo arrastrado. Si el último check-in del KR ya no tiene comentario, no
   * se muestra nada aunque hubiera bloqueos en check-ins anteriores. */
  const bloqueoPorKr = useMemo(() => {
    // El check-in más reciente de cada KR, comparando por fecha para no
    // depender del orden en que llegan.
    const ultimo = new Map<string, CheckIn>();
    for (const c of checkIns) {
      const prev = ultimo.get(c.kr_id);
      if (!prev || new Date(c.creado_at) >= new Date(prev.creado_at)) {
        ultimo.set(c.kr_id, c);
      }
    }
    const map = new Map<string, CheckIn>();
    for (const [krId, c] of ultimo) {
      if (c.comentario_bloqueos) map.set(krId, c);
    }
    return map;
  }, [checkIns]);

  const checkInsPorKr = useMemo(() => {
    const map = new Map<string, CheckIn[]>();
    for (const c of checkIns) {
      if (!map.has(c.kr_id)) map.set(c.kr_id, []);
      map.get(c.kr_id)!.push(c);
    }
    return map;
  }, [checkIns]);

  /** Las áreas donde vive un KR. Un objetivo colaborativo no tiene un área
   * padre: aparece en cada una de las que involucra. */
  function areasDe(kr: KeyResultCompleto): string[] {
    const ot = kr.okr_trimestral;
    if (ot?.es_colaborativo && ot.areas_involucradas?.length) {
      return ot.areas_involucradas;
    }
    return [ot?.area ?? "Sin área asignada"];
  }

  const visibles = useMemo(() => {
    /** Un KR está "en alerta" si su semáforo no está en verde, si tiene alerta
     * de rentabilidad, si su proyecto en SOLOP se come las horas, o si tiene
     * un bloqueo actual (según el último check-in). */
    function enAlerta(kr: KeyResultCompleto): boolean {
      if (kr.estado_semaforo !== "verde") return true;
      if (hasAlertaRentabilidad(kr)) return true;
      if (bloqueoPorKr.has(kr.id)) return true;
      const p = proyectoPorKr.get(kr.id);
      return Boolean(p && (tieneAlertaRentabilidad(p) || advertenciaHoras(p)));
    }

    /** Con la cuenta resuelta se cruza por id. El nombre queda solo como
     * respaldo para quien todavía no está vinculado en la lista de accesos. */
    function esMio(kr: KeyResultCompleto): boolean {
      if (misOkrIds) {
        const okrId = kr.okr_trimestral?.id;
        return Boolean(okrId && misOkrIds.includes(okrId));
      }
      return Boolean(yo) && kr.okr_trimestral?.responsable === yo;
    }

    const base = krs.filter((kr) => {
      if (trimestre !== "Todos" && kr.okr_trimestral?.trimestre !== trimestre)
        return false;
      if (area !== "Todas" && !areasDe(kr).includes(area)) return false;
      if (misObjetivos && !esMio(kr)) return false;
      return true;
    });

    return { filtrados: base, visibles: soloAlertas ? base.filter(enAlerta) : base };
  }, [krs, trimestre, area, misObjetivos, yo, misOkrIds, soloAlertas, proyectoPorKr, bloqueoPorKr]);

  const counts = useMemo(
    () =>
      visibles.filtrados.reduce(
        (acc, kr) => {
          acc[kr.estado_semaforo]++;
          if (hasAlertaRentabilidad(kr)) acc.alertaRentabilidad++;
          return acc;
        },
        { verde: 0, amarillo: 0, rojo: 0, alertaRentabilidad: 0 }
      ),
    [visibles]
  );

  /** Estructura estable: los KR propios de un área van en la sección de su
   * área; los colaborativos van UNA sola vez a la sección COLABORATIVOS al
   * final. Ningún KR aparece dos veces. El orden dentro de cada sección es el
   * de `visibles.visibles`, que conserva el orden de la lista original: los
   * filtros ocultan, no reordenan. */
  const grupos = useMemo(() => {
    const porArea = new Map<string, KeyResultCompleto[]>();
    const colaborativos: KeyResultCompleto[] = [];
    for (const kr of visibles.visibles) {
      if (kr.okr_trimestral?.es_colaborativo) {
        colaborativos.push(kr);
      } else {
        const a = kr.okr_trimestral?.area ?? "Sin área asignada";
        if (!porArea.has(a)) porArea.set(a, []);
        porArea.get(a)!.push(kr);
      }
    }
    const secciones: [string, KeyResultCompleto[]][] = [...porArea.entries()].sort(
      (a, b) => AREA_ORDER.indexOf(a[0]) - AREA_ORDER.indexOf(b[0])
    );
    if (colaborativos.length > 0) secciones.push([COLABORATIVOS, colaborativos]);
    return secciones;
  }, [visibles]);

  const seleccionado = krs.find((k) => k.id === krAbierto) ?? null;

  return (
    <div className="space-y-8">
      <EstrellaPolar krs={krs} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs options={TRIM_OPTIONS} value={trimestre} onChange={setTrimestre} />
          <FilterTabs options={AREA_OPTIONS} value={area} onChange={setArea} />

          {/* Alta desde el Dashboard: antes había que ir a Alineación para
              crear cualquier cosa. Acá se crea sin salir de la pantalla en la
              que todos caen primero. */}
          {puedeCrear && (
            <div className="ml-auto flex items-center gap-2">
              <NewOkrTrimestralModal
                personas={personas}
                triggerLabel="+ OKR trimestral"
                triggerClassName="rounded-full border border-linea px-3 py-1.5 text-xs font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground"
              />
              <KrModal
                okrsTrimestrales={okrsTrimestrales}
                clientes={clientes}
                triggerLabel="+ KR trimestral"
                triggerClassName="rounded-full bg-oxford px-3 py-1.5 text-xs font-medium text-white transition hover:bg-oxford-fuerte"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMisObjetivos((v) => !v)}
            disabled={!yo}
            title={yo ? undefined : "Elegí quién sos para usar este filtro"}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40",
              misObjetivos
                ? "border-oxford bg-oxford text-white"
                : "border-linea text-tenue hover:border-oxford/50 hover:text-foreground"
            )}
          >
            👤 Mis Objetivos
          </button>

          <button
            type="button"
            onClick={() => setSoloAlertas((v) => !v)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              soloAlertas
                ? "border-oxford bg-oxford text-white"
                : "border-linea text-tenue hover:border-oxford/50 hover:text-foreground"
            )}
          >
            ⚠️ Solo Alertas
          </button>

          {perfilFijo ? (
            <span className="rounded-full border border-linea px-3 py-1.5 text-xs text-tenue">
              Sos {yo}
            </span>
          ) : (
            <select
              value={yo}
              onChange={(e) => elegirResponsable(e.target.value)}
              aria-label="Quién sos"
              className="rounded-full border border-linea bg-transparent px-3 py-1.5 text-xs text-tenue"
            >
              <option value="">Soy…</option>
              {responsables.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <StatPill label="Verde" value={counts.verde} tone="emerald" />
          <StatPill label="Amarillo" value={counts.amarillo} tone="amber" />
          <StatPill label="Rojo" value={counts.rojo} tone="red" />
          {counts.alertaRentabilidad > 0 && (
            <StatPill
              label="Alerta rentabilidad"
              value={counts.alertaRentabilidad}
              tone="red"
            />
          )}
        </div>
      </div>

      {grupos.length === 0 && (
        <p className="text-sm text-tenue">
          {soloAlertas
            ? "Nada en alerta para este filtro. Todo en verde."
            : "No hay Key Results para este filtro."}
        </p>
      )}

      {grupos.map(([nombreArea, items]) => (
        <section key={nombreArea} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tenue">
            {nombreArea}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((kr) => (
              <KrCard
                key={kr.id}
                kr={kr}
                numero={numeroKr.get(kr.id)}
                ultimoBloqueo={bloqueoPorKr.get(kr.id)}
                onSelect={(k) => setKrAbierto(k.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {seleccionado && (
        <KrDrawer
          kr={seleccionado}
          checkIns={checkInsPorKr.get(seleccionado.id) ?? []}
          proyecto={proyectoPorKr.get(seleccionado.id) ?? null}
          onClose={() => setKrAbierto(null)}
        />
      )}
    </div>
  );
}
