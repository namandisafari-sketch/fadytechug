import { useParams, Link } from "react-router-dom";
import { MapPin, Clock, Share2, Heart, Phone, Mail, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import routerImage from "@/assets/product-router.jpg";

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
          <span className="text-sm text-muted-foreground">Routers</span>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm">Product Details</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video overflow-hidden rounded-t-lg bg-secondary">
                  <img 
                    src={routerImage} 
                    alt="Cisco ISR 4321 Router" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        Cisco ISR 4321 Router - Enterprise Grade
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

                  <div className="text-4xl font-bold text-primary">$1,299</div>

                  <div className="border-t pt-4">
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Selling a Cisco ISR 4321 Integrated Services Router in excellent working condition. 
                      This enterprise-grade router supports up to 50 Mbps aggregate throughput and includes 
                      2 onboard GE, 2 NIM slots, and 4 GB Flash Memory. Perfect for small to medium business 
                      networks. Comes with power cable and console cable. Factory reset and ready for 
                      configuration. Warranty available.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h2 className="text-xl font-semibold mb-3">Specifications</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Brand</span>
                        <span className="font-medium">Cisco</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Model</span>
                        <span className="font-medium">ISR 4321</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Ports</span>
                        <span className="font-medium">2x GE WAN/LAN</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Memory</span>
                        <span className="font-medium">4 GB Flash</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Throughput</span>
                        <span className="font-medium">50 Mbps</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Condition</span>
                        <span className="font-medium">Excellent</span>
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
                    <span className="text-lg font-semibold text-primary">NT</span>
                  </div>
                  <div>
                    <p className="font-semibold">NetTech Solutions</p>
                    <p className="text-sm text-muted-foreground">Verified Seller • Since 2021</p>
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

            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">Buyer Protection</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Test equipment before purchase
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Verify serial numbers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Request warranty documentation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Meet in public locations
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
                  Seller offers nationwide shipping. Contact for shipping rates.
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
