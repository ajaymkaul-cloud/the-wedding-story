/* Look: Khatamband. Lake teal and gold, after the geometric walnut ceilings of old Kashmiri homes. */
(window.WS_LOOKS=window.WS_LOOKS||{}).khatamband={
 artStyle:"geometric",themeColor:"#123A40",aria:"kh_aria",cardTitle:"kh_title",cardKeys:["kh_body","kh_body2"],
 T:{"en": {"kh_aria": "About Khatamband", "kh_title": "Khatamband", "kh_body": "The carved ceilings of old Kashmiri homes, made from small pieces of walnut or deodar fitted together by hand, without nails.", "kh_body2": "This look borrows their geometry: many small pieces, one pattern."}, "hi": {"kh_aria": "खतमबंद के बारे में", "kh_title": "खतमबंद", "kh_body": "पुराने कश्मीरी घरों की नक्काशीदार छतें, जो अखरोट या देवदार की लकड़ी के छोटे-छोटे टुकड़ों को बिना कील के हाथ से जोड़कर बनाई जाती हैं।", "kh_body2": "यह रूप उन्हीं की ज्यामिति से प्रेरित है: अनेक छोटे टुकड़े, एक नक्शा।"}},
 ornament:function(){return khSvg();}
};
function khSvg(){
  var oct=function(r,rot){var p=[];for(var i=0;i<8;i++){var a=(i*45+rot)*Math.PI/180;p.push((100+r*Math.cos(a)).toFixed(2)+" "+(100+r*Math.sin(a)).toFixed(2));}return "M"+p.join("L")+"Z";};
  var star=function(R,r){var p=[];for(var i=0;i<16;i++){var rr=i%2?r:R,a=(i*22.5-90)*Math.PI/180;p.push((100+rr*Math.cos(a)).toFixed(2)+" "+(100+rr*Math.sin(a)).toFixed(2));}return "M"+p.join("L")+"Z";};
  var spokes="";for(var i=0;i<8;i++){var a=(i*45+22.5)*Math.PI/180;spokes+="M"+(100+40*Math.cos(a)).toFixed(2)+" "+(100+40*Math.sin(a)).toFixed(2)+"L"+(100+86*Math.cos(a)).toFixed(2)+" "+(100+86*Math.sin(a)).toFixed(2);}
  var petals="";for(var j=0;j<8;j++){var b=(j*45)*Math.PI/180,cx=100+64*Math.cos(b),cy=100+64*Math.sin(b);petals+="M"+(cx+9*Math.cos(b)).toFixed(2)+" "+(cy+9*Math.sin(b)).toFixed(2)+"L"+(cx+9*Math.cos(b+1.5708)).toFixed(2)+" "+(cy+9*Math.sin(b+1.5708)).toFixed(2)+"L"+(cx-9*Math.cos(b)).toFixed(2)+" "+(cy-9*Math.sin(b)).toFixed(2)+"L"+(cx-9*Math.cos(b+1.5708)).toFixed(2)+" "+(cy-9*Math.sin(b+1.5708)).toFixed(2)+"Z";}
  return '<svg class="kh" viewBox="-6 -6 212 212" aria-hidden="true"><g class="turn">'+
    '<path class="ln l1" pathLength="1" stroke-width=".9" d="'+oct(98,22.5)+'"/>'+
    '<path class="ln l1" pathLength="1" stroke-width=".6" d="'+oct(90,22.5)+'"/>'+
    '<path class="ln l2" pathLength="1" stroke-width=".7" d="'+spokes+'"/>'+
    '<path class="ln l2" pathLength="1" stroke-width=".8" d="'+petals+'"/>'+
    '<path class="ln l3" pathLength="1" stroke-width="1" d="'+star(44,24)+'"/>'+
    '<path class="ln l3" pathLength="1" stroke-width=".6" d="'+oct(40,0)+'"/>'+
    '<path class="ln l4" pathLength="1" stroke-width=".8" d="'+star(20,10)+'"/>'+
    '<circle class="core" cx="100" cy="100" r="3.2"/></g></svg>';
}
