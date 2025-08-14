# PostHog Analytics Setup

## Installation

To complete the PostHog integration, run:

```bash
npm install posthog-js --save
```

## Environment Variables

Make sure you have these variables in your `.env.local`:

```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host_url
```

## Features Implemented

### 🔍 Page View Tracking
- **Homepage**: Automatic tracking when users visit `/`
- **Map Page**: Automatic tracking when users visit `/map`

### 📍 City Selection Tracking
- **Header Search**: Tracks when users select cities from the main search bar
- **Sidebar Search**: Tracks when users select cities from the filter panel
- **Mobile Search**: Tracks when users select cities on mobile
- **Popular Cities**: Tracks when users click popular city buttons on homepage

### 📊 Event Data Captured

#### Page Views
```javascript
{
  event: '$pageview',
  page: '/map' | '/',
  $current_url: 'full_url'
}
```

#### City Selection
```javascript
{
  event: 'city_selected',
  city: 'Tokyo',
  source: 'header' | 'sidebar' | 'mobile',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

## Implementation Notes

- PostHog is loaded dynamically to avoid SSR issues
- All tracking is client-side only
- Graceful fallback if PostHog is not available
- No tracking in development unless specifically configured

## Testing

Once PostHog is installed, you can test tracking by:

1. Opening browser dev tools
2. Going to Network tab
3. Navigating between pages
4. Selecting different cities
5. Looking for PostHog API calls to your configured host