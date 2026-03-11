"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { ProofComment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";

interface Props {
  activityId: number;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "przed chwilą";
  if (minutes < 60) return `${minutes} min temu`;
  if (hours < 24) return `${hours} godz. temu`;
  if (days === 1) return "wczoraj";
  if (days < 7) return `${days} dni temu`;
  return new Date(dateStr).toLocaleDateString("pl-PL");
}

export function ProofComments({ activityId }: Props) {
  const { session } = useAuthStore();
  const [comments, setComments] = useState<ProofComment[]>([]);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("proof_comments")
      .select("*, people(name)")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: true });
    setComments((data as ProofComment[]) ?? []);
  }, [activityId]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!session || !text.trim()) return;
    setIsSubmitting(true);
    await supabase.from("proof_comments").insert({
      activity_id: activityId,
      person_id: session.user.id,
      text: text.trim().slice(0, 200),
    });
    setText("");
    setIsSubmitting(false);
    await fetchComments();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageSquare className="h-3 w-3" />
        {comments.length > 0 ? `${comments.length}` : ""}
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1">
          {comments.length > 0 && (
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="text-[11px] leading-tight">
                  <span className="font-medium">{c.people?.name ?? "Anonim"}: </span>
                  <span className="text-muted-foreground">{c.text}</span>
                  <span className="text-[9px] text-muted-foreground/60 ml-1">
                    {relativeTime(c.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {session && (
            <div className="flex items-center gap-1">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 200))}
                onKeyDown={handleKeyDown}
                placeholder="Dodaj komentarz..."
                className="h-6 text-[11px] px-2"
                maxLength={200}
                disabled={isSubmitting}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                disabled={isSubmitting || !text.trim()}
                onClick={() => void handleSubmit()}
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
