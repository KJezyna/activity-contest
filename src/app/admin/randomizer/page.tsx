"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { supabase } from "@/lib/supabase";
import type { Person, Team } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/PageTransition";
import { toast } from "sonner";
import { Shuffle, Save, Check } from "lucide-react";

interface Assignment {
  person: Person;
  team: Team;
}

export default function AdminRandomizerPage() {
  const { isAdmin, session } = useAuthStore();
  const { teams } = useAppStore();
  const router = useRouter();

  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session || !isAdmin) router.replace("/");
  }, [session, isAdmin, router]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("people").select("*").order("name");
      if (data) setAllPeople(data as Person[]);
    };
    void load();
  }, []);

  if (!isAdmin) return null;

  const togglePerson = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAssignments([]);
  };

  const selectAll = () => {
    setSelectedIds(new Set(allPeople.map((p) => p.id)));
    setAssignments([]);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
    setAssignments([]);
  };

  const randomize = () => {
    if (teams.length < 2) {
      toast.error("Potrzebujesz minimum 2 zespołów.");
      return;
    }
    if (selectedIds.size < 2) {
      toast.error("Wybierz minimum 2 graczy.");
      return;
    }

    const selected = allPeople.filter((p) => selectedIds.has(p.id));
    const shuffled = [...selected].sort(() => Math.random() - 0.5);

    const result: Assignment[] = shuffled.map((person, i) => ({
      person,
      team: teams[i % teams.length],
    }));

    setAssignments(result);
  };

  const saveAssignments = async () => {
    setIsSaving(true);
    try {
      // Reset all team assignments first
      const { error: resetError } = await supabase
        .from("people")
        .update({ team_id: null })
        .in("id", allPeople.map((p) => p.id));

      if (resetError) {
        toast.error("Błąd resetowania zespołów.");
        return;
      }

      // Apply new assignments
      for (const a of assignments) {
        const { error } = await supabase
          .from("people")
          .update({ team_id: a.team.id })
          .eq("id", a.person.id);

        if (error) {
          toast.error(`Błąd przypisania ${a.person.name}.`);
          return;
        }
      }

      toast.success("Zespoły przypisane!");
      setAssignments([]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="grid gap-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shuffle className="h-6 w-6" />
          Losowanie zespołów
        </h1>

        {/* People selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wybierz uczestników</CardTitle>
            <CardDescription>
              Zaznacz graczy do losowania ({selectedIds.size}/{allPeople.length} wybranych).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={selectAll}>Zaznacz wszystkich</Button>
              <Button size="sm" variant="outline" onClick={deselectAll}>Odznacz</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {allPeople.map((p) => (
                <button
                  key={p.id}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors text-left ${
                    selectedIds.has(p.id) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                  }`}
                  onClick={() => togglePerson(p.id)}
                >
                  {selectedIds.has(p.id) && <Check className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Randomize button */}
        <Button size="lg" onClick={randomize} disabled={selectedIds.size < 2 || teams.length < 2}>
          <Shuffle className="h-5 w-5 mr-2" />
          Losuj zespoły ({teams.length} zespołów)
        </Button>

        {/* Results */}
        {assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wynik losowania</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => {
                  const members = assignments.filter((a) => a.team.id === team.id);
                  return (
                    <div key={team.id} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                        <span className="font-semibold">{team.name}</span>
                        <span className="text-xs text-muted-foreground">({members.length})</span>
                      </div>
                      <div className="space-y-1">
                        {members.map((a) => (
                          <div key={a.person.id} className="text-sm px-2 py-1 rounded bg-muted/50">
                            {a.person.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button className="w-full mt-4" onClick={() => void saveAssignments()} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Zapisywanie..." : "Zapisz przypisania"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
