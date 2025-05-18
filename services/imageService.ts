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

// Тип для завантаженого зображення
interface UploadedBlob {
  $type: 'blob'
  ref: { $link: string }
  mimeType: string
  size: number
}

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

  let uploadedBlob: UploadedBlob | undefined
  let source = ''

  // Допоміжна функція для спроби завантаження
  async function tryUpload(tag: string, url?: string): Promise<boolean> {
    if (!url)
      return false
    debugInfo.tried[tag] = url

    const result = await uploadImage(agent, url)
    if (result) {
      uploadedBlob = result as UploadedBlob
      source = tag
      return true
    }
    else {
      debugInfo.skipped![tag] = 'uploadImage failed or returned undefined'
      return false
    }
  }

  // 1️⃣ Спроба отримати превʼю через Europeana Thumbnail API v2
  if (preferThumbnail && imageUrl) {
    try {
      const hostname = new URL(imageUrl).hostname
      const isSupported = supportedThumbnailDomains.some(domain =>
        hostname.includes(domain),
      )

      if (!isSupported) {
        debugInfo.skipped!.thumbnailV2 = `Unsupported domain: ${hostname}`
      }
      else {
        const thumbUrl = await getEuropeanaThumbnailFromV2(imageUrl)
        if (thumbUrl)
          await tryUpload('thumbnailV2', thumbUrl)
      }
    }
    catch {
      debugInfo.skipped!.thumbnailV2 = 'Invalid thumbnail URL'
    }
  }

  // 2️⃣ Спроба завантажити основне зображення
  if (!uploadedBlob && imageUrl)
    await tryUpload('primary', imageUrl)

  // 3️⃣ Спроба fallback-завантаження з прямого посилання
  if (!uploadedBlob && fallbackLink)
    await tryUpload('fallback', fallbackLink)

  // 4️⃣ Спроба через Europeana API
  if (!uploadedBlob && fallbackLink) {
    const apiImage = await getImageFromEuropeanaApi(fallbackLink)
    if (apiImage) {
      await tryUpload('api', apiImage)
    }
    else {
      debugInfo.skipped!.api = 'Europeana API did not return image'
    }
  }

  // 🧩 Повернення результату, якщо успішно
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
        $type: 'app.bsky.embed.images',
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
