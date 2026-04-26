// src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User2, Scale, Ruler, Target, LayoutTemplate, Play, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkout } from '@/context/WorkoutContext'
import type { UserProfile } from '@/lib/types'

const profileSchema = z.object({
  name: z.string().optional(),
  age: z.coerce.number().min(10).max(120),
  gender: z.enum(['male', 'female', 'other']),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(300),
  goalWeightKg: z.coerce.number().min(30).max(300).optional().or(z.literal('')),
  goalType: z.enum(['strength', 'hypertrophy', 'fat-loss', 'toning']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']),
  workoutTimeLimitMin: z.coerce.number().min(10).max(180).optional().or(z.literal('')),
  chestCm: z.coerce.number().min(0).optional().or(z.literal('')),
  waistCm: z.coerce.number().min(0).optional().or(z.literal('')),
  hipsCm: z.coerce.number().min(0).optional().or(z.literal('')),
  armCm: z.coerce.number().min(0).optional().or(z.literal('')),
  thighCm: z.coerce.number().min(0).optional().or(z.literal('')),
})
type ProfileForm = z.infer<typeof profileSchema>

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, 'very-active': 1.9,
}

function calcBMI(weight: number, height: number) {
  return weight / Math.pow(height / 100, 2)
}

function calcTDEE(weight: number, height: number, age: number, gender: string, activity: string) {
  const bmr = gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activity] ?? 1.55))
}

function getBMICategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'bg-blue-500', scale: 0.85 }
  if (bmi < 25) return { label: 'Normal', color: 'bg-green-500', scale: 1.0 }
  if (bmi < 30) return { label: 'Overweight', color: 'bg-amber-500', scale: 1.15 }
  return { label: 'Obese', color: 'bg-red-500', scale: 1.3 }
}

function BodySilhouette({ scale }: { scale: number }) {
  const w = 60 * scale
  const offset = (60 - w) / 2
  return (
    <svg viewBox="0 0 120 200" className="h-48 mx-auto" aria-label="Body silhouette">
      <ellipse cx="60" cy="22" rx={12 * scale} ry="13" fill="currentColor" className="text-muted-foreground" />
      <rect x={offset + 30} y="40" width={w} height="70" rx="8" fill="currentColor" className="text-muted-foreground" />
      <rect x={offset + 30 - 14 * scale} y="44" width={12 * scale} height="55" rx="6" fill="currentColor" className="text-muted-foreground" />
      <rect x={offset + 30 + w + 2 * scale} y="44" width={12 * scale} height="55" rx="6" fill="currentColor" className="text-muted-foreground" />
      <rect x={offset + 30 + w * 0.05} y="112" width={w * 0.43} height="72" rx="6" fill="currentColor" className="text-muted-foreground" />
      <rect x={offset + 30 + w * 0.52} y="112" width={w * 0.43} height="72" rx="6" fill="currentColor" className="text-muted-foreground" />
    </svg>
  )
}

