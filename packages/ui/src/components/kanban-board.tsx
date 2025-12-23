import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { BeadCard, type UnifiedBead, type BeadOrTransient, createTransientBead } from '@/components/bead-card'

interface KanbanBoardProps {
  beads: BeadOrTransient[]
  onBeadClick: (bead: BeadOrTransient) => void
  onRetry?: (bead: BeadOrTransient) => void
}

const COLUMNS = [
  {
    id: 'open',
    label: 'Open',
    bgGradient: 'bg-gradient-to-b from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20',
    borderColor: 'border-2 border-amber-300/50 dark:border-amber-700/50',
    headerBg: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30',
    headerText: 'text-white',
    icon: '🔥',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    bgGradient: 'bg-gradient-to-b from-blue-50/80 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20',
    borderColor: 'border-2 border-blue-300/50 dark:border-blue-700/50',
    headerBg: 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30',
    headerText: 'text-white',
    icon: '🚀',
  },
  {
    id: 'done',
    label: 'Done',
    bgGradient: 'bg-gradient-to-b from-emerald-50/80 to-green-50/40 dark:from-emerald-950/30 dark:to-green-950/20',
    borderColor: 'border-2 border-emerald-300/50 dark:border-emerald-700/50',
    headerBg: 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/30',
    headerText: 'text-white',
    icon: '✅',
  },
]

export function KanbanBoard({ beads, onBeadClick, onRetry }: KanbanBoardProps) {
  const getColumnBeads = (status: string) => {
    if (status === 'done') return beads.filter(b => b.status === 'done' || b.status === 'closed')
    return beads.filter(b => b.status === status)
  }

  const toUnifiedBead = (bead: BeadOrTransient): UnifiedBead => {
    const isTransient = 'transientId' in bead
    
    if (isTransient) {
      const transientBead = bead as any
      const state = transientBead.transientStatus === 'generating'
        ? 'generating' as const
        : transientBead.transientStatus === 'generating_plan'
        ? 'generating_plan' as const
        : transientBead.transientStatus === 'error'
        ? 'error' as const
        : transientBead.transientStatus === 'completed'
        ? 'completed' as const
        : 'resolved' as const

      return createTransientBead(
        bead,
        state,
        transientBead.error
      )
    }

    return createTransientBead(bead, 'resolved')
  }

  return (
    <div className="flex h-full gap-5 overflow-x-auto pb-4 px-1">
      {COLUMNS.map((col, index) => (
        <div
          key={col.id}
          className={`flex-1 min-w-[320px] flex flex-col rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl ${col.bgGradient} ${col.borderColor} relative group`}
        >
          {/* Decorative gradient blob in background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-current to-transparent opacity-5 rounded-full blur-3xl pointer-events-none group-hover:opacity-10 transition-opacity duration-300" style={{ color: 'inherit' }}></div>

          {/* Header */}
          <div className={`p-4 font-bold text-base flex items-center justify-between ${col.headerBg} ${col.headerText} relative z-10`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{col.icon}</span>
              <span>{col.label}</span>
            </div>
            <Badge
              variant="secondary"
              className="h-7 min-w-7 rounded-full px-2.5 flex items-center justify-center text-sm font-bold bg-white/20 text-white border-2 border-white/30 shadow-md backdrop-blur-sm"
            >
              {getColumnBeads(col.id).length}
            </Badge>
          </div>

          {/* Cards container */}
          <ScrollArea className="flex-1 p-4 custom-scrollbar relative z-10">
            <div className="space-y-3">
              {getColumnBeads(col.id).map(bead => (
                <BeadCard
                  key={bead.id}
                  bead={toUnifiedBead(bead)}
                  onClick={() => onBeadClick(bead)}
                  onRetry={onRetry ? () => onRetry(bead) : undefined}
                  columnCardBorder=""
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
