"use client"
import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import { processTeamData, ITableData } from "@/hooks/DataMapping";
import imageCompression from "browser-image-compression";

interface IPersonData {
    id: string;
    name: string;
    distance: number;
}

interface IProofData {
    created_at: string;
    distance_proof: string;
}


export function useTeamData(teamId: number, personId: string | undefined, isRequired: boolean = true) {
    const [results, setResults] = useState<ITableData[]>([]);
    const [inputValues, setInputValues] = useState<Record<number, string>>({});
    const [personResult, setPersonResult] = useState<IPersonData[]>([]);
    const [usernameLogIn, setUsernameLogIn] = useState<string>("");
    const [usernameSignUp, setUsernameSignUp] = useState<string>("");
    const [passwordLogIn, setPasswordLogIn] = useState<string>("");
    const [passwordSignUp, setPasswordSignUp] = useState<string>("");
    const [teamValue, setTeamValue] = useState<string>("1");
    const [multiplier, setMultiplier] = useState<number>(2);
    const [proof, setProof] = useState<IProofData[]>([]);

    useEffect(() => {
        if (!isRequired) return;
        const getData = async () => {
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

            if (error1) console.error("error1:", error1.message, error1.hint);
            if (error2) console.error("error2:", error2.message, error2.hint);
        };
        void getData();
    }, [teamId]);

    const InputChange = (id: number, value: string) => {
        setInputValues(prev => ({ ...prev, [id]: value }));
    };

    const UpdateDistance = async (DistanceValue: number, Mult: number) => {
        if(isNaN(DistanceValue) || DistanceValue === 0) return;

        const { data: dataId, error: dataIdError } = await supabase
            .from("Distance")
            .select("team")
            .eq("person", personId)
            .limit(1)
            .single();

        if (dataIdError) {
            console.error(dataIdError);
            return;
        }

        const { error } = await supabase
            .from("Distance")
            .insert({
                person: personId,
                km: DistanceValue * Mult,
                team: dataId.team
            });

        if (error) console.log(error.message, error.hint);

        await updatePerson();
    };

    const SubtractDistance = async (DistanceValue: number, Mult: number) => {
        if(isNaN(DistanceValue) || DistanceValue === 0) return;

        const { data: dataId, error: dataIdError } = await supabase
            .from("Distance")
            .select("team")
            .eq("person", personId)
            .limit(1)
            .single();

        if (dataIdError) {
            console.error(dataIdError);
            return;
        }

        const { error } = await supabase
            .from("Distance")
            .insert({
                person: personId,
                km: -DistanceValue * Mult,
                team: dataId.team
            });

        if (error) console.error(error.message, error.hint);

        await updatePerson();
    };

    const [useUploading, setUseUploading] = useState<string | undefined>(undefined);

    const uploadDistanceProof = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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
                .order("created_at", {ascending: false})
                .eq("person", personId)
                .limit(1)
                .single();

            if (dateAndTimeError) {
                console.error(dateAndTimeError.message);
                return;
            }

            if (dateAndTime.distance_proof === null) {

                const compressedFile = await imageCompression(file, settings);

                const fileName = `proof/${personId}/${Date.now()}_screen.jpg`;

                const {error: bucketError} = await supabase.storage
                    .from("distance_proofs")
                    .upload(fileName, compressedFile);

                if (bucketError) {
                    console.error(bucketError);
                    return;
                }

                const {data: urlData} = supabase.storage
                    .from("distance_proofs")
                    .getPublicUrl(fileName);

                const {error: dbError} = await supabase
                    .from("Distance")
                    .update({
                        distance_proof: urlData.publicUrl
                    })
                    .eq("created_at", dateAndTime.created_at);

                if (dbError) {
                    console.error(dbError);
                    return;
                }
            } else {
                alert("Add distance first!")
                return;
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Screen error.");
            return;
        } finally {
            setUseUploading(undefined);
        }

        await updatePerson();
        await gallery();
    };

    const handleRegister = async (nick: string, password: string) => {
        try {
            const fakeEmail = `${nick.toLowerCase().trim()}@fake.mail`;

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: fakeEmail,
                password: password
            });

            if (authError) {
                alert("Register error: " + authError.message);
                return;
            }

            if (authData.user) {
                const { error: userError } = await supabase
                    .from("People")
                    .insert({
                        id: authData.user.id,
                        Name: nick
                    });

                if (userError) {
                    console.error(userError.message);
                    return;
                }

                const { error: distanceError } = await supabase
                    .from("Distance")
                    .insert({
                        km: 0,
                        person: authData.user.id,
                    });

                if (distanceError) {
                    console.error(distanceError.message);
                    return;
                }
            }
        } catch (err) {
            console.error("Critical error:", err);
        }
        alert("User created!");
        window.location.reload();
    };

    const handleLogin = async (nick: string, password: string) => {

        const fakeEmail = `${nick.toLowerCase()}@fake.mail`;

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: fakeEmail,
            password: password
        });

        if (loginError) {
            alert("Error: " + loginError.message);
        }
        window.location.reload();
    };

    const handleLogout = async () => {

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Logout error:", error.message);
        }
    };

    const updatePerson = async () : Promise<IPersonData[] | undefined> => {
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
                distance: item.total_distance
            }));
            setPersonResult(formattedData);
        }
    };

    const updateTeam = async (teamId: number) => {

        if (teamId === 1) {
            const {error: teamError} = await supabase
                .from("Distance")
                .update({
                    team: null
                })
                .eq("person", personId);

            if (teamError) {
                console.error(teamError.message);
                return;
            }
        }
        else {
            const {error: teamError} = await supabase
                .from("Distance")
                .update({
                    team: teamId
                })
                .eq("person", personId);

            if (teamError) {
                console.error(teamError.message);
                return;
            }
        }

        alert("Team selected!");
        window.location.reload();
    };

    const gallery = async () => {
        if (!personId) return;

        const { data: galleryData, error: galleryError } = await supabase
            .from("Distance")
            .select("created_at, distance_proof")
            .eq("person", personId)
            .not("distance_proof", "is", null)
            .order("created_at", {ascending: false});

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

    const deleteProof = async (imageUrl: string, createdAt: string) => {
        try {
            setUseUploading(personId);

            const path = imageUrl.split("distance_proofs/")[1];

            if (!path)  {
                 console.error("Wrong file path.");
                 return;
            }

            const { error: storageError } = await supabase.storage
                .from("distance_proofs")
                .remove([path]);

            if (storageError) {
                console.error(storageError.message);
                return;
            }

            const { error: dbError } = await supabase
                .from("Distance")
                .update({ distance_proof: null })
                .eq("person", personId)
                .eq("created_at", createdAt);

            if (dbError) {
                console.error(dbError.message);
                return;
            }

            alert("Photo deleted.");

        } catch (error) {
            console.error("Error:", error);
            alert("Error: " + error);
        } finally {
            setUseUploading(undefined);
        }

        await updatePerson();
        await gallery();
    };

    return {
        results,
        inputValues,
        personResult,
        InputChange,
        UpdateDistance,
        SubtractDistance,
        uploadDistanceProof,
        useUploading,
        IsUploading: useUploading !== null,
        handleRegister,
        handleLogin,
        handleLogout,
        updatePerson,
        updateTeam,
        usernameLogIn,
        setUsernameLogIn,
        usernameSignUp,
        setUsernameSignUp,
        passwordLogIn,
        setPasswordLogIn,
        passwordSignUp,
        setPasswordSignUp,
        teamValue,
        setTeamValue,
        multiplier,
        setMultiplier,
        proof,
        gallery,
        deleteProof
    };
}
