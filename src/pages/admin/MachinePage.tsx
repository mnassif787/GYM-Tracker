// src/pages/admin/MachinePage.tsx
// Admin-only screen for assigning machine names, locations, and QR code IDs to exercises.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import QRCode from 'qrcode'
import { Pencil, QrCode, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkout } from '@/context/WorkoutContext'
import type { Exercise } from '@/lib/types'

// ─── Machine config form schema ───────────────────────────────────────────────
const machineSchema = z.object({
  machineName: z.string().min(1, 'Machine name is required'),
  machineLocation: z.string().optional(),
  qrCode: z.string().min(1, 'QR code identifier is required'),
})
type MachineForm = z.infer<typeof machineSchema>

export function MachinePage() {
  const { exercises, saveExercise } = useWorkout()

  const [configTarget, setConfigTarget] = useState<Exercise | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [qrLabel, setQrLabel] = useState('')

  const form = useForm<MachineForm>({ resolver: zodResolver(machineSchema) })

  function openConfig(exercise: Exercise) {
    form.reset({
      machineName: exercise.machineName ?? '',
      machineLocation: exercise.machineLocation ?? '',
      qrCode: exercise.qrCode ?? '',
    })
    setConfigTarget(exercise)
  }

  async function handleSave(data: MachineForm) {
    if (!configTarget) return
    await saveExercise({
      ...configTarget,
      machineName: data.machineName,
      machineLocation: data.machineLocation,
      qrCode: data.qrCode,
    })
    setConfigTarget(null)
  }

  async function handleClearMachine(exercise: Exercise) {
    await saveExercise({
      ...exercise,
      machineName: undefined,
      machineLocation: undefined,
    })
  }

  async function handleGenerateQR(qrCodeId: string, label: string) {
    try {
      const url = await QRCode.toDataURL(qrCodeId, { width: 256, margin: 2 })
      setQrDataUrl(url)
      setQrLabel(label)
      setQrDialogOpen(true)
    } catch (e) {
      console.error('QR generation failed', e)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Machine Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assign machine names, locations, and QR codes to exercises.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {exercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              {/* Exercise info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{exercise.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {exercise.targetMuscles.map((m) => (
                    <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                  ))}
                </div>
                {exercise.machineName && (
                  <p className="mt-1 text-sm text-primary">
                    {exercise.machineName}
                    {exercise.machineLocation && ` — ${exercise.machineLocation}`}
                  </p>
                )}
                {exercise.qrCode && (
                  <p className="text-xs text-muted-foreground">QR: {exercise.qrCode}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openConfig(exercise)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Configure
                </Button>

                {exercise.qrCode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateQR(exercise.qrCode!, exercise.name)}
                  >
                    <QrCode className="mr-1.5 h-3.5 w-3.5" />
                    QR
                  </Button>
                )}

                {exercise.machineName && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleClearMachine(exercise)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Machine Config Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!configTarget} onOpenChange={(open) => { if (!open) setConfigTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Machine — {configTarget?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)} className="flex flex-col gap-4">
            <div>
              <Label>Machine Name</Label>
              <Input
                {...form.register('machineName')}
                placeholder="Leg Press Machine"
                className="mt-1"
              />
              {form.formState.errors.machineName && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.machineName.message}
                </p>
              )}
            </div>
            <div>
              <Label>Location</Label>
              <Input
                {...form.register('machineLocation')}
                placeholder="Zone A, Row 2"
                className="mt-1"
              />
            </div>
            <div>
              <Label>QR Code Identifier</Label>
              <Input
                {...form.register('qrCode')}
                placeholder="GYM-001"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This value will be encoded in the QR code printed on the machine.
              </p>
              {form.formState.errors.qrCode && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.qrCode.message}
                </p>
              )}
            </div>

            {/* Generate QR preview */}
            {form.watch('qrCode') && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleGenerateQR(form.getValues('qrCode'), configTarget?.name ?? '')
                }
              >
                <QrCode className="mr-2 h-4 w-4" />
                Preview & Download QR
              </Button>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setConfigTarget(null)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── QR Display Dialog ─────────────────────────────────────────────── */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="flex flex-col items-center gap-4">
          <DialogHeader>
            <DialogTitle>QR Code — {qrLabel}</DialogTitle>
          </DialogHeader>
          {qrDataUrl && (
            <>
              <img
                src={qrDataUrl}
                alt={`QR code for ${qrLabel}`}
                className="rounded-lg border p-2 bg-white"
                width={256}
                height={256}
              />
              <a
                href={qrDataUrl}
                download={`${qrLabel.replace(/\s+/g, '-').toLowerCase()}-qrcode.png`}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
