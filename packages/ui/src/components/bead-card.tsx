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
    bgClass: 'bg-white dark:bg-card/90 hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/5',
    borderClass: 'border-2 border-border/50 hover:border-primary/30',
    animationClass: 'animate-fade-in-up',
    showId: true,
    showPriority: true,
    showTitle: true,
    icon: null,
  },
  generating: {
    bgClass: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-dashed opacity-80',
    borderClass: 'border-2 border-blue-300 dark:border-blue-700',
    animationClass: 'animate-pulse-subtle',
    showId: false,
    showPriority: false,
    showTitle: false,
    icon: <Loader2 className="h-3 w-3 animate-spin text-blue-500" />,
  },
  generating_plan: {
    bgClass: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-300 dark:border-purple-700 opacity-90',
    borderClass: 'border-purple-400 dark:border-purple-600',
    animationClass: 'animate-pulse-subtle',
    showId: true,
    showPriority: true,
    showTitle: true,
    icon: <Loader2 className="h-3 w-3 animate-spin text-purple-500" />,
  },
  completed: {
    bgClass: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-2',
    borderClass: 'border-emerald-400 dark:border-emerald-600',
    animationClass: 'animate-fade-in-up',
    showId: false,
    showPriority: false,
    showTitle: true,
    icon: null,
  },
  error: {
    bgClass: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-2',
    borderClass: 'border-red-400 dark:border-red-600',
    animationClass: 'animate-shake',
    showId: false,
    showPriority: false,
    showTitle: false,
    icon: null,
  },
  resolved: {
    bgClass: 'bg-white dark:bg-card/90 hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/5',
    borderClass: 'border-2 border-border/50 hover:border-primary/30',
    animationClass: '',
    showId: true,
    showPriority: true,
    showTitle: true,
    icon: null,
  },
}

const TYPE_CONFIGS: Record<string, { label: string; className: string }> = {
  bug: { label: 'Bug', className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-semibold' },
  feature: { label: 'Feature', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-semibold' },
  task: { label: 'Task', className: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold' },
  epic: { label: 'Epic', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold' },
  chore: { label: 'Chore', className: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30 font-semibold' },
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
    const baseClasses = 'cursor-pointer card-state-transition rounded-xl hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20 backdrop-blur-sm transition-all duration-300 overflow-hidden relative'
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
      {/* Decorative gradient overlay for idle cards */}
      {state === 'idle' && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-secondary/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      )}

      <CardHeader className="p-4 pb-0 space-y-3 relative z-10">
        {config.showId && (
          <div className="flex justify-between items-start gap-2">
            <span className="font-mono text-xs text-muted-foreground font-bold bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">{bead.id}</span>
            <div className="flex items-center gap-1.5">
              <Badge className={`text-[10px] px-2 py-0.5 font-bold ${getPriorityColor(bead.priority, bead.status)} rounded-md`}>
                P{bead.priority}
              </Badge>
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${typeConfig.className} rounded-md`}>
                {typeConfig.label}
              </Badge>
            </div>
          </div>
        )}

        {isGeneratingState && config.icon && (
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            {config.icon}
            <span className="font-medium">Generating title...</span>
            <div className="flex-1 h-1.5 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse w-2/3 rounded-full"></div>
            </div>
          </div>
        )}

        {state === 'generating_plan' && config.icon && (
          <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-950/30 px-3 py-2 rounded-lg">
            {config.icon}
            Generating plan...
          </div>
        )}

        {isCompletedState && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg">
            <span className="text-base">✨</span>
            Title generated
          </div>
        )}

        {isErrorState && (
          <div className="space-y-2">
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg font-medium">
              {isTransientBead ? bead.error : 'Unknown error'}
            </div>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onRetry()
                }}
                className="text-xs h-7 px-3 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:bg-red-950 dark:hover:bg-red-900"
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

      <CardContent className="p-4 pt-2 text-xs text-muted-foreground line-clamp-2 relative z-10">
        {bead.description || "No description"}
      </CardContent>
    </Card>
  )
}
