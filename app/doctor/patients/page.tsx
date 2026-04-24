import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

export default async function DoctorPatientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Uses SECURITY DEFINER to bypass RLS — returns unique patients from appointments
  const { data: patients } = await supabase.rpc('get_doctor_patients', {
    p_doctor_id: user!.id,
  })

  const getInitials = (name: string | null) => {
    if (!name) return 'P'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Patients</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage your patient list
        </p>
      </div>

      {patients && patients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(patients as Array<{ id: string; full_name: string | null }>).map((patient) => (
            <Card key={patient.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(patient.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {patient.full_name || 'Unknown Patient'}
                    </CardTitle>
                    <CardDescription>Patient</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/doctor/prescriptions/new?patient=${patient.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Icons.fileText className="mr-2 h-4 w-4" />
                      Prescribe
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <Icons.users className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No Patients Yet</EmptyTitle>
          <EmptyDescription>Patients who book appointments with you will appear here.</EmptyDescription>
        </Empty>
      )}
    </div>
  )
}
