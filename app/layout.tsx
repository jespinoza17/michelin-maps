import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { MixpanelProvider } from '@/components/providers/mixpanel-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Michelin Maps - Discover Exceptional Dining Worldwide',
  description: 'Find Michelin-starred restaurants, Bib Gourmand selections, and recommended establishments in cities around the globe.',
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Michelin Maps - Discover Exceptional Dining Worldwide',
    description: 'Find Michelin-starred restaurants, Bib Gourmand selections, and recommended establishments in cities around the globe.',
    images: [
      {
        url: '/screenshot-v1.png',
        width: 1200,
        height: 630,
        alt: 'Michelin Maps - Interactive restaurant discovery platform',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Michelin Maps - Discover Exceptional Dining Worldwide',
    description: 'Find Michelin-starred restaurants, Bib Gourmand selections, and recommended establishments in cities around the globe.',
    images: ['/screenshot-v1.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <style>{`
html {
  font-family: ${inter.style.fontFamily}, ${GeistSans.style.fontFamily};
  --font-inter: ${inter.variable};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="font-inter antialiased">
        <MixpanelProvider>
          {children}
        </MixpanelProvider>
      </body>
    </html>
  )
}
