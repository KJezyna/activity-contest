import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/types";

interface AuthState {
  session: Session | null;
  person: Person | null;
  isAdmin: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshPerson: () => Promise<void>;
  updateName: (name: string) => Promise<{ success: boolean; message: string }>;
  updateTeam: (teamId: number | null) => Promise<{ success: boolean; message: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  person: null,
  isAdmin: false,
  isLoading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session });
    if (session) await get().refreshPerson();
    set({ isLoading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
      if (session) {
        void get().refreshPerson();
      } else {
        set({ person: null, isAdmin: false });
      }
    });
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Zalogowano!" };
  },

  register: async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) return { success: false, message: error.message };

    if (data.user) {
      const { error: profileError } = await supabase
        .from("people")
        .insert({ id: data.user.id, name: displayName.trim() });

      if (profileError) {
        console.error(profileError);
        return { success: false, message: "Nie udało się utworzyć profilu." };
      }
    }

    return { success: true, message: "Konto utworzone!" };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, person: null, isAdmin: false });
  },

  refreshPerson: async () => {
    const session = get().session;
    if (!session) return;

    const { data, error } = await supabase
      .from("people")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch person:", error.message);
      return;
    }

    if (!data) {
      set({ person: null, isAdmin: false });
      return;
    }

    set({
      person: data as Person,
      isAdmin: data.is_admin ?? false,
    });
  },

  updateName: async (name) => {
    const session = get().session;
    if (!session) return { success: false, message: "Nie zalogowano." };

    const { error } = await supabase
      .from("people")
      .update({ name: name.trim() })
      .eq("id", session.user.id);

    if (error) return { success: false, message: "Nie udało się zmienić nazwy." };

    await get().refreshPerson();
    return { success: true, message: "Nazwa zmieniona!" };
  },

  updateTeam: async (teamId) => {
    const session = get().session;
    if (!session) return { success: false, message: "Nie zalogowano." };

    const { error } = await supabase
      .from("people")
      .update({ team_id: teamId })
      .eq("id", session.user.id);

    if (error) return { success: false, message: "Nie udało się zmienić zespołu." };

    await get().refreshPerson();
    return { success: true, message: "Zespół zmieniony!" };
  },
}));
