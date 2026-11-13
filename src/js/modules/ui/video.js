/**
 * Background video and video modal helpers
 */

export function initBackgroundVideo() {
  const video = document.querySelector(".bg-video");
  if (!video) return;

  const source = video.querySelector("source[data-src]");
  if (!source || source.src) return;

  video.preload = "metadata";
  source.src = source.dataset.src;
  video.load();

  video.muted = true;
  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      // Autoplay blocked - waiting for interaction
    });
  }
}

export function openVideoModal(videoSrc) {
  const modal = document.getElementById("video-modal");
  const container = document.getElementById("modal-video-container");

  if (!modal || !container) return;

  container.innerHTML = `
        <video controls autoplay>
            <source src="${videoSrc}" type="video/mp4">
            Tu navegador no soporta el elemento de video.
        </video>
    `;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

export function closeVideoModal() {
  const modal = document.getElementById("video-modal");
  const container = document.getElementById("modal-video-container");

  if (!modal || !container) return;

  container.innerHTML = "";
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}
