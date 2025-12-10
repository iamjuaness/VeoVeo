import { Search } from "lucide-react";
import { Input } from "../../../shared/components/ui/input";
import { Button } from "../../../shared/components/ui/button";

interface Props {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  performSearch: (query: string) => void;
  className?: string;
}

export function SeriesSearchBar({
  searchTerm,
  setSearchTerm,
  performSearch,
  className = "",
}: Props) {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch(searchTerm);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`relative flex gap-2 ${className}`}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar series..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
        />
      </div>
      <Button type="submit" size="default" className="shrink-0">
        Buscar
      </Button>
    </form>
  );
}
