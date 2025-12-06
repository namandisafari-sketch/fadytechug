import { Menu, Plus, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Wifi className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">NetShop</span>
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
