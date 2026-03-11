"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  activities: { created_at: string; points: number }[];
  title?: string;
}

export function ActivityHeatmap({ activities, title = "Mapa aktywności" }: Props) {
  // Build day → total points map for last 365 days
  const dayMap = new Map<string, number>();
  activities.forEach((a) => {
    const key = new Date(a.created_at).toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + a.points);
  });

  const today = new Date();
  const days: { date: string; value: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, value: dayMap.get(key) ?? 0 });
  }

  const maxVal = Math.max(...days.map((d) => d.value), 1);

  const getColor = (val: number): string => {
    if (val === 0) return "bg-muted";
    const ratio = val / maxVal;
    if (ratio < 0.25) return "bg-emerald-200 dark:bg-emerald-900";
    if (ratio < 0.5) return "bg-emerald-400 dark:bg-emerald-700";
    if (ratio < 0.75) return "bg-emerald-500 dark:bg-emerald-500";
    return "bg-emerald-700 dark:bg-emerald-300";
  };

  // Group into weeks (columns)
  const weeks: { date: string; value: number }[][] = [];
  let currentWeek: { date: string; value: number }[] = [];

  // Pad the first week
  const firstDay = new Date(days[0].date).getDay();
  // Monday = 0 in our grid
  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < mondayOffset; i++) {
    currentWeek.push({ date: "", value: -1 });
  }

  days.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const MONTHS = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex gap-[2px]">
            <TooltipProvider delayDuration={100}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((day, di) => (
                    day.value < 0 ? (
                      <div key={di} className="h-3 w-3" />
                    ) : (
                      <Tooltip key={di}>
                        <TooltipTrigger asChild>
                          <div className={`h-3 w-3 rounded-[2px] ${getColor(day.value)} transition-colors`} />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{day.date}</p>
                          <p>{day.value.toFixed(1)} pkt</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  ))}
                </div>
              ))}
            </TooltipProvider>
          </div>
          {/* Month labels */}
          <div className="flex mt-1 text-[10px] text-muted-foreground">
            {MONTHS.map((m) => (
              <span key={m} className="flex-1 text-center">{m}</span>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <span>Mniej</span>
          <div className="h-3 w-3 rounded-[2px] bg-muted" />
          <div className="h-3 w-3 rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
          <div className="h-3 w-3 rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
          <div className="h-3 w-3 rounded-[2px] bg-emerald-500 dark:bg-emerald-500" />
          <div className="h-3 w-3 rounded-[2px] bg-emerald-700 dark:bg-emerald-300" />
          <span>Więcej</span>
        </div>
      </CardContent>
    </Card>
  );
}
