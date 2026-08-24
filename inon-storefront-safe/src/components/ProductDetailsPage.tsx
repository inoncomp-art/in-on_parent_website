import { type CSSProperties, useState } from "react";
import { PremiumFooter, PremiumHeader } from "./Shell";
import { addToBag } from "../lib/shopState";
import type { CatalogProduct } from "../catalog";
import RelatedProducts from "./RelatedProducts";

type ProductDetails = { background: string; subtitle: string; heroClaim: string; heroDescription: string; benefits: string[]; daily: string[]; ingredients: [string, string][]; steps: string[]; tip: string };

const details: Record<string, ProductDetails> = {
  "strawberry-serum": {
    background: "/strawberry-cleanser.png", subtitle: "With Salicylic Acid & Niacinamide", heroClaim: "Smooth & Healthy Skin", heroDescription: "Helps reduce excess oil and gently unclog pores for a fresher, brighter-looking complexion.",
    benefits: ["Enriched with Niacinamide for smoother-looking skin texture", "Supports brighter-looking skin with Alpha Arbutin", "Helps soothe & comfort skin with Allantoin & Glycerin", "Infused with Licorice Extract for refreshed skin appearance"],
    daily: ["Helps reduce excess oil", "Gently unclogs the look of pores", "Supports a smoother, brighter-looking complexion", "Lightweight hydration without greasiness"],
    ingredients: [["Alpha arbutin", "Brightens skin & reduces the appearance of dark spots"], ["Niacinamide", "Improves skin barrier and minimizes pores & evens skin tone"], ["Allantoin", "Helps soothe and comfort skin"], ["Licorice extract", "Supports a refreshed, even-looking appearance"]],
    steps: ["Apply 3–4 drops on clean face & neck", "Gently massage using fingertips in circular motions", "Let it absorb completely into the skin"], tip: "Follow with your favourite moisturizer. Use daily, AM & PM, for best results.",
  },
  "watermelon-face-wash": {
    background: "/watermelon-facewash.png", subtitle: "With AHA-BHA-PHA & Niacinamide", heroClaim: "Oil Control & Instant Glow", heroDescription: "A daily gentle formula that cleanses effectively while leaving skin fresh, balanced and comfortable.",
    benefits: ["Controls excess oil for balanced, fresh-looking skin", "Unclogs pores by removing dirt, oil & impurities", "Helps reduce active acne & prevent new breakouts", "Smoothens uneven skin texture for a healthy glow", "Soothes redness & irritation for calm, refreshed skin"],
    daily: ["Promotes brighter, fresher & more radiant-looking skin", "Cleanses effectively without leaving skin feeling tight or stripped", "Suitable for daily use", "Made for an everyday cleansing ritual"],
    ingredients: [["Watermelon", "Helps deeply cleanse the skin by removing excess oil & impurities"], ["Niacinamide", "Calming redness & discomfort associated with mild acne"], ["Allantoin", "Helps reduce dryness caused by acne treatments"], ["Salicylic acid", "Helps improve the appearance of dull, tired-looking skin"]],
    steps: ["Take a coin-sized amount of face wash", "Gently massage in circular motions", "Rinse with water and pat dry"], tip: "Use daily as the first step of your simple cleanse ritual.",
  },
  "orange-moisturizer": {
    background: "/orange-moisturizer.png", subtitle: "With Niacinamide & Glycerin", heroClaim: "Lightweight Gel Formula", heroDescription: "A silky daily moisturizer for lasting hydration, soft smooth skin and a naturally brighter-looking complexion.",
    benefits: ["Delivers lasting hydration for soft, smooth & comfortable skin", "Promotes a brighter, healthier-looking complexion with regular use", "Fast-absorbing, non-greasy formula that supports a healthy skin barrier", "Helps improve skin texture while leaving skin soft & supple"],
    daily: ["Intense moisture boost for everyday comfort", "Radiance-enhancing care for a brighter-looking complexion", "Lightweight gel texture with a fast-absorbing finish", "Silky-smooth feel that leaves skin soft & supple"],
    ingredients: [["Orange extract", "Helps keep skin fresh, soft & naturally radiant"], ["Glycerin", "Provides comfortable daily hydration"], ["Allantoin", "Helps soothe and improve skin softness"], ["Niacinamide", "Helps strengthen the skin barrier for a smoother look"]],
    steps: ["Wet your face and splash with water", "Apply moisturizer and massage gently", "Use twice daily for best results"], tip: "Apply after cleansing while skin is slightly damp.",
  },
  "mango-sunscreen": {
    background: "/mango-sunscreen.png", subtitle: "With Niacinamide · Broad Spectrum UVA & UVB", heroClaim: "Lightweight SPF for daily use", heroDescription: "Comfortable sun protection that helps keep skin hydrated, soft and moisturized throughout the day.",
    benefits: ["Provides broad spectrum UVA & UVB sun protection", "Helps keep skin hydrated, soft & moisturized throughout", "Enriched with Vitamin C for brighter-looking skin appearance", "Supports a healthy skin barrier with Niacinamide & Allantoin"],
    daily: ["Powerful antioxidant care for radiant, healthy-looking skin", "Hydrates while protecting through the day", "Lightweight and non-greasy for comfortable daily use", "Maximum sun defense with broad spectrum UVA & UVB protection"],
    ingredients: [["Niacinamide", "Helps lock in moisture & improves skin texture"], ["3-O-Ethyl ascorbic acid", "Brightens dull skin while supporting long-lasting hydration"], ["Allantoin", "Soothes, moisturizes & softens skin"], ["Mango extract", "Adds familiar fruit-powered care to the daily ritual"]],
    steps: ["Cleanse your face with clean, dry skin", "Apply an adequate amount of sunscreen evenly on face & neck", "Reapply every 2–3 hours for best protection"], tip: "Use daily, even on cloudy days, as the final morning step.",
  },
};

