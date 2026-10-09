import { loadResumeData } from "./modules/api.js";
import { renderResume } from "./modules/renderer.js";
import {
  toggleTheme,
  initBackgroundVideo,
  closeVideoModal,
  togglePrintOptions,
  closePrintOptions,
  initMobilePreviewTooltips,
} from "./modules/ui.js";
import { printBothLanguages, printSingleLanguage } from "./modules/print.js";
import { initVisitCounter } from "./modules/ui/visits.js";

/**
 * Punto de entrada principal
 */

let currentLang = "es";
let staticData = null;
let translations = null;
// Datos en edición (vista previa) y último currículo publicado desde el editor
let draftData = null;
let publishedData = null;

const container = document.getElementById("resume-container");

/**
 * Inicialización de la aplicación
 */
async function init(lang = "es") {
  if (lang === currentLang && staticData) return;
  currentLang = lang;
  try {
    const data = await loadResumeData(lang);
    // Tras publicar, GitHub Pages tarda un poco en servir el archivo nuevo
    staticData = publishedData || data.staticData;
    translations = data.translations;

    document.documentElement.lang = currentLang;
    applyUiTranslations(translations);
    renderResume(container, draftData || staticData, translations, currentLang);
    initBackgroundVideo();
    initMobilePreviewTooltips();
  } catch (error) {
    container.innerHTML = `<h2>Error: ${error.message}</h2>`;
  }
}

/**
 * Conexión del editor con la página (modules/editor)
 */
const editorPage = {
  preview(data) {
    draftData = data;
    renderResume(container, data, translations, currentLang);
  },
  commit(data) {
    draftData = null;
    publishedData = data;
    staticData = data;
    renderResume(container, staticData, translations, currentLang);
    initMobilePreviewTooltips();
  },
  discard() {
    draftData = null;
    renderResume(container, staticData, translations, currentLang);
    initMobilePreviewTooltips();
  },
};

/**
 * Tres clics seguidos sobre el nombre del pie de página muestran el botón de editar
 */
function setupEditorTrigger() {
  const name = document.getElementById("footer-name");
  if (!name) return;
  let clicks = 0;
  let timer = null;
  name.addEventListener("click", async () => {
    clicks += 1;
    clearTimeout(timer);
    timer = setTimeout(() => (clicks = 0), 600);
    if (clicks < 3) return;
    clicks = 0;
    const editor = await import("./modules/editor/index.js");
    editor.revealEditButton(editorPage);
  });
}

/**
 * Traduce los textos fijos de la barra superior
 */
function applyUiTranslations(t) {
  const visitsLabel = document.getElementById("visit-counter-label");
  if (visitsLabel && t.ui && t.ui.visits) visitsLabel.textContent = t.ui.visits;
  if (!t.print) return;
  const labels = {
    "print-es": t.print.option_es,
    "print-en": t.print.option_en,
    "print-both": t.print.option_both,
  };
  Object.entries(labels).forEach(([id, text]) => {
    const btn = document.getElementById(id);
    if (btn && text) btn.textContent = text;
  });
  const printBtn = document.getElementById("print-btn");
  if (printBtn && t.print.button_title) printBtn.title = t.print.button_title;
}

/**
 * Configuración de Event Listeners
 */
function setupEventListeners() {
  // Cambio de tema
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  // Menú de Impresión
  const printBtn = document.getElementById("print-btn");
  if (printBtn)
    printBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePrintOptions();
    });

  // Cerrar menú de impresión al hacer clic fuera
  document.addEventListener("click", () => {
    closePrintOptions();
  });

  // Opciones de Impresión
  const btnEs = document.getElementById("print-es");
  if (btnEs)
    btnEs.addEventListener("click", () => {
      printSingleLanguage(
        "es",
        staticData,
        currentLang,
        loadResumeData,
        renderResume,
      );
    });

  const btnEn = document.getElementById("print-en");
  if (btnEn)
    btnEn.addEventListener("click", () => {
      printSingleLanguage(
        "en",
        staticData,
        currentLang,
        loadResumeData,
        renderResume,
      );
    });

  const btnBoth = document.getElementById("print-both");
  if (btnBoth)
    btnBoth.addEventListener("click", () => {
      printBothLanguages(staticData, currentLang, loadResumeData, renderResume);
    });

  // Cerrar modal con escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeVideoModal();
  });

  // Cambio de idioma
  document.querySelectorAll(".lang-selector button[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => init(btn.dataset.lang));
  });
  window.setLanguage = (lang) => init(lang);
  window.printBothLanguages = () =>
    printBothLanguages(staticData, currentLang, loadResumeData, renderResume);
}

// Carga inicial
document.addEventListener("DOMContentLoaded", () => {
  init("es");
  setupEventListeners();
  setupEditorTrigger();
  initVisitCounter();
});

// Carga tardía de video
window.addEventListener("load", initBackgroundVideo);
