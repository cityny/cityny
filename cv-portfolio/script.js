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

function renderResume(data) {
    const container = document.getElementById('resume-container');
    
    container.innerHTML = `
        <header>
            <h1>${data.basics.name || ''}</h1>
            <p class="subtitle">${data.basics.label || ''}</p>
            
            <div class="contact-info">
                ${Object.entries(data.basics)
                    .filter(([key]) => !['name', 'label', 'summary', 'location', 'profiles'].includes(key))
                    .map(([key, value]) => `<span><strong>${key}:</strong> ${value}</span>`)
                    .join(' | ')
                }
                ${data.basics.location ? ` | <span>📍 ${data.basics.location.city}</span>` : ''}
            </div>

            <p class="summary">${data.basics.summary || ''}</p>
        </header>

        ${Object.entries(data).map(([sectionTitle, content]) => {
            if (sectionTitle === 'basics' || !Array.isArray(content)) return '';
            
            return `
                <section>
                    <h3 style="text-transform: capitalize;">${sectionTitle}</h3>
                    <div class="${sectionTitle}-content">
                        ${renderSectionContent(sectionTitle, content)}
                    </div>
                </section>
            `;
        }).join('')}
    `;
}

function renderSectionContent(title, content) {
    return content.map(item => {
        if (typeof item === 'string') return `<span class="tag">${item}</span>`;
        
        if (item.keywords) {
            return `<div class="item-box">
                <strong>${item.name}:</strong> 
                ${item.keywords.map(k => `<span class="skill-tag">${k}</span>`).join('')}
            </div>`;
        }
        
        return `
            <div class="item-box">
                ${item.name ? `<h4>${item.name} ${item.position ? `- ${item.position}` : ''}</h4>` : ''}
                ${item.summary ? `<p>${item.summary}</p>` : ''}
                ${Object.entries(item)
                    .filter(([k]) => !['name', 'position', 'summary', 'keywords'].includes(k))
                    .map(([k, v]) => `<small><strong>${k}:</strong> ${v} </small>`).join('')}
            </div>
        `;
    }).join('');
}

// FUNCIONES DE INTERFAZ
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
}

// Carga inicial por defecto
loadResume('es');

// Eventos
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
