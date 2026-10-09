/**
 * Qué se puede editar del currículo y con qué tipo de campo.
 *
 * Tipos: text, textarea, lines (una línea por elemento), csv (separado por comas),
 * group (objeto anidado) y list (lista de elementos).
 * `keys: [es, en]` dibuja el campo en los dos idiomas.
 */

const phoneFields = [
  { key: "number", label: "Número", type: "text" },
  { key: "label", label: "Etiqueta", type: "text" },
];

const profileFields = [
  { key: "network", label: "Red", type: "text", hint: "GitHub, LinkedIn…" },
  { key: "username", label: "Usuario", type: "text" },
  { key: "url", label: "Enlace", type: "text" },
];

const keywordFields = [
  { keys: ["name", "name_en"], label: "Nombre", type: "text", optional: ["name_en"] },
  { keys: ["badge", "badge_en"], label: "Texto de la etiqueta", type: "text", optional: ["badge_en"] },
  {
    key: "logo",
    label: "Icono (opcional)",
    type: "text",
    optional: ["logo"],
    hint: "Enlace a una imagen. Vacío: se usa el icono de assets/icons si existe.",
  },
];

export const SECTIONS = [
  {
    key: "basics",
    title: "Datos y perfil",
    fields: [
      { key: "name", label: "Nombre completo", type: "text" },
      { keys: ["title_es", "title_en"], label: "Título bajo el nombre", type: "text" },
      { keys: ["summary_es", "summary_en"], label: "Perfil profesional", type: "textarea" },
      { key: "email", label: "Correo", type: "text" },
      {
        key: "location",
        label: "Ubicación",
        type: "group",
        fields: [
          { key: "city", label: "Ciudad", type: "text" },
          { key: "region", label: "Estado o región", type: "text" },
          { key: "countryCode", label: "País (código)", type: "text" },
        ],
      },
      {
        key: "phones",
        label: "Teléfonos",
        type: "list",
        itemName: "teléfono",
        itemTitle: (item) => item.number,
        create: () => ({ number: "", label: "" }),
        fields: phoneFields,
      },
      {
        key: "profiles",
        label: "Perfiles",
        type: "list",
        itemName: "perfil",
        itemTitle: (item) => item.network,
        create: () => ({ network: "", username: "", url: "" }),
        fields: profileFields,
      },
    ],
  },
  {
    key: "skills",
    title: "Habilidades",
    type: "list",
    itemName: "categoría",
    itemTitle: (item) => item.category_es,
    create: () => ({ category_es: "", category_en: "", keywords: [] }),
    fields: [
      { keys: ["category_es", "category_en"], label: "Categoría", type: "text" },
      {
        key: "keywords",
        label: "Habilidades de la categoría",
        type: "list",
        itemName: "habilidad",
        itemTitle: (item) => item.name,
        create: () => ({ name: "", badge: "" }),
        fields: keywordFields,
      },
    ],
  },
  {
    key: "experience",
    title: "Experiencia laboral",
    type: "list",
    itemName: "empleo",
    itemTitle: (item) => [item.position_es, item.company].filter(Boolean).join(" · "),
    create: () => ({
      company: "",
      position_es: "",
      position_en: "",
      period_es: "",
      period_en: "",
      summary_es: [],
      summary_en: [],
    }),
    fields: [
      { keys: ["position_es", "position_en"], label: "Cargo", type: "text" },
      { key: "company", label: "Empresa", type: "text" },
      { keys: ["period_es", "period_en"], label: "Periodo", type: "text" },
      { keys: ["summary_es", "summary_en"], label: "Logros (uno por línea)", type: "lines" },
      {
        key: "preview",
        label: "Imagen de vista previa (opcional)",
        type: "text",
        optional: ["preview"],
        hint: "Ruta de una imagen ya subida, por ejemplo docs/san_simon.jpg",
      },
    ],
  },
  {
    key: "education",
    title: "Educación",
    type: "list",
    itemName: "estudio",
    itemTitle: (item) => item.institution,
    create: () => ({ institution: "", degree_es: "", degree_en: "" }),
    fields: [
      { key: "institution", label: "Institución", type: "text" },
      { keys: ["degree_es", "degree_en"], label: "Título o curso", type: "text" },
    ],
  },
  {
    key: "projects",
    title: "Proyectos destacados",
    type: "list",
    itemName: "proyecto",
    itemTitle: (item) => item.name,
    create: () => ({
      name: "",
      description_es: "",
      description_en: "",
      technologies_es: [],
      technologies_en: [],
    }),
    fields: [
      { keys: ["name", "name_en"], label: "Nombre", type: "text", optional: ["name_en"] },
      { keys: ["description_es", "description_en"], label: "Descripción", type: "textarea" },
      {
        key: "url",
        label: "Enlace (opcional)",
        type: "text",
        optional: ["url"],
        hint: "Dirección web o ruta de un archivo ya subido. También genera el QR al imprimir.",
      },
      {
        key: "video",
        label: "Video (opcional)",
        type: "text",
        optional: ["video"],
        hint: "Ruta de un video ya subido, por ejemplo assets/video.mp4",
      },
      {
        key: "preview",
        label: "Imagen de vista previa (opcional)",
        type: "text",
        optional: ["preview"],
      },
      {
        keys: ["technologies_es", "technologies_en"],
        label: "Tecnologías y habilidades (separadas por comas)",
        type: "csv",
      },
    ],
  },
];
