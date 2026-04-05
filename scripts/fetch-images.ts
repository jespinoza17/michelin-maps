#!/usr/bin/env npx tsx

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local since we're running outside of Next.js
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex)
    const value = trimmed.slice(eqIndex + 1)
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
} catch {
  // .env.local not found, rely on environment variables
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const CONCURRENCY = 3
const DELAY_BETWEEN_BATCHES_MS = 2000

function extractOgImage(html: string): string | null {
  // Match og:image meta tag - handles both property and name attributes, single and double quotes
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

async function fetchImageUrl(michelinUrl: string): Promise<string | null> {
  try {
    const response = await fetch(michelinUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    return extractOgImage(html)
  } catch {
    return null
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const limitArg = process.argv.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

  console.log(`Fetching restaurant images from Michelin guide pages...`)
  if (dryRun) console.log('(dry run - no database updates)')

  // Fetch restaurants that don't have an image_url yet and have a michelin_url
  let query = supabase
    .from('restaurants')
    .select('id, name, michelin_url')
    .not('michelin_url', 'is', null)
    .is('image_url', null)
    .order('name')

  if (limit) {
    query = query.limit(limit)
  }

  const { data: restaurants, error } = await query

  if (error) {
    console.error('Error fetching restaurants:', error)
    process.exit(1)
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('No restaurants need image updates.')
    return
  }

  console.log(`Found ${restaurants.length} restaurants without images.`)

  let successCount = 0
  let failCount = 0
  let processed = 0

  // Process in concurrent batches with delay to avoid rate limiting
  let consecutiveFailures = 0

  for (let i = 0; i < restaurants.length; i += CONCURRENCY) {
    const batch = restaurants.slice(i, i + CONCURRENCY)

    const results = await Promise.all(
      batch.map(async (restaurant) => {
        const imageUrl = await fetchImageUrl(restaurant.michelin_url!)
        return { id: restaurant.id, name: restaurant.name, imageUrl }
      })
    )

    // Update DB for successful fetches
    const updates = results.filter(r => r.imageUrl !== null)
    const batchFailures = results.filter(r => r.imageUrl === null).length

    if (updates.length > 0 && !dryRun) {
      await Promise.all(
        updates.map(async ({ id, imageUrl }) => {
          const { error } = await supabase
            .from('restaurants')
            .update({ image_url: imageUrl })
            .eq('id', id)

          if (error) {
            console.error(`  Failed to update DB for ${id}:`, error.message)
          }
        })
      )
    }

    for (const r of results) {
      processed++
      if (r.imageUrl) {
        successCount++
        consecutiveFailures = 0
      } else {
        failCount++
        consecutiveFailures++
      }
    }

    // Progress log every 50 restaurants
    if (processed % 50 === 0 || processed === restaurants.length) {
      console.log(`Progress: ${processed}/${restaurants.length} | ✅ ${successCount} | ❌ ${failCount}`)
    }

    // If we're getting rate limited (many consecutive failures), back off more aggressively
    if (consecutiveFailures >= 15) {
      console.log(`  ⏳ Backing off for 30s due to consecutive failures...`)
      await new Promise(r => setTimeout(r, 30000))
      consecutiveFailures = 0
    } else {
      // Standard delay between batches
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS))
    }
  }

  console.log(`\nDone!`)
  console.log(`  Total processed: ${processed}`)
  console.log(`  Images found:    ${successCount}`)
  console.log(`  No image found:  ${failCount}`)
}

main()
