import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import fadyLogo from "@/assets/fady-logo.png";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <img src={fadyLogo} alt="Fady Technologies" className="h-16 w-auto" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Categories
            </Link>
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Deals
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="default" size="sm" className="hidden md:flex gap-2">
            <Plus className="h-4 w-4" />
            Sell Equipment
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
