/** Parseo y formato de números en formato argentino.
 *
 * Los inputs `type="number"` del navegador usan la gramática JS (punto =
 * decimal, sin separador de miles), incompatible con cómo la gente escribe
 * plata acá: "$ 3.060.000.000" (punto = miles) o "55,22" (coma = decimal).
 * Por eso los campos de meta/valor son de texto y se parsean con esto. */

/** Texto en formato AR/libre → número. Devuelve null si está vacío o no es
 * un número.
 *
 *   "$ 3.060.000.000" → 3060000000
 *   "55,22"           → 55.22
 *   "55.22"           → 55.22
 *   "1.000"           → 1000   (punto como separador de miles)
 *   "42"              → 42
 *   ""                → null
 */
export function parsearNumero(raw: string | null | undefined): number | null {
  let s = (raw ?? "").trim().replace(/[$\s%]/g, "");
  if (s === "") return null;

  const negativo = s.startsWith("-");
  if (negativo) s = s.slice(1);

  if (s.includes(",")) {
    // Hay coma: la coma es el decimal y los puntos son miles.
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(".")) {
    // Sólo puntos: son separadores de miles cuando forman grupos de 3
    // dígitos (1.000, 3.060.000.000). Si no, el punto es decimal (55.22).
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

type TipoValor = "porcentaje" | "moneda" | "numerico" | "hitos";

/** Valor guardado → texto para el input de edición, en un formato que la
 * persona reconoce y que parsearNumero puede volver a leer sin ambigüedad. */
export function formatearParaInput(valor: number | null | undefined, tipo: TipoValor): string {
  if (valor == null || Number.isNaN(valor)) return "";
  // Moneda y numérico: miles con punto (formato AR). Porcentaje: número tal
  // cual, sin separador de miles, para no confundir "1.000" con mil.
  if (tipo === "moneda" || tipo === "numerico") {
    return valor.toLocaleString("es-AR");
  }
  return String(valor);
}
