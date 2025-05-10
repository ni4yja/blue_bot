import * as cheerio from 'cheerio'
import fetch from 'node-fetch'

export async function getOgImageFromPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
          + '(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!res.ok) {
      console.warn(`⚠️ Failed to fetch page for og:image: ${res.status} ${res.statusText}`)
      return null
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    let ogImage = ''
    let source = ''

    const trySources = [
      ['meta[property="og:image"]', 'content'],
      ['meta[property="og:image:secure_url"]', 'content'],
      ['meta[property="og:image:url"]', 'content'],
      ['meta[name="og:image"]', 'content'],
      ['meta[name="twitter:image"]', 'content'],
      ['meta[name="twitter:image:src"]', 'content'],
      ['meta[name="thumbnail"]', 'content'],
      ['link[rel="image_src"]', 'href'],
    ]

    for (const [selector, attr] of trySources) {
      const value = $(selector).attr(attr)?.trim()
      if (value) {
        ogImage = value
        source = selector
        break
      }
    }

    if (ogImage) {
      console.log('🖼️ Found image via', source, ':', ogImage)
    }
    else {
      console.warn('⚠️ No og:image found on page.')
    }

    return ogImage || null
  }
  catch (err) {
    console.warn('⚠️ Error extracting og:image:', err)
    return null
  }
}
