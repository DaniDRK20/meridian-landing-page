import type {MetadataRoute} from "next";
export default function sitemap():MetadataRoute.Sitemap{const base="https://meridian-ai-rd.vercel.app";return[{url:base,lastModified:new Date(),changeFrequency:"monthly",priority:1},{url:`${base}/privacidad`,lastModified:new Date(),changeFrequency:"yearly",priority:.3}]}
