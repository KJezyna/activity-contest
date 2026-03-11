"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { ProofReaction } from "@/lib/types";

const EMOJIS = ["👍", "🔥", "💪", "🏆", "❤️"];

interface Props {
  activityId: number;
}

export function ProofReactions({ activityId }: Props) {
  const { session } = useAuthStore();
  const [reactions, setReactions] = useState<ProofReaction[]>([]);

  const fetchReactions = async () => {
    const { data } = await supabase
      .from("proof_reactions")
      .select("*")
      .eq("activity_id", activityId);
    setReactions((data as ProofReaction[]) ?? []);
  };

  useEffect(() => {
    void fetchReactions();
  }, [activityId]);

  const toggleReaction = async (emoji: string) => {
    if (!session) return;
    const existing = reactions.find(
      (r) => r.person_id === session.user.id && r.emoji === emoji
    );

    if (existing) {
      await supabase.from("proof_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("proof_reactions").insert({
        activity_id: activityId,
        person_id: session.user.id,
        emoji,
      });
    }
    await fetchReactions();
  };

  const getCount = (emoji: string) => reactions.filter((r) => r.emoji === emoji).length;
  const hasReacted = (emoji: string) =>
    session ? reactions.some((r) => r.person_id === session.user.id && r.emoji === emoji) : false;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {EMOJIS.map((emoji) => {
        const count = getCount(emoji);
        const active = hasReacted(emoji);
        return (
          <button
            key={emoji}
            onClick={() => void toggleReaction(emoji)}
            disabled={!session}
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs border transition-colors ${
              active
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-transparent border-transparent hover:bg-muted"
            } ${!session ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="font-mono text-[10px]">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
