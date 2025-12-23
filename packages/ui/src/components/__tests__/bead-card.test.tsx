import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BeadCard, getBeadState, isTransient, createTransientBead, type UnifiedBead, type BeadOrTransient } from '../bead-card'

describe('BeadCard', () => {
  const mockOnClick = vi.fn()
  const mockOnRetry = vi.fn()
  const columnCardBorder = 'hover:border-blue-400/70'

  describe('helper functions', () => {
    describe('getBeadState', () => {
      it('returns idle for regular bead', () => {
        const bead: UnifiedBead = {
          id: 'bd-123',
          title: 'Test bead',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
        }
        expect(getBeadState(bead)).toBe('idle')
      })

      it('returns generating for transient bead in generating state', () => {
        const bead: UnifiedBead = {
          id: 'bd-123',
          transientId: 'trans-1',
          state: 'generating',
          title: 'Generating title...',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
        }
        expect(getBeadState(bead)).toBe('generating')
      })

      it('returns error for transient bead in error state', () => {
        const bead: UnifiedBead = {
          id: 'bd-123',
          transientId: 'trans-1',
          state: 'error',
          error: 'API error',
          title: 'Generating title...',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
        }
        expect(getBeadState(bead)).toBe('error')
      })

      it('returns completed for transient bead in completed state', () => {
        const bead: UnifiedBead = {
          id: 'bd-123',
          transientId: 'trans-1',
          state: 'completed',
          title: 'Generated title',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
        }
        expect(getBeadState(bead)).toBe('completed')
      })

      it('returns resolved for transient bead in resolved state', () => {
        const bead: UnifiedBead = {
          id: 'bd-123',
          transientId: 'trans-1',
          state: 'resolved',
          title: 'Test bead',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
        }
        expect(getBeadState(bead)).toBe('resolved')
      })
    })

    describe('isTransient', () => {
      it('returns false for regular bead', () => {
        const bead: UnifiedBead = {
          id: 'bd-123',
          title: 'Test bead',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
        }
        expect(isTransient(bead)).toBe(false)
      })

      it('returns true for transient bead', () => {
        const bead: UnifiedBead = {
          id: 'bd-123',
          transientId: 'trans-1',
          state: 'generating',
          title: 'Generating title...',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
        }
        expect(isTransient(bead)).toBe(true)
      })
    })

    describe('createTransientBead', () => {
      const apiBead: BeadOrTransient = {
        id: 'bd-123',
        title: 'Test bead',
        description: 'Test description',
        status: 'open',
        priority: 1,
        issue_type: 'task',
        created_at: '2025-01-01T00:00:00Z',
      }

      it('creates idle state bead from API bead', () => {
        const result = createTransientBead(apiBead, 'idle')
        expect(result).toEqual({
          id: 'bd-123',
          title: 'Test bead',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
          created_at: '2025-01-01T00:00:00Z',
        })
      })

      it('creates resolved state bead from API bead', () => {
        const result = createTransientBead(apiBead, 'resolved')
        expect(getBeadState(result)).toBe('resolved')
      })

      it('creates generating state bead from API transient bead', () => {
        const apiTransient: BeadOrTransient = {
          id: 'bd-123',
          transientId: 'trans-1',
          title: 'Generating title...',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
          created_at: '2025-01-01T00:00:00Z',
        } as any
        const result = createTransientBead(apiTransient, 'generating')
        expect(getBeadState(result)).toBe('generating')
        expect(isTransient(result)).toBe(true)
      })

      it('includes error for transient bead in error state', () => {
        const apiTransient: BeadOrTransient = {
          id: 'bd-123',
          transientId: 'trans-1',
          title: 'Generating title...',
          description: 'Test description',
          status: 'open',
          priority: 1,
          issue_type: 'task',
        } as any
        const result = createTransientBead(apiTransient, 'error', 'API failed')
        expect(getBeadState(result)).toBe('error')
        if (isTransient(result)) {
          expect(result.error).toBe('API failed')
        }
      })
    })
  })

  describe('rendering', () => {
    it('renders regular bead with id and priority', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        title: 'Test bead',
        description: 'Test description',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} columnCardBorder={columnCardBorder} />)

      expect(screen.getByText('bd-123')).toBeInTheDocument()
      expect(screen.getByText('Test bead')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByText('P1')).toBeInTheDocument()
    })

    it('renders generating state with loading indicator', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        transientId: 'trans-1',
        state: 'generating',
        title: 'Generating title...',
        description: 'Test description',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} columnCardBorder={columnCardBorder} />)

      expect(screen.getByText('Generating title...')).toBeInTheDocument()
      expect(screen.queryByText('P1')).not.toBeInTheDocument()
      expect(screen.queryByText('bd-123')).not.toBeInTheDocument()
    })

    it('renders completed state with success message', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        transientId: 'trans-1',
        state: 'completed',
        title: 'Generated title',
        description: 'Test description',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} columnCardBorder={columnCardBorder} />)

      expect(screen.getByText('Generated title')).toBeInTheDocument()
      expect(screen.getByText('✓ Title generated')).toBeInTheDocument()
    })

    it('renders error state with error message and retry button', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        transientId: 'trans-1',
        state: 'error',
        error: 'API failed',
        title: 'Generating title...',
        description: 'Test description',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} onRetry={mockOnRetry} columnCardBorder={columnCardBorder} />)

      expect(screen.getByText('Error: API failed')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('renders resolved state like regular bead', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        transientId: 'trans-1',
        state: 'resolved',
        title: 'Resolved bead',
        description: 'Test description',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} columnCardBorder={columnCardBorder} />)

      expect(screen.getByText('bd-123')).toBeInTheDocument()
      expect(screen.getByText('Resolved bead')).toBeInTheDocument()
      expect(screen.getByText('P1')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onClick when card is clicked', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        title: 'Test bead',
        description: 'Test description',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} columnCardBorder={columnCardBorder} />)

      const card = screen.getByText('Test bead').closest('.cursor-pointer')
      expect(card).toBeInTheDocument()
      if (card) {
        fireEvent.click(card)
        expect(mockOnClick).toHaveBeenCalledTimes(1)
      }
    })

    it('calls onRetry when retry button is clicked', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        transientId: 'trans-1',
        state: 'error',
        error: 'API failed',
        title: 'Generating title...',
        description: 'Test description',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} onRetry={mockOnRetry} columnCardBorder={columnCardBorder} />)

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)
      expect(mockOnRetry).toHaveBeenCalledTimes(1)
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('renders with empty description', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        title: 'Test bead',
        description: '',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} columnCardBorder={columnCardBorder} />)

      expect(screen.getByText('No description')).toBeInTheDocument()
    })

    it('renders with undefined description', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        title: 'Test bead',
        description: '',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} columnCardBorder={columnCardBorder} />)

      expect(screen.getByText('No description')).toBeInTheDocument()
    })

    it('does not show retry button when onRetry is not provided', () => {
      const bead: UnifiedBead = {
        id: 'bd-123',
        transientId: 'trans-1',
        state: 'error',
        error: 'API failed',
        title: 'Generating title...',
        description: 'Test description',
        status: 'open',
        priority: 1,
        issue_type: 'task',
      }

      render(<BeadCard bead={bead} onClick={mockOnClick} columnCardBorder={columnCardBorder} />)

      expect(screen.getByText('Error: API failed')).toBeInTheDocument()
      expect(screen.queryByText('Retry')).not.toBeInTheDocument()
    })
  })
})
