import { useState, useMemo } from "react";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";
import { products } from "@/data/products";

const FeaturedListings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))];
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Our Products</h2>
        </div>

        <div className="mb-8">
          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No products found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
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
        )}
      </div>
    </section>
  );
};

export default FeaturedListings;