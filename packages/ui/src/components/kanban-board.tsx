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
    bgGradient: 'from-[var(--color-warning)]/20 to-[var(--color-highlight)]/20',
    borderColor: 'border-[var(--color-warning)]/50',
    headerBg: 'bg-gradient-to-r from-[var(--color-warning)] to-[var(--color-highlight)]',
    cardBorder: 'hover:border-[var(--color-warning)]/70',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    bgGradient: 'from-[var(--color-info)]/20 to-primary/20',
    borderColor: 'border-[var(--color-info)]/50',
    headerBg: 'bg-gradient-to-r from-[var(--color-info)] to-primary',
    cardBorder: 'hover:border-[var(--color-info)]/70',
  },
  {
    id: 'done',
    label: 'Done',
    bgGradient: 'from-[var(--color-success)]/20 to-emerald-400/20',
    borderColor: 'border-[var(--color-success)]/50',
    headerBg: 'bg-gradient-to-r from-[var(--color-success)] to-emerald-500',
    cardBorder: 'hover:border-[var(--color-success)]/70',
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
      {COLUMNS.map(col => (
        <div key={col.id} className={`flex-1 min-w-[200px] flex flex-col rounded-lg border-2 ${col.bgGradient} ${col.borderColor} backdrop-blur-sm shadow-lg`}>
          <div className={`p-3 font-bold text-sm text-primary-foreground flex items-center justify-between ${col.headerBg} shadow-md`}>
            {col.label}
            <Badge variant="secondary" className="text-xs bg-card/20 text-primary-foreground border-border/30">
              {getColumnBeads(col.id).length}
            </Badge>
          </div>
          <ScrollArea className="flex-1 p-2">
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
