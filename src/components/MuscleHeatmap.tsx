// src/components/MuscleHeatmap.tsx
import { useMemo } from 'react'
import type { Workout } from '@/lib/types'

interface Props {
  workouts: Workout[]  // Workouts from last 7 days
  view: 'front' | 'back'
}

// Map muscle name fragments → region keys
const MUSCLE_TO_REGION: Record<string, string> = {
  chest: 'chest', pec: 'chest',
  shoulder: 'shoulders', delt: 'shoulders',
  bicep: 'biceps',
  tricep: 'triceps',
  lat: 'lats', back: 'lats', row: 'lats',
  trap: 'traps',
  abs: 'abs', core: 'abs', oblique: 'abs',
  quad: 'quads', leg: 'quads',
  glute: 'glutes', hip: 'glutes',
  hamstring: 'hamstrings',
  calf: 'calves', calves: 'calves',
  forearm: 'forearms',
}

function getSetsPerRegion(workouts: Workout[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const w of workouts) {
    const muscles = w.targetMuscles ?? []
    for (const muscle of muscles) {
      const lower = muscle.toLowerCase()
      for (const [fragment, region] of Object.entries(MUSCLE_TO_REGION)) {
        if (lower.includes(fragment)) {
          counts[region] = (counts[region] ?? 0) + w.sets.length
          break
        }
      }
    }
  }
  return counts
}

function heatColor(sets: number): string {
  if (sets === 0) return 'hsl(var(--muted))'
  if (sets <= 3) return '#60a5fa'   // blue-400 — visible to deuteranopes & protanopes
  if (sets <= 8) return '#f97316'   // orange-500 — distinct from blue
  return '#7c3aed'                  // violet-600 — distinct from both
}

// Accessible legend labels with aria-friendly descriptions
const LEGEND = [
  { label: '0 sets', color: 'hsl(var(--muted))' },
  { label: '1–3',    color: '#60a5fa' },
  { label: '4–8',    color: '#f97316' },
  { label: '9+',     color: '#7c3aed' },
]

// --- Front-body SVG regions ---
interface Region { id: string; element: React.ReactNode }

function FrontRegions({ sets }: { sets: Record<string, number> }) {
  const r = (id: string) => heatColor(sets[id] ?? 0)
  return (
    <g>
      {/* Shoulders */}
      <ellipse cx="40" cy="58" rx="10" ry="8" fill={r('shoulders')} opacity="0.85" />
      <ellipse cx="80" cy="58" rx="10" ry="8" fill={r('shoulders')} opacity="0.85" />
      {/* Chest */}
      <ellipse cx="54" cy="70" rx="12" ry="9" fill={r('chest')} opacity="0.85" />
      <ellipse cx="66" cy="70" rx="12" ry="9" fill={r('chest')} opacity="0.85" />
      {/* Biceps */}
      <ellipse cx="35" cy="80" rx="7" ry="14" fill={r('biceps')} opacity="0.85" />
      <ellipse cx="85" cy="80" rx="7" ry="14" fill={r('biceps')} opacity="0.85" />
      {/* Forearms */}
      <ellipse cx="32" cy="106" rx="5" ry="12" fill={r('forearms')} opacity="0.85" />
      <ellipse cx="88" cy="106" rx="5" ry="12" fill={r('forearms')} opacity="0.85" />
      {/* Abs */}
      <rect x="50" y="84" width="20" height="30" rx="5" fill={r('abs')} opacity="0.85" />
      {/* Quads */}
      <ellipse cx="50" cy="158" rx="12" ry="22" fill={r('quads')} opacity="0.85" />
      <ellipse cx="70" cy="158" rx="12" ry="22" fill={r('quads')} opacity="0.85" />
      {/* Calves */}
      <ellipse cx="50" cy="208" rx="9" ry="16" fill={r('calves')} opacity="0.85" />
      <ellipse cx="70" cy="208" rx="9" ry="16" fill={r('calves')} opacity="0.85" />
    </g>
  )
}

function BackRegions({ sets }: { sets: Record<string, number> }) {
  const r = (id: string) => heatColor(sets[id] ?? 0)
  return (
    <g>
      {/* Traps */}
      <ellipse cx="60" cy="56" rx="18" ry="8" fill={r('traps')} opacity="0.85" />
      {/* Shoulders (rear) */}
      <ellipse cx="40" cy="60" rx="9" ry="7" fill={r('shoulders')} opacity="0.85" />
      <ellipse cx="80" cy="60" rx="9" ry="7" fill={r('shoulders')} opacity="0.85" />
      {/* Lats */}
      <ellipse cx="46" cy="85" rx="10" ry="22" fill={r('lats')} opacity="0.85" />
      <ellipse cx="74" cy="85" rx="10" ry="22" fill={r('lats')} opacity="0.85" />
      {/* Triceps */}
      <ellipse cx="35" cy="78" rx="7" ry="14" fill={r('triceps')} opacity="0.85" />
      <ellipse cx="85" cy="78" rx="7" ry="14" fill={r('triceps')} opacity="0.85" />
      {/* Glutes */}
      <ellipse cx="50" cy="125" rx="14" ry="12" fill={r('glutes')} opacity="0.85" />
      <ellipse cx="70" cy="125" rx="14" ry="12" fill={r('glutes')} opacity="0.85" />
      {/* Hamstrings */}
      <ellipse cx="50" cy="162" rx="12" ry="22" fill={r('hamstrings')} opacity="0.85" />
      <ellipse cx="70" cy="162" rx="12" ry="22" fill={r('hamstrings')} opacity="0.85" />
      {/* Calves */}
      <ellipse cx="50" cy="208" rx="9" ry="16" fill={r('calves')} opacity="0.85" />
      <ellipse cx="70" cy="208" rx="9" ry="16" fill={r('calves')} opacity="0.85" />
    </g>
  )
}

// Outline body (shared front+back silhouette)
function BodyOutline() {
  return (
    <g stroke="currentColor" strokeWidth="1.5" fill="none" className="text-muted-foreground/40">
      {/* Head */}
      <ellipse cx="60" cy="22" rx="13" ry="15" />
      {/* Neck */}
      <rect x="55" y="35" width="10" height="8" rx="2" />
      {/* Torso */}
      <path d="M35 43 Q28 50 30 118 L90 118 Q92 50 85 43 Q72 40 60 40 Q48 40 35 43Z" />
      {/* Arms */}
      <path d="M30 43 Q20 60 22 118 Q27 120 35 118 Q32 85 35 43" />
      <path d="M90 43 Q100 60 98 118 Q93 120 85 118 Q88 85 85 43" />
      {/* Legs */}
      <path d="M38 118 Q34 160 36 228 Q45 232 56 228 Q58 185 60 160 Q62 185 64 228 Q75 232 84 228 Q86 160 82 118Z" />
    </g>
  )
}

export function MuscleHeatmap({ workouts, view }: Props) {
  const sets = useMemo(() => getSetsPerRegion(workouts), [workouts])

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 120 240" className="w-full max-w-[180px] mx-auto" aria-label={`Muscle heatmap ${view}`}>
        <BodyOutline />
        {view === 'front' ? <FrontRegions sets={sets} /> : <BackRegions sets={sets} />}
      </svg>
      {/* Legend */}
      <div className="flex justify-center gap-3 flex-wrap">
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: l.color }} />
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
