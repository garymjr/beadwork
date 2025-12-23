/**
 * Priority labels for display
 */
export const PRIORITY_LABELS: Record<number, string> = {
  0: 'Critical',
  1: 'High',
  2: 'Medium',
  3: 'Low',
  4: 'Backlog'
}

/**
 * Get the color classes for a priority badge based on priority and status
 * @param priority - Priority level (0-4)
 * @param status - Issue status ('open', 'in_progress', 'done', etc.)
 * @returns Tailwind CSS classes for the badge
 */
export function getPriorityColor(priority: number, status: string): string {
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
  return statusColors[priority] || 'bg-gray-500 text-white'
}

/**
 * Get the label for a priority level
 * @param priority - Priority level (0-4)
 * @returns Human-readable priority label
 */
export function getPriorityLabel(priority: number): string {
  return PRIORITY_LABELS[priority] || 'Medium'
}