export default function ProductDetailsPage({ product }: { product: CatalogProduct }) {
  const config = details[product.slug] || details["watermelon-face-wash"];
  const galleryImages = Array.from({ length: 5 }, (_, index) => `/product-details/${product.slug}/${index + 2}.png`);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const addProduct = () => { addToBag(product.slug); setAdded(true); };
  return <main className="cucumber-page" style={{ "--product-background": `url(${config.background})`, "--product-tone": product.tone, "--product-accent": product.accent } as CSSProperties}>
    <PremiumHeader />
    <section className="cucumber-product-top">
      <div className="cucumber-gallery"><div className="cucumber-gallery-thumbs" aria-label={`${product.name} product images`}>{galleryImages.map((image, index) => <button className={selectedImage === image ? "active" : ""} onClick={() => setSelectedImage(image)} aria-label={`View product image ${index + 1}`} aria-current={selectedImage === image} key={image}><img src={image} alt="" /></button>)}</div><div className="cucumber-gallery-main"><img src={selectedImage} alt={`${product.name} product detail`} /></div></div>
      <div className="cucumber-product-details"><div className="cucumber-badges"><b>BESTSELLER</b><span>FRUIT-POWERED CARE</span></div><h1>{product.name}</h1><p className="cucumber-product-subtitle">{config.subtitle}</p><p className="cucumber-suitable">Suitable for: <strong>All Skin Types</strong></p><div className="cucumber-rating"><span>★★★★★</span> Loved by everyday skin rituals</div><div className="cucumber-size-row"><span className="selected">{product.slug === "mango-sunscreen" ? "100 ml" : product.slug === "strawberry-serum" ? "30 ml" : "100 ml"}<small>Best value</small></span></div><div className="cucumber-price"><b>₹{product.price}</b><del>₹{product.mrp}</del><span>Save ₹{product.mrp - product.price}</span></div><p className="cucumber-tax">MRP incl. of all taxes</p><div className="cucumber-detail-card"><strong>Helps</strong><div>{config.daily.slice(0, 4).map((item) => <span key={item}>✦ {item}</span>)}</div><strong>Targets</strong><div className="targets"><span>Daily care</span><span>{product.category}</span><span>All skin types</span></div></div><div className="cucumber-delivery"><b>Check for delivery</b><div><input value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Enter your pincode" /><button type="button" onClick={() => setDeliveryMessage(pincode.length === 6 ? "Delivery available to your pincode" : "Enter a valid 6-digit pincode")}>Check</button></div>{deliveryMessage ? <small>{deliveryMessage}</small> : null}</div><div className="cucumber-offer"><b>Available offer</b><strong>Flat 15% OFF</strong><small>On your first ritual · Use code: GLOW15</small></div><button className="cucumber-add primary" onClick={addProduct}>{added ? "ADDED TO BAG ✓" : "ADD TO BAG"}</button></div>
    </section>
    <section className="cucumber-section cucumber-daily"><div><p className="eyebrow red">COMPLETE DAILY FACE CARE</p><h2>{config.heroClaim}<br /><em>Clear daily support.</em></h2><p className="cucumber-support-copy">{config.heroDescription}</p></div><div className="cucumber-daily-list">{config.daily.map((item, index) => <article key={item}><b>0{index + 1}</b><span>{item}</span></article>)}</div></section>
    <section className="cucumber-section cucumber-ingredients"><div className="cucumber-section-intro"><p className="eyebrow red">INSIDE THE FORMULA</p><h2>Familiar actives.<br /><em>Clear purpose.</em></h2></div><div className="cucumber-ingredient-grid">{config.ingredients.map(([name, text]) => <article key={name}><span>ACTIVE</span><h3>{name}</h3><p>{text}</p></article>)}</div></section>
    <section className="cucumber-section cucumber-howto"><div><p className="eyebrow">HOW TO USE</p><h2>Your simple<br /><em>daily ritual.</em></h2></div><ol>{config.steps.map((step, index) => <li key={step}><b>0{index + 1}</b><span>{step}</span></li>)}</ol></section>
    <section className="cucumber-results"><div><p className="eyebrow red">VISIBLE RESULTS</p><h2>Care you can<br /><em>feel in your rhythm.</em></h2><p>{config.tip}</p><small>*Based on study conducted at our facility</small></div><img src={`/product-details/${product.slug}/7.png`} alt={`${product.name} product results`} /></section>
    <section className="cucumber-bottom-cta"><p className="eyebrow">READY FOR A FRESH START?</p><h2>Simple care.<br /><em>Visible comfort.</em></h2><button className="primary" onClick={addProduct}>{added ? "In your bag ✓" : `Add ${product.name} · ₹${product.price}`}</button></section><RelatedProducts currentSlug={product.slug} /><PremiumFooter />
  </main>;
}
