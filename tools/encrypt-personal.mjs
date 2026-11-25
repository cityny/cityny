// Genera data/personal.enc.json (cifrado AES-256-GCM, PBKDF2-SHA256).
// Uso:  PERSONAL_PASSWORD='clave' node tools/encrypt-personal.mjs datos.json [foto.jpg]
// datos.json: {"ci":"...","birth":"...","address":"..."}  (no subir a git)
import { webcrypto as c } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
const [, , dataFile, photoFile] = process.argv;
const password = process.env.PERSONAL_PASSWORD;
if (!dataFile || !password) { console.error("Faltan datos.json o PERSONAL_PASSWORD"); process.exit(1); }
const payload = JSON.parse(readFileSync(dataFile, "utf8"));
if (photoFile) payload.photo = `data:image/jpeg;base64,${readFileSync(photoFile).toString("base64")}`;
const iterations = 600000;
const salt = c.getRandomValues(new Uint8Array(16)), iv = c.getRandomValues(new Uint8Array(12));
const base = await c.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await c.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const data = new Uint8Array(await c.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(payload))));
const b64 = (u) => Buffer.from(u).toString("base64");
writeFileSync(new URL("../data/personal.enc.json", import.meta.url), JSON.stringify({ v: 1, iterations, salt: b64(salt), iv: b64(iv), data: b64(data) }));
console.log("data/personal.enc.json generado");
