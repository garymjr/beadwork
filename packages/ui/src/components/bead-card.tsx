import { type Bead, type TransientBead } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPriorityColor } from '@/lib/priority-utils'

export type BeadOrTransient = Bead | (TransientBead & { id: string })

export interface UnifiedBead {
  id: string
  realId?: string
  title: string
  description: string
  status: string
  priority: number
  issue_type: string
  created_at?: string
  // Transient state properties
  transientState?: 'generating' | 'error' | 'completed' | 'resolved'
  error?: string
  transientId?: string
}

interface BeadCardProps {
  bead: UnifiedBead
  onClick: () => void
  onRetryGeneration?: (transientId: string) => void
  columnCardBorder: string
}

export function BeadCard({ bead, onClick, onRetryGeneration, columnCardBorder }: BeadCardProps) {
  const isTransient = bead.transientState !== undefined && bead.transientState !== 'resolved'
  const isGenerating = bead.transientState === 'generating'
  const hasError = bead.transientState === 'error'
  const isCompleted = bead.transientState === 'completed'
  const isResolved = bead.transientState === 'resolved'
  
  // Determine visual state classes
  const getStateClasses = () => {
    const baseClasses = 'cursor-pointer card-state-transition hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm border border-white/20'
    
    if (isGenerating) {
      return `${baseClasses} bg-white/60 border-dashed opacity-70 animate-pulse-subtle`
    }
    
    if (hasError) {
      return `${baseClasses} bg-red-50 border-red-200 animate-shake`
    }
    
    if (isCompleted) {
      return `${baseClasses} bg-white/90 border-green-200 animate-fade-in card-success-enter`
    }
    
    // Regular bead or resolved transient
    return `${baseClasses} bg-white/80 hover:bg-white/90 ${columnCardBorder} animate-slide-in`
  }
  
  return (
    <Card 
      className={getStateClasses()}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-0 space-y-1">
        {!isTransient && (
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs text-muted-foreground font-bold">{bead.id}</span>
            <Badge className={`text-[10px] px-2 py-0 font-bold ${getPriorityColor(bead.priority, bead.status)}`}>
              P{bead.priority}
            </Badge>
          </div>
        )}
        
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
              Error: {bead.error}
            </div>
            {onRetryGeneration && bead.transientId && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation()
                  onRetryGeneration(bead.transientId!)
                }}
                className="text-xs h-6 px-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
        
        {(!isTransient || isResolved) && (
          <CardTitle className={`text-sm font-semibold leading-tight ${
            isGenerating ? 'text-gray-500 italic' : 'text-gray-800'
          }`}>
            {bead.title}
          </CardTitle>
        )}
      </CardHeader>
      
      <CardContent className="p-3 pt-2 text-xs text-gray-600 line-clamp-2">
        {bead.description || "No description"}
      </CardContent>
    </Card>
  )
}
