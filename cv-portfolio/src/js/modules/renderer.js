import { getLogoSlug } from './utils.js';

/**
 * Genera el HTML completo del CV
 */
export function generateResumeHTML(staticData, translations, currentLang) {
    const t = translations;
    const s = staticData;
    const currentFullUrl = "https://analista.cc/link/cv";

    const socialIcons = {
        GitHub: "fa-brands fa-github",
        LinkedIn: "fa-brands fa-linkedin",
        Linktree: "fa-solid fa-link",
    };

    const contactLinks = [
        `<span class="contact-item"><span class="material-symbols-outlined icon-contact">mail</span> <a href="mailto:${s.basics.email}">${s.basics.email}</a></span>`,
        ...s.basics.phones.map(p => 
            `<span class="contact-item"><span class="material-symbols-outlined icon-contact">call</span> <a href="https://wa.me/${p.number.replace(/\D/g, "")}">${p.number}</a></span>`
        ),
        `<span class="contact-item"><span class="material-symbols-outlined icon-contact">location_on</span> <span class="location-text">${s.basics.location.city}, ${s.basics.location.region || ""} (${s.basics.location.countryCode})</span></span>`,
        ...s.basics.profiles.map(p => {
            const shortUrl = p.url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
            return `<span class="contact-item"><i class="${socialIcons[p.network] || "fa-solid fa-link"} social-icon"></i> <a href="${p.url}" target="_blank" data-print-url="${shortUrl}"> ${p.network}</a></span>`;
        }),
    ];

    const skillsHtml = s.skills.map(skill => {
        const categoryKey = currentLang === "es" ? "category_es" : "category_en";
        return `
            <div class="item-box">
                <strong>${skill[categoryKey]}:</strong>
                <div class="skills-badges">
                    ${skill.keywords.map(k => {
                        const logoSrc = k.logo && k.logo.startsWith("http")
                            ? k.logo
                            : `https://cdn.simpleicons.org/${getLogoSlug(k.name, k.logo || k.badge)}`;
                        return `
                        <div class="custom-badge-container" title="${k.name}">
                            <img src="${logoSrc}" alt="${k.name}" loading="lazy" decoding="async">
                            <span>${k.badge}</span>
                        </div>`;
                    }).join("")}
                </div>
            </div>`;
    }).join("");

    const experienceHtml = s.experience.map(job => {
        const summaryKey = currentLang === "es" ? "summary_es" : "summary_en";
        const positionKey = currentLang === "es" ? "position_es" : "position_en";
        const periodKey = currentLang === "es" ? "period_es" : "period_en";
        let previewHtml = job.preview ? `
            <span class="project-preview-container" style="display:inline-block; margin-left: 10px; position: relative;">
                <span class="material-symbols-outlined" style="font-size: 1.1em; color: var(--primary); vertical-align: sub; cursor: pointer;">image</span>
                <span class="preview-tooltip"><img src="${job.preview}" alt="Preview" loading="lazy" decoding="async"></span>
            </span>` : "";
        return `
            <div class="item-box job">
                <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; margin-bottom: 4px;">
                    <strong style="margin-right: 15px;"><span class="material-symbols-outlined" style="font-size: 1.1em; vertical-align: sub;">work</span> ${job[positionKey]} ${previewHtml}</strong>
                    <span style="font-size: 0.9em; opacity: 0.85;">${job.company} &nbsp;|&nbsp; ${job[periodKey]}</span>
                </div>
                <ul style="margin: 3px 0 0 25px; padding: 0; font-size: 0.95em; color: var(--text-secondary);">
                    ${job[summaryKey].map(bullet => `<li style="margin-bottom: 3px;">${bullet}</li>`).join("")}
                </ul>
            </div>`;
    }).join("");

    const educationHtml = s.education.map(edu => {
        const degreeKey = currentLang === "es" ? "degree_es" : "degree_en";
        return `
            <div class="item-box">
                <span class="material-symbols-outlined">school</span>
                <strong>${edu.institution}</strong>
                <p>${edu[degreeKey]}</p>
            </div>`;
    }).join("");

    const projectsHtml = s.projects.map(project => {
        const descKey = currentLang === "es" ? "description_es" : "description_en";
        const linkLabel = currentLang === "es" ? "Ver proyecto" : "View project";
        let projectLink = "";
        if (project.url) {
            projectLink = project.preview 
                ? `<p class="project-preview-container" style="display:inline-block;"><a href="${project.url}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${linkLabel}</a><span class="preview-tooltip"><img src="${project.preview}" alt="Preview del proyecto" loading="lazy" decoding="async"></span></p>`
                : `<p><a href="${project.url}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${linkLabel}</a></p>`;
        }
        const projectVideoButton = project.video
            ? `<p><a href="${project.video}" class="project-action-link" onclick="window.openVideoModal('${project.video}'); return false;"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${linkLabel}</a></p>`
            : "";
        const techKey = currentLang === "es" ? "technologies_es" : "technologies_en";
        return `
            <div class="item-box job">
                <strong>${project.name}</strong>
                <p>${project[descKey]}</p>
                ${projectVideoButton}
                ${projectLink}
                <small><strong>${t.project.technologies_label}:</strong> ${project[techKey].join(", ")}</small>
            </div>`;
    }).join("");

    const summaryText = s.basics[currentLang === "es" ? "summary_es" : "summary_en"] || "";

    return `
    <table class="cv-print-table">
      <thead><tr><td><div class="cv-page-header-space"></div></td></tr></thead>
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
                <div class="contact-info">${contactLinks.join(" | ")}</div>
            </header>
            <section class="summary-section">
                <h3>${t.sections.about_me}</h3>
                <p>${summaryText}</p>
            </section>
            <section>
                <h3>${t.sections.technical_skills}</h3>
                <div class="skills-grid">${skillsHtml}</div>
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
    </table>`;
}

/**
 * Renderiza el CV en el contenedor especificado
 */
export function renderResume(container, staticData, translations, currentLang) {
    if (!container) return;
    
    // Actualizar año en footer (fuera del contenedor dinámico si es posible, pero aquí lo manejamos)
    const dateSpan = document.getElementById("current-date");
    if (dateSpan) dateSpan.textContent = new Date().getFullYear();

    container.innerHTML = generateResumeHTML(staticData, translations, currentLang);
}
