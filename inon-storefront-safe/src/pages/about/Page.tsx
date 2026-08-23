import { useEffect, useState } from "react";
import { PremiumFooter, PremiumHeader } from "../../components/Shell";

const aboutHeroImages = [
  ["/about-hero/cucumber-facewash.png", "Cucumber Face Wash"],
  ["/about-hero/mango-sunscreen.png", "Mango Sunscreen"],
  ["/about-hero/orange-moisturizer.png", "Orange Moisturizer"],
  ["/about-hero/strawberry-face-serum.png", "Strawberry Face Serum"],
  ["/about-hero/watermelon-face-wash.png", "Watermelon Face Wash"],
] as const;

export default function About() {
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % aboutHeroImages.length), 2000);
    return () => window.clearInterval(timer);
  }, []);
  return <main>
    <PremiumHeader />
    <section className="editorial-hero about-hero about-carousel" aria-label="In&On skincare collection">
      <div className="about-hero-slides" aria-hidden="true">
        {aboutHeroImages.map(([src, alt], index) => <img className={index === heroIndex ? "about-hero-slide active" : "about-hero-slide"} src={src} alt="" key={src} />)}
      </div>
      <div className="about-hero-content"><p className="eyebrow">THE IN&ON POINT OF VIEW</p><h1>Skincare that<br /><em>feels like you.</em></h1><p>We make joyful, effective formulas for the everyday Indian skin ritual: uncomplicated, ingredient-led and made to be loved consistently.</p></div>
      <div className="about-hero-dots" aria-label="Hero image selection">{aboutHeroImages.map(([_, alt], index) => <button aria-label={`Show ${alt}`} aria-current={index === heroIndex} className={index === heroIndex ? "active" : ""} onClick={() => setHeroIndex(index)} key={alt} />)}</div>
    </section>
    <section className="about-grid"><div className="about-image"><img src="/products/serum.jpg" alt="In&On strawberry serum" /></div><div><p className="eyebrow red">WHY IN&ON</p><h2>Effective care<br /><em>without the ego.</em></h2><p>Good skincare should be easy to understand and even easier to reach for. We pair familiar fruit extracts with proven actives, thoughtful textures and a little more optimism.</p><div className="about-notes"><span><b>01</b>Fruit-powered</span><span><b>02</b>Active-led</span><span><b>03</b>Made for real routines</span></div></div></section>
    <section className="about-purpose"><div><p className="eyebrow red">OUR MISSION</p><h2>Make everyday care feel <em>possible.</em></h2><p>Our mission is to take the pressure out of skincare. We create clear, comfortable formulas that help people understand their skin, build a ritual they can keep, and feel a little more at home in themselves every day.</p></div><div><p className="eyebrow red">OUR VISION</p><h2>A brighter standard for <em>real skin.</em></h2><p>We imagine a skincare world that celebrates every texture, tone and season. In&On is here to make effective care more joyful, more inclusive and easier to return to, one honest formula at a time.</p></div></section>
    <section className="about-values"><p className="eyebrow">OUR PROMISE</p><h2>Small formulas.<br /><em>Clear purpose.</em></h2><div><article><b>01</b><h3>Nothing to decode</h3><p>Every ingredient has a job, every product has a place in your ritual.</p></article><article><b>02</b><h3>Daily skin, considered</h3><p>Comfortable textures and balanced actives made for consistency.</p></article><article><b>03</b><h3>Joy is part of the formula</h3><p>Because taking care of yourself should feel like a bright spot.</p></article></div></section>
    <PremiumFooter />
  </main>;
}
