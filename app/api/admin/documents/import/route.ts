import {NextRequest,NextResponse} from "next/server";
import mammoth from "mammoth";
import {getDocument} from "pdfjs-dist/legacy/build/pdf.mjs";
import {getAdminSession} from "@/lib/admin-session";

export const runtime="nodejs";
const allowed=new Set(["txt","md","markdown","docx","pdf"]);

export async function POST(request:NextRequest){
  if(!await getAdminSession())return NextResponse.json({ok:false,error:"No autorizado."},{status:401});
  const form=await request.formData(),file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({ok:false,error:"Selecciona un archivo."},{status:400});
  if(file.size>10*1024*1024)return NextResponse.json({ok:false,error:"El archivo supera el límite de 10 MB."},{status:400});
  const extension=file.name.split(".").pop()?.toLowerCase()||"";
  if(!allowed.has(extension))return NextResponse.json({ok:false,error:"Formato no compatible. Usa TXT, Markdown, DOCX o PDF."},{status:400});
  const buffer=Buffer.from(await file.arrayBuffer());
  let content="";
  if(extension==="docx")content=(await mammoth.extractRawText({buffer})).value;
  else if(extension==="pdf"){
    const document=await getDocument({data:new Uint8Array(buffer),useWorkerFetch:false,isEvalSupported:false}).promise,pages:string[]=[];
    for(let pageNumber=1;pageNumber<=document.numPages;pageNumber++){const page=await document.getPage(pageNumber),items=await page.getTextContent();pages.push(items.items.map(item=>"str" in item?item.str:"").join(" "))}
    content=pages.join("\n\n");
  }
  else content=buffer.toString("utf8");
  content=content.replace(/\u0000/g,"").trim().slice(0,20000);
  if(!content)return NextResponse.json({ok:false,error:"No se encontró texto legible en el archivo."},{status:400});
  return NextResponse.json({ok:true,title:file.name.replace(/\.[^.]+$/,"").slice(0,220),content,category:extension==="pdf"?"PDF importado":extension==="docx"?"Word importado":"Notas"});
}
