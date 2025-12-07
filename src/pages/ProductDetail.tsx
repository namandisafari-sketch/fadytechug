import { useParams, Link } from "react-router-dom";
import { Share2, Heart, Shield, Truck, Package, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import InquiryForm from "@/components/InquiryForm";
import { getProductById } from "@/data/products";

const ProductDetail = () => {
  const { id } = useParams();
  const product = getProductById(id || "");

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <div className="mb-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            Home
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">{product.category}</span>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm">Product Details</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video overflow-hidden rounded-t-lg bg-secondary relative">
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-contain"
                  />
                  {!product.inStock && (
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{product.category}</Badge>
                        {product.inStock && (
                          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            In Stock
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-3xl font-bold mb-2">
                        {product.title}
                      </h1>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-4xl font-bold text-primary">{product.price}</div>

                  <div className="border-t pt-4">
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h2 className="text-xl font-semibold mb-3">Specifications</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {product.specifications.map((spec) => (
                        <div key={spec.label} className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">{spec.label}</span>
                          <span className="font-medium">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">Inquire About This Product</h3>
                <p className="text-sm text-muted-foreground">
                  Interested in this product? Send us a message and we'll get back to you within 24 hours.
                </p>
                <InquiryForm productTitle={product.title} productId={product.id} />
              </CardContent>
            </Card>

            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">Why Buy From Us</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Quality guaranteed products
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Expert technical support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Warranty on all items
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Competitive pricing
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Shipping Available</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We offer nationwide shipping. Contact us for shipping rates and delivery times.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Bulk Orders</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Need multiple units? Contact us for bulk pricing and enterprise solutions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
