// frontend/script.js — Clean creative UI without rain
// Features:
// - colourful flashcards gallery (All-India crops)
// - modal with crop details and "Use as preset" / "Copy name"
// - Chart.js donut for probabilities with legend
// - presets, random demo, shuffle colours, search
// - no rain/raindrop code (removed as requested)
// Update API_URL to point to your backend if needed.

const API_URL = "http://127.0.0.1:8000/predict";

const CROP_LIST = [
  { id: "Rice", emoji: "🍚", desc: "Staple cereal grown across India." },
  { id: "Wheat", emoji: "🌾", desc: "Major rabi cereal in northern India." },
  { id: "Maize", emoji: "🌽", desc: "Versatile cereal used for food & feed." },
  { id: "Barley", emoji: "🌾", desc: "Fodder and brewing grain." },
  { id: "Bajra (Pearl millet)", emoji: "🌱", desc: "Drought-tolerant millet." },
  { id: "Jowar (Sorghum)", emoji: "🌱", desc: "Important dryland crop." },
  { id: "Ragi (Finger millet)", emoji: "🌾", desc: "Nutritious millet of South India." },
  { id: "Foxtail millet", emoji: "🌾", desc: "Small-grain millet." },
  { id: "Tur (Pigeon pea)", emoji: "🫘", desc: "Popular pulse (arhar/toor)." },
  { id: "Gram (Chickpea)", emoji: "🧆", desc: "Chana — widely grown pulse." },
  { id: "Urad (Black gram)", emoji: "🫘", desc: "Used in dal and batter." },
  { id: "Moong (Green gram)", emoji: "🫘", desc: "Short-duration pulse." },
  { id: "Lentil", emoji: "🥣", desc: "Common dal crop." },
  { id: "Mustard", emoji: "🌼", desc: "Oilseed in north and central India." },
  { id: "Groundnut", emoji: "🥜", desc: "Oilseed & cash crop." },
  { id: "Soybean", emoji: "🫘", desc: "Major oilseed & protein source." },
  { id: "Sunflower", emoji: "🌻", desc: "Oilseed crop." },
  { id: "Cotton", emoji: "🧵", desc: "Fiber crop for textiles." },
  { id: "Sugarcane", emoji: "🎋", desc: "Cash crop for sugar industry." },
  { id: "Banana", emoji: "🍌", desc: "Tropical fruit, high yield." },
  { id: "Mango", emoji: "🥭", desc: "King of fruits; many varieties." },
  { id: "Apple", emoji: "🍎", desc: "Temperate fruit (hills)." },
  { id: "Grapes", emoji: "🍇", desc: "Table & wine grapes." },
  { id: "Potato", emoji: "🥔", desc: "High-calorie tuber crop." },
  { id: "Tomato", emoji: "🍅", desc: "Important vegetable crop." },
  { id: "Onion", emoji: "🧅", desc: "Valuable cash crop." },
  { id: "Tea", emoji: "🍵", desc: "Plantation crop in hills." },
  { id: "Coffee", emoji: "☕", desc: "Grown in southern hills." },
  { id: "Coconut", emoji: "🥥", desc: "Coastal plantation crop." },
  { id: "Cashew", emoji: "🌰", desc: "Tree nut; coastal pockets." }
];

const PALETTE = [
  '#ff7a7a','#ffd86b','#9be564','#7be0ff','#8c9bff','#d295ff','#ffb3dd','#ffa874',
  '#a6f6b8','#ffd1a8','#f5d1ff','#cce0ff','#f2f7b2','#b9f0ff','#f9d3d3','#d4f0d6'
];

