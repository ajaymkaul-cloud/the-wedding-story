/* The Wedding Story: the engine. Reads window.WS_ENGINE_T, WS_PACK, WS_LOOKS and WS_WEDDING. */
(function(){
"use strict";

/* ---------- storage ---------- */
var KEYS={guests:"lagan27_guests",lang:"lagan27_lang",rsvp:"lagan27_rsvp",bless:"lagan27_bless",photos:"lagan27_photos"};
function load(k,fallback){try{var v=localStorage.getItem(k);return v?JSON.parse(v):fallback;}catch(e){return fallback;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}

/* ---------- copy ---------- */
/* ---------- content: engine strings, then the pack, the looks and the wedding ---------- */
var W=window.WS_WEDDING,P=window.WS_PACK,LOOKS=window.WS_LOOKS||{};
function mergeT(list){var out={en:{},hi:{}};list.forEach(function(src){if(!src)return;["en","hi"].forEach(function(l){if(src[l])Object.keys(src[l]).forEach(function(k){out[l][k]=src[l][k];});});});return out;}
var T=mergeT([window.WS_ENGINE_T,P.T].concat(Object.keys(LOOKS).map(function(k){return LOOKS[k].T;})).concat([W.T]));
var VENUES=W.venues,CONTACTS=W.contacts,SAMPLE_BLESSINGS=W.sampleBlessings||[];
var DAYS=W.schedule.map(function(s){var d={},b=P.days[s.art]||{};Object.keys(s).forEach(function(k){d[k]=s[k];});Object.keys(b).forEach(function(k){if(d[k]===undefined)d[k]=b[k];});return d;});
var RITES=P.rites,GLOSS=P.gloss,TERMS=P.terms,ART=P.art,BEAT=P.beat;
/* {bride}, {groom}, {bride_family} and {groom_family} in shared text become this wedding's names */
function fill(s){if(typeof s!=="string"||s.indexOf("{")<0)return s;var tk=(W.tokens&&(W.tokens[lang]||W.tokens.en))||{};return s.replace(/\{(bride|groom|bride_family|groom_family)\}/g,function(m,k){return tk[k]!=null?tk[k]:m;});}
function lookNow(){return LOOKS[themeName()]||LOOKS.dejhoor||{};}
function dayArtSvg(k){var set=P.dayArt[lookNow().artStyle||"hand"]||P.dayArt.hand;return set[k]||P.dayArt.hand[k]||"";}




/* ---------- state ---------- */
var lang=load(KEYS.lang,"en"); if(!T[lang]) lang="en";
var rsvps=load(KEYS.rsvp,[]); if(!Array.isArray(rsvps)) rsvps=[];
var blessings=load(KEYS.bless,[]); if(!Array.isArray(blessings)) blessings=[];
var photos=load(KEYS.photos,[]); if(!Array.isArray(photos)) photos=[];
var guests=load(KEYS.guests,[]); if(!Array.isArray(guests)) guests=[];
var landedId=null;
var sessionAudio={}; // blessing id -> blob url (this session only)
var current=0;

function t(k,vars){var s=(T[lang][k]!==undefined?T[lang][k]:T.en[k]);if(typeof s!=="string")return s;if(vars){Object.keys(vars).forEach(function(v){s=s.split("{"+v+"}").join(vars[v]);});}return fill(s);}
function L(o){return fill(o?(o[lang]||o.en):"");}
function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
var $=function(id){return document.getElementById(id);};

var toastTimer;
function toast(msg,isErr){var b=$("toast");b.textContent=msg;b.classList.toggle("err",!!isErr);b.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(function(){b.classList.remove("show");},3200);}
var reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- static strings ---------- */
function applyStatic(){
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-i18n]").forEach(function(n){var v=t(n.getAttribute("data-i18n"));if(typeof v==="string")n.textContent=v;});
  document.querySelectorAll(".lang button").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.lang===lang?"true":"false");});
  $("draft-note").textContent=t("draft");
}

/* ---------- days ---------- */
function renderDays(){
  var ol=$("days-list");ol.textContent="";
  DAYS.filter(invited).forEach(function(d,di){
    var li=el("li","day rv");li.style.setProperty("--d",(di*.06)+"s");
    var art=el("div","day-art");art.setAttribute("aria-hidden","true");art.innerHTML=dayArtSvg(d.art)+'<span class="lb"></span>';
    var body=el("div","day-body");
    var meta=el("div","day-meta");meta.appendChild(el("span","dd",L(d.date)));meta.appendChild(el("span","tm",L(d.time)));
    meta.appendChild(el("span","chip"+(d.open||guestInv?" open":""),guestInv?t("inv_you"):(d.open?t("open"):t("family"))));
    body.appendChild(meta);body.appendChild(el("h3",null,L(d.title)));body.appendChild(el("p","where",L(d.where)));
    var dp=el("p","desc");dp.appendChild(hl(L(d.desc)));body.appendChild(dp);
    if(d.story)body.appendChild(storyBlock(d.story,"story story-day"));
    if(d.wv)body.appendChild(wvBlock(d.wv,"wv-day"));
    var acts=el("div","day-acts");
    if(d.open||guestInv)(d.venues||[]).forEach(function(k){var v=VENUES[k];if(!v)return;
      var a=el("a","mini-link",t("dir",{p:L(v.name)}));a.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(v.q);a.target="_blank";a.rel="noopener";
      var wrap=el("div","venue");wrap.appendChild(a);wrap.appendChild(el("span","small",L(v.land)));acts.appendChild(wrap);});
    if(d.cal){var c=el("a","mini-link cal",t("cal"));c.target="_blank";c.rel="noopener";
      c.href="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(L(d.title)+": "+W.names.couple)+"&dates="+d.cal.s+"/"+d.cal.e+"&ctz=Asia/Kolkata&location="+encodeURIComponent((VENUES[(d.venues||[]).slice(-1)[0]]||{}).q||"Jammu")+"&details="+encodeURIComponent(t("cal_details",{link:location.href.split("#")[0]}));
      acts.appendChild(c);}
    if(d.dress){var dr=el("div","dress");dr.appendChild(el("span","small",t("dress")));var sw=el("span","sws");
      d.dress.c.forEach(function(col){var dot=el("span","sw");dot.style.background=col;sw.appendChild(dot);});dr.appendChild(sw);dr.appendChild(el("p","small",L(d.dress.n)));acts.appendChild(dr);}
    if(acts.childNodes.length)body.appendChild(acts);
    li.appendChild(art);li.appendChild(body);ol.appendChild(li);
  });
}

function storyBlock(st,cls){var d=document.createElement("details");d.className=cls;var sm=el("summary",null,t("story_h"));d.appendChild(sm);var p=el("p");p.appendChild(hl(L(st)));d.appendChild(p);d.addEventListener("toggle",function(){if(typeof fitDeck==="function")fitDeck();});return d;}
function wvBlock(w,cls){var b=el("div",cls);b.appendChild(el("h4",null,t("wv_h")));
  var ln=el("p","wv-lines");w.lines.forEach(function(x,i){if(i)ln.appendChild(document.createElement("br"));ln.appendChild(document.createTextNode(x));});b.appendChild(ln);
  b.appendChild(el("p","wv-means",L(w.means)));
  var src=el("p","wv-src",t("wv_src")+" ");var a=el("a",null,t("wv_page",{p:w.page}));a.href="https://archive.org/details/hinzevanvuninkashmirilakshmishrikandru/page/n"+(w.page+7)+"/mode/1up";a.target="_blank";a.rel="noopener";src.appendChild(a);b.appendChild(src);return b;}
