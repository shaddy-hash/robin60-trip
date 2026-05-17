document.addEventListener('DOMContentLoaded', function () {

  // ── DYNAMIC IDR/USD EXCHANGE RATE ────────────────────
  // Fetches live rate and recalculates USD column on pricing tab
  (function fetchExchangeRate() {
    fetch('https://open.er-api.com/v6/latest/IDR')
      .then(r => r.json())
      .then(data => {
        const usdPerIdr = data.rates && data.rates.USD;
        if (!usdPerIdr) return;
        const idrPerUsd = Math.round(1 / usdPerIdr);
        // Update note
        const note = document.getElementById('usd-rate-note');
        if (note) note.textContent = 'Live rate: ~' + idrPerUsd.toLocaleString() + ' IDR per $1 USD';
        // Recalculate each USD cell
        document.querySelectorAll('.usd-col').forEach(cell => {
          const row = cell.closest('tr');
          if (!row) return;
          const idrCell = row.querySelector('td:nth-child(2)');
          if (!idrCell) return;
          const idrText = idrCell.textContent;
          // Extract all numeric values
          const nums = idrText.match(/[\d,]+/g);
          if (!nums) return;
          const vals = nums.map(n => parseInt(n.replace(/,/g, ''))).filter(n => n > 1000);
          if (!vals.length) return;
          const usdVals = vals.map(v => Math.round(v * usdPerIdr));
          const unique = [...new Set(usdVals)];
          cell.textContent = unique.length === 1
            ? '~$' + unique[0]
            : '~$' + Math.min(...unique) + '–$' + Math.max(...unique);
        });
      })
      .catch(() => {}); // Silently fail — static estimates remain
  })();

  // ── TIMESTAMP ─────────────────────────────────────────
  function setTimestamp() {
    try {
      const now = new Date();
      const opts = {
        timeZone: 'America/Chicago',
        month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      };
      const formatted = now.toLocaleString('en-US', opts) + ' CT';
      const tag = document.getElementById('versionTag');
      const footer = document.getElementById('footerVersion');
      if (tag) tag.textContent = 'Last updated: ' + formatted;
      if (footer) footer.textContent = "Robin's 60th · Bali 2026 · Last updated: " + formatted;
    } catch (e) {
      const tag = document.getElementById('versionTag');
      if (tag) tag.textContent = 'May 2026';
    }
  }
  setTimestamp();

  // ── LIVE CLOCKS ───────────────────────────────────────
  function updateClocks() {
    try {
      const now = new Date();
      const fmt = { hour: 'numeric', minute: '2-digit', hour12: true };
      const omahaStr = now.toLocaleTimeString('en-US', Object.assign({}, fmt, { timeZone: 'America/Chicago' }));
      const baliStr  = now.toLocaleTimeString('en-US', Object.assign({}, fmt, { timeZone: 'Asia/Makassar' }));
      const omaha = document.getElementById('clockOmaha');
      const bali  = document.getElementById('clockBali');
      if (omaha) omaha.textContent = omahaStr;
      if (bali)  bali.textContent  = baliStr;
    } catch(e) {}
  }
  updateClocks();
  setInterval(updateClocks, 30000);

  // ── TAB NAVIGATION ────────────────────────────────────
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function activateTab(id) {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    tabPanels.forEach(p => p.classList.toggle('active', p.id === 'tab-' + id));
    const btn = document.querySelector('.tab-btn[data-tab="' + id + '"]');
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', '#' + id);
    if (id === 'weather' && !weatherLoaded) loadWeather();
  }

  tabBtns.forEach(b => b.addEventListener('click', () => activateTab(b.dataset.tab)));

  document.querySelectorAll('.inline-tab-link').forEach(b => {
    b.addEventListener('click', () => activateTab(b.dataset.tab));
  });

  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById('tab-' + hash)) {
    activateTab(hash);
  }

  // ── NAV SCROLL UX ─────────────────────────────────────
  const navInner = document.getElementById('tabNavInner');
  const navWrap  = document.getElementById('tabNavWrap');

  function updateNavScrollState() {
    if (!navInner || !navWrap) return;
    const sl = navInner.scrollLeft;
    const maxScroll = navInner.scrollWidth - navInner.clientWidth;
    navWrap.classList.toggle('can-scroll-left',  sl > 8);
    navWrap.classList.toggle('can-scroll-right', sl < maxScroll - 8);
  }

  if (navInner) {
    navInner.addEventListener('scroll', updateNavScrollState, { passive: true });
    // Run once on load and after fonts render
    updateNavScrollState();
    setTimeout(updateNavScrollState, 300);
  }

  // ── SPEECH SYNTHESIS ──────────────────────────────────
  // Uses browser's built-in Web Speech API — no external service needed
  const synth = window.speechSynthesis;

  function speakPhrase(text) {
    if (!synth) return;
    if (synth.speaking) synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'id-ID';
    utt.rate = 0.8;
    utt.pitch = 1.0;

    function doSpeak() {
      const voices = synth.getVoices();
      // Try Indonesian voice first, fall back to any available
      const idVoice = voices.find(v => v.lang && v.lang.startsWith('id'));
      const enVoice = voices.find(v => v.lang && v.lang.startsWith('en'));
      if (idVoice) utt.voice = idVoice;
      else if (enVoice) utt.voice = enVoice;
      synth.speak(utt);
    }

    // Voices may not be loaded yet — wait for them
    const voices = synth.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      synth.onvoiceschanged = function () {
        synth.onvoiceschanged = null;
        doSpeak();
      };
      // Some browsers don't fire onvoiceschanged — try after short delay
      setTimeout(function () {
        if (!synth.speaking) doSpeak();
      }, 500);
    }
  }

  document.querySelectorAll('.speak-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const text = this.dataset.text;
      const b = this;
      b.classList.add('speaking');
      speakPhrase(text);
      setTimeout(() => b.classList.remove('speaking'), 2000);
    });
  });

  // ── LIVE WEATHER ──────────────────────────────────────
  // Open-Meteo — free, no API key, CORS-safe
  // Payangan/Buahan coordinates: lat -8.51, lon 115.26
  let weatherLoaded = false;

  const WMO = {
    0: ['Clear sky', '☀️'],
    1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
    45: ['Foggy', '🌫️'], 48: ['Icy fog', '🌫️'],
    51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
    61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
    71: ['Light snow', '🌨️'], 73: ['Snow', '❄️'], 75: ['Heavy snow', '❄️'],
    80: ['Rain showers', '🌦️'], 81: ['Heavy showers', '🌧️'], 82: ['Violent showers', '⛈️'],
    95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm', '⛈️']
  };

  function wmo(c) { return WMO[c] || ['—', '🌡️']; }
  function toF(c) { return Math.round(c * 9 / 5 + 32); }
  function dayLabel(s, i) {
    if (i === 0) return 'Today';
    return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
  }
  function monthDay(s) {
    return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function loadWeather() {
    if (weatherLoaded) return;
    const loading = document.getElementById('weather-loading');
    const errorEl = document.getElementById('weather-error');
    const live = document.getElementById('weather-live');

    const url = [
      'https://api.open-meteo.com/v1/forecast',
      '?latitude=-8.51&longitude=115.26',
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
      '&timezone=Asia%2FMakassar',
      '&forecast_days=7',
      '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch'
    ].join('');

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('API error ' + res.status);
        return res.json();
      })
      .then(function (data) {
        const c = data.current;
        const d = data.daily;
        const [desc, icon] = wmo(c.weather_code);

        document.getElementById('wc-temp').textContent =
          Math.round(c.temperature_2m) + '°F';
        document.getElementById('wc-desc').textContent = icon + ' ' + desc;
        document.getElementById('wc-humidity').textContent = c.relative_humidity_2m + '%';
        document.getElementById('wc-wind').textContent = Math.round(c.wind_speed_10m) + ' mph';
        document.getElementById('wc-feels').textContent =
          Math.round(c.apparent_temperature) + '°F';

        const fc = document.getElementById('weather-forecast');
        fc.innerHTML = '';
        d.time.forEach(function (t, i) {
          const [, fi] = wmo(d.weather_code[i]);
          const rain = d.precipitation_sum[i];
          const el = document.createElement('div');
          el.className = 'wf-day';
          el.innerHTML =
            '<div class="wf-date">' + dayLabel(t, i) + '<br>' + monthDay(t) + '</div>' +
            '<div class="wf-icon">' + fi + '</div>' +
            '<div class="wf-hi">' + Math.round(d.temperature_2m_max[i]) + '°F</div>' +
            '<div class="wf-lo">' + Math.round(d.temperature_2m_min[i]) + '°F</div>' +
            '<div class="wf-rain">' + (rain > 0 ? '💧 ' + rain.toFixed(2) + '"' : '—') + '</div>';
          fc.appendChild(el);
        });

        if (loading) loading.style.display = 'none';
        if (live) live.style.display = 'block';
        weatherLoaded = true;
      })
      .catch(function (e) {
        console.error('Weather failed:', e);
        if (loading) loading.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
      });
  }

  // Expose loadWeather so tab click can call it
  window._loadWeather = loadWeather;
  if (window.location.hash === '#weather') loadWeather();

}); // end DOMContentLoaded
