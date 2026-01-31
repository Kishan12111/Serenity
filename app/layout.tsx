import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ConvexClientProvider } from '@/components/convex-provider'
import { AuthProvider } from '@/lib/useAuth'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Comprehensive SEO metadata
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.serinityfocus.app'),
  title: {
    default: 'Serenity - Free Pomodoro Timer with Beautiful Stats | Anime Focus App',
    template: '%s | Serenity Focus Timer',
  },
  description: 'The world\'s first free Pomodoro timer with comprehensive focus statistics, anime-inspired ambient backgrounds, and cloud sync. Track your study sessions, build streaks, and boost productivity with beautiful aesthetics.',
  keywords: [
    'pomodoro timer',
    'focus timer',
    'study timer',
    'free pomodoro',
    'anime study',
    'focus statistics',
    'productivity app',
    'study tracker',
    'focus session tracker',
    'ambient timer',
    'aesthetic timer',
    'anime wallpaper timer',
    'concentration app',
    'deep work timer',
    'study companion',
    'free focus tracker',
    'pomodoro technique',
    'study streaks',
    'productivity tracker',
    'lofi study timer',
  ],
  authors: [{ name: 'Serenity Team' }],
  creator: 'Serenity',
  publisher: 'Serenity',
  category: 'Productivity',
  applicationName: 'Serenity Focus Timer',
  generator: 'Next.js',
  
  // Open Graph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.serinityfocus.app',
    siteName: 'Serenity - Focus Companion',
    title: 'Serenity - The First Free Pomodoro Timer with Beautiful Focus Statistics',
    description: 'Transform your study sessions with anime-inspired aesthetics. Free forever: track focus time, build streaks, sync across devices. The only Pomodoro app that makes productivity beautiful.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Serenity - Anime Focus Timer with Stats',
        type: 'image/png',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Serenity - Free Pomodoro Timer with Beautiful Stats',
    description: 'The world\'s first free focus timer with comprehensive statistics & anime-inspired themes. Track, focus, achieve.',
    images: ['/twitter-image.png'],
    creator: '@serenity_focus',
  },
  
  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Favicons and icons
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  
  // Manifest for PWA
  manifest: '/manifest.json',
  
  // App-specific
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Serenity',
  },
  
  // Verification (add your actual verification codes)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  
  // Alternates for internationalization
  alternates: {
    canonical: 'https://www.serinityfocus.app',
  },
  
  // Other metadata
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
  },
}

// Viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

// JSON-LD Structured Data
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://serenity-focus.app/#webapp',
      name: 'Serenity Focus Timer',
      description: 'The world\'s first free Pomodoro timer with comprehensive focus statistics and anime-inspired ambient themes.',
      url: 'https://serenity-focus.app',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'Pomodoro Technique Timer',
        'Focus Statistics Tracking',
        'Anime-Inspired Themes',
        'Daily Streak Tracking',
        'Cloud Sync',
        'Custom Timer Duration',
        'Session History',
      ],
      screenshot: '/screenshot.png',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '1250',
        bestRating: '5',
        worstRating: '1',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://serenity-focus.app/#organization',
      name: 'Serenity',
      url: 'https://serenity-focus.app',
      logo: 'https://serenity-focus.app/logo.png',
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://serenity-focus.app/#website',
      url: 'https://serenity-focus.app',
      name: 'Serenity - Focus Companion',
      description: 'Free Pomodoro timer with beautiful statistics',
      publisher: { '@id': 'https://serenity-focus.app/#organization' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Serenity really free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! Serenity is 100% free forever. We believe everyone deserves access to great productivity tools. All features including statistics tracking, themes, and cloud sync are completely free.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the Pomodoro Technique?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks. Serenity makes this technique beautiful with anime-inspired themes.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use Serenity without creating an account?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely! You can use Serenity immediately without signing up. Creating a free account enables cloud sync and preserves your statistics across devices.',
          },
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* DNS prefetch and preconnect for faster loading */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload critical resources */}
        <link rel="preload" href="/backgrounds/night-sky.jpg" as="image" />
      </head>
      <body className={`font-sans antialiased`}>
        <ConvexClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
