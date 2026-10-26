const f=require("fs"),h=require("crypto");
const l=JSON.parse(f.readFileSync("ledger.json"));
let ok=true;
for(let i=0;i<l.length;i++){
const e={id:l[i].id,actor:l[i].actor,artifactHash:l[i].artifactHash,context:l[i].context,prevHash:l[i].prevHash,timestamp:l[i].timestamp};
if(h.createHash("sha256").update(JSON.stringify(e)).digest("hex")!==l[i].hash){ok=false;console.log("TAMPERED",l[i].id)}
if(i>0&&l[i].prevHash!==l[i-1].hash){ok=false;console.log("BROKEN",l[i].id)}
}
console.log(ok?"LEDGER OK":"LEDGER INVALID");
process.exit(ok?0:1);
