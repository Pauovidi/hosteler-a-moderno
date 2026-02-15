export type LegacyMenuRule = {
  title: string;
  include?: string[];
  exclude?: string[];
  mode?: "all"; // para “Productos”
};

export const legacyMenuMap: Record<string, LegacyMenuRule> = {
  "415714": { title: "Productos", mode: "all" },

  "412083": {
    title: "Servilletas",
    include: ["servilleta", "airlaid", "tissue", "papel", "miniservice", "cocktail", "20x20", "33x33", "40x40"],
    exclude: ["copa", "vaso", "cristal", "plato", "taza", "cubierto", "tenedor", "cuchillo", "cuchara", "mantel"],
  },

  "412080": {
    title: "Cristalería",
    include: ["copa", "vaso", "cristal", "jarra", "botella", "champ", "vino", "gin", "whisky", "sidra", "brandy", "cognac"],
    exclude: ["servilleta", "papel", "plato", "taza", "mantel", "cubierto"],
  },

  "412082": {
    title: "Vajilla",
    include: ["plato", "vajilla", "taza", "porcelana", "bol", "cuenco", "bandeja", "fuente"],
    exclude: ["copa", "vaso", "servilleta", "mantel", "cubierto"],
  },

  "453874": {
    title: "Cubertería",
    include: ["cubierto", "tenedor", "cuchillo", "cuchara", "cuberteria"],
    exclude: ["copa", "vaso", "servilleta", "mantel", "plato", "taza"],
  },

  "412081": {
    title: "Textil Hoteles",
    include: ["mantel", "manteleria", "textil", "hotel", "servilleta", "camino", "salvamantel"],
    exclude: ["copa", "vaso", "plato", "taza", "cubierto"],
  },
};
