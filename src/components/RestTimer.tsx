// src/components/RestTimer.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Web Audio API beep — no audio files needed, works offline
function playBeep(frequency = 880, durationSec = 0.25, volume = 0.4) {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + durationSec)
    // Clean up context after beep
    setTimeout(() => ctx.close(), (durationSec + 0.1) * 1000)
  } catch {
    // Audio not supported — silently skip
  }
}

interface RestTimerProps {
  defaultSeconds?: number
  onComplete?: () => void
}

export function RestTimer({ defaultSeconds = 90, onComplete }: RestTimerProps) {
  const [duration, setDuration] = useState(defaultSeconds)
  const [remaining, setRemaining] = useState(defaultSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const handleComplete = useCallback(() => {
    stopInterval()
    setIsRunning(false)
    setRemaining(0)
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
    // Three ascending beeps on completion
    playBeep(660, 0.15)
    setTimeout(() => playBeep(770, 0.15), 180)
    setTimeout(() => playBeep(880, 0.3), 360)
    toast.success('Rest complete! Time to lift 💪')
    onComplete?.()
  }, [stopInterval, onComplete])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          // Countdown warning beeps at 3, 2, 1
          if (prev === 4) playBeep(440, 0.1)
          if (prev === 3) playBeep(440, 0.1)
          if (prev === 2) playBeep(440, 0.1)
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      stopInterval()
    }
    return stopInterval
  }, [isRunning, handleComplete, stopInterval])

  function handleDurationChange(value: number[]) {
    const newDur = value[0]
    setDuration(newDur)
    setRemaining(newDur)
    setIsRunning(false)
    stopInterval()
  }

  function handleReset() {
    stopInterval()
    setIsRunning(false)
    setRemaining(duration)
  }

  const progress = duration > 0 ? remaining / duration : 0
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-5 shadow-lg">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Rest Timer</p>

      {/* SVG ring */}
      <div className="relative">
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
          {/* Background ring */}
          <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          {/* Progress ring */}
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s linear' }}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          aria-label="Reset timer"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          onClick={() => setIsRunning((r) => !r)}
          aria-label={isRunning ? 'Pause' : 'Resume'}
          className="h-12 w-12"
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
      </div>

      {/* Duration slider */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>30s</span>
          <span>Duration: {duration}s</span>
          <span>5m</span>
        </div>
        <Slider
          min={30}
          max={300}
          step={15}
          value={[duration]}
          onValueChange={handleDurationChange}
          disabled={isRunning}
        />
      </div>
    </div>
  )
}
