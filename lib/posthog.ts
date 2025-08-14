// PostHog integration with dynamic import
let posthog: any = null

export async function initPostHog() {
  if (typeof window !== 'undefined' && !posthog) {
    try {
      const posthogModule = await import('posthog-js')
      posthog = posthogModule.default
      
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
      
      if (posthogKey && posthogHost) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          person_profiles: 'identified_only',
          capture_pageview: false // We'll manually track page views
        })
      }
    } catch (error) {
      console.warn('PostHog not available:', error)
    }
  }
  
  return posthog
}

export function trackPageView(page: string) {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page: page
    })
  }
}

export function trackCitySelection(cityName: string, source: 'header' | 'sidebar' | 'mobile') {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture('city_selected', {
      city: cityName,
      source: source,
      timestamp: new Date().toISOString()
    })
  }
}

export { posthog }