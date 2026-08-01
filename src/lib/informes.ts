import type {
  CheckIn,
  CompromisoLom,
  KeyResultCompleto,
  ProyectoSolop,
} from "@/lib/types";
import { formatValor, hasAlertaRentabilidad } from "@/lib/kr-logic";
import { margenReal, ratioHoras, UMBRAL_SCOPE_CREEP } from "@/lib/solop-logic";

export const TIPOS_REPORTE = [
  "semanal_lom",
  "retrospectiva_trimestral",
  "area",
] as const;
export type TipoReporte = (typeof TIPOS_REPORTE)[number];

export const TIPO_REPORTE_LABELS: Record<TipoReporte, string> = {
  semanal_lom: "LOM Semanal",
  retrospectiva_trimestral: "Retrospectiva Trimestral",
  area: "Reporte de Área",
};

export interface DatosInforme {
  krs: KeyResultCompleto[];
  checkIns: CheckIn[];
  compromisos: CompromisoLom[];
  proyectos: ProyectoSolop[];
  tipoReporte: TipoReporte;
  area?: string;
  trimestre: string;
  anio: number;
}

/** Resumen compacto de los datos, en texto plano. Se usa como contexto para
 * Claude y también como base del informe de respaldo por reglas. */
export function resumirDatos(d: DatosInforme): string {
  const porKr = new Map<string, CheckIn[]>();
  for (const c of d.checkIns) {
    if (!porKr.has(c.kr_id)) porKr.set(c.kr_id, []);
    porKr.get(c.kr_id)!.push(c);
  }

  const lineas: string[] = [];
  lineas.push(`Trimestre: ${d.trimestre} ${d.anio}`);
  if (d.area) lineas.push(`Área: ${d.area}`);
  lineas.push("");

  lineas.push("## Key Results");
  if (d.krs.length === 0) {
    lineas.push("(ninguno cargado para este filtro)");
  }
  for (const kr of d.krs) {
    const historial = porKr.get(kr.id) ?? [];
    const progreso =
      kr.tipo_medicion === "hitos"
        ? `${kr.hitos_kr.filter((h) => h.cumplido).length}/${kr.hitos_kr.length} hitos`
        : `${formatValor(kr.valor_actual, kr.tipo_medicion)} de meta ${formatValor(kr.valor_meta, kr.tipo_medicion)} (arrancó en ${formatValor(kr.valor_inicial, kr.tipo_medicion)})`;

    lineas.push(
      `- [${kr.estado_semaforo.toUpperCase()}] "${kr.titulo}" · área ${kr.okr_trimestral?.area ?? "sin área"} · responsable ${kr.okr_trimestral?.responsable ?? "sin asignar"} · ${progreso}`
    );
    if (kr.okr_trimestral?.okr_anual) {
      lineas.push(
        `  - Alineado a OKR anual "${kr.okr_trimestral.okr_anual.titulo}" (pilar: ${kr.okr_trimestral.okr_anual.pilares?.nombre ?? "sin pilar"})`
      );
    }
    if (kr.cliente_asociado) lineas.push(`  - Cliente: ${kr.cliente_asociado}`);
    if (hasAlertaRentabilidad(kr)) {
      lineas.push(
        `  - ALERTA RENTABILIDAD: figura cumplido pero margen real ${kr.margen_actual_pct}% < ${kr.margen_utilidad_esperado}% esperado`
      );
    }
    if (historial.length > 0) {
      const trayectoria = historial
        .map((c) => formatValor(c.valor_registrado, kr.tipo_medicion))
        .join(" → ");
      lineas.push(`  - Trayectoria de check-ins: ${trayectoria}`);
      const conComentario = [...historial]
        .reverse()
        .find((c) => c.comentario_bloqueos);
      if (conComentario) {
        lineas.push(
          `  - Último bloqueo reportado (${conComentario.usuario}, ${new Date(conComentario.creado_at).toLocaleDateString("es-AR")}): "${conComentario.comentario_bloqueos}"`
        );
      }
    } else {
      lineas.push(`  - Sin check-ins registrados`);
    }
    const comps = d.compromisos.filter((c) => c.kr_id === kr.id);
    for (const c of comps) {
      lineas.push(
        `  - Compromiso LOM ${c.cumplido ? "(cumplido)" : "(pendiente)"}: ${c.descripcion}`
      );
    }
  }

  if (d.proyectos.length > 0) {
    lineas.push("");
    lineas.push("## Rentabilidad por proyecto (SOLOP)");
    for (const p of d.proyectos) {
      const margen = margenReal(p);
      const ratio = ratioHoras(p);
      const partes = [
        `- ${p.cliente} (${p.tipo_contrato === "AdHoc" ? "Ad-Hoc" : "Fee"})`,
        margen !== null ? `margen real ${margen}%` : "sin margen calculable",
      ];
      if (ratio !== null) {
        partes.push(
          `horas ${p.horas_consumidas}/${p.horas_presupuestadas} (${Math.round(ratio * 100)}%)${ratio >= UMBRAL_SCOPE_CREEP ? " — RIESGO DE SCOPE CREEP" : ""}`
        );
      }
      lineas.push(partes.join(" · "));
    }
  }

  return lineas.join("\n");
}

