async function loadResume(lang) {
    const container = document.getElementById('resume-container');
    console.log(`Intentando cargar idioma: ${lang}`);
    
    try {
        // Añadimos ./ para asegurar que busque en la misma carpeta
        const response = await fetch(`./resume-${lang}.json`);
        
        if (!response.ok) {
            throw new Error(`No se pudo encontrar el archivo resume-${lang}.json (Status: ${response.status})`);
        }
        
        const data = await response.json();
        renderResume(data);
    } catch (error) {
        console.error("Error detallado:", error);
        container.innerHTML = `<h1 style="color:red">Error: ${error.message}</h1>
                               <p>Asegúrate de que los archivos JSON estén en la carpeta cv-portfolio</p>`;
    }
}

function renderResume(data) {
    const container = document.getElementById('resume-container');
    
    // Estructura de renderizado mejorada basada en tu PDF
    container.innerHTML = `
        <header>
            <h1>${data.basics.name}</h1>
            <p><strong>${data.basics.label}</strong></p>
            <p>${data.basics.summary}</p>
        </header>
        <hr>
        <section>
            <h3>Habilidades</h3>
            <ul>
                ${data.skills.map(s => `<li><strong>${s.name}:</strong> ${s.keywords.join(', ')}</li>`).join('')}
            </ul>
        </section>
        <section>
            <h3>Experiencia</h3>
            ${data.work.map(w => `
                <div>
                    <h4>${w.position} - ${w.name}</h4>
                    <p>${w.summary}</p>
                </div>
            `).join('')}
        </section>
    `;
}

// Cargar inicial
loadResume('es');

// Tema
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
});
