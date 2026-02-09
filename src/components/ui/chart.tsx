"use client"
import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ChartContainer = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={className}>{children}</div>
);

const ChartTooltipContent = ({ formatter, ...props }: any) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span />
                </TooltipTrigger>
                <TooltipContent>
                    <p>Tooltip Content</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
};
export { ChartContainer, ChartTooltipContent };
