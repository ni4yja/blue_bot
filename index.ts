import type { StoredPost } from './storage/postStorage.js'
import * as dotenv from 'dotenv'
import { initializeLinks } from './services/europeanaService.js'
import { getOgMetadata } from './sources/getOgMetadata.js'
import { findPostByLink, loadPosts, savePost } from './storage/postStorage.js'
import { formatPostData } from './utils/format.js'
import { translateText } from './utils/translate.js'

dotenv.config()

let links: string[] = []
let posts: StoredPost[] = []
let currentIndex = 0

async function runBlueBot() {
  try {
    links = await initializeLinks(process.env.EUROPEANA_API_KEY)
    posts = await loadPosts()

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
  if (currentIndex >= links.length) {
    console.log('✅ All links processed.')
    return
  }

  const linkToPost = links[currentIndex]
  let existingPost = findPostByLink(posts, linkToPost)

  if (!existingPost) {
    const { image, title, description } = await getOgMetadata(linkToPost)

    const translatedTitle = title ? await translateText(title) : undefined
    const translatedDescription = description ? await translateText(description) : undefined

    const { title: formattedTitle, description: formattedDescription } = formatPostData(
      translatedTitle,
      translatedDescription,
      linkToPost,
    )

    existingPost = {
      link: linkToPost,
      image,
      title: formattedTitle || 'Untitled',
      description: formattedDescription || 'No description available.',
    }

    await savePost(existingPost)
    posts.push(existingPost) // 💡 обов'язково додати новий пост у глобальний масив!
  }

  console.log('🔹', `${currentIndex + 1}/${links.length}`)
  console.log('📎 Link:', existingPost.link)
  console.log('🖼️ Image:', existingPost.image)
  console.log('📝 Title:', existingPost.title)
  console.log('📄 Description:', existingPost.description)

  currentIndex++
  await processNextLink()
}

runBlueBot()
