"use client";

import { useMemo, useState } from "react";
import { ScoutChat } from "@/components/ScoutChat";
import { KrDrawer } from "@/components/KrDrawer";
import type { CheckIn, KeyResultCompleto, ProyectoSolop } from "@/lib/types";

/** Scout con el panel lateral enganchado: cuando la respuesta menciona un KR,
 * se abre acá mismo en vez de sacar al usuario de la conversación. */
export function ScoutPageClient({
  krs,
  checkIns,
  proyectos,
}: {
  krs: KeyResultCompleto[];
  checkIns: CheckIn[];
  proyectos: ProyectoSolop[];
}) {
  const [krAbierto, setKrAbierto] = useState<string | null>(null);

  const checkInsPorKr = useMemo(() => {
    const map = new Map<string, CheckIn[]>();
    for (const c of checkIns) {
      if (!map.has(c.kr_id)) map.set(c.kr_id, []);
      map.get(c.kr_id)!.push(c);
    }
    return map;
  }, [checkIns]);

  const proyectoPorKr = useMemo(() => {
    const map = new Map<string, ProyectoSolop>();
    for (const p of proyectos) if (p.kr_id) map.set(p.kr_id, p);
    return map;
  }, [proyectos]);

  const seleccionado = krs.find((k) => k.id === krAbierto) ?? null;

  return (
    <>
      <ScoutChat variant="page" onAbrirKr={setKrAbierto} />
      {seleccionado && (
        <KrDrawer
          kr={seleccionado}
          checkIns={checkInsPorKr.get(seleccionado.id) ?? []}
          proyecto={proyectoPorKr.get(seleccionado.id) ?? null}
          onClose={() => setKrAbierto(null)}
        />
      )}
    </>
  );
}
