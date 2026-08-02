import type {
  CheckIn,
  CompromisoLom,
  KeyResultCompleto,
  ProyectoSolop,
  Semaforo,
} from "@/lib/types";
import { formatValor, hasAlertaRentabilidad, progresoPct } from "@/lib/kr-logic";
import {
  margenReal,
  ratioHoras,
  META_MARGEN,
  UMBRAL_SCOPE_CREEP,
} from "@/lib/solop-logic";

const DIAS_SEMANA = 7;

export interface ScoutMessage {
  role: "user" | "assistant";
  content: string;
}

/** Índice compacto de KRs que viaja al cliente para que el visor pueda
 * enlazar los KRs que menciona la respuesta. No lleva datos sensibles. */
export interface ReferenciaKr {
  id: string;
  titulo: string;
  semaforo: Semaforo;
  area: string;
  responsable: string;
}

export interface DatosScout {
  krs: KeyResultCompleto[];
  checkIns: CheckIn[];
  compromisos: CompromisoLom[];
  proyectos: ProyectoSolop[];
  trimestre: string;
  anio: number;
}

export const PROMPTS_RAPIDOS = [
  { emoji: "🔴", texto: "KRs críticos en Rojo" },
  { emoji: "📋", texto: "Check-ins pendientes de la semana" },
  { emoji: "💰", texto: "Alertas de rentabilidad (<65%)" },
  { emoji: "📈", texto: "Resumen rápido de la LOM" },
] as const;

export function referenciasKr(krs: KeyResultCompleto[]): ReferenciaKr[] {
  return krs.map((kr) => ({
    id: kr.id,
    titulo: kr.titulo,
    semaforo: kr.estado_semaforo,
    area: kr.okr_trimestral?.area ?? "Sin área",
    responsable: kr.okr_trimestral?.responsable ?? "Sin asignar",
  }));
}

/** KRs cuyo último check-in tiene más de una semana (o que nunca tuvieron uno). */
export function krsSinCheckInSemana(
  krs: KeyResultCompleto[],
  checkIns: CheckIn[]
): KeyResultCompleto[] {
  const corte = Date.now() - DIAS_SEMANA * 86400000;
  const ultimoPorKr = new Map<string, number>();
  for (const c of checkIns) {
    const t = new Date(c.creado_at).getTime();
    if (t > (ultimoPorKr.get(c.kr_id) ?? 0)) ultimoPorKr.set(c.kr_id, t);
  }
  return krs.filter((kr) => (ultimoPorKr.get(kr.id) ?? 0) < corte);
}

/** Proyectos SOLOP con margen real por debajo de la meta de la Estrella Polar. */
export function proyectosBajoMargen(proyectos: ProyectoSolop[]): ProyectoSolop[] {
  return proyectos.filter((p) => {
    const m = margenReal(p);
    return m !== null && m < META_MARGEN;
  });
}

function progresoTexto(kr: KeyResultCompleto): string {
  if (kr.tipo_medicion === "hitos") {
    return `${kr.hitos_kr.filter((h) => h.cumplido).length}/${kr.hitos_kr.length} hitos`;
  }
  return `${formatValor(kr.valor_actual, kr.tipo_medicion)} de ${formatValor(kr.valor_meta, kr.tipo_medicion)} (${progresoPct(kr)}%)`;
}

/** Foto del estado de la base en texto plano. Es el contexto que recibe Claude
 * en el system prompt: sin esto la respuesta sería genérica. */
