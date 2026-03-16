'use client'

// Dashboard layout — wraps all the main app pages.
// Shows a bottom navigation bar so the user can switch between sections.
// This is a client component because it uses usePathname to highlight the active tab.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WorkoutSessionProvider, useWorkoutSession } from '@/lib/workout-session-context'

// SVG icons for the bottom nav tabs
function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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
  { href: '/reserve', label: 'Reserve', Icon: BookmarkIcon },
  { href: '/workouts/new', label: 'Workout', Icon: PlusCircleIcon },
  { href: '/history', label: 'History', Icon: ClockIcon },
]

// Inner component so it can consume WorkoutSessionContext
function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { session } = useWorkoutSession()

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
            const isWorkoutTab = href === '/workouts/new'
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {/* Icon with optional active-workout dot */}
                <span className="relative">
                  <Icon className="w-5 h-5" />
                  {isWorkoutTab && session && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </span>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkoutSessionProvider>
      <DashboardInner>{children}</DashboardInner>
    </WorkoutSessionProvider>
  )
}
