export function formatPostData(
  title?: string,
  description?: string,
  link?: string,
) {
  const maxLength = 300
  const cleanTitle = title?.trim() || ''
  const cleanLink = link ? stripTrackingParams(link.trim()) : ''

  let cleanDescription = (description && description !== 'No description available.')
    ? description.trim()
    : ''

  // тимчасово обмежимо тільки description
  const baseLength = cleanTitle.length + cleanLink.length + 4 // 2 × \n\n
  const available = maxLength - baseLength

  if (cleanDescription.length > available) {
    cleanDescription = `${cleanDescription.slice(0, available - 1)}…`
  }

  return {
    title: cleanTitle,
    description: cleanDescription,
    link: cleanLink,
  }
}

export function sanitizeText(text: string): string {
  return text
    .replace(/\u2026/g, '...')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0009\u000B-\u001F]/g, '')
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
