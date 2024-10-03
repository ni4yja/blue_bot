var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from 'node-fetch';
export function initializeLinks(apiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const params = {
                page: '0',
                pageSize: '22',
                wskey: apiKey,
            };
            const baseUrl = 'https://api.europeana.eu/set/9109';
            const url = `${baseUrl}?${new URLSearchParams(params).toString()}`;
            const response = yield fetch(url);
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
            const data = (yield response.json());
            if (data.items && data.items.length > 0) {
                return data.items.map(link => link.replace('http://data.europeana.eu/', 'https://www.europeana.eu/'));
            }
            else {
                return [];
            }
        }
        catch (error) {
            console.error('Error initializing links from Europeana:', error);
            return [];
        }
    });
}
