import type { AtpAgent } from '@atproto/api'
import { getEuropeanaThumbnailFromV2 } from '../sources/getEuropeanaThumbnailUrl.js'
import { getImageFromEuropeanaApi } from '../sources/getImageFromEuropeanaApi.js'
import { uploadImage } from './blobService.js'

const supportedThumbnailDomains = [
  'europeana.eu',
  'rijksmuseum.nl',
  'cc.museon.nl',
  'apsida.cut.ac.cy',
]

export async function resolveImageEmbed(
  agent: AtpAgent,
  imageUrl?: string,
  fallbackLink?: string,
  alt?: string,
  preferThumbnail = false,
): Promise<{ embed?: any, debugInfo: Record<string, any> }> {
  const debugInfo: Record<string, any> = { tried: {}, result: null, skipped: {} }
  let uploadedBlob
  let source = ''

  // 1️⃣ Europeana Thumbnail API v2
  if (preferThumbnail && imageUrl) {
    const hostname = new URL(imageUrl).hostname
    if (supportedThumbnailDomains.some(domain => hostname.includes(domain))) {
      const thumbUrl = await getEuropeanaThumbnailFromV2(imageUrl)
      if (thumbUrl) {
        debugInfo.tried.thumbnailV2 = thumbUrl
        uploadedBlob = await uploadImage(agent, thumbUrl)
        if (uploadedBlob)
          source = 'thumbnailV2'
      }
    }
    else {
      debugInfo.skipped.thumbnailV2 = `Unsupported domain: ${hostname}`
    }
  }

  // 2️⃣ Основне зображення
  if (!uploadedBlob && imageUrl) {
    debugInfo.tried.primary = imageUrl
    uploadedBlob = await uploadImage(agent, imageUrl)
    if (uploadedBlob)
      source = 'primary'
  }

  // 3️⃣ fallbackLink як пряме зображення
  if (!uploadedBlob && fallbackLink) {
    debugInfo.tried.fallback = fallbackLink
    uploadedBlob = await uploadImage(agent, fallbackLink)
    if (uploadedBlob)
      source = 'fallback'
  }

  // 4️⃣ fallback через Europeana API (наприклад, edmIsShownBy)
  if (!uploadedBlob && fallbackLink) {
    const apiImage = await getImageFromEuropeanaApi(fallbackLink)
    if (apiImage) {
      debugInfo.tried.api = apiImage
      uploadedBlob = await uploadImage(agent, apiImage)
      if (uploadedBlob)
        source = 'api'
    }
  }

  // 🧩 Повернення
  if (uploadedBlob) {
    debugInfo.result = {
      url: debugInfo.tried[source],
      alt,
      mimeType: uploadedBlob.mimeType,
      size: uploadedBlob.size,
      source,
    }

    return {
      embed: {
        $type: 'app.bsky.embed.images#main',
        images: [
          {
            image: uploadedBlob,
            alt: alt || 'Image',
          },
        ],
      },
      debugInfo,
    }
  }

  return { embed: undefined, debugInfo }
}
