import fadyLogo from "@/assets/fady-logo.png";

const PWASplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="animate-pulse">
        <img 
          src={fadyLogo} 
          alt="Fady Technologies" 
          className="h-32 w-auto"
        />
      </div>
      <div className="mt-8 flex gap-1">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
};

export default PWASplashScreen;
