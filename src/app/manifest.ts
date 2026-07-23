import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Specifiskie prasījumi",
    short_name: "Prasījumi",
    description: "Slēgtas uzņēmēju kopienas aktuālie pieprasījumi.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1e8",
    theme_color: "#12372a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
