import {articles} from './blog.mjs';
import {mascots} from './mascots.mjs';
const sectionImages={
 '/':'habillage/couture-lavande.webp','/packs/':'habillage/couture-lavande.webp',
 '/viral-trend/':'mascot-store/hero.webp',
 '/comment-ca-marche/':'habillage/formats-danseur.webp',
 '/guides/':'habillage/gentleman.webp','/blog/':'habillage/gentleman.webp',
 '/covers/':'gallery/cover-album-chihuahua.webp',
 '/adult-prompts/':'habillage/glamour-rose.webp','/tarifs/':'habillage/gentleman.webp',
 '/mentions-legales/':'habillage/couture-lavande.webp'
};
export function socialSource(path,catalog){
 const pack=catalog.find(p=>path===`/packs/${p.slug}/`);
 if(pack)return '/assets/'+pack.image;
 const article=articles.find(a=>path===`/blog/${a.slug}/`);
 if(article)return '/assets/gallery/'+article.image;
 const mascot=mascots.find(m=>path===`/viral-trend/${m.slug}/`);
 if(mascot)return mascot.presentationSheet||mascot.sheet||`/assets/viral/${mascot.slug}.webp`;
 const category=path.match(/^\/categories\/([^/]+)\/$/)?.[1];
 if(category){const p=catalog.find(p=>p.category===category);if(p)return '/assets/'+p.image;}
 return '/assets/'+(sectionImages[path]||'habillage/couture-lavande.webp');
}
export const socialAsset=path=>'/assets/social/'+(path==='/'?'home':path.slice(1,-1).replaceAll('/','--'))+'.jpg';
export function sharingMetadata(path,origin,title){
 const image=origin+socialAsset(path);
 return `<meta property="og:image" content="${image}"><meta property="og:image:secure_url" content="${image}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${title}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${title}">`;
}
export const iconMetadata='<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="theme-color" content="#111216">';
