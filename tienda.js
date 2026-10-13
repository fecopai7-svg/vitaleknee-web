// Vitalé — página de producto: carrito propio + checkout de Shopify por enlace permanente (/cart/ID:Q,ID:Q)
// La tienda de Shopify redirige a esta web, así que el carrito vive aquí (localStorage) y solo
// al pagar se manda todo de una vez al checkout de Shopify.
(function () {
  const cfg = window.VITALE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'vk-cart';
  const eur = (n) => n.toFixed(2).replace('.', ',') + ' €';

  const PRODUCTS = {
    [cfg.variants.uno]: { title: 'Vitalé · 1 unidad', price: 49.99, was: 59.99, img: 'media/p1.jpg' },
    [cfg.variants.dos]: { title: 'Vitalé · Pack 2 unidades', price: 79.99, was: 99.98, img: 'media/p6.jpg' }
  };

  // ---------- carrito ----------
  function load() {
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || '{}');
      // storage is user-controlled: keep known variants and whole quantities 1–10 only
      return Object.fromEntries(Object.entries(c)
        .map(([id, q]) => [id, Math.min(10, Math.floor(Number(q)) || 0)])
        .filter(([id, q]) => PRODUCTS[id] && q > 0));
    } catch (e) { return {}; }
  }
  let cart = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} render(); }
  const count = () => Object.values(cart).reduce((s, q) => s + q, 0);
  const total = () => Object.entries(cart).reduce((s, [id, q]) => s + PRODUCTS[id].price * q, 0);
  const checkoutUrl = (items) => `${cfg.shop}/cart/${Object.entries(items).map(([id, q]) => `${id}:${q}`).join(',')}?${cfg.utm || ''}`;
  function track(ev, data) { if (window.fbq) window.fbq('track', ev, data); }

  const drawer = $('#cart');
  const body = drawer && $('.drawer__body', drawer);
  const foot = drawer && $('.drawer__foot', drawer);
  let lastFocus = null;

  function render() {
    $$('[data-cart-n]').forEach((el) => { const n = count(); el.textContent = n; el.hidden = n === 0; });
    if (!drawer) return;
    const ids = Object.keys(cart);
    if (!ids.length) { body.innerHTML = '<p class="drawer__empty">Tu carrito está vacío.</p>'; foot.hidden = true; return; }
    body.innerHTML = ids.map((id) => {
      const p = PRODUCTS[id], q = cart[id];
      return `<div class="line">
        <img src="${p.img}" alt="">
        <div><div class="line__t">${p.title}</div><div class="line__p"><s>${eur(p.was)}</s> ${eur(p.price)}</div>
          <div class="qty" role="group" aria-label="Cantidad"><button type="button" data-q="-1" data-id="${id}" aria-label="Quitar uno">−</button><span>${q}</span><button type="button" data-q="1" data-id="${id}" aria-label="Añadir uno">+</button></div></div>
        <div style="text-align:right"><b>${eur(p.price * q)}</b><br><button type="button" class="line__rm" data-rm="${id}">Quitar</button></div>
      </div>`;
    }).join('');
    foot.hidden = false;
    $('[data-sub]', foot).textContent = eur(total());
    $('[data-tot]', foot).textContent = eur(total());
    const saved = Object.entries(cart).reduce((s, [id, q]) => s + (PRODUCTS[id].was - PRODUCTS[id].price) * q, 0);
    const sv = $('[data-saved]', foot);
    if (sv) sv.textContent = '−' + eur(saved);
    $('[data-checkout]', foot).href = checkoutUrl(cart);
  }
  function open() {
    lastFocus = document.activeElement;
    drawer.classList.add('on');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('.drawer__x', drawer).focus(), 50);
  }
  function close() {
    drawer.classList.remove('on');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  if (drawer) {
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) return close();
      const b = e.target.closest('[data-q]');
      if (b) { const id = b.dataset.id; cart[id] = Math.min(10, Math.max(0, (cart[id] || 0) + +b.dataset.q)); if (!cart[id]) delete cart[id]; return save(); }
      const rm = e.target.closest('[data-rm]');
      if (rm) { delete cart[rm.dataset.rm]; save(); }
    });
    $('[data-checkout]', drawer).addEventListener('click', () => track('InitiateCheckout', { value: +total().toFixed(2), currency: 'EUR', num_items: count() }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('on')) close(); });
    $$('[data-open-cart]').forEach((b) => b.addEventListener('click', open));
  }

  // ---------- selector de pack animado ----------
  const form = $('#packForm');
  const selected = () => { const r = form && $('input[name="pack"]:checked', form); return r ? r.value : cfg.variants.dos; };
  let shown = PRODUCTS[selected()].price;
  function countTo(to) {
    const els = $$('[data-sel-price]');
    if (reduce) { els.forEach((el) => { el.textContent = eur(to); }); shown = to; return; }
    const from = shown, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 450), v = from + (to - from) * (1 - Math.pow(1 - k, 3));
      els.forEach((el) => { el.textContent = eur(v); });
      if (k < 1) requestAnimationFrame(step); else shown = to;
    };
    requestAnimationFrame(step);
  }
  if (form) form.addEventListener('submit', (e) => e.preventDefault());
  if (form) {
    form.addEventListener('change', () => {
      $$('[data-pack]', form).forEach((p) => {
        const on = $('input', p).checked;
        p.classList.toggle('is-on', on);
        if (on) { p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); }
      });
      countTo(PRODUCTS[selected()].price);
    });
  }

  $$('[data-buy-now]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const id = selected(), p = PRODUCTS[id];
    track('AddToCart', { content_ids: [id], content_type: 'product', value: p.price, currency: 'EUR' });
    track('InitiateCheckout', { value: p.price, currency: 'EUR', num_items: 1 });
    // «Comprar ya» va directo al checkout solo con lo elegido (no arrastra el carrito)
    setTimeout(() => { location.href = checkoutUrl({ [id]: 1 }); }, 150);
  }));
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => {
    const id = selected(), p = PRODUCTS[id];
    cart[id] = Math.min(10, (cart[id] || 0) + 1);
    save();
    track('AddToCart', { content_ids: [id], content_type: 'product', value: p.price, currency: 'EUR' });
    const cb = $('.cartbtn');
    if (cb) { cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); }
    burst(b);
    setTimeout(open, reduce ? 0 : 250);
  }));

  // pequeña celebración al añadir al carrito
  function burst(el) {
    if (reduce) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ['#E4572E', '#FFB59C', '#15171A', '#1E8E4E', '#F2A100'];
    for (let i = 0; i < 22; i++) {
      const d = document.createElement('i');
      const a = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 90;
      d.className = 'burst';
      d.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i % colors.length]};--x:${Math.cos(a) * dist}px;--y:${Math.sin(a) * dist - 40}px;--r:${Math.random() * 540}deg`;
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 950);
    }
  }

  // ---------- botón de compra que crece al acercar el ratón (y se mueve solo en el móvil) ----------
  $$('[data-magnet]').forEach((b) => {
    if (reduce) return;
    if (matchMedia('(hover: hover)').matches) {
      addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const k = Math.max(0, 1 - Math.hypot(dx, dy) / 220); // 0 lejos · 1 encima
        b.style.setProperty('--mag', (1 + k * .07).toFixed(3));
      }, { passive: true });
    }
    new IntersectionObserver(([e]) => b.classList.toggle('inview', e.isIntersecting), { threshold: .9 }).observe(b);
  });

  // ---------- galería ----------
  const main = $('#galleryMain');
  const thumbs = $$('.thumb');
  let gi = 0;
  function show(i) {
    gi = (i + thumbs.length) % thumbs.length;
    const t = thumbs[gi];
    main.classList.add('swap');
    setTimeout(() => { main.src = t.dataset.src; main.alt = t.dataset.alt || ''; main.classList.remove('swap'); badges(t); }, reduce ? 0 : 160);
    thumbs.forEach((x, j) => x.setAttribute('aria-current', j === gi ? 'true' : 'false'));
  }
  // beneficios encima de cada foto (data-badges="texto|tr;texto|bl")
  const badgeBox = $('[data-badge-box]');
  function badges(t) {
    if (!badgeBox || !t) return;
    badgeBox.innerHTML = (t.dataset.badges || '').split(';').filter(Boolean).map((s) => {
      const [txt, pos] = s.split('|');
      return `<span class="gbadge gbadge--${pos || 'tr'}">${txt}</span>`;
    }).join('');
  }
  badges(thumbs[0]);
  // pasa sola de foto cada 4 s hasta que la persona toca la galería
  let auto = !reduce && setInterval(() => show(gi + 1), 4000);
  const stopAuto = () => { if (auto) { clearInterval(auto); auto = null; } };
  $$('.thumb, [data-gal]').forEach((b) => b.addEventListener('click', stopAuto));
  if (main) main.parentElement.addEventListener('touchstart', stopAuto, { passive: true });
  thumbs.forEach((t, i) => t.addEventListener('click', () => show(i)));
  $$('[data-gal]').forEach((b) => b.addEventListener('click', () => show(gi + +b.dataset.gal)));
  if (main) {
    let x0 = null;
    main.parentElement.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    main.parentElement.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(gi + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  // ---------- fechas de entrega (24/48 h laborables; pedidos tras las 14:00 salen al día siguiente) ----------
  const addWork = (d, n) => { const x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() % 6 !== 0) n--; } return x; };
  const now = new Date();
  const ship = now.getHours() >= 14 || now.getDay() % 6 === 0 ? addWork(now, 1) : now;
  const fmt = (d) => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const short = (d) => d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
  const eta = $('[data-eta]');
  if (eta) eta.textContent = `el ${fmt(addWork(now, 2))}`;
  const shipLabels = { 0: 'Hoy', 1: cfg.sameDayDispatch && ship.toDateString() === now.toDateString() ? 'Hoy mismo' : 'En 24 h', 2: short(addWork(now, 2)) };
  $$('[data-ship-d]').forEach((el) => { el.textContent = shipLabels[el.dataset.shipD]; });

  // ---------- recorrido del envío animado ----------
  const shipEl = $('#ship');
  if (shipEl) {
    const steps = $$('.ship__step', shipEl), fill = $('.ship__fill', shipEl), truck = $('.ship__truck', shipEl);
    const run = () => {
      if (innerWidth >= 900) { fill.style.width = '75%'; truck.style.left = 'calc(87.5% - 26px)'; }
      else fill.style.height = 'calc(100% - 86px)';
      steps.forEach((s, i) => setTimeout(() => s.classList.add('on'), reduce ? 0 : i * 600));
    };
    if (reduce) run();
    else new IntersectionObserver(([e], o) => { if (e.isIntersecting) { run(); o.disconnect(); } }, { threshold: .35 }).observe(shipEl);
  }

  // ---------- opiniones reales (VITALE.reviews en config.js) ----------
  const revs = Array.isArray(cfg.reviews) ? cfg.reviews : [];
  const revWrap = $('[data-reviews]');
  if (revWrap && revs.length) {
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    revWrap.innerHTML = revs.map((r) => `<article class="rev rv">
      <div class="stars" aria-label="${r.stars} de 5 estrellas">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
      <p>${esc(r.text)}</p>
      <footer><b>${esc(r.name)}</b>${r.city ? ' · ' + esc(r.city) : ''}<br><span class="rev__ok">✓ Compra verificada</span></footer>
    </article>`).join('');
    $('#opiniones').hidden = false;
  }

  // ---------- puntuación bajo el título: opiniones propias o, si no hay, la externa con su fuente ----------
  const rating = $('[data-rating]');
  if (rating) {
    const stars = (v) => '★'.repeat(Math.round(v)) + '☆'.repeat(5 - Math.round(v));
    const num = (v) => v.toFixed(1).replace('.', ',');
    if (revs.length) {
      const avg = revs.reduce((s, r) => s + r.stars, 0) / revs.length;
      rating.innerHTML = `<span class="stars">${stars(avg)}</span> <b>${num(avg)}</b> · ${revs.length} ${revs.length === 1 ? 'opinión' : 'opiniones'} de clientes`;
      rating.hidden = false;
    } else if (cfg.externalRating && cfg.externalRating.url) {
      const x = cfg.externalRating;
      const safe = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      rating.innerHTML = `<span class="stars">${stars(x.value)}</span> <b>${num(+x.value)}</b> · ${Number(x.count).toLocaleString('es-ES')} valoraciones de este modelo en ${safe(x.source)}`;
      if (/^https:\/\//.test(x.url)) { rating.href = x.url; rating.target = '_blank'; rating.rel = 'noopener'; }
      rating.hidden = false;
    }
  }

  // ---------- entrada suave de secciones ----------
  const rv = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) rv.forEach((el) => el.classList.add('in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
    rv.forEach((el) => io.observe(el));
  }

  // ---------- barra fija: aparece cuando los botones principales salen de pantalla ----------
  const sticky = $('#sticky'), anchor = $('[data-sticky-anchor]');
  if (sticky && anchor) {
    new IntersectionObserver(([e]) => {
      const on = !e.isIntersecting; // visible desde el primer segundo, salvo cuando ya se ven los botones principales
      sticky.classList.toggle('on', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      document.documentElement.style.setProperty('--sticky-h', on && innerWidth < 940 ? sticky.offsetHeight + 'px' : '0px');
    }).observe(anchor);
  }

  // ---------- cuenta atrás hasta el fin REAL de la rebaja (VITALE.offerEnds) ----------
  const deal = $('[data-deal]'), promoCd = $('[data-promo-cd]');
  const ends = cfg.offerEnds ? new Date(cfg.offerEnds).getTime() : 0;
  const pad = (n) => String(n).padStart(2, '0');
  let last = {};
  function tickDeal() {
    const left = ends - Date.now();
    if (!ends || left <= 0) { if (deal) deal.hidden = true; if (promoCd) promoCd.textContent = ''; $$('[data-cd-line]').forEach((el) => { el.hidden = true; }); return false; }
    const d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
    const v = { d: String(d), h: pad(h), m: pad(m), s: pad(s) };
    if (deal) {
      deal.hidden = false;
      $$('[data-cd]', deal).forEach((el) => {
        const k = el.dataset.cd;
        if (last[k] !== v[k]) { el.textContent = v[k]; if (!reduce) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } }
      });
    }
    if (promoCd) promoCd.textContent = ` · La rebaja termina en ${d ? d + 'd ' : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
    $$('[data-cd-line]').forEach((el) => { el.hidden = false; el.textContent = `La rebaja termina en ${d ? d + 'd ' : ''}${pad(h)}:${pad(m)}:${pad(s)}`; });
    last = v;
    return true;
  }
  if (tickDeal()) { const t = setInterval(() => { if (!tickDeal()) clearInterval(t); }, 1000); }

  // ---------- hora límite de envío: «pide en X h y sale hoy» (solo días laborables antes de la hora) ----------
  const cutoffEl = $('[data-cutoff]');
  function tickCutoff() {
    if (!cutoffEl || !cfg.sameDayDispatch) return;
    const n = new Date(), c = new Date(n); c.setHours(cfg.cutoffHour || 14, 0, 0, 0);
    const workday = n.getDay() % 6 !== 0;
    if (workday && n < c && c - n < 6 * 36e5) {
      const mins = Math.ceil((c - n) / 6e4), hh = Math.floor(mins / 60), mm = mins % 60;
      cutoffEl.textContent = `Pide en ${hh ? hh + ' h ' : ''}${mm} min y sale hoy`;
    } else cutoffEl.textContent = 'En stock · llega en 48 h';
  }
  tickCutoff(); setInterval(tickCutoff, 30000);

  // ---------- existencias reales (VITALE.stock), solo si bajan del umbral ----------
  $$('[data-stock]').forEach((el) => {
    const n = cfg.stock && cfg.stock[el.dataset.stock];
    if (typeof n !== 'number' || n <= 0 || n >= (cfg.stockShowBelow || 0)) return;
    $('[data-stock-txt]', el).textContent = `Quedan ${n} packs en stock`;
    el.style.setProperty('--lvl', Math.max(8, Math.round(n / cfg.stockShowBelow * 100)) + '%');
    el.hidden = false;
  });

  render();
})();
