"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CheckIn } from "@/lib/types";

export function TrendChart({
  checkIns,
  valorMeta,
}: {
  checkIns: CheckIn[];
  valorMeta: number;
}) {
  if (checkIns.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Todavía no hay check-ins para graficar la tendencia.
      </p>
    );
  }

  const data = checkIns.map((c) => ({
    fecha: format(new Date(c.creado_at), "d MMM", { locale: es }),
    valor: c.valor_registrado,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
          <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
          <ReferenceLine y={valorMeta} stroke="currentColor" strokeDasharray="4 4" opacity={0.3} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelFormatter={(label) => `Check-in: ${label}`}
          />
          <Line type="monotone" dataKey="valor" stroke="#525252" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
