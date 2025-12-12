import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import fadyLogo from "@/assets/fady-logo.png";

const WELCOME_SHOWN_KEY = "fady_welcome_shown";

const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasShown = sessionStorage.getItem(WELCOME_SHOWN_KEY);
    if (!hasShown) {
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem(WELCOME_SHOWN_KEY, "true");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTalkToEarn = () => {
    window.open("https://kabejjasystems.store", "_blank");
    setOpen(false);
  };

  const handleSkip = () => {
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center max-w-md w-full space-y-8">
        <img src={fadyLogo} alt="Fady Technologies" className="h-24 w-auto" />
        
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Welcome to Fady Technologies!</h1>
          <p className="text-muted-foreground">
            Would you like to talk to <span className="font-semibold text-primary">Earn</span>, 
            the developer who made this app?
          </p>
        </div>
        
        <div className="flex flex-col gap-3 w-full">
          <Button 
            onClick={handleTalkToEarn} 
            className="w-full gap-2"
            size="lg"
          >
            <MessageCircle className="w-5 h-5" />
            Yes, Talk to Earn
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSkip}
            className="w-full"
            size="lg"
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          All prices are in Ugandan Shillings (UGX)
        </p>
      </div>
    </div>
  );
};

export default WelcomeDialog;
