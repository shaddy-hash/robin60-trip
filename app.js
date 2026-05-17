// TIMESTAMP
function setTimestamp() {
  const now = new Date();
  const opts = { timeZone:'America/Chicago', month:'long', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit', hour12:true };
  const formatted = now.toLocaleString('en-US', opts) + ' CT';
  const tag = document.getElementById('versionTag');
  const footer = document.getElementById('footerVersion');
  if (tag) tag.textContent = 'Last updated: ' + formatted;
  if (footer) footer.textContent = "Robin's 60th · Bali 2026 · Last updated: " + formatted;
}
setTimestamp();

// TAB NAVIGATION
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function activateTab(id) {
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  tabPanels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + id));
  const btn = document.querySelector('.tab-btn[data-tab="'+id+'"]');
  if (btn) btn.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
  window.scrollTo({ top:0, behavior:'smooth' });
  history.replaceState(null, '', '#' + id);
  if (id === 'weather' && !weatherLoaded) loadWeather();
}

tabBtns.forEach(b => b.addEventListener('click', () => activateTab(b.dataset.tab)));
document.querySelectorAll('.inline-tab-link').forEach(b => b.addEventListener('click', () => activateTab(b.dataset.tab)));

const hash = window.location.hash.replace('#','');
if (hash && document.getElementById('tab-'+hash)) activateTab(hash);

// SPEECH SYNTHESIS
const synth = window.speechSynthesis;
if (synth) {
  document.querySelectorAll('.speak-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (synth.speaking) synth.cancel();
      const utt = new SpeechSynthesisUtterance(this.dataset.text);
      utt.lang = 'id-ID'; utt.rate = 0.85;
      const voices = synth.getVoices();
      const idVoice = voices.find(v => v.lang.startsWith('id'));
      if (idVoice) utt.voice = idVoice;
      const b = this;
      b.classList.add('speaking');
      utt.onend = utt.onerror = () => b.classList.remove('speaking');
      synth.speak(utt);
    });
  });
  if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = () => {};
}

// LIVE WEATHER — Open-Meteo, no API key required
// Payangan/Buahan, Bali: lat -8.51, lon 115.26
let weatherLoaded = false;
const WMO = {
  0:['Clear sky','☀️'], 1:['Mainly clear','🌤️'], 2:['Partly cloudy','⛅'], 3:['Overcast','☁️'],
  45:['Foggy','🌫️'], 48:['Icy fog','🌫️'], 51:['Light drizzle','🌦️'], 53:['Drizzle','🌦️'],
  55:['Heavy drizzle','🌧️'], 61:['Light rain','🌧️'], 63:['Rain','🌧️'], 65:['Heavy rain','🌧️'],
  80:['Rain showers','🌦️'], 81:['Heavy showers','🌧️'], 82:['Violent showers','⛈️'],
  95:['Thunderstorm','⛈️'], 96:['Thunderstorm','⛈️']
};
function wmo(c) { return WMO[c] || ['—','🌡️']; }
function toF(c) { return Math.round(c*9/5+32); }
function dName(s,i) { const d=new Date(s+'T12:00:00'); return i===0?'Today':d.toLocaleDateString('en-US',{weekday:'short'}); }
function mDay(s) { return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}); }

async function loadWeather() {
  if (weatherLoaded) return;
  const loading = document.getElementById('weather-loading');
  const errorEl = document.getElementById('weather-error');
  const live    = document.getElementById('weather-live');
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-8.51&longitude=115.26&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FMakassar&forecast_days=7&wind_speed_unit=mph';
    const data = await (await fetch(url)).json();
    const c = data.current, d = data.daily;
    const [desc,icon] = wmo(c.weather_code);
    document.getElementById('wc-temp').textContent = Math.round(c.temperature_2m)+'°C / '+toF(c.temperature_2m)+'°F';
    document.getElementById('wc-desc').textContent = icon+' '+desc;
    document.getElementById('wc-humidity').textContent = c.relative_humidity_2m+'%';
    document.getElementById('wc-wind').textContent = Math.round(c.wind_speed_10m)+' mph';
    document.getElementById('wc-feels').textContent = Math.round(c.apparent_temperature)+'°C / '+toF(c.apparent_temperature)+'°F';
    const fc = document.getElementById('weather-forecast');
    fc.innerHTML = '';
    d.time.forEach((t,i) => {
      const [fd,fi] = wmo(d.weather_code[i]);
      const rain = d.precipitation_sum[i];
      const el = document.createElement('div');
      el.className = 'wf-day';
      el.innerHTML = '<div class="wf-date">'+dName(t,i)+'<br>'+mDay(t)+'</div><div class="wf-icon">'+fi+'</div><div class="wf-hi">'+Math.round(d.temperature_2m_max[i])+'°C</div><div class="wf-lo">'+Math.round(d.temperature_2m_min[i])+'°C</div><div class="wf-rain">'+(rain>0?'💧 '+rain.toFixed(1)+'mm':'—')+'</div>';
      fc.appendChild(el);
    });
    loading.style.display = 'none';
    live.style.display = 'block';
    weatherLoaded = true;
  } catch(e) {
    loading.style.display = 'none';
    errorEl.style.display = 'block';
  }
}

if (window.location.hash === '#weather') loadWeather();
