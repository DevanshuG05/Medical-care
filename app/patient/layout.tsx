import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // If user is a doctor, redirect to doctor dashboard
  if (profile?.role === 'doctor') {
    redirect('/doctor')
  }

  return (
    <div className="flex min-h-svh bg-background">
      <DashboardSidebar role="patient" userName={profile?.full_name || undefined} />
      <div className="flex flex-1 flex-col">
        <MobileNav role="patient" userName={profile?.full_name || undefined} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
