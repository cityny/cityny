async function loadResume(lang) {
    try {
        const response = await fetch(`resume-${lang}.json`);
        const data = await response.json();
        renderResume(data);
    } catch (error) {
        console.error("Error cargando el CV:", error);
    }
}

function renderResume(data) {
    const container = document.getElementById('resume-container');
    [cite_start]// Ejemplo básico de renderizado (puedes ampliarlo con todas tus skills) [cite: 17, 18, 19]
    container.innerHTML = `
        <header>
            <h1>${data.basics.name}</h1>
            <h2>${data.basics.label}</h2>
            <p>${data.basics.summary}</p>
        </header>
        <section>
            <h3>Habilidades Técnicas</h3>
            <ul>
                ${data.skills.map(s => `<li><strong>${s.name}:</strong> ${s.keywords.join(', ')}</li>`).join('')}
            </ul>
        </section>
    `;
}

// Cargar por defecto en español al iniciar
loadResume('es');

// Lógica de Modo Oscuro simple
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
});
