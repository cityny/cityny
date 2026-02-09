/**
 * =============================================================================
 * CV-PORTFOLIO SCRIPT
 * =============================================================================
 * Este script carga y renderiza un CV dinámicamente desde archivos JSON.
 * Soporta múltiples idiomas y renderiza cualquier estructura de datos automáticamente.
 * =============================================================================
 */

// =============================================================================
// SECCIÓN 1: CARGA DE DATOS
// =============================================================================

/**
 * Carga el CV desde el archivo JSON según el idioma especificado.
 * @param {string} lang - Código de idioma ('es' o 'en')
 */
async function loadResume(lang) {
    const container = document.getElementById('resume-container');
    try {
        const response = await fetch(`resume-${lang}.json`);
        if (!response.ok) throw new Error(`No se pudo cargar: ${response.status}`);
        const data = await response.json();
        renderResume(data);
    } catch (error) {
        container.innerHTML = `<h2>Error: ${error.message}</h2>`;
    }
}

// =============================================================================
// SECCIÓN 2: RENDERIZADO PRINCIPAL
// =============================================================================

/**
 * Renderiza todo el CV de forma automática.
 * Genera el header y todas las secciones dinámicamente.
 * @param {Object} data - Objeto completo del CV desde JSON
 */
function renderResume(data) {
    const container = document.getElementById('resume-container');
    
    // Genera el header con basics (nombre, contacto, resumen)
    const headerHTML = renderBasics(data.basics);
    
    // Genera todas las secciones dinámicamente
    // Filtra: solo secciones que sean arrays y no sean 'basics'
    const sectionsHTML = Object.entries(data)
        .filter(([key]) => key !== 'basics' && Array.isArray(data[key]))
        .map(([title, content]) => renderDynamicSection(title, content))
        .join('');
    
    // Combina header + secciones en el contenedor
    container.innerHTML = `<header>${headerHTML}</header>${sectionsHTML}`;
}

// =============================================================================
// SECCIÓN 3: RENDERIZADO DEL HEADER (BASICS)
// =============================================================================

/**
 * Renderiza la sección de información básica del CV.
 * Incluye: nombre, label, contactos, ubicación y perfiles sociales.
 * @param {Object} basics - Objeto con la información básica del CV
 * @returns {string} HTML formateado del header
 */
function renderBasics(basics) {
    if (!basics) return '';
    
    // Mapea campos simples como email, telefono, etc.
    // Excluye campos especiales que se manejan por separado
    const contactFields = Object.entries(basics)
        .filter(([key]) => !['name', 'label', 'summary', 'location', 'profiles'].includes(key))
        .map(([key, value]) => {
            // Detecta campos de teléfono y los convierte en enlace wa.me
            if (key.toLowerCase().includes('telefono') || key.toLowerCase().includes('phone')) {
                const cleanPhone = value.replace(/\D/g, ''); // Solo números
                return `<a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener"><strong>${key}:</strong> ${value}</a>`;
            }
            // Detecta correos y los convierte en mailto
            if (key.toLowerCase().includes('correo') || key.toLowerCase().includes('email')) {
                return `<a href="mailto:${value}" target="_blank"><strong>${key}:</strong> ${value}</a>`;
            }
            return `<span><strong>${key}:</strong> ${value}</span>`;
        })
        .join(' | ');
    
    // Mapea location (ciudad y región)
    const location = basics.location 
        ? ` | <span>📍 ${[basics.location.city, basics.location.region].filter(Boolean).join(', ')}</span>` 
        : '';
    
    // Mapea profiles con enlaces cliqueables
    // Genera enlaces para GitHub, LinkedIn, etc.
    const profiles = basics.profiles && Array.isArray(basics.profiles)
        ? ` | ${basics.profiles.map(p => 
            `<a href="${p.url}" target="_blank" rel="noopener">${p.network}: ${p.username}</a>`
          ).join(' | ')}`
        : '';
    
    // Retorna HTML completo del header
    return `
        <h1>${basics.name || ''}</h1>
        <p class="subtitle">${basics.label || ''}</p>
        <div class="contact-info">
            ${contactFields}${location}${profiles}
        </div>
        <p class="summary">${basics.summary || ''}</p>
    `;
}

// =============================================================================
// SECCIÓN 4: RENDERIZADO DE SECCIONES DINÁMICAS
// =============================================================================

