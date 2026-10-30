export const PACKAGES = [
  {
    id: "starter", name: "Starter",
    tagline: "Perfect for new boutiques launching online",
    price: 499, currency: "ETB", billingCycle: "month", color: "#4f46e5",
    features: [
      "Up to 30 catalog products", "Public client storefront link",
      "Basic reservation management", "1 staff/admin account",
      "Customer concierge chat", "Email support",
    ],
    limits: { products: 30, staff: 1 }, popular: false,
  },
  {
    id: "growth", name: "Growth",
    tagline: "For established boutiques scaling their showroom",
    price: 1499, currency: "ETB", billingCycle: "month", color: "#18392f",
    features: [
      "Up to 200 catalog products", "Public client storefront + wishlist",
      "Full reservation pipeline", "3 staff/admin accounts",
      "Real-time concierge chat inbox", "Inventory valuation analytics",
      "Branding and storefront customization", "Priority support",
    ],
    limits: { products: 200, staff: 3 }, popular: true,
  },
  {
    id: "enterprise", name: "Enterprise",
    tagline: "Full-featured ERP for luxury fashion houses",
    price: 3999, currency: "ETB", billingCycle: "month", color: "#a8874f",
    features: [
      "Unlimited catalog products", "Full ERP suite: inventory, margins, SKUs",
      "Unlimited staff accounts", "Advanced analytics and reporting",
      "Custom brand accent colors", "Dedicated account manager",
      "Priority support (2h response)", "Early access to new features",
    ],
    limits: { products: Infinity, staff: Infinity }, popular: false,
  },
];
export const BUSINESS_CATEGORIES = [
  "Fashion and Couture", "Shoes and Footwear",
  "Luxury Bags and Leather", "Jewelry and Timepieces",
  "Beauty and Fragrance", "Home and Lifestyle",
  "Artisan and Accessories", "Multi-category Boutique",
];
export const CURRENCIES = [
  { code: "ETB", symbol: "ETB", name: "Ethiopian Birr" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "EUR", name: "Euro" },
  { code: "GBP", symbol: "GBP", name: "British Pound" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
];
export const APPLICATION_STATUS = {
  pending:   { label: "Pending Review", color: "#f59e0b", bg: "#fef3c7" },
  approved:  { label: "Active",         color: "#16a34a", bg: "#dcfce7" },
  rejected:  { label: "Rejected",       color: "#dc2626", bg: "#fee2e2" },
  suspended: { label: "Suspended",      color: "#6b7280", bg: "#f3f4f6" },
};
export const CATEGORIES = ["Clothing", "Shoes", "Bags", "Accessories", "Jewelry", "Beauty", "Home"];
export const DEFAULT_BUSINESS = {
  name: "Atelier 22", slug: "atelier-22",
  tagline: "New arrivals, chosen by hand and photographed the day they land.",
  logoUrl: "", heroImageUrl: "", heroTitle: "A considered collection",
  aboutText: "Atelier 22 brings together timeless pieces, thoughtfully selected for the modern wardrobe.",
  category: "Fashion and Couture", phone: "+251 91 123 4567",
  whatsapp: "https://wa.me/251911234567", telegram: "https://t.me/atelier22",
  instagram: "https://instagram.com/atelier22", email: "contact@atelier22.com",
  address: "Bole Medhanialem, Addis Ababa",
  openingHours: "Mon - Sat: 10:00 AM - 8:00 PM", currency: "ETB",
  announcement: "Complimentary private fitting sessions available on request.",
  accentColor: "#18392f", status: "approved", package: "growth",
};
export const DEFAULT_SHOP = DEFAULT_BUSINESS;
export const SHOP = DEFAULT_SHOP;
export const money = (n, currency = "ETB") =>
  `${Number(n || 0).toLocaleString()} ${currency || ""}`.trim();
export const slugify = (text) =>
  String(text || "").toLowerCase().trim()
    .replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
export const getPackage = (id) => PACKAGES.find((p) => p.id === id) || PACKAGES[0];
