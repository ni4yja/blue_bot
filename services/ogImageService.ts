import { load } from 'cheerio'
import fetch from 'node-fetch'

export async function getOgImage(link: string): Promise<string | null> {
  try {
    const response = await fetch(link)
    if (!response.ok) {
      throw new Error(`Error fetching page: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = load(html)

    const ogImage = $('meta[property="og:image"]').attr('content')
    return ogImage || null
  }
  catch (error) {
    console.error('Error fetching OG image:', error)
    return null
  }
}
