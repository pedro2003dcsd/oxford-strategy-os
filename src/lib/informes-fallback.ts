import type { DatosInforme } from "@/lib/informes";
import { TIPO_REPORTE_LABELS } from "@/lib/informes";
import { formatValor, hasAlertaRentabilidad, progresoPct } from "@/lib/kr-logic";
import { margenReal, ratioHoras, UMBRAL_SCOPE_CREEP } from "@/lib/solop-logic";
import type { CheckIn } from "@/lib/types";

/** Informe por reglas para retrospectiva trimestral y reporte de área.
 * (El semanal LOM ya lo cubre generarResumenLom). Se usa cuando no hay
 * ANTHROPIC_API_KEY configurada o la llamada a la IA falla. */
export function generarInformeFallback(d: DatosInforme): string {
  const porKr = new Map<string, CheckIn[]>();
  for (const c of d.checkIns) {
    if (!porKr.has(c.kr_id)) porKr.set(c.kr_id, []);
    porKr.get(c.kr_id)!.push(c);
  }

  const total = d.krs.length;
  const verdes = d.krs.filter((k) => k.estado_semaforo === "verde");
  const amarillos = d.krs.filter((k) => k.estado_semaforo === "amarillo");
  const rojos = d.krs.filter((k) => k.estado_semaforo === "rojo");
  const alertas = d.krs.filter(hasAlertaRentabilidad);
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const l: string[] = [];
  const titulo = TIPO_REPORTE_LABELS[d.tipoReporte];
  l.push(
    `# ${titulo}${d.area ? ` — ${d.area}` : ""} · ${d.trimestre} ${d.anio}`
  );
  l.push("");
  l.push(
    `_Generado automáticamente desde los datos de Oxford Strategy OS el ${new Date().toLocaleDateString("es-AR")}._`
  );
  l.push("");

  // 1
  l.push(
    d.tipoReporte === "retrospectiva_trimestral"
      ? "## 1. Resultado del trimestre"
      : "## 1. Estado del área"
  );
  l.push("");
  if (total === 0) {
    l.push("No hay Key Results cargados para este filtro.");
  } else {
    l.push(
      `- **${total} Key Results**: ${verdes.length} en verde (${pct(verdes.length)}%), ${amarillos.length} en amarillo (${pct(amarillos.length)}%), ${rojos.length} en rojo (${pct(rojos.length)}%).`
    );
    for (const kr of d.krs) {
      const detalle =
        kr.tipo_medicion === "hitos"
          ? `${kr.hitos_kr.filter((h) => h.cumplido).length} de ${kr.hitos_kr.length} hitos`
          : `${formatValor(kr.valor_actual, kr.tipo_medicion)} sobre una meta de ${formatValor(kr.valor_meta, kr.tipo_medicion)} (${progresoPct(kr)}% del recorrido)`;
      l.push(
        `- **${kr.titulo}** (${kr.okr_trimestral?.area ?? "sin área"}, ${kr.okr_trimestral?.responsable ?? "sin responsable"}): ${detalle}.`
      );
    }
  }
  l.push("");

  // 2
  l.push(
    d.tipoReporte === "retrospectiva_trimestral"
      ? "## 2. Qué funcionó y qué no"
      : "## 2. Bloqueos y necesidades"
  );
  l.push("");
  if (verdes.length > 0) {
    l.push(
      `**Avanzó bien:** ${verdes.map((k) => `"${k.titulo}"`).join(", ")}.`
    );
    l.push("");
  }
  const trabados = [...rojos, ...amarillos];
  if (trabados.length === 0) {
    l.push("Sin desvíos registrados en este período.");
  } else {
    for (const kr of trabados) {
      const historial = porKr.get(kr.id) ?? [];
      const ultimo = [...historial].reverse().find((c) => c.comentario_bloqueos);
      const emoji = kr.estado_semaforo === "rojo" ? "🔴" : "🟡";
      l.push(`- ${emoji} **${kr.titulo}**`);
      if (ultimo) {
        l.push(
          `  - Bloqueo reportado por ${ultimo.usuario}: "${ultimo.comentario_bloqueos}"`
        );
      } else {
        l.push(`  - Sin bloqueo reportado en los check-ins.`);
      }
      if (historial.length >= 2) {
        const ultimoValor = historial[historial.length - 1].valor_registrado;
        const anterior = historial[historial.length - 2].valor_registrado;
        if (ultimoValor <= anterior) {
          l.push(
            `  - ⚠ La tendencia se frenó: pasó de ${formatValor(anterior, kr.tipo_medicion)} a ${formatValor(ultimoValor, kr.tipo_medicion)}.`
          );
        }
      }
      const comps = d.compromisos.filter((c) => c.kr_id === kr.id && !c.cumplido);
      if (comps.length > 0) {
        l.push(
          `  - Compromisos LOM abiertos: ${comps.map((c) => c.descripcion).join("; ")}`
        );
      }
    }
  }
  l.push("");

  if (alertas.length > 0 || d.proyectos.length > 0) {
    l.push("### Rentabilidad");
    l.push("");
    for (const kr of alertas) {
      l.push(
        `- ⚠ **${kr.titulo}** figura cumplido pero el margen real (${kr.margen_actual_pct}%) está por debajo del esperado (${kr.margen_utilidad_esperado}%) — revisar scope en SOLOP.`
      );
    }
    for (const p of d.proyectos) {
      const m = margenReal(p);
      const r = ratioHoras(p);
      if (r !== null && r >= UMBRAL_SCOPE_CREEP) {
        l.push(
          `- ⚠ **${p.cliente}** consumió ${Math.round(r * 100)}% de las horas presupuestadas${m !== null ? ` con margen real de ${m}%` : ""} — riesgo de scope creep.`
        );
      }
    }
    l.push("");
  }

  // 3
  l.push(
    d.tipoReporte === "retrospectiva_trimestral"
      ? "## 3. Aprendizajes y ajustes para el próximo trimestre"
      : "## 3. Foco recomendado"
  );
  l.push("");
  let n = 1;
  for (const kr of rojos) {
    l.push(`${n++}. Destrabar "${kr.titulo}" — está en rojo y necesita decisión de dirección.`);
  }
  for (const kr of alertas) {
    l.push(`${n++}. Revisar la rentabilidad de "${kr.titulo}" en SOLOP antes de darlo por cerrado.`);
  }
  for (const kr of amarillos) {
    l.push(`${n++}. Sostener el seguimiento de "${kr.titulo}" para que no pase a rojo.`);
  }
  if (n === 1) {
    l.push("1. Sin temas críticos: mantener el ritmo actual de check-ins.");
  }

  return l.join("\n");
}
