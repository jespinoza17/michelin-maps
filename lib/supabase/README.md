# Supabase Setup for Michelin Maps

This directory contains all the Supabase-related configuration and utilities for the Michelin Maps application.

## Files Overview

- `schema.sql` - Database schema definition for restaurants table
- `client.ts` - Supabase client configuration
- `types.ts` - TypeScript types for database tables
- `queries.ts` - Query functions for restaurant data
- `seed.ts` - Data seeding utilities

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Environment Variables

Add these to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `schema.sql` to create the restaurants table and indexes

### 4. Seed Data

Once your database is set up, you can seed it with restaurant data:

```bash
# In development only
curl -X POST http://localhost:3000/api/seed
```

Or use the seed function directly:

```typescript
import { seedRestaurants } from '@/lib/supabase/seed'
await seedRestaurants()
```

## API Endpoints

- `GET /api/restaurants` - Get restaurants with optional filters
- `GET /api/restaurants/[id]` - Get single restaurant by ID  
- `GET /api/restaurants/filters` - Get filter options (countries, cities, cuisines)
- `POST /api/seed` - Seed database with restaurant data (dev only)

## Available Filters

The `/api/restaurants` endpoint supports these query parameters:

- `stars` - Filter by Michelin stars (1,2,3)
- `countries` - Filter by countries
- `cities` - Filter by cities  
- `cuisines` - Filter by cuisine types
- `priceLevel` - Filter by price level (1-4)
- `greenStar` - Filter by green star (true/false)
- `search` - Full-text search across name, cuisine, description
- `limit` - Limit number of results
- `offset` - Pagination offset

### Example Requests

```
GET /api/restaurants?stars=3&countries=France
GET /api/restaurants?search=french restaurant&limit=10
GET /api/restaurants?greenStar=true&priceLevel=4
```

## Database Schema

The `restaurants` table contains:

- Basic info: name, address, location, city, country
- Michelin data: stars (1-3), cuisine, price_level (1-4), green_star
- Geographic: latitude, longitude with spatial index
- Contact: phone, website, michelin_url
- Additional: facilities array, description
- Timestamps: created_at, updated_at

Indexes are optimized for:
- Filtering by stars, location, cuisine, price level
- Geographic queries
- Full-text search
- Performance for common query patterns

## Development

To modify the schema:
1. Update `schema.sql`
2. Run the new SQL in Supabase dashboard
3. Update `types.ts` if table structure changes
4. Update `queries.ts` if new query patterns needed