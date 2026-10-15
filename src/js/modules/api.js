/**
 * Manejo de peticiones de datos
 */

/**
 * Carga los datos estáticos y traducciones
 * @param {string} lang - Idioma a cargar ('es' o 'en')
 * @returns {Promise<{staticData: Object, translations: Object}>}
 */
export async function loadResumeData(lang) {
    const timestamp = new Date().getTime();
    
    const [staticResponse, translationsResponse] = await Promise.all([
        fetch(`data/static.json?v=${timestamp}`),
        fetch(`data/translations/${lang}.json?v=${timestamp}`),
    ]);

    if (!staticResponse.ok) throw new Error(`Static data error: ${staticResponse.status}`);
    if (!translationsResponse.ok) throw new Error(`Translation error: ${translationsResponse.status}`);

    const staticData = await staticResponse.json();
    const translations = await translationsResponse.json();

    return { staticData, translations };
}
