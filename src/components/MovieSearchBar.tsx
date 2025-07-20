import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Props {
  searchTerm: string
  setSearchTerm: (val: string) => void
}

export function MovieSearchBar({ searchTerm, setSearchTerm }: Props) {
  return (
    <div className="max-w-md mx-auto mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar películas por título o género..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  )
}
