// frontend/script.js — Polished UI + "WOW" animations
// - Keeps previous features: gallery, modal, Chart.js, presets, predict API.
// - Adds: card tilt micro-interaction, confetti burst when top recommendation appears,
//         nicer animations, accessible controls.
// - Decorative blue rain overlay is toggled by rainToggle or "wet" preset.
// Note: after updating files hard-refresh the page (Ctrl+F5).

const API_URL = "http://127.0.0.1:8000/predict";

/* ---------------- Data ---------------- */
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

const PALETTE = ['#3db8ff','#18a0ff','#7be0ff','#8c9bff','#9be564','#ff7a7a'];

/* ---------------- DOM refs ---------------- */
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
const rainToggle = document.getElementById('rainToggle');

/* blue rain module elements */
const blueRainContainer = document.getElementById('blueRain');
const blueRainCanvas = document.getElementById('blueRainCanvas');

/* confetti canvas */
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas && confettiCanvas.getContext ? confettiCanvas.getContext('2d') : null;

/* Chart variable */
let chart = null;
let hueOffset = 0;

/* ---------------- Helpers ---------------- */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function showToast(msg, ms=1100){
  let t = document.getElementById('toastMsg');
  if(!t){ t = document.createElement('div'); t.id='toastMsg'; Object.assign(t.style,{position:'fixed',left:'50%',transform:'translateX(-50%)',bottom:'18px',background:'rgba(6,12,10,0.9)',color:'#fff',padding:'8px 12px',borderRadius:'8px',zIndex:9999,opacity:0,transition:'opacity 160ms'}); document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1'; setTimeout(()=>t.style.opacity='0', ms);
}

/* ---------------- Gallery rendering + card tilt ---------------- */
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
    btn.innerHTML = `<div class="crop-stripe" style="background:${grad}"></div>
                     <div class="crop-emoji" aria-hidden="true">${c.emoji}</div>
                     <div class="crop-name">${c.id}</div>`;
    btn.addEventListener('click', ()=> openModal(c));
    // tilt effect: respond to pointer movement
    btn.addEventListener('pointermove', (ev)=> {
      const rect = btn.getBoundingClientRect();
      const px = (ev.clientX - rect.left) / rect.width - 0.5;
      const py = (ev.clientY - rect.top) / rect.height - 0.5;
      btn.style.transform = `perspective(800px) rotateX(${(-py*8).toFixed(2)}deg) rotateY(${(px*8).toFixed(2)}deg) translateY(-6px)`;
    });
    btn.addEventListener('pointerleave', ()=> btn.style.transform = '');
    cropGallery.appendChild(btn);
  });
}

/* ---------------- Modal ---------------- */
function openModal(crop){
  modalContent.innerHTML = `
    <div class="modal-top" style="display:flex;gap:12px;align-items:center">
      <div style="font-size:34px">${crop.emoji}</div>
      <div>
        <h2 id="modalTitle">${escapeHtml(crop.id)}</h2>
        <p class="muted" style="margin:4px 0 0">${escapeHtml(crop.desc || '')}</p>
      </div>
    </div>
    <hr/>
    <div class="modal-body">
      <p><strong>About this crop</strong></p>
      <p class="muted">This demo suggests crops based on your inputs. Use "Use as preset" to populate the form with typical values for this crop.</p>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.dataset.crop = crop.id;
  document.body.style.overflow = 'hidden';
}
closeModal?.addEventListener('click', ()=>{ modal.classList.add('hidden'); document.body.style.overflow = ''; });
modal?.addEventListener('click', (e)=>{ if(e.target === modal){ modal.classList.add('hidden'); document.body.style.overflow = ''; } });
copyNameBtn?.addEventListener('click', async ()=>{ const name = modal.dataset.crop; try{ await navigator.clipboard.writeText(name); showToast(`"${name}" copied`); } catch { showToast(name); }});
useAsPresetBtn?.addEventListener('click', ()=>{ const name = modal.dataset.crop; applyCropPreset(name); modal.classList.add('hidden'); document.body.style.overflow = ''; showToast(`Preset applied: ${name}`); });

/* ---------------- Chart ---------------- */
function initChart(){
  const ctx = probCanvas.getContext('2d');
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: ['No data'], datasets: [{ data: [100], backgroundColor: ['rgba(61,184,255,0.9)'] }] },
    options: { plugins: { legend: { display: false } }, maintainAspectRatio: false, cutout: '52%' }
  });
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
  // little pop animation for chart
  const el = probCanvas;
  el.animate([{ transform: 'scale(0.98)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1.00)' }], { duration: 600, easing: 'cubic-bezier(.2,.9,.2,1)' });
}

/* ---------------- Prediction flow ---------------- */
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

async function onSubmit(e){
  e.preventDefault();
  statusEl.textContent = 'Requesting...';
  resultDiv.innerHTML = `<div class="empty-state"><p class="muted">Loading results…</p></div>`;
  const top_k = parseInt(document.getElementById('top_k').value||'5',10);
  const payload = readPayload();
  try{
    const resp = await fetch(`${API_URL}?top_k=${top_k}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!resp.ok){
      const err = await resp.json().catch(()=>({detail:resp.statusText}));
      throw new Error(err.detail || 'Request failed');
    }
    const data = await resp.json();
    const recs = data.recommendations || [];
    renderResults(recs);
    statusEl.textContent = 'done';

    // celebrate the top recommendation with confetti + spotlight
    if(recs.length > 0){
      const top = recs[0].crop;
      flashTopCrop(top);
      burstConfetti();
    }
  }catch(err){
    resultDiv.innerHTML = `<div class="empty-state"><p style="color:#b00020">Error: ${escapeHtml(err.message)}</p></div>`;
    statusEl.textContent = 'error';
    console.error(err);
  }
}
form.addEventListener('submit', onSubmit);