const cropGallery = document.getElementById('cropGallery');
const searchInput = document.getElementById('search');
const preset = document.getElementById('preset');
const shuffleColors = document.getElementById('shuffleColors');
const showAllBtn = document.getElementById('showAll');
const randomizeBtn = document.getElementById('randomize');
const form = document.getElementById('form');
const probCanvas = document.getElementById('probChart');
const chartLegend = document.getElementById('chartLegend');
const statusEl = document.getElementById('status');
const resultDiv = document.getElementById('result');
const modal = document.getElementById('cropModal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const useAsPresetBtn = document.getElementById('useAsPreset');
const copyNameBtn = document.getElementById('copyName');
const themeToggle = document.getElementById('themeToggle');

let chart = null;
let hueOffset = 0;

/* small helpers */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function showToast(msg, ms=1200){
  let t = document.getElementById('toastMsg');
  if(!t){
    t = document.createElement('div'); t.id='toastMsg';
    Object.assign(t.style,{position:'fixed',left:'50%',transform:'translateX(-50%)',bottom:'18px',background:'rgba(6,12,10,0.9)',color:'#fff',padding:'8px 12px',borderRadius:'8px',zIndex:9999,opacity:0,transition:'opacity 160ms'});
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1'; setTimeout(()=>t.style.opacity='0', ms);
}

/* Gallery rendering */
function renderGallery(list = CROP_LIST){
  if(!cropGallery) return;
  cropGallery.innerHTML = '';
  list.forEach((c, i)=>{
    const hue1 = (i * 26 + hueOffset) % 360;
    const hue2 = (hue1 + 38) % 360;
    const grad = `linear-gradient(135deg,hsl(${hue1} 75% 64%), hsl(${hue2} 75% 52%))`;
    const btn = document.createElement('button');
    btn.className = 'crop-tile';
    btn.setAttribute('data-crop', c.id);
    btn.innerHTML = `<div class="crop-stripe" style="background:${grad}"></div><div class="crop-emoji">${c.emoji}</div><div class="crop-name">${c.id}</div>`;
    btn.addEventListener('click', ()=> openModal(c));
    cropGallery.appendChild(btn);
  });
}

/* modal */
function openModal(crop){
  modalContent.innerHTML = `
    <div class="modal-top">
      <div class="modal-emoji">${crop.emoji}</div>
      <div>
        <h2 id="modalTitle">${escapeHtml(crop.id)}</h2>
        <p class="muted">${escapeHtml(crop.desc || '')}</p>
      </div>
    </div>
    <hr/>
    <div class="modal-body">
      <p><strong>Why this crop?</strong></p>
      <p class="muted">This demo provides suggested crops based on soil and local conditions. Use this modal to copy the crop name or apply it as a quick preset.</p>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.dataset.crop = crop.id;
  document.body.style.overflow = 'hidden';
}
closeModal?.addEventListener('click', ()=>{ modal.classList.add('hidden'); document.body.style.overflow = ''; });
modal?.addEventListener('click', (e)=>{ if(e.target === modal){ modal.classList.add('hidden'); document.body.style.overflow = ''; } });
copyNameBtn?.addEventListener('click', async ()=>{ const name = modal.dataset.crop; try{ await navigator.clipboard.writeText(name); showToast(`"${name}" copied`); }catch{ showToast(name); }});
useAsPresetBtn?.addEventListener('click', ()=>{ const name = modal.dataset.crop; applyCropPreset(name); modal.classList.add('hidden'); document.body.style.overflow = ''; showToast(`Preset applied: ${name}`); });

/* ripple effect for gallery clicks (visual) */
function rippleEffect(tile){
  const r = document.createElement('span');
  Object.assign(r.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'6px',height:'6px',borderRadius:'50%',background:'rgba(255,255,255,0.6)',pointerEvents:'none'});
  tile.appendChild(r);
  r.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:'translate(-50%,-50%) scale(26)',opacity:0}],{duration:700,easing:'cubic-bezier(.2,.9,.2,1)'});
  setTimeout(()=>r.remove(),750);
}

/* Chart */
function initChart(){
  const ctx = probCanvas.getContext('2d');
  chart = new Chart(ctx, { type: 'doughnut', data: { labels: ['No data'], datasets: [{ data: [100], backgroundColor: ['#e7fff5'] }] }, options: { plugins: { legend: { display: false } }, maintainAspectRatio: false, cutout: '50%' } });
  renderLegend([]);
}
function renderLegend(items){
  if(!chartLegend) return;
  if(!items || items.length === 0){ chartLegend.innerHTML = `<div class="muted">No predictions yet.</div>`; return; }
  chartLegend.innerHTML = items.map((it,i)=>`<div class="legend-item"><span class="legend-color" style="background:${PALETTE[i%PALETTE.length]}"></span><div>${escapeHtml(it.label)} — ${it.value}%</div></div>`).join('');
}
function updateChart(recs){
  if(!chart) return;
  const labels = recs.map(r=>r.crop);
  const data = recs.map(r=>Math.round(r.probability*100));
  const colors = labels.map((_,i)=>PALETTE[i%PALETTE.length]);
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.data.datasets[0].backgroundColor = colors;
  chart.update();
  renderLegend(labels.map((l,i)=>({ label: l, value: data[i] })));
}

/* read inputs */
function readPayload(){
  return {
    N: parseFloat(document.getElementById('N').value||0),
    P: parseFloat(document.getElementById('P').value||0),
    K: parseFloat(document.getElementById('K').value||0),
    temperature: parseFloat(document.getElementById('temperature').value||0),
    humidity: parseFloat(document.getElementById('humidity').value||0),
    pH: parseFloat(document.getElementById('pH').value||0),
    rainfall: parseFloat(document.getElementById('rainfall').value||0)
  };
}

/* submit -> backend predict */
async function onSubmit(e){
  e.preventDefault();
  statusEl.textContent = 'Requesting...';
  resultDiv.innerHTML = `<div class="empty-state"><p class="muted">Loading results…</p></div>`;
  const top_k = parseInt(document.getElementById('top_k').value||'5',10);
  const payload = readPayload();
  try{
    const resp = await fetch(`${API_URL}?top_k=${top_k}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if(!resp.ok){ const err = await resp.json().catch(()=>({detail:resp.statusText})); throw new Error(err.detail || 'Request failed'); }
    const data = await resp.json();
    const recs = data.recommendations || [];
    renderResults(recs);
    statusEl.textContent = 'done';
  }catch(err){
    resultDiv.innerHTML = `<div class="empty-state"><p style="color:#b00020">Error: ${escapeHtml(err.message)}</p></div>`;
    statusEl.textContent = 'error';
    console.error(err);
  }
}
form.addEventListener('submit', onSubmit);

/* render results & highlight gallery */
function renderResults(recs){
  if(!recs || recs.length===0){ resultDiv.innerHTML = `<div class="empty-state"><p class="muted">No recommendations.</p></div>`; updateChart([]); highlightGallery([]); return; }
  const html = `<div class="result-list">${recs.map(r=>`<div class="reco"><strong>${escapeHtml(r.crop)}</strong><div style="display:flex;align-items:center;gap:10px"><div class="bar"><i style="width:${(r.probability*100).toFixed(1)}%"></i></div><div style="min-width:48px;text-align:right">${(r.probability*100).toFixed(1)}%</div></div></div>`).join('')}</div>`;
  resultDiv.innerHTML = html;
  updateChart(recs);
  highlightGallery(recs.map(r=>r.crop));
}
function highlightGallery(topNames){
  const tiles = cropGallery.querySelectorAll('.crop-tile');
  tiles.forEach(t=>{
    const name = t.querySelector('.crop-name')?.textContent;
    if(topNames.includes(name)){ t.classList.add('top'); t.classList.remove('dim'); }
    else { t.classList.remove('top'); t.classList.add('dim'); }
  });
}

/* search, shuffle, show all, random demo, theme toggle */
searchInput?.addEventListener('input',(e)=>{ const q=e.target.value.trim().toLowerCase(); renderGallery(q ? CROP_LIST.filter(c=>c.id.toLowerCase().includes(q)) : CROP_LIST); });
shuffleColors?.addEventListener('click', ()=>{ hueOffset = Math.floor(Math.random()*360); renderGallery(); showToast('Colours shuffled'); });
showAllBtn?.addEventListener('click', ()=>{ searchInput.value=''; renderGallery(); });
randomizeBtn?.addEventListener('click', ()=>{ const rand = (min,max,step=1)=> Math.round((Math.random()*(max-min)+min)/step)*step; document.getElementById('N').value = rand(10,100,1); document.getElementById('P').value = rand(10,100,1); document.getElementById('K').value = rand(10,100,1); document.getElementById('temperature').value = (Math.random()*20+15).toFixed(1); document.getElementById('humidity').value = (Math.random()*40+50).toFixed(1); document.getElementById('pH').value = (Math.random()*2+5.5).toFixed(2); document.getElementById('rainfall').value = (Math.random()*300+20).toFixed(1); });
themeToggle?.addEventListener('click', ()=>{ document.body.classList.toggle('dark'); showToast('Theme toggled'); });

/* presets */
preset?.addEventListener('change',(e)=>{
  const v = e.target.value;
  if(v==='dry'){ document.getElementById('rainfall').value=60; document.getElementById('temperature').value=30; document.getElementById('humidity').value=45; }
  else if(v==='wet'){ document.getElementById('rainfall').value=400; document.getElementById('temperature').value=20; document.getElementById('humidity').value=85; }
  else if(v==='hot'){ document.getElementById('temperature').value=34; document.getElementById('rainfall').value=80; document.getElementById('humidity').value=40; }
  else { document.getElementById('N').value=80; document.getElementById('P').value=50; document.getElementById('K').value=40; document.getElementById('temperature').value=22.0; document.getElementById('humidity').value=80.0; document.getElementById('pH').value=6.6; document.getElementById('rainfall').value=190.0; }
});

/* apply crop as heuristic preset (used from modal) */
function applyCropPreset(name){
  const n = name.toLowerCase();
  if(n.includes('rice')){ document.getElementById('rainfall').value = 200; document.getElementById('temperature').value = 25; document.getElementById('humidity').value = 85; }
  else if(n.includes('wheat') || n.includes('barley')){ document.getElementById('rainfall').value = 120; document.getElementById('temperature').value = 18; document.getElementById('humidity').value = 70; }
  else if(n.includes('millet') || n.includes('maize')){ document.getElementById('rainfall').value = 90; document.getElementById('temperature').value = 28; document.getElementById('humidity').value = 60; }
  else { document.getElementById('rainfall').value = 110; }
}

/* init */
window.addEventListener('load', ()=>{
  renderGallery();
  initChart();
  // subtle background movement
  setInterval(()=>{ document.getElementById('bgParticles').style.transform = `translateY(${Math.random()*8-4}px)`; }, 4500);
});

/* expose some helpers for debugging */
window.appUI = { renderGallery, renderResults, applyCropPreset };