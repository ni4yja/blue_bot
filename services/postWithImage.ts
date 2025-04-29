import type { AppBskyFeedPost, BlobRef } from '@atproto/api'
import { Agent, RichText } from '@atproto/api'
import fetch from 'node-fetch'

interface PostWithImageOptions {
  serviceUrl: string
  username: string
  password: string
  text: string
  imageUrl?: string
}

export async function postWithImage({
  serviceUrl,
  username,
  password,
  text,
  imageUrl,
}: PostWithImageOptions): Promise<void> {
  const agent = new Agent({ service: serviceUrl })

  console.log('🔑 Logging in to Bluesky...')
  const session = await agent.com.atproto.server.createSession({
    identifier: username,
    password,
  })
  const did = session.data.did
  console.log('✅ Logged in as', session.data.handle)

  let imageEmbed: BlobRef | undefined

  if (imageUrl) {
    console.log('🖼️ Fetching image from URL...')
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch image: ${imgRes.statusText}`)
    }
    const buffer = await imgRes.arrayBuffer()

    console.log('📤 Uploading image to Bluesky...')
    const uploadRes = await agent.com.atproto.repo.uploadBlob(new Uint8Array(buffer), {
      encoding: 'image/jpeg',
    })
    imageEmbed = uploadRes.data.blob
    console.log('✅ Image uploaded.')
  }

  const richText = new RichText({ text })
  await richText.detectFacets(agent)

  const record: AppBskyFeedPost.Record = {
    $type: 'app.bsky.feed.post',
    text: richText.text,
    facets: richText.facets,
    createdAt: new Date().toISOString(),
    embed: imageEmbed
      ? {
          $type: 'app.bsky.embed.images',
          images: [
            {
              image: imageEmbed,
              alt: 'Image',
            },
          ],
        }
      : undefined,
  }

  console.log('🚀 Posting to feed...')
  await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: 'app.bsky.feed.post',
    record,
  })

  console.log('🎉 Successfully posted!')
}
