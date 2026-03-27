export const FRONTEND_CATEGORY_LABELS: Record<string, string> = {
  "cristaleria-personalizada": "Cristalería Personalizada",
  "vajilla-personalizada": "Vajilla Personalizada",
  "servilletas-personalizadas": "Servilletas Personalizadas",
  "cuberteria-personalizada": "Cubertería Personalizada",
  "copas-de-vino-personalizadas": "Copas de Vino Personalizadas",
  "cristaleria-cerveza-personalizada": "Cristalería Cerveza Personalizada",
  "vasos-combinados-botellas-cava": "Vasos Combinados Botellas Cava",
  "tazas-y-platillos-personalizados": "Tazas y Platillos Personalizados",
  "platos-personalizados": "Platos Personalizados",
  "fuentes-ensaladeras-personalizadas": "Fuentes Ensaladeras Personalizadas",
  "platos-de-pizza-personalizados": "Platos de Pizza Personalizados",
  "manteles-caminos-personalizados": "Manteles Caminos Personalizados",
  "servilletas-bar-cocktail-personalizadas": "Servilletas Bar Cocktail Personalizadas",
  "servilletas-de-mesa-personalizadas": "Servilletas de Mesa Personalizadas",
};

export const LEGACY_CATEGORY_ID_TO_FRONTEND_SLUG: Record<string, string | "all"> = {
  "415714": "all",
  "412083": "servilletas-personalizadas",
  "412080": "cristaleria-personalizada",
  "412082": "vajilla-personalizada",
  "453874": "cuberteria-personalizada",
  "442240": "tazas-y-platillos-personalizados",
  "534870": "copas-de-vino-personalizadas",
  "415579": "servilletas-personalizadas",
};

export const HEADLESS_CACHE_TAGS = {
  categories: "headless-categories",
  products: "headless-products",
  posts: "headless-posts",
};
