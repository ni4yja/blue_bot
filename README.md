
# Blue Bot 🌊

**[𝗲𝘂𝗿𝗼𝗽𝗲𝗮𝗻𝗮 𝗯𝗹𝘂𝗲𝘀](https://bsky.app/profile/europeana-blues.bsky.social)** is a bot for the [Bluesky](https://bsky.app/) platform that posts images from the **Blue Gallery** on [Europeana](https://www.europeana.eu/). It fetches visual items from a curated collection and shares them with a translated description and a link to the original (as a comment).

## Features

- Fetches public domain images from the Blue Gallery on Europeana
- Publishes a post to Bluesky with the available image and its details
- Adds a link to the original item as a reply
- Translates the item's title and description into English, if needed
- Skips deleted or unavailable records automatically

## Requirements

- Node.js 22+
- npm 11+
- A [Bluesky](https://bsky.app/) account (with App Password)
- [Europeana API key](https://pro.europeana.eu/page/get-api)
- [DeepL API key](https://support.deepl.com/hc/en-us/articles/360020695820-API-Key-for-DeepL-s-API)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/blue-bot.git
   cd blue-bot

2. **Install dependencies:**

    ```bash
    npm install

3. **Set up environment variables:**

    Create a .env file with the following values:
    
    ```bash
    BSKY_USERNAME=your-handle.bsky.social
    BSKY_APP_PASSWORD=your-app-password
    EUROPEANA_API_KEY=your-europeana-api-key
    DEEPL_API_KEY=your-deepl-api-key
   
4. **Run the bot:**

   ```bash
    npm run dev
## License

[MIT](https://choosealicense.com/licenses/mit/) — feel free to use, modify, and share!
## Authors

- Made with 💟 by @ni4yja.bsky.social

