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
  "manteles-caminos-personalizados": "Take Away",
  "servilletas-bar-cocktail-personalizadas": "Servilletas Bar Cocktail Personalizadas",
  "servilletas-de-mesa-personalizadas": "Servilletas de Mesa Personalizadas",
};

export type CatalogMenuItem = {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
};

export const TOP_LEVEL_CATEGORY_ORDER = [
  "cristaleria-personalizada",
  "vajilla-personalizada",
  "manteles-caminos-personalizados",
  "servilletas-personalizadas",
  "cuberteria-personalizada",
] as const;

export const CATEGORY_CHILD_ORDER: Record<string, string[]> = {
  "vajilla-personalizada": [
    "platos-personalizados",
    "fuentes-ensaladeras-personalizadas",
    "platos-de-pizza-personalizados",
    "tazas-y-platillos-personalizados",
  ],
};

export const CATALOG_MENU_FALLBACK: CatalogMenuItem[] = [
  {
    label: "Cristalería Personalizada",
    href: "/cristaleria-personalizada/",
    children: [
      { label: "Copas de Vino Personalizadas", href: "/copas-de-vino-personalizadas/" },
      { label: "Cristalería Cerveza Personalizada", href: "/cristaleria-cerveza-personalizada/" },
      { label: "Vasos Combinados Botellas Cava", href: "/vasos-combinados-botellas-cava/" },
    ],
  },
  {
    label: "Vajilla Personalizada",
    href: "/vajilla-personalizada/",
    children: [
      { label: "Platos Personalizados", href: "/platos-personalizados/" },
      { label: "Fuentes Ensaladeras Personalizadas", href: "/fuentes-ensaladeras-personalizadas/" },
      { label: "Platos de Pizza Personalizados", href: "/platos-de-pizza-personalizados/" },
      { label: "Tazas y Platillos Personalizados", href: "/tazas-y-platillos-personalizados/" },
    ],
  },
  {
    label: "Take Away",
    href: "/manteles-caminos-personalizados/",
  },
  {
    label: "Servilletas Personalizadas",
    href: "/servilletas-personalizadas/",
    children: [
      { label: "Servilletas Bar Cocktail Personalizadas", href: "/servilletas-bar-cocktail-personalizadas/" },
      { label: "Servilletas de Mesa Personalizadas", href: "/servilletas-de-mesa-personalizadas/" },
    ],
  },
  {
    label: "Cubertería Personalizada",
    href: "/cuberteria-personalizada/",
  },
];

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
