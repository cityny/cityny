/**
 * Dibuja los formularios del editor a partir del esquema (schema.js)
 * y escribe cada cambio directamente en el borrador.
 */

// Elementos de lista que el usuario tiene desplegados
const openItems = new WeakSet();

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function toText(value, type) {
  if (type === "lines") return (value || []).join("\n");
  if (type === "csv") return (value || []).join(", ");
  return value ?? "";
}

function fromText(text, type) {
  if (type !== "lines" && type !== "csv") return text;
  return text
    .split(type === "lines" ? "\n" : ",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function control(obj, key, field, tag, onChange) {
  const wrap = el("label", "cv-ed-control");
  if (tag) wrap.append(el("span", "cv-ed-lang", tag));

  const multiline = field.type === "textarea" || field.type === "lines";
  const input = document.createElement(multiline ? "textarea" : "input");
  if (multiline) input.rows = 4;
  else input.type = "text";
  input.value = toText(obj[key], field.type);

  input.addEventListener("input", () => {
    const value = fromText(input.value, field.type);
    const optional = (field.optional || []).includes(key);
    if (optional && value.length === 0) delete obj[key];
    else obj[key] = value;
    onChange();
  });

  wrap.append(input);
  return wrap;
}

function renderFields(container, obj, fields, onChange) {
  fields.forEach((field) => {
    if (field.type === "list") {
      renderList(container, obj, field, onChange);
      return;
    }

    const row = el("div", "cv-ed-field");
    row.append(el("div", "cv-ed-label", field.label));

    if (field.type === "group") {
      if (!obj[field.key]) obj[field.key] = {};
      const group = el("div", "cv-ed-group");
      renderFields(group, obj[field.key], field.fields, onChange);
      row.append(group);
    } else if (field.keys) {
      const pair = el("div", "cv-ed-pair");
      pair.append(
        control(obj, field.keys[0], field, "ES", onChange),
        control(obj, field.keys[1], field, "EN", onChange),
      );
      row.append(pair);
    } else {
      row.append(control(obj, field.key, field, "", onChange));
    }

    if (field.hint) row.append(el("small", "cv-ed-hint", field.hint));
    container.append(row);
  });
}

function toolButton(symbol, title, disabled, action) {
  const button = el("button", "cv-ed-tool", symbol);
  button.type = "button";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.disabled = disabled;
  button.addEventListener("click", (event) => {
    // Dentro de <summary>: que el clic no pliegue ni despliegue el elemento
    event.preventDefault();
    event.stopPropagation();
    action();
  });
  return button;
}

function renderList(container, parent, def, onChange) {
  if (!Array.isArray(parent[def.key])) parent[def.key] = [];
  const items = parent[def.key];
  const box = el("div", "cv-ed-list");
  container.append(box);

  const changed = () => {
    draw();
    onChange();
  };

  const move = (from, to) => {
    items.splice(to, 0, items.splice(from, 1)[0]);
    changed();
  };

  function draw() {
    box.innerHTML = "";
    if (def.label) box.append(el("div", "cv-ed-label", def.label));

    items.forEach((item, index) => {
      const details = el("details", "cv-ed-item");
      details.open = openItems.has(item);
      details.addEventListener("toggle", () => {
        if (details.open) openItems.add(item);
        else openItems.delete(item);
      });

      const title = el("span", "cv-ed-item-title");
      const setTitle = () => {
        title.textContent = def.itemTitle(item) || `(${def.itemName} sin nombre)`;
      };
      setTitle();

      const tools = el("span", "cv-ed-tools");
      tools.append(
        toolButton("↑", "Subir", index === 0, () => move(index, index - 1)),
        toolButton("↓", "Bajar", index === items.length - 1, () => move(index, index + 1)),
        toolButton("✕", "Eliminar", false, () => {
          if (!window.confirm(`¿Eliminar «${title.textContent}»?`)) return;
          items.splice(index, 1);
          changed();
        }),
      );

      const summary = el("summary");
      summary.append(title, tools);

      const body = el("div", "cv-ed-item-body");
      renderFields(body, item, def.fields, () => {
        setTitle();
        onChange();
      });

      details.append(summary, body);
      box.append(details);
    });

    const add = el("button", "cv-ed-add", `+ Añadir ${def.itemName}`);
    add.type = "button";
    add.addEventListener("click", () => {
      const item = def.create();
      items.push(item);
      openItems.add(item);
      changed();
    });
    box.append(add);
  }

  draw();
}

/**
 * Construye el formulario completo dentro de `root`
 */
export function buildForm(root, data, sections, onChange) {
  root.innerHTML = "";
  sections.forEach((section) => {
    const details = el("details", "cv-ed-section");
    details.append(el("summary", "", section.title));

    const body = el("div", "cv-ed-section-body");
    if (section.type === "list") renderList(body, data, section, onChange);
    else renderFields(body, data[section.key], section.fields, onChange);

    details.append(body);
    root.append(details);
  });
}
