import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface Props {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  performSearch: (query: string) => Promise<void>;
}

export function MovieSearchBar({ searchTerm, setSearchTerm, performSearch }: Props) {
  const [inputValue, setInputValue] = useState(searchTerm);
  const [isLoading] = useState(false);

  // Al hacer submit, actualiza el término real de búsqueda
  const handleSearch = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setSearchTerm(inputValue);
    performSearch(inputValue);
  };

  // Permitir también búsqueda con Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <form
      className="max-w-md mx-auto mb-6"
      onSubmit={handleSearch}
      autoComplete="off"
    >
      <div className="relative flex">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
        <Input
          type="text"
          placeholder="Buscar películas por título o género..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10"
          disabled={isLoading}
        />
        <Button type="submit" className="ml-2" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Buscando...
            </span>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Buscar
            </>
          )}
          
        </Button>
      </div>
    </form>
  );
}
