"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { supabase } from "@/lib/supabase";
import type { Activity, Badge, UserBadge } from "@/lib/types";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { checkAndAwardBadges } from "@/lib/badgeChecker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageTransition } from "@/components/layout/PageTransition";
import { ProofReactions } from "@/components/ProofReactions";
import { ProofComments } from "@/components/ProofComments";
import { ActivityHeatmap } from "@/components/charts/ActivityHeatmap";
import { ProgressLineChart } from "@/components/charts/ProgressLineChart";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import {
  Pencil, Check, X, Flame, ImagePlus, Trash2, Download, ChevronDown, ChevronUp, Plus, Minus,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { session, person, refreshPerson, updateName, updateTeam } = useAuthStore();
  const { teams, activityTypes } = useAppStore();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedActivityType, setSelectedActivityType] = useState<string>("");
  const [valueInput, setValueInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [userBadges, setUserBadges] = useState<(UserBadge & { badges: Badge })[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchActivities = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("person_id", session.user.id)
      .order("created_at", { ascending: false });
    setActivities((data as Activity[]) ?? []);
  }, [session]);

  const fetchBadges = useCallback(async () => {
    if (!session) return;
    const [earned, all] = await Promise.all([
      supabase.from("user_badges").select("*, badges(*)").eq("person_id", session.user.id),
      supabase.from("badges").select("*"),
    ]);
    setUserBadges((earned.data ?? []) as (UserBadge & { badges: Badge })[]);
    setAllBadges((all.data as Badge[]) ?? []);
  }, [session]);

  useEffect(() => {
    if (!session) {
      router.replace("/auth");
      return;
    }
    void fetchActivities();
    void fetchBadges();
  }, [session, router, fetchActivities, fetchBadges]);

  useEffect(() => {
    if (person) {
      setNameInput(person.name);
      setSelectedTeam(person.team_id ? String(person.team_id) : "");
    }
  }, [person]);

  useEffect(() => {
    if (activityTypes.length > 0 && !selectedActivityType) {
      setSelectedActivityType(String(activityTypes[0].id));
    }
  }, [activityTypes, selectedActivityType]);

  if (!session) return null;

  if (!person) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Ładowanie profilu...</p>
        </div>
      </PageTransition>
    );
  }

  // Streak calculation
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

  const totalPoints = activities.reduce((sum, a) => sum + a.points, 0);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    const result = await updateName(nameInput);
    if (result.success) {
      toast.success(result.message);
      setIsEditingName(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleTeamChange = async () => {
    const teamId = selectedTeam ? parseInt(selectedTeam) : null;
    const result = await updateTeam(teamId);
    if (result.success) {
      toast.success(result.message);
      const newBadges = await checkAndAwardBadges(session.user.id);
      if (newBadges.length > 0) {
        newBadges.forEach((name) => toast.success(`Nowa odznaka: ${name}!`));
        await fetchBadges();
      }
    } else {
      toast.error(result.message);
    }
  };

  const handleAddActivity = async (sign: 1 | -1) => {
    const val = parseFloat(valueInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Podaj poprawną wartość.");
      return;
    }
    if (!person.team_id) {
      toast.error("Wybierz zespół przed dodaniem aktywności.");
      return;
    }
    const actType = activityTypes.find((t) => t.id === parseInt(selectedActivityType));
    if (!actType) return;

    setIsSubmitting(true);
    const points = val * actType.multiplier * sign;

    const { error } = await supabase.from("activities").insert({
      person_id: session.user.id,
      team_id: person.team_id,
      activity_type_id: actType.id,
      value: val * sign,
      points,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Nie udało się zapisać aktywności.");
      console.error(error);
      return;
    }

    toast.success(`${sign > 0 ? "+" : ""}${points.toFixed(1)} pkt`);
    setValueInput("");
    await fetchActivities();
    const newBadges = await checkAndAwardBadges(session.user.id);
    if (newBadges.length > 0) {
      newBadges.forEach((name) => toast.success(`Nowa odznaka: ${name}!`));
      await fetchBadges();
    }
  };

  const uploadProof = async (activityId: number, file: File) => {
    setIsUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });

      const fileName = `proof/${session.user.id}/${Date.now()}_screen.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("distance_proofs")
        .upload(fileName, compressed);

      if (uploadError) {
        toast.error("Nie udało się przesłać pliku.");
        return;
      }

      const { data: urlData } = supabase.storage.from("distance_proofs").getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("activities")
        .update({ proof_url: urlData.publicUrl })
        .eq("id", activityId);

      if (dbError) {
        toast.error("Nie udało się zapisać dowodu.");
        return;
      }

      toast.success("Dowód przesłany!");
      await fetchActivities();
    } catch {
      toast.error("Błąd przesyłania.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProofUploadForLatest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const latest = activities[0];
    if (!latest) {
      toast.error("Najpierw dodaj aktywność.");
      return;
    }
    if (latest.proof_url) {
      toast.error("Ostatnia aktywność ma już dowód.");
      return;
    }
    await uploadProof(latest.id, file);
  };

  const deleteActivity = async (id: number) => {
    const activity = activities.find((a) => a.id === id);
    if (activity?.proof_url) {
      const path = activity.proof_url.split("distance_proofs/")[1];
      if (path) await supabase.storage.from("distance_proofs").remove([path]);
    }

    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", id)
      .eq("person_id", session.user.id);

    if (error) {
      toast.error("Nie udało się usunąć.");
      return;
    }
    toast.success("Wpis usunięty.");
    await fetchActivities();
  };

  const exportCSV = () => {
    if (activities.length === 0) return;
    const header = "Data,Typ,Wartość,Punkty,Dowód\n";
    const rows = activities.map((a) => {
      const date = new Date(a.created_at).toLocaleDateString("pl-PL");
      const typeName = activityTypes.find((t) => t.id === a.activity_type_id)?.name ?? "?";
      return `${date},${typeName},${a.value},${a.points.toFixed(2)},${a.proof_url ? "Tak" : "Nie"}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aktywności-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prepare chart data
  const dailyPoints = new Map<string, number>();
  activities.forEach((a) => {
    const date = new Date(a.created_at).toISOString().slice(0, 10);
    dailyPoints.set(date, (dailyPoints.get(date) ?? 0) + a.points);
  });
  const lineData = Array.from(dailyPoints.entries())
    .map(([date, points]) => ({ date, points }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Cumulative
  let cumulative = 0;
  const cumulativeData = lineData.map((d) => {
    cumulative += d.points;
    return { date: d.date.slice(5), points: Number(cumulative.toFixed(1)) };
  });

  const proofGallery = activities.filter((a) => a.proof_url);

  return (
    <PageTransition>
      <div className="grid gap-6 max-w-4xl mx-auto">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="h-8 w-48"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => void handleSaveName()}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setIsEditingName(false); setNameInput(person.name); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      {person.name}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditingName(true)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </CardTitle>
                <CardDescription>Zarządzaj profilem i loguj aktywności.</CardDescription>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 text-orange-500 font-semibold">
                  <Flame className="h-5 w-5" />
                  <span>{streak} {streak === 1 ? "dzień" : "dni"}</span>
                </div>
              )}
            </div>
            {allBadges.length > 0 && (
              <div className="mt-3">
                <BadgeDisplay userBadges={userBadges} allBadges={allBadges} showUnearned />
              </div>
            )}
          </CardHeader>
          <CardContent className="grid gap-5">
            {/* Team selection */}
            <div className="flex flex-wrap items-center gap-3">
              <Label>Zespół:</Label>
              <select
                className="rounded-md border bg-background px-3 py-1.5 text-sm"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Brak</option>
                {teams.map((t) => (
                  <option key={t.id} value={String(t.id)}>{t.name}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => void handleTeamChange()}>
                Zapisz
              </Button>
            </div>

            {/* Total points */}
            <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-3">
              <span className="text-2xl font-bold font-mono">{totalPoints.toFixed(1)}</span>
              <span className="text-muted-foreground">pkt</span>
            </div>

            {!person.team_id && (
              <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
                Wybierz zespół, żeby dodawać aktywności.
              </div>
            )}

            {/* Add activity */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Typ aktywności</Label>
                <select
                  className="rounded-md border bg-background px-3 py-1.5 text-sm"
                  value={selectedActivityType}
                  onChange={(e) => setSelectedActivityType(e.target.value)}
                >
                  {activityTypes.map((at) => (
                    <option key={at.id} value={String(at.id)}>
                      {at.name} (x{at.multiplier})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Wartość (km)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="np. 5.2"
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  disabled={isSubmitting || !person.team_id}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={isSubmitting || !person.team_id}
                    onClick={() => void handleAddActivity(1)}
                  >
                    {isSubmitting ? <Spinner className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Dodaj</>}
                  </Button>
                  {useAuthStore.getState().isAdmin && (
                    <Button
                      variant="outline"
                      disabled={isSubmitting || !person.team_id}
                      onClick={() => void handleAddActivity(-1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Upload proof */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleProofUploadForLatest(e)}
            />
            <Button
              variant="secondary"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              {isUploading ? "Przesyłanie..." : "Dodaj dowód do ostatniej aktywności"}
            </Button>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <ProgressLineChart data={cumulativeData} title="Twój postęp" color="hsl(var(--chart-1))" />
          <ActivityHeatmap
            activities={activities.map((a) => ({ created_at: a.created_at, points: a.points }))}
            title="Mapa aktywności"
          />
        </div>

        {/* Activity History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Historia aktywności</CardTitle>
                <CardDescription>{activities.length} wpisów</CardDescription>
              </div>
              <div className="flex gap-2">
                {activities.length > 0 && (
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="h-3.5 w-3.5 mr-1" />CSV
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          {showHistory && (
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {activities.map((entry) => {
                    const typeName = activityTypes.find((t) => t.id === entry.activity_type_id)?.name ?? "?";
                    return (
                      <div key={entry.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-muted-foreground w-20 shrink-0">
                            {new Date(entry.created_at).toLocaleDateString("pl-PL")}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{typeName}</span>
                          <span className={`font-mono font-medium ${entry.points >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {entry.points >= 0 ? "+" : ""}{entry.points.toFixed(1)} pkt
                          </span>
                          {entry.proof_url ? (
                            <a href={entry.proof_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">
                              dowód
                            </a>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={(el) => { historyFileRefs.current[entry.id] = el; }}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) await uploadProof(entry.id, file);
                                }}
                              />
                              <button
                                className="text-xs text-muted-foreground hover:text-blue-500"
                                disabled={isUploading}
                                onClick={() => historyFileRefs.current[entry.id]?.click()}
                              >
                                + dowód
                              </button>
                            </>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Usunąć wpis?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Wpis {entry.points.toFixed(1)} pkt z {new Date(entry.created_at).toLocaleDateString("pl-PL")} zostanie trwale usunięty.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anuluj</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void deleteActivity(entry.id)}>Usuń</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">Brak aktywności.</div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Proof Gallery */}
        {proofGallery.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Galeria dowodów</CardTitle>
              <CardDescription>{proofGallery.length} zdjęć</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {proofGallery.map((item) => (
                  <div key={item.id} className="group relative overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md">
                    <a href={item.proof_url!} target="_blank" rel="noreferrer">
                      <img
                        src={item.proof_url!}
                        alt={`Dowód z ${new Date(item.created_at).toLocaleDateString("pl-PL")}`}
                        className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-center text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {new Date(item.created_at).toLocaleDateString("pl-PL")}
                      </div>
                    </a>
                    <div className="p-1.5">
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
