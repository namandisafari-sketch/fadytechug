import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import fadyLogo from "@/assets/fady-logo.png";

interface PWAHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const PWAHeader = ({ searchQuery, onSearchChange }: PWAHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background border-b safe-area-top">
      <div className="flex items-center gap-3 px-4 py-3">
        <img src={fadyLogo} alt="Fady Tech" className="h-10 w-auto flex-shrink-0" />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 bg-muted/50 border-0"
          />
        </div>
      </div>
    </header>
  );
};

export default PWAHeader;
