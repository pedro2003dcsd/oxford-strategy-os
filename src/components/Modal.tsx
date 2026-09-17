"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const inputClass =
  "w-full rounded-md border border-linea bg-panel px-2 py-1.5 text-sm";
export const labelClass = "text-xs font-medium text-tenue";
export const submitClass =
  "rounded-md bg-oxford px-3 py-1.5 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50";

/** Modal con el mismo esqueleto que KrModal, extraído para no repetirlo en
 * las seis pantallas nuevas.
 *
 * `bg-panel` y no `bg-transparent` en los inputs: la migración de tema dejó
 * las opciones de los desplegables invisibles justamente por eso. */
export function Modal({
  titulo,
  triggerLabel,
  triggerClassName,
  children,
}: {
  titulo: string;
  triggerLabel: ReactNode;
  triggerClassName: string;
  /** Recibe una función para cerrar desde adentro, cuando la acción sale bien. */
  children: (cerrar: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  // Escape cierra. Sin esto la única salida es el clic al borde, que en
  // pantalla chica casi no existe.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) contenedor.current?.focus();
  }, [open]);

  // El overlay se renderiza con un Portal sobre document.body, FUERA del árbol
  // del mapa: el `world` del mapa tiene un `transform`, y un ancestro
  // transformado vuelve el containing block de los `position: fixed`
  // descendientes, con lo que el modal quedaba referido al mundo desplazado en
  // vez del viewport. Con el portal, `fixed inset-0` siempre es la ventana.
  const overlay = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      // El portal vive en document.body, pero los eventos de React siguen
      // propagando por el ÁRBOL de React: este overlay es hijo de una tarjeta
      // del mapa cuyo `onPointerDown` arma drag/pan y cuyo `onClick` selecciona.
      // Cortamos acá pointerdown y click para que ninguna interacción del modal
      // llegue al mapa. stopPropagation solo frena el burbujeo hacia los
      // ancestros: los inputs/selects/textarea del modal siguen recibiendo su
      // propio evento, y el cierre por backdrop se resuelve en este mismo nodo.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        ref={contenedor}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-linea bg-panel p-6 shadow-xl outline-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-tenue hover:text-foreground"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children(() => setOpen(false))}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {/* `open` es false en SSR y en el render inicial del cliente, así que
          createPortal no toca document en el servidor ni rompe la hidratación. */}
      {open && createPortal(overlay, document.body)}
    </>
  );
}

export function ErrorText({ state }: { state: { error?: string } | undefined }) {
  if (!state?.error) return null;
  return <p className="text-sm text-red-600">{state.error}</p>;
}
