import * as dotenv from 'dotenv'
import { initializeLinks } from './services/europeanaService.js'
import { getOgMetadata } from './sources/getOgMetadata.js'
import { formatPostData } from './utils/format.js'
import { translateText } from './utils/translate.js'

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

    await processNextLink()
  }
  catch (error) {
    console.error('Error running blue bot:', error instanceof Error ? error.message : String(error))
  }
}

async function processNextLink() {
  if (currentIndex >= 2) {
    return
  }

  const linkToPost = links[currentIndex]
  const { image, title, description } = await getOgMetadata(linkToPost)

  const translatedTitle = title ? await translateText(title) : undefined
  const translatedDescription = description ? await translateText(description) : undefined

  const { title: formattedTitle, description: formattedDescription } = formatPostData(
    translatedTitle,
    translatedDescription,
    linkToPost,
  )

  console.log('🔹', `${currentIndex + 1}/${links.length}`)
  console.log('📎 Link:', linkToPost)
  console.log('🖼️ Image:', image)
  console.log('📝 Title:', formattedTitle)
  console.log('📝 Description:', formattedDescription)

  currentIndex++
  await processNextLink()
}

runBlueBot()