/* ---------- ceremony deck ---------- */
function layer(cls,h,p){var d=el("div","layer"+(cls?" "+cls:""));d.appendChild(el("h4",null,h));var pe=el("p");pe.appendChild(hl(p));d.appendChild(pe);return d;}
function renderDeck(){
  var deck=$("deck"),idx=$("rite-index");deck.textContent="";idx.textContent="";
  RITES.forEach(function(r,i){
    var card=el("article","rite"+(r.posh?" posh":""));card.id="rite-"+r.id;
    card.setAttribute("aria-roledescription","slide");card.setAttribute("aria-label",t("rite_of",{n:i+1,t:RITES.length})+": "+L(r.title));
    var top=el("div","rite-top");
    var left=el("div");left.style.display="flex";left.style.alignItems="center";left.style.gap="16px";
    left.appendChild(el("span","num",String(i+1)));
    var art=el("span","art");art.setAttribute("aria-hidden","true");art.innerHTML=ART[r.art];left.appendChild(art);
    var head=el("div");if(r.term)head.appendChild(el("p","term",r.term));head.appendChild(el("h3",null,L(r.title)));
    if(r.reviewed)head.appendChild(el("p","reviewed",t("reviewed")));
    top.appendChild(left);top.appendChild(head);card.appendChild(top);
    card.appendChild(layer("",t("l_see"),L(r.see)));
    card.appendChild(layer("",t("l_means"),L(r.means)));
    if(r.story)card.appendChild(storyBlock(r.story,"story story-rite"));
    if(r.steps){
      var s7=el("div","steps7");
      r.steps.forEach(function(s,k){var d=el("div");var b=el("b",null,String(k+1));d.appendChild(b);d.appendChild(document.createTextNode(s.w));d.appendChild(el("span","m",lang==="hi"?s.hi:s.en));s7.appendChild(d);});
      card.appendChild(s7);
    }
    if(r.verse){
      var v=el("div","verse");
      var dv=el("p","deva",r.verse.deva);dv.lang="sa";v.appendChild(dv);
      v.appendChild(el("p","iast",r.verse.iast));
      v.appendChild(el("p","lit",t("l_lit")+": "+L(r.verse.lit)));
      v.appendChild(el("p","note",L(r.verse.note)));
      card.appendChild(v);
    }
    if(r.listen)card.appendChild(layer("listen",t("l_listen"),L(r.listen)));
    if(r.wv)card.appendChild(wvBlock(r.wv,"verse wv"));
    card.appendChild(layer("you",t("l_you"),L(r.you)));
    if(r.play)card.appendChild(buildPlay(r.play));
    if(r.posh){
      var c=document.createElement("canvas");c.setAttribute("aria-hidden","true");card.appendChild(c);
      var pb=el("button","btn gold small",t("petals"));pb.type="button";pb.style.justifySelf="start";
      pb.addEventListener("click",function(){petals(c);});card.appendChild(pb);
    }
    deck.appendChild(card);
    var chip=el("button",null,(i+1)+". "+L(r.title));chip.type="button";chip.setAttribute("role","tab");
    chip.addEventListener("click",function(){go(i);});idx.appendChild(chip);
  });
  updateDeckUi();
}
function go(i){
  current=Math.max(0,Math.min(RITES.length-1,i));
  var card=$("deck").children[current];
  if(card){var dk=$("deck");dk.scrollTo({left:dk.scrollLeft+card.getBoundingClientRect().left-dk.getBoundingClientRect().left,behavior:reduceMotion?"auto":"smooth"});
    var ix=document.querySelector(".rite-bar"),off=61+(ix?ix.offsetHeight:60)+12,dt=dk.getBoundingClientRect().top;
    if(dt<off)window.scrollBy({top:dt-off,behavior:reduceMotion?"auto":"smooth"});}
  updateDeckUi();
}
function renderDeckProg(){var p=$("deck-prog");if(!p)return;p.textContent="";
  RITES.forEach(function(r,i){var b=el("button","seg");b.type="button";b.setAttribute("aria-label",(i+1)+". "+L(r.title));b.addEventListener("click",function(){go(i);});p.appendChild(b);});}
var movedOnce=false;
function fitDeck(){var dk=$("deck"),c=dk&&dk.children[current];if(c&&c.offsetHeight)dk.style.height=(c.offsetHeight+34)+"px";}
window.addEventListener("resize",function(){fitDeck();});
function updateDeckUi(){
  fitDeck();
  var segs=$("deck-prog")?$("deck-prog").children:[];for(var si=0;si<segs.length;si++){segs[si].classList.toggle("done",si<current);segs[si].classList.toggle("on",si===current);}
  if(current>0&&!movedOnce){movedOnce=true;var sh=$("swipe-hint");if(sh)sh.classList.add("gone");}
  $("deck-count").textContent=t("rite_of",{n:current+1,t:RITES.length});
  var chips=$("rite-index").children;
  for(var i=0;i<chips.length;i++){chips[i].setAttribute("aria-current",i===current?"true":"false");chips[i].setAttribute("aria-selected",i===current?"true":"false");}
  var active=chips[current];if(active){var p=active.parentNode,pr=p.getBoundingClientRect(),ar=active.getBoundingClientRect();p.scrollTo({left:p.scrollLeft+(ar.left-pr.left)-(pr.width-ar.width)/2,behavior:reduceMotion?"auto":"smooth"});}
  $("prev").disabled=$("prev2").disabled=current===0;$("next").disabled=$("next2").disabled=current===RITES.length-1;
}
var scrollTimer;
$("deck").addEventListener("scroll",function(){
  clearTimeout(scrollTimer);
  scrollTimer=setTimeout(function(){
    var deck=$("deck"),best=0,bestD=Infinity;
    Array.prototype.forEach.call(deck.children,function(c,i){var d=Math.abs(c.getBoundingClientRect().left-deck.getBoundingClientRect().left);if(d<bestD){bestD=d;best=i;}});
    if(best!==current){current=best;updateDeckUi();}
  },90);
},{passive:true});
$("prev").addEventListener("click",function(){go(current-1);});
$("next").addEventListener("click",function(){go(current+1);});
$("prev2").addEventListener("click",function(){go(current-1);});
$("next2").addEventListener("click",function(){go(current+1);});
$("deck").addEventListener("keydown",function(e){if(e.key==="ArrowRight"){e.preventDefault();go(current+1);}else if(e.key==="ArrowLeft"){e.preventDefault();go(current-1);}});

/* petal shower: one orchestrated moment */
function petals(canvas){
  if(reduceMotion){toast(L({en:"Petals away.",hi:"फूल बरस रहे हैं।"}));return;}
  var r=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  canvas.width=r.width*dpr;canvas.height=r.height*dpr;
  var ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  var cols=["#F3D3A6","#F7E7CF","#E9A2A0","#FFFFFF","#D6B678"];
  var ps=[];for(var i=0;i<70;i++){ps.push({x:Math.random()*r.width,y:-20-Math.random()*r.height*.6,vy:.8+Math.random()*1.6,vx:-.4+Math.random()*.8,a:Math.random()*6.28,va:-.05+Math.random()*.1,s:4+Math.random()*6,c:cols[i%cols.length],w:Math.random()*6.28});}
  var start=null;
  function frame(ts){
    if(!start)start=ts;var el=ts-start;ctx.clearRect(0,0,r.width,r.height);
    ps.forEach(function(p){p.w+=.03;p.x+=p.vx+Math.sin(p.w)*.6;p.y+=p.vy;p.a+=p.va;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.c;ctx.globalAlpha=.9;
      ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*.55,0,0,6.283);ctx.fill();ctx.restore();});
    if(el<5200)requestAnimationFrame(frame);else ctx.clearRect(0,0,r.width,r.height);
  }
  requestAnimationFrame(frame);
}


/* ---------- tappable terms ---------- */

