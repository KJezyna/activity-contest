"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { PageTransition } from "@/components/layout/PageTransition";
import { toast } from "sonner";
import { LogIn, UserPlus } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { session, login, register } = useAuthStore();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) router.replace("/profile");
  }, [session, router]);

  if (session) return null;

  const handleLogin = async () => {
    setIsLoading(true);
    const result = await login(loginEmail, loginPassword);
    setIsLoading(false);
    if (result.success) {
      toast.success(result.message);
      router.push("/profile");
    } else {
      toast.error(result.message);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    const result = await register(signupEmail, signupPassword, signupName);
    setIsLoading(false);
    if (result.success) {
      toast.success(result.message);
      router.push("/profile");
    } else {
      toast.error(result.message);
    }
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const loginValid = isValidEmail(loginEmail) && loginPassword.length > 0;
  const signupValid = isValidEmail(signupEmail) && signupName.trim().length > 0 && signupPassword.length >= 6;

  return (
    <PageTransition>
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Login */}
        <Card>
          <form onSubmit={(e) => { e.preventDefault(); void handleLogin(); }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Logowanie
              </CardTitle>
              <CardDescription>Zaloguj się na istniejące konto.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="twój@email.com"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="login-pass">Hasło</Label>
                <Input
                  id="login-pass"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Twoje hasło"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={!loginValid || isLoading}>
                {isLoading ? <Spinner className="h-4 w-4 animate-spin mr-2" /> : null}
                Zaloguj się
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Register */}
        <Card>
          <form onSubmit={(e) => { e.preventDefault(); void handleRegister(); }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Rejestracja
              </CardTitle>
              <CardDescription>Utwórz nowe konto.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="twój@email.com"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-name">Nazwa wyświetlana</Label>
                <Input
                  id="signup-name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Jak chcesz być widoczny"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-pass">Hasło</Label>
                <Input
                  id="signup-pass"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min. 6 znaków"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                {signupPassword.length > 0 && signupPassword.length < 6 && (
                  <p className="text-xs text-destructive">Hasło musi mieć min. 6 znaków.</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={!signupValid || isLoading}>
                {isLoading ? <Spinner className="h-4 w-4 animate-spin mr-2" /> : null}
                Załóż konto
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
