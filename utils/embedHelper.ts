import type { AtpAgent } from '@atproto/api'
import type { EmbedResult } from '../types/image.js'
import { resolveImageEmbed } from '../services/imageService.js'
import { addSkipped } from '../storage/skippedStorage.js'

/**
 * Attempts to prepare a valid image embed from a given candidate object.
 * - Uses image URL or fallback link
 * - Skips and logs candidate if embed is missing or invalid
 *
 * @param agent - Authenticated ATP agent
 * @param candidate - Object containing image, link, and optional title
 * @returns { embed, debugInfo } or null if embed is not usable
 */
export async function prepareImageEmbed(
  agent: AtpAgent,
  candidate: { image?: string, link: string, title?: string },
): Promise<{ embed: EmbedResult['embed'], debugInfo: EmbedResult['debugInfo'] } | null> {
  try {
    const { embed, debugInfo } = await resolveImageEmbed(
      agent,
      candidate.image,
      candidate.link,
      candidate.title,
      true, // prefer thumbnail
    )

    if (!embed?.images?.[0]?.image?.ref?.$link) {
      await addSkipped(candidate.link)
      return null
    }

    return { embed, debugInfo }
  }
  catch {
    await addSkipped(candidate.link)
    return null
  }
}
