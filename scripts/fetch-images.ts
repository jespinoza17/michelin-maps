#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const CONCURRENCY = 5
const BATCH_SIZE = 100

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

async function processInBatches<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
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

  // Process in concurrent batches
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

    if (updates.length > 0 && !dryRun) {
      // Update each restaurant individually (Supabase doesn't support bulk update by different IDs easily)
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
      } else {
        failCount++
      }
    }

    // Progress log every 50 restaurants
    if (processed % 50 === 0 || processed === restaurants.length) {
      console.log(`Progress: ${processed}/${restaurants.length} | ✅ ${successCount} | ❌ ${failCount}`)
    }
  }

  console.log(`\nDone!`)
  console.log(`  Total processed: ${processed}`)
  console.log(`  Images found:    ${successCount}`)
  console.log(`  No image found:  ${failCount}`)
}

main()
