import type { AtpAgent } from '@atproto/api'
import { sanitizeText } from '../utils/format.js'

export async function loginToBsky(agent: AtpAgent, username: string, password: string) {
  try {
    const res = await agent.login({
      identifier: username,
      password,
    })

    console.log('✅ Logged in as', res.data.handle)
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
    await agent.app.bsky.feed.post.create(
      { repo: agent.session.did },
      {
        $type: 'app.bsky.feed.post',
        text,
        embed,
        createdAt: new Date().toISOString(),
      },
      {
        $type: 'app.bsky.feed.post',
        text: sanitizeText(text),
        embed,
        createdAt: new Date().toISOString(),
      },
    )

    console.log('✅ Successfully posted to Bluesky')
  }
  catch (error) {
    console.error('❌ Error posting to Bluesky:', error)
    throw error
  }
}
