import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-marketplace.jpg";

const Hero = () => {
  return (
    <section className="relative w-full py-20 md:py-32 overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white max-w-3xl">
            Find Anything You Need
          </h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Browse thousands of listings from trusted sellers in your area
          </p>
          
          <div className="w-full max-w-2xl flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for products, services, or jobs..." 
                className="pl-10 h-12 bg-background border-0 shadow-lg"
              />
            </div>
            <Button size="lg" className="h-12 px-8 bg-accent hover:bg-accent/90">
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
