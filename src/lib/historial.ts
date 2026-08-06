import type { HistorialCambio } from "@/lib/types";

/** Un cambio detectado, todavía sin guardar. */
export interface CambioPendiente {
  campo_modificado: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
}

/** Qué campos se auditan y cómo se llaman en pantalla. El historial lo lee
 * el directorio, no la base: "valor_meta" no le dice nada a nadie.
 *
 * Lo que NO está acá no se audita. `valor_actual` queda afuera a propósito:
 * lo mueve cada check-in y ensuciaría el historial de ediciones con ruido
 * semanal. Para eso ya está el timeline de check-ins. */
export const CAMPOS_AUDITADOS: Record<string, string> = {
  titulo: "Título",
  objetivo: "Objetivo",
  area: "Área",
  responsable: "Responsable",
  trimestre: "Trimestre",
  anio: "Año",
  tipo_medicion: "Tipo de medición",
  valor_inicial: "Valor inicial",
  valor_meta: "Meta",
  cliente_asociado: "Cliente asociado",
  cliente_id: "Cliente",
  margen_utilidad_esperado: "Margen esperado",
  link_trabajo: "Link de trabajo",
  okr_anual_id: "OKR anual",
  es_colaborativo: "Colaborativo",
  areas_involucradas: "Áreas involucradas",
};

/** Todo se guarda como texto: la tabla tiene una sola columna por lado y
 * mezclar tipos obligaría a un jsonb que después nadie sabe leer. */
export function normalizar(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "boolean") return valor ? "sí" : "no";
  if (Array.isArray(valor)) {
    const limpio = valor.map((v) => String(v).trim()).filter(Boolean);
    return limpio.length > 0 ? limpio.join(", ") : null;
  }
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

/** Compara dos valores ya normalizados.
 *
 * El caso que importa: la base devuelve `65` y el formulario manda `"65.0"`.
 * Comparados como texto son distintos y el historial se llenaría de
 * ediciones que nadie hizo. */
export function sonEquivalentes(a: string | null, b: string | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;

  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na === nb;

  return a.toLowerCase() === b.toLowerCase();
}

/** Devuelve solo los campos que realmente cambiaron.
 *
 * Recorre `nuevo` y no `anterior`: una edición parcial manda cuatro campos
 * de veinte, y los que no viajan no se tocaron. */
export function diffCampos(
  anterior: Record<string, unknown>,
  nuevo: Record<string, unknown>
): CambioPendiente[] {
  const cambios: CambioPendiente[] = [];

  for (const campo of Object.keys(nuevo)) {
    if (!(campo in CAMPOS_AUDITADOS)) continue;

    const antes = normalizar(anterior[campo]);
    const despues = normalizar(nuevo[campo]);
    if (sonEquivalentes(antes, despues)) continue;

    cambios.push({
      campo_modificado: campo,
      valor_anterior: antes,
      valor_nuevo: despues,
    });
  }

  return cambios;
}

export function etiquetaCampo(campo: string): string {
  return CAMPOS_AUDITADOS[campo] ?? campo;
}

/** "Editado el 6 de agosto por Mariana". Sin hora: el dato útil es cuándo
 * cambió respecto del trimestre, no a qué minuto. */
export function leyendaEdicion(
  cambio: Pick<HistorialCambio, "fecha"> & { autor?: string | null }
): string {
  const fecha = new Date(cambio.fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });
  return cambio.autor
    ? `Editado el ${fecha} por ${cambio.autor}`
    : `Editado el ${fecha}`;
}
