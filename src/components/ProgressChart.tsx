// src/components/ProgressChart.tsx
import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot,
} from 'recharts'
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Workout } from '@/lib/types'

interface ProgressChartProps {
  workouts: Workout[]
  exercises: { id: string; name: string }[]
}

interface ChartPoint {
  date: string
  maxWeight: number
  isPR: boolean
}

export function ProgressChart({ workouts, exercises }: ProgressChartProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercises[0]?.id ?? '',
  )

  const data: ChartPoint[] = useMemo(() => {
    return workouts
      .filter((w) => w.exerciseId === selectedExerciseId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((w) => ({
        date: format(new Date(w.date), 'MMM d'),
        maxWeight: w.sets.length > 0 ? Math.max(...w.sets.map((s) => s.weight)) : 0,
        isPR: w.isPR ?? false,
      }))
  }, [workouts, selectedExerciseId])

  const weightUnit = workouts.find((w) => w.exerciseId === selectedExerciseId)?.weightUnit ?? 'kg'

  if (exercises.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No workout data yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
        <SelectTrigger>
          <SelectValue placeholder="Select exercise…" />
        </SelectTrigger>
        <SelectContent>
          {exercises.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {data.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No sessions logged for this exercise.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              width={40}
              unit={weightUnit}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: 12,
              }}
              formatter={(value: number, _name: string, props) => [
                `${value}${weightUnit}${props.payload?.isPR ? ' 🏆 PR' : ''}`,
                'Max Weight',
              ]}
              labelFormatter={(label) => `Session: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="maxWeight"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                if (payload.isPR) {
                  return (
                    <Dot
                      key={`pr-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="hsl(var(--primary))"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  )
                }
                return <Dot key={`dot-${payload.date}`} cx={cx} cy={cy} r={3} fill="hsl(var(--primary))" />
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
