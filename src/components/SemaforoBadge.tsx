import clsx from "clsx";
import type { Semaforo } from "@/lib/types";

const LABELS: Record<Semaforo, string> = {
  verde: "En línea",
  amarillo: "En riesgo",
  rojo: "Retrasado",
};

const DOT_CLASSES: Record<Semaforo, string> = {
  verde: "bg-emerald-500",
  amarillo: "bg-amber-500",
  rojo: "bg-red-500",
};

const BADGE_CLASSES: Record<Semaforo, string> = {
  verde: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  amarillo: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  rojo: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function SemaforoBadge({
  estado,
  compact = false,
}: {
  estado: Semaforo;
  compact?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        BADGE_CLASSES[estado]
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", DOT_CLASSES[estado])} />
      {!compact && LABELS[estado]}
    </span>
  );
}
