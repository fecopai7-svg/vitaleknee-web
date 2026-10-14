// Vitalé — aviso de cookies (consentimiento previo, rechazar tan fácil como aceptar)
// Guarda la elección en el navegador y solo carga el píxel de Meta si se aceptan las de publicidad
// y hay un ID configurado en config.js (VITALE.pixelId).
// v2: barra compacta abajo que no tapa el contenido; reserva su altura en --ck-h para que la barra
// de compra y el botón de WhatsApp queden por encima. Estilos propios para que funcione en todas las páginas.
(function () {
  const KEY = 'vk-consent';
  const VERSION = 1;
  const cfg = window.VITALE || {};

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.v === VERSION ? v : null;
    } catch (e) { return null; }
  }
  function save(analytics, ads) {
    const prev = read();
    const v = { v: VERSION, analytics: !!analytics, ads: !!ads, ts: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    if (prev && prev.ads && !v.ads) return revoke();
    apply(v);
    return v;
  }
  // consent withdrawn: delete the Meta cookies on this domain and reload so the pixel is no longer on the page
  function revoke() {
    const host = location.hostname.replace(/^www./, '');
    ['_fbp', '_fbc'].forEach((n) => {
      ['', '; domain=.' + host, '; domain=' + location.hostname].forEach((d) => {
        document.cookie = n + '=; Max-Age=0; path=/' + d;
      });
    });
    location.reload();
  }

  function loadPixel() {
    if (!cfg.pixelId || window.fbq) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', cfg.pixelId);
    window.fbq('track', 'PageView');
    if (/^\/(index(\.html)?|producto(\.html)?)?$/.test(location.pathname)) {
      window.fbq('track', 'ViewContent', { content_name: 'Masajeador de Rodilla Vitalé', content_type: 'product', value: 49.99, currency: 'EUR' });
    }
  }
  function apply(v) {
    window.vkConsent = v;
    if (v && v.ads) loadPixel();
    document.dispatchEvent(new CustomEvent('vk:consent', { detail: v }));
  }

  // ---------- interfaz ----------
  const css = `
  .vkck{position:fixed;left:0;right:0;bottom:0;z-index:80;background:#1E1712;color:#F4ECE2;font:400 15px/1.45 Inter,system-ui,sans-serif;padding:12px 16px calc(12px + env(safe-area-inset-bottom));box-shadow:0 -6px 20px rgba(0,0,0,.18);transform:translateY(100%);transition:transform .3s}
  .vkck.on{transform:none}
  .vkck[hidden]{display:none}
  .vkck__in{max-width:1120px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}
  .vkck__d{flex:1 1 320px;margin:0}
  .vkck__d a,.vkck__cfgl{color:#F4ECE2;text-decoration:underline;background:none;border:0;padding:0;font:inherit;cursor:pointer}
  .vkck__btns{display:flex;gap:8px;flex:0 0 auto}
  .vkck__b{min-width:112px;min-height:44px;padding:0 16px;border-radius:10px;border:1.5px solid #F4ECE2;background:transparent;color:#F4ECE2;font:600 15px/1 Inter,system-ui,sans-serif;cursor:pointer}
  .vkck__b:focus-visible{outline:3px solid #FFB37A;outline-offset:2px}
  .vkck__cfg{flex:1 1 100%;display:grid;gap:8px;margin:4px 0}
  .vkck__cfg[hidden]{display:none}
  .vkck__row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.07)}
  .vkck__row small{display:block;opacity:.75}
  .vkck__row input{width:22px;height:22px;accent-color:#D9541E}
  @media (max-width:560px){.vkck__btns{width:100%}.vkck__b{flex:1}}`;

  const html = `
  <div class="vkck" role="region" aria-label="Aviso de cookies" hidden>
    <div class="vkck__in">
      <p class="vkck__d">Usamos cookies técnicas para que el pedido funcione y, si nos dejas, otras de publicidad para medir nuestros anuncios. <a href="cookies">Más información</a> · <button type="button" class="vkck__cfgl" data-ck-act="config">Configurar</button></p>
      <div class="vkck__cfg" hidden>
        <label class="vkck__row"><span><b>Técnicas</b><small>Necesarias para que la web y el pedido funcionen.</small></span><input type="checkbox" checked disabled></label>
        <label class="vkck__row"><span><b>Publicidad</b><small>Medir nuestros anuncios en Facebook e Instagram.</small></span><input type="checkbox" data-ck="ads"></label>
      </div>
      <div class="vkck__btns">
        <button type="button" class="vkck__b" data-ck-act="reject">Rechazar</button>
        <button type="button" class="vkck__b" data-ck-act="save" hidden>Guardar</button>
        <button type="button" class="vkck__b" data-ck-act="accept">Aceptar</button>
      </div>
    </div>
  </div>`;

  function mount() {
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    const wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    const box = wrap.firstChild;
    document.body.appendChild(box);
    const cfgBox = box.querySelector('.vkck__cfg');
    const btnCfg = box.querySelector('[data-ck-act="config"]');
    const btnSave = box.querySelector('[data-ck-act="save"]');
    const chk = (k) => box.querySelector(`[data-ck="${k}"]`);
    const root = document.documentElement;
    const setH = () => root.style.setProperty('--ck-h', box.hidden ? '0px' : box.offsetHeight + 'px');
    addEventListener('resize', () => { if (!box.hidden) setH(); });

    function open(showConfig) {
      const cur = read();
      
      chk('ads').checked = !!(cur && cur.ads);
      cfgBox.hidden = !showConfig; btnSave.hidden = !showConfig; btnCfg.hidden = !!showConfig;
      box.hidden = false;
      setH();
      void box.offsetHeight; // force layout so the slide-in transition runs
      box.classList.add('on');
    }
    function close() {
      box.classList.remove('on');
      setTimeout(() => { box.hidden = true; setH(); }, 300);
    }
    box.addEventListener('click', (e) => {
      const a = e.target.closest('[data-ck-act]'); if (!a) return;
      const act = a.dataset.ckAct;
      if (act === 'accept') { save(false, true); close(); }
      else if (act === 'reject') { save(false, false); close(); }
      else if (act === 'config') { open(true); }
      else if (act === 'save') { save(false, chk('ads').checked); close(); }
    });
    // enlace «Preferencias de cookies» del pie
    document.addEventListener('click', (e) => {
      const l = e.target.closest('[data-ck-open]'); if (!l) return;
      e.preventDefault(); open(true);
    });

    const cur = read();
    // the banner waits a few seconds so the first screen (price + «Comprar ya») stays clean;
    // nothing is tracked before consent, so delaying it changes nothing legally
    if (cur) apply(cur); else setTimeout(() => open(false), 8000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