function glossFor(name){for(var i=0;i<GLOSS.length;i++){if(GLOSS[i].t.en===name)return GLOSS[i];}return null;}
function escRe(x){return x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
function hl(text){
  var frag=document.createDocumentFragment();
  var words=[],map={};
  TERMS.forEach(function(tm){(tm[lang]||[]).forEach(function(w){words.push(w);map[w]=tm.g;});});
  words.sort(function(a,b){return b.length-a.length;});
  var re=lang==="hi"?new RegExp("("+words.map(escRe).join("|")+")","g"):new RegExp("\\b("+words.map(escRe).join("|")+")\\b","g");
  var last=0,m;
  while((m=re.exec(text))){
    if(m.index>last)frag.appendChild(document.createTextNode(text.slice(last,m.index)));
    var b=el("span","term-hl",m[0]);b.setAttribute("role","button");b.tabIndex=0;b.dataset.g=map[m[0]];b.setAttribute("aria-haspopup","dialog");
    frag.appendChild(b);last=m.index+m[0].length;
  }
  if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}
var pop=null,popFor=null;
function closePop(){if(pop){pop.remove();pop=null;if(popFor)popFor.setAttribute("aria-expanded","false");popFor=null;}}
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest(".term-hl");
  if(!b){if(pop&&!(e.target.closest&&(e.target.closest(".pop")||e.target.closest(".dejihor"))))closePop();return;}
  if(popFor===b){closePop();return;}
  closePop();var g=glossFor(b.dataset.g);if(!g)return;
  pop=el("div","pop");pop.setAttribute("role","dialog");pop.setAttribute("aria-label",L(g.t));
  pop.appendChild(el("b",null,L(g.t)));pop.appendChild(el("span",null,L(g.d)));
  document.body.appendChild(pop);
  var r=b.getBoundingClientRect(),w=pop.offsetWidth,vw=document.documentElement.clientWidth;
  var left=Math.max(12,Math.min(vw-w-12,r.left+r.width/2-w/2));
  var top=r.bottom+8;if(top+pop.offsetHeight>window.innerHeight-12)top=r.top-pop.offsetHeight-8;
  pop.style.left=(left+window.scrollX)+"px";pop.style.top=(top+window.scrollY)+"px";
  popFor=b;b.setAttribute("aria-expanded","true");
});
document.addEventListener("keydown",function(e){var tb=e.target.closest&&e.target.closest(".term-hl");if(tb&&(e.key==="Enter"||e.key===" ")){e.preventDefault();tb.click();return;}if(e.key==="Escape"&&pop){var f=popFor;closePop();if(f)f.focus();}});
window.addEventListener("resize",closePop);

/* ---------- rite interactions ---------- */
var SVGNS="http://www.w3.org/2000/svg";
function replay(stage){stage.classList.remove("anim");void stage.getBoundingClientRect();stage.classList.add("anim");}
function buildPlay(kind){
  var wrap=el("div","play"),stage=el("div","stage"),txt=el("div","play-txt");
  stage.setAttribute("aria-hidden","true");
  var btn=el("button","btn gold small");btn.type="button";
  var p=el("p");
  if(kind==="vyug"){
    stage.innerHTML='<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.2"><path class="d" style="--i:0" pathLength="1" d="M60 18v84M18 60h84"/><rect class="d" style="--i:1" pathLength="1" x="31" y="31" width="58" height="58" transform="rotate(45 60 60)"/><rect class="d" style="--i:2" pathLength="1" x="39" y="39" width="42" height="42"/><circle class="d" style="--i:3" pathLength="1" cx="60" cy="60" r="10"/><circle class="d" style="--i:4" pathLength="1" cx="60" cy="60" r="3"/></svg>';
    btn.textContent=t("play_vyug");p.textContent=t("play_vyug_p");
    btn.addEventListener("click",function(){replay(stage);});
  }else if(kind==="mirror"){
    stage.innerHTML='<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.2"><path class="face" d="M46 34c-5 6-5 11-1 15l-3 4 3 2c0 6 3 10 8 11"/><path class="face" d="M74 34c5 6 5 11 1 15l3 4-3 2c0 6-3 10-8 11"/><ellipse class="mist" cx="60" cy="52" rx="29" ry="37" fill="#6B5446" stroke="none" opacity=".88"/><ellipse cx="60" cy="52" rx="30" ry="38"/><path d="M60 90v20M48 110h24"/></svg>';
    btn.textContent=t("play_mirror");p.textContent=t("play_mirror_p");
    btn.addEventListener("click",function(){var c=stage.classList.toggle("clear");btn.textContent=c?t("play_mirror2"):t("play_mirror");});
  }else if(kind==="athwas"){
    stage.innerHTML='<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path class="hl" d="M10 66c10-2 20-7 30-7h18c3 0 3 5 0 5H46"/><path class="hr" d="M110 66c-10-2-20-7-30-7H62c-3 0-3 5 0 5h12"/><path class="cl" d="M30 52c10 4 20-4 30 0s20-4 30 0v24c-10-4-20 4-30 0s-20 4-30 0z" fill="rgba(214,182,120,.22)"/></svg>';
    btn.textContent=t("play_athwas");p.textContent=t("play_athwas_p");
    btn.addEventListener("click",function(){replay(stage);});
  }else if(kind==="rounds"){
    var dots="";for(var i=0;i<7;i++){var a=-Math.PI/2+i*2*Math.PI/7;dots+='<circle class="rd" cx="'+(60+42*Math.cos(a)).toFixed(1)+'" cy="'+(60+42*Math.sin(a)).toFixed(1)+'" r="5"/>';}
    stage.innerHTML='<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="60" cy="60" r="42" stroke-dasharray="2 4"/><path d="M60 46c8 8 8 16 0 21-8-5-8-13 0-21z"/>'+dots+'</svg>';
    var n=0,out=el("p");out.setAttribute("aria-live","polite");out.textContent=t("round_n",{n:0});
    btn.textContent=t("play_round");p.textContent=t("round_p");
    btn.addEventListener("click",function(){
      var ds=stage.querySelectorAll(".rd");
      if(n>=7){n=0;Array.prototype.forEach.call(ds,function(d){d.classList.remove("on");});btn.textContent=t("play_round");out.textContent=t("round_n",{n:0});return;}
      ds[n].classList.add("on");n++;
      if(n===7){out.textContent=t("round_done");btn.textContent=t("play_round_again");}else out.textContent=t("round_n",{n:n});
    });
    txt.appendChild(p);txt.appendChild(out);txt.appendChild(btn);wrap.appendChild(stage);wrap.appendChild(txt);return wrap;
  }
  txt.appendChild(p);txt.appendChild(btn);wrap.appendChild(stage);wrap.appendChild(txt);return wrap;
}

/* ---------- slow push-in on day frames ---------- */
var dayIO=("IntersectionObserver" in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("inview");dayIO.unobserve(e.target);}});},{threshold:.35}):null;
function watchDays(){document.querySelectorAll(".day").forEach(function(d){if(dayIO)dayIO.observe(d);else d.classList.add("inview");});}

/* ---------- invitation case ---------- */
function openCase(open){
  var sc=$("scene"),slot=$("card-slot"),c=$("case");
  sc.classList.toggle("open",open);c.setAttribute("aria-expanded",open?"true":"false");
  if(open){slot.removeAttribute("inert");}else{slot.setAttribute("inert","");}
}
function showStamp(animate){var s=$("stamp");s.classList.add("show");if(animate)replay(s);}
$("case").addEventListener("click",function(){var willOpen=!$("scene").classList.contains("open");openCase(willOpen);if(willOpen)setTimeout(function(){try{$("r-name").focus({preventScroll:true});}catch(e){}},900);});
document.querySelectorAll('a[href="#rsvp"]').forEach(function(a){a.addEventListener("click",function(){setTimeout(function(){openCase(true);},450);});});
/* ---------- floating reply bar ---------- */
(function(){
  var fab=$("fab");if(!fab||!("IntersectionObserver" in window))return;
  var heroIn=true,rsvpIn=false;
  function sync(){var show=!heroIn&&!rsvpIn;fab.classList.toggle("show",show);fab.setAttribute("aria-hidden",show?"false":"true");
    fab.querySelectorAll("a").forEach(function(a){a.tabIndex=show?0:-1;});}
  new IntersectionObserver(function(es){heroIn=es[0].isIntersecting;sync();},{threshold:0}).observe(document.querySelector(".hero"));
  new IntersectionObserver(function(es){rsvpIn=es[0].isIntersecting;sync();},{threshold:.15}).observe($("rsvp"));
})();

/* ---------- glossary ---------- */
function renderGloss(){
  var dl=$("gloss");dl.textContent="";
  GLOSS.forEach(function(g,gi){var d=el("div","rv");d.style.setProperty("--d",(gi%3*.08)+"s");d.appendChild(el("dt",null,L(g.t)));d.appendChild(el("dd",null,L(g.d)));dl.appendChild(d);});
}

