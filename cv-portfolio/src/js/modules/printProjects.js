/**
 * Diálogo "¿qué proyectos incluir?" que se abre al imprimir el CV.
 *
 * - Todos los proyectos vienen marcados; se recuerda lo que se desmarcó (localStorage).
 * - Estima las páginas que saldrán con la selección (maqueta el CV en un iframe
 *   oculto con los estilos de impresión) y avisa si se pasa del tamaño normal.
 * - No se abre en los PDF automáticos (navigator.webdriver: los genera
 *   .github/scripts/cv-pdf.mjs y el bot de empleo): salen con los proyectos que no tienen
 *   "pdf_default": false (así siguen en 2 páginas).
 * - Enlace con selección, sin diálogo: ?proyectos=todos o ?proyectos=1,3,5 (posiciones
 *   desde 1 en la lista de proyectos), pensado para que un bot mande el enlace.
 */
import { generateResumeHTML } from "./renderer.js?v=20261125a";

const KEY = "cv.proyectos.desmarcados";
// Páginas que ocupa el CV con su contenido habitual, por modo de impresión.
const LIMITE = { single: 2, personal: 2, both: 4, apa: 6 };
// Hoja Carta a 96 ppp; el APA lleva márgenes de 2,54 cm (96 px) por lado.
const HOJA = { ancho: 816, alto: 1056 };
const APA_MARGEN = 96;
// Holgura por los saltos de página (un bloque no se parte entre páginas).
const MARGEN_SALTO = 80;
// Altura útil por página en el APA (calibrada contra los PDF reales: Times 12 pt con interlineado 1,4).
const APA_ALTO_UTIL = 728;

const TEXTOS = {
  es: {
    titulo: "Proyectos a incluir en el PDF",
    todos: "Todos", ninguno: "Ninguno",
    paginas: (n) => `Páginas estimadas: ${n}`,
    aviso: (n, lim) => `Con esta selección el PDF pasará de ${lim} páginas (saldrá en ${n}). Desmarca algún proyecto para reducirlo.`,
    imprimir: "Imprimir", cancelar: "Cancelar",
  },
  en: {
    titulo: "Projects to include in the PDF",
    todos: "All", ninguno: "None",
    paginas: (n) => `Estimated pages: ${n}`,
    aviso: (n, lim) => `With this selection the PDF will go over ${lim} pages (it will be ${n}). Untick a project to shorten it.`,
    imprimir: "Print", cancelar: "Cancel",
  },
};

const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nombre = (p, lang) => (lang === "en" && p.name_en) || p.name;

function leerDesmarcados() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); }
}
function guardarDesmarcados(set) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* sin almacenamiento */ }
}

/** Selección pedida en el enlace (?proyectos=...), o null si no hay. */
function seleccionDeEnlace(proyectos) {
  const q = new URLSearchParams(location.search).get("proyectos");
  if (!q) return null;
  if (/^(todos|all)$/i.test(q.trim())) return proyectos;
  const pos = new Set(q.split(",").map((n) => parseInt(n, 10)).filter((n) => n >= 1));
  return proyectos.filter((_, i) => pos.has(i + 1));
}

/** Estilos de la impresión como reglas normales de pantalla (los @media print de las hojas cargadas). */
function reglasDeImpresion() {
  const reglas = [];
  const recorrer = (hoja) => {
    let lista;
    try { lista = hoja.cssRules; } catch { return; } // hoja de otro origen
    for (const r of lista) {
      if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) recorrer(r.styleSheet); // style.css importa a las demás
      else if (r.type === CSSRule.MEDIA_RULE && /\bprint\b/.test(r.conditionText || r.media.mediaText)) {
        for (const dentro of r.cssRules) if (dentro.type !== CSSRule.PAGE_RULE) reglas.push(dentro.cssText);
      }
    }
  };
  for (const hoja of document.styleSheets) recorrer(hoja);
  return reglas.join("\n");
}

/**
 * Páginas que ocuparía el CV con esa selección. Se maqueta una copia de la página
 * con los estilos de impresión en un iframe del ancho de una hoja Carta.
 */
export async function medirSecciones({ modo, datos, traducciones, idiomas }) {
  const apa = modo === "apa";
  const alto = apa ? APA_ALTO_UTIL : HOJA.alto;
  const htmlPorIdioma = idiomas.map((l) => generateResumeHTML(datos, traducciones[l], l));
  const doc = document.documentElement.cloneNode(true);
  doc.querySelectorAll("script, video, nav, footer, .modal").forEach((e) => e.remove());
  const cuerpo = doc.querySelector("body");
  cuerpo.classList.toggle("apa-print", apa);
  const main = doc.querySelector("#resume-container");
  main.className = "skills-print";
  main.innerHTML = htmlPorIdioma
    .map((h, i) => (i === 0 ? `<div data-seccion>${h}</div>` : `<div data-seccion class="print-page">${h}</div>`))
    .join("");
  const extra = document.createElement("style");
  extra.textContent = reglasDeImpresion() + (apa ? `\nmain{padding:0 ${APA_MARGEN}px !important;}` : "");
  doc.querySelector("head").appendChild(extra);
  const base = document.createElement("base");
  base.href = location.href;
  doc.querySelector("head").prepend(base);

  const marco = document.createElement("iframe");
  Object.assign(marco.style, { position: "fixed", left: "-99999px", top: "0", width: `${HOJA.ancho}px`, height: "1000px", border: "0", visibility: "hidden" });
  marco.srcdoc = "<!DOCTYPE html>" + doc.outerHTML;
  document.body.appendChild(marco);
  try {
    await new Promise((ok) => { marco.onload = ok; setTimeout(ok, 4000); });
    await marco.contentDocument.fonts?.ready;
    const secciones = [...marco.contentDocument.querySelectorAll("[data-seccion]")];
    return { alturas: secciones.map((s) => s.getBoundingClientRect().height), alto, holgura: apa ? 0 : MARGEN_SALTO };
  } finally {
    marco.remove();
  }
}

