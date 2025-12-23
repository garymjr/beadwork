import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "pulse" | "shimmer"
}

function Skeleton({
  className,
  variant = "shimmer",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-border",
        variant === "pulse" ? "animate-pulse-subtle" : "skeleton",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
