import type { CheckIn, CompromisoLom, KeyResultCompleto } from "@/lib/types";
import { formatValor, hasAlertaRentabilidad } from "@/lib/kr-logic";

const DIAS_SEMANA = 7;

/** Resumen para pegar en el grupo interno. Slack y WhatsApp comparten la
 * misma sintaxis de negrita (*texto*), así que un solo formato sirve para
 * los dos. Sin tablas ni títulos Markdown: en el chat se ven como basura. */
export function generarResumenChat(
  krs: KeyResultCompleto[],
  checkIns: CheckIn[],
  compromisos: CompromisoLom[]
): string {
  const hoy = new Date();
  const haceUnaSemana = new Date(hoy.getTime() - DIAS_SEMANA * 86400000);

  const porKr = new Map<string, CheckIn[]>();
  for (const c of checkIns) {
    if (!porKr.has(c.kr_id)) porKr.set(c.kr_id, []);
    porKr.get(c.kr_id)!.push(c);
  }

  const rojos = krs.filter((k) => k.estado_semaforo === "rojo");
  const amarillos = krs.filter((k) => k.estado_semaforo === "amarillo");
  const verdes = krs.filter((k) => k.estado_semaforo === "verde");
  const alertas = krs.filter(hasAlertaRentabilidad);
  const sinCheckIn = krs.filter((k) => {
    const h = porKr.get(k.id) ?? [];
    const ultimo = h[h.length - 1];
    return !ultimo || new Date(ultimo.creado_at) < haceUnaSemana;
  });

  const progreso = (kr: KeyResultCompleto) =>
    kr.tipo_medicion === "hitos"
      ? `${kr.hitos_kr.filter((h) => h.cumplido).length}/${kr.hitos_kr.length} hitos`
      : `${formatValor(kr.valor_actual, kr.tipo_medicion)} de ${formatValor(kr.valor_meta, kr.tipo_medicion)}`;

  const l: string[] = [];
  l.push(`*LOM — ${hoy.toLocaleDateString("es-AR")}*`);
  l.push(
    `${krs.length} KRs · 🟢 ${verdes.length} · 🟡 ${amarillos.length} · 🔴 ${rojos.length}`
  );

  const desvios = [...rojos, ...amarillos];
  if (desvios.length > 0) {
    l.push("");
    l.push("*Desvíos*");
    for (const kr of desvios) {
      const emoji = kr.estado_semaforo === "rojo" ? "🔴" : "🟡";
      l.push(
        `${emoji} ${kr.titulo} — ${progreso(kr)} (${kr.okr_trimestral?.area ?? "sin área"}, ${kr.okr_trimestral?.responsable ?? "sin responsable"})`
      );
      const bloqueo = [...(porKr.get(kr.id) ?? [])]
        .reverse()
        .find((c) => c.comentario_bloqueos);
      if (bloqueo) l.push(`   ↳ ${bloqueo.comentario_bloqueos}`);
    }
  }

  if (alertas.length > 0) {
    l.push("");
    l.push("*Alertas de rentabilidad*");
    for (const kr of alertas) {
      l.push(
        `⚠️ ${kr.titulo} — margen ${kr.margen_actual_pct}% (esperado ${kr.margen_utilidad_esperado}%)`
      );
    }
  }

  const abiertos = compromisos.filter((c) => !c.cumplido);
  if (abiertos.length > 0) {
    l.push("");
    l.push("*Compromisos abiertos*");
    for (const c of abiertos) {
      const kr = krs.find((k) => k.id === c.kr_id);
      l.push(`• ${c.descripcion}${kr ? ` (${kr.titulo})` : ""}`);
    }
  }

  if (sinCheckIn.length > 0) {
    l.push("");
    l.push("*Check-ins pendientes*");
    for (const kr of sinCheckIn) {
      l.push(
        `• ${kr.okr_trimestral?.responsable ?? "sin responsable"} — ${kr.titulo}`
      );
    }
  }

  if (desvios.length === 0 && alertas.length === 0) {
    l.push("");
    l.push("✅ Sin desvíos ni alertas de rentabilidad esta semana.");
  }

  return l.join("\n");
}

/** Arma el resumen ejecutivo LOM en Markdown a partir de los datos reales.
 * Regla, no IA: con este volumen de KRs el diagnóstico es determinístico. */
