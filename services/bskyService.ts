import type { AtpAgent } from '@atproto/api'
import { sanitizeText } from '../utils/format.js'

export async function loginToBsky(agent: AtpAgent, username: string, password: string) {
  return agent.login({ identifier: username, password })
}

export async function postToBsky(
  agent: AtpAgent,
  text: string,
  embed?: any,
): Promise<string | undefined> {
  if (!agent.session?.did)
    throw new Error('Agent is not authenticated')

  const res = await agent.app.bsky.feed.post.create(
    { repo: agent.session.did },
    {
      $type: 'app.bsky.feed.post',
      text: sanitizeText(text),
      embed,
      createdAt: new Date().toISOString(),
    },
  )

  return res.uri
}

export async function replyToBsky(
  agent: AtpAgent,
  link: string,
  parentUri: string,
): Promise<string | undefined> {
  if (!agent.session?.did)
    throw new Error('Agent is not authenticated')

  const thread = await agent.app.bsky.feed.getPostThread({ uri: parentUri })
  const rootPost = (thread.data.thread as any).post

  if (!rootPost?.cid)
    return

  const res = await agent.app.bsky.feed.post.create(
    { repo: agent.session.did },
    {
      $type: 'app.bsky.feed.post',
      text: sanitizeText(link),
      createdAt: new Date().toISOString(),
      reply: {
        root: { cid: rootPost.cid, uri: parentUri },
        parent: { cid: rootPost.cid, uri: parentUri },
      },
    },
  )

  return res.uri
}
