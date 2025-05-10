import fetch from 'node-fetch'
import { isAlreadyPosted, loadPosted } from '../storage/postedStorage.js'
import { loadPosts } from '../storage/postStorage.js'

const TIMEOUT_MS = 8000

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname === 'localhost' || hostname === '127.0.0.1'
  }
  catch {
    return true
  }
}

async function checkImageUrl(url: string): Promise<{ status: string, contentType?: string, contentLength?: string }> {
  if (isLocalhostUrl(url)) {
    return { status: '❌ localhost' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(url, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) {
      return { status: `❌ ${res.status} ${res.statusText}` }
    }

    const contentType = res.headers.get('content-type') || 'unknown'
    const contentLength = res.headers.get('content-length') || 'unknown'

    if (!contentType.startsWith('image/')) {
      return { status: `⚠️ not an image`, contentType }
    }

    return { status: '✅ OK', contentType, contentLength }
  }
  catch (err: any) {
    return { status: `❌ ${err.name || 'Error'}` }
  }
}

async function run() {
  const posts = await loadPosts()
  const posted = await loadPosted()
  const unposted = posts.filter(post => !isAlreadyPosted(posted, post.link))
  for (const post of unposted) {
    const image = post.image
    if (!image) {
      console.log(`- ${post.link}\n  ⚠️ No image`)
      continue
    }

    const result = await checkImageUrl(image)

    console.log(`- ${post.link}`)
    console.log(`  🖼️ ${image}`)
    console.log(`  ${result.status}`)

    if (result.contentType || result.contentLength) {
      console.log(`  🧾 Type: ${result.contentType} | Size: ${result.contentLength} bytes`)
    }
  }
}

run()
