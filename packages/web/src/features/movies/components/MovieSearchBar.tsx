import { Search } from "lucide-react";
import { Input } from "../../../shared/components/ui/input";
import { Button } from "../../../shared/components/ui/button";

interface Props {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  performSearch: (query: string) => void;
  className?: string;
}

export function MovieSearchBar({
  searchTerm,
  setSearchTerm,
  performSearch,
  className = "",
}: Props) {
  // Al hacer submit, actualiza el término real de búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  // Permitir también búsqueda con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch(searchTerm);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`flex w-full justify-center ${className ?? ""}`}
      autoComplete="off"
    >
      <div className="relative flex w-full max-w-2xl">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Buscar películas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-4 h-11 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm focus:bg-background transition-all shadow-sm"
        />
        <Button
          type="submit"
          className="ml-2 h-11 px-6 rounded-lg gap-2 font-medium shadow-sm hover:shadow-md transition-all"
        >
          <>
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Buscar</span>
          </>
        </Button>
      </div>
    </form>
  );
}
