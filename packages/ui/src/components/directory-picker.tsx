import { useState, useEffect } from 'react'
import { getDirectoryListing, type DirectoryListing } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Folder, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react'

interface DirectoryPickerProps {
  onSelect: (path: string) => void
  onCancel: () => void
}

export function DirectoryPicker({ onSelect, onCancel }: DirectoryPickerProps) {
  const [currentPath, setCurrentPath] = useState<string | undefined>(undefined)
  const [data, setData] = useState<DirectoryListing | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDirectory = async (path?: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await getDirectoryListing(path)
      setData(result)
      setCurrentPath(result.currentPath)
    } catch (e) {
      setError('Failed to load directory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDirectory()
  }, [])

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded text-sm font-mono overflow-hidden">
        <span className="truncate flex-1" title={currentPath}>
          {currentPath || 'Loading...'}
        </span>
      </div>

      <ScrollArea className="flex-1 border rounded-md p-2">
        {loading && !data && (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
          </div>
        )}

        {error && <div className="text-red-500 text-sm p-2">{error}</div>}

        <div className="space-y-1">
          {data?.parentPath && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => loadDirectory(data.parentPath!)}
            >
              <ArrowLeft className="h-4 w-4" />
              ..
            </Button>
          )}

          {data?.entries.map((entry) => (
            <Button
              key={entry.path}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => loadDirectory(entry.path)}
            >
              <Folder className="h-4 w-4 text-blue-500" />
              <span className="truncate">{entry.name}</span>
              <ChevronRight className="ml-auto h-3 w-3 opacity-50" />
            </Button>
          ))}
          
          {data?.entries.length === 0 && (
             <div className="text-xs text-muted-foreground p-2">No directories found.</div>
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => currentPath && onSelect(currentPath)} disabled={!currentPath}>
          Select This Folder
        </Button>
      </div>
    </div>
  )
}
