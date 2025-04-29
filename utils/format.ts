export function formatPostData(
  title?: string,
  description?: string,
  link?: string,
) {
  const maxLength = 300
  const cleanTitle = title || ''
  const cleanDescription = (description && description !== 'No description available.') ? description : ''
  const cleanLink = link ? stripTrackingParams(link) : ''

  const parts = [cleanTitle, cleanDescription, cleanLink].filter(Boolean)
  let fullText = parts.join('\n\n')

  if (fullText.length > maxLength) {
    fullText = `${fullText.slice(0, maxLength - 1)}…`
  }

  // Розділяємо назад на title і description, якщо можливо
  const [finalTitle, ...rest] = fullText.split('\n\n')
  const finalDescription = rest.join('\n\n')

  return {
    title: finalTitle.trim(),
    description: finalDescription.trim(),
  }
}

export function sanitizeText(text: string): string {
  return text
    .replace(/\u2026/g, '...')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\xFF]/g, '')
    .trim()
}

function stripTrackingParams(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.delete('utm_source')
    u.searchParams.delete('utm_medium')
    u.searchParams.delete('utm_campaign')
    return u.toString()
  }
  catch {
    return url
  }
}
