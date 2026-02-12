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

let currentLang = "es"; // Idioma actual ('es' o 'en')
let staticData = null; // Datos estáticos (nombre, email, teléfono, experiencia, etc.)
let translations = null; // Traducciones de la interfaz de usuario

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
  currentLang = lang; // Guarda el idioma seleccionado
  const container = document.getElementById("resume-container"); // Contenedor principal

  try {
    // Cargar ambos archivos JSON al mismo tiempo (en paralelo)
    // Promise.all espera que ambos terminen antes de continuar
    const [staticResponse, translationsResponse] = await Promise.all([
      fetch("data/static.json"), // Datos que no cambian
      fetch(`data/translations/${lang}.json`), // Traducciones del idioma
    ]);

    // Verificar que ambas respuestas fueron exitosas (código 200)
    if (!staticResponse.ok)
      throw new Error(`Static data error: ${staticResponse.status}`);
    if (!translationsResponse.ok)
      throw new Error(`Translation error: ${translationsResponse.status}`);

    // Convertir respuestas a objetos JavaScript
    staticData = await staticResponse.json();
    translations = await translationsResponse.json();

    // Una vez cargados los datos, renderizar el CV completo
    renderResume();

    // Carga diferida del video tras renderizar el contenido
    initBackgroundVideo();
  } catch (error) {
    // Si algo falla, mostrar error en pantalla
    // translations?.ui?.error_loading usa optional chaining por si translations no cargó
    container.innerHTML = `<h2>${translations?.ui?.error_loading || "Error"}: ${error.message}</h2>`;
  }
}

/**
 * Inicializa el video de fondo al final de la carga del contenido
 * Evita recargar si ya se asigno el src.
 */
