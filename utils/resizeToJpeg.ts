import sharp from 'sharp'

export async function resizeToJpeg(input: Buffer): Promise<Buffer> {
  return await sharp(input)
    .resize({ width: 1200, withoutEnlargement: true })
    .removeAlpha()
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 70 })
    .toBuffer()
}
