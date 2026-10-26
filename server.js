const e=require("express")();
e.use(require("express").json());
const f=require("fs"),h=require("crypto");
const L=()=>{try{return JSON.parse(f.readFileSync("ledger.json"))}catch{return[]}};
e.post("/verify",(q,s)=>{const l=L(),p=l.length?l[l.length-1].hash:"0",x={id:l.length+1,...q.body,prevHash:p,timestamp:new Date().toISOString()};x.hash=h.createHash("sha256").update(JSON.stringify(x)).digest("hex");l.push(x);f.writeFileSync("ledger.json",JSON.stringify(l,null,2));s.json(x)});
e.get("/ledger",(q,s)=>s.json(L()));
e.listen(3000);
