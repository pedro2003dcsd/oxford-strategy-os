import { describe, expect, it } from "vitest";
import { checkInCorregible, ultimoCheckIn } from "@/lib/checkin-logic";
import type { CheckIn } from "@/lib/types";

function checkIn(c: Partial<CheckIn>): CheckIn {
  return {
    id: "c",
    kr_id: "kr",
    usuario: "Alguien",
    autor_id: null,
    valor_registrado: 0,
    estado_semaforo: "verde",
    comentario_bloqueos: null,
    valor_previo: null,
    semaforo_previo: null,
    editado_at: null,
    creado_at: "2026-11-01T10:00:00+00:00",
    ...c,
  };
}

const numerico = { tipo_medicion: "porcentaje" } as const;
const ana = { id: "ana", rol: "equipo" } as const;
const beto = { id: "beto", rol: "equipo" } as const;

describe("ultimoCheckIn", () => {
  it("devuelve null sin check-ins", () => {
    expect(ultimoCheckIn([])).toBeNull();
  });

  it("elige el de fecha más reciente, venga en el orden que venga", () => {
    const viejo = checkIn({ id: "1", creado_at: "2026-11-01T10:00:00+00:00" });
    const nuevo = checkIn({ id: "2", creado_at: "2026-11-08T10:00:00+00:00" });
    expect(ultimoCheckIn([nuevo, viejo])?.id).toBe("2");
    expect(ultimoCheckIn([viejo, nuevo])?.id).toBe("2");
  });

  it("distingue microsegundos dentro del mismo milisegundo", () => {
    const a = checkIn({ id: "z", creado_at: "2026-11-08T10:00:00.123100+00:00" });
    const b = checkIn({ id: "a", creado_at: "2026-11-08T10:00:00.123900+00:00" });
    expect(ultimoCheckIn([a, b])?.id).toBe("a");
  });

  it("a igual fecha desempata por id", () => {
    const a = checkIn({ id: "a" });
    const b = checkIn({ id: "b" });
    expect(ultimoCheckIn([b, a])?.id).toBe("b");
  });
});

describe("checkInCorregible", () => {
  const anterior = checkIn({
    id: "1",
    autor_id: "ana",
    creado_at: "2026-11-01T10:00:00+00:00",
  });
  const ultimoDeAna = checkIn({
    id: "2",
    autor_id: "ana",
    creado_at: "2026-11-08T10:00:00+00:00",
  });

  it("la autora del último puede corregirlo", () => {
    expect(checkInCorregible(numerico, [anterior, ultimoDeAna], ana)?.id).toBe("2");
  });

  it("otra persona no puede", () => {
    expect(checkInCorregible(numerico, [anterior, ultimoDeAna], beto)).toBeNull();
  });

  it("si otra persona carga después, el anterior deja de ser corregible", () => {
    const deBeto = checkIn({
      id: "3",
      autor_id: "beto",
      creado_at: "2026-11-09T10:00:00+00:00",
    });
    const todos = [anterior, ultimoDeAna, deBeto];
    expect(checkInCorregible(numerico, todos, ana)).toBeNull();
    expect(checkInCorregible(numerico, todos, beto)?.id).toBe("3");
  });

  it("un check-in sin autor registrado no lo corrige nadie", () => {
    const viejo = checkIn({ id: "9", usuario: "ana", autor_id: null });
    expect(checkInCorregible(numerico, [viejo], ana)).toBeNull();
  });

  it("la autora en rol lectura ya no puede", () => {
    const lectora = { id: "ana", rol: "lectura" } as const;
    expect(checkInCorregible(numerico, [ultimoDeAna], lectora)).toBeNull();
  });

  it("sin sesión no hay nada para corregir", () => {
    expect(checkInCorregible(numerico, [ultimoDeAna], null)).toBeNull();
  });

  it("los KR de hitos quedan afuera", () => {
    expect(
      checkInCorregible({ tipo_medicion: "hitos" }, [ultimoDeAna], ana)
    ).toBeNull();
  });
});
