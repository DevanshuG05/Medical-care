'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import { format } from 'date-fns'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Doctor {
  id: string
  full_name: string | null
  specialization: string | null
  consultation_fee: number | null
  available_days: string[] | null
  available_hours_start: string | null
  available_hours_end: string | null
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  reason: string | null
  doctor_name: string | null
  doctor_specialization: string | null
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBooking, setIsBooking] = useState(false)

  // Booking form state
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [reason, setReason] = useState('')

  // Booked slots for the selected doctor+date
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set())

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const [{ data: appointmentsData }, { data: doctorsData }] = await Promise.all([
          supabase.rpc('get_patient_appointments', { p_patient_id: user.id }),
          supabase.rpc('get_available_doctors'),
        ])

        setAppointments((appointmentsData as Appointment[]) || [])
        setDoctors((doctorsData as Doctor[]) || [])
      }
    } catch (err) {
      console.error('Failed to load appointments:', err)
      toast.error('Failed to load data. Please refresh.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch booked slots when doctor+date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setBookedSlots(new Set())
      setSelectedTime('')
      return
    }
    const supabase = createClient()
    supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', selectedDoctor)
      .eq('appointment_date', selectedDate)
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => {
        setBookedSlots(
          new Set((data || []).map((a) => (a.appointment_time as string).substring(0, 5)))
        )
        setSelectedTime('')
      })
  }, [selectedDoctor, selectedDate])

  // Realtime: listen for status updates on the patient's appointments
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel>

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      channel = supabase
        .channel('patient-appointment-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'appointments',
            filter: `patient_id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new as { id: string; status: string }
            setAppointments((prev) =>
              prev.map((apt) =>
                apt.id === updated.id ? { ...apt, status: updated.status } : apt
              )
            )
            if (updated.status === 'confirmed')
              toast.success('Your appointment has been confirmed!')
            else if (updated.status === 'cancelled')
              toast.error('Your appointment was declined')
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsBooking(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Not authenticated')
      setIsBooking(false)
      return
    }

    const { error } = await supabase.from('appointments').insert({
      patient_id: user.id,
      doctor_id: selectedDoctor,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      reason,
      status: 'pending',
    })

    if (error) {
      toast.error('Failed to book appointment')
    } else {
      toast.success('Appointment booked successfully')
      setIsDialogOpen(false)
      setSelectedDoctor('')
      setSelectedDate('')
      setSelectedTime('')
      setReason('')
      fetchData()
    }

    setIsBooking(false)
  }

  const handleCancelAppointment = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      toast.error('Failed to cancel appointment')
    } else {
      toast.success('Appointment cancelled')
      fetchData()
    }
  }

  const getAvailableTimeSlots = () => {
    const doctor = doctors.find((d) => d.id === selectedDoctor)
    if (!doctor) return []

    const start = (doctor.available_hours_start || '09:00:00').substring(0, 5)
    const end = (doctor.available_hours_end || '17:00:00').substring(0, 5)
    const slots: string[] = []

    const [startHour] = start.split(':').map(Number)
    const [endHour] = end.split(':').map(Number)

    for (let hour = startHour; hour < endHour; hour++) {
      const s1 = `${String(hour).padStart(2, '0')}:00`
      const s2 = `${String(hour).padStart(2, '0')}:30`
      if (!bookedSlots.has(s1)) slots.push(s1)
      if (!bookedSlots.has(s2)) slots.push(s2)
    }

    return slots
  }

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled'
  )
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.appointment_date) < new Date() || apt.status === 'cancelled'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="mt-1 text-muted-foreground">
            Book and manage your doctor appointments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icons.plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Book an Appointment</DialogTitle>
              <DialogDescription>
                Select a doctor and choose your preferred time slot
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookAppointment}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Select Doctor</FieldLabel>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.full_name || 'Unknown'} —{' '}
                          {doctor.specialization || 'General Practice'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {selectedDoctor && (
                  <>
                    <Field>
                      <FieldLabel>Select Date</FieldLabel>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </Field>

                    {selectedDate && (
                      <Field>
                        <FieldLabel>Select Time</FieldLabel>
                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a time" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableTimeSlots().length > 0 ? (
                              getAvailableTimeSlots().map((slot) => (
                                <SelectItem key={slot} value={slot}>
                                  {slot}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="__none__" disabled>
                                No slots available for this date
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </>
                )}

                <Field>
                  <FieldLabel>Reason for Visit (Optional)</FieldLabel>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe your symptoms or reason for the appointment..."
                    rows={3}
                  />
                </Field>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isBooking || !selectedDoctor || !selectedDate || !selectedTime}
                >
                  {isBooking ? (
                    <>
                      <Icons.refresh className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Book Appointment'
                  )}
                </Button>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past & Cancelled ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <Card key={apt.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Icons.stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          Dr. {apt.doctor_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.doctor_specialization || 'General Practice'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.appointment_date), 'EEEE, MMMM d, yyyy')}{' '}
                          at {(apt.appointment_time as string).substring(0, 5)}
                        </p>
                        {apt.reason && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Reason: {apt.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                      {apt.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelAppointment(apt.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyMedia variant="icon">
                <Icons.calendar className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No Upcoming Appointments</EmptyTitle>
              <EmptyDescription>
                {"You don't have any upcoming appointments. Book one now!"}
              </EmptyDescription>
              <EmptyContent>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Icons.plus className="mr-2 h-4 w-4" />
                  Book Appointment
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastAppointments.length > 0 ? (
            <div className="space-y-4">
              {pastAppointments.map((apt) => (
                <Card key={apt.id} className="opacity-75">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Icons.stethoscope className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          Dr. {apt.doctor_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.appointment_date), 'MMMM d, yyyy')}{' '}
                          at {(apt.appointment_time as string).substring(0, 5)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={apt.status === 'cancelled' ? 'destructive' : 'outline'}
                    >
                      {apt.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyMedia variant="icon">
                <Icons.calendar className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No Past Appointments</EmptyTitle>
              <EmptyDescription>Your past appointments will appear here.</EmptyDescription>
            </Empty>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
