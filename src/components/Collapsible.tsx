"use client";

import { useState } from "react";
import clsx from "clsx";

export function Collapsible({
  summary,
  children,
  defaultOpen = false,
  level = 0,
  accion,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  level?: number;
  /** Va al lado del toggle y no adentro: un botón dentro de otro botón es
   * HTML inválido, y el clic terminaría plegando la sección. */
  accion?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 text-left transition hover:bg-linea/60"
        >
          <svg
            viewBox="0 0 16 16"
            className={clsx(
              "h-3.5 w-3.5 shrink-0 text-tenue transition-transform duration-200",
              open && "rotate-90"
            )}
            fill="currentColor"
          >
            <path d="M6 4l4 4-4 4V4z" />
          </svg>
          <div className="min-w-0 flex-1">{summary}</div>
        </button>
        {accion}
      </div>
      <div
        className={clsx(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div
            className={clsx(
              "border-l border-linea pb-1",
              level === 0 ? "ml-[7px] pl-4" : "ml-[7px] pl-3"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
