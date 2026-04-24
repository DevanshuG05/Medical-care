import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import { format } from 'date-fns'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

export default async function PatientRecordsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: records } = await supabase
    .from('medical_records')
    .select(`
      *,
      doctor_profiles (
        profiles (full_name)
      )
    `)
    .eq('patient_id', user!.id)
    .order('record_date', { ascending: false })

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'lab_result':
        return Icons.clipboard
      case 'imaging':
        return Icons.eye
      case 'diagnosis':
        return Icons.stethoscope
      case 'procedure':
        return Icons.activity
      default:
        return Icons.fileText
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Medical Records</h1>
        <p className="mt-1 text-muted-foreground">
          Access your complete medical history
        </p>
      </div>

      {records && records.length > 0 ? (
        <div className="space-y-4">
          {records.map((record) => {
            const RecordIcon = getRecordIcon(record.record_type)
            return (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <RecordIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <CardDescription>
                          {format(new Date(record.record_date), 'MMMM d, yyyy')}
                          {record.doctor_profiles && (
                            <> - Dr. {(record.doctor_profiles as { profiles?: { full_name?: string } })?.profiles?.full_name}</>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {record.record_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {record.description && (
                    <p className="text-muted-foreground">{record.description}</p>
                  )}
                  {record.file_url && (
                    <a
                      href={record.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Icons.download className="h-4 w-4" />
                      View Attachment
                    </a>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <Icons.clipboard className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No Medical Records</EmptyTitle>
          <EmptyDescription>Your medical records will appear here once they are added by your healthcare providers.</EmptyDescription>
        </Empty>
      )}
    </div>
  )
}
