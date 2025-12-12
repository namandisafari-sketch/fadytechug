import { useState, useMemo } from "react";
import { usePWA } from "@/hooks/usePWA";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";
import PWAHeader from "@/components/PWAHeader";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Index = () => {
  const { isStandalone } = usePWA();
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

  // PWA Mode - App-like interface
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PWAHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        
        {/* Category Pills */}
        <div className="sticky top-[73px] z-40 bg-background border-b">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            <Button
              variant={selectedCategory === "" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("")}
              className="flex-shrink-0 rounded-full"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex-shrink-0 rounded-full whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="px-4 py-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
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

        <BottomNavigation />
      </div>
    );
  }

  // Regular Web Mode
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Categories />
      <FeaturedListings />
      <Footer />
    </div>
  );
};

export default Index;
