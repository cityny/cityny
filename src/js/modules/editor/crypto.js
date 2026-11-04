/**
 * Guarda el token de GitHub cifrado con la clave de edición.
 * Solo vive en este navegador (localStorage); la clave nunca se guarda.
 */

const STORAGE_KEY = "cv-editor-key";
const ITERATIONS = 310000;

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function hasStoredToken() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function forgetToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function storeToken(token, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(token),
  );
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ salt: toBase64(salt), iv: toBase64(iv), data: toBase64(data) }),
  );
}

/**
 * Devuelve el token si la clave es correcta; lanza un error si no lo es.
 */
export async function unlockToken(password) {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const key = await deriveKey(password, fromBase64(stored.salt));
  const data = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(stored.iv) },
    key,
    fromBase64(stored.data),
  );
  return new TextDecoder().decode(data);
}
