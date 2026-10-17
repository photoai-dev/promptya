import {writeFile} from '../lib/fs-safe.mjs';
import {readFile,readdir,mkdir,cp,rm} from 'node:fs/promises';
await import('./sync-examples.mjs');
await import('./content-pages.mjs');
await import('./catalog-pages.mjs');
await import('./catalog-facets.mjs');
await import('./media-pages.mjs');
await import('./mascot-pages.mjs');
await import('./cropper-page.mjs');
await import('./admin-login-page.mjs');
await import('./blog-pages.mjs');
await import('./account-page.mjs');
await import('./fairy-pack-page.mjs');
await import('./how-page.mjs');
await import('./guides-page.mjs');
await import('./editorial-admin-page.mjs');
await import('./legal-page.mjs');
const {siteHeader,siteFooter}=await import('../content/layout.mjs');
const {sharingMetadata,iconMetadata,socialAsset}=await import('../content/social-images.mjs');
const {suppliedArtFor,viralCampaign,viralEditorial}=await import('../content/supplied-art.mjs');
const {videoBand,listeningVideoBand}=await import('../content/video-band.mjs');
const {guideCallout}=await import('../content/creation-steps.mjs');
const {relatedPackCards}=await import('../content/related-packs.mjs');
const root=new URL('../Promptya_Site/',import.meta.url);
const origin=(process.env.SITE_URL||process.env.APP_URL||'https://promptya.app').replace(/\/$/,'');
export const catalog=JSON.parse(await readFile(new URL('assets/catalog.json',root),'utf8'));
catalog.sort((a,b)=>a.name.localeCompare(b.name,'fr'));
if(catalog.some(p=>'prompts' in p))throw Error('Le catalogue public ne doit contenir aucun texte de prompt.');
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const category of ['voyage','mode','sport','creation','gourmandise']){
  const file=new URL(`categories/${category}/index.html`,root);let html=await readFile(file,'utf8');
  const cards=catalog.filter(p=>p.category===category).map(p=>`<a class="tile" href="/packs/${p.slug}/"><img loading="lazy" src="/assets/${p.image}" alt="Exemple de la collection ${escape(p.name)}"><div class="tilemain"><h2 style="font-size:20px">${escape(p.name)}</h2><p>Pack personnalisable · jusqu’à 100 images</p><strong>22,90 € →</strong></div></a>`).join('');
  html=html.replace(new RegExp(`<div class="cards section" data-category="${category}">[\\s\\S]*?<\\/div><!-- catalog-end -->`),`<div class="cards section" data-category="${category}">${cards}</div><!-- catalog-end -->`);
  if(!html.includes('<!-- catalog-end -->'))html=html.replace(`<div class="cards section" data-category="${category}"></div>`,`<div class="cards section" data-category="${category}">${cards}</div><!-- catalog-end -->`);
  await writeFile(file,html);
}
const paths=[];
async function walk(dir,relative=''){for(const e of await readdir(dir,{withFileTypes:true})){const rel=relative+e.name;if(e.isDirectory()&&!['en','es','it','pt','de','nl','br','cz'].includes(e.name))await walk(new URL(e.name+'/',dir),rel+'/');else if(e.name==='index.html'){
 const path='/'+rel.replace('index.html','');let html=await readFile(new URL(e.name,dir),'utf8');html=html.replaceAll('https://promptya.com',origin).replaceAll('https://promptya-lylx.vercel.app',origin);
 if(/^\/packs\/[^/]+\/$/.test(path)){const slug=path.split('/')[2],block=relatedPackCards(slug,catalog);if(html.includes('<section class="related-packs'))html=html.replace(/<section class="related-packs[^"]*"[\s\S]*?<\/section>/,block);else html=html.replace('</main>','<div class="wrap">'+block+'</div></main>');if(!html.includes('/assets/related-packs.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/related-packs.css"></head>');}
 if(path==='/packs/')html=html.replace('class="wrap shop-main"','class="wrap shop-main catalogue-page"');
 html=html.replace(/<header[\s\S]*?<\/header>/,siteHeader);
 if(!html.includes('/assets/navigation.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/navigation.css"><script defer src="/assets/navigation.js"></script></head>');
 if(path==='/'){html=html.replace(/<!-- random-packs:start -->[\s\S]*?<!-- random-packs:end -->/g,'');const initial=relatedPackCards('miami',catalog).replace('related-packs related-visual','related-packs related-visual page-width').replace('id="autres-collections"','id="home-random-packs"').replace('POUR COMPARER LES UNIVERS','LE HASARD FAIT BIEN LES CHOSES').replace('D’autres collections à découvrir.','Huit univers. Votre prochain déclic.').replace('<div class="related-pack-grid">','<p class="random-pack-intro">Laissez-vous surprendre par une sélection de nos collections.</p><button type="button" class="random-pack-refresh" id="random-pack-refresh">Une autre sélection ↻</button><div class="related-pack-grid" id="random-pack-grid">');html=html.replace('<section id="home-pricing"','<!-- random-packs:start -->'+initial+'<!-- random-packs:end --><section id="home-pricing"');if(!html.includes('/assets/random-packs.js'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/related-packs.css"><script type="module" src="/assets/random-packs.js"></script></head>');}
 if(path==='/'){html=html.replace('<a class="text-link" href="/blog/">Explorer les 30 guides →</a>',guideCallout);if(!html.includes('/assets/creation-steps.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/creation-steps.css"><script type="module" src="/assets/creation-steps.js"></script></head>');}
 if(path==='/'){html=html.replace(/<!-- home-video2:start -->[\s\S]*?<!-- home-video2:end -->/g,'');const journal='<section id="home-journal" class="page-width seo-section">';if(!html.includes(journal))throw Error('Emplacement vidéo avant journal introuvable');html=html.replace(journal,'<!-- home-video2:start -->'+listeningVideoBand+'<!-- home-video2:end -->'+journal);}
 if(path==='/'){html=html.replace(/<!-- home-video:start -->[\s\S]*?<!-- home-video:end -->/g,'');const marker='<section class="seo-section page-width"><div class="seo-heading"><span class="eyebrow">BIEN PRÉPARER SA SÉRIE</span>';if(!html.includes(marker))throw Error('Emplacement du bandeau vidéo introuvable');html=html.replace(marker,'<!-- home-video:start -->'+videoBand+'<!-- home-video:end -->'+marker);if(!html.includes('/assets/home-video.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/home-video.css"><script type="module" src="/assets/home-video.js"></script></head>');}
 html=html.replace(/<!-- supplied-art:start -->[\s\S]*?<!-- supplied-art:end -->/g,'').replace(/<!-- supplied-art-bottom:start -->[\s\S]*?<!-- supplied-art-bottom:end -->/g,'');
 const pageArt=suppliedArtFor(path);if(pageArt){const block=`<!-- supplied-art:start -->${pageArt}<!-- supplied-art:end -->`;html=['/','/packs/'].includes(path)?html.replace('</main>',block+'</main>'):html.replace(/(<main[^>]*>)/,'$1'+block);if(!html.includes('/assets/supplied-art.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/supplied-art.css"></head>');}
 if(path==='/viral-trend/'){html=html.replace('<section class="seo-section"><h2>Comment fonctionne une mascotte exclusive ?', '<!-- supplied-art:start -->'+viralEditorial+'<!-- supplied-art:end --><section class="seo-section"><h2>Comment fonctionne une mascotte exclusive ?');html=html.replace('</main>','<!-- supplied-art-bottom:start -->'+viralCampaign+'<!-- supplied-art-bottom:end --></main>');if(!html.includes('/assets/supplied-art.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/supplied-art.css"></head>');}
 if(!path.startsWith('/admin/')&&!html.includes('class="auth-page"')){html=html.replace(/<footer[\s\S]*?<\/footer>/,siteFooter);if(!html.includes('class="site-footer"'))html=html.replace('</body>',siteFooter+'</body>');if(!html.includes('/assets/footer.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/footer.css"></head>');}
 if(path.startsWith('/admin/')&&!html.includes('/assets/admin-private.js'))html=html.replace('</head>','<script defer src="/assets/admin-private.js"></script></head>');
 if(!path.startsWith('/admin/')&&html.includes('<footer')&&!html.includes('href="/blog/">Le journal</a>'))html=html.replace('</footer>','<div class="wrap" style="padding-bottom:20px"><a href="/blog/">Le journal</a></div></footer>');
 html=html.replace(/<a href="\/admin\/">(?:Administration|Admin)<\/a>/g,'').replace(/ ·\s*<p class="muted">/g,'<p class="muted">');
 html=html.replaceAll('En local : commandes de cette session de test. En ligne : accès réservé aux comptes administrateurs Supabase.','Accès réservé aux administrateurs.').replaceAll('Objectif 2 h à valider techniquement','Suivi de vos créations dans votre compte').replaceAll('Objectif 2 h sous réserve de validation technique.','Vos créations, réunies dans votre espace.');
 if(!html.includes('/assets/cart-badge.js'))html=html.replace('</head>','<script defer src="/assets/cart-badge.js"></script></head>');
 if(path==='/'){html=html.replace(/<select id="quick-model"[^>]*>[\s\S]*?<\/select>/,'<select id="quick-model" aria-label="Modèle"><option value="flux-3-image">FLUX 3 Image</option></select>');if(!html.includes('/assets/home-visuals.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/home-visuals.css"><script type="module" src="/assets/home-motion.js"></script></head>');}
 if(!path.startsWith('/tarifs/'))html=html.replaceAll('19<sup>€</sup>90','22<sup>€</sup>90').replaceAll('19€90','22€90');
 if(['/studio/','/guides/'].includes(path))html=html.replaceAll('19,90','22,90');
 html=html.replace('100 images · 19,90 € ·','100 images · dès 14,90 € en forfait ·');
 html=html.replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${origin}${path}">`);
 html=html.replace(/<meta (?:property="og:[^"]*"|name="twitter:[^"]*") content="[^"]*">/g,'');
 const title=html.match(/<title>(.*?)<\/title>/)?.[1]||'Promptya';const description=html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'';
 html=html.replace('</head>',`<meta property="og:type" content="${path.startsWith('/packs/')&&path!=='/packs/'?'product':'website'}"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="Promptya"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${origin}${path}"><meta name="twitter:card" content="summary_large_image"></head>`);
 if(path.startsWith('/blog/')&&path!=='/blog/')html=html.replace('property="og:type" content="website"','property="og:type" content="article"');
 html=html.replace(/<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]*>/g,'').replace(/<meta name="theme-color"[^>]*>/g,'');
 html=html.replace('</head>',iconMetadata+sharingMetadata(path,origin,title)+'</head>');
 await writeFile(new URL(e.name,dir),html);if(!/^(studio|admin|commandes|compte|panier)\//.test(rel)&&!html.includes('content="noindex,'))paths.push(path);
}}}
await walk(root);
await writeFile(new URL('sitemap.xml',root),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>`<url><loc>${origin}${p}</loc></url>`).join('')+'</urlset>');
await writeFile(new URL('robots.txt',root),`User-agent: *\nDisallow: /api/\nDisallow: /admin/\nDisallow: /compte/\nDisallow: /commandes/\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(new URL('llms.txt',root),`# Promptya\nPacks d’images IA personnalisées. 106 collections. 100 photos par pack : 22,90 EUR ; 2 packs à 19,90 EUR chacun ; 3 à 16,90 EUR ; 4 à 14,90 EUR. Mascottes exclusives : 69,90 EUR pour 30 photos. Covers : tarif distinct à définir.\nLes prompts sont internes, seuls les résultats sont livrés en ZIP.\nL’objectif de deux heures n’est pas une garantie validée.\n\n## Pages\n- [Catalogue](${origin}/packs/)\n- [Fonctionnement](${origin}/comment-ca-marche/)\n- [Tarifs](${origin}/tarifs/)\n- [FAQ](${origin}/#faq)\n\n## Collections\n${paths.filter(p=>/^\/packs\/.+/.test(p)).map(p=>`- ${origin}${p}`).join('\n')}\n`);
await import('./build-locales.mjs');
await mkdir('.server-ui/admin',{recursive:true});await cp(new URL('admin/',root),'.server-ui/admin',{recursive:true});
await mkdir('dist',{recursive:true});await cp(root,'dist',{recursive:true});
const staticAdmin=new URL('../dist/admin/',import.meta.url);if(!staticAdmin.href.startsWith(new URL('../dist/',import.meta.url).href))throw Error('Chemin public administrateur invalide');
await rm(staticAdmin,{recursive:true,force:true});
console.log(JSON.stringify({collections:catalog.length,promptsInternes:catalog.reduce((n,p)=>n+p.promptCount,0),pages:'dist/'}));
