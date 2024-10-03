var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from "node-fetch";
export function uploadImage(agent, imageUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Error fetching image: ${response.statusText}`);
            }
            const arrayBuffer = yield response.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            const blob = yield agent.uploadBlob(imageBuffer, { encoding: 'image/jpeg' });
            return blob.data.blob;
        }
        catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    });
}
