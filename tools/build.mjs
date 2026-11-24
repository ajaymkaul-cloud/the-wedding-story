// Builds one wedding page from template/wedding.html.
// Usage: node tools/build.mjs aditi-ishaan   (reads weddings/aditi-ishaan.js)
import fs from 'fs'; import vm from 'vm'; import path from 'path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const slug=process.argv[2]; if(!slug){console.error('Usage: node tools/build.mjs <wedding-slug>');process.exit(1);}
const ctx={window:{}}; vm.createContext(ctx);
const run=(f)=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
run(`weddings/${slug}.js`); const W=ctx.window.WS_WEDDING;
run('engine/strings.js'); run(`packs/${W.pack}.js`); W.looks.forEach(l=>run(`looks/${l}.js`));
const P=ctx.window.WS_PACK, LOOKS=ctx.window.WS_LOOKS, E=ctx.window.WS_ENGINE_T;
const en=Object.assign({},E.en,P.T.en,...W.looks.map(l=>LOOKS[l].T.en),W.T.en);
const tk=W.tokens.en, fill=s=>typeof s==='string'?s.replace(/\{(bride|groom|bride_family|groom_family)\}/g,(m,k)=>tk[k]??m):s;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const look=W.look, looks=W.looks;
const pick=looks.length>1?`    <span class="theme-pick" role="group" aria-label="Look"><span data-i18n="theme_l">Look</span>\n${looks.map(l=>`      <button type="button" data-set-theme="${l}">${LOOKS[l].label||l[0].toUpperCase()+l.slice(1)}</button>`).join('\n')}\n    </span>\n`:'';
const V={
 robots:W.noindex?'<meta name="robots" content="noindex,nofollow">\n':'',
 look, looks_ok:'{'+looks.map(l=>l+':1').join(',')+'}', pack:W.pack, slug:W.slug,
 look_css:looks.map(l=>`<link rel="stylesheet" href="/looks/${l}.css">`).join('\n'),
 look_js:looks.map(l=>`<script src="/looks/${l}.js"></script>`).join('\n'),
 look_pick:pick, theme_color:LOOKS[look].themeColor,
 title:esc(W.title||'The Wedding Story by Pixel & Ink'),
 og_title:esc(W.share.title), og_description:esc(W.share.description), og_url:esc(W.share.url), og_image:esc(W.share.image), og_image_alt:esc(W.share.image_alt),
 twitter_title:esc(W.share.title), twitter_description:esc(W.share.description), twitter_image:esc(W.share.image),
 mono:W.names.mono, bride_full:esc(W.names.bride_full), groom_full:esc(W.names.groom_full), card_date:esc(W.names.card_date), case:W.names.case, rel_placeholder:esc(W.names.rel_placeholder),
};
let html=fs.readFileSync(path.join(root,'template/wedding.html'),'utf8').replace(/\{\{(\w+)\}\}/g,(m,k)=>{if(!(k in V))throw new Error('No value for '+k);return V[k];});
// first-paint text for translated elements, so the page reads right even before the script runs
html=html.replace(/(data-i18n="([a-z0-9_]+)"[^>]*>)([^<]*)(<)/g,(m,a,k,txt,b)=>typeof en[k]==='string'?a+esc(fill(en[k])).replace(/&quot;/g,'"')+b:m);
const out=path.join(root,W.out); fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,html);
console.log('Built',W.out,(html.length/1024).toFixed(1)+' KB');
