import { fmtPesos, miembrosPorRol, resumenSquad } from "@/lib/clientes-logic";
import { ESTADO_CLIENTE_LABELS, ESTADO_PDCA_LABELS } from "@/lib/types";
import type { ClienteCompleto, CondicionConExperimentos } from "@/lib/clientes";
import type { Evaluacion360, ItemEvaluacion } from "@/lib/types";

/** Todo lo que Scout sabe de Performance Clientes.
 *
 * Recibe los datos ya consultados en vez de consultarlos: quien llama usa el
 * cliente de Supabase de la sesión, así que lo que llega acá es lo que RLS
 * dejó pasar para esa persona. Si esta función consultara por su cuenta,
 * sería el lugar perfecto para saltarse el aislamiento sin darse cuenta. */
export function contextoClientes(
  clientes: ClienteCompleto[],
  condiciones: CondicionConExperimentos[],
  evaluaciones: Evaluacion360[]
): string {
  if (clientes.length === 0) return "";

  const l: string[] = [];
  l.push("## Performance Clientes");
  l.push("");
  l.push(
    "Datos por cuenta: squad, métricas de tres niveles, rentabilidad real de SOLOP, condiciones objetivo del Kata y evaluación 360."
  );
  l.push("");

  for (const c of clientes) {
    l.push(`### ${c.nombre}`);
    l.push(
      `- Estado: ${ESTADO_CLIENTE_LABELS[c.estado]} · ${resumenSquad(c.squad_miembros)} · fee ${fmtPesos(c.fee_mensual)}`
    );

    const leads = miembrosPorRol(c.squad_miembros, "Chapter Lead");
    if (leads.length > 0) {
      l.push(
        `- Chapter Leads: ${leads.map((m) => (m.especialidad ? `${m.nombre} (${m.especialidad})` : m.nombre)).join(", ")}`
      );
    }
    if (c.ceremonias.length > 0) {
      l.push(`- Ceremonias: ${c.ceremonias.join(", ")}`);
    }

    const s = c.solop;
    if (s.margen_pct !== null || s.horas_presupuestadas > 0) {
      const partes: string[] = [];
      if (s.margen_pct !== null) partes.push(`margen ${s.margen_pct}%`);
      if (s.rendimiento_hora !== null) {
        partes.push(`${fmtPesos(s.rendimiento_hora)}/h`);
      }
      if (s.horas_presupuestadas > 0) {
        partes.push(`horas ${s.horas_consumidas} de ${s.horas_presupuestadas}`);
      }
      l.push(`- Rentabilidad: ${partes.join(" · ")}`);
    }

    for (const m of c.metricas_cliente) {
      l.push(
        `- Métrica N${m.nivel}: ${m.titulo} — ${m.valor_actual ?? "s/d"} de ${m.meta ?? "s/d"} (${m.progreso_porcentaje}%)${m.detalle ? ` · ${m.detalle}` : ""}`
      );
    }

    const suyas = condiciones.filter((co) => co.cliente_id === c.id);
    for (const co of suyas) {
      l.push(
        `- Condición objetivo: ${co.titulo} (${co.meta ?? "sin métrica"}, ${co.progreso_porcentaje}%)${co.responsable_nombre ? ` · responsable ${co.responsable_nombre}` : ""}`
      );
      if (co.obstaculo_actual) l.push(`  - Obstáculo: ${co.obstaculo_actual}`);
      if (co.siguiente_paso) l.push(`  - Siguiente paso: ${co.siguiente_paso}`);
      for (const e of co.pdca_experimentos) {
        l.push(
          `  - Experimento (${ESTADO_PDCA_LABELS[e.estado]}): ${e.hipotesis}${e.aprendizaje ? ` · Aprendizaje: ${e.aprendizaje}` : ""}`
        );
      }
    }

    const ev = evaluaciones.find((e) => e.cliente_id === c.id);
    if (ev) {
      l.push(
        `- Evaluación 360 ${ev.periodo}: cliente→Oxford ${prom(ev.notas_relacionamiento_json)}, Oxford→cliente ${prom(ev.notas_performance_json)}, comerciales ${prom(ev.notas_comerciales_json)}`
      );
      if (ev.tendencia_json.length > 0) {
        l.push(
          `  - Tendencia: ${ev.tendencia_json.map((t) => `${t.mes} ${t.puntaje}`).join(" → ")}`
        );
      }
    }

    l.push("");
  }

  return l.join("\n");
}

function prom(items: ItemEvaluacion[]): string {
  if (items.length === 0) return "s/d";
  const p = items.reduce((a, i) => a + i.puntaje, 0) / items.length;
  return String(Math.round(p * 10) / 10);
}

/** Respuesta por reglas cuando no hay ANTHROPIC_API_KEY.
 *
 * Busca el cliente por la primera palabra del nombre: la gente escribe
 * "Bati" o "Batistella", no "Batistella (Bati Off)". */
export function respuestaClientesFallback(
  pregunta: string,
  clientes: ClienteCompleto[],
  condiciones: CondicionConExperimentos[],
  evaluaciones: Evaluacion360[]
): string | null {
  const q = pregunta.toLowerCase();
  const cliente = clientes.find((c) => {
    const primera = c.nombre.split(/[\s(]/)[0].toLowerCase();
    return primera.length > 2 && q.includes(primera);
  });
  if (!cliente) return null;

  const l: string[] = [];
  l.push(`## ${cliente.nombre}`);
  l.push("");
  l.push(
    `- **Estado:** ${ESTADO_CLIENTE_LABELS[cliente.estado]} · ${resumenSquad(cliente.squad_miembros)} · fee ${fmtPesos(cliente.fee_mensual)}`
  );

  const s = cliente.solop;
  if (s.margen_pct !== null) {
    l.push(
      `- **Rentabilidad:** margen ${s.margen_pct}%${s.rendimiento_hora !== null ? ` · ${fmtPesos(s.rendimiento_hora)}/h` : ""} · horas ${s.horas_consumidas} de ${s.horas_presupuestadas}`
    );
  }

  const nivel1 = cliente.metricas_cliente.find((m) => m.nivel === 1);
  if (nivel1) {
    l.push(
      `- **Objetivo de negocio:** ${nivel1.titulo} — ${nivel1.valor_actual ?? "s/d"} de ${nivel1.meta ?? "s/d"} (${nivel1.progreso_porcentaje}%)`
    );
  }

  const suyas = condiciones.filter((c) => c.cliente_id === cliente.id);
  for (const co of suyas) {
    l.push("");
    l.push(`### ${co.titulo}`);
    if (co.obstaculo_actual) l.push(`- **Obstáculo:** ${co.obstaculo_actual}`);
    if (co.siguiente_paso) l.push(`- **Siguiente paso:** ${co.siguiente_paso}`);
    const abiertos = co.pdca_experimentos.filter(
      (e) => e.estado === "planificado" || e.estado === "en_curso"
    );
    if (abiertos.length > 0) {
      l.push(`- **Experimentos abiertos:** ${abiertos.length}`);
    }
  }

  const ev = evaluaciones.find((e) => e.cliente_id === cliente.id);
  if (ev) {
    l.push("");
    l.push(
      `**Evaluación 360 ${ev.periodo}:** cliente→Oxford ${prom(ev.notas_relacionamiento_json)} · Oxford→cliente ${prom(ev.notas_performance_json)}`
    );
  }

  l.push("");
  l.push("_Respuesta armada por reglas: no hay clave de IA configurada._");
  return l.join("\n");
}
