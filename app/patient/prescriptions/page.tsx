'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import { format } from 'date-fns'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

interface PrescriptionItem {
  id: string
  medicine_name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string | null
}

interface Prescription {
  id: string
  diagnosis: string
  notes: string | null
  created_at: string
  doctor_name: string | null
  items: PrescriptionItem[]
}

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase.rpc('get_patient_prescriptions', {
            p_patient_id: user.id,
          })
          if (error) throw error
          setPrescriptions((data as Prescription[]) || [])
        }
      } catch (err) {
        console.error('Failed to load prescriptions:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrescriptions()
  }, [])

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
        <h1 className="text-3xl font-bold">My Prescriptions</h1>
        <p className="mt-1 text-muted-foreground">
          View your prescriptions from doctors
        </p>
      </div>

      {prescriptions.length > 0 ? (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.fileText className="h-5 w-5 text-primary" />
                      Prescription #{prescription.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      Dr. {prescription.doctor_name || 'Unknown'} —{' '}
                      {format(new Date(prescription.created_at), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {prescription.diagnosis && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground">Diagnosis</p>
                    <p className="mt-1">{prescription.diagnosis}</p>
                  </div>
                )}

                {prescription.items && prescription.items.length > 0 && (
                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      Medications
                    </p>
                    <div className="space-y-3">
                      {prescription.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-lg border p-3"
                        >
                          <Icons.pill className="mt-0.5 h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">{item.medicine_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.dosage} — {item.frequency} for {item.duration}
                            </p>
                            {item.instructions && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                Note: {item.instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {prescription.notes && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-3">
                    <p className="text-sm">
                      <span className="font-medium">Doctor Notes:</span>{' '}
                      {prescription.notes}
                    </p>
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
            {"You don't have any prescriptions yet. They will appear here once a doctor issues one."}
          </EmptyDescription>
        </Empty>
      )}
    </div>
  )
}
