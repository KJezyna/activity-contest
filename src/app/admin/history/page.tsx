"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { supabase } from "@/lib/supabase";
import type { TeamChange } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/layout/PageTransition";
import { History, ArrowRight } from "lucide-react";

interface ChangeWithName extends TeamChange {
  people?: { name: string };
}

export default function AdminHistoryPage() {
  const { isAdmin, session } = useAuthStore();
  const { getTeamById } = useAppStore();
  const router = useRouter();
  const [changes, setChanges] = useState<ChangeWithName[]>([]);

  useEffect(() => {
    if (!session || !isAdmin) router.replace("/");
  }, [session, isAdmin, router]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("team_changes")
        .select("*, people(name)")
        .order("changed_at", { ascending: false })
        .limit(100);
      setChanges((data as ChangeWithName[]) ?? []);
    };
    void load();
  }, []);

  if (!isAdmin) return null;

  return (
    <PageTransition>
      <div className="grid gap-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" />
          Historia zmian zespołów
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ostatnie zmiany</CardTitle>
            <CardDescription>Automatycznie logowane przy każdej zmianie zespołu.</CardDescription>
          </CardHeader>
          <CardContent>
            {changes.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {changes.map((c) => {
                  const oldTeam = c.old_team_id ? getTeamById(c.old_team_id) : null;
                  const newTeam = c.new_team_id ? getTeamById(c.new_team_id) : null;
                  return (
                    <div key={c.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                      <span className="text-muted-foreground w-28 shrink-0">
                        {new Date(c.changed_at).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-medium">{c.people?.name ?? "?"}</span>
                      <div className="flex items-center gap-1.5">
                        {oldTeam ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: oldTeam.color }} />
                            <span className="text-xs">{oldTeam.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">brak</span>
                        )}
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {newTeam ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: newTeam.color }} />
                            <span className="text-xs">{newTeam.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">brak</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">Brak zmian.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
