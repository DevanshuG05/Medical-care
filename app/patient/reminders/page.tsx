'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Icons } from '@/components/icons'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Reminder {
  id: string
  medicine_name: string
  dosage: string
  reminder_times: string[]
  start_date: string
  end_date: string | null
  is_active: boolean
}

interface AdherenceLog {
  id: string
  reminder_id: string
  scheduled_time: string
  taken_at: string | null
  status: string
  created_at: string
}

export default function PatientRemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [todayLogs, setTodayLogs] = useState<AdherenceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [medicineName, setMedicineName] = useState('')
  const [dosage, setDosage] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Fetch reminders
      const { data: remindersData } = await supabase
        .from('medicine_reminders')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })

      setReminders((remindersData as Reminder[]) || [])

      // Fetch today's adherence logs
      const today = new Date().toISOString().split('T')[0]
      const { data: logsData } = await supabase
        .from('adherence_logs')
        .select('*')
        .eq('patient_id', user.id)
        .gte('created_at', today)

      setTodayLogs((logsData as AdherenceLog[]) || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!medicineName || !dosage || !reminderTime) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Not authenticated')
      setIsSaving(false)
      return
    }

    const { error } = await supabase.from('medicine_reminders').insert({
      patient_id: user.id,
      medicine_name: medicineName,
      dosage,
      reminder_times: [reminderTime],
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || null,
      is_active: true,
    })

    if (error) {
      toast.error('Failed to create reminder')
    } else {
      toast.success('Reminder created successfully')
      setIsDialogOpen(false)
      resetForm()
      fetchData()
    }

    setIsSaving(false)
  }

  const resetForm = () => {
    setMedicineName('')
    setDosage('')
    setReminderTime('')
    setStartDate('')
    setEndDate('')
  }

  const handleToggleReminder = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('medicine_reminders')
      .update({ is_active: !isActive })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update reminder')
    } else {
      fetchData()
    }
  }

  const handleDeleteReminder = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('medicine_reminders')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete reminder')
    } else {
      toast.success('Reminder deleted')
      fetchData()
    }
  }

  const handleLogMedicine = async (reminder: Reminder, status: 'taken' | 'skipped') => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const firstTime = (reminder.reminder_times?.[0] || '08:00').substring(0, 5)
    const { error } = await supabase.from('adherence_logs').insert({
      patient_id: user.id,
      reminder_id: reminder.id,
      scheduled_time: `${today}T${firstTime}:00`,
      taken_at: status === 'taken' ? new Date().toISOString() : null,
      status,
    })

    if (error) {
      toast.error('Failed to log medicine')
    } else {
      toast.success(status === 'taken' ? 'Medicine logged as taken' : 'Medicine skipped')
      fetchData()
    }
  }

  const getReminderStatus = (reminder: Reminder) => {
    const log = todayLogs.find((l) => l.reminder_id === reminder.id)
    return log?.status || null
  }

  const activeReminders = reminders.filter((r) => r.is_active)
  const inactiveReminders = reminders.filter((r) => !r.is_active)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icons.refresh className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medicine Reminders</h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage your medications
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icons.plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Medicine Reminder</DialogTitle>
              <DialogDescription>
                Set up a reminder for your medication
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReminder}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Medicine Name</FieldLabel>
                  <Input
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    placeholder="e.g., Aspirin"
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Dosage</FieldLabel>
                    <Input
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g., 500mg"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Reminder Time</FieldLabel>
                    <Input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Start Date</FieldLabel>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>End Date (Optional)</FieldLabel>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Field>
                </div>

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Icons.refresh className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Reminder'
                  )}
                </Button>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Schedule */}
      {activeReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.calendarDays className="h-5 w-5 text-primary" />
              {"Today's Schedule"}
            </CardTitle>
            <CardDescription>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeReminders.map((reminder) => {
                const status = getReminderStatus(reminder)
                return (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          status === 'taken'
                            ? 'bg-green-100'
                            : status === 'skipped'
                            ? 'bg-red-100'
                            : 'bg-primary/10'
                        }`}
                      >
                        {status === 'taken' ? (
                          <Icons.checkCircle className="h-5 w-5 text-green-600" />
                        ) : status === 'skipped' ? (
                          <Icons.close className="h-5 w-5 text-red-600" />
                        ) : (
                          <Icons.pill className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{reminder.medicine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {reminder.dosage} at {(reminder.reminder_times?.[0] || '').substring(0, 5)}
                        </p>
                      </div>
                    </div>
                    {!status ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleLogMedicine(reminder, 'taken')}
                        >
                          <Icons.checkCircle className="mr-1 h-4 w-4" />
                          Taken
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLogMedicine(reminder, 'skipped')}
                        >
                          Skip
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant={status === 'taken' ? 'default' : 'destructive'}
                      >
                        {status === 'taken' ? 'Taken' : 'Skipped'}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Reminders */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Active Reminders</h2>
        {activeReminders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeReminders.map((reminder) => (
              <Card key={reminder.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icons.pill className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {reminder.medicine_name}
                        </CardTitle>
                        <CardDescription>{reminder.dosage}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={reminder.is_active}
                      onCheckedChange={() =>
                        handleToggleReminder(reminder.id, reminder.is_active)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icons.clock className="h-4 w-4" />
                      {(reminder.reminder_times || []).map(t => t.substring(0, 5)).join(', ')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full text-destructive hover:text-destructive"
                    onClick={() => handleDeleteReminder(reminder.id)}
                  >
                    <Icons.trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyMedia variant="icon">
              <Icons.pill className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No Active Reminders</EmptyTitle>
            <EmptyDescription>Add a reminder to track your medications.</EmptyDescription>
            <EmptyContent>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Icons.plus className="mr-2 h-4 w-4" />
                Add Reminder
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>

      {/* Inactive Reminders */}
      {inactiveReminders.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-muted-foreground">
            Inactive Reminders
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {inactiveReminders.map((reminder) => (
              <Card key={reminder.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Icons.pill className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {reminder.medicine_name}
                        </CardTitle>
                        <CardDescription>{reminder.dosage}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={reminder.is_active}
                      onCheckedChange={() =>
                        handleToggleReminder(reminder.id, reminder.is_active)
                      }
                    />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
