/* eslint-disable no-console */
import { AtpAgent } from '@atproto/api'
import * as dotenv from 'dotenv'

import cron from 'node-cron'
import { loginToBsky, postToBsky, replyToBsky } from './services/bskyService.js'
import { postSuccessImage } from './services/postSuccessImage.js'
import { addPosted, isAlreadyPosted, loadPosted } from './storage/postedStorage.js'
import { loadPosts } from './storage/postStorage.js'
import { isAlreadySkipped, loadSkipped } from './storage/skippedStorage.js'
import { prepareImageEmbed } from './utils/embedHelper.js'
import { formatPostData, sanitizeText } from './utils/format.js'

dotenv.config()

async function runBlueBot() {
  try {
    const username = process.env.BLUESKY_USERNAME
    const password = process.env.BLUESKY_PASSWORD

    if (!username || !password)
      throw new Error('❌ Missing Bluesky credentials in environment variables.')

    const agent = new AtpAgent({ service: 'https://bsky.social' })
    await loginToBsky(agent, username, password)

    const posts = await loadPosts()
    console.log(`📥 Loaded ${posts.length} posts from storage`)
    const posted = await loadPosted()
    const skipped = await loadSkipped()

    const candidates = posts.filter(
      p =>
        !isAlreadyPosted(posted, p.link)
        && !isAlreadySkipped(skipped, p.link)
        && !!p.image
        && (p.image.startsWith('http://') || p.image.startsWith('https://')),
    )

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

      const { embed } = res
      const { title, description } = formatPostData(
        candidate.title,
        candidate.description,
        candidate.link,
      )
      const fullText = sanitizeText([title, description].filter(Boolean).join('\n\n'))

      try {
        const postUri = await postToBsky(agent, fullText, embed)
        if (postUri) {
          postPublished = true
          await addPosted(candidate.link)
          await replyToBsky(agent, candidate.link, postUri)
        }
      }
      catch (err) {
        console.error('❌ Failed to post, marking as posted anyway:', err)
        postPublished = true
        await addPosted(candidate.link)
      }

      break // only one post per run
    }

    if (postPublished) {
      const latestPosted = await loadPosted()
      const latestSkipped = await loadSkipped()
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

// 🕛 Запускаємо щодня о 12:00 за Варшавою
cron.schedule('0 12 * * *', () => {
  console.log('⏰ Scheduled run at 12:00 Europe/Warsaw')
  runBlueBot()
}, {
  timezone: 'Europe/Warsaw',
})

// 🚀 Одноразовий запуск при старті контейнера
runBlueBot()
