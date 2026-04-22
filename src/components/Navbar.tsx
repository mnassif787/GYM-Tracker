// src/components/Navbar.tsx
import { NavLink } from 'react-router-dom'
import { QrCode, Dumbbell, TrendingUp, History, Wrench, User2, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkout } from '@/context/WorkoutContext'

const navItems = [
  { to: '/scan', label: 'Scan', icon: QrCode },
  { to: '/log', label: 'Log', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/history', label: 'History', icon: History },
  { to: '/templates', label: 'Plans', icon: LayoutTemplate },
  { to: '/profile', label: 'Profile', icon: User2 },
]

export function Navbar() {
  const { isAdminMode } = useWorkout()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-md items-center justify-around px-1 py-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-w-[48px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
        {isAdminMode && (
          <NavLink
            to="/admin/machines"
            className={({ isActive }) =>
              cn(
                'flex min-w-[48px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Wrench className="h-5 w-5" />
            <span>Machines</span>
          </NavLink>
        )}
      </div>
    </nav>
  )
}

