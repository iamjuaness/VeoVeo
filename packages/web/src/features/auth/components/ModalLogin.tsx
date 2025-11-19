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
import { Loader2, LogIn } from "lucide-react";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        alert("Error al iniciar sesión");
      }
    } catch (error) {
      // Manejo de error opcional
      alert("Error al iniciar sesión, intenta de nuevo.");
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
          className="gap-2 bg-transparent border-2 border-gray-600"
        >
          <LogIn className="w-4 h-4" />
          Iniciar Sesión
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar Sesión</DialogTitle>
          <DialogDescription>
            Ingresa tus credenciales para acceder a tu cuenta
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Contraseña</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-between items-center">
            <Button type="button" variant="link" className="p-0 h-auto text-sm">
              ¿Olvidaste tu contraseña?
            </Button>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-sm"
              onClick={() => {
                setOpen(false);
                openRegisterModal();
              }}
              disabled={isLoading}
            >
              Crear cuenta
            </Button>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
