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
  const galleryImages = [
    "/cucumber-facewash.png",
    "/product-details/cucumber-face-wash/2.png",
    "/product-details/cucumber-face-wash/3.png",
    "/product-details/cucumber-face-wash/4.png",
    "/product-details/cucumber-face-wash/5.png",
    "/product-details/cucumber-face-wash/6.png",
  ];
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const addProduct = () => { addToBag(product.slug); setAdded(true); };

  return (
    <main className="cucumber-page">
      <PremiumHeader />
      <section className="cucumber-product-top">
        <div className="cucumber-gallery">
          <div className="cucumber-gallery-thumbs" aria-label="Cucumber Face Wash product images">
            {galleryImages.map((image, index) => <button className={selectedImage === image ? "active" : ""} onClick={() => setSelectedImage(image)} aria-label={`View product image ${index + 1}`} aria-current={selectedImage === image} key={image}><img src={image} alt="" /></button>)}
          </div>
          <div className="cucumber-gallery-main"><img src={selectedImage} alt="Cucumber Face Wash product detail" /></div>
        </div>
        <div className="cucumber-product-details">
          <div className="cucumber-badges"><b>BESTSELLER</b><span>FRUIT-POWERED CARE</span></div>
          <h1>Cucumber Face Wash</h1>
          <p className="cucumber-product-subtitle">With Vitamin C &amp; Niacinamide</p>
          <p className="cucumber-suitable">Suitable for: <strong>All Skin Types</strong></p>
          <div className="cucumber-rating"><span>★★★★★</span> Loved by everyday skin rituals</div>
          <div className="cucumber-size-row"><span className="selected">100 ml <small>Best value</small></span></div>
          <div className="cucumber-price"><b>₹{product.price}</b><del>₹{product.mrp}</del><span>Save ₹{product.mrp - product.price}</span></div>
          <p className="cucumber-tax">MRP incl. of all taxes</p>
          <div className="cucumber-detail-card"><strong>Helps</strong><div><span>✦ Fresh cleanse</span><span>✦ Excess oil care</span><span>✦ Refreshed glow</span><span>✦ Comfortable hydration</span></div><strong>Targets</strong><div className="targets"><span>Oiliness</span><span>Dullness</span><span>Daily grime</span></div></div>
          <div className="cucumber-delivery"><b>Check for delivery</b><div><input placeholder="Enter your pincode" /><button>Check</button></div></div>
          <div className="cucumber-offer"><b>Available offer</b><strong>Flat 15% OFF</strong><small>On your first ritual · Use code: GLOW15</small></div>
          <button className="cucumber-add primary" onClick={addProduct}>{added ? "ADDED TO BAG ✓" : "ADD TO BAG"}</button>
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
