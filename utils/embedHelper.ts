import type { AtpAgent } from '@atproto/api'
import type { EmbedResult } from '../types/image.js'
import { resolveImageEmbed } from '../services/imageService.js'
import { addSkipped } from '../storage/skippedStorage.js'

export async function prepareImageEmbed(
  agent: AtpAgent,
  candidate: { image?: string, link: string, title?: string },
): Promise<{ embed: EmbedResult['embed'], debugInfo: EmbedResult['debugInfo'] } | null> {
  try {
    const res: EmbedResult = await resolveImageEmbed(
      agent,
      candidate.image,
      candidate.link,
      candidate.title,
      true,
    )

    const embed = res.embed
    const debugInfo = res.debugInfo

    if (!embed?.images?.[0]?.image?.ref?.$link) {
      console.warn('⚠️ Embed blob is missing or malformed — skipping post.')
      await addSkipped(candidate.link)
      return null
    }

    return { embed, debugInfo }
  }
  catch (err) {
    console.warn('⚠️ Failed to fetch image:', err)
    await addSkipped(candidate.link)
    return null
  }
}
