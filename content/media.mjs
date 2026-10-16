export const mediaGallery=[
 ['feerie-livre-vivant.webp','Un livre transformé en bibliothèque miniature','animation'],['feerie-chateau-sable.webp','Un château de sable et ses bâtisseurs miniatures','animation'],['feerie-jardin-miniature.webp','Une plante et ses jardiniers miniatures','animation'],['feerie-atelier-poterie.webp','Un atelier de poterie miniature','animation'],['feerie-bureau-miniature.webp','Une équipe miniature sur un bureau','animation'],['feerie-beaute-studio.webp','Des artistes miniatures en studio beauté','animation'],['feerie-rencontre-3d.webp','Rencontre avec un personnage 3D au restaurant','animation'],['feerie-beaute-portrait.webp','Portrait et artistes miniatures','animation'],['feerie-beaute-rose-panorama.webp','Panorama beauté et artistes miniatures','animation'],['feerie-beaute-atelier-panorama.webp','Atelier beauté en panorama','animation'],
 ['paris-palais-royal.webp','Paris — galeries et lumière de pierre','paris'],['paris-opera.webp','Paris — Opéra Garnier','paris'],['paris-tour-eiffel.webp','Paris — tour Eiffel au soleil couchant','paris'],['paris-arc-triomphe.webp','Paris — Arc de Triomphe','paris'],['paris-louvre.webp','Paris — pyramide du Louvre','paris'],
 ['supercar-rouge.webp','Automobile — supercar rouge','supercar'],['portrait-supercar.webp','Automobile — portrait et carrosserie','supercar'],
 ['miniatures-musique.webp','Miniatures 3D — orchestre sur un violoncelle','miniatures'],['miniatures-puzzle.webp','Miniatures 3D — atelier dans un puzzle','miniatures'],['miniatures-fruits.webp','Miniatures 3D — monde miniature sur des fruits','miniatures'],['miniatures-maison.webp','Miniatures 3D — scène de maison','miniatures'],['miniatures-patisserie.webp','Pâtisserie — les artisans miniatures','patisserie'],
 ['santorin-portrait.webp','Santorin — portrait et dômes bleus','santorin'],['animation-3d-rencontre.webp','Animation 3D — rencontre au restaurant','animation'],['mode-aurores.webp','Mode fantastique — robe lumineuse et aurores','mode'],
 ['beaute-atelier-bandeau.webp','Beauté — atelier miniature de maquillage','beaute'],['beaute-miniatures-bandeau.webp','Beauté — composition miniature','beaute'],['beaute-miniatures-portrait.webp','Beauté — portrait en atelier miniature','beaute'],
 ['glamour-rooftop.webp','Glamour — portrait en dentelle sur les toits','glamour'],['mode-sportswear.webp','Sportswear — portrait éditorial','sport'],['portraits-realistes.webp','Recherche de réalisme — étude de portraits','portraits'],['cover-album-chihuahua.webp','Cover d’album — portrait et chihuahua','covers']
].map(([file,alt,theme])=>({url:'/assets/gallery/'+file,alt,theme,source:'Visuel fourni par le créateur de Promptya'}));
const find=file=>mediaGallery.find(m=>m.url.endsWith('/'+file));
export const suppliedExamples={
 paris:['paris-louvre.webp','paris-opera.webp','paris-tour-eiffel.webp','paris-arc-triomphe.webp'].map(find),
 france:['paris-palais-royal.webp','paris-opera.webp','paris-tour-eiffel.webp','paris-arc-triomphe.webp'].map(find),
 supercar:['supercar-rouge.webp','portrait-supercar.webp'].map(find),cars:['supercar-rouge.webp','portrait-supercar.webp'].map(find),'test-cars':['supercar-rouge.webp','portrait-supercar.webp'].map(find),
 santorin:['santorin-portrait.webp'].map(find),'robe-santorini':['santorin-portrait.webp'].map(find),
 patisserie:['miniatures-patisserie.webp'].map(find),bonbon:['miniatures-fruits.webp'].map(find),
 'disney-3d':['feerie-livre-vivant.webp','feerie-chateau-sable.webp','feerie-jardin-miniature.webp','feerie-atelier-poterie.webp'].map(find),disney:['animation-3d-rencontre.webp'].map(find),
 'sport-action':['mode-sportswear.webp'].map(find)
};
