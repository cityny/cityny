/**
 * Funciones de utilidad para el CV
 */

/**
 * Genera un slug para logos de Simple Icons
 * @param {string} label - Nombre de la tecnología
 * @param {string} logo - Slug manual o badge
 * @returns {string} - Slug procesado
 */
export function getLogoSlug(label, logo) {
    let slug = logo || label;
    return decodeURIComponent(slug)
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/\./g, 'dot')
        .replace(/#/g, 'sharp')
        .replace(/\+/g, 'plus')
        .replace(/[^a-z0-9]/g, '');
}
