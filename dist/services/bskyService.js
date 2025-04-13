export async function loginToBsky(agent, username, password) {
    try {
        await agent.login({
            identifier: username,
            password,
        });
    }
    catch (error) {
        console.error('Error on login:', error);
        throw error;
    }
}
export async function postToBsky(agent, text, facets = [], embed) {
    try {
        await agent.post({
            $type: 'app.bsky.feed.post',
            text,
            facets: facets.length > 0 ? facets : undefined,
            embed,
            createdAt: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error on post:', error);
    }
}
//# sourceMappingURL=bskyService.js.map