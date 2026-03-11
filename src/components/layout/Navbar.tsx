"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Newspaper,
  Trophy,
  Users,
  User,
  Shield,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  LogIn,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/feed", label: "Feed", icon: <Newspaper className="h-4 w-4" /> },
  { href: "/leaderboard", label: "Ranking", icon: <Trophy className="h-4 w-4" /> },
  { href: "/teams", label: "Zespoły", icon: <Users className="h-4 w-4" /> },
  { href: "/profile", label: "Profil", icon: <User className="h-4 w-4" /> },
  { href: "/admin", label: "Admin", icon: <Shield className="h-4 w-4" />, adminOnly: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { session, person, isAdmin, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.href === "/profile" && !session) return false;
    return true;
  });

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-primary">Activity</span>
            <span className="text-muted-foreground">Contest</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {visibleItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive(item.href) && "bg-secondary font-medium"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {session ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {person?.name ?? "..."}
                </span>
                <Button variant="ghost" size="icon" onClick={() => void logout()} className="h-9 w-9">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link href="/auth" className="hidden md:block">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Zaloguj się
                </Button>
              </Link>
            )}

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t bg-background"
          >
            <div className="px-4 py-3 space-y-1">
              {visibleItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
              <div className="border-t pt-2 mt-2">
                {session ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground px-4">
                      {person?.name ?? "..."}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => { void logout(); setMobileOpen(false); }}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Wyloguj się
                    </Button>
                  </div>
                ) : (
                  <Link href="/auth" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <LogIn className="h-4 w-4" />
                      Zaloguj się
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
