"use client"
import {useState} from "react";
import {Session} from "@supabase/supabase-js";

export function useSessionAndStats() {
    const [session, setSession] = useState<Session | null>(null);
    const [stats, setStats] = useState<boolean>(true);

    return {
        session,
        setSession,
        stats,
        setStats
    };
}
