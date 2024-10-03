import pkg from "@atproto/api";

const { BskyAgent } = pkg;

export async function loginToBsky(agent: InstanceType<typeof BskyAgent>, username: string, password: string) {
  try {
    await agent.login({
      identifier: username,
      password: password,
    });
    console.log("Login successful.");
  } catch (error) {
    console.error("Error on login:", error);
    throw error;
  }
}

export async function postToBsky(
  agent: InstanceType<typeof BskyAgent>,
  text: string,
  facets: Array<{
    index: { byteStart: number; byteEnd: number };
    features: Array<{ $type: string; uri?: string }>;
  }> = [],
  embed?: {
    $type: string;
    external: {
      uri: string;
      title: string;
      description?: string;
      thumb?: { ref: string };
    };
  }
) {
  try {
    await agent.post({
      $type: "app.bsky.feed.post",
      text: text,
      facets: facets.length > 0 ? facets : undefined,
      embed: embed,
      createdAt: new Date().toISOString(),
    });
    console.log("Congrats! Post successfully created.");
  } catch (error) {
    console.error("Error on post:", error);
  }
}
