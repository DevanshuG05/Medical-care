import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function PatientDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  // Fetch upcoming appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      reason,
      doctor_profiles (
        profiles (full_name)
      )
    `)
    .eq('patient_id', user!.id)
    .gte('appointment_date', new Date().toISOString().split('T')[0])
    .order('appointment_date', { ascending: true })
    .limit(3)

  // Fetch active reminders
  const { data: reminders } = await supabase
    .from('medicine_reminders')
    .select('id, medicine_name, dosage, reminder_time, is_active')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .limit(5)

  // Count stats
  const { count: appointmentCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', user!.id)
    .gte('appointment_date', new Date().toISOString().split('T')[0])

  const { count: prescriptionCount } = await supabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', user!.id)

  const { count: reminderCount } = await supabase
    .from('medicine_reminders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('is_active', true)

  const { count: recordCount } = await supabase
    .from('medical_records')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', user!.id)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Patient'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {"Here's an overview of your health dashboard"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Upcoming Appointments"
          value={appointmentCount || 0}
          icon={Icons.calendar}
          description="scheduled"
        />
        <StatsCard
          title="Active Prescriptions"
          value={prescriptionCount || 0}
          icon={Icons.fileText}
          description="from doctors"
        />
        <StatsCard
          title="Medicine Reminders"
          value={reminderCount || 0}
          icon={Icons.pill}
          description="active reminders"
        />
        <StatsCard
          title="Medical Records"
          value={recordCount || 0}
          icon={Icons.clipboard}
          description="documents"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/patient/appointments">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icons.calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Book Appointment</p>
                <p className="text-sm text-muted-foreground">
                  Schedule a visit with a doctor
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/patient/symptoms">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icons.brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Analyze Symptoms</p>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered symptom analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/patient/reminders">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icons.pill className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Add Reminder</p>
                <p className="text-sm text-muted-foreground">
                  Set medicine reminder
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled visits</CardDescription>
            </div>
            <Link href="/patient/appointments">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {appointments && appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icons.stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Dr. {(apt.doctor_profiles as { profiles?: { full_name?: string } })?.profiles?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.appointment_date), 'MMM d, yyyy')} at{' '}
                          {apt.appointment_time}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        apt.status === 'confirmed'
                          ? 'default'
                          : apt.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Icons.calendar className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No upcoming appointments
                </p>
                <Link href="/patient/appointments">
                  <Button variant="link" className="mt-2">
                    Book an appointment
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicine Reminders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Medicine Reminders</CardTitle>
              <CardDescription>Your active reminders</CardDescription>
            </div>
            <Link href="/patient/reminders">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {reminders && reminders.length > 0 ? (
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icons.pill className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{reminder.medicine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {reminder.dosage} at {reminder.reminder_time}
                        </p>
                      </div>
                    </div>
                    <Icons.bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Icons.pill className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No active reminders
                </p>
                <Link href="/patient/reminders">
                  <Button variant="link" className="mt-2">
                    Add a reminder
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