export function contextoScout(d: DatosScout): string {
  const porKr = new Map<string, CheckIn[]>();
  for (const c of d.checkIns) {
    if (!porKr.has(c.kr_id)) porKr.set(c.kr_id, []);
    porKr.get(c.kr_id)!.push(c);
  }

  const rojos = d.krs.filter((k) => k.estado_semaforo === "rojo");
  const amarillos = d.krs.filter((k) => k.estado_semaforo === "amarillo");
  const verdes = d.krs.filter((k) => k.estado_semaforo === "verde");
  const pendientes = krsSinCheckInSemana(d.krs, d.checkIns);
  const alertasKr = d.krs.filter(hasAlertaRentabilidad);

  const l: string[] = [];
  l.push(`Trimestre en curso: ${d.trimestre} ${d.anio}`);
  l.push(
    `Semáforo general: ${d.krs.length} KRs activos — ${verdes.length} verde, ${amarillos.length} amarillo, ${rojos.length} rojo.`
  );
  l.push("");

  l.push("## Key Results");
  if (d.krs.length === 0) l.push("(no hay KRs cargados para este trimestre)");
  for (const kr of d.krs) {
    l.push(
      `- [${kr.estado_semaforo.toUpperCase()}] "${kr.titulo}" · área ${kr.okr_trimestral?.area ?? "sin área"} · responsable ${kr.okr_trimestral?.responsable ?? "sin asignar"} · ${progresoTexto(kr)} · id ${kr.id}`
    );
    if (kr.okr_trimestral?.okr_anual) {
      l.push(
        `  - Alineado a "${kr.okr_trimestral.okr_anual.titulo}" (pilar: ${kr.okr_trimestral.okr_anual.pilares?.nombre ?? "sin pilar"})`
      );
    }
    if (kr.cliente_asociado) l.push(`  - Cliente: ${kr.cliente_asociado}`);
    if (hasAlertaRentabilidad(kr)) {
      l.push(
        `  - ALERTA RENTABILIDAD: figura cumplido con margen real ${kr.margen_actual_pct}% < ${kr.margen_utilidad_esperado}% esperado`
      );
    }
    const historial = porKr.get(kr.id) ?? [];
    if (historial.length === 0) {
      l.push("  - Sin check-ins registrados");
    } else {
      const ultimo = historial[historial.length - 1];
      l.push(
        `  - Último check-in: ${new Date(ultimo.creado_at).toLocaleDateString("es-AR")} por ${ultimo.usuario}`
      );
      const conComentario = [...historial]
        .reverse()
        .find((c) => c.comentario_bloqueos);
      if (conComentario) {
        l.push(
          `  - Último bloqueo reportado (${conComentario.usuario}): "${conComentario.comentario_bloqueos}"`
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

  l.push("");
  l.push("## Check-ins pendientes de esta semana");
  if (pendientes.length === 0) {
    l.push("Ninguno: todos los KRs tienen check-in de los últimos 7 días.");
  } else {
    for (const kr of pendientes) {
      l.push(
        `- "${kr.titulo}" — responsable ${kr.okr_trimestral?.responsable ?? "sin asignar"} (${kr.okr_trimestral?.area ?? "sin área"})`
      );
    }
  }

  l.push("");
  l.push(`## Rentabilidad (SOLOP) — meta de margen ${META_MARGEN}%`);
  if (d.proyectos.length === 0) {
    l.push("(no hay proyectos cargados en la Torre de Control)");
  }
  for (const p of d.proyectos) {
    const m = margenReal(p);
    const r = ratioHoras(p);
    const partes = [
      `- ${p.cliente} (${p.tipo_contrato === "AdHoc" ? "Ad-Hoc" : "Fee"})`,
      m !== null ? `margen real ${m}%` : "sin margen calculable",
    ];
    if (r !== null) {
      partes.push(
        `horas ${p.horas_consumidas}/${p.horas_presupuestadas} (${Math.round(r * 100)}%)${r >= UMBRAL_SCOPE_CREEP ? " — RIESGO DE SCOPE CREEP" : ""}`
      );
    }
    if (m !== null && m < META_MARGEN) partes.push("POR DEBAJO DE LA META");
    l.push(partes.join(" · "));
  }
  if (alertasKr.length > 0) {
    l.push(
      `KRs cumplidos con margen por debajo del esperado: ${alertasKr.map((k) => `"${k.titulo}"`).join(", ")}.`
    );
  }

  return l.join("\n");
}

export function systemPromptScout(d: DatosScout): string {
  const hoy = new Date().toLocaleDateString("es-AR");
  return `Sos Scout AI, el asistente interno de Grupo Oxford dentro de Oxford Strategy OS. Respondés preguntas de la dirección y de los responsables de área sobre el estado real de los OKRs, los check-ins y la rentabilidad.

Contexto de Grupo Oxford:
- Estrella Polar 2026: 20 clientes integrales activos con Utilidad Bruta/Venta mayor a ${META_MARGEN}%.
- Pilares anuales: Rentabilidad Interna, Experiencia del Cliente y Rediseñar la Organización.
- Áreas/PODs: Comercial/Clientes (Cristóbal), Digital (Ayelén), Arte/Diseño (Matías), Consultoría (Sebastián), Planificación y Operaciones (Laura), Administración y Finanzas (Dolores), Equipo Consciente/Cultura (Mariana), Dirección General (Mateo).
- SOLOP es la fuente de verdad de horas, facturación y costos por proyecto.
- La LOM es la reunión semanal de liderazgo donde el directorio revisa desvíos.

Cómo respondés:
- En español rioplatense, profesional pero directo. Nada de lenguaje corporativo vacío.
- Basate ÚNICAMENTE en los datos que están más abajo. No inventes números, nombres, clientes ni hechos. Si el dato no está, decilo.
- Escribí los títulos de los Key Results entre comillas dobles y exactamente como figuran, para que la app pueda enlazarlos.
- Priorizá lo que está en rojo y las alertas de rentabilidad.
- Sé breve: es un chat, no un informe. Respuestas de pocos párrafos o viñetas. Si te piden un informe largo, sugerí el módulo de Informes.
- Podés usar Markdown simple: viñetas, negritas y títulos con ##.
- Si la pregunta no tiene que ver con Oxford Strategy OS, decilo en una línea y volvé al tema.

Fecha de hoy: ${hoy}

=== ESTADO ACTUAL DE LA BASE DE DATOS ===
${contextoScout(d)}`;
}

/** Respuesta por reglas cuando no hay ANTHROPIC_API_KEY o la IA falla.
 * Cubre los prompts rápidos, que son el 80% de las consultas reales. */
export function respuestaFallback(pregunta: string, d: DatosScout): string {
  const q = pregunta.toLowerCase();
  const rojos = d.krs.filter((k) => k.estado_semaforo === "rojo");
  const amarillos = d.krs.filter((k) => k.estado_semaforo === "amarillo");

  const porKr = new Map<string, CheckIn[]>();
  for (const c of d.checkIns) {
    if (!porKr.has(c.kr_id)) porKr.set(c.kr_id, []);
    porKr.get(c.kr_id)!.push(c);
  }

  if (/rojo|crític|critic/.test(q)) {
    if (rojos.length === 0) {
      return "## KRs en rojo\n\nNinguno. Todos los Key Results del trimestre están en verde o amarillo. 🎉";
    }
    const l = [`## ${rojos.length} KR(s) en rojo`, ""];
    for (const kr of rojos) {
      l.push(
        `- **"${kr.titulo}"** (${kr.okr_trimestral?.area ?? "sin área"}, ${kr.okr_trimestral?.responsable ?? "sin responsable"}) — ${progresoTexto(kr)}`
      );
      const bloqueo = [...(porKr.get(kr.id) ?? [])]
        .reverse()
        .find((c) => c.comentario_bloqueos);
      if (bloqueo) l.push(`  - Bloqueo: "${bloqueo.comentario_bloqueos}"`);
    }
    return l.join("\n");
  }

  if (/check-?in|pendient/.test(q)) {
    const pendientes = krsSinCheckInSemana(d.krs, d.checkIns);
    if (pendientes.length === 0) {
      return "## Check-ins de la semana\n\nAl día: todos los KRs tienen check-in de los últimos 7 días. 🎉";
    }
    const porResponsable = new Map<string, KeyResultCompleto[]>();
    for (const kr of pendientes) {
      const r = kr.okr_trimestral?.responsable ?? "Sin asignar";
      if (!porResponsable.has(r)) porResponsable.set(r, []);
      porResponsable.get(r)!.push(kr);
    }
    const l = [`## ${pendientes.length} check-in(s) pendientes`, ""];
    for (const [responsable, items] of porResponsable) {
      l.push(`**${responsable}**`);
      for (const kr of items) l.push(`- "${kr.titulo}"`);
      l.push("");
    }
    return l.join("\n").trimEnd();
  }

  if (/rentabilidad|margen|solop|65/.test(q)) {
    const bajos = proyectosBajoMargen(d.proyectos);
    const alertasKr = d.krs.filter(hasAlertaRentabilidad);
    if (bajos.length === 0 && alertasKr.length === 0) {
      return `## Rentabilidad\n\nSin alertas: todos los proyectos con margen calculable están en ${META_MARGEN}% o más. 🎉`;
    }
    const l = ["## Alertas de rentabilidad", ""];
    for (const p of bajos) {
      const r = ratioHoras(p);
      l.push(
        `- ⚠ **${p.cliente}** — margen real ${margenReal(p)}% (meta ${META_MARGEN}%)${r !== null ? `, horas al ${Math.round(r * 100)}%` : ""}`
      );
    }
    for (const kr of alertasKr) {
      l.push(
        `- ⚠ **"${kr.titulo}"** figura cumplido con margen ${kr.margen_actual_pct}% < ${kr.margen_utilidad_esperado}% esperado — posible scope creep.`
      );
    }
    return l.join("\n");
  }

  // Resumen general (cubre "resumen de la LOM" y cualquier otra pregunta).
  const pendientes = krsSinCheckInSemana(d.krs, d.checkIns);
  const bajos = proyectosBajoMargen(d.proyectos);
  const l = [`## Estado del trimestre — ${d.trimestre} ${d.anio}`, ""];
  l.push(
    `- **${d.krs.length} KRs activos:** ${d.krs.length - rojos.length - amarillos.length} en verde, ${amarillos.length} en amarillo, ${rojos.length} en rojo.`
  );
  if (rojos.length > 0) {
    l.push(`- **En rojo:** ${rojos.map((k) => `"${k.titulo}"`).join(", ")}.`);
  }
  if (pendientes.length > 0) {
    const responsables = [
      ...new Set(
        pendientes.map((k) => k.okr_trimestral?.responsable ?? "sin asignar")
      ),
    ];
    l.push(
      `- **Check-ins pendientes:** ${pendientes.length}, a cargo de ${responsables.join(", ")}.`
    );
  }
  if (bajos.length > 0) {
    l.push(
      `- **Rentabilidad:** ${bajos.length} proyecto(s) por debajo del ${META_MARGEN}% — ${bajos.map((p) => p.cliente).join(", ")}.`
    );
  }
  l.push("");
  l.push(
    "_Respuesta generada por reglas sobre los datos del sistema. Para análisis abierto hace falta configurar la IA._"
  );
  return l.join("\n");
}
