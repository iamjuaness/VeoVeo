import { Loader2 } from "lucide-react";

interface Props {
  total: number;
  watched: number;
  watchLater: number;
  loading: boolean;
}
export function Stats({ total, watched, watchLater, loading }: Props) {
  return (
    <div className="flex justify-center gap-6 mb-6">
      <div className="text-center">
        {loading ? (
          <Loader2 className="mx-auto w-6 h-6 animate-spin text-primary" />
        ) : (
          <div className="text-2xl font-bold text-primary">
            {total.toLocaleString("es-ES")}
          </div>
        )}
        <div className="text-sm text-muted-foreground">Total</div>
      </div>

      <div className="text-center">
        {loading ? (
          <Loader2 className="mx-auto w-6 h-6 animate-spin text-green-600" />
        ) : (
          <div className="text-2xl font-bold text-green-600">
            {watched.toLocaleString("es-ES")}
          </div>
        )}
        <div className="text-sm text-muted-foreground">Vistas</div>
      </div>

      <div className="text-center">
        {loading ? (
          <Loader2 className="mx-auto w-6 h-6 animate-spin text-blue-600" />
        ) : (
          <div className="text-2xl font-bold text-blue-600">
            {watchLater.toLocaleString("es-ES")}
          </div>
        )}
        <div className="text-sm text-muted-foreground">Ver Después</div>
      </div>
    </div>
  );
}
