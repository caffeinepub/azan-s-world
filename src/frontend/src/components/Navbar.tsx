import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Search, Settings, Upload } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

export function Navbar() {
  const { login, clear, identity, isLoggingIn } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      void navigate({ to: "/", search: { q: searchValue.trim() } });
    } else {
      void navigate({ to: "/", search: { q: undefined } });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link
          to="/"
          search={{ q: undefined }}
          className="flex items-center gap-2 shrink-0"
        >
          <img
            src="/assets/uploads/image-1.png"
            alt="Azan's World"
            className="w-8 h-8 object-contain"
          />
          <span className="font-display font-bold text-xl hidden sm:block">
            Azan's <span className="text-primary">World</span>
          </span>
        </Link>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-xl mx-auto flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="nav.search_input"
              type="text"
              placeholder="Search videos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 bg-secondary border-border focus-visible:ring-primary"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="icon"
            className="shrink-0"
          >
            <Search className="w-4 h-4" />
          </Button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {identity && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/upload" data-ocid="nav.upload_link">
                <Upload className="w-4 h-4" />
                Upload
              </Link>
            </Button>
          )}
          {isAdmin && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/admin" data-ocid="nav.admin_link">
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            </Button>
          )}
          {identity ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="gap-2 border-border"
              data-ocid="nav.login_button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={login}
              disabled={isLoggingIn}
              className="gap-2 bg-primary hover:bg-primary/90"
              data-ocid="nav.login_button"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isLoggingIn ? "Connecting..." : "Login"}
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