/* ---------- RSVP ---------- */
var count=2;
function setCount(n){count=Math.max(1,Math.min(12,n));$("r-count").textContent=String(count);$("r-minus").disabled=count===1;}
$("r-minus").addEventListener("click",function(){setCount(count-1);});
$("r-plus").addEventListener("click",function(){setCount(count+1);});
function attending(){return $("att-yes").checked;}
function syncAtt(){$("r-coming").hidden=!attending();if(typeof refreshRsvpUi==="function"&&$("r-submit"))refreshRsvpUi(true);}
$("att-yes").addEventListener("change",syncAtt);$("att-no").addEventListener("change",syncAtt);
function evLabel(list){return list.map(function(k){return t("ev_names")[k]||k;}).join(", ");}
function myReplyText(){
  var mine=rsvps.filter(function(r){return r.mine;})[0];if(!mine)return "";
  return mine.att==="yes"?t("r_current_yes",{n:mine.count,ev:evLabel(mine.events)}):t("r_current_no");
}
function refreshRsvpUi(){
  var mine=rsvps.filter(function(r){return r.mine;})[0];
  $("r-submit").textContent=!attending()?t("r_submit_afar"):(mine?t("r_update"):t("r_submit"));
  if(arguments[0]===true)return;
  var st=$("r-status");st.className="small";st.textContent=myReplyText();
}
function prefillRsvp(){
  var mine=rsvps.filter(function(r){return r.mine;})[0];if(!mine)return;
  $("r-name").value=mine.name;$(mine.att==="yes"?"att-yes":"att-no").checked=true;setCount(mine.count||1);
  $("ev-maenz").checked=mine.events.indexOf("maenziraat")>-1;$("ev-lagan").checked=mine.events.indexOf("lagan")>-1;
  $("r-note").value=mine.note||"";syncAtt();
}
$("rsvp-form").addEventListener("submit",function(e){
  e.preventDefault();
  var st=$("r-status"),name=$("r-name").value.trim();
  if(!name){st.className="small status-err";st.textContent=t("r_err_name");$("r-name").focus();return;}
  var events=[];if($("ev-maenz").checked)events.push("maenziraat");if($("ev-lagan").checked)events.push("lagan");
  if(attending()&&!events.length){st.className="small status-err";st.textContent=t("r_err_ev");return;}
  var entry={name:name,att:attending()?"yes":"no",count:attending()?count:0,events:attending()?events:[],note:$("r-note").value.trim(),at:Date.now(),mine:true};
  var had=rsvps.some(function(r){return r.mine;});
  var next=rsvps.filter(function(r){return !r.mine;});next.unshift(entry);
  if(!save(KEYS.rsvp,next)){st.className="small status-err";st.textContent=t("r_fail");toast(t("r_fail"),true);return;}
  rsvps=next;refreshRsvpUi();
  var msg=had?t("r_updated",{name:name}):t("r_saved",{name:name});
  st.className="small status-ok";st.textContent=msg+" "+t(entry.att==="yes"?"stamp_yes":"stamp_no");toast(entry.att==="yes"?msg:t("to_bless"));
  if(entry.att!=="yes"){setTimeout(function(){location.hash="blessings";setTimeout(function(){
    var bn=$("b-name");if(bn&&!bn.value)bn.value=entry.name;var f=$("bl-form");if(f)f.scrollIntoView({behavior:reduceMotion?"auto":"smooth",block:"start"});
    setTimeout(function(){try{$("b-msg").focus({preventScroll:true});}catch(e){}},600);},350);},1700);}renderOrg();showStamp(true);
});

/* ---------- blessings + recorder ---------- */
var rec={mr:null,stream:null,chunks:[],timer:null,secs:0,url:null,dur:0,state:"idle",stopped:null};
function fmt(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function setRecUi(){
  var box=$("rec");box.classList.toggle("recording",rec.state==="recording");
  $("rec-label").textContent=rec.state==="recording"?t("rec_stop"):(rec.url?t("rec_again"):t("rec_start"));
  $("rec-time").textContent=fmt(rec.state==="recording"?rec.secs:(rec.url?rec.dur:0))+" / 0:30";
  var p=$("rec-preview");if(rec.url){p.src=rec.url;p.hidden=false;}else{p.removeAttribute("src");p.hidden=true;}
}
function recStatus(k){$("rec-status").textContent=t(k);}
function discardTake(){if(rec.url){try{URL.revokeObjectURL(rec.url);}catch(e){}}rec.url=null;rec.dur=0;}
function startRec(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==="undefined"){recStatus("rec_unsupported");return;}
  discardTake();setRecUi();
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    rec.stream=stream;rec.chunks=[];rec.secs=0;
    var mr;try{mr=new MediaRecorder(stream);}catch(err){stream.getTracks().forEach(function(tr){tr.stop();});recStatus("rec_unsupported");return;}
    rec.mr=mr;var type=mr.mimeType||"audio/mp4";
    rec.stopped=new Promise(function(resolve){
      mr.ondataavailable=function(ev){if(ev.data&&ev.data.size)rec.chunks.push(ev.data);};
      mr.onstop=function(){
        if(rec.chunks.length){rec.url=URL.createObjectURL(new Blob(rec.chunks,{type:type}));rec.dur=Math.max(1,rec.secs);}
        if(rec.stream)rec.stream.getTracks().forEach(function(tr){tr.stop();});
        rec.stream=null;rec.mr=null;rec.state="idle";setRecUi();recStatus(rec.url?"rec_done":"rec_idle");resolve();
      };
    });
    mr.start();rec.state="recording";setRecUi();recStatus("rec_on");
    rec.timer=setInterval(function(){rec.secs++;setRecUi();if(rec.secs>=30)stopRec();},1000);
  }).catch(function(){rec.state="idle";setRecUi();recStatus("rec_blocked");});
}
function stopRec(){
  clearInterval(rec.timer);rec.timer=null;
  if(rec.mr&&rec.mr.state!=="inactive"){var p=rec.stopped;try{rec.mr.stop();}catch(e){}return p||Promise.resolve();}
  rec.state="idle";setRecUi();return Promise.resolve();
}
$("rec-btn").addEventListener("click",function(){if(rec.state==="recording")stopRec();else startRec();});

function persistBlessings(list){return save(KEYS.bless,list.map(function(b){return {id:b.id,name:b.name,rel:b.rel,msg:b.msg,at:b.at,hadVoice:!!b.hadVoice,dur:b.dur||0};}));}
$("bl-form").addEventListener("submit",function(e){
  e.preventDefault();
  var st=$("b-status"),name=$("b-name").value.trim(),msg=$("b-msg").value.trim();
  if(!name||!msg){st.className="small status-err";st.textContent=t("b_err");(name?$("b-msg"):$("b-name")).focus();return;}
  $("b-submit").disabled=true;
  var wait=rec.state==="recording"?stopRec():Promise.resolve();
  wait.then(function(){
    var id="b"+Date.now();
    var entry={id:id,name:name,rel:$("b-rel").value.trim(),msg:msg,at:Date.now(),hadVoice:!!rec.url,dur:rec.dur};
    var next=[entry].concat(blessings);
    if(!persistBlessings(next)){st.className="small status-err";st.textContent=t("b_fail");toast(t("b_fail"),true);$("b-submit").disabled=false;return;}
    blessings=next;landedId=id;
    if(rec.url){sessionAudio[id]=rec.url;rec.url=null;rec.dur=0;} // hand the take to the card; don't revoke
    $("b-name").value="";$("b-rel").value="";$("b-msg").value="";
    setRecUi();recStatus("rec_idle");
    st.className="small status-ok";st.textContent=t("b_saved");toast(t("b_saved"));
    $("b-submit").disabled=false;renderWall();renderAll();
  });
});
function renderWall(){
  var wall=$("wall");wall.textContent="";
  var list=blessings.map(function(b){return {own:true,b:b};}).concat(SAMPLE_BLESSINGS.map(function(b){return {own:false,b:b};}));
  list.forEach(function(item){
    var b=item.b,card=el("article","note"+(item.own&&b.id===landedId?" landed":" rv"));
    var q=el("blockquote",null,item.own?b.msg:L(b.msg));card.appendChild(q);
    var who=el("p","who");var nm=el("b",null,b.name);who.appendChild(nm);
    var rel=item.own?b.rel:L(b.rel);if(rel){who.appendChild(document.createTextNode(", "+rel));}
    card.appendChild(who);
    if(item.own&&sessionAudio[b.id]){var a=document.createElement("audio");a.controls=true;a.src=sessionAudio[b.id];a.setAttribute("aria-label",t("voice")+", "+b.name);card.appendChild(a);}
    else if(item.own&&b.hadVoice){card.appendChild(el("p","small",t("voice_gone")));}
    if(!item.own)card.appendChild(el("span","tag",t("sample")));
    wall.appendChild(card);
  });
}

