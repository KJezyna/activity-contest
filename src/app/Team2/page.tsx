"use client"
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardFooter, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Input} from "@/components/ui/input";
import {Progress} from "@/components/ui/progress";
import {useTeamData} from "@/hooks/useTeamData";
import { TriangleAlert, ImagePlusIcon, Trash2 } from "lucide-react";
import React, {useRef} from "react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {useSessionAndStats} from "@/hooks/sessionAndStats";
import { Spinner } from "@/components/ui/spinner";

export default function Home(){

    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    const {
        session,
        setSession,
        stats,
        setStats
    } = useSessionAndStats();

    const {
        results,
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
    } = useTeamData(3, session?.user.id);

    useEffect(() => {
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
                gallery();
            }
        });

        if (!stats && session) {
            updatePerson();
        }

        return () => subscription.unsubscribe();
    }, [stats]);

    return (
        <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="mx-auto w-full max-w-4xl">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-4 sm:mb-0">
                                <CardTitle>Red Team</CardTitle>
                                <CardDescription>
                                    Detailed view of the Red Team&apos;s activity.
                                </CardDescription>
                            </div>
                            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                            <a href="/">
                                <Button className="w-fit border hover:bg-gray-700">Back to Main</Button>
                            </a>
                            {stats ?
                                (<Button className="w-fit border hover:bg-gray-700" onClick={() => setStats(false)}>
                                    {!session? ("Sign up / Log in") : ("Profile")}
                                </Button>)
                                :
                                (<Button className="w-fit border hover:bg-gray-700" onClick={() => window.location.reload()}>Team activity</Button>)
                            }
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
                                                    </CardContent>
                                                    <CardFooter className="flex justify-between gap-2">
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            ref={(el) => { fileInputRefs.current[Number(row.id)] = el; }}
                                                            onChange={(e) => uploadDistanceProof(e)}
                                                        />
                                                        <Button
                                                            variant="secondary"
                                                            className="grow w-fit border hover:bg-gray-200"
                                                            disabled={useUploading === row.id}
                                                            onClick={() => fileInputRefs.current[Number(row.id)]?.click()}
                                                        >
                                                            <ImagePlusIcon className="mr-2 h-4 w-4"/>
                                                            {useUploading === row.id ? "Uploading..." : "Upload Proof"}
                                                        </Button>
                                                    </CardFooter>
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
                                                        onClick={handleLogout}>Logout</Button>
                                            </div>
                                </div>
                            )}
                        </CardContent>) :
                        (<CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[30%]">Participant</TableHead>
                                        <TableHead className="w-[40%] text-center">Contribution</TableHead>
                                        <TableHead className="w-[30%] text-right">Total Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.length > 0 ? (
                                        results.map((row) => (
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
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                <div className="flex items-center justify-center">
                                                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                                                    <span>Loading data...</span>
                                                </div>
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
