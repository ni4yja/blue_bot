import { AtpAgent } from '@atproto/api'
import * as dotenv from 'dotenv'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { loginToBsky, postToBsky, replyToBsky } from './services/bskyService.js'
import { addPosted, isAlreadyPosted, loadPosted } from './storage/postedStorage.js'
import { loadPosts } from './storage/postStorage.js'
import { addSkipped, isAlreadySkipped, loadSkipped } from './storage/skippedStorage.js'
import { prepareImageEmbed } from './utils/embedHelper.js'
import { formatPostData, sanitizeText } from './utils/format.js'
import { logPostPayload } from './utils/logPostPayload.js'
import { shortenUrl } from './utils/shortenUrl.js'

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
    const skipped = await loadSkipped()

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

    const candidates = posts.filter(p =>
      !isAlreadyPosted(posted, p.link)
      && !isAlreadySkipped(skipped, p.link)
      && isValidImageUrl(p.image),
    )

    if (candidates.length === 0) {
      console.log('ℹ️ No new posts to publish.')
      return
    }

    function shuffle<T>(arr: T[]): T[] {
      return [...arr].sort(() => Math.random() - 0.5)
    }

    const maxAttempts = candidates.length
    let attempt = 0

    for (const candidate of shuffle(candidates)) {
      attempt++
      console.log(`🔍 Attempt ${attempt}/${maxAttempts}: ${candidate.link}`)

      const result = await prepareImageEmbed(agent, candidate)
      if (!result)
        continue

      const { embed, debugInfo } = result

      const { title, description, link } = formatPostData(
        candidate.title,
        candidate.description,
        candidate.link,
      )

      const fullText = sanitizeText(
        [title, description].filter(Boolean).join('\n\n'),
      )

      const shortLink = await shortenUrl(link)

      if (isDryRun) {
        logPostPayload(fullText, embed, debugInfo)
      }
      else {
        try {
          const uri = await postToBsky(agent, fullText, embed)
          await addPosted(candidate.link)
          if (uri && shortLink) {
            await replyToBsky(agent, `🌊 More info on Europeana:\n${shortLink}`, uri)
          }
        }
        catch (error) {
          console.error('❌ Failed to publish post:', error)
          await addSkipped(candidate.link)
          continue
        }
      }

      return // Успішно запостили — вихід
    }

    console.warn('🚫 No valid posts found in this run. Nothing was published.')
  }
  catch (error) {
    console.error('❌ Error running Blue Bot:', error)
  }
}

runBlueBot()