/* ---------- photos ---------- */
function resize(file,max,q){
  return new Promise(function(resolve,reject){
    var url=URL.createObjectURL(file),img=new Image();
    img.onload=function(){
      var w=img.naturalWidth,h=img.naturalHeight,s=Math.min(1,max/Math.max(w,h));
      var c=document.createElement("canvas");c.width=Math.round(w*s);c.height=Math.round(h*s);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
      try{resolve(c.toDataURL("image/jpeg",q));}catch(e){reject(e);}
    };
    img.onerror=function(){URL.revokeObjectURL(url);reject(new Error("decode"));};
    img.src=url;
  });
}
$("ph-input").addEventListener("change",function(e){
  var f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;
  resize(f,1100,.74).then(function(data){
    var cap=f.name.replace(/\.[^.]+$/,"").slice(0,40);
    var next=[{id:"p"+Date.now(),src:data,cap:cap}].concat(photos);
    if(!save(KEYS.photos,next)){toast(t("ph_full"),true);return;}
    landedId=next[0].id;photos=next;renderPhotos();toast(t("ph_saved"));
  }).catch(function(){toast(t("ph_bad"),true);});
});
function renderPhotos(){
  var g=$("photos-grid");g.textContent="";
  if(!photos.length){
    var e=el("div","ph empty");var inner=el("div");
    inner.innerHTML='<svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="6" y="9" width="28" height="22" rx="3"/><circle cx="20" cy="20" r="6"/></svg>';
    inner.appendChild(el("p",null,t("ph_empty")));e.appendChild(inner);g.appendChild(e);return;
  }
  photos.forEach(function(p){
    var fig=el("figure","ph"+(p.id===landedId?" landed":" rv"));fig.style.margin="0";var hsh=0;for(var ci=0;ci<p.id.length;ci++)hsh=(hsh*31+p.id.charCodeAt(ci))%997;fig.style.setProperty("--r",((hsh%5)-2)*.7+"deg");
    var img=document.createElement("img");img.src=p.src;img.alt=p.cap||t("ph_by");img.loading="lazy";fig.appendChild(img);
    var cap=el("figcaption");cap.appendChild(document.createTextNode(t("ph_by")+" "));
    var rm=el("button","linkbtn",t("ph_remove"));rm.type="button";rm.style.color="#fff";
    rm.addEventListener("click",function(){var next=photos.filter(function(x){return x.id!==p.id;});if(save(KEYS.photos,next)){photos=next;renderPhotos();}});
    cap.appendChild(rm);fig.appendChild(cap);g.appendChild(fig);
  });
}

/* ---------- keepsake ---------- */
function keepsakeText(){
  var out=[];
  out.push(W.names.couple_full);out.push(t("f_lagan_v")+", "+t("f_where_v"));out.push("");
  out.push(t("cer_h"));out.push("");
  RITES.forEach(function(r,i){
    out.push((i+1)+". "+L(r.title));
    out.push(t("l_see")+": "+L(r.see));out.push(t("l_means")+": "+L(r.means));
    if(r.verse){out.push(r.verse.deva);out.push(r.verse.iast);out.push(t("l_lit")+": "+L(r.verse.lit));}
    out.push("");
  });
  out.push(t("bl_h"));out.push("");
  blessings.forEach(function(b){out.push("“"+b.msg+"”");out.push(b.name+(b.rel?", "+b.rel:""));out.push("");});
  out.push(t("foot"));
  return out.join("\n");
}
$("keep-copy").addEventListener("click",function(){
  var text=keepsakeText();
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast(t("copied"));},function(){toast(t("copy_fail"),true);});}
  else toast(t("copy_fail"),true);
});
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
$("keep-dl").addEventListener("click",function(){
  var rites=RITES.map(function(r,i){return "<section><h2>"+(i+1)+". "+esc(L(r.title))+"</h2><p><b>"+esc(t("l_see"))+".</b> "+esc(L(r.see))+"</p><p><b>"+esc(t("l_means"))+".</b> "+esc(L(r.means))+"</p>"+(r.verse?"<p class=v>"+esc(r.verse.deva)+"<br><i>"+esc(r.verse.iast)+"</i><br>"+esc(L(r.verse.lit))+"</p>":"")+"</section>";}).join("");
  var bl=blessings.map(function(b){return "<blockquote>"+esc(b.msg)+"<cite>"+esc(b.name)+(b.rel?", "+esc(b.rel):"")+"</cite></blockquote>";}).join("");
  var html="<!DOCTYPE html><html lang=\""+lang+"\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>"+W.names.keepsake_title+"</title><style>body{font-family:Georgia,'Noto Serif Devanagari',serif;max-width:680px;margin:48px auto;padding:0 20px;color:#231B16;background:#F6F5F1;line-height:1.6}h1{font-weight:400;font-size:2.4rem;margin:0}h2{font-weight:400;margin:36px 0 6px}.v{border-left:2px solid #A27C3A;padding-left:14px}blockquote{margin:20px 0;font-size:1.15rem}cite{display:block;font-size:.9rem;color:#6C625A;font-style:normal;margin-top:4px}</style></head><body><h1>"+W.names.keepsake_h1+"</h1><p>"+esc(t("f_lagan_v"))+", "+esc(t("f_where_v"))+"</p>"+rites+(bl?"<h2>"+esc(t("bl_h"))+"</h2>"+bl:"")+"<p style=\"margin-top:48px;color:#6C625A\">"+esc(t("foot"))+"</p></body></html>";
  try{
    var url=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
    var a=document.createElement("a");a.href=url;a.download=W.names.file;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},2000);toast(t("dl_done"));
  }catch(err){toast(t("copy_fail"),true);}
});

