import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {localApi} from './lib/local.mjs';
const root=resolve('Promptya_Site');
const catalog=JSON.parse(await readFile(resolve(root,'assets/catalog.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.url.startsWith('/api/'))return await localApi(req,res,catalog);
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname);
  if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);return res.end();}
  let info=await stat(path);if(info.isDirectory()){if(!pathname.endsWith('/')){res.writeHead(302,{Location:pathname+'/'});return res.end();}path=resolve(path,'index.html');}
  const body=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);
}catch(e){res.writeHead(e.code==='ENOENT'?404:500);res.end(e.code==='ENOENT'?'Page introuvable':'Erreur du serveur');}}).listen(3000,'127.0.0.1',()=>console.log('Promptya : http://localhost:3000 — démonstration locale, sans paiement ni génération IA'));
