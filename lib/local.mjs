import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {models,validateOrder,zip} from './core.mjs';
const dir=new URL('../.local/',import.meta.url),db=new URL('orders.json',dir);
let orders=[];try{orders=JSON.parse(await readFile(db,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
async function save(){await mkdir(dir,{recursive:true});await writeFile(new URL('orders.tmp',dir),JSON.stringify(orders));await rename(new URL('orders.tmp',dir),db);}
export async function localApi(req,res,catalog){
  const url=new URL(req.url,'http://localhost');
  let session=req.headers.cookie?.match(/(?:^|; )promptya=([a-f0-9-]{36})(?:;|$)/)?.[1];
  if(!session){session=randomUUID();res.setHeader('Set-Cookie',`promptya=${session}; HttpOnly; SameSite=Strict; Path=/`);}
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(url.pathname==='/api/config')return send(200,{mode:'demo',models,integrations:{github:'À connecter',vercel:'Configuration prête',supabase:'Migration prête',replicate:'Connecteur préparé',stripe:'Connecteur préparé'}});
  if(url.pathname==='/api/orders'&&req.method==='POST'){
    if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return send(403,{error:'Origine non autorisée'});
    let raw='';for await(const c of req){raw+=c;if(raw.length>6000000)return send(413,{error:'Photo trop volumineuse'});}
    try{if(orders.filter(o=>o.session===session).length>=100)throw Error('Limite de 100 commandes de test atteinte.');const input=validateOrder(JSON.parse(raw),catalog);const order={...input,reference:input.reference?'reference-local-preview':null,id:randomUUID(),session,created_at:new Date().toISOString(),status:'queued',mode:'demo'};orders.push(order);await save();return send(201,{id:order.id});}catch(e){return send(400,{error:e.message});}
  }
  if(url.pathname==='/api/orders'&&req.method==='GET'){
    let changed=false;for(const o of orders.filter(o=>o.session===session)){const age=Date.now()-Date.parse(o.created_at);const status=age>8000?'completed':age>1500?'processing':'queued';if(o.status!==status){o.status=status;changed=true;}}
    if(changed)await save();return send(200,orders.filter(o=>o.session===session).map(({session,reference,...o})=>({...o,progress:o.status==='completed'?o.count:Math.min(o.count-1,Math.floor((Date.now()-Date.parse(o.created_at))/8000*o.count))})).reverse());
  }
  const match=url.pathname.match(/^\/api\/download\/([a-f0-9-]+)$/);
  if(match){const o=orders.find(o=>o.id===match[1]&&o.session===session);if(!o||o.status!=='completed')return send(404,{error:'Archive indisponible'});const image=await readFile(new URL('../Promptya_Site/assets/louvre.webp',import.meta.url));const files=Array.from({length:o.count},(_,i)=>({name:`exemple-${String(i+1).padStart(3,'0')}.webp`,data:image}));files.push({name:'DEMONSTRATION.txt',data:'Archive de test Promptya. Les images sont des exemples identiques du catalogue, aucune génération IA ni paiement effectué.'});res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="promptya-demo.zip"','Cache-Control':'no-store'});return res.end(zip(files));}
  return send(404,{error:'Route indisponible en démonstration'});
}
