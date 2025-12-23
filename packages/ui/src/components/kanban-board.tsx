import { type Bead, type TransientBead } from '@/lib/api'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { BeadCard, type UnifiedBead, type BeadOrTransient } from '@/components/bead-card'
import { getPriorityColor } from '@/lib/priority-utils'

interface KanbanBoardProps {
  beads: BeadOrTransient[]
  onBeadClick: (bead: BeadOrTransient) => void
  onRetryGeneration?: (transientId: string) => void
}

const COLUMNS = [
  { 
    id: 'open', 
    label: 'Open', 
    bgGradient: 'from-yellow-400/20 to-orange-400/20',
    borderColor: 'border-yellow-400/50',
    headerBg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    cardBorder: 'hover:border-yellow-400/70',
  },
  { 
    id: 'in_progress', 
    label: 'In Progress',
    bgGradient: 'from-blue-400/20 to-purple-400/20', 
    borderColor: 'border-blue-400/50',
    headerBg: 'bg-gradient-to-r from-blue-500 to-purple-500',
    cardBorder: 'hover:border-blue-400/70',
  },
  { 
    id: 'done', 
    label: 'Done',
    bgGradient: 'from-green-400/20 to-emerald-400/20',
    borderColor: 'border-green-400/50', 
    headerBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    cardBorder: 'hover:border-green-400/70',
  },
]

export function KanbanBoard({ beads, onBeadClick, onRetryGeneration }: KanbanBoardProps) {
  const getColumnBeads = (status: string) => {
    // Map various closed statuses to 'done' or keep specific
    if (status === 'done') return beads.filter(b => b.status === 'done' || b.status === 'closed')
    return beads.filter(b => b.status === status)
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => (
        <div key={col.id} className={`flex-1 min-w-[200px] flex flex-col rounded-lg border-2 ${col.bgGradient} ${col.borderColor} backdrop-blur-sm shadow-lg`}>
          <div className={`p-3 font-bold text-sm text-white flex items-center justify-between ${col.headerBg} shadow-md`}>
            {col.label}
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
              {getColumnBeads(col.id).length}
            </Badge>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {getColumnBeads(col.id).map(bead => {
                const isTransient = 'transientId' in bead
                const transientBead = isTransient ? bead as any : null
                
                // Convert to UnifiedBead format
                const unifiedBead: UnifiedBead = isTransient ? {
                  id: bead.id,
                  transientId: transientBead.transientId,
                  title: bead.title,
                  description: bead.description || '',
                  status: 'open',
                  priority: bead.priority || 2,
                  issue_type: bead.issue_type || 'task',
                  created_at: bead.created_at,
                  transientState: transientBead.transientStatus === 'generating' ? 'generating' 
                    : transientBead.transientStatus === 'error' ? 'error'
                    : transientBead.transientStatus === 'completed' ? 'completed'
                    : undefined,
                  error: transientBead?.error
                } : {
                  id: bead.id,
                  title: bead.title,
                  description: bead.description || '',
                  status: bead.status,
                  priority: bead.priority || 2,
                  issue_type: bead.issue_type || 'task',
                  created_at: bead.created_at,
                  transientState: 'resolved'
                }
                
                return (
                  <BeadCard
                    key={bead.id}
                    bead={unifiedBead}
                    onClick={() => onBeadClick(bead)}
                    onRetryGeneration={onRetryGeneration}
                    columnCardBorder={col.cardBorder}
                  />
                )
              })}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
