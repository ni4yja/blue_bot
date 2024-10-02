var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import pkg from "@atproto/api";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { load } from "cheerio";
const { BskyAgent } = pkg;
dotenv.config();
const agent = new BskyAgent({
    service: "https://bsky.social",
});
let links = [];
let currentIndex = 0;
function initializeLinks() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const params = {
                page: "0",
                pageSize: "22",
                wskey: process.env.EUROPEANA_API_KEY,
            };
            const baseUrl = "https://api.europeana.eu/set/9109";
            const url = `${baseUrl}?${new URLSearchParams(params).toString()}`;
            const response = yield fetch(url);
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
            const data = (yield response.json());
            if (data.items && data.items.length > 0) {
                links = data.items.map((link) => link.replace("http://data.europeana.eu/", "https://www.europeana.eu/"));
            }
            else {
                console.log("Nothing to post.");
            }
        }
        catch (error) {
            console.error("Error initializing links from Europeana:", error);
        }
    });
}
function getOgImage(link) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(link);
            if (!response.ok) {
                throw new Error(`Error fetching page: ${response.statusText}`);
            }
            const html = yield response.text();
            const $ = load(html);
            const ogImage = $('meta[property="og:image"]').attr("content");
            return ogImage || null;
        }
        catch (error) {
            console.error("Error fetching OG image:", error);
            return null;
        }
    });
}
function uploadImage(imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Error fetching image: ${response.statusText}`);
            }
            const arrayBuffer = yield response.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            const blob = yield agent.uploadBlob(imageBuffer, {
                encoding: "image/jpeg",
            });
            return blob.data.blob;
        }
        catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    });
}
function postLink() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (currentIndex >= links.length) {
                console.log("The job is done. Nothing left to post.");
                return;
            }
            yield agent.login({
                identifier: process.env.BLUESKY_USERNAME,
                password: process.env.BLUESKY_PASSWORD,
            });
            const linkToPost = links[currentIndex];
            const ogImage = yield getOgImage(linkToPost);
            let thumbBlobRef = null;
            if (ogImage) {
                thumbBlobRef = yield uploadImage(ogImage);
            }
            const textToPost = `Welcome to the Blue Gallery on Europeana: ${linkToPost}`;
            const byteStart = textToPost.indexOf(linkToPost);
            const byteEnd = byteStart + linkToPost.length;
            const facets = [
                {
                    index: {
                        byteStart: byteStart,
                        byteEnd: byteEnd,
                    },
                    features: [
                        {
                            $type: "app.bsky.richtext.facet#link",
                            uri: linkToPost,
                        },
                    ],
                },
            ];
            if (thumbBlobRef) {
                yield agent.post({
                    $type: "app.bsky.feed.post",
                    text: textToPost,
                    facets: facets,
                    embed: {
                        $type: "app.bsky.embed.external",
                        external: {
                            uri: linkToPost,
                            title: "Blue | Gallery on Europeana",
                            description: "In this gallery, we explore the colour blue - the colour of the sea, the sky, sorrow and safety.",
                            thumb: thumbBlobRef,
                        },
                    },
                    createdAt: new Date().toISOString(),
                });
            }
            else {
                yield agent.post({
                    text: textToPost,
                    facets: facets,
                    createdAt: new Date().toISOString(),
                });
            }
            console.log(`Check the posted link: ${linkToPost}`);
            currentIndex++;
        }
        catch (error) {
            console.error("An error occured:", error);
        }
    });
}
initializeLinks().then(() => {
    if (links.length > 0) {
        postLink();
    }
    else {
        console.log("Go and drink some water, please.");
    }
});
