'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import { format } from 'date-fns'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  reason: string | null
  patient_name: string | null
  patient_phone: string | null
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAppointments = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase.rpc('get_doctor_appointments', {
          p_doctor_id: user.id,
        })

        if (error) throw error
        setAppointments((data as Appointment[]) || [])
      }
    } catch (err) {
      console.error('Failed to load appointments:', err)
      toast.error('Failed to load appointments. Please refresh.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  // Realtime: listen for new bookings directed at this doctor
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel>

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      channel = supabase
        .channel('doctor-new-appointments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: `doctor_id=eq.${user.id}`,
          },
          async (payload) => {
            const patientId = (payload.new as { patient_id: string }).patient_id
            const { data: patient } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', patientId)
              .single()
            toast.info(
              `New appointment request from ${patient?.full_name || 'a patient'}`
            )
            fetchAppointments()
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const handleUpdateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)

    if (error) {
      toast.error(`Failed to update appointment`)
    } else {
      toast.success(`Appointment ${status}`)
      fetchAppointments()
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(
    (apt) => apt.appointment_date === today && apt.status !== 'cancelled'
  )
  const pendingAppointments = appointments.filter((apt) => apt.status === 'pending')
  const upcomingAppointments = appointments.filter(
    (apt) =>
      apt.appointment_date > today &&
      apt.status !== 'cancelled' &&
      apt.status !== 'pending'
  )
  const pastAppointments = appointments.filter(
    (apt) => apt.appointment_date < today || apt.status === 'cancelled'
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icons.refresh className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Appointments</h1>
        <p className="mt-1 text-muted-foreground">Manage your patient appointments</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today ({todayAppointments.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          {todayAppointments.length > 0 ? (
            <div className="space-y-4">
              {todayAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onUpdateStatus={handleUpdateStatus}
                  showActions
                />
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyMedia variant="icon">
                <Icons.calendar className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No Appointments Today</EmptyTitle>
              <EmptyDescription>
                {"You don't have any appointments scheduled for today."}
              </EmptyDescription>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingAppointments.length > 0 ? (
            <div className="space-y-4">
              {pendingAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onUpdateStatus={handleUpdateStatus}
                  showActions
                />
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyMedia variant="icon">
                <Icons.clock className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No Pending Appointments</EmptyTitle>
              <EmptyDescription>All appointment requests have been processed.</EmptyDescription>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onUpdateStatus={handleUpdateStatus}
                  showActions
                />
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyMedia variant="icon">
                <Icons.calendarDays className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No Upcoming Appointments</EmptyTitle>
              <EmptyDescription>You don't have any confirmed upcoming appointments.</EmptyDescription>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastAppointments.length > 0 ? (
            <div className="space-y-4">
              {pastAppointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onUpdateStatus={handleUpdateStatus}
                  showActions={false}
                />
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyMedia variant="icon">
                <Icons.calendar className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No Past Appointments</EmptyTitle>
              <EmptyDescription>Your appointment history will appear here.</EmptyDescription>
            </Empty>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AppointmentCard({
  appointment,
  onUpdateStatus,
  showActions,
}: {
  appointment: Appointment
  onUpdateStatus: (id: string, status: string) => void
  showActions: boolean
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icons.user className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">
              {appointment.patient_name || 'Unknown Patient'}
            </p>
            {appointment.patient_phone && (
              <p className="text-sm text-muted-foreground">{appointment.patient_phone}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}{' '}
              at {(appointment.appointment_time as string).substring(0, 5)}
            </p>
            {appointment.reason && (
              <p className="mt-1 text-sm text-muted-foreground">
                Reason: {appointment.reason}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              appointment.status === 'confirmed'
                ? 'default'
                : appointment.status === 'pending'
                ? 'secondary'
                : appointment.status === 'completed'
                ? 'outline'
                : 'destructive'
            }
          >
            {appointment.status}
          </Badge>
          {showActions && appointment.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
              >
                Decline
              </Button>
            </>
          )}
          {showActions && appointment.status === 'confirmed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(appointment.id, 'completed')}
            >
              Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
