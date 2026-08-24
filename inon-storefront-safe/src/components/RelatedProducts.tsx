import { useEffect, useState } from "react";
import { loadCatalog, type CatalogProduct } from "../catalog";

export default function RelatedProducts({ currentSlug }: { currentSlug: string }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  useEffect(() => { loadCatalog().then((items) => setProducts(items.filter((item) => item.slug !== currentSlug).slice(0, 4))); }, [currentSlug]);
  return <section className="product-recommendations"><div className="recommendation-heading"><p className="eyebrow red">KEEP EXPLORING</p><h2>Complete your <em>ritual.</em></h2><p>Pair your current favourite with another focused formula from the In&amp;On shelf.</p></div><div className="recommendation-grid">{products.map((item) => <a className="recommendation-card" href={`/products/${item.slug}`} key={item.slug} style={{ background: item.tone }}><img src={item.image} alt={item.name} /><span>{item.category}</span><h3>{item.name}</h3><b>₹{item.price} <small>View product →</small></b></a>)}</div></section>;
}
