import * as dotenv from 'dotenv'
import { initializeLinks } from './services/europeanaService.js'
import { getOgMetadata } from './services/ogMetadataService.js'

dotenv.config()

let links: string[] = []
let currentIndex = 0

async function runBlueBot() {
  try {
    links = await initializeLinks(process.env.EUROPEANA_API_KEY!)

    if (links.length === 0) {
      console.warn('❗ No links found.')
      return
    }

    console.log(`✅ Loaded ${links.length} links from Europeana.\n`)
    await processNextLink()
  }
  catch (error) {
    console.error('Error running blue bot:', error instanceof Error ? error.message : String(error))
  }
}

async function processNextLink() {
  if (currentIndex >= 1) {
    console.log('✅ All links processed.')
    return
  }

  const linkToPost = links[currentIndex]
  const { image, title, description } = await getOgMetadata(linkToPost)

  console.log(`🔹 ${currentIndex + 1}/${links.length}`)
  console.log('📎 Link:', linkToPost)
  console.log('🖼️ Image:', image)
  console.log('📝 Title:', title)
  console.log('📝 Description:', description)

  currentIndex++
  await processNextLink() // обробка наступного посилання
}

runBlueBot()
