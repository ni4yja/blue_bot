import type { AtpAgent } from '@atproto/api'
import type { EmbedResult } from '../types/image.js'
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
): Promise<EmbedResult> {
  const debugInfo: EmbedResult['debugInfo'] = {
    tried: {},
    skipped: {},
    result: undefined,
  }

  let uploadedBlob
  let source = ''

  // 1️⃣ Europeana Thumbnail API v2
  if (preferThumbnail && imageUrl) {
    try {
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
    catch (err) {
      debugInfo.skipped.thumbnailV2 = `Invalid thumbnail URL`
    }
  }

  // 2️⃣ Основне зображення
  if (!uploadedBlob && imageUrl) {
    debugInfo.tried.primary = imageUrl
    const result = await uploadImage(agent, imageUrl)
    if (result) {
      uploadedBlob = result
      source = 'primary'
    }
    else {
      debugInfo.skipped.primary = 'uploadImage failed or returned undefined'
    }
  }

  // 3️⃣ fallbackLink як пряме зображення
  if (!uploadedBlob && fallbackLink) {
    debugInfo.tried.fallback = fallbackLink
    const result = await uploadImage(agent, fallbackLink)
    if (result) {
      uploadedBlob = result
      source = 'fallback'
    }
    else {
      debugInfo.skipped.fallback = 'uploadImage failed or returned undefined'
    }
  }

  // 4️⃣ fallback через Europeana API
  if (!uploadedBlob && fallbackLink) {
    const apiImage = await getImageFromEuropeanaApi(fallbackLink)
    if (apiImage) {
      debugInfo.tried.api = apiImage
      const result = await uploadImage(agent, apiImage)
      if (result) {
        uploadedBlob = result
        source = 'api'
      }
      else {
        debugInfo.skipped.api = 'uploadImage failed for API result'
      }
    }
    else {
      debugInfo.skipped.api = 'Europeana API did not return image'
    }
  }

  // 🧩 Повернення
  if (uploadedBlob?.ref?.$link) {
    debugInfo.result = {
      url: debugInfo.tried[source],
      alt,
      mimeType: uploadedBlob.mimeType,
      size: uploadedBlob.size,
      source,
    }

    return {
      embed: {
        $type: 'app.bsky.embed.images', // ✅ правильний тип
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

  console.warn('⚠️ Failed to resolve any image embed.')
  return { embed: undefined, debugInfo }
}
