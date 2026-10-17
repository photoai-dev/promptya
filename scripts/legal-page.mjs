import {mkdir,readFile} from 'node:fs/promises';
import {writeFile} from '../lib/fs-safe.mjs';
import {siteHeader,siteFooter} from '../content/layout.mjs';
export const legalCopy={
fr:['Mentions légales','Informations relatives au site promptya.app, au contact et à son hébergement.','Site internet','Contact','Hébergement','États-Unis'],
en:['Legal notice','Information about promptya.app, contact details and hosting.','Website','Contact','Hosting','United States'],
es:['Aviso legal','Información sobre promptya.app, los datos de contacto y el alojamiento.','Sitio web','Contacto','Alojamiento','Estados Unidos'],
it:['Note legali','Informazioni su promptya.app, i contatti e il servizio di hosting.','Sito web','Contatti','Hosting','Stati Uniti'],
pt:['Aviso legal','Informações sobre promptya.app, os contactos e o alojamento.','Sítio Web','Contacto','Alojamento','Estados Unidos'],
de:['Impressum','Informationen zu promptya.app, Kontakt und Hosting.','Website','Kontakt','Hosting','Vereinigte Staaten'],
nl:['Juridische informatie','Informatie over promptya.app, contactgegevens en hosting.','Website','Contact','Hosting','Verenigde Staten'],
br:['Aviso legal','Informações sobre promptya.app, contato e hospedagem.','Site','Contato','Hospedagem','Estados Unidos'],
cz:['Právní informace','Informace o webu promptya.app, kontaktech a hostingu.','Webové stránky','Kontakt','Hosting','Spojené státy']
};
const c=legalCopy.fr;
await mkdir('Promptya_Site/mentions-legales',{recursive:true});
await writeFile('Promptya_Site/mentions-legales/index.html',`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c[0]} | Promptya</title><meta name="description" content="${c[1]}"><link rel="canonical" href="https://promptya.app/mentions-legales/"><link rel="stylesheet" href="/assets/style.css"><link rel="stylesheet" href="/assets/premium.css"></head><body>${siteHeader}<main class="wrap" style="padding-top:72px;padding-bottom:80px;max-width:960px"><h1>${c[0]}</h1><section><h2>${c[2]}</h2><p>Promptya — <a href="https://promptya.app/">promptya.app</a></p></section><section><h2>${c[3]}</h2><p><a href="mailto:contact@promptya.app">contact@promptya.app</a></p></section><section><h2>${c[4]}</h2><p>Vercel Inc.<br>440 N Barranca Avenue #4133<br>Covina, CA 91723<br>${c[5]}</p><p><a href="https://vercel.com/legal/privacy-notice" rel="noopener">vercel.com</a></p></section></main>${siteFooter}</body></html>`);
for(const [locale,copy] of Object.entries(legalCopy)){
 if(locale==='fr')continue;
 const path=`content/locales/${locale}-overrides.json`;
 const dictionary=JSON.parse(await readFile(path,'utf8'));
 c.forEach((text,i)=>dictionary[text]=copy[i]);
 for(const text of ['contact@promptya.app','Promptya —','promptya.app','Vercel Inc.','440 N Barranca Avenue #4133','Covina, CA 91723','vercel.com'])dictionary[text]=text;
 dictionary[c[0]+' | Promptya']=copy[0]+' | Promptya';
 await writeFile(path,JSON.stringify(dictionary,null,2)+'\n');
}
