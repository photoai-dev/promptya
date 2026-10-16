import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {watch} from 'node:fs';
import {handler} from './lib/cloud.mjs';
import {adminPage} from './lib/admin-access.mjs';
try{process.loadEnvFile('.env');}catch(e){if(e.code!=='ENOENT')throw e;}
const root=resolve('Promptya_Site');
const catalog=JSON.parse(await readFile(resolve(root,'assets/catalog.json'),'utf8'));
const viewers=new Set();let refreshTimer;
watch(root,{recursive:true},()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{for(const viewer of viewers)viewer.write('data: reload\n\n');},400);});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.url==='/__updates'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache',Connection:'keep-alive'});res.write(': connected\n\n');viewers.add(res);req.on('close',()=>viewers.delete(res));return;}
  res.status=code=>{res.statusCode=code;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
  if(/^\/admin(?:\/|$)/i.test(new URL(req.url,'http://localhost').pathname))return await adminPage(req,res);
  if(req.url.startsWith('/api/')){if(req.url.startsWith('/api/admin-page'))return await adminPage(req,res);if(req.method==='POST'&&!req.url.startsWith('/api/stripe-webhook')){let raw='';for await(const c of req){raw+=c;if(raw.length>6000000)return res.status(413).json({error:'Requête trop volumineuse'});}try{req.body=JSON.parse(raw||'{}');}catch{return res.status(400).json({error:'JSON invalide'});}}return await handler(req,res);}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname);
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);return res.end();}
  let info=await stat(path);if(info.isDirectory()){if(!pathname.endsWith('/')){res.writeHead(302,{Location:pathname+'/'});return res.end();}path=resolve(path,'index.html');}
  let body=await readFile(path);if(extname(path)==='.html')body=Buffer.from(body.toString().replace('</body>',`<script>new EventSource('/__updates').onmessage=()=>location.reload();</script></body>`));res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);
}catch(e){res.writeHead(e.code==='ENOENT'?404:500);res.end(e.code==='ENOENT'?'Page introuvable':'Erreur du serveur');}}).listen(3000,'127.0.0.1',()=>console.log('Promptya : http://localhost:3000'));
