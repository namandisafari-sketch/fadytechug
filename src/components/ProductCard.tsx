import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  image: string;
  category?: string;
  inStock?: boolean;
}

const ProductCard = ({ id, title, price, image, category, inStock = true }: ProductCardProps) => {
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
        <CardContent className="p-4 space-y-2">
          {category && (
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
          )}
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-2xl font-bold text-primary">{price}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
