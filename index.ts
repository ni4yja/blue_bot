import { AtpAgent } from '@atproto/api'
import * as dotenv from 'dotenv'

import { uploadImage } from './services/blobService.js'
import { loginToBsky, postToBsky } from './services/bskyService.js'
import { loadPosted, savePosted } from './storage/postedStorage.js'
import { loadPosts } from './storage/postStorage.js'

dotenv.config()

async function runBlueBot() {
  try {
    const agent = new AtpAgent({ service: 'https://bsky.social' })

    await loginToBsky(agent, process.env.BLUESKY_USERNAME!, process.env.BLUESKY_PASSWORD!)

    const posts = await loadPosts()
    const posted = await loadPosted()

    const availablePosts = posts.filter(post => !posted.includes(post.link))

    if (availablePosts.length === 0) {
      console.log('✅ All posts have been published.')
      return
    }

    const randomPost = availablePosts[Math.floor(Math.random() * availablePosts.length)]

    let embed
    if (randomPost.image) {
      const uploadedBlob = await uploadImage(agent, randomPost.image)
      if (uploadedBlob) {
        embed = {
          $type: 'app.bsky.embed.images#main',
          images: [
            {
              image: uploadedBlob,
              alt: randomPost.title || 'Image',
            },
          ],
        }
      }
    }

    const text = `${randomPost.title}\n\n${randomPost.description}\n\n${randomPost.link}`
    const trimmedText = text.length > 300 ? `${text.slice(0, 297)}...` : text

    await postToBsky(agent, trimmedText, embed)

    console.log('✅ Post successfully created!')

    await savePosted(randomPost.link)
  }
  catch (error) {
    console.error('❌ Error running Blue Bot:', error instanceof Error ? error.message : String(error))
  }
}

runBlueBot()
