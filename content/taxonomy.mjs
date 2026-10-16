const countries=`allemagne,argentine,australie,autriche,bresil,canada,chine,colombie,coree-du-sud,emirats,espagne,france,hongrie,indonesie,island,italie,japon,maroc,mexique,pays-bas,philippines,pologne,portugal,republique-tcheque,roumanie,russie,suisse,thailande,uk,ukraine,usa,venezuela`.split(',');
const cinema=`cinema-jacquette,disney,disney-3d,epic-sci-fi,film-par-scene,hollywood-fx-effect,scene-action-film,serie-tele`.split(',');
const nature=`animaux-reel,pole-nord,les-maldives,bali,corse,rovaniemi`.split(',');
const creative=`bonbon,glace,patisserie,plat-3d,jouet-geant,robe-drapeau,robe-santorini,noir-blanc-portrait`.split(',');
const events=`coachella,tomorowland,happynew-year,noel,noel-de-strasbourg,coupe-du-monde,foot-l1`.split(',');
export function taxonomy(p){let type=countries.includes(p.slug)?'pays':cinema.includes(p.slug)?'cinema':/^(cars|supercar|test-cars)$/.test(p.slug)?'automobile':events.includes(p.slug)?'evenement':nature.includes(p.slug)?'nature':creative.includes(p.slug)?'creation':p.slug==='lieu-iconique'||p.slug==='le-vatican'?'attraction':p.category==='sport'?'sport':'ville';
 const tags=[type,p.category,p.name,p.slug.replaceAll('-',' ')];
 if(['santorin','mykonos','robe-santorini','athenes'].includes(p.slug))tags.push('grece','cyclades','ile','mediterranee');
 if(['paris','france','noel-de-strasbourg'].includes(p.slug))tags.push('tour eiffel','louvre','monument','architecture');
 if(['patisserie','plat-3d','jouet-geant','bonbon','disney-3d'].includes(p.slug))tags.push('3d','miniatures','surrealiste');
 if(cinema.includes(p.slug))tags.push('film','affiche','effets speciaux','fiction');
 if(events.includes(p.slug))tags.push('fete','festival');
 const region=['mykonos','santorin','athenes','robe-santorini'].includes(p.slug)?'europe':countries.includes(p.slug)&&['japon','chine','coree-du-sud','indonesie','philippines','thailande'].includes(p.slug)?'asie':p.category==='voyage'?'voyage':'creation';
 return {type,tags,region};}
export const typeLabels={pays:'Pays',ville:'Villes',cinema:'Cinéma & animation',attraction:'Lieux & attractions',nature:'Nature & îles',automobile:'Automobile',evenement:'Fêtes & événements',creation:'Création & 3D',sport:'Sport'};
export const cityCountries={paris:'france','noel-de-strasbourg':'france',courchevel:'france',corse:'france','saint-tropez':'france',mykonos:'grece',santorin:'grece','robe-santorini':'grece',athenes:'grece',bali:'indonesie',barcelone:'espagne',ibiza:'espagne',beiijing:'chine',shanghai:'chine',berlin:'allemagne',bucarest:'roumanie',budapest:'hongrie',cancun:'mexique',coachella:'usa',dubai:'emirats',geneve:'suisse',kiev:'ukraine','las-vegas':'usa','le-caire':'egypte','le-vatican':'vatican',lisbonne:'portugal',londres:'uk','los-angeles':'usa',marrakech:'maroc',miami:'usa',milan:'italie',moscou:'russie','new-york':'usa',oslo:'norvege',portofino:'italie',pragues:'republique-tcheque',quebec:'canada','rio-de-juanero':'bresil',rome:'italie',rovaniemi:'finlande',seoul:'coree-du-sud',sydney:'australie',tokyo:'japon',venise:'italie',vienne:'autriche','les-maldives':'maldives'};
export const countryLabels={grece:'Grèce',egypte:'Égypte',vatican:'Vatican',norvege:'Norvège',finlande:'Finlande',maldives:'Maldives',uk:'Royaume-Uni',usa:'États-Unis',emirats:'Émirats arabes unis'};
export const countryFor=p=>cityCountries[p.slug]||(countries.includes(p.slug)?p.slug:'');
