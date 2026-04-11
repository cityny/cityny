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
      fetch("data/static.json?v=" + new Date().getTime()), // Evitar caché
      fetch(`data/translations/${lang}.json?v=${new Date().getTime()}`), // Evitar caché
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

  // --- Obtener URL base limpia (sin parámetros ni anclas) ---
  const currentFullUrl = window.location.href.split('?')[0].split('#')[0];

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
      (p) => {
        // Generar una versión corta de la URL para impresión (ej: linkedin.com/in/dionnyn/)
        const shortUrl = p.url
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/$/, ""); // Quitar slash final opcional

        return `<span class="contact-item"><i class="${socialIcons[p.network] || "fa-solid fa-link"} social-icon"></i> <a href="${p.url}" target="_blank" data-print-url="${shortUrl}"> ${p.network}</a></span>`;
      }
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
            const logoSrc = k.logo && k.logo.startsWith("http")
              ? k.logo
              : `https://cdn.simpleicons.org/${getLogoSlug(k.name, k.logo || k.badge)}`;

            return `
                <div class="custom-badge-container" title="${k.name}">
                  <img src="${logoSrc}" alt="${k.name}" loading="lazy" decoding="async">
                  <span>${k.badge}</span>
                </div>`;
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
      const periodKey = currentLang === "es" ? "period_es" : "period_en";
      let previewHtml = "";
      if (job.preview) {
        previewHtml = `<span class="project-preview-container" style="display:inline-block; margin-left: 10px; position: relative;">
          <span class="material-symbols-outlined" style="font-size: 1.1em; color: var(--primary); vertical-align: sub; cursor: pointer;">image</span>
          <span class="preview-tooltip"><img src="${job.preview}" alt="Preview" loading="lazy" decoding="async"></span>
        </span>`;
      }
      return `
            <div class="item-box job">
                <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; margin-bottom: 4px;">
                    <strong style="margin-right: 15px;"><span class="material-symbols-outlined" style="font-size: 1.1em; vertical-align: sub;">work</span> ${job[positionKey]} ${previewHtml}</strong>
                    <span style="font-size: 0.9em; opacity: 0.85;">${job.company} &nbsp;|&nbsp; ${job[periodKey]}</span>
                </div>
                <ul style="margin: 3px 0 0 25px; padding: 0; font-size: 0.95em; color: var(--text-secondary);">
                    ${job[summaryKey].map(bullet => `<li style="margin-bottom: 3px;">${bullet}</li>`).join("")}
                </ul>
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

  // --- (Idiomas ahora se manejan como parte de las habilidades) ---

  // --- Generar proyectos destacados ---
  // Selecciona automáticamente descripción en el idioma correcto
  const projectsHtml = s.projects
    .map((project) => {
      const descKey =
        currentLang === "es" ? "description_es" : "description_en";
      const linkLabel = currentLang === "es" ? "Ver proyecto" : "View project";
      let projectLink = "";
      if (project.url) {
        if (project.preview) {
          projectLink = `<p class="project-preview-container" style="display:inline-block;"><a href="${project.url}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${linkLabel}</a><span class="preview-tooltip"><img src="${project.preview}" alt="Preview del proyecto" loading="lazy" decoding="async"></span></p>`;
        } else {
          projectLink = `<p><a href="${project.url}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${linkLabel}</a></p>`;
        }
      }
      const projectVideoButton = project.video
        ? `<p><a href="${project.video}" class="project-action-link" onclick="openVideoModal('${project.video}'); return false;"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${linkLabel}</a></p>`
        : "";
      const techKey = currentLang === "es" ? "technologies_es" : "technologies_en";
      return `
            <div class="item-box job">
                <strong>${project.name}</strong>
                <p>${project[descKey]}</p>
                ${projectVideoButton}
                ${projectLink}
                <small><strong>${t.project.technologies_label}:</strong> ${project[techKey].join(", ")}</small>
            </div>
        `;
    })
    .join("");

  const summaryKey = currentLang === "es" ? "summary_es" : "summary_en";
  const summaryText = s.basics[summaryKey] || "";

  // --- Construir HTML final ---
  container.innerHTML = `
    <table class="cv-print-table">
      <thead>
        <tr>
          <td>
            <div class="cv-page-header-space"></div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="cv-print-cell">

            <header>
                <div class="digital-version-print">
                    ${currentLang === 'es' ? 'Versión digital:' : 'Digital version:'} 
                    <a href="${currentFullUrl}">${currentFullUrl.replace(/^https?:\/\//, '')}</a>
                </div>
                <h1>
                  <a href="${currentFullUrl}" style="text-decoration: none; color: inherit;">${s.basics.name}</a>
                  <span class="qr-container">
                    <span class="material-symbols-outlined qr-icon">qr_code_2</span>
                    <div class="qr-popup">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentFullUrl)}" alt="QR Code">
                      <p>${currentLang === 'es' ? 'Escanea para ver online' : 'Scan to view online'}</p>
                    </div>
                  </span>
                </h1>
                <p class="subtitle">${currentLang === "es" ? "Ingeniero Electrónico | Desarrollador de Software y Mantenimiento Industrial" : "Electronic Engineer | Software Developer and Industrial Maintenance"}</p>
                <div class="contact-info">
                    ${contactLinks.join(" | ")}
                </div>
            </header>

            <section class="summary-section">
                <h3>${t.sections.about_me}</h3>
                <p>${summaryText}</p>
            </section>

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
                <h3>${t.sections.featured_projects}</h3>
                ${projectsHtml}
            </section>

          </td>
        </tr>
      </tbody>
    </table>
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
    const enTranslationsResponse = await fetch(`data/translations/en.json?v=${new Date().getTime()}`);
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

    // Restaurar el idioma original
    setLanguage(originalLang);
  } catch (error) {
    console.error("Error al imprimir:", error);
    setLanguage(originalLang);
  }
}

function getLogoSlug(label, logo) {
  let slug = logo || label;
  return decodeURIComponent(slug)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\./g, 'dot')
    .replace(/#/g, 'sharp')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Genera el HTML del CV usando los datos actuales (staticData + translations)
 * Esta función extrae la lógica de renderizado para reutilizarla
 */
function generateResumeHTML() {
  const t = translations;
  const s = staticData;
  const currentFullUrl = window.location.href.split('?')[0].split('#')[0];

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
      (p) => {
        // Generar una versión corta de la URL para impresión (ej: linkedin.com/in/dionnyn/)
        const shortUrl = p.url
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/$/, ""); // Quitar slash final opcional

        return `<i class="${socialIcons[p.network] || "fa-solid fa-link"} social-icon"></i> <a href="${p.url}" target="_blank" data-print-url="${shortUrl}"> ${p.network}</a>`;
      }
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
            const logoSrc = k.logo && k.logo.startsWith("http")
              ? k.logo
              : `https://cdn.simpleicons.org/${getLogoSlug(k.name, k.logo || k.badge)}`;

            return `
                <div class="custom-badge-container" title="${k.name}">
                  <img src="${logoSrc}" alt="${k.name}">
                  <span>${k.badge}</span>
                </div>`;
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
      const periodKey = currentLang === "es" ? "period_es" : "period_en";
      let previewHtml = "";
      if (job.preview) {
        previewHtml = `<span class="project-preview-container" style="display:inline-block; margin-left: 10px; position: relative;">
          <span class="material-symbols-outlined" style="font-size: 1.1em; color: var(--primary); vertical-align: sub; cursor: pointer;">image</span>
          <span class="preview-tooltip"><img src="${job.preview}" alt="Preview" loading="lazy" decoding="async"></span>
        </span>`;
      }
      return `
            <div class="item-box job">
                <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; margin-bottom: 4px;">
                    <strong style="margin-right: 15px;"><span class="material-symbols-outlined" style="font-size: 1.1em; vertical-align: sub;">work</span> ${job[positionKey]} ${previewHtml}</strong>
                    <span style="font-size: 0.9em; opacity: 0.85;">${job.company} &nbsp;|&nbsp; ${job[periodKey]}</span>
                </div>
                <ul style="margin: 3px 0 0 25px; padding: 0; font-size: 0.95em; color: var(--text-secondary);">
                    ${job[summaryKey].map(bullet => `<li style="margin-bottom: 3px;">${bullet}</li>`).join("")}
                </ul>
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

  // --- (Idiomas ahora se manejan como parte de las habilidades) ---

  // --- Generar proyectos ---
  const projectsHtml = s.projects
    .map((project) => {
      const descKey =
        currentLang === "es" ? "description_es" : "description_en";
      const linkLabel = currentLang === "es" ? "Ver proyecto" : "View project";
      let projectLink = "";
      if (project.url) {
        if (project.preview) {
          projectLink = `<p class="project-preview-container" style="display:inline-block;"><a href="${project.url}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${linkLabel}</a><span class="preview-tooltip"><img src="${project.preview}" alt="Preview del proyecto" loading="lazy" decoding="async"></span></p>`;
        } else {
          projectLink = `<p><a href="${project.url}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${linkLabel}</a></p>`;
        }
      }
      const projectVideoButton = project.video
        ? `<p><a href="${project.video}" class="project-action-link" onclick="openVideoModal('${project.video}'); return false;"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${linkLabel}</a></p>`
        : "";
      const techKey = currentLang === "es" ? "technologies_es" : "technologies_en";
      return `
            <div class="item-box job">
                <strong>${project.name}</strong>
                <p>${project[descKey]}</p>
                ${projectVideoButton}
                ${projectLink}
                <small><strong>${t.project.technologies_label}:</strong> ${project[techKey].join(", ")}</small>
            </div>
        `;
    })
    .join("");

  // --- Construir HTML final ---
  // Mismo patrón de tabla: el <thead> se repite en cada página impresa
  // garantizando el margen superior de 15mm en TODAS las páginas (incluida la EN).
  return `
    <table class="cv-print-table">
      <thead>
        <tr>
          <td>
            <!-- Espacio en blanco que se repite como margen superior en cada página impresa -->
            <div class="cv-page-header-space"></div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="cv-print-cell">

            <header>
                <div class="digital-version-print">
                    ${currentLang === 'es' ? 'Versión digital:' : 'Digital version:'} 
                    <a href="${currentFullUrl}">${currentFullUrl.replace(/^https?:\/\//, '')}</a>
                </div>
                <h1>
                  <a href="${currentFullUrl}" style="text-decoration: none; color: inherit;">${s.basics.name}</a>
                  <span class="qr-container">
                    <span class="material-symbols-outlined qr-icon">qr_code_2</span>
                    <div class="qr-popup">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentFullUrl)}" alt="QR Code">
                      <p>${currentLang === 'es' ? 'Escanea para ver online' : 'Scan to view online'}</p>
                    </div>
                  </span>
                </h1>
                <p class="subtitle">${currentLang === "es" ? "Ingeniero Electrónico & Desarrollador Junior" : "Electronic Engineer & Junior Developer"}</p>
                <div class="contact-info">
                    ${contactLinks.join(" | ")}
                </div>
            </header>

            <section class="summary-section">
                <h3>${t.sections.about_me}</h3>
                <p>${s.basics[currentLang === "es" ? "summary_es" : "summary_en"] || ""}</p>
            </section>

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
                <h3>${t.sections.featured_projects}</h3>
                ${projectsHtml}
            </section>

          </td>
        </tr>
      </tbody>
    </table>
  `;
}

// =============================================================================
// SECCIÓN 7: LÓGICA DEL MODAL DE VIDEO
// =============================================================================

function openVideoModal(videoSrc) {
  const modal = document.getElementById("video-modal");
  const container = document.getElementById("modal-video-container");

  container.innerHTML = `
        <video controls autoplay>
            <source src="${videoSrc}" type="video/mp4">
            Tu navegador no soporta el elemento de video.
        </video>
    `;

  modal.classList.add("active");
  document.body.style.overflow = "hidden"; // Evita scroll de fondo
}

function closeVideoModal() {
  const modal = document.getElementById("video-modal");
  const container = document.getElementById("modal-video-container");

  container.innerHTML = ""; // Detiene el video al cerrar
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

// Cerrar modal con la tecla Esc
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeVideoModal();
});
