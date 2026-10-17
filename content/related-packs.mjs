import {editorial} from './collections.mjs';
import {taxonomy} from './taxonomy.mjs';
import {suppliedExamples} from './media.mjs';
const families=[
'usa,new-york,miami,los-angeles,las-vegas,hollywood-fx-effect',
'mykonos,santorin,robe-santorini,athenes,corse,ibiza,saint-tropez,monaco,portofino',
'les-maldives,bali,indonesie,philippines,thailande,cancun,mexique,miami,ibiza,sydney,australie',
'france,paris,noel-de-strasbourg,corse,saint-tropez,courchevel',
'italie,rome,milan,venise,portofino,le-vatican',
'uk,londres,allemagne,berlin,autriche,vienne,suisse,geneve',
'japon,tokyo,chine,beiijing,shanghai,coree-du-sud,seoul,singapore',
'maroc,marrakech,le-caire,dubai,emirats',
'russie,moscou,pologne,ukraine,kiev,hongrie,budapest,roumanie,bucarest,republique-tcheque,pragues',
'canada,quebec,oslo,island,pole-nord,rovaniemi,suisse,autriche,courchevel,noel',
'espagne,barcelone,ibiza,portugal,lisbonne',
'bresil,rio-de-juanero,argentine,colombie,venezuela,mexique',
'disney-3d,disney,jouet-geant,plat-3d,patisserie,bonbon,glace',
'cinema-jacquette,film-par-scene,scene-action-film,hollywood-fx-effect,epic-sci-fi,serie-tele,disney',
'cars,test-cars,supercar,scene-action-film,sport-action,coupe-du-monde,foot-l1,monaco',
'coachella,tomorowland,happynew-year,noel,noel-de-strasbourg',
'noir-blanc-portrait,robe-drapeau,robe-santorini,lieu-iconique,cinema-jacquette'
].map(s=>s.split(','));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function relatedPackCards(slug,catalog){
 const current=catalog.find(p=>p.slug===slug);if(!current)return '';const e=editorial[slug],type=taxonomy(current).type;
 const score=p=>{let n=0;if(e.related.includes(p.slug))n+=80;if(editorial[p.slug].related.includes(slug))n+=35;for(const family of families)if(family.includes(slug)&&family.includes(p.slug))n+=50;if(taxonomy(p).type===type)n+=12;if(current.category===p.category)n+=5;return n;};
 const related=catalog.filter(p=>p.slug!==slug).sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name,'fr')).slice(0,8);
 return `<section class="related-packs related-visual" id="autres-collections"><span class="eyebrow">POUR COMPARER LES UNIVERS</span><h2>D’autres collections à découvrir.</h2><div class="related-pack-grid">${related.map(p=>{const name=editorial[p.slug].name,image=p.thumbnail?'/assets/'+p.image:suppliedExamples[p.slug]?.[0]?.url||'/assets/'+p.image;return `<a class="related-pack-card" href="/packs/${p.slug}/"><img src="${esc(image)}" alt="Univers du pack ${esc(name)}" loading="lazy" width="640" height="360"><div><h3>${esc(name)}</h3><span>Découvrir le pack ↗</span></div></a>`}).join('')}</div><a class="related-catalog-link" href="/packs/">Toutes les collections →</a></section>`;
}
