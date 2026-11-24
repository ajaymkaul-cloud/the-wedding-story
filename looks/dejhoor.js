/* Look: Dejhoor. Walnut and gold, with the Dejhoor ear ornament swaying on the landing. */
(window.WS_LOOKS=window.WS_LOOKS||{}).dejhoor={
 artStyle:"hand",themeColor:"#2B1D16",cardTitle:"dj_title",cardKeys:["dj_aath","dj_dej","dj_athor"],
 T:{"en": {"dj_title": "The Dejhoor", "dj_aath": "Aath: the chain or thread that holds it and hooks onto the ear.", "dj_dej": "Dejhoor: the main hanging ornament, often hexagonal like a shatkon yantra. It comes from the bride's family and is worn through the upper ear.", "dj_athor": "Athor: the decorative piece that hangs below."}, "hi": {"dj_title": "देजहूर", "dj_aath": "आथ: वह चेन या धागा जो इसे थामता है और कान में अटकता है।", "dj_dej": "देजहूर: मुख्य लटकता आभूषण, अक्सर षट्कोण यंत्र जैसा। यह वधू के परिवार से आता है और कान के ऊपरी हिस्से में पहना जाता है।", "dj_athor": "अथोर: नीचे लटकने वाला सजावटी हिस्सा।"}},
 ornament:function(){return djSvg(1,290)+djSvg(2,215);},
 mount:function(d,reduce){d.querySelectorAll("svg").forEach(function(v){v.setAttribute("aria-hidden","true");});if(reduce)d.querySelectorAll("animateTransform").forEach(function(a){a.remove();});}
};
function djSvg(n,len){
  var H=len+74,g="djg"+n,c="djc"+n,k="#7E571A";
  return '<svg class="dj dj'+n+'" viewBox="0 0 80 '+H+'" fill="none">'+
   '<defs><linearGradient id="'+g+'" x1="0" y1="0" x2="1" y2=".45"><stop offset="0" stop-color="#9C6B1E"/><stop offset=".42" stop-color="#E2BE6E"/><stop offset=".5" stop-color="#FFF0C4"/><stop offset=".58" stop-color="#E2BE6E"/><stop offset="1" stop-color="#9C6B1E"/>'+
   '<animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1 0;1 0" keyTimes="0;.55;1" dur="'+(6+n*1.5)+'s" repeatCount="indefinite"/></linearGradient>'+
   '<clipPath id="'+c+'"><path d="M19 0L29-7.5H51L61 0 51 7.5H29Z"/></clipPath></defs>'+
   '<path d="M40 0V'+len+'" stroke="#D6B678" stroke-width="1.1" stroke-dasharray="2.2 1.6"/>'+
   '<g transform="translate(0 '+(len+18)+')">'+
    '<circle cx="40" cy="-15" r="3" stroke="#C9A35A" stroke-width="1"/>'+
    '<path d="M10 0L25-12H55L70 0 55 12H25Z" fill="url(#'+g+')" stroke="'+k+'" stroke-width=".7"/>'+
    '<path d="M19 0L29-7.5H51L61 0 51 7.5H29Z" stroke="'+k+'" stroke-width=".6"/>'+
    '<g clip-path="url(#'+c+')" stroke="'+k+'" stroke-width=".45" opacity=".85"><path d="M16-14 30 14M24-14 38 14M32-14 46 14M40-14 54 14M48-14 62 14M56-14 70 14M64-14 50 14M56-14 42 14M48-14 34 14M40-14 26 14M32-14 18 14M24-14 10 14"/></g>'+
    '<circle cx="40" cy="0" r="2.6" fill="url(#'+g+')" stroke="'+k+'" stroke-width=".6"/>'+
    '<circle cx="8" cy="0" r="2.4" fill="url(#'+g+')" stroke="'+k+'" stroke-width=".6"/><circle cx="72" cy="0" r="2.4" fill="url(#'+g+')" stroke="'+k+'" stroke-width=".6"/>'+
    '<g class="drop"><path d="M40 12V12.6" stroke="#C9A35A"/><circle cx="40" cy="15" r="2.4" stroke="#C9A35A" stroke-width="1"/><path d="M40 17.4V22" stroke="#C9A35A"/>'+
     '<path d="M40 47C27 38 25 28 32 23.5C36 21 40 24 40 27.5C40 24 44 21 48 23.5C55 28 53 38 40 47Z" fill="url(#'+g+')" stroke="'+k+'" stroke-width=".7"/>'+
     '<path d="M40 42C33 37 31 31 34.5 28" stroke="#FFF0C4" stroke-width=".7" opacity=".7"/></g>'+
   '</g></svg>';
}
