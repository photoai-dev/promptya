import {readFile,mkdir} from 'node:fs/promises';
import {writeFile} from '../lib/fs-safe.mjs';
import {editorial} from '../content/collections.mjs';
import {locales,names,packCopy,commonCopy} from '../content/locales/regional-copy.mjs';
const snapshotPath='content/locales/editorial-snapshot.json';
const snapshot=JSON.parse(await readFile(snapshotPath,'utf8'));
const patches=[],report={scope:'Reviewed pack names, repeated pack headings, pack SEO templates and selected shared product copy. Full guide/article and regional editorial review is still required.',languages:{}};
for(const [index,locale] of locales.entries()){
 const path=`content/locales/${locale}-overrides.json`;
 const original=JSON.parse(await readFile(`content/locales/${locale}.json`,'utf8'));
 const overrides=JSON.parse(await readFile(path,'utf8'));
 const dictionary={...original,...overrides},reviewed={};
 for(const [source,values] of Object.entries(names))reviewed[source]=values[index];
 for(const [source,values] of Object.entries(commonCopy))reviewed[source]=values[index];
 const tr=source=>reviewed[source]||dictionary[source]||source;
 const copy=packCopy[locale];
 for(const e of Object.values(editorial)){
  const n=tr(e.name);
  reviewed[`Combien coûte la collection ${e.name} ?`]=copy.price(n);
  reviewed[`Comment personnaliser mes images ${e.name} ?`]=copy.personalise(n);
  reviewed[`Quel univers propose le pack ${e.name} ?`]=copy.universe(n);
  reviewed[`Créer mon pack ${e.name} →`]=copy.cta(n);
  reviewed[`Pack ${e.name} : images IA personnalisées | Promptya`]=copy.title(n);
  reviewed[`Créer une série IA dans l’univers ${e.name}.`]=copy.heading(n);
  reviewed[`Quatre exemples du pack ${e.name}.`]=copy.examples(n);
  const description=`${e.name} en images IA : ${e.scenes.slice(0,2).map(s=>s.title).join(', ')}. Créez de 1 à 100 images à 22,90 €, avec référence compatible et ZIP.`;
  reviewed[description]=copy.meta(n,...e.scenes.slice(0,2).map(s=>tr(s.title)));
 }
 Object.assign(overrides,reviewed);
 await writeFile(path,JSON.stringify(overrides,null,2)+'\n');
 for(const row of snapshot.filter(r=>r.locale===locale)){
  for(const [key,block] of Object.entries(row.blocks)){
   if(reviewed[block.source]&&reviewed[block.source]!==block.text){
    patches.push({locale,route:row.source_route,key,source:block.source,before:block.text,after:reviewed[block.source]});
    block.text=reviewed[block.source];
   }
  }
  const e=Object.values(editorial).find(e=>row.source_route===`/packs/${Object.keys(editorial).find(k=>editorial[k]===e)}/`);
  if(e){
   const titleSource=`Pack ${e.name} : images IA personnalisées | Promptya`;
   if(row.title!==reviewed[titleSource]){patches.push({locale,route:row.source_route,field:'title',before:row.title,after:reviewed[titleSource]});row.title=reviewed[titleSource];}
   const description=`${e.name} en images IA : ${e.scenes.slice(0,2).map(s=>s.title).join(', ')}. Créez de 1 à 100 images à 22,90 €, avec référence compatible et ZIP.`;
   if(row.description!==reviewed[description]){patches.push({locale,route:row.source_route,field:'description',before:row.description,after:reviewed[description]});row.description=reviewed[description];}
  }
 }
 report.languages[locale]={reviewedKeys:Object.keys(reviewed).length,changedBlocks:patches.filter(p=>p.locale===locale).length,completeEditorialReview:false};
}
await writeFile(snapshotPath,JSON.stringify(snapshot));
await mkdir('.local',{recursive:true});
await writeFile('.local/regional-copy-patches.json',JSON.stringify(patches));
await writeFile('content/locales/regional-review.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
