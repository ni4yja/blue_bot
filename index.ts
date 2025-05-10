import { AtpAgent } from '@atproto/api'
import * as dotenv from 'dotenv'
import yargs from 'yargs'

import { hideBin } from 'yargs/helpers'

import { loginToBsky, postToBsky } from './services/bskyService.js'
import { resolveImageEmbed } from './services/imageService.js'
import { addPosted, isAlreadyPosted, loadPosted } from './storage/postedStorage.js'
import { loadPosts } from './storage/postStorage.js'
import { formatPostData, sanitizeText } from './utils/format.js'

const argv = yargs(hideBin(process.argv))
  .option('dry-run', {
    alias: 'd',
    type: 'boolean',
    description: 'Don’t post to Bluesky, just preview the output',
  })
  .parse()

const isDryRun = argv['dry-run'] === true

dotenv.config()

async function runBlueBot() {
  try {
    const username = process.env.BLUESKY_USERNAME
    const password = process.env.BLUESKY_PASSWORD

    if (!username || !password) {
      throw new Error('Bluesky credentials are missing in environment variables.')
    }

    const agent = new AtpAgent({ service: 'https://bsky.social' })
    await loginToBsky(agent, username, password)

    const posts = await loadPosts()
    const posted = await loadPosted()

    const availablePosts = posts.filter(post => !isAlreadyPosted(posted, post.link))

    if (availablePosts.length === 0) {
      console.log('ℹ️ No new posts to publish.')
      return
    }

    const randomPost = availablePosts[Math.floor(Math.random() * availablePosts.length)]

    const { embed, debugInfo } = await resolveImageEmbed(agent, randomPost.image, randomPost.link, randomPost.title)

    const { title, description } = formatPostData(
      randomPost.title,
      randomPost.description,
      randomPost.link,
    )

    const fullText = sanitizeText([title, description].filter(Boolean).join('\n\n'))

    if (isDryRun) {
      console.log('📝 Text to post:\n', fullText)
    }
    else {
      console.log('🚀 Posting to Bluesky...')
      await postToBsky(agent, fullText, embed)
      console.log('✅ Post successfully created!')
      await addPosted(randomPost.link)
    }
  }
  catch (error) {
    console.error('❌ Error running Blue Bot:', error)
  }
}

runBlueBot()
