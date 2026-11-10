const fs=require('fs');
const r=f=>fs.readFileSync(__dirname+'/'+f,'utf8');
const cover='window.CLAIM_COVER="data:image/webp;base64,'+fs.readFileSync(__dirname+'/assets/cover.webp').toString('base64')+'";\n';
const cfg=process.argv.includes('--web')?'window.CLAIM_CFG={url:"https://iebutksrypqzohumllal.supabase.co",key:"sb_publishable_VxxsgQuKKQM807zeScKZow_G0WYVnAg"};\n':'';
const js=cfg+cover+['src/data.js','src/engine.js','src/bots.js','ui/art.js','ui/art2.js','ui/icons2.js','ui/supa.js','ui/ui.js'].map(r).join('\n;\n').replace(/<\/script>/g,'<\\/script>');
const icons=fs.readFileSync(__dirname+'/assets/favicon-links.html','utf8');
const head=`<title>Claimstake</title>
${icons}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=Zilla+Slab:wght@600;700&display=swap">
<style>${r('ui/style.css')}</style>`;
const body=`<div id="app"></div><div class="toasts" id="toasts" aria-live="polite"></div>
<script>${js}</script>
<script>/* Zero Crunch anonymous usage counter: random id, active seconds only; respects Do Not Track */
(function(a){try{if(navigator.doNotTrack==='1')return;var S='https://xtbsmtystiozdogielrd.supabase.co/rest/v1/rpc/zc_ping',K='sb_publishable_PJJnI2sfHAgoy0KnTIg6fQ_Jov1DbwY',r=function(){return(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)+Math.random().toString(36).slice(2)).replace(/-/g,'')},v;try{v=localStorage.getItem('zc-vid');if(!v){v=r();localStorage.setItem('zc-vid',v)}}catch(e){v=r()}var s=r(),t=0,last=Date.now(),sent=-1;['pointerdown','keydown','touchstart','wheel'].forEach(function(e){addEventListener(e,function(){last=Date.now()},{passive:true})});setInterval(function(){if(document.visibilityState==='visible'&&Date.now()-last<300000)t++},1000);function p(){if(t===sent)return;sent=t;try{fetch(S,{method:'POST',keepalive:true,headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'},body:JSON.stringify({p_vid:v,p_sid:s,p_app:a,p_secs:t})}).catch(function(){})}catch(e){}}p();setInterval(p,30000);addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')p()});addEventListener('pagehide',p)}catch(e){}})('claimstake');</script>`;
fs.writeFileSync(__dirname+'/dist/claimstake.artifact.html',head+'\n'+body);
fs.writeFileSync(__dirname+'/dist/claimstake.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${head}</head><body>${body}</body></html>`);
console.log('built',fs.statSync(__dirname+'/dist/claimstake.html').size);
