import { type Bead, type TransientBead } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPriorityColor } from '@/lib/priority-utils'

export type BeadState = 'idle' | 'generating' | 'generating_plan' | 'completed' | 'error' | 'resolved'

export interface BeadData {
  id: string
  realId?: string
  title: string
  description: string
  status: string
  priority: number
  issue_type: string
  created_at?: string
}

export interface TransientBeadData extends BeadData {
  transientId: string
  state: BeadState
  error?: string
}

export type UnifiedBead = BeadData | TransientBeadData

export type BeadOrTransient = Bead | (TransientBead & { id: string })

export interface BeadCardProps {
  bead: UnifiedBead
  onClick: () => void
  onRetry?: () => void
  columnCardBorder: string
}

interface StateConfig {
  bgClass: string
  borderClass: string
  animationClass: string
  showId: boolean
  showPriority: boolean
  showTitle: boolean
  icon: React.ReactNode | null
}

const STATE_CONFIGS: Record<BeadState, StateConfig> = {
  idle: {
    bgClass: 'bg-card/80 hover:bg-card/90',
    borderClass: 'border-border/20',
    animationClass: 'animate-fade-in-up',
    showId: true,
    showPriority: true,
    showTitle: true,
    icon: null,
  },
  generating: {
    bgClass: 'bg-card/60 border-dashed opacity-70',
    borderClass: 'border-border/20',
    animationClass: 'animate-pulse-subtle',
    showId: false,
    showPriority: false,
    showTitle: false,
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  generating_plan: {
    bgClass: 'bg-card/60 border-dashed opacity-70 border-[var(--color-info)]/30',
    borderClass: 'border-[var(--color-info)]/30',
    animationClass: 'animate-pulse-subtle',
    showId: true,
    showPriority: true,
    showTitle: true,
    icon: <Loader2 className="h-3 w-3 animate-spin text-[var(--color-info)]" />,
  },
  completed: {
    bgClass: 'bg-card/90 border-[var(--color-success)]/30',
    borderClass: 'border-[var(--color-success)]/30',
    animationClass: 'animate-fade-in-up',
    showId: false,
    showPriority: false,
    showTitle: true,
    icon: null,
  },
  error: {
    bgClass: 'bg-destructive/10 border-destructive/30',
    borderClass: 'border-destructive/30',
    animationClass: 'animate-shake',
    showId: false,
    showPriority: false,
    showTitle: false,
    icon: null,
  },
  resolved: {
    bgClass: 'bg-card/80 hover:bg-card/90',
    borderClass: 'border-border/20',
    animationClass: '',
    showId: true,
    showPriority: true,
    showTitle: true,
    icon: null,
  },
}

const TYPE_CONFIGS: Record<string, { label: string; className: string }> = {
  bug: { label: 'Bug', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  feature: { label: 'Feature', className: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30' },
  task: { label: 'Task', className: 'bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/30' },
  epic: { label: 'Epic', className: 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border-[var(--color-secondary)]/30' },
  chore: { label: 'Chore', className: 'bg-muted/50 text-muted-foreground border-border' },
}

export function getBeadState(bead: UnifiedBead): BeadState {
  return 'state' in bead ? bead.state : 'idle'
}

export function isTransient(bead: UnifiedBead): bead is TransientBeadData {
  return 'state' in bead
}

export function createTransientBead(
  bead: BeadOrTransient,
  state: BeadState,
  error?: string
): UnifiedBead {
  const baseData: BeadData = {
    id: bead.id,
    realId: 'realId' in bead ? bead.realId : undefined,
    title: bead.title || 'Generating title...',
    description: bead.description || '',
    status: bead.status,
    priority: bead.priority || 2,
    issue_type: bead.issue_type || 'task',
    created_at: bead.created_at,
  }

  if ('transientId' in bead) {
    return {
      ...baseData,
      transientId: bead.transientId,
      state,
      error,
    }
  }

  return baseData
}

export function BeadCard({ bead, onClick, onRetry, columnCardBorder }: BeadCardProps) {
  const state = getBeadState(bead)
  const isTransientBead = isTransient(bead)
  const config = STATE_CONFIGS[state]
  const typeConfig = TYPE_CONFIGS[bead.issue_type] || TYPE_CONFIGS.task

  const getStateClasses = () => {
    const baseClasses = 'cursor-pointer card-state-transition hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--color-primary)]/10 backdrop-blur-sm border'
    return `${baseClasses} ${config.bgClass} ${config.borderClass} ${config.animationClass} ${columnCardBorder}`
  }

  const isErrorState = state === 'error'
  const isGeneratingState = state === 'generating'
  const isCompletedState = state === 'completed'

  return (
    <Card 
      className={getStateClasses()}
      onClick={onClick}
      data-priority={bead.priority}
    >
      <CardHeader className="p-3 pb-0 space-y-2">
        {config.showId && (
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs text-muted-foreground font-bold">{bead.id}</span>
            <div className="flex items-center gap-1">
              <Badge className={`text-[10px] px-2 py-0 font-bold ${getPriorityColor(bead.priority, bead.status)}`}>
                P{bead.priority}
              </Badge>
              <Badge variant="outline" className={`text-[10px] px-2 py-0 font-medium ${typeConfig.className}`}>
                {typeConfig.label}
              </Badge>
            </div>
          </div>
        )}
        
        {isGeneratingState && config.icon && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {config.icon}
            Generating title...
            <div className="flex-1 h-1 bg-border rounded overflow-hidden">
              <div className="h-full bg-primary/50 animate-pulse w-2/3 skeleton"></div>
            </div>
          </div>
        )}
        
        {state === 'generating_plan' && config.icon && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-info)]">
            {config.icon}
            Generating plan...
          </div>
        )}

        {isCompletedState && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-success)]">
            ✓ Title generated
          </div>
        )}

        {isErrorState && (
          <div className="space-y-2">
            <div className="text-xs text-destructive">
              Error: {isTransientBead ? bead.error : 'Unknown error'}
            </div>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onRetry()
                }}
                className="text-xs h-6 px-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}

        {config.showTitle && (
          <CardTitle className={`text-sm font-semibold leading-tight ${
            isGeneratingState ? 'text-muted-foreground italic' : 'text-foreground'
          }`}>
            {bead.title}
          </CardTitle>
        )}
      </CardHeader>

      <CardContent className="p-3 pt-2 text-xs text-muted-foreground line-clamp-2">
        {bead.description || "No description"}
      </CardContent>
    </Card>
  )
}
