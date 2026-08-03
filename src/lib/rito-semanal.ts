import type { KeyResultCompleto } from "@/lib/types";

/** El rito: los check-ins cierran el viernes a las 18:00, antes de la LOM. */
export const DIA_CIERRE = 5; // viernes
export const HORA_CIERRE = 18;

export function proximoCierre(desde = new Date()): Date {
  const cierre = new Date(desde);
  cierre.setHours(HORA_CIERRE, 0, 0, 0);
  const diasHasta = (DIA_CIERRE - desde.getDay() + 7) % 7;
  if (diasHasta === 0 && desde.getTime() > cierre.getTime()) {
    cierre.setDate(cierre.getDate() + 7);
  } else {
    cierre.setDate(cierre.getDate() + diasHasta);
  }
  return cierre;
}

/** Cuánto falta, en palabras. Devuelve null si ya pasó la hora de hoy. */
export function faltaParaCierre(desde = new Date()): string {
  const ms = proximoCierre(desde).getTime() - desde.getTime();
  const horas = Math.floor(ms / 3600000);
  if (horas < 1) return "cierra en menos de una hora";
  if (horas < 24) return `faltan ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `faltan ${dias} día${dias > 1 ? "s" : ""}`;
}

/** Mensaje para pegar en WhatsApp o Slack. Nombra los KRs concretos: un
 * "cargá el check-in" a secas no dice qué falta. */
export function mensajeRecordatorio(
  responsable: string,
  pendientes: KeyResultCompleto[],
  url = "https://oxford-strategy-os.vercel.app/checkin"
): string {
  const nombre = responsable.split(" ")[0];
  const lista = pendientes.map((kr) => `• ${kr.titulo}`).join("\n");
  return [
    `Hola ${nombre}, te falta el check-in de esta semana en Oxford Strategy OS:`,
    "",
    lista,
    "",
    `Cierra el viernes 18:00, antes de la LOM. Son 2 minutos: ${url}`,
  ].join("\n");
}

export function linkWhatsApp(mensaje: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}
