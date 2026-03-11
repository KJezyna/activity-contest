"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamStats } from "@/lib/types";

interface Props {
  data: TeamStats[];
  title?: string;
}

export function TeamPieChart({ data, title = "Udział zespołów" }: Props) {
  const total = data.reduce((sum, t) => sum + t.total_points, 0);

  const chartData = data.map((t) => ({
    name: t.team_name,
    value: Number(t.total_points.toFixed(1)),
    percent: total > 0 ? ((t.total_points / total) * 100).toFixed(1) : "0",
    color: t.team_color,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${percent}%`}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} pkt`, "Punkty"]}
                contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Brak danych
          </div>
        )}
      </CardContent>
    </Card>
  );
}
