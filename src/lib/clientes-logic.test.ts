import { describe, expect, it } from "vitest";
import {
  clienteEnRiesgo,
  consolidadoCartera,
  metricasPorNivel,
  miembrosPorRol,
  resumenSolop,
  resumenSquad,
} from "@/lib/clientes-logic";
import type { MetricaCliente, ProyectoSolop, SquadMiembro } from "@/lib/types";

function proyecto(p: Partial<ProyectoSolop>): ProyectoSolop {
  return {
    id: "p",
    cliente: "Cliente",
    cliente_id: "c1",
    tipo_contrato: "Fee",
    kr_id: null,
    horas_presupuestadas: 0,
    horas_consumidas: 0,
    facturacion_total: 0,
    costo_operativo: 0,
    creado_at: "",
    actualizado_at: "",
    ...p,
  };
}

function miembro(p: Partial<SquadMiembro>): SquadMiembro {
  return {
    id: Math.random().toString(),
    cliente_id: "c1",
    nombre: "Alguien",
    usuario_id: null,
    rol_squad: "Ejecutor",
    especialidad: null,
    creado_at: "",
    ...p,
  };
}

function metrica(p: Partial<MetricaCliente>): MetricaCliente {
  return {
    id: Math.random().toString(),
    cliente_id: "c1",
    nivel: 1,
    titulo: "Métrica",
    meta: null,
    valor_actual: null,
    unidad: null,
    progreso_porcentaje: 0,
    detalle: null,
    kr_asociado_id: null,
    creado_at: "",
    actualizado_at: "",
    ...p,
  };
}

describe("resumenSolop", () => {
  it("devuelve nulls cuando el cliente no tiene proyectos", () => {
    const r = resumenSolop([]);
    expect(r.margen_pct).toBeNull();
    expect(r.rendimiento_hora).toBeNull();
    expect(r.ratio_horas).toBeNull();
    expect(r.horas_consumidas).toBe(0);
  });

  it("calcula margen y rendimiento de un proyecto solo", () => {
    const r = resumenSolop([
      proyecto({
        facturacion_total: 1_000_000,
        costo_operativo: 400_000,
        horas_consumidas: 100,
        horas_presupuestadas: 120,
      }),
    ]);

    expect(r.margen_pct).toBe(60);
    expect(r.rendimiento_hora).toBe(10_000);
    expect(r.ratio_horas).toBeCloseTo(100 / 120);
  });

  it("suma primero y divide después, en vez de promediar márgenes", () => {
    // Un fee grande al 70% y un adhoc chico al 20% no dan 45%: el margen
    // real es el de la plata, no el promedio de los porcentajes.
    const r = resumenSolop([
      proyecto({ facturacion_total: 2_000_000, costo_operativo: 600_000 }),
      proyecto({ facturacion_total: 50_000, costo_operativo: 40_000 }),
    ]);

    // (2.050.000 - 640.000) / 2.050.000 = 68,8%
    expect(r.margen_pct).toBe(68.8);
    expect(r.margen_pct).not.toBe(45);
  });

  it("no divide por cero si hay horas cargadas pero no facturación", () => {
    const r = resumenSolop([
      proyecto({ horas_consumidas: 40, horas_presupuestadas: 50 }),
    ]);
    expect(r.margen_pct).toBeNull();
    expect(r.rendimiento_hora).toBe(0);
    expect(r.ratio_horas).toBeCloseTo(0.8);
  });
});

describe("clienteEnRiesgo", () => {
  it("marca riesgo cuando las horas pasan el 75%", () => {
    // El caso Batistella: 88 de 100 horas con el margen ya caído. Con el
    // umbral viejo de 90% no contaba, y es justo el que hay que ver.
    const r = resumenSolop([
      proyecto({
        horas_consumidas: 88,
        horas_presupuestadas: 100,
        facturacion_total: 1_000_000,
        costo_operativo: 460_000,
      }),
    ]);
    expect(clienteEnRiesgo(r)).toBe(true);
  });

  it("marca riesgo por margen aunque las horas estén bien", () => {
    const r = resumenSolop([
      proyecto({
        horas_consumidas: 10,
        horas_presupuestadas: 100,
        facturacion_total: 1_000_000,
        costo_operativo: 500_000,
      }),
    ]);
    expect(r.margen_pct).toBe(50);
    expect(clienteEnRiesgo(r)).toBe(true);
  });

  it("no marca riesgo con margen sano y horas bajas", () => {
    const r = resumenSolop([
      proyecto({
        horas_consumidas: 30,
        horas_presupuestadas: 100,
        facturacion_total: 1_000_000,
        costo_operativo: 300_000,
      }),
    ]);
    expect(clienteEnRiesgo(r)).toBe(false);
  });
});

