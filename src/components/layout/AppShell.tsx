"use client";

import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationListener } from "@/components/NotificationListener";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import { Spinner } from "@/components/ui/spinner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { initialize, isLoading: authLoading } = useAuthStore();
  const { loadAppData, isLoaded } = useAppStore();

  useEffect(() => {
    const init = async () => {
      await initialize();
      await loadAppData();
    };
    void init();
  }, [initialize, loadAppData]);

  if (authLoading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Breadcrumbs />
      <NotificationListener />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