/* ---------- family view ---------- */
function slug(n){return String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48);}
function parseRows(text){
  var lines=String(text).replace(/\r/g,"").split("\n").filter(function(l){return l.trim();});
  if(!lines.length)return [];
  var first=lines[0],delim=first.indexOf("\t")>-1?"\t":(first.indexOf(";")>-1&&first.indexOf(",")===-1?";":",");
  function split(line){if(delim==="\t")return line.split("\t");var out=[],cur="",q=false;for(var i=0;i<line.length;i++){var c=line[i];if(q){if(c==='"'){if(line[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=c;}else if(c==='"')q=true;else if(c===delim){out.push(cur);cur="";}else cur+=c;}out.push(cur);return out;}
  var rows=lines.map(function(l){return split(l).map(function(c){return c.trim();});});
  var head=rows[0].map(function(c){return c.toLowerCase();});
  var col={name:0,side:1,phone:2,events:3,count:4};
  if(head.some(function(h){return /name|naam/.test(h);})){
    col={name:-1,side:-1,phone:-1,events:-1,count:-1};
    head.forEach(function(h,i){
      if(col.name<0&&/name|naam/.test(h))col.name=i;
      else if(col.count<0&&/count|people|pax|number of|how many/.test(h))col.count=i;
      else if(col.phone<0&&/phone|mobile|whatsapp|contact|^number$/.test(h))col.phone=i;
      else if(col.events<0&&/invite|event|function|gathering/.test(h))col.events=i;
      else if(col.side<0&&/side|family|relation|group/.test(h))col.side=i;
    });
    rows=rows.slice(1);
  }
  function at(r,i){return i>=0&&i<r.length?r[i]:"";}
  return rows.map(function(r){
    var name=at(r,col.name);if(!name)return null;
    var ev=at(r,col.events).toLowerCase(),events=[];
    if(/maen|mehndi|mehendi|menz|henna/.test(ev))events.push("maenziraat");
    if(/lagan|wedding|shaadi/.test(ev))events.push("lagan");
    if(/family|all functions|every|sab/.test(ev))events=["family","maenziraat","lagan"];
    if(!events.length)events=["maenziraat","lagan"];
    return {id:"g"+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name:name.slice(0,80),side:at(r,col.side).slice(0,60),phone:at(r,col.phone).replace(/[^\d+]/g,"").slice(0,16),events:events,count:parseInt(at(r,col.count),10)||null};
  }).filter(Boolean);
}
function importGuests(list){
  if(!list.length){toast(t("g_bad"),true);return false;}
  var byName={};guests.forEach(function(g){byName[g.name.toLowerCase()]=g;});
  list.forEach(function(g){byName[g.name.toLowerCase()]=g;});
  var next=Object.keys(byName).map(function(k){return byName[k];});
  if(!save(KEYS.guests,next)){toast(t("g_fail"),true);return false;}
  guests=next;toast(t("g_imported",{n:list.length}));renderOrg();return true;
}
function inviteLink(name,events){var base=location.href.split("#")[0],sl=slug(name);if(!sl)return base;var code="";(events||[]).forEach(function(e){code+=e==="maenziraat"?"m":e==="lagan"?"l":e==="family"?"f":"";});return base+"#g-"+sl+(code?"--"+code:"");}
function replyFor(name){var n=name.trim().toLowerCase();for(var i=0;i<rsvps.length;i++){if(rsvps[i].name.trim().toLowerCase()===n)return rsvps[i];}return null;}
function renderOrg(){
  var o=$("org");if(!o)return;o.textContent="";
  o.appendChild(el("h2",null,t("fam_h")));
  /* guest list */
  o.appendChild(el("h3",null,t("g_h")));
  o.appendChild(el("p","small",t("g_hint")));
  var row=el("div","row");
  var up=el("label","btn small upload");up.appendChild(el("span",null,t("g_import")));
  var fi=document.createElement("input");fi.type="file";fi.accept=".csv,.tsv,.txt,text/csv";fi.setAttribute("aria-label",t("g_import"));
  fi.addEventListener("change",function(e){var f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;var rd=new FileReader();rd.onload=function(){importGuests(parseRows(rd.result));};rd.onerror=function(){toast(t("g_bad"),true);};rd.readAsText(f);});
  up.appendChild(fi);row.appendChild(up);
  var pb=el("button","btn ghost small",t("g_paste"));pb.type="button";row.appendChild(pb);
  o.appendChild(row);
  var pasteBox=el("div","field");pasteBox.hidden=true;
  var ta=document.createElement("textarea");ta.id="g-paste";ta.placeholder="Raina family\t"+fill("{bride}")+"'s side\t+919800000000\tBoth\t4";ta.setAttribute("aria-label",t("g_paste"));
  var add=el("button","btn small",t("g_add"));add.type="button";add.style.justifySelf="start";
  add.addEventListener("click",function(){if(importGuests(parseRows(ta.value)))ta.value="";});
  pasteBox.appendChild(ta);pasteBox.appendChild(add);o.appendChild(pasteBox);
  pb.addEventListener("click",function(){pasteBox.hidden=!pasteBox.hidden;if(!pasteBox.hidden)ta.focus();});
  if(!guests.length){o.appendChild(el("p","small",t("g_none")));}
  else{
    var replied=guests.filter(function(g){return replyFor(g.name);}).length;
    o.appendChild(el("p",null,t("g_sum",{n:guests.length,r:replied})));
    var wrap=el("div","tablewrap"),tb=document.createElement("table"),hr=document.createElement("tr");
    ["th_name","th_side","th_inv","th_reply","th_send"].forEach(function(k){hr.appendChild(el("th",null,t(k)));});
    var th=document.createElement("thead");th.appendChild(hr);tb.appendChild(th);var tbody=document.createElement("tbody");
    guests.forEach(function(g){
      var tr=document.createElement("tr"),r=replyFor(g.name);
      tr.appendChild(el("td",null,g.name+(g.count?" ("+g.count+")":"")));tr.appendChild(el("td",null,g.side||""));tr.appendChild(el("td",null,evLabel(g.events||[])));
      var rc=document.createElement("td");rc.appendChild(el("span","pill"+(r?" yes":""),r?(r.att==="yes"?t("yes")+", "+r.count:t("no")):t("g_wait")));tr.appendChild(rc);
      var sc=document.createElement("td"),cell=el("div","row");cell.style.gap="6px";
      var link=inviteLink(g.name,g.events);
      var cb=el("button","mini",t("g_copy"));cb.type="button";
      cb.addEventListener("click",function(){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(link).then(function(){toast(t("g_copied"));},function(){toast(link);});}else toast(link);});
      var wa=el("a","mini",t("g_wa"));wa.href="https://wa.me/"+(g.phone||"").replace(/\D/g,"")+"?text="+encodeURIComponent(t("g_msg",{name:g.name,link:link}));wa.target="_blank";wa.rel="noopener";
      cell.appendChild(cb);cell.appendChild(wa);sc.appendChild(cell);tr.appendChild(sc);tbody.appendChild(tr);
    });
    tb.appendChild(tbody);wrap.appendChild(tb);o.appendChild(wrap);
    var gc=el("button","linkbtn",t("g_clear"));gc.type="button";gc.style.justifySelf="start";
    gc.addEventListener("click",function(){try{localStorage.removeItem(KEYS.guests);}catch(e){}guests=[];renderOrg();toast(t("g_cleared"));});
    o.appendChild(gc);
  }
  /* replies */
  o.appendChild(el("h3",null,t("r_h")));
  if(!rsvps.length){o.appendChild(el("p","small",t("org_none")));}
  else{
    var people=rsvps.reduce(function(sm,r){return sm+(r.att==="yes"?(+r.count||0):0);},0);
    o.appendChild(el("p",null,t("org_total",{n:people,f:rsvps.length})));
    var w2=el("div","tablewrap"),t2=document.createElement("table"),h2=document.createElement("tr");
    ["th_name","th_att","th_n","th_ev","th_note"].forEach(function(k){h2.appendChild(el("th",null,t(k)));});
    var hd=document.createElement("thead");hd.appendChild(h2);t2.appendChild(hd);var b2=document.createElement("tbody");
    rsvps.forEach(function(r){var tr=document.createElement("tr");
      tr.appendChild(el("td",null,r.name));tr.appendChild(el("td",null,r.att==="yes"?t("yes"):t("no")));
      tr.appendChild(el("td","n",String(r.count||0)));tr.appendChild(el("td",null,evLabel(r.events||[])));tr.appendChild(el("td",null,r.note||""));b2.appendChild(tr);});
    t2.appendChild(b2);w2.appendChild(t2);o.appendChild(w2);
  }
  o.appendChild(el("p","small",t("org_note")));
  var clr=el("button","btn ghost small",t("org_clear"));clr.type="button";clr.style.justifySelf="start";
  clr.addEventListener("click",function(){
    try{localStorage.removeItem(KEYS.rsvp);localStorage.removeItem(KEYS.bless);localStorage.removeItem(KEYS.photos);localStorage.removeItem("lagan27_me");}catch(e){}guestName=null;guestInv=null;applyInvites();applyGreet();renderDays();renderGlance();
    rsvps=[];blessings=[];photos=[];Object.keys(sessionAudio).forEach(function(k){try{URL.revokeObjectURL(sessionAudio[k]);}catch(e){}});sessionAudio={};
    $("rsvp-form").reset();$("stamp").classList.remove("show");setCount(2);syncAtt();refreshRsvpUi();renderWall();renderPhotos();renderOrg();toast(t("cleared"));
  });
  o.appendChild(clr);
}


function renderGlance(){
  var g=$("glance");if(!g)return;g.textContent="";
  DAYS.filter(invited).forEach(function(d,i){
    var a=el("a","gcard");a.href="#days";a.style.setProperty("--d",(i*.08)+"s");
    var art=el("div","day-art");art.setAttribute("aria-hidden","true");art.innerHTML=dayArtSvg(d.art)+'<span class="lb"></span>';a.appendChild(art);
    var top=el("div","gtop");top.appendChild(el("span","gdate",L(d.date)+", "+L(d.time)));top.appendChild(el("span","chip"+(d.open||guestInv?" open":""),guestInv?t("inv_you"):(d.open?t("open"):t("family"))));
    a.appendChild(top);a.appendChild(el("h3",null,L(d.title)));g.appendChild(a);
  });
}

/* ---------- the landing ornament comes from the look ---------- */
function themeName(){return document.documentElement.getAttribute("data-theme")||"dejhoor";}
(function(){var d=$("dejihor");if(!d)return;var lk=lookNow();if(!lk.ornament)return;
  d.innerHTML=lk.ornament();if(lk.aria)d.setAttribute("aria-label",t(lk.aria));if(lk.mount)lk.mount(d,reduceMotion);})();
function djCard(x,y){
  var lk=lookNow();
  closePop();pop=el("div","pop");pop.setAttribute("role","dialog");pop.setAttribute("aria-label",t(lk.cardTitle));
  pop.appendChild(el("b",null,t(lk.cardTitle)));
  (lk.cardKeys||[]).forEach(function(k){var p=el("p",null,t(k));p.style.margin="6px 0 0";pop.appendChild(p);});
  document.body.appendChild(pop);var w=pop.offsetWidth,vw=document.documentElement.clientWidth;
  var left=Math.max(12,Math.min(vw-w-12,x-w/2)),top=y+14;if(top+pop.offsetHeight>window.innerHeight-12)top=y-pop.offsetHeight-14;
  pop.style.left=(left+window.scrollX)+"px";pop.style.top=(top+window.scrollY)+"px";popFor=null;
}
(function(){var d=$("dejihor");if(!d)return;
  d.addEventListener("click",function(e){if(pop){closePop();return;}djCard(e.clientX,e.clientY);});
  d.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();var r=d.getBoundingClientRect();if(pop)closePop();else djCard(r.left+r.width/2,r.top+r.height/2);}});
})();
(function(){
  var cur=themeName(),btns=document.querySelectorAll("[data-set-theme]");
  btns.forEach(function(b){b.setAttribute("aria-pressed",b.getAttribute("data-set-theme")===cur?"true":"false");
    b.addEventListener("click",function(){var v=b.getAttribute("data-set-theme");if(v===cur)return;try{localStorage.setItem("lagan27_theme",v);}catch(e){}
      var u=new URL(location.href);if(u.searchParams.has("theme")){u.searchParams.delete("theme");location.replace(u.pathname+u.search+u.hash);}else{location.reload();}});});
  var mc=document.querySelector('meta[name="theme-color"]');var lkc=LOOKS[cur];if(mc&&lkc&&lkc.themeColor)mc.setAttribute("content",lkc.themeColor);
})();
window.addEventListener("scroll",function(){var c=$("cue");if(c)c.classList.toggle("gone",window.scrollY>40);},{passive:true});
$("cue").addEventListener("click",function(){var g=document.querySelector(".glance-h");if(g)g.scrollIntoView({behavior:reduceMotion?"auto":"smooth"});});

