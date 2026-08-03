import {NextRequest,NextResponse} from "next/server";
import {Document,HeadingLevel,Packer,Paragraph} from "docx";
import {PDFDocument,StandardFonts,rgb} from "pdf-lib";
import {adminDb} from "@/lib/admin-db";
import {getAdminSession} from "@/lib/admin-session";

export const runtime="nodejs";
const safe=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9-_]+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"documento";
const wrap=(text:string,max=92)=>text.split(/\s+/).reduce<string[]>((lines,word)=>{const last=lines.at(-1);if(!last||`${last} ${word}`.length>max)lines.push(word);else lines[lines.length-1]=`${last} ${word}`;return lines},[]);

export async function GET(request:NextRequest){
  if(!await getAdminSession())return NextResponse.json({ok:false,error:"No autorizado."},{status:401});
  const id=request.nextUrl.searchParams.get("id")||"",format=request.nextUrl.searchParams.get("format")||"pdf",sql=adminDb();
  const rows=await sql`select title,category,content from workspace_documents where id=${id} limit 1`;
  if(!rows.length)return NextResponse.json({ok:false,error:"Documento no encontrado."},{status:404});
  const item=rows[0] as {title:string;category:string;content:string},filename=safe(item.title);
  if(format==="txt"||format==="md"){
    const body=format==="md"?`# ${item.title}\n\n_${item.category}_\n\n${item.content}`:`${item.title}\n${item.category}\n\n${item.content}`;
    return new NextResponse(body,{headers:{"Content-Type":"text/plain; charset=utf-8","Content-Disposition":`attachment; filename="${filename}.${format}"`}});
  }
  if(format==="docx"){
    const document=new Document({sections:[{properties:{},children:[new Paragraph({text:item.title,heading:HeadingLevel.TITLE}),new Paragraph({text:item.category,spacing:{after:260}}),...item.content.split(/\n+/).filter(Boolean).map(line=>new Paragraph({text:line,spacing:{after:180}}))]}]});
    const output=await Packer.toBuffer(document);
    return new NextResponse(new Uint8Array(output),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","Content-Disposition":`attachment; filename="${filename}.docx"`}});
  }
  const document=await PDFDocument.create(),font=await document.embedFont(StandardFonts.Helvetica),bold=await document.embedFont(StandardFonts.HelveticaBold);let page=document.addPage([612,792]),y=742;
  const line=(value:string,size=11,strong=false)=>{if(y<58){page=document.addPage([612,792]);y=742}page.drawText(value,{x:54,y,size,font:strong?bold:font,color:rgb(.03,.12,.29)});y-=size+7};
  line(item.title,21,true);line(item.category,10);y-=8;for(const paragraph of item.content.split(/\n+/)){for(const value of wrap(paragraph||" "))line(value,11);y-=6}
  const output=await document.save();
  const body=output.buffer.slice(output.byteOffset,output.byteOffset+output.byteLength) as ArrayBuffer;
  return new NextResponse(body,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${filename}.pdf"`}});
}
