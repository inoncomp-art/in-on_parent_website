import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Home from "./Home";
import Shop from "./pages/shop/Page";
import Blog from "./pages/blog/Page";
import Article from "./pages/blog/Article";
import Login from "./pages/login/Page";
import Signup from "./pages/signup/Page";
import Account from "./pages/account/Page";
import ProductStory from "./components/ProductStory";
import CucumberProductPage from "./components/CucumberProductPage";
import ProductDetailsPage from "./components/ProductDetailsPage";
import { getProduct, loadCatalogProduct, type CatalogProduct } from "./catalog";
import About from "./pages/about/Page";
import Contact from "./pages/contact/Page";
import { hasStoredSession } from "./lib/api";

function ProductRoute() {
  const { slug = "" } = useParams();
  const [product, setProduct] = useState<CatalogProduct | undefined>(() => getProduct(slug));

  useEffect(() => {
    let alive = true;
    if (!slug) {
      setProduct(undefined);
      return;
    }

    loadCatalogProduct(slug).then((remote) => {
      if (alive) {
        setProduct(remote ?? getProduct(slug));
      }
    });

    return () => {
      alive = false;
    };
  }, [slug]);

  return product ? (product.slug === "cucumber-face-wash" ? <CucumberProductPage product={product} /> : ["strawberry-serum", "watermelon-face-wash", "orange-moisturizer", "mango-sunscreen"].includes(product.slug) ? <ProductDetailsPage product={product} /> : <ProductStory product={product} />) : <main><section className="empty-state account-guard"><b>404</b><h3>That formula could not be found.</h3><p>Explore the full shelf to find your next ritual.</p><a className="primary" href="/shop">Shop all products →</a></section></main>;
}

function ProtectedAccount() {
  return hasStoredSession() ? <Account /> : <Navigate to="/login?next=/account" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/products/:slug" element={<ProductRoute />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<Article />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/account" element={<ProtectedAccount />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
