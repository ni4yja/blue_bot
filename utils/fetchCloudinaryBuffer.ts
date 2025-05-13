import fetch from 'node-fetch'

export async function fetchCloudinaryBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`Failed to fetch Cloudinary image: ${res.statusText}`)
  return Buffer.from(await res.arrayBuffer())
}
