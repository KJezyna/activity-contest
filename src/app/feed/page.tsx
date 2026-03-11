"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAppStore } from "@/stores/appStore";
import { supabase } from "@/lib/supabase";
import type { Activity, Person } from "@/lib/types";
import { PageTransition } from "@/components/layout/PageTransition";
import { ProofReactions } from "@/components/ProofReactions";
import { ProofComments } from "@/components/ProofComments";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "przed chwilą";
  if (minutes < 60) return `${minutes} min temu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "wczoraj";
  if (days < 7) return `${days} dni temu`;
  return new Date(dateStr).toLocaleDateString("pl-PL");
}

export default function FeedPage() {
  const { teams, activityTypes } = useAppStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    const { data: activitiesData } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    const items = (activitiesData as Activity[]) ?? [];
    setActivities(items);

    // Fetch unique person names
    const personIds = [...new Set(items.map((a) => a.person_id))];
    if (personIds.length > 0) {
      const { data: peopleData } = await supabase
        .from("people")
        .select("*")
        .in("id", personIds);

      if (peopleData) {
        const map: Record<string, Person> = {};
        (peopleData as Person[]).forEach((p) => {
          map[p.id] = p;
        });
        setPeople(map);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("feed-activities")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => {
          void fetchFeed();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchFeed]);

  const getTeam = (teamId: number | null) => teams.find((t) => t.id === teamId);
  const getActivityType = (typeId: number) => activityTypes.find((t) => t.id === typeId);

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Newspaper className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Feed aktywności</h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Ładowanie...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Brak aktywności do wyświetlenia.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const person = people[activity.person_id];
              const team = getTeam(activity.team_id);
              const activityType = getActivityType(activity.activity_type_id);

              return (
                <Card key={activity.id}>
                  <CardContent className="pt-5 space-y-3">
                    {/* Person + team + time */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/player/${activity.person_id}`}
                          className="font-semibold hover:underline"
                        >
                          {person?.name ?? "..."}
                        </Link>
                        {team && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: team.color }}
                            />
                            {team.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {timeAgo(activity.created_at)}
                      </span>
                    </div>

                    {/* Activity type + points */}
                    <div className="flex items-center gap-3">
                      {activityType && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {activityType.name}
                        </span>
                      )}
                      <span
                        className={`font-mono font-medium ${
                          activity.points >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {activity.points >= 0 ? "+" : ""}
                        {activity.points.toFixed(1)} pkt
                      </span>
                    </div>

                    {/* Proof image */}
                    {activity.proof_url && (
                      <div className="space-y-2">
                        <a
                          href={activity.proof_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={activity.proof_url}
                            alt="Dowód aktywności"
                            className="h-48 rounded-lg object-cover"
                            loading="lazy"
                          />
                        </a>
                        <ProofReactions activityId={activity.id} />
                        <ProofComments activityId={activity.id} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
