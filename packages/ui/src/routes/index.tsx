import { createFileRoute, Link } from '@tanstack/react-router'
import { getProjects, addProject, getProjectStats, type Project } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      setIsAddOpen(false)
      setNewPath('')
      setError('')
      router.invalidate()
    } catch (e: any) {
      if (e.message.includes('PROJECT_NEEDS_INIT')) {
        if (confirm('Project needs initialization. Initialize beads?')) {
          try {
            await addProject(newPath, true)
            setIsAddOpen(false)
            setNewPath('')
            setError('')
            router.invalidate()
            return
          } catch (initErr: any) {
            setError(initErr.message)
            return
          }
        }
      }
      setError((e as Error).message)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      {/* Hero Section */}
      <div className="flex flex-col gap-3 animate-fade-in-up">
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
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
            <button className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-primary/30 rounded-xl hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 gap-4 group hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 group-hover:scale-110 transition-all duration-300 border border-primary/20">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="font-medium text-muted-foreground group-hover:text-primary transition-colors">Add Project</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{showPicker ? 'Select Directory' : 'Add Project Repository'}</DialogTitle>
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
                  <label htmlFor="path">Project Path</label>
                  <div className="flex gap-2">
                    <Input
                      id="path"
                      placeholder="/path/to/repo"
                      value={newPath}
                      onChange={(e) => setNewPath(e.target.value)}
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowPicker(true)}>
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must contain a .beads directory
                  </p>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <Button onClick={handleAdd}>Add Project</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 animate-fade-in-up delay-200">
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground">
            Initialize a repository with <code className="bg-muted px-1 py-0.5 rounded">beads init</code> then add it here.
          </p>
        </div>
      )}
    </div>
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
      <Card className="aspect-video hover:border-primary/50 transition-all duration-300 cursor-pointer relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="relative h-full flex flex-col justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 group-hover:scale-110 transition-all duration-300 border border-primary/10">
                <Folder className="h-5 w-5 text-primary" />
              </div>
              <span className="truncate font-bold">{project.name}</span>
            </CardTitle>
            <CardDescription className="truncate font-mono text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-md mt-2">
              {project.path}
            </CardDescription>
          </div>
          
          <div className="flex items-center justify-between">
            {stats ? (
              <div className="flex gap-6">
                <div className="flex flex-col group-hover:scale-110 transition-transform duration-300 origin-left">
                  <span className="text-3xl font-bold text-[var(--color-warning)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {stats.summary?.open_issues ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">Open</span>
                </div>
                <div className="flex flex-col group-hover:scale-110 transition-transform duration-300 delay-75 origin-left">
                  <span className="text-3xl font-bold text-[var(--color-success)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {stats.summary?.closed_issues ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">Closed</span>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-2">
                <div className="h-8 w-16 bg-gradient-to-r from-muted/50 to-muted rounded-lg skeleton"></div>
                <div className="h-3 w-12 bg-gradient-to-r from-muted/30 to-muted/50 rounded skeleton"></div>
              </div>
            )}
            
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg glow-primary">
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
