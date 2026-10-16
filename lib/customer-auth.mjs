const cookie=(req,name)=>req.headers.cookie?.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'))?.[1];
const problem=(message,status=400)=>Object.assign(Error(message),{status});
function cookies(res,session,env){const secure=env.APP_URL?.startsWith('https:')?'; Secure':'';res.setHeader('Set-Cookie',[`promptya_access=${session.access_token||''}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${session.access_token?Math.min(session.expires_in||3600,3600):0}${secure}`,`promptya_refresh=${session.refresh_token||''}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${session.refresh_token?2592000:0}${secure}`]);res.setHeader('Cache-Control','private, no-store');}
async function request(env,path,{method='GET',body,token}={}){if(!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY)throw problem('La connexion est temporairement indisponible.',503);const r=await fetch(env.SUPABASE_URL+'/auth/v1/'+path,{method,headers:{apikey:env.SUPABASE_ANON_KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});const data=await r.json().catch(()=>({}));if(!r.ok)throw problem(r.status===429?'Trop de tentatives. Réessayez plus tard.':'Connexion impossible. Vérifiez vos informations et la confirmation de votre adresse e-mail.',r.status===429?429:401);return data;}
export async function customer(req,res,env){const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]||cookie(req,'promptya_access');if(token){try{return {...await request(env,'user',{token}),_accessToken:token};}catch(e){if(req.headers.authorization)throw e;}}const refresh=cookie(req,'promptya_refresh');if(refresh){try{const session=await request(env,'token?grant_type=refresh_token',{method:'POST',body:{refresh_token:refresh}});cookies(res,session,env);return {...session.user,_accessToken:session.access_token};}catch{cookies(res,{},env);}}throw problem('Connectez-vous pour accéder à votre espace.',401);}
export async function authRoute(route,req,res,env){
 const send=(code,data)=>res.status(code).json(data);res.setHeader('Cache-Control','private, no-store');
 try{
 if(route==='auth/me'&&req.method==='GET'){const u=await customer(req,res,env);return send(200,{id:u.id,email:u.email});}
 if(req.method!=='POST')return send(405,{error:'Méthode non autorisée'});
 if(!env.APP_URL||req.headers.origin!==new URL(env.APP_URL).origin)return send(403,{error:'Origine non autorisée'});
 const body=req.body||{};
 if(route==='auth/logout'){const token=cookie(req,'promptya_access');if(token)await request(env,'logout',{method:'POST',token}).catch(()=>{});cookies(res,{},env);return send(200,{ok:true});}
 if(route==='auth/session'){if(typeof body.access_token!=='string'||body.access_token.length>8192)return send(400,{error:'Session invalide'});await request(env,'user',{token:body.access_token});cookies(res,{access_token:body.access_token,refresh_token:typeof body.refresh_token==='string'?body.refresh_token:undefined,expires_in:3600},env);return send(200,{ok:true});}
 if(route==='auth/password'){const u=await customer(req,res,env);if(!u.id)throw problem('Session invalide',401);if(typeof body.password!=='string'||body.password.length<12||body.password.length>256)throw problem('Choisissez un mot de passe de 12 à 256 caractères.');await request(env,'user',{method:'PUT',token:u._accessToken,body:{password:body.password}});return send(200,{ok:true});}
 if(typeof body.email!=='string'||!/^\S+@\S+\.\S+$/.test(body.email)||body.email.length>254)throw problem('Renseignez une adresse e-mail valide.');
 if(route==='auth/recover'){await request(env,'recover?redirect_to='+encodeURIComponent(env.APP_URL+'/compte/?recovery=1'),{method:'POST',body:{email:body.email}});return send(200,{ok:true});}
 if(!['auth/signup','auth/signin'].includes(route))return send(404,{error:'Route introuvable'});
 if(typeof body.password!=='string'||body.password.length<12||body.password.length>256)throw problem('Choisissez un mot de passe de 12 à 256 caractères.');
 const session=await request(env,route==='auth/signup'?'signup?redirect_to='+encodeURIComponent(env.APP_URL+'/compte/'):'token?grant_type=password',{method:'POST',body:{email:body.email,password:body.password}});
 if(session.access_token)cookies(res,session,env);return send(200,{ok:true,confirmationRequired:!session.access_token});
 }catch(e){return send(e.status||503,{error:e.message});}
}
