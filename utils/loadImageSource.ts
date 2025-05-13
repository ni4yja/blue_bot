import fs from 'node:fs/promises'
import path from 'node:path'
import fetch from 'node-fetch'

export async function loadImageSource(source: string | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(source)) {
    console.log('📦 Using raw buffer as image input')
    return source
  }

  if (typeof source === 'string' && source.startsWith('http')) {
    console.log('📥 Fetching image from:', source)
    const res = await fetch(source)
    console.log('📡 Fetch response status:', res.status, res.statusText)
    if (!res.ok)
      throw new Error(`Failed to fetch image: ${res.statusText}`)
    return Buffer.from(await res.arrayBuffer())
  }

  if (typeof source === 'string') {
    const filePath = path.resolve(source)
    console.log('📂 Reading local file:', filePath)
    return await fs.readFile(filePath)
  }

  throw new TypeError('Unsupported source type')
}
