"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearSession,
  createAdminProduct,
  deleteAdminProduct,
  loadAdminOrders,
  loadAdminCustomers,
  loadAdminDiscounts,
  loadAdminContent,
  loadAdminAnalytics,
  loadAdminOverview,
  loadAdminProducts,
  login,
  storeSession,
  updateAdminOrderStatus,
  updateAdminProduct,
  type AdminOrder,
  type AdminOverview,
  type AdminProduct,
  type AdminCustomer,
  type AdminDiscount,
  type AdminContent,
} from "./lib/api";

const menu = ["Overview", "Orders", "Products", "Customers", "Content", "Discounts", "Analytics", "Settings"];
const icons = ["◫", "◉", "◇", "♙", "▤", "%", "⌁", "⚙"];
const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? "http://localhost:5173";

const fallbackOverview: AdminOverview = {
  live_visitors: 28,
  net_sales: 428000,
  orders: 126,
  average_order: 668,
  conversion: 4.82,
  chart: [25, 45, 38, 58, 47, 70, 61, 82, 73, 90, 77, 100],
  top_products: [],
  metrics: [
    { label: "Net sales", value: "₹4.28L", delta: "↑ 18.4% vs last week" },
    { label: "Orders", value: 126, delta: "↑ 12.1% vs last week" },
    { label: "Avg. order", value: "₹668", delta: "↑ 4.8% vs last week" },
    { label: "Conversion", value: "4.82%", delta: "↑ 0.6% vs last week" },
  ],
};

const emptyProduct = {
  slug: "",
  name: "",
  kicker: "",
  claim: "",
  intro: "",
  price: 0,
  mrp: 0,
  image: "/products/cucumber.jpg",
  tone: "#ffffff",
  accent: "#000000",
  tag: "",
  rating: "5.0",
  category: "",
  ingredients: [] as string[],
  benefits: [] as string[],
  stock: 0,
};

function formatCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function Admin() {
  const [active, setActive] = useState("Overview");
  const [overview, setOverview] = useState<AdminOverview>(fallbackOverview);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [discounts, setDiscounts] = useState<AdminDiscount[]>([]);
  const [content, setContent] = useState<AdminContent[]>([]);
  const [analytics, setAnalytics] = useState<{ total_events: number; events_by_name: Record<string, number> } | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [productDraft, setProductDraft] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [orderStatusDrafts, setOrderStatusDrafts] = useState<Record<string, string>>({});

  const topProducts = useMemo(() => {
    if (overview.top_products.length) {
      return overview.top_products;
    }

    return products.slice(0, 3).map((product, index) => ({
      slug: product.slug,
      name: product.name,
      sold: 300 - index * 42,
      revenue: product.price * (300 - index * 42),
      image: product.image,
    }));
  }, [overview.top_products, products]);

  const refresh = async () => {
    const [overviewData, orderData, productData] = await Promise.all([
      loadAdminOverview(),
      loadAdminOrders(),
      loadAdminProducts(),
    ]);
    setOverview(overviewData);
    setOrders(orderData);
    setProducts(productData);
    setOrderStatusDrafts(
      Object.fromEntries(orderData.map((order) => [order.number, order.status])),
    );
    setAuthenticated(true);
  };

  const refreshOperations = async () => {
    setWorkspaceError("");
    try {
      if (active === "Customers") setCustomers(await loadAdminCustomers());
      if (active === "Discounts") setDiscounts(await loadAdminDiscounts());
      if (active === "Content") setContent(await loadAdminContent());
      if (active === "Analytics") setAnalytics(await loadAdminAnalytics());
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to load this workspace");
    }
  };

  useEffect(() => {
    let alive = true;
    refresh()
      .catch(() => {
        if (alive) {
          clearSession();
          setAuthenticated(false);
          setLoginError("Sign in with the admin account to manage the store.");
        }
      })
      .finally(() => {
        if (alive) {
          setBootstrapping(false);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (authenticated && ["Customers", "Discounts", "Content", "Analytics"].includes(active)) refreshOperations();
  }, [active, authenticated]);

  const handleLogin = async () => {
    setLoginBusy(true);
    setLoginError("");
    try {
      const session = await login(loginEmail, loginPassword);
      storeSession({ token: session.access_token, email: session.user.email });
      await refresh();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Admin login failed");
      clearSession();
      setAuthenticated(false);
    } finally {
      setLoginBusy(false);
    }
  };

  const startEdit = (product: AdminProduct) => {
    setEditingSlug(product.slug);
    setProductDraft({
      slug: product.slug,
      name: product.name,
      kicker: product.kicker,
      claim: product.claim,
      intro: product.intro,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      tone: product.tone,
      accent: product.accent,
      tag: product.tag,
      rating: product.rating,
      category: product.category,
      ingredients: product.ingredients,
      benefits: product.benefits,
      stock: product.stock,
    });
    setActive("Products");
  };

  const resetDraft = () => {
    setEditingSlug("");
    setProductDraft(emptyProduct);
  };

  const saveProduct = async () => {
    setSaving(true);
    setWorkspaceError("");
    try {
      const payload = {
        ...productDraft,
        ingredients: productDraft.ingredients,
        benefits: productDraft.benefits,
      };
      if (editingSlug) {
        await updateAdminProduct(editingSlug, payload);
      } else {
        await createAdminProduct(payload);
      }
      resetDraft();
      await refresh();
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to save product");
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (slug: string) => {
    setWorkspaceError("");
    try {
      await deleteAdminProduct(slug);
      await refresh();
      if (editingSlug === slug) {
        resetDraft();
      }
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to delete product");
    }
  };

  const saveOrderStatus = async (number: string) => {
    const nextStatus = orderStatusDrafts[number];
    if (!nextStatus) {
      return;
    }
    setWorkspaceError("");
    try {
      await updateAdminOrderStatus(number, nextStatus);
      await refresh();
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to update order");
    }
  };

  if (bootstrapping && !authenticated) {
    return (
      <main className="admin-app admin-auth">
        <section className="admin-main" style={{ width: "100%" }}>
          <div className="admin-placeholder">
            <b>Loading</b>
            <h2>Preparing your admin console.</h2>
            <p>Connecting to Supabase, checking session state and loading the store workspace.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-app admin-auth">
        <section className="admin-main" style={{ width: "100%", minHeight: "100vh" }}>
          <div className="admin-placeholder">
            <b>Admin access</b>
            <h2>Sign in to manage the store.</h2>
            <p>Use the admin account connected to Supabase Auth to unlock product and order controls.</p>
            <div style={{ display: "grid", gap: 12, maxWidth: 420, width: "100%", marginTop: 24 }}>
              <label>
                Email
                <input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} type="email" />
              </label>
              <label>
                Password
                <input value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} type="password" />
              </label>
              {loginError ? <p className="form-error">{loginError}</p> : null}
              <button className="primary" onClick={handleLogin} disabled={loginBusy}>
                {loginBusy ? "Signing in..." : "Unlock admin workspace →"}
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-app">
      <aside className="admin-nav">
        <a href={STOREFRONT_URL} className="wordmark inverse">
          <img src="/logo-header.png" alt="In&On" />
        </a>
        <small>COMMERCE STUDIO</small>
        <nav>
          {menu.map((item, index) => (
            <button className={active === item ? "active" : ""} onClick={() => setActive(item)} key={item}>
              <i>{icons[index]}</i>
              {item}
              {item === "Orders" ? <b>{orders.length || 12}</b> : null}
            </button>
          ))}
        </nav>
        <div className="admin-user">
          <span>AS</span>
          <div>
            <b>Ananya Sharma</b>
            <small>Store administrator</small>
          </div>
        </div>
        <button onClick={() => {
          clearSession();
          setAuthenticated(false);
        }}>
          Sign out
        </button>
      </aside>

      <section className="admin-main">
        <header>
          <div>
            <p>{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date()).toUpperCase()}</p>
            <h1>{active}</h1>
          </div>
          <div>
            <button className="header-refresh" onClick={() => refresh().catch((error) => setWorkspaceError(error instanceof Error ? error.message : "Unable to refresh workspace"))}>Refresh data</button>
            <a href={STOREFRONT_URL}>View store ↗</a>
          </div>
        </header>

        {workspaceError ? <p className="form-error">{workspaceError}</p> : null}

        {active === "Overview" ? (
          <>
            <section className="admin-welcome">
              <div>
                <p className="eyebrow">TODAY AT IN&ON</p>
                <h2>
                  Good morning, Ananya.
                  <br />
                  <em>Your store is glowing.</em>
                </h2>
              </div>
              <div>
                <span>LIVE VISITORS</span>
                <b>
                  <i /> {overview.live_visitors}
                </b>
              </div>
            </section>

            <div className="metric-grid">
              {overview.metrics.map((metric, index) => (
                <article key={metric.label}>
                  <span>{metric.label.toUpperCase()}</span>
                  <b>{metric.value}</b>
                  <p>{metric.delta}</p>
                  <i className={`spark s${index + 1}`} />
                </article>
              ))}
            </div>

            <div className="admin-grid">
              <article className="sales-card">
                <div>
                  <div>
                    <span>SALES OVERVIEW</span>
                    <h3>{formatCurrency(overview.net_sales)}</h3>
                    <p>August 1-20</p>
                  </div>
                  <select>
                    <option>Last 30 days</option>
                  </select>
                </div>
                <div className="chart">
                  {overview.chart.map((bar, index) => (
                    <i key={`${bar}-${index}`} style={{ height: `${bar}%` }} />
                  ))}
                </div>
                <div className="chart-axis">
                  <span>01 Aug</span>
                  <span>05 Aug</span>
                  <span>09 Aug</span>
                  <span>13 Aug</span>
                  <span>20 Aug</span>
                </div>
              </article>

              <article className="top-products">
                <span>TOP PRODUCTS</span>
                {topProducts.map((product) => (
                  <div key={product.slug}>
                    <img src={product.image} alt={product.name} />
                    <p>
                      <b>{product.name}</b>
                      <small>{product.sold} sold</small>
                    </p>
                    <strong>{formatCurrency(product.revenue)}</strong>
                  </div>
                ))}
              </article>
            </div>

            <article className="orders-table">
              <div>
                <span>RECENT ORDERS</span>
                <button onClick={() => setActive("Orders")}>View all orders →</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>CUSTOMER</th>
                    <th>STATUS</th>
                    <th>ITEMS</th>
                    <th>TOTAL</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(orders.length
                    ? orders
                    : [
                        {
                          number: "#1048",
                          customer_name: "Riya Kapoor",
                          status: "Packed",
                          item_count: 3,
                          total: 1397,
                          customer_email: "riya@example.com",
                          shipping_eta: "Wednesday, 20 August",
                          items: [],
                        },
                        {
                          number: "#1047",
                          customer_name: "Meera Joshi",
                          status: "Paid",
                          item_count: 2,
                          total: 998,
                          customer_email: "meera@example.com",
                          shipping_eta: "Thursday, 21 August",
                          items: [],
                        },
                      ]
                  ).map((order) => (
                    <tr key={order.number}>
                      <td>{order.number}</td>
                      <td>{order.customer_name}</td>
                      <td className={`status ${order.status.toLowerCase()}`}>{order.status}</td>
                      <td>{order.item_count}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>•••</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </>
        ) : active === "Orders" ? (
          <article className="orders-table">
            <div>
              <span>ORDER MANAGEMENT</span>
              <button onClick={() => refresh().catch(() => undefined)}>Refresh</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>STATUS</th>
                  <th>ETA</th>
                  <th>TOTAL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.number}>
                    <td>{order.number}</td>
                    <td>{order.customer_name}</td>
                    <td>
                      <select
                        value={orderStatusDrafts[order.number] ?? order.status}
                        onChange={(event) =>
                          setOrderStatusDrafts((drafts) => ({ ...drafts, [order.number]: event.target.value }))
                        }
                      >
                        {["Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>{order.shipping_eta}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <button onClick={() => saveOrderStatus(order.number)}>Save</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ) : active === "Products" ? (
          <>
            <article className="orders-table">
              <div>
                <span>PRODUCT WORKSPACE</span>
                <button onClick={resetDraft}>New product</button>
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 16 }}>
                <label>
                  Slug
                  <input value={productDraft.slug} onChange={(event) => setProductDraft({ ...productDraft, slug: event.target.value })} />
                </label>
                <label>
                  Name
                  <input value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })} />
                </label>
                <label>
                  Kicker
                  <input value={productDraft.kicker} onChange={(event) => setProductDraft({ ...productDraft, kicker: event.target.value })} />
                </label>
                <label>
                  Claim
                  <input value={productDraft.claim} onChange={(event) => setProductDraft({ ...productDraft, claim: event.target.value })} />
                </label>
                <label>
                  Intro
                  <input value={productDraft.intro} onChange={(event) => setProductDraft({ ...productDraft, intro: event.target.value })} />
                </label>
                <label>
                  Price
                  <input type="number" value={productDraft.price} onChange={(event) => setProductDraft({ ...productDraft, price: Number(event.target.value) })} />
                </label>
                <label>
                  MRP
                  <input type="number" value={productDraft.mrp} onChange={(event) => setProductDraft({ ...productDraft, mrp: Number(event.target.value) })} />
                </label>
                <label>
                  Image path
                  <input value={productDraft.image} onChange={(event) => setProductDraft({ ...productDraft, image: event.target.value })} />
                </label>
                <label>
                  Tone
                  <input value={productDraft.tone} onChange={(event) => setProductDraft({ ...productDraft, tone: event.target.value })} />
                </label>
                <label>
                  Accent
                  <input value={productDraft.accent} onChange={(event) => setProductDraft({ ...productDraft, accent: event.target.value })} />
                </label>
                <label>
                  Tag
                  <input value={productDraft.tag} onChange={(event) => setProductDraft({ ...productDraft, tag: event.target.value })} />
                </label>
                <label>
                  Rating
                  <input value={productDraft.rating} onChange={(event) => setProductDraft({ ...productDraft, rating: event.target.value })} />
                </label>
                <label>
                  Category
                  <input value={productDraft.category} onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })} />
                </label>
                <label>
                  Stock
                  <input type="number" value={productDraft.stock} onChange={(event) => setProductDraft({ ...productDraft, stock: Number(event.target.value) })} />
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Ingredients comma-separated
                  <input
                    value={productDraft.ingredients.join(", ")}
                    onChange={(event) => setProductDraft({ ...productDraft, ingredients: parseList(event.target.value) })}
                  />
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  Benefits comma-separated
                  <input
                    value={productDraft.benefits.join(", ")}
                    onChange={(event) => setProductDraft({ ...productDraft, benefits: parseList(event.target.value) })}
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button className="primary" onClick={saveProduct} disabled={saving}>
                  {editingSlug ? "Update product" : "Create product"}
                </button>
                {editingSlug ? <button onClick={resetDraft}>Cancel edit</button> : null}
              </div>
            </article>

            <article className="orders-table">
              <div>
                <span>CATALOG ITEMS</span>
                <button onClick={() => refresh().catch(() => undefined)}>Refresh</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>NAME</th>
                    <th>PRICE</th>
                    <th>STOCK</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.slug}>
                      <td>{product.slug}</td>
                      <td>{product.name}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.stock}</td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => startEdit(product)}>Edit</button>
                        <button onClick={() => removeProduct(product.slug)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </>
        ) : active === "Customers" ? (
          <article className="orders-table operations-table"><div><span>CUSTOMER MANAGEMENT</span><button onClick={refreshOperations}>Refresh</button></div><table><thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>CITY</th><th>POINTS</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td>{customer.first_name} {customer.last_name}</td><td>{customer.email}</td><td>{customer.role}</td><td>{customer.city || "-"}</td><td>{customer.glow_points}</td></tr>)}</tbody></table></article>
        ) : active === "Discounts" ? (
          <article className="orders-table operations-table"><div><span>DISCOUNT CODES</span><button onClick={refreshOperations}>Refresh</button></div><table><thead><tr><th>CODE</th><th>TYPE</th><th>VALUE</th><th>USES</th><th>STATUS</th></tr></thead><tbody>{discounts.map((discount) => <tr key={discount.id}><td>{discount.code}</td><td>{discount.kind}</td><td>{discount.kind === "percentage" ? `${discount.amount}%` : formatCurrency(discount.amount)}</td><td>{discount.uses_count}{discount.max_uses ? ` / ${discount.max_uses}` : ""}</td><td>{discount.active ? "Active" : "Inactive"}</td></tr>)}</tbody></table></article>
        ) : active === "Content" ? (
          <article className="orders-table operations-table"><div><span>CONTENT MANAGEMENT</span><button onClick={refreshOperations}>Refresh</button></div><table><thead><tr><th>KEY</th><th>TITLE</th><th>STATUS</th><th>UPDATED</th></tr></thead><tbody>{content.map((item) => <tr key={item.id}><td>{item.content_key}</td><td>{item.title}</td><td>{item.status}</td><td>{new Date(item.updated_at).toLocaleDateString()}</td></tr>)}</tbody></table></article>
        ) : active === "Analytics" ? (
          <article className="orders-table operations-table"><div><span>EVENT ANALYTICS</span><button onClick={refreshOperations}>Refresh</button></div><div className="metric-grid operations-metrics"><article><span>TOTAL EVENTS</span><b>{analytics?.total_events ?? 0}</b><p>Tracked platform events</p></article>{Object.entries(analytics?.events_by_name ?? {}).map(([name, count]) => <article key={name}><span>{name.toUpperCase()}</span><b>{count}</b><p>Recorded events</p></article>)}</div></article>
        ) : (
            <div className="admin-placeholder settings-panel">
              <b>{active}</b>
              <h2>Platform settings</h2>
              <p>Your store is connected to the production API and Supabase workspace.</p>
              <div className="settings-grid"><div><span>API STATUS</span><strong>Connected</strong><small>{import.meta.env.VITE_API_BASE_URL ?? "Local API fallback"}</small></div><div><span>STORE STATUS</span><strong>Live</strong><small>COD checkout enabled</small></div><div><span>DATA</span><strong>Supabase</strong><small>Auth, database and storage</small></div></div>
              <a className="primary" href={STOREFRONT_URL}>Open storefront →</a>
            </div>
        )}
      </section>
    </main>
  );
}
