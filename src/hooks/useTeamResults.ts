"use client"
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { processTeamData, ITableData } from "@/hooks/DataMapping";

export function useTeamResults(teamId: number, isRequired: boolean = true) {
    const [results, setResults] = useState<ITableData[]>([]);
    const [isLoading, setIsLoading] = useState(isRequired);

    const refreshResults = async () => {
        if (!isRequired) return;
        setIsLoading(true);

        const { data: data1, error: error1 } = await supabase
            .from("PeopleDistances")
            .select("*")
            .eq("team", teamId);

        const { data: data2, error: error2 } = await supabase
            .from("TeamsDistance")
            .select("total_distance")
            .eq("team", teamId)
            .single();

        const formatted = processTeamData(data1, data2);
        setResults(formatted);
        setIsLoading(false);

        if (error1) console.error("error1:", error1.message, error1.hint);
        if (error2) console.error("error2:", error2.message, error2.hint);
    };

    useEffect(() => {
        void refreshResults();
    }, [teamId]);

    return { results, isLoading, refreshResults };
}
