import { Suspense } from "react";
import ProductListing from "../components/ProductListing";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center">در حال بارگذاری...</div>}>
        <ProductListing />
      </Suspense>
      <Footer />
    </div>
  );
}

