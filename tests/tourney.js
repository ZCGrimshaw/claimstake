const HS=require('../src/engine.js'), B=require('../src/bots.js'), D=require('../src/data.js');
function game(n,seed,levels,opts){ const players=[...Array(n)].map((_,i)=>({name:'B'+i,kind:'bot',level:levels[i]})); const s=HS.newGame({seed,players,opts}); B.runBots(s); return s; }
const N=+process.argv[2]||300;
// level ordering in 4p: levels [1,2,3,3] rotated through seats
const win={1:0,2:0,3:0}, app={1:0,2:0,3:0}, sc={1:[],2:[],3:[]};
const seat=[0,0,0,0], built={}, passRound=Array(11).fill(0), bidRound=Array(11).fill(0);
for(let i=0;i<N;i++){
  const base=[1,2,3,3]; const rot=i%4; const lv=base.map((_,k)=>base[(k+rot)%4]);
  const s=game(4,'t'+i,lv);
  const w=s.result.winners; w.forEach(x=>{ win[lv[x]]+=1/w.length; seat[x]+=1/w.length; });
  s.players.forEach((p,k)=>{ app[lv[k]]++; sc[lv[k]].push(s.result.scores[k].total); p.blds.forEach(b=>{ if(b.id!=='cabin') built[b.id]=(built[b.id]||0)+1; }); });
}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
console.log('4p mixed levels (Greenhorn, Homesteader, Baron x2): win rate per appearance');
[1,2,3].forEach(l=>console.log(l,B.LEVELS[l].name,'win',(win[l]/app[l]).toFixed(3),'mean score',mean(sc[l]).toFixed(1)));
console.log('seat win shares (seat order)',seat.map(x=>(x/N).toFixed(3)).join(' '));
const ids=D.BUILDINGS.filter(b=>b.id!=='cabin');
const total=ids.map(b=>[b.name,(built[b.id]||0)/ (N*1)]).sort((a,b)=>a[1]-b[1]);
console.log('least built per game:',total.slice(0,8).map(x=>x[0]+' '+x[1].toFixed(2)).join(', '));
console.log('most built per game:',total.slice(-8).map(x=>x[0]+' '+x[1].toFixed(2)).join(', '));
