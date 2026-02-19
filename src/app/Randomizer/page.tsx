"use client"
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import React, {useEffect, useState} from "react";
import {supabase} from "@/lib/supabase";
import {TEAMS} from "@/lib/teamConfig";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import { UserIcon } from "lucide-react";
import {toast} from "sonner";
import {Spinner} from "@/components/ui/spinner";

interface IPeople {
    id: string;
    person: string;
}

export default function Home(){

    const [PeopleArray, setPeopleArray] = useState<IPeople[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [teams, setTeams] = useState<{ blue: IPeople[], red: IPeople[] } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleCheckboxChange = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleRandomize = () => {
        const selectedPeople = PeopleArray.filter(p => selectedIds.includes(p.id));

        if (selectedPeople.length < 2) {
            toast.error("Select at least 2 people!");
            return;
        }

        const shuffled = [...selectedPeople];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const mid = Math.ceil(shuffled.length / 2);
        setTeams({
            blue: shuffled.slice(0, mid),
            red: shuffled.slice(mid)
        });
    };

    const saveTeamsToDatabase = async () => {
        if (!teams) return;
        setIsSaving(true);

        const blueIds = teams.blue.map((p) => p.id);
        const redIds = teams.red.map((p) => p.id);

        try {
            const { error: teamError } = await supabase
                .from("Distance")
                .update({ team: null})
                .neq("id", -1);

            if (teamError) {
                console.error(teamError);
                toast.error("Failed to reset teams.");
                return;
            }

            const { error: blueError } = await supabase
                .from("Distance")
                .update({ team: TEAMS.team1.teamId })
                .in("person", blueIds);

            if (blueError) {
                console.error(blueError);
                toast.error("Failed to assign Blue Team.");
                return;
            }

            const { error: redError } = await supabase
                .from("Distance")
                .update({ team: TEAMS.team2.teamId })
                .in("person", redIds);

            if (redError) {
                console.error(redError);
                toast.error("Failed to assign Red Team.");
                return;
            }

            toast.success("Teams saved successfully!");
            window.location.href = "/";
        } catch (err) {
            console.error("Error saving teams:", err);
            toast.error("Failed to save teams.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleAll = () => {
        if (selectedIds.length === PeopleArray.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(PeopleArray.map(p => p.id));
        }
    };

    useEffect(() => {
        const selectPeople = async () => {

            const {data: res, error: resError} = await supabase
                .from("People")
                .select("*")

            if (resError) {
                console.error(resError.message);
                return;
            }

            if (res) {
                const FormattedRes: IPeople[] = res.map((item) => ({
                    id: item.id,
                    person: item.Name
                }));
                setPeopleArray(FormattedRes);
            }
        }
        void selectPeople();
    }, []);

    return(
        <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4">
        <div className="w-full max-w-4xl p-4">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                        <CardTitle>Team Randomizer</CardTitle>
                        <CardDescription>
                            Select participants from the list below to randomize into two teams.
                        </CardDescription>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a href="/">
                        <Button className="border hover:bg-gray-700">Back to Main</Button>
                    </a>
                </CardHeader>

                <CardContent className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Participants</CardTitle>
                            <CardDescription>Select the people to randomize.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4"
                                                onChange={toggleAll}
                                                checked={selectedIds.length === PeopleArray.length && PeopleArray.length > 0}
                                            />
                                        </TableHead>
                                        <TableHead className="font-bold">Name</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {PeopleArray.length > 0 ? (
                                        PeopleArray.map((row) => (
                                            <TableRow key={row.id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(row.id)}
                                                        onChange={() => handleCheckboxChange(row.id)}
                                                        className="h-4 w-4"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{row.person}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center">
                                                <p className="text-muted-foreground">No participants found.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        <Button
                            onClick={handleRandomize}
                            className="border hover:bg-gray-700"
                            disabled={selectedIds.length < 2}
                            size="lg"
                        >
                            Randomize Selected ({selectedIds.length})
                        </Button>

                        {teams && (
                            <div className="grid gap-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="border-blue-500">
                                        <CardHeader className="bg-blue-500 text-white">
                                            <CardTitle>Blue Team</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <ul className="space-y-2">
                                                {teams.blue.map((p) => (<li key={p.id} className="flex items-center gap-2"><UserIcon className="h-4 w-4" />{p.person}</li>))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-red-500">
                                        <CardHeader className="bg-red-500 text-white">
                                            <CardTitle>Red Team</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <ul className="space-y-2">
                                                {teams.red.map((p) => (<li key={p.id} className="flex items-center gap-2"><UserIcon className="h-4 w-4" />{p.person}</li>))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                                <Button
                                    onClick={saveTeamsToDatabase}
                                    className="border hover:bg-gray-200"
                                    size="lg"
                                    variant="secondary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? <><Spinner className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Teams to Database"}
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        </main>
    );
}
