import fs from 'node:fs/promises'
import path from 'node:path'
// testLocalPost.ts
import { AtpAgent } from '@atproto/api'
import * as dotenv from 'dotenv'
import sharp from 'sharp'

dotenv.config()

async function runLocalPostTest() {
  const username = process.env.BLUESKY_USERNAME
  const password = process.env.BLUESKY_PASSWORD

  if (!username || !password) {
    console.error('❌ Missing credentials')
    return
  }

  const imagePath = process.argv[2]
  const text = process.argv[3] || '🧪 Test post with local image'

  if (!imagePath) {
    console.error('❌ Please provide a local image path')
    return
  }

  const fullPath = path.resolve(imagePath)
  const rawBuffer = await fs.readFile(fullPath)

  const jpegBuffer = await sharp(rawBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .removeAlpha()
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()

  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier: username, password })

  const uploaded = await agent.com.atproto.repo.uploadBlob(jpegBuffer)
  const blob = uploaded.data.blob

  if (!blob?.ref?.toString?.()) {
    console.error('❌ Invalid blob reference')
    return
  }

  const embed = {
    $type: 'app.bsky.embed.images',
    images: [
      {
        alt: 'Опис зображення',
        image: {
          $type: 'blob',
          ref: { $link: blob.ref.toString() },
          mimeType: blob.mimeType,
          size: blob.size,
        },
      },
    ],
  }

  await agent.app.bsky.feed.post.create(
    { repo: agent.session!.did },
    {
      $type: 'app.bsky.feed.post',
      text,
      embed,
      createdAt: new Date().toISOString(),
    },
  )

  console.log('✅ Post successfully published with local image!')
}

runLocalPostTest()
