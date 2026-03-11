"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface Props {
  onChange: (range: DateRange) => void;
}

type Preset = "week" | "month" | "year" | "all";

const PRESETS: { key: Preset; label: string; days: number | null }[] = [
  { key: "week", label: "Tydzie\u0144", days: 7 },
  { key: "month", label: "Miesi\u0105c", days: 30 },
  { key: "year", label: "Rok", days: 365 },
  { key: "all", label: "Wszystko", days: null },
];

export function DateRangeFilter({ onChange }: Props) {
  const [active, setActive] = useState<Preset>("all");

  const handleClick = (preset: Preset) => {
    setActive(preset);
    const p = PRESETS.find((pr) => pr.key === preset)!;
    if (p.days === null) {
      onChange({ from: null, to: null });
    } else {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - p.days);
      onChange({ from, to });
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      {PRESETS.map((p) => (
        <Button
          key={p.key}
          size="sm"
          variant={active === p.key ? "secondary" : "ghost"}
          onClick={() => handleClick(p.key)}
          className="h-7 text-xs"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
