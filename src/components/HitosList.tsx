"use client";

import { useTransition } from "react";
import clsx from "clsx";
import { toggleHito } from "@/app/(protected)/kr/[id]/actions";
import type { HitoKr } from "@/lib/types";

export function HitosList({ krId, hitos }: { krId: string; hitos: HitoKr[] }) {
  const [isPending, startTransition] = useTransition();
  const ordenados = [...hitos].sort((a, b) => a.orden - b.orden);

  return (
    <ul className="space-y-2">
      {ordenados.map((hito) => (
        <li key={hito.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hito.cumplido}
            disabled={isPending}
            onChange={(e) =>
              startTransition(() => {
                toggleHito(hito.id, krId, e.target.checked);
              })
            }
            className="h-4 w-4 rounded border-black/20 dark:border-white/30"
          />
          <span className={clsx(hito.cumplido && "text-neutral-400 line-through")}>
            {hito.titulo}
          </span>
        </li>
      ))}
    </ul>
  );
}
