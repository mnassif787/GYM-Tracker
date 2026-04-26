// src/components/Navbar.tsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, Dumbbell, TrendingUp, LayoutGrid,
  QrCode, LayoutTemplate, History, ListChecks,
  User2, Settings, Wrench, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkout } from '@/context/WorkoutContext'
import {
  BottomSheet, BottomSheetContent,
  BottomSheetHeader, BottomSheetTitle, BottomSheetClose,
} from '@/components/ui/bottom-sheet'

const PRIMARY_TABS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/log', label: 'Log', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
]

const MORE_ITEMS = [
  { to: '/scan', label: 'Scan Machine', icon: QrCode, description: 'QR code exercise start' },
  { to: '/templates', label: 'Plans', icon: LayoutTemplate, description: 'Workout templates' },
  { to: '/history', label: 'History', icon: History, description: 'Past workouts' },
  { to: '/exercises', label: 'Exercises', icon: ListChecks, description: 'Exercise library' },
  { to: '/profile', label: 'Profile', icon: User2, description: 'Body stats & goals' },
  { to: '/settings', label: 'Settings', icon: Settings, description: 'Theme, units & data' },
]

export function Navbar() {
  const { isAdminMode, currentExercise } = useWorkout()
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  function handleMoreNav(to: string) {
    setMoreOpen(false)
    navigate(to)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-screen-sm items-stretch justify-around pb-safe">
          {PRIMARY_TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150',
                    isActive && 'bg-primary/15',
                  )}>
                    <Icon className="h-5 w-5" />
                    {to === '/log' && currentExercise && (
                      <span className="absolute right-0.5 top-0.5 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                    )}
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
              moreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150',
              moreOpen && 'bg-primary/15',
            )}>
              <LayoutGrid className="h-5 w-5" />
            </div>
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* More drawer */}
      <BottomSheet open={moreOpen} onOpenChange={setMoreOpen}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Menu</BottomSheetTitle>
            <BottomSheetClose asChild>
              <button className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </BottomSheetClose>
          </BottomSheetHeader>

          <div className="grid grid-cols-2 gap-2.5 px-4 pb-8 pt-1">
            {MORE_ITEMS.map(({ to, label, icon: Icon, description }) => (
              <button
                key={to}
                onClick={() => handleMoreNav(to)}
                className="flex flex-col gap-2.5 rounded-2xl border border-border bg-background p-4 text-left transition-all active:scale-95 hover:border-primary/30 hover:bg-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs leading-snug text-muted-foreground">{description}</p>
                </div>
              </button>
            ))}

            {isAdminMode && (
              <button
                onClick={() => handleMoreNav('/admin/machines')}
                className="flex flex-col gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left transition-all active:scale-95 hover:bg-primary/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Machines</p>
                  <p className="text-xs leading-snug text-muted-foreground">Assign QR codes</p>
                </div>
              </button>
            )}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}

