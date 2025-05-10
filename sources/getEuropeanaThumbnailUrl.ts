import type { EuropeanaV2Response } from '../types/europeana.js'
import fetch from 'node-fetch'

/**
 * Отримує превʼю з Europeana Thumbnail API v2.
 * @param imageUrl Пряме посилання на оригінальне зображення (має бути публічним)
 * @returns Посилання на thumbnail або undefined, якщо не вдалось отримати
 */
export async function getEuropeanaThumbnailFromV2(imageUrl: string): Promise<string | undefined> {
  try {
    const encodedUrl = encodeURIComponent(imageUrl)
    const apiUrl = `https://api.europeana.eu/thumbnail/v2/url.json?url=${encodedUrl}&size=w400&type=IMAGE`

    console.log('🔍 Trying Europeana v2 thumbnail:', apiUrl)

    const res = await fetch(apiUrl)

    if (!res.ok) {
      console.warn('⚠️ Europeana v2 API error:', res.status, res.statusText)
      return undefined
    }

    const data = await res.json() as EuropeanaV2Response

    if (data.default === false && data.original) {
      console.log('🖼️ Europeana v2 thumbnail (original):', data.original)
      return data.original
    }
    else if (data.thumbnail) {
      console.log('🖼️ Europeana v2 thumbnail (fallback):', data.thumbnail)
      return data.thumbnail
    }
    else {
      console.warn('ℹ️ No valid image URL in Europeana v2 response')
      return undefined
    }
  }
  catch (error) {
    console.error('❌ Failed to fetch Europeana v2 thumbnail:', (error as Error).message)
    return undefined
  }
}
