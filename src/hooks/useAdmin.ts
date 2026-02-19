"use client"
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const ADMIN_IDS: string[] = [];

export function useAdmin(personId: string | undefined) {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!personId) {
            setIsAdmin(false);
            return;
        }

        if (ADMIN_IDS.length > 0) {
            setIsAdmin(ADMIN_IDS.includes(personId));
            return;
        }

        const checkAdmin = async () => {
            const { data, error } = await supabase
                .from("People")
                .select("is_admin")
                .eq("id", personId)
                .single();

            if (!error && data && data.is_admin) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        };

        void checkAdmin();
    }, [personId]);

    return isAdmin;
}
