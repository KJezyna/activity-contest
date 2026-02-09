"use client"
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {supabase} from "@/lib/supabase";
import React, {useEffect, useRef, useState} from "react";
import {ChartPieSimple} from "@/components/ui/PieChart";
import {useSessionAndStats} from "@/hooks/sessionAndStats";
import {useTeamData} from "@/hooks/useTeamData";
import {Input} from "@/components/ui/input";
import {ImagePlusIcon, Trash2} from "lucide-react";
import {Spinner} from "@/components/ui/spinner";

export default function Home() {

    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    const {
        session,
        setSession,
        stats,
        setStats
    } = useSessionAndStats();

    const {
        inputValues,
        personResult,
        InputChange,
        UpdateDistance,
        SubtractDistance,
        uploadDistanceProof,
        useUploading,
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
    } = useTeamData(0, session?.user.id, false)

    const [team1, setTeam1] = useState(0);
    const [team2, setTeam2] = useState(0);
    const [team1val, setTeam1val] = useState(0);
    const [team2val, setTeam2val] = useState(0);

    useEffect(() => {
        const getData = async () => {
            const {data: data1, error: error1} = await supabase
                .from('TeamsDistance')
                .select('total_distance')
                .eq('team', 2)
                .single();

            const {data: data2, error: error2} = await supabase
                .from('TeamsDistance')
                .select('total_distance')
                .eq('team', 3)
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
        };
        void getData();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);

            if (session) {
                updatePerson();
                gallery();
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);

            if (session) {
                updatePerson();
            }
        });

        if (!stats && session) {
            updatePerson();
        }

        return () => subscription.unsubscribe();
    }, [stats]);

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
                                    (<Button className="w-fit border hover:bg-gray-700" onClick={() => window.location.reload()}>Team activity</Button>)
                                }
                            </div>
                        </div>
                    </CardHeader>
                    {!stats ? (<CardContent className="grid gap-6">
                            {!session ? (
                                <div className="grid md:grid-cols-2 gap-8">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Sign Up</CardTitle>
                                            <CardDescription>Create a new account.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4">
                                            <div className="grid gap-2">
                                                <label htmlFor="signup-username">Username</label>
                                                <Input id="signup-username" type="text"
                                                       value={usernameSignUp}
                                                       onChange={(e) => setUsernameSignUp(e.target.value)}
                                                       placeholder="Enter your username"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label htmlFor="signup-password">Password</label>
                                                <Input id="signup-password" type="password"
                                                       value={passwordSignUp}
                                                       onChange={(e) => setPasswordSignUp(e.target.value)}
                                                       placeholder="Enter a password"
                                                />
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" onClick={() => handleRegister(usernameSignUp, passwordSignUp)}>Sign up</Button>
                                        </CardFooter>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Log In</CardTitle>
                                            <CardDescription>Access your account.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4">
                                            <div className="grid gap-2">
                                                <label htmlFor="login-username">Username</label>
                                                <Input id="login-username" type="text"
                                                       value={usernameLogIn}
                                                       onChange={(e) => setUsernameLogIn(e.target.value)}
                                                       placeholder="Enter your username"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label htmlFor="login-password">Password</label>
                                                <Input id="login-password" type="password"
                                                       value={passwordLogIn}
                                                       onChange={(e) => setPasswordLogIn(e.target.value)}
                                                       placeholder="Enter your password"
                                                />
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full border hover:bg-gray-700"
                                                    onClick={() => handleLogin(usernameLogIn, passwordLogIn)}>Log in
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {personResult.length > 0 ?
                                        (personResult.map((row) => (
                                                <div key={row.id} className="grid gap-6">
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle>Your Profile</CardTitle>
                                                            <CardDescription>Manage your team and log your activities.</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="grid gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <p className="text-sm text-muted-foreground">Select your team:</p>
                                                                <select className="w-fit border bg-white p-2 rounded-md"
                                                                        value={teamValue}
                                                                        onChange={(e) => {setTeamValue(e.target.value)}}
                                                                >
                                                                    <option value="1">none</option>
                                                                    <option value="2">blue team</option>
                                                                    <option value="3">red team</option>
                                                                </select>
                                                                <Button className="border hover:bg-gray-700"
                                                                        onClick={() => updateTeam(Number(teamValue))}>Set Team
                                                                </Button>
                                                            </div>
                                                            <div className="flex items-center justify-center gap-2 pt-4 border-t">
                                                                <span className="font-mono text-lg">Total: {row.distance.toFixed(2)} pts</span>
                                                            </div>
                                                            <div className="grid sm:grid-cols-2 gap-4">
                                                                <div className="grid gap-2">
                                                                    <label>Activity Type</label>
                                                                    <select className="bg-white w-full border p-2 rounded-md"
                                                                            value={multiplier}
                                                                            onChange={(e) => {setMultiplier(Number(e.target.value))}}
                                                                    >
                                                                        <option value="2">Running (x2)</option>
                                                                        <option value="1.6">Walking (x1.6)</option>
                                                                        <option value="1.4">Inline Skating (x1.4)</option>
                                                                        <option value="1.25">Cycling (x1.25)</option>
                                                                        <option value="3">Swimming (x3)</option>
                                                                    </select>
                                                                </div>
                                                                <div className="grid gap-2">
                                                                    <label>Distance (km)</label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="e.g., 5.2"
                                                                            min="0"
                                                                            value={inputValues[Number(row.id)] || ""}
                                                                            onChange={(e) => InputChange(Number(row.id), e.target.value)}
                                                                            className="bg-white"
                                                                        />
                                                                        <Button
                                                                            size="icon"
                                                                            className="border hover:bg-gray-700"
                                                                            onClick={() => SubtractDistance(parseFloat(inputValues[Number(row.id)] || "0"), multiplier)}
                                                                        >
                                                                            -
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            className="border hover:bg-gray-700"
                                                                            onClick={() => UpdateDistance(parseFloat(inputValues[Number(row.id)] || "0"), multiplier)}
                                                                        >
                                                                            +
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                ref={(el) => { fileInputRefs.current[Number(row.id)] = el; }}
                                                                onChange={(e) => uploadDistanceProof(e)}
                                                            />
                                                            <Button
                                                                variant="secondary"
                                                                className="border hover:bg-gray-200"
                                                                disabled={useUploading === row.id}
                                                                onClick={() => fileInputRefs.current[Number(row.id)]?.click()}
                                                            >
                                                                <ImagePlusIcon className="mr-2 h-4 w-4"/>
                                                                {useUploading === row.id ? "Uploading..." : "Upload Proof"}
                                                            </Button>
                                                        </CardContent>
                                                    </Card>

                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle>Proof Gallery</CardTitle>
                                                            <CardDescription>Your uploaded activity proofs.</CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {proof.length > 0 ? (
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                                    {proof.map((item, index) => (
                                                                        <div key={index} className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
                                                                            <a href={item.distance_proof} target="_blank" rel="noreferrer">
                                                                                <img
                                                                                    src={item.distance_proof}
                                                                                    alt={`Date of the proof ${new Date(item.created_at).toLocaleDateString()}`}
                                                                                    className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                                                                                />
                                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-center text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                                                    {new Date(item.created_at).toLocaleDateString()}
                                                                                </div>
                                                                            </a>
                                                                            <Button
                                                                                size="icon"
                                                                                variant="destructive"
                                                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                disabled={useUploading !== undefined}
                                                                                onClick={() => {
                                                                                    if(confirm("Are you sure?")) {
                                                                                        deleteProof(item.distance_proof, item.created_at);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Trash2 className="h-4 w-4 text-white"/>
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                                                                    You don&apos;t have any distance proof.
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground flex items-center justify-center">
                                                <Spinner className="mr-2 h-4 w-4 animate-spin" />
                                                <p>Loading your profile...</p>
                                            </div>
                                        )}
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-muted-foreground">Logged in as <b>{session?.user.email?.split('@')[0]}</b></p>
                                        <Button variant="destructive"
                                                className="border hover:bg-red-500 text-white"
                                                onClick={handleLogout}>Logout
                                        </Button>
                                    </div>
                                </div>
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
                                    <a href="/Randomizer">
                                        <Button variant="outline" className={"border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"}>Randomizer</Button>
                                    </a>
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