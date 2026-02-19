"use client"
import { supabase } from "@/lib/supabase";
import React, { useState } from "react";
import imageCompression from "browser-image-compression";

export interface IPersonData {
    id: string;
    name: string;
    distance: number;
    team: number | null;
}

export interface IProofData {
    created_at: string;
    distance_proof: string;
}

export interface IHistoryEntry {
    id: number;
    km: number;
    created_at: string;
    distance_proof: string | null;
}

export function usePlayerProfile(personId: string | undefined) {
    const [personResult, setPersonResult] = useState<IPersonData[]>([]);
    const [inputValues, setInputValues] = useState<Record<number, string>>({});
    const [teamValue, setTeamValue] = useState<string>("1");
    const [multiplier, setMultiplier] = useState<number>(2);
    const [proof, setProof] = useState<IProofData[]>([]);
    const [useUploading, setUseUploading] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [history, setHistory] = useState<IHistoryEntry[]>([]);

    const InputChange = (id: number, value: string) => {
        setInputValues(prev => ({ ...prev, [id]: value }));
    };

    const updatePerson = async (): Promise<IPersonData[] | undefined> => {
        if (!personId) return;

        const { data: personData, error: personError } = await supabase
            .from("PeopleDistances")
            .select("*")
            .eq("person", personId);

        if (personError) {
            console.error(personError.message);
            return;
        }

        if (personData) {
            const formattedData: IPersonData[] = personData.map((item) => ({
                id: String(item.person),
                name: item.Name,
                distance: item.total_distance,
                team: item.team ?? null,
            }));
            setPersonResult(formattedData);
        }
    };

    const modifyDistance = async (DistanceValue: number, Mult: number, sign: 1 | -1): Promise<{ success: boolean; message: string }> => {
        if (isNaN(DistanceValue) || DistanceValue === 0) {
            return { success: false, message: "Enter a valid distance." };
        }

        setIsSubmitting(true);
        try {
            const { data: dataId, error: dataIdError } = await supabase
                .from("Distance")
                .select("team")
                .eq("person", personId)
                .limit(1)
                .single();

            if (dataIdError) {
                console.error(dataIdError);
                return { success: false, message: "Failed to fetch team data." };
            }

            if (dataId.team === null) {
                return { success: false, message: "Select a team before adding activity." };
            }

            const { error } = await supabase
                .from("Distance")
                .insert({
                    person: personId,
                    km: sign * DistanceValue * Mult,
                    team: dataId.team
                });

            if (error) {
                console.error(error.message, error.hint);
                return { success: false, message: "Failed to save distance." };
            }

            setInputValues({});
            await updatePerson();
            await fetchHistory();
            return { success: true, message: sign > 0 ? `+${(DistanceValue * Mult).toFixed(2)} pts added.` : `${(DistanceValue * Mult).toFixed(2)} pts subtracted.` };
        } catch (err) {
            console.error(err);
            return { success: false, message: "Network error. Please try again." };
        } finally {
            setIsSubmitting(false);
        }
    };

    const UpdateDistance = (DistanceValue: number, Mult: number) =>
        modifyDistance(DistanceValue, Mult, 1);

    const SubtractDistance = (DistanceValue: number, Mult: number) =>
        modifyDistance(DistanceValue, Mult, -1);

    const uploadDistanceProof = async (event: React.ChangeEvent<HTMLInputElement>): Promise<{ success: boolean; message: string }> => {
        const file = event.target.files?.[0];
        if (!file) return { success: false, message: "No file selected." };

        setUseUploading(personId);

        const settings = {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1280,
            useWebWorker: true
        };

        try {
            const { data: dateAndTime, error: dateAndTimeError } = await supabase
                .from("Distance")
                .select("created_at, distance_proof")
                .order("created_at", { ascending: false })
                .eq("person", personId)
                .limit(1)
                .single();

            if (dateAndTimeError) {
                console.error(dateAndTimeError.message);
                return { success: false, message: "Failed to find latest entry." };
            }

            if (dateAndTime.distance_proof !== null) {
                return { success: false, message: "Add distance first before uploading proof." };
            }

            const compressedFile = await imageCompression(file, settings);
            const fileName = `proof/${personId}/${Date.now()}_screen.jpg`;

            const { error: bucketError } = await supabase.storage
                .from("distance_proofs")
                .upload(fileName, compressedFile);

            if (bucketError) {
                console.error(bucketError);
                return { success: false, message: "Failed to upload file." };
            }

            const { data: urlData } = supabase.storage
                .from("distance_proofs")
                .getPublicUrl(fileName);

            const { error: dbError } = await supabase
                .from("Distance")
                .update({ distance_proof: urlData.publicUrl })
                .eq("created_at", dateAndTime.created_at);

            if (dbError) {
                console.error(dbError);
                return { success: false, message: "Failed to save proof URL." };
            }

            await updatePerson();
            await gallery();
            await fetchHistory();
            return { success: true, message: "Proof uploaded!" };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Upload failed. Please try again." };
        } finally {
            setUseUploading(undefined);
        }
    };

    const uploadProofForEntry = async (file: File, createdAt: string): Promise<{ success: boolean; message: string }> => {
        setUseUploading(personId);

        const settings = {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1280,
            useWebWorker: true
        };

        try {
            const compressedFile = await imageCompression(file, settings);
            const fileName = `proof/${personId}/${Date.now()}_screen.jpg`;

            const { error: bucketError } = await supabase.storage
                .from("distance_proofs")
                .upload(fileName, compressedFile);

            if (bucketError) {
                console.error(bucketError);
                return { success: false, message: "Failed to upload file." };
            }

            const { data: urlData } = supabase.storage
                .from("distance_proofs")
                .getPublicUrl(fileName);

            const { error: dbError } = await supabase
                .from("Distance")
                .update({ distance_proof: urlData.publicUrl })
                .eq("person", personId)
                .eq("created_at", createdAt);

            if (dbError) {
                console.error(dbError);
                return { success: false, message: "Failed to save proof URL." };
            }

            await gallery();
            await fetchHistory();
            return { success: true, message: "Proof uploaded!" };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Upload failed. Please try again." };
        } finally {
            setUseUploading(undefined);
        }
    };

    const updateTeam = async (selectedTeamId: number): Promise<{ success: boolean; message: string }> => {
        setIsSubmitting(true);
        try {
            const { error: teamError } = await supabase
                .from("Distance")
                .update({
                    team: selectedTeamId === 1 ? null : selectedTeamId
                })
                .eq("person", personId);

            if (teamError) {
                console.error(teamError.message);
                return { success: false, message: "Failed to update team." };
            }

            await updatePerson();
            return { success: true, message: "Team selected!" };
        } catch (err) {
            console.error(err);
            return { success: false, message: "Network error. Please try again." };
        } finally {
            setIsSubmitting(false);
        }
    };

    const gallery = async () => {
        if (!personId) return;

        const { data: galleryData, error: galleryError } = await supabase
            .from("Distance")
            .select("created_at, distance_proof")
            .eq("person", personId)
            .not("distance_proof", "is", null)
            .order("created_at", { ascending: false });

        if (galleryError) {
            console.error(galleryError.message);
            return;
        }

        const formatted: IProofData[] = galleryData.map((item) => ({
            created_at: item.created_at,
            distance_proof: item.distance_proof
        }));
        setProof(formatted);
    };

    const deleteProof = async (imageUrl: string, createdAt: string): Promise<{ success: boolean; message: string }> => {
        setUseUploading(personId);
        try {
            const path = imageUrl.split("distance_proofs/")[1];
            if (!path) {
                return { success: false, message: "Wrong file path." };
            }

            const { error: storageError } = await supabase.storage
                .from("distance_proofs")
                .remove([path]);

            if (storageError) {
                console.error(storageError.message);
                return { success: false, message: "Failed to delete file." };
            }

            const { error: dbError } = await supabase
                .from("Distance")
                .update({ distance_proof: null })
                .eq("person", personId)
                .eq("created_at", createdAt);

            if (dbError) {
                console.error(dbError.message);
                return { success: false, message: "Failed to update database." };
            }

            await updatePerson();
            await gallery();
            await fetchHistory();
            return { success: true, message: "Photo deleted." };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Delete failed. Please try again." };
        } finally {
            setUseUploading(undefined);
        }
    };

    const deleteDistanceEntry = async (entryId: number): Promise<{ success: boolean; message: string }> => {
        try {
            const { data: entry, error: fetchError } = await supabase
                .from("Distance")
                .select("distance_proof")
                .eq("id", entryId)
                .single();

            if (fetchError) {
                return { success: false, message: "Entry not found." };
            }

            if (entry.distance_proof) {
                const path = entry.distance_proof.split("distance_proofs/")[1];
                if (path) {
                    await supabase.storage.from("distance_proofs").remove([path]);
                }
            }

            const { error } = await supabase
                .from("Distance")
                .delete()
                .eq("id", entryId)
                .eq("person", personId);

            if (error) {
                console.error(error.message);
                return { success: false, message: "Failed to delete entry." };
            }

            await updatePerson();
            await gallery();
            await fetchHistory();
            return { success: true, message: "Entry deleted." };
        } catch (err) {
            console.error(err);
            return { success: false, message: "Network error. Please try again." };
        }
    };

    const fetchHistory = async () => {
        if (!personId) return;

        const { data, error } = await supabase
            .from("Distance")
            .select("id, km, created_at, distance_proof")
            .eq("person", personId)
            .neq("km", 0)
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error.message);
            return;
        }

        setHistory(data ?? []);
    };

    const fetchStreak = (): number => {
        if (history.length === 0) return 0;

        const uniqueDays = new Set(
            history.map(e => new Date(e.created_at).toDateString())
        );
        const sortedDays = Array.from(uniqueDays)
            .map(d => new Date(d))
            .sort((a, b) => b.getTime() - a.getTime());

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < sortedDays.length; i++) {
            const expected = new Date(today);
            expected.setDate(expected.getDate() - i);
            expected.setHours(0, 0, 0, 0);

            const day = new Date(sortedDays[i]);
            day.setHours(0, 0, 0, 0);

            if (day.getTime() === expected.getTime()) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    };

    return {
        personResult,
        inputValues,
        InputChange,
        UpdateDistance,
        SubtractDistance,
        uploadDistanceProof,
        uploadProofForEntry,
        useUploading,
        isSubmitting,
        updatePerson,
        updateTeam,
        teamValue,
        setTeamValue,
        multiplier,
        setMultiplier,
        proof,
        gallery,
        deleteProof,
        deleteDistanceEntry,
        history,
        fetchHistory,
        fetchStreak,
    };
}
