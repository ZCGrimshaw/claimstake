const fs=require('fs');
const r=f=>fs.readFileSync(__dirname+'/'+f,'utf8');
const cover='window.CLAIM_COVER="data:image/webp;base64,'+fs.readFileSync(__dirname+'/assets/cover.webp').toString('base64')+'";\n';
const js=cover+['src/data.js','src/engine.js','src/bots.js','ui/art.js','ui/ui.js'].map(r).join('\n;\n').replace(/<\/script>/g,'<\\/script>');
const head=`<title>Claimstake</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=Zilla+Slab:wght@600;700&display=swap">
<style>${r('ui/style.css')}</style>`;
const body=`<div id="app"></div><div class="toasts" id="toasts" aria-live="polite"></div>
<script>${js}</script>`;
fs.writeFileSync(__dirname+'/dist/claimstake.artifact.html',head+'\n'+body);
fs.writeFileSync(__dirname+'/dist/claimstake.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${head}</head><body>${body}</body></html>`);
console.log('built',fs.statSync(__dirname+'/dist/claimstake.html').size);
