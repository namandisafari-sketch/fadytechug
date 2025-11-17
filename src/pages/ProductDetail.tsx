import { useParams, Link } from "react-router-dom";
import { MapPin, Clock, Share2, Heart, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import phoneImage from "@/assets/product-phone.jpg";

const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <div className="mb-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            Home
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm">Product Details</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img 
                    src={phoneImage} 
                    alt="Product" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        iPhone 14 Pro Max - 256GB, Excellent Condition
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>Lagos, Nigeria</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Posted 2 hours ago</span>
                        </div>
                      </div>
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

                  <div className="text-4xl font-bold text-primary">$899</div>

                  <div className="border-t pt-4">
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Selling my iPhone 14 Pro Max in excellent condition. The phone has been well 
                      maintained with minimal signs of use. It comes with the original box, charger, 
                      and a protective case. Battery health is at 95%. No scratches on the screen, 
                      and the device is fully functional. Perfect for anyone looking for a premium 
                      smartphone at a great price.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h2 className="text-xl font-semibold mb-3">Specifications</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Storage</span>
                        <span className="font-medium">256GB</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Condition</span>
                        <span className="font-medium">Excellent</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Color</span>
                        <span className="font-medium">Deep Purple</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Battery</span>
                        <span className="font-medium">95%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">Seller Information</h3>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">JS</span>
                  </div>
                  <div>
                    <p className="font-semibold">John Smith</p>
                    <p className="text-sm text-muted-foreground">Member since 2023</p>
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                  <Button className="w-full gap-2" size="lg">
                    <Phone className="h-4 w-4" />
                    Call Seller
                  </Button>
                  <Button variant="outline" className="w-full gap-2" size="lg">
                    <Mail className="h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold">Safety Tips</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Meet in a safe, public location</li>
                  <li>• Check the item before payment</li>
                  <li>• Pay only after collecting item</li>
                  <li>• Report suspicious ads</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
