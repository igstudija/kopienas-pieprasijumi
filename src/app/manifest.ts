import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Specifiskie prasījumi",
    short_name: "Prasījumi",
    description: "Slēgtas uzņēmēju kopienas aktuālie pieprasījumi.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf0d5",
    theme_color: "#003049",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