const INSTRUCCIONES: Record<TipoReporte, string> = {
  semanal_lom: `Escribí el informe para la reunión LOM de esta semana, con estas secciones en Markdown:
1. **Diagnóstico de salud general del trimestre** — estado del semáforo, qué se movió y qué no, y una lectura de tendencia (no solo la foto).
2. **Principales cuellos de botella por área** — agrupá por área, citá los bloqueos reales que reportaron los responsables, y marcá las alertas de rentabilidad.
3. **Agenda sugerida para la reunión LOM** — lista numerada y priorizada de temas a tratar, con quién debería llevar cada uno.`,
  retrospectiva_trimestral: `Escribí una retrospectiva del trimestre completo, con estas secciones en Markdown:
1. **Resultado del trimestre** — qué se logró contra lo comprometido, con números concretos.
2. **Qué funcionó y qué no** — patrones, no anécdotas: dónde el equipo ejecutó bien y dónde se trabó sistemáticamente.
3. **Aprendizajes y ajustes para el próximo trimestre** — recomendaciones accionables para la dirección.`,
  area: `Escribí un reporte enfocado en el área indicada, con estas secciones en Markdown:
1. **Estado del área** — avance de sus KRs y semáforo.
2. **Bloqueos y necesidades** — qué está frenando al área y qué necesita de otras áreas o de la dirección.
3. **Foco recomendado** — en qué debería concentrarse el área las próximas semanas.`,
};

export function systemPrompt(tipo: TipoReporte): string {
  return `Sos un consultor ejecutivo senior que asesora a la dirección de Grupo Oxford, una agencia de comunicación y marketing.

Contexto estratégico de Grupo Oxford:
- Estrella Polar 2026: 20 clientes integrales activos con Utilidad Bruta/Venta mayor a 65%.
- Pilares anuales: Rentabilidad Interna, Experiencia del Cliente, y Rediseñar la Organización.
- Áreas/PODs: Comercial/Clientes (Cristóbal), Digital (Ayelén), Arte/Diseño (Matías), Consultoría (Sebastián), Planificación y Operaciones (Laura), Administración y Finanzas (Dolores), Equipo Consciente/Cultura (Mariana), Dirección General (Mateo).
- SOLOP es el sistema donde viven las horas, la facturación y los costos por proyecto: es la fuente de verdad de la rentabilidad operativa.
- La LOM es la reunión semanal de liderazgo donde el directorio revisa desvíos.

Cómo escribís:
- En español rioplatense, profesional pero directo. Nada de lenguaje corporativo vacío.
- Basate ÚNICAMENTE en los datos que te paso. No inventes números, nombres ni hechos. Si un dato falta, decilo explícitamente.
- Citá los bloqueos textuales que reportaron los responsables cuando aporten.
- Priorizá: lo que está en rojo y las alertas de rentabilidad van primero.
- Sé conciso. La dirección tiene poco tiempo; que cada párrafo justifique su lugar.
- Devolvé únicamente el informe en Markdown, sin preámbulo ni comentarios sobre tu proceso.

${INSTRUCCIONES[tipo]}`;
}

export function userPrompt(d: DatosInforme): string {
  const hoy = new Date().toLocaleDateString("es-AR");
  return `Fecha de hoy: ${hoy}

Datos actuales de Oxford Strategy OS:

${resumirDatos(d)}`;
}
