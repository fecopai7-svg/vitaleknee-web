// Vitalé — motor de escenas (base "cine" de Fecop AI)
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));

  // reveals al entrar en pantalla
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-r], .lines').forEach((el) => io.observe(el));

  // vídeos: cámara lenta, solo se reproducen cuando se ven
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (reduce) return;
      if (e.isIntersecting) {
        if (v.preload === 'none') v.preload = 'auto';
        v.playbackRate = parseFloat(v.dataset.slow) || 0.6;
        v.play().catch(() => {});
      } else v.pause();
    });
  }, { threshold: 0.05 });
  $$('video[data-slow]').forEach((v) => { v.muted = true; v.playsInline = true; vio.observe(v); });

  // ---------- panel en vivo del hero ----------
  const fill = $('#dialFill'), deg = $('#dialDeg'), lvl = $('#dialLvl');
  const btns = $$('.lvl');
  let auto = !reduce, cur = 0, timer;
  function setLevel(i, user) {
    const b = btns[i]; if (!b) return;
    cur = i;
    btns.forEach((x, j) => x.classList.toggle('is-on', j === i));
    const target = +b.dataset.deg;
    lvl.textContent = b.dataset.lvl;
    // level 1 → 3 fills a third of the arc each
    fill.style.strokeDashoffset = String(100 - (target / 3) * 100);
    const pad = (n) => String(n).padStart(2, '0');
    const from = +deg.textContent || 0;
    if (reduce) { deg.textContent = pad(target); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / 900);
      deg.textContent = pad(Math.round(lerp(from, target, 1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    if (user) { auto = false; clearInterval(timer); }
  }
  btns.forEach((b, i) => b.addEventListener('click', () => setLevel(i, true)));
  if (fill) {
    setLevel(0);
    if (auto) timer = setInterval(() => { if (auto) setLevel((cur + 1) % btns.length); }, 3200);
  }
  const wave = $('.vib__wave');
  if (wave) for (let i = 0; i < 30; i++) { const b = document.createElement('i'); b.style.height = (25 + Math.random() * 75) + '%'; b.style.animationDelay = (Math.random() * 1) + 's'; wave.appendChild(b); }

  // ---------- historia fijada: cambia el fotograma ----------
  const beats = $$('.beat');
  const frames = $$('.frame__m');
  const stc = $('#stc'), sn = $('#sn'), sp = $('#sp');
  const bio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const i = beats.indexOf(e.target);
    beats.forEach((b, j) => b.classList.toggle('on', j === i));
    frames.forEach((f, j) => f.classList.toggle('on', j === i));
    if (stc) {
      stc.textContent = e.target.dataset.tc;
      stc.classList.toggle('tc--cold', !!e.target.dataset.cold);
      sp.textContent = e.target.dataset.place;
      sn.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(beats.length).padStart(2, '0');
    }
  }), { rootMargin: '-45% 0px -45% 0px' });
  beats.forEach((b) => bio.observe(b));

  // ---------- pack y botón de compra (enlace directo al checkout de Shopify) ----------
  const cfg = window.VITALE || {};
  const form = $('#packForm'), buy = $('#buyBtn'), price = $('#buyPrice');
  function buyUrl() {
    const r = $('input[name="pack"]:checked', form);
    const id = r ? r.value : (cfg.variants && cfg.variants.dos);
    return `${cfg.shop}/cart/${id}:1?${cfg.utm || ''}`;
  }
  function syncBuy() {
    const r = $('input[name="pack"]:checked', form);
    if (r && price) price.textContent = r.dataset.price;
    if (buy) buy.href = buyUrl();
  }
  if (form) { form.addEventListener('change', syncBuy); syncBuy(); }
  if (buy) buy.addEventListener('click', () => {
    // AddToCart en la web; InitiateCheckout y Purchase los envía la app de Meta desde el checkout de Shopify
    const r = $('input[name="pack"]:checked', form);
    const value = r ? parseFloat(r.dataset.price.replace(/[^\d,]/g, '').replace(',', '.')) : 79.98;
    if (window.fbq) window.fbq('track', 'AddToCart', { content_ids: [r ? r.value : cfg.variants.dos], content_type: 'product', value, currency: 'EUR' });
  });

  // ---------- bucle de scroll: nav, temperatura, barra fija, HUD ----------
  const nav = $('.nav');
  const heat = $('[data-heat]');
  const heatBg = heat && $('.heat__bg', heat);
  const heatDeg = heat && $('[data-deg]', heat);
  const heatSteps = heat ? $$('[data-step]', heat) : [];
  const sticky = $('#sticky');
  const pack = $('#pack');
  const heroCta = $('[data-buy-scroll]');
  const hudTc = $('#hudTc'), hudScene = $('#hudScene');
  const scenes = $$('[data-scene]');
  const COLD = [11, 16, 22], WARM = [42, 18, 9];
  const LED_COLD = [143, 179, 217], LED_WARM = [255, 59, 47];

  function progressOf(el) {
    const r = el.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }

  let ticking = false;
  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    if (nav) nav.classList.toggle('is-solid', y > 40);

    if (heat) {
      const p = reduce ? 1 : progressOf(heat);
      heat.style.setProperty('--p', p.toFixed(3));
      const d = String(Math.round(lerp(0, 3, clamp((p - .06) / .86)))).padStart(2, '0');
      if (heatDeg && heatDeg.textContent !== d) heatDeg.textContent = d;
      const idx = p < .2 ? 0 : p < .46 ? 1 : p < .72 ? 2 : 3;
      heatSteps.forEach((s, i) => s.classList.toggle('is-on', i === idx));
      const t = clamp(p * 1.1);
      heatBg.style.setProperty('--heat-bg', `rgb(${COLD.map((v, i) => Math.round(lerp(v, WARM[i], t))).join(',')})`);
      heat.style.setProperty('--heat-led', `rgb(${LED_COLD.map((v, i) => Math.round(lerp(v, LED_WARM[i], clamp(p * 1.4)))).join(',')})`);
    }

    if (sticky) {
      const heroGone = heroCta ? heroCta.getBoundingClientRect().bottom < 0 : y > vh;
      let packIn = false;
      if (pack) { const r = pack.getBoundingClientRect(); packIn = r.top < vh * .85 && r.bottom > vh * .15; }
      sticky.classList.toggle('on', heroGone && !packIn);
    }

    if (hudTc) {
      const f = Math.floor(y), s = Math.floor(f / 24);
      const pad = (n) => String(n).padStart(2, '0');
      hudTc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % 24)}`;
      let label = scenes[0] ? scenes[0].dataset.scene : '';
      for (const s2 of scenes) if (s2.getBoundingClientRect().top < vh * .5) label = s2.dataset.scene;
      if (hudScene.textContent !== label) hudScene.textContent = label;
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();
})();
