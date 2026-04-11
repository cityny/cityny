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

export function initMobilePreviewTooltips() {
    const isTouchDevice = window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches;
    if (!isTouchDevice) return;

    const previewContainers = document.querySelectorAll('.project-preview-container');
    if (!previewContainers.length) return;

    previewContainers.forEach((container) => {
        const tooltip = container.querySelector('.preview-tooltip');
        if (!tooltip) return;

        container.addEventListener('click', (event) => {
            event.stopPropagation();
            const isActive = container.classList.contains('tooltip-active');
            document.querySelectorAll('.project-preview-container.tooltip-active').forEach((activeContainer) => {
                if (activeContainer !== container) {
                    activeContainer.classList.remove('tooltip-active');
                }
            });
            if (isActive) {
                container.classList.remove('tooltip-active');
            } else {
                container.classList.add('tooltip-active');
            }
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.project-preview-container.tooltip-active').forEach((container) => {
            container.classList.remove('tooltip-active');
        });
    });
}

// Registro global para onclick en HTML si es necesario (aunque mejor usar main.js)
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.toggleTheme = toggleTheme;
window.togglePrintOptions = togglePrintOptions;
