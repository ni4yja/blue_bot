import type { OgMetadata } from './getOgMetadata.js'
import fetch from 'node-fetch'
import { extractMultilangValue, resolveThumbnail } from '../utils/extract.js'
import { translateText } from '../utils/translate.js'

interface EuropeanaV3Proxy {
  id?: string
  title?: Record<string, string | string[]>
  description?: Array<{ '@value': string, '@language'?: string }>
  edmPreview?: string
  edmIsShownBy?: string
  edmObject?: string
  proxyIn?: {
    object?: { id?: string }
    isShownBy?: { id?: string }
  }
}

interface EuropeanaV3Response {
  thumbnail?: string
  proxies?: EuropeanaV3Proxy[]
}

export async function fetchFromEuropeanaV3Api(datasetId: string, recordId: string): Promise<OgMetadata> {
  const url = `${process.env.EUROPEANA_API_URL_V3}/record/v3/${datasetId}/${recordId}?profile=meta.full,media.full`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`❌ Europeana V3 API failed. Status: ${res.status}`)
      return {}
    }

    const data: EuropeanaV3Response = await res.json()
    const providerProxy = data.proxies?.find(p =>
      p.id?.includes('/proxy/provider/'),
    )

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
