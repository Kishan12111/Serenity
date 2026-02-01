import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Serinity Focus Timer',
  description: 'Sign in or create a free account to sync your focus statistics across devices. Track your Pomodoro sessions, build streaks, and boost productivity with Serinity.',
  openGraph: {
    title: 'Sign In to Serinity - Free Focus Timer with Stats',
    description: 'Create a free account to save your focus progress, sync across devices, and track your productivity journey with beautiful anime-inspired themes.',
    type: 'website',
    url: 'https://www.serinityfocus.app/auth',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
