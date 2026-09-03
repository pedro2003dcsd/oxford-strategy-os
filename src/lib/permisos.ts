import { perfilActual } from "@/lib/perfil";

export const MENSAJE_SOLO_LECTURA =
  "Tu cuenta es de solo lectura. Pedile a Dirección que te cambie el rol si necesitás cargar datos.";

/** Motivo por el que no puede escribir, o null si puede.
 *
 * La RLS de 0015 ya bloquea la escritura en la base, que es la capa que no
 * se puede saltear. Este chequeo existe por algo más concreto que dar un
 * mensaje lindo: un UPDATE o un DELETE bloqueados por RLS **no dan error**,
 * afectan cero filas en silencio. Sin este guard la pantalla diría
 * "guardado" sin haber guardado nada. */
export async function vetoDeEscritura(): Promise<string | null> {
  const perfil = await perfilActual();
  if (!perfil) return "No hay sesión.";
  if (perfil.rol === "lectura") return MENSAJE_SOLO_LECTURA;
  return null;
}

/** Para las acciones que no devuelven estado y solo tienen que cortar. */
export async function puedeEscribir(): Promise<boolean> {
  return (await vetoDeEscritura()) === null;
}

export const MENSAJE_SOLO_DIRECCION =
  "Solo Dirección puede borrar objetivos. Pedile a alguien de Dirección que lo haga.";

/** Borrar objetivos y KR queda reservado a Dirección: es destructivo y en
 * cascada se lleva check-ins e iniciativas. El resto del equipo carga y
 * edita, pero no da de baja. */
export async function vetoDeBorrado(): Promise<string | null> {
  const perfil = await perfilActual();
  if (!perfil) return "No hay sesión.";
  if (perfil.rol !== "direccion") return MENSAJE_SOLO_DIRECCION;
  return null;
}
