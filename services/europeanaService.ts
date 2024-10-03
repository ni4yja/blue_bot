import fetch from "node-fetch";

interface BlueCollection {
  items: string[];
}

export async function initializeLinks(apiKey: string): Promise<string[]> {
  try {
    const params = {
      page: "0",
      pageSize: "22",
      wskey: apiKey,
    };

    const baseUrl = "https://api.europeana.eu/set/9109";
    const url = `${baseUrl}?${new URLSearchParams(params).toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const data = (await response.json()) as BlueCollection;

    if (data.items && data.items.length > 0) {
      return data.items.map((link) => link.replace("http://data.europeana.eu/", "https://www.europeana.eu/"));
    } else {
      console.log("No links to publish.");
      return [];
    }
  } catch (error) {
    console.error("Error initializing links from Europeana:", error);
    return [];
  }
}
