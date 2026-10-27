const HS=require('../src/engine.js'), B=require('../src/bots.js'), D=require('../src/data.js');
function play(n,seed,opts,levels){
  const players=[]; for(let i=0;i<n;i++) players.push({name:'B'+i,kind:'bot',level:(levels&&levels[i])||2});
  const s=HS.newGame({seed,players,opts});
  B.runBots(s);
  return s;
}
function check(s){
  const errs=[];
  const sum=(f)=>s.players.reduce((a,p)=>a+f(p),0);
  for(const r of D.RES){ const init=s.opts.limitedSupply?D.SUPPLY[r]:999; if(s.sup[r]+sum(p=>p.res[r])!==init) errs.push('res conservation '+r+' '+(s.sup[r]+sum(p=>p.res[r]))+' vs '+init); }
  if(s.sup.trade+sum(p=>p.trade)!==36) errs.push('trade conservation');
  if(s.opts.oneEach!==false) s.players.forEach(p=>{const seen={}; p.blds.forEach(b=>{ if(seen[b.id]) errs.push('duplicate building '+b.id+' for '+p.name); seen[b.id]=1; });});
  if(s.sup.debt+sum(p=>p.debt)!==36) errs.push('debt conservation');
  if(s.sup.worker+sum(p=>p.workers)!==25) errs.push('worker conservation '+(s.sup.worker+sum(p=>p.workers)));
  if(s.sup.line+sum(p=>p.lines)!==27) errs.push('line conservation');
  s.players.forEach(p=>{ if(p.silver<0||p.trade<0||p.debt<0||RES_NEG(p)) errs.push('negative '+p.name); });
  if(!s.over) errs.push('not over');
  return errs;
}
function RES_NEG(p){return Object.values(p.res).some(v=>v<0);}
module.exports={play,check};
if(require.main===module){
  const N=+process.argv[2]||200; let bad=0, t=Date.now();
  const stats={};
  for(const n of [2,3,4]){
    const sc=[],bl=[];
    for(let i=0;i<N;i++){
      let s;
      try{ s=play(n,'g'+n+'_'+i); }catch(e){ console.log('EXC',n,i,e.message); bad++; continue; }
      const e=check(s); if(e.length){ bad++; if(bad<6) console.log(n,i,e); }
      s.result.scores.forEach(x=>sc.push(x.total)); s.players.forEach(p=>bl.push(p.blds.length-1));
    }
    const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
    console.log(n+'p mean score',mean(sc).toFixed(1),'min',Math.min(...sc),'max',Math.max(...sc),'mean buildings',mean(bl).toFixed(2));
  }
  console.log('bad games',bad,'ms',Date.now()-t);
}
