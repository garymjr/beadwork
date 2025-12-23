import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "rounded-full border border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        secondary:
          "rounded-full border border-transparent bg-secondary/10 text-secondary hover:bg-secondary/20",
        destructive:
          "rounded-full border border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",
        outline: "rounded-full border border-border text-foreground hover:bg-surface-elevated",
        // Type-specific variants (rounded-sm for types)
        bug: "rounded-sm border border-transparent bg-error/10 text-error hover:bg-error/20",
        feature: "rounded-sm border border-transparent bg-secondary/10 text-secondary hover:bg-secondary/20",
        task: "rounded-sm border border-transparent bg-info/10 text-info hover:bg-info/20",
        epic: "rounded-sm border border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        // Priority variants (pill-shaped)
        priority: "rounded-full",
        "priority-0": "rounded-full border border-error/30 bg-error/10 text-error font-medium",
        "priority-1": "rounded-full border border-warning/30 bg-warning/10 text-warning font-medium",
        "priority-2": "rounded-full border border-info/30 bg-info/10 text-info font-medium",
        "priority-3": "rounded-full border border-secondary/30 bg-secondary/10 text-secondary font-medium",
        "priority-4": "rounded-full border border-border bg-surface text-foreground-muted font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
