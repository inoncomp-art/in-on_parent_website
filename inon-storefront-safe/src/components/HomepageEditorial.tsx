import { useState } from "react";
import type { CatalogProduct } from "../catalog";

const fruitStories = [
  ["01", "Cucumber Face Wash", "Vitamin C + Niacinamide", "Refreshes & cleans without stripping.", "01-cucumber-model.png", "/products/cucumber-face-wash", "FRESH START"],
  ["02", "Mango Sunscreen SPF 50", "Niacinamide + SPF 50", "Broad spectrum protection that feels like care.", "02-mango-model.png", "/products/mango-sunscreen", "DAILY DEFENCE"],
  ["03", "Orange Moisturizer", "Niacinamide + Glycerin", "Locks in moisture for a soft, supple glow.", "03-orange-model.png", "/products/orange-moisturizer", "DEEP HYDRATION"],
  ["04", "Strawberry Face Serum", "Salicylic Acid + Niacinamide", "Smooth texture and boost natural radiance.", "04-strawberry-model.png", "/products/strawberry-serum", "RADIANCE"],
  ["05", "Watermelon Face Wash", "AHA · BHA · PHA", "Cleanses pores for an instant fresh start.", "05-watermelon-model.png", "/products/watermelon-face-wash", "OIL CONTROL"],
] as const;

const routine = [
  ["01", "Cleanse", "Cucumber Face Wash", "Refresh, remove impurities and prep your skin.", "AM", "PM"],
  ["02", "Treat", "Strawberry Face Serum", "Target texture and dullness for radiant-looking skin.", "AM", "PM"],
  ["03", "Moisturize", "Orange Moisturizer", "Hydrate and lock in moisture all day.", "AM", "PM"],
  ["04", "Protect", "Mango Sunscreen SPF 50", "Shield from UVA, UVB and blue light.", "AM", ""],
] as const;

const formulas = [
  ["Cucumber", "Vitamin C + Niacinamide", "Refreshes, soothes & brightens.", "01-cucumber-model.png", "/products/cucumber-face-wash"],
  ["Strawberry", "Salicylic Acid + Niacinamide", "Exfoliates gently & smooths texture.", "04-strawberry-model.png", "/products/strawberry-serum"],
  ["Orange", "Niacinamide + Glycerin", "Strengthens barrier & boosts glow.", "03-orange-model.png", "/products/orange-moisturizer"],
  ["Mango", "Niacinamide + SPF 50", "Protects from sun & prevents tan.", "02-mango-model.png", "/products/mango-sunscreen"],
  ["Watermelon", "AHA · BHA · PHA", "Refines pores & controls excess oil.", "05-watermelon-model.png", "/products/watermelon-face-wash"],
] as const;

export default function HomepageEditorial() {
  const [activeRoutine, setActiveRoutine] = useState(0);
  return <>
    <section className="homepage-proof" aria-label="In and On promises"><div><b>♧</b><span>Fruit-first formulas<small>Research-backed actives</small></span></div><div><b>♧</b><span>Made for Indian skin<small>Thoughtful & effective</small></span></div><div><b>♧</b><span>Kind & non-stripping<small>pH-balanced care</small></span></div><div><b>♧</b><span>Dermatologically tested<small>Safe for everyday use</small></span></div><div><b>♡</b><span>Vegan & cruelty-free<small>Because kindness matters</small></span></div></section>
    <section className="fruit-stories" aria-labelledby="fruit-stories-title"><div className="editorial-heading"><p className="eyebrow red">PICK YOUR FRUIT, MEET YOUR ACTIVE</p><h2 id="fruit-stories-title">Real fruit. Real results.</h2><p>Five formulas. Five feels. One happy skin.</p></div><div className="fruit-story-grid">{fruitStories.map(([number, name, active, benefit, image, href, tag]) => <article className="fruit-story" key={name}><img src={`/home-editorial/${image}`} alt={`${name} campaign`} /><div className="fruit-story-copy"><small>{tag}</small><h3>{name}</h3><b>{active}</b><p>{benefit}</p><a href={href}>SHOP NOW <span>→</span></a></div><i>{number}</i></article>)}</div></section>
    <section className="routine-editorial" id="ritual"><div className="routine-visual"><p className="eyebrow red">YOUR ROUTINE, IN</p><h2>FOUR JOYFUL STEPS</h2><p>Simple. Effective. Fruit-powered.</p><img src="/home-editorial/06-complete-lineup.png" alt="Complete In and On five-product lineup" /></div><div className="routine-timeline">{routine.map(([number, title, product, description, am, pm], index) => <div className={`routine-item ${activeRoutine === index ? "active" : ""}`} key={title}><button onClick={() => setActiveRoutine(index)} aria-expanded={activeRoutine === index}><b>{number}</b><span><strong>{title}</strong><small>{am && <i>AM</i>}{pm && <i>PM</i>}</small></span><em>⌄</em></button><div className="routine-detail"><strong>{product}</strong><p>{description}</p></div></div>)}</div></section>
    <section className="campaign-band"><div className="campaign-collage">{["01-cucumber-model.png", "04-strawberry-model.png", "02-mango-model.png", "03-orange-model.png", "05-watermelon-model.png"].map((image) => <img src={`/home-editorial/${image}`} alt="In and On real routine" key={image} />)}</div><div className="campaign-copy"><p className="eyebrow">FOR EVERY KIND OF INDIAN SKIN</p><h2>Real routines.<br /><em>Real radiance.</em></h2><a className="primary light" href="#shop">Discover your routine →</a></div></section>
    <section className="formula-editorial"><div className="editorial-heading formula-intro"><p className="eyebrow red">INSIDE EVERY FORMULA</p><h2>Fruit. Actives.<br /><em>Visible change.</em></h2><p>Thoughtfully blended actives for joyful skin rituals.</p><a href="#shop" className="text-link">See ingredient stories →</a></div><div className="formula-grid">{formulas.map(([fruit, active, benefit, image, href]) => <a href={href} className="formula-card" key={fruit}><img src={`/home-editorial/${image}`} alt={`${fruit} ingredient story`} /><div><b>{fruit}</b><strong>{active}</strong><p>{benefit}</p></div></a>)}</div></section>
  </>;
}

export function HomepageCommunity() {
  const shelfies = [["08-cucumber-watermelon-duo.png", "My morning must-have!", "Rhea S. · Bengaluru"], ["05-watermelon-model.png", "Keep my skin fresh even on humid days.", "Ishita K. · Hyderabad"], ["10-orange-product-hero.png", "Lightweight & super hydrating.", "My skin drinks it up!"], ["09-strawberry-product-hero.png", "Texture improved so much!", "Mehak P. · Delhi"], ["11-mango-product-hero.png", "No white cast, just protection.", "Juhi P. · Pune"]];
  return <section className="shelfie-editorial"><div className="editorial-heading"><p className="eyebrow red">THE IN &amp; ON SHELFIE</p><h2>Real shelves.<br /><em>Real love.</em></h2><p>Tag <b>@inandoncare</b> to get featured.</p><a href="https://www.instagram.com/inandon.care/?hl=en-in" target="_blank" rel="noreferrer" className="text-link">View on Instagram →</a></div><div className="shelfie-grid">{shelfies.map(([image, quote, author]) => <a href="https://www.instagram.com/inandon.care/?hl=en-in" target="_blank" rel="noreferrer" className="shelfie-card" key={quote}><img src={`/home-editorial/${image}`} alt={quote} /><div><p>{quote}</p><small>{author}</small></div></a>)}</div></section>;
}