function Section({
  title, icon, children, defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="rounded-2xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 font-semibold text-sm">
          <span className="text-primary">{icon}</span>
          {title}
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <CardContent className="px-5 pb-5 pt-0 space-y-3">{children}</CardContent>}
    </Card>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { profile, saveProfileData, templates, exercises, resumeActiveTemplate, setActiveTemplate, startTemplate } = useWorkout()

  const activeTemplate = templates.find((t) => t.id === profile?.activeTemplateId)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      age: profile?.age ?? 25,
      gender: profile?.gender ?? 'male',
      heightCm: profile?.heightCm ?? 175,
      weightKg: profile?.weightKg ?? 75,
      goalWeightKg: profile?.goalWeightKg ?? '',
      goalType: profile?.goalType ?? 'hypertrophy',
      activityLevel: profile?.activityLevel ?? 'moderate',
      workoutTimeLimitMin: profile?.workoutTimeLimitMin ?? '',
      chestCm: profile?.chestCm ?? '',
      waistCm: profile?.waistCm ?? '',
      hipsCm: profile?.hipsCm ?? '',
      armCm: profile?.armCm ?? '',
      thighCm: profile?.thighCm ?? '',
    },
  })

  useEffect(() => {
    if (profile) {
      setValue('name', profile.name ?? '')
      setValue('age', profile.age)
      setValue('gender', profile.gender)
      setValue('heightCm', profile.heightCm)
      setValue('weightKg', profile.weightKg)
      setValue('goalWeightKg', profile.goalWeightKg ?? '')
      setValue('goalType', profile.goalType)
      setValue('activityLevel', profile.activityLevel)
      setValue('workoutTimeLimitMin', profile.workoutTimeLimitMin ?? '')
      setValue('chestCm', profile.chestCm ?? '')
      setValue('waistCm', profile.waistCm ?? '')
      setValue('hipsCm', profile.hipsCm ?? '')
      setValue('armCm', profile.armCm ?? '')
      setValue('thighCm', profile.thighCm ?? '')
    }
  }, [profile, setValue])

  const watched = watch()
  const weight = Number(watched.weightKg) || 75
  const height = Number(watched.heightCm) || 175
  const age = Number(watched.age) || 25
  const gender = watched.gender || 'male'
  const activity = watched.activityLevel || 'moderate'

  const bmi = calcBMI(weight, height)
  const tdee = calcTDEE(weight, height, age, gender, activity)
  const bmiCat = getBMICategory(bmi)

  async function onSubmit(data: ProfileForm) {
    const p: UserProfile = {
      id: 'user-profile',
      name: data.name || undefined,
      age: Number(data.age),
      gender: data.gender,
      heightCm: Number(data.heightCm),
      weightKg: Number(data.weightKg),
      goalWeightKg: data.goalWeightKg ? Number(data.goalWeightKg) : undefined,
      goalType: data.goalType,
      activityLevel: data.activityLevel,
      workoutTimeLimitMin: data.workoutTimeLimitMin ? Number(data.workoutTimeLimitMin) : undefined,
      chestCm: data.chestCm ? Number(data.chestCm) : undefined,
      waistCm: data.waistCm ? Number(data.waistCm) : undefined,
      hipsCm: data.hipsCm ? Number(data.hipsCm) : undefined,
      armCm: data.armCm ? Number(data.armCm) : undefined,
      thighCm: data.thighCm ? Number(data.thighCm) : undefined,
      weightLog: profile?.weightLog ?? [],
      activeTemplateId: profile?.activeTemplateId,
      activeTemplateExerciseIndex: profile?.activeTemplateExerciseIndex,
    }
    await saveProfileData(p)
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-28 space-y-4 page-transition">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User2 className="h-6 w-6" /> Body Profile
      </h1>

      {/* Live stats card */}
      <Card className="rounded-2xl">
        <CardContent className="flex gap-4 items-center pt-5">
          <BodySilhouette scale={bmiCat.scale} />
          <div className="space-y-3 flex-1">
            <div>
              <p className="text-xs text-muted-foreground">BMI</p>
              <p className="text-3xl font-bold">{bmi.toFixed(1)}</p>
              <Badge className={`${bmiCat.color} text-white text-xs mt-0.5`}>{bmiCat.label}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Scale className="h-3 w-3" /> TDEE
              </p>
              <p className="text-xl font-semibold">{tdee.toLocaleString()} kcal/day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Basic info */}
        <Section title="Basic Info" icon={<User2 className="h-4 w-4" />}>
          <div>
            <Label>Your Name</Label>
            <Input placeholder="e.g. Alex" {...register('name')} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Age</Label>
              <Input type="number" {...register('age')} className="mt-1.5" />
              {errors.age && <p className="text-xs text-destructive mt-1">{errors.age.message}</p>}
            </div>
            <div>
              <Label>Gender</Label>
              <Select defaultValue={watched.gender} onValueChange={(v) => setValue('gender', v as UserProfile['gender'])}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Height (cm)</Label>
              <Input type="number" {...register('heightCm')} className="mt-1.5" />
              {errors.heightCm && <p className="text-xs text-destructive mt-1">{errors.heightCm.message}</p>}
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input type="number" step="0.1" {...register('weightKg')} className="mt-1.5" />
              {errors.weightKg && <p className="text-xs text-destructive mt-1">{errors.weightKg.message}</p>}
            </div>
            <div>
              <Label>Goal Weight (kg)</Label>
              <Input type="number" step="0.1" placeholder="Optional" {...register('goalWeightKg')} className="mt-1.5" />
            </div>
          </div>
        </Section>

        {/* Goals & Session */}
        <Section title="Goals & Session" icon={<Target className="h-4 w-4" />}>
          <div>
            <Label>Goal Type</Label>
            <Select defaultValue={watched.goalType} onValueChange={(v) => setValue('goalType', v as UserProfile['goalType'])}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="hypertrophy">Hypertrophy (Muscle Gain)</SelectItem>
                <SelectItem value="fat-loss">Fat Loss</SelectItem>
                <SelectItem value="toning">Toning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Activity Level</Label>
            <Select defaultValue={watched.activityLevel} onValueChange={(v) => setValue('activityLevel', v as UserProfile['activityLevel'])}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary (desk job)</SelectItem>
                <SelectItem value="light">Light (1–3 days/week)</SelectItem>
                <SelectItem value="moderate">Moderate (3–5 days/week)</SelectItem>
                <SelectItem value="active">Active (6â€“7 days/week)</SelectItem>
                <SelectItem value="very-active">Very Active (athlete)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Workout Time Limit (minutes)</Label>
            <Input
              type="number"
              min={10}
              max={180}
              placeholder="e.g. 45 – leave blank for no limit"
              {...register('workoutTimeLimitMin')}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">Reminders at 5 min and 2 min remaining.</p>
          </div>
        </Section>

        {/* Body measurements */}
        <Section title="Body Measurements (cm)" icon={<Ruler className="h-4 w-4" />} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-3">
            {(['chestCm', 'waistCm', 'hipsCm', 'armCm', 'thighCm'] as const).map((field) => (
              <div key={field}>
                <Label>{field.replace('Cm', '').charAt(0).toUpperCase() + field.replace('Cm', '').slice(1)}</Label>
                <Input type="number" step="0.1" placeholder="â€”" {...register(field)} className="mt-1.5" />
              </div>
            ))}
          </div>
        </Section>

        <Button type="submit" className="w-full" size="lg">Save Profile</Button>
      </form>

      {/* Active plan (outside form) */}
      <Section title="Active Workout Plan" icon={<LayoutTemplate className="h-4 w-4" />} defaultOpen={!!activeTemplate}>
        {activeTemplate ? (
          <>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{activeTemplate.name}</p>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            {profile?.activeTemplateExerciseIndex !== undefined && (
              <p className="text-xs text-muted-foreground">
                Next: exercise #{(profile.activeTemplateExerciseIndex) + 1} of {activeTemplate.exercises.length}
              </p>
            )}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => { resumeActiveTemplate(); navigate('/log') }}>
                <Play className="h-4 w-4 mr-2" /> Resume Plan
              </Button>
              <Button variant="outline" onClick={() => setActiveTemplate(null)}>Clear</Button>
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-3">No active plan. Assign one in Templates.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/templates')}>
              <LayoutTemplate className="h-4 w-4 mr-2" /> Go to Templates
            </Button>
          </div>
        )}
      </Section>
    </div>
  )
}
