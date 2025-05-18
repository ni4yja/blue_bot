import fetch from 'node-fetch'

export async function shortenUrl(longUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`)

    if (!res.ok) {
      console.warn('⚠️ Failed to shorten URL:', res.statusText)
      return null
    }

    const shortUrl = await res.text()
    return shortUrl
  }
  catch (err) {
    console.error('❌ Error shortening URL:', err)
    return null
  }
}
