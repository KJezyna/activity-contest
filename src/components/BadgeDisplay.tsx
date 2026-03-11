"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Badge, UserBadge } from "@/lib/types";
import {
  Award, Flame, Zap, Shield, Crown, Star, Trophy, Medal, Gem, Camera, Image, Shuffle, Users,
  Sunrise, Moon, Palette, RotateCcw, Rocket, Sparkles, HeartHandshake, Album, Film,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  footprints: <Award className="h-4 w-4" />,
  flame: <Flame className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  crown: <Crown className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  trophy: <Trophy className="h-4 w-4" />,
  medal: <Medal className="h-4 w-4" />,
  gem: <Gem className="h-4 w-4" />,
  camera: <Camera className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  shuffle: <Shuffle className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  award: <Award className="h-4 w-4" />,
  sunrise: <Sunrise className="h-4 w-4" />,
  moon: <Moon className="h-4 w-4" />,
  palette: <Palette className="h-4 w-4" />,
  "rotate-ccw": <RotateCcw className="h-4 w-4" />,
  rocket: <Rocket className="h-4 w-4" />,
  sparkles: <Sparkles className="h-4 w-4" />,
  "heart-handshake": <HeartHandshake className="h-4 w-4" />,
  album: <Album className="h-4 w-4" />,
  film: <Film className="h-4 w-4" />,
};

interface Props {
  userBadges: (UserBadge & { badges: Badge })[];
  allBadges?: Badge[];
  showUnearned?: boolean;
}

export function BadgeDisplay({ userBadges, allBadges, showUnearned = false }: Props) {
  const earnedIds = new Set(userBadges.map((ub) => ub.badge_id));

  const displayBadges = showUnearned && allBadges
    ? allBadges.map((b) => ({ badge: b, earned: earnedIds.has(b.id), earnedAt: userBadges.find((ub) => ub.badge_id === b.id)?.earned_at }))
    : userBadges.map((ub) => ({ badge: ub.badges, earned: true, earnedAt: ub.earned_at }));

  if (displayBadges.length === 0) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-wrap gap-2">
        {displayBadges.map((item) => (
          <Tooltip key={item.badge.id}>
            <TooltipTrigger asChild>
              <button type="button" className={`flex items-center justify-center h-9 w-9 rounded-full border-2 transition-all cursor-default ${
                item.earned
                  ? "bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900 dark:border-amber-600 dark:text-amber-300"
                  : "bg-muted border-muted-foreground/20 text-muted-foreground/40"
              }`}>
                {ICON_MAP[item.badge.icon] ?? <Award className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-48">
              <p className="font-semibold">{item.badge.name}</p>
              <p className="text-muted-foreground">{item.badge.description}</p>
              {item.earned && item.earnedAt && (
                <p className="text-[10px] mt-1">Zdobyto: {new Date(item.earnedAt).toLocaleDateString("pl-PL")}</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
