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
      0: 'bg-[var(--destructive)] text-destructive-foreground',
      1: 'bg-[var(--color-warning)] text-foreground',
      2: 'bg-[var(--color-info)] text-primary-foreground',
      3: 'bg-[var(--color-success)] text-primary-foreground',
      4: 'bg-muted text-foreground'
    },
    in_progress: {
      0: 'bg-[var(--destructive)] text-destructive-foreground',
      1: 'bg-[var(--color-emphasis)] text-primary-foreground',
      2: 'bg-[var(--color-info)] text-primary-foreground',
      3: 'bg-primary text-primary-foreground',
      4: 'bg-muted text-foreground'
    },
    done: {
      0: 'bg-[var(--color-success)] text-primary-foreground',
      1: 'bg-[var(--color-success)] text-primary-foreground',
      2: 'bg-[var(--color-success)] text-primary-foreground',
      3: 'bg-[var(--color-info)] text-primary-foreground',
      4: 'bg-muted text-foreground'
    }
  }

  const statusColors = priorityColors[status] || priorityColors.open
  return statusColors[priority] || 'bg-muted text-foreground'
}

/**
 * Get the label for a priority level
 * @param priority - Priority level (0-4)
 * @returns Human-readable priority label
 */
export function getPriorityLabel(priority: number): string {
  return PRIORITY_LABELS[priority] || 'Medium'
}
