/**
 * Lógica de Interfaz de Usuario (Temas, Video, Modales)
 */

export function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");
}

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
      // Autoplay bloqueado - esperando interacción
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

export function togglePrintOptions() {
  const options = document.getElementById("print-options");
  if (options) options.classList.toggle("active");
}

export function closePrintOptions() {
  const options = document.getElementById("print-options");
  if (options) options.classList.remove("active");
}

function updatePreviewTooltipPosition(container) {
  const tooltip = container.querySelector(".preview-tooltip");
  if (!tooltip) return;

  const icon = container.querySelector(".material-symbols-outlined");
  const containerRect = container.getBoundingClientRect();
  const iconRect = icon ? icon.getBoundingClientRect() : containerRect;

  // Measure tooltip width (ensure it's visible when measuring)
  let tooltipWidth =
    tooltip.offsetWidth || tooltip.getBoundingClientRect().width;
  const viewportWidth = window.innerWidth;

  // Compute ideal left in viewport coordinates (centered on icon)
  const iconCenterViewport = iconRect.left + iconRect.width / 2;
  const idealLeftViewport = iconCenterViewport - tooltipWidth / 2;

  // Clamp to viewport edges with 8px padding
  const minViewportLeft = 8;
  const maxViewportLeft = Math.max(
    minViewportLeft,
    viewportWidth - tooltipWidth - 8,
  );
  const clampedLeftViewport = Math.max(
    minViewportLeft,
    Math.min(idealLeftViewport, maxViewportLeft),
  );

  // Convert to container-relative left
  const leftRelative = clampedLeftViewport - containerRect.left;

  tooltip.style.left = `${leftRelative}px`;
  tooltip.style.right = "auto";
  tooltip.style.transform = "none";

  // Calculate arrow offset (icon center relative to tooltip left) and expose via CSS variable
  const arrowOffset = Math.round(iconCenterViewport - clampedLeftViewport);
  tooltip.style.setProperty("--arrow-pos", `${arrowOffset}px`);
}

function clearPreviewTooltipPosition(container) {
  const tooltip = container.querySelector(".preview-tooltip");
  if (!tooltip) return;
  tooltip.style.left = "";
  tooltip.style.right = "";
  tooltip.style.transform = "";
  tooltip.style.removeProperty("--arrow-pos");
}

export function initMobilePreviewTooltips() {
  // Attach behavior for both touch and pointer devices. We recalculate position
  // on click (toggle) and on mouseenter (hover) so the tooltip never overflows.
  const previewContainers = document.querySelectorAll(
    ".project-preview-container",
  );
  if (!previewContainers.length) return;

  previewContainers.forEach((container) => {
    const tooltip = container.querySelector(".preview-tooltip");
    if (!tooltip) return;

    container.addEventListener("click", (event) => {
      event.stopPropagation();
      const isActive = container.classList.contains("tooltip-active");
      document
        .querySelectorAll(".project-preview-container.tooltip-active")
        .forEach((activeContainer) => {
          if (activeContainer !== container) {
            activeContainer.classList.remove("tooltip-active");
            clearPreviewTooltipPosition(activeContainer);
          }
        });

      if (isActive) {
        container.classList.remove("tooltip-active");
        clearPreviewTooltipPosition(container);
      } else {
        container.classList.add("tooltip-active");
        // Wait a frame so CSS visibility/layout updates and we can measure width
        requestAnimationFrame(() => updatePreviewTooltipPosition(container));
      }
    });

    // For pointer/desktop devices, recalc on hover and clear on leave
    container.addEventListener("mouseenter", () => {
      requestAnimationFrame(() => updatePreviewTooltipPosition(container));
    });
    container.addEventListener("mouseleave", () => {
      clearPreviewTooltipPosition(container);
    });
  });

  window.addEventListener("resize", () => {
    document
      .querySelectorAll(".project-preview-container.tooltip-active")
      .forEach((container) => updatePreviewTooltipPosition(container));
  });

  document.addEventListener("click", () => {
    document
      .querySelectorAll(".project-preview-container.tooltip-active")
      .forEach((container) => {
        container.classList.remove("tooltip-active");
        clearPreviewTooltipPosition(container);
      });
  });
}

// Registro global para onclick en HTML si es necesario (aunque mejor usar main.js)
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.toggleTheme = toggleTheme;
window.togglePrintOptions = togglePrintOptions;
