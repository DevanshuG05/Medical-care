import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <Icons.logo className="h-8 w-8" />
            <span className="text-xl font-bold">MediCare+</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
              Your Health Journey,{' '}
              <span className="text-primary">Simplified</span>
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground md:text-xl">
              A comprehensive healthcare platform that connects patients with
              doctors. Manage appointments, track medications, access medical
              records, and get AI-powered symptom analysis - all in one place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/sign-up">
                <Button size="lg" className="h-12 px-8 text-base">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-secondary/30 py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything You Need for Better Healthcare
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl bg-card p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
              <h2 className="text-2xl font-bold md:text-3xl">
                Ready to Take Control of Your Health?
              </h2>
              <p className="mt-4 text-primary-foreground/80">
                Join thousands of patients and doctors using MediCare+ for
                seamless healthcare management.
              </p>
              <Link href="/auth/sign-up">
                <Button
                  size="lg"
                  variant="secondary"
                  className="mt-8 h-12 px-8"
                >
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2 text-primary">
              <Icons.logo className="h-6 w-6" />
              <span className="font-semibold">MediCare+</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your Health, Our Priority
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'Book Appointments',
    description:
      'Schedule appointments with doctors easily. View available slots and book with just a few clicks.',
    icon: Icons.calendar,
  },
  {
    title: 'AI Symptom Analysis',
    description:
      'Get instant AI-powered preliminary analysis of your symptoms to help you make informed decisions.',
    icon: Icons.brain,
  },
  {
    title: 'Medicine Reminders',
    description:
      'Never miss a dose with smart medication reminders and track your adherence over time.',
    icon: Icons.pill,
  },
  {
    title: 'Medical Records',
    description:
      'Access your complete medical history, test results, and prescriptions in one secure place.',
    icon: Icons.fileText,
  },
  {
    title: 'Doctor Dashboard',
    description:
      'Doctors can manage patients, write prescriptions, and access medical records efficiently.',
    icon: Icons.stethoscope,
  },
  {
    title: 'Health Analytics',
    description:
      'Track your health metrics over time with comprehensive charts and insights.',
    icon: Icons.trendingUp,
  },
]
