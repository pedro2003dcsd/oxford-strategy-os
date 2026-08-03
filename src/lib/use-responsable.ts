"use client";

import { useSyncExternalStore } from "react";

const CLAVE = "oxford:responsable";

let listeners: (() => void)[] = [];

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getSnapshot(): string {
  return localStorage.getItem(CLAVE) ?? "";
}

/** En el servidor no hay localStorage: se arranca vacío y el cliente
 * sincroniza en el primer render sin romper la hidratación. */
function getServerSnapshot(): string {
  return "";
}

/** "Quién soy" para el filtro de Mis Objetivos. Vive en el navegador porque
 * la app todavía no mapea la cuenta de Supabase con el responsable del OKR. */
export function useResponsable(): [string, (nombre: string) => void] {
  const valor = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function guardar(nombre: string) {
    if (nombre) localStorage.setItem(CLAVE, nombre);
    else localStorage.removeItem(CLAVE);
    for (const l of listeners) l();
  }

  return [valor, guardar];
}
