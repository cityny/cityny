async function loadResume(lang) {
    const container = document.getElementById('resume-container');
    try {
        const response = await fetch(`resume-${lang}.json`);
        if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${response.status}`);
        const data = await response.json();
        renderResume(data);
    } catch (error) {
        console.error(error);
        container.innerHTML = `<h2>Error: ${error.message}</h2>`;
    }
}

function renderResume(data) {
    const container = document.getElementById('resume-container');
    
    // Aquí es donde "mapeamos" cada campo de tu JSON al HTML
    container.innerHTML = `
        <header>
            <h1>${data.basics.name}</h1>
            <p class="subtitle">${data.basics.label}</p>
            
            <div class="contact-info">
                <span>📍 ${data.basics.location.city}, ${data.basics.location.region}</span>
                <span>📧 <a href="mailto:${data.basics.email}">${data.basics.email}</a></span>
                <span>📱 ${data.basics.phone}</span>
                <span>🔗 <a href="${data.basics.profiles[0].url}" target="_blank">${data.basics.profiles[0].network}</a></span>
            </div>

            <p class="summary">${data.basics.summary}</p>
        </header>

        <section>
            <h3>Habilidades Técnicas</h3>
            <div class="skills-grid">
                ${data.skills.map(s => `
                    <div class="skill-category">
                        <strong>${s.name}:</strong> 
                        ${s.keywords.map(k => `<span class="skill-tag">${k}</span>`).join('')}
                    </div>
                `).join('')}
            </div>
        </section>

        <section>
            <h3>Experiencia Profesional</h3>
            ${data.work.map(w => `
                <div class="job">
                    <h4>${w.position}</h4>
                    <span class="company">🏢 ${w.name}</span>
                    <p>${w.summary}</p>
                </div>
            `).join('')}
        </section>

        <section>
            <h3>Idiomas</h3>
            <div class="languages">
                ${data.languages.map(l => `
                    <span><strong>${l.language}:</strong> ${l.fluency}</span>
                `).join(' | ')}
            </div>
        </section>
    `;
}

// Carga inicial
loadResume('es');

// Lógica del botón de tema
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
});
