'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

interface Profile {
  id: string
  full_name: string | null
  phone: string | null
}

interface DoctorProfile {
  id: string
  specialization: string | null
  license_number: string | null
  consultation_fee: number | null
  experience_years: number | null
  bio: string | null
  available_days: string[] | null
  available_hours_start: string | null
  available_hours_end: string | null
}

const specializations = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Surgery',
  'Urology',
]

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // --- profiles table ---
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      } else {
        const seed = {
          id: user.id,
          full_name: (user.user_metadata?.full_name as string) || null,
          phone: null,
          role: (user.user_metadata?.role as string) || 'doctor',
        }
        const { data: created } = await supabase
          .from('profiles')
          .upsert(seed)
          .select('id, full_name, phone')
          .single()
        setProfile(created ?? { id: user.id, full_name: seed.full_name, phone: null })
      }

      // --- doctor_profiles table ---
      const { data: doctorData } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (doctorData) {
        setDoctorProfile(doctorData)
        setSelectedDays(doctorData.available_days || [])
      } else {
        const seed: DoctorProfile = {
          id: user.id,
          specialization: null,
          license_number: null,
          consultation_fee: null,
          experience_years: null,
          bio: null,
          available_days: [],
          available_hours_start: '09:00',
          available_hours_end: '17:00',
        }
        const { data: created } = await supabase
          .from('doctor_profiles')
          .upsert(seed)
          .select()
          .single()
        setDoctorProfile(created ?? seed)
        setSelectedDays([])
      }

      setIsLoading(false)
    }

    fetchProfile()
  }, [])

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !doctorProfile) return

    setIsSaving(true)
    const supabase = createClient()

    // Upsert base profile
    await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
      })

    // Upsert doctor profile
    const { error } = await supabase
      .from('doctor_profiles')
      .upsert({
        id: doctorProfile.id,
        specialization: doctorProfile.specialization,
        license_number: doctorProfile.license_number,
        consultation_fee: doctorProfile.consultation_fee,
        experience_years: doctorProfile.experience_years,
        bio: doctorProfile.bio,
        available_days: selectedDays,
        available_hours_start: doctorProfile.available_hours_start,
        available_hours_end: doctorProfile.available_hours_end,
      })

    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated successfully')
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

  if (!profile || !doctorProfile) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Doctor Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your professional information and availability
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic contact details</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Full Name</FieldLabel>
                  <Input
                    value={profile.full_name || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder="Dr. John Smith"
                  />
                </Field>

                <Field>
                  <FieldLabel>Phone Number</FieldLabel>
                  <Input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Your medical credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Specialization</FieldLabel>
                  <Select
                    value={doctorProfile.specialization || ''}
                    onValueChange={(value) =>
                      setDoctorProfile({ ...doctorProfile, specialization: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {specializations.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>License Number</FieldLabel>
                  <Input
                    value={doctorProfile.license_number || ''}
                    onChange={(e) =>
                      setDoctorProfile({
                        ...doctorProfile,
                        license_number: e.target.value,
                      })
                    }
                    placeholder="MD12345"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Consultation Fee ($)</FieldLabel>
                    <Input
                      type="number"
                      value={doctorProfile.consultation_fee || ''}
                      onChange={(e) =>
                        setDoctorProfile({
                          ...doctorProfile,
                          consultation_fee: parseFloat(e.target.value) || null,
                        })
                      }
                      placeholder="100"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Years of Experience</FieldLabel>
                    <Input
                      type="number"
                      value={doctorProfile.experience_years || ''}
                      onChange={(e) =>
                        setDoctorProfile({
                          ...doctorProfile,
                          experience_years: parseInt(e.target.value) || null,
                        })
                      }
                      placeholder="10"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Bio</FieldLabel>
                  <Textarea
                    value={doctorProfile.bio || ''}
                    onChange={(e) =>
                      setDoctorProfile({ ...doctorProfile, bio: e.target.value })
                    }
                    placeholder="Brief description of your background and expertise..."
                    rows={4}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>
                Set your available days and working hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Available Days</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          selectedDays.includes(day)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Start Time</FieldLabel>
                    <Input
                      type="time"
                      value={doctorProfile.available_hours_start || '09:00'}
                      onChange={(e) =>
                        setDoctorProfile({
                          ...doctorProfile,
                          available_hours_start: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel>End Time</FieldLabel>
                    <Input
                      type="time"
                      value={doctorProfile.available_hours_end || '17:00'}
                      onChange={(e) =>
                        setDoctorProfile({
                          ...doctorProfile,
                          available_hours_end: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Icons.refresh className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
