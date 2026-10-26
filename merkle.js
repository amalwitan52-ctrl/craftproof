const f=require("fs"),h=require("crypto");
const l=JSON.parse(f.readFileSync("ledger.json"));
if(!l.length){console.log("EMPTY");process.exit(0)}
let y=l.map(e=>h.createHash("sha256").update(e.hash).digest("hex"));
while(y.length>1){const n=[];for(let i=0;i<y.length;i+=2){const a=y[i],b=y[i+1]||a;n.push(h.createHash("sha256").update(a+b).digest("hex"))}y=n}
console.log(y[0]);
