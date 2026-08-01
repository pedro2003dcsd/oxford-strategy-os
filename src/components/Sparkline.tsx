"use client";

import { Line, LineChart, ReferenceLine, ResponsiveContainer } from "recharts";
import type { CheckIn } from "@/lib/types";

export function Sparkline({
  checkIns,
  valorMeta,
}: {
  checkIns: CheckIn[];
  valorMeta: number;
}) {
  if (checkIns.length < 2) {
    return (
      <p className="text-xs text-neutral-400">
        Hacen falta al menos 2 check-ins para ver la tendencia.
      </p>
    );
  }

  const data = checkIns.map((c) => ({ valor: c.valor_registrado }));
  const ultimo = data[data.length - 1].valor;
  const anteultimo = data[data.length - 2].valor;
  const desacelerando = ultimo <= anteultimo;

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <ReferenceLine y={valorMeta} stroke="currentColor" strokeDasharray="3 3" opacity={0.25} />
          <Line
            type="monotone"
            dataKey="valor"
            stroke={desacelerando ? "#dc2626" : "#059669"}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
