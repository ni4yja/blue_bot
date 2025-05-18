import fs from 'node:fs/promises'
import path from 'node:path'
import fetch from 'node-fetch'

/**
 * Loads image data from various sources:
 * - Buffer (returns as is)
 * - HTTP(S) URL (fetches as Buffer)
 * - Local file path (reads as Buffer)
 *
 * @param source - string URL or path, or Buffer
 * @returns Buffer with image data
 */
export async function loadImageSource(source: string | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(source)) {
    return source
  }

  if (typeof source === 'string') {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const res = await fetch(source)
      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.statusText}`)
      }
      return Buffer.from(await res.arrayBuffer())
    }

    const filePath = path.resolve(source)
    return await fs.readFile(filePath)
  }

  throw new TypeError('Unsupported source type')
}
