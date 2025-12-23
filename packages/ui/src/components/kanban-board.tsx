import { type Bead, type TransientBead } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type BeadOrTransient = Bead | (TransientBead & { id: string })

interface KanbanBoardProps {
  beads: BeadOrTransient[]
  onBeadClick: (bead: BeadOrTransient) => void
  onRetryGeneration?: (transientId: string) => void
}

const getPriorityColor = (priority: number | undefined, status: string) => {
  const priorityColors: Record<string, Record<number, string>> = {
    open: {
      0: 'bg-red-500 text-white',
      1: 'bg-orange-500 text-white', 
      2: 'bg-yellow-500 text-black',
      3: 'bg-blue-500 text-white',
      4: 'bg-gray-500 text-white'
    },
    in_progress: {
      0: 'bg-red-600 text-white',
      1: 'bg-purple-600 text-white',
      2: 'bg-blue-600 text-white', 
      3: 'bg-indigo-500 text-white',
      4: 'bg-gray-600 text-white'
    },
    done: {
      0: 'bg-green-700 text-white',
      1: 'bg-green-600 text-white',
      2: 'bg-emerald-600 text-white',
      3: 'bg-teal-600 text-white', 
      4: 'bg-gray-600 text-white'
    }
  }
  
  const statusColors = priorityColors[status] || priorityColors.open
  return statusColors[priority ?? 2] || 'bg-gray-500 text-white'
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
                const isGenerating = transientBead?.transientStatus === 'generating'
                const hasError = transientBead?.transientStatus === 'error'
                const isCompleted = transientBead?.transientStatus === 'completed'
                
                return (
                  <Card 
                    key={bead.id} 
                    className={`cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-lg ${col.cardBorder} backdrop-blur-sm border border-white/20 ${
                      isGenerating ? 'bg-white/60 border-dashed opacity-70' : 'bg-white/80 hover:bg-white/90'
                    } ${hasError ? 'bg-red-50 border-red-200' : ''} ${
                      isCompleted ? 'bg-white/90 border-green-200' : ''
                    }`}
                    onClick={() => onBeadClick(bead)}
                  >
                    <CardHeader className="p-3 pb-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs text-muted-foreground font-bold">{bead.id}</span>
                        <Badge className={`text-[10px] px-2 py-0 font-bold ${getPriorityColor(bead.priority, col.id)}`}>
                          P{bead.priority}
                        </Badge>
                      </div>
                      {isGenerating && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Generating title...
                        </div>
                      )}
                      {isCompleted && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          ✓ Title generated
                        </div>
                      )}
                      {hasError && (
                        <div className="space-y-2">
                          <div className="text-xs text-red-600">
                            Error: {transientBead?.error}
                          </div>
                          {onRetryGeneration && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(e) => {
                                e.stopPropagation()
                                onRetryGeneration(transientBead!.transientId)
                              }}
                              className="text-xs h-6 px-2"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      )}
                      <CardTitle className={`text-sm font-semibold leading-tight ${
                        isGenerating ? 'text-gray-500 italic' : 'text-gray-800'
                      }`}>
                        {bead.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-2 text-xs text-gray-600 line-clamp-2">
                      {bead.description || "No description"}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
