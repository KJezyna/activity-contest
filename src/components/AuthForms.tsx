"use client"
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import {toast} from "sonner";

interface AuthFormsProps {
    usernameSignUp: string;
    setUsernameSignUp: (v: string) => void;
    passwordSignUp: string;
    setPasswordSignUp: (v: string) => void;
    usernameLogIn: string;
    setUsernameLogIn: (v: string) => void;
    passwordLogIn: string;
    setPasswordLogIn: (v: string) => void;
    handleRegister: (nick: string, password: string) => Promise<{ success: boolean; message: string }>;
    handleLogin: (nick: string, password: string) => Promise<{ success: boolean; message: string }>;
    isAuthLoading: boolean;
}

export function AuthForms({
    usernameSignUp, setUsernameSignUp,
    passwordSignUp, setPasswordSignUp,
    usernameLogIn, setUsernameLogIn,
    passwordLogIn, setPasswordLogIn,
    handleRegister, handleLogin,
    isAuthLoading,
}: AuthFormsProps) {
    const onRegister = async () => {
        const result = await handleRegister(usernameSignUp, passwordSignUp);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const onLogin = async () => {
        const result = await handleLogin(usernameLogIn, passwordLogIn);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const signUpValid = usernameSignUp.trim().length > 0 && passwordSignUp.length >= 6;
    const loginValid = usernameLogIn.trim().length > 0 && passwordLogIn.length > 0;

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <form onSubmit={(e) => { e.preventDefault(); void onRegister(); }}>
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
                                   disabled={isAuthLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="signup-password">Password</label>
                            <Input id="signup-password" type="password"
                                   value={passwordSignUp}
                                   onChange={(e) => setPasswordSignUp(e.target.value)}
                                   placeholder="Min. 6 characters"
                                   disabled={isAuthLoading}
                            />
                            {passwordSignUp.length > 0 && passwordSignUp.length < 6 && (
                                <p className="text-xs text-red-500">Password must be at least 6 characters.</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full border hover:bg-gray-700"
                                disabled={!signUpValid || isAuthLoading}>
                            {isAuthLoading ? <><Spinner className="mr-2 h-4 w-4 animate-spin" />Signing up...</> : "Sign up"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <Card>
                <form onSubmit={(e) => { e.preventDefault(); void onLogin(); }}>
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
                                   disabled={isAuthLoading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="login-password">Password</label>
                            <Input id="login-password" type="password"
                                   value={passwordLogIn}
                                   onChange={(e) => setPasswordLogIn(e.target.value)}
                                   placeholder="Enter your password"
                                   disabled={isAuthLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full border hover:bg-gray-700"
                                disabled={!loginValid || isAuthLoading}>
                            {isAuthLoading ? <><Spinner className="mr-2 h-4 w-4 animate-spin" />Logging in...</> : "Log in"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
