export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type RequestOptions = RequestInit & { silent?: boolean };

type StoredSession = {
  token: string;
  email: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number | null;
  user: ApiUser;
};

function readSession(): StoredSession | null {
  const raw = window.localStorage.getItem("inon.session");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export async function requestJSON<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = readSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
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

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  return requestJSON<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function readStoredEmail(): string {
  return readSession()?.email ?? "ananya@inon.local";
}

export function storeSession(session: { token: string; email: string }): void {
  window.localStorage.setItem("inon.session", JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem("inon.session");
}

export async function login(email: string, password: string): Promise<AuthSession> {
  return postJSON("/api/auth/login", { email, password });
}

export async function signup(payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<AuthSession> {
  return postJSON("/api/auth/signup", payload);
}

export async function loadAccountDashboard(): Promise<AccountOverview> {
  return requestJSON("/api/account/dashboard");
}

export async function updateAccountProfile(payload: Partial<ApiUser>): Promise<ApiUser> {
  return requestJSON("/api/account/profile", { method: "PATCH", body: JSON.stringify(payload) });
}
export type ApiAddress = { id: number; user_id: number; label: string; full_name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; postal_code: string; country: string; is_default: boolean; created_at: string; updated_at: string };
export async function loadAddresses(): Promise<ApiAddress[]> { return requestJSON("/api/account/addresses"); }
export async function createAddress(payload: Omit<ApiAddress, "id" | "user_id" | "created_at" | "updated_at">): Promise<ApiAddress> { return postJSON("/api/account/addresses", payload); }
export async function updateAddress(id: number, payload: Omit<ApiAddress, "id" | "user_id" | "created_at" | "updated_at">): Promise<ApiAddress> { return requestJSON(`/api/account/addresses/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); }
export async function deleteAddress(id: number): Promise<void> { return requestJSON(`/api/account/addresses/${id}`, { method: "DELETE" }); }

export function hasStoredSession(): boolean {
  return Boolean(readSession()?.token);
}

export type ApiProduct = {
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

export type ApiOrderItem = {
  product_slug: string;
  product_name: string;
  price: number;
  quantity: number;
};

export type ApiOrder = {
  number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  item_count: number;
  shipping_eta: string;
  items: ApiOrderItem[];
};

export async function createOrder(payload: {
  items: Array<{ product_slug: string; quantity: number }>;
  shipping: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
  };
  payment_method: "cod";
}): Promise<ApiOrder> {
  return postJSON("/api/orders", payload);
}

export async function loadCustomerOrder(number: string): Promise<ApiOrder> {
  return requestJSON(`/api/orders/${encodeURIComponent(number.trim())}`);
}

export async function recordAnalyticsEvent(event_name: string, path = window.location.pathname, metadata: Record<string, unknown> = {}): Promise<void> {
  await postJSON("/api/analytics/events", { event_name, path, metadata });
}

export type ApiUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string | null;
  city?: string | null;
  glow_points: number;
  avatar_url?: string | null;
  skin_type?: string | null;
  skin_concerns?: string | null;
  profile_completion_percent: number;
};

export type AccountOverview = {
  profile: ApiUser;
  active_order: ApiOrder | null;
  recent_orders: ApiOrder[];
  saved_products: ApiProduct[];
  am_routine: ApiProduct[];
};

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
