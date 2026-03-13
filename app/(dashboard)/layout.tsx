'use client'

// Dashboard layout — wraps all the main app pages.
// Shows a bottom navigation bar so the user can switch between sections.
// This is a client component because it uses usePathname to highlight the active tab.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// SVG icons for the bottom nav tabs
function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14M18 5v14M6 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M6 12h12" />
    </svg>
  )
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const tabs = [
  { href: '/exercises', label: 'Exercises', Icon: DumbbellIcon },
  { href: '/workouts/new', label: 'New Workout', Icon: PlusCircleIcon },
  { href: '/history', label: 'History', Icon: ClockIcon },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page content — takes up all space above the bottom nav */}
      <main className="flex-1 pb-20 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(({ href, label, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
