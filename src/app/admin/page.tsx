"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/layout/PageTransition";
import { Shield, Users, Activity, Settings, Shuffle, History } from "lucide-react";

const ADMIN_PAGES = [
  { href: "/admin/teams", title: "Zespoły", desc: "Tworzenie, edycja i usuwanie zespołów.", icon: <Users className="h-6 w-6" /> },
  { href: "/admin/activities", title: "Typy aktywności", desc: "Zarządzanie typami aktywności i mnożnikami.", icon: <Activity className="h-6 w-6" /> },
  { href: "/admin/config", title: "Konfiguracja", desc: "Progi nieaktywności i inne ustawienia.", icon: <Settings className="h-6 w-6" /> },
  { href: "/admin/randomizer", title: "Losowanie zespołów", desc: "Losowe przydzielanie graczy do zespołów.", icon: <Shuffle className="h-6 w-6" /> },
  { href: "/admin/history", title: "Historia zmian", desc: "Log zmian zespołów użytkowników.", icon: <History className="h-6 w-6" /> },
];

export default function AdminPage() {
  const { isAdmin, session } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!session || !isAdmin) router.replace("/");
  }, [session, isAdmin, router]);

  if (!isAdmin) return null;

  return (
    <PageTransition>
      <div className="grid gap-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Panel administratora
        </h1>
        <div className="grid sm:grid-cols-2 gap-4">
          {ADMIN_PAGES.map((page) => (
            <Link key={page.href} href={page.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">{page.icon}</div>
                    {page.title}
                  </CardTitle>
                  <CardDescription>{page.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
