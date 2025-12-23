import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected" | "error"
  className?: string
}

const statusConfig = {
  connected: {
    label: "Connected",
    colorClass: "text-success",
    dotClass: "bg-success",
  },
  connecting: {
    label: "Connecting",
    colorClass: "text-warning",
    dotClass: "bg-warning",
  },
  disconnected: {
    label: "Disconnected",
    colorClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  error: {
    label: "Connection Error",
    colorClass: "text-destructive",
    dotClass: "bg-destructive",
  },
}

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const config = statusConfig[status]

  return (
    <div className={cn("flex items-center gap-2 text-sm", config.colorClass, className)}>
      {status === "connecting" ? (
        <div className="connection-dots">
          <span className={`connection-dot ${config.dotClass}`} />
          <span className={`connection-dot ${config.dotClass}`} />
          <span className={`connection-dot ${config.dotClass}`} />
        </div>
      ) : (
        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
      )}
      <span>{config.label}</span>
    </div>
  )
}
