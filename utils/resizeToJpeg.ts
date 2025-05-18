import sharp from 'sharp'

/**
 * Converts an input image to JPEG format with the following processing:
 * - Resize to max width 1200px (no enlargement if smaller)
 * - Removes alpha channel (transparency)
 * - Flattens on white background
 * - Sets JPEG quality to 70
 *
 * @param input - Buffer of the original image
 * @returns JPEG-compressed image as Buffer
 */
export async function resizeToJpeg(input: Buffer): Promise<Buffer> {
  return await sharp(input)
    .resize({ width: 1200, withoutEnlargement: true })
    .removeAlpha()
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 70 })
    .toBuffer()
}