/* ---------------- Render results and highlight gallery ---------------- */
function renderResults(recs){
  if(!recs || recs.length===0){
    resultDiv.innerHTML = `<div class="empty-state"><p class="muted">No recommendations.</p></div>`;
    updateChart([]);
    highlightGallery([]);
    return;
  }
  const html = `<div class="result-list">${recs.map(r=>`
    <div class="reco">
      <strong>${escapeHtml(r.crop)}</strong>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="bar"><i style="width:${(r.probability*100).toFixed(1)}%"></i></div>
        <div style="min-width:48px;text-align:right">${(r.probability*100).toFixed(1)}%</div>
      </div>
    </div>
  `).join('')}</div>`;
  resultDiv.innerHTML = html;
  updateChart(recs);
  highlightGallery(recs.map(r=>r.crop));
}

function highlightGallery(topNames){
  const tiles = cropGallery.querySelectorAll('.crop-tile');
  tiles.forEach(t=>{
    const name = t.querySelector('.crop-name')?.textContent;
    if(topNames.includes(name)){ t.classList.add('top'); t.classList.remove('dim'); } else { t.classList.remove('top'); t.classList.add('dim'); }
  });
}

/* flashTopCrop: spotlight & small zoom on the top crop tile in gallery */
function flashTopCrop(cropName){
  const tiles = Array.from(document.querySelectorAll('.crop-tile'));
  const found = tiles.find(t => t.querySelector('.crop-name')?.textContent === cropName);
  if(!found) return;
  // create ephemeral spotlight
  const rect = found.getBoundingClientRect();
  const glow = document.createElement('div');
  glow.style.position = 'fixed';
  glow.style.left = `${rect.left - 24}px`;
  glow.style.top = `${rect.top - 24}px`;
  glow.style.width = `${rect.width + 48}px`;
  glow.style.height = `${rect.height + 48}px`;
  glow.style.borderRadius = '16px';
  glow.style.zIndex = 45;
  glow.style.pointerEvents = 'none';
  glow.style.boxShadow = '0 24px 80px rgba(24,160,255,0.28), inset 0 1px 0 rgba(255,255,255,0.04)';
  glow.style.opacity = '0';
  glow.style.transform = 'scale(0.96)';
  glow.style.transition = 'opacity .28s ease, transform .5s cubic-bezier(.2,.9,.2,1)';
  document.body.appendChild(glow);
  requestAnimationFrame(()=>{ glow.style.opacity = '1'; glow.style.transform = 'scale(1.02)'; });
  setTimeout(()=>{ glow.style.opacity = '0'; glow.style.transform = 'scale(0.96)'; }, 1100);
  setTimeout(()=>glow.remove(), 1500);
}

