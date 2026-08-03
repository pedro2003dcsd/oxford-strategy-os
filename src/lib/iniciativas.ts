import type { EstadoIniciativa, Iniciativa } from "@/lib/types";

export interface AvanceIniciativas {
  total: number;
  completadas: number;
  bloqueadas: number;
  pct: number;
}

export function avanceIniciativas(iniciativas: Iniciativa[]): AvanceIniciativas {
  const total = iniciativas.length;
  const completadas = iniciativas.filter((i) => i.estado === "completado").length;
  const bloqueadas = iniciativas.filter((i) => i.estado === "bloqueado").length;
  return {
    total,
    completadas,
    bloqueadas,
    pct: total === 0 ? 0 : Math.round((completadas / total) * 100),
  };
}

export const ESTADO_INICIATIVA_CLASES: Record<EstadoIniciativa, string> = {
  pendiente: "bg-linea/60 text-tenue",
  en_curso: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  bloqueado: "bg-red-500/15 text-red-700 dark:text-red-400",
  completado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

/** Vencida = tiene fecha límite pasada y todavía no está completada. */
export function estaVencida(i: Iniciativa): boolean {
  if (!i.fecha_limite || i.estado === "completado") return false;
  return new Date(i.fecha_limite) < new Date(new Date().toDateString());
}
