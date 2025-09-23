import type { AtpAgent } from '@atproto/api'
import { sanitizeText } from '../utils/format.js'
import { shortenUrl } from '../utils/shortenUrl.js'

export async function loginToBsky(agent: AtpAgent, username: string, password: string) {
  try {
    await agent.login({
      identifier: username,
      password,
    })
  }
  catch (error) {
    console.error('❌ Failed to log in:', error)
    throw error
  }
}

export async function postToBsky(
  agent: AtpAgent,
  text: string,
  embed?: any,
): Promise<string | undefined> {
  if (!agent.session?.did) {
    throw new Error('Agent is not authenticated')
  }

  try {
    const sanitizedText = sanitizeText(text)

    const res = await agent.app.bsky.feed.post.create(
      { repo: agent.session.did },
      {
        $type: 'app.bsky.feed.post',
        text: sanitizedText,
        embed,
        createdAt: new Date().toISOString(),
      },
    )

    return res.uri
  }
  catch (error) {
    console.error('❌ Error posting to Bluesky:', error)
    throw error
  }
}

export async function replyToBsky(
  agent: AtpAgent,
  originalLink: string,
  parentUri: string,
): Promise<string | undefined> {
  if (!agent.session?.did) {
    throw new Error('Agent is not authenticated')
  }

  try {
    const shortLink = await shortenUrl(originalLink)
    const baseText = '🌊 More info on Europeana:\u00A0'
    const fullText = `${baseText}${shortLink}`
    const replyText = sanitizeText(fullText)

    // Calculate byte positions for the link in the sanitized text
    const encoder = new TextEncoder()
    const sanitizedBaseText = sanitizeText(baseText)
    const byteStart = encoder.encode(sanitizedBaseText).length
    const byteEnd = encoder.encode(replyText).length

    const thread = await agent.app.bsky.feed.getPostThread({ uri: parentUri })
    const rootPost = (thread.data.thread as any).post

    if (!rootPost || !rootPost.cid) {
      console.warn('⚠️ Unable to resolve parent post CID from thread')
      return
    }

    const rootCid = rootPost.cid

    const res = await agent.app.bsky.feed.post.create(
      { repo: agent.session.did },
      {
        $type: 'app.bsky.feed.post',
        text: replyText,
        createdAt: new Date().toISOString(),
        facets: [
          {
            index: {
              byteStart,
              byteEnd,
            },
            features: [
              {
                $type: 'app.bsky.richtext.facet#link',
                uri: originalLink,
              },
            ],
          },
        ],
        reply: {
          root: { cid: rootCid, uri: parentUri },
          parent: { cid: rootCid, uri: parentUri },
        },
      },
    )

    return res.uri
  }
  catch (error) {
    console.error('❌ Error posting reply to Bluesky:', error)
    throw error
  }
}
