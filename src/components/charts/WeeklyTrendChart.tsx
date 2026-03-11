"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  activities: { created_at: string; points: number }[];
  title?: string;
}

const DAY_NAMES = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

export function WeeklyTrendChart({ activities, title = "Trend tygodniowy" }: Props) {
  const daySums = new Array(7).fill(0);
  const dayCounts = new Array(7).fill(0);

  activities.forEach((a) => {
    const day = new Date(a.created_at).getDay();
    daySums[day] += a.points;
    dayCounts[day]++;
  });

  const data = DAY_NAMES.map((name, i) => ({
    day: name,
    points: Number(daySums[i].toFixed(1)),
  }));

  // Reorder: Mon first
  const reordered = [...data.slice(1), data[0]];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={reordered} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number) => [`${value} pkt`, "Punkty"]}
              contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
            />
            <Bar dataKey="points" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
