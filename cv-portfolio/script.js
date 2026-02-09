async function loadResume(lang) {
    const container = document.getElementById('resume-container');
    console.log(`Cargando idioma: ${lang}`);
    
    try {
        // Usamos una ruta relativa sin el punto inicial para evitar confusiones en GitHub Pages
        const response = await fetch(`resume-${lang}.json`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se encontró resume-${lang}.json`);
        }
        
        const data = await response.json();
        renderResume(data);
    } catch (error) {
        console.error("Error:", error);
        container.innerHTML = `<h2 style="color:red">Error al cargar los datos</h2>
                               <p>Detalle: ${error.message}</p>`;
    }
}

function renderResume(data) {
    const container = document.getElementById('resume-container');
    
    container.innerHTML = `
        <header>
            <h1>${data.basics.name}</h1>
            <p class="subtitle">${data.basics.label}</p>
            <p class="summary">${data.basics.summary}</p>
        </header>
        <section>
            <h3>Habilidades Técnicas</h3>
            <div class="skills-grid">
                ${data.skills.map(s => `<span><strong>${s.name}:</strong> ${s.keywords.join(', ')}</span>`).join(' | ')}
            </div>
        </section>
        <section>
            <h3>Experiencia Laboral</h3>
            ${data.work.map(w => `
                <div class="job">
                    <h4>${w.position} @ ${w.name}</h4>
                    <p>${w.summary}</p>
                </div>
            `).join('')}
        </section>
    `;
}

// Carga inicial
loadResume('es');

// Switch de tema
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
});
