#!/usr/bin/env npx tsx

import { seedRestaurants, clearRestaurants, getRestaurantCount } from '../lib/supabase/seed'

const command = process.argv[2]

async function main() {
  try {
    switch (command) {
      case 'seed':
        console.log('Starting restaurant seeding...')
        const result = await seedRestaurants()
        if (result.success) {
          console.log(`✅ Successfully seeded ${result.count} restaurants`)
        } else {
          console.error('❌ Seeding failed:', result.error)
          process.exit(1)
        }
        break
        
      case 'clear':
        console.log('Clearing all restaurants...')
        await clearRestaurants()
        console.log('✅ All restaurants cleared')
        break
        
      case 'count':
        const count = await getRestaurantCount()
        console.log(`📊 Current restaurant count: ${count}`)
        break
        
      default:
        console.log('Usage: npx tsx scripts/seed.ts [seed|clear|count]')
        console.log('')
        console.log('Commands:')
        console.log('  seed  - Seed the database with restaurant data')
        console.log('  clear - Clear all restaurants from database')
        console.log('  count - Show current restaurant count')
        process.exit(1)
    }
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

main()