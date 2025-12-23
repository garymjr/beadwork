import { type Bead, type TransientBead } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Bug, Sparkles, Target, ClipboardList } from 'lucide-react'
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
    bgClass: 'bg-white dark:bg-surface/90',
    borderClass: 'border-2 border-border/50',
    animationClass: 'animate-fade-in-up',
    showId: true,
    showPriority: true,
    showTitle: true,
    icon: null,
  },
  generating: {
    bgClass: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border-dashed animate-shimmer bg-[length:200%_100%]',
    borderClass: 'border-2 border-blue-400 dark:border-blue-600',
    animationClass: 'animate-pulse-subtle',
    showId: false,
    showPriority: false,
    showTitle: false,
    icon: <Loader2 className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />,
  },
  generating_plan: {
    bgClass: 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-purple-950/40 animate-shimmer bg-[length:200%_100%]',
    borderClass: 'border-2 border-purple-400 dark:border-purple-600',
    animationClass: 'animate-pulse-subtle',
    showId: true,
    showPriority: true,
    showTitle: true,
    icon: <Loader2 className="h-3 w-3 animate-spin text-purple-600 dark:text-purple-400" />,
  },
  completed: {
    bgClass: 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-emerald-950/40',
    borderClass: 'border-2 border-emerald-400 dark:border-emerald-600',
    animationClass: 'animate-fade-in-up',
    showId: false,
    showPriority: false,
    showTitle: true,
    icon: null,
  },
  error: {
    bgClass: 'bg-gradient-to-br from-red-50 via-rose-50 to-red-50 dark:from-red-950/40 dark:via-rose-950/40 dark:to-red-950/40',
    borderClass: 'border-2 border-red-400 dark:border-red-600',
    animationClass: 'animate-shake',
    showId: false,
    showPriority: false,
    showTitle: false,
    icon: null,
  },
  resolved: {
    bgClass: 'bg-white dark:bg-surface/90',
    borderClass: 'border-2 border-border/50',
    animationClass: '',
    showId: true,
    showPriority: true,
    showTitle: true,
    icon: null,
  },
}

const TYPE_CONFIGS: Record<string, { label: string; className: string; icon: React.ReactNode; gradient: string }> = {
  bug: {
    label: 'Bug',
    className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-semibold',
    icon: <Bug className="h-3 w-3" />,
    gradient: 'from-red-500/10 via-orange-500/5 to-transparent'
  },
  feature: {
    label: 'Feature',
    className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-semibold',
    icon: <Sparkles className="h-3 w-3" />,
    gradient: 'from-blue-500/10 via-cyan-500/5 to-transparent'
  },
  task: {
    label: 'Task',
    className: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold',
    icon: <Target className="h-3 w-3" />,
    gradient: 'from-purple-500/10 via-pink-500/5 to-transparent'
  },
  epic: {
    label: 'Epic',
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold',
    icon: <ClipboardList className="h-3 w-3" />,
    gradient: 'from-amber-500/10 via-yellow-500/5 to-transparent'
  },
  chore: {
    label: 'Chore',
    className: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30 font-semibold',
    icon: <Target className="h-3 w-3" />,
    gradient: 'from-gray-500/10 via-slate-500/5 to-transparent'
  },
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

const PRIORITY_ACCENTS: Record<number, { color: string; gradient: string }> = {
  0: { color: 'bg-red-500', gradient: 'from-red-500 via-red-400 to-orange-500' },
  1: { color: 'bg-orange-500', gradient: 'from-orange-500 via-amber-500 to-yellow-500' },
  2: { color: 'bg-blue-500', gradient: 'from-blue-500 via-cyan-500 to-blue-600' },
  3: { color: 'bg-emerald-500', gradient: 'from-emerald-500 via-green-500 to-teal-500' },
  4: { color: 'bg-gray-400', gradient: 'from-gray-400 via-slate-400 to-gray-500' },
}

export function BeadCard({ bead, onClick, onRetry, columnCardBorder }: BeadCardProps) {
  const state = getBeadState(bead)
  const isTransientBead = isTransient(bead)
  const config = STATE_CONFIGS[state]
  const typeConfig = TYPE_CONFIGS[bead.issue_type] || TYPE_CONFIGS.task
  const priorityAccent = PRIORITY_ACCENTS[bead.priority] || PRIORITY_ACCENTS[2]

  const getStateClasses = () => {
    const baseClasses = 'cursor-pointer transition-all duration-300 ease-out rounded-xl overflow-hidden relative shadow-md hover:shadow-xl group'
    return `${baseClasses} ${config.bgClass} ${config.borderClass} ${config.animationClass}`
  }

  const isErrorState = state === 'error'
  const isGeneratingState = state === 'generating'
  const isCompletedState = state === 'completed'

  return (
    <div
      className={getStateClasses()}
      onClick={onClick}
      data-priority={bead.priority}
    >
      {/* Priority-colored side accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${priorityAccent.color}`}></div>

      {/* Gradient background overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${priorityAccent.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>

      {/* Border glow on hover */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${priorityAccent.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm -z-10`}></div>

      {/* Type-based gradient accent in top right */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${typeConfig.gradient} opacity-10 rounded-bl-full transition-opacity duration-300 group-hover:opacity-20`}></div>

      {/* Main content */}
      <div className="relative z-10">
        <div className="p-4 pb-0 space-y-3">
          {config.showId && (
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2">
                {/* Type icon */}
                <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${typeConfig.gradient} flex items-center justify-center text-white shadow-md`}>
                  {typeConfig.icon}
                </div>
                <span className="font-mono text-xs text-muted-foreground font-semibold bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">{bead.id}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className={`text-[10px] px-2 py-0.5 font-bold shadow-sm ${getPriorityColor(bead.priority, bead.status)} rounded-full`}>
                  P{bead.priority}
                </Badge>
                <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${typeConfig.className} rounded-full`}>
                  {typeConfig.label}
                </Badge>
              </div>
            </div>
          )}

          {isGeneratingState && config.icon && (
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              {config.icon}
              <span className="font-medium">Generating title...</span>
              <div className="flex-1 h-2 bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-shimmer bg-[length:200%_100%] w-2/3 rounded-full shadow-sm"></div>
              </div>
            </div>
          )}

          {state === 'generating_plan' && config.icon && (
            <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
              {config.icon}
              Generating plan...
            </div>
          )}

          {isCompletedState && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-950/50 dark:to-green-950/50 px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <span className="text-base">✨</span>
              Title generated
            </div>
          )}

          {isErrorState && (
            <div className="space-y-2">
              <div className="text-xs text-red-600 dark:text-red-400 bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50 px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-800 shadow-sm font-medium">
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
                  className="text-xs h-7 px-3 bg-white hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-600 hover:border-red-300 dark:from-red-950 dark:hover:to-rose-950 shadow-sm transition-all duration-200"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          )}

          {config.showTitle && (
            <CardTitle className={`text-sm font-bold leading-snug ${
              isGeneratingState ? 'text-muted-foreground italic' : 'text-foreground'
            }`}>
              {bead.title}
            </CardTitle>
          )}
        </div>

        <div className="p-4 pt-2 text-xs text-muted-foreground line-clamp-2 relative">
          {bead.description || "No description"}
        </div>
      </div>
    </div>
  )
}