/* ---------------- Confetti burst (canvas) ---------------- */
function burstConfetti(){
  if(!confettiCtx) return;
  // resize canvas
  confettiCanvas.width = window.innerWidth * devicePixelRatio;
  confettiCanvas.height = window.innerHeight * devicePixelRatio;
  confettiCanvas.style.width = `${window.innerWidth}px`;
  confettiCanvas.style.height = `${window.innerHeight}px`;
  const ctx = confettiCtx;
  const particles = [];
  const count = 48;
  for(let i=0;i<count;i++){
    particles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height * 0.2 + confettiCanvas.height * 0.1,
      vx: (Math.random()-0.5) * 12 * devicePixelRatio,
      vy: (Math.random()-1.8) * 10 * devicePixelRatio,
      r: (2 + Math.random()*6) * devicePixelRatio,
      color: ['#3db8ff','#18a0ff','#7be0ff','#ffd166','#9be564'][Math.floor(Math.random()*5)],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random()-0.5)*0.2
    });
  }
  let t0 = null;
  function frame(t){
    if(!t0) t0 = t;
    const dt = t - t0;
    t0 = t;
    ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    for(let p of particles){
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35 * devicePixelRatio; // gravity
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r, p.r*2, p.r*1.2);
      ctx.restore();
    }
    // fade out and stop after ~1400ms
    if(dt > 1400 || particles.every(p => p.y > confettiCanvas.height + 200)){
      ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
      return;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------------- Blue rain overlay: only when asked ---------------- */
(function blueRainModule(){
  const canvas = blueRainCanvas;
  if(!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W = 0, H = 0;
  let drops = [];
  let raf = null;

  function resize(){
    DPR = Math.max(1, window.devicePixelRatio || 1);
    W = Math.floor(window.innerWidth * DPR);
    H = Math.floor(window.innerHeight * DPR);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }

  function makeDrop(){
    const depth = 0.25 + Math.random() * 0.75;
    return {
      x: Math.random() * W,
      y: Math.random() * H - Math.random() * H * 0.6,
      vx: (-0.06 + Math.random()*-0.06) * (0.6 + depth*0.8) * DPR,
      vy: (0.28 + depth * (0.6 + Math.random()*0.6)) * DPR,
      len: (10 + Math.random()*28) * (0.6 + depth),
      size: (0.8 + depth * 1.4) * DPR,
      alpha: 0.06 + depth * 0.26,
      hue: 195 + Math.floor(Math.random() * 35),
      depth
    };
  }

  function spawn(count=110){
    drops = [];
    for(let i=0;i<count;i++) drops.push(makeDrop());
  }

  function drawDrop(d, t){
    const x0 = d.x, y0 = d.y;
    const x1 = x0 + d.vx * d.len * 6;
    const y1 = y0 + d.len * (1 + d.depth * 0.5);

    // head glow
    const headR = Math.max(1.2, d.size * 1.2);
    const g = ctx.createRadialGradient(x1, y1, 0, x1, y1, headR*4);
    g.addColorStop(0, `rgba(130,190,255,${d.alpha*1.0})`);
    g.addColorStop(0.35, `rgba(120,180,255,${d.alpha*0.6})`);
    g.addColorStop(1, `rgba(120,180,255,0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x1, y1, headR*3.2, 0, Math.PI*2); ctx.fill();

    // streak
    const streak = ctx.createLinearGradient(x0, y0, x1, y1);
    streak.addColorStop(0, `rgba(180,220,255,${Math.max(0.0, d.alpha*0.06)})`);
    streak.addColorStop(0.6, `rgba(150,210,255,${Math.max(0.03, d.alpha*0.28)})`);
    streak.addColorStop(1, `rgba(220,245,255,${Math.max(0.06, d.alpha*0.7)})`);
    ctx.strokeStyle = streak;
    ctx.lineWidth = Math.max(1, d.size * 0.9);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }

  function step(time){
    ctx.globalCompositeOperation = 'source-over';
    // very subtle clear to keep soft trails
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0,0,W,H);

    for(const d of drops){
      drawDrop(d, time);
      d.x += d.vx * (0.9 + 0.12 * Math.sin(time / (1200 + d.depth*300)));
      d.y += d.vy * (0.95 + 0.08 * Math.cos(time / (900 + d.depth*200)));
      if(d.y > H + 80 || d.x < -140 || d.x > W + 140){
        Object.assign(d, makeDrop());
        d.y = -10 - Math.random() * 220;
      }
    }
    raf = requestAnimationFrame(step);
  }

  function start(count=110){
    blueRainContainer.classList.remove('hidden');
    resize();
    spawn(count);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  }
  function stop(){
    cancelAnimationFrame(raf);
    raf = null;
    if(ctx) ctx.clearRect(0,0,canvas.width, canvas.height);
    blueRainContainer.classList.add('hidden');
  }

  // game controls
  rainToggle?.addEventListener('click', ()=>{
    if(blueRainContainer.classList.contains('hidden')) { start(120); showToast('Rain enabled'); }
    else { stop(); showToast('Rain disabled'); }
  });

  // allow preset to control rain
  window.startBlueRain = start;
  window.stopBlueRain = stop;

  window.addEventListener('resize', ()=>{ if(!blueRainContainer.classList.contains('hidden')) resize(); });
})();

/* ---------------- apply crop as preset (heuristic) ---------------- */
function applyCropPreset(name){
  const n = name.toLowerCase();
  if(n.includes('rice')){ document.getElementById('rainfall').value = 200; document.getElementById('temperature').value = 25; document.getElementById('humidity').value = 85; startBlueRain?.(); }
  else if(n.includes('wheat') || n.includes('barley')){ document.getElementById('rainfall').value = 120; document.getElementById('temperature').value = 18; document.getElementById('humidity').value = 70; stopBlueRain?.(); }
  else if(n.includes('millet') || n.includes('maize')){ document.getElementById('rainfall').value = 90; document.getElementById('temperature').value = 28; document.getElementById('humidity').value = 60; stopBlueRain?.(); }
  else { document.getElementById('rainfall').value = 110; stopBlueRain?.(); }
}

/* ---------------- Search / Controls / Init ---------------- */
searchInput?.addEventListener('input',(e)=>{ const q=e.target.value.trim().toLowerCase(); renderGallery(q ? CROP_LIST.filter(c=>c.id.toLowerCase().includes(q)) : CROP_LIST); });
shuffleColors?.addEventListener('click', ()=>{ hueOffset = Math.floor(Math.random()*360); renderGallery(); showToast('Colours shuffled'); });
showAllBtn?.addEventListener('click', ()=>{ searchInput.value=''; renderGallery(); });
randomizeBtn?.addEventListener('click', ()=>{ const rand=(min,max,step=1)=> Math.round((Math.random()*(max-min)+min)/step)*step; document.getElementById('N').value = rand(10,100,1); document.getElementById('P').value = rand(10,100,1); document.getElementById('K').value = rand(10,100,1); document.getElementById('temperature').value = (Math.random()*20+15).toFixed(1); document.getElementById('humidity').value = (Math.random()*40+50).toFixed(1); document.getElementById('pH').value = (Math.random()*2+5.5).toFixed(2); document.getElementById('rainfall').value = (Math.random()*300+20).toFixed(1); });
themeToggle?.addEventListener('click', ()=>{ document.body.classList.toggle('dark'); showToast('Theme toggled'); });

preset?.addEventListener('change',(e)=>{
  const v = e.target.value;
  if(v==='dry'){ document.getElementById('rainfall').value=60; document.getElementById('temperature').value=30; document.getElementById('humidity').value=45; stopBlueRain?.(); }
  else if(v==='wet'){ document.getElementById('rainfall').value=400; document.getElementById('temperature').value=20; document.getElementById('humidity').value=85; startBlueRain?.(); }
  else if(v==='hot'){ document.getElementById('temperature').value=34; document.getElementById('rainfall').value=80; document.getElementById('humidity').value=40; stopBlueRain?.(); }
  else { document.getElementById('N').value=80; document.getElementById('P').value=50; document.getElementById('K').value=40; document.getElementById('temperature').value=22.0; document.getElementById('humidity').value=80.0; document.getElementById('pH').value=6.6; document.getElementById('rainfall').value=190.0; stopBlueRain?.(); }
});

/* ---------------- On load ---------------- */
window.addEventListener('load', ()=>{
  renderGallery();
  initChart();
  // small floating background motion already in CSS
  // ensure confetti canvas covers screen
  if(confettiCanvas){
    confettiCanvas.width = window.innerWidth * devicePixelRatio;
    confettiCanvas.height = window.innerHeight * devicePixelRatio;
    confettiCanvas.style.width = `${window.innerWidth}px`;
    confettiCanvas.style.height = `${window.innerHeight}px`;
    confettiCanvas.style.pointerEvents = 'none';
  }
});

/* expose for debugging */
window.appUI = { renderGallery, burstConfetti: burstConfetti, startBlueRain: window.startBlueRain, stopBlueRain: window.stopBlueRain };