"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";
import type { TeamStats, LeaderboardEntry } from "@/lib/types";
import { TeamBarChart } from "@/components/charts/TeamBarChart";
import { TeamPieChart } from "@/components/charts/TeamPieChart";
import { ProgressLineChart } from "@/components/charts/ProgressLineChart";
import { WeeklyTrendChart } from "@/components/charts/WeeklyTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/layout/PageTransition";
import { Trophy, Users, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export default function DashboardPage() {
  const { teams, getConfigValue } = useAppStore();
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allActivities, setAllActivities] = useState<{ created_at: string; points: number }[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });

  useEffect(() => {
    const load = async () => {
      const [statsRes, peopleRes, activitiesRes] = await Promise.all([
        supabase.from("mv_team_stats").select("*"),
        supabase.from("mv_people_stats").select("*").order("total_points", { ascending: false }).limit(15),
        supabase.from("activities").select("created_at, points").order("created_at", { ascending: true }),
      ]);

      if (statsRes.data) setTeamStats(statsRes.data as TeamStats[]);

      if (peopleRes.data) {
        const inactiveDays = parseInt(getConfigValue("inactive_days_threshold", "7"));
        const inactivePercentile = parseInt(getConfigValue("inactive_percentile_threshold", "25"));
        const now = Date.now();

        const people = peopleRes.data as LeaderboardEntry[];
        const sorted = [...people].sort((a, b) => b.total_points - a.total_points);
        const cutoffIndex = Math.floor(sorted.length * (inactivePercentile / 100));
        const cutoffPoints = sorted[sorted.length - 1 - cutoffIndex]?.total_points ?? 0;

        const entries: LeaderboardEntry[] = people.map((p) => {
          const daysSinceActivity = p.last_activity
            ? Math.floor((now - new Date(p.last_activity).getTime()) / 86400000)
            : 999;
          const isInactive = daysSinceActivity >= inactiveDays || p.total_points <= cutoffPoints;
          return { ...p, is_inactive: isInactive };
        });

        setLeaderboard(entries);
      }

      if (activitiesRes.data) {
        setAllActivities(activitiesRes.data as { created_at: string; points: number }[]);
      }
    };

    void load();

    // Realtime
    const channel = supabase
      .channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => void load())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [getConfigValue]);

  // Filter activities by date range
  const filteredActivities = dateRange.from && dateRange.to
    ? allActivities.filter((a) => {
        const d = new Date(a.created_at);
        return d >= dateRange.from! && d <= dateRange.to!;
      })
    : allActivities;

  // Daily progress data
  const dailyMap = new Map<string, number>();
  filteredActivities.forEach((a) => {
    const date = new Date(a.created_at).toISOString().slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + a.points);
  });
  let cumulative = 0;
  const dailyData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, points]) => {
      cumulative += points;
      return { date: date.slice(5), points: Number(cumulative.toFixed(1)) };
    });

  const totalPoints = teamStats.reduce((s, t) => s + t.total_points, 0);
  const totalMembers = teamStats.reduce((s, t) => s + t.total_members, 0);

  return (
    <PageTransition>
      <div className="grid gap-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{totalPoints.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Łączne punkty</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2.5">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Uczestników</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2.5">
                  <Trophy className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">{teams.length}</p>
                  <p className="text-xs text-muted-foreground">Zespołów</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">
                    {leaderboard.filter((e) => e.is_inactive).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Nieaktywnych</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DateRangeFilter onChange={setDateRange} />

        {/* Charts row 1 */}
        <div className="grid md:grid-cols-2 gap-6">
          <TeamBarChart data={teamStats} />
          <TeamPieChart data={teamStats} />
        </div>

        {/* Charts row 2 */}
        <div className="grid md:grid-cols-2 gap-6">
          <ProgressLineChart data={dailyData} title="Łączny postęp" />
          <WeeklyTrendChart activities={filteredActivities} />
        </div>

        {/* Leaderboard preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top gracze
            </CardTitle>
            <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Zobacz pełny ranking &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, i) => {
                const team = teams.find((t) => t.id === entry.team_id);
                return (
                  <div key={entry.person_id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                        {i + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entry.name}</span>
                        {entry.is_inactive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            nieaktywny
                          </span>
                        )}
                      </div>
                      {team && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                      )}
                    </div>
                    <span className="font-mono font-medium">{entry.total_points.toFixed(1)} pkt</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