describe("consolidadoCartera", () => {
  it("devuelve ceros y nulls con la cartera vacía", () => {
    const c = consolidadoCartera([]);
    expect(c.facturacion_total).toBe(0);
    expect(c.margen_global).toBeNull();
    expect(c.rendimiento_medio).toBeNull();
    expect(c.squads_en_riesgo).toBe(0);
  });

  it("cuenta los squads en riesgo", () => {
    const sano = resumenSolop([
      proyecto({
        facturacion_total: 1_000_000,
        costo_operativo: 300_000,
        horas_consumidas: 10,
        horas_presupuestadas: 100,
      }),
    ]);
    const caido = resumenSolop([
      proyecto({
        facturacion_total: 1_000_000,
        costo_operativo: 600_000,
        horas_consumidas: 10,
        horas_presupuestadas: 100,
      }),
    ]);

    expect(consolidadoCartera([sano, caido, caido]).squads_en_riesgo).toBe(2);
  });

  it("pondera el margen global por facturación, no por cuenta", () => {
    const grande = resumenSolop([
      proyecto({ facturacion_total: 10_000_000, costo_operativo: 3_000_000 }),
    ]);
    const chica = resumenSolop([
      proyecto({ facturacion_total: 100_000, costo_operativo: 90_000 }),
    ]);

    const c = consolidadoCartera([grande, chica]);
    // Promediar 70% y 10% daría 40%. El margen real de la cartera es 69,4%.
    expect(c.margen_global).toBe(69.4);
  });
});

describe("resumenSquad", () => {
  it("avisa cuando no hay nadie cargado", () => {
    expect(resumenSquad([])).toBe("Sin squad cargado");
  });

  it("nombra al PO y cuenta los ejecutores", () => {
    const squad = [
      miembro({ nombre: "Leticia", rol_squad: "PO" }),
      miembro({ nombre: "Nico" }),
      miembro({ nombre: "Maca" }),
    ];
    expect(resumenSquad(squad)).toBe("PO Leticia · 2 ejecutores");
  });

  it("usa el singular con un solo ejecutor", () => {
    const squad = [
      miembro({ nombre: "Leticia", rol_squad: "PO" }),
      miembro({ nombre: "Nico" }),
    ];
    expect(resumenSquad(squad)).toBe("PO Leticia · 1 ejecutor");
  });

  it("funciona con squad sin PO", () => {
    expect(resumenSquad([miembro({ nombre: "Nico" })])).toBe("1 ejecutor");
  });
});

describe("miembrosPorRol", () => {
  it("filtra por rol sin mezclar", () => {
    const squad = [
      miembro({ nombre: "Leticia", rol_squad: "PO" }),
      miembro({ nombre: "Mateo", rol_squad: "Chapter Lead" }),
      miembro({ nombre: "Nico", rol_squad: "Ejecutor" }),
    ];
    expect(miembrosPorRol(squad, "Chapter Lead").map((m) => m.nombre)).toEqual([
      "Mateo",
    ]);
  });
});

describe("metricasPorNivel", () => {
  it("devuelve los tres niveles aunque alguno venga vacío", () => {
    const r = metricasPorNivel([
      metrica({ nivel: 1, titulo: "Tickets" }),
      metrica({ nivel: 3, titulo: "CTR" }),
      metrica({ nivel: 3, titulo: "CPM" }),
    ]);

    expect(r.nivel1).toHaveLength(1);
    expect(r.nivel2).toEqual([]);
    expect(r.nivel3).toHaveLength(2);
  });
});
