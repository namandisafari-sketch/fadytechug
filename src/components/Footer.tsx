const Footer = () => {
  return (
    <footer className="w-full border-t bg-background py-8">
      <div className="container flex flex-col items-center justify-center gap-4">
        <p className="text-3xl md:text-4xl font-bold">
          Made with ❤️ by{" "}
          <a 
            href="https://kabejjasystems.store" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Earn
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Fady Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
