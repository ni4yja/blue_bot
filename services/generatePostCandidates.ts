import type { StoredPost } from '../storage/postStorage.js'
import { getOgMetadata } from '../sources/getOgMetadata.js'
import { initializeLinks } from './europeanaService.js'

export async function generatePostCandidates(): Promise<StoredPost[]> {
  const apiKey = process.env.EUROPEANA_API_KEY
  if (!apiKey)
    throw new Error('❌ Missing EUROPEANA_API_KEY')

  const links = await initializeLinks(apiKey)

  const posts: StoredPost[] = []

  for (const link of links) {
    const metadata = await getOgMetadata(link)

    if (!metadata.title || !metadata.image) {
      console.warn(`⚠️ Skipping ${link} — missing title or image`)
      continue
    }

    posts.push({
      link,
      image: metadata.image,
      title: metadata.title,
      description: metadata.description || '',
    })
  }

  return posts
}
