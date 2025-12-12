import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, Apple, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
              <Download className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Install Fady Technologies</h1>
            <p className="text-xl text-muted-foreground">
              Get the best experience by installing our app on your device
            </p>
          </div>

          {/* Already Installed */}
          {isInstalled && (
            <Card className="border-green-500 bg-green-500/10">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
                  <Smartphone className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-green-600">App Already Installed!</h3>
                <p className="text-muted-foreground mt-2">
                  You're already using the installed version of our app.
                </p>
              </CardContent>
            </Card>
          )}

          {/* One-Click Install (Android/Desktop Chrome) */}
          {!isInstalled && deferredPrompt && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="pt-6 text-center">
                <Button size="lg" onClick={handleInstallClick} className="gap-2">
                  <Download className="w-5 h-5" />
                  Install App Now
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Click the button above to install the app instantly
                </p>
              </CardContent>
            </Card>
          )}

          {/* iOS Instructions */}
          {isIOS && !isInstalled && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Apple className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Install on iPhone/iPad</CardTitle>
                    <CardDescription>Follow these simple steps</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Tap the Share button</h4>
                      <p className="text-sm text-muted-foreground">
                        At the bottom of Safari, tap the Share icon (square with arrow pointing up)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Scroll and find "Add to Home Screen"</h4>
                      <p className="text-sm text-muted-foreground">
                        Scroll down in the share menu and tap "Add to Home Screen"
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Tap "Add"</h4>
                      <p className="text-sm text-muted-foreground">
                        Confirm by tapping "Add" in the top right corner
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Android Instructions */}
          {!isIOS && !isInstalled && !deferredPrompt && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Chrome className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Install on Android</CardTitle>
                    <CardDescription>Follow these simple steps</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Tap the menu button</h4>
                      <p className="text-sm text-muted-foreground">
                        Tap the three dots (⋮) in the top right corner of Chrome
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Select "Add to Home screen"</h4>
                      <p className="text-sm text-muted-foreground">
                        Find and tap "Add to Home screen" or "Install app"
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Confirm installation</h4>
                      <p className="text-sm text-muted-foreground">
                        Tap "Add" or "Install" to confirm
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desktop Instructions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Monitor className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Install on Desktop</CardTitle>
                  <CardDescription>Chrome, Edge, or other browsers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Look for the install icon</h4>
                    <p className="text-sm text-muted-foreground">
                      In Chrome, look for the install icon (⊕) in the address bar, or click the menu (⋮)
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Click "Install Fady Technologies"</h4>
                    <p className="text-sm text-muted-foreground">
                      Select the install option from the menu
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Confirm and enjoy!</h4>
                    <p className="text-sm text-muted-foreground">
                      The app will open in its own window and be available from your desktop
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Why Install?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-medium">Faster access</h4>
                    <p className="text-sm text-muted-foreground">Launch instantly from your home screen</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-medium">Works offline</h4>
                    <p className="text-sm text-muted-foreground">Browse products even without internet</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-medium">Full screen experience</h4>
                    <p className="text-sm text-muted-foreground">No browser bars taking up space</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-medium">Always up to date</h4>
                    <p className="text-sm text-muted-foreground">Get the latest features automatically</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Install;
