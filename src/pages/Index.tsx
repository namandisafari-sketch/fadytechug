import { useState, useMemo, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";
import PWAHeader from "@/components/PWAHeader";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  description: string | null;
  stock_quantity: number;
}

const Index = () => {
  const { isStandalone } = usePWA();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url, category, description, stock_quantity")
        .eq("is_active", true)
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

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
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products available.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.name}
                  price={formatCurrency(product.price)}
                  image={product.image_url || "/placeholder.svg"}
                  category={product.category}
                  inStock={product.stock_quantity > 0}
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
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <Hero />
      <Categories />
      <FeaturedListings />
      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default Index;
