import type { AtpAgent } from '@atproto/api'
import { sanitizeText } from '../utils/format.js'

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

export async function postToBsky(agent: AtpAgent, text: string, embed?: any) {
  if (!agent.session?.did) {
    throw new Error('Agent is not authenticated')
  }

  try {
    const sanitizedText = sanitizeText(text)

    await agent.app.bsky.feed.post.create(
      { repo: agent.session.did },
      {
        $type: 'app.bsky.feed.post',
        text: sanitizedText,
        embed,
        createdAt: new Date().toISOString(),
      },
    )
  }
  catch (error) {
    console.error('❌ Error posting to Bluesky:', error)
    throw error
  }
}