/* ---------- tumbaknaer ---------- */
var actx=null,beatTimer=null,noiseB=null;
function ac(){if(!actx){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{actx=new C();}catch(e){return null;}}if(actx.state==="suspended"){try{actx.resume();}catch(e){}}return actx;}
function noise(a){if(noiseB&&noiseB.sampleRate===a.sampleRate)return noiseB;var b=a.createBuffer(1,Math.floor(a.sampleRate*.3),a.sampleRate),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;noiseB=b;return b;}
function drumSound(kind){
  var a=ac();if(!a)return;var t0=a.currentTime+.005;
  if(kind==="dum"){
    var o=a.createOscillator(),g=a.createGain();o.type="sine";o.frequency.setValueAtTime(150,t0);o.frequency.exponentialRampToValueAtTime(64,t0+.32);
    g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.85,t0+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+.65);
    o.connect(g);g.connect(a.destination);o.start(t0);o.stop(t0+.7);
    var n=a.createBufferSource(),f=a.createBiquadFilter(),ng=a.createGain();n.buffer=noise(a);f.type="lowpass";f.frequency.value=700;
    ng.gain.setValueAtTime(.22,t0);ng.gain.exponentialRampToValueAtTime(.0001,t0+.12);n.connect(f);f.connect(ng);ng.connect(a.destination);n.start(t0);n.stop(t0+.14);
  }else{
    var n2=a.createBufferSource(),bp=a.createBiquadFilter(),g2=a.createGain();n2.buffer=noise(a);bp.type="bandpass";bp.frequency.value=2300;bp.Q.value=1.3;
    g2.gain.setValueAtTime(.0001,t0);g2.gain.exponentialRampToValueAtTime(.75,t0+.003);g2.gain.exponentialRampToValueAtTime(.0001,t0+.09);
    n2.connect(bp);bp.connect(g2);g2.connect(a.destination);n2.start(t0);n2.stop(t0+.11);
    var o2=a.createOscillator(),g3=a.createGain();o2.type="triangle";o2.frequency.setValueAtTime(540,t0);
    g3.gain.setValueAtTime(.22,t0);g3.gain.exponentialRampToValueAtTime(.0001,t0+.07);o2.connect(g3);g3.connect(a.destination);o2.start(t0);o2.stop(t0+.08);
  }
}
function drumHit(kind){
  drumSound(kind);
  var sv=document.querySelector("#tumbak svg");if(!sv)return;
  sv.classList.remove("hit-dum","hit-tak");void sv.getBoundingClientRect();sv.classList.add("hit-"+kind);
  setTimeout(function(){sv.classList.remove("hit-"+kind);},110);
  if(reduceMotion)return;
  var r=document.createElementNS(SVGNS,"ellipse");r.setAttribute("class","ripple");r.setAttribute("cx","198");r.setAttribute("cy","60");
  r.setAttribute("rx",kind==="dum"?"10":"24");r.setAttribute("ry",kind==="dum"?"18":"42");r.setAttribute("fill","none");r.setAttribute("stroke","#F3D3A6");r.setAttribute("stroke-width","1.2");
  sv.appendChild(r);setTimeout(function(){r.remove();},800);
}

function stopBeat(){if(beatTimer){clearInterval(beatTimer);beatTimer=null;}var b=$("tb-play");if(b)b.textContent=t("tb_play");}
function playBeat(){
  if(beatTimer){stopBeat();return;}
  stopIntro();
  var step=0,total=BEAT.length*4;$("tb-play").textContent=t("tb_stop");
  beatTimer=setInterval(function(){var k=BEAT[step%BEAT.length];if(k)drumHit(k);step++;if(step>=total)stopBeat();},200);
}
function renderTumbak(){
  var box=$("tumbak");if(!box)return;stopBeat();box.textContent="";
  var art=el("div");
  art.innerHTML='<svg viewBox="0 0 240 120" fill="none" role="img" aria-label="'+t("tb_h")+'">'+
   '<path class="zone" data-k="dum" d="M14 52Q20 47 30 48L100 52C124 46 146 22 188 16L188 104C146 98 124 74 100 68L30 72Q20 73 14 68Z" fill="#9A4A2A" stroke="#D6B678" stroke-width="1"/>'+
   '<path d="M124 42c18-11 36-18 58-22M124 78c18 11 36 18 58 22" stroke="#D6B678" stroke-width=".8" opacity=".55"/>'+
   '<g fill="#E3C79A" opacity=".75"><circle cx="138" cy="47" r="1.6"/><circle cx="150" cy="41" r="1.6"/><circle cx="162" cy="36" r="1.6"/><circle cx="138" cy="73" r="1.6"/><circle cx="150" cy="79" r="1.6"/><circle cx="162" cy="84" r="1.6"/><circle cx="60" cy="60" r="1.4"/><circle cx="72" cy="60" r="1.4"/></g>'+
   '<ellipse cx="192" cy="60" rx="28" ry="46" fill="#6E3219" stroke="#D6B678"/>'+
   '<ellipse class="skin zone" data-k="tak" cx="198" cy="60" rx="24" ry="42" fill="#E6CCA0" stroke="#C9A35A"/>'+
   '<ellipse class="zone" data-k="dum" cx="198" cy="60" rx="11" ry="20" fill="#E6CCA0" stroke="#C9A35A" stroke-dasharray="2 3" opacity=".9"/>'+
   '</svg>';
  var txt=el("div");txt.appendChild(el("h3",null,t("tb_h")));txt.appendChild(el("p",null,t("tb_p")));
  var row=el("div","tb-row");
  var pb=el("button","btn gold small",t("tb_play"));pb.type="button";pb.id="tb-play";pb.addEventListener("click",playBeat);
  var db=el("button","btn ghost small",t("tb_dum"));db.type="button";db.addEventListener("click",function(){drumHit("dum");});
  var kb=el("button","btn ghost small",t("tb_tak"));kb.type="button";kb.addEventListener("click",function(){drumHit("tak");});
  row.appendChild(pb);row.appendChild(db);row.appendChild(kb);txt.appendChild(row);txt.appendChild(el("p","tb-note",t("tb_note")));
  box.appendChild(art);box.appendChild(txt);
  art.querySelectorAll(".zone").forEach(function(z){z.addEventListener("pointerdown",function(e){e.preventDefault();drumHit(z.getAttribute("data-k"));});});
}

