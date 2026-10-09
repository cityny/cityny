/**
 * Editor del currículo: botón oculto, clave de edición, panel y publicación
 */

import { hasStoredToken, storeToken, unlockToken, forgetToken } from "./crypto.js";
import { loadFile, saveFile } from "./github.js";
import { SECTIONS } from "./schema.js";
import { buildForm } from "./form.js";
import { openDialog } from "./dialog.js";

const MIN_PASSWORD_LENGTH = 8;
const TOKEN_HELP = `
  <p>Este navegador todavía no está configurado para editar. Solo se hace una vez:</p>
  <ol>
    <li>Crea un token en
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Fine-grained tokens</a>.</li>
    <li>En <em>Repository access</em> elige <em>Only select repositories</em> → <strong>cityny/cityny</strong>.</li>
    <li>En <em>Permissions → Repository permissions</em> pon <strong>Contents: Read and write</strong>.</li>
    <li>Pega aquí el token y elige tu clave de edición.</li>
  </ol>
  <p>El token queda cifrado con tu clave y solo en este navegador.</p>`;

let page = null;
let token = null;
let draft = null;
let sha = null;
let dirty = false;
let panel = null;
let previewTimer = null;

function ensureStyles() {
  if (document.getElementById("cv-editor-styles")) return;
  const link = document.createElement("link");
  link.id = "cv-editor-styles";
  link.rel = "stylesheet";
  link.href = "src/css/components/editor.css";
  document.head.append(link);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "cv-ed-toast";
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 8000);
}

function setupDevice() {
  return openDialog({
    title: "Configurar la edición",
    intro: TOKEN_HELP,
    submitLabel: "Guardar y entrar",
    fields: [
      { name: "token", label: "Token de GitHub" },
      { name: "password", label: "Clave de edición", autocomplete: "new-password" },
      { name: "repeat", label: "Repite la clave", autocomplete: "new-password" },
    ],
    onSubmit: async ({ token: newToken, password, repeat }) => {
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`La clave debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      }
      if (password !== repeat) throw new Error("Las dos claves no coinciden.");
      await loadFile(newToken.trim());
      await storeToken(newToken.trim(), password);
      return newToken.trim();
    },
  });
}

function askPassword() {
  return openDialog({
    title: "Clave de edición",
    submitLabel: "Entrar",
    fields: [{ name: "password", label: "Clave", autocomplete: "current-password" }],
    extra: {
      label: "Olvidé la clave o cambié el token",
      onClick: () => {
        forgetToken();
        return setupDevice();
      },
    },
    onSubmit: async ({ password }) => {
      try {
        return await unlockToken(password);
      } catch {
        throw new Error("Clave incorrecta.");
      }
    },
  });
}

function warnUnsaved(event) {
  if (dirty) event.preventDefault();
}

function closePanel() {
  clearTimeout(previewTimer);
  window.removeEventListener("beforeunload", warnUnsaved);
  document.body.classList.remove("cv-editing", "cv-editing-preview");
  panel.remove();
  panel = null;
  token = null;
  draft = null;
  sha = null;
  dirty = false;
  document.getElementById("edit-btn").hidden = true;
}

function openPanel() {
  panel = document.createElement("aside");
  panel.className = "cv-editor";
  panel.innerHTML = `
    <header class="cv-ed-header">
      <strong>Editar currículo</strong>
      <span class="cv-ed-status">Sin cambios</span>
    </header>
    <div class="cv-ed-form"></div>
    <footer class="cv-ed-footer">
      <button type="button" data-role="close">Cerrar</button>
      <button type="button" data-role="toggle" class="cv-ed-mobile-only">Vista previa</button>
      <button type="button" data-role="publish" class="cv-ed-primary" disabled>Publicar</button>
    </footer>
    <button type="button" data-role="back" class="cv-ed-back">Volver a editar</button>`;

  const status = panel.querySelector(".cv-ed-status");
  const publish = panel.querySelector("[data-role=publish]");

  buildForm(panel.querySelector(".cv-ed-form"), draft, SECTIONS, () => {
    dirty = true;
    publish.disabled = false;
    status.textContent = "Cambios sin publicar";
    status.classList.remove("cv-ed-status-error");
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => page.preview(draft), 250);
  });

  const togglePreview = () => document.body.classList.toggle("cv-editing-preview");
  panel.querySelector("[data-role=toggle]").addEventListener("click", togglePreview);
  panel.querySelector("[data-role=back]").addEventListener("click", togglePreview);

  panel.querySelector("[data-role=close]").addEventListener("click", () => {
    if (dirty && !window.confirm("Hay cambios sin publicar. ¿Cerrar y descartarlos?")) return;
    page.discard();
    closePanel();
  });

  publish.addEventListener("click", async () => {
    publish.disabled = true;
    status.textContent = "Publicando…";
    try {
      await saveFile(token, draft, sha);
      page.commit(draft);
      closePanel();
      showToast("Publicado. La página pública se actualiza en 1 o 2 minutos.");
    } catch (failure) {
      status.textContent = failure.message;
      status.classList.add("cv-ed-status-error");
      publish.disabled = false;
    }
  });

  window.addEventListener("beforeunload", warnUnsaved);
  document.body.classList.add("cv-editing");
  document.body.append(panel);
  page.preview(draft);
}

async function startEditing() {
  if (panel) return;
  token = await (hasStoredToken() ? askPassword() : setupDevice());
  if (!token) return;

  try {
    const file = await loadFile(token);
    draft = file.data;
    sha = file.sha;
  } catch (failure) {
    token = null;
    window.alert(failure.message);
    return;
  }
  openPanel();
}

/**
 * Muestra el botón de editar. `pageApi` conecta el editor con la página:
 * preview(datos), commit(datos) y discard().
 */
export function revealEditButton(pageApi) {
  page = pageApi;
  ensureStyles();
  const button = document.getElementById("edit-btn");
  button.hidden = false;
  if (button.dataset.ready) return;
  button.dataset.ready = "1";
  button.addEventListener("click", startEditing);
}
