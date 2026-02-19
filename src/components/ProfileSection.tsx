"use client"
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {ImagePlusIcon, Trash2, Flame, Download} from "lucide-react";
import {Spinner} from "@/components/ui/spinner";
import React, {useRef, useState} from "react";
import {Session} from "@supabase/supabase-js";
import {toast} from "sonner";
import {TEAM_OPTIONS} from "@/lib/teamConfig";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type {IPersonData, IProofData, IHistoryEntry} from "@/hooks/usePlayerProfile";

interface ProfileSectionProps {
    session: Session;
    personResult: IPersonData[];
    teamValue: string;
    setTeamValue: (v: string) => void;
    updateTeam: (teamId: number) => Promise<{ success: boolean; message: string }>;
    multiplier: number;
    setMultiplier: (v: number) => void;
    inputValues: Record<number, string>;
    InputChange: (id: number, value: string) => void;
    UpdateDistance: (value: number, mult: number) => Promise<{ success: boolean; message: string }>;
    SubtractDistance: (value: number, mult: number) => Promise<{ success: boolean; message: string }>;
    uploadDistanceProof: (event: React.ChangeEvent<HTMLInputElement>) => Promise<{ success: boolean; message: string }>;
    uploadProofForEntry: (file: File, createdAt: string) => Promise<{ success: boolean; message: string }>;
    useUploading: string | undefined;
    isSubmitting: boolean;
    proof: IProofData[];
    deleteProof: (imageUrl: string, createdAt: string) => Promise<{ success: boolean; message: string }>;
    deleteDistanceEntry: (entryId: number) => Promise<{ success: boolean; message: string }>;
    handleLogout: () => void;
    history: IHistoryEntry[];
    streak: number;
    isAdmin: boolean;
}

