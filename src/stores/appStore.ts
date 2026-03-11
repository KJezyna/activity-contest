import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Team, ActivityType, AppConfig } from "@/lib/types";

interface AppState {
  teams: Team[];
  activityTypes: ActivityType[];
  config: Record<string, string>;
  isLoaded: boolean;
  loadAppData: () => Promise<void>;
  getTeamById: (id: number) => Team | undefined;
  getConfigValue: (key: string, fallback: string) => string;
}

export const useAppStore = create<AppState>((set, get) => ({
  teams: [],
  activityTypes: [],
  config: {},
  isLoaded: false,

  loadAppData: async () => {
    const [teamsRes, typesRes, configRes] = await Promise.all([
      supabase.from("teams").select("*").order("id"),
      supabase.from("activity_types").select("*").order("name"),
      supabase.from("app_config").select("*"),
    ]);

    if (teamsRes.error) console.error("Failed to load teams:", teamsRes.error.message);
    if (typesRes.error) console.error("Failed to load activity types:", typesRes.error.message);
    if (configRes.error) console.error("Failed to load config:", configRes.error.message);

    const configMap: Record<string, string> = {};
    if (configRes.data) {
      (configRes.data as AppConfig[]).forEach((c) => {
        configMap[c.key] = c.value;
      });
    }

    set({
      teams: (teamsRes.data as Team[]) ?? [],
      activityTypes: (typesRes.data as ActivityType[]) ?? [],
      config: configMap,
      isLoaded: true,
    });
  },

  getTeamById: (id) => get().teams.find((t) => t.id === id),

  getConfigValue: (key, fallback) => get().config[key] ?? fallback,
}));
