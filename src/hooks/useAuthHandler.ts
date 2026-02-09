"use client"
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export function useAuthHandler(
    setSession: (session: Session | null) => void,
    updatePerson: () => void,
    stats: boolean,
    session: Session | null
) {
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);

            if (session) {
                updatePerson();
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);

            if (session) {
                updatePerson();
            }
        });

        if (!stats && session) {
            updatePerson();
        }

        return () => subscription.unsubscribe();
    }, [stats, session, setSession, updatePerson]);
}
