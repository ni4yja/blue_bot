/* eslint-disable no-console */
import { AtpAgent } from '@atproto/api'
import * as dotenv from 'dotenv'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { loginToBsky, postToBsky, replyToBsky } from './services/bskyService.js'
import { postSuccessImage } from './services/postSuccessImage.js'
import { addPosted, isAlreadyPosted, loadPosted } from './storage/postedStorage.js'
import { loadPosts } from './storage/postStorage.js'
import { isAlreadySkipped, loadSkipped } from './storage/skippedStorage.js'
import { prepareImageEmbed } from './utils/embedHelper.js'
import { formatPostData, sanitizeText } from './utils/format.js'
import { logPostPayload } from './utils/logPostPayload.js'

dotenv.config()

const argvPromise = yargs(hideBin(process.argv))
  .option('dry-run', {
    alias: 'd',
    type: 'boolean',
    description: 'Preview only, do not post to Bluesky',
  })
  .option('list', {
    alias: 'l',
    type: 'boolean',
    description: 'List all posts with available images and exit',
  })
  .strict()
  .help()
  .argv

// eslint-disable-next-line antfu/no-top-level-await
const argv = await argvPromise

const isDryRun = argv['dry-run'] === true || process.env.DRY_RUN === 'true'
const isListOnly = argv.list === true
const disableCache = process.env.DISABLE_CACHE === 'true'

console.log('🧪 isDryRun:', isDryRun)
console.log('📦 disableCache:', disableCache)

async function runBlueBot() {
  try {
    const username = process.env.BLUESKY_USERNAME
    const password = process.env.BLUESKY_PASSWORD

    if (!username || !password) {
      throw new Error('❌ Missing Bluesky credentials in environment variables.')
    }

    const agent = new AtpAgent({ service: 'https://bsky.social' })
    await loginToBsky(agent, username, password)

    const posts = await loadPosts()
    const posted = disableCache ? [] : await loadPosted()
    const skipped = disableCache ? [] : await loadSkipped()

    const candidates = posts.filter(
      p =>
        !isAlreadyPosted(posted, p.link)
        && !isAlreadySkipped(skipped, p.link)
        && !!p.image
        && (p.image.startsWith('http://') || p.image.startsWith('https://')),
    )

    if (isListOnly) {
      console.log(`📄 Found ${candidates.length} posts with available images:\n`)
      candidates.forEach((post, i) => {
        console.log(`${i + 1}. ${post.link}`)
      })
      return
    }

    if (candidates.length === 0) {
      console.log('ℹ️ No new posts to process.')
      return
    }

    let postPublished = false

    for (const candidate of candidates) {
      console.log(`🔍 Processing: ${candidate.link}`)

      const res = await prepareImageEmbed(agent, candidate)
      if (!res)
        continue

      const { embed, debugInfo } = res
      const { title, description } = formatPostData(
        candidate.title,
        candidate.description,
        candidate.link,
      )
      const fullText = sanitizeText([title, description].filter(Boolean).join('\n\n'))

      if (isDryRun) {
        logPostPayload(fullText, embed, debugInfo)
        continue
      }

      try {
        const postUri = await postToBsky(agent, fullText, embed)
        if (postUri) {
          postPublished = true
          if (!disableCache) {
            await addPosted(candidate.link)
          }
          await replyToBsky(agent, candidate.link, postUri)
        }
      }
      catch (err) {
        console.error('❌ Failed to post, marking as posted anyway:', err)
        postPublished = true
        if (!disableCache) {
          await addPosted(candidate.link)
        }
      }

      break
    }

    if (!isDryRun && postPublished) {
      const latestPosted = disableCache ? [] : await loadPosted()
      const latestSkipped = disableCache ? [] : await loadSkipped()
      const remaining = posts.filter(
        p =>
          !isAlreadyPosted(latestPosted, p.link)
          && !isAlreadySkipped(latestSkipped, p.link)
          && !!p.image
          && (p.image.startsWith('http://') || p.image.startsWith('https://')),
      )

      if (remaining.length === 0) {
        await postSuccessImage(agent)
        console.log('🎉 All posts done. Posted success message.')
      }
    }
  }
  catch (error) {
    console.error('❌ Error running Blue Bot:', error)
  }
}

runBlueBot()
