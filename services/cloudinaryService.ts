import fs from 'node:fs'
import path from 'node:path'
import FormData from 'form-data'
import fetch from 'node-fetch'

interface CloudinaryUploadResponse {
  secure_url: string
  [key: string]: unknown
}

export async function uploadToCloudinary(file: Buffer, filename: string): Promise<string | undefined> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    console.error('❌ Missing Cloudinary credentials')
    return
  }

  const form = new FormData()
  form.append('file', file, filename)
  form.append('upload_preset', uploadPreset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form as any, // TS hack
  })

  if (!res.ok) {
    console.error('❌ Cloudinary upload failed:', res.statusText)
    return
  }

  const json = await res.json() as CloudinaryUploadResponse
  console.log('✅ Uploaded to Cloudinary:', json.secure_url)
  return json.secure_url
}
