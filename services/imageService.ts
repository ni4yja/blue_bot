import type { AtpAgent } from '@atproto/api'
import { getOgImageFromPage } from '../sources/getOgImage.js'
import { uploadImage } from './blobService.js'

export async function resolveImageEmbed(
  agent: AtpAgent,
  imageUrl?: string,
  fallbackLink?: string,
  alt?: string,
): Promise<{ embed?: any, debugInfo: Record<string, any> }> {
  const debugInfo: Record<string, any> = { tried: {}, result: null }

  let uploadedBlob
  let source = 'primary'

  // 🖼️ Спроба завантажити основне зображення
  if (imageUrl) {
    debugInfo.tried.primary = imageUrl
    uploadedBlob = await uploadImage(agent, imageUrl)
  }

  // 🔁 Якщо зображення немає або воно було відхилене (за типом чи розміром) — fallback на og:image
  if (!uploadedBlob && fallbackLink) {
    const ogImage = await getOgImageFromPage(fallbackLink)
    if (ogImage) {
      source = 'og'
      debugInfo.tried.og = ogImage
      uploadedBlob = await uploadImage(agent, ogImage)
    }
  }

  if (uploadedBlob) {
    debugInfo.result = {
      url: debugInfo.tried[source],
      alt,
      mimeType: uploadedBlob.mimeType,
      size: uploadedBlob.size,
    }

    const embed = {
      $type: 'app.bsky.embed.images#main',
      images: [
        {
          image: uploadedBlob,
          alt: alt || 'Image',
        },
      ],
    }

    return { embed, debugInfo }
  }

  return { embed: undefined, debugInfo }
}
