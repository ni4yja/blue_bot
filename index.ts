import { AtpAgent } from '@atproto/api'
import * as dotenv from 'dotenv'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { loginToBsky, postToBsky } from './services/bskyService.js'
import { resolveImageEmbed } from './services/imageService.js'
import { addPosted, isAlreadyPosted, loadPosted } from './storage/postedStorage.js'
import { loadPosts } from './storage/postStorage.js'
import { formatPostData, sanitizeText } from './utils/format.js'
import { logPostPayload } from './utils/logPostPayload.js'

dotenv.config()

const argv = yargs(hideBin(process.argv))
  .option('dry-run', {
    alias: 'd',
    type: 'boolean',
    description: 'Don’t post to Bluesky, just preview the output',
  })
  .parse()

const isDryRun = argv['dry-run'] === true

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

    function isValidImageUrl(url?: string): boolean {
      if (!url)
        return false
      try {
        const u = new URL(url)
        if (u.pathname.includes('assetimage2.jsp'))
          return false
        return u.protocol === 'http:' || u.protocol === 'https:'
      }
      catch {
        return false
      }
    }

    const availablePosts = posts.filter(post =>
      !isAlreadyPosted(posted, post.link)
      && isValidImageUrl(post.image),
    )

    if (availablePosts.length === 0) {
      console.log('ℹ️ No new posts to publish.')
      return
    }

    const randomPost = availablePosts[Math.floor(Math.random() * availablePosts.length)]

    const { embed, debugInfo } = await resolveImageEmbed(
      agent,
      randomPost.image,
      randomPost.link,
      randomPost.title,
      true,
    )

    const { title, description } = formatPostData(
      randomPost.title,
      randomPost.description,
      randomPost.link,
    )

    const fullText = sanitizeText([title, description].filter(Boolean).join('\n\n'))

    if (isDryRun) {
      logPostPayload(fullText, embed, debugInfo)
    }
    else {
      try {
        if (!embed?.images?.[0]?.image?.ref?.$link) {
          console.warn('⚠️ Embed blob is missing or malformed — skipping post.')
          return
        }
        await postToBsky(agent, fullText, embed)
        console.log('✅ Post successfully created!')
        await addPosted(randomPost.link)
        console.log('💾 Link saved to posted.json:', randomPost.link)
      }
      catch (error) {
        console.error('❌ Failed to publish post:', error)
      }
    }
  }
  catch (error) {
    console.error('❌ Error running Blue Bot:', error)
  }
}

runBlueBot()