/**
 * Renderiza una sección dinámica basada en su contenido.
 * Cada sección corresponde a un array en el JSON (experiencia, habilidades, etc.)
 * @param {string} title - Título de la sección
 * @param {Array} content - Array con los items de la sección
 * @returns {string} HTML de la sección completa
 */
function renderDynamicSection(title, content) {
    return `
        <section>
            <h3 style="text-transform: capitalize;">${title}</h3>
            <div class="${title}-content">
                ${content.map(item => renderItem(item)).join('')}
            </div>
        </section>
    `;
}

// =============================================================================
// SECCIÓN 5: RENDERIZADO DE ITEMS INDIVIDUALES
// =============================================================================

/**
 * Renderiza un item individual dentro de una sección.
 * Detecta automáticamente el tipo de item y lo renderiza apropiadamente.
 * @param {Object|string} item - Item a renderizar
 * @returns {string} HTML del item formateado
 */
function renderItem(item) {
    // Tipo 1: Si es un string simple, lo muestra como tag
    if (typeof item === 'string') {
        return `<span class="tag">${item}</span>`;
    }
    
    // Tipo 2: Si tiene keywords, es una lista de habilidades/tags
    // Renderiza con skill-tags alrededor de cada keyword
    if (item.keywords) {
        return `
            <div class="item-box skills-item">
                <strong>${item.name || titleFromKeys(item)}:</strong>
                ${item.keywords.map(k => `<span class="skill-tag">${k}</span>`).join('')}
            </div>
        `;
    }
    
    // Tipo 3: Objeto genérico (trabajo, proyecto, idioma, etc.)
    // Renderiza name, position, summary y campos adicionales
    return `
        <div class="item-box">
            ${item.name ? `<h4>${item.name} ${item.position ? `- ${item.position}` : ''}</h4>` : ''}
            ${item.summary ? `<p>${item.summary}</p>` : ''}
            ${renderExtraFields(item)}
        </div>
    `;
}

// =============================================================================
// SECCIÓN 6: UTILIDADES DE RENDERIZADO
// =============================================================================

/**
 * Renderiza campos adicionales de un objeto que no son name, position, summary o keywords.
 * Útil para campos como Empresa, Fecha, Tecnologías, etc.
 * @param {Object} item - Objeto del cual renderizar campos adicionales
 * @returns {string} HTML de los campos adicionales
 */
function renderExtraFields(item) {
    return Object.entries(item)
        .filter(([k]) => !['name', 'position', 'summary', 'keywords'].includes(k))
        .map(([k, v]) => {
            // Si el valor es un array, lo une con comas para mostrar
            const value = Array.isArray(v) ? v.join(', ') : v;
            return `<small><strong>${formatKey(k)}:</strong> ${value}</small>`;
        })
        .join(' | ');
}

/**
 * Genera un título desde las claves del objeto si no existe 'name'.
 * Útil cuando los items tienen campos como 'Empresa', 'Cargo', etc.
 * @param {Object} item - Objeto sin campo 'name'
 * @returns {string} Título generado o cadena vacía
 */
function titleFromKeys(item) {
    // Mapeo de claves comunes a etiquetas legibles
    const keyMap = {
        'Empresa': 'Empresa',
        'Cargo': 'Cargo',
        'Lenguaje': 'Idioma',
        'Tecnologías': 'Tecnologías'
    };
    
    // Busca la primera clave presente en el objeto
    for (const [k, label] of Object.entries(keyMap)) {
        if (item[k]) return label;
    }
    return '';
}

/**
 * Formatea las claves para mostrar de forma legible.
 * Convierte camelCase a texto con espacios y capitaliza la primera letra.
 * Ej: 'fechaInicio' → 'Fecha Inicio'
 * @param {string} key - Clave a formatear
 * @returns {string} Clave formateada para visualización
 */
function formatKey(key) {
    return key
        .replace(/([A-Z])/g, ' $1')  // Inserta espacio antes de mayúsculas
        .replace(/^./, str => str.toUpperCase())  // Capitaliza primera letra
        .trim();
}

// =============================================================================
// SECCIÓN 7: INTERFAZ DE USUARIO
// =============================================================================

/**
 * Alterna entre el tema claro y oscuro.
 * Modifica las clases del body para activar los estilos CSS correspondientes.
 */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
}

// =============================================================================
// SECCIÓN 8: INICIALIZACIÓN
// =============================================================================

// Carga inicial del CV en español por defecto
loadResume('es');

// Configura el evento click para el botón de toggle de tema
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
