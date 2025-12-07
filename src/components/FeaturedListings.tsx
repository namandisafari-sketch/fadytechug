import ProductCard from "./ProductCard";
import { products } from "@/data/products";

const FeaturedListings = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Our Products</h2>
          <button className="text-primary hover:underline font-medium">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              id={product.id}
              title={product.title}
              price={product.price}
              image={product.image}
              category={product.category}
              inStock={product.inStock}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
