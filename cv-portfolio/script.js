// Carga el CV desde el archivo JSON según el idioma
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

// Renderiza todo el CV de forma automática
function renderResume(data) {
    const container = document.getElementById('resume-container');
    
    // Genera el header con basics
    const headerHTML = renderBasics(data.basics);
    
    // Genera todas las secciones dinámicamente
    const sectionsHTML = Object.entries(data)
        .filter(([key]) => key !== 'basics' && Array.isArray(data[key]))
        .map(([title, content]) => renderDynamicSection(title, content))
        .join('');
    
    container.innerHTML = `<header>${headerHTML}</header>${sectionsHTML}`;
}

// Renderiza la sección de información básica
function renderBasics(basics) {
    if (!basics) return '';
    
    // Mapea campos simples (email, telefono, etc.)
    const contactFields = Object.entries(basics)
        .filter(([key]) => !['name', 'label', 'summary', 'location', 'profiles'].includes(key))
        .map(([key, value]) => `<span><strong>${key}:</strong> ${value}</span>`)
        .join(' | ');
    
    // Mapea location
    const location = basics.location 
        ? ` | <span>📍 ${[basics.location.city, basics.location.region].filter(Boolean).join(', ')}</span>` 
        : '';
    
    // Mapea profiles con enlaces
    const profiles = basics.profiles && Array.isArray(basics.profiles)
        ? ` | ${basics.profiles.map(p => 
            `<a href="${p.url}" target="_blank" rel="noopener">${p.network}: ${p.username}</a>`
          ).join(' | ')}`
        : '';
    
    return `
        <h1>${basics.name || ''}</h1>
        <p class="subtitle">${basics.label || ''}</p>
        <div class="contact-info">
            ${contactFields}${location}${profiles}
        </div>
        <p class="summary">${basics.summary || ''}</p>
    `;
}

// Renderiza una sección dinámica basada en su contenido
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

// Renderiza un item individual (trabajo, proyecto, habilidad, idioma, etc.)
function renderItem(item) {
    // Si es un string simple, lo muestra como tag
    if (typeof item === 'string') {
        return `<span class="tag">${item}</span>`;
    }
    
    // Si tiene keywords, es una lista de habilidades
    if (item.keywords) {
        return `
            <div class="item-box skills-item">
                <strong>${item.name || titleFromKeys(item)}:</strong>
                ${item.keywords.map(k => `<span class="skill-tag">${k}</span>`).join('')}
            </div>
        `;
    }
    
    // Renderiza objeto con cualquier estructura
    return `
        <div class="item-box">
            ${item.name ? `<h4>${item.name} ${item.position ? `- ${item.position}` : ''}</h4>` : ''}
            ${item.summary ? `<p>${item.summary}</p>` : ''}
            ${renderExtraFields(item)}
        </div>
    `;
}

// Renderiza campos adicionales que no son name, position, summary o keywords
function renderExtraFields(item) {
    return Object.entries(item)
        .filter(([k]) => !['name', 'position', 'summary', 'keywords'].includes(k))
        .map(([k, v]) => {
            // Si es un array, lo une con comas
            const value = Array.isArray(v) ? v.join(', ') : v;
            return `<small><strong>${formatKey(k)}:</strong> ${value}</small>`;
        })
        .join(' | ');
}

// Genera un título desde las claves del objeto si no tiene name
function titleFromKeys(item) {
    const keyMap = {
        'Empresa': 'Empresa',
        'Cargo': 'Cargo',
        'Lenguaje': 'Idioma',
        'Tecnologías': 'Tecnologías'
    };
    for (const [k, label] of Object.entries(keyMap)) {
        if (item[k]) return label;
    }
    return '';
}

// Formatea las claves para mostrar (camelCase a espacio)
function formatKey(key) {
    return key
        .replace(/([A-Z])/g, ' $1')  // Espacio antes de mayúsculas
        .replace(/^./, str => str.toUpperCase())  // Primera letra mayúscula
        .trim();
}

// Toggle del tema claro/oscuro
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
}

// Carga inicial en español
loadResume('es');

// Event listeners
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
