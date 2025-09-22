import fetch from 'node-fetch'

export interface Link {
  guid: string
  url: string
}

export interface Collection {
  name: string
  baseUrl: string
  description: string
  links?: Link[]
}

export const collections: Collection[] = [
  {
    name: 'Blue',
    baseUrl: 'https://api.europeana.eu/set/9109',
    description: 'Gallery exploring the colour blue',
  },
  {
    name: 'Migration in artworks',
    baseUrl: 'https://api.europeana.eu/set/9104',
    description: 'Depictions of migration and refugee experiences',
  },
  {
    name: 'Women at work',
    baseUrl: 'https://api.europeana.eu/set/9087',
    description: 'Photographs and paintings of women at work',
  },
]

export async function initializeCollections(
  apiKey: string,
  collectionsToFetch: Collection[] = collections,
  pageSize = 50,
): Promise<Collection[]> {
  if (!apiKey) {
    throw new Error('Missing Europeana API key (EUROPEANA_API_KEY)')
  }

  for (const col of collectionsToFetch) {
    const params = new URLSearchParams({
      page: '1',
      pageSize: pageSize.toString(),
      profile: 'itemDescriptions',
      wskey: apiKey,
    })
    const url = `${col.baseUrl}?${params.toString()}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${col.name}: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as { items?: { guid?: string }[] }
      const rawLinks: string[] = (data.items?.map(item => item.guid).filter((guid): guid is string => typeof guid === 'string')) ?? []

      col.links = rawLinks.map(guid => ({
        guid,
        url: guid.replace('http://data.europeana.eu/', 'https://www.europeana.eu/'),
      }))
    }
    catch {
      col.links = []
    }
  }

  return collectionsToFetch
}
