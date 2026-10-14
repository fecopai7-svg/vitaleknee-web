// Configuración de la tienda. Cambia aquí el dominio cuando conectes uno propio a Shopify
// (por ejemplo, tienda.vitaleknee.com). Los IDs son las variantes del producto en Shopify.
window.VITALE = {
  shop: 'https://tienda.vitaleknee.com',
  variants: {
    uno: '53766875283792',   // 1 unidad · 49,99 €
    dos: '53771315872080'    // producto «Pack 2 unidades» (SKU PACK-41 del almacén) · 79,98 €
  },
  utm: 'utm_source=vitaleknee&utm_medium=web&utm_campaign=landing',
  // ID del píxel de Meta. Vacío = no se carga nada. Solo se activa si el visitante acepta las cookies de publicidad.
  pixelId: '1364881855720560',  // conjunto de datos «Vitalé web» (portfolio Vitalé)
  // Número de WhatsApp con prefijo de país y sin espacios ni «+» (ej. '34600111222'). Vacío = no se muestra el botón.
  whatsapp: '34628891834',
  // Correo del botón flotante «¿Dudas? Escríbenos» (sustituye al de WhatsApp desde 2026-10-13).
  contactEmail: 'contact@vitaleknee.com',
  // Opiniones REALES de clientes (solo compras verificadas). La sección «Opiniones» de /producto
  // se muestra en cuanto haya al menos una. Formato:
  // { stars: 5, name: 'Carmen R.', city: 'Valladolid', text: 'Lo uso cada tarde en el sofá…' }
  reviews: [],
  // Puntuación externa de ESTE MISMO modelo (p. ej. el anuncio del proveedor en AliExpress), siempre con la fuente
  // visible y enlazada. Ejemplo: { value: 4.7, count: 2300, source: 'AliExpress', url: 'https://…' }
  externalRating: null,
  // Fin REAL de la rebaja (−10 €). La cuenta atrás de /producto apunta aquí y desaparece al llegar.
  // Ese día hay que volver a subir los precios en Shopify (59,99 € / 89,99 €) o fijar una nueva fecha real:
  // una cuenta atrás que se reinicia sola es una práctica engañosa prohibida.
  offerEnds: '2026-10-19T23:59:59+02:00',
  // Existencias REALES en Shopify (revisar al menos una vez por semana). Se muestran en el pack
  // solo cuando bajan de stockShowBelow; por encima no se enseña ningún aviso.
  stock: { uno: 91, dos: 38 },
  stockShowBelow: 60,
  // Envío en el mismo día: ponlo a true SOLO si el almacén de verdad saca el mismo día los pedidos
  // hechos antes de cutoffHour (hora de Madrid). Con false no se muestra «sale hoy».
  sameDayDispatch: false,
  cutoffHour: 14
};
