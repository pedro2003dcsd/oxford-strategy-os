"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ScoutChat } from "@/components/ScoutChat";

/** Acceso global a Scout desde cualquier pantalla. En /scout se oculta:
 * ahí el chat ya ocupa la página entera. */
export function ScoutFloatingButton() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!abierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  if (pathname === "/scout") return null;

  return (
    <>
      {abierto && (
        <>
          {/* Fondo: en móvil tapa la pantalla, en desktop solo cierra al clic. */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
            onClick={() => setAbierto(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Scout AI"
            className="fixed inset-x-3 bottom-24 top-16 z-50 flex sm:inset-x-auto sm:right-6 sm:top-auto sm:h-[32rem] sm:w-[26rem]"
          >
            <div className="w-full shadow-2xl">
              <ScoutChat variant="panel" />
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={abierto ? "Cerrar Scout AI" : "Abrir Scout AI"}
        className={clsx(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-white shadow-lg transition print:hidden",
          abierto ? "bg-tenue hover:bg-tinta" : "bg-oxford hover:bg-oxford-fuerte"
        )}
      >
        <span aria-hidden>{abierto ? "✕" : "✦"}</span>
        <span className="hidden sm:inline">
          {abierto ? "Cerrar" : "Scout AI"}
        </span>
      </button>
    </>
  );
}
