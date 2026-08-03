import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots{return{rules:{userAgent:"*",allow:"/",disallow:["/admin/","/api/"]},sitemap:"https://meridian-ai-rd.vercel.app/sitemap.xml",host:"https://meridian-ai-rd.vercel.app"}}
