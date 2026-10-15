/**
 * Contador de visitas (Abacus, https://abacus.jasoncameron.dev)
 */

const COUNTER_API = "https://abacus.jasoncameron.dev";
const COUNTER_KEY = "cityny-cv/visitas";
const PRODUCTION_HOST = "cityny.github.io";
// Total acumulado en el contador anterior (hits.sh) antes del cambio
const PREVIOUS_VISITS = 306;
const SESSION_FLAG = "cv-visit-counted";

function alreadyCounted() {
  try {
    return sessionStorage.getItem(SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

function markCounted() {
  try {
    sessionStorage.setItem(SESSION_FLAG, "1");
  } catch {
    // Sin almacenamiento de sesión: se contará en cada carga
  }
}

/**
 * Suma una visita por sesión del navegador y muestra el total.
 * Si el servicio no responde, el contador se queda oculto.
 */
export async function initVisitCounter() {
  const badge = document.getElementById("visit-counter");
  const value = document.getElementById("visit-counter-value");
  if (!badge || !value) return;

  const shouldCount =
    window.location.hostname === PRODUCTION_HOST && !alreadyCounted();
  const action = shouldCount ? "hit" : "get";

  try {
    const response = await fetch(`${COUNTER_API}/${action}/${COUNTER_KEY}`);
    if (!response.ok) return;
    const data = await response.json();
    if (shouldCount) markCounted();
    value.textContent = PREVIOUS_VISITS + data.value;
    badge.hidden = false;
  } catch {
    // Servicio caído o bloqueado: no se muestra nada
  }
}
