"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { AREAS, TRIMESTRES } from "@/lib/types";
import type { CheckIn, KeyResultCompleto, ProyectoSolop } from "@/lib/types";
import { hasAlertaRentabilidad } from "@/lib/kr-logic";
import { tieneAlertaRentabilidad, advertenciaHoras } from "@/lib/solop-logic";
import { responsablesDe } from "@/lib/personas";
import { useResponsable } from "@/lib/use-responsable";
import { KrCard } from "@/components/KrCard";
import { KrDrawer } from "@/components/KrDrawer";
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

export function DashboardClient({
  krs,
  checkIns = [],
  proyectos = [],
  responsableDelPerfil = null,
}: {
  krs: KeyResultCompleto[];
  checkIns?: CheckIn[];
  proyectos?: ProyectoSolop[];
  /** Viene de la cuenta con la que se entró. Si está, manda sobre el
   * selector manual: nadie tiene que decir quién es si ya se logueó. */
  responsableDelPerfil?: string | null;
}) {
  const [trimestre, setTrimestre] = useState<(typeof TRIM_OPTIONS)[number]>("Todos");
  const [area, setArea] = useState<(typeof AREA_OPTIONS)[number]>("Todas");
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [misObjetivos, setMisObjetivos] = useState(false);
  const [elegido, guardarResponsable] = useResponsable();
  const [krAbierto, setKrAbierto] = useState<string | null>(null);

  const responsables = useMemo(() => responsablesDe(krs), [krs]);

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

  const bloqueoPorKr = useMemo(() => {
    const map = new Map<string, CheckIn>();
    // checkIns viene ordenado ascendente: el último con comentario gana.
    for (const c of checkIns) {
      if (c.comentario_bloqueos) map.set(c.kr_id, c);
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

  const visibles = useMemo(() => {
    /** Un KR está "en alerta" si su semáforo no está en verde, si tiene alerta
     * de rentabilidad, o si su proyecto en SOLOP se come las horas. */
    function enAlerta(kr: KeyResultCompleto): boolean {
      if (kr.estado_semaforo !== "verde") return true;
      if (hasAlertaRentabilidad(kr)) return true;
      const p = proyectoPorKr.get(kr.id);
      return Boolean(p && (tieneAlertaRentabilidad(p) || advertenciaHoras(p)));
    }

    const base = krs.filter((kr) => {
      if (trimestre !== "Todos" && kr.okr_trimestral?.trimestre !== trimestre)
        return false;
      if (area !== "Todas" && kr.okr_trimestral?.area !== area) return false;
      if (misObjetivos && yo && kr.okr_trimestral?.responsable !== yo)
        return false;
      return true;
    });

    return { filtrados: base, visibles: soloAlertas ? base.filter(enAlerta) : base };
  }, [krs, trimestre, area, misObjetivos, yo, soloAlertas, proyectoPorKr]);

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

  const grupos = useMemo(() => {
    const porArea = new Map<string, KeyResultCompleto[]>();
    for (const kr of visibles.visibles) {
      const a = kr.okr_trimestral?.area ?? "Sin área asignada";
      if (!porArea.has(a)) porArea.set(a, []);
      porArea.get(a)!.push(kr);
    }
    return [...porArea.entries()].sort(
      (a, b) => AREA_ORDER.indexOf(a[0]) - AREA_ORDER.indexOf(b[0])
    );
  }, [visibles]);

  const seleccionado = krs.find((k) => k.id === krAbierto) ?? null;

  return (
    <div className="space-y-8">
      <EstrellaPolar krs={krs} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs options={TRIM_OPTIONS} value={trimestre} onChange={setTrimestre} />
          <FilterTabs options={AREA_OPTIONS} value={area} onChange={setArea} />
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
