// Genera los PDF del CV tal como salen con los botones de imprimir de la web.
// Uso: node cv-pdf.mjs <url de la web servida> <carpeta de salida>
// La web imprime con window.print(): aquí se sustituye por un error para que la
// página se quede con el CV preparado para imprimir y Chromium lo guarda en PDF.
// La web pide la fuente Inter sin cargarla, así que cada navegador usa la suya;
// en Windows sale Arial. Se fija Arial (Liberation Sans en Linux, mismas medidas)
// para que el PDF tenga las mismas páginas que al imprimir desde Windows. El APA
// conserva su Times New Roman.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [url, salida] = process.argv.slice(2);
const PDFS = { "cv-es.pdf": "print-es", "cv-en.pdf": "print-en", "cv-es-en.pdf": "print-both", "cv-apa.pdf": "print-apa" };

mkdirSync(salida, { recursive: true });
const navegador = await chromium.launch();
for (const [archivo, boton] of Object.entries(PDFS)) {
  const pagina = await navegador.newPage();
  await pagina.addInitScript(() => {
    window.print = () => { window.__listo = true; throw new Error("pdf"); };
  });
  await pagina.goto(url, { waitUntil: "networkidle" });
  await pagina.waitForSelector("#resume-container *");
  await pagina.evaluate((id) => document.getElementById(id).click(), boton);
  await pagina.waitForFunction(() => window.__listo === true);
  await pagina.emulateMedia({ media: "print" });
  await pagina.addStyleTag({ content: "body:not(.apa-print), body:not(.apa-print) * { font-family: Arial, 'Liberation Sans', sans-serif !important; }" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({ path: `${salida}/${archivo}`, format: "Letter", printBackground: true, preferCSSPageSize: true });
  console.log(`${archivo}: listo`);
  await pagina.close();
}
await navegador.close();
