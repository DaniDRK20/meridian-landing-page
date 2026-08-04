import {NextRequest,NextResponse} from "next/server";
import mammoth from "mammoth";
import {getAdminSession} from "@/lib/admin-session";

export const runtime="nodejs";
const allowed=new Set(["txt","md","markdown","docx","pdf"]);

async function extractPdf(buffer:Buffer){
  const {default:PDFParser}=await import("pdf2json");
  return new Promise<string>((resolve,reject)=>{
    const parser=new PDFParser(null,true);
    parser.once("pdfParser_dataError",reason=>{parser.destroy();reject("parserError" in reason?reason.parserError:reason)});
    parser.once("pdfParser_dataReady",()=>{try{resolve(parser.getRawTextContent())}catch(reason){reject(reason)}finally{parser.destroy()}});
    parser.parseBuffer(buffer);
  });
}

export async function POST(request:NextRequest){
  try{
    if(!await getAdminSession())return NextResponse.json({ok:false,error:"No autorizado."},{status:401});
    const form=await request.formData(),file=form.get("file");
    if(!(file instanceof File))return NextResponse.json({ok:false,error:"Selecciona un archivo."},{status:400});
    if(file.size>10*1024*1024)return NextResponse.json({ok:false,error:"El archivo supera el límite de 10 MB."},{status:400});
    const extension=file.name.split(".").pop()?.toLowerCase()||"";
    if(!allowed.has(extension))return NextResponse.json({ok:false,error:"Formato no compatible. Usa TXT, Markdown, DOCX o PDF."},{status:400});
    const buffer=Buffer.from(await file.arrayBuffer());
    let content="";
    if(extension==="docx")content=(await mammoth.extractRawText({buffer})).value;
    else if(extension==="pdf")content=await extractPdf(buffer);
    else content=buffer.toString("utf8");
    content=content.replace(/\u0000/g,"").trim().slice(0,20000);
    if(!content)return NextResponse.json({ok:false,error:"No se encontró texto legible en el archivo."},{status:400});
    return NextResponse.json({ok:true,title:file.name.replace(/\.[^.]+$/,"").slice(0,220),content,category:extension==="pdf"?"PDF importado":extension==="docx"?"Word importado":"Notas"});
  }catch(reason){
    console.error("Document import failed",reason);
    return NextResponse.json({ok:false,error:reason instanceof Error?`No se pudo leer el archivo: ${reason.message}`:"No se pudo leer el archivo."},{status:500});
  }
}
