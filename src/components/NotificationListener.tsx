"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export function NotificationListener() {
  const session = useAuthStore((s) => s.session);
  const person = useAuthStore((s) => s.person);

  useEffect(() => {
    if (!session || !person) return;

    const userId = session.user.id;
    const teamId = person.team_id;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activities",
        },
        async (payload) => {
          const activity = payload.new as {
            id: number;
            person_id: string;
            team_id: number | null;
            points: number;
          };

          if (activity.person_id === userId) return;
          if (activity.team_id !== teamId) return;

          const { data: personData } = await supabase
            .from("people")
            .select("name")
            .eq("id", activity.person_id)
            .maybeSingle();

          const name = personData?.name ?? "Ktoś";
          const points = activity.points.toFixed(1);
          toast(`${name} dodał aktywność (+${points} pkt)`);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "proof_reactions",
        },
        async (payload) => {
          const reaction = payload.new as {
            id: number;
            activity_id: number;
            person_id: string;
          };

          if (reaction.person_id === userId) return;

          const { data: activityData } = await supabase
            .from("activities")
            .select("person_id")
            .eq("id", reaction.activity_id)
            .maybeSingle();

          if (activityData?.person_id !== userId) return;

          toast("Ktoś zareagował na Twój dowód 👍");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "proof_comments",
        },
        async (payload) => {
          const comment = payload.new as {
            id: number;
            activity_id: number;
            person_id: string;
          };

          if (comment.person_id === userId) return;

          const { data: activityData } = await supabase
            .from("activities")
            .select("person_id")
            .eq("id", comment.activity_id)
            .maybeSingle();

          if (activityData?.person_id !== userId) return;

          toast("Ktoś skomentował Twój dowód");
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, person]);

  return null;
}
