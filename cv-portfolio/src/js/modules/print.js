import { generateResumeHTML } from './renderer.js';

/**
 * Lógica compleja para imprimir ambos idiomas en un solo documento
 */
export async function printBothLanguages(staticData, currentLang, loadResumeData, renderResume) {
    const container = document.getElementById("resume-container");
    const originalLang = currentLang;

    try {
        // Renderizar versión en español (página 1)
        const { staticData: sData, translations: esTranslations } = await loadResumeData("es");
        renderResume(container, sData, esTranslations, "es");

        container.classList.add("skills-print");

        // Crear sección para inglés
        const englishSection = document.createElement("div");
        englishSection.id = "english-version";
        englishSection.className = "print-page";

        // Cargar versiones en inglés
        const { translations: enTranslations } = await loadResumeData("en");
        
        // Generar HTML de versión inglés
        englishSection.innerHTML = generateResumeHTML(sData, enTranslations, "en");

        // Agregar indicador
        const langIndicator = document.createElement("div");
        langIndicator.className = "lang-indicator";
        langIndicator.textContent = "English Version";
        englishSection.insertBefore(langIndicator, englishSection.firstChild);

        container.appendChild(englishSection);

        // Esperar renderizado
        await new Promise(resolve => setTimeout(resolve, 150));

        // Personalizar título para el nombre del PDF
        const originalTitle = document.title;
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/[\s:]/g, '');
        
        document.title = `CV-Dionny Núñez-${dateStr}-${timeStr}`;

        window.print();

        // Restaurar
        document.title = originalTitle;
        container.classList.remove("skills-print");
        
        // Volver al estado original
        const { translations: originalTranslations } = await loadResumeData(originalLang);
        renderResume(container, sData, originalTranslations, originalLang);

    } catch (error) {
        console.error("Error al imprimir:", error);
    }
}
