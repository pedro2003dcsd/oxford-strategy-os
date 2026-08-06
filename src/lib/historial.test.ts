import { describe, expect, it } from "vitest";
import { diffCampos, normalizar, sonEquivalentes } from "@/lib/historial";

describe("normalizar", () => {
  it("trata el string vacío como ausencia de valor", () => {
    expect(normalizar("")).toBeNull();
    expect(normalizar("   ")).toBeNull();
    expect(normalizar(null)).toBeNull();
    expect(normalizar(undefined)).toBeNull();
  });

  it("escribe los booleanos como los lee una persona", () => {
    expect(normalizar(true)).toBe("sí");
    expect(normalizar(false)).toBe("no");
  });

  it("junta los arrays con coma y descarta los vacíos", () => {
    expect(normalizar(["Digital", "Comercial / Clientes"])).toBe(
      "Digital, Comercial / Clientes"
    );
    expect(normalizar([])).toBeNull();
    expect(normalizar(["", "  "])).toBeNull();
  });

  it("conserva el cero, que es un valor y no una ausencia", () => {
    expect(normalizar(0)).toBe("0");
  });
});

describe("sonEquivalentes", () => {
  it("compara números por valor y no por texto", () => {
    // El caso real: la base devuelve 65 y el formulario manda "65.0".
    expect(sonEquivalentes("65", "65.0")).toBe(true);
    expect(sonEquivalentes("65.00", "65")).toBe(true);
    expect(sonEquivalentes("65", "70")).toBe(false);
  });

  it("ignora diferencias de mayúsculas en texto", () => {
    expect(sonEquivalentes("Digital", "digital")).toBe(true);
  });

  it("null solo es equivalente a null", () => {
    expect(sonEquivalentes(null, null)).toBe(true);
    expect(sonEquivalentes(null, "algo")).toBe(false);
    expect(sonEquivalentes("algo", null)).toBe(false);
  });
});

describe("diffCampos", () => {
  it("no registra nada cuando no cambió nada", () => {
    const antes = { titulo: "Vender más", valor_meta: 100 };
    expect(diffCampos(antes, { titulo: "Vender más", valor_meta: 100 })).toEqual(
      []
    );
  });

  it("no registra un cambio por el formato del número", () => {
    // Sin esto el historial se llenaría de ediciones que nadie hizo, cada
    // vez que alguien abre el formulario y le da guardar.
    const antes = { valor_meta: 65, margen_utilidad_esperado: 65.0 };
    const despues = { valor_meta: "65.0", margen_utilidad_esperado: "65" };
    expect(diffCampos(antes, despues)).toEqual([]);
  });

  it("devuelve el antes y el después de cada campo que cambió", () => {
    const cambios = diffCampos(
      { titulo: "Meta vieja", valor_meta: 100 },
      { titulo: "Meta nueva", valor_meta: 150 }
    );

    expect(cambios).toHaveLength(2);
    expect(cambios).toContainEqual({
      campo_modificado: "titulo",
      valor_anterior: "Meta vieja",
      valor_nuevo: "Meta nueva",
    });
    expect(cambios).toContainEqual({
      campo_modificado: "valor_meta",
      valor_anterior: "100",
      valor_nuevo: "150",
    });
  });

  it("ignora los campos que no están en la lista de auditados", () => {
    // valor_actual lo mueve cada check-in: si se auditara, el historial de
    // ediciones quedaría tapado de ruido semanal.
    const cambios = diffCampos(
      { valor_actual: 10, updated_at: "ayer" },
      { valor_actual: 90, updated_at: "hoy" }
    );
    expect(cambios).toEqual([]);
  });

  it("solo mira los campos que vienen en el objeto nuevo", () => {
    // Una edición parcial manda cuatro campos de veinte; los que no viajan
    // no se tocaron y no deben aparecer como borrados.
    const cambios = diffCampos(
      { titulo: "Original", area: "Digital", responsable: "Ayelén" },
      { titulo: "Editado" }
    );
    expect(cambios).toHaveLength(1);
    expect(cambios[0].campo_modificado).toBe("titulo");
  });

  it("registra cuando un campo pasa a vacío", () => {
    const cambios = diffCampos(
      { cliente_asociado: "Batistella" },
      { cliente_asociado: null }
    );
    expect(cambios).toEqual([
      {
        campo_modificado: "cliente_asociado",
        valor_anterior: "Batistella",
        valor_nuevo: null,
      },
    ]);
  });

  it("registra el paso a colaborativo con sus áreas", () => {
    const cambios = diffCampos(
      { es_colaborativo: false, areas_involucradas: [] },
      { es_colaborativo: true, areas_involucradas: ["Digital", "Consultoría"] }
    );

    expect(cambios).toContainEqual({
      campo_modificado: "es_colaborativo",
      valor_anterior: "no",
      valor_nuevo: "sí",
    });
    expect(cambios).toContainEqual({
      campo_modificado: "areas_involucradas",
      valor_anterior: null,
      valor_nuevo: "Digital, Consultoría",
    });
  });
});
