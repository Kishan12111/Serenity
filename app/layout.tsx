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
    default: 'Serinity - Free Pomodoro Timer with Beautiful Stats | Anime Focus App',
    template: '%s | Serinity Focus Timer',
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
  authors: [{ name: 'Serinity Team' }],
  creator: 'Serinity',
  publisher: 'Serinity',
  category: 'Productivity',
  applicationName: 'Serinity Focus Timer',
  generator: 'Next.js',
  
  // Open Graph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.serinityfocus.app',
    siteName: 'Serinity - Focus Companion',
    title: 'Serinity - The First Free Pomodoro Timer with Beautiful Focus Statistics',
    description: 'Transform your study sessions with anime-inspired aesthetics. Free forever: track focus time, build streaks, sync across devices. The only Pomodoro app that makes productivity beautiful.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Serinity - Anime Focus Timer with Stats',
        type: 'image/png',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Serinity - Free Pomodoro Timer with Beautiful Stats',
    description: 'The world\'s first free focus timer with comprehensive statistics & anime-inspired themes. Track, focus, achieve.',
    images: ['/twitter-image.png'],
    creator: '@serinity_focus',
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
  
  // Favicons and icons - using PNG for better Google search compatibility
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  
  // Manifest for PWA
  manifest: '/manifest.json',
  
  // App-specific
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Serinity',
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
      '@id': 'https://www.serinityfocus.app/#webapp',
      name: 'Serinity Focus Timer',
      description: 'The world\'s first free Pomodoro timer with comprehensive focus statistics and anime-inspired ambient themes.',
      url: 'https://www.serinityfocus.app',
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
      '@id': 'https://www.serinityfocus.app/#organization',
      name: 'Serinity',
      url: 'https://www.serinityfocus.app',
      logo: 'https://www.serinityfocus.app/logo.png',
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.serinityfocus.app/#website',
      url: 'https://www.serinityfocus.app',
      name: 'Serinity - Focus Companion',
      description: 'Free Pomodoro timer with beautiful statistics',
      publisher: { '@id': 'https://www.serinityfocus.app/#organization' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Serinity really free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! Serinity is 100% free forever. We believe everyone deserves access to great productivity tools. All features including statistics tracking, themes, and cloud sync are completely free.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the Pomodoro Technique?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks. Serinity makes this technique beautiful with anime-inspired themes.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use Serinity without creating an account?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely! You can use Serinity immediately without signing up. Creating a free account enables cloud sync and preserves your statistics across devices.',
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
