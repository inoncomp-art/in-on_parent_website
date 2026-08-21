"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PremiumFooter, PremiumHeader } from "../../components/Shell";
import { loadCatalog, type CatalogProduct } from "../../catalog";
import { addToBag, readWishlist, toggleWishlist } from "../../lib/shopState";

const filters = ["All", "Face Wash", "Serum", "Moisturizer", "Sunscreen"];

export default function Shop() {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setWishlist(readWishlist());
    const sync = () => setWishlist(readWishlist());
    window.addEventListener("inon-shop-state", sync);
    return () => window.removeEventListener("inon-shop-state", sync);
  }, []);

  const addProduct = (product: CatalogProduct) => {
    addToBag(product.slug);
    setToast(`${product.name} added to your bag`);
    window.setTimeout(() => setToast(""), 1800);
  };

  const saveProduct = (product: CatalogProduct) => {
    setWishlist(toggleWishlist(product.slug));
  };

  useEffect(() => {
    let alive = true;
    loadCatalog().then((items) => {
      if (alive) {
        setCatalog(items);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    return catalog.filter((product) => {
      const matchesFilter = filter === "All" || product.category === filter;
      const matchesQuery = `${product.name} ${product.kicker} ${product.claim}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [catalog, filter, query]);

  return (
    <main>
      <PremiumHeader />
      <section className="shop-hero">
        <p className="eyebrow">THE IN&ON SHELF</p>
        <h1>
          Find your
          <br />
          <em>skin rhythm.</em>
        </h1>
        <p>Five focused formulas, one uncomplicated routine.</p>
        <div className="shop-bubbles">
          <span>Fruit-powered</span>
          <span>Active-led</span>
          <span>Everyday-ready</span>
        </div>
      </section>
      <section className="catalog-page">
        <div className="catalog-tools">
          <div>
            {filters.map((item) => (
              <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>
                {item}
              </button>
            ))}
          </div>
          <label>
            ⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search formulas" />
          </label>
        </div>
        <div className="catalog-grid">
          {list.map((product, index) => (
            <article
              className="catalog-card reveal"
              key={product.slug}
              style={{ "--delay": `${index * 0.08}s` } as CSSProperties}
            >
              <Link to={`/products/${product.slug}`} className="catalog-visual" style={{ background: product.tone }}>
                <span>{index % 2 ? "EDITOR'S PICK" : "BESTSELLER"}</span>
                <img src={product.image} alt={product.name} />
                <i>Discover formula →</i>
              </Link>
              <small>★★★★★ {product.rating}</small>
              <h2><Link to={`/products/${product.slug}`}>{product.name}</Link></h2>
              <p>{product.kicker}</p>
              <div className="catalog-buy-row"><b>
                ₹{product.price} <del>₹{product.mrp}</del>
              </b><button className="wishlist-button" onClick={() => saveProduct(product)} aria-label={`${wishlist.includes(product.slug) ? "Remove" : "Add"} ${product.name} ${wishlist.includes(product.slug) ? "from" : "to"} wishlist`}>{wishlist.includes(product.slug) ? "♥" : "♡"}</button><button className="catalog-bag" onClick={() => addProduct(product)}>Add to bag</button></div>
            </article>
          ))}
        </div>
      </section>
      {toast ? <div className="toast">✓ {toast}</div> : null}
      <PremiumFooter />
    </main>
  );
}
