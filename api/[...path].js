import {handler} from '../lib/cloud.mjs';
export const config={api:{bodyParser:false}};
export default async function(req,res){
  if(req.method==='POST'&&!req.url.startsWith('/api/stripe-webhook')){
    let raw='';for await(const c of req){raw+=c;if(raw.length>6000000)return res.status(413).json({error:'Requête trop volumineuse'});}
    try{req.body=JSON.parse(raw||'{}');}catch{return res.status(400).json({error:'JSON invalide'});}
  }
  return handler(req,res);
}
