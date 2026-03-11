"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";
import type { Person, Activity, Badge, UserBadge } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/layout/PageTransition";
import { ActivityHeatmap } from "@/components/charts/ActivityHeatmap";
import { ProgressLineChart } from "@/components/charts/ProgressLineChart";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { ProofReactions } from "@/components/ProofReactions";
import { ProofComments } from "@/components/ProofComments";
import { Flame, User } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function PublicPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTeamById, activityTypes } = useAppStore();

  const [person, setPerson] = useState<Person | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userBadges, setUserBadges] = useState<(UserBadge & { badges: Badge })[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [personRes, activitiesRes, badgesRes, earnedRes] = await Promise.all([
        supabase.from("people").select("*").eq("id", id).maybeSingle(),
        supabase.from("activities").select("*").eq("person_id", id).order("created_at", { ascending: false }),
        supabase.from("badges").select("*"),
        supabase.from("user_badges").select("*, badges(*)").eq("person_id", id),
      ]);

      if (personRes.data) setPerson(personRes.data as Person);
      setActivities((activitiesRes.data as Activity[]) ?? []);
      setAllBadges((badgesRes.data as Badge[]) ?? []);
      setUserBadges((earnedRes.data ?? []) as (UserBadge & { badges: Badge })[]);
      setLoading(false);
    };
    void load();
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Ładowanie profilu...</p>
        </div>
      </PageTransition>
    );
  }

  if (!person) {
    return (
      <PageTransition>
        <div className="text-center py-12 text-muted-foreground">Gracz nie znaleziony.</div>
      </PageTransition>
    );
  }

  const team = person.team_id ? getTeamById(person.team_id) : null;
  const totalPoints = activities.reduce((s, a) => s + a.points, 0);

  // Streak
  const uniqueDays = new Set(activities.map((a) => new Date(a.created_at).toDateString()));
  const sortedDays = Array.from(uniqueDays).map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < sortedDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    expected.setHours(0, 0, 0, 0);
    const day = new Date(sortedDays[i]);
    day.setHours(0, 0, 0, 0);
    if (day.getTime() === expected.getTime()) streak++;
    else break;
  }

  // Progress chart
  const dailyPoints = new Map<string, number>();
  activities.forEach((a) => {
    const date = new Date(a.created_at).toISOString().slice(0, 10);
    dailyPoints.set(date, (dailyPoints.get(date) ?? 0) + a.points);
  });
  let cumulative = 0;
  const cumulativeData = Array.from(dailyPoints.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, points]) => {
      cumulative += points;
      return { date: date.slice(5), points: Number(cumulative.toFixed(1)) };
    });

  const proofs = activities.filter((a) => a.proof_url);

  return (
    <PageTransition>
      <div className="grid gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{person.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {team ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                        {team.name}
                      </span>
                    ) : (
                      "Brak zespołu"
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 text-orange-500 font-semibold">
                    <Flame className="h-5 w-5" />
                    <span>{streak} {streak === 1 ? "dzień" : "dni"}</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono">{totalPoints.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">punktów</p>
                </div>
              </div>
            </div>
          </CardHeader>
          {allBadges.length > 0 && (
            <CardContent>
              <BadgeDisplay userBadges={userBadges} allBadges={allBadges} showUnearned />
            </CardContent>
          )}
        </Card>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <ProgressLineChart data={cumulativeData} title="Postęp" color="hsl(var(--chart-1))" />
          <ActivityHeatmap
            activities={activities.map((a) => ({ created_at: a.created_at, points: a.points }))}
          />
        </div>

        {/* Activity breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statystyki aktywności</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activityTypes.map((at) => {
                const count = activities.filter((a) => a.activity_type_id === at.id).length;
                const pts = activities.filter((a) => a.activity_type_id === at.id).reduce((s, a) => s + a.points, 0);
                return (
                  <div key={at.id} className="rounded-lg border p-3 text-center">
                    <p className="font-medium text-sm">{at.name}</p>
                    <p className="text-lg font-bold font-mono">{pts.toFixed(1)}</p>
                    <p className="text-[11px] text-muted-foreground">{count} razy</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Proof gallery */}
        {proofs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dowody aktywności</CardTitle>
              <CardDescription>{proofs.length} zdjęć</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {proofs.map((item) => (
                  <div key={item.id} className="group overflow-hidden rounded-lg border shadow-sm">
                    <a href={item.proof_url!} target="_blank" rel="noreferrer">
                      <img
                        src={item.proof_url!}
                        alt={`Dowód z ${new Date(item.created_at).toLocaleDateString("pl-PL")}`}
                        className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </a>
                    <div className="p-1.5">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        {new Date(item.created_at).toLocaleDateString("pl-PL")}
                      </p>
                      <ProofReactions activityId={item.id} />
                      <ProofComments activityId={item.id} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
