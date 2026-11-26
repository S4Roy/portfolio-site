import type { MetadataRoute } from "next";
import { profile } from "@/lib/data";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} | ${profile.title}`,
    short_name: profile.name,
    description: profile.headline,
    start_url: "/",
    display: "browser",
    background_color: "#f7f9fc",
    theme_color: "#1d4ed8",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
