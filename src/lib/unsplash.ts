export interface UnsplashImage {
  url: string;
  credit: { name: string; link: string };
}

export async function getDestinationImage(
  destination: string
): Promise<UnsplashImage | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  try {
    const query = encodeURIComponent(`${destination} travel`);
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&orientation=landscape&per_page=1`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      results: Array<{
        urls: { regular: string };
        user: { name: string; links: { html: string } };
      }>;
    };

    const photo = data.results[0];
    if (!photo) return null;

    return {
      url: photo.urls.regular,
      credit: {
        name: photo.user.name,
        link: photo.user.links.html,
      },
    };
  } catch (err) {
    console.error("[unsplash] Failed to fetch destination image:", err);
    return null;
  }
}
