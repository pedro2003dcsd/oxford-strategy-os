"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { logout } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { useEstadoLocal } from "@/lib/use-estado-local";

interface Item {
  href: string;
  icono: string;
  label: string;
  descripcion: string;
}

interface Seccion {
  id: string;
  icono: string;
  titulo: string;
  items: Item[];
}

const SECCIONES: Seccion[] = [
  {
    id: "ritos",
    icono: "🎯",
    titulo: "OKRs & Ritos",
    items: [
      {
        href: "/",
        icono: "📊",
        label: "Dashboard",
        descripcion: "Vista general de OKRs y alertas",
      },
      {
        href: "/checkin",
        icono: "⏱️",
        label: "Check-in Express",
        descripcion: "Carga semanal de los PODs",
      },
      {
        href: "/okrs",
        icono: "🌳",
        label: "Alineación Estratégica",
        descripcion: "Pilares 2026 y arbolado de objetivos",
      },
    ],
  },
  {
    id: "performance",
    icono: "📈",
    titulo: "Performance Clientes",
    items: [
      {
        href: "/clientes",
        icono: "🗂️",
        label: "Cartera de Clientes",
        descripcion: "Fichas N1, N2 y N3 por cuenta",
      },
      {
        href: "/kata",
        icono: "📍",
        label: "Kata Board",
        descripcion: "Condición objetivo y experimentos PDCA",
      },
      {
        href: "/kpis-clientes",
        icono: "🎯",
        label: "KPIs Clientes",
        descripcion: "Evaluaciones 360 y notas",
      },
    ],
  },
  {
    id: "direccion",
    icono: "🏛️",
    titulo: "Control & Dirección",
    items: [
      {
        href: "/lom",
        icono: "🤝",
        label: "Modo LOM",
        descripcion: "Reunión ejecutiva de los martes",
      },
      {
        href: "/solop",
        icono: "💰",
        label: "SOLOP / Rentabilidad",
        descripcion: "Margen, $/h y consumo de horas",
      },
      {
        href: "/informes",
        icono: "📄",
        label: "Informes Automáticos",
        descripcion: "Generador de minutas y PDFs",
      },
      {
        href: "/scout",
        icono: "✦",
        label: "Scout AI",
        descripcion: "Asistente conversacional",
      },
    ],
  },
];

/** Sección a la que pertenece cada ruta, para abrirla sola al entrar. */
function seccionDe(pathname: string): string | null {
  for (const s of SECCIONES) {
    if (s.items.some((i) => i.href === pathname)) return s.id;
  }
  return null;
}

function esRutaActiva(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar({
  nombre,
  email,
}: {
  nombre: string;
  email: string;
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [fijado, setFijado] = useEstadoLocal<boolean>("oxford:sidebar-fijado", false);
  const [cerradas, setCerradas] = useEstadoLocal<string[]>(
    "oxford:sidebar-cerradas",
    []
  );

  // Al elegir una pantalla se cierra, salvo que esté fijado. Se resuelve en
  // el clic y no en un efecto sobre pathname: es un evento del usuario.
  function alNavegar() {
    if (!fijado) setAbierto(false);
  }

  useEffect(() => {
    if (!abierto || fijado) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, fijado]);

  const visible = abierto || fijado;

  function alternarSeccion(id: string) {
    setCerradas(
      cerradas.includes(id) ? cerradas.filter((x) => x !== id) : [...cerradas, id]
    );
  }

  // La sección de la pantalla actual se muestra abierta aunque el usuario la
  // haya cerrado antes: si no, entrás por un link y no ves dónde estás parado.
  const seccionActual = seccionDe(pathname);

  return (
    <>
      <button
        type="button"
        onClick={() => (fijado ? setFijado(false) : setAbierto((v) => !v))}
        aria-label={visible ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={visible}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lg transition hover:bg-linea/60"
      >
        ☰
      </button>

      {abierto && !fijado && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:bg-black/20"
          onClick={() => setAbierto(false)}
          aria-hidden
        />
      )}

      <aside
        aria-label="Navegación principal"
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-linea bg-panel transition-transform duration-200",
          visible ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-linea px-4 py-4">
          <Link href="/" className="text-sm font-semibold">
            Oxford <span className="text-oxford">Strategy OS</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFijado(!fijado)}
              aria-pressed={fijado}
              title={fijado ? "Soltar el menú" : "Fijar el menú abierto"}
              className={clsx(
                "hidden h-7 w-7 items-center justify-center rounded-md text-xs transition lg:flex",
                fijado
                  ? "bg-oxford-suave text-oxford"
                  : "text-tenue hover:bg-linea/60 hover:text-foreground"
              )}
            >
              📌
            </button>
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                setFijado(false);
              }}
              aria-label="Cerrar menú"
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </header>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {SECCIONES.map((seccion) => {
            const desplegada =
              !cerradas.includes(seccion.id) || seccion.id === seccionActual;

            return (
              <div key={seccion.id}>
                <button
                  type="button"
                  onClick={() => alternarSeccion(seccion.id)}
                  aria-expanded={desplegada}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-tenue transition hover:bg-linea/60 hover:text-foreground"
                >
                  <span aria-hidden>{seccion.icono}</span>
                  <span className="flex-1">{seccion.titulo}</span>
                  <svg
                    viewBox="0 0 16 16"
                    className={clsx(
                      "h-3 w-3 transition-transform duration-200",
                      desplegada && "rotate-90"
                    )}
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M6 4l4 4-4 4V4z" />
                  </svg>
                </button>

                <div
                  className={clsx(
                    "grid transition-[grid-template-rows] duration-200 ease-out",
                    desplegada ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <ul className="space-y-0.5 pb-1 pl-1">
                      {seccion.items.map((item) => {
                        const activo = esRutaActiva(item.href, pathname);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={alNavegar}
                              aria-current={activo ? "page" : undefined}
                              className={clsx(
                                "relative flex items-start gap-2.5 rounded-md py-2 pl-4 pr-2 transition",
                                activo
                                  ? "bg-oxford-suave"
                                  : "hover:bg-linea/60"
                              )}
                            >
                              {activo && (
                                <span
                                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-oxford"
                                  aria-hidden
                                />
                              )}
                              <span className="mt-0.5 text-sm" aria-hidden>
                                {item.icono}
                              </span>
                              <span className="min-w-0">
                                <span
                                  className={clsx(
                                    "block text-sm font-medium leading-tight",
                                    activo && "text-oxford"
                                  )}
                                >
                                  {item.label}
                                </span>
                                <span className="block text-[11px] leading-snug text-tenue">
                                  {item.descripcion}
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Link
              href="/equipo"
              onClick={alNavegar}
              className={clsx(
                "relative flex items-center gap-2.5 rounded-md py-2 pl-4 pr-2 text-sm transition",
                esRutaActiva("/equipo", pathname)
                  ? "bg-oxford-suave text-oxford"
                  : "text-tenue hover:bg-linea/60 hover:text-foreground"
              )}
            >
              {esRutaActiva("/equipo", pathname) && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-oxford"
                  aria-hidden
                />
              )}
              <span aria-hidden>👥</span> Equipo y accesos
            </Link>
          </div>
        </nav>

        <footer className="border-t border-linea px-4 py-3">
          <div className="mb-2 min-w-0">
            <Avatar nombre={nombre} size="md" />
            <p className="mt-1 truncate text-[11px] text-tenue">{email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-md border border-linea px-3 py-1.5 text-xs font-medium text-tenue transition hover:border-oxford/50 hover:text-foreground"
            >
              Cerrar sesión
            </button>
          </form>
        </footer>
      </aside>
    </>
  );
}
