/* Look: Marigold. Strings of marigold flowers swaying on the landing. */
(window.WS_LOOKS=window.WS_LOOKS||{}).marigold={
 artStyle:"hand",themeColor:"#FFF6E8",aria:"mg_aria",cardTitle:"mg_title",cardKeys:["mg_body","mg_body2"],
 T:{en:{mg_aria:"About the marigold strings",mg_title:"Marigold",mg_body:"Strings of marigold, the genda, hang at doorways and mandaps across India for a good beginning.",mg_body2:"Bright, warm and easy to love: this look suits any family."},
    hi:{mg_aria:"गेंदे की लड़ियों के बारे में",mg_title:"गेंदा",mg_body:"शुभ शुरुआत के लिए पूरे भारत में दरवाज़ों और मंडपों पर गेंदे के फूलों की लड़ियाँ सजाई जाती हैं।",mg_body2:"चटक, गर्म और सबको भाने वाला: यह रूप हर परिवार के लिए है।"}},
 ornament:function(){return mgSvg(1,9)+mgSvg(2,7)+mgSvg(3,8);}
};
/* one hanging string: n flowers, a leaf pair every third flower, a rani-pink bead at the end */
function mgSvg(i,n){
  var gap=30,top=24,H=top+n*gap+40,s='';
  s+='<path d="M40 0V'+(top+(n-1)*gap)+'" stroke="#C98A2B" stroke-width="1.1"/>';
  for(var k=0;k<n;k++){
    var y=top+k*gap,c=(k%2)?"#F6A21A":"#F7B733",d=(k%2)?"#E07B00":"#EE9512";
    if(k%3===1){s+='<path d="M40 '+(y-14)+'c-10-6-18-4-24 2 8 3 16 3 24-2zM40 '+(y-14)+'c10-6 18-4 24 2-8 3-16 3-24-2z" fill="#4E8A3C"/>';}
    s+='<circle cx="40" cy="'+y+'" r="11" fill="'+c+'"/>';
    s+='<circle cx="40" cy="'+y+'" r="11" fill="none" stroke="'+d+'" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 5.2"/>';
    s+='<circle cx="40" cy="'+y+'" r="5" fill="'+d+'" opacity=".55"/>';
  }
  var yb=top+(n-1)*gap+16;
  s+='<path d="M40 '+(yb-4)+'V'+(yb+6)+'" stroke="#C98A2B" stroke-width="1.1"/><path d="M40 '+(yb+6)+'l7 9-7 9-7-9z" fill="#C2185B"/>';
  return '<svg class="mg mg'+i+'" viewBox="0 0 80 '+(H+20)+'" fill="none" aria-hidden="true">'+s+'</svg>';
}
