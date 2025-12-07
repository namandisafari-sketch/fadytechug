import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background py-8">
      <div className="container flex flex-col items-center justify-center gap-4">
        <a 
          href="https://kabejjasystems.store" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-3xl md:text-4xl font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Earn
        </a>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Fady Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
