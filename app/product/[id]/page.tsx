import ProductDetail from "../../components/ProductDetail";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <ProductDetail productId={params.id} />
      <Footer />
    </div>
  );
}


