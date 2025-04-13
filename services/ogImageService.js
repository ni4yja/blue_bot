var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { load } from 'cheerio';
import fetch from 'node-fetch';
export function getOgImage(link) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(link);
            if (!response.ok) {
                throw new Error(`Error fetching page: ${response.statusText}`);
            }
            const html = yield response.text();
            const $ = load(html);
            const ogImage = $('meta[property="og:image"]').attr('content');
            return ogImage || null;
        }
        catch (error) {
            console.error('Error fetching OG image:', error);
            return null;
        }
    });
}
