'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

interface Patient {
  id: string
  full_name: string | null
}

interface MedicineItem {
  medicine_name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export default function NewPrescriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPatient = searchParams.get('patient')

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient || '')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchPatients = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: patientsData } = await supabase.rpc('get_doctor_patients', {
          p_doctor_id: user.id,
        })
        setPatients((patientsData as Patient[]) || [])
      }
      setIsLoading(false)
    }

    fetchPatients()
  }, [])

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ])
  }

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index))
    }
  }

  const updateMedicine = (index: number, field: keyof MedicineItem, value: string) => {
    const updated = [...medicines]
    updated[index][field] = value
    setMedicines(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPatient) {
      toast.error('Please select a patient')
      return
    }

    if (medicines.some((m) => !m.medicine_name || !m.dosage)) {
      toast.error('Please fill in all medicine details')
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

    // Get doctor profile
    const { data: doctorProfile } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!doctorProfile) {
      toast.error('Doctor profile not found')
      setIsSaving(false)
      return
    }

    // Create prescription
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        patient_id: selectedPatient,
        doctor_id: doctorProfile.id,
        diagnosis,
        notes,
      })
      .select()
      .single()

    if (prescriptionError) {
      toast.error('Failed to create prescription')
      setIsSaving(false)
      return
    }

    // Add prescription items
    const items = medicines.map((m) => ({
      prescription_id: prescription.id,
      medicine_name: m.medicine_name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions,
    }))

    const { error: itemsError } = await supabase
      .from('prescription_items')
      .insert(items)

    if (itemsError) {
      toast.error('Failed to add prescription items')
    } else {
      toast.success('Prescription created successfully')
      router.push('/doctor/prescriptions')
    }

    setIsSaving(false)
  }

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
        <h1 className="text-3xl font-bold">New Prescription</h1>
        <p className="mt-1 text-muted-foreground">
          Create a prescription for your patient
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Select the patient for this prescription</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Patient</FieldLabel>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name || 'Unknown Patient'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Diagnosis</FieldLabel>
                  <Input
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g., Upper Respiratory Infection"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Medicines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Medications</CardTitle>
                <CardDescription>Add prescribed medicines</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={addMedicine}>
                <Icons.plus className="mr-2 h-4 w-4" />
                Add Medicine
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {medicines.map((medicine, index) => (
                <div key={index} className="relative rounded-lg border p-4">
                  {medicines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => removeMedicine(index)}
                    >
                      <Icons.close className="h-4 w-4" />
                    </Button>
                  )}
                  <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel>Medicine Name</FieldLabel>
                        <Input
                          value={medicine.medicine_name}
                          onChange={(e) =>
                            updateMedicine(index, 'medicine_name', e.target.value)
                          }
                          placeholder="e.g., Amoxicillin"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Dosage</FieldLabel>
                        <Input
                          value={medicine.dosage}
                          onChange={(e) =>
                            updateMedicine(index, 'dosage', e.target.value)
                          }
                          placeholder="e.g., 500mg"
                          required
                        />
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel>Frequency</FieldLabel>
                        <Select
                          value={medicine.frequency}
                          onValueChange={(value) =>
                            updateMedicine(index, 'frequency', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Once daily">Once daily</SelectItem>
                            <SelectItem value="Twice daily">Twice daily</SelectItem>
                            <SelectItem value="Three times daily">
                              Three times daily
                            </SelectItem>
                            <SelectItem value="Four times daily">
                              Four times daily
                            </SelectItem>
                            <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                            <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                            <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                            <SelectItem value="As needed">As needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Duration</FieldLabel>
                        <Select
                          value={medicine.duration}
                          onValueChange={(value) =>
                            updateMedicine(index, 'duration', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3 days">3 days</SelectItem>
                            <SelectItem value="5 days">5 days</SelectItem>
                            <SelectItem value="7 days">7 days</SelectItem>
                            <SelectItem value="10 days">10 days</SelectItem>
                            <SelectItem value="14 days">14 days</SelectItem>
                            <SelectItem value="21 days">21 days</SelectItem>
                            <SelectItem value="30 days">30 days</SelectItem>
                            <SelectItem value="Ongoing">Ongoing</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel>Special Instructions (Optional)</FieldLabel>
                      <Input
                        value={medicine.instructions}
                        onChange={(e) =>
                          updateMedicine(index, 'instructions', e.target.value)
                        }
                        placeholder="e.g., Take with food"
                      />
                    </Field>
                  </FieldGroup>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Any additional instructions for the patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or instructions..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Icons.refresh className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Prescription'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
