"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { supabase } from "@/lib/supabase";
import type { Team } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageTransition } from "@/components/layout/PageTransition";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

export default function AdminTeamsPage() {
  const { isAdmin, session } = useAuthStore();
  const { teams, loadAppData } = useAppStore();
  const router = useRouter();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6B7280");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6B7280");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!session || !isAdmin) router.replace("/");
  }, [session, isAdmin, router]);

  if (!isAdmin) return null;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("teams").insert({ name: newName.trim(), color: newColor });
    if (error) { toast.error("Błąd dodawania."); return; }
    toast.success("Zespół dodany!");
    setNewName("");
    setNewColor("#6B7280");
    setIsAdding(false);
    await loadAppData();
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("teams").update({ name: editName.trim(), color: editColor }).eq("id", id);
    if (error) { toast.error("Błąd edycji."); return; }
    toast.success("Zapisano!");
    setEditingId(null);
    await loadAppData();
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) { toast.error("Błąd usuwania: " + error.message); return; }
    toast.success("Zespół usunięty.");
    await loadAppData();
  };

  const startEdit = (team: Team) => {
    setEditingId(team.id);
    setEditName(team.name);
    setEditColor(team.color);
  };

  return (
    <PageTransition>
      <div className="grid gap-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Zarządzanie zespołami</h1>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-1" />Nowy zespół
          </Button>
        </div>

        {isAdding && (
          <Card>
            <CardHeader><CardTitle className="text-base">Nowy zespół</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nazwa</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nazwa zespołu" />
              </div>
              <div className="grid gap-2">
                <Label>Kolor</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer" />
                  <Input value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-28 font-mono" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void handleAdd()}>
                  <Save className="h-4 w-4 mr-1" />Dodaj
                </Button>
                <Button variant="ghost" onClick={() => setIsAdding(false)}>
                  <X className="h-4 w-4 mr-1" />Anuluj
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardContent className="pt-6">
                {editingId === team.id ? (
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                      <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void handleEdit(team.id)}>
                        <Save className="h-3.5 w-3.5 mr-1" />Zapisz
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5 mr-1" />Anuluj
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="font-medium">{team.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{team.color}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(team)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Usunąć zespół &ldquo;{team.name}&rdquo;?</AlertDialogTitle>
                            <AlertDialogDescription>Członkowie stracą przypisanie do zespołu.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDelete(team.id)}>Usuń</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {teams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Brak zespołów. Dodaj pierwszy!</div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
