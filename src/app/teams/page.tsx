"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";
import type { TeamStats } from "@/lib/types";
import { TeamBarChart } from "@/components/charts/TeamBarChart";
import { TeamRadarChart } from "@/components/charts/TeamRadarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/PageTransition";
import { Users, ChevronRight } from "lucide-react";

export default function TeamsPage() {
  const { teams, activityTypes } = useAppStore();
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [radarData, setRadarData] = useState<{ team: typeof teams[0]; byType: Record<string, number> }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: stats } = await supabase.from("mv_team_stats").select("*");
      if (stats) setTeamStats(stats as TeamStats[]);

      // Get activity breakdown by type per team
      const { data: activities } = await supabase
        .from("activities")
        .select("team_id, activity_type_id, points");

      if (activities && teams.length > 0) {
        const teamMap = new Map<number, Record<string, number>>();

        activities.forEach((a: { team_id: number; activity_type_id: number; points: number }) => {
          if (!a.team_id) return;
          if (!teamMap.has(a.team_id)) teamMap.set(a.team_id, {});
          const typeName = activityTypes.find((t) => t.id === a.activity_type_id)?.name ?? "?";
          const map = teamMap.get(a.team_id)!;
          map[typeName] = (map[typeName] ?? 0) + a.points;
        });

        setRadarData(
          teams
            .filter((t) => teamMap.has(t.id))
            .map((t) => ({ team: t, byType: teamMap.get(t.id) ?? {} }))
        );
      }
    };

    void load();
  }, [teams, activityTypes]);

  return (
    <PageTransition>
      <div className="grid gap-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Zespoły
        </h1>

        {/* Team cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const stats = teamStats.find((s) => s.team_id === team.id);
            return (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                      {team.name}
                    </div>
                    <Link href={`/teams/${team.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold font-mono">{stats?.total_points.toFixed(0) ?? 0}</p>
                      <p className="text-[11px] text-muted-foreground">Punkty</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold font-mono">{stats?.total_members ?? 0}</p>
                      <p className="text-[11px] text-muted-foreground">Członków</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold font-mono">
                        {stats && stats.total_members > 0
                          ? (stats.total_points / stats.total_members).toFixed(1)
                          : "0"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Pkt/os</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <TeamBarChart data={teamStats} title="Porównanie punktów" />
          <TeamRadarChart
            teamsData={radarData}
            activityTypeNames={activityTypes.map((at) => at.name)}
            title="Porównanie aktywności"
          />
        </div>
      </div>
    </PageTransition>
  );
}
