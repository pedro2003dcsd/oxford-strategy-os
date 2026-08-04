"use client";

import { useState } from "react";

const MENSAJE_POR_DEFECTO =
  "Esta acción asociará automáticamente la métrica a los KRs del Squad";

/**
 * Aviso para las acciones de la maqueta. En la demo alguien va a tocar los
 * botones: sin esto parecen rotos, y con esto queda claro que la pantalla
 * muestra el destino, no la función terminada.
 */
export function useToastDemo() {
  const [mensaje, setMensaje] = useState<string | null>(null);

  function simular(texto: string = MENSAJE_POR_DEFECTO) {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), 4500);
  }

  const toast = mensaje ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[60] w-[min(92vw,30rem)] -translate-x-1/2 rounded-xl border border-oxford/40 bg-panel px-4 py-3 shadow-2xl print:hidden"
    >
      <p className="text-sm font-semibold text-oxford">✨ Simulación Demo</p>
      <p className="text-sm leading-snug text-tenue">{mensaje}</p>
    </div>
  ) : null;

  return { simular, toast };
}

/** Aclaración fija arriba de las pantallas de maqueta. */
export function BannerMaqueta() {
  return (
    <p className="rounded-lg border border-oxford/30 bg-oxford-suave px-3 py-2 text-xs text-oxford print:hidden">
      <span className="font-semibold">Prototipo.</span> Los datos de esta
      pantalla son de ejemplo y las acciones todavía no guardan nada. Sirve para
      decidir el módulo, no para operarlo.
    </p>
  );
}
