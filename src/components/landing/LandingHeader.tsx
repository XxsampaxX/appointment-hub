import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AgendyaLogo from "@/components/AgendyaLogo";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Planos", href: "/planos" },
  { label: "Contato", href: "#contato" },
];

export default function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4 md:px-6">
        <AgendyaLogo size="md" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) =>
            l.href.startsWith("/") ? (
              <Link key={l.label} to={l.href}>
                <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  {l.label}
                </Button>
              </Link>
            ) : (
              <Button
                key={l.label}
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleNav(l.href)}
              >
                {l.label}
              </Button>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-sm">
              Entrar
            </Button>
          </Link>
          <Link to="/cadastrar-empresa">
            <Button size="sm" className="rounded-xl text-sm px-5">
              Começar Agora
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 pb-4 pt-2 space-y-1 animate-fade-in">
          {navLinks.map((l) =>
            l.href.startsWith("/") ? (
              <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  {l.label}
                </Button>
              </Link>
            ) : (
              <Button
                key={l.label}
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => handleNav(l.href)}
              >
                {l.label}
              </Button>
            )
          )}
          <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full rounded-xl text-sm">
                Entrar
              </Button>
            </Link>
            <Link to="/cadastrar-empresa" onClick={() => setMobileOpen(false)}>
              <Button className="w-full rounded-xl text-sm">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