/* ---------- five seconds of tumbaknaer on arrival ---------- */
var introTimer=null,introDone=true; /* no synthetic drum on arrival */
function stopIntro(){if(introTimer){clearInterval(introTimer);introTimer=null;}}
function playIntro(){
  if(introDone||introTimer)return;introDone=true;stopBeat();
  var dj=$("dejihor"),step=0,total=25; /* 25 steps x 200 ms = 5 seconds */
  introTimer=setInterval(function(){
    var k=BEAT[step%BEAT.length];if(step===total-1)k="dum";
    if(k){drumSound(k);if(k==="dum"&&dj&&!reduceMotion){dj.classList.add("jolt");setTimeout(function(){dj.classList.remove("jolt");},170);}}
    step++;if(step>=total)stopIntro();
  },200);
}
/* Browsers only allow sound once the guest has touched the page, so the beat starts at
   once where the browser permits it, and otherwise on the guest's first tap or key press. */
(function(){
  function armed(){var embedded=false;try{embedded=window.self!==window.top;}catch(e){embedded=true;}return currentView==="home"&&!embedded;}
  function onFirst(){if(!armed())return;var a=ac();if(!a)return;off();if(a.state==="running")playIntro();else a.resume().then(playIntro,function(){});}
  function off(){document.removeEventListener("pointerdown",onFirst,true);document.removeEventListener("keydown",onFirst,true);}
  document.addEventListener("pointerdown",onFirst,true);document.addEventListener("keydown",onFirst,true);
  setTimeout(function(){if(!armed())return;try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return;var a=ac();if(a&&a.state==="running"){off();playIntro();}}catch(e){}},1600);
})();

/* ---------- contacts, countdown, larger text ---------- */
function renderContacts(){
  document.querySelectorAll(".contacts-slot").forEach(function(slot){
    slot.textContent="";slot.appendChild(el("h3","c-h",t("c_h")));
    var grid=el("div","contacts");
    CONTACTS.forEach(function(c){
      var card=el("div","contact");card.appendChild(el("span","chip",L(c.side)));
      card.appendChild(el("p","c-name",L(c.name)));card.appendChild(el("p","small",L(c.rel)+", "+c.phone));
      var row=el("div","c-row"),digits=c.phone.replace(/\D/g,"");
      var call=el("a","btn small",t("c_call"));call.href="tel:+"+digits;
      var wa=el("a","btn ghost small",t("c_wa"));wa.href="https://wa.me/"+digits;wa.target="_blank";wa.rel="noopener";
      row.appendChild(call);row.appendChild(wa);card.appendChild(row);grid.appendChild(card);
    });
    slot.appendChild(grid);slot.appendChild(el("p","small",t("c_note")));
  });
}
function renderCountdown(){
  var w=$("f-count-wrap");if(!w)return;var now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  var n=Math.round((new Date(2027,1,13)-today)/864e5);if(n<=0){w.hidden=true;return;}w.hidden=false;
  $("f-count").textContent=n.toLocaleString(lang==="hi"?"hi-IN":"en-IN");
}
function applySize(big){document.documentElement.classList.toggle("big",big);var b=$("size-btn");b.setAttribute("aria-pressed",big?"true":"false");b.setAttribute("aria-label",t("big"));b.title=t("big");}
var bigText=load("lagan27_big",false)===true;
$("size-btn").addEventListener("click",function(){bigText=!bigText;save("lagan27_big",bigText);applySize(bigText);});
/* ---------- views ---------- */
var VIEW_OF={"":"home",home:"home",top:"home",days:"days",ceremony:"ceremony",notes:"ceremony",rsvp:"rsvp",blessings:"wishes",photos:"wishes",wishes:"wishes",family:"family"};
var currentView=null,guestName=null;
var rvIO=("IntersectionObserver" in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");rvIO.unobserve(e.target);}});},{threshold:.1}):null;
function revealIn(){document.querySelectorAll(".rv:not(.in)").forEach(function(n){if(rvIO)rvIO.observe(n);else n.classList.add("in");});}
var guestInv=null;
(function(){var me=load("lagan27_me",null);if(me&&me.name){guestName=me.name;guestInv=me.inv||null;}})();
function invOf(d){return d.art==="maenz"?"m":d.art==="lagan"?"l":"f";}
function invited(d){return !guestInv||guestInv.indexOf(invOf(d))>-1;}
function applyInvites(){
  var showM=!guestInv||guestInv.indexOf("m")>-1,showL=!guestInv||guestInv.indexOf("l")>-1;
  var lm=$("ev-maenz").closest("label"),ll=$("ev-lagan").closest("label");
  lm.hidden=!showM;ll.hidden=!showL;if(!showM)$("ev-maenz").checked=false;if(!showL)$("ev-lagan").checked=false;
  var n=$("inv-note");if(n)n.hidden=!guestInv;
}
function greetGuest(sl){
  var parts=sl.split("--");sl=parts[0];guestInv=parts[1]?parts[1].split(""):null;
  var small={ji:1,and:1,family:1,of:1};guestName=sl.split("-").map(function(w,i){return !w?"":(i&&small[w])?w:w.charAt(0).toUpperCase()+w.slice(1);}).join(" ").trim();
  if(guestName&&!$("r-name").value&&!rsvps.some(function(r){return r.mine;}))$("r-name").value=guestName;
  save("lagan27_me",{name:guestName,inv:guestInv});applyInvites();renderDays();renderGlance();watchDays();revealIn();
}
function applyGreet(){var g=$("greet");if(guestName){g.textContent=t("greet",{name:guestName});g.hidden=false;}else g.hidden=true;}
function route(){
  var h=(location.hash||"").replace(/^#/,"");
  if(/^g-[a-z0-9-]+$/.test(h)){greetGuest(h.slice(2));applyGreet();h="home";}
  applyInvites();
  var v=VIEW_OF[h]||"home",changed=v!==currentView;currentView=v;if(v!=="ceremony")stopBeat();if(v!=="home")stopIntro();
  document.querySelectorAll("main>[data-view]").forEach(function(sc){sc.classList.toggle("on",sc.dataset.view===v);});
  document.querySelectorAll("[data-v]").forEach(function(a){a.setAttribute("aria-current",a.dataset.v===v?"true":"false");});
  if(changed)window.scrollTo(0,0);
  if(h==="notes"||h==="photos"){var tg=$(h);if(tg)setTimeout(function(){tg.scrollIntoView({behavior:reduceMotion?"auto":"smooth"});},changed?160:0);}
  if(v==="ceremony")setTimeout(function(){go(current);fitDeck();},60);
  if(v==="family")renderOrg();
  revealIn();
}
window.addEventListener("hashchange",route);
document.querySelectorAll(".sec-head,.notes>div,.keep-card,.wall").forEach(function(n){n.classList.add("rv");});

/* ---------- language ---------- */
function renderAll(){applyStatic();renderDeckProg();renderDays();renderGlance();renderTumbak();renderContacts();renderCountdown();applySize(bigText);watchDays();renderDeck();renderGloss();refreshRsvpUi();setRecUi();recStatus("rec_idle");renderWall();renderPhotos();if(currentView==="family")renderOrg();applyGreet();var bn=$("tile-bl-n");if(bn){bn.firstChild.nodeValue=String(blessings.length+SAMPLE_BLESSINGS.length)+" ";}revealIn();}
document.querySelectorAll(".lang button").forEach(function(b){b.addEventListener("click",function(){lang=b.dataset.lang;save(KEYS.lang,lang);var keep=current;var mm=document.querySelector("main");mm.classList.remove("swap");void mm.offsetWidth;mm.classList.add("swap");renderAll();current=keep;go(keep);});});

/* ---------- boot ---------- */
(function(){var h=(location.hash||"").replace(/^#/,"");if(h&&h!=="home"&&h!=="family"&&!/^g-[a-z0-9-]+$/.test(h)){try{history.replaceState(null,"","#home");}catch(e){}}})();
setCount(2);prefillRsvp();syncAtt();route();renderAll();if(rsvps.some(function(r){return r.mine;})){openCase(true);showStamp(false);}
})();
