"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface Props {
  images: { src: string; alt: string }[];
}

export function HeroCinematicBg({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden"
    >
      {images.map((img, i) => (
        <div
          key={img.alt}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: i === activeIndex ? 1 : 0 }}
        >
          <Image
            src={img.src}
            alt=""
            fill
            sizes="100vw"
            className="animate-hero-ken-burns object-cover"
            priority={i === 0}
          />
        </div>
      ))}
    </div>
  );
}
