import React, { useEffect, useState } from "react";

// Bottom-right brand watermark that swaps between light/dark PNGs
// Fades in on first load; when switching to dark, the light image fades out slowly
export default function CornerBrand() {
  type Theme = "light" | "dark";
  const lightSrc =
    "https://cdn.builder.io/api/v1/image/assets%2Faccc7891edf04665961a321335d9540b%2F7767116085cd4da782ee26179c7b4250?format=webp&width=240";
  const darkSrc =
    "https://cdn.builder.io/api/v1/image/assets%2Faccc7891edf04665961a321335d9540b%2Fb35d1dd3c914450b8529e8dc0ce9ecc1?format=webp&width=240";

  const getTheme = (): Theme =>
    document.documentElement.classList.contains("dark") ? "dark" : "light";

  const [theme, setTheme] = useState<Theme>(getTheme());
  const [lightOpacity, setLightOpacity] = useState(0);
  const [darkOpacity, setDarkOpacity] = useState(0);

  useEffect(() => {
    const isDark = getTheme() === "dark";
    setTheme(isDark ? "dark" : "light");
    if (isDark) {
      setDarkOpacity(0);
      requestAnimationFrame(() => setDarkOpacity(0.28));
    } else {
      setLightOpacity(0);
      requestAnimationFrame(() => setLightOpacity(0.28));
    }
  }, []);

  useEffect(() => {
    const onTheme = (e: any) => {
      const next: Theme =
        String(e?.detail?.theme || "light") === "dark" ? "dark" : "light";
      setTheme(next);
      if (next === "dark") {
        setLightOpacity(0); // slow fade-out handled via CSS duration
        setDarkOpacity(0.28);
      } else {
        setDarkOpacity(0);
        setLightOpacity(0.28);
      }
    };
    window.addEventListener("theme:change", onTheme as any);
    return () => window.removeEventListener("theme:change", onTheme as any);
  }, []);

  const baseStyle: React.CSSProperties = {
    position: "fixed",
    right: 12,
    bottom: 12,
    zIndex: 25,
    pointerEvents: "none",
    width: 140,
    height: "auto",
    transition: "opacity 900ms ease",
    willChange: "opacity",
  };

  return (
    <>
      <img
        src={lightSrc}
        alt="brand"
        style={{ ...baseStyle, opacity: lightOpacity }}
        aria-hidden
      />
      <img
        src={darkSrc}
        alt="brand"
        style={{ ...baseStyle, opacity: darkOpacity }}
        aria-hidden
      />
    </>
  );
}
