// src/pages/SettingsPage.tsx
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Sun, Moon, ShieldCheck, ShieldOff, Wrench, Download, Upload,
  FlaskConical, ChevronRight, User2, Info, Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useWorkout } from '@/context/WorkoutContext'

const adminSchema = z.object({ password: z.string().min(1, 'Password required') })
type AdminForm = z.infer<typeof adminSchema>

function SettingRow({
  icon,
  label,
  description,
  children,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  children?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick && !children}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/40 disabled:pointer-events-none"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground leading-snug">{description}</p>}
      </div>
      {children ?? (onClick && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />)}
    </button>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="px-5 pb-1.5 pt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {title}
    </p>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { isAdminMode, setAdminMode, workoutHistory, importWorkouts, loadDemoData } = useWorkout()

  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [adminError, setAdminError] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const [autoStartRest, setAutoStartRest] = useState(
    () => localStorage.getItem('rest-timer-auto-start') === 'true',
  )

  function toggleAutoStartRest() {
    const next = !autoStartRest
    setAutoStartRest(next)
    localStorage.setItem('rest-timer-auto-start', next ? 'true' : 'false')
  }

  const adminForm = useForm<AdminForm>({ resolver: zodResolver(adminSchema) })

  function handleAdminSubmit(data: AdminForm) {
    // INSECURE: demo only
    if (data.password === 'admin123') {
      setAdminMode(true)
      setAdminDialogOpen(false)
      setAdminError('')
      adminForm.reset()
    } else {
      setAdminError('Incorrect password.')
    }
  }

  async function handleExportJSON() {
    const blob = new Blob([JSON.stringify(workoutHistory, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gym-tracker-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
    a.click()
    URL.revokeObjectURL(url)
    const { toast } = await import('sonner')
    toast.success(`Exported ${workoutHistory.length} workouts`)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importWorkouts(data)
    } catch {
      const { toast } = await import('sonner')
      toast.error('Failed to import — invalid JSON file.')
    } finally {
      e.target.value = ''
    }
  }

  const isDark = (theme === 'dark') || (theme === 'system' && resolvedTheme === 'dark')

  return (
    <div className="mx-auto max-w-lg pb-28 page-transition">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">App preferences and data management</p>
      </div>

      {/* Account */}
      <SectionHeader title="Account" />
      <Card className="mx-4 overflow-hidden rounded-2xl border-0 bg-card shadow-none ring-1 ring-border">
        <CardContent className="p-0 divide-y divide-border/60">
          <SettingRow
            icon={<User2 className="h-4 w-4" />}
            label="Profile"
            description="Body stats, goals and active plan"
            onClick={() => navigate('/profile')}
          />
        </CardContent>
      </Card>

      {/* Appearance */}
      <SectionHeader title="Appearance" />
      <Card className="mx-4 overflow-hidden rounded-2xl border-0 bg-card shadow-none ring-1 ring-border">
        <CardContent className="p-0">
          <SettingRow
            icon={isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            label="Theme"
            description={isDark ? 'Dark mode active' : 'Light mode active'}
          >
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isDark ? 'bg-primary' : 'bg-muted'
              }`}
              role="switch"
              aria-checked={isDark}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </SettingRow>
        </CardContent>
      </Card>

      {/* Workout */}
      <SectionHeader title="Workout" />
      <Card className="mx-4 overflow-hidden rounded-2xl border-0 bg-card shadow-none ring-1 ring-border">
        <CardContent className="p-0">
          <SettingRow
            icon={<Timer className="h-4 w-4" />}
            label="Auto-start rest timer"
            description="Start rest timer automatically after logging a set"
          >
            <button
              onClick={toggleAutoStartRest}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                autoStartRest ? 'bg-primary' : 'bg-muted'
              }`}
              role="switch"
              aria-checked={autoStartRest}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  autoStartRest ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </SettingRow>
        </CardContent>
      </Card>

      {/* Admin */}
      <SectionHeader title="Admin" />
      <Card className="mx-4 overflow-hidden rounded-2xl border-0 bg-card shadow-none ring-1 ring-border">
        <CardContent className="p-0 divide-y divide-border/60">
          {isAdminMode ? (
            <>
              <SettingRow
                icon={<ShieldCheck className="h-4 w-4 text-primary" />}
                label="Admin Mode Active"
                description="Machine configuration is unlocked"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => setAdminMode(false)}
                >
                  Disable
                </Button>
              </SettingRow>
              <SettingRow
                icon={<Wrench className="h-4 w-4" />}
                label="Manage Machines"
                description="Assign QR codes to equipment"
                onClick={() => navigate('/admin/machines')}
              />
            </>
          ) : (
            <SettingRow
              icon={<ShieldOff className="h-4 w-4" />}
              label="Enable Admin Mode"
              description="Unlock machine configuration"
              onClick={() => {
                setAdminError('')
                adminForm.reset()
                setAdminDialogOpen(true)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Data */}
      <SectionHeader title="Data" />
      <Card className="mx-4 overflow-hidden rounded-2xl border-0 bg-card shadow-none ring-1 ring-border">
        <CardContent className="p-0 divide-y divide-border/60">
          <SettingRow
            icon={<FlaskConical className="h-4 w-4" />}
            label="Load Demo Data"
            description="Fill app with sample workout history"
            onClick={loadDemoData}
          />
          <SettingRow
            icon={<Upload className="h-4 w-4" />}
            label="Import Workouts"
            description="Restore from a JSON backup"
            onClick={() => importRef.current?.click()}
          />
          {workoutHistory.length > 0 && (
            <SettingRow
              icon={<Download className="h-4 w-4" />}
              label="Export Workouts"
              description={`${workoutHistory.length} workouts · JSON backup`}
              onClick={handleExportJSON}
            />
          )}
        </CardContent>
      </Card>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />

      {/* About */}
      <SectionHeader title="About" />
      <Card className="mx-4 overflow-hidden rounded-2xl border-0 bg-card shadow-none ring-1 ring-border">
        <CardContent className="p-0">
          <SettingRow
            icon={<Info className="h-4 w-4" />}
            label="Gym Tracker v4"
            description="PWA · IndexedDB · Built with React + Vite"
          />
        </CardContent>
      </Card>

      {/* Admin password dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
          </DialogHeader>
          <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-4">
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="Enter admin password"
                className="mt-1.5"
                {...adminForm.register('password')}
              />
              {adminError && <p className="mt-1 text-xs text-destructive">{adminError}</p>}
              {adminForm.formState.errors.password && (
                <p className="mt-1 text-xs text-destructive">{adminForm.formState.errors.password.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Unlock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
