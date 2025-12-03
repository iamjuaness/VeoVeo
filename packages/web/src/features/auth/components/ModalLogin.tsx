import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Loader2, LogIn, Mail, Lock, Sparkles } from "lucide-react";
import { login } from "../../movies/services/auth";
import type { User } from "../../../interfaces/User";

interface LoginDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onLogin: (user: User) => void;
  openRegisterModal: () => void;
}

export function ModalLogin({
  open,
  setOpen,
  onLogin,
  openRegisterModal,
}: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await login({ email, password });
      const user = {
        id: result.id,
        name: result.name,
        email: result.email,
        avatar: result.avatar,
      };

      if (user) {
        onLogin(user);
        setOpen(false);
        window.location.reload();
      } else {
        setError("Error al iniciar sesión");
      }
    } catch (error: any) {
      setError(error?.message || "Error al iniciar sesión, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent border-2 border-border hover:bg-accent hover:border-primary transition-all"
        >
          <LogIn className="w-4 h-4" />
          Iniciar Sesión
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Gradient Header */}
        <div className="relative h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
          </div>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-center text-2xl">
              Iniciar Sesión
            </DialogTitle>
            <DialogDescription className="text-center">
              Ingresa tus credenciales para acceder a tu cuenta
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="pl-10 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
              >
                ¿Olvidaste tu contraseña?
              </Button>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm font-semibold hover:text-primary"
                onClick={() => {
                  setOpen(false);
                  openRegisterModal();
                }}
                disabled={isLoading}
              >
                Crear cuenta
              </Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
