import type { CheckIn, CompromisoLom, KeyResultCompleto } from "@/lib/types";
import { AREAS } from "@/lib/types";

/** Una semana de margen: los compromisos de la LOM pasada son los que se
 * anotaron antes del último corte semanal. */
const DIAS_SEMANA = 7;

export interface DependenciaCruzada {
  area: string;
  detalle: string;
}

/** Verbos que delatan una espera real, no una simple mención de otra área. */
const ESPERA =
  /demorad|trabad|bloquea|frena|esperand|a la espera|depende de|atrasad|pendiente de|no entreg|sin respuesta/;

/** Detecta si un KR está frenado por otra área. Dos señales, en orden de
 * confianza: una iniciativa bloqueada a cargo de alguien de otro POD, o el
 * comentario del último check-in nombrando a otra área. */
export function dependenciaCruzada(
  kr: KeyResultCompleto,
  ultimoBloqueo: CheckIn | null,
  areaPorResponsable: Map<string, string>
): DependenciaCruzada | null {
  const areaPropia = kr.okr_trimestral?.area;

  const bloqueada = (kr.iniciativas ?? []).find(
    (i) =>
      i.estado === "bloqueado" &&
      i.responsable &&
      areaPorResponsable.get(i.responsable) &&
      areaPorResponsable.get(i.responsable) !== areaPropia
  );
  if (bloqueada?.responsable) {
    return {
      area: areaPorResponsable.get(bloqueada.responsable)!,
      detalle: `${bloqueada.responsable}: ${bloqueada.titulo}`,
    };
  }

  // Fallback por texto. Nombrar a otra área no alcanza: "falta capacitar al
  // POD de Arte" menciona a Arte sin depender de Arte. Se exige que el KR no
  // esté en verde y que el comentario hable de una espera real.
  const comentario = ultimoBloqueo?.comentario_bloqueos?.toLowerCase();
  if (comentario && kr.estado_semaforo !== "verde" && ESPERA.test(comentario)) {
    for (const area of AREAS) {
      if (area === areaPropia) continue;
      // "Arte / Diseño" se nombra en la práctica como "Arte" a secas.
      const alias = area.split("/")[0].trim().toLowerCase();
      if (alias.length > 3 && comentario.includes(alias)) {
        return { area, detalle: "Mencionado en el último check-in" };
      }
    }
  }

  return null;
}

/** Mapa responsable -> área, armado de los OKRs trimestrales cargados. */
export function areaPorResponsable(
  krs: KeyResultCompleto[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const kr of krs) {
    const r = kr.okr_trimestral?.responsable;
    const a = kr.okr_trimestral?.area;
    if (r && a) map.set(r, a);
  }
  return map;
}

/** Compromisos anotados antes de la semana en curso: son los que la reunión
 * de hoy tiene que revisar. */
export function compromisosDeLaLomPasada(
  compromisos: CompromisoLom[],
  desde = new Date()
): CompromisoLom[] {
  const corte = desde.getTime() - DIAS_SEMANA * 86400000;
  return compromisos
    .filter((c) => new Date(c.creado_at).getTime() < corte)
    .sort((a, b) => {
      if (a.cumplido !== b.cumplido) return a.cumplido ? 1 : -1;
      return a.creado_at.localeCompare(b.creado_at);
    });
}

export function compromisoVencido(c: CompromisoLom): boolean {
  if (!c.fecha_limite || c.cumplido) return false;
  return new Date(c.fecha_limite) < new Date(new Date().toDateString());
}
