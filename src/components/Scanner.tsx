// src/components/Scanner.tsx
// Real QR scanning via @zxing/browser BrowserMultiFormatReader

import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { NotFoundException } from '@zxing/library'
import { Ban, StopCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/lib/types'
import { getExerciseByQrCode } from '@/lib/exercises'
import { useWorkout } from '@/context/WorkoutContext'

interface ScannerProps {
  onScanSuccess: (exercise: Exercise) => void
  onUnknownCode?: (code: string) => void
}

export function Scanner({ onScanSuccess, onUnknownCode }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { exercises } = useWorkout()

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      BrowserMultiFormatReader.releaseAllStreams()
      readerRef.current = null
    }
    setIsScanning(false)
    setIsLoading(false)
  }, [])

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return

    setError(null)
    setIsLoading(true)

    try {
      // Verify camera access before starting the reader
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
    } catch {
      setHasCamera(false)
      setError('Camera access denied. Please allow camera permissions and try again.')
      setIsLoading(false)
      return
    }

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    setIsScanning(true)
    setIsLoading(false)

    try {
      await reader.decodeFromVideoDevice(
        undefined, // undefined = default back camera
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText()
            const exercise = getExerciseByQrCode(text, exercises)
            if (exercise) {
              stopScanner()
              onScanSuccess(exercise)
            } else if (onUnknownCode) {
              stopScanner()
              onUnknownCode(text)
            } else {
              setError(`Code "${text}" not assigned to any exercise.`)
            }
          } else if (err && !(err instanceof NotFoundException)) {
            // NotFoundException is normal (no QR code in frame) — ignore it
            console.warn('QR decode error:', err)
          }
        },
      )
    } catch (e) {
      setHasCamera(false)
      setError('Failed to start camera. Check permissions and try again.')
      setIsScanning(false)
    }
  }, [exercises, onScanSuccess, stopScanner])

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  if (!hasCamera) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="rounded-full bg-muted p-6">
          <Ban className="h-12 w-12 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Camera Not Available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? 'Camera access is required to scan QR codes.'}
          </p>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs">
          On iPhone: Settings → Safari → Camera → Allow.
          On Android: tap the lock icon in your browser's address bar.
        </p>
        <Button
          onClick={() => {
            setHasCamera(true)
            setError(null)
          }}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Video viewport */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gray-900">
        <video
          ref={videoRef}
          className={isScanning ? 'block w-full' : 'hidden'}
          muted
          playsInline
          autoPlay
        />

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Dim corners */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Target box */}
            <div className="relative z-10 h-48 w-48 rounded-lg border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Corner accents */}
              <span className="absolute left-0 top-0 h-6 w-6 border-l-4 border-t-4 border-primary rounded-tl-md" />
              <span className="absolute right-0 top-0 h-6 w-6 border-r-4 border-t-4 border-primary rounded-tr-md" />
              <span className="absolute bottom-0 left-0 h-6 w-6 border-b-4 border-l-4 border-primary rounded-bl-md" />
              <span className="absolute bottom-0 right-0 h-6 w-6 border-b-4 border-r-4 border-primary rounded-br-md" />
              {/* Animated scan line */}
              <div className="absolute left-1 right-1 h-0.5 bg-primary/80 shadow-[0_0_6px_2px_hsl(var(--primary)/0.6)] animate-scan-line" />
            </div>
            {/* Stop button */}
            <button
              onClick={stopScanner}
              className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
              aria-label="Stop scanner"
            >
              <StopCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Placeholder when not scanning */}
        {!isScanning && (
          <div className="flex h-48 w-full items-center justify-center bg-gray-900 rounded-2xl">
            <div className="text-center text-gray-400">
              <div className="mx-auto mb-3 h-16 w-16 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                <span className="text-2xl">📷</span>
              </div>
              <p className="text-sm">Camera preview will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Error hint (non-fatal) */}
      {error && isScanning && (
        <p className="text-xs text-amber-400 text-center px-4">{error}</p>
      )}

      {/* Start / loading button */}
      {!isScanning && (
        <Button onClick={startScanner} disabled={isLoading} className="w-full max-w-md">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting camera…
            </>
          ) : (
            'Start Scanner'
          )}
        </Button>
      )}
    </div>
  )
}
