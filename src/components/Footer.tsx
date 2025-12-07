import { Facebook, Instagram, Linkedin } from "lucide-react";

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: XIcon, href: "#", label: "X" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background py-8">
      <div className="container flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-4">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
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