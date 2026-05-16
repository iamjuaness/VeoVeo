import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center bg-card p-8 rounded-xl border shadow-lg animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center">
              <div className="p-3 bg-destructive/10 rounded-full text-destructive">
                <AlertTriangle size={48} />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Vaya, algo salió mal
              </h1>
              <p className="text-muted-foreground">
                La aplicación ha experimentado un error inesperado. Hemos
                registrado el problema para solucionarlo.
              </p>
              {this.state.error && (
                <div className="mt-4 p-3 bg-muted rounded-md text-left text-xs font-mono overflow-auto max-h-32 border">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={this.handleReset}
                className="flex-1 gap-2"
                variant="default"
              >
                <RotateCcw size={16} />
                Reintentar
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex-1 gap-2"
                variant="outline"
              >
                <Home size={16} />
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
