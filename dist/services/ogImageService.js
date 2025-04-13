import { load } from 'cheerio';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
/**
 * Logger utility to standardize logging across the service
 */
const logger = {
    info: (message) => {
        // eslint-disable-next-line no-console
        console.log(`[INFO] ${message}`);
    },
    error: (message, error) => {
        const errorMessage = error instanceof Error ? error.message : String(error || '');
        console.error(`[ERROR] ${message}${errorMessage ? `: ${errorMessage}` : ''}`);
    },
    debug: (message) => {
        // eslint-disable-next-line no-console
        console.debug(`[DEBUG] ${message}`);
    },
};
// Load environment variables
dotenv.config();
// Europeana API key
const EUROPEANA_API_KEY = process.env.EUROPEANA_API_KEY || '';
/**
 * Custom error types
 */
class EuropeanaApiError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.name = 'EuropeanaApiError';
        this.status = status;
    }
}
class FetchError extends Error {
    status;
    statusText;
    url;
    constructor(message, status, statusText, url) {
        super(message);
        this.name = 'FetchError';
        this.status = status;
        this.statusText = statusText;
        this.url = url;
    }
}
/**
 * Standard request headers to mimic a browser
 */
const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://www.google.com/',
    'Cache-Control': 'no-cache',
};
/**
 * Parse a Europeana URL to extract the record ID
 * @param url - URL to parse
 * @returns Record ID or null if not a Europeana URL
 */
function parseEuropeanaId(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('europeana.eu') && urlObj.pathname.startsWith('/item/')) {
            // Extract record ID by removing '/item/' from the pathname
            return urlObj.pathname.replace('/item/', '');
        }
        return null;
    }
    catch (error) {
        logger.error('Error parsing URL', error);
        return null;
    }
}
/**
 * Fetch an image URL from the Europeana API
 * @param recordId - Europeana record ID
 * @returns Image URL or null if not found
 */
async function fetchEuropeanaImage(recordId) {
    if (!EUROPEANA_API_KEY) {
        logger.error('EUROPEANA_API_KEY is not set in environment variables');
        return null;
    }
    const apiUrl = `https://api.europeana.eu/record/${recordId}.json?wskey=${EUROPEANA_API_KEY}`;
    logger.info(`Fetching from Europeana API: ${apiUrl}`);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new EuropeanaApiError(`Europeana API error: ${response.status} - ${response.statusText}`, response.status);
        }
        const data = await response.json();
        if (data.error) {
            throw new EuropeanaApiError(`Europeana API returned error: ${data.error}`);
        }
        if (!data.object || !data.object.aggregations || !data.object.aggregations.length) {
            logger.info('No aggregations found in Europeana API response');
            return null;
        }
        const aggregation = data.object.aggregations[0];
        // First try high-quality image
        if (aggregation.edmIsShownBy) {
            logger.info(`Found high-quality image: ${aggregation.edmIsShownBy}`);
            return aggregation.edmIsShownBy;
        }
        // Fall back to preview image
        if (aggregation.edmPreview) {
            logger.info(`Found preview image: ${aggregation.edmPreview}`);
            return aggregation.edmPreview;
        }
        logger.info('No image URLs found in Europeana API response');
        return null;
    }
    catch (error) {
        if (error instanceof EuropeanaApiError) {
            logger.error('Europeana API error', error);
        }
        else {
            logger.error('Error fetching from Europeana API', error);
        }
        return null;
    }
}
/**
 * Fetch HTML content from a URL and extract the OG image
 * @param url - URL to fetch
 * @param useHttps - Whether to use HTTPS (for retry attempts)
 * @returns OG image URL or null if not found
 */
async function fetchOgImageFromHtml(url, useHttps = false) {
    const fetchUrl = useHttps ? url.replace('http:', 'https:') : url;
    logger.info(`Fetching page: ${fetchUrl} ${useHttps ? '(HTTPS retry)' : ''}`);
    // No need for the try/catch wrapper since we're just rethrowing the error
    const response = await fetch(fetchUrl, { headers: browserHeaders });
    logger.info(`Response status: ${response.status} ${response.statusText}`);
    if (!response.ok) {
        throw new FetchError(`Error fetching page: Status ${response.status} - ${response.statusText}`, response.status, response.statusText, fetchUrl);
    }
    const html = await response.text();
    const $ = load(html);
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
        logger.info(`Found OG image: ${ogImage}`);
        return ogImage;
    }
    logger.info('No OG image found in HTML metadata');
    return null;
}
/**
 * Get OG image from a URL
 * First checks if it's a Europeana URL and uses API if it is
 * Otherwise tries to fetch the OG image from the HTML
 * @param link - URL to fetch OG image from
 * @returns OG image URL or null if not found
 */
export async function getOgImage(link) {
    logger.info(`Attempting to fetch OG image from: ${link}`);
    // Check if this is a Europeana URL
    const europeanaId = parseEuropeanaId(link);
    if (europeanaId) {
        logger.info(`Detected Europeana item with ID: ${europeanaId}`);
        return await fetchEuropeanaImage(europeanaId);
    }
    // Not a Europeana URL, try normal OG image extraction
    try {
        return await fetchOgImageFromHtml(link);
    }
    catch (error) {
        // If HTTP request failed, try HTTPS
        if (error instanceof FetchError
            && link.startsWith('http:')
            && !link.startsWith('https:')) {
            logger.info('HTTP request failed, retrying with HTTPS');
            try {
                return await fetchOgImageFromHtml(link, true);
            }
            catch (httpsError) {
                logger.error('HTTPS retry also failed', httpsError);
                return null;
            }
        }
        // Handle network errors with more specific messages
        const typedError = error;
        if (typedError.code === 'ENOTFOUND') {
            logger.error(`DNS lookup failed for ${link}: Host not found`);
        }
        else if (typedError.code === 'ETIMEDOUT') {
            logger.error(`Connection timed out for ${link}`);
        }
        else if (typedError.type === 'invalid-json') {
            logger.error(`Invalid JSON response from ${link}`);
        }
        else {
            logger.error(`Error fetching OG image from ${link}`, error);
        }
        return null;
    }
}
//# sourceMappingURL=ogImageService.js.map