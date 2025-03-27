
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    setIsAuthenticated(false);
    toast.success("Déconnecté avec succès");
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-50 w-full glass-container bg-white/90 backdrop-blur-md border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="md:hidden p-0 w-10 h-10"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <a href="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-xl text-primary">ProductFlow</span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/dashboard" ? "text-primary" : "text-foreground/70"
            }`}
          >
            Projets
          </a>
          {location.pathname.includes("/project/") && (
            <>
              <a
                href={`${location.pathname}?tab=specification`}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.search.includes("specification") || !location.search
                    ? "text-primary"
                    : "text-foreground/70"
                }`}
              >
                Spécifications
              </a>
              <a
                href={`${location.pathname}?tab=epics`}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.search.includes("epics") ? "text-primary" : "text-foreground/70"
                }`}
              >
                EPICs
              </a>
              <a
                href={`${location.pathname}?tab=stories`}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.search.includes("stories") ? "text-primary" : "text-foreground/70"
                }`}
              >
                User Stories
              </a>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-red-100 hover:text-red-600 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 flex flex-col space-y-4">
            <a
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/dashboard" ? "text-primary" : "text-foreground/70"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Projets
            </a>
            {location.pathname.includes("/project/") && (
              <>
                <a
                  href={`${location.pathname}?tab=specification`}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.search.includes("specification") || !location.search
                      ? "text-primary"
                      : "text-foreground/70"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Spécifications
                </a>
                <a
                  href={`${location.pathname}?tab=epics`}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.search.includes("epics") ? "text-primary" : "text-foreground/70"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  EPICs
                </a>
                <a
                  href={`${location.pathname}?tab=stories`}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.search.includes("stories") ? "text-primary" : "text-foreground/70"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  User Stories
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
