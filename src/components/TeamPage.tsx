"use client"
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Progress} from "@/components/ui/progress";
import {useTeamResults} from "@/hooks/useTeamResults";
import {useAuth} from "@/hooks/useAuth";
import {usePlayerProfile} from "@/hooks/usePlayerProfile";
import {useAdmin} from "@/hooks/useAdmin";
import {TriangleAlert, ArrowUpDown} from "lucide-react";
import React, {useEffect, useState} from "react";
import {useSessionAndStats} from "@/hooks/sessionAndStats";
import {useAuthHandler} from "@/hooks/useAuthHandler";
import {AuthForms} from "@/components/AuthForms";
import {ProfileSection} from "@/components/ProfileSection";
import {TeamConfig} from "@/lib/teamConfig";
import {supabase} from "@/lib/supabase";

interface TeamPageProps {
    config: TeamConfig;
}

type SortField = "name" | "percent" | "score";

export default function TeamPage({ config }: TeamPageProps) {

    const {
        session,
        setSession,
        stats,
        setStats
    } = useSessionAndStats();

    const { results, isLoading, refreshResults } = useTeamResults(config.teamId);

    const auth = useAuth();

    const profile = usePlayerProfile(session?.user.id);

    const isAdmin = useAdmin(session?.user.id);

    useAuthHandler(setSession, profile.updatePerson, () => { void profile.gallery(); void profile.fetchHistory(); });

    const [sortField, setSortField] = useState<SortField>("score");
    const [sortAsc, setSortAsc] = useState(false);

    const sortedResults = [...results].sort((a, b) => {
        const mult = sortAsc ? 1 : -1;
        if (sortField === "name") return mult * a.name.localeCompare(b.name);
        return mult * (a[sortField] - b[sortField]);
    });

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(false);
        }
    };

    // Realtime subscription (#10)
    useEffect(() => {
        const channel = supabase
            .channel(`team-${config.teamId}`)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "Distance",
            }, () => {
                void refreshResults();
            })
            .subscribe();

        return () => { void supabase.removeChannel(channel); };
    }, [config.teamId]);

    return (
        <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="mx-auto w-full max-w-4xl">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="mb-4 sm:mb-0">
                                <CardTitle>{config.name}</CardTitle>
                                <CardDescription>
                                    {config.description}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                                <a href="/">
                                    <Button className="w-fit border hover:bg-gray-700">Back to Main</Button>
                                </a>
                                {stats ?
                                    (<Button className="w-fit border hover:bg-gray-700" onClick={() => setStats(false)}>
                                        {!session? ("Sign up / Log in") : ("Profile")}
                                    </Button>)
                                    :
                                    (<Button className="w-fit border hover:bg-gray-700" onClick={() => setStats(true)}>Team activity</Button>)
                                }
                            </div>
                        </div>
                    </CardHeader>
                    {!stats ? (<CardContent className="grid gap-6">
                        {!session ? (
                            <AuthForms
                                usernameSignUp={auth.usernameSignUp} setUsernameSignUp={auth.setUsernameSignUp}
                                passwordSignUp={auth.passwordSignUp} setPasswordSignUp={auth.setPasswordSignUp}
                                usernameLogIn={auth.usernameLogIn} setUsernameLogIn={auth.setUsernameLogIn}
                                passwordLogIn={auth.passwordLogIn} setPasswordLogIn={auth.setPasswordLogIn}
                                handleRegister={auth.handleRegister} handleLogin={auth.handleLogin}
                                isAuthLoading={auth.isAuthLoading}
                            />
                        ) : (
                            <ProfileSection
                                session={session}
                                personResult={profile.personResult}
                                teamValue={profile.teamValue} setTeamValue={profile.setTeamValue}
                                updateTeam={profile.updateTeam}
                                multiplier={profile.multiplier} setMultiplier={profile.setMultiplier}
                                inputValues={profile.inputValues} InputChange={profile.InputChange}
                                UpdateDistance={profile.UpdateDistance} SubtractDistance={profile.SubtractDistance}
                                uploadDistanceProof={profile.uploadDistanceProof}
                                uploadProofForEntry={profile.uploadProofForEntry}
                                useUploading={profile.useUploading}
                                isSubmitting={profile.isSubmitting}
                                proof={profile.proof} deleteProof={profile.deleteProof}
                                deleteDistanceEntry={profile.deleteDistanceEntry}
                                handleLogout={auth.handleLogout}
                                history={profile.history}
                                streak={profile.fetchStreak()}
                                isAdmin={isAdmin}
                            />
                        )}
                    </CardContent>) :
                        (<CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30%]">
                                        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                                            Participant <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-[40%] text-center">
                                        <button className="flex items-center gap-1 mx-auto hover:text-foreground" onClick={() => toggleSort("percent")}>
                                            Contribution <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-[30%] text-right">
                                        <button className="flex items-center gap-1 ml-auto hover:text-foreground" onClick={() => toggleSort("score")}>
                                            Total Points <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                                            <TableCell><div className="h-4 w-full bg-gray-200 rounded animate-pulse" /></TableCell>
                                            <TableCell className="text-right"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : sortedResults.length > 0 ? (
                                    sortedResults.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center justify-between">
                                                    <span>{row.name}</span>
                                                    {row.percent < 10 ? <TriangleAlert className="h-4 w-4 text-red-500" /> : <div className="w-4"/>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="mb-1 text-center text-sm">{row.percent.toFixed(2)}%</div>
                                                <Progress value={row.percent} className={`bg-slate-200 ${row.percent < 10 ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"}`} />
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {row.score.toFixed(2)} points
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No team members yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>)}
                </Card>
            </div>
        </main>
    );
}
