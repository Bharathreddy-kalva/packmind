import { HeroCinematicBg } from "./hero-cinematic-bg";

const QUERIES = [
  { query: "travel adventure landscape cinematic", alt: "Travel landscape" },
  { query: "mountain sunset panorama", alt: "Mountain sunset" },
  { query: "tropical ocean beach aerial", alt: "Tropical ocean" },
  { query: "scenic winding road mountains", alt: "Scenic road" },
];

interface PexelsPhoto {
  src: { landscape: string; large2x: string };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

async function fetchHeroImages() {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  const results = await Promise.all(
    QUERIES.map(async ({ query, alt }) => {
      try {
        const res = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
          {
            headers: { Authorization: apiKey },
            next: { revalidate: 86400 },
          },
        );
        if (!res.ok) return null;
        const data: PexelsResponse = await res.json();
        const photo = data.photos[0];
        if (!photo) return null;
        return { src: photo.src.large2x || photo.src.landscape, alt };
      } catch {
        return null;
      }
    }),
  );

  return results.filter((t): t is { src: string; alt: string } => t !== null);
}

export async function HeroMosaic() {
  const images = await fetchHeroImages();
  if (images.length === 0) return null;

  return <HeroCinematicBg images={images} />;
}
