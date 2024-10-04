import pkg from '@atproto/api'
import { CronJob } from 'cron'
import dotenv from 'dotenv'
import { uploadImage } from './services/blobService.js'
import { loginToBsky, postToBsky } from './services/bskyService.js'
import { initializeLinks } from './services/europeanaService.js'
import { getOgImage } from './services/ogImageService.js'

dotenv.config()

const { BskyAgent } = pkg

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

    const job = new CronJob('*/10 * * * *', async () => {
      await postLink()
    })
    job.start()
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

    const textToPost = `${currentIndex + 1} / 22: Welcome to the Blue Gallery on Europeana: ${linkToPost}`
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
