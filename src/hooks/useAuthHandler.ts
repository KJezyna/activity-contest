"use client"
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export function useAuthHandler(
    setSession: (session: Session | null) => void,
    updatePerson: () => void,
    gallery?: () => void,
) {
    const callbacksRef = useRef({ setSession, updatePerson, gallery });
    callbacksRef.current = { setSession, updatePerson, gallery };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            callbacksRef.current.setSession(session);

            if (session) {
                callbacksRef.current.updatePerson();
                callbacksRef.current.gallery?.();
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            callbacksRef.current.setSession(session);

            if (session) {
                callbacksRef.current.updatePerson();
                callbacksRef.current.gallery?.();
            }
        });

        return () => subscription.unsubscribe();
    }, []);
}
