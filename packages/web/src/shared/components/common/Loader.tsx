import { Loader2 } from "lucide-react";

export function FullScreenLoader({
  message = "Cargando, por favor espera...",
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50">
      <Loader2 className="w-16 h-16 text-primary animate-spin" />
      <p className="mt-4 text-white text-lg font-medium">{message}</p>
    </div>
  );
}
