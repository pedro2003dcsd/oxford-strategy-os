"use client";

import { useState } from "react";
import clsx from "clsx";
import { LomClient } from "@/components/LomClient";
import { PizarraLom } from "@/components/PizarraLom";
import type {
  ActaDirectorio,
  CheckIn,
  CompromisoLom,
  KeyResultCompleto,
} from "@/lib/types";

const VISTAS = [
  { id: "lista", emoji: "📋", label: "Modo reunión" },
  { id: "pizarra", emoji: "🧱", label: "Pizarra" },
] as const;

type Vista = (typeof VISTAS)[number]["id"];

/** La LOM se usa de dos formas. El modo reunión es el recorrido guiado que
 * ya existía: filtros, sparklines, resumen para el grupo. La pizarra es
 * para proyectar: tres columnas y nada más, como el Mural que venían
 * usando. Comparten los mismos datos, así que el cambio es instantáneo. */
export function LomVistas({
  krs,
  checkIns,
  compromisos,
  actas,
}: {
  krs: KeyResultCompleto[];
  checkIns: CheckIn[];
  compromisos: CompromisoLom[];
  actas: ActaDirectorio[];
}) {
  const [vista, setVista] = useState<Vista>("lista");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg bg-linea/60 p-1 print:hidden">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVista(v.id)}
            className={clsx(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              vista === v.id
                ? "bg-panel text-foreground shadow-sm"
                : "text-tenue hover:text-foreground"
            )}
          >
            <span aria-hidden>{v.emoji}</span> {v.label}
          </button>
        ))}
      </div>

      {vista === "lista" ? (
        <LomClient krs={krs} checkIns={checkIns} compromisos={compromisos} />
      ) : (
        <PizarraLom
          krs={krs}
          checkIns={checkIns}
          compromisos={compromisos}
          actas={actas}
        />
      )}
    </div>
  );
}
