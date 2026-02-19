"use client"
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {supabase} from "@/lib/supabase";
import React, {useEffect, useState} from "react";
import {ChartPieSimple} from "@/components/ui/PieChart";
import {useSessionAndStats} from "@/hooks/sessionAndStats";
import {useAuth} from "@/hooks/useAuth";
import {usePlayerProfile} from "@/hooks/usePlayerProfile";
import {useAdmin} from "@/hooks/useAdmin";
import {useAuthHandler} from "@/hooks/useAuthHandler";
import {AuthForms} from "@/components/AuthForms";
import {ProfileSection} from "@/components/ProfileSection";
import {TEAMS} from "@/lib/teamConfig";
import {Trophy} from "lucide-react";

interface LeaderboardEntry {
    name: string;
    distance: number;
    team: number | null;
}

export default function Home() {

    const {
        session,
        setSession,
        stats,
        setStats
    } = useSessionAndStats();

    const auth = useAuth();
    const profile = usePlayerProfile(session?.user.id);
    const isAdmin = useAdmin(session?.user.id);

    const [team1, setTeam1] = useState(0);
    const [team2, setTeam2] = useState(0);
    const [team1val, setTeam1val] = useState(0);
    const [team2val, setTeam2val] = useState(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useAuthHandler(setSession, profile.updatePerson, () => { void profile.gallery(); void profile.fetchHistory(); });

    useEffect(() => {
        const getData = async () => {
            const {data: data1, error: error1} = await supabase
                .from('TeamsDistance')
                .select('total_distance')
                .eq('team', TEAMS.team1.teamId)
                .single();

            const {data: data2, error: error2} = await supabase
                .from('TeamsDistance')
                .select('total_distance')
                .eq('team', TEAMS.team2.teamId)
                .single();

            if (data1 && data2) {
                setTeam1val(data1.total_distance);
                setTeam2val(data2.total_distance);

                const sum = data1.total_distance + data2.total_distance;
                if (sum > 0) {
                    const res1 = (data1.total_distance / sum) * 100;
                    const res2 = (data2.total_distance / sum) * 100;
                    setTeam1(parseFloat(res1.toFixed(2)));
                    setTeam2(parseFloat(res2.toFixed(2)));
                } else {
                    setTeam1(50);
                    setTeam2(50);
                }
            }

            if(error1) console.error("Error Team1:", error1.message, error1.hint);
            if(error2) console.error("Error Team2:", error2.message, error2.hint);

            // Leaderboard (#17)
            const { data: lbData } = await supabase
                .from('PeopleDistances')
                .select('Name, total_distance, team')
                .not('team', 'is', null)
                .order('total_distance', { ascending: false })
                .limit(10);

            if (lbData) {
                setLeaderboard(lbData.map(d => ({
                    name: d.Name,
                    distance: d.total_distance,
                    team: d.team,
                })));
            }
        };
        void getData();
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-4xl">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-4 sm:mb-0">
                                <CardTitle>Activity Contest</CardTitle>
                                <CardDescription>
                                    Live results of the team activity contest.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
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
                        (<div>
                            <CardContent>
                                <ChartPieSimple
                                    team1percent={team1}
                                    team2percent={team2}
                                    team1value={team1val}
                                    team2value={team2val}
                                />
                            </CardContent>

                            {/* Leaderboard (#17) */}
                            {leaderboard.length > 0 && (
                                <CardContent>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        <h3 className="font-semibold">Top Players</h3>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-10">#</TableHead>
                                                <TableHead>Player</TableHead>
                                                <TableHead className="text-right">Points</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {leaderboard.map((entry, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <span>{entry.name}</span>
                                                            <span className={`inline-block h-2 w-2 rounded-full ${entry.team === TEAMS.team1.teamId ? "bg-blue-500" : "bg-red-500"}`} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">{entry.distance.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            )}

                            <CardFooter className="flex-col gap-4">
                                <p className="text-sm text-muted-foreground">
                                    View team details:
                                </p>
                                <nav className="flex w-full justify-center gap-4">
                                    <a href="/Team1">
                                        <Button className="bg-blue-600 text-white hover:bg-blue-700">
                                            Blue Team
                                        </Button>
                                    </a>
                                    {isAdmin && (
                                        <a href="/Randomizer">
                                            <Button variant="outline" className={"border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"}>Randomizer</Button>
                                        </a>
                                    )}
                                    <a href="/Team2">
                                        <Button className="bg-red-600 text-white hover:bg-red-700">
                                            Red Team
                                        </Button>
                                    </a>
                                </nav>
                            </CardFooter>
                        </div>)}
                </Card>
            </div>
        </main>
    );
}
