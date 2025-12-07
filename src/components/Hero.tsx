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
          backgroundImage: `linear-gradient(135deg, rgba(0, 40, 80, 0.85), rgba(0, 100, 150, 0.75)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white/90 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Quality Network Equipment Store
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white max-w-4xl leading-tight">
            Professional Network Equipment
          </h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Shop routers, switches, cables, servers, and more with expert support
          </p>
          
          <div className="w-full max-w-2xl flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search routers, switches, cables..." 
                className="pl-12 h-14 bg-background border-0 shadow-lg text-base"
              />
            </div>
            <Button size="lg" className="h-14 px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
              Search
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-white/80 text-sm">
            <span>Popular:</span>
            <button className="hover:text-white transition-colors">Cisco Routers</button>
            <button className="hover:text-white transition-colors">Cat6 Cables</button>
            <button className="hover:text-white transition-colors">Network Switches</button>
            <button className="hover:text-white transition-colors">Fiber Optics</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
