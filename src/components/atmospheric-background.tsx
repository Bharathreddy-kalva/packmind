const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

export function AtmosphericBackground({ intense = false }: { intense?: boolean } = {}) {
  const a = intense ? 0.1 : 0;
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundColor: "#0f0814",
          backgroundImage: `
            radial-gradient(ellipse 120% 60% at 50% 0%,
              rgba(60, 10, 120, ${0.8 + a}) 0%,
              rgba(40, 5, 80, ${0.4 + a}) 40%,
              transparent 70%),
            radial-gradient(ellipse 80% 50% at 50% 50%,
              rgba(80, 20, 140, ${0.3 + a}) 0%,
              transparent 60%),
            radial-gradient(ellipse 100% 60% at 50% 100%,
              rgba(160, 60, 10, ${0.7 + a}) 0%,
              rgba(120, 40, 5, ${0.5 + a}) 20%,
              rgba(80, 20, 0, ${0.3 + a}) 45%,
              transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%,
              rgba(140, 50, 10, ${0.3 + a}) 0%,
              transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 80%,
              rgba(140, 50, 10, ${0.3 + a}) 0%,
              transparent 50%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.015]"
        style={{
          backgroundImage: NOISE_TEXTURE,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </>
  );
}
