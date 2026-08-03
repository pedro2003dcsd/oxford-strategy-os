"use client";

import { useActionState, useTransition } from "react";
import clsx from "clsx";
import {
  agregarUsuario,
  cambiarEstadoUsuario,
  cambiarResponsableUsuario,
  cambiarRolUsuario,
  quitarUsuario,
  type EquipoState,
} from "@/app/(protected)/equipo/actions";
import { Avatar } from "@/components/Avatar";
import { ROLES, ROL_LABELS, type Rol, type UsuarioAutorizado } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-linea bg-transparent px-2 py-1.5 text-sm";

export function EquipoClient({
  usuarios,
  responsables,
  esDireccion,
  miEmail,
}: {
  usuarios: UsuarioAutorizado[];
  responsables: string[];
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
          className="grid gap-3 rounded-lg border border-linea p-4 sm:grid-cols-5"
        >
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-tenue">
              Email de Google
            </label>
            <input name="email" type="email" required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-tenue">Nombre</label>
            <input name="nombre" required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-tenue">
              Responsable de OKRs
            </label>
            <select name="responsable" defaultValue="" className={inputClass}>
              <option value="">Sin asignar</option>
              {responsables.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-tenue">Rol</label>
            <div className="flex gap-2">
              <select name="rol" defaultValue="lider" className={inputClass}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROL_LABELS[r]}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={agregando}
                className="shrink-0 rounded-md bg-oxford px-3 py-1.5 text-sm font-medium text-white transition hover:bg-oxford-fuerte disabled:opacity-50"
              >
                {agregando ? "…" : "Agregar"}
              </button>
            </div>
          </div>
          {state?.error && (
            <p className="text-sm text-red-700 sm:col-span-5 dark:text-red-400">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="text-sm text-emerald-700 sm:col-span-5 dark:text-emerald-400">
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
              <th className="px-4 py-3">Responsable de OKRs</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const esUltimaDireccion =
                u.rol === "direccion" && u.activo && direccionActiva <= 1;
              return (
                <tr key={u.id} className="border-b border-linea last:border-0">
                  <td className="px-4 py-3">
                    <Avatar nombre={u.nombre} />
                    <span className="mt-0.5 block text-xs text-tenue">
                      {u.email}
                      {u.email.toLowerCase() === miEmail.toLowerCase() && " · sos vos"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {esDireccion ? (
                      <select
                        value={u.responsable ?? ""}
                        disabled={pendiente}
                        onChange={(e) =>
                          startTransition(() => {
                            cambiarResponsableUsuario(u.id, e.target.value);
                          })
                        }
                        aria-label={`Responsable de ${u.nombre}`}
                        className="rounded-md border border-linea bg-transparent px-2 py-1 text-xs"
                      >
                        <option value="">Sin asignar</option>
                        {responsables.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-tenue">
                        {u.responsable ?? "Sin asignar"}
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
                        className="rounded-md border border-linea bg-transparent px-2 py-1 text-xs disabled:opacity-50"
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
