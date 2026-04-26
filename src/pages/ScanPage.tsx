// src/pages/ScanPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import QRCode from 'qrcode'
import {
  Dumbbell, ChevronRight, RotateCcw, History, Pencil, ShieldCheck, Download, QrCode, Link, Search, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Scanner } from '@/components/Scanner'
import type { Exercise } from '@/lib/types'
import { useWorkout } from '@/context/WorkoutContext'

// ─── Admin password form schema ───────────────────────────────────────────────
const adminSchema = z.object({ password: z.string().min(1) })
type AdminForm = z.infer<typeof adminSchema>

// ─── Edit exercise form schema ────────────────────────────────────────────────
const editSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetMuscles: z.string().min(1, 'Enter at least one muscle'),
  qrCode: z.string().min(1, 'QR code identifier is required'),
  instructions: z.string().optional(),
  recommendedSets: z.coerce.number().int().min(1).max(20),
  recommendedReps: z.coerce.number().int().min(1).max(100),
})
type EditForm = z.infer<typeof editSchema>

type BodyTypeGoal = 'strength' | 'hypertrophy' | 'endurance' | 'toning'
const BODY_TYPE_PRESETS: Record<BodyTypeGoal, { sets: number; reps: number }> = {
  strength:    { sets: 5, reps: 5 },
  hypertrophy: { sets: 4, reps: 12 },
  endurance:   { sets: 3, reps: 15 },
  toning:      { sets: 3, reps: 10 },
}

