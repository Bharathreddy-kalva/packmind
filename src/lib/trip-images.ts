import type { ImageCredit, Trip } from "@/types";

type TripImageInput = Pick<Trip, "destination" | "trip_type"> &
  Partial<Pick<Trip, "image_url" | "image_credit">>;

export interface TripImage {
  src: string;
  alt: string;
  focal: string;
  credit?: ImageCredit | null;
}

const IMAGE_PARAMS = "auto=format&fit=crop&w=1400&q=82";

const TRIP_TYPE_IMAGES: Record<string, Omit<TripImage, "alt">> = {
  beach: {
    src: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?${IMAGE_PARAMS}`,
    focal: "center 40%",
  },
  business: {
    src: `https://images.unsplash.com/photo-1497366754035-f200968a6e72?${IMAGE_PARAMS}`,
    focal: "center",
  },
  hiking: {
    src: `https://images.unsplash.com/photo-1551632811-561732d1e306?${IMAGE_PARAMS}`,
    focal: "center 30%",
  },
  city: {
    src: `https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?${IMAGE_PARAMS}`,
    focal: "center",
  },
  camping: {
    src: `https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?${IMAGE_PARAMS}`,
    focal: "center 60%",
  },
  ski: {
    src: `https://images.unsplash.com/photo-1551524559-8af4e6624178?${IMAGE_PARAMS}`,
    focal: "center 35%",
  },
  wedding: {
    src: `https://images.unsplash.com/photo-1519741497674-611481863552?${IMAGE_PARAMS}`,
    focal: "center",
  },
  backpacking: {
    src: `https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?${IMAGE_PARAMS}`,
    focal: "center 40%",
  },
  cruise: {
    src: `https://images.unsplash.com/photo-1548574505-5e239809ee19?${IMAGE_PARAMS}`,
    focal: "center 45%",
  },
  road_trip: {
    src: `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?${IMAGE_PARAMS}`,
    focal: "center 40%",
  },
  festival: {
    src: `https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?${IMAGE_PARAMS}`,
    focal: "center",
  },
  family: {
    src: `https://images.unsplash.com/photo-1511895426328-dc8714191300?${IMAGE_PARAMS}`,
    focal: "center",
  },
};

const DESTINATION_IMAGES: Array<{
  match: RegExp;
  image: Omit<TripImage, "alt">;
}> = [
  {
    match: /\b(paris|france)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(london|england|uk|united kingdom)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(tokyo|japan)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?${IMAGE_PARAMS}`,
      focal: "center 30%",
    },
  },
  {
    match: /\b(new york|nyc|manhattan)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(washington|d\.c\.|dc)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1501466044931-62695aada8e9?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(rome|roma|italy|italia)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1552832230-c0197dd311b5?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(barcelona|spain|madrid)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1583422409516-2895a77efded?${IMAGE_PARAMS}`,
      focal: "center 30%",
    },
  },
  {
    match: /\b(dubai|abu dhabi|uae)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1512453979798-5ea266f8880c?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(sydney|melbourne|australia)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(singapore)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1525625293386-3f8f99389edd?${IMAGE_PARAMS}`,
      focal: "center",
    },
  },
  {
    match: /\b(amsterdam|netherlands|dutch)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1534351590666-13e3e96b5571?${IMAGE_PARAMS}`,
      focal: "center 45%",
    },
  },
  {
    match: /\b(iceland|reykjavik)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1504829857797-ddff29c27927?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(bangkok|thailand|phuket|chiang mai)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1508009603885-50cf7c579365?${IMAGE_PARAMS}`,
      focal: "center 30%",
    },
  },
  {
    match: /\b(india|delhi|mumbai|jaipur|goa|rajasthan)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?${IMAGE_PARAMS}`,
      focal: "center 30%",
    },
  },
  {
    match: /\b(switzerland|zurich|geneva|alps|interlaken)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(rio|brazil|são paulo|sao paulo)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1483729558449-99ef09a8c325?${IMAGE_PARAMS}`,
      focal: "center 30%",
    },
  },
  {
    match: /\b(cairo|egypt|pyramids)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1539768942893-daf53e736b68?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(san francisco|sf|golden gate)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1501594907352-04cda38ebc29?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(los angeles|la|hollywood)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?${IMAGE_PARAMS}`,
      focal: "center 30%",
    },
  },
  {
    match: /\b(chicago)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1494522855154-9297ac14b55f?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(istanbul|turkey|türkiye)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(lisbon|portugal|porto)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1558369981-f9ca78462e61?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(prague|czech)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1541849546-216549ae216d?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(berlin|germany|munich)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1560969184-10fe8719e047?${IMAGE_PARAMS}`,
      focal: "center",
    },
  },
  {
    match: /\b(seoul|korea|korean)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(hong kong)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1536599018102-9f803c140fc1?${IMAGE_PARAMS}`,
      focal: "center",
    },
  },
  {
    match: /\b(marrakech|morocco)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1489749798305-4fea3ae63d23?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(cape town|south africa)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1580060839134-75a5edca2e99?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(machu picchu|peru|cusco|lima)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1526392060635-9d6019884377?${IMAGE_PARAMS}`,
      focal: "center 30%",
    },
  },
  {
    match: /\b(santorini|greece|athens|mykonos)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(vienna|austria)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1516550893923-42d28e5677af?${IMAGE_PARAMS}`,
      focal: "center",
    },
  },
  {
    match: /\b(copenhagen|denmark|danish)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(lassen|yosemite|zion|grand canyon|yellowstone|glacier|national park|park)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1501785888041-af3ef285b470?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(miami|maldives|bali|hawaii|bahamas|cancun|caribbean|punta cana)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(kyoto|osaka)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(vancouver|canada|toronto|montreal)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1609825488888-3a766db05542?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(new zealand|auckland|queenstown)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1469521669194-babb45599def?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
  {
    match: /\b(havana|cuba)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1500759285222-a95626b934cb?${IMAGE_PARAMS}`,
      focal: "center",
    },
  },
  {
    match: /\b(nairobi|kenya|safari|serengeti|tanzania)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1516426122078-c23e76319801?${IMAGE_PARAMS}`,
      focal: "center 40%",
    },
  },
  {
    match: /\b(patagonia|argentina|buenos aires)\b/i,
    image: {
      src: `https://images.unsplash.com/photo-1510097467424-192d713fd8b2?${IMAGE_PARAMS}`,
      focal: "center 35%",
    },
  },
];

const DEFAULT_IMAGE: Omit<TripImage, "alt"> = {
  src: `https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?${IMAGE_PARAMS}`,
  focal: "center 40%",
};


export function tripImageFor(trip: TripImageInput): TripImage {
  const destination = trip.destination.trim();
  const alt = destination
    ? `Travel view for ${destination}`
    : "Scenic travel destination";

  if (trip.image_url) {
    return {
      src: trip.image_url,
      focal: "center",
      alt,
      credit: trip.image_credit ?? null,
    };
  }

  const destinationMatch = DESTINATION_IMAGES.find(({ match }) =>
    match.test(destination)
  );
  const image =
    destinationMatch?.image ?? TRIP_TYPE_IMAGES[trip.trip_type] ?? DEFAULT_IMAGE;

  return { ...image, alt };
}
