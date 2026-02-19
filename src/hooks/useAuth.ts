"use client"
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export function useAuth() {
    const [usernameLogIn, setUsernameLogIn] = useState("");
    const [usernameSignUp, setUsernameSignUp] = useState("");
    const [passwordLogIn, setPasswordLogIn] = useState("");
    const [passwordSignUp, setPasswordSignUp] = useState("");
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const handleRegister = async (nick: string, password: string) => {
        setIsAuthLoading(true);
        try {
            const fakeEmail = `${nick.toLowerCase().trim()}@fake.mail`;

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: fakeEmail,
                password: password
            });

            if (authError) {
                return { success: false, message: "Register error: " + authError.message };
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
                    return { success: false, message: "Failed to create user profile." };
                }

                const { error: distanceError } = await supabase
                    .from("Distance")
                    .insert({
                        km: 0,
                        person: authData.user.id,
                    });

                if (distanceError) {
                    console.error(distanceError.message);
                    return { success: false, message: "Failed to initialize distance record." };
                }
            }

            return { success: true, message: "User created!" };
        } catch (err) {
            console.error("Critical error:", err);
            return { success: false, message: "Registration failed. Please try again." };
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLogin = async (nick: string, password: string) => {
        setIsAuthLoading(true);
        try {
            const fakeEmail = `${nick.toLowerCase().trim()}@fake.mail`;

            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: fakeEmail,
                password: password
            });

            if (loginError) {
                return { success: false, message: "Error: " + loginError.message };
            }
            return { success: true, message: "Logged in!" };
        } catch (err) {
            console.error("Login error:", err);
            return { success: false, message: "Login failed. Please try again." };
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error.message);
        }
    };

    return {
        usernameLogIn, setUsernameLogIn,
        usernameSignUp, setUsernameSignUp,
        passwordLogIn, setPasswordLogIn,
        passwordSignUp, setPasswordSignUp,
        isAuthLoading,
        handleRegister,
        handleLogin,
        handleLogout,
    };
}
