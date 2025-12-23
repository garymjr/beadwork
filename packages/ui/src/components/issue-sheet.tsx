import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Trash2, MessageSquare, Link as LinkIcon, Plus, X, Sparkles, Copy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { 
  updateBead, 
  deleteBead, 
  getComments, 
  addComment, 
  getDependencies, 
  addDependency, 
  removeDependency,
  createPlan,
  type Bead,
  type Comment,
  type Dependency
} from '@/lib/api'
import { useRouter } from '@tanstack/react-router'
import { getPriorityColor } from '@/lib/priority-utils'

interface IssueSheetProps {
  bead: Bead | null
  projectPath: string
  isOpen: boolean
  onClose: () => void
}

export function IssueSheet({ bead, projectPath, isOpen, onClose }: IssueSheetProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Bead>>({})
  const [comments, setComments] = useState<Comment[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [newComment, setNewComment] = useState('')
  const [newDepId, setNewDepId] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (bead) {
      setFormData({
        title: bead.title,
        description: bead.description || '',
        status: bead.status,
        priority: bead.priority
      })
      fetchComments()
      fetchDependencies()
    }
  }, [bead])

  const fetchComments = async () => {
    if (!bead) return
    const res = await getComments(projectPath, bead.id)
    setComments(res)
  }

  const fetchDependencies = async () => {
    if (!bead) return
    const res = await getDependencies(projectPath, bead.id)
    setDependencies(res)
  }

  const handleSave = async () => {
    if (!bead) return
    setLoading(true)
    try {
      await updateBead({
        projectPath,
        id: bead.id,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: String(formData.priority)
      })
      router.invalidate()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async () => {
    if (!bead) return
    setLoading(true)
    try {
      await createPlan({
        projectPath,
        id: bead.id,
        title: formData.title || bead.title,
        description: formData.description || bead.description,
        issue_type: bead.issue_type
      })
      await fetchComments()
      await fetchDependencies()
      router.invalidate()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!bead || !confirm('Are you sure you want to delete this issue?')) return
    setLoading(true)
    try {
      await deleteBead(projectPath, bead.id)
      router.invalidate()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!bead || !newComment.trim()) return
    setLoading(true)
    try {
      await addComment(projectPath, bead.id, newComment)
      setNewComment('')
      await fetchComments()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDependency = async () => {
    if (!bead || !newDepId.trim()) return
    setLoading(true)
    try {
      await addDependency(projectPath, bead.id, newDepId)
      setNewDepId('')
      await fetchDependencies()
      router.invalidate()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDependency = async (depId: string) => {
    if (!bead) return
    setLoading(true)
    try {
      await removeDependency(projectPath, bead.id, depId)
      await fetchDependencies()
      router.invalidate()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyId = async () => {
    if (!bead) return
    try {
      await navigator.clipboard.writeText(bead.id)
      setCopiedId(bead.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  if (!bead) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent hideClose className="w-full sm:max-w-[800px] flex flex-col h-full">
        <VisuallyHidden>
          <SheetTitle>Issue Details: {bead.id}</SheetTitle>
          <SheetDescription>View and edit details for issue {bead.id}</SheetDescription>
        </VisuallyHidden>
        <SheetHeader className="mb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{bead.id}</Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCopyId} 
                className="h-6 w-6 hover:bg-transparent hover:text-accent"
              >
                <Copy className={`h-3 w-3 ${copiedId === bead.id ? "text-green-600" : ""}`} />
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-500 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input 
            className="text-lg font-bold mt-2" 
            value={formData.title || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} 
          />
        </SheetHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              Comments
              {comments?.length > 0 && (
                <Badge variant="secondary" className="px-1 py-0 text-[10px]">{comments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="flex items-center gap-2">
              Dependencies
              {dependencies?.length > 0 && (
                <Badge variant="secondary" className="px-1 py-0 text-[10px]">{dependencies.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <TabsContent value="details" className="mt-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <div className="flex gap-2">
                    <Input 
                      type="number"
                      value={formData.priority || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    />
                    <Badge className={`text-xs px-3 py-0 font-bold ${getPriorityColor(formData.priority || 2, formData.status || bead.status)}`}>
                      P{formData.priority || 2}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  className="min-h-[250px] font-mono text-sm resize-none"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a description..."
                />
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-0 flex flex-col h-full space-y-4">
              <ScrollArea className="flex-1 border rounded-md p-4 bg-zinc-50/50">
                {comments?.length === 0 || !comments ? (
                  <div className="text-center py-8 text-zinc-500">
                    <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No comments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments?.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px]">
                            {comment.author.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{comment.author}</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm bg-white border rounded-md p-2 shadow-sm whitespace-pre-wrap">
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Add a comment..." 
                  className="min-h-[80px] resize-none"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button className="h-auto" onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                  Post
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="dependencies" className="mt-0 space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter issue ID to add as dependency..." 
                  value={newDepId}
                  onChange={(e) => setNewDepId(e.target.value)}
                />
                <Button onClick={handleAddDependency} disabled={loading || !newDepId.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="border rounded-md">
                {dependencies?.length === 0 || !dependencies ? (
                  <div className="text-center py-8 text-zinc-500">
                    <LinkIcon className="mx-auto h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No dependencies</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {dependencies?.map((dep) => (
                      <div key={dep.id} className="flex items-center justify-between p-3 bg-white">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-[10px]">{dep.id}</Badge>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{dep.title}</span>
                            <span className="text-[10px] text-zinc-500 uppercase">{dep.status}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-red-500"
                          onClick={() => handleRemoveDependency(dep.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <SheetFooter className="mt-4 pt-4 border-t shrink-0">
          <Button 
            variant="secondary" 
            onClick={handleCreatePlan} 
            disabled={loading || !formData.description}
            className="mr-auto"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Create Plan
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
