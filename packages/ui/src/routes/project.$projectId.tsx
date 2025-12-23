import { createFileRoute, notFound } from '@tanstack/react-router'
import { getProject, getBeads, getBead, createBeadAsync, updateBeadTitle, generateTitle, createPlanAsync, type Bead, type TransientBead } from '@/lib/api'
import { useBeadsWatcher } from '@/hooks/useBeadsWatcher'
import { getPriorityColor } from '@/lib/priority-utils'

type BeadOrTransient = Bead | (TransientBead & { id: string })
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ConnectionStatus } from '@/components/ui/connection-status'
import { toast, Toaster } from '@/components/ui/sonner'
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

  const allBeads = useMemo(() => {
    // Create a map of transient beads by their real ID (if available) or transient ID
    const transientMap = new Map<string, typeof transientBeads[0]>()
    transientBeads.forEach(b => {
      const key = (b as any).realId || b.transientId
      transientMap.set(key, b)
    })

    // Map each real bead and apply transient state if present
    return beads.map(bead => {
      const transient = transientMap.get(bead.id)
      if (transient) {
        // This bead has an active transient state - apply it in place
        return {
          ...bead,
          transientId: transient.transientId,
          transientStatus: transient.status,
          error: transient.error,
          retryCount: transient.retryCount
        }
      }
      return bead
    })
  }, [beads, transientBeads])

  const isBeadGeneratingPlan = (beadId: string) => {
    return transientBeads.some(b => b.realId === beadId && b.status === 'generating_plan')
  }

  const filteredBeads = useMemo(() => {
    if (!searchQuery.trim()) return allBeads
    const q = searchQuery.toLowerCase()
    return allBeads.filter(b => 
      b.id.toLowerCase().includes(q) || 
      b.title.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q)
    )
  }, [allBeads, searchQuery])

  const retryTitleGeneration = async (bead: BeadOrTransient) => {
    const realId = 'transientId' in bead ? (bead as any).realId : bead.id
    if (!realId) return

    const transientBead = transientBeads.find(b => (b as any).realId === realId)
    if (!transientBead) return

    // Update status to generating
    setTransientBeads(prev => prev.map(b =>
      (b as any).realId === realId
        ? { ...b, status: 'generating', error: undefined, retryCount: (b.retryCount || 0) + 1 }
        : b
    ))

    try {
      const title = await generateTitle(
        transientBead.description!,
        project.path
      )

      // Update the real bead with the generated title
      await updateBeadTitle(
        project.path,
        realId,
        title
      )

      // Update transient to completed state - smooth transition
      setTransientBeads(prev => prev.map(b =>
        (b as any).realId === realId
          ? { ...b, title, status: 'completed' }
          : b
      ))

      toast.success(`Title generated for ${realId}`)

      // Remove transient state after short delay
      setTimeout(() => {
        setTransientBeads(prev => prev.filter(b => (b as any).realId !== realId))
      }, 500)
    } catch (error) {
      setTransientBeads(prev => prev.map(b =>
        (b as any).realId === realId
          ? { ...b, status: 'error', error: (error as Error).message }
          : b
      ))
      toast.error(`Failed to generate title for ${realId}`)
    }
  }

  const createTransientBead = async (description: string, type?: string, priority?: number) => {
    try {
      // Create the bead immediately with placeholder title - gets real ID
      const createdBead = await createBeadAsync({
        projectPath: project.path,
        description,
        type: type || 'task',
        priority: priority || 2,
      })

      // Add transient state tracking for the real bead ID
      const transientId = crypto.randomUUID()
      const transientBead: TransientBead = {
        transientId,
        realId: createdBead.id,
        description,
        status: 'generating',
        title: 'Generating title...',
        issue_type: type || 'task',
        priority: priority || 2,
        created_at: new Date().toISOString(),
      }

      setTransientBeads(prev => [...prev, transientBead])

      // Invalidate to show the bead in the UI with generating state
      router.invalidate()

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

        // Update transient to completed state - card transitions smoothly in place
        setTransientBeads(prev => prev.map(b =>
          b.realId === createdBead.id
            ? { ...b, title, status: 'completed' }
            : b
        ))

        toast.success(`Issue ${createdBead.id} created with AI-generated title`)

        // Remove transient state after short delay
        setTimeout(() => {
          setTransientBeads(prev => prev.filter(b => b.realId !== createdBead.id))
        }, 500)

        return { transientId, realId: createdBead.id, title }
      } catch (error) {
        // Update transient to error state
        setTransientBeads(prev => prev.map(b =>
          b.realId === createdBead.id
            ? { ...b, status: 'error', error: (error as Error).message }
            : b
        ))
        toast.error(`Failed to generate title for ${createdBead.id}`)
        throw error
      }
    } catch (error) {
      // If bead creation fails, show error in dialog
      toast.error('Failed to create issue')
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
    let beadToSelect: Bead | null = null

    if ('transientId' in bead) {
      // For transient beads with realId, fetch the actual bead data
      const realId = (bead as any).realId
      if (realId) {
        const fullBead = await getBead(realId, project.path)
        beadToSelect = fullBead
      }
    } else {
      const fullBead = await getBead(bead.id, project.path)
      beadToSelect = fullBead
    }

    if (beadToSelect) {
      setSelectedBead(beadToSelect)
    }
  }

  return (
    <>
      <Toaster position="top-right" />
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
          <ConnectionStatus status={connectionStatus} />
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
          <KanbanBoard beads={filteredBeads} onBeadClick={handleBeadClick} onRetry={retryTitleGeneration} />
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
                    <TableCell className="text-right">
                      <Badge className={`text-[10px] px-2 py-0 font-bold ${getPriorityColor(bead.priority ?? 2, bead.status)}`}>
                        P{bead.priority ?? 2}
                      </Badge>
                    </TableCell>
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
        isGeneratingPlan={selectedBead ? isBeadGeneratingPlan(selectedBead.id) : false}
        onClose={() => setSelectedBead(null)}
        onPlanGenerationStart={(beadId, transientId) => {
          setTransientBeads(prev => [...prev, {
            transientId,
            realId: beadId,
            status: 'generating_plan',
            title: selectedBead?.title || 'Generating plan...',
            description: selectedBead?.description,
            issue_type: selectedBead?.issue_type || 'task',
            priority: selectedBead?.priority,
            created_at: new Date().toISOString(),
          }])
          router.invalidate()
        }}
        onPlanGenerationEnd={(beadId) => {
          setTransientBeads(prev => prev.filter(b => b.realId !== beadId))
          router.invalidate()
        }}
      />
      </div>
    </>
  )
}
