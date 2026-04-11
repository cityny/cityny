import { loadResumeData } from './modules/api.js';
import { renderResume } from './modules/renderer.js';
import { toggleTheme, initBackgroundVideo, closeVideoModal } from './modules/ui.js';
import { printBothLanguages } from './modules/print.js';

/**
 * Punto de entrada principal
 */

let currentLang = "es";
let staticData = null;
let translations = null;

const container = document.getElementById("resume-container");

/**
 * Inicialización de la aplicación
 */
async function init(lang = "es") {
    currentLang = lang;
    try {
        const data = await loadResumeData(lang);
        staticData = data.staticData;
        translations = data.translations;
        
        renderResume(container, staticData, translations, currentLang);
        initBackgroundVideo();
    } catch (error) {
        container.innerHTML = `<h2>Error: ${error.message}</h2>`;
    }
}

/**
 * Configuración de Event Listeners
 */
function setupEventListeners() {
    // Cambio de tema
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    // Cerrar modal con escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeVideoModal();
    });

    // Delegación de eventos para botones de idiomas (hover en el HTML original se mantiene o se puede pasar aquí)
    window.setLanguage = (lang) => init(lang);
    window.printBothLanguages = () => printBothLanguages(staticData, currentLang, loadResumeData, renderResume);
}

// Carga inicial
document.addEventListener("DOMContentLoaded", () => {
    init("es");
    setupEventListeners();
});

// Carga tardía de video
window.addEventListener("load", initBackgroundVideo);
