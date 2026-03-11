"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { supabase } from "@/lib/supabase";
import type { ActivityType } from "@/lib/types";
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

export default function AdminActivitiesPage() {
  const { isAdmin, session } = useAuthStore();
  const { activityTypes, loadAppData } = useAppStore();
  const router = useRouter();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMultiplier, setEditMultiplier] = useState("1");
  const [editIcon, setEditIcon] = useState("activity");
  const [newName, setNewName] = useState("");
  const [newMultiplier, setNewMultiplier] = useState("1");
  const [newIcon, setNewIcon] = useState("activity");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!session || !isAdmin) router.replace("/");
  }, [session, isAdmin, router]);

  if (!isAdmin) return null;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const mult = parseFloat(newMultiplier);
    if (isNaN(mult) || mult <= 0) { toast.error("Podaj prawidłowy mnożnik."); return; }

    const { error } = await supabase.from("activity_types").insert({
      name: newName.trim(),
      multiplier: mult,
      icon: newIcon.trim() || "activity",
    });
    if (error) { toast.error("Błąd dodawania."); return; }
    toast.success("Typ dodany!");
    setNewName(""); setNewMultiplier("1"); setNewIcon("activity");
    setIsAdding(false);
    await loadAppData();
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;
    const mult = parseFloat(editMultiplier);
    if (isNaN(mult) || mult <= 0) { toast.error("Podaj prawidłowy mnożnik."); return; }

    const { error } = await supabase.from("activity_types").update({
      name: editName.trim(),
      multiplier: mult,
      icon: editIcon.trim() || "activity",
    }).eq("id", id);
    if (error) { toast.error("Błąd edycji."); return; }
    toast.success("Zapisano!");
    setEditingId(null);
    await loadAppData();
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("activity_types").delete().eq("id", id);
    if (error) { toast.error("Nie można usunąć:" + error.message); return; }
    toast.success("Typ usunięty.");
    await loadAppData();
  };

  const startEdit = (at: ActivityType) => {
    setEditingId(at.id);
    setEditName(at.name);
    setEditMultiplier(String(at.multiplier));
    setEditIcon(at.icon);
  };

  return (
    <PageTransition>
      <div className="grid gap-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Typy aktywności</h1>
          <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-1" />Nowy typ
          </Button>
        </div>

        {isAdding && (
          <Card>
            <CardHeader><CardTitle className="text-base">Nowy typ aktywności</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Nazwa</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="np. Bieganie" />
                </div>
                <div className="grid gap-2">
                  <Label>Mnożnik</Label>
                  <Input type="number" step="0.1" min="0.1" value={newMultiplier} onChange={(e) => setNewMultiplier(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Ikona (Lucide)</Label>
                  <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="activity" />
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
          {activityTypes.map((at) => (
            <Card key={at.id}>
              <CardContent className="pt-6">
                {editingId === at.id ? (
                  <div className="grid gap-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nazwa" />
                      <Input type="number" step="0.1" min="0.1" value={editMultiplier} onChange={(e) => setEditMultiplier(e.target.value)} />
                      <Input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} placeholder="Ikona" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void handleEdit(at.id)}>
                        <Save className="h-3.5 w-3.5 mr-1" />Zapisz
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5 mr-1" />Anuluj
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{at.name}</span>
                      <span className="text-sm px-2 py-0.5 rounded-full bg-muted font-mono">x{at.multiplier}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(at)}>
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
                            <AlertDialogTitle>Usunąć &ldquo;{at.name}&rdquo;?</AlertDialogTitle>
                            <AlertDialogDescription>Nie można usunąć typu, który jest używany w aktywnościach.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDelete(at.id)}>Usuń</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
