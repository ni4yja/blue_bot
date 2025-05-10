import type { AtpAgent } from '@atproto/api'
import fs from 'node:fs/promises'
import path from 'node:path'
import fetch from 'node-fetch'
import sharp from 'sharp'
import { uploadToCloudinary } from './cloudinaryService.js'

export async function uploadImage(
  agent: AtpAgent,
  source: string | Buffer,
): Promise<{
  $type: 'blob'
  ref: { $link: string }
  mimeType: string
  size: number
} | undefined> {
  try {
    let rawBuffer: Buffer

    if (Buffer.isBuffer(source)) {
      rawBuffer = source
      console.log('📦 Using raw buffer as image input')
    }
    else if (typeof source === 'string' && source.startsWith('http')) {
      console.log('📥 Fetching image from:', source)
      const res = await fetch(source)
      console.log('📡 Fetch response status:', res.status, res.statusText)
      if (!res.ok)
        throw new Error(`Failed to fetch image: ${res.statusText}`)
      rawBuffer = Buffer.from(await res.arrayBuffer())
    }
    else if (typeof source === 'string') {
      const filePath = path.resolve(source)
      console.log('📂 Reading local file:', filePath)
      rawBuffer = await fs.readFile(filePath)
    }
    else {
      throw new TypeError('Unsupported source type')
    }

    const jpegBuffer = await sharp(rawBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .removeAlpha()
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 70 })
      .toBuffer()

    if (jpegBuffer.length > 1000000) {
      console.error('❌ Зображення перевищує допустимий розмір 1 MB')
      return
    }

    const cloudinaryUrl = await uploadToCloudinary(jpegBuffer, 'resized.jpg')
    if (!cloudinaryUrl) {
      console.warn('⚠️ Failed to upload to Cloudinary')
      return undefined
    }

    const res = await fetch(cloudinaryUrl)
    if (!res.ok)
      throw new Error(`Failed to fetch Cloudinary image: ${res.statusText}`)

    const cloudinaryBuffer = Buffer.from(await res.arrayBuffer())
    const uploaded = await agent.com.atproto.repo.uploadBlob(cloudinaryBuffer)
    const blob = uploaded.data.blob

    const cid = blob?.ref?.toString?.()
    if (!cid) {
      console.warn('⚠️ Blob is missing ref — cannot be embedded')
      return undefined
    }

    const finalBlob = {
      $type: 'blob' as const,
      ref: { $link: cid },
      mimeType: blob.mimeType,
      size: blob.size,
    }

    console.log('📤 Final Bluesky upload result:', finalBlob)
    return finalBlob
  }
  catch (error) {
    console.error('❌ Error uploading image:', error)
    return undefined
  }
}
