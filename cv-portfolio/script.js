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
      const periodKey = currentLang === "es" ? "period_es" : "period_en";
      return `
            <div class="item-box job">
                <strong><span class="material-symbols-outlined">work</span> ${t.job.position_label}: ${job[positionKey]}</strong>
                <span class="company">${job.company}</span>
                <span class="job-period"><strong>${t.job.date_label}:</strong> ${job[periodKey]}</span>
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
                <strong>${lang[langKey]}</strong>&nbsp;&ndash;&nbsp;${lang[levelKey]}
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
      const linkLabel = currentLang === "es" ? "Ver proyecto" : "View project";
      const projectLink = project.url
        ? `<p><a href="${project.url}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${linkLabel}</a></p>`
        : "";
      const projectVideoButton = project.video
        ? `<p><button class="project-action-link" onclick="openVideoModal('${project.video}')"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${linkLabel}</button></p>`
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
  // El contenido se envuelve en una <table> para que el <thead> actúe como
  // margen superior automático en CADA página durante la impresión.
  container.innerHTML = `
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

            <section class="languages-section">
                <h3>${t.sections.languages}</h3>
                ${languagesHtml}
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

    // Preparar badges para impresión (convertir a Canvas blanco y negro)
    await prepareBadgesForPrint();

    // Ejecutar impresión
    window.print();

    // Restaurar el idioma original
    setLanguage(originalLang);

    // Restaurar los badges originales después de un breve delay
    setTimeout(restoreBadgesAfterPrint, 500);
  } catch (error) {
    console.error("Error al imprimir:", error);
    setLanguage(originalLang);
    restoreBadgesAfterPrint();
  }
}

// Escuchar evento de fin de impresión por si acaso
window.addEventListener('afterprint', restoreBadgesAfterPrint);

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
      const periodKey = currentLang === "es" ? "period_es" : "period_en";
      return `
            <div class="item-box job">
                <strong><span class="material-symbols-outlined">work</span> ${t.job.position_label}: ${job[positionKey]}</strong>
                <span class="company">${job.company}</span>
                <span class="job-period"><strong>${t.job.date_label}:</strong> ${job[periodKey]}</span>
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
                <strong>${lang[langKey]}</strong>&nbsp;&ndash;&nbsp;${lang[levelKey]}
            </div>
        `;
    })
    .join("");

  // --- Generar proyectos ---
  const projectsHtml = s.projects
    .map((project) => {
      const descKey =
        currentLang === "es" ? "description_es" : "description_en";
      const linkLabel = currentLang === "es" ? "Ver proyecto" : "View project";
      const projectLink = project.url
        ? `<p><a href="${project.url}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${linkLabel}</a></p>`
        : "";
      const projectVideoButton = project.video
        ? `<p><button class="project-action-link" onclick="openVideoModal('${project.video}')"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${linkLabel}</button></p>`
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

            <section class="languages-section">
                <h3>${t.sections.languages}</h3>
                ${languagesHtml}
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

/**
 * SISTEMA DE "PRINT-READY BADGES"
 * Convierte dinámicamente los badges de Shields.io a imágenes Canvas (blanco y negro)
 * para asegurar legibilidad perfecta en la impresión del PDF.
 */

const badgeCache = new Map();

// Función auxiliar para cargar imágenes con Promesi y CORS
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
    img.src = src;
  });
}

async function prepareBadgesForPrint() {
  const badges = document.querySelectorAll(".skill-badge");
  const promises = Array.from(badges).map(async (img) => {
    // Si ya está procesado, saltar
    if (img.dataset.originalSrc) return;

    const label = img.getAttribute("alt") || img.getAttribute("title") || "Skill";

    // Usar caché si ya generamos este badge
    if (badgeCache.has(label)) {
      img.dataset.originalSrc = img.src;
      img.src = badgeCache.get(label);
      return;
    }

    try {
      // Extraer logo de la URL de Shields.io
      const url = new URL(img.src);
      // Limpiar el slug: decodificar, minúsculas y quitar espacios/caracteres especiales
      let logoSlug = url.searchParams.get("logo") || label;
      logoSlug = decodeURIComponent(logoSlug)
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, ''); // Solo caracteres alfanuméricos para Simple Icons

      const iconUrl = `https://cdn.simpleicons.org/${logoSlug}`;

      // Intentar cargar el icono primero
      let iconImg = null;
      try {
        iconImg = await loadImage(iconUrl);
      } catch (e) {
        console.warn("No se pudo cargar icono para:", label);
      }

      // Crear canvas para el nuevo badge
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Medir texto para ajustar ancho
      ctx.font = "bold 11px Verdana, Geneva, sans-serif";
      const textMetrics = ctx.measureText(label);
      const padding = 12;
      const logoSpace = 20;
      const width = Math.max(textMetrics.width + padding + (iconImg ? logoSpace : 5), 40);
      const height = 20;

      canvas.width = width * 2; // Alta resolución
      canvas.height = height * 2;
      ctx.scale(2, 2);

      // 1. Fondo blanco con borde negro
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

      // 2. Dibujar Icono real si se cargó
      if (iconImg) {
        ctx.drawImage(iconImg, 6, 4, 12, 12);
      } else {
        // Placeholder circular si no hay icono
        ctx.beginPath();
        ctx.arc(10, height / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#333333";
        ctx.fill();
      }

      // 3. Texto en negro
      ctx.fillStyle = "#000000";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = "bold 10px Verdana, Geneva, sans-serif";
      ctx.fillText(label, iconImg ? logoSpace : 8, height / 2 + 0.5);

      const dataUrl = canvas.toDataURL("image/png");
      badgeCache.set(label, dataUrl);

      img.dataset.originalSrc = img.src;
      img.src = dataUrl;
    } catch (e) {
      console.warn("Error creando badge canvas para:", label, e);
      // Fallback: usar filtro CSS si falla el canvas
      img.style.filter = "grayscale(1) invert(1) contrast(2)";
    }
  });

  await Promise.all(promises);
  // Pequeño delay para asegurar renderizado
  return new Promise(resolve => setTimeout(resolve, 200));
}

function restoreBadgesAfterPrint() {
  const badges = document.querySelectorAll(".skill-badge");
  badges.forEach((img) => {
    if (img.dataset.originalSrc) {
      img.src = img.dataset.originalSrc;
      delete img.dataset.originalSrc;
      img.style.filter = "";
    }
  });
}
