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
      0: 'bg-gradient-to-r from-red-600 to-red-500 text-white border-red-400 shadow-lg shadow-red-500/30',
      1: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/30',
      2: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400 shadow-md shadow-blue-500/30',
      3: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30',
      4: 'bg-gradient-to-r from-gray-400 to-gray-300 text-gray-700 border-gray-300'
    },
    in_progress: {
      0: 'bg-gradient-to-r from-red-600 to-red-500 text-white border-red-400 shadow-lg shadow-red-500/30',
      1: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-purple-400 shadow-lg shadow-purple-500/30',
      2: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400 shadow-md shadow-blue-500/30',
      3: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30',
      4: 'bg-gradient-to-r from-gray-400 to-gray-300 text-gray-700 border-gray-300'
    },
    done: {
      0: 'bg-gradient-to-r from-emerald-600 to-green-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30',
      1: 'bg-gradient-to-r from-emerald-600 to-green-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30',
      2: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30',
      3: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-teal-400 shadow-md shadow-teal-500/30',
      4: 'bg-gradient-to-r from-gray-400 to-gray-300 text-gray-700 border-gray-300'
    }
  }

  const statusColors = priorityColors[status] || priorityColors.open
  return statusColors[priority] || 'bg-gradient-to-r from-gray-400 to-gray-300 text-gray-700 border-gray-300'
}

/**
 * Get the label for a priority level
 * @param priority - Priority level (0-4)
 * @returns Human-readable priority label
 */
export function getPriorityLabel(priority: number): string {
  return PRIORITY_LABELS[priority] || 'Medium'
}
