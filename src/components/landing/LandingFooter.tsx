import AgendyaLogo from "@/components/AgendyaLogo";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="container px-4 md:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <AgendyaLogo size="sm" />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Agendya. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
