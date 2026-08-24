"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { loadCatalog, type CatalogProduct } from "./catalog";
import { createOrder, hasStoredSession, loadCustomerOrder, recordAnalyticsEvent, type ApiOrder } from "./lib/api";
import { addToBag, readBag, removeBagItemAt } from "./lib/shopState";

export default function Home() {
  const location = useLocation();
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [panel, setPanel] = useState<"cart" | "track" | "checkout" | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [checkout, setCheckout] = useState({ name: "", phone: "", address: "", postalCode: "", city: "" });
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [trackNumber, setTrackNumber] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<ApiOrder | null>(null);
  const [trackError, setTrackError] = useState("");
  const [trackBusy, setTrackBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { const sync = () => setSignedIn(hasStoredSession()); sync(); window.addEventListener("storage", sync); window.addEventListener("focus", sync); return () => { window.removeEventListener("storage", sync); window.removeEventListener("focus", sync); }; }, []);
  useEffect(() => { if (new URLSearchParams(location.search).get("bag") === "1") setPanel("cart"); }, [location.search]);
  useEffect(() => {
    recordAnalyticsEvent("page_view").catch(() => undefined);
    let alive = true;
    loadCatalog().then((items) => {
      if (alive) {
        setCatalog(items);
        setCart(readBag().map((slug) => items.find((product) => product.slug === slug)?.id).filter((id): id is number => Boolean(id)));
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return catalog.filter((product) =>
      `${product.name} ${product.kicker} ${product.claim}`.toLowerCase().includes(query.toLowerCase()),
    );
  }, [catalog, query]);

  const cartProducts = cart
    .map((id) => catalog.find((product) => product.id === id))
    .filter(Boolean) as CatalogProduct[];

  const subtotal = cartProducts.reduce((sum, product) => sum + product.price, 0);

  function add(product: CatalogProduct) {
    addToBag(product.slug);
    setCart((value) => [...value, product.id]);
    setToast(`${product.name} added to your ritual`);
    window.setTimeout(() => setToast(""), 1800);
  }

  async function placeOrder() {
    setCheckoutError("");
    if (!hasStoredSession()) {
      setCheckoutError("Please sign in before checkout so we can attach this order to your account.");
      return;
    }
    const [firstName, ...lastParts] = checkout.name.trim().split(/\s+/);
    const lastName = lastParts.join(" ") || "Customer";
    if (!firstName || !checkout.phone || !checkout.address || !checkout.postalCode || !checkout.city) {
      setCheckoutError("Please complete every delivery field.");
      return;
    }
    setCheckoutBusy(true);
    try {
      const order = await createOrder({
        items: cartProducts.map((product) => ({ product_slug: product.slug, quantity: 1 })),
        shipping: { first_name: firstName, last_name: lastName, phone: checkout.phone, address: checkout.address, city: checkout.city, postal_code: checkout.postalCode },
      });
      setCart([]);
      setPanel(null);
      setToast(`${order.number} confirmed. Your ritual is on its way.`);
      window.setTimeout(() => setToast(""), 3500);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to place order");
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function trackOrder() {
    setTrackError("");
    setTrackedOrder(null);
    if (!hasStoredSession()) {
      setTrackError("Please sign in to securely view your orders.");
      return;
    }
    if (!trackNumber.trim()) {
      setTrackError("Enter your order number to continue.");
      return;
    }
    setTrackBusy(true);
    try {
      setTrackedOrder(await loadCustomerOrder(trackNumber));
    } catch (error) {
      setTrackError(error instanceof Error ? error.message : "Unable to find that order");
    } finally {
      setTrackBusy(false);
    }
  }

  return (
    <main>
      <div className="announce">
        FRESH SKIN, FRESH START <span>•</span> FOR DRY, OILY, COMBINATION &amp; SENSITIVE-FEELING SKIN <span>•</span> FREE SHIPPING ABOVE ₹599
      </div>

      <header>
        <a className="wordmark" href="#top">
          <img src="/logo-header.png" alt="In&On" />
        </a>
        <nav>
          <a href="#top">Home</a>
          <a href="/shop">Shop</a>
          <a href="/about">About</a>
          <a href="/blog">Journal</a>
          <a href="/contact">Contact</a>
        </nav>
        <div className="header-actions account-links">
          {signedIn ? <a className="dashboard-link" href="/account">Dashboard</a> : <><a className="login-link" href="/login?next=/account">Login</a><a className="signup-link" href="/signup?next=/account">Sign up</a></>}
          <button className="bag" onClick={() => setPanel("cart")}>
            Bag <b>{cart.length}</b>
          </button>
        </div>
      </header>

      <section className="hero supplied-hero" id="top">
        <video className="supplied-hero-video" autoPlay muted loop playsInline preload="metadata" aria-label="In&On skincare collection film">
          <source src="/home-hero.mp4" type="video/mp4" />
        </video>
        <div className="supplied-hero-copy">
          <h1>Skin that feels<br /><em>good,</em> in &amp; out.</h1>
          <p>Joyful, effective skincare made with<br />familiar fruits and proven actives,<br />designed for <strong>real Indian skin.</strong></p>
          <div className="supplied-hero-actions">
            <a className="supplied-shop-cta" href="#shop">SHOP THE COLLECTION <span aria-hidden="true">→</span></a>
            <a className="supplied-ritual-cta" href="#ritual">Find your ritual <span aria-hidden="true">→</span></a>
          </div>
          <div className="supplied-proof">
            <span><b>☆</b><strong>4.8/5</strong><small>Customer love</small></span>
            <span><b>♧</b><strong>{catalog.length || 5}</strong><small>Focused formulas</small></span>
            <span><b>♧</b><strong>100%</strong><small>Joyful care</small></span>
          </div>
        </div>
      </section>

      <section className="marquee">
        <span>DERMATOLOGICALLY TESTED</span>
        <i>✦</i>
        <span>THOUGHTFUL ACTIVES</span>
        <i>✦</i>
        <span>MADE FOR DAILY USE</span>
        <i>✦</i>
        <span>NO FUSS, JUST GLOW</span>
      </section>

      <section className="shop" id="shop">
        <div className="section-head">
          <div>
            <p className="eyebrow red">YOUR DAILY SHELF</p>
            <h2>
              Small collection.
              <br />
              Serious skin love.
            </h2>
          </div>
          <p>
            Five focused formulas. Easy to understand, delightful to use and made to layer into one uncomplicated
            routine.
          </p>
        </div>
        <div className="shop-toolbar">
          <div className="pills">
            <Link className="active" to="/shop">
              All products
            </Link>
            <Link to="/shop">Cleanse</Link>
            <Link to="/shop">Treat</Link>
            <Link to="/shop">Moisturize</Link>
            <Link to="/shop">Protect</Link>
          </div>
          <label className="search">
            <span>⌕</span>
            <input
              id="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your skin need"
            />
          </label>
        </div>
        <div className="product-grid">
          {filtered.map((product, index) => (
            <article className="product-card" key={product.id}>
              <Link
                className="product-visual"
                to={`/products/${product.slug}`}
                style={{ background: product.tone }}
              >
                <span className="product-tag">{product.tag}</span>
                <img src={product.image} alt={product.name} />
                <span className="quick">Explore product</span>
              </Link>
              <div className="product-info">
                <div>
                  <small>
                    ★ {product.rating} · {124 + index * 37} reviews
                  </small>
                  <h3>
                    <a href={`/products/${product.slug}`}>{product.name}</a>
                  </h3>
                  <p>{product.kicker}</p>
                </div>
                <button className="plus" onClick={() => add(product)}>
                  +
                </button>
              </div>
              <div className="price">
                <b>₹{product.price}</b>
                <del>₹{product.mrp}</del>
                <span>{Math.round((1 - product.price / product.mrp) * 100)}% OFF</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ritual" id="ritual">
        <div className="ritual-art">
          <img src="/products/watermelon.jpg" alt="Watermelon face wash" />
          <span className="badge">
            AM + PM
            <br />
            READY
          </span>
        </div>
        <div className="ritual-copy">
          <p className="eyebrow">THE 4-MINUTE RITUAL</p>
          <h2>
            Good skin days,
            <br />
            made simple.
          </h2>
          {[
            ["01", "Cleanse", "Lift away the day without stripping your skin."],
            ["02", "Treat", "Use targeted actives where your skin needs them."],
            ["03", "Moisturize", "Seal in hydration for soft, balanced skin."],
            ["04", "Protect", "Every morning, finish strong with SPF 50."],
          ].map((step) => (
            <div className="step" key={step[0]}>
              <b>{step[0]}</b>
              <h3>{step[1]}</h3>
              <p>{step[2]}</p>
            </div>
          ))}
          <a href="#shop" className="primary light">
            Build your ritual
          </a>
        </div>
      </section>

      <section className="why" id="why">
        <p className="eyebrow red">WHY IN&ON</p>
        <h2>
          Skincare on the outside.
          <br />
          <em>Confidence on the inside.</em>
        </h2>
        <div className="why-grid">
          <div>
            <b>01</b>
            <h3>Fruit + science</h3>
            <p>Familiar fruit extracts meet well-researched actives in balanced daily formulas.</p>
          </div>
          <div>
            <b>02</b>
            <h3>Easy by design</h3>
            <p>No confusing routines. Clear benefits, honest directions and joyful textures.</p>
          </div>
          <div>
            <b>03</b>
            <h3>Real-skin friendly</h3>
            <p>Thoughtfully made for changing weather, busy days and diverse Indian skin.</p>
          </div>
        </div>
      </section>

      <section className="results">
        <div>
          <p className="eyebrow">VISIBLE CARE</p>
          <h2>
            Consistency looks
            <br />
            good on you.
          </h2>
          <p>
            Results are personal. Your ritual should be too. Start small, stay regular and let your skin settle
            into its rhythm.
          </p>
          <a href="#shop" className="text-link">
            Explore all products →
          </a>
        </div>
        <div className="result-cards">
          <img src="/products/moisturizer.jpg" alt="Orange moisturizer" />
          <img src="/products/cucumber.jpg" alt="Cucumber face wash" />
        </div>
      </section>

      <section className="testimonials" aria-labelledby="testimonials-title">
        <div className="section-head testimonials-head">
          <div>
            <p className="eyebrow red">REAL ROUTINES, REAL LOVE</p>
            <h2 id="testimonials-title">
              The glow is better
              <br />
              <em>when it is shared.</em>
            </h2>
          </div>
          <p>Kind words from people keeping their everyday skincare simple, consistent and joyful.</p>
        </div>
        <div className="testimonial-grid">
          {[
            ["Aanya M.", "Mumbai", "The strawberry serum feels so light, but my skin looks noticeably brighter after a few weeks. It has become my favourite evening step.", "★★★★★"],
            ["Rhea S.", "Bengaluru", "The cucumber wash leaves my skin fresh without that tight feeling. It is gentle enough for my sensitive-feeling days.", "★★★★★"],
            ["Kavya P.", "Delhi", "I finally found an SPF I actually enjoy wearing. The mango texture sinks in quickly and sits beautifully under makeup.", "★★★★★"],
            ["Mehak R.", "Pune", "The routine is so easy to follow and the packaging is gorgeous. My skin feels calmer, softer and much more balanced.", "★★★★★"],
            ["Ishita N.", "Hyderabad", "The orange moisturizer gives me comfortable hydration without feeling heavy. A little goes a long way and my skin loves it.", "★★★★★"],
          ].map(([name, city, quote, rating]) => (
            <article className="testimonial-card" key={name}>
              <div className="testimonial-rating" aria-label="5 out of 5 stars">{rating}</div>
              <blockquote>“{quote}”</blockquote>
              <footer><strong>{name}</strong><span>{city}</span></footer>
            </article>
          ))}
        </div>
      </section>

      <section className="faq" id="faq" aria-labelledby="faq-title">
        <div className="faq-intro">
          <p className="eyebrow red">GOOD TO KNOW</p>
          <h2 id="faq-title">Your questions,<br /><em>answered simply.</em></h2>
          <p>Still curious? Our care team is always happy to help you find a routine that feels right.</p>
          <a className="text-link" href="/contact">Talk to our care team →</a>
        </div>
        <div className="faq-list">
          {[
            ["Are these products suitable for all skin types?", "Our formulas are designed for everyday use across dry, oily, combination and sensitive-feeling skin. Start with a patch test and introduce one new product at a time."],
            ["How should I build my In&On routine?", "Cleanse first, follow with a targeted serum, moisturize and finish every morning with SPF 50. Keep it consistent rather than complicated."],
            ["Can I use the serum every day?", "Yes, the Strawberry Face Serum is made for a simple daily routine. Apply a few drops to clean, dry skin, then follow with moisturizer and sunscreen in the morning."],
            ["Are the formulas dermatologically tested?", "Yes. Our formulas are thoughtfully developed, dermatologically tested and made without the unnecessary fuss of harsh everyday care."],
            ["How long does delivery take?", "Orders are usually delivered within 3 to 7 business days. You will receive tracking details once your order is on its way."],
          ].map(([question, answer], index) => (
            <details className="faq-item" key={question} open={index === 0}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="newsletter" id="journal">
        <p>IN&ON NOTES</p>
        <h2>A little glow in your inbox.</h2>
        <span>Ingredient explainers, simple routines and first access to fresh drops.</span>
        <form onSubmit={(event) => event.preventDefault()}>
          <input aria-label="Email address" placeholder="Your email address" />
          <button>Join the list →</button>
        </form>
      </section>

      <footer>
        <div className="footer-brand">
          <a className="wordmark inverse" href="#top">
            <img src="/logo-footer.png" alt="In&On" />
          </a>
          <p>
            Clean formulas. Kind rituals.
            <br />
            Effective everyday care.
          </p>
          <div className="social"><a href="https://www.instagram.com/inandon.care/?hl=en-in" target="_blank" rel="noreferrer">Instagram ↗</a></div>
        </div>
        <div>
          <h4>SHOP</h4>
          <a href="#shop">All products</a>
          <a href="#ritual">Build a ritual</a>
          <a href="#shop">Bestsellers</a>
        </div>
        <div>
          <h4>HELP</h4>
          <button onClick={() => setPanel("track")}>Track order</button>
          <a href="/contact">Shipping & returns</a>
          <a href="/contact">Contact us</a>
          <a href="#faq">FAQs</a>
        </div>
        <div>
          <h4>ABOUT</h4>
          <a href="#why">Our story</a>
          <a href="#why">Ingredients</a>
          <a href="#journal">Skin journal</a>
        </div>
        <small>© 2026 IN&ON CARE · PRIVACY · TERMS</small>
      </footer>

      {toast ? <div className="toast">✓ {toast}</div> : null}

      {panel ? (
        <div className="overlay side" onClick={() => setPanel(null)}>
          <aside onClick={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setPanel(null)}>
              ×
            </button>
            {panel === "cart" ? (
              <>
                <p className="eyebrow red">YOUR BAG</p>
                <h2>
                  {cart.length
                    ? `${cart.length} little glow${cart.length > 1 ? "s" : ""}`
                    : "Your bag is waiting"}
                </h2>
                {cartProducts.length ? (
                  <>
                    <div className="cart-list">
                      {cartProducts.map((product, index) => (
                        <div className="cart-item" key={`${product.id}-${index}`}>
                          <img src={product.image} alt="" />
                          <div>
                            <h3>{product.name}</h3>
                            <p>{product.kicker}</p>
                            <b>₹{product.price}</b>
                          </div>
                          <button onClick={() => { removeBagItemAt(index); setCart((value) => value.filter((_, itemIndex) => itemIndex !== index)); }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="coupon">
                      <input placeholder="Coupon code" />
                      <button>Apply</button>
                    </div>
                    <div className="total">
                      <span>Subtotal</span>
                      <b>₹{subtotal}</b>
                    </div>
                    <p className="delivery">{subtotal >= 599 ? "✓ You qualify for free shipping" : `Add ₹${599 - subtotal} more for complimentary shipping`}</p>
                    <button className="primary full" onClick={() => setPanel("checkout")}>
                      Secure checkout →
                    </button>
                  </>
                ) : (
                  <>
                    <div className="empty">♡</div>
                    <p>Add a few formulas and build a ritual your skin will look forward to.</p>
                    <a href="#shop" className="primary full" onClick={() => setPanel(null)}>
                      Explore products
                    </a>
                  </>
                )}
              </>
            ) : null}

            {panel === "track" ? (
              <>
                <p className="eyebrow red">ORDER TRACKING</p>
                <h2>
                  Your glow,
                  <br />
                  on its way.
                </h2>
                <p>Enter the order number from your confirmation message.</p>
                <label className="field">
                  Order number
                  <input value={trackNumber} onChange={(event) => setTrackNumber(event.target.value)} placeholder="e.g. INON260821AB12" />
                </label>
                <button className="primary full" onClick={trackOrder} disabled={trackBusy}>{trackBusy ? "Checking order..." : "Track my order →"}</button>
                {trackError ? <p className="form-error">{trackError}</p> : null}
                {trackedOrder ? <div className="track-demo">
                  <b>{trackedOrder.number} · {trackedOrder.status.toUpperCase()}</b>
                  <p>{trackedOrder.item_count} products · ₹{trackedOrder.total} · {trackedOrder.shipping_eta}</p>
                  <div className="timeline">
                    {['Confirmed', 'Packed', 'Shipped', 'Delivered'].map((step, index) => {
                      const orderSteps = ['Confirmed', 'Packed', 'Shipped', 'Delivered'];
                      const current = orderSteps.indexOf(trackedOrder.status);
                      return <span key={step}><i className={index <= Math.max(current, 0) ? "done" : ""}></i><b>{step}</b><small>{index <= Math.max(current, 0) ? "Complete" : "Coming next"}</small></span>;
                    })}
                  </div>
                </div> : null}
              </>
            ) : null}

            {panel === "checkout" ? (
              <>
                <p className="eyebrow red">SECURE CHECKOUT</p>
                <h2>Almost glowing.</h2>
                <div className="checkout-steps"><b>1 Delivery details</b><span>2 Confirmation</span></div>
                <label className="field">
                    Full name
                  <input value={checkout.name} onChange={(event) => setCheckout({ ...checkout, name: event.target.value })} placeholder="Name for delivery" />
                </label>
                <label className="field">
                  Phone number
                  <input value={checkout.phone} onChange={(event) => setCheckout({ ...checkout, phone: event.target.value })} placeholder="10-digit mobile number" />
                </label>
                <label className="field">
                  Delivery address
                  <textarea value={checkout.address} onChange={(event) => setCheckout({ ...checkout, address: event.target.value })} placeholder="House, street, locality"></textarea>
                </label>
                <div className="two">
                  <label className="field">
                    Pincode
                    <input value={checkout.postalCode} onChange={(event) => setCheckout({ ...checkout, postalCode: event.target.value })} placeholder="110001" />
                  </label>
                  <label className="field">
                    City
                    <input value={checkout.city} onChange={(event) => setCheckout({ ...checkout, city: event.target.value })} placeholder="New Delhi" />
                  </label>
                </div>
                <div className="total">
                  <span>Payable total</span>
                  <b>₹{subtotal || 0}</b>
                </div>
                {checkoutError ? <p className="form-error">{checkoutError}</p> : null}
                <button className="primary full" onClick={placeOrder} disabled={checkoutBusy}>{checkoutBusy ? "Confirming order..." : "Confirm order →"}</button>
                <small className="secure">Secure order confirmation · Support: support@inoncare.com</small>
              </>
            ) : null}
          </aside>
        </div>
      ) : null}
    </main>
  );
}
