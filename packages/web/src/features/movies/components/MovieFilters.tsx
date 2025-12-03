import { Eye, Clock, Film } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";

interface Props {
  filterStatus: "all" | "watched" | "watchLater";
  setFilterStatus: (s: "all" | "watched" | "watchLater") => void;
  stats: { total: number; watched: number; watchLater: number };
  disabled: boolean;
}

export function MovieFilters({
  filterStatus,
  setFilterStatus,
  stats,
  disabled,
}: Props) {
  return (
    <div className="flex justify-center gap-2 flex-wrap">
      <Button
        variant={filterStatus === "all" ? "default" : "outline"}
        disabled={disabled}
        size="sm"
        onClick={() => setFilterStatus("all")}
        className="gap-2 h-9 px-4 rounded-lg font-medium transition-all hover:scale-105"
      >
        <Film className="w-4 h-4" />
        Todas
        <span className="ml-1 px-2 py-0.5 bg-background/20 rounded-full text-xs font-bold">
          {stats.total}
        </span>
      </Button>
      <Button
        variant={filterStatus === "watched" ? "default" : "outline"}
        disabled={disabled}
        size="sm"
        onClick={() => setFilterStatus("watched")}
        className="gap-2 h-9 px-4 rounded-lg font-medium transition-all hover:scale-105"
      >
        <Eye className="w-4 h-4" />
        Vistas
        <span className="ml-1 px-2 py-0.5 bg-background/20 rounded-full text-xs font-bold">
          {stats.watched}
        </span>
      </Button>
      <Button
        variant={filterStatus === "watchLater" ? "default" : "outline"}
        disabled={disabled}
        size="sm"
        onClick={() => setFilterStatus("watchLater")}
        className="gap-2 h-9 px-4 rounded-lg font-medium transition-all hover:scale-105"
      >
        <Clock className="w-4 h-4" />
        Pendientes
        <span className="ml-1 px-2 py-0.5 bg-background/20 rounded-full text-xs font-bold">
          {stats.watchLater}
        </span>
      </Button>
    </div>
  );
}
