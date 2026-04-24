'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface MobileNavProps {
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

export function MobileNav({ role, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const navItems = role === 'doctor' ? doctorNavItems : patientNavItems

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    setOpen(false)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
      <Link href="/" className="flex items-center gap-2 text-primary">
        <Icons.logo className="h-7 w-7" />
        <span className="text-lg font-bold">MediCare+</span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Icons.menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0">
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                {role === 'doctor' ? (
                  <Icons.stethoscope className="h-5 w-5 text-primary" />
                ) : (
                  <Icons.user className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{userName || 'User'}</p>
                <p className="text-xs capitalize text-muted-foreground">{role}</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <Icons.logOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
