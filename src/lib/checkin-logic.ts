import type { CheckIn, KeyResult, UsuarioAutorizado } from "@/lib/types";

/** El check-in más reciente de un KR: por fecha y, a igual fecha, por id.
 * Es el mismo criterio que usa la base en check_in_corregible (0019). */
export function ultimoCheckIn(checkIns: CheckIn[]): CheckIn | null {
  let ultimo: CheckIn | null = null;
  for (const c of checkIns) {
    if (!ultimo || esPosterior(c, ultimo)) ultimo = c;
  }
  return ultimo;
}

function esPosterior(a: CheckIn, b: CheckIn): boolean {
  const ta = Date.parse(a.creado_at);
  const tb = Date.parse(b.creado_at);
  if (ta !== tb) return ta > tb;
  // Date solo llega al milisegundo y la base guarda microsegundos: a igual
  // milisegundo se compara el texto, que viene en el mismo formato.
  if (a.creado_at !== b.creado_at) return a.creado_at > b.creado_at;
  return a.id > b.id;
}

export const MENSAJE_VALOR_INVALIDO = "Ingresá un valor numérico válido.";
export const MENSAJE_SEMAFORO_INVALIDO = "Elegí un semáforo.";
export const MENSAJE_FALTA_EXPLICACION =
  "En amarillo o rojo, contá qué bloqueos o necesidades hay antes de guardar.";

/** El avance tal como llega de un formulario, convertido a número finito.
 * Null si está vacío o no es un número de verdad: Number() acepta
 * "Infinity" y "1e999", y eso terminaría como avance del KR. */
export function avanceValido(raw: unknown): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const valor = Number(raw);
  return Number.isFinite(valor) ? valor : null;
}

/** Por qué no se puede guardar la corrección de un check-in, o null si está
 * bien. Lo usan el formulario, para avisar antes de enviar, y la acción del
 * servidor. La base vuelve a validar lo mismo en editar_check_in (0019).
 *
 * `comentario` es la explicación con la que quedaría el check-in: la nueva
 * si se escribió una o, si el campo quedó vacío, la que ya tenía (editar
 * nunca borra un comentario). Null significa "no se sabe": lo decide la
 * base, que es la que conoce el comentario existente. */
export function motivoCorreccionInvalida(c: {
  valor: unknown;
  estado: string;
  comentario: string | null;
}): string | null {
  if (avanceValido(c.valor) === null) return MENSAJE_VALOR_INVALIDO;
  if (!["verde", "amarillo", "rojo"].includes(c.estado)) {
    return MENSAJE_SEMAFORO_INVALIDO;
  }
  if (
    (c.estado === "amarillo" || c.estado === "rojo") &&
    c.comentario !== null &&
    c.comentario.trim() === ""
  ) {
    return MENSAJE_FALTA_EXPLICACION;
  }
  return null;
}

/** El check-in que esta persona puede editar o borrar, o null.
 *
 * Solo el más reciente del KR, solo quien lo cargó y solo si todavía puede
 * escribir. Los KR de hitos quedan afuera: el check-in tilda los hitos en la
 * lista y eso no se deshace.
 *
 * Esto decide únicamente si se muestran los botones. La regla la hace
 * cumplir la base al guardar o borrar, porque entre que se pinta la pantalla
 * y se aprieta el botón otra persona puede haber cargado un check-in. */
export function checkInCorregible(
  kr: Pick<KeyResult, "tipo_medicion">,
  checkIns: CheckIn[],
  perfil: Pick<UsuarioAutorizado, "id" | "rol"> | null
): CheckIn | null {
  if (!perfil || perfil.rol === "lectura") return null;
  if (kr.tipo_medicion === "hitos") return null;
  const ultimo = ultimoCheckIn(checkIns);
  if (!ultimo || !ultimo.autor_id) return null;
  return ultimo.autor_id === perfil.id ? ultimo : null;
}
