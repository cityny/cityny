/**
 * =============================================================================
 * CV-Portfolio Script - Sistema i18n (Internacionalización)
 * =============================================================================
 * Maneja la carga de datos estáticos y traducciones para el CV
 * Separa el contenido traducible del contenido estático para facilitar mantenimiento
 * =============================================================================
 */

// =============================================================================
// SECCIÓN 1: VARIABLES GLOBALES DE ESTADO
// =============================================================================
// Almacenan el estado actual de la aplicación para uso en todo el script

let currentLang = 'es';      // Idioma actual ('es' o 'en')
let staticData = null;       // Datos estáticos (nombre, email, teléfono, experiencia, etc.)
let translations = null;      // Traducciones de la interfaz de usuario

// =============================================================================
// SECCIÓN 2: CARGA DE DATOS
// =============================================================================
// Funciones responsables de obtener datos del servidor y prepararlos para usar

/**
 * Carga inicial del CV desde los archivos JSON
 * @param {string} lang - Idioma a cargar ('es' o 'en')
 * 
 * Proceso:
 * 1. Actualiza el idioma actual
 * 2. Carga en paralelo: datos estáticos + traducciones del idioma
 * 3. Si todo sale bien, renderiza el CV
 * 4. Si hay error, muestra mensaje de error en pantalla
 */
async function loadResume(lang) {
    currentLang = lang;  // Guarda el idioma seleccionado
    const container = document.getElementById('resume-container');  // Contenedor principal
    
    try {
        // Cargar ambos archivos JSON al mismo tiempo (en paralelo)
        // Promise.all espera que ambos terminen antes de continuar
        const [staticResponse, translationsResponse] = await Promise.all([
            fetch('data/static.json'),                           // Datos que no cambian
            fetch(`data/translations/${lang}.json`)             // Traducciones del idioma
        ]);
        
        // Verificar que ambas respuestas fueron exitosas (código 200)
        if (!staticResponse.ok) throw new Error(`Static data error: ${staticResponse.status}`);
        if (!translationsResponse.ok) throw new Error(`Translation error: ${translationsResponse.status}`);
        
        // Convertir respuestas a objetos JavaScript
        staticData = await staticResponse.json();
        translations = await translationsResponse.json();
        
        // Una vez cargados los datos, renderizar el CV completo
        renderResume();
    } catch (error) {
        // Si algo falla, mostrar error en pantalla
        // translations?.ui?.error_loading usa optional chaining por si translations no cargó
        container.innerHTML = `<h2>${translations?.ui?.error_loading || 'Error'}: ${error.message}</h2>`;
    }
}

// =============================================================================
// SECCIÓN 3: RENDERIZADO DEL CV
// =============================================================================
// Funciones responsables de generar el HTML que se muestra en pantalla

/**
 * Renderiza el CV completo combinando datos estáticos + traducciones
 * 
 * Genera el HTML dinámicamente para las secciones:
 * - Contacto (email, teléfono, ubicación)
 * - Habilidades técnicas
 * - Experiencia laboral
 * - Educación
 * - Idiomas
 * - Proyectos destacados
 */