export function ScanPage() {
  const navigate = useNavigate()
  const { startWorkout, saveExercise, exercises, workoutHistory, isAdminMode, setAdminMode } = useWorkout()

  const [scannedExercise, setScannedExercise] = useState<Exercise | null>(null)

  // Assign barcode dialog state (admin only)
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignExerciseId, setAssignExerciseId] = useState('')

  // Browse dialog state
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browseSearch, setBrowseSearch] = useState('')

  // Admin dialog state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [adminError, setAdminError] = useState('')

  // Edit exercise dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [bodyTypeGoal, setBodyTypeGoal] = useState<BodyTypeGoal | ''>('')

  // QR display dialog state
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // ─── Admin password form ──────────────────────────────────────────────────
  const adminForm = useForm<AdminForm>({ resolver: zodResolver(adminSchema) })

  function handleAdminSubmit(data: AdminForm) {
    // INSECURE: demo only, replace with proper authentication
    if (data.password === 'admin123') {
      setAdminMode(true)
      setAdminDialogOpen(false)
      setAdminError('')
      adminForm.reset()
    } else {
      setAdminError('Incorrect password.')
    }
  }

  // ─── Edit exercise form ───────────────────────────────────────────────────
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) })

  function openEditDialog(exercise: Exercise) {
    editForm.reset({
      name: exercise.name,
      targetMuscles: exercise.targetMuscles.join(', '),
      qrCode: exercise.qrCode ?? '',
      instructions: exercise.instructions ?? '',
      recommendedSets: exercise.recommendedSets ?? 3,
      recommendedReps: exercise.recommendedReps ?? 10,
    })
    setBodyTypeGoal('')
    setEditDialogOpen(true)
  }

  async function handleEditSave(data: EditForm) {
    if (!scannedExercise) return
    const updated: Exercise = {
      ...scannedExercise,
      name: data.name,
      targetMuscles: data.targetMuscles.split(',').map((m) => m.trim()).filter(Boolean),
      qrCode: data.qrCode,
      instructions: data.instructions,
      recommendedSets: data.recommendedSets,
      recommendedReps: data.recommendedReps,
    }
    await saveExercise(updated)
    setScannedExercise(updated)
    setEditDialogOpen(false)
  }

  function applyBodyTypeGoal(goal: BodyTypeGoal) {
    const preset = BODY_TYPE_PRESETS[goal]
    editForm.setValue('recommendedSets', preset.sets)
    editForm.setValue('recommendedReps', preset.reps)
    setBodyTypeGoal(goal)
  }

  // ─── QR Code generation ───────────────────────────────────────────────────
  async function handleGenerateQR(qrCodeId: string) {
    try {
      const url = await QRCode.toDataURL(qrCodeId, { width: 256, margin: 2 })
      setQrDataUrl(url)
      setQrDialogOpen(true)
    } catch (e) {
      console.error('QR generation error', e)
    }
  }

  // ─── Scan success handler ─────────────────────────────────────────────────
  function handleScanSuccess(exercise: Exercise) {
    setScannedExercise(exercise)
  }

  function handleUnknownCode(code: string) {
    if (isAdminMode) {
      setPendingBarcode(code)
      setAssignExerciseId('')
      setAssignDialogOpen(true)
    } else {
      import('sonner').then(({ toast }) =>
        toast.error(`Code "${code}" not assigned to any exercise.`),
      )
    }
  }

  async function handleAssignBarcode() {
    const ex = exercises.find((e) => e.id === assignExerciseId)
    if (!ex || !pendingBarcode) return
    await saveExercise({ ...ex, qrCode: pendingBarcode })
    setAssignDialogOpen(false)
    setPendingBarcode(null)
  }

  function handleStartWorkout() {
    if (!scannedExercise) return
    startWorkout(scannedExercise)
    navigate('/log')
  }

  // ─── Recent + browse derived lists ───────────────────────────────────────
  const recentExercises = useMemo(() => {
    const seen = new Set<string>()
    const result: Exercise[] = []
    for (const w of workoutHistory) {
      if (!seen.has(w.exerciseId)) {
        seen.add(w.exerciseId)
        const ex = exercises.find((e) => e.id === w.exerciseId)
        if (ex) result.push(ex)
      }
      if (result.length === 4) break
    }
    return result
  }, [workoutHistory, exercises])

  const recentExerciseIds = useMemo(
    () => new Set(recentExercises.map((e) => e.id)),
    [recentExercises],
  )

  const browseFiltered = useMemo(() => {
    const q = browseSearch.toLowerCase()
    return !q
      ? exercises
      : exercises.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.targetMuscles.some((m) => m.toLowerCase().includes(q)),
        )
  }, [exercises, browseSearch])

  function handlePickExercise(exercise: Exercise) {
    setBrowseOpen(false)
    setBrowseSearch('')
    startWorkout(exercise)
    navigate('/log')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Scan</h1>
        <p className="text-sm text-muted-foreground">
          Point your camera at a gym machine QR code
        </p>
      </div>

      {!scannedExercise ? (
        <div className="flex flex-col gap-6">
          <Scanner onScanSuccess={handleScanSuccess} onUnknownCode={handleUnknownCode} />

          {/* Admin access (hidden until tapped — ghost button) */}
          {!isAdminMode && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground"
                onClick={() => setAdminDialogOpen(true)}
              >
                Admin Access
              </Button>
            </div>
          )}
          {isAdminMode && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 flex items-center justify-between gap-3">
              <span className="text-xs text-primary font-medium">Admin mode active</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setAdminMode(false)}
              >
                Logout
              </Button>
            </div>
          )}

          {/* Recent exercises */}
          {recentExercises.length > 0 && (
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recent
              </p>
              <div className="flex flex-col gap-2">
                {recentExercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handlePickExercise(ex)}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-all active:scale-[0.98] hover:border-primary/20 hover:bg-accent/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.targetMuscles.join(', ')}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Browse all */}
          <Button variant="outline" className="w-full" onClick={() => setBrowseOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            Browse All Exercises
          </Button>
        </div>
      ) : (
        /* ── Exercise Result Card ── */
        <Card className="rounded-3xl border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{scannedExercise.name}</CardTitle>
                {(scannedExercise.machineName || scannedExercise.machineLocation) && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[scannedExercise.machineName, scannedExercise.machineLocation]
                      .filter(Boolean)
                      .join(' — ')}
                  </p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {scannedExercise.targetMuscles.map((m) => (
                <Badge key={m} variant="secondary">{m}</Badge>
              ))}
            </div>

            {scannedExercise.instructions && (
              <p className="text-sm text-muted-foreground">{scannedExercise.instructions}</p>
            )}

            {(scannedExercise.recommendedSets || scannedExercise.recommendedReps) && (
              <p className="text-sm font-medium">
                Recommended:{' '}
                <span className="text-primary">
                  {scannedExercise.recommendedSets}×{scannedExercise.recommendedReps}
                </span>
              </p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleStartWorkout} className="w-full">
                <Dumbbell className="mr-2 h-4 w-4" />
                Start Workout
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/exercise-history/${scannedExercise.id}`)}
              >
                <History className="mr-2 h-4 w-4" />
                View Exercise History
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => { setScannedExercise(null) }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Scan Again
              </Button>

              {/* Admin: edit exercise */}
              {isAdminMode && scannedExercise.isEditable && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => openEditDialog(scannedExercise)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Exercise
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Admin Password Dialog ─────────────────────────────────────────── */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Admin Access
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                {...adminForm.register('password')}
                className="mt-1"
              />
              {adminError && <p className="mt-1 text-sm text-destructive">{adminError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAdminDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Unlock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Exercise Dialog ──────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSave)} className="flex flex-col gap-4">
            <div>
              <Label>Name</Label>
              <Input {...editForm.register('name')} className="mt-1" />
              {editForm.formState.errors.name && (
                <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label>Target Muscles (comma-separated)</Label>
              <Input {...editForm.register('targetMuscles')} placeholder="Chest, Triceps" className="mt-1" />
            </div>
            <div>
              <Label>QR Code Identifier</Label>
              <Input {...editForm.register('qrCode')} placeholder="GYM-001" className="mt-1" />
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea {...editForm.register('instructions')} className="mt-1" rows={3} />
            </div>

            {/* Body Type Goal presets */}
            <div>
              <Label>Body Type Goal (auto-fills sets/reps)</Label>
              <Select
                value={bodyTypeGoal}
                onValueChange={(v) => applyBodyTypeGoal(v as BodyTypeGoal)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select goal…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength (5×5)</SelectItem>
                  <SelectItem value="hypertrophy">Hypertrophy (4×12)</SelectItem>
                  <SelectItem value="endurance">Endurance (3×15)</SelectItem>
                  <SelectItem value="toning">Toning (3×10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recommended Sets</Label>
                <Input type="number" {...editForm.register('recommendedSets')} className="mt-1" />
              </div>
              <div>
                <Label>Recommended Reps</Label>
                <Input type="number" {...editForm.register('recommendedReps')} className="mt-1" />
              </div>
            </div>

            {/* Generate QR Code */}
            {editForm.watch('qrCode') && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleGenerateQR(editForm.getValues('qrCode'))}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Generate QR Code
              </Button>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── QR Display Dialog ────────────────────────────────────────────── */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="flex flex-col items-center gap-4">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          {qrDataUrl && (
            <>
              <img
                src={qrDataUrl}
                alt="Generated QR code"
                className="rounded-lg border p-2 bg-white"
                width={256}
                height={256}
              />
              <a
                href={qrDataUrl}
                download={`${editForm.getValues('qrCode') ?? 'qrcode'}.png`}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Assign Barcode Dialog (admin) ────────────────────────────────── */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" /> Assign Barcode to Exercise
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Scanned code</p>
              <p className="rounded bg-muted px-3 py-2 font-mono text-sm break-all">{pendingBarcode}</p>
            </div>
            <div>
              <Label>Exercise</Label>
              <Select value={assignExerciseId} onValueChange={setAssignExerciseId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose exercise…" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button disabled={!assignExerciseId} onClick={handleAssignBarcode}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Browse Exercises Dialog ──────────────────────────────────────── */}
      <Dialog open={browseOpen} onOpenChange={(o) => { setBrowseOpen(o); if (!o) setBrowseSearch('') }}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0">
          <DialogHeader className="px-4 pb-2 pt-4">
            <DialogTitle>Browse Exercises</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or muscle…"
                value={browseSearch}
                onChange={(e) => setBrowseSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-2">
              {browseFiltered.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handlePickExercise(ex)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-all active:scale-[0.98] hover:border-primary/20 hover:bg-accent/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{ex.name}</p>
                      {recentExerciseIds.has(ex.id) && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary shrink-0">
                          <Check className="h-2.5 w-2.5" /> Recent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{ex.targetMuscles.join(', ')}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
              {browseFiltered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No exercises found.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
