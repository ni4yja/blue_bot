// Third-party package imports
import atprotoApi from '@atproto/api'
import { CronJob } from 'cron'
import * as dotenv from 'dotenv'

// Local service imports with explicit .js extensions (required for ESM)
import { uploadImage } from './services/blobService.js'
import { loginToBsky, postToBsky } from './services/bskyService.js'
import { initializeLinks } from './services/europeanaService.js'
import { getOgImage } from './services/ogImageService.js'

const { BskyAgent } = atprotoApi

dotenv.config()

const agent = new BskyAgent({
  service: 'https://bsky.social',
})

let links: string[] = []
let currentIndex = 0

async function runBlueBot() {
  try {
    links = await initializeLinks(process.env.EUROPEANA_API_KEY!)

    if (links.length === 0) {
      return
    }

    await loginToBsky(agent, process.env.BLUESKY_USERNAME!, process.env.BLUESKY_PASSWORD!)
    await postLink()
    // const job = new CronJob('* * * * *', async () => {
    //   await postLink()
    // })
    // job.start()
  }
  catch (error) {
    console.error('Error on running blue bot:', error)
  }
}

async function postLink() {
  try {
    if (currentIndex >= links.length) {
      return
    }

    const linkToPost = links[currentIndex]
    const ogImage = await getOgImage(linkToPost)

    let thumbBlobRef = null
    if (ogImage) {
      const uploadedBlob = await uploadImage(agent, ogImage)
      if (uploadedBlob) {
        thumbBlobRef = uploadedBlob
      }
    }

    const textToPost = `Welcome to the Blue Gallery on Europeana: ${linkToPost}`
    const byteStart = textToPost.indexOf(linkToPost)
    const byteEnd = byteStart + linkToPost.length

    const facets = [
      {
        index: {
          byteStart,
          byteEnd,
        },
        features: [
          {
            $type: 'app.bsky.richtext.facet#link',
            uri: linkToPost,
          },
        ],
      },
    ]

    await postToBsky(agent, textToPost, facets, thumbBlobRef
      ? {
          $type: 'app.bsky.embed.external',
          external: {
            uri: linkToPost,
            title: 'Blue 💙 Gallery on Europeana',
            description: 'In this gallery, we explore the colour blue - the colour of the sea, the sky, sorrow and safety.',
            thumb: thumbBlobRef,
          },
        }
      : undefined)

    currentIndex++
  }
  catch (error) {
    console.error('Error on posting link:', error)
  }
}

runBlueBot()
