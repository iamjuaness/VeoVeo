import { Loader2, Film, Eye, Clock } from "lucide-react";

interface Props {
  total: number;
  watched: number;
  watchLater: number;
  loading: boolean;
}

export function Stats({ total, watched, watchLater, loading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 w-full max-w-4xl mx-auto px-2">
      {/* Total */}
      <div className="bg-card/80 backdrop-blur-sm border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
          <Film className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground font-medium">
            Total Catálogo
          </p>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-foreground">
              {total.toLocaleString("es-ES")}
            </h3>
          )}
        </div>
      </div>

      {/* Vistas */}
      <div className="bg-card/80 backdrop-blur-sm border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="p-3 bg-green-500/10 rounded-full text-green-600 group-hover:scale-110 transition-transform">
          <Eye className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground font-medium">Vistas</p>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-green-600 mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-foreground">
              {watched.toLocaleString("es-ES")}
            </h3>
          )}
        </div>
      </div>

      {/* Ver Después */}
      <div className="bg-card/80 backdrop-blur-sm border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="p-3 bg-blue-500/10 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
          <Clock className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground font-medium">
            Pendientes
          </p>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-foreground">
              {watchLater.toLocaleString("es-ES")}
            </h3>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  total: number;
  watched: number;
  watchLater: number;
  loading: boolean;
}
