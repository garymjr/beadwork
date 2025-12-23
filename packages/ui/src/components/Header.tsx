import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import {
  Home,
  Menu,
  X,
} from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="p-4 flex items-center bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-xl backdrop-blur-sm border-b border-border/20">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-card/20 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
          aria-label="Open menu"
        >
          <Menu size={24} className="drop-shadow-sm" />
        </button>
        <h1 className="ml-4 text-xl font-bold tracking-wide">
          <Link to="/" className="hover:scale-105 transition-transform duration-300 inline-block">
            <img
              src="/tanstack-word-logo-white.svg"
              alt="TanStack Logo"
              className="h-10 drop-shadow-md"
            />
          </Link>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--color-emphasis)] rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[var(--color-highlight)] rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-[var(--color-success)] rounded-full animate-pulse delay-150"></div>
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-primary to-accent text-primary-foreground shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col backdrop-blur-md border-r border-border/30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/20 bg-card/5 backdrop-blur-sm">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary-foreground to-accent bg-clip-text text-transparent">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-card/20 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
            aria-label="Close menu"
          >
            <X size={24} className="drop-shadow-sm" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-card/10 transition-all duration-300 mb-2 hover:scale-102 hover:shadow-md backdrop-blur-sm border border-transparent hover:border-border/20"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[var(--color-emphasis)] to-[var(--color-highlight)] hover:from-[var(--color-emphasis)]/90 hover:to-[var(--color-highlight)]/90 transition-all duration-300 mb-2 shadow-lg border border-border/30 scale-102',
            }}
          >
            <Home size={20} className="drop-shadow-sm" />
            <span className="font-medium">Home</span>
          </Link>
        </nav>
      </aside>
      
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
    </>
  )
}