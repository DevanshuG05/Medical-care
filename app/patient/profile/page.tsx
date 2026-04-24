'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  emergency_contact: string | null
  blood_type: string | null
  allergies: string | null
  medical_conditions: string | null
}

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
      } else {
        // No profile row yet — create one from auth metadata
        const seed = {
          id: user.id,
          full_name: (user.user_metadata?.full_name as string) || null,
          phone: null,
          date_of_birth: null,
          gender: null,
          address: null,
          emergency_contact: null,
          blood_type: null,
          allergies: null,
          medical_conditions: null,
          role: (user.user_metadata?.role as string) || 'patient',
        }

        const { data: created } = await supabase
          .from('profiles')
          .upsert(seed)
          .select()
          .single()

        setProfile(created ?? { ...seed })
      }

      setIsLoading(false)
    }

    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        address: profile.address,
        emergency_contact: profile.emergency_contact,
        blood_type: profile.blood_type,
        allergies: profile.allergies,
        medical_conditions: profile.medical_conditions,
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

  if (!profile) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your personal and medical information
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic personal details</CardDescription>
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
                    placeholder="John Doe"
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

                <Field>
                  <FieldLabel>Date of Birth</FieldLabel>
                  <Input
                    type="date"
                    value={profile.date_of_birth || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, date_of_birth: e.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>Gender</FieldLabel>
                  <Select
                    value={profile.gender || ''}
                    onValueChange={(value) =>
                      setProfile({ ...profile, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Address</FieldLabel>
                  <Textarea
                    value={profile.address || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    placeholder="123 Main St, City, State 12345"
                    rows={3}
                  />
                </Field>

                <Field>
                  <FieldLabel>Emergency Contact</FieldLabel>
                  <Input
                    value={profile.emergency_contact || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, emergency_contact: e.target.value })
                    }
                    placeholder="Jane Doe - +1 (555) 987-6543"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>
                Important health information for your care
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Blood Type</FieldLabel>
                  <Select
                    value={profile.blood_type || ''}
                    onValueChange={(value) =>
                      setProfile({ ...profile, blood_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Known Allergies</FieldLabel>
                  <Textarea
                    value={profile.allergies || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, allergies: e.target.value })
                    }
                    placeholder="List any allergies (e.g., Penicillin, Peanuts)"
                    rows={3}
                  />
                </Field>

                <Field>
                  <FieldLabel>Medical Conditions</FieldLabel>
                  <Textarea
                    value={profile.medical_conditions || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        medical_conditions: e.target.value,
                      })
                    }
                    placeholder="List any chronic conditions or medical history"
                    rows={4}
                  />
                </Field>
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
