import {readFile} from 'node:fs/promises';
import {createHmac,timingSafeEqual,scryptSync,randomBytes} from 'node:crypto';
const attempts=new Map();
function equal(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function sign(payload,env){return createHmac('sha256',env.ADMIN_SESSION_SECRET).update(payload).digest('base64url');}
export function passwordSession(req,env=process.env){const value=req.headers.cookie?.match(/(?:^|;\s*)promptya_admin=([^;]+)/)?.[1];if(!env.ADMIN_SESSION_SECRET||!env.ADMIN_PASSWORD_HASH||!value?.startsWith('v1.'))return null;const [,payload,signature]=value.split('.');if(!payload||!signature||!equal(sign(payload,env),signature))return null;try{const data=JSON.parse(Buffer.from(payload,'base64url'));if(data.expires<Date.now()||data.version!==env.ADMIN_PASSWORD_HASH.slice(-16))return null;return {user:{id:env.ADMIN_USER_ID||'password-admin',passwordAdmin:true},token:value};}catch{return null;}}
const pages=new Map([['','index.html'],['index.html','index.html'],['traductions','traductions/index.html'],['traductions/index.html','traductions/index.html'],['recadrage','recadrage/index.html'],['recadrage/index.html','recadrage/index.html']]);
export async function verifyAdmin(req,env=process.env,request=fetch){
 const session=passwordSession(req,env);if(session)return session;
 if(!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY||!env.SUPABASE_SERVICE_ROLE_KEY)throw Object.assign(Error('Accès administrateur indisponible.'),{status:503});
 const bearer=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
 const token=bearer||req.headers.cookie?.match(/(?:^|;\s*)promptya_admin=([^;]+)/)?.[1];
 if(!token)throw Object.assign(Error('Authentification requise.'),{status:401});
 const auth=await request(env.SUPABASE_URL+'/auth/v1/user',{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)});
 if(!auth.ok)throw Object.assign(Error('Session expirée. Reconnectez-vous.'),{status:401});
 const user=await auth.json();if(!/^[a-f0-9-]{36}$/i.test(user.id||''))throw Object.assign(Error('Accès refusé.'),{status:403});
 const roles=await request(env.SUPABASE_URL+'/rest/v1/admins?user_id=eq.'+user.id+'&select=user_id',{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},signal:AbortSignal.timeout(10000)});
 if(!roles.ok)throw Object.assign(Error('Vérification des accès indisponible.'),{status:503});
 if(!(await roles.json()).length)throw Object.assign(Error('Accès réservé aux administrateurs.'),{status:403});
 return {user,token};
}
export async function adminSession(req,res){
 res.setHeader('Cache-Control','private, no-store');
 const secure=process.env.APP_URL?.startsWith('https:')?'; Secure':'';
 if(req.method==='DELETE'){res.setHeader('Set-Cookie','promptya_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'+secure);return res.status(200).json({ok:true});}
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée'});
 if(!process.env.APP_URL||req.headers.origin!==new URL(process.env.APP_URL).origin)return res.status(403).json({error:'Origine non autorisée'});
 if(req.body?.login!==undefined){
  if(!process.env.ADMIN_LOGIN||!process.env.ADMIN_PASSWORD_HASH||!process.env.ADMIN_SESSION_SECRET)return res.status(503).json({error:'Connexion administrateur indisponible.'});
  const key=req.headers['x-forwarded-for']?.split(',')[0]||req.socket?.remoteAddress||'unknown',now=Date.now();let entry=attempts.get(key);if(!entry||entry.until<now){entry={count:0,until:now+15*60*1000};attempts.set(key,entry);}if(entry.count>=5)return res.status(429).json({error:'Trop de tentatives. Réessayez dans quinze minutes.'});entry.count++;
  const {login,password}=req.body;if(typeof login!=='string'||typeof password!=='string'||password.length>256)return res.status(401).json({error:'Identifiants incorrects.'});
  const [salt,hash]=process.env.ADMIN_PASSWORD_HASH.split(':');const actual=scryptSync(password,salt,64).toString('hex');
  if(!equal(login,process.env.ADMIN_LOGIN)||!equal(actual,hash))return res.status(401).json({error:'Identifiants incorrects.'});
  attempts.delete(key);const payload=Buffer.from(JSON.stringify({expires:now+3600000,nonce:randomBytes(16).toString('hex'),version:process.env.ADMIN_PASSWORD_HASH.slice(-16)})).toString('base64url');const token='v1.'+payload+'.'+sign(payload,process.env);
  res.setHeader('Set-Cookie',`promptya_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${secure}`);return res.status(200).json({ok:true});
 }
 try{const {token}=await verifyAdmin(req);res.setHeader('Set-Cookie',`promptya_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${secure}`);return res.status(200).json({ok:true});}catch(e){return res.status(e.status||503).json({error:e.message});}
}
export async function adminPage(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Vary','Cookie');
 try{await verifyAdmin(req);}catch(e){res.statusCode=401;res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Accès administrateur | Promptya</title><body style="font-family:system-ui;max-width:520px;margin:15vh auto;padding:24px"><h1>Espace privé</h1><p>Connectez-vous avec un compte administrateur pour accéder à cet espace.</p><a href="/connexion-admin/">Se connecter →</a> · <a href="/">Revenir à l’accueil</a></body></html>');}
 const url=new URL(req.url,'http://localhost');const route=(url.searchParams.get('path')??(url.pathname==='/api/admin-page'?'':url.pathname.replace(/^\/admin\/?/i,''))).replace(/^\/+|\/+$/g,'');const page=pages.get(route);
 if(!page){res.statusCode=404;return res.end('Page introuvable');}
 try{const html=await readFile(new URL('../.server-ui/admin/'+page,import.meta.url));res.setHeader('Content-Type','text/html; charset=utf-8');res.statusCode=200;return res.end(html);}catch{res.statusCode=503;return res.end('Espace administrateur indisponible.');}
}
