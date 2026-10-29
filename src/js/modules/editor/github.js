/**
 * Lectura y escritura de static.json en GitHub
 */

const API_URL =
  "https://api.github.com/repos/cityny/cityny/contents/cv-portfolio/data/static.json";
const BRANCH = "main";

const ERROR_MESSAGES = {
  401: "GitHub no acepta el token: es incorrecto o ha caducado.",
  403: "El token no tiene permiso para modificar el repositorio (hace falta «Contents: Read and write»).",
  404: "El token no tiene acceso al repositorio del currículo.",
  409: "El currículo cambió en GitHub mientras editabas. Cierra el editor y vuelve a abrirlo.",
  422: "GitHub rechazó el cambio. Cierra el editor y vuelve a abrirlo.",
};

function encodeBase64(text) {
  let binary = "";
  new TextEncoder().encode(text).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64(text) {
  const binary = atob(text.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

async function request(token, options = {}) {
  let response;
  try {
    response = await fetch(options.method ? API_URL : `${API_URL}?ref=${BRANCH}`, {
      cache: "no-store",
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("No se pudo conectar con GitHub. Revisa tu conexión.");
  }
  if (!response.ok) {
    throw new Error(
      ERROR_MESSAGES[response.status] || `GitHub respondió con un error (${response.status}).`,
    );
  }
  return response.json();
}

/**
 * Descarga la versión actual del currículo (la de GitHub, no la de la página)
 */
export async function loadFile(token) {
  const file = await request(token);
  return { data: JSON.parse(decodeBase64(file.content)), sha: file.sha };
}

/**
 * Publica el currículo; `sha` es la versión sobre la que se editó
 */
export async function saveFile(token, data, sha) {
  const result = await request(token, {
    method: "PUT",
    body: JSON.stringify({
      message: "Actualiza el currículo desde el editor",
      content: encodeBase64(JSON.stringify(data, null, 2)),
      sha,
      branch: BRANCH,
    }),
  });
  return result.content.sha;
}
