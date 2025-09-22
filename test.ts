import * as dotenv from 'dotenv'
import { initializeCollections } from './services/europeanaService.js'

dotenv.config()

const API_KEY = process.env.EUROPEANA_API_KEY

async function main() {
  if (!API_KEY) {
    throw new Error('EUROPEANA_API_KEY environment variable is not set.')
  }
  const cols = await initializeCollections(API_KEY)
  console.log('✅ Fetch complete.')
  cols.forEach((col) => {
    console.log(`${col.name}: ${col.links?.length} links`)
  })
}

main()