function initBackgroundVideo() {
  const video = document.querySelector(".bg-video");
  if (!video) return;

  const source = video.querySelector("source[data-src]");
  if (!source || source.src) return;

  // Activa un preload liviano al finalizar la carga inicial
  video.preload = "metadata";
  source.src = source.dataset.src;
  video.load();

  // Reintenta autoplay despues de asignar el src (algunos navegadores lo requieren)
  video.muted = true;
  const playPromise = video.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      // Autoplay puede ser bloqueado; queda listo para reproducirse con interaccion
    });
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
  const container = document.getElementById("resume-container");
  const t = translations; // Atajo para traducciones
  const s = staticData; // Atajo para datos estáticos

  // --- Generar enlaces de contacto ---
  // Crea enlaces cliqueables para email, teléfonos, ubicación y perfiles
  // Mapeo de iconos de Font Awesome para redes sociales
  const socialIcons = {
    GitHub: "fa-brands fa-github",
    LinkedIn: "fa-brands fa-linkedin",
    Linktree: "fa-solid fa-link",
  };

  const contactLinks = [
    // Enlace mailto para abrir cliente de correo
    `<span class="contact-item"><span class="material-symbols-outlined icon-contact">mail</span> <a href="mailto:${s.basics.email}">${s.basics.email}</a></span>`,
    // Teléfonos con enlace a WhatsApp Web
    ...s.basics.phones.map(
      (p) =>
        `<span class="contact-item"><span class="material-symbols-outlined icon-contact">call</span> <a href="https://wa.me/${p.number.replace(/\D/g, "")}">${p.number}</a></span>`,
    ),
    // Ubicación con icono y countryCode
    `<span class="contact-item"><span class="material-symbols-outlined icon-contact">location_on</span> <span class="location-text">${s.basics.location.city}, ${s.basics.location.region || ""} (${s.basics.location.countryCode})</span></span>`,
    // Perfiles sociales con iconos de Font Awesome
    ...s.basics.profiles.map(
      (p) =>
        `<span class="contact-item"><i class="${socialIcons[p.network] || "fa-solid fa-link"} social-icon"></i> <a href="${p.url}" target="_blank"> ${p.network}</a></span>`,
    ),
  ];

  // --- Generar sección de habilidades técnicas ---
  // Itera sobre cada categoría de habilidades y genera badges de shield.io
  const skillsHtml = s.skills
    .map((skill) => {
      const categoryKey = currentLang === "es" ? "category_es" : "category_en";
      return `
            <div class="item-box">
                <strong>${skill[categoryKey]}:</strong>
                <div class="skills-badges">
                    ${skill.keywords
                      .map((k) => {
                        if (k.logo && k.logo.startsWith("http")) {
                          return `
                  <div class="custom-badge-container" title="${k.name}">
                    <img src="${k.logo}" alt="${k.name}" loading="lazy" decoding="async">
                    <span>${k.badge}</span>
                  </div>`;
                        }
                        return `
                <img src="https://img.shields.io/badge/-${k.badge}-05122A?style=flat&logo=${k.logo || k.badge}" 
                     alt="${k.name}" 
                     title="${k.name}"
                     class="skill-badge"
                     loading="lazy"
                     decoding="async">
              `;
                      })
                      .join("")}
                </div>
            </div>
        `;
    })
    .join("");

  // --- Generar experiencia laboral ---
  // Selecciona automáticamente el resumen en el idioma correcto (_es o _en)
  const experienceHtml = s.experience
    .map((job) => {
      const summaryKey = currentLang === "es" ? "summary_es" : "summary_en";
      const positionKey = currentLang === "es" ? "position_es" : "position_en";
      return `
            <div class="item-box job">
                <strong><span class="material-symbols-outlined">work</span> ${t.job.position_label}: ${job[positionKey]}</strong>
                <span class="company">${job.company}</span>
                <p>${job[summaryKey]}</p>
            </div>
        `;
    })
    .join("");

  // --- Generar educación ---
  // Selecciona automáticamente título en el idioma correcto
  const educationHtml = s.education
    .map((edu) => {
      const degreeKey = currentLang === "es" ? "degree_es" : "degree_en";
      return `
            <div class="item-box">
                <span class="material-symbols-outlined">school</span>
                <strong>${edu.institution}</strong>
                <p>${edu[degreeKey]}</p>
            </div>
        `;
    })
    .join("");

  // --- Generar sección de idiomas ---
  // Selecciona automáticamente nombre y nivel en el idioma correcto
  const languagesHtml = s.languages
    .map((lang) => {
      const langKey = currentLang === "es" ? "language_es" : "language_en";
      const levelKey = currentLang === "es" ? "level_es" : "level_en";
      return `
            <div class="item-box">
                <span class="material-symbols-outlined">language</span>
                <strong>${lang[langKey]}</strong> - ${lang[levelKey]}
            </div>
        `;
    })
    .join("");

  // --- Generar proyectos destacados ---
  // Selecciona automáticamente descripción en el idioma correcto
  const projectsHtml = s.projects
    .map((project) => {
      const descKey =
        currentLang === "es" ? "description_es" : "description_en";
      return `
            <div class="item-box job">
                <strong>${project.name}</strong>
                <p>${project[descKey]}</p>
                <small><strong>${t.project.technologies_label}:</strong> ${project.technologies.join(", ")}</small>
            </div>
        `;
    })
    .join("");

  // --- Construir HTML final ---
  // Ensambla todas las secciones generadas en el contenedor principal
  container.innerHTML = `
        <header>
            <h1>${s.basics.name}</h1>
            <p class="subtitle">${currentLang === "es" ? "Ingeniero Electrónico & Desarrollador Junior" : "Electronic Engineer & Junior Developer"}</p>
            
            <div class="contact-info">
                ${contactLinks.join(" | ")}
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
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");
}

// =============================================================================
// SECCIÓN 5: EVENT LISTENERS E INICIALIZACIÓN
// =============================================================================
// Configuración de eventos y carga inicial de la aplicación

// Asigna el evento click al botón de cambio de tema
document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

/**
 * Función wrapper para cambiar idioma desde el HTML
 * @param {string} lang - Idioma ('es' o 'en')
 */
function setLanguage(lang) {
  loadResume(lang);
}

// Carga inicial: ejecuta loadResume con español por defecto
loadResume("es");

// Carga el video de fondo al final para priorizar el contenido
window.addEventListener("load", initBackgroundVideo);

// =============================================================================
// SECCIÓN 6: IMPRESIÓN DE AMBOS IDIOMAS
// =============================================================================
// Función especial para imprimir ES + EN en un mismo documento

/**
 * Imprime ambas versiones del CV (español + inglés) en un solo documento
 *
 * Proceso:
 * 1. Guarda el idioma actual
 * 2. Renderiza versión ES
 * 3. Renderiza versión EN con salto de página
 * 4. Ejecuta window.print()
 * 5. Restaura el idioma original y re-renderiza
 */
async function printBothLanguages() {
  const container = document.getElementById("resume-container");
  const originalLang = currentLang; // Guarda el idioma actual

  try {
    // Asegurar que los datos están cargados
    if (!staticData || !translations) {
      await loadResume("es");
    }

    // Renderizar versión en español (página 1)
    currentLang = "es";
    renderResume();

    // Agregar clase para activar columnas en habilidades al imprimir
    document.getElementById("resume-container").classList.add("skills-print");

    // Crear contenedor para la versión en inglés (página 2)
    const englishSection = document.createElement("div");
    englishSection.id = "english-version";
    englishSection.className = "print-page";

    // Cargar traducciones en inglés para la versión EN
    const enTranslationsResponse = await fetch("data/translations/en.json");
    const enTranslations = await enTranslationsResponse.json();
    translations = enTranslations;
    currentLang = "en";

    // Generar el HTML de la versión en inglés
    englishSection.innerHTML = generateResumeHTML();

    // Agregar indicador de idioma al inicio de la página EN
    const langIndicator = document.createElement("div");
    langIndicator.className = "lang-indicator";
    langIndicator.textContent = "English Version";
    englishSection.insertBefore(langIndicator, englishSection.firstChild);

    container.appendChild(englishSection);

    // Esperar un momento para que el DOM se actualice
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Ejecutar impresión
    window.print();

    // Después de imprimir, restaurar versión original
    document
      .getElementById("resume-container")
      .classList.remove("skills-print");
    currentLang = originalLang;
    renderResume();
  } catch (error) {
    console.error("Error al imprimir:", error);
    // Restaurar en caso de error también
    currentLang = originalLang;
    renderResume();
  }
}

/**
 * Genera el HTML del CV usando los datos actuales (staticData + translations)
 * Esta función extrae la lógica de renderizado para reutilizarla
 */
function generateResumeHTML() {
  const t = translations;
  const s = staticData;

  // --- Generar enlaces de contacto ---
  const socialIcons = {
    GitHub: "fa-brands fa-github",
    LinkedIn: "fa-brands fa-linkedin",
    Linktree: "fa-solid fa-link",
  };

  const contactLinks = [
    `<span class="material-symbols-outlined icon-contact">mail</span> <a href="mailto:${s.basics.email}">${s.basics.email}</a>`,
    ...s.basics.phones.map(
      (p) =>
        `<span class="material-symbols-outlined icon-contact">call</span> <a href="https://wa.me/${p.number.replace(/\D/g, "")}">${p.number}</a>`,
    ),
    `<span class="material-symbols-outlined icon-contact">location_on</span> <span class="location-text">${s.basics.location.city}, ${s.basics.location.region || ""} (${s.basics.location.countryCode})</span>`,
    ...s.basics.profiles.map(
      (p) =>
        `<i class="${socialIcons[p.network] || "fa-solid fa-link"} social-icon"></i> <a href="${p.url}" target="_blank"> ${p.network}</a>`,
    ),
  ];

  // --- Generar habilidades técnicas ---
  const skillsHtml = s.skills
    .map((skill) => {
      const categoryKey = currentLang === "es" ? "category_es" : "category_en";
      return `
            <div class="item-box">
                <strong>${skill[categoryKey]}:</strong>
                <div class="skills-badges">
                    ${skill.keywords
                      .map((k) => {
                        if (k.logo && k.logo.startsWith("http")) {
                          return `
                  <div class="custom-badge-container" title="${k.name}">
                    <img src="${k.logo}" alt="${k.name}">
                    <span>${k.badge}</span>
                  </div>`;
                        }
                        return `
                <img src="https://img.shields.io/badge/-${k.badge}-05122A?style=flat&logo=${k.logo || k.badge}" 
                     alt="${k.name}" 
                     title="${k.name}"
                     class="skill-badge">
              `;
                      })
                      .join("")}
                </div>
            </div>
        `;
    })
    .join("");

  // --- Generar experiencia laboral ---
  const experienceHtml = s.experience
    .map((job) => {
      const summaryKey = currentLang === "es" ? "summary_es" : "summary_en";
      const positionKey = currentLang === "es" ? "position_es" : "position_en";
      return `
            <div class="item-box job">
                <strong><span class="material-symbols-outlined">work</span> ${t.job.position_label}: ${job[positionKey]}</strong>
                <span class="company">${job.company}</span>
                <p>${job[summaryKey]}</p>
            </div>
        `;
    })
    .join("");

  // --- Generar educación ---
  const educationHtml = s.education
    .map((edu) => {
      const degreeKey = currentLang === "es" ? "degree_es" : "degree_en";
      return `
            <div class="item-box">
                <span class="material-symbols-outlined">school</span>
                <strong>${edu.institution}</strong>
                <p>${edu[degreeKey]}</p>
            </div>
        `;
    })
    .join("");

  // --- Generar idiomas ---
  const languagesHtml = s.languages
    .map((lang) => {
      const langKey = currentLang === "es" ? "language_es" : "language_en";
      const levelKey = currentLang === "es" ? "level_es" : "level_en";
      return `
            <div class="item-box">
                <span class="material-symbols-outlined">language</span>
                <strong>${lang[langKey]}</strong> - ${lang[levelKey]}
            </div>
        `;
    })
    .join("");

  // --- Generar proyectos ---
  const projectsHtml = s.projects
    .map((project) => {
      const descKey =
        currentLang === "es" ? "description_es" : "description_en";
      return `
            <div class="item-box job">
                <strong>${project.name}</strong>
                <p>${project[descKey]}</p>
                <small><strong>${t.project.technologies_label}:</strong> ${project.technologies.join(", ")}</small>
            </div>
        `;
    })
    .join("");

  // --- Construir HTML final ---
  return `
        <header>
            <h1>${s.basics.name}</h1>
            <p class="subtitle">${currentLang === "es" ? "Ingeniero Electrónico & Desarrollador Junior" : "Electronic Engineer & Junior Developer"}</p>
            
            <div class="contact-info">
                ${contactLinks.join(" | ")}
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