function renderResume() {
    const container = document.getElementById('resume-container');
    const t = translations;  // Atajo para traducciones
    const s = staticData;    // Atajo para datos estáticos
    
    // --- Generar enlaces de contacto ---
    // Crea enlaces cliqueables para email, teléfonos, ubicación y perfiles
    const contactLinks = [
        // Enlace mailto para abrir cliente de correo
        `📧 <a href="mailto:${s.basics.email}">${s.basics.email}</a>`,
        // Teléfonos con enlace a WhatsApp Web (ícono fuera del enlace)
        ...s.basics.phones.map(p => 
            `📱 <a href="https://wa.me/${p.number.replace(/\D/g, '')}">${p.number}</a>`
        ),
        // Emoji de ubicación + ciudad + región
        `📍 ${s.basics.location.city}, ${s.basics.location.region || ''}`,
        // Perfiles sociales
        ...s.basics.profiles.map(p => `🔗<a href="${p.url}" target="_blank"> ${p.network}</a>`)
    ];
    
    // --- Generar sección de habilidades técnicas ---
    // Itera sobre cada categoría de habilidades y genera tags
    const skillsHtml = s.skills.map(skill => {
        const categoryKey = currentLang === 'es' ? 'category_es' : 'category_en';
        return `
            <div class="item-box">
                <strong>${skill[categoryKey]}:</strong>
                ${skill.keywords.map(k => `<span class="skill-tag">${k}</span>`).join('')}
            </div>
        `;
    }).join('');
    
    // --- Generar experiencia laboral ---
    // Selecciona automáticamente el resumen en el idioma correcto (_es o _en)
    const experienceHtml = s.experience.map(job => {
        const summaryKey = currentLang === 'es' ? 'summary_es' : 'summary_en';
        const positionKey = currentLang === 'es' ? 'position_es' : 'position_en';
        return `
            <div class="item-box job">
                <span class="company">${job.company}</span>
                <strong>${t.job.position_label}:</strong> ${job[positionKey]}
                <br><small>📅 ${job.startDate}</small>
                <p>${job[summaryKey]}</p>
            </div>
        `;
    }).join('');
    
    // --- Generar educación ---
    // Selecciona automáticamente título en el idioma correcto
    const educationHtml = s.education.map(edu => {
        const degreeKey = currentLang === 'es' ? 'degree_es' : 'degree_en';
        return `
            <div class="item-box">
                <strong>${edu.institution}</strong>
                <p>${edu[degreeKey]}</p>
            </div>
        `;
    }).join('');
    
    // --- Generar sección de idiomas ---
    // Selecciona automáticamente nombre y nivel en el idioma correcto
    const languagesHtml = s.languages.map(lang => {
        const langKey = currentLang === 'es' ? 'language_es' : 'language_en';
        const levelKey = currentLang === 'es' ? 'level_es' : 'level_en';
        return `
            <div class="item-box">
                <strong>${lang[langKey]}</strong> - ${lang[levelKey]}
            </div>
        `;
    }).join('');
    
    // --- Generar proyectos destacados ---
    // Selecciona automáticamente descripción en el idioma correcto
    const projectsHtml = s.projects.map(project => {
        const descKey = currentLang === 'es' ? 'description_es' : 'description_en';
        return `
            <div class="item-box job">
                <strong>${project.name}</strong>
                <p>${project[descKey]}</p>
                <small><strong>${t.project.technologies_label}:</strong> ${project.technologies.join(', ')}</small>
            </div>
        `;
    }).join('');
    
    // --- Construir HTML final ---
    // Ensambla todas las secciones generadas en el contenedor principal
    container.innerHTML = `
        <header>
            <h1>${s.basics.name}</h1>
            <p class="subtitle">${currentLang === 'es' ? 'Ingeniero Electrónico & Desarrollador Junior' : 'Electronic Engineer & Junior Developer'}</p>
            
            <div class="contact-info">
                ${contactLinks.join(' | ')}
            </div>
        </header>

        <section>
            <h3>${t.sections.technical_skills}</h3>
            <div class="skills-grid">
                ${skillsHtml}
            </div>
        </section>

        <section>
            <h3>${t.sections.work_experience}</h3>
            ${experienceHtml}
        </section>

        <section>
            <h3>${t.sections.education}</h3>
            ${educationHtml}
        </section>

        <section>
            <h3>${t.sections.languages}</h3>
            ${languagesHtml}
        </section>

        <section>
            <h3>${t.sections.featured_projects}</h3>
            ${projectsHtml}
        </section>
    `;
}

// =============================================================================
// SECCIÓN 4: INTERFAZ DE USUARIO
// =============================================================================
// Funciones relacionadas con la interacción del usuario

/**
 * Cambia entre tema claro y oscuro
 * Toggle de clases CSS en el body
 */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
}

// =============================================================================
// SECCIÓN 5: EVENT LISTENERS E INICIALIZACIÓN
// =============================================================================
// Configuración de eventos y carga inicial de la aplicación

// Asigna el evento click al botón de cambio de tema
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

/**
 * Función wrapper para cambiar idioma desde el HTML
 * @param {string} lang - Idioma ('es' o 'en')
 */
function setLanguage(lang) {
    loadResume(lang);
}

// Carga inicial: ejecuta loadResume con español por defecto
loadResume('es');
