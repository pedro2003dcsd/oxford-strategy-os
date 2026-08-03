import clsx from "clsx";
import { iniciales, tonoDePersona } from "@/lib/personas";

/** Badge de responsable: iniciales + nombre. Sin nombre, solo el círculo. */
export function Avatar({
  nombre,
  conNombre = true,
  size = "sm",
}: {
  nombre: string;
  conNombre?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={clsx(
          "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
          tonoDePersona(nombre),
          size === "sm" ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[11px]"
        )}
        title={nombre}
        aria-hidden={conNombre}
      >
        {iniciales(nombre)}
      </span>
      {conNombre && (
        <span
          className={clsx(
            "truncate font-medium text-tenue",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          {nombre}
        </span>
      )}
      {!conNombre && <span className="sr-only">{nombre}</span>}
    </span>
  );
}
