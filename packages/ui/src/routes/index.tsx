import { createFileRoute, Link } from '@tanstack/react-router'
import { getProjects, addProject, getProjectStats, type Project } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Card3D } from '@/components/ui/card-3d'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { Toaster } from '@/components/ui/sonner'
import { Folder, Plus, ArrowRight, FolderOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DirectoryPicker } from '@/components/directory-picker'
import { Input } from '@/components/ui/input'
import { useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  loader: async () => {
    const projects = await getProjects()
    return { projects }
  },
  component: Dashboard
})

function Dashboard() {
  const { projects } = Route.useLoaderData()
  const router = useRouter()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [newPath, setNewPath] = useState('')
  const [error, setError] = useState('')

  const handleAdd = async () => {
    try {
      await addProject(newPath)
      toast.success(`Project ${newPath} added successfully`)
      setIsAddOpen(false)
      setNewPath('')
      setError('')
      router.invalidate()
    } catch (e: any) {
      if (e.message.includes('PROJECT_NEEDS_INIT')) {
        if (confirm('Project needs initialization. Initialize beads?')) {
          try {
            await addProject(newPath, true)
            toast.success(`Project ${newPath} initialized and added`)
            setIsAddOpen(false)
            setNewPath('')
            setError('')
            router.invalidate()
            return
          } catch (initErr: any) {
            setError(initErr.message)
            toast.error('Failed to initialize project')
            return
          }
        }
      }
      setError((e as Error).message)
      toast.error('Failed to add project')
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-10 bg-gradient-to-br from-background via-background to-primary/5 background-noise">
      {/* Hero Section */}
      <div className="flex flex-col gap-4 animate-fade-in-up">
        <h1 className="text-5xl font-bold tracking-tight gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome to BeadWork
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Manage your local issue tracking with ease. Select a project to get started.
        </p>
      </div>

      {/* Project Cards Grid - 16:9 ratio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add Project Card */}
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) setShowPicker(false)
        }}>
          <DialogTrigger asChild>
            <button className="relative flex flex-col items-center justify-center aspect-video rounded-2xl overflow-hidden transition-all duration-500 gap-4 group hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 hover:from-primary/10 hover:via-secondary/10 hover:to-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-secondary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-secondary/5 group-hover:to-primary/5 transition-all duration-500"></div>
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <span className="relative font-semibold text-base bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Add Project</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">{showPicker ? 'Select Directory' : 'Add Project Repository'}</DialogTitle>
            </DialogHeader>
            {showPicker ? (
              <DirectoryPicker
                onSelect={(path) => {
                  setNewPath(path)
                  setShowPicker(false)
                }}
                onCancel={() => setShowPicker(false)}
              />
            ) : (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="path" className="text-sm font-medium">Project Path</label>
                  <div className="flex gap-2">
                    <Input
                      id="path"
                      placeholder="/path/to/repo"
                      value={newPath}
                      onChange={(e) => setNewPath(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowPicker(true)} className="shrink-0">
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must contain a .beads directory
                  </p>
                  {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
                </div>
                <Button onClick={handleAdd} className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20">
                  Add Project
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-20 animate-fade-in-up delay-200">
          <div className="inline-flex h-20 w-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6 shadow-lg">
            <Folder className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6">
            Initialize a repository with <code className="bg-muted px-2 py-1 rounded-md font-mono text-sm border border-border">beads init</code> then add it here.
          </p>
        </div>
      )}
      </div>
    </>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    getProjectStats(project.path).then(setStats)
  }, [project.path])

  return (
    <Link
      to="/project/$projectId"
      params={{ projectId: project.id }}
      className="block"
    >
      <Card className="aspect-video relative overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all duration-500 border-2 border-border/50 bg-gradient-to-br from-white to-gray-50 dark:from-surface dark:to-surface-elevated shadow-md hover:shadow-2xl hover:shadow-primary/15">
        {/* Animated gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-secondary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-secondary/5 group-hover:to-primary/10 transition-all duration-500"></div>

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <CardHeader className="relative h-full flex flex-col justify-between p-5">
          <div>
            <CardTitle className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Folder className="h-6 w-6 text-white" />
              </div>
              <span className="truncate font-bold text-lg">{project.name}</span>
            </CardTitle>
            <CardDescription className="truncate font-mono text-xs text-muted-foreground bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-border/50">
              {project.path}
            </CardDescription>
          </div>

          <div className="flex items-center justify-between">
            {stats ? (
              <div className="flex gap-6">
                <div className="flex flex-col group-hover:scale-110 transition-transform duration-300 origin-left">
                  <span className="text-4xl font-bold bg-gradient-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-display)' }}>
                    {stats.summary?.open_issues ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">Open</span>
                </div>
                <div className="flex flex-col group-hover:scale-110 transition-transform duration-300 delay-75 origin-left">
                  <span className="text-4xl font-bold bg-gradient-to-br from-emerald-500 to-green-600 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-display)' }}>
                    {stats.summary?.closed_issues ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">Closed</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <Skeleton variant="shimmer" className="h-10 w-20 rounded-lg" />
                <Skeleton variant="shimmer" className="h-10 w-20 rounded-lg" />
              </div>
            )}

            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
