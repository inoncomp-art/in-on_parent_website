import { useState } from "react";
import { PremiumFooter, PremiumHeader } from "./Shell";
import { addToBag } from "../lib/shopState";
import type { CatalogProduct } from "../catalog";

const benefits = [
  "Effectively removes dirt, excess oil & daily impurities for a fresh, clean feel",
  "Helps promote a smoother, more radiant & refreshed complexion",
  "Leaves skin feeling cool, calm, & revitalized after every wash",
  "Helps maintain a soft, smooth & healthy-looking complexion with daily use",
];

const dailyCare = [
  ["01", "Gently cleanses dirt, oil & impurities"],
  ["02", "Helps maintain a healthy-looking complexion"],
  ["03", "Helps remove excess oil without over-drying"],
  ["04", "Provides antioxidant care for everyday skin protection"],
];

const ingredients = [
  ["Cucumis sativus fruit extract", "Refreshes & hydrates the skin for a naturally healthy glow"],
  ["Niacinamide", "Helps improve skin radiance & promotes a brighter-looking complexion"],
  ["Allantoin", "Helps soothe & comfort the skin while leaving it feeling soft & refreshed"],
  ["Glycyrrhiza glabra root extract", "Supports a brighter, smoother & more even-looking complexion"],
];

export default function CucumberProductPage({ product }: { product: CatalogProduct }) {
  const [added, setAdded] = useState(false);
  const addProduct = () => { addToBag(product.slug); setAdded(true); };

  return (
    <main className="cucumber-page">
      <PremiumHeader />
      <section className="cucumber-hero">
        <img className="cucumber-hero-background" src="/cucumber-facewash.png" alt="Cucumber face wash ritual" />
        <div className="cucumber-hero-content">
          <p className="eyebrow">IN&ON / DAILY CLEANSE</p>
          <h1>Cucumber<br /><em>Face Wash</em></h1>
          <p className="cucumber-hero-kicker">With Vitamin C &amp; Niacinamide</p>
          <p className="cucumber-hero-claim">Refreshed &amp; Glowing Skin</p>
          <p className="cucumber-hero-description">Reveal Brighter, Healthier<br />Looking Skin</p>
          <div className="cucumber-purchase">
            <div><b>₹{product.price}</b><del>₹{product.mrp}</del><small>Inclusive of taxes</small></div>
            <button className="primary" onClick={addProduct}>{added ? "Added ✓" : "Add to bag"}</button>
          </div>
        </div>
      </section>

      <section className="cucumber-section cucumber-benefits">
        <div className="cucumber-section-intro"><p className="eyebrow red">KEY BENEFITS</p><h2>Fresh skin,<br /><em>every wash.</em></h2></div>
        <div className="cucumber-benefit-grid">{benefits.map((benefit, index) => <article key={benefit}><span>0{index + 1}</span><p>{benefit}</p></article>)}</div>
      </section>

      <section className="cucumber-section cucumber-daily">
        <div><p className="eyebrow red">COMPLETE DAILY FACE CARE</p><h2>Balanced hydration &amp;<br /><em>antioxidant support.</em></h2><p className="cucumber-support-copy">A comfortable daily cleanse made to refresh without taking away what skin needs to feel soft, calm and healthy-looking.</p></div>
        <div className="cucumber-daily-list">{dailyCare.map(([number, text]) => <article key={number}><b>{number}</b><span>{text}</span></article>)}</div>
      </section>

      <section className="cucumber-section cucumber-ingredients">
        <div className="cucumber-section-intro"><p className="eyebrow red">INSIDE THE FORMULA</p><h2>Familiar actives.<br /><em>Clear purpose.</em></h2></div>
        <div className="cucumber-ingredient-grid">{ingredients.map(([name, description]) => <article key={name}><span>ACTIVE</span><h3>{name}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="cucumber-section cucumber-howto">
        <div><p className="eyebrow">HOW TO USE</p><h2>Your simple<br /><em>cleanse ritual.</em></h2></div>
        <ol><li><b>01</b><span>Take a coin-sized amount of face wash</span></li><li><b>02</b><span>Gently massage in circular motions</span></li><li><b>03</b><span>Rinse with water and pat dry</span></li></ol>
      </section>

      <section className="cucumber-results">
        <div><p className="eyebrow red">VISIBLE RESULTS</p><h2>Freshness you can<br /><em>feel in your rhythm.</em></h2><p>Result after using one bottle twice daily.</p><small>*Based on study conducted at our facility</small></div>
        <img src="/product-details/cucumber-face-wash/7.png" alt="Visible results after using Cucumber Face Wash" />
      </section>

      <section className="cucumber-bottom-cta"><p className="eyebrow">READY FOR A FRESH START?</p><h2>Cleanse gently.<br /><em>Glow naturally.</em></h2><button className="primary" onClick={addProduct}>{added ? "In your bag ✓" : `Add Cucumber Face Wash · ₹${product.price}`}</button></section>
      <PremiumFooter />
    </main>
  );
}
