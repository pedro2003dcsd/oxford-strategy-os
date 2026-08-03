/** Iniciales para el avatar: primera letra del nombre y del apellido.
 * "Ayelén Bruno" -> "AB"; "Mateo" -> "MA". */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/** Paleta fija para los avatares. Se elige por hash del nombre para que cada
 * persona tenga siempre el mismo color en todas las pantallas. */
const TONOS = [
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
];

export function tonoDePersona(nombre: string): string {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  }
  return TONOS[hash % TONOS.length];
}

/** Lista ordenada y sin repetidos de responsables, para los filtros. */
export function responsablesDe(
  items: { okr_trimestral?: { responsable?: string | null } | null }[]
): string[] {
  const set = new Set<string>();
  for (const i of items) {
    const r = i.okr_trimestral?.responsable;
    if (r) set.add(r);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}
