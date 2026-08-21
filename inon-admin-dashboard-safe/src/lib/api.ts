export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type StoredSession = {
  token: string;
  email: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number | null;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string | null;
    city?: string | null;
    glow_points: number;
  };
};

function readSession(): StoredSession | null {
  const raw = window.localStorage.getItem("inon.adminSession");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function storeSession(session: { token: string; email: string }): void {
  window.localStorage.setItem("inon.adminSession", JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem("inon.adminSession");
}

async function requestJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(init.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    try {
      const parsed = JSON.parse(message) as { detail?: string };
      throw new Error(parsed.detail || `Request failed (${response.status})`);
    } catch (error) {
      if (error instanceof Error && error.message !== message) {
        throw error;
      }
      throw new Error(message || `Request failed (${response.status})`);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<AuthSession>;
}

export type AdminOverview = {
  live_visitors: number;
  net_sales: number;
  orders: number;
  average_order: number;
  conversion: number;
  chart: number[];
  top_products: Array<{
    slug: string;
    name: string;
    sold: number;
    revenue: number;
    image: string;
  }>;
  metrics: Array<{
    label: string;
    value: number | string;
    delta: string;
  }>;
};

export type AdminOrder = {
  number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  item_count: number;
  shipping_eta: string;
  items: Array<{
    product_slug: string;
    product_name: string;
    price: number;
    quantity: number;
  }>;
};

export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  kicker: string;
  claim: string;
  intro: string;
  price: number;
  mrp: number;
  image: string;
  tone: string;
  accent: string;
  tag: string;
  rating: string;
  category: string;
  ingredients: string[];
  benefits: string[];
  stock: number;
};

export async function loadAdminOverview(): Promise<AdminOverview> {
  return requestJSON("/api/admin/overview");
}

export async function loadAdminOrders(): Promise<AdminOrder[]> {
  return requestJSON("/api/admin/orders");
}

export async function loadAdminProducts(): Promise<AdminProduct[]> {
  return requestJSON("/api/admin/products");
}

export async function createAdminProduct(payload: Omit<AdminProduct, "id">): Promise<AdminProduct> {
  return requestJSON("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProduct(slug: string, payload: Partial<Omit<AdminProduct, "id" | "slug">> & { slug?: string }): Promise<AdminProduct> {
  return requestJSON(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminProduct(slug: string): Promise<void> {
  await requestJSON(`/api/admin/products/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}

export async function updateAdminOrderStatus(number: string, status: string): Promise<AdminOrder> {
  return requestJSON(`/api/admin/orders/${encodeURIComponent(number)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export type AdminCustomer = AuthSession["user"];
export type AdminDiscount = { id: number; code: string; kind: "percentage" | "fixed"; amount: number; minimum_order: number; max_uses?: number | null; uses_count: number; active: boolean; expires_at?: string | null };
export type AdminContent = { id: number; content_key: string; title: string; body: string; image?: string | null; status: "draft" | "published"; updated_at: string };

export async function loadAdminCustomers(): Promise<AdminCustomer[]> { return requestJSON("/api/admin/customers"); }
export async function updateAdminCustomer(id: number, payload: Partial<AdminCustomer>): Promise<AdminCustomer> { return requestJSON(`/api/admin/customers/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); }
export async function deleteAdminCustomer(id: number): Promise<void> { await requestJSON(`/api/admin/customers/${id}`, { method: "DELETE" }); }
export async function loadAdminDiscounts(): Promise<AdminDiscount[]> { return requestJSON("/api/admin/discounts"); }
export async function createAdminDiscount(payload: Omit<AdminDiscount, "id" | "uses_count">): Promise<AdminDiscount> { return requestJSON("/api/admin/discounts", { method: "POST", body: JSON.stringify(payload) }); }
export async function loadAdminContent(): Promise<AdminContent[]> { return requestJSON("/api/admin/content"); }
export async function createAdminContent(payload: Omit<AdminContent, "id" | "updated_at">): Promise<AdminContent> { return requestJSON("/api/admin/content", { method: "POST", body: JSON.stringify(payload) }); }
export async function loadAdminAnalytics(): Promise<{ total_events: number; events_by_name: Record<string, number>; recent: Array<Record<string, unknown>> }> { return requestJSON("/api/admin/analytics"); }
