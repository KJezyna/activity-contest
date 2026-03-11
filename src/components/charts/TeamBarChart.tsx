"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamStats } from "@/lib/types";

interface Props {
  data: TeamStats[];
  title?: string;
}

export function TeamBarChart({ data, title = "Porównanie zespołów" }: Props) {
  const chartData = data.map((t) => ({
    name: t.team_name,
    points: Number(t.total_points.toFixed(1)),
    color: t.team_color,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [`${value} pkt`, "Punkty"]}
              contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
            />
            <Bar dataKey="points" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