export function generarResumenLom(
  krs: KeyResultCompleto[],
  checkIns: CheckIn[],
  compromisos: CompromisoLom[]
): string {
  const hoy = new Date();
  const haceUnaSemana = new Date(hoy.getTime() - DIAS_SEMANA * 86400000);

  const porKr = new Map<string, CheckIn[]>();
  for (const c of checkIns) {
    if (!porKr.has(c.kr_id)) porKr.set(c.kr_id, []);
    porKr.get(c.kr_id)!.push(c);
  }

  const total = krs.length;
  const verdes = krs.filter((k) => k.estado_semaforo === "verde");
  const amarillos = krs.filter((k) => k.estado_semaforo === "amarillo");
  const rojos = krs.filter((k) => k.estado_semaforo === "rojo");
  const desvios = [...rojos, ...amarillos];
  const alertasRentabilidad = krs.filter(hasAlertaRentabilidad);

  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const checkInsSemana = checkIns.filter(
    (c) => new Date(c.creado_at) >= haceUnaSemana
  );
  const krsSinCheckInSemana = krs.filter((k) => {
    const historial = porKr.get(k.id) ?? [];
    const ultimo = historial[historial.length - 1];
    return !ultimo || new Date(ultimo.creado_at) < haceUnaSemana;
  });

  const lineas: string[] = [];
  lineas.push(`# Resumen LOM — ${hoy.toLocaleDateString("es-AR")}`);
  lineas.push("");

  // 1. Diagnóstico
  lineas.push("## 1. Diagnóstico de salud del trimestre");
  lineas.push("");
  lineas.push(
    `- **${total} Key Results activos**: ${verdes.length} en verde (${pct(verdes.length)}%), ${amarillos.length} en amarillo (${pct(amarillos.length)}%), ${rojos.length} en rojo (${pct(rojos.length)}%).`
  );
  lineas.push(
    `- **Check-ins de la última semana:** ${checkInsSemana.length}. ${
      krsSinCheckInSemana.length > 0
        ? `⚠ ${krsSinCheckInSemana.length} KR(s) sin check-in reciente: ${krsSinCheckInSemana.map((k) => `"${k.titulo}"`).join(", ")}.`
        : "Todos los KRs tienen check-in fresco."
    }`
  );
  if (alertasRentabilidad.length > 0) {
    lineas.push(
      `- **⚠ Alerta de rentabilidad (scope creep):** ${alertasRentabilidad
        .map(
          (k) =>
            `"${k.titulo}" figura cumplido pero con margen real ${k.margen_actual_pct}% < ${k.margen_utilidad_esperado}% esperado`
        )
        .join("; ")}.`
    );
  }
  lineas.push("");

  // 2. Cuellos de botella por área
  lineas.push("## 2. Principales cuellos de botella por área");
  lineas.push("");
  if (desvios.length === 0) {
    lineas.push("Sin desvíos: no hay KRs en amarillo ni rojo. 🎉");
  } else {
    const porArea = new Map<string, KeyResultCompleto[]>();
    for (const kr of desvios) {
      const area = kr.okr_trimestral?.area ?? "Sin área";
      if (!porArea.has(area)) porArea.set(area, []);
      porArea.get(area)!.push(kr);
    }
    for (const [area, items] of porArea) {
      lineas.push(`### ${area}`);
      for (const kr of items) {
        const historial = porKr.get(kr.id) ?? [];
        const ultimoConComentario = [...historial]
          .reverse()
          .find((c) => c.comentario_bloqueos);
        const estado = kr.estado_semaforo === "rojo" ? "🔴" : "🟡";
        const progreso =
          kr.tipo_medicion === "hitos"
            ? `${kr.hitos_kr.filter((h) => h.cumplido).length}/${kr.hitos_kr.length} hitos`
            : `${formatValor(kr.valor_actual, kr.tipo_medicion)} de ${formatValor(kr.valor_meta, kr.tipo_medicion)}`;
        lineas.push(
          `- ${estado} **${kr.titulo}** (${progreso}${kr.okr_trimestral?.responsable ? `, responsable: ${kr.okr_trimestral.responsable}` : ""})`
        );
        if (ultimoConComentario) {
          lineas.push(
            `  - Último bloqueo reportado: "${ultimoConComentario.comentario_bloqueos}" (${ultimoConComentario.usuario})`
          );
        }
        const pendientes = compromisos.filter(
          (c) => c.kr_id === kr.id && !c.cumplido
        );
        if (pendientes.length > 0) {
          lineas.push(
            `  - Compromisos LOM abiertos: ${pendientes.map((c) => c.descripcion).join("; ")}`
          );
        }
      }
      lineas.push("");
    }
  }

  // 3. Agenda sugerida
  lineas.push("## 3. Agenda sugerida para la LOM de esta semana");
  lineas.push("");
  let punto = 1;
  for (const kr of rojos) {
    lineas.push(
      `${punto++}. Destrabar "${kr.titulo}" (${kr.okr_trimestral?.area ?? "sin área"}) — crítico.`
    );
  }
  for (const kr of alertasRentabilidad) {
    lineas.push(
      `${punto++}. Revisar rentabilidad en SOLOP de "${kr.titulo}" — posible scope creep.`
    );
  }
  for (const kr of amarillos) {
    lineas.push(
      `${punto++}. Seguimiento de "${kr.titulo}" (${kr.okr_trimestral?.area ?? "sin área"}) — en riesgo.`
    );
  }
  if (krsSinCheckInSemana.length > 0) {
    lineas.push(
      `${punto++}. Pedir check-in pendiente a: ${[
        ...new Set(
          krsSinCheckInSemana.map(
            (k) => k.okr_trimestral?.responsable ?? "sin responsable"
          )
        ),
      ].join(", ")}.`
    );
  }
  if (punto === 1) {
    lineas.push("1. Sin temas críticos: revisar avance general y celebrar. 🎉");
  }

  return lineas.join("\n");
}
