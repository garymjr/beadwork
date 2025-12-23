import { createFileRoute, notFound } from '@tanstack/react-router'
import { getProject, getBeads, createBead, getBead, createBeadAsync, updateBeadTitle, generateTitle, type Bead, type TransientBead } from '@/lib/api'
import { useBeadsWatcher } from '@/hooks/useBeadsWatcher'

type BeadOrTransient = Bead | (TransientBead & { id: string })
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Plus, LayoutTemplate, List, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { KanbanBoard } from '@/components/kanban-board'
import { IssueSheet } from '@/components/issue-sheet'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/project/$projectId')({
  loader: async ({ params }) => {
    const project = await getProject(params.projectId)
    if (!project) {
      throw notFound()
    }
    const beads = await getBeads(project.path)
    return { project, beads }
  },
  component: ProjectComponent,
})

function ProjectComponent() {
  const { project, beads } = Route.useLoaderData()
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newIssueDescription, setNewIssueDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedBead, setSelectedBead] = useState<Bead | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [transientBeads, setTransientBeads] = useState<TransientBead[]>([])

  // Set up the beads watcher for real-time updates
  const { status: connectionStatus } = useBeadsWatcher({
    projectPath: project.path,
    onUpdate: () => {
      console.log('Beads updated, invalidating router cache')
      router.invalidate()
    },
  })

  const connectionStatusIcon = {
    connected: <Wifi className="h-4 w-4 text-green-500" />,
    connecting: <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />,
    disconnected: <WifiOff className="h-4 w-4 text-red-500" />,
  }[connectionStatus]

  const allBeads = useMemo(() => {
    const allTransient = transientBeads.map(b => ({
      id: b.transientId,
      title: b.title || 'Generating title...',
      description: b.description,
      status: 'open', // All transient beads show in open column
      priority: b.priority || 2,
      issue_type: b.issue_type || 'task',
      created_at: b.created_at,
      transientId: b.transientId,
      transientStatus: b.status,
      error: b.error,
      retryCount: b.retryCount
    }))
    
    return [...allTransient, ...beads]
  }, [beads, transientBeads])

  const filteredBeads = useMemo(() => {
    if (!searchQuery.trim()) return allBeads
    const q = searchQuery.toLowerCase()
    return allBeads.filter(b => 
      b.id.toLowerCase().includes(q) || 
      b.title.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q)
    )
  }, [allBeads, searchQuery])

  const retryTitleGeneration = async (transientId: string) => {
    const transientBead = transientBeads.find(b => b.transientId === transientId)
    if (!transientBead) return
    
    // Update status to generating
    setTransientBeads(prev => prev.map(b => 
      b.transientId === transientId 
        ? { ...b, status: 'generating', error: undefined, retryCount: (b.retryCount || 0) + 1 }
        : b
    ))
    
    try {
      const title = await generateTitle(
        transientBead.description!,
        project.path
      )
      
      // Get the real bead ID from the transient bead metadata
      const realId = (transientBead as any).realId
      
      // Update the real bead with the generated title
      if (realId) {
        await updateBeadTitle(
          project.path,
          realId,
          title
        )
        
        // Remove the transient bead since real bead is now updated
        setTransientBeads(prev => prev.filter(b => b.transientId !== transientId))
        setTimeout(() => router.invalidate(), 500)
      } else {
        // If no real ID, update to error state
        setTransientBeads(prev => prev.map(b => 
          b.transientId === transientId 
            ? { ...b, status: 'error', error: 'No real bead ID found' }
            : b
        ))
      }
    } catch (error) {
      setTransientBeads(prev => prev.map(b => 
        b.transientId === transientId 
          ? { ...b, status: 'error', error: (error as Error).message }
          : b
      ))
    }
  }

  const createTransientBead = async (description: string, type?: string, priority?: number) => {
    const transientId = crypto.randomUUID()
    const transientBead: TransientBead = {
      transientId,
      description,
      status: 'generating',
      title: 'Generating title...',
      issue_type: type || 'task',
      priority: priority || 2,
      created_at: new Date().toISOString(),
    }
    
    setTransientBeads(prev => [...prev, transientBead])
    
    try {
      // Create the bead immediately with placeholder title
      const createdBead = await createBeadAsync({ 
        projectPath: project.path, 
        description,
        type: type || 'task',
        priority: priority || 2,
        transientId
      })
      
      // Store the real ID in the transient bead
      setTransientBeads(prev => prev.map(b => 
        b.transientId === transientId 
          ? { ...b, realId: createdBead.id }
          : b
      ))
      
      // Generate title in background
      try {
        const title = await generateTitle(
          description,
          project.path
        )
        
        // Update the real bead with the generated title
        await updateBeadTitle(
          project.path,
          createdBead.id,
          title
        )
        
        // Update transient to show the generated title (looks like real bead now)
        setTransientBeads(prev => prev.map(b => 
          b.transientId === transientId 
            ? { ...b, title, status: 'completed' }
            : b
        ))
        
        // Invalidate to refresh the real bead data, then remove transient after a short delay
        setTimeout(() => {
          router.invalidate()
          // Remove transient after real bead data has loaded
          setTimeout(() => {
            setTransientBeads(prev => prev.filter(b => b.transientId !== transientId))
          }, 100)
        }, 500)
        
        return { transientId, realId: createdBead.id, title }
      } catch (error) {
        setTransientBeads(prev => prev.map(b => 
          b.transientId === transientId 
            ? { ...b, status: 'error', error: (error as Error).message }
            : b
        ))
        throw error
      }
    } catch (error) {
      setTransientBeads(prev => prev.map(b => 
        b.transientId === transientId 
          ? { ...b, status: 'error', error: (error as Error).message }
          : b
      ))
      throw error
    }
  }

  const handleCreate = async () => {
    if (!newIssueDescription.trim()) return
    setIsCreating(true)

    const description = newIssueDescription

    // Clear form and close dialog immediately
    setNewIssueDescription('')
    setIsCreateOpen(false)

    try {
      // Always create transient bead (AI generates title)
      createTransientBead(description).catch(console.error)
    } catch (e) {
      console.error(e)
    } finally {
      setIsCreating(false)
    }
  }

  const handleBeadClick = async (bead: BeadOrTransient) => {
    // Only fetch full details for real beads, not transient ones
    if ('transientId' in bead) {
      // For transient beads, we could show a different view or skip
      return
    }
    
    const fullBead = await getBead(bead.id, project.path)
    setSelectedBead(fullBead || bead)
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {connectionStatusIcon}
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-md p-1 mr-2 bg-muted/20">
            <Button 
              variant={viewMode === 'board' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setViewMode('board')}
            >
              <LayoutTemplate className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Issue</DialogTitle>
                <VisuallyHidden>
                  <DialogDescription>
                    Create a new issue in this project.
                  </DialogDescription>
                </VisuallyHidden>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="description"
                    value={newIssueDescription}
                    onChange={(e) => setNewIssueDescription(e.target.value)}
                    placeholder="Describe the issue... AI will automatically generate a title"
                    className="min-h-[100px]"
                  />
                </div>
                <Button onClick={handleCreate} disabled={isCreating || !newIssueDescription.trim()}>
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'board' ? (
          <KanbanBoard beads={filteredBeads} onBeadClick={handleBeadClick} onRetryGeneration={retryTitleGeneration} />
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden flex flex-col h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-24 text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBeads.map((bead) => (
                  <TableRow 
                    key={bead.id} 
                    className="cursor-pointer"
                    onClick={() => handleBeadClick(bead)}
                  >
                    <TableCell className="font-mono text-xs">{bead.id}</TableCell>
                    <TableCell className="font-medium">{bead.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {bead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{bead.priority}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredBeads.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground py-12">
                No issues found
              </div>
            )}
          </div>
        )}
      </div>

      <IssueSheet 
        bead={selectedBead} 
        projectPath={project.path}
        isOpen={!!selectedBead}
        onClose={() => setSelectedBead(null)}
      />
    </div>
  )
}
