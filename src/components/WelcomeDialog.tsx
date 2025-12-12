import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WELCOME_SHOWN_KEY = "fady_welcome_shown";

const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if we've shown the welcome dialog in this session
    const hasShown = sessionStorage.getItem(WELCOME_SHOWN_KEY);
    if (!hasShown) {
      // Small delay for better UX
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Welcome to Fady Technologies!</DialogTitle>
          <DialogDescription className="text-base">
            Would you like to talk to <span className="font-semibold text-primary">Earn</span>, 
            the developer who made this app?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
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

        <p className="text-center text-xs text-muted-foreground mt-4">
          All prices are in Ugandan Shillings (UGX)
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
