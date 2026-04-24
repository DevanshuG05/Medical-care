import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function DoctorDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  // Get doctor profile
  const { data: doctorProfile } = await supabase
    .from('doctor_profiles')
    .select('id')
    .eq('id', user!.id)
    .single()

  // Fetch today's appointments
  const today = new Date().toISOString().split('T')[0]
  const { data: todayAppointments } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      reason,
      profiles!appointments_patient_id_fkey (full_name)
    `)
    .eq('doctor_id', doctorProfile?.id)
    .eq('appointment_date', today)
    .order('appointment_time', { ascending: true })

  // Fetch upcoming appointments
  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      reason,
      profiles!appointments_patient_id_fkey (full_name)
    `)
    .eq('doctor_id', doctorProfile?.id)
    .gt('appointment_date', today)
    .order('appointment_date', { ascending: true })
    .limit(5)

  // Count stats
  const { count: todayCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorProfile?.id)
    .eq('appointment_date', today)

  const { count: patientCount } = await supabase
    .from('appointments')
    .select('patient_id', { count: 'exact', head: true })
    .eq('doctor_id', doctorProfile?.id)

  const { count: prescriptionCount } = await supabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorProfile?.id)

  const { count: pendingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorProfile?.id)
    .eq('status', 'pending')

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome, Dr. {profile?.full_name?.split(' ').pop() || 'Doctor'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {"Here's your practice overview for today"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Appointments"
          value={todayCount || 0}
          icon={Icons.calendar}
          description="scheduled for today"
        />
        <StatsCard
          title="Total Patients"
          value={patientCount || 0}
          icon={Icons.users}
          description="in your care"
        />
        <StatsCard
          title="Prescriptions"
          value={prescriptionCount || 0}
          icon={Icons.fileText}
          description="issued"
        />
        <StatsCard
          title="Pending Approvals"
          value={pendingCount || 0}
          icon={Icons.clock}
          description="awaiting response"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/doctor/appointments">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icons.calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Manage Appointments</p>
                <p className="text-sm text-muted-foreground">
                  View and manage patient appointments
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/doctor/prescriptions">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icons.fileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Write Prescription</p>
                <p className="text-sm text-muted-foreground">
                  Create prescriptions for patients
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{"Today's Schedule"}</CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </div>
            <Link href="/doctor/appointments">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icons.user className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {(apt.profiles as { full_name?: string })?.full_name || 'Unknown Patient'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.appointment_time} - {apt.reason || 'General consultation'}
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
                  No appointments scheduled for today
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Next scheduled visits</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Icons.user className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {(apt.profiles as { full_name?: string })?.full_name || 'Unknown Patient'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.appointment_date), 'MMM d')} at{' '}
                          {apt.appointment_time}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{apt.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Icons.calendarDays className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No upcoming appointments
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
