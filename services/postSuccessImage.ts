import type { AtpAgent } from '@atproto/api'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { postToBsky } from '../services/bskyService.js'

/**
 * Posts a final success image after all candidate posts are done.
 */
export async function postSuccessImage(agent: AtpAgent): Promise<void> {
  try {
    const localImagePath = path.resolve('assets/success.png')
    const buffer = await fs.readFile(localImagePath)

    const jpeg = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .removeAlpha()
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 85 })
      .toBuffer()

    const uploaded = await agent.com.atproto.repo.uploadBlob(jpeg)
    const blob = uploaded.data.blob

    const embed = {
      $type: 'app.bsky.embed.images',
      images: [
        {
          image: {
            $type: 'blob',
            ref: { $link: blob.ref.toString() },
            mimeType: blob.mimeType,
            size: blob.size,
          },
          alt: 'Success image',
        },
      ],
    }

    const message = `🌊 That’s all for now.
This bot has done its best to publish images from the Blue collection on Europeana.
If you liked it or have ideas for improvement — contact @ni4yja.bsky.social. She’s listening.`

    await postToBsky(agent, message, embed)
  }
  catch (err) {
    console.error('⚠️ Failed to post success image:', err)
  }
}
