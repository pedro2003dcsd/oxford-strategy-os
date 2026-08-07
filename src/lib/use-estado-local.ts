"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Un solo juego de suscriptores para todas las claves: son pocas y los
 * cambios son raros, así que no vale la pena indexar por clave. */
let listeners: (() => void)[] = [];

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function avisar() {
  for (const l of listeners) l();
}

/**
 * Estado que sobrevive al refresh, guardado en localStorage.
 *
 * Va con useSyncExternalStore y no con useEffect + setState: leer el
 * almacenamiento en un efecto provoca un render en cascada y además rompe
 * la hidratación, porque el servidor no tiene localStorage.
 */
export function useEstadoLocal<T>(
  clave: string,
  inicial: T
): [T, (valor: T) => void] {
  const getSnapshot = useCallback(() => {
    const crudo = localStorage.getItem(clave);
    return crudo ?? "";
  }, [clave]);

  // El servidor devuelve siempre lo mismo para que el primer render coincida.
  const getServerSnapshot = useCallback(() => "", []);

  const crudo = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let valor = inicial;
  if (crudo) {
    try {
      valor = JSON.parse(crudo) as T;
    } catch {
      valor = inicial;
    }
  }

  const guardar = useCallback(
    (nuevo: T) => {
      localStorage.setItem(clave, JSON.stringify(nuevo));
      avisar();
    },
    [clave]
  );

  return [valor, guardar];
}
