import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { format } from 'date-fns'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'

export default async function DoctorPrescriptionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get doctor profile
  const { data: doctorProfile } = await supabase
    .from('doctor_profiles')
    .select('id')
    .eq('id', user!.id)
    .single()

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select(`
      *,
      profiles!prescriptions_patient_id_fkey (full_name),
      prescription_items (*)
    `)
    .eq('doctor_id', doctorProfile?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="mt-1 text-muted-foreground">
            Manage prescriptions for your patients
          </p>
        </div>
        <Link href="/doctor/prescriptions/new">
          <Button>
            <Icons.plus className="mr-2 h-4 w-4" />
            New Prescription
          </Button>
        </Link>
      </div>

      {prescriptions && prescriptions.length > 0 ? (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.fileText className="h-5 w-5 text-primary" />
                      {(prescription.profiles as { full_name?: string })?.full_name || 'Unknown Patient'}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(prescription.created_at), 'MMM d, yyyy')} -{' '}
                      {prescription.diagnosis || 'No diagnosis specified'}
                    </CardDescription>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {prescription.prescription_items &&
                  (prescription.prescription_items as Array<{
                    id: string
                    medicine_name: string
                    dosage: string
                    frequency: string
                    duration: string
                  }>).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(prescription.prescription_items as Array<{
                        id: string
                        medicine_name: string
                        dosage: string
                        frequency: string
                        duration: string
                      }>).map((item) => (
                        <Badge key={item.id} variant="outline">
                          {item.medicine_name} - {item.dosage}
                        </Badge>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <Icons.fileText className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No Prescriptions</EmptyTitle>
          <EmptyDescription>
            {"You haven't written any prescriptions yet. Create one for your patients."}
          </EmptyDescription>
          <EmptyContent>
            <Link href="/doctor/prescriptions/new">
              <Button>
                <Icons.plus className="mr-2 h-4 w-4" />
                New Prescription
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
