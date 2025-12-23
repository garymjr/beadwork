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
    bgGradient: 'from-[var(--color-warning)]/10 to-transparent',
    bgTint: 'bg-[var(--color-warning)]/5',
    borderColor: 'border-[var(--color-warning)]/30',
    headerBg: 'bg-gradient-to-r from-[var(--color-warning)]/80 to-[var(--color-warning)]/60',
    cardBorder: 'hover:border-[var(--color-warning)]/50',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    bgGradient: 'from-[var(--color-info)]/10 to-transparent',
    bgTint: 'bg-[var(--color-info)]/5',
    borderColor: 'border-[var(--color-info)]/30',
    headerBg: 'bg-gradient-to-r from-[var(--color-info)]/80 to-primary/60',
    cardBorder: 'hover:border-[var(--color-info)]/50',
  },
  {
    id: 'done',
    label: 'Done',
    bgGradient: 'from-[var(--color-success)]/10 to-transparent',
    bgTint: 'bg-[var(--color-success)]/5',
    borderColor: 'border-[var(--color-success)]/30',
    headerBg: 'bg-gradient-to-r from-[var(--color-success)]/80 to-[var(--color-success)]/60',
    cardBorder: 'hover:border-[var(--color-success)]/50',
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
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col, index) => (
        <div 
          key={col.id} 
          className={`flex-1 min-w-[200px] flex flex-col rounded-lg border ${col.bgGradient} ${col.bgTint} ${col.borderColor} backdrop-blur-sm shadow-lg transition-all duration-200`}
        >
          <div className={`p-3 font-semibold text-sm text-primary-foreground flex items-center justify-between ${col.headerBg} rounded-t-lg shadow-sm`}>
            {col.label}
            <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-xs bg-card/20 text-primary-foreground border-border/30">
              {getColumnBeads(col.id).length}
            </Badge>
          </div>
          <ScrollArea className="flex-1 p-2 custom-scrollbar">
            <div className="space-y-2">
              {getColumnBeads(col.id).map(bead => (
                <BeadCard
                  key={bead.id}
                  bead={toUnifiedBead(bead)}
                  onClick={() => onBeadClick(bead)}
                  onRetry={onRetry ? () => onRetry(bead) : undefined}
                  columnCardBorder={col.cardBorder}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
