const express=require('express');
const cors=require('cors');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const app=express();
app.use(cors());
app.use(express.json({limit:'100kb'}));
app.use(express.static(path.join(__dirname,'public')));
const FILE=path.join(__dirname,'ledger.json');
const load=()=>{try{return JSON.parse(fs.readFileSync(FILE))}catch{return[]}};
const save=d=>fs.writeFileSync(FILE,JSON.stringify(d,null,2));
const buckets=new Map();
function rate(key,max,win){const now=Date.now();const b=buckets.get(key);if(!b||b.reset<now){buckets.set(key,{n:1,reset:now+win});return true}if(++b.n>max)return false;return true}
function integrity(ledger){
  for(let i=0;i<ledger.length;i++){
    const e={id:ledger[i].id,actor:ledger[i].actor,artifactHash:ledger[i].artifactHash,context:ledger[i].context,prevHash:ledger[i].prevHash,timestamp:ledger[i].timestamp};
    if(crypto.createHash('sha256').update(JSON.stringify(e)).digest('hex')!==ledger[i].hash)return false;
    if(i>0&&ledger[i].prevHash!==ledger[i-1].hash)return false;
  }
  return true;
}
app.post('/verify',(req,res)=>{
  const ip=req.ip||'x';
  if(!rate('v:'+ip,20,60000))return res.status(429).json({error:'too many requests'});
  const {actor,artifactHash,context}=req.body||{};
  if(!actor||!artifactHash)return res.status(400).json({error:'actor and artifactHash required'});
  if(typeof actor!=='string'||actor.length>80)return res.status(400).json({error:'actor invalid'});
  if(typeof artifactHash!=='string'||artifactHash.length>128)return res.status(400).json({error:'hash invalid'});
  const ledger=load();
  const prevHash=ledger.length?ledger[ledger.length-1].hash:'0';
  const entry={id:ledger.length+1,actor:actor.trim(),artifactHash:artifactHash.trim(),context:context||{},prevHash,timestamp:new Date().toISOString()};
  entry.hash=crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
  ledger.push(entry);
  save(ledger);
  res.json(entry);
});
app.get('/ledger',(req,res)=>res.json(load()));
app.get('/verify/:id',(req,res)=>{
  const e=load().find(x=>x.id==req.params.id);
  if(!e)return res.status(404).json({error:'not found'});
  res.json(e);
});
app.get('/api/stats',(req,res)=>{
  const l=load();
  const users=new Set(l.map(e=>e.actor));
  res.json({total:l.length,users:users.size,firstAt:l.length?l[0].timestamp:null,lastAt:l.length?l[l.length-1].timestamp:null,integrity:integrity(l)});
});
app.get('/api/user/:handle',(req,res)=>{
  const h=req.params.handle;
  const l=load().filter(e=>e.actor===h);
  if(!l.length)return res.status(404).json({error:'no entries for this user'});
  res.json({handle:h,count:l.length,entries:l});
});
app.get('/u/:handle',(req,res)=>res.sendFile(path.join(__dirname,'public','user.html')));
app.get('/dashboard',(req,res)=>res.sendFile(path.join(__dirname,'public','dashboard.html')));
app.listen(3000,()=>console.log('CraftProof V2 on 3000'));
