import fetch from 'node-fetch'

interface BlueCollection {
  items: { guid: string }[]
}

/**
 * Fetches a list of Europeana item links from a specific curated set.
 * Converts raw GUIDs into clean www.europeana.eu links.
 */
export async function initializeLinks(apiKey: string): Promise<string[]> {
  const params = new URLSearchParams({
    page: '1',
    pageSize: '22',
    profile: 'itemDescriptions',
    wskey: apiKey,
  })

  const baseUrl = 'https://api.europeana.eu/set/9109'
  const url = `${baseUrl}?${params.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok)
      throw new Error(`Failed to fetch: ${response.statusText}`)

    const data = (await response.json()) as BlueCollection
    const rawLinks = data.items?.map(item => item.guid).filter(Boolean) ?? []

    return rawLinks.map(link =>
      link.replace('http://data.europeana.eu/', 'https://www.europeana.eu/'),
    )
  }
  catch (error) {
    console.error('❌ Failed to initialize links from Europeana:', error)
    return []
  }
}
