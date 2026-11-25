/**
 * Galería multimedia: video(s) e imágenes con botones laterales.
 *
 * - crearGaleria(contenedor, items): monta el visor en cualquier contenedor
 *   (lo usa el modal del CV y la página docs/portafolio-28w/).
 * - openGallery / closeGallery: modal flotante #gallery-modal del CV.
 * - Un enlace con data-galeria="ruta1|ruta2|..." abre el modal (los .mp4 se
 *   reproducen como video; el resto son imágenes). Si no hay modal o JS, el
 *   enlace funciona con su href.
 */

const esVideo = (src) => /\.(mp4|webm|mov)(\?|$)/i.test(src);

export function crearGaleria(contenedor, items, { poster = "", autoplay = false } = {}) {
  let actual = 0;
  contenedor.classList.add("gal");
  contenedor.innerHTML = `
    <div class="gal-escena"></div>
    <button type="button" class="gal-flecha gal-prev" aria-label="Anterior">&#10094;</button>
    <button type="button" class="gal-flecha gal-next" aria-label="Siguiente">&#10095;</button>
    <div class="gal-contador" aria-live="polite"></div>`;
  const escena = contenedor.querySelector(".gal-escena");
  const contador = contenedor.querySelector(".gal-contador");
  const botones = contenedor.querySelectorAll(".gal-flecha");
  if (items.length < 2) botones.forEach((b) => (b.hidden = true));

  const mostrar = (i) => {
    actual = (i + items.length) % items.length;
    const src = items[actual];
    escena.innerHTML = "";
    let el;
    if (esVideo(src)) {
      el = document.createElement("video");
      el.controls = true;
      el.playsInline = true;
      el.preload = "metadata";
      el.autoplay = autoplay;
      if (poster && actual === 0) el.poster = poster;
      el.src = src;
    } else {
      el = document.createElement("img");
      el.alt = "";
      el.decoding = "async";
      el.src = src;
    }
    escena.appendChild(el);
    contador.textContent = `${actual + 1} / ${items.length}`;
    // Precarga la siguiente imagen
    const sig = items[(actual + 1) % items.length];
    if (!esVideo(sig)) new Image().src = sig;
  };
  const pausar = () => escena.querySelector("video")?.pause();

  contenedor.querySelector(".gal-prev").onclick = () => mostrar(actual - 1);
  contenedor.querySelector(".gal-next").onclick = () => mostrar(actual + 1);

  // Deslizar con el dedo
  let x0 = null;
  escena.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  escena.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
  });

  mostrar(0);
  return {
    ir: mostrar,
    anterior: () => mostrar(actual - 1),
    siguiente: () => mostrar(actual + 1),
    pausar,
    vaciar: () => { escena.innerHTML = ""; },
  };
}

let galeria = null;
let teclas = null;

export function openGallery(items, poster = "") {
  const modal = document.getElementById("gallery-modal");
  const caja = document.getElementById("gallery-container");
  if (!modal || !caja || !items?.length) return false;
  galeria = crearGaleria(caja, items, { poster, autoplay: true });
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  teclas = (e) => {
    if (e.key === "ArrowLeft") galeria.anterior();
    else if (e.key === "ArrowRight") galeria.siguiente();
    else if (e.key === "Escape") closeGallery();
  };
  document.addEventListener("keydown", teclas);
  return true;
}

export function closeGallery() {
  const modal = document.getElementById("gallery-modal");
  const caja = document.getElementById("gallery-container");
  if (!modal || !modal.classList.contains("active")) return;
  galeria?.pausar();
  galeria?.vaciar();
  galeria = null;
  if (caja) caja.innerHTML = "";
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "auto";
  if (teclas) document.removeEventListener("keydown", teclas);
  teclas = null;
}

// Enlaces "Ver proyecto" con galería (se generan al dibujar el CV, por eso se delega el clic).
// En fase de captura: el contenedor de la vista previa detiene la propagación del clic.
document.addEventListener("click", (e) => {
  const a = e.target.closest?.("a[data-galeria]");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  if (openGallery(a.dataset.galeria.split("|"), a.dataset.poster || "")) e.preventDefault();
}, true);
