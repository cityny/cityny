import { generateResumeHTML } from './renderer.js?v=20261104a';

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
    document.body.classList.remove("apa-print");
    
    // Volver al estado original en la UI
    const { translations: originalTranslations } = await loadResumeData(originalLang);
    renderResume(container, sData, originalTranslations, originalLang);
}

/**
 * Imprime un solo idioma
 */
export async function printSingleLanguage(lang, staticData, currentLang, loadResumeData, renderResume, titlePrefix = "", personal = null) {
    const container = document.getElementById("resume-container");
    const originalLang = currentLang;

    try {
        const { staticData: sData, translations: selectedTranslations } = await loadResumeData(lang);
        renderResume(container, sData, selectedTranslations, lang);
        container.classList.add("skills-print");

        if (personal) {
            const { personalBlockHtml } = await import("./personal.js?v=20261113b");
            const header = container.querySelector("header");
            if (header) {
                header.classList.add("has-personal");
                header.insertAdjacentHTML("beforeend", personalBlockHtml(personal, lang));
                // Esperar a que cargue la foto antes de imprimir
                const img = header.querySelector(".personal-photo");
                if (img) await img.decode().catch(() => {});
            }
        }

        await new Promise(resolve => setTimeout(resolve, 150));

        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/[\s:]/g, '');
        
        const prefix = titlePrefix + lang.toUpperCase(); // ES, EN o APA-ES
        const originalTitle = preparePrint(dateStr, timeStr, prefix);
        window.print();
        
        await restoreAfterPrint(originalTitle, originalLang, sData, loadResumeData, renderResume);

    } catch (error) {
        console.error("Error al imprimir:", error);
    }
}

/**
 * Imprime en formato APA, español e inglés en el mismo archivo: márgenes de
 * 2,54 cm, Times New Roman 12 y número de página.
 * Los estilos están en print.css, bajo body.apa-print.
 */
export async function printApa(staticData, currentLang, loadResumeData, renderResume) {
    document.body.classList.add("apa-print");
    await printBothLanguages(staticData, currentLang, loadResumeData, renderResume, "APA-");
}

/**
 * Imprime ambos idiomas en un solo documento
 */
export async function printBothLanguages(staticData, currentLang, loadResumeData, renderResume, titlePrefix = "") {
    const container = document.getElementById("resume-container");
    const originalLang = currentLang;

    try {
        const { staticData: sData, translations: esTranslations } = await loadResumeData("es");
        renderResume(container, sData, esTranslations, "es");
        container.classList.add("skills-print");

        const englishSection = document.createElement("div");
        englishSection.id = "english-version";
        englishSection.className = "print-page";
        englishSection.lang = "en";

        const { translations: enTranslations } = await loadResumeData("en");
        englishSection.innerHTML = generateResumeHTML(sData, enTranslations, "en");

        container.appendChild(englishSection);

        await new Promise(resolve => setTimeout(resolve, 150));

        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/[\s:]/g, '');
        
        const originalTitle = preparePrint(dateStr, timeStr, titlePrefix + "ES-EN");
        window.print();

        // Limpiar sección inglés extra
        const enVer = document.getElementById("english-version");
        if (enVer) enVer.remove();

        await restoreAfterPrint(originalTitle, originalLang, sData, loadResumeData, renderResume);

    } catch (error) {
        console.error("Error al imprimir:", error);
    }
}

/**
 * Imprime el CV con datos personales (CI, fecha de nacimiento, dirección, foto)
 * en el idioma actual, solo si la clave descifra data/personal.enc.json.
 */
export async function printPersonal(staticData, currentLang, loadResumeData, renderResume) {
    const { askPassword, decryptPersonal } = await import("./personal.js?v=20261113b");
    const es = currentLang === "es";
    const password = await askPassword(currentLang);
    if (password === null) return;
    let personal;
    try {
        personal = await decryptPersonal(password);
    } catch (e) {
        alert(es ? "Clave incorrecta." : "Wrong password.");
        return;
    }
    await printSingleLanguage(currentLang, staticData, currentLang, loadResumeData, renderResume, "PERSONAL-", personal);
}
