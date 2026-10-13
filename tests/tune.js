const HS=require('../src/engine.js'), B=require('../src/bots.js');
const N=+process.argv[2]||400;
const target=+process.argv[3]||3; // which level slot to tune
function evalParams(P,seedBase){
  const saved=Object.assign({},B.LEVELS[target]); Object.assign(B.LEVELS[target],P);
  let win=0,score=0,cnt=0;
  const others=target===3?2:target===2?1:3;
  for(let i=0;i<N;i++){
    const lv=[target,others,others,others]; const rot=i%4; const L=lv.map((_,k)=>lv[(k+rot)%4]);
    const players=L.map((l,k)=>({name:'B'+k,kind:'bot',level:l}));
    const s=HS.newGame({seed:seedBase+i,players}); B.runBots(s);
    const me=L.indexOf(target); const w=s.result.winners; if(w.includes(me)) win+=1/w.length; score+=s.result.scores[me].total; cnt++;
  }
  Object.assign(B.LEVELS[target],saved);
  return {win:win/cnt,score:score/cnt};
}
let best=Object.assign({},B.LEVELS[target]); let bs=evalParams(best,'T');
console.log('start',JSON.stringify(best),bs);
const grid={aggr:[0.85,0.95,1.05,1.15,1.3],pass:[0.5,0.7,0.9,1.1,1.4],debt:[1,2,3,4],vpv:[2,2.5,3,3.5],trade:[2,3,4,5]};
for(let round=0;round<2;round++){
  for(const k of Object.keys(grid)){
    for(const v of grid[k]){
      const P=Object.assign({},best,{[k]:v}); const r=evalParams(P,'T');
      if(r.win+r.score/400>bs.win+bs.score/400){ best=P; bs=r; console.log('improve',k,v,JSON.stringify(r)); }
    }
  }
}
// confirm on fresh seeds
console.log('best',JSON.stringify(best),'fresh',JSON.stringify(evalParams(best,'FRESH')));
