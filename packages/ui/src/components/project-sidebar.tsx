import { Link } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Folder, Search, Trash2, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { addProject, removeProject, getProjectStats, type Project } from '@/lib/api'
import { useRouter } from '@tanstack/react-router'
import { DirectoryPicker } from './directory-picker'
import { Badge } from '@/components/ui/badge'

export function ProjectSidebar({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [path, setPath] = useState('')
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleAdd = async () => {
    try {
      await addProject(path)
      setIsOpen(false)
      setPath('')
      setError('')
      router.invalidate()
    } catch (e: any) {
      if (e.message.includes('PROJECT_NEEDS_INIT')) {
        if (confirm('Project needs initialization. Initialize beads?')) {
          try {
            await addProject(path, true)
            setIsOpen(false)
            setPath('')
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

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Remove this project from BeadWork?')) return
    await removeProject(id)
    router.invalidate()
  }

  const handlePickerSelect = (selectedPath: string) => {
    setPath(selectedPath)
    setShowPicker(false)
  }

  return (
    <div className="w-64 border-r bg-muted/20 h-screen p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">BeadWork</h2>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) setShowPicker(false)
        }}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{showPicker ? 'Browse Directories' : 'Add Project'}</DialogTitle>
              <VisuallyHidden>
                <DialogDescription>
                  {showPicker ? 'Select a directory from the filesystem' : 'Enter the path to a local git repository to add it as a project'}
                </DialogDescription>
              </VisuallyHidden>
            </DialogHeader>
            
            {showPicker ? (
              <DirectoryPicker 
                onSelect={handlePickerSelect} 
                onCancel={() => setShowPicker(false)} 
              />
            ) : (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="path">Project Path</label>
                  <div className="flex gap-2">
                    <Input
                      id="path"
                      placeholder="/path/to/project"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowPicker(true)}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <Button onClick={handleAdd}>Add</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <nav className="flex flex-col gap-2 overflow-y-auto">
        {projects.map((project) => (
          <ProjectItem 
            key={project.id} 
            project={project} 
            onRemove={handleRemove} 
          />
        ))}
        {projects.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No projects found. Add one to get started.
          </div>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t flex justify-between items-center">
        <span className="text-xs text-muted-foreground font-mono">v0.1.0</span>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

function ProjectItem({ 
  project, 
  onRemove 
}: { 
  project: Project, 
  onRemove: (e: React.MouseEvent, id: string) => void 
}) {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    getProjectStats(project.path).then(setStats)
  }, [project.path])

  return (
    <Link
      to={`/project/$projectId`}
      params={{ projectId: project.id }}
      className="group relative flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted text-sm [&.active]:bg-primary [&.active]:text-primary-foreground"
    >
      <div className="flex items-center gap-2 truncate pr-6">
        <Folder className="h-4 w-4 shrink-0" />
        <span className="truncate">{project.name}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {stats?.summary?.open_issues > 0 && (
          <Badge variant="secondary" className="px-1 py-0 text-[10px] bg-zinc-200 group-[.active]:bg-primary-foreground group-[.active]:text-primary">
            {stats.summary.open_issues}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
          onClick={(e) => onRemove(e, project.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </Link>
  )
}
