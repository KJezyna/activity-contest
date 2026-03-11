"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";
import type { PersonStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/PageTransition";
import { ProgressLineChart } from "@/components/charts/ProgressLineChart";
import { ArrowUpDown, AlertTriangle, Download } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useAuthStore } from "@/stores/authStore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type SortField = "name" | "percent" | "score";

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const teamId = parseInt(id);
  const { getTeamById, getConfigValue } = useAppStore();
  const team = getTeamById(teamId);

  const [members, setMembers] = useState<(PersonStats & { percent: number; is_inactive: boolean })[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; points: number }[]>([]);
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });

  useEffect(() => {
    const load = async () => {
      let activitiesQuery = supabase.from("activities").select("created_at, points").eq("team_id", teamId).order("created_at");
      if (dateRange.from && dateRange.to) {
        activitiesQuery = activitiesQuery
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      const [membersRes, activitiesRes] = await Promise.all([
        supabase.from("mv_people_stats").select("*").eq("team_id", teamId),
        activitiesQuery,
      ]);

      if (membersRes.data) {
        const people = membersRes.data as PersonStats[];
        const total = people.reduce((s, p) => s + p.total_points, 0) || 1;
        const inactiveDays = parseInt(getConfigValue("inactive_days_threshold", "7"));
        const now = Date.now();

        setMembers(
          people.map((p) => {
            const daysSince = p.last_activity
              ? Math.floor((now - new Date(p.last_activity).getTime()) / 86400000)
              : 999;
            return {
              ...p,
              percent: (p.total_points / total) * 100,
              is_inactive: daysSince >= inactiveDays,
            };
          })
        );
      }

      if (activitiesRes.data) {
        const map = new Map<string, number>();
        (activitiesRes.data as { created_at: string; points: number }[]).forEach((a) => {
          const date = new Date(a.created_at).toISOString().slice(0, 10);
          map.set(date, (map.get(date) ?? 0) + a.points);
        });
        let cum = 0;
        setDailyData(
          Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, points]) => {
              cum += points;
              return { date: date.slice(5), points: Number(cum.toFixed(1)) };
            })
        );
      }
    };

    void load();

    const channel = supabase
      .channel(`team-${teamId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => void load())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [teamId, getConfigValue, dateRange]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const mult = sortAsc ? 1 : -1;
    if (sortField === "name") return mult * a.name.localeCompare(b.name);
    if (sortField === "percent") return mult * (a.percent - b.percent);
    return mult * (a.total_points - b.total_points);
  });

  const { isAdmin } = useAuthStore();
  const totalPoints = members.reduce((s, m) => s + m.total_points, 0);

  const exportTeamCSV = async () => {
    const { data } = await supabase
      .from("activities")
      .select("*, people!inner(name)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) return;

    const header = "Data,Gracz,Typ,Wartość,Punkty,Dowód\n";
    const rows = data.map((a: any) => {
      const date = new Date(a.created_at).toLocaleDateString("pl-PL");
      return `${date},${a.people?.name ?? "?"},${a.activity_type_id},${a.value},${a.points.toFixed(2)},${a.proof_url ? "Tak" : "Nie"}`;
    }).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zespol-${team?.name ?? teamId}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Pie chart data
  const pieData = members
    .filter((m) => m.total_points > 0)
    .map((m) => ({ name: m.name, value: Number(m.total_points.toFixed(1)) }));

  const COLORS = [
    "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
    "hsl(var(--chart-4))", "hsl(var(--chart-5))",
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00C49F",
  ];

  if (!team) {
    return (
      <PageTransition>
        <div className="text-center py-12 text-muted-foreground">Zespół nie istnieje.</div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="grid gap-6">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color }} />
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <span className="text-muted-foreground">—</span>
          <span className="text-muted-foreground">{members.length} członków</span>
          <span className="font-mono font-bold ml-auto text-xl">{totalPoints.toFixed(1)} pkt</span>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => void exportTeamCSV()} className="ml-2">
              <Download className="h-3.5 w-3.5 mr-1" />CSV
            </Button>
          )}
        </div>

        <DateRangeFilter onChange={setDateRange} />

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <ProgressLineChart data={dailyData} title="Postęp zespołu" color={team.color} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Udział członków</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} pkt`, "Punkty"]} contentStyle={{ borderRadius: "8px" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">Brak danych</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Członkowie zespołu</CardTitle>
            <CardDescription>Sortuj klikając nagłówki kolumn.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">
                    <Button variant="ghost" size="sm" className="gap-1 -ml-3" onClick={() => toggleSort("name")}>
                      Uczestnik <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[35%] text-center">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => toggleSort("percent")}>
                      Wkład <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[30%] text-right">
                    <Button variant="ghost" size="sm" className="gap-1 -mr-3 ml-auto" onClick={() => toggleSort("score")}>
                      Punkty <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMembers.length > 0 ? (
                  sortedMembers.map((m) => (
                    <TableRow key={m.person_id} className={m.is_inactive ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{m.name}</span>
                          {m.is_inactive && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-center text-sm">{m.percent.toFixed(1)}%</div>
                          <Progress
                            value={m.percent}
                            className={`h-2 ${m.percent < 10 ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{m.total_points.toFixed(1)} pkt</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Brak członków.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
