'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SidebarProps {
  role: 'patient' | 'doctor'
  userName?: string
}

const patientNavItems = [
  { href: '/patient', label: 'Dashboard', icon: Icons.home },
  { href: '/patient/appointments', label: 'Appointments', icon: Icons.calendar },
  { href: '/patient/symptoms', label: 'Symptom Analyzer', icon: Icons.brain },
  { href: '/patient/prescriptions', label: 'Prescriptions', icon: Icons.fileText },
  { href: '/patient/reminders', label: 'Medicine Reminders', icon: Icons.pill },
  { href: '/patient/records', label: 'Medical Records', icon: Icons.clipboard },
  { href: '/patient/profile', label: 'Profile', icon: Icons.user },
]

const doctorNavItems = [
  { href: '/doctor', label: 'Dashboard', icon: Icons.home },
  { href: '/doctor/appointments', label: 'Appointments', icon: Icons.calendar },
  { href: '/doctor/patients', label: 'My Patients', icon: Icons.users },
  { href: '/doctor/prescriptions', label: 'Prescriptions', icon: Icons.fileText },
  { href: '/doctor/profile', label: 'Profile', icon: Icons.user },
]

export function DashboardSidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = role === 'doctor' ? doctorNavItems : patientNavItems

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/')
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link href="/" className="flex items-center gap-2 text-sidebar-primary">
          <Icons.logo className="h-8 w-8" />
          <span className="text-xl font-bold">MediCare+</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            {role === 'doctor' ? (
              <Icons.stethoscope className="h-5 w-5 text-primary" />
            ) : (
              <Icons.user className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{userName || 'User'}</p>
            <p className="text-xs capitalize text-muted-foreground">{role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <Icons.logOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
