import { Button } from "@/components/ui/button"
import { Eye, Clock } from "lucide-react"

interface Props {
  filterStatus: "all" | "watched" | "watchLater"
  setFilterStatus: (s: "all" | "watched" | "watchLater") => void
  stats: { total: number; watched: number; watchLater: number }
}

export function MovieFilters({ filterStatus, setFilterStatus, stats }: Props) {
  return (
    <div className="flex justify-center gap-2 flex-wrap">
      <Button variant={filterStatus === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterStatus("all")}>
        Todas ({stats.total})
      </Button>
      <Button variant={filterStatus === "watched" ? "default" : "outline"} size="sm" onClick={() => setFilterStatus("watched")} className="gap-1">
        <Eye className="w-4 h-4" /> Vistas ({stats.watched})
      </Button>
      <Button variant={filterStatus === "watchLater" ? "default" : "outline"} size="sm" onClick={() => setFilterStatus("watchLater")} className="gap-1">
        <Clock className="w-4 h-4" /> Ver Después ({stats.watchLater})
      </Button>
    </div>
  )
}
