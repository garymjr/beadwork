import { type Bead } from '@/server/beads'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface KanbanBoardProps {
  beads: Bead[]
  onBeadClick: (bead: Bead) => void
}

const COLUMNS = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

export function KanbanBoard({ beads, onBeadClick }: KanbanBoardProps) {
  const getColumnBeads = (status: string) => {
    // Map various closed statuses to 'done' or keep specific
    if (status === 'done') return beads.filter(b => b.status === 'done' || b.status === 'closed')
    return beads.filter(b => b.status === status)
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => (
        <div key={col.id} className="flex-1 min-w-[200px] flex flex-col bg-muted/10 rounded-lg border">
          <div className="p-3 font-semibold text-sm flex items-center justify-between">
            {col.label}
            <Badge variant="secondary" className="text-xs">
              {getColumnBeads(col.id).length}
            </Badge>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {getColumnBeads(col.id).map(bead => (
                <Card 
                  key={bead.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => onBeadClick(bead)}
                >
                  <CardHeader className="p-3 pb-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs text-muted-foreground">{bead.id}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">{bead.priority}</Badge>
                    </div>
                    <CardTitle className="text-sm font-medium leading-tight">
                      {bead.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-2 text-xs text-muted-foreground line-clamp-2">
                    {bead.description || "No description"}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  )
}
