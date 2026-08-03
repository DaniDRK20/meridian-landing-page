import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://meridian-ai-rd.vercel.app"),
  title: {default:"Meridian — Innovación al servicio del talento humano",template:"%s | Meridian"},
  description: "Software, agentes de inteligencia artificial e integraciones que amplifican la capacidad de los equipos.",
  applicationName:"Meridian",
  keywords:["inteligencia artificial","automatización empresarial","agentes de IA","integraciones de software","República Dominicana"],
  alternates:{canonical:"/"},
  openGraph:{type:"website",locale:"es_DO",url:"/",siteName:"Meridian",title:"Meridian — Innovación al servicio del talento humano",description:"Software, agentes de inteligencia artificial e integraciones que amplifican la capacidad de los equipos."},
  twitter:{card:"summary",title:"Meridian — Innovación al servicio del talento humano",description:"Tecnología que amplifica la capacidad de los equipos."},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},
  manifest:"/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon-rounded.svg?v=3", type: "image/svg+xml" }],
    shortcut: "/favicon-rounded.svg?v=3",
    apple: "/meridian-globe.png",
  },
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="es"><body>{children}</body></html>;
}
