"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";
import type { TeamStats, LeaderboardEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/PageTransition";
import { Trophy, ArrowUpDown, Medal, AlertTriangle } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";

type SortField = "rank" | "name" | "points";

export default function LeaderboardPage() {
  const { teams, getConfigValue } = useAppStore();
  const [people, setPeople] = useState<LeaderboardEntry[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [sortField, setSortField] = useState<SortField>("points");
  const [sortAsc, setSortAsc] = useState(false);
  const [tab, setTab] = useState<"individual" | "teams">("individual");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });

  useEffect(() => {
    const load = async () => {
      const teamsRes = await supabase.from("mv_team_stats").select("*").order("total_points", { ascending: false });
      if (teamsRes.data) setTeamStats(teamsRes.data as TeamStats[]);

      if (dateRange.from && dateRange.to) {
        // Date-filtered: fetch activities directly and compute totals client-side
        const activitiesRes = await supabase
          .from("activities")
          .select("person_id, team_id, points, created_at")
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());

        if (activitiesRes.data) {
          const map = new Map<string, { person_id: string; name: string; team_id: number | null; total_points: number; last_activity: string }>();
          for (const a of activitiesRes.data as { person_id: string; team_id: number | null; points: number; created_at: string }[]) {
            const existing = map.get(a.person_id);
            if (existing) {
              existing.total_points += a.points;
              if (a.created_at > existing.last_activity) existing.last_activity = a.created_at;
            } else {
              map.set(a.person_id, {
                person_id: a.person_id,
                name: a.person_id,
                team_id: a.team_id,
                total_points: a.points,
                last_activity: a.created_at,
              });
            }
          }
          // Fetch names for matched people
          const ids = Array.from(map.keys());
          if (ids.length > 0) {
            const { data: people } = await supabase.from("people").select("id, name").in("id", ids);
            if (people) {
              for (const p of people as { id: string; name: string }[]) {
                const entry = map.get(p.id);
                if (entry) entry.name = p.name;
              }
            }
          }
          const all = Array.from(map.values())
            .sort((a, b) => b.total_points - a.total_points);
          setPeople(all.map((p) => ({ ...p, is_inactive: false, last_activity: p.last_activity })));
        }
      } else {
        // No date filter: use materialized view
        const peopleRes = await supabase.from("mv_people_stats").select("*").order("total_points", { ascending: false });

        if (peopleRes.data) {
          const inactiveDays = parseInt(getConfigValue("inactive_days_threshold", "7"));
          const inactivePercentile = parseInt(getConfigValue("inactive_percentile_threshold", "25"));
          const now = Date.now();

          const all = peopleRes.data as LeaderboardEntry[];
          const sorted = [...all].sort((a, b) => b.total_points - a.total_points);
          const cutoffIndex = Math.floor(sorted.length * (inactivePercentile / 100));
          const cutoffPoints = sorted[sorted.length - 1 - cutoffIndex]?.total_points ?? 0;

          setPeople(
            all.map((p) => {
              const daysSince = p.last_activity
                ? Math.floor((now - new Date(p.last_activity).getTime()) / 86400000)
                : 999;
              return { ...p, is_inactive: daysSince >= inactiveDays || p.total_points <= cutoffPoints };
            })
          );
        }
      }
    };

    void load();

    const channel = supabase
      .channel("leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => void load())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [getConfigValue, dateRange]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...people].sort((a, b) => {
    const mult = sortAsc ? 1 : -1;
    if (sortField === "name") return mult * a.name.localeCompare(b.name);
    return mult * (a.total_points - b.total_points);
  });

  const medalColor = (i: number) => {
    if (i === 0) return "text-amber-500";
    if (i === 1) return "text-gray-400";
    if (i === 2) return "text-amber-700";
    return "text-muted-foreground";
  };

  return (
    <PageTransition>
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Ranking
          </h1>
          <div className="flex gap-1 rounded-lg border p-1">
            <Button
              size="sm"
              variant={tab === "individual" ? "secondary" : "ghost"}
              onClick={() => setTab("individual")}
            >
              Indywidualny
            </Button>
            <Button
              size="sm"
              variant={tab === "teams" ? "secondary" : "ghost"}
              onClick={() => setTab("teams")}
            >
              Zespołowy
            </Button>
          </div>
        </div>

        <DateRangeFilter onChange={setDateRange} />

        {tab === "individual" ? (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                        Gracz <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Zespół</TableHead>
                    <TableHead className="text-right">
                      <button className="flex items-center gap-1 ml-auto hover:text-foreground" onClick={() => toggleSort("points")}>
                        Punkty <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((entry, i) => {
                    const team = teams.find((t) => t.id === entry.team_id);
                    return (
                      <TableRow key={entry.person_id} className={entry.is_inactive ? "opacity-60" : ""}>
                        <TableCell>
                          {i < 3 ? (
                            <Medal className={`h-5 w-5 ${medalColor(i)}`} />
                          ) : (
                            <span className="text-sm text-muted-foreground font-mono">{i + 1}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/player/${entry.person_id}`} className="font-medium hover:underline">
                              {entry.name}
                            </Link>
                            {entry.is_inactive && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {team ? (
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: team.color }} />
                              <span className="text-sm">{team.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {entry.total_points.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {sorted.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Brak graczy.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {teamStats.map((ts, i) => (
              <Card key={ts.team_id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {i < 3 && <Medal className={`h-5 w-5 ${medalColor(i)}`} />}
                      <span
                        className="h-3 w-3 rounded-full inline-block"
                        style={{ backgroundColor: ts.team_color }}
                      />
                      <span>{ts.team_name}</span>
                    </div>
                    <span className="font-mono text-lg">{ts.total_points.toFixed(1)} pkt</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>{ts.total_members} członków</span>
                    <span>{ts.active_members} aktywnych</span>
                    <span>
                      {ts.total_members > 0
                        ? (ts.total_points / ts.total_members).toFixed(1)
                        : "0"}{" "}
                      pkt/osobę
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
