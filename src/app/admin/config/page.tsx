"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/layout/PageTransition";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";

const CONFIG_ITEMS = [
  {
    key: "inactive_days_threshold",
    label: "Próg nieaktywności (dni)",
    description: "Liczba dni bez aktywności, po których użytkownik jest oznaczany jako nieaktywny.",
    type: "number",
  },
  {
    key: "inactive_percentile_threshold",
    label: "Próg nieaktywności (percentyl %)",
    description: "Użytkownicy w dolnym X% punktów są oznaczani jako nieaktywni.",
    type: "number",
  },
];

export default function AdminConfigPage() {
  const { isAdmin, session } = useAuthStore();
  const { config, loadAppData } = useAppStore();
  const router = useRouter();

  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session || !isAdmin) router.replace("/");
  }, [session, isAdmin, router]);

  useEffect(() => {
    setValues({ ...config });
  }, [config]);

  if (!isAdmin) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const item of CONFIG_ITEMS) {
        const newValue = values[item.key];
        if (newValue !== config[item.key]) {
          const { error } = await supabase
            .from("app_config")
            .update({ value: newValue, updated_at: new Date().toISOString() })
            .eq("key", item.key);
          if (error) {
            toast.error(`Błąd zapisu ${item.label}: ${error.message}`);
            setIsSaving(false);
            return;
          }
        }
      }
      await loadAppData();
      toast.success("Konfiguracja zapisana!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="grid gap-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Konfiguracja
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progi nieaktywności</CardTitle>
            <CardDescription>
              Użytkownik jest oznaczany jako nieaktywny, jeśli spełnia JEDNO z kryteriów poniżej.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {CONFIG_ITEMS.map((item) => (
              <div key={item.key} className="grid gap-2">
                <Label>{item.label}</Label>
                <Input
                  type={item.type}
                  value={values[item.key] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
                  min={item.type === "number" ? "1" : undefined}
                />
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Zapisywanie..." : "Zapisz konfigurację"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
