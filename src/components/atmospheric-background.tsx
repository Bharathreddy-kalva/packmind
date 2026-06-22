const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

export function AtmosphericBackground({ intense = false }: { intense?: boolean } = {}) {
  const a = intense ? 0.08 : 0;
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundColor: "#05080c",
          backgroundImage: `
            linear-gradient(120deg,
              rgba(18, 32, 43, ${0.95 + a}) 0%,
              rgba(5, 8, 12, 0.92) 38%,
              rgba(26, 20, 38, ${0.76 + a}) 72%,
              rgba(32, 20, 14, ${0.42 + a}) 100%),
            linear-gradient(180deg,
              rgba(0, 229, 191, 0.09) 0%,
              transparent 28%,
              rgba(255, 184, 77, 0.08) 100%),
            repeating-linear-gradient(90deg,
              rgba(255,255,255,0.035) 0,
              rgba(255,255,255,0.035) 1px,
              transparent 1px,
              transparent 72px),
            repeating-linear-gradient(0deg,
              rgba(255,255,255,0.025) 0,
              rgba(255,255,255,0.025) 1px,
              transparent 1px,
              transparent 72px)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(115deg, transparent 0 42%, rgba(0,229,191,0.16) 42.1%, transparent 42.45%),
            linear-gradient(115deg, transparent 0 56%, rgba(255,184,77,0.13) 56.1%, transparent 56.38%),
            linear-gradient(65deg, transparent 0 64%, rgba(125,211,252,0.09) 64.1%, transparent 64.36%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.018]"
        style={{
          backgroundImage: NOISE_TEXTURE,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </>
  );
}
