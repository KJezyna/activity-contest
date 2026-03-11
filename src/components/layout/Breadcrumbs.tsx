"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  feed: "Feed",
  leaderboard: "Ranking",
  teams: "Zespoły",
  profile: "Profil",
  admin: "Admin",
  auth: "Logowanie",
  activities: "Aktywności",
  config: "Konfiguracja",
  randomizer: "Losowanie",
  history: "Historia zmian",
  player: "Gracz",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const { getTeamById } = useAppStore();

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");

    let label = ROUTE_LABELS[segment];

    // Dynamic player profile
    if (!label && segments[index - 1] === "player") {
      label = "Profil gracza";
    }

    // Dynamic team name
    if (!label && segments[index - 1] === "teams") {
      const teamId = parseInt(segment);
      if (!isNaN(teamId)) {
        const team = getTeamById(teamId);
        label = team?.name ?? `Zespół #${teamId}`;
      }
    }

    return {
      href,
      label: label ?? segment,
      isLast: index === segments.length - 1,
    };
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground px-4 py-2 max-w-7xl mx-auto">
      <Link href="/" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3" />
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
