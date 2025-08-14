"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initMixpanel, trackPageView } from '@/lib/mixpanel'

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize Mixpanel on client side
    initMixpanel()
  }, [])

  useEffect(() => {
    // Track page views when pathname changes
    if (pathname) {
      trackPageView(pathname)
    }
  }, [pathname])

  return <>{children}</>
}