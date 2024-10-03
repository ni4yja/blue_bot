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
const { BskyAgent } = pkg;
export function loginToBsky(agent, username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield agent.login({
                identifier: username,
                password: password,
            });
            console.log("Login successful.");
        }
        catch (error) {
            console.error("Error on login:", error);
            throw error;
        }
    });
}
export function postToBsky(agent_1, text_1) {
    return __awaiter(this, arguments, void 0, function* (agent, text, facets = [], embed) {
        try {
            yield agent.post({
                $type: "app.bsky.feed.post",
                text: text,
                facets: facets.length > 0 ? facets : undefined,
                embed: embed,
                createdAt: new Date().toISOString(),
            });
            console.log("Congrats! Post successfully created.");
        }
        catch (error) {
            console.error("Error on post:", error);
        }
    });
}
