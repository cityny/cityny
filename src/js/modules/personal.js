/**
 * CV con datos personales: los datos (CI, fecha de nacimiento, dirección y foto)
 * viven cifrados en data/personal.enc.json (AES-256-GCM, clave derivada con
 * PBKDF2). Sin la clave no se pueden leer; el repositorio es público.
 * Para generar o cambiar el archivo: tools/encrypt-personal.mjs
 */
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function decryptPersonal(password) {
  const res = await fetch("data/personal.enc.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("Datos personales no disponibles");
  const f = await res.json();
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64(f.salt), iterations: f.iterations, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"],
  );
  // Si la clave es incorrecta, decrypt lanza una excepción
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(f.iv) }, key, b64(f.data));
  return JSON.parse(new TextDecoder().decode(plain));
}

/** Pide la clave en una ventana; devuelve el texto o null si se cancela. */
export function askPassword(lang) {
  const es = lang === "es";
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:99999";
    wrap.innerHTML = `<form style="background:var(--card-bg,#fff);color:var(--text-main,#111);padding:20px 24px;border-radius:12px;width:min(90vw,340px);display:flex;flex-direction:column;gap:12px;font-family:inherit">
      <strong>${es ? "CV con datos personales" : "CV with personal data"}</strong>
      <input type="password" autocomplete="off" placeholder="${es ? "Clave" : "Password"}" style="padding:8px;font-size:1rem">
      <small class="err" style="color:#dc2626;min-height:1em"></small>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button type="button" class="cancel">${es ? "Cancelar" : "Cancel"}</button>
        <button type="submit">${es ? "Imprimir" : "Print"}</button>
      </div></form>`;
    document.body.appendChild(wrap);
    const form = wrap.firstElementChild, input = form.querySelector("input");
    input.focus();
    const done = (v) => { wrap.remove(); resolve(v); };
    form.querySelector(".cancel").onclick = () => done(null);
    wrap.addEventListener("mousedown", (e) => { if (e.target === wrap) done(null); });
    form.onsubmit = (e) => { e.preventDefault(); done(input.value); };
  });
}

export function personalBlockHtml(p, lang, country = "") {
  const es = lang === "es";
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const address = [p.address, country].filter(Boolean).join(", ");
  const rows = [
    [es ? "C.I." : "ID No.", p.ci],
    [es ? "Fecha de nacimiento" : "Date of birth", p.birth],
    [es ? "Dirección de habitación" : "Home address", address],
  ].filter(([, v]) => v);
  return `${p.photo ? `<img class="personal-photo" alt="" src="${p.photo}">` : ""}
    <p class="personal-data">${rows.map(([k, v]) => `<span><strong>${k}:</strong> ${esc(v)}</span>`).join(" | ")}</p>`;
}
