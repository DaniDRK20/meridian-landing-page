import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian — Innovación al servicio del talento humano",
  description: "Software, agentes de inteligencia artificial e integraciones que amplifican la capacidad de los equipos.",
  icons: {
    icon: [{ url: "/meridian-globe.png", type: "image/png" }],
    shortcut: "/meridian-globe.png",
    apple: "/meridian-globe.png",
  },
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="es"><body>{children}</body></html>;
}
