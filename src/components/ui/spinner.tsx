import * as React from "react"
import { cn } from "@/lib/utils"

const Spinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "animate-spin rounded-full border-4 border-t-4 border-blue-500 border-opacity-20 h-5 w-5",
      className
    )}
    {...props}
  />
))
Spinner.displayName = "Spinner"

export { Spinner }
