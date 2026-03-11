"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Team } from "@/lib/types";

interface TeamActivityData {
  team: Team;
  byType: Record<string, number>;
}

interface Props {
  teamsData: TeamActivityData[];
  activityTypeNames: string[];
  title?: string;
}

export function TeamRadarChart({ teamsData, activityTypeNames, title = "Aktywności wg typu" }: Props) {
  const data = activityTypeNames.map((typeName) => {
    const point: Record<string, string | number> = { type: typeName };
    teamsData.forEach((td) => {
      point[td.team.name] = Number((td.byType[typeName] ?? 0).toFixed(1));
    });
    return point;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="type" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              {teamsData.map((td) => (
                <Radar
                  key={td.team.id}
                  name={td.team.name}
                  dataKey={td.team.name}
                  stroke={td.team.color}
                  fill={td.team.color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Brak danych
          </div>
        )}
      </CardContent>
    </Card>
  );
}
