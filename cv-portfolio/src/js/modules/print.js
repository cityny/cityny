import { generateResumeHTML } from './renderer.js';

/**
 * Prepara el documento para impresión (común para single y both)
 */
function preparePrint(dateStr, timeStr, prefix = "") {
    const originalTitle = document.title;
    const langPrefix = prefix ? `${prefix}-` : "";
    document.title = `CV-${langPrefix}Dionny Núñez-${dateStr}-${timeStr}`;
    return originalTitle;
}

/**
 * Restaura el estado original después de imprimir
 */
async function restoreAfterPrint(originalTitle, originalLang, sData, loadResumeData, renderResume) {
    const container = document.getElementById("resume-container");
    document.title = originalTitle;
    container.classList.remove("skills-print");
    
    // Volver al estado original en la UI
    const { translations: originalTranslations } = await loadResumeData(originalLang);
    renderResume(container, sData, originalTranslations, originalLang);
}

/**
 * Imprime un solo idioma
 */
export async function printSingleLanguage(lang, staticData, currentLang, loadResumeData, renderResume) {
    const container = document.getElementById("resume-container");
    const originalLang = currentLang;

    try {
        const { staticData: sData, translations: selectedTranslations } = await loadResumeData(lang);
        renderResume(container, sData, selectedTranslations, lang);
        container.classList.add("skills-print");

        await new Promise(resolve => setTimeout(resolve, 150));

        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/[\s:]/g, '');
        
        const prefix = lang.toUpperCase(); // ES o EN
        const originalTitle = preparePrint(dateStr, timeStr, prefix);
        window.print();
        
        await restoreAfterPrint(originalTitle, originalLang, sData, loadResumeData, renderResume);

    } catch (error) {
        console.error("Error al imprimir:", error);
    }
}

/**
 * Imprime ambos idiomas en un solo documento
 */
export async function printBothLanguages(staticData, currentLang, loadResumeData, renderResume) {
    const container = document.getElementById("resume-container");
    const originalLang = currentLang;

    try {
        const { staticData: sData, translations: esTranslations } = await loadResumeData("es");
        renderResume(container, sData, esTranslations, "es");
        container.classList.add("skills-print");

        const englishSection = document.createElement("div");
        englishSection.id = "english-version";
        englishSection.className = "print-page";

        const { translations: enTranslations } = await loadResumeData("en");
        englishSection.innerHTML = generateResumeHTML(sData, enTranslations, "en");

        container.appendChild(englishSection);

        await new Promise(resolve => setTimeout(resolve, 150));

        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/[\s:]/g, '');
        
        const originalTitle = preparePrint(dateStr, timeStr, "ES-EN");
        window.print();

        // Limpiar sección inglés extra
        const enVer = document.getElementById("english-version");
        if (enVer) enVer.remove();

        await restoreAfterPrint(originalTitle, originalLang, sData, loadResumeData, renderResume);

    } catch (error) {
        console.error("Error al imprimir:", error);
    }
}
