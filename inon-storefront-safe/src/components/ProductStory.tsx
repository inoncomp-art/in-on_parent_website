"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { loadCatalog, type CatalogProduct } from "../catalog";
import { PremiumFooter, PremiumHeader } from "./Shell";
import { addToBag } from "../lib/shopState";

export default function ProductStory({ product }: { product: CatalogProduct }) {
  const [added, setAdded] = useState(false);
  const addProduct = () => { addToBag(product.slug); setAdded(true); };
  const [related, setRelated] = useState<CatalogProduct[]>([]);
  useEffect(() => { loadCatalog().then((items) => setRelated(items.filter((item) => item.slug !== product.slug).slice(0, 4))); }, [product.slug]);

  return (
    <main
      className="story-page"
      style={{ "--product-tone": product.tone, "--product-accent": product.accent } as CSSProperties}
    >
      <PremiumHeader />
      <section className="story-hero">
        <div className="story-sticky">
          <div className="orb one"></div>
          <div className="orb two"></div>
          <p>IN&ON / {product.kicker}</p>
          <img src={product.image} alt={product.name} />
          <span className="vertical-word">{product.name.split(" ")[0]}</span>
        </div>
        <div className="story-flow">
          <article className="floating-card intro-card">
            <p className="eyebrow">{product.kicker}</p>
            <h1>{product.claim}</h1>
            <p>{product.intro}</p>
            <div className="rating">
              ★★★★★ <span>{product.rating} · 218 verified rituals</span>
            </div>
            <div className="purchase">
              <div>
                <b>₹{product.price}</b>
                <del>₹{product.mrp}</del>
              </div>
              <button className="primary" onClick={addProduct}>
                {added ? "Added ✓" : "Add to bag"}
              </button>
            </div>
            <small>Inclusive of taxes · Ships in 24 hours</small>
          </article>

          <article className="floating-card statement">
            <span>01 / EXPERIENCE</span>
            <h2>Skincare should feel as good as it works.</h2>
            <p>{product.claim} Built around {product.kicker.toLowerCase()} to support a more comfortable, visibly balanced everyday ritual.</p>
          </article>

          <article className="floating-card split-card">
            <div>
              <span>02 / WHAT IT DOES</span>
              <h2>
                Focused care,
                <br />
                never fussy.
              </h2>
            </div>
            <ul>
              {product.benefits.map((benefit) => (
                <li key={benefit}>✦ {benefit}</li>
              ))}
            </ul>
          </article>

          <article className="floating-card ingredient-card">
            <span>03 / INSIDE THE FORMULA</span>
            <h2>
              Good ingredients.
              <br />
              Clear purpose.
            </h2>
            <div className="ingredient-grid">
              {product.ingredients.map((ingredient, index) => (
                <div key={ingredient}>
                  <b>0{index + 1}</b>
                  <h3>{ingredient}</h3>
                  <p>{index % 2 ? "Comforts, balances and supports healthy-looking skin." : "Thoughtfully selected for visible everyday care."}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="floating-card why-card">
            <span>WHY YOUR SKIN WILL LOVE IT</span>
            <h2>Useful care,<br />beautifully simple.</h2>
            <div className="why-list">{product.benefits.map((benefit) => <p key={benefit}><b>✦</b>{benefit}</p>)}</div>
          </article>

          <article className="floating-card ritual-card">
            <span>04 / YOUR RITUAL</span>
            <h2>
              Use it. Love it.
              <br />
              Stay consistent.
            </h2>
            <div className="routine-row">
              <div>
                <b>1</b>
                <p>Start with clean, damp skin</p>
              </div>
              <div>
                <b>2</b>
                <p>Apply gently and evenly</p>
              </div>
              <div>
                <b>3</b>
                <p>Follow with your daily ritual</p>
              </div>
            </div>
            <button className="primary" onClick={addProduct}>
              {added ? "In your bag ✓" : `Add to bag · ₹${product.price}`}
            </button>
          </article>
        </div>
      </section>
      <section className="more-products">
        <p className="eyebrow red">KEEP EXPLORING</p>
        <h2>Complete the shelf.</h2>
        <div>
          {related.map((item) => <a href={`/products/${item.slug}`} key={item.slug} style={{ background: item.tone }}><img src={item.image} alt={item.name} /><span>{item.category}<b>{item.name} →</b></span></a>)}
        </div>
      </section>
      <PremiumFooter />
    </main>
  );
}
