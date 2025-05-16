import type { EuropeanaV3Proxy, EuropeanaV3Response } from '../types/europeana.js'
import type { OgMetadata } from './getOgMetadata.js'
import fetch from 'node-fetch'
import { extractMultilangValue, resolveThumbnail } from '../utils/extract.js'
import { translateText } from '../utils/translate.js'

/**
 * Fetches metadata (title, description, image) from Europeana v3 API.
 * Requires valid API key passed as an argument.
 */
export async function fetchFromEuropeanaV3Api(
  datasetId: string,
  recordId: string,
  apiKey: string,
): Promise<OgMetadata> {
  const url = `${process.env.EUROPEANA_API_URL_V3}/record/v3/${datasetId}/${recordId}?profile=meta.full,media.full&wskey=${apiKey}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`❌ Europeana V3 API failed. Status: ${res.status}`)
      return {}
    }

    const data: EuropeanaV3Response = await res.json()
    const providerProxy: EuropeanaV3Proxy | undefined
      = data.proxies?.find(p => p.id?.includes('/proxy/provider/'))

    const title = extractMultilangValue(providerProxy?.title, 'en')
    const rawDescription = extractMultilangValue(providerProxy?.description)
    const originalLang = providerProxy?.description?.[0]?.['@language'] || 'unknown'

    let description = extractMultilangValue(providerProxy?.description, 'en')
    if (!description || originalLang !== 'en') {
      description = rawDescription ? await translateText(rawDescription) : undefined
    }

    const rawImage
      = providerProxy?.edmIsShownBy
      || providerProxy?.edmObject
      || providerProxy?.edmPreview
      || providerProxy?.proxyIn?.object?.id
      || providerProxy?.proxyIn?.isShownBy?.id
      || data.thumbnail

    const image = await resolveThumbnail(rawImage)

    return { image, title, description }
  }
  catch (error) {
    console.error('❌ Error fetching Europeana v3 metadata:', error)
    return {}
  }
}
