/**
 * Formats a post by cleaning title, description, and link,
 * and trimming description to fit the length limit.
 */
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

  // Calculate how much space is left for the description
  const baseLength = cleanTitle.length + cleanLink.length + 4 // two \n\n separators
  const available = maxLength - baseLength

  // Trim description if it doesn't fit
  if (cleanDescription.length > available) {
    cleanDescription = `${cleanDescription.slice(0, available - 1)}…`
  }

  return {
    title: cleanTitle,
    description: cleanDescription,
    link: cleanLink,
  }
}

/**
 * Sanitizes text by removing control characters
 * and normalizing ellipsis to three dots.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\u2026/g, '...') // replace Unicode ellipsis
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0009\u000B-\u001F]/g, '') // remove invisible control characters
    .trim()
}

/**
 * Removes common tracking parameters from a URL.
 */
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
