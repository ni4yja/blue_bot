var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import pkg from '@atproto/api';
import { CronJob } from 'cron';
import dotenv from 'dotenv';
import { uploadImage } from './services/blobService.js';
import { loginToBsky, postToBsky } from './services/bskyService.js';
import { initializeLinks } from './services/europeanaService.js';
import { getOgImage } from './services/ogImageService.js';
dotenv.config();
const { BskyAgent } = pkg;
const agent = new BskyAgent({
    service: 'https://bsky.social',
});
let links = [];
let currentIndex = 0;
function runBlueBot() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            links = yield initializeLinks(process.env.EUROPEANA_API_KEY);
            if (links.length === 0) {
                return;
            }
            yield loginToBsky(agent, process.env.BLUESKY_USERNAME, process.env.BLUESKY_PASSWORD);
            const job = new CronJob('*/10 * * * *', () => __awaiter(this, void 0, void 0, function* () {
                yield postLink();
            }));
            job.start();
        }
        catch (error) {
            console.error('Error on running blue bot:', error);
        }
    });
}
function postLink() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (currentIndex >= links.length) {
                return;
            }
            const linkToPost = links[currentIndex];
            const ogImage = yield getOgImage(linkToPost);
            let thumbBlobRef = null;
            if (ogImage) {
                const uploadedBlob = yield uploadImage(agent, ogImage);
                if (uploadedBlob) {
                    thumbBlobRef = uploadedBlob;
                }
            }
            const textToPost = `${currentIndex + 1} / 22: Welcome to the Blue Gallery on Europeana: ${linkToPost}`;
            const byteStart = textToPost.indexOf(linkToPost);
            const byteEnd = byteStart + linkToPost.length;
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
            ];
            yield postToBsky(agent, textToPost, facets, thumbBlobRef
                ? {
                    $type: 'app.bsky.embed.external',
                    external: {
                        uri: linkToPost,
                        title: 'Blue 💙 Gallery on Europeana',
                        description: 'In this gallery, we explore the colour blue - the colour of the sea, the sky, sorrow and safety.',
                        thumb: thumbBlobRef,
                    },
                }
                : undefined);
            currentIndex++;
        }
        catch (error) {
            console.error('Error on posting link:', error);
        }
    });
}
runBlueBot();