export async function estimarPaginas(args) {
  const { alturas, alto, holgura } = await medirSecciones(args);
  return alturas.reduce((n, h) => n + Math.max(1, Math.ceil((h + holgura) / alto)), 0);
}

/**
 * Devuelve la lista de proyectos que se imprimen (en su orden original) o null si
 * el usuario cancela. modo: "single" | "personal" | "both" | "apa".
 */
export async function chooseProjects({ modo, lang, staticData, loadResumeData }) {
  const proyectos = staticData.projects || [];
  const delEnlace = seleccionDeEnlace(proyectos);
  if (delEnlace) return delEnlace;
  if (proyectos.length === 0) return proyectos;
  // PDF automáticos: los proyectos con "pdf_default": false quedan fuera para que el CV siga en 2 páginas
  // (se pueden pedir con ?proyectos=..., que se atiende más arriba).
  if (navigator.webdriver) return proyectos.filter((p) => p.pdf_default !== false);

  const idiomas = modo === "both" || modo === "apa" ? ["es", "en"] : [lang];
  const traducciones = {};
  for (const l of idiomas) traducciones[l] = (await loadResumeData(l)).translations;
  const t = TEXTOS[lang] || TEXTOS.es;
  const desmarcados = leerDesmarcados();

  return new Promise((resolve) => {
    const fondo = document.createElement("div");
    fondo.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:99999";
    fondo.innerHTML = `<form style="background:var(--card-bg,#fff);color:var(--text-main,#111);padding:20px 24px;border-radius:12px;width:min(92vw,460px);max-height:88vh;display:flex;flex-direction:column;gap:12px;font-family:inherit">
      <strong>${t.titulo}</strong>
      <div style="display:flex;gap:8px"><button type="button" data-todos>${t.todos}</button><button type="button" data-ninguno>${t.ninguno}</button></div>
      <div data-lista style="overflow:auto;display:flex;flex-direction:column;gap:6px">${proyectos
        .map((p, i) => `<label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer"><input type="checkbox" data-i="${i}" ${desmarcados.has(p.name) ? "" : "checked"} style="margin-top:3px"><span>${esc(nombre(p, lang))}</span></label>`)
        .join("")}</div>
      <small data-info style="min-height:2.6em"></small>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-cancelar>${t.cancelar}</button><button type="submit">${t.imprimir}</button></div></form>`;
    document.body.appendChild(fondo);
    const form = fondo.firstElementChild;
    const cajas = [...form.querySelectorAll("input[type=checkbox]")];
    const info = form.querySelector("[data-info]");
    const elegidos = () => proyectos.filter((_, i) => cajas[i].checked);

    let ronda = 0;
    const actualizar = async () => {
      const miRonda = ++ronda;
      info.style.color = "";
      info.textContent = "…";
      let n;
      try {
        n = await estimarPaginas({ modo, datos: { ...staticData, projects: elegidos() }, traducciones, idiomas });
      } catch (e) {
        if (miRonda === ronda) info.textContent = "";
        return;
      }
      if (miRonda !== ronda) return;
      const limite = LIMITE[modo] || 2;
      if (n > limite) {
        info.style.color = "#b45309";
        info.textContent = "⚠ " + t.aviso(n, limite);
      } else {
        info.textContent = t.paginas(n);
      }
    };
    const cerrar = (valor) => { fondo.remove(); document.removeEventListener("keydown", tecla); resolve(valor); };
    const tecla = (e) => { if (e.key === "Escape") cerrar(null); };
    document.addEventListener("keydown", tecla);

    cajas.forEach((c) => c.addEventListener("change", actualizar));
    form.querySelector("[data-todos]").onclick = () => { cajas.forEach((c) => (c.checked = true)); actualizar(); };
    form.querySelector("[data-ninguno]").onclick = () => { cajas.forEach((c) => (c.checked = false)); actualizar(); };
    form.querySelector("[data-cancelar]").onclick = () => cerrar(null);
    fondo.addEventListener("mousedown", (e) => { if (e.target === fondo) cerrar(null); });
    form.onsubmit = (e) => {
      e.preventDefault();
      const nuevos = new Set(proyectos.filter((_, i) => !cajas[i].checked).map((p) => p.name));
      guardarDesmarcados(nuevos);
      cerrar(elegidos());
    };
    actualizar();
    form.querySelector("button[type=submit]").focus();
  });
}
