/**
 * Ventana de diálogo con campos (clave de edición y configuración inicial)
 */

/**
 * Abre un diálogo y resuelve con el valor que devuelva `onSubmit`,
 * o con null si se cancela. `onSubmit` lanza un Error para mostrar un aviso.
 */
export function openDialog({ title, intro, fields, submitLabel, extra, onSubmit }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "cv-ed-modal";
    overlay.innerHTML = `
      <form class="cv-ed-dialog" autocomplete="off">
        <h2></h2>
        <div class="cv-ed-dialog-intro"></div>
        <div class="cv-ed-dialog-fields"></div>
        <p class="cv-ed-error" hidden></p>
        <div class="cv-ed-dialog-actions">
          <button type="button" class="cv-ed-link" data-role="extra" hidden></button>
          <span class="cv-ed-spacer"></span>
          <button type="button" data-role="cancel">Cancelar</button>
          <button type="submit" class="cv-ed-primary"></button>
        </div>
      </form>`;

    const form = overlay.querySelector("form");
    const error = overlay.querySelector(".cv-ed-error");
    const submit = overlay.querySelector("button[type=submit]");
    overlay.querySelector("h2").textContent = title;
    overlay.querySelector(".cv-ed-dialog-intro").innerHTML = intro || "";
    submit.textContent = submitLabel;

    const fieldsBox = overlay.querySelector(".cv-ed-dialog-fields");
    fields.forEach((field) => {
      const label = document.createElement("label");
      label.className = "cv-ed-control";
      const caption = document.createElement("span");
      caption.className = "cv-ed-label";
      caption.textContent = field.label;
      const input = document.createElement("input");
      input.type = "password";
      input.name = field.name;
      input.required = true;
      input.autocomplete = field.autocomplete || "off";
      label.append(caption, input);
      fieldsBox.append(label);
    });

    const close = (value) => {
      overlay.remove();
      resolve(value);
    };

    overlay.querySelector("[data-role=cancel]").addEventListener("click", () => close(null));

    const extraButton = overlay.querySelector("[data-role=extra]");
    if (extra) {
      extraButton.hidden = false;
      extraButton.textContent = extra.label;
      extraButton.addEventListener("click", () => {
        overlay.remove();
        resolve(extra.onClick());
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      error.hidden = true;
      submit.disabled = true;
      try {
        close(await onSubmit(values));
      } catch (failure) {
        error.textContent = failure.message;
        error.hidden = false;
        submit.disabled = false;
      }
    });

    document.body.append(overlay);
    form.querySelector("input").focus();
  });
}
