import { requestJSON, type ApiProduct } from "./lib/api";

export type CatalogProduct = ApiProduct & {
  short: string;
};

const seedCatalog: CatalogProduct[] = [
  {
    id: 1,
    slug: "cucumber-face-wash",
    name: "Cucumber Face Wash",
    kicker: "Vitamin C + Niacinamide",
    short: "Vitamin C + Niacinamide",
    claim: "A fresh start, bottled.",
    intro:
      "A cooling daily cleanse that lifts away excess oil and city grime while keeping skin comfortable, soft and visibly refreshed.",
    price: 285,
    mrp: 325,
    image: "/products/cucumber.jpg",
    tone: "#e9f7c9",
    accent: "#3c8b28",
    tag: "FRESH START",
    rating: "4.8",
    category: "Face Wash",
    ingredients: ["Cucumber extract", "Niacinamide", "Allantoin", "Licorice root"],
    benefits: [
      "Gently cleanses without over-drying",
      "Supports a brighter-looking complexion",
      "Leaves skin cool, calm and refreshed",
    ],
    stock: 98,
  },
  {
    id: 2,
    slug: "mango-sunscreen",
    name: "Mango Sunscreen SPF 50",
    kicker: "PA++++ Broad Spectrum",
    short: "PA++++ Broad Spectrum",
    claim: "Sun care with main-character energy.",
    intro:
      "Lightweight, non-greasy daily SPF with broad-spectrum UVA and UVB protection, designed to disappear into every morning ritual.",
    price: 399,
    mrp: 445,
    image: "/products/sunscreen.jpg",
    tone: "#fff0ad",
    accent: "#e67600",
    tag: "DAILY DEFENCE",
    rating: "4.9",
    category: "Sunscreen",
    ingredients: ["Niacinamide", "3-O-Ethyl Ascorbic Acid", "Allantoin", "Mango extract"],
    benefits: [
      "Broad spectrum SPF 50 PA++++",
      "Comfortable, no-heavy-feel finish",
      "Supports an even, radiant look",
    ],
    stock: 74,
  },
  {
    id: 3,
    slug: "orange-moisturizer",
    name: "Orange Moisturizer",
    kicker: "Niacinamide + Glycerin",
    short: "Niacinamide + Glycerin",
    claim: "Soft skin. Bright mood.",
    intro:
      "A silky, lightweight moisturizer that replenishes daily hydration and leaves skin smooth, supple and naturally luminous.",
    price: 296,
    mrp: 318,
    image: "/products/moisturizer.jpg",
    tone: "#ffe6d0",
    accent: "#eb6200",
    tag: "DEEP HYDRATION",
    rating: "4.7",
    category: "Moisturizer",
    ingredients: ["Orange extract", "Glycerin", "Niacinamide", "Allantoin"],
    benefits: [
      "Long-lasting daily hydration",
      "Lightweight, fast-absorbing comfort",
      "Supports a healthy skin barrier",
    ],
    stock: 86,
  },
  {
    id: 4,
    slug: "strawberry-serum",
    name: "Strawberry Face Serum",
    kicker: "Salicylic Acid + Niacinamide",
    short: "Salicylic Acid + Niacinamide",
    claim: "A few drops. A clearer rhythm.",
    intro:
      "A multi-active serum for texture, pores and uneven-looking skin with a fresh sensorial finish that slips effortlessly into your routine.",
    price: 550,
    mrp: 599,
    image: "/products/serum.jpg",
    tone: "#ffe3eb",
    accent: "#ed1f52",
    tag: "RADIANCE",
    rating: "4.9",
    category: "Serum",
    ingredients: ["Salicylic acid", "Niacinamide", "Alpha arbutin", "Licorice extract"],
    benefits: [
      "Helps reduce excess oil",
      "Gently unclogs the look of pores",
      "Supports smoother, brighter-looking skin",
    ],
    stock: 63,
  },
  {
    id: 5,
    slug: "watermelon-face-wash",
    name: "Watermelon Face Wash",
    kicker: "AHA · BHA · PHA",
    short: "AHA · BHA · PHA",
    claim: "Clean pores. Juicy glow.",
    intro:
      "A daily exfoliating face wash made to balance excess oil, refresh clogged-feeling skin and reveal a smoother-looking finish.",
    price: 285,
    mrp: 325,
    image: "/products/watermelon.jpg",
    tone: "#ffdfe1",
    accent: "#e81432",
    tag: "OIL CONTROL",
    rating: "4.8",
    category: "Face Wash",
    ingredients: ["Watermelon extract", "Salicylic acid", "Niacinamide", "Allantoin"],
    benefits: [
      "Controls excess oil",
      "Gently exfoliates dead surface cells",
      "Soothes redness and discomfort",
    ],
    stock: 52,
  },
];

export async function loadCatalog(): Promise<CatalogProduct[]> {
  try {
    const products = await requestJSON<ApiProduct[]>("/api/products");
    return products.map((product) => ({
      ...product,
      short: product.kicker,
    }));
  } catch {
    return seedCatalog;
  }
}

export async function loadCatalogProduct(slug: string): Promise<CatalogProduct | undefined> {
  try {
    const product = await requestJSON<ApiProduct>(`/api/products/${slug}`);
    return { ...product, short: product.kicker };
  } catch {
    return seedCatalog.find((item) => item.slug === slug);
  }
}

export function fallbackCatalog(): CatalogProduct[] {
  return seedCatalog;
}

export function getProduct(slug: string): CatalogProduct | undefined {
  return seedCatalog.find((product) => product.slug === slug);
}
