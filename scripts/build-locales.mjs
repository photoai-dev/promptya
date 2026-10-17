import {readFile,readdir,mkdir,cp} from 'node:fs/promises';
import {writeFile} from '../lib/fs-safe.mjs';
import {parse,serialize,parseFragment} from 'parse5';
import {mascots,photoMarkup} from '../content/mascots.mjs';
const root='Promptya_Site',origin=(process.env.SITE_URL||process.env.APP_URL||'https://promptya-lylx.vercel.app').replace(/\/$/,'');
const dictionary=JSON.parse(await readFile('content/locales/en.json','utf8'));
const config=JSON.parse(await readFile('content/locales/config.json','utf8'));
const overrides=JSON.parse(await readFile('content/locales/en-overrides.json','utf8'));
Object.assign(dictionary,overrides);
const translate=value=>{const key=value.trim();return dictionary[key]!==undefined?value.replace(key,dictionary[key]):value;};
const catalog=JSON.parse(await readFile(root+'/assets/catalog.json','utf8'));
const pages=[];
async function scan(dir,relative=''){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isDirectory()){if(['assets','en','admin','connexion-admin'].includes(e.name))continue;await scan(dir+'/'+e.name,relative+e.name+'/');}else if(e.name==='index.html')pages.push('/'+relative);}}
await scan(root);
const routes={'/':'/en/','/comment-ca-marche/':'/en/how-it-works/','/connexion/':'/en/sign-in/','/inscription/':'/en/sign-up/','/compte/':'/en/account/','/commandes/':'/en/orders/','/panier/':'/en/cart/','/tarifs/':'/en/pricing/','/blog/':'/en/journal/','/galerie/':'/en/gallery/','/categories/voyage/':'/en/categories/travel/','/categories/mode/':'/en/categories/fashion/','/categories/gourmandise/':'/en/categories/food/','/univers/miniatures-3d/':'/en/universes/miniature-3d/','/univers/beaute-creative/':'/en/universes/creative-beauty/'};
const slugify=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&amp;|&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
for(const p of pages){if(routes[p])continue;const pack=catalog.find(c=>p==='/packs/'+c.slug+'/');routes[p]=pack?'/en/packs/'+slugify(translate(pack.name))+'/':'/en'+p;}
if(new Set(Object.values(routes)).size!==Object.keys(routes).length)throw Error('English route collision');
function url(value){if(!value)return value;let absolute=value.startsWith(origin),v=absolute?value.slice(origin.length):value;if(!v.startsWith('/')||v.startsWith('//')||v.startsWith('/api/')||v.startsWith('/assets/'))return value;const match=v.match(/^([^?#]*)(.*)$/);let path=match[1];if(!path.endsWith('/')&&!path.includes('.'))path+='/';const target=routes[path];return target?(absolute?origin:'')+target+match[2]:value;}
const deep=x=>{if(Array.isArray(x))return x.map(deep);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,typeof v==='string'?((v.startsWith(origin)||v.startsWith('/'))?url(v):translate(v)):deep(v)]));return typeof x==='string'?translate(x):x;};
const dataNames=['catalog.json','mascots.json'];
await mkdir(root+'/en/assets',{recursive:true});
for(const name of dataNames){const data=JSON.parse(await readFile(root+'/assets/'+name,'utf8'));function localize(x,key=''){if(Array.isArray(x))return x.map(v=>localize(v,key));if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,localize(v,k)]));if(typeof x==='string'&&!['slug','image','sheet','presentationSheet','color','id','url','model'].includes(key))return translate(x);return x;}await writeFile(root+'/en/assets/'+name,JSON.stringify(localize(data)));}
for(const entry of await readdir(root+'/assets',{withFileTypes:true})){if(!entry.isFile()||!entry.name.endsWith('.js')||entry.name.includes('admin'))continue;let js=await readFile(root+'/assets/'+entry.name,'utf8');js=js.replaceAll('fr-FR','en-GB');js=js.replace(/(['"])((?:\\.|(?!\1)[^\\\r\n])*)\1/g,(all,quote,raw)=>{let text;try{text=quote==='"'?JSON.parse(all):raw.replace(/\\'/g,"'").replace(/\\n/g,'\n').replace(/\\\\/g,'\\');}catch{return all;}if(dictionary[text]!==undefined&&(/[�-�\s]/.test(text)||['Copier','Copi�','Chargement�','Erreur','Disponible','Vendu','Tous','Toutes'].includes(text))&&!/^[.#\[/:]|[{}<>]|querySelector|throw Error/.test(text))return JSON.stringify(dictionary[text]);return all;});
 for(const [fr,en] of Object.entries(routes).filter(([p])=>p!=='/').sort((a,b)=>b[0].length-a[0].length)){js=js.replaceAll("'"+fr,"'"+en).replaceAll('"'+fr,'"'+en).replaceAll('`'+fr,'`'+en);}
 for(const name of dataNames)js=js.replaceAll('/assets/'+name,'/en/assets/'+name);
 await writeFile(root+'/en/assets/'+entry.name,js);
}
await writeFile(root+'/en/assets/locale-data.json',JSON.stringify({dictionary,routes}));
await cp('scripts/locale-runtime.js',root+'/en/assets/locale-runtime.js');
const englishBrief={subject:'An adult wearing a linen jacket',action:'Walking through a Mediterranean alley',style:'Realistic editorial photography',setting:'Pale facades, blue shutters and cobblestones',lighting:'Soft natural morning light',composition:{framing:'Three-quarter shot',placement:'Subject on the right third',format:'16:9'},palette:['cream','blue','terracotta'],avoid:['text','logo','excessive beauty filters']};
const languageLinks=(fr,en,current)=>`<nav class="footer-languages" aria-label="${current==='en'?'Choose your language':'Choisir la langue'}"><a href="${fr}" lang="fr" hreflang="fr" ${current==='fr'?'aria-current="page"':''}>🇫🇷 Français</a><a href="${en}" lang="en" hreflang="en" ${current==='en'?'aria-current="page"':''}>🇬🇧 English</a></nav>`;
const missing=new Set();
for(const path of pages){let source=await readFile(root+path+'index.html','utf8');source=source.replace(/<!-- locale-links:start -->[\s\S]*?<!-- locale-links:end -->/g,'').replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g,'');
 const enPath=routes[path];if(!source.includes('rel="canonical"'))source=source.replace('</head>','<link rel="canonical" href="'+origin+path+'"></head>');const alternate=`<link rel="alternate" hreflang="fr" href="${origin+path}"><link rel="alternate" hreflang="en" href="${origin+enPath}"><link rel="alternate" hreflang="x-default" href="${origin+path}">`;
 const frSource=source.replace('</head>',(source.includes('/assets/locale.css')?'':'<link rel="stylesheet" href="/assets/locale.css">')+alternate+'</head>').replace('</footer>','<!-- locale-links:start -->'+languageLinks(path,enPath,'fr')+'<!-- locale-links:end --></footer>');
 await writeFile(root+path+'index.html',frSource);
 // English presentation uses clean individual poses; the French lettering in the sheets is never carried over.
 for(const m of mascots){const board=m.presentationSheet||'/assets/viral/'+m.slug+'.webp';source=source.replace(new RegExp('<img class="mascot-presentation-board"[^>]*src="'+board.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"[^>]*>','g'),photoMarkup(m,0));}
 source=source.replaceAll('/assets/habillage/viral-neon.webp','/assets/habillage/viral-header-force.webp').replaceAll('/assets/habillage/campagne-duo.webp','/assets/habillage/viral-header-force.webp');
 if(path==='/guides/')source=source.replaceAll('/assets/viral/boards/jean-philargent.webp','/assets/habillage/gentleman.webp');
 const doc=parse(source);
 const visit=(node,skip=false)=>{const tag=node.tagName;
  if(tag==='html'){const a=node.attrs.find(a=>a.name==='lang');if(a)a.value='en';}
  if(tag==='script'){const type=node.attrs?.find(a=>a.name==='type')?.value;if(type==='application/ld+json'){for(const child of node.childNodes||[])if(child.nodeName==='#text'){try{child.value=JSON.stringify(deep(JSON.parse(child.value)));}catch{throw Error('Invalid structured data '+path);}}}else{const src=node.attrs?.find(a=>a.name==='src');if(src?.value.startsWith('/assets/')&&!src.value.includes('admin'))src.value='/en'+src.value;}return;}
  if(tag==='style')return;
  for(const a of node.attrs||[]){if(a.name==='value'&&tag==='input'&&!node.attrs.some(x=>x.name==='type'&&['hidden','password','email','checkbox','radio'].includes(x.value)))a.value=translate(a.value);if(['title','alt','placeholder','aria-label','data-search-text','data-sort-name'].includes(a.name)||a.name==='content'&&tag==='meta'&&!/^(?:https?:|index|noindex|website|article|product|summary|fr_FR)/.test(a.value)){a.value=translate(a.value);}if(a.name==='content'&&a.value==='fr_FR')a.value='en_GB';if(['href','action'].includes(a.name))a.value=url(a.value);if(a.name==='src'&&a.value.startsWith('assets/'))a.value='/'+a.value;if(a.name==='href'&&a.value.startsWith('assets/'))a.value='/'+a.value;}
  if(node.nodeName==='#text'&&!skip&&/[A-Za-zÀ-ÿ]/.test(node.value)){const key=node.value.trim();if(key&&!dictionary[key]&&!/^[0-9\W]*$/.test(key))missing.add(key);node.value=translate(node.value);}
  if(node.attrs?.some(a=>a.name==='id'&&a.value==='brief-json')){node.childNodes=[{nodeName:'#text',value:JSON.stringify(englishBrief,null,2),parentNode:node}];return;}
  for(const child of node.childNodes||[])visit(child,skip||tag==='code'&&node.attrs?.some(a=>a.value==='brief-json'));
 };visit(doc);
 let html=serialize(doc).replace('<head>','<head><script defer src="/en/assets/locale-runtime.js"></script><link rel="stylesheet" href="/assets/locale.css">').replace('</head>',alternate+'</head>').replace('</footer>',languageLinks(path,enPath,'en')+'</footer>');
 const dir=root+enPath;await mkdir(dir,{recursive:true});await writeFile(dir+'index.html',html);
}
let sitemap=await readFile(root+'/sitemap.xml','utf8');const englishURLs=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>url(m[1])).filter(p=>p.includes('/en/'));sitemap=sitemap.replace('</urlset>',englishURLs.map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>');await writeFile(root+'/sitemap.xml',sitemap);
await writeFile(root+'/en/routes.json',JSON.stringify(routes,null,2));
await writeFile('content/locales/coverage-en.json',JSON.stringify({pages:pages.length,translated:Object.keys(dictionary).length,missing:[...missing]},null,2));
console.log('English: '+pages.length+' pages generated; '+missing.size+' text keys require review.');
