"use client";

import { useActionState, useTransition } from "react";
import clsx from "clsx";
import {
  agregarUsuario,
  cambiarAreaUsuario,
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  quitarUsuario,
  type EquipoState,
} from "@/app/(protected)/equipo/actions";
import { Avatar } from "@/components/Avatar";
import {
  AREAS,
  ROLES,
  ROL_LABELS,
  type Rol,
  type UsuarioAutorizado,
} from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-linea bg-panel px-2 py-1.5 text-sm";

/** Qué puede hacer cada rol, en una línea. Va debajo del selector para que
 * Dirección no tenga que adivinar qué está eligiendo. */
const ROL_AYUDA: Record<Rol, string> = {
  direccion: "Administra todo, incluida esta lista de accesos.",
  equipo: "Carga y edita objetivos, check-ins y clientes.",
  lectura: "Solo mira. No puede guardar cambios.",
};

/** Orden para agrupar la tabla: Dirección primero, lectura al final. */
const ORDEN_ROL: Record<Rol, number> = { direccion: 0, equipo: 1, lectura: 2 };

export function EquipoClient({
  usuarios,
  esDireccion,
  miEmail,
}: {
  usuarios: UsuarioAutorizado[];
  esDireccion: boolean;
  miEmail: string;
}) {
  const [pendiente, startTransition] = useTransition();
  const [state, formAction, agregando] = useActionState<EquipoState, FormData>(
    agregarUsuario,
    undefined
  );

  const direccionActiva = usuarios.filter(
    (u) => u.rol === "direccion" && u.activo
  ).length;

  const ordenados = [...usuarios].sort((a, b) => {
    const porRol = ORDEN_ROL[a.rol] - ORDEN_ROL[b.rol];
    return porRol !== 0 ? porRol : a.nombre.localeCompare(b.nombre, "es");
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Equipo y accesos</h1>
        <p className="text-sm text-tenue">
          Solo las personas de esta lista pueden entrar. Al habilitar Google,
          esta lista es la única puerta: cualquiera con Gmail puede intentar
          entrar, pero sin estar acá se le cierra la sesión.
        </p>
      </div>

      {!esDireccion && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          Estás viendo la lista en modo lectura. Solo Dirección puede
          modificarla.
        </p>
      )}

      {esDireccion && (
        <form
          action={formAction}
          className="space-y-3 rounded-lg border border-linea p-4"
        >
          <p className="text-sm font-medium">Dar acceso a alguien nuevo</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-tenue">
                Email de Google
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="nombre@gmail.com"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-tenue">
                Nombre y apellido
              </label>
              <input name="nombre" required className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-tenue">Área</label>
              <select name="area" defaultValue="" className={inputClass}>
                <option value="">Sin asignar</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 lg:col-span-3">
              <label className="text-xs font-medium text-tenue">Rol</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r}
                    className="flex flex-1 cursor-pointer items-start gap-2 rounded-md border border-linea p-2.5 text-sm has-[:checked]:border-oxford has-[:checked]:bg-oxford-suave"
                  >
                    <input
                      type="radio"
                      name="rol"
                      value={r}
                      defaultChecked={r === "equipo"}
                      className="mt-0.5 accent-oxford"
                    />
                    <span>
                      <span className="block font-medium">{ROL_LABELS[r]}</span>
                      <span className="block text-xs text-tenue">
                        {ROL_AYUDA[r]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={agregando}
                className="w-full rounded-md bg-oxford px-3 py-2 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50"
              >
                {agregando ? "Agregando…" : "Dar acceso"}
              </button>
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>
          )}
          {state?.ok && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {state.ok}
            </p>
          )}
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-linea">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-linea text-left text-xs uppercase tracking-wide text-tenue">
              <th className="px-4 py-3">Persona</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {ordenados.map((u) => {
              const esUltimaDireccion =
                u.rol === "direccion" && u.activo && direccionActiva <= 1;
              return (
                <tr key={u.id} className="border-b border-linea last:border-0">
                  <td className="px-4 py-3">
                    <Avatar nombre={u.nombre} />
                    <span className="mt-0.5 block text-xs text-tenue">
                      {u.email}
                      {u.email.toLowerCase() === miEmail.toLowerCase() &&
                        " · sos vos"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {esDireccion ? (
                      <select
                        value={u.area ?? ""}
                        disabled={pendiente}
                        onChange={(e) =>
                          startTransition(() => {
                            cambiarAreaUsuario(u.id, e.target.value);
                          })
                        }
                        aria-label={`Área de ${u.nombre}`}
                        className="rounded-md border border-linea bg-panel px-2 py-1 text-xs"
                      >
                        <option value="">Sin asignar</option>
                        {AREAS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-tenue">
                        {u.area ?? "Sin asignar"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {esDireccion ? (
                      <select
                        value={u.rol}
                        disabled={pendiente || esUltimaDireccion}
                        title={
                          esUltimaDireccion
                            ? "Es la única cuenta de Dirección activa"
                            : undefined
                        }
                        onChange={(e) =>
                          startTransition(() => {
                            cambiarRolUsuario(u.id, e.target.value as Rol);
                          })
                        }
                        aria-label={`Rol de ${u.nombre}`}
                        className="rounded-md border border-linea bg-panel px-2 py-1 text-xs disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROL_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-tenue">{ROL_LABELS[u.rol]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        u.activo
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-linea/60 text-tenue"
                      )}
                    >
                      {u.activo ? "Activo" : "Suspendido"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {esDireccion && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={pendiente || esUltimaDireccion}
                          onClick={() =>
                            startTransition(() => {
                              cambiarEstadoUsuario(u.id, !u.activo);
                            })
                          }
                          className="rounded-md border border-linea px-2.5 py-1 text-xs font-medium transition hover:border-oxford/50 disabled:opacity-40"
                        >
                          {u.activo ? "Suspender" : "Reactivar"}
                        </button>
                        <button
                          type="button"
                          disabled={pendiente || esUltimaDireccion}
                          onClick={() =>
                            startTransition(() => {
                              quitarUsuario(u.id);
                            })
                          }
                          aria-label={`Quitar a ${u.nombre}`}
                          className="rounded-md px-2 py-1 text-xs text-tenue transition hover:bg-linea/60 hover:text-foreground disabled:opacity-40"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
