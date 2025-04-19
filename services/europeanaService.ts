import fetch from 'node-fetch'

interface BlueCollection {
  items: { guid: string }[]
}

export async function initializeLinks(apiKey: string): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      page: '0',
      pageSize: '22',
      profile: 'itemDescriptions',
      wskey: apiKey,
    })

    const baseUrl = 'https://api.europeana.eu/set/9109'
    const url = `${baseUrl}?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`)
    }

    const data = (await response.json()) as BlueCollection

    if (data.items && data.items.length > 0) {
      return data.items
        .map(item => item.guid)
        .filter(Boolean)
        .map(link => link.replace('http://data.europeana.eu/', 'https://www.europeana.eu/'))
    }
    else {
      return []
    }
  }
  catch (error) {
    console.error('Error initializing links from Europeana:', error)
    return []
  }
}
