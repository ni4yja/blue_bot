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
const isDryRun = argv['dry-run'] === true
const isListOnly = argv.list === true

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
    const posted = await loadPosted()
    const skipped = await loadSkipped()

    const candidates = posts.filter(
      p =>
        !isAlreadyPosted(posted, p.link)
        && !isAlreadySkipped(skipped, p.link)
        && !!p.image && (p.image.startsWith('http://') || p.image.startsWith('https://')),
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
          await addPosted(candidate.link)
          await replyToBsky(agent, candidate.link, postUri)
        }
      }
      catch {
        await addPosted(candidate.link)
        continue
      }

      break // Exit after first successful post
    }
    await postSuccessImage(agent)
    console.log('✅ Bot run complete.')
  }
  catch (error) {
    console.error('❌ Error running Blue Bot:', error)
  }
}

runBlueBot()