export function ProfileSection({
    session, personResult,
    teamValue, setTeamValue, updateTeam,
    multiplier, setMultiplier,
    inputValues, InputChange,
    UpdateDistance, SubtractDistance,
    uploadDistanceProof, uploadProofForEntry, useUploading,
    isSubmitting,
    proof, deleteProof, deleteDistanceEntry,
    handleLogout,
    history, streak, isAdmin,
}: ProfileSectionProps) {
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const historyFileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const [showHistory, setShowHistory] = useState(false);

    const handleAction = async (action: () => Promise<{ success: boolean; message: string }>) => {
        const result = await action();
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const exportCSV = () => {
        if (history.length === 0) return;
        const header = "Date,Distance (km),Points,Proof\n";
        const rows = history.map(e => {
            const date = new Date(e.created_at).toLocaleDateString();
            return `${date},${e.km.toFixed(2)},${e.km.toFixed(2)},${e.distance_proof ? "Yes" : "No"}`;
        }).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-history-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid gap-6">
            {personResult.length > 0 ?
                (personResult.map((row) => (
                    <div key={row.id} className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Your Profile</CardTitle>
                                        <CardDescription>Manage your team and log your activities.</CardDescription>
                                    </div>
                                    {streak > 0 && (
                                        <div className="flex items-center gap-1 text-orange-500 font-semibold">
                                            <Flame className="h-5 w-5" />
                                            <span>{streak} day{streak > 1 ? "s" : ""}</span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="flex items-center gap-4">
                                    <p className="text-sm text-muted-foreground">Select your team:</p>
                                    <select className="w-fit border bg-white p-2 rounded-md"
                                            value={teamValue}
                                            onChange={(e) => {setTeamValue(e.target.value)}}
                                            disabled={isSubmitting}
                                    >
                                        {TEAM_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <Button className="border hover:bg-gray-700"
                                            disabled={isSubmitting}
                                            onClick={() => handleAction(() => updateTeam(Number(teamValue)))}>
                                        {isSubmitting ? <Spinner className="h-4 w-4 animate-spin" /> : "Set Team"}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-center gap-2 pt-4 border-t">
                                    <span className="font-mono text-lg">Total: {row.distance.toFixed(2)} pts</span>
                                </div>

                                {row.team === null && (
                                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                                        Select a team before adding activity.
                                    </div>
                                )}

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
                                                step="0.01"
                                                value={inputValues[Number(row.id)] || ""}
                                                onChange={(e) => InputChange(Number(row.id), e.target.value)}
                                                className="bg-white"
                                                disabled={isSubmitting || row.team === null}
                                            />
                                            {isAdmin && (
                                                <Button
                                                    size="icon"
                                                    className="border hover:bg-gray-700"
                                                    disabled={isSubmitting || row.team === null}
                                                    onClick={() => handleAction(() => SubtractDistance(parseFloat(inputValues[Number(row.id)] || "0"), multiplier))}
                                                >
                                                    -
                                                </Button>
                                            )}
                                            <Button
                                                size="icon"
                                                className="border hover:bg-gray-700"
                                                disabled={isSubmitting || row.team === null}
                                                onClick={() => handleAction(() => UpdateDistance(parseFloat(inputValues[Number(row.id)] || "0"), multiplier))}
                                            >
                                                {isSubmitting ? <Spinner className="h-3 w-3 animate-spin" /> : "+"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    ref={(el) => { fileInputRefs.current[row.id] = el; }}
                                    onChange={async (e) => {
                                        const result = await uploadDistanceProof(e);
                                        if (result.success) toast.success(result.message);
                                        else toast.error(result.message);
                                    }}
                                />
                                <Button
                                    variant="secondary"
                                    className="border hover:bg-gray-200"
                                    disabled={useUploading === row.id}
                                    onClick={() => fileInputRefs.current[row.id]?.click()}
                                >
                                    <ImagePlusIcon className="mr-2 h-4 w-4"/>
                                    {useUploading === row.id ? "Uploading..." : "Upload Proof"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Activity History */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Activity History</CardTitle>
                                        <CardDescription>Your logged activities ({history.length} entries).</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {history.length > 0 && (
                                            <Button variant="outline" size="sm" onClick={exportCSV}>
                                                <Download className="mr-1 h-3 w-3" /> CSV
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm"
                                                onClick={() => setShowHistory(!showHistory)}>
                                            {showHistory ? "Hide" : "Show"}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            {showHistory && (
                                <CardContent>
                                    {history.length > 0 ? (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {history.map((entry) => (
                                                <div key={entry.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-muted-foreground w-24">
                                                            {new Date(entry.created_at).toLocaleDateString()}
                                                        </span>
                                                        <span className={`font-mono font-medium ${entry.km >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                            {entry.km >= 0 ? "+" : ""}{entry.km.toFixed(2)} pts
                                                        </span>
                                                        {entry.distance_proof && (
                                                            <a href={entry.distance_proof} target="_blank" rel="noreferrer"
                                                               className="text-blue-500 hover:underline text-xs">proof</a>
                                                        )}
                                                        {!entry.distance_proof && (
                                                            <>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    ref={(el) => { historyFileRefs.current[entry.id] = el; }}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        const result = await uploadProofForEntry(file, entry.created_at);
                                                                        if (result.success) toast.success(result.message);
                                                                        else toast.error(result.message);
                                                                    }}
                                                                />
                                                                <button
                                                                    className="text-xs text-muted-foreground hover:text-blue-500"
                                                                    disabled={useUploading !== undefined}
                                                                    onClick={() => historyFileRefs.current[entry.id]?.click()}
                                                                >
                                                                    + proof
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-red-500">
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete this activity entry ({entry.km.toFixed(2)} pts from {new Date(entry.created_at).toLocaleDateString()}).
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleAction(() => deleteDistanceEntry(entry.id))}>
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-4 text-sm text-muted-foreground">
                                            No activities logged yet.
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>

                        {/* Proof Gallery */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Proof Gallery</CardTitle>
                                <CardDescription>Your uploaded activity proofs.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {proof.length > 0 ? (
                                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {proof.map((item, index) => (
                                            <div key={index} className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
                                                <a href={item.distance_proof} target="_blank" rel="noreferrer">
                                                    <img
                                                        src={item.distance_proof}
                                                        alt={`Proof from ${new Date(item.created_at).toLocaleDateString()}`}
                                                        className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-center text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </div>
                                                </a>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            disabled={useUploading !== undefined}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-white"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete this proof?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently remove the proof image from {new Date(item.created_at).toLocaleDateString()}.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleAction(() => deleteProof(item.distance_proof, item.created_at))}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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
                /* Skeleton loading (#3) */
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mx-auto" />
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Logged in as <b>{session.user.email?.split('@')[0]}</b></p>
                <Button variant="destructive"
                        className="border hover:bg-red-500 text-white"
                        onClick={handleLogout}>Logout
                </Button>
            </div>
        </div>
    );
}
