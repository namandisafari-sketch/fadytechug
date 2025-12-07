import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { products } from "@/data/products";

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  image: string;
  category?: string;
  inStock?: boolean;
}

const ProductCard = ({ id, title, price, image, category, inStock = true }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const product = products.find((p) => p.id === id);
    if (product && product.inStock) {
      addToCart(product);
    }
  };

  return (
    <Link to={`/product/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
        <div className="aspect-square overflow-hidden bg-muted relative">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!inStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">Out of Stock</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          {category && (
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
          )}
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-primary">{price}</p>
            {inStock && (
              <Button 
                size="sm" 
                variant="secondary"
                className="gap-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
                Add
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
