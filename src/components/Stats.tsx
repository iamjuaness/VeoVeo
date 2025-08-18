import { Loader2 } from "lucide-react";

interface Props {
  total: number;
  watched: number;
  watchLater: number;
  loading: boolean;
}

export function Stats({ total, watched, watchLater, loading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 w-full max-w-lg mx-auto">
      {/* Total */}
      <div className="flex flex-col items-center bg-card rounded-lg py-3 shadow">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <div className="text-2xl font-bold text-primary">
            {total.toLocaleString("es-ES")}
          </div>
        )}
        <div className="text-sm text-muted-foreground mt-1">Total</div>
      </div>

      {/* Vistas */}
      <div className="flex flex-col items-center bg-card rounded-lg py-3 shadow">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        ) : (
          <div className="text-2xl font-bold text-green-600">
            {watched.toLocaleString("es-ES")}
          </div>
        )}
        <div className="text-sm text-muted-foreground mt-1">Vistas</div>
      </div>

      {/* Ver Después */}
      <div className="flex flex-col items-center bg-card rounded-lg py-3 shadow">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        ) : (
          <div className="text-2xl font-bold text-blue-600">
            {watchLater.toLocaleString("es-ES")}
          </div>
        )}
        <div className="text-sm text-muted-foreground mt-1">Ver Después</div>
      </div>
    </div>
  );
}
