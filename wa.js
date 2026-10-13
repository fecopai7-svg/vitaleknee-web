// Vitalé — botón flotante de dudas por correo (compartido por todas las páginas, con estilos propios)
// Lee el correo de config.js (VITALE.contactEmail). Se coloca por encima del aviso de cookies (--ck-h)
// y de la barra fija de compra en móvil.
(function () {
  const cfg = window.VITALE || {};
  if (!cfg.contactEmail) return;
  const css = `
  .vkwa{position:fixed;right:16px;bottom:calc(var(--ck-h,0px) + 92px);z-index:75;display:inline-flex;align-items:center;gap:10px;height:56px;padding:0 20px 0 14px;border-radius:28px;background:#15171A;color:#fff;text-decoration:none;font:600 16px/1 Inter,system-ui,sans-serif;box-shadow:0 10px 26px rgba(21,23,26,.35);transition:bottom .3s,transform .2s}
  .vkwa:hover{transform:translateY(-2px)}
  .vkwa svg{width:28px;height:28px;flex:none}
  .vkwa::before{content:"";position:absolute;inset:0;border-radius:inherit;border:2px solid #E4572E;animation:vkwa 2.4s ease-out infinite}
  @keyframes vkwa{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.35)}}
  @media (min-width:920px){.vkwa{bottom:calc(var(--ck-h,0px) + 24px)}}
  @media (max-width:440px){.vkwa span{display:none}.vkwa{width:56px;padding:0;justify-content:center}}
  @media (prefers-reduced-motion:reduce){.vkwa::before{animation:none}}`;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
  const a = document.createElement('a');
  a.className = 'vkwa';
  a.href = `mailto:${cfg.contactEmail}?subject=${encodeURIComponent('Duda sobre el masajeador Vitalé')}`;
  a.setAttribute('aria-label', 'Escríbenos por correo');
  a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><span>¿Dudas? Escríbenos</span>';
  a.addEventListener('click', () => { if (window.fbq) window.fbq('track', 'Contact'); });
  const mount = () => document.body.appendChild(a);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
