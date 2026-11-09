import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Poison Rana",
    short_name: "Poison Rana",
    description: "Rate, review, rank, and track professional wrestling.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1020",
    theme_color: "#0d1020",
    icons: [{ src: "/icon.png", sizes: "500x330", type: "image/png" }],
  };
}
