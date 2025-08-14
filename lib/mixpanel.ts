// Mixpanel integration with dynamic import
let mixpanel: any = null

export async function initMixpanel() {
  if (typeof window !== 'undefined' && !mixpanel) {
    try {
      const mixpanelModule = await import('mixpanel-browser')
      mixpanel = mixpanelModule.default
      
      const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
      
      if (mixpanelToken) {
        mixpanel.init(mixpanelToken, {
          track_pageview: false // We'll manually track page views
        })
      }
    } catch (error) {
      console.warn('Mixpanel not available:', error)
    }
  }
  
  return mixpanel
}

export function trackPageView(page: string) {
  if (typeof window !== 'undefined' && mixpanel) {
    mixpanel.track('Page View', {
      page: page,
      url: window.location.href
    })
  }
}

export function trackCitySelection(cityName: string, source: 'header' | 'sidebar' | 'mobile') {
  if (typeof window !== 'undefined' && mixpanel) {
    mixpanel.track('City Selected', {
      city: cityName,
      source: source,
      timestamp: new Date().toISOString()
    })
  }
}

export { mixpanel }