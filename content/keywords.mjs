import {articles} from './blog.mjs';
const extra=[
 ['générateur photo IA','/blog/photo-ia-personnalisee/','Informationnelle'],
 ['création photo intelligence artificielle','/blog/photo-ia-personnalisee/','Informationnelle'],
 ['shooting virtuel IA','/blog/shooting-photo-ia/','Informationnelle'],
 ['portrait IA personnalisé','/blog/photo-reference-ia/','Informationnelle'],
 ['générateur portrait réaliste','/blog/photo-ia-realiste/','Informationnelle'],
 ['pack photos IA','/packs/','Transactionnelle'],
 ['pack photo IA Paris','/packs/paris/','Transactionnelle'],
 ['pack photo IA Mykonos','/packs/mykonos/','Transactionnelle'],
 ['pack photo IA Santorin','/packs/santorin/','Transactionnelle'],
 ['pack photo IA Dubaï','/packs/dubai/','Transactionnelle'],
 ['pack photo IA New York','/packs/new-york/','Transactionnelle'],
 ['pack photo IA Japon','/packs/japon/','Transactionnelle'],
 ['photo IA supercar','/packs/supercar/','Transactionnelle'],
 ['photo IA robe Santorin','/packs/robe-santorini/','Transactionnelle'],
 ['photo IA cinéma','/packs/film-par-scene/','Transactionnelle'],
 ['photo monde miniature IA','/univers/miniatures-3d/','Commerciale'],
 ['mascotte IA à vendre','/viral-trend/','Transactionnelle'],
 ['acheter personnage exclusif','/viral-trend/','Transactionnelle'],
 ['générateur cover album IA','/covers/','Commerciale — service distinct'],
 ['forfait photos IA','/tarifs/','Transactionnelle']
];
const core=new Set(['photo IA personnalisée','shooting photo IA','photo IA réaliste','photo de référence IA','prix shooting photo IA','pochette album IA','mascotte exclusive','photo de mode IA','shooting photo IA Paris','miniatures 3D IA']);
export const keywords=[...articles.map(a=>({keyword:a.keyword,path:'/blog/'+a.slug+'/',intent:'Informationnelle',priority:core.has(a.keyword)?'P1':'P2'})),...extra.map(([keyword,path,intent])=>({keyword,path,intent,priority:intent==='Transactionnelle'?'P1':'P2'}))];
