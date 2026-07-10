const storyMap=L.map('storyMap',{zoomControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,attributionControl:false}).setView([48.7758,9.1829],11.4);
const darkLayer=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(storyMap);
const satelliteLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19});
let cityLayer=null,districtLayer=null,districtData=null;
const views=[{center:[48.7758,9.1829],zoom:11.4},{center:[48.776,9.183],zoom:13.3},{center:[48.775,9.165],zoom:12.5},{center:[48.773,9.15],zoom:13},{center:[48.7758,9.1829],zoom:11},{center:[48.7758,9.1829],zoom:11.2},{center:[48.7758,9.1829],zoom:10.8}];
const steps=[...document.querySelectorAll('.step')],bigNumber=document.getElementById('bigNumber'),progressFill=document.getElementById('progressFill');

function colorByLST(v){const t=Math.max(0,Math.min(1,(v-27)/20));const stops=['#176b54','#f0d84f','#f08a24','#e53920','#7f0000'];return stops[Math.min(stops.length-1,Math.floor(t*stops.length))]}

Promise.all([
 fetch('data/stuttgart-grid-placeholder.geojson').then(r=>r.json()),
 fetch('data/stuttgart-districts.geojson').then(r=>r.json())
]).then(([grid,districts])=>{
 districtData=districts;
 cityLayer=L.geoJSON(grid,{style:f=>({color:'rgba(255,255,255,.07)',weight:.3,fillColor:colorByLST(Number(f.properties.lst_18)),fillOpacity:.54}),interactive:false}).addTo(storyMap);
 districtLayer=L.geoJSON(districts,{style:{color:'rgba(255,255,255,.18)',weight:1,fillOpacity:0},interactive:false}).addTo(storyMap);
});

function setBasemap(step){
 if(step===2){
  if(storyMap.hasLayer(darkLayer))storyMap.removeLayer(darkLayer);
  if(!storyMap.hasLayer(satelliteLayer))satelliteLayer.addTo(storyMap);
 }else{
  if(storyMap.hasLayer(satelliteLayer))storyMap.removeLayer(satelliteLayer);
  if(!storyMap.hasLayer(darkLayer))darkLayer.addTo(storyMap);
 }
 if(cityLayer)cityLayer.bringToFront();
 if(districtLayer)districtLayer.bringToFront();
}

function styleForStep(step){
 if(!cityLayer||!districtLayer)return;
 if(step===1){
  cityLayer.setStyle(f=>({color:'rgba(255,255,255,.06)',weight:.3,fillColor:f.properties.district==='Mitte'?'#8d110c':'#242824',fillOpacity:f.properties.district==='Mitte'?.82:.12}));
  districtLayer.setStyle(f=>({color:f.properties.district==='Mitte'?'#fff':'rgba(255,255,255,.12)',weight:f.properties.district==='Mitte'?2.5:.8,fillOpacity:0}));
 }else if(step===2){
  cityLayer.setStyle({fillOpacity:0,opacity:0});
  districtLayer.setStyle(f=>{const d=f.properties.district,focus=d==='Mitte'||d==='West';return{color:focus?(d==='Mitte'?'#ff6a4a':'#6bd1aa'):'rgba(255,255,255,.06)',weight:focus?3:.5,fillColor:focus?(d==='Mitte'?'#ff6a4a':'#6bd1aa'):'#000',fillOpacity:focus?.08:0}});
 }else if(step===3){
  cityLayer.setStyle(f=>({color:'rgba(255,255,255,.06)',weight:.3,fillColor:f.properties.district==='West'?'#d7472f':'#242824',fillOpacity:f.properties.district==='West'?.8:.1}));
  districtLayer.setStyle(f=>({color:f.properties.district==='West'?'#fff':'rgba(255,255,255,.1)',weight:f.properties.district==='West'?2.3:.7,fillOpacity:0}));
 }else if(step===5){
  cityLayer.setStyle(f=>{const n=Number(f.properties.ndvi_18);return{color:'rgba(255,255,255,.05)',weight:.25,fillColor:n>.32?'#1c7a47':n>.22?'#8ca53d':'#a0522d',fillOpacity:.55}});
  districtLayer.setStyle({color:'rgba(255,255,255,.14)',weight:.8,fillOpacity:0});
 }else{
  cityLayer.setStyle(f=>({color:'rgba(255,255,255,.07)',weight:.3,fillColor:colorByLST(Number(f.properties.lst_18)),fillOpacity:.54}));
  districtLayer.setStyle({color:'rgba(255,255,255,.18)',weight:1,fillOpacity:0});
 }
}

const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const step=Number(entry.target.dataset.step);document.body.className=`step-${step}`;bigNumber.textContent=step===0?'11/11':'';progressFill.style.width=`${((step+1)/steps.length)*100}%`;setBasemap(step);const view=views[step]||views[0];storyMap.flyTo(view.center,view.zoom,{duration:1.25});styleForStep(step)})},{threshold:.58});
steps.forEach(s=>observer.observe(s));
window.addEventListener('scroll',()=>{const story=document.getElementById('story'),rect=story.getBoundingClientRect(),total=story.offsetHeight-window.innerHeight,progress=Math.max(0,Math.min(1,-rect.top/total));progressFill.style.width=`${progress*100}%`},{passive:true});
